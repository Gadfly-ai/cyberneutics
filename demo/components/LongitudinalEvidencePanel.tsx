import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";
import { EvidenceSummary } from "@/lib/types";

interface LongitudinalEvidencePanelProps {
  summary: EvidenceSummary;
}

function formatReadiness(readiness: EvidenceSummary["readiness"]): string {
  if (readiness === "insufficient_data") return "Insufficient data";
  if (readiness === "tentative") return "Tentative";
  if (readiness === "robust") return "Robust";
  return "Unstable";
}

export function LongitudinalEvidencePanel({ summary }: LongitudinalEvidencePanelProps) {
  const { stability, confidence } = summary;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
        Longitudinal Evidence Memory
      </div>
      <p className="text-sm text-slate-700">
        Cross-run learning accumulates post-hoc evidence from independent runs for this question key.
      </p>
      <TechnicalBreakout
        className="mt-3 bg-slate-50"
        title="readiness thresholds, stability score, uncertainty band, and trend"
      >
        <p>
          Longitudinal evidence asks whether repeated independent runs point to a stable basin. It combines
          majority agreement with evaluator-score dispersion. A high evaluator mean alone is not enough if
          majorities disagree or scores vary widely.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <div className="font-semibold text-slate-900">Thresholds</div>
            <div className="mt-1">Minimum runs: 3</div>
            <div>Robust: agreement &gt;= 75% and instability &lt;= 0.40</div>
            <div>Tentative: agreement &gt;= 55% and instability &lt;= 0.80</div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <div className="font-semibold text-slate-900">Current diagnostics</div>
            <div className="mt-1">Agreement: {(stability.agreementRate * 100).toFixed(0)}%</div>
            <div>Instability: {stability.instability.toFixed(2)}</div>
            <div>Dispersion: {stability.dispersion.toFixed(2)}</div>
            <div>Positive delta rate: {(stability.positiveDeltaRate * 100).toFixed(0)}%</div>
          </div>
        </div>
        <AlgorithmBlock>{`agreementRate =
  count(most_common(finalMajority)) / runCount

instability = stddev(committeeAverage across runs)
dispersion = max(committeeAverage) - min(committeeAverage)
rollingMean = average(committeeAverage)
floorBound = min(committeeAverage)
trendSlope = (latestCommitteeAverage - firstCommitteeAverage) / (runCount - 1)

uncertaintyBand = [
  max(0, median(committeeAverage) - instability),
  min(3, median(committeeAverage) + instability)
]`}</AlgorithmBlock>
      </TechnicalBreakout>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Readiness</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{formatReadiness(summary.readiness)}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Stability Score</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {(stability.agreementRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-600">
            consensus {stability.majorityConsensus} | instability {stability.instability.toFixed(2)}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Confidence Mean</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{confidence.rollingMean.toFixed(2)}</div>
          <div className="text-xs text-slate-600">
            floor {confidence.floorBound.toFixed(2)} | latest {confidence.latest.toFixed(2)}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Trend</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {confidence.trendSlope >= 0 ? "+" : ""}
            {confidence.trendSlope.toFixed(2)}
          </div>
          <div className="text-xs text-slate-600">
            band {confidence.uncertaintyBand.lower.toFixed(2)} -{" "}
            {confidence.uncertaintyBand.upper.toFixed(2)}
          </div>
        </div>
      </div>

      {summary.warning ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {summary.warning}
        </div>
      ) : null}
    </section>
  );
}
