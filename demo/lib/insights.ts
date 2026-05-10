import { CHARACTERS } from "./characters";
import {
  CharacterRoundState,
  ConfidenceMetrics,
  EvaluationResult,
  EvidenceSummary,
  EvidenceThresholds,
  RunSnapshot,
  StabilityMetrics,
} from "./types";
import { inferMajority, inferVoteWithSource } from "./voteInference";

function countMatches(text: string, regex: RegExp): number {
  return (text.match(regex) ?? []).length;
}

export function buildMetacognitionCounts(state: Record<string, CharacterRoundState>) {
  const getText = (id: string) => `${state[id]?.phase1 ?? ""} ${state[id]?.phase2 ?? ""}`;
  return {
    maya: countMatches(getText("maya").toLowerCase(), /\b(incentive|benefit|insulated|governance|power)\b/g),
    frankie: countMatches(getText("frankie").toLowerCase(), /\b(value|ethical|dignity|harm|legitimacy)\b/g),
    joe: countMatches(getText("joe").toLowerCase(), /\b(before|precedent|history|memory|tried)\b/g),
    vic: countMatches(getText("vic").toLowerCase(), /\b(evidence|falsif|base rate|test|measur)\b/g),
    tammy: countMatches(getText("tammy").toLowerCase(), /\b(feedback|second-order|system|loop|atrophy)\b/g),
  };
}

export function buildCondorcetShift(state: Record<string, CharacterRoundState>) {
  const rows = CHARACTERS.map((character) => {
    const before = inferVoteWithSource(state[character.id]?.phase1 ?? "");
    const after = inferVoteWithSource(state[character.id]?.phase2 ?? "");
    return {
      name: character.name,
      before: before.vote,
      beforeSource: before.source,
      after: after.vote,
      afterSource: after.source,
      changed: before.vote !== after.vote,
    };
  });
  const majorityBefore = inferMajority(rows.map((r) => r.before));
  const majorityAfter = inferMajority(rows.map((r) => r.after));

  return {
    rows,
    majorityBefore,
    majorityAfter,
    meaningfulDifference: majorityBefore !== "Undetermined" && majorityAfter !== "Undetermined" && majorityBefore !== majorityAfter,
  };
}

export function buildDeltaSummary(
  naive: EvaluationResult | null,
  committee: EvaluationResult | null,
  state: Record<string, CharacterRoundState>,
): string {
  if (!naive || !committee) return "Run both evaluations to compute delta summary.";
  const condorcet = buildCondorcetShift(state);
  const avgDelta = (committee.average - naive.average).toFixed(1);
  const changed = condorcet.rows.filter((r) => r.changed).length;
  return `Committee scored ${avgDelta} points higher on average, with ${changed} inferred vote shifts after cross-examination${
    condorcet.meaningfulDifference ? ` and a majority change from ${condorcet.majorityBefore} to ${condorcet.majorityAfter}` : ""
  }.`;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function computeSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return (last - first) / (values.length - 1);
}

function normalizeMajorityConsensus(values: string[]): StabilityMetrics["majorityConsensus"] {
  if (values.length === 0) return "Undetermined";
  const nonUndetermined = values.filter((value) => value !== "Undetermined");
  if (nonUndetermined.length === 0) return "Undetermined";
  const ayeCount = nonUndetermined.filter((value) => value === "Aye").length;
  const nayCount = nonUndetermined.filter((value) => value === "Nay").length;
  if (ayeCount > 0 && nayCount > 0) return "Mixed";
  return ayeCount > 0 ? "Aye" : "Nay";
}

export function computeStabilityMetrics(history: RunSnapshot[]): StabilityMetrics {
  const runCount = history.length;
  if (runCount === 0) {
    return {
      runCount: 0,
      agreementRate: 0,
      instability: 0,
      dispersion: 0,
      positiveDeltaRate: 0,
      majorityConsensus: "Undetermined",
      lowNSignal: true,
    };
  }

  const majorities = history.map((run) => run.majorityAfter);
  const majorityCounts = majorities.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  const dominantCount = Math.max(...Object.values(majorityCounts));
  const agreementRate = dominantCount / runCount;

  const committeeAverages = history.map((run) => run.committeeAverage);
  const instability = standardDeviation(committeeAverages);
  const dispersion =
    committeeAverages.length > 0 ? Math.max(...committeeAverages) - Math.min(...committeeAverages) : 0;
  const positiveDeltaRate = history.filter((run) => run.delta > 0).length / runCount;

  return {
    runCount,
    agreementRate,
    instability,
    dispersion,
    positiveDeltaRate,
    majorityConsensus: normalizeMajorityConsensus(majorities),
    lowNSignal: runCount < 3,
  };
}

export function computeConfidenceMetrics(history: RunSnapshot[]): ConfidenceMetrics {
  const runCount = history.length;
  if (runCount === 0) {
    return {
      runCount: 0,
      rollingMean: 0,
      floorBound: 0,
      latest: 0,
      deltaFromRollingMean: 0,
      uncertaintyBand: { lower: 0, upper: 0 },
      trendSlope: 0,
    };
  }

  const committeeScores = history.map((run) => run.committeeAverage);
  const rollingMean = average(committeeScores);
  const floorBound = Math.min(...committeeScores);
  const latest = committeeScores[committeeScores.length - 1];
  const uncertainty = standardDeviation(committeeScores);
  const medianScore = median(committeeScores);
  const trendSlope = computeSlope(committeeScores);

  return {
    runCount,
    rollingMean,
    floorBound,
    latest,
    deltaFromRollingMean: latest - rollingMean,
    uncertaintyBand: {
      lower: Math.max(0, medianScore - uncertainty),
      upper: Math.min(3, medianScore + uncertainty),
    },
    trendSlope,
  };
}

const DEFAULT_EVIDENCE_THRESHOLDS: EvidenceThresholds = {
  minimumRunCount: 3,
  stableAgreementRate: 0.75,
  stableInstabilityMax: 0.4,
  tentativeAgreementRate: 0.55,
  tentativeInstabilityMax: 0.8,
};

export function summarizeEvidenceState(
  questionKey: string,
  history: RunSnapshot[],
  thresholds: EvidenceThresholds = DEFAULT_EVIDENCE_THRESHOLDS,
): EvidenceSummary {
  const stability = computeStabilityMetrics(history);
  const confidence = computeConfidenceMetrics(history);

  let readiness: EvidenceSummary["readiness"] = "insufficient_data";
  let warning: string | null = null;

  if (history.length < thresholds.minimumRunCount) {
    warning = `Low sample size (${history.length}/${thresholds.minimumRunCount}).`;
  } else if (
    stability.agreementRate >= thresholds.stableAgreementRate &&
    stability.instability <= thresholds.stableInstabilityMax
  ) {
    readiness = "robust";
  } else if (
    stability.agreementRate >= thresholds.tentativeAgreementRate &&
    stability.instability <= thresholds.tentativeInstabilityMax
  ) {
    readiness = "tentative";
  } else {
    readiness = "unstable";
  }

  return {
    questionKey,
    runCount: history.length,
    stability,
    confidence,
    readiness,
    warning,
  };
}
