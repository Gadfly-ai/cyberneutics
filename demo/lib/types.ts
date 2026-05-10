export interface Character {
  id: string;
  name: string;
  propensity: string;
  catches: string;
  failureMode: string;
  color: string;
  accentHex: string;
  systemPrompt: string;
}

export type CommitteePhase = number;
export type ExecutionMode = "local" | "api" | "auto";
export type ResearchStatus = "ok" | "failed" | "skipped";

export interface ResearchResult {
  query: string;
  findings: string[];
  caveats: string[];
  confidence: "low" | "medium" | "high";
}

export interface ResearchPacket {
  status: ResearchStatus;
  provider: "anthropic";
  fetchedAt: string;
  result?: ResearchResult;
  error?: string;
}

export interface CharacterResearchTrace {
  characterId: string;
  packet: ResearchPacket;
}

export type CommitteeEvent =
  | { type: "phase"; phase: CommitteePhase }
  | { type: "character_start"; characterId: string; phase: CommitteePhase }
  | { type: "character_chunk"; characterId: string; chunk: string }
  | { type: "character_done"; characterId: string }
  | { type: "research_start"; characterId: string }
  | { type: "research_done"; characterId: string; packet: ResearchPacket }
  | { type: "research_error"; characterId: string; message: string }
  | { type: "committee_done" }
  | { type: "error"; message: string };

export interface CharacterRoundState {
  phase1: string;
  phase2: string;
  streaming: boolean;
  done: boolean;
  researchState: "idle" | "running" | "ok" | "failed" | "skipped";
  researchPacket: ResearchPacket | null;
}

export interface EvaluationRubricScore {
  score: number;
  reasoning: string;
}

export interface EvaluationResult {
  scores: {
    perspective_completeness: EvaluationRubricScore;
    tradeoff_explicitness: EvaluationRubricScore;
    assumption_surfacing: EvaluationRubricScore;
    evidence_standards: EvaluationRubricScore;
    reasoning_completeness: EvaluationRubricScore;
  };
  average: number;
  tier: "STRONG" | "ADEQUATE" | "WEAK";
  key_finding: string;
}

export type RunSource = "LOCAL" | "API";

export interface RunSnapshot {
  id: string;
  question: string;
  questionKey: string;
  timestamp: string;
  roundsUsed: number;
  resolvedByExtraRounds: boolean;
  naiveAverage: number;
  committeeAverage: number;
  delta: number;
  naiveTier: EvaluationResult["tier"];
  committeeTier: EvaluationResult["tier"];
  inferredVoteShifts: number;
  metacognitionTotal: number;
  majorityBefore: string;
  majorityAfter: string;
  executionSource: RunSource;
}

export interface ConfidenceMetrics {
  runCount: number;
  rollingMean: number;
  floorBound: number;
  latest: number;
  deltaFromRollingMean: number;
  uncertaintyBand: {
    lower: number;
    upper: number;
  };
  trendSlope: number;
}

export interface StabilityMetrics {
  runCount: number;
  agreementRate: number;
  instability: number;
  dispersion: number;
  positiveDeltaRate: number;
  majorityConsensus: "Aye" | "Nay" | "Undetermined" | "Mixed";
  lowNSignal: boolean;
}

export interface EvidenceThresholds {
  minimumRunCount: number;
  stableAgreementRate: number;
  stableInstabilityMax: number;
  tentativeAgreementRate: number;
  tentativeInstabilityMax: number;
}

export type EvidenceReadiness = "insufficient_data" | "tentative" | "robust" | "unstable";

export interface EvidenceSummary {
  questionKey: string;
  runCount: number;
  stability: StabilityMetrics;
  confidence: ConfidenceMetrics;
  readiness: EvidenceReadiness;
  warning: string | null;
}

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type ConcernStatus = "raised" | "triaged" | "dispositioned" | "closed";

export type DispositionOutcome = "accept" | "mitigate" | "override";

export type DispositionStatus = "pending" | "completed";

export interface ConcernRecord {
  id: string;
  questionKey: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  owner: string;
  evidenceRef: string;
  raisedBy: string;
  raisedAt: string;
  status: ConcernStatus;
}

export interface DispositionRecord {
  id: string;
  concernId: string;
  questionKey: string;
  outcome: DispositionOutcome;
  status: DispositionStatus;
  rationale: string;
  decidedBy: string;
  decidedAt: string | null;
  mitigationActions: string;
  mitigationOwner: string;
  mitigationDueDate: string | null;
}

export interface OverrideRecord {
  id: string;
  concernId: string;
  questionKey: string;
  approvedBy: string;
  approvedAt: string;
  rationale: string;
  residualRisk: string;
  reviewDate: string | null;
}
