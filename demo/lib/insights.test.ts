import { describe, expect, it } from "vitest";
import {
  buildMetacognitionDetail,
  computeConfidenceMetrics,
  computeStabilityMetrics,
  sumMetacognitionPhaseTotals,
  summarizeEvidenceState,
} from "./insights";
import { CharacterRoundState, RunSnapshot } from "./types";

function buildRun(partial: Partial<RunSnapshot> & Pick<RunSnapshot, "id">): RunSnapshot {
  return {
    id: partial.id,
    question: partial.question ?? "Should we do X?",
    questionKey: partial.questionKey ?? "should we do x?",
    timestamp: partial.timestamp ?? "2026-05-08T00:00:00.000Z",
    roundsUsed: partial.roundsUsed ?? 2,
    resolvedByExtraRounds: partial.resolvedByExtraRounds ?? false,
    naiveAverage: partial.naiveAverage ?? 1.8,
    committeeAverage: partial.committeeAverage ?? 2.2,
    delta: partial.delta ?? 0.4,
    naiveTier: partial.naiveTier ?? "ADEQUATE",
    committeeTier: partial.committeeTier ?? "STRONG",
    inferredVoteShifts: partial.inferredVoteShifts ?? 1,
    metacognitionTotal: partial.metacognitionTotal ?? 6,
    majorityBefore: partial.majorityBefore ?? "Aye",
    majorityAfter: partial.majorityAfter ?? "Aye",
    executionSource: partial.executionSource ?? "API",
  };
}

function emptyCharacterState(text = ""): CharacterRoundState {
  return {
    phase1: text,
    phase2: "",
    streaming: false,
    done: true,
    researchState: "idle",
    researchPacket: null,
  };
}

describe("insights aggregation", () => {
  it("buildMetacognitionDetail lists literal matched terms per role", () => {
    const state: Record<string, CharacterRoundState> = {
      maya: emptyCharacterState("Governance matters for power."),
      frankie: emptyCharacterState(""),
      joe: emptyCharacterState(""),
      vic: emptyCharacterState(""),
      tammy: emptyCharacterState(""),
    };
    const detail = buildMetacognitionDetail(state);
    expect(detail.maya.total).toBe(2);
    expect(detail.maya.hits).toEqual(
      expect.arrayContaining([
        { term: "governance", count: 1 },
        { term: "power", count: 1 },
      ]),
    );
    expect(detail.maya.hits.length).toBe(2);
    expect(detail.maya.round1.total).toBe(2);
    expect(detail.maya.round2.total).toBe(0);
  });

  it("buildMetacognitionDetail splits counts by round", () => {
    const state: Record<string, CharacterRoundState> = {
      maya: {
        phase1: "Governance.",
        phase2: "Power and more power.",
        streaming: false,
        done: true,
        researchState: "idle",
        researchPacket: null,
      },
      frankie: emptyCharacterState(""),
      joe: emptyCharacterState(""),
      vic: emptyCharacterState(""),
      tammy: emptyCharacterState(""),
    };
    const detail = buildMetacognitionDetail(state);
    expect(detail.maya.total).toBe(3);
    expect(detail.maya.round1.total).toBe(1);
    expect(detail.maya.round2.total).toBe(2);
    expect(detail.maya.round1.hits.some((h) => h.term === "governance")).toBe(true);
    expect(detail.maya.round2.hits.some((h) => h.term === "power" && h.count === 2)).toBe(true);
  });

  it("sumMetacognitionPhaseTotals aggregates R1/R2 across roles", () => {
    const state: Record<string, CharacterRoundState> = {
      maya: {
        phase1: "Governance.",
        phase2: "Power and more power.",
        streaming: false,
        done: true,
        researchState: "idle",
        researchPacket: null,
      },
      frankie: emptyCharacterState(""),
      joe: emptyCharacterState(""),
      vic: emptyCharacterState(""),
      tammy: emptyCharacterState(""),
    };
    const totals = sumMetacognitionPhaseTotals(state);
    expect(totals.round1).toBe(1);
    expect(totals.round2).toBe(2);
    expect(totals.delta).toBe(1);
  });

  it("computeStabilityMetrics tracks agreement and low-N warning", () => {
    const history: RunSnapshot[] = [
      buildRun({ id: "r1", majorityAfter: "Nay", committeeAverage: 2.4, delta: 0.5 }),
      buildRun({ id: "r2", majorityAfter: "Nay", committeeAverage: 2.3, delta: 0.4 }),
    ];
    const metrics = computeStabilityMetrics(history);

    expect(metrics.runCount).toBe(2);
    expect(metrics.agreementRate).toBe(1);
    expect(metrics.majorityConsensus).toBe("Nay");
    expect(metrics.lowNSignal).toBe(true);
  });

  it("computeConfidenceMetrics enforces floor bound and trend", () => {
    const history: RunSnapshot[] = [
      buildRun({ id: "r1", committeeAverage: 2.0 }),
      buildRun({ id: "r2", committeeAverage: 2.2 }),
      buildRun({ id: "r3", committeeAverage: 2.4 }),
    ];
    const metrics = computeConfidenceMetrics(history);

    expect(metrics.floorBound).toBe(2.0);
    expect(metrics.latest).toBe(2.4);
    expect(metrics.trendSlope).toBeGreaterThan(0);
    expect(metrics.uncertaintyBand.upper).toBeGreaterThanOrEqual(metrics.uncertaintyBand.lower);
  });

  it("computeConfidenceMetrics keeps uncertainty band on 1–5 rubric scale (no inverted band)", () => {
    const history: RunSnapshot[] = [
      buildRun({ id: "r1", committeeAverage: 4.4 }),
      buildRun({ id: "r2", committeeAverage: 4.4 }),
      buildRun({ id: "r3", committeeAverage: 5.0 }),
    ];
    const metrics = computeConfidenceMetrics(history);

    expect(metrics.uncertaintyBand.lower).toBeGreaterThanOrEqual(1);
    expect(metrics.uncertaintyBand.upper).toBeLessThanOrEqual(5);
    expect(metrics.uncertaintyBand.upper).toBeGreaterThanOrEqual(metrics.uncertaintyBand.lower);
  });

  it("summarizeEvidenceState returns robust readiness for stable runs", () => {
    const history: RunSnapshot[] = [
      buildRun({ id: "r1", majorityAfter: "Nay", committeeAverage: 2.3 }),
      buildRun({ id: "r2", majorityAfter: "Nay", committeeAverage: 2.2 }),
      buildRun({ id: "r3", majorityAfter: "Nay", committeeAverage: 2.3 }),
      buildRun({ id: "r4", majorityAfter: "Nay", committeeAverage: 2.2 }),
    ];
    const summary = summarizeEvidenceState("should we do x?", history);

    expect(summary.readiness).toBe("robust");
    expect(summary.warning).toBeNull();
  });
});
