import { VoteCompositionBar, voteTallySummary } from "@/components/VoteCompositionBar";
import { CHARACTERS } from "@/lib/characters";
import {
  anyCharacterStreaming,
  buildCondorcetShift,
  buildMetacognitionCounts,
  sumMetacognitionPhaseTotals,
} from "@/lib/insights";
import { CharacterRoundState, EvaluationResult } from "@/lib/types";

interface LiveMetricsStripProps {
  characterResponses: Record<string, CharacterRoundState>;
  evaluation: EvaluationResult | null;
  naiveEvaluation?: EvaluationResult | null;
  evaluating: boolean;
  historyCommitteeMean: number | null;
  /** Committee deliberation phase from SSE (0 = idle). */
  currentPhase?: number;
  /** True while a committee run is in flight (used with streaming for provisional labels). */
  isRunning?: boolean;
}

const votePillClass: Record<string, string> = {
  Aye: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Nay: "border-rose-200 bg-rose-50 text-rose-900",
  Undetermined: "border-slate-200 bg-slate-100 text-slate-800",
};

const researchConfidenceDot: Record<"high" | "medium" | "low", string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-rose-400",
};

export function LiveMetricsStrip({
  characterResponses,
  evaluation,
  naiveEvaluation = null,
  evaluating,
  historyCommitteeMean,
  currentPhase = 0,
  isRunning = false,
}: LiveMetricsStripProps) {
  const condorcet = buildCondorcetShift(characterResponses);
  const voteShifts = condorcet.rows.filter((r) => r.changed).length;
  const streaming = anyCharacterStreaming(characterResponses);
  const r1Provisional = currentPhase === 1 && streaming;
  const finalProvisional = currentPhase >= 2 && streaming;

  const metaPhases = sumMetacognitionPhaseTotals(characterResponses);

  const counts = buildMetacognitionCounts(characterResponses);
  const totalMeta = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const metaByCharacter = CHARACTERS.map((c) => ({
    id: c.id,
    name: c.name,
    hex: c.accentHex,
    n: counts[c.id as keyof typeof counts],
  })).filter((row) => row.n > 0);

  metaByCharacter.sort((a, b) => b.n - a.n);
  const leader = metaByCharacter[0] ?? null;
  const runnerUp = metaByCharacter[1] ?? null;

  const researchRows: Array<{ name: string; short: string; conf: "high" | "medium" | "low" }> = [];
  for (const c of CHARACTERS) {
    const packet = characterResponses[c.id]?.researchPacket;
    const conf = packet?.result?.confidence;
    if (conf === "high" || conf === "medium" || conf === "low") {
      researchRows.push({ name: c.name, short: c.name.slice(0, 1), conf });
    }
  }

  const evalBlock =
    evaluating && !evaluation ? (
      <span className="text-amber-700">Committee eval…</span>
    ) : evaluation ? (
      <span className="text-slate-800">
        Committee eval{" "}
        <span className="font-semibold tabular-nums text-slate-900">
          {evaluation.average.toFixed(1)}
        </span>
        /5 ·{" "}
        <span
          className={
            evaluation.tier === "STRONG"
              ? "text-emerald-700"
              : evaluation.tier === "ADEQUATE"
                ? "text-amber-700"
                : "text-rose-700"
          }
        >
          {evaluation.tier}
        </span>
        {historyCommitteeMean !== null ? (
          <span className="ml-1 font-normal text-slate-500">
            (runs mean {historyCommitteeMean.toFixed(1)})
          </span>
        ) : null}
        {naiveEvaluation ? (
          <span className="ml-1 font-normal text-slate-600">
            · vs naive{" "}
            <span className="tabular-nums font-medium text-slate-800">
              {naiveEvaluation.average.toFixed(1)}
            </span>
            {evaluation ? (
              <span className="text-slate-500" title="Delta: committee score minus naive score on the same rubric">
                {" "}
                (Δ {(evaluation.average - naiveEvaluation.average).toFixed(1)})
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    ) : (
      <span className="text-slate-500">Committee eval pending</span>
    );

  const beforeClass = votePillClass[condorcet.majorityBefore] ?? votePillClass.Undetermined;
  const afterClass = votePillClass[condorcet.majorityAfter] ?? votePillClass.Undetermined;

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-2">
      <div className="flex flex-col gap-1 text-[11px] text-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 font-semibold uppercase tracking-wide text-slate-500" title="A lens for tracking how character votes shift during deliberation">Condorcet</span>
          <span className="text-[10px] font-normal normal-case text-slate-500">Inferred vote lens</span>
          {r1Provisional || finalProvisional ? (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-900">
              Live
            </span>
          ) : isRunning && !streaming ? (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
              Between turns
            </span>
          ) : null}
        </div>
        <div className="inline-flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${beforeClass}`}
            title="Inferred majority from round 1 text (keywords + explicit vote lines)"
          >
            R1 {condorcet.majorityBefore}
            {r1Provisional ? " · prov." : ""}
          </span>
          <span className="text-slate-400" aria-hidden>
            →
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${afterClass}`}
            title="Inferred majority from cross-exam text (phase 2)"
          >
            Final {condorcet.majorityAfter}
            {finalProvisional ? " · prov." : ""}
          </span>
          <span className="text-slate-500">
            · {voteShifts} role{voteShifts === 1 ? "" : "s"} shifted
            {condorcet.meaningfulDifference ? (
              <span className="font-medium text-amber-800"> · majority flipped</span>
            ) : null}
          </span>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
              <span className="shrink-0 font-medium text-slate-700">R1</span>
              <span className="tabular-nums">{voteTallySummary(condorcet.tallyBefore)}</span>
              <span className="text-slate-400">·</span>
              <span className="tabular-nums">margin {condorcet.marginBefore}</span>
            </div>
            <VoteCompositionBar tally={condorcet.tallyBefore} className="max-w-[14rem]" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
              <span className="shrink-0 font-medium text-slate-700">Cross-exam</span>
              <span className="tabular-nums">{voteTallySummary(condorcet.tallyAfter)}</span>
              <span className="text-slate-400">·</span>
              <span className="tabular-nums">margin {condorcet.marginAfter}</span>
            </div>
            <VoteCompositionBar tally={condorcet.tallyAfter} className="max-w-[14rem]" />
          </div>
        </div>
        <div className="text-[10px] text-slate-500">
          Inference: R1 declared {condorcet.inferenceDiagnostics.round1.declared}/5 · fallback{" "}
          {condorcet.inferenceDiagnostics.round1.fallback}/5 · cross-exam declared{" "}
          {condorcet.inferenceDiagnostics.round2.declared}/5 · fallback{" "}
          {condorcet.inferenceDiagnostics.round2.fallback}/5
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] leading-snug text-slate-700">
        <span className="shrink-0 font-semibold uppercase tracking-wide text-slate-500">Confidence</span>
        {evalBlock}
        {researchRows.length > 0 ? (
          <span className="inline-flex flex-wrap items-center gap-1.5" title="Per-role research packet confidence">
            <span className="text-slate-500">Research</span>
            {researchRows.map((row) => (
              <span
                key={row.name}
                className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] font-medium text-slate-800"
                title={`${row.name}: ${row.conf}`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${researchConfidenceDot[row.conf]}`}
                  aria-hidden
                />
                {row.short}
              </span>
            ))}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700">
        <span className="shrink-0 font-semibold uppercase tracking-wide text-slate-500" title="Keyword counts for terms like 'risk', 'assumption', 'concern' in the transcript">Metacognition</span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {totalMeta === 0 ? (
            <div
              className="h-2 flex-1 rounded bg-slate-200"
              title="Keyword pressure across roles (updates as text streams)"
            />
          ) : (
            <div
              className="flex h-2 flex-1 overflow-hidden rounded bg-slate-200"
              title="Share of metacognition keyword hits by role"
            >
              {metaByCharacter.map((row) => (
                <div
                  key={row.id}
                  style={{
                    width: `${(row.n / totalMeta) * 100}%`,
                    backgroundColor: row.hex,
                    minWidth: row.n > 0 ? 2 : 0,
                  }}
                />
              ))}
            </div>
          )}
          <span className="shrink-0 tabular-nums font-semibold text-slate-900">{totalMeta}</span>
        </div>
        {leader ? (
          <span className="text-slate-600">
            Led by{" "}
            <span className="font-semibold tabular-nums" style={{ color: leader.hex }}>
              {leader.name}
            </span>
            <span className="tabular-nums text-slate-500"> ({leader.n})</span>
            {runnerUp ? (
              <span className="text-slate-500">
                {" "}
                · {runnerUp.name}{" "}
                <span className="tabular-nums">({runnerUp.n})</span>
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-slate-500">No keyword hits yet</span>
        )}
      </div>

      {metaPhases.round1 + metaPhases.round2 > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
          <span className="shrink-0 font-semibold uppercase tracking-wide text-slate-500">
            Meta (phase)
          </span>
          <span className="tabular-nums text-slate-800">
            R1 {metaPhases.round1}
            <span className="text-slate-400" aria-hidden>
              {" "}
              →{" "}
            </span>
            R2 {metaPhases.round2}
          </span>
          <span
            className={
              metaPhases.delta > 0
                ? "font-medium text-violet-800"
                : metaPhases.delta < 0
                  ? "font-medium text-slate-700"
                  : "text-slate-500"
            }
          >
            Δ {metaPhases.delta > 0 ? "+" : ""}
            {metaPhases.delta}
          </span>
          <span className="text-slate-500">(keyword hits by deliberation phase)</span>
        </div>
      ) : null}
    </div>
  );
}
