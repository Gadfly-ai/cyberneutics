import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";
import { buildCondorcetShift, buildMetacognitionDetail, formatMetacognitionHitSummary } from "@/lib/insights";
import { CharacterRoundState } from "@/lib/types";

interface CommitteeDynamicsPanelProps {
  characterResponses: Record<string, CharacterRoundState>;
}

export function CommitteeDynamicsPanel({ characterResponses }: CommitteeDynamicsPanelProps) {
  const condorcet = buildCondorcetShift(characterResponses);
  const metaDetail = buildMetacognitionDetail(characterResponses);
  const maxMentions = Math.max(
    metaDetail.maya.total,
    metaDetail.frankie.total,
    metaDetail.joe.total,
    metaDetail.vic.total,
    metaDetail.tammy.total,
    1,
  );

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
          inferred from each role text. Metacognition pressure is a role-specific keyword count (each hit is
          a literal match in the transcript, listed under each role). Bars are split by round: lighter =
          round 1, darker = round 2 (cross-examination). Total bar length is normalized to the highest role
          total in this panel so the largest bar is 100%.
        </p>
        <AlgorithmBlock>{`maxMentions = max(maya, frankie, joe, vic, tammy, 1)
barOuterWidth(role) = max(5%, total(role) / maxMentions * 100%)
inside the filled bar: round1 fraction = sky-400, round2 fraction = sky-700

pressure keywords:
  Maya    incentive | benefit | insulated | governance | power
  Frankie value | ethical | dignity | harm | legitimacy
  Joe     before | precedent | history | memory | tried
  Vic     evidence | falsif* | falsification | base rate | test | measur*
  Tammy   feedback | second-order | second order | system | loop | atrophy`}</AlgorithmBlock>
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
              Counts role-specific challenge keywords; total bar length is scaled to the highest role count
              in this panel. Each bar is a pressure pattern: round 1 (lighter) vs round 2 (darker). Below,
              matched words aggregate both rounds (lower-cased).
            </p>
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-4 rounded-sm bg-sky-400" />
                Round 1
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-4 rounded-sm bg-sky-700" />
                Round 2
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              {(
                [
                  { label: "Maya", key: "maya" as const },
                  { label: "Frankie", key: "frankie" as const },
                  { label: "Joe", key: "joe" as const },
                  { label: "Vic", key: "vic" as const },
                  { label: "Tammy", key: "tammy" as const },
                ] as const
              ).map((entry) => {
                const { total, hits, round1, round2 } = metaDetail[entry.key];
                const hitSummary = formatMetacognitionHitSummary(hits);
                const outerPct = Math.max(5, (total / maxMentions) * 100);
                return (
                  <div key={entry.label}>
                    <div className="mb-0.5 flex justify-between">
                      <span>{entry.label}</span>
                      <span className="tabular-nums text-slate-600" title="Round 1 / Round 2 counts">
                        {total}
                        <span className="font-normal text-slate-400">
                          {" "}
                          ({round1.total}/{round2.total})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded bg-slate-100">
                      <div
                        className="flex h-2 overflow-hidden rounded"
                        style={{ width: `${outerPct}%` }}
                        title={`Round 1: ${round1.total} · Round 2: ${round2.total}`}
                      >
                        {total > 0 ? (
                          <>
                            <div
                              className="h-full min-w-0 bg-sky-400"
                              style={{ flexGrow: round1.total, flexBasis: 0 }}
                            />
                            <div
                              className="h-full min-w-0 bg-sky-700"
                              style={{ flexGrow: round2.total, flexBasis: 0 }}
                            />
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      <span className="font-medium text-slate-600">Matched: </span>
                      {hitSummary}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
