import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";
import { buildCondorcetShift, buildDeltaSummary, buildMetacognitionCounts } from "@/lib/insights";
import { CharacterRoundState, EvaluationResult } from "@/lib/types";

interface ComparisonInsightsPanelProps {
  naiveEvaluation: EvaluationResult | null;
  committeeEvaluation: EvaluationResult | null;
  characterResponses: Record<string, CharacterRoundState>;
  presentationMode?: boolean;
}

const rubricKeys = [
  "perspective_completeness",
  "tradeoff_explicitness",
  "assumption_surfacing",
  "evidence_standards",
  "reasoning_completeness",
] as const;

export function ComparisonInsightsPanel({
  naiveEvaluation,
  committeeEvaluation,
  characterResponses,
  presentationMode = false,
}: ComparisonInsightsPanelProps) {
  if (!naiveEvaluation && !committeeEvaluation) return null;

  const condorcet = buildCondorcetShift(characterResponses);
  const meta = buildMetacognitionCounts(characterResponses);
  const summary = buildDeltaSummary(naiveEvaluation, committeeEvaluation, characterResponses);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 border-b border-slate-200 pb-2">
        <h2 className="text-base font-semibold text-slate-900">Difference Insights</h2>
        <p className={`text-slate-700 ${presentationMode ? "text-base leading-7" : "text-sm"}`}>
          {summary}
        </p>
      </div>
      <TechnicalBreakout
        className="mb-4 bg-slate-50"
        title="rubric deltas, inferred vote shift summary, and metacognition trace"
      >
        <p>
          This section compares the two evaluated outputs. The summary sentence is derived from evaluator
          averages plus the Condorcet vote-shift lens; the rubric table subtracts naive scores from
          committee scores criterion by criterion.
        </p>
        <AlgorithmBlock>{`summary =
  "Committee scored {committee.average - naive.average} points higher..."
  + "{count(inferred vote shifts)} inferred vote shifts"
  + optional majority-change clause

rubricDelta[key] =
  committeeEvaluation.scores[key].score - naiveEvaluation.scores[key].score

metacognition trace =
  role-specific keyword counts over round1 + latest deliberation text`}</AlgorithmBlock>
      </TechnicalBreakout>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-sm font-semibold text-slate-900">Rubric Delta (Committee - Naive)</div>
          <div className="space-y-1 text-xs">
            {rubricKeys.map((key) => {
              const naive = naiveEvaluation?.scores[key].score ?? 0;
              const committee = committeeEvaluation?.scores[key].score ?? 0;
              const delta = committee - naive;
              return (
                <div key={key} className="flex justify-between rounded border border-slate-200 bg-white px-2 py-1 text-slate-700">
                  <span>{key.replaceAll("_", " ")}</span>
                  <span className={delta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    {committee}/{naive} ({delta >= 0 ? "+" : ""}
                    {delta})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-sm font-semibold text-slate-900">Condorcet Lens (Inferred Votes)</div>
          <div className="mb-2 text-xs text-slate-600">
            Majority before: {condorcet.majorityBefore} - after: {condorcet.majorityAfter}
          </div>
          <div className="space-y-1 text-xs">
            {condorcet.rows.map((row) => (
              <div key={row.name} className="flex justify-between rounded border border-slate-200 bg-white px-2 py-1 text-slate-700">
                <span>{row.name}</span>
                <span>
                  {row.before}{" "}
                  <span className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                    {row.beforeSource}
                  </span>{" "}
                  -&gt; {row.after}{" "}
                  <span className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                    {row.afterSource}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Source shows whether vote came from an explicit declaration (`declared`) or lexical fallback.
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 text-sm font-semibold text-slate-900">Metacognition Trace (challenge density)</div>
        <div className="grid gap-2 text-xs text-slate-700 md:grid-cols-5">
          <div className="rounded border border-slate-200 bg-white p-2">Maya incentive probes: {meta.maya}</div>
          <div className="rounded border border-slate-200 bg-white p-2">Frankie values checks: {meta.frankie}</div>
          <div className="rounded border border-slate-200 bg-white p-2">Joe precedent refs: {meta.joe}</div>
          <div className="rounded border border-slate-200 bg-white p-2">Vic evidence demands: {meta.vic}</div>
          <div className="rounded border border-slate-200 bg-white p-2">Tammy systems loops: {meta.tammy}</div>
        </div>
        <TechnicalBreakout className="mt-3" title="exact pressure keywords and limitations">
          <p>
            This is a deliberately simple lexical proxy for whether each role is doing its assigned kind of
            cognitive work. It is not semantic understanding and it does not prove quality; it makes the
            pressure pattern inspectable.
          </p>
          <AlgorithmBlock>{`maya:    /\b(incentive|benefit|insulated|governance|power)\b/g
frankie: /\b(value|ethical|dignity|harm|legitimacy)\b/g
joe:     /\b(before|precedent|history|memory|tried)\b/g
vic:     /\b(evidence|falsif\w*|falsification|base rate|test|measur\w*)\b/g
tammy:   /\b(feedback|second[- ]order|system|loop|atrophy)\b/g

text = lowercase(round1Text + " " + latestDeliberationText)
pressure[role] = count(regex matches in text)`}</AlgorithmBlock>
        </TechnicalBreakout>
      </div>
    </section>
  );
}
