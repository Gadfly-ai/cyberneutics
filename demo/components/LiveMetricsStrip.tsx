import { CHARACTERS } from "@/lib/characters";
import { buildCondorcetShift, buildMetacognitionCounts } from "@/lib/insights";
import { CharacterRoundState, EvaluationResult } from "@/lib/types";

interface LiveMetricsStripProps {
  characterResponses: Record<string, CharacterRoundState>;
  evaluation: EvaluationResult | null;
  evaluating: boolean;
  historyCommitteeMean: number | null;
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
  evaluating,
  historyCommitteeMean,
}: LiveMetricsStripProps) {
  const condorcet = buildCondorcetShift(characterResponses);
  const voteShifts = condorcet.rows.filter((r) => r.changed).length;

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
      </span>
    ) : (
      <span className="text-slate-500">Committee eval pending</span>
    );

  const beforeClass = votePillClass[condorcet.majorityBefore] ?? votePillClass.Undetermined;
  const afterClass = votePillClass[condorcet.majorityAfter] ?? votePillClass.Undetermined;

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-2">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700">
        <span className="shrink-0 font-semibold uppercase tracking-wide text-slate-500">Condorcet</span>
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${beforeClass}`}
            title="Inferred majority after round 1"
          >
            R1 {condorcet.majorityBefore}
          </span>
          <span className="text-slate-400" aria-hidden>
            →
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${afterClass}`}
            title="Inferred majority after cross-examination"
          >
            Final {condorcet.majorityAfter}
          </span>
          <span className="text-slate-500">
            · {voteShifts} role{voteShifts === 1 ? "" : "s"} shifted
            {condorcet.meaningfulDifference ? (
              <span className="font-medium text-amber-800"> · majority flipped</span>
            ) : null}
          </span>
        </span>
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
        <span className="shrink-0 font-semibold uppercase tracking-wide text-slate-500">Metacognition</span>
        <div className="flex min-w-[120px] max-w-[200px] flex-1 items-center gap-2">
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
    </div>
  );
}
