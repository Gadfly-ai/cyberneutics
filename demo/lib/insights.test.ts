import { describe, expect, it } from "vitest";
import { computeConfidenceMetrics, computeStabilityMetrics, summarizeEvidenceState } from "./insights";
import { RunSnapshot } from "./types";

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

describe("insights aggregation", () => {
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
