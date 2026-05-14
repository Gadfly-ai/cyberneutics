"use client";

interface MetacognitionPhaseBarsProps {
  round1: number;
  round2: number;
  className?: string;
}

export function MetacognitionPhaseBars({ round1, round2, className = "" }: MetacognitionPhaseBarsProps) {
  const max = Math.max(1, round1, round2);
  const r1w = (round1 / max) * 100;
  const r2w = (round2 / max) * 100;
  const delta = round2 - round1;

  return (
    <div className={className}>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        Metacognition pressure by phase
      </div>
      <p className="mb-2 text-[10px] leading-snug text-slate-500">
        Role keyword hits summed across the committee: round 1 vs cross-examination. Higher round 2 often
        means challenge density increased after responses were visible.
      </p>
      <div className="space-y-2">
        <div>
          <div className="mb-0.5 flex justify-between text-[10px] text-slate-700">
            <span className="font-medium">Round 1</span>
            <span className="tabular-nums text-slate-600">{round1}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded bg-slate-200">
            <div
              className="h-full rounded bg-sky-600"
              style={{ width: `${r1w}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-0.5 flex justify-between text-[10px] text-slate-700">
            <span className="font-medium">Cross-exam</span>
            <span className="tabular-nums text-slate-600">{round2}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded bg-slate-200">
            <div
              className="h-full rounded bg-violet-600"
              style={{ width: `${r2w}%` }}
            />
          </div>
        </div>
        <div className="text-[10px] text-slate-600">
          Δ (cross-exam − round 1):{" "}
          <span className={`font-semibold tabular-nums ${delta >= 0 ? "text-violet-800" : "text-amber-800"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        </div>
      </div>
    </div>
  );
}
