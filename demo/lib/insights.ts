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
import { inferMajority, inferVoteWithSource, VoteLabel } from "./voteInference";

export type MetacognitionRoleId = "maya" | "frankie" | "joe" | "vic" | "tammy";

const METACOGNITION_PATTERNS: Record<MetacognitionRoleId, RegExp> = {
  maya: /\b(incentive|benefit|insulated|governance|power)\b/g,
  frankie: /\b(value|ethical|dignity|harm|legitimacy)\b/g,
  joe: /\b(before|precedent|history|memory|tried)\b/g,
  vic: /\b(evidence|falsif\w*|falsification|base rate|test|measur\w*)\b/g,
  tammy: /\b(feedback|second[- ]order|system|loop|atrophy)\b/g,
};

export interface MetacognitionPhaseSlice {
  total: number;
  /** Literal matched substrings (lower-cased), with occurrence counts, for this phase only. */
  hits: { term: string; count: number }[];
}

export interface MetacognitionRoleDetail {
  total: number;
  /** Combined round 1 + round 2; counts are summed per term. */
  hits: { term: string; count: number }[];
  round1: MetacognitionPhaseSlice;
  round2: MetacognitionPhaseSlice;
}

export function formatMetacognitionHitSummary(
  hits: MetacognitionRoleDetail["hits"] | MetacognitionPhaseSlice["hits"],
): string {
  if (hits.length === 0) return "—";
  return hits.map((h) => (h.count > 1 ? `${h.term} ×${h.count}` : h.term)).join(", ");
}

function collectMetacognitionHits(text: string, pattern: RegExp): Map<string, number> {
  const counts = new Map<string, number>();
  const haystack = text.toLowerCase();
  const re = new RegExp(pattern.source, pattern.flags);
  for (const match of haystack.matchAll(re)) {
    const term = match[0];
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  return counts;
}

function mergeHitMaps(a: Map<string, number>, b: Map<string, number>): Map<string, number> {
  const out = new Map(a);
  for (const [key, value] of b) {
    out.set(key, (out.get(key) ?? 0) + value);
  }
  return out;
}

function mapToPhaseSlice(map: Map<string, number>): MetacognitionPhaseSlice {
  const hits = [...map.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
  const total = hits.reduce((sum, hit) => sum + hit.count, 0);
  return { total, hits };
}

function metacognitionDetailForRole(
  state: Record<string, CharacterRoundState>,
  id: MetacognitionRoleId,
): MetacognitionRoleDetail {
  const pattern = METACOGNITION_PATTERNS[id];
  const r1 = collectMetacognitionHits(state[id]?.phase1 ?? "", pattern);
  const r2 = collectMetacognitionHits(state[id]?.phase2 ?? "", pattern);
  const merged = mergeHitMaps(r1, r2);
  const combined = mapToPhaseSlice(merged);
  return {
    total: combined.total,
    hits: combined.hits,
    round1: mapToPhaseSlice(r1),
    round2: mapToPhaseSlice(r2),
  };
}

export function buildMetacognitionDetail(
  state: Record<string, CharacterRoundState>,
): Record<MetacognitionRoleId, MetacognitionRoleDetail> {
  return {
    maya: metacognitionDetailForRole(state, "maya"),
    frankie: metacognitionDetailForRole(state, "frankie"),
    joe: metacognitionDetailForRole(state, "joe"),
    vic: metacognitionDetailForRole(state, "vic"),
    tammy: metacognitionDetailForRole(state, "tammy"),
  };
}

export function buildMetacognitionCounts(state: Record<string, CharacterRoundState>) {
  const detail = buildMetacognitionDetail(state);
  return {
    maya: detail.maya.total,
    frankie: detail.frankie.total,
    joe: detail.joe.total,
    vic: detail.vic.total,
    tammy: detail.tammy.total,
  };
}

/** Per-phase keyword hit totals (sum across roles); delta is round2 − round1. */
export function anyCharacterStreaming(state: Record<string, CharacterRoundState>): boolean {
  return CHARACTERS.some((c) => state[c.id]?.streaming);
}

export function sumMetacognitionPhaseTotals(state: Record<string, CharacterRoundState>): {
  round1: number;
  round2: number;
  delta: number;
} {
  const detail = buildMetacognitionDetail(state);
  let round1 = 0;
  let round2 = 0;
  for (const character of CHARACTERS) {
    const id = character.id as MetacognitionRoleId;
    round1 += detail[id].round1.total;
    round2 += detail[id].round2.total;
  }
  return { round1, round2, delta: round2 - round1 };
}

/** Vote counts for one phase (five roles). */
export interface VoteTally {
  aye: number;
  nay: number;
  undetermined: number;
}

export function tallyVotes(votes: VoteLabel[]): VoteTally {
  return {
    aye: votes.filter((v) => v === "Aye").length,
    nay: votes.filter((v) => v === "Nay").length,
    undetermined: votes.filter((v) => v === "Undetermined").length,
  };
}

/** |Aye − Nay|; ties and undetermined voters do not increase the winning margin. */
export function voteMargin(tally: VoteTally): number {
  return Math.abs(tally.aye - tally.nay);
}

export interface CondorcetInferenceDiagnostics {
  round1: { declared: number; fallback: number };
  round2: { declared: number; fallback: number };
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

  const tallyBefore = tallyVotes(rows.map((r) => r.before));
  const tallyAfter = tallyVotes(rows.map((r) => r.after));
  const marginBefore = voteMargin(tallyBefore);
  const marginAfter = voteMargin(tallyAfter);

  let r1Declared = 0;
  let r1Fallback = 0;
  let r2Declared = 0;
  let r2Fallback = 0;
  for (const row of rows) {
    if (row.beforeSource === "declared") r1Declared += 1;
    else r1Fallback += 1;
    if (row.afterSource === "declared") r2Declared += 1;
    else r2Fallback += 1;
  }
  const inferenceDiagnostics: CondorcetInferenceDiagnostics = {
    round1: { declared: r1Declared, fallback: r1Fallback },
    round2: { declared: r2Declared, fallback: r2Fallback },
  };

  return {
    rows,
    majorityBefore,
    majorityAfter,
    meaningfulDifference: majorityBefore !== "Undetermined" && majorityAfter !== "Undetermined" && majorityBefore !== majorityAfter,
    tallyBefore,
    tallyAfter,
    marginBefore,
    marginAfter,
    inferenceDiagnostics,
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
      lower: Math.max(1, medianScore - uncertainty),
      upper: Math.min(5, medianScore + uncertainty),
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
