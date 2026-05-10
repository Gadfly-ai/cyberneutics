import { CHARACTERS } from "@/lib/characters";
import { buildCondorcetShift, buildMetacognitionCounts } from "@/lib/insights";
import { CharacterRoundState, EvaluationResult } from "@/lib/types";

interface CalculationExplainerProps {
  activeSource: "LOCAL" | "API";
  currentPhase: number;
  configuredRounds: number;
  adaptiveDepth: boolean;
  characterResponses: Record<string, CharacterRoundState>;
  evaluation: EvaluationResult | null;
  evaluating: boolean;
  historyCommitteeMean: number | null;
  concernsCount: number;
  undispositionedCount: number;
  dispositionedCount: number;
}

const metaKeywordLabels: Record<string, string> = {
  maya: "incentives, governance, power",
  frankie: "values, harm, legitimacy",
  joe: "precedent, history, memory",
  vic: "evidence, falsification, tests",
  tammy: "feedback, systems, loops",
};

const voteTone: Record<string, string> = {
  Aye: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Nay: "border-rose-200 bg-rose-50 text-rose-800",
  Undetermined: "border-slate-200 bg-slate-100 text-slate-700",
};

const sourceTone: Record<string, string> = {
  declared: "border-sky-200 bg-sky-50 text-sky-800",
  fallback: "border-amber-200 bg-amber-50 text-amber-900",
};

function tierExplanation(average: number): string {
  if (average >= 4) return "STRONG because average >= 4.0";
  if (average >= 3) return "ADEQUATE because average is 3.0-3.9";
  return "WEAK because average < 3.0";
}

function phaseExplanation(currentPhase: number, configuredRounds: number, adaptiveDepth: boolean): string {
  if (currentPhase <= configuredRounds) {
    return `Using the configured ${configuredRounds} round${configuredRounds === 1 ? "" : "s"}.`;
  }
  if (!adaptiveDepth) return "Additional phase shown from the configured round count.";
  return `Adaptive depth added ${currentPhase - configuredRounds} extra round${
    currentPhase - configuredRounds === 1 ? "" : "s"
  } because the inferred result stayed undetermined.`;
}

function AlgorithmBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
  );
}

export function CalculationExplainer({
  activeSource,
  currentPhase,
  configuredRounds,
  adaptiveDepth,
  characterResponses,
  evaluation,
  evaluating,
  historyCommitteeMean,
  concernsCount,
  undispositionedCount,
  dispositionedCount,
}: CalculationExplainerProps) {
  const condorcet = buildCondorcetShift(characterResponses);
  const voteShifts = condorcet.rows.filter((row) => row.changed).length;
  const metaCounts = buildMetacognitionCounts(characterResponses);
  const totalMeta = Object.values(metaCounts).reduce((sum, value) => sum + value, 0);
  const metaRows = CHARACTERS.map((character) => ({
    id: character.id,
    name: character.name,
    hex: character.accentHex,
    count: metaCounts[character.id as keyof typeof metaCounts],
  })).sort((a, b) => b.count - a.count);
  const completionRate = concernsCount === 0 ? 1 : dispositionedCount / concernsCount;

  return (
    <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-800 marker:hidden">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>&rsaquo;</span>
          Explain these calculations
        </span>
      </summary>

      <div className="space-y-4 border-t border-slate-200 p-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-md border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Run source and phase
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 font-semibold text-slate-800">
                {activeSource}
              </span>
              {[1, 2, 3].map((phase) => (
                <span
                  key={phase}
                  className={`rounded-full border px-2 py-0.5 ${
                    currentPhase >= phase
                      ? "border-sky-200 bg-sky-50 text-sky-800"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  Phase {phase}
                </span>
              ))}
              {currentPhase > 3 ? (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-800">
                  Phase {currentPhase}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">
              {phaseExplanation(currentPhase, configuredRounds, adaptiveDepth)}
            </p>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Disposition gate
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded bg-slate-200">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.max(0, Math.min(100, completionRate * 100))}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-900">
                {dispositionedCount}/{concernsCount}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">
              Finalization is ready only when every concern has a completed disposition. Current pending
              count: <span className="font-semibold tabular-nums">{undispositionedCount}</span>.
            </p>
          </section>
        </div>

        <section className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Vote shift calculation
              </div>
              <p className="mt-1 text-xs text-slate-700">
                Round 1 majority: <span className="font-semibold">{condorcet.majorityBefore}</span>{" "}
                to final majority: <span className="font-semibold">{condorcet.majorityAfter}</span>, with{" "}
                <span className="font-semibold tabular-nums">{voteShifts}</span> shifted roles.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
              explicit vote first, keyword fallback second
            </span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            {condorcet.rows.map((row) => (
              <article key={row.name} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                <div className="text-[11px] font-semibold text-slate-900">{row.name}</div>
                <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
                  <span className={`rounded-full border px-1.5 py-0.5 ${voteTone[row.before]}`}>
                    {row.before}
                  </span>
                  <span className="text-slate-400" aria-hidden>
                    →
                  </span>
                  <span className={`rounded-full border px-1.5 py-0.5 ${voteTone[row.after]}`}>
                    {row.after}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  <span className={`rounded border px-1 py-0.5 ${sourceTone[row.beforeSource]}`}>
                    R1 {row.beforeSource}
                  </span>
                  <span className={`rounded border px-1 py-0.5 ${sourceTone[row.afterSource]}`}>
                    final {row.afterSource}
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-3">
            <AlgorithmBlock>{`for each role:
  before = inferVote(round1Text)
  after  = inferVote(latestDeliberationText)
  shifted = before != after

majority = count(Aye) > count(Nay) ? Aye
         : count(Nay) > count(Aye) ? Nay
         : Undetermined`}</AlgorithmBlock>
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-md border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Confidence score
            </div>
            {evaluating && !evaluation ? (
              <p className="mt-2 text-xs text-amber-700">Evaluator is scoring the transcript.</p>
            ) : evaluation ? (
              <>
                <div className="mt-2 grid grid-cols-5 gap-1">
                  {Object.entries(evaluation.scores).map(([key, value]) => (
                    <div key={key} className="rounded border border-slate-200 bg-slate-50 p-2 text-center">
                      <div className="text-[10px] uppercase leading-tight text-slate-500">
                        {key
                          .split("_")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                        {value.score}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700">
                  Average <span className="font-semibold tabular-nums">{evaluation.average.toFixed(1)}</span>
                  /5. {tierExplanation(evaluation.average)}
                  {historyCommitteeMean !== null ? (
                    <>
                      {" "}
                      Runs mean:{" "}
                      <span className="font-semibold tabular-nums">{historyCommitteeMean.toFixed(1)}</span>.
                    </>
                  ) : null}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-600">No evaluator score yet.</p>
            )}
            <div className="mt-3">
              <AlgorithmBlock>{`average = sum(5 rubric scores) / 5
tier = average >= 4.0 ? STRONG
     : average >= 3.0 ? ADEQUATE
     : WEAK
runs mean = average(committee scores for this question)`}</AlgorithmBlock>
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Metacognition proxy
            </div>
            <div className="mt-2 flex h-3 overflow-hidden rounded bg-slate-200">
              {metaRows
                .filter((row) => row.count > 0)
                .map((row) => (
                  <div
                    key={row.id}
                    title={`${row.name}: ${row.count}`}
                    style={{
                      width: `${totalMeta === 0 ? 0 : (row.count / totalMeta) * 100}%`,
                      backgroundColor: row.hex,
                    }}
                  />
                ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {metaRows.map((row) => (
                <div key={row.id} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.hex }} />
                  <span className="w-14 font-semibold text-slate-800">{row.name}</span>
                  <span className="w-6 tabular-nums text-slate-900">{row.count}</span>
                  <span className="text-slate-500">{metaKeywordLabels[row.id]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <AlgorithmBlock>{`metacognition total =
  count role-specific keywords in round1 + latest text

leader = role with highest keyword count
bar width here = role count / total count

maya    = /\b(incentive|benefit|insulated|governance|power)\b/g
frankie = /\b(value|ethical|dignity|harm|legitimacy)\b/g
joe     = /\b(before|precedent|history|memory|tried)\b/g
vic     = /\b(evidence|falsif|base rate|test|measur)\b/g
tammy   = /\b(feedback|second-order|system|loop|atrophy)\b/g`}</AlgorithmBlock>
            </div>
          </section>
        </div>
      </div>
    </details>
  );
}
