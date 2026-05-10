"use client";

import { useEffect, useRef, useState } from "react";
import { CommitteePanel } from "@/components/CommitteePanel";
import { CalculationExplainer } from "@/components/CalculationExplainer";
import { CommitteeDynamicsPanel } from "@/components/CommitteeDynamicsPanel";
import { CommitteeNetworkMini } from "@/components/CommitteeNetworkMini";
import { ComparisonInsightsPanel } from "@/components/ComparisonInsightsPanel";
import { DecisionAccountabilitySection } from "@/components/DecisionAccountabilitySection";
import { DeliberationDashboard } from "@/components/DeliberationDashboard";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { LiveMetricsStrip } from "@/components/LiveMetricsStrip";
import { LongitudinalEvidencePanel } from "@/components/LongitudinalEvidencePanel";
import { NaivePanel } from "@/components/NaivePanel";
import { AboutDemoDialog } from "@/components/AboutDemoDialog";
import { REPO_ORIGIN } from "@/lib/repoUrls";
import { QuestionInput } from "@/components/QuestionInput";
import { buildCondorcetShift, buildMetacognitionCounts, summarizeEvidenceState } from "@/lib/insights";
import { CHARACTERS } from "@/lib/characters";
import { PRESET_QUESTIONS } from "@/lib/prompts";
import {
  CharacterRoundState,
  CommitteeEvent,
  ConcernRecord,
  DispositionRecord,
  DispositionOutcome,
  EvaluationResult,
  ExecutionMode,
  OverrideRecord,
  RiskSeverity,
  RunSnapshot,
} from "@/lib/types";
import {
  appendRunMemory,
  clearRunMemoryByQuestion,
  createRunSnapshotId,
  listAllRunMemory,
  normalizeQuestionKey,
} from "@/lib/runMemory";
import {
  appendOverride,
  clearDecisionMemoryByQuestion,
  createDecisionRecordId,
  listDecisionMemoryByQuestion,
  upsertConcern,
  upsertDisposition,
} from "@/lib/decisionMemory";

const STARTER_QUESTION = PRESET_QUESTIONS[0].question;

type RunMode = "local" | "api";

interface RunResult {
  naiveOutput: string;
  committeeState: Record<string, CharacterRoundState>;
  naiveEval: EvaluationResult;
  committeeEval: EvaluationResult;
  usedRounds: number;
  initiallyUndetermined: boolean;
  condorcet: ReturnType<typeof buildCondorcetShift>;
  metacognitionTotal: number;
}

interface MajorityDistribution {
  aye: number;
  nay: number;
  undetermined: number;
}

interface VoteSourceSummary {
  declared: number;
  fallback: number;
  total: number;
}

interface TrendPoint {
  runIndex: number;
  committeeAverage: number;
  naiveAverage: number;
  delta: number;
  metacognitionTotal: number;
  majorityAfter: string;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildMajorityDistribution(runs: RunSnapshot[], stage: "before" | "after"): MajorityDistribution {
  const key = stage === "before" ? "majorityBefore" : "majorityAfter";
  return runs.reduce<MajorityDistribution>(
    (acc, run) => {
      const vote = run[key];
      if (vote === "Aye") acc.aye += 1;
      else if (vote === "Nay") acc.nay += 1;
      else acc.undetermined += 1;
      return acc;
    },
    { aye: 0, nay: 0, undetermined: 0 },
  );
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function buildInitialCharacterState(): Record<string, CharacterRoundState> {
  return Object.fromEntries(
    CHARACTERS.map((character) => [
      character.id,
      {
        phase1: "",
        phase2: "",
        streaming: false,
        done: false,
        researchState: "idle",
        researchPacket: null,
      },
    ]),
  );
}

function parseSseChunk(buffer: string): { events: CommitteeEvent[]; remainder: string } {
  const parts = buffer.split("\n\n");
  const complete = parts.slice(0, -1);
  const remainder = parts[parts.length - 1] ?? "";
  const events: CommitteeEvent[] = [];

  for (const rawEvent of complete) {
    const lines = rawEvent.split("\n");
    const dataLine = lines.find((line) => line.startsWith("data: "));
    if (!dataLine) {
      continue;
    }
    try {
      events.push(JSON.parse(dataLine.slice(6)) as CommitteeEvent);
    } catch {
      // ignore malformed chunks
    }
  }

  return { events, remainder };
}

function buildTranscript(states: Record<string, CharacterRoundState>): string {
  return CHARACTERS.map((character) => {
    const state = states[character.id];
    return [
      `${character.name} - Round 1`,
      state.phase1 || "(empty)",
      "",
      `${character.name} - Round 2`,
      state.phase2 || "(empty)",
    ].join("\n");
  }).join("\n\n");
}

function extractConcernCandidates(transcript: string): Array<{ title: string; description: string }> {
  const lines = transcript
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 30);
  const candidates = lines.filter((line) =>
    /(risk|concern|failure|assumption|accountability|override|authority|mitigate)/i.test(line),
  );
  const unique = Array.from(new Set(candidates)).slice(0, 5);
  return unique.map((line, index) => ({
    title: `Concern ${index + 1}`,
    description: line.slice(0, 220),
  }));
}

const UI_SKIN_STORAGE_KEY = "cyberneutics:ui-skin:v1";

type UiSkin = "boring" | "cybercool";

const RUN_MODE_OPTIONS_BORING: ReadonlyArray<{ value: RunMode; label: string; description: string }> = [
  { value: "local", label: "Local", description: "In-process simulator, deterministic" },
  { value: "api", label: "API", description: "Live model calls (OpenAI/Anthropic)" },
];

const RUN_MODE_OPTIONS_CYBERCOOL: ReadonlyArray<{ value: RunMode; label: string; description: string }> = [
  { value: "local", label: "LOCALHOST", description: "Offline sim — deterministic trace, no uplink" },
  { value: "api", label: "WAN UPLINK", description: "Live stack (OpenAI / Anthropic)" },
];

export default function Home() {
  const [question, setQuestion] = useState<string>(STARTER_QUESTION);
  const [isRunning, setIsRunning] = useState(false);
  const [naiveText, setNaiveText] = useState("");
  const [naiveStreaming, setNaiveStreaming] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [characterResponses, setCharacterResponses] =
    useState<Record<string, CharacterRoundState>>(buildInitialCharacterState);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [naiveEvaluation, setNaiveEvaluation] = useState<EvaluationResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presentationMode, setPresentationMode] = useState(true);
  const [deliberationRounds, setDeliberationRounds] = useState(2);
  const [adaptiveDepth, setAdaptiveDepth] = useState(true);
  const [runHistory, setRunHistory] = useState<RunSnapshot[]>(() => listAllRunMemory());
  const [batchRunCount, setBatchRunCount] = useState(3);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [runMode, setRunMode] = useState<RunMode>("local");
  const [activeSource, setActiveSource] = useState<"LOCAL" | "API">("LOCAL");
  const [isLiveGraphMinimized, setIsLiveGraphMinimized] = useState(false);
  const [concerns, setConcerns] = useState<ConcernRecord[]>(() =>
    listDecisionMemoryByQuestion(normalizeQuestionKey(STARTER_QUESTION)).concerns,
  );
  const [dispositions, setDispositions] = useState<DispositionRecord[]>(() =>
    listDecisionMemoryByQuestion(normalizeQuestionKey(STARTER_QUESTION)).dispositions,
  );
  const [overrides, setOverrides] = useState<OverrideRecord[]>(() =>
    listDecisionMemoryByQuestion(normalizeQuestionKey(STARTER_QUESTION)).overrides,
  );
  const [finalizationMessage, setFinalizationMessage] = useState<string | null>(null);
  const [uiSkin, setUiSkin] = useState<UiSkin>(() => {
    if (typeof window === "undefined") return "boring";
    try {
      const raw = window.localStorage.getItem(UI_SKIN_STORAGE_KEY);
      if (raw === "cybercool" || raw === "boring") return raw;
    } catch {
      /* ignore */
    }
    return "boring";
  });
  const liveTranscript = buildTranscript(characterResponses);
  const isCybercool = uiSkin === "cybercool";
  const runModeOptions = isCybercool ? RUN_MODE_OPTIONS_CYBERCOOL : RUN_MODE_OPTIONS_BORING;
  const questionInputRef = useRef<HTMLDivElement | null>(null);
  const committeeRef = useRef<HTMLDivElement | null>(null);
  const evaluationRef = useRef<HTMLDivElement | null>(null);
  const insightsRef = useRef<HTMLDivElement | null>(null);
  const accountabilityRef = useRef<HTMLDivElement | null>(null);
  const skipNextSkinPersist = useRef(true);
  const normalizedQuestionKey = normalizeQuestionKey(question);
  const sameQuestionRuns = runHistory.filter((run) => run.questionKey === normalizedQuestionKey);
  const committeeScores = sameQuestionRuns.map((run) => run.committeeAverage);
  const naiveScores = sameQuestionRuns.map((run) => run.naiveAverage);
  const committeeSpread =
    committeeScores.length > 0 ? Math.max(...committeeScores) - Math.min(...committeeScores) : 0;
  const deltaScores = sameQuestionRuns.map((run) => run.delta);
  const voteShifts = sameQuestionRuns.map((run) => run.inferredVoteShifts);
  const committeeMean = average(committeeScores);
  const naiveMean = average(naiveScores);
  const deltaMean = average(deltaScores);
  const committeeStd = standardDeviation(committeeScores);
  const positiveDeltaRate =
    sameQuestionRuns.length > 0
      ? sameQuestionRuns.filter((run) => run.delta > 0).length / sameQuestionRuns.length
      : 0;
  const majorityStabilityRate =
    sameQuestionRuns.length > 0
      ? sameQuestionRuns.filter((run) => run.majorityBefore === run.majorityAfter).length /
        sameQuestionRuns.length
      : 0;
  const averageVoteShifts = average(voteShifts);
  const liveCondorcet = buildCondorcetShift(characterResponses);
  const liveVoteSourceSummary = liveCondorcet.rows.reduce<VoteSourceSummary>(
    (acc, row) => {
      if (row.beforeSource === "declared") acc.declared += 1;
      else acc.fallback += 1;
      if (row.afterSource === "declared") acc.declared += 1;
      else acc.fallback += 1;
      acc.total += 2;
      return acc;
    },
    { declared: 0, fallback: 0, total: 0 },
  );
  const majorityBeforeDistribution = buildMajorityDistribution(sameQuestionRuns, "before");
  const majorityAfterDistribution = buildMajorityDistribution(sameQuestionRuns, "after");
  const lastRun = sameQuestionRuns[sameQuestionRuns.length - 1] ?? null;
  const trendPoints: TrendPoint[] = sameQuestionRuns.map((run, index) => ({
    runIndex: index + 1,
    committeeAverage: run.committeeAverage,
    naiveAverage: run.naiveAverage,
    delta: run.delta,
    metacognitionTotal: run.metacognitionTotal,
    majorityAfter: run.majorityAfter,
  }));
  const dashboardStatus =
    sameQuestionRuns.length < 2
      ? "Collecting data"
      : deltaMean > 0.4 && committeeStd <= 0.6
        ? "Committee advantage likely"
        : deltaMean <= 0
          ? "No committee advantage yet"
          : "Mixed results";
  const convergenceLabel =
    sameQuestionRuns.length < 2
      ? "Need 2+ runs to assess stability."
      : committeeSpread <= 0.5
        ? "Likely convergent: committee scores cluster tightly."
        : "Likely divergent: committee scores vary across runs.";
  const evidenceSummary = summarizeEvidenceState(normalizedQuestionKey, sameQuestionRuns);
  const dispositionedConcernIds = new Set(dispositions.map((item) => item.concernId));
  const undispositionedConcerns = concerns.filter((concern) => !dispositionedConcernIds.has(concern.id));

  const hasAnyOutput =
    naiveText.length > 0 ||
    naiveStreaming ||
    currentPhase > 0 ||
    isRunning ||
    !!evaluation ||
    !!naiveEvaluation;
  const isDecisionFinalized = hasAnyOutput && !isRunning && undispositionedConcerns.length === 0;
  const showAccountabilityLane =
    hasAnyOutput || concerns.length > 0 || overrides.length > 0;

  const handleQuestionChange = (nextQuestion: string) => {
    setQuestion(nextQuestion);
    const nextMemory = listDecisionMemoryByQuestion(normalizeQuestionKey(nextQuestion));
    setConcerns(nextMemory.concerns);
    setDispositions(nextMemory.dispositions);
    setOverrides(nextMemory.overrides);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (uiSkin === "cybercool") {
      root.classList.add("acid-burn-root");
    } else {
      root.classList.remove("acid-burn-root");
    }
    if (skipNextSkinPersist.current) {
      skipNextSkinPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(UI_SKIN_STORAGE_KEY, uiSkin);
    } catch {
      /* ignore */
    }
  }, [uiSkin]);

  useEffect(() => {
    if (!presentationMode || !isRunning) return;
    if (currentPhase > 0) {
      committeeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentPhase, isRunning, presentationMode]);

  useEffect(() => {
    if (!presentationMode || !isRunning) return;
    if (evaluating) {
      evaluationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [evaluating, isRunning, presentationMode]);

  useEffect(() => {
    if (!presentationMode) return;
    if (!isRunning && evaluation && naiveEvaluation) {
      insightsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isRunning, evaluation, naiveEvaluation, presentationMode]);

  const toExecutionMode = (mode: "local" | "api"): ExecutionMode => mode;

  const runNaive = async (questionToAsk: string, mode: "local" | "api"): Promise<string> => {
    setNaiveText("");
    setNaiveStreaming(true);

    const response = await fetch("/api/naive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questionToAsk, executionMode: toExecutionMode(mode) }),
    });

    if (!response.ok || !response.body) {
      const details = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(details?.error ?? "Naive request failed.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      setNaiveText((prev) => prev + chunk);
    }

    setNaiveStreaming(false);
    return fullText;
  };

  const runCommittee = async (questionToAsk: string, rounds: number, mode: "local" | "api") => {
    setCurrentPhase(0);
    let phaseLocal = 0;
    let localResponses = buildInitialCharacterState();
    if (mode === "local") {
      localResponses = Object.fromEntries(
        Object.entries(localResponses).map(([characterId, state]) => [
          characterId,
          { ...state, researchState: "skipped" as const, researchPacket: null },
        ]),
      );
    }
    setCharacterResponses(localResponses);

    const response = await fetch("/api/committee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questionToAsk, rounds, executionMode: toExecutionMode(mode) }),
    });

    if (!response.ok || !response.body) {
      const details = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(details?.error ?? "Committee request failed.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;

    while (!done) {
      const read = await reader.read();
      done = read.done;
      if (read.value) {
        buffer += decoder.decode(read.value, { stream: true });
      }
      if (done && buffer.length > 0) {
        buffer += "\n\n";
      }

      const parsed = parseSseChunk(buffer);
      buffer = parsed.remainder;

      for (const event of parsed.events) {
        if (event.type === "phase") {
          phaseLocal = event.phase;
          setCurrentPhase(event.phase);
        } else if (event.type === "character_start") {
          localResponses = {
            ...localResponses,
            [event.characterId]: {
              ...localResponses[event.characterId],
              streaming: true,
              done: false,
            },
          };
          setCharacterResponses(localResponses);
        } else if (event.type === "character_chunk") {
          const state = localResponses[event.characterId];
          const target = phaseLocal >= 2 ? "phase2" : "phase1";
          localResponses = {
            ...localResponses,
            [event.characterId]: {
              ...state,
              [target]: state[target] + event.chunk,
            },
          };
          setCharacterResponses(localResponses);
        } else if (event.type === "character_done") {
          localResponses = {
            ...localResponses,
            [event.characterId]: {
              ...localResponses[event.characterId],
              streaming: false,
              done: true,
            },
          };
          setCharacterResponses(localResponses);
        } else if (event.type === "research_start") {
          localResponses = {
            ...localResponses,
            [event.characterId]: {
              ...localResponses[event.characterId],
              researchState: "running",
              researchPacket: null,
            },
          };
          setCharacterResponses(localResponses);
        } else if (event.type === "research_done") {
          localResponses = {
            ...localResponses,
            [event.characterId]: {
              ...localResponses[event.characterId],
              researchState: "ok",
              researchPacket: event.packet,
            },
          };
          setCharacterResponses(localResponses);
        } else if (event.type === "research_error") {
          localResponses = {
            ...localResponses,
            [event.characterId]: {
              ...localResponses[event.characterId],
              researchState: "failed",
              researchPacket: {
                status: "failed",
                provider: "anthropic",
                fetchedAt: new Date().toISOString(),
                error: event.message,
              },
            },
          };
          setCharacterResponses(localResponses);
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    }

    return localResponses;
  };

  const runEvaluation = async (
    questionToAsk: string,
    transcriptText: string,
    mode: "naive" | "committee",
    executionMode: "local" | "api",
  ): Promise<EvaluationResult> => {
    setEvaluating(true);
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: questionToAsk,
        transcript: transcriptText,
        mode,
        executionMode: toExecutionMode(executionMode),
      }),
    });

    if (!response.ok) {
      const details = (await response.json()) as { error?: string };
      throw new Error(details.error ?? "Evaluation request failed.");
    }

    return (await response.json()) as EvaluationResult;
  };

  const executeSingleRun = async (
    questionToAsk: string,
    mode: "local" | "api",
  ): Promise<RunResult> => {
    const naiveOutputPromise = runNaive(questionToAsk, mode);
    let usedRounds = deliberationRounds;
    let committeeState = await runCommittee(questionToAsk, usedRounds, mode);
    let condorcet = buildCondorcetShift(committeeState);
    const initiallyUndetermined = condorcet.majorityAfter === "Undetermined";
    while (adaptiveDepth && condorcet.majorityAfter === "Undetermined" && usedRounds < 6) {
      usedRounds += 1;
      committeeState = await runCommittee(questionToAsk, usedRounds, mode);
      condorcet = buildCondorcetShift(committeeState);
    }
    const naiveOutput = await naiveOutputPromise;
    const finalTranscript = buildTranscript(committeeState);
    const [naiveEval, committeeEval] = await Promise.all([
      runEvaluation(questionToAsk, naiveOutput, "naive", mode),
      runEvaluation(questionToAsk, finalTranscript, "committee", mode),
    ]);
    const metacognitionCounts = buildMetacognitionCounts(committeeState);
    const metacognitionTotal = Object.values(metacognitionCounts).reduce(
      (sum, value) => sum + value,
      0,
    );
    return {
      naiveOutput,
      committeeState,
      naiveEval,
      committeeEval,
      usedRounds,
      initiallyUndetermined,
      condorcet,
      metacognitionTotal,
    };
  };

  const pushRunSnapshot = (
    questionToAsk: string,
    result: RunResult,
    source: "LOCAL" | "API",
  ) => {
    const snapshot: RunSnapshot = {
      id: createRunSnapshotId(),
      question: questionToAsk,
      questionKey: normalizeQuestionKey(questionToAsk),
      timestamp: new Date().toISOString(),
      roundsUsed: result.usedRounds,
      resolvedByExtraRounds:
        adaptiveDepth &&
        result.usedRounds > deliberationRounds &&
        result.initiallyUndetermined &&
        result.condorcet.majorityAfter !== "Undetermined",
      naiveAverage: result.naiveEval.average,
      committeeAverage: result.committeeEval.average,
      delta: result.committeeEval.average - result.naiveEval.average,
      naiveTier: result.naiveEval.tier,
      committeeTier: result.committeeEval.tier,
      inferredVoteShifts: result.condorcet.rows.filter((row) => row.changed).length,
      metacognitionTotal: result.metacognitionTotal,
      majorityBefore: result.condorcet.majorityBefore,
      majorityAfter: result.condorcet.majorityAfter,
      executionSource: source,
    };
    appendRunMemory(snapshot);
    setRunHistory((prev) => [...prev, snapshot]);
  };

  const handleAddConcern = (input: {
    title: string;
    description: string;
    severity: RiskSeverity;
    owner: string;
    evidenceRef: string;
    raisedBy: string;
  }) => {
    const record: ConcernRecord = {
      id: createDecisionRecordId(),
      questionKey: normalizedQuestionKey,
      title: input.title,
      description: input.description,
      severity: input.severity,
      owner: input.owner,
      evidenceRef: input.evidenceRef,
      raisedBy: input.raisedBy,
      raisedAt: new Date().toISOString(),
      status: "raised",
    };
    upsertConcern(record);
    setConcerns((prev) => [...prev, record]);
  };

  const handleUpdateConcern = (concern: ConcernRecord) => {
    upsertConcern(concern);
    setConcerns((prev) => prev.map((item) => (item.id === concern.id ? concern : item)));
  };

  const seedConcernsFromTranscript = (transcript: string) => {
    const candidates = extractConcernCandidates(transcript);
    if (candidates.length === 0) {
      return 0;
    }
    const existingDescriptions = new Set(concerns.map((item) => item.description));
    const seeded: ConcernRecord[] = [];
    for (const candidate of candidates) {
      if (existingDescriptions.has(candidate.description)) continue;
      const record: ConcernRecord = {
        id: createDecisionRecordId(),
        questionKey: normalizedQuestionKey,
        title: candidate.title,
        description: candidate.description,
        severity: "medium",
        owner: "",
        evidenceRef: "committee transcript",
        raisedBy: "committee",
        raisedAt: new Date().toISOString(),
        status: "raised",
      };
      upsertConcern(record);
      seeded.push(record);
    }
    if (seeded.length > 0) {
      setConcerns((prev) => [...prev, ...seeded]);
    }
    return seeded.length;
  };

  const handleSeedConcernsFromTranscript = () => {
    const seededCount = seedConcernsFromTranscript(buildTranscript(characterResponses));
    if (seededCount === 0) {
      setFinalizationMessage("No new concern candidates found in transcript. Add concerns manually.");
      return;
    }
    setFinalizationMessage(`Seeded ${seededCount} concern(s) from transcript.`);
  };

  const handleDispositionComplete = (payload: {
    concernId: string;
    outcome: DispositionOutcome;
    rationale: string;
    decidedBy: string;
    mitigationActions: string;
    mitigationOwner: string;
    mitigationDueDate: string | null;
    overrideAuthority: string;
    residualRisk: string;
    reviewDate: string | null;
  }) => {
    const decidedAt = new Date().toISOString();
    const disposition: DispositionRecord = {
      id: createDecisionRecordId(),
      concernId: payload.concernId,
      questionKey: normalizedQuestionKey,
      outcome: payload.outcome,
      status: "completed",
      rationale: payload.rationale,
      decidedBy: payload.decidedBy,
      decidedAt,
      mitigationActions: payload.mitigationActions,
      mitigationOwner: payload.mitigationOwner,
      mitigationDueDate: payload.mitigationDueDate,
    };
    upsertDisposition(disposition);
    setDispositions((prev) => [
      ...prev.filter((item) => item.concernId !== payload.concernId),
      disposition,
    ]);
    const concern = concerns.find((item) => item.id === payload.concernId);
    if (concern) {
      const updatedConcern: ConcernRecord = {
        ...concern,
        status: "closed",
      };
      upsertConcern(updatedConcern);
      setConcerns((prev) => prev.map((item) => (item.id === concern.id ? updatedConcern : item)));
    }
    if (payload.outcome === "override") {
      const override: OverrideRecord = {
        id: createDecisionRecordId(),
        concernId: payload.concernId,
        questionKey: normalizedQuestionKey,
        approvedBy: payload.overrideAuthority || payload.decidedBy,
        approvedAt: decidedAt,
        rationale: payload.rationale,
        residualRisk: payload.residualRisk,
        reviewDate: payload.reviewDate,
      };
      appendOverride(override);
      setOverrides((prev) => [...prev, override]);
    }
  };

  const handleRun = async () => {
    if (!question.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);
    setEvaluation(null);
    setNaiveEvaluation(null);
    setBatchProgress(null);
    setFinalizationMessage(null);
    try {
      const mode = runMode;
      const result = await executeSingleRun(question.trim(), mode);
      setCharacterResponses(result.committeeState);
      setNaiveText(result.naiveOutput);
      setNaiveEvaluation(result.naiveEval);
      setEvaluation(result.committeeEval);
      setCurrentPhase(result.usedRounds);
      const source = mode === "local" ? "LOCAL" : "API";
      setActiveSource(source);
      pushRunSnapshot(question.trim(), result, source);
      const seededCount = seedConcernsFromTranscript(buildTranscript(result.committeeState));
      if (seededCount > 0) {
        setFinalizationMessage(
          `Run completed with ${seededCount} new concern(s). Finalization requires dispositions.`,
        );
      } else {
        setFinalizationMessage("Run completed. Add concerns or confirm no concerns were identified.");
      }
    } catch (runError) {
      setError((runError as Error).message ?? "Demo run failed.");
    } finally {
      setNaiveStreaming(false);
      setEvaluating(false);
      setIsRunning(false);
    }
  };

  const handleBatchRun = async () => {
    if (!question.trim() || isRunning) return;
    const total = Math.max(2, Math.min(10, batchRunCount));
    setIsRunning(true);
    setError(null);
    setEvaluation(null);
    setNaiveEvaluation(null);
    setFinalizationMessage(null);
    try {
      for (let i = 0; i < total; i += 1) {
        setBatchProgress({ current: i + 1, total });
        const mode = runMode;
        const result = await executeSingleRun(question.trim(), mode);
        setCharacterResponses(result.committeeState);
        setNaiveText(result.naiveOutput);
        setNaiveEvaluation(result.naiveEval);
        setEvaluation(result.committeeEval);
        setCurrentPhase(result.usedRounds);
        const source = mode === "local" ? "LOCAL" : "API";
        setActiveSource(source);
        pushRunSnapshot(question.trim(), result, source);
        seedConcernsFromTranscript(buildTranscript(result.committeeState));
      }
      setFinalizationMessage("Batch completed. Finalization requires dispositions for all concerns.");
    } catch (runError) {
      setError((runError as Error).message ?? "Batch run failed.");
    } finally {
      setBatchProgress(null);
      setNaiveStreaming(false);
      setEvaluating(false);
      setIsRunning(false);
    }
  };

  const handleClearCurrentQuestionRuns = () => {
    setRunHistory((prev) => {
      clearRunMemoryByQuestion(normalizedQuestionKey);
      return prev.filter((run) => run.questionKey !== normalizedQuestionKey);
    });
    clearDecisionMemoryByQuestion(normalizedQuestionKey);
    setConcerns([]);
    setDispositions([]);
    setOverrides([]);
    setFinalizationMessage(null);
  };

  const phaseLabel =
    currentPhase === 0
      ? "Waiting to begin"
      : currentPhase === 1
        ? "Phase 1: Individual responses"
        : currentPhase === 2
          ? "Phase 2: Cross-examination"
          : `Phase ${currentPhase}: Additional deliberation`;

  const scrollToQuestionInput = () => {
    questionInputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToEvaluation = () => {
    evaluationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToInsights = () => {
    insightsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToAccountability = () => {
    accountabilityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main
      className={`mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-5 p-6 ${
        presentationMode ? "text-[17px]" : ""
      }`}
    >
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {isCybercool ? (
              <>
                <p className="hackers-prompt text-[11px] font-semibold uppercase tracking-[0.22em]">
                  &gt; CYBERNEUTICS // SCRIBE_NODE
                </p>
                <h1 className="acid-burn-display mt-2 text-lg md:text-xl">
                  One answer vs decision-space map
                </h1>
                <p className="mt-2 font-mono text-[11px] tracking-wide text-slate-500">
                  {
                    "// trace: mono-voice vs hostile multiprocessing — same prompt, different architecture"
                  }
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cyberneutics Demo</p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900 md:text-2xl">
                  One Answer vs Decision-Space Map
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Same prompt: single-call output vs adversarial committee, scored independently.
                </p>
              </>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div
              role="radiogroup"
              aria-label="Interface style"
              className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-xs"
            >
              <button
                type="button"
                role="radio"
                aria-checked={uiSkin === "boring"}
                onClick={() => setUiSkin("boring")}
                className={`rounded-md px-3 py-1.5 font-semibold transition ${
                  uiSkin === "boring"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Boring mode
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={uiSkin === "cybercool"}
                onClick={() => setUiSkin("cybercool")}
                className={`rounded-md px-3 py-1.5 font-semibold transition ${
                  uiSkin === "cybercool"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cybercool mode
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <AboutDemoDialog />
              <button
                type="button"
                onClick={() => setPresentationMode((prev) => !prev)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 transition hover:border-sky-500"
              >
                {presentationMode ? "Presentation: ON" : "Presentation: OFF"}
              </button>
              <a
                href={REPO_ORIGIN}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 underline-offset-2 transition hover:border-sky-500 hover:text-sky-700 hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Run mode
          </div>
          <div
            role="radiogroup"
            aria-label="Execution mode"
            className="inline-flex w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-100 p-1 md:w-auto"
          >
            {runModeOptions.map((option) => {
              const active = runMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRunMode(option.value)}
                  disabled={isRunning}
                  className={`flex-1 rounded-lg px-5 py-2.5 text-left transition md:min-w-[260px] ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-transparent text-slate-700 hover:bg-white"
                  } ${isRunning ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <div className="text-sm font-semibold">{option.label}</div>
                  <div className={`text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>
                    {option.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div ref={questionInputRef}>
            <QuestionInput
              question={question}
              onQuestionChange={handleQuestionChange}
              onRun={handleRun}
              deliberationRounds={deliberationRounds}
              onDeliberationRoundsChange={(next) => setDeliberationRounds(Math.max(2, Math.min(6, next)))}
              adaptiveDepth={adaptiveDepth}
              onAdaptiveDepthChange={setAdaptiveDepth}
              presets={PRESET_QUESTIONS}
              disabled={isRunning}
              presentationMode={presentationMode}
              batchRunCount={batchRunCount}
              onBatchRunCountChange={(next) => setBatchRunCount(Math.max(2, Math.min(10, next)))}
              onBatchRun={handleBatchRun}
              onClearCurrentQuestionRuns={handleClearCurrentQuestionRuns}
              batchProgress={batchProgress}
              sameQuestionRunsCount={sameQuestionRuns.length}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {hasAnyOutput ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-slate-700">
                  {activeSource}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                  {phaseLabel}
                </span>
                {batchProgress ? (
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-800">
                    Batch {batchProgress.current}/{batchProgress.total}
                  </span>
                ) : null}
                {isRunning ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
                    Running...
                  </span>
                ) : null}
                {!isRunning ? (
                  <span
                    className={`rounded-full border px-2 py-0.5 ${
                      isDecisionFinalized
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-rose-200 bg-rose-50 text-rose-800"
                    }`}
                  >
                    {isDecisionFinalized
                      ? "Decision finalization ready"
                      : `Disposition required (${undispositionedConcerns.length})`}
                  </span>
                ) : null}
              </div>
              <LiveMetricsStrip
                characterResponses={characterResponses}
                evaluation={evaluation}
                evaluating={evaluating}
                historyCommitteeMean={sameQuestionRuns.length > 0 ? committeeMean : null}
              />
              <CalculationExplainer
                activeSource={activeSource}
                currentPhase={currentPhase}
                configuredRounds={deliberationRounds}
                adaptiveDepth={adaptiveDepth}
                characterResponses={characterResponses}
                evaluation={evaluation}
                evaluating={evaluating}
                historyCommitteeMean={sameQuestionRuns.length > 0 ? committeeMean : null}
                concernsCount={concerns.length}
                undispositionedCount={undispositionedConcerns.length}
                dispositionedCount={dispositionedConcernIds.size}
              />
            </div>
          ) : null}

          {finalizationMessage ? (
            <div
              className={`rounded-md border border-sky-200 bg-sky-50 text-sky-900 ${
                presentationMode ? "p-2 text-xs leading-relaxed" : "p-3 text-sm"
              }`}
            >
              {finalizationMessage}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
            <NaivePanel
              text={naiveText}
              streaming={naiveStreaming}
              sourceLabel={activeSource}
              presentationMode={presentationMode}
            />
            <div ref={committeeRef}>
              <CommitteePanel
                currentPhase={currentPhase}
                characterResponses={characterResponses}
                sourceLabel={activeSource}
                presentationMode={presentationMode}
              />
            </div>
          </div>

          <div ref={evaluationRef} className="grid gap-4 xl:grid-cols-2">
            <EvaluationPanel
              evaluation={naiveEvaluation}
              evaluating={evaluating}
              title="NAIVE EVALUATION (independent model)"
              sourceLabel={activeSource}
              presentationMode={presentationMode}
            />
            <EvaluationPanel
              evaluation={evaluation}
              evaluating={evaluating}
              title="COMMITTEE EVALUATION (independent model)"
              sourceLabel={activeSource}
              presentationMode={presentationMode}
            />
          </div>

          <DeliberationDashboard
            question={question}
            runCount={sameQuestionRuns.length}
            dashboardStatus={dashboardStatus}
            convergenceLabel={convergenceLabel}
            committeeMean={committeeMean}
            naiveMean={naiveMean}
            deltaMean={deltaMean}
            positiveDeltaRate={positiveDeltaRate}
            averageVoteShifts={averageVoteShifts}
            majorityStabilityRate={majorityStabilityRate}
            voteSourceSummary={liveVoteSourceSummary}
            majorityBeforeDistribution={majorityBeforeDistribution}
            majorityAfterDistribution={majorityAfterDistribution}
            trendPoints={trendPoints}
            committeeKeyFinding={evaluation?.key_finding}
            naiveKeyFinding={naiveEvaluation?.key_finding}
            lastRun={
              lastRun
                ? {
                    roundsUsed: lastRun.roundsUsed,
                    resolvedByExtraRounds: lastRun.resolvedByExtraRounds,
                    majorityBefore: lastRun.majorityBefore,
                    majorityAfter: lastRun.majorityAfter,
                    delta: lastRun.delta,
                    committeeTier: lastRun.committeeTier,
                    naiveTier: lastRun.naiveTier,
                  }
                : null
            }
          />

          {showAccountabilityLane ? (
            <div ref={accountabilityRef}>
              <DecisionAccountabilitySection
                presentationMode={presentationMode}
                isDecisionFinalized={isDecisionFinalized}
                undispositionedCount={undispositionedConcerns.length}
                concerns={concerns}
                dispositions={dispositions}
                overrides={overrides}
                onAddConcern={handleAddConcern}
                onUpdateConcern={handleUpdateConcern}
                onSeedFromTranscript={handleSeedConcernsFromTranscript}
                onDispositionComplete={handleDispositionComplete}
              />
            </div>
          ) : null}

          <div ref={insightsRef}>
            <ComparisonInsightsPanel
              naiveEvaluation={naiveEvaluation}
              committeeEvaluation={evaluation}
              characterResponses={characterResponses}
              presentationMode={presentationMode}
            />
          </div>

          <LongitudinalEvidencePanel summary={evidenceSummary} />

          <CommitteeDynamicsPanel characterResponses={characterResponses} />

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 border-b border-slate-200 pb-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            About this comparison
          </div>
          <p className="mt-1 text-sm text-slate-700">
            Background on what the demo measures and why some prompts converge while others diverge.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">What this demonstrates</h3>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-900">Same input, different architectures</h4>
                <p className="mt-1 text-sm text-slate-700">
                  The exact same question is sent to two systems: a single-call model and an
                  adversarial committee. The comparison isolates architecture as the variable.
                </p>
              </article>
              <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-900">Metacognition is externalized</h4>
                <p className="mt-1 text-sm text-slate-700">
                  The committee role set forces challenge, counterargument, and evidence standards.
                  Hidden assumptions and trade-offs become explicit in the transcript.
                </p>
              </article>
              <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-900">Quality is measured independently</h4>
                <p className="mt-1 text-sm text-slate-700">
                  Both outputs are scored by an independent evaluator using the same rubric, so
                  rubric deltas show whether architecture improves decision quality.
                </p>
              </article>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Convergence vs divergence test</h3>
            <p className="mt-1 text-sm text-slate-700">
              Use the preset prompts from repo comparisons. The CI-job prompt is expected to
              converge (same verdict across pipelines). The Code-of-Conduct prompt is expected to
              diverge (deliberation can flip the majority after enforcement-risk stress-testing).
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-900">Convergent prompt profile</h4>
                <p className="mt-1 text-sm text-slate-700">
                  Operational/timing questions with shared constraints often keep the same verdict,
                  while deliberation improves rationale quality and adds revisit conditions.
                </p>
              </article>
              <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-900">Divergent prompt profile</h4>
                <p className="mt-1 text-sm text-slate-700">
                  Value-laden governance questions can shift after challenge-response exposes
                  unpriced risks, changing votes and occasionally the final majority.
                </p>
              </article>
            </div>
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-sm font-semibold text-slate-900">How to measure quality and stability</h4>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                <li>
                  Accuracy proxy: independent evaluator average and tier (`committee - naive` delta).
                </li>
                <li>Condorcet lens: inferred vote shifts and majority before/after cross-examination.</li>
                <li>Stability: run the same prompt multiple times and inspect score spread.</li>
              </ul>
            </div>
          </div>
        </div>
          </section>

          <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">
              Show raw call outputs
            </summary>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-800">Naive Output</div>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-700">
                  {naiveText || "(no output yet)"}
                </pre>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-800">Committee Output</div>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-700">
                  {liveTranscript || "(no output yet)"}
                </pre>
              </div>
            </div>
          </details>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-700">
                Want to try another question or preset?
              </div>
              <button
                type="button"
                onClick={scrollToQuestionInput}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Run another prompt
              </button>
            </div>
          </section>

        </div>

        <aside
          className="pointer-events-auto fixed bottom-4 right-4 z-50 w-1/3 min-w-[200px] lg:static lg:w-auto lg:min-w-0 lg:max-w-none lg:self-start lg:sticky lg:top-6"
          aria-live="polite"
          role="complementary"
        >
          <div className="space-y-2 drop-shadow-xl lg:drop-shadow-none">
            {!isLiveGraphMinimized ? (
              <CommitteeNetworkMini characterResponses={characterResponses} />
            ) : (
              <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Live Interaction
                </div>
                <div className="mt-1 text-xs text-slate-600">Graph minimized.</div>
              </section>
            )}
            <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Quick actions
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setIsLiveGraphMinimized((prev) => !prev)}
                  className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
                >
                  {isLiveGraphMinimized ? "Expand graph" : "Minimize graph"}
                </button>
                <button
                  type="button"
                  onClick={scrollToQuestionInput}
                  className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
                >
                  Run another prompt
                </button>
                <button
                  type="button"
                  onClick={scrollToEvaluation}
                  className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
                >
                  Jump to evaluation
                </button>
                <button
                  type="button"
                  onClick={scrollToInsights}
                  className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
                >
                  Jump to insights
                </button>
                {showAccountabilityLane ? (
                  <button
                    type="button"
                    onClick={scrollToAccountability}
                    className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
                  >
                    Accountability
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer
        className={
          isCybercool
            ? "pb-4 font-mono text-xs text-slate-500"
            : "pb-4 text-xs text-slate-500"
        }
      >
        {isCybercool ? (
          <>[EOF] Decision quality comes from architecture, not prompt cleverness.</>
        ) : (
          <>Decision quality comes from architecture, not prompt cleverness.</>
        )}
      </footer>
    </main>
  );
}
