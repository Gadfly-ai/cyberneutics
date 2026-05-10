import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";
import { CHARACTERS } from "@/lib/characters";
import { buildCondorcetShift, buildMetacognitionCounts } from "@/lib/insights";
import {
  buildInteractionEdges,
  edgeColor,
  MINI_POSITIONS,
  nodeFillForState,
  NodeName,
  RESEARCH_RUNNING_FILL,
  voteChangeRingColor,
} from "@/lib/networkGraph";
import { CharacterRoundState } from "@/lib/types";

interface CommitteeNetworkMiniProps {
  characterResponses: Record<string, CharacterRoundState>;
}

export function CommitteeNetworkMini({ characterResponses }: CommitteeNetworkMiniProps) {
  const condorcet = buildCondorcetShift(characterResponses);
  const meta = buildMetacognitionCounts(characterResponses);
  const edges = buildInteractionEdges(characterResponses);

  const metaByName: Record<NodeName, number> = {
    Maya: meta.maya,
    Frankie: meta.frankie,
    Joe: meta.joe,
    Vic: meta.vic,
    Tammy: meta.tammy,
  };
  const maxMentions = Math.max(...Object.values(metaByName), 1);

  const researchByName = CHARACTERS.reduce<Record<NodeName, CharacterRoundState["researchState"]>>(
    (acc, character) => {
      acc[character.name as NodeName] =
        characterResponses[character.id]?.researchState ?? "idle";
      return acc;
    },
    { Maya: "idle", Frankie: "idle", Joe: "idle", Vic: "idle", Tammy: "idle" },
  );

  const anyResearchRunning = Object.values(researchByName).some((state) => state === "running");

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Live Interaction
        </div>
        {anyResearchRunning ? (
          <span className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            researching
          </span>
        ) : null}
      </div>

      <svg
        viewBox="0 0 240 320"
        className="w-full rounded-md border border-slate-200 bg-slate-50"
        role="img"
        aria-label="Live committee interaction network"
      >
        {edges.map((edge, idx) => {
          const from = MINI_POSITIONS[edge.from];
          const to = MINI_POSITIONS[edge.to];
          return (
            <line
              key={`${edge.from}-${edge.to}-${idx}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edgeColor(edge.weight)}
              strokeWidth={1 + 0.6 * edge.weight}
              strokeOpacity={0.7}
            />
          );
        })}

        {condorcet.rows.map((row) => {
          const name = row.name as NodeName;
          const pos = MINI_POSITIONS[name];
          const ringScale = metaByName[name] / maxMentions;
          const research = researchByName[name];
          const fill = nodeFillForState(row.after, research);
          const isResearching = research === "running";

          return (
            <g key={name} transform={`translate(${pos.x},${pos.y})`}>
              <circle
                r={18 + ringScale * 4}
                fill="none"
                stroke={voteChangeRingColor(row.changed)}
                strokeWidth={1.5 + ringScale}
              />
              <circle r={16} fill={fill} />
              {isResearching ? (
                <circle
                  r={20}
                  fill="none"
                  stroke={RESEARCH_RUNNING_FILL}
                  strokeWidth={1.25}
                  strokeOpacity={0.6}
                  strokeDasharray="3 3"
                />
              ) : null}
              <text
                x={0}
                y={3}
                textAnchor="middle"
                fontSize={9}
                fill="#ffffff"
                className="font-semibold"
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600">
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
          Researching
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border border-amber-500" />
          Vote changed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-px w-3 bg-sky-500" />
          Cross-talk
        </span>
      </div>
      <TechnicalBreakout className="mt-2 bg-slate-50" title="node size, rings, fills, and cross-talk edges">
        <p>
          The graph is a compact derived view of the same transcript. It is not a semantic conversation
          graph; edges are literal name mentions during cross-examination text only.
        </p>
        <AlgorithmBlock>{`edge(fromRole, toRole).weight =
  count(case-insensitive whole-word mentions of toRole.name in fromRole.phase2)

edge color:
  weight >= 3 -> strong sky
  weight == 2 -> medium sky
  otherwise  -> slate

node fill =
  research is running ? violet
  : inferred final vote Aye ? green
  : inferred final vote Nay ? red
  : gray

node ring = amber if inferred vote changed, slate otherwise
node radius = 18 + (metacognitionPressure / maxPressure) * 4`}</AlgorithmBlock>
      </TechnicalBreakout>
    </section>
  );
}
