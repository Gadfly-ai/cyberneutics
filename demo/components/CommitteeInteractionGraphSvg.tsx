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

interface CommitteeInteractionGraphSvgProps {
  characterResponses: Record<string, CharacterRoundState>;
  className?: string;
  "aria-label"?: string;
}

export function CommitteeInteractionGraphSvg({
  characterResponses,
  className = "h-auto w-full max-h-[min(32svh,14rem)] sm:max-h-[min(40svh,18rem)] md:max-h-[min(45dvh,20rem)] rounded-md border border-slate-200 bg-slate-50",
  "aria-label": ariaLabel = "Committee interaction network",
}: CommitteeInteractionGraphSvgProps) {
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

  return (
    <svg
      viewBox="0 0 240 320"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label={ariaLabel}
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
  );
}
