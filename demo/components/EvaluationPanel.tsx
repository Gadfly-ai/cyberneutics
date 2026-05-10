import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";
import { EvaluationResult } from "@/lib/types";

interface EvaluationPanelProps {
  evaluation: EvaluationResult | null;
  evaluating: boolean;
  title: string;
  sourceLabel?: string;
  presentationMode?: boolean;
}

const tierClasses: Record<string, string> = {
  STRONG: "text-emerald-600",
  ADEQUATE: "text-amber-600",
  WEAK: "text-rose-600",
};

export function EvaluationPanel({
  evaluation,
  evaluating,
  title,
  sourceLabel,
  presentationMode = false,
}: EvaluationPanelProps) {
  if (!evaluating && !evaluation) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 border-b border-slate-200 pb-2">
        <h2 className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        {sourceLabel ? (
          <div className="mt-2 inline-block rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
            {sourceLabel}
          </div>
        ) : null}
      </div>

      {evaluating && !evaluation ? (
        <div className="text-sm text-slate-700">Scoring transcript...</div>
      ) : null}

      {evaluation ? (
        <>
          <TechnicalBreakout className="mb-4 bg-slate-50" title="independent evaluator rubric and tier thresholds">
            <p>
              Both the naive answer and committee transcript are sent through the same evaluator contract.
              In local mode the demo returns a deterministic fixture; in API mode the evaluator returns JSON
              scored against the five rubric dimensions.
            </p>
            <AlgorithmBlock>{`average =
  (
    perspective_completeness +
    tradeoff_explicitness +
    assumption_surfacing +
    evidence_standards +
    reasoning_completeness
  ) / 5

tier =
  average >= 4.0 ? STRONG
  : average >= 3.0 ? ADEQUATE
  : WEAK

key_finding =
  one sentence from the evaluator naming the most important surfaced difference`}</AlgorithmBlock>
          </TechnicalBreakout>
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="space-y-2 text-sm">
              {Object.entries(evaluation.scores).map(([key, score]) => (
                <div key={key} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <div className="font-medium text-slate-900">
                    {key.replaceAll("_", " ")}: {score.score}/5
                  </div>
                  <div className={`text-slate-700 ${presentationMode ? "text-sm leading-6" : ""}`}>
                    {score.reasoning}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Confidence Tier</div>
                <div className={`text-3xl font-bold ${tierClasses[evaluation.tier]}`}>{evaluation.tier}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Average</div>
                <div className="text-lg font-semibold text-slate-900">{evaluation.average.toFixed(1)}</div>
              </div>
              <blockquote className="rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700">
                &ldquo;{evaluation.key_finding}&rdquo;
              </blockquote>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
