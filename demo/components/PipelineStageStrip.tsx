"use client";

type StageState = "waiting" | "running" | "done" | "error";

export interface PipelineStage {
  label: string;
  state: StageState;
  detail: string;
}

function dotClass(state: StageState): string {
  if (state === "running") return "bg-amber-500 ring-2 ring-amber-200 animate-pulse";
  if (state === "done") return "bg-emerald-500 ring-2 ring-emerald-100";
  if (state === "error") return "bg-rose-500 ring-2 ring-rose-100";
  return "bg-slate-300 ring-2 ring-slate-100";
}

function cardClass(state: StageState): string {
  if (state === "running") return "border-amber-300 bg-amber-50/90 text-amber-950";
  if (state === "done") return "border-emerald-200 bg-emerald-50/80 text-emerald-950";
  if (state === "error") return "border-rose-300 bg-rose-50 text-rose-950";
  return "border-slate-200 bg-white text-slate-700";
}

interface PipelineStageStripProps {
  stages: PipelineStage[];
  /** When true, use monospace and tighter labels (cybercool skin). */
  isCybercool?: boolean;
}

export function PipelineStageStrip({ stages, isCybercool = false }: PipelineStageStripProps) {
  const font = isCybercool ? "font-mono" : "";

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/90 to-white px-3 py-3 shadow-sm ${font}`}
      aria-label="Pipeline stages: naive output through stored snapshot"
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        Pipeline (staged composition)
      </div>
      <p className="mb-3 text-[11px] leading-snug text-slate-600">
        Same question flows through single-call capture, optional research, two deliberation phases,
        independent evaluation, then an evidence snapshot. This is the architecture story the rubric scores
        summarize.
      </p>
      <div className="flex min-w-0 items-stretch gap-0 overflow-x-auto pb-1">
        {stages.map((stage, index) => (
          <div key={stage.label} className="flex min-w-0 items-stretch">
            <div
              className={`flex min-w-[5.5rem] max-w-[8.5rem] flex-col rounded-lg border px-2 py-2 ${cardClass(stage.state)}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass(stage.state)}`} />
                <span className="truncate text-[11px] font-semibold leading-tight">{stage.label}</span>
              </div>
              <div className="mt-1 truncate text-[10px] leading-snug opacity-90" title={stage.detail}>
                {stage.detail}
              </div>
            </div>
            {index < stages.length - 1 ? (
              <div
                className="flex w-4 shrink-0 items-center justify-center text-slate-300"
                aria-hidden
              >
                <svg width="10" height="20" viewBox="0 0 10 20" className="text-slate-300">
                  <path d="M1 4 L7 10 L1 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
