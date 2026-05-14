"use client";

import { EvaluationResult } from "@/lib/types";

const RUBRIC_KEYS = [
  "perspective_completeness",
  "tradeoff_explicitness",
  "assumption_surfacing",
  "evidence_standards",
  "reasoning_completeness",
] as const;

const SHORT_LABELS = ["Perspective", "Tradeoffs", "Assumptions", "Evidence", "Reasoning"];

function polar(cx: number, cy: number, radius: number, angleRad: number): { x: number; y: number } {
  return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) };
}

function polygonPoints(scores: number[], cx: number, cy: number, maxR: number): string {
  const n = scores.length;
  const parts: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (Math.min(5, Math.max(0, scores[i] ?? 0)) / 5) * maxR;
    const p = polar(cx, cy, r, angle);
    parts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return parts.join(" ");
}

interface RubricRadarChartProps {
  naiveEvaluation: EvaluationResult | null;
  committeeEvaluation: EvaluationResult | null;
  className?: string;
}

export function RubricRadarChart({
  naiveEvaluation,
  committeeEvaluation,
  className = "",
}: RubricRadarChartProps) {
  if (!naiveEvaluation && !committeeEvaluation) return null;

  const naiveScores = RUBRIC_KEYS.map((k) => naiveEvaluation?.scores[k].score ?? 0);
  const committeeScores = RUBRIC_KEYS.map((k) => committeeEvaluation?.scores[k].score ?? 0);

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 78;
  const n = RUBRIC_KEYS.length;

  const gridRings = [1, 2, 3, 4, 5].map((step) => (step / 5) * maxR);

  const axisLines = Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const outer = polar(cx, cy, maxR, angle);
    return (
      <line
        key={`axis-${i}`}
        x1={cx}
        y1={cy}
        x2={outer.x}
        y2={outer.y}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
    );
  });

  const labels = Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const labelR = maxR + 22;
    const p = polar(cx, cy, labelR, angle);
    return (
      <text
        key={`lab-${i}`}
        x={p.x}
        y={p.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-600"
        style={{ fontSize: "9px", fontWeight: 600 }}
      >
        {SHORT_LABELS[i]}
      </text>
    );
  });

  const naivePoly = polygonPoints(naiveScores, cx, cy, maxR);
  const committeePoly = polygonPoints(committeeScores, cx, cy, maxR);

  return (
    <div className={className}>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        Rubric shape (1–5)
      </div>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full max-w-[240px]"
        role="img"
        aria-label="Radar chart comparing naive and committee rubric scores"
      >
        {gridRings.map((r) => (
          <polygon
            key={r}
            points={polygonPoints([5, 5, 5, 5, 5], cx, cy, r)}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={1}
          />
        ))}
        {axisLines}
        {labels}
        <polygon
          points={naivePoly}
          fill="rgb(100 116 139 / 0.18)"
          stroke="rgb(100 116 139)"
          strokeWidth={1.5}
        />
        <polygon
          points={committeePoly}
          fill="rgb(5 150 105 / 0.15)"
          stroke="rgb(5 150 105)"
          strokeWidth={1.75}
        />
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded-sm bg-slate-500" />
          Naive
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded-sm bg-emerald-600" />
          Committee
        </span>
      </div>
    </div>
  );
}
