import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";
import { buildCondorcetShift, buildMetacognitionCounts } from "@/lib/insights";
import { CharacterRoundState } from "@/lib/types";

interface CommitteeDynamicsPanelProps {
  characterResponses: Record<string, CharacterRoundState>;
}

export function CommitteeDynamicsPanel({ characterResponses }: CommitteeDynamicsPanelProps) {
  const condorcet = buildCondorcetShift(characterResponses);
  const meta = buildMetacognitionCounts(characterResponses);
  const maxMentions = Math.max(meta.maya, meta.frankie, meta.joe, meta.vic, meta.tammy, 1);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
        Committee Dynamics
      </div>
      <p className="mb-3 text-sm text-slate-700">
        Analytics for the deliberation: who shifted (Condorcet lens) and how much metacognitive pressure
        each role contributed. The live interaction graph appears next to the streaming threads above.
      </p>
      <TechnicalBreakout className="mb-3 bg-slate-50" title="Condorcet transitions and metacognition pressure">
        <p>
          The dynamics panel reports derived signals from the committee transcript. Vote transitions are
          inferred from each role text. Metacognition pressure is a role-specific keyword count, normalized
          by the highest role count in this panel so the largest bar is 100%.
        </p>
        <AlgorithmBlock>{`maxMentions = max(maya, frankie, joe, vic, tammy, 1)
barWidth(role) = max(5%, pressure[role] / maxMentions * 100%)

pressure keywords:
  Maya    incentive | benefit | insulated | governance | power
  Frankie value | ethical | dignity | harm | legitimacy
  Joe     before | precedent | history | memory | tried
  Vic     evidence | falsif | base rate | test | measur
  Tammy   feedback | second-order | system | loop | atrophy`}</AlgorithmBlock>
      </TechnicalBreakout>

      <div className="grid gap-3">
        <article className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="rounded border border-slate-200 bg-white p-2 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">Condorcet Shift</div>
            <div className="mt-1">
              Majority: {condorcet.majorityBefore} -&gt; {condorcet.majorityAfter}
            </div>
            <div>Inferred vote shifts: {condorcet.rows.filter((row) => row.changed).length}</div>
          </div>

          <div className="rounded border border-slate-200 bg-white p-2">
            <div className="mb-2 text-sm font-semibold text-slate-900">
              Vote Transition (Round 1 -&gt; 2)
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              {condorcet.rows.map((row) => (
                <div
                  key={row.name}
                  className="flex justify-between rounded border border-slate-200 px-2 py-1"
                >
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
              `declared` = explicit vote statement found; `fallback` = lexical inference.
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-white p-2">
            <div className="mb-2 text-sm font-semibold text-slate-900">Metacognition Pressure</div>
            <p className="mb-2 text-[11px] text-slate-500">
              Counts role-specific challenge keywords; bars are scaled against the highest role count, not
              against the total.
            </p>
            <div className="space-y-2 text-xs text-slate-700">
              {[
                { label: "Maya", value: meta.maya },
                { label: "Frankie", value: meta.frankie },
                { label: "Joe", value: meta.joe },
                { label: "Vic", value: meta.vic },
                { label: "Tammy", value: meta.tammy },
              ].map((entry) => (
                <div key={entry.label}>
                  <div className="mb-0.5 flex justify-between">
                    <span>{entry.label}</span>
                    <span>{entry.value}</span>
                  </div>
                  <div className="h-2 rounded bg-slate-100">
                    <div
                      className="h-2 rounded bg-sky-500"
                      style={{ width: `${Math.max(5, (entry.value / maxMentions) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
