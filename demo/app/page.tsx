"use client";

import { useEffect, useRef, useState } from "react";
import { CommitteeLiveFeed } from "@/components/CommitteeLiveFeed";
import { CommitteePanel } from "@/components/CommitteePanel";
import { CalculationExplainer } from "@/components/CalculationExplainer";
import { CommitteeDynamicsPanel } from "@/components/CommitteeDynamicsPanel";
import { DeliberationAnatomyCanvas } from "@/components/DeliberationAnatomyCanvas";
import { EvidenceRibbonPanel } from "@/components/EvidenceRibbonPanel";
import { ComparisonInsightsPanel } from "@/components/ComparisonInsightsPanel";
import { DecisionAccountabilitySection } from "@/components/DecisionAccountabilitySection";
import { DeliberationDashboard } from "@/components/DeliberationDashboard";
import { LiveRunCommandCenter } from "@/components/LiveRunCommandCenter";
import { RunOutcomeLogPanel } from "@/components/RunOutcomeLogPanel";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { ObservabilityDock } from "@/components/ObservabilityDock";
import { LongitudinalEvidencePanel } from "@/components/LongitudinalEvidencePanel";
import { NaivePanel } from "@/components/NaivePanel";
import { AboutDemoDialog } from "@/components/AboutDemoDialog";
import { REPO_ORIGIN } from "@/lib/repoUrls";
import { HeroPromptLibrary } from "@/components/HeroPromptLibrary";
import { buildCondorcetShift, buildMetacognitionCounts, summarizeEvidenceState } from "@/lib/insights";
import { CHARACTERS } from "@/lib/characters";
import { PRESET_QUESTIONS, SELF_IMPROVEMENT_QUESTION } from "@/lib/prompts";
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
  RunKind,
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
  inferredVoteShifts: number;
  majorityAfter: string;
  executionSource: RunSnapshot["executionSource"];
}

interface MagicRunProgress {
  attempt: number;
  maxAttempts: number;
  lastMajority: string;
}

type MagicRunGuidanceTone = "collecting" | "continue" | "caution" | "stop" | "resolved";

interface MagicRunGuidance {
  label: string;
  detail: string;
  recommendation: string;
  meterPercent: number;
  tone: MagicRunGuidanceTone;
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

const STORED_OUTPUT_EXCERPT_MAX = 1200;

function excerptForStorage(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
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
const MAX_SELF_IMPROVEMENT_ROUNDS = 5;
const MAX_MAGIC_RUN_ATTEMPTS = 25;

type UiSkin = "boring" | "cybercool";

const RUN_MODE_OPTIONS_BORING: ReadonlyArray<{ value: RunMode; label: string; description: string }> = [
  { value: "local", label: "Local", description: "In-process simulator, deterministic" },
  { value: "api", label: "API", description: "Live Claude calls (Anthropic)" },
];

const RUN_MODE_OPTIONS_CYBERCOOL: ReadonlyArray<{ value: RunMode; label: string; description: string }> = [
  { value: "local", label: "LOCALHOST", description: "Offline sim — deterministic trace, no uplink" },
  { value: "api", label: "API LIVE", description: "Live Claude stack (Anthropic)" },
];

const MAGIC_GUIDANCE_TONE_CLASS: Record<MagicRunGuidanceTone, string> = {
  collecting: "border-sky-200 bg-sky-50 text-sky-900",
  continue: "border-emerald-200 bg-emerald-50 text-emerald-900",
  caution: "border-amber-200 bg-amber-50 text-amber-900",
  stop: "border-rose-200 bg-rose-50 text-rose-900",
  resolved: "border-emerald-300 bg-emerald-50 text-emerald-950",
};

const MAGIC_GUIDANCE_METER_CLASS: Record<MagicRunGuidanceTone, string> = {
  collecting: "bg-sky-500",
  continue: "bg-emerald-500",
  caution: "bg-amber-500",
  stop: "bg-rose-500",
  resolved: "bg-emerald-600",
};

function buildMagicRunGuidance(
  attemptRuns: RunSnapshot[],
  progress: MagicRunProgress | null,
): MagicRunGuidance {
  if (!progress) {
    return {
      label: "Waiting",
      detail: "The resolution loop has not started.",
      recommendation: "Choose a run mode and start when ready.",
      meterPercent: 0,
      tone: "collecting",
    };
  }

  const completedAttempts = attemptRuns.length;
  const latestMajority = progress.lastMajority;
  if (latestMajority !== "Undetermined") {
    return {
      label: `Resolved: ${latestMajority}`,
      detail: "A clear majority appeared in the latest completed attempt.",
      recommendation: "Stop condition met. Inspect the transcript before spending on more live runs.",
      meterPercent: 100,
      tone: "resolved",
    };
  }

  if (completedAttempts === 0) {
    return {
      label: "Collecting first attempt",
      detail: "The current attempt is still running, so there is not enough evidence to read a trend yet.",
      recommendation: "Let this attempt finish, then decide whether another full stack is worth it.",
      meterPercent: 12,
      tone: "collecting",
    };
  }

  const committeeScores = attemptRuns.map((run) => run.committeeAverage);
  const committeeSpread = Math.max(...committeeScores) - Math.min(...committeeScores);
  const recentRuns = attemptRuns.slice(-Math.min(3, completedAttempts));
  const recentAllUndetermined = recentRuns.every((run) => run.majorityAfter === "Undetermined");

  if (completedAttempts < 2) {
    return {
      label: "Still unresolved",
      detail: "One completed attempt did not produce a clear majority.",
      recommendation: "Continue only if a second full attempt is worth the extra signal.",
      meterPercent: 28,
      tone: "caution",
    };
  }

  if (recentAllUndetermined && completedAttempts >= 4 && committeeSpread <= 0.5) {
    return {
      label: "Converging on no majority",
      detail: `The last ${recentRuns.length} attempts stayed undetermined while committee scores clustered tightly.`,
      recommendation: "Consider stopping: the loop is rediscovering a stable unresolved state.",
      meterPercent: 74,
      tone: "caution",
    };
  }

  if (recentAllUndetermined && completedAttempts >= 3) {
    return {
      label: "Diverging or stalled",
      detail: `The last ${recentRuns.length} attempts remained undetermined and scores are not yet stable.`,
      recommendation: "Pause if budget matters. Rewrite the prompt or inspect the run history before continuing.",
      meterPercent: 42,
      tone: "stop",
    };
  }

  if (committeeSpread <= 0.5) {
    return {
      label: "Converging",
      detail: "Committee scores are clustering, but the vote has not produced a clear majority yet.",
      recommendation: "One more attempt may be reasonable if resolving the majority is worth the spend.",
      meterPercent: 66,
      tone: "continue",
    };
  }

  return {
    label: "Diverging",
    detail: "Recent attempts vary enough that the loop is exploring rather than settling.",
    recommendation: "Prefer stopping, reviewing the traces, or running a smaller targeted batch.",
    meterPercent: 36,
    tone: "stop",
  };
}

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
  const [runHistory, setRunHistory] = useState<RunSnapshot[]>([]);
  const [batchRunCount, setBatchRunCount] = useState(3);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [runMode, setRunMode] = useState<RunMode>("local");
  const [activeSource, setActiveSource] = useState<"LOCAL" | "API">("LOCAL");
  const [isLiveGraphMinimized, setIsLiveGraphMinimized] = useState(false);
  const [concerns, setConcerns] = useState<ConcernRecord[]>([]);
  const [dispositions, setDispositions] = useState<DispositionRecord[]>([]);
  const [overrides, setOverrides] = useState<OverrideRecord[]>([]);
  const [finalizationMessage, setFinalizationMessage] = useState<string | null>(null);
  const [selfImprovementProgress, setSelfImprovementProgress] = useState<{
    round: number;
    total: number;
    concernsThisRound: number;
    cumulativeImprovements: string[];
  } | null>(null);
  const [magicRunProgress, setMagicRunProgress] = useState<MagicRunProgress | null>(null);
  const [magicRunStopRequested, setMagicRunStopRequested] = useState(false);
  const [magicRunStartIndex, setMagicRunStartIndex] = useState<number | null>(null);
  const [magicRunExecutionMode, setMagicRunExecutionMode] = useState<RunMode | null>(null);
  const [uiSkin, setUiSkin] = useState<UiSkin>("boring");
  const liveTranscript = buildTranscript(characterResponses);
  const isSelfImprovementPrompt =
    normalizeQuestionKey(question) === normalizeQuestionKey(SELF_IMPROVEMENT_QUESTION);
  const isCybercool = uiSkin === "cybercool";
  const runModeOptions = isCybercool ? RUN_MODE_OPTIONS_CYBERCOOL : RUN_MODE_OPTIONS_BORING;
  const questionInputRef = useRef<HTMLDivElement | null>(null);
  const commandCenterRef = useRef<HTMLDivElement | null>(null);
  const committeeRef = useRef<HTMLDivElement | null>(null);
  const evaluationRef = useRef<HTMLDivElement | null>(null);
  const insightsRef = useRef<HTMLDetailsElement | null>(null);
  const accountabilityRef = useRef<HTMLDetailsElement | null>(null);
  const skipNextSkinPersist = useRef(true);
  const stopMagicRunRequestedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRunHistory(listAllRunMemory());
      const mem = listDecisionMemoryByQuestion(normalizeQuestionKey(STARTER_QUESTION));
      setConcerns(mem.concerns);
      setDispositions(mem.dispositions);
      setOverrides(mem.overrides);
      try {
        const raw = window.localStorage.getItem(UI_SKIN_STORAGE_KEY);
        if (raw === "cybercool" || raw === "boring") {
          setUiSkin(raw);
        }
      } catch {
        /* ignore */
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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
  const magicRunAttempts =
    magicRunProgress && magicRunStartIndex !== null ? sameQuestionRuns.slice(magicRunStartIndex) : [];
  const magicRunGuidance = buildMagicRunGuidance(magicRunAttempts, magicRunProgress);
  const trendPoints: TrendPoint[] = sameQuestionRuns.map((run, index) => ({
    runIndex: index + 1,
    committeeAverage: run.committeeAverage,
    naiveAverage: run.naiveAverage,
    delta: run.delta,
    metacognitionTotal: run.metacognitionTotal,
    inferredVoteShifts: run.inferredVoteShifts,
    majorityAfter: run.majorityAfter,
    executionSource: run.executionSource,
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
  const isLikelyConvergentCrossRun =
    sameQuestionRuns.length >= 2 && committeeSpread <= 0.5;
  const majorityInstabilityFraming =
    isLikelyConvergentCrossRun && majorityStabilityRate === 0;
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
    commandCenterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isRunning, presentationMode]);

  useEffect(() => {
    if (!presentationMode || !isRunning) return;
    if (currentPhase > 0) {
      commandCenterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentPhase, isRunning, presentationMode]);

  useEffect(() => {
    if (!presentationMode || !isRunning) return;
    if (evaluating) {
      evaluationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [evaluating, isRunning, presentationMode]);

  useEffect(() => {
    if (!isRunning && evaluation && naiveEvaluation) {
      evaluationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isRunning, evaluation, naiveEvaluation]);

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
    batch: { index: number; total: number } | null,
    runKind: RunKind = "single",
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
      runKind,
      deliberationRoundsConfigured: deliberationRounds,
      adaptiveDepth,
      naiveKeyFinding: result.naiveEval.key_finding,
      committeeKeyFinding: result.committeeEval.key_finding,
      naiveOutputExcerpt: excerptForStorage(result.naiveOutput, STORED_OUTPUT_EXCERPT_MAX),
      committeeTranscriptExcerpt: excerptForStorage(
        buildTranscript(result.committeeState),
        STORED_OUTPUT_EXCERPT_MAX,
      ),
      batchIndex: batch?.index ?? null,
      batchTotal: batch?.total ?? null,
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
      const source = mode === "local" ? "LOCAL" : "API";
      setActiveSource(source);
      const result = await executeSingleRun(question.trim(), mode);
      setCharacterResponses(result.committeeState);
      setNaiveText(result.naiveOutput);
      setNaiveEvaluation(result.naiveEval);
      setEvaluation(result.committeeEval);
      setCurrentPhase(result.usedRounds);
      pushRunSnapshot(question.trim(), result, source, null);
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
      const mode = runMode;
      const source = mode === "local" ? "LOCAL" : "API";
      setActiveSource(source);
      for (let i = 0; i < total; i += 1) {
        setBatchProgress({ current: i + 1, total });
        const result = await executeSingleRun(question.trim(), mode);
        setCharacterResponses(result.committeeState);
        setNaiveText(result.naiveOutput);
        setNaiveEvaluation(result.naiveEval);
        setEvaluation(result.committeeEval);
        setCurrentPhase(result.usedRounds);
        pushRunSnapshot(question.trim(), result, source, { index: i + 1, total }, "batch");
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

  const handleSelfImprovementRun = async () => {
    if (!question.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);
    setEvaluation(null);
    setNaiveEvaluation(null);
    setBatchProgress(null);
    setFinalizationMessage(null);

    const cumulativeImprovements: string[] = [];
    let latestConcernsList: ConcernRecord[] = [...concerns];
    let latestDispositionsList: DispositionRecord[] = [...dispositions];

    try {
      for (let round = 1; round <= MAX_SELF_IMPROVEMENT_ROUNDS; round += 1) {
        setSelfImprovementProgress({
          round,
          total: MAX_SELF_IMPROVEMENT_ROUNDS,
          concernsThisRound: 0,
          cumulativeImprovements: [...cumulativeImprovements],
        });

        const augmentedQuestion =
          round === 1
            ? question.trim()
            : `${question.trim()}\n\n--- Improvements accepted in prior rounds (${round - 1} of ${MAX_SELF_IMPROVEMENT_ROUNDS}) ---\n${cumulativeImprovements.map((item, idx) => `${idx + 1}. ${item}`).join("\n")}\n\nGiven these accepted changes, what further structural weaknesses remain? Focus on issues NOT already addressed above.`;

        const mode = runMode;
        const source = mode === "local" ? "LOCAL" : "API";
        setActiveSource(source);
        const result = await executeSingleRun(augmentedQuestion, mode);

        setCharacterResponses(result.committeeState);
        setNaiveText(result.naiveOutput);
        setNaiveEvaluation(result.naiveEval);
        setEvaluation(result.committeeEval);
        setCurrentPhase(result.usedRounds);
        pushRunSnapshot(
          question.trim(),
          result,
          source,
          {
            index: round,
            total: MAX_SELF_IMPROVEMENT_ROUNDS,
          },
          "self_improvement",
        );

        const transcript = buildTranscript(result.committeeState);
        const candidates = extractConcernCandidates(transcript);
        const existingDescs = new Set(latestConcernsList.map((c) => c.description));
        const newConcerns: ConcernRecord[] = [];
        for (const candidate of candidates) {
          if (existingDescs.has(candidate.description)) continue;
          const record: ConcernRecord = {
            id: createDecisionRecordId(),
            questionKey: normalizedQuestionKey,
            title: `R${round}: ${candidate.title}`,
            description: candidate.description,
            severity: "medium",
            owner: "",
            evidenceRef: `self-improvement round ${round}`,
            raisedBy: "committee",
            raisedAt: new Date().toISOString(),
            status: "raised",
          };
          upsertConcern(record);
          newConcerns.push(record);
        }
        if (newConcerns.length > 0) {
          latestConcernsList = [...latestConcernsList, ...newConcerns];
          setConcerns(latestConcernsList);
        }

        setSelfImprovementProgress({
          round,
          total: MAX_SELF_IMPROVEMENT_ROUNDS,
          concernsThisRound: newConcerns.length,
          cumulativeImprovements: [...cumulativeImprovements],
        });

        if (newConcerns.length === 0 && round > 1) {
          setFinalizationMessage(
            `Self-improvement converged at round ${round} — no new concerns found. ${cumulativeImprovements.length} improvements accepted across ${round - 1} round(s).`,
          );
          break;
        }

        const pendingConcerns = latestConcernsList.filter(
          (c) => !latestDispositionsList.some((d) => d.concernId === c.id),
        );
        for (const concern of pendingConcerns) {
          const disposition: DispositionRecord = {
            id: createDecisionRecordId(),
            concernId: concern.id,
            questionKey: normalizedQuestionKey,
            outcome: "accept",
            status: "completed",
            rationale: `Auto-accepted during self-improvement round ${round}: ${concern.description.slice(0, 120)}`,
            decidedBy: "self-improvement-loop",
            decidedAt: new Date().toISOString(),
            mitigationActions: "",
            mitigationOwner: "",
            mitigationDueDate: null,
          };
          upsertDisposition(disposition);
          latestDispositionsList = [
            ...latestDispositionsList.filter((d) => d.concernId !== concern.id),
            disposition,
          ];
          cumulativeImprovements.push(concern.description.slice(0, 200));

          const updated: ConcernRecord = { ...concern, status: "closed" };
          upsertConcern(updated);
          latestConcernsList = latestConcernsList.map((c) =>
            c.id === concern.id ? updated : c,
          );
        }
        setConcerns(latestConcernsList);
        setDispositions(latestDispositionsList);

        if (round === MAX_SELF_IMPROVEMENT_ROUNDS) {
          setFinalizationMessage(
            `Self-improvement completed ${MAX_SELF_IMPROVEMENT_ROUNDS} rounds. ${cumulativeImprovements.length} total improvements accepted.`,
          );
        }
      }
    } catch (runError) {
      setError((runError as Error).message ?? "Self-improvement loop failed.");
    } finally {
      setSelfImprovementProgress(null);
      setNaiveStreaming(false);
      setEvaluating(false);
      setIsRunning(false);
    }
  };

  const handleStopMagicRun = () => {
    stopMagicRunRequestedRef.current = true;
    setMagicRunStopRequested(true);
    setRunMode("local");
  };

  const handleMagicRun = async () => {
    if (!question.trim() || isRunning) return;
    const mode = runMode;
    const source = mode === "local" ? "LOCAL" : "API";
    stopMagicRunRequestedRef.current = false;
    setIsRunning(true);
    setActiveSource(source);
    setError(null);
    setEvaluation(null);
    setNaiveEvaluation(null);
    setBatchProgress(null);
    setFinalizationMessage(null);
    setMagicRunStopRequested(false);
    setMagicRunStartIndex(sameQuestionRuns.length);
    setMagicRunExecutionMode(mode);

    try {
      for (let attempt = 1; attempt <= MAX_MAGIC_RUN_ATTEMPTS; attempt += 1) {
        if (stopMagicRunRequestedRef.current) {
          setFinalizationMessage(
            mode === "api"
              ? "API resolution loop stopped before starting another attempt. The next run is set to Local."
              : "Resolution loop stopped before starting another attempt.",
          );
          break;
        }

        setMagicRunProgress({
          attempt,
          maxAttempts: MAX_MAGIC_RUN_ATTEMPTS,
          lastMajority: "Undetermined",
        });

        const result = await executeSingleRun(question.trim(), mode);
        setCharacterResponses(result.committeeState);
        setNaiveText(result.naiveOutput);
        setNaiveEvaluation(result.naiveEval);
        setEvaluation(result.committeeEval);
        setCurrentPhase(result.usedRounds);
        pushRunSnapshot(
          question.trim(),
          result,
          source,
          {
            index: attempt,
            total: MAX_MAGIC_RUN_ATTEMPTS,
          },
          "auto_resolve",
        );
        seedConcernsFromTranscript(buildTranscript(result.committeeState));

        setMagicRunProgress({
          attempt,
          maxAttempts: MAX_MAGIC_RUN_ATTEMPTS,
          lastMajority: result.condorcet.majorityAfter,
        });

        if (result.condorcet.majorityAfter !== "Undetermined") {
          setFinalizationMessage(
            `Resolved after ${attempt} attempt${attempt === 1 ? "" : "s"}: majority is ${result.condorcet.majorityAfter}.`,
          );
          break;
        }

        if (stopMagicRunRequestedRef.current) {
          setFinalizationMessage(
            mode === "api"
              ? `Stopped API resolution loop after ${attempt} attempt${
                  attempt === 1 ? "" : "s"
                }. The next run is set to Local.`
              : `Stopped resolution loop after ${attempt} attempt${attempt === 1 ? "" : "s"}.`,
          );
          break;
        }

        if (attempt === MAX_MAGIC_RUN_ATTEMPTS) {
          setFinalizationMessage(
            `Reached ${MAX_MAGIC_RUN_ATTEMPTS} attempts without resolving. The committee could not reach a clear majority — the question may be genuinely undecidable at this depth.`,
          );
        }
      }
    } catch (runError) {
      setError((runError as Error).message ?? "Magic run failed.");
    } finally {
      setMagicRunProgress(null);
      setMagicRunStartIndex(null);
      setMagicRunExecutionMode(null);
      setMagicRunStopRequested(false);
      stopMagicRunRequestedRef.current = false;
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
      <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white via-white to-slate-50/90 p-6 shadow-sm md:p-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500/80 via-indigo-500/70 to-slate-400/50"
          aria-hidden
        />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="min-w-0 max-w-2xl space-y-3 pt-1">
            {isCybercool ? (
              <>
                <p className="hackers-prompt text-[11px] font-semibold uppercase tracking-[0.22em]">
                  &gt; CYBERNEUTICS // DEMO_NODE
                </p>
                <h1 className="acid-burn-display text-xl md:text-2xl">One answer vs decision-space map</h1>
                <p className="font-mono text-[11px] leading-relaxed tracking-wide text-slate-500">
                  {
                    "// trace: mono-voice vs multi-role deliberation — same prompt, different architecture"
                  }
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  Same uplink · contested roles · offline evaluator
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Cyberneutics demo
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  One answer vs decision-space map
                </h1>
                <p className="text-base leading-relaxed text-slate-600 md:text-[17px]">
                  Same prompt to a single model and to an adversarial committee—then scored independently so
                  architecture is the variable.
                </p>
                <p className="text-xs text-slate-500">
                  Same input · Externalized challenge · Independent rubric
                </p>
              </>
            )}
          </div>

          <div
            className={`flex w-full shrink-0 flex-col gap-3 rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-sm sm:w-auto sm:min-w-[280px] ${
              isCybercool ? "font-mono" : ""
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {isCybercool ? "UI.skin" : "View & repo"}
            </div>
            <div
              role="radiogroup"
              aria-label="Interface style"
              className="inline-flex w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-xs"
            >
              <button
                type="button"
                role="radio"
                aria-checked={uiSkin === "boring"}
                onClick={() => setUiSkin("boring")}
                className={`flex-1 rounded-md px-3 py-1.5 font-semibold transition sm:flex-none ${
                  uiSkin === "boring"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Boring
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={uiSkin === "cybercool"}
                onClick={() => setUiSkin("cybercool")}
                className={`flex-1 rounded-md px-3 py-1.5 font-semibold transition sm:flex-none ${
                  uiSkin === "cybercool"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cybercool
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AboutDemoDialog />
              <button
                type="button"
                onClick={() => setPresentationMode((prev) => !prev)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-sky-500"
              >
                {presentationMode ? "Presentation: on" : "Presentation: off"}
              </button>
              <a
                href={REPO_ORIGIN}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 underline-offset-2 transition hover:border-sky-500 hover:text-sky-700 hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <h4 className="text-sm font-semibold text-slate-900">Same input, different architectures</h4>
            <p className="mt-1 text-sm text-slate-700">
              The exact same question is sent to two systems: a single-call model and an
              adversarial committee. The comparison isolates architecture as the variable.
            </p>
          </article>
          <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <h4 className="text-sm font-semibold text-slate-900">Challenge is externalized</h4>
            <p className="mt-1 text-sm text-slate-700">
              The committee role set forces challenge, counterargument, and evidence standards.
              Hidden assumptions and trade-offs become explicit in the transcript.
            </p>
          </article>
          <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <h4 className="text-sm font-semibold text-slate-900">Quality is measured independently</h4>
            <p className="mt-1 text-sm text-slate-700">
              Both outputs are scored by an independent evaluator using the same rubric, so
              deltas show whether architecture improves decision quality.
            </p>
          </article>
        </div>

        <div
          ref={questionInputRef}
          className="mt-8 border-t border-slate-200/80 pt-8"
        >
          <div
            className={`rounded-2xl border border-slate-200/90 bg-white/70 p-4 shadow-sm backdrop-blur-sm md:p-5 ${
              isCybercool ? "font-mono" : ""
            }`}
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {isCybercool ? "Prompt // uplink" : "Decision question"}
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {isCybercool
                    ? "Same buffer → naive stack + committee stack. Primary exec below."
                    : "Pick a preset or type your own — the same text is sent to both the single-call model and the committee."}
                  {" "}
                  <button
                    type="button"
                    onClick={() => (document.getElementById("about-demo-dialog") as HTMLDialogElement)?.showModal()}
                    className="font-medium text-sky-700 underline-offset-2 hover:underline"
                  >
                    New here? See key terms
                  </button>
                </p>
              </div>
            </div>

            <HeroPromptLibrary
              presets={PRESET_QUESTIONS}
              activeQuestion={question}
              onSelect={handleQuestionChange}
              disabled={isRunning}
              isCybercool={isCybercool}
            />

            <div className="mt-4">
              <textarea
                className={`min-h-32 w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900 shadow-inner outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 ${
                  presentationMode ? "text-lg leading-8" : "text-base leading-7"
                }`}
                value={question}
                onChange={(event) => handleQuestionChange(event.target.value)}
                placeholder="Ask a decision question. The same prompt is sent to both systems..."
                disabled={isRunning}
                aria-label="Decision question for naive and committee pipelines"
              />
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={isSelfImprovementPrompt ? handleSelfImprovementRun : handleRun}
                disabled={isRunning || !question.trim()}
                className={`w-full rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelfImprovementPrompt
                    ? "bg-gradient-to-r from-violet-700 to-indigo-700 shadow-violet-900/20 hover:from-violet-600 hover:to-indigo-600"
                    : "bg-slate-900 shadow-slate-900/20 hover:bg-slate-800"
                }`}
              >
                {isRunning && selfImprovementProgress
                  ? `Self-improving… round ${selfImprovementProgress.round}/${selfImprovementProgress.total}`
                  : isRunning && magicRunProgress
                    ? `Resolving… attempt ${magicRunProgress.attempt}/${magicRunProgress.maxAttempts}`
                    : isRunning
                      ? "Running…"
                      : isSelfImprovementPrompt
                        ? `Run Self-Improvement Loop (up to ${MAX_SELF_IMPROVEMENT_ROUNDS} rounds)`
                        : "Run Committee"}
              </button>

              <div
                className={`flex flex-col gap-2 sm:flex-row sm:items-center ${
                  isCybercool ? "font-mono" : ""
                }`}
              >
                <div
                  role="radiogroup"
                  aria-label="Execution mode"
                  className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-xs"
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
                        className={`rounded-md px-3 py-1.5 font-semibold transition ${
                          active
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        } ${isRunning ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleMagicRun}
                  disabled={isRunning || !question.trim()}
                  className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-900/20 transition hover:from-amber-400 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {magicRunProgress
                    ? `Attempt ${magicRunProgress.attempt}… (${magicRunProgress.lastMajority})`
                    : isCybercool
                      ? "AUTO-RESOLVE LOOP"
                      : "Run Until Resolved"}
                </button>
              </div>

              {runMode === "api" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
                  <span className="font-bold">
                    {isCybercool ? "Uplink budget note:" : "API budget note:"}
                  </span>{" "}
                  {isCybercool ? (
                    <>
                      API LIVE mode sends live Anthropic Claude requests.{" "}
                      <span className="font-semibold">
                        One attempt runs the naive path, committee path, and two evaluator calls; adaptive depth
                        may rerun the committee path with more rounds before that attempt is scored.
                      </span>{" "}
                      Batch N repeats that full stack N times to map variance; auto-resolve repeats it up to{" "}
                      {MAX_MAGIC_RUN_ATTEMPTS} times until a clear majority appears. Start local, then
                      spend API calls when live variance is the thing you want to measure.
                    </>
                  ) : (
                    <>
                      API mode calls live Anthropic Claude models.{" "}
                      <span className="font-semibold">
                        One run sends the prompt through the naive answer, the committee, and two independent
                        evaluator calls; when adaptive depth is on, the committee path may rerun with additional
                        rounds before the attempt is scored.
                      </span>{" "}
                      Use a single run for one live trace, a small batch to compare variance, and larger batches only
                      when stability matters.{" "}
                      <span className="font-semibold">
                        &quot;Run Until Resolved&quot; can repeat that full stack up to {MAX_MAGIC_RUN_ATTEMPTS} times
                      </span>{" "}
                      while looking for a clear majority. During that loop, the guidance panel below shows whether the
                      attempts are converging or diverging and provides a clearly labeled stop button that switches the
                      next run back to Local.
                    </>
                  )}
                </div>
              )}

              {magicRunProgress ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold text-amber-950">
                        Attempt {magicRunProgress.attempt} of {magicRunProgress.maxAttempts}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-amber-900">
                        Last majority: {magicRunProgress.lastMajority}. Completed attempts in this loop:{" "}
                        {magicRunAttempts.length}.
                      </p>
                    </div>
                    {magicRunExecutionMode === "api" ? (
                      <button
                        type="button"
                        onClick={handleStopMagicRun}
                        className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-950 shadow-sm transition hover:border-rose-400 hover:text-rose-800"
                      >
                        {magicRunStopRequested
                          ? "Stop requested; next run Local"
                          : "Stop API loop; switch next run to Local"}
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-amber-200">
                    <div
                      className="h-full rounded-full bg-amber-600 transition-all duration-500"
                      style={{ width: `${(magicRunProgress.attempt / magicRunProgress.maxAttempts) * 100}%` }}
                    />
                  </div>
                  <div
                    className={`mt-3 rounded-md border px-3 py-2 text-xs leading-relaxed ${
                      MAGIC_GUIDANCE_TONE_CLASS[magicRunGuidance.tone]
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold">Trend: {magicRunGuidance.label}</div>
                        <p className="mt-0.5">{magicRunGuidance.detail}</p>
                      </div>
                      <div className="min-w-[9rem]">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide">
                          Continue signal
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/70">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              MAGIC_GUIDANCE_METER_CLASS[magicRunGuidance.tone]
                            }`}
                            style={{ width: `${magicRunGuidance.meterPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 font-medium">{magicRunGuidance.recommendation}</p>
                    <div className="mt-2 flex flex-wrap gap-1" aria-label="Run-until-resolved attempt outcomes">
                      {Array.from({ length: magicRunProgress.maxAttempts }).map((_, index) => {
                        const attemptRun = magicRunAttempts[index];
                        const isCurrentAttempt = index + 1 === magicRunProgress.attempt && !attemptRun;
                        const isResolvedAttempt =
                          !!attemptRun && attemptRun.majorityAfter !== "Undetermined";
                        const barClass = isResolvedAttempt
                          ? "bg-emerald-600"
                          : attemptRun
                            ? "bg-amber-500"
                            : isCurrentAttempt
                              ? "animate-pulse bg-sky-500"
                              : "bg-white/80";
                        return (
                          <span
                            key={index}
                            title={
                              attemptRun
                                ? `Attempt ${index + 1}: ${attemptRun.majorityAfter}`
                                : isCurrentAttempt
                                  ? `Attempt ${index + 1}: running`
                                  : `Attempt ${index + 1}: pending`
                            }
                            className={`h-2 w-4 rounded-full border border-white/70 ${barClass}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {selfImprovementProgress ? (
                <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-violet-900">
                    <span>
                      Round {selfImprovementProgress.round} of {selfImprovementProgress.total}
                    </span>
                    <span>
                      {selfImprovementProgress.cumulativeImprovements.length} improvement{selfImprovementProgress.cumulativeImprovements.length === 1 ? "" : "s"} accepted
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-200">
                    <div
                      className="h-full rounded-full bg-violet-600 transition-all duration-500"
                      style={{ width: `${(selfImprovementProgress.round / selfImprovementProgress.total) * 100}%` }}
                    />
                  </div>
                  {selfImprovementProgress.cumulativeImprovements.length > 0 ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] font-medium text-violet-700">
                        Accepted improvements so far
                      </summary>
                      <ol className="mt-1 space-y-0.5 pl-4 text-[11px] leading-relaxed text-violet-800">
                        {selfImprovementProgress.cumulativeImprovements.map((item, idx) => (
                          <li key={idx} className="list-decimal">
                            {item.length > 120 ? `${item.slice(0, 120)}…` : item}
                          </li>
                        ))}
                      </ol>
                    </details>
                  ) : null}
                </div>
              ) : null}
              {isSelfImprovementPrompt && !isRunning ? (
                <p className="text-[11px] leading-relaxed text-violet-700">
                  Self-improvement mode: the committee will critique its own process, auto-accept
                  identified concerns, and re-run with accumulated improvements — up to{" "}
                  {MAX_SELF_IMPROVEMENT_ROUNDS} rounds or until no new concerns emerge.
                </p>
              ) : null}
            </div>

            <details
              className={`mt-4 rounded-xl border border-slate-200 bg-slate-50/90 shadow-inner ${
                isCybercool ? "font-mono" : ""
              }`}
            >
              <summary className="cursor-pointer px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 md:px-5">
                {isCybercool ? "Exec.mode // run.params" : "Settings — execution mode, rounds, batch"}
              </summary>
              <div className="px-4 pb-4 md:px-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {isCybercool ? "Exec.mode // entropy source" : "Execution engine"}
                </div>
                {isCybercool ? (
                  <p className="mt-2 text-[11px] leading-relaxed tracking-wide text-slate-600">
                    LOCAL = deterministic sim (repeatable trace, no uplink). WAN = live models (same routes,
                    stochastic text + scores). Same committee vs naive graph — different ground truth for what
                    the bytes represent.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">Local</span> runs an in-process
                    deterministic simulator: the same prompt follows the same scripted trace so you can learn
                    the pipeline, panels, and rubrics without API keys, spend, or network variance.{" "}
                    <span className="font-semibold text-slate-900">API</span> calls the same server routes
                    against live models, so transcripts, inferred votes, and evaluator scores change run to run
                    with real randomness.
                  </p>
                )}
                <div
                  role="radiogroup"
                  aria-label="Execution mode"
                  className={`mt-4 inline-flex w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-100 p-1 md:w-auto ${
                    isCybercool ? "font-mono" : ""
                  }`}
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
                        className={`flex-1 rounded-lg px-4 py-2 text-left transition md:min-w-[220px] ${
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

                <div className="mt-5 border-t border-slate-200/90 pt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {isCybercool ? "Run.params // dispatch" : "Run configuration"}
                  </div>
                  <p className={`mt-2 text-xs leading-relaxed text-slate-600 ${isCybercool ? "font-mono" : ""}`}>
                    {isCybercool
                      ? "Single run = one trace. Batch = repeated traces for variance. Auto-resolve = repeated full stacks until a majority appears or the attempt cap is reached."
                      : "Use one run when you want a single trace, a small batch when you want to compare variance, and Run Until Resolved when you specifically want to see whether repeated attempts can produce a clear majority."}
                  </p>
                  <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                    <label
                      className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 lg:min-w-[200px] ${
                        isCybercool ? "font-mono normal-case" : ""
                      }`}
                    >
                      <span>{isCybercool ? "Rounds" : "Deliberation rounds"}</span>
                      <input
                        type="number"
                        min={2}
                        max={6}
                        value={deliberationRounds}
                        onChange={(event) =>
                          setDeliberationRounds(Math.max(2, Math.min(6, Number(event.target.value) || 2)))
                        }
                        disabled={isRunning}
                        className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-sm font-normal normal-case tracking-normal text-slate-800"
                      />
                    </label>
                    <label
                      className={`flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 lg:min-w-[280px] ${
                        isCybercool ? "font-mono text-xs" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={adaptiveDepth}
                        onChange={(event) => setAdaptiveDepth(event.target.checked)}
                        disabled={isRunning}
                      />
                      {isCybercool
                        ? "Auto-expand rounds if majority undetermined"
                        : "Auto-add rounds when outcome stays undetermined"}
                    </label>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <label
                        className={`text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                          isCybercool ? "font-mono" : ""
                        }`}
                      >
                        {isCybercool ? "Batch N" : "Batch runs"}
                        <input
                          type="number"
                          min={2}
                          max={10}
                          value={batchRunCount}
                          onChange={(event) =>
                            setBatchRunCount(Math.max(2, Math.min(10, Number(event.target.value) || 2)))
                          }
                          disabled={isRunning}
                          className="ml-2 w-16 rounded border border-slate-300 bg-white px-2 py-1 text-sm font-normal normal-case tracking-normal text-slate-800"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleBatchRun}
                        disabled={isRunning || !question.trim()}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Run Batch
                      </button>
                      {batchProgress ? (
                        <span className={`text-xs text-slate-600 ${isCybercool ? "font-mono" : ""}`}>
                          {batchProgress.current}/{batchProgress.total}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCurrentQuestionRuns}
                      disabled={isRunning || sameQuestionRuns.length === 0}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
                    >
                      {isCybercool ? "CLR question runs" : "Clear runs for current question"}
                      {sameQuestionRuns.length > 0 ? (
                        <span className="ml-2 rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                          {sameQuestionRuns.length}
                        </span>
                      ) : null}
                    </button>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      <div
        className={`sticky top-0 z-50 -mx-6 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-slate-200 bg-white/95 px-6 py-2 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/88 ${
          isCybercool ? "font-mono" : ""
        }`}
      >
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Jump</span>
          <button
            type="button"
            onClick={() => setIsLiveGraphMinimized((prev) => !prev)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
          >
            {isLiveGraphMinimized ? "Expand graph & jury" : "Minimize graph & jury"}
          </button>
          <button
            type="button"
            onClick={scrollToQuestionInput}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
          >
            Run another prompt
          </button>
          <button
            type="button"
            onClick={scrollToEvaluation}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
          >
            Jump to evaluation
          </button>
          <button
            type="button"
            onClick={scrollToInsights}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
          >
            Jump to insights
          </button>
          {showAccountabilityLane ? (
            <button
              type="button"
              onClick={scrollToAccountability}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-700 transition hover:border-sky-500"
            >
              Accountability
            </button>
          ) : null}
      </div>

      <div ref={commandCenterRef}>
        <LiveRunCommandCenter
          isCybercool={isCybercool}
          question={question}
          runMode={runMode}
          activeSource={activeSource}
          phaseLabel={phaseLabel}
          batchProgress={batchProgress}
          isRunning={isRunning}
          hasAnyOutput={hasAnyOutput}
          naiveText={naiveText}
          naiveStreaming={naiveStreaming}
          characterResponses={characterResponses}
          evaluation={evaluation}
          naiveEvaluation={naiveEvaluation}
          evaluating={evaluating}
          currentPhase={currentPhase}
          trendPoints={trendPoints}
          dashboardStatus={dashboardStatus}
          convergenceLabel={convergenceLabel}
          committeeMean={committeeMean}
          naiveMean={naiveMean}
          deltaMean={deltaMean}
          majorityStabilityRate={majorityStabilityRate}
          majorityInstabilityFraming={majorityInstabilityFraming}
          error={error}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          {error ? (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {hasAnyOutput && !isRunning ? (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
              <span className="font-semibold">What to look at first: </span>
              The two evaluation panels below show how the evaluator scored both outputs on the
              same five-dimension rubric. The left panel is the single-call answer; the right is the committee.
              Compare the scores, then expand sections below for deeper analysis.
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

          <div ref={evaluationRef} className="grid gap-4 xl:grid-cols-2">
            <EvaluationPanel
              evaluation={naiveEvaluation}
              evaluating={evaluating}
              title="NAIVE EVALUATION (same rubric)"
              sourceLabel={activeSource}
              presentationMode={presentationMode}
            />
            <EvaluationPanel
              evaluation={evaluation}
              evaluating={evaluating}
              title="COMMITTEE EVALUATION (same rubric)"
              sourceLabel={activeSource}
              presentationMode={presentationMode}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
            <NaivePanel
              text={naiveText}
              streaming={naiveStreaming}
              sourceLabel={activeSource}
              presentationMode={presentationMode}
            />
            <div ref={committeeRef} className="min-h-0 h-full">
              <CommitteePanel
                currentPhase={currentPhase}
                characterResponses={characterResponses}
                sourceLabel={activeSource}
                presentationMode={presentationMode}
              />
            </div>
          </div>

          {/* Tier 2: How scores work */}
          <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">How scores are computed</span>
              <span className="ml-2 text-xs text-slate-500">Step-by-step rubric calculation and anatomy of the deliberation</span>
            </summary>
            <div className="space-y-5 px-4 pb-4">
              {hasAnyOutput ? (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700 shadow-sm">
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
                    isRunning={isRunning}
                  />
                </div>
              ) : null}

              <DeliberationAnatomyCanvas
                characterResponses={characterResponses}
                naiveEvaluation={naiveEvaluation}
                committeeEvaluation={evaluation}
                presentationMode={presentationMode}
                currentPhase={currentPhase}
                isRunning={isRunning}
              />
            </div>
          </details>

          {/* Tier 3: Decision analysis */}
          <details className="rounded-xl border border-slate-200 bg-white shadow-sm" ref={insightsRef}>
            <summary className="cursor-pointer px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Decision analysis</span>
              <span className="ml-2 text-xs text-slate-500">Dashboard, vote movement, and naive-vs-committee comparison</span>
            </summary>
            <div className="space-y-5 px-4 pb-4">
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
                majorityInstabilityFraming={majorityInstabilityFraming}
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

              <ComparisonInsightsPanel
                naiveEvaluation={naiveEvaluation}
                committeeEvaluation={evaluation}
                characterResponses={characterResponses}
                presentationMode={presentationMode}
              />
            </div>
          </details>

          {/* Tier 4: Cross-run evidence */}
          <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Cross-run evidence</span>
              <span className="ml-2 text-xs text-slate-500">
                {sameQuestionRuns.length < 2
                  ? "Run the same prompt 2+ times to accumulate evidence"
                  : `${sameQuestionRuns.length} runs — longitudinal trends and stability`}
              </span>
            </summary>
            <div className="space-y-5 px-4 pb-4">
              <RunOutcomeLogPanel
                question={question}
                runs={sameQuestionRuns}
                presentationMode={presentationMode}
                isCybercool={isCybercool}
              />

              <LongitudinalEvidencePanel summary={evidenceSummary} />

              <EvidenceRibbonPanel
                runs={sameQuestionRuns}
                evidenceSummary={evidenceSummary}
                presentationMode={presentationMode}
              />
            </div>
          </details>

          {/* Accountability */}
          {showAccountabilityLane ? (
            <details className="rounded-xl border border-slate-200 bg-white shadow-sm" open={concerns.length > 0 ? true : undefined} ref={accountabilityRef}>
              <summary className="cursor-pointer px-4 py-3">
                <span className="text-sm font-semibold text-slate-800">Decision accountability</span>
                <span className="ml-2 text-xs text-slate-500">Concerns, dispositions, and overrides</span>
              </summary>
              <div className="px-4 pb-4">
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
            </details>
          ) : null}

          {/* Tier 5: Committee dynamics & raw transcripts */}
          <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Committee dynamics &amp; raw transcripts</span>
              <span className="ml-2 text-xs text-slate-500">Inter-character dynamics, convergence patterns, and full output text</span>
            </summary>
            <div className="space-y-5 px-4 pb-4">
              <CommitteeDynamicsPanel characterResponses={characterResponses} />

              <div className="grid gap-3 lg:grid-cols-2">
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

        <ObservabilityDock
          isCybercool={isCybercool}
          isLiveGraphMinimized={isLiveGraphMinimized}
          hasAnyOutput={hasAnyOutput}
          runMode={runMode}
          activeSource={activeSource}
          phaseLabel={phaseLabel}
          batchProgress={batchProgress}
          isRunning={isRunning}
          isDecisionFinalized={isDecisionFinalized}
          undispositionedConcernsCount={undispositionedConcerns.length}
          characterResponses={characterResponses}
          evaluation={evaluation}
          naiveEvaluation={naiveEvaluation}
          evaluating={evaluating}
          historyCommitteeMean={sameQuestionRuns.length > 0 ? committeeMean : null}
          currentPhase={currentPhase}
          trendPoints={trendPoints}
          dashboardStatus={dashboardStatus}
          convergenceLabel={convergenceLabel}
          committeeMean={committeeMean}
          deltaMean={deltaMean}
          runCount={sameQuestionRuns.length}
        />
      </div>

      <CommitteeLiveFeed
        characterResponses={characterResponses}
        currentPhase={currentPhase}
        presentationMode={presentationMode}
      />

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
