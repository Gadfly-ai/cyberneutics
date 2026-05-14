import { CondorcetJuryExplorer } from "@/components/CondorcetJuryExplorer";
import { CHARACTERS } from "@/lib/characters";
import {
  anyCharacterStreaming,
  buildCondorcetShift,
  buildMetacognitionDetail,
  formatMetacognitionHitSummary,
  MetacognitionRoleId,
} from "@/lib/insights";
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
  isRunning?: boolean;
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
  isRunning = false,
}: CalculationExplainerProps) {
  const condorcet = buildCondorcetShift(characterResponses);
  const voteShifts = condorcet.rows.filter((row) => row.changed).length;
  const streaming = anyCharacterStreaming(characterResponses);
  const r1Provisional = currentPhase === 1 && streaming;
  const finalProvisional = currentPhase >= 2 && streaming;
  const metaDetail = buildMetacognitionDetail(characterResponses);
  const totalMeta = Object.values(metaDetail).reduce((sum, role) => sum + role.total, 0);
  const metaRows = CHARACTERS.map((character) => {
    const role = character.id as MetacognitionRoleId;
    const d = metaDetail[role];
    return {
      id: character.id,
      name: character.name,
      hex: character.accentHex,
      count: d.total,
      hitSummary: formatMetacognitionHitSummary(d.hits),
      r1Summary: formatMetacognitionHitSummary(d.round1.hits),
      r2Summary: formatMetacognitionHitSummary(d.round2.hits),
    };
  }).sort((a, b) => b.count - a.count);
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
                Vote shift calculation (inferred vote lens)
              </div>
              <p className="mt-1 text-xs text-slate-700">
                Round 1 majority: <span className="font-semibold">{condorcet.majorityBefore}</span>
                {r1Provisional ? " (provisional while streaming)" : ""} · tallies A
                <span className="tabular-nums">{condorcet.tallyBefore.aye}</span> N
                <span className="tabular-nums">{condorcet.tallyBefore.nay}</span> ?
                <span className="tabular-nums">{condorcet.tallyBefore.undetermined}</span> · margin{" "}
                <span className="tabular-nums">{condorcet.marginBefore}</span>
                <br />
                Cross-exam majority: <span className="font-semibold">{condorcet.majorityAfter}</span>
                {finalProvisional ? " (provisional while streaming)" : ""} · tallies A
                <span className="tabular-nums">{condorcet.tallyAfter.aye}</span> N
                <span className="tabular-nums">{condorcet.tallyAfter.nay}</span> ?
                <span className="tabular-nums">{condorcet.tallyAfter.undetermined}</span> · margin{" "}
                <span className="tabular-nums">{condorcet.marginAfter}</span>
                <br />
                <span className="font-semibold tabular-nums">{voteShifts}</span> role
                {voteShifts === 1 ? "" : "s"} shifted
                {condorcet.meaningfulDifference ? (
                  <span className="font-medium text-amber-800"> · majority flipped</span>
                ) : null}
                {r1Provisional || finalProvisional ? (
                  <span className="font-medium text-amber-800"> · live inference updating</span>
                ) : null}
                {isRunning && !streaming ? (
                  <span className="text-slate-600"> · between streaming turns</span>
                ) : null}
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

          <CondorcetJuryExplorer />
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
            <p className="mt-1 text-[11px] text-slate-500">
              Per-role counts use the regexes below. <span className="font-medium text-slate-600">Matched</span>{" "}
              aggregates both rounds; <span className="font-medium text-slate-600">R1</span> /{" "}
              <span className="font-medium text-slate-600">R2</span> lines show the pressure pattern (where
              keywords appeared) per phase.
            </p>
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
            <div className="mt-3 space-y-2">
              {metaRows.map((row) => (
                <div key={row.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.hex }} />
                    <span className="w-14 shrink-0 font-semibold text-slate-800">{row.name}</span>
                    <span className="w-6 shrink-0 tabular-nums text-slate-900">{row.count}</span>
                    <span className="min-w-0 text-slate-500">{metaKeywordLabels[row.id]}</span>
                  </div>
                  <div className="mt-0.5 pl-6 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-600">Matched: </span>
                    {row.hitSummary}
                  </div>
                  <div className="mt-0.5 pl-6 text-[10px] leading-snug text-slate-500">
                    <span className="font-medium text-slate-600">R1: </span>
                    {row.r1Summary}
                    <span className="text-slate-400"> · </span>
                    <span className="font-medium text-slate-600">R2: </span>
                    {row.r2Summary}
                  </div>
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
vic     = /\b(evidence|falsif\w*|falsification|base rate|test|measur\w*)\b/g
tammy   = /\b(feedback|second[- ]order|system|loop|atrophy)\b/g`}</AlgorithmBlock>
            </div>
          </section>
        </div>
      </div>
    </details>
  );
}
