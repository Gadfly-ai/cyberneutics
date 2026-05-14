"use client";

export interface ScatterRunPoint {
  runIndex: number;
  delta: number;
  inferredVoteShifts: number;
  majorityAfter: string;
  executionSource: "LOCAL" | "API";
}

function majorityFill(majority: string): string {
  if (majority === "Aye") return "#10b981";
  if (majority === "Nay") return "#f43f5e";
  return "#94a3b8";
}

interface RunLandscapeScatterProps {
  points: ScatterRunPoint[];
  className?: string;
}

export function RunLandscapeScatter({ points, className = "" }: RunLandscapeScatterProps) {
  if (points.length === 0) {
    return (
      <div className={`rounded-md border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-600 ${className}`}>
        Run the same question at least twice to plot quality lift vs. vote movement across runs.
      </div>
    );
  }

  const w = 340;
  const h = 220;
  const padL = 36;
  const padR = 16;
  const padT = 14;
  const padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const deltas = points.map((p) => p.delta);
  const shifts = points.map((p) => p.inferredVoteShifts);
  const minX = Math.min(...deltas);
  const maxX = Math.max(...deltas);
  const minY = Math.min(0, ...shifts);
  const maxY = Math.max(5, ...shifts);
  const rx = maxX - minX || 1;
  const ry = maxY - minY || 1;

  const toX = (dx: number) => padL + ((dx - minX) / rx) * innerW;
  const toY = (sy: number) => padT + innerH - ((sy - minY) / ry) * innerH;

  return (
    <div className={className}>
      <div className="mb-2 text-sm font-semibold text-slate-900">Decision landscape (this question)</div>
      <p className="mb-2 text-xs text-slate-600">
        Each point is one stored run: horizontal axis = evaluator lift (committee − naive average), vertical =
        inferred vote shifts. Color = final majority. Outcomes are independent runs, not learned weights.
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full max-w-[400px]"
        role="img"
        aria-label="Scatter plot of delta versus inferred vote shifts per run"
      >
        <rect x={padL} y={padT} width={innerW} height={innerH} fill="#f8fafc" rx={4} />
        <line
          x1={toX(0)}
          x2={toX(0)}
          y1={padT}
          y2={padT + innerH}
          stroke="#cbd5e1"
          strokeDasharray="4 3"
        />
        {points.map((p) => {
          const cx = toX(p.delta);
          const cy = toY(p.inferredVoteShifts);
          const isApi = p.executionSource === "API";
          return (
            <g key={`${p.runIndex}-${p.delta}-${p.inferredVoteShifts}`}>
              {isApi ? (
                <circle cx={cx} cy={cy} r={7} fill="none" stroke="#0ea5e9" strokeWidth={1.5} />
              ) : null}
              <circle cx={cx} cy={cy} r={5} fill={majorityFill(p.majorityAfter)} opacity={0.9} />
              <text
                x={cx}
                y={cy + 18}
                textAnchor="middle"
                className="fill-slate-500"
                style={{ fontSize: "9px" }}
              >
                #{p.runIndex}
              </text>
            </g>
          );
        })}
        <text
          x={padL + innerW / 2}
          y={h - 10}
          textAnchor="middle"
          className="fill-slate-600"
          style={{ fontSize: "10px", fontWeight: 600 }}
        >
          Quality lift (Δ avg)
        </text>
        <text
          x={12}
          y={padT + innerH / 2}
          textAnchor="middle"
          className="fill-slate-600"
          style={{ fontSize: "10px", fontWeight: 600 }}
          transform={`rotate(-90, 12, ${padT + innerH / 2})`}
        >
          Inferred shifts
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Aye
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Nay
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          Undet.
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border-2 border-sky-500 bg-transparent" />
          API run ring
        </span>
      </div>
    </div>
  );
}
