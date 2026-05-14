import { RunLandscapeScatter } from "@/components/RunLandscapeScatter";
import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";

interface LastRunSummary {
  roundsUsed: number;
  resolvedByExtraRounds: boolean;
  majorityBefore: string;
  majorityAfter: string;
  delta: number;
  committeeTier: string;
  naiveTier: string;
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
  executionSource: "LOCAL" | "API";
}

interface DeliberationDashboardProps {
  question: string;
  runCount: number;
  dashboardStatus: string;
  convergenceLabel: string;
  committeeMean: number;
  naiveMean: number;
  deltaMean: number;
  positiveDeltaRate: number;
  averageVoteShifts: number;
  majorityStabilityRate: number;
  majorityInstabilityFraming: boolean;
  voteSourceSummary: VoteSourceSummary;
  majorityBeforeDistribution: MajorityDistribution;
  majorityAfterDistribution: MajorityDistribution;
  trendPoints: TrendPoint[];
  committeeKeyFinding?: string;
  naiveKeyFinding?: string;
  lastRun: LastRunSummary | null;
}

function formatRecommendation(majorityAfter: string): string {
  if (majorityAfter === "Aye") return "Proceed";
  if (majorityAfter === "Nay") return "Do not proceed yet";
  return "Decision remains undetermined";
}

export function DeliberationDashboard({
  question,
  runCount,
  dashboardStatus,
  convergenceLabel,
  committeeMean,
  naiveMean,
  deltaMean,
  positiveDeltaRate,
  averageVoteShifts,
  majorityStabilityRate,
  majorityInstabilityFraming,
  voteSourceSummary,
  majorityBeforeDistribution,
  majorityAfterDistribution,
  trendPoints,
  committeeKeyFinding,
  naiveKeyFinding,
  lastRun,
}: DeliberationDashboardProps) {
  const hasData = runCount > 0;
  const majorityOutcomeLabel = majorityInstabilityFraming ? "Majority Instability" : "Majority Stability";
  const majorityOutcomePercent = majorityInstabilityFraming
    ? (1 - majorityStabilityRate) * 100
    : majorityStabilityRate * 100;
  const recommendation = lastRun ? formatRecommendation(lastRun.majorityAfter) : "Run analysis to generate a recommendation";
  const confidence =
    runCount < 2
      ? "Low confidence (need repeated runs)"
      : majorityStabilityRate >= 0.75
        ? "High confidence (majority is stable)"
        : "Moderate confidence (majority can shift)";
  const nayAfterRate = hasData ? majorityAfterDistribution.nay / runCount : 0;
  const colorClass = {
    Aye: "bg-emerald-500",
    Nay: "bg-rose-500",
    Undetermined: "bg-slate-400",
  } as const;

  const distributionRows = [
    { label: "Round 1 majority", counts: majorityBeforeDistribution },
    { label: "Final majority", counts: majorityAfterDistribution },
  ];
  const firstTrend = trendPoints[0] ?? null;
  const lastTrend = trendPoints[trendPoints.length - 1] ?? null;
  const confidenceTrend =
    firstTrend && lastTrend ? lastTrend.committeeAverage - firstTrend.committeeAverage : 0;
  const metacognitionTrend =
    firstTrend && lastTrend ? lastTrend.metacognitionTotal - firstTrend.metacognitionTotal : 0;
  const hasTrendData = trendPoints.length >= 2;
  const sourceCounts = trendPoints.reduce(
    (acc, point) => {
      acc[point.executionSource] += 1;
      return acc;
    },
    { LOCAL: 0, API: 0 },
  );
  const sourceGuidance =
    trendPoints.length === 0
      ? null
      : sourceCounts.LOCAL > 0 && sourceCounts.API > 0
        ? "This evidence set mixes local simulator and API runs. Clear runs for this question before comparing live API variance."
        : sourceCounts.LOCAL > 0
          ? "These are local simulator runs, so repeated batches are intentionally deterministic. Switch to API mode for live variation."
          : "These are API runs, so repeated batches test live model/evaluator variation for this question.";
  const trendGuidance =
    trendPoints.length === 0
      ? "Run a comparison to start collecting cross-run evidence."
      : hasTrendData
        ? "Trend compares the latest run with the first stored run for this question."
        : "One run is a snapshot, not a trend. Run the same question again to see whether the signal moves.";

  const narrativeSteps = hasData
    ? [
        `Question analyzed: "${question}".`,
        `Initial committee majority was ${lastRun?.majorityBefore ?? "Undetermined"}, and ended as ${lastRun?.majorityAfter ?? "Undetermined"} after cross-examination.`,
        `Committee quality averaged ${committeeMean.toFixed(2)} vs ${naiveMean.toFixed(2)} for a mean lift of ${deltaMean >= 0 ? "+" : ""}${deltaMean.toFixed(2)}.`,
        `Inferred position changes averaged ${averageVoteShifts.toFixed(2)} members per run; positive quality lift occurred in ${(positiveDeltaRate * 100).toFixed(0)}% of runs.`,
        lastRun?.resolvedByExtraRounds
          ? `This conclusion required deeper deliberation (${lastRun.roundsUsed} rounds) to resolve an initially undetermined majority.`
          : `This conclusion settled within ${lastRun?.roundsUsed ?? 0} deliberation rounds.`,
      ]
    : ["No run data yet. Start a run to generate a narrative path and conclusion."];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">Decision Dashboard</div>
          <p className="mt-1 text-sm text-slate-700">
            Most valuable signals first, followed by a narrative of how the committee reached its outcome.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          Status: {dashboardStatus}
        </span>
      </div>
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        Declared vote sources: {voteSourceSummary.declared}/{voteSourceSummary.total} (fallback{" "}
        {voteSourceSummary.fallback}/{voteSourceSummary.total})
      </div>
      <div className="mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
        Runs are independent (no model weight updates). Learning here means accumulating evidence about
        stability, confidence, and metacognitive depth across repeated runs.
      </div>
      <TechnicalBreakout title="dashboard aggregation, confidence labels, distributions, and sparklines">
        <p>
          This panel is a cross-run aggregation for the current normalized question key. It reads the
          stored run snapshots, not model memory. Each snapshot stores evaluator averages, inferred
          majorities, inferred vote shifts, metacognition keyword total, rounds used, and execution source.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <div className="font-semibold text-slate-900">Current values</div>
            <div className="mt-1 space-y-0.5">
              <div>Run count: {runCount}</div>
              <div>Committee mean: {committeeMean.toFixed(2)}</div>
              <div>Naive mean: {naiveMean.toFixed(2)}</div>
              <div>Mean lift: {deltaMean >= 0 ? "+" : ""}{deltaMean.toFixed(2)}</div>
              <div>Positive lift rate: {(positiveDeltaRate * 100).toFixed(0)}%</div>
              <div>Average vote shifts: {averageVoteShifts.toFixed(2)}</div>
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <div className="font-semibold text-slate-900">Vote source caveat</div>
            <p className="mt-1">
              The declared/fallback count is live for the current transcript: each role contributes two
              vote inferences, one from round 1 and one from the latest deliberation text.
            </p>
          </div>
        </div>
        <AlgorithmBlock>{`sameQuestionRuns = runHistory.filter(run.questionKey == currentQuestionKey)

committeeMean = average(run.committeeAverage)
naiveMean = average(run.naiveAverage)
qualityLift = committeeMean - naiveMean
positiveDeltaRate = count(run.delta > 0) / runCount
averageVoteShifts = average(run.inferredVoteShifts)

dashboardStatus =
  runCount < 2 ? Collecting data
  : qualityLift > 0.4 && stddev(committeeAverage) <= 0.6
    ? Committee advantage likely
  : qualityLift <= 0 ? No committee advantage yet
  : Mixed results

sparkline y = height - ((value - min(series)) / range(series)) * height`}</AlgorithmBlock>
      </TechnicalBreakout>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Recommendation</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{recommendation}</div>
          <div className="text-xs text-slate-600">{confidence}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Quality Lift</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {deltaMean >= 0 ? "+" : ""}
            {deltaMean.toFixed(2)}
          </div>
          <div className="text-xs text-slate-600">committee minus naive average</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">{majorityOutcomeLabel}</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {majorityOutcomePercent.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-600">{convergenceLabel}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Vote Movement</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{averageVoteShifts.toFixed(2)}</div>
          <div className="text-xs text-slate-600">avg inferred shifts per run</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-sm font-semibold text-slate-900">What happened in this deliberation</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {narrativeSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-sm font-semibold text-slate-900">Conclusion and rationale</h3>
          <p className="mt-2 text-sm text-slate-700">
            {hasData
              ? `Final recommendation: ${recommendation}. Current majority ended ${lastRun?.majorityAfter ?? "Undetermined"} with committee quality tier ${lastRun?.committeeTier ?? "N/A"} versus naive tier ${lastRun?.naiveTier ?? "N/A"}.`
              : "No conclusion yet. Run at least one comparison to produce a recommendation."}
          </p>
          {committeeKeyFinding ? (
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Committee key finding:</span> {committeeKeyFinding}
            </p>
          ) : null}
          {naiveKeyFinding ? (
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Naive key finding:</span> {naiveKeyFinding}
            </p>
          ) : null}
        </article>
      </div>

      <RunLandscapeScatter
        points={trendPoints}
        className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3"
      />

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-900">Majority Distribution Across Runs</h3>
        <p className="mt-1 text-xs text-slate-600">
          This makes convergence direction visible: if final `Nay` is high, it reflects run outcomes, not a
          hidden default. Final Nay share: {(nayAfterRate * 100).toFixed(0)}%.
        </p>
        <div className="mt-3 space-y-2">
          {distributionRows.map((row) => {
            const total = row.counts.aye + row.counts.nay + row.counts.undetermined;
            const ayePct = total > 0 ? (row.counts.aye / total) * 100 : 0;
            const nayPct = total > 0 ? (row.counts.nay / total) * 100 : 0;
            const undeterminedPct = total > 0 ? (row.counts.undetermined / total) * 100 : 0;
            return (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-xs text-slate-700">
                  <span>{row.label}</span>
                  <span>
                    Aye {row.counts.aye} | Nay {row.counts.nay} | Undetermined {row.counts.undetermined}
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded bg-slate-200">
                  <div className={colorClass.Aye} style={{ width: `${ayePct}%` }} />
                  <div className={colorClass.Nay} style={{ width: `${nayPct}%` }} />
                  <div className={colorClass.Undetermined} style={{ width: `${undeterminedPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-700">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Aye
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Nay
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Undetermined
          </span>
        </div>
      </div>

      <div id="decision-dashboard-deep" className="mt-4 scroll-mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-900">Learning Signal Across Runs</h3>
        <p className="mt-1 text-xs text-slate-600">
          At-a-glance sparklines for committee average and metacognition live in the{" "}
          <a href="#observability-dock" className="font-medium text-sky-700 underline-offset-2 hover:underline">
            observability dock
          </a>
          . This section keeps the numeric trend summary and full run table.
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {hasTrendData ? (
            <>
              Confidence proxy trend (committee average): {confidenceTrend >= 0 ? "+" : ""}
              {confidenceTrend.toFixed(2)} | Metacognition trend (keyword pressure):{" "}
              {metacognitionTrend >= 0 ? "+" : ""}
              {metacognitionTrend}
            </>
          ) : (
            "Trend needs at least two runs for the same question."
          )}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {trendGuidance} Learning here means accumulating evidence across independent runs, not changing model
          weights or memory.
        </p>
        {sourceGuidance ? (
          <p className="mt-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
            {sourceGuidance}
          </p>
        ) : null}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-xs">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="border-b border-slate-200 px-2 py-1">Run</th>
                <th className="border-b border-slate-200 px-2 py-1">Committee Avg</th>
                <th className="border-b border-slate-200 px-2 py-1">Naive Avg</th>
                <th className="border-b border-slate-200 px-2 py-1">Delta</th>
                <th className="border-b border-slate-200 px-2 py-1">Metacognition</th>
                <th className="border-b border-slate-200 px-2 py-1">Vote shifts</th>
                <th className="border-b border-slate-200 px-2 py-1">Final Majority</th>
                <th className="border-b border-slate-200 px-2 py-1">Source</th>
              </tr>
            </thead>
            <tbody>
              {trendPoints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-2 text-slate-600">
                    No run history yet. Run batch mode to surface trend evidence.
                  </td>
                </tr>
              ) : (
                trendPoints.map((point) => (
                  <tr key={point.runIndex} className="text-slate-700">
                    <td className="border-b border-slate-200 px-2 py-1">{point.runIndex}</td>
                    <td className="border-b border-slate-200 px-2 py-1">
                      {point.committeeAverage.toFixed(2)}
                    </td>
                    <td className="border-b border-slate-200 px-2 py-1">
                      {point.naiveAverage.toFixed(2)}
                    </td>
                    <td className="border-b border-slate-200 px-2 py-1">
                      {point.delta >= 0 ? "+" : ""}
                      {point.delta.toFixed(2)}
                    </td>
                    <td className="border-b border-slate-200 px-2 py-1">{point.metacognitionTotal}</td>
                    <td className="border-b border-slate-200 px-2 py-1">{point.inferredVoteShifts}</td>
                    <td className="border-b border-slate-200 px-2 py-1">{point.majorityAfter}</td>
                    <td className="border-b border-slate-200 px-2 py-1">{point.executionSource}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
