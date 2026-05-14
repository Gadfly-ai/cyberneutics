"use client";

import type { ReactElement } from "react";

import { VoteLabel } from "@/lib/voteInference";

const ORDER: VoteLabel[] = ["Aye", "Nay", "Undetermined"];

const NODE_COLOR: Record<VoteLabel, string> = {
  Aye: "#10b981",
  Nay: "#f43f5e",
  Undetermined: "#64748b",
};

export interface VoteTransitionRow {
  before: VoteLabel;
  after: VoteLabel;
}

function buildTransitionCounts(rows: VoteTransitionRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.before}|${row.after}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function nodeY(index: number, laneHeight: number, top: number): number {
  return top + index * laneHeight + laneHeight / 2;
}

interface VoteTransitionFlowSvgProps {
  rows: VoteTransitionRow[];
  className?: string;
}

export function VoteTransitionFlowSvg({ rows, className = "" }: VoteTransitionFlowSvgProps) {
  const counts = buildTransitionCounts(rows);
  const maxCount = Math.max(1, ...counts.values());

  const w = 280;
  const h = 168;
  const leftX = 56;
  const rightX = w - 56;
  const laneHeight = 44;
  const top = 18;
  const labelOffset = 14;

  const paths: ReactElement[] = [];
  for (const [key, count] of counts) {
    if (count === 0) continue;
    const [from, to] = key.split("|") as [VoteLabel, VoteLabel];
    const i0 = ORDER.indexOf(from);
    const i1 = ORDER.indexOf(to);
    if (i0 < 0 || i1 < 0) continue;
    const y0 = nodeY(i0, laneHeight, top);
    const y1 = nodeY(i1, laneHeight, top);
    const strokeW = 1.5 + (count / maxCount) * 7;
    const midX = (leftX + rightX) / 2;
    const d = `M ${leftX} ${y0} C ${midX} ${y0}, ${midX} ${y1}, ${rightX} ${y1}`;
    paths.push(
      <path
        key={key}
        d={d}
        fill="none"
        stroke={NODE_COLOR[from]}
        strokeWidth={strokeW}
        strokeOpacity={0.45}
        strokeLinecap="round"
      />,
    );
  }

  return (
    <div className={className}>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        Vote movement (R1 → cross-exam)
      </div>
      <p className="mb-2 text-[10px] leading-snug text-slate-500">
        Band width scales with how many roles took each inferred transition. Gray = undetermined.
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label="Sankey-style diagram of inferred vote transitions between rounds"
      >
        {paths}
        {ORDER.map((vote, i) => {
          const y = nodeY(i, laneHeight, top);
          const color = NODE_COLOR[vote];
          return (
            <g key={vote}>
              <text
                x={leftX - labelOffset}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-slate-700"
                style={{ fontSize: "10px", fontWeight: 600 }}
              >
                {vote === "Undetermined" ? "Undet." : vote}
              </text>
              <circle cx={leftX} cy={y} r={5} fill={color} opacity={0.95} />
              <text
                x={rightX + labelOffset}
                y={y}
                textAnchor="start"
                dominantBaseline="middle"
                className="fill-slate-700"
                style={{ fontSize: "10px", fontWeight: 600 }}
              >
                {vote === "Undetermined" ? "Undet." : vote}
              </text>
              <circle cx={rightX} cy={y} r={5} fill={color} opacity={0.95} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
