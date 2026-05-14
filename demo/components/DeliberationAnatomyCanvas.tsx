import { CommitteeInteractionGraphSvg } from "@/components/CommitteeInteractionGraphSvg";
import { MetacognitionPhaseBars } from "@/components/MetacognitionPhaseBars";
import { RubricRadarChart } from "@/components/RubricRadarChart";
import { TechnicalBreakout } from "@/components/TechnicalBreakout";
import { VoteCompositionBar, voteTallySummary } from "@/components/VoteCompositionBar";
import { VoteTransitionFlowSvg } from "@/components/VoteTransitionFlowSvg";
import { CHARACTERS } from "@/lib/characters";
import { anyCharacterStreaming, buildCondorcetShift, sumMetacognitionPhaseTotals } from "@/lib/insights";
import { CharacterRoundState, EvaluationResult } from "@/lib/types";

const rubricKeys = [
  "perspective_completeness",
  "tradeoff_explicitness",
  "assumption_surfacing",
  "evidence_standards",
  "reasoning_completeness",
] as const;

const votePillClass: Record<string, string> = {
  Aye: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Nay: "border-rose-200 bg-rose-50 text-rose-900",
  Undetermined: "border-slate-200 bg-slate-100 text-slate-800",
};

/** Text-only hint for compact inline source tags (avoids nested pill backgrounds). */
const sourceMicroClass: Record<string, string> = {
  declared: "text-sky-800",
  fallback: "text-amber-900",
};

interface DeliberationAnatomyCanvasProps {
  characterResponses: Record<string, CharacterRoundState>;
  naiveEvaluation: EvaluationResult | null;
  committeeEvaluation: EvaluationResult | null;
  presentationMode?: boolean;
  currentPhase?: number;
  isRunning?: boolean;
}

function hasDeliberationText(state: Record<string, CharacterRoundState>): boolean {
  return CHARACTERS.some((c) => {
    const s = state[c.id];
    return (s?.phase1?.trim().length ?? 0) > 0 || (s?.phase2?.trim().length ?? 0) > 0;
  });
}

export function DeliberationAnatomyCanvas({
  characterResponses,
  naiveEvaluation,
  committeeEvaluation,
  presentationMode = false,
  currentPhase = 0,
  isRunning = false,
}: DeliberationAnatomyCanvasProps) {
  const populated = hasDeliberationText(characterResponses);
  const condorcet = buildCondorcetShift(characterResponses);
  const metaPhases = sumMetacognitionPhaseTotals(characterResponses);
  const streaming = anyCharacterStreaming(characterResponses);
  const r1Provisional = currentPhase === 1 && streaming;
  const finalProvisional = currentPhase >= 2 && streaming;

  const shell = presentationMode
    ? "rounded-lg border border-slate-200 bg-white p-3 shadow-none"
    : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <section className={shell}>
      <div className="mb-3 border-b border-slate-200 pb-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Deliberation anatomy
        </div>
        <p
          className={`mt-1 text-slate-700 ${presentationMode ? "text-sm leading-relaxed" : "text-sm"}`}
        >
          Current run: vote assembly, cross-talk network (node size reflects metacognition keyword
          pressure), and evaluator rubric profile on a 1–5 scale.
        </p>
        {populated ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="font-medium text-slate-700">Inferred vote lens:</span>
            <span
              className={`rounded-full border px-2 py-0.5 font-semibold ${votePillClass[condorcet.majorityBefore] ?? votePillClass.Undetermined}`}
            >
              R1 {condorcet.majorityBefore}
              {r1Provisional ? " · prov." : ""}
            </span>
            <span className="text-slate-400" aria-hidden>
              →
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-semibold ${votePillClass[condorcet.majorityAfter] ?? votePillClass.Undetermined}`}
            >
              Final {condorcet.majorityAfter}
              {finalProvisional ? " · prov." : ""}
            </span>
            {r1Provisional || finalProvisional ? (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-900">
                Live
              </span>
            ) : isRunning && !streaming ? (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-600">
                Between turns
              </span>
            ) : null}
            {condorcet.meaningfulDifference ? (
              <span className="font-medium text-amber-800">Majority flipped</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {!populated ? (
        <p className="text-sm text-slate-600">Run the committee to populate this canvas.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Vote assembly
            </div>
            <div className="mb-3 space-y-2 rounded border border-slate-200 bg-white p-2">
              <div>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-600">
                  <span className="font-medium text-slate-800">Round 1 composition</span>
                  <span className="tabular-nums">
                    {voteTallySummary(condorcet.tallyBefore)} · margin {condorcet.marginBefore}
                  </span>
                </div>
                <VoteCompositionBar tally={condorcet.tallyBefore} className="h-2.5" />
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-600">
                  <span className="font-medium text-slate-800">Cross-exam composition</span>
                  <span className="tabular-nums">
                    {voteTallySummary(condorcet.tallyAfter)} · margin {condorcet.marginAfter}
                  </span>
                </div>
                <VoteCompositionBar tally={condorcet.tallyAfter} className="h-2.5" />
              </div>
            </div>
            <VoteTransitionFlowSvg rows={condorcet.rows} className="mt-3" />
            <div className="space-y-1">
              {condorcet.rows.map((row) => {
                const beforeC = votePillClass[row.before] ?? votePillClass.Undetermined;
                const afterC = votePillClass[row.after] ?? votePillClass.Undetermined;
                const bs = sourceMicroClass[row.beforeSource] ?? sourceMicroClass.fallback;
                const afs = sourceMicroClass[row.afterSource] ?? sourceMicroClass.fallback;
                const srcAbbr = (s: string) => (s === "declared" ? "dec" : s === "fallback" ? "fb" : s);
                return (
                  <div
                    key={row.name}
                    className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] leading-tight text-slate-800"
                  >
                    <span className="w-[4.25rem] shrink-0 truncate font-semibold text-slate-900">
                      {row.name}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-0.5">
                      <span
                        className={`inline-flex items-baseline gap-0.5 rounded border px-1 py-px font-medium ${beforeC}`}
                      >
                        {row.before}
                        <span className={`text-[8px] font-semibold uppercase leading-none ${bs}`}>
                          {srcAbbr(row.beforeSource)}
                        </span>
                      </span>
                      <span className="shrink-0 text-slate-400" aria-hidden>
                        →
                      </span>
                      <span
                        className={`inline-flex items-baseline gap-0.5 rounded border px-1 py-px font-medium ${afterC}`}
                      >
                        {row.after}
                        <span className={`text-[8px] font-semibold uppercase leading-none ${afs}`}>
                          {srcAbbr(row.afterSource)}
                        </span>
                      </span>
                    </span>
                    {row.changed ? (
                      <span className="ml-auto shrink-0 rounded border border-amber-300 bg-amber-50 px-1 py-px text-[8px] font-semibold uppercase text-amber-900">
                        shift
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Cross-talk and pressure
            </div>
            <CommitteeInteractionGraphSvg
              characterResponses={characterResponses}
              className="h-auto w-full max-h-[min(40dvh,18rem)] rounded-md border border-slate-200 bg-slate-50"
            />
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
                Aye
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-rose-600" />
                Nay
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-slate-500" />
                Undet.
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
                Research
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full border-2 border-amber-500" />
                Vote changed
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-0.5 w-4 bg-sky-500" />
                Mention edge
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-snug text-slate-500">
              Larger ring radius = higher role metacognition keyword count (same scaling as the sticky
              graph). Edges count name mentions in phase 2 only.
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Evaluator profile (1–5)
            </div>
            {!naiveEvaluation && !committeeEvaluation ? (
              <p className="text-xs text-slate-600">Run evaluations to compare rubric scores.</p>
            ) : (
              <div className="space-y-3">
                <RubricRadarChart naiveEvaluation={naiveEvaluation} committeeEvaluation={committeeEvaluation} />
                <div className="flex gap-3 text-[10px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-4 rounded bg-slate-500" />
                    Naive
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-4 rounded bg-emerald-600" />
                    Committee
                  </span>
                </div>
                {rubricKeys.map((key) => {
                  const naive = naiveEvaluation?.scores[key].score ?? 0;
                  const committee = committeeEvaluation?.scores[key].score ?? 0;
                  return (
                    <div key={key}>
                      <div className="mb-0.5 flex justify-between text-[10px] text-slate-700">
                        <span className="font-medium capitalize">{key.replaceAll("_", " ")}</span>
                        <span className="tabular-nums text-slate-600">
                          {naive}/{committee}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 overflow-hidden rounded bg-slate-200">
                          <div
                            className="h-full rounded bg-slate-500"
                            style={{ width: `${Math.min(100, (naive / 5) * 100)}%` }}
                          />
                        </div>
                        <div className="h-1.5 overflow-hidden rounded bg-slate-200">
                          <div
                            className="h-full rounded bg-emerald-600"
                            style={{ width: `${Math.min(100, (committee / 5) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {naiveEvaluation && committeeEvaluation ? (
                  <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-700">
                    <span className="font-semibold">Averages: </span>
                    <span className="tabular-nums">{naiveEvaluation.average.toFixed(1)}</span>
                    <span className="text-slate-400"> vs </span>
                    <span className="tabular-nums font-medium text-emerald-800">
                      {committeeEvaluation.average.toFixed(1)}
                    </span>
                    <span className="text-slate-500">
                      {" "}
                      (Δ {(committeeEvaluation.average - naiveEvaluation.average).toFixed(1)})
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {populated ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <MetacognitionPhaseBars round1={metaPhases.round1} round2={metaPhases.round2} />
        </div>
      ) : null}

      {!presentationMode ? (
        <TechnicalBreakout className="mt-4 bg-slate-50" title="how this canvas composes derived signals">
          <p className="text-xs text-slate-700">
            Vote assembly uses the same inference rules as the Condorcet panels. The network graphic is
            shared with the sticky sidebar graph. Rubric rows reuse the five evaluator dimensions from the
            full evaluation cards.
          </p>
        </TechnicalBreakout>
      ) : null}
    </section>
  );
}
