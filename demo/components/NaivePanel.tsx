interface NaivePanelProps {
  text: string;
  streaming: boolean;
  sourceLabel?: string;
  presentationMode?: boolean;
}

export function NaivePanel({
  text,
  streaming,
  sourceLabel,
  presentationMode = false,
}: NaivePanelProps) {
  return (
    <section className="flex h-[min(70vh,42rem)] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="shrink-0 border-b border-slate-200 pb-2">
        <h2 className="text-base font-semibold text-slate-900" title="A single model call with no deliberation — the baseline">NAIVE CALL</h2>
        <p className="text-xs text-slate-600">One voice, one narrative, early convergence</p>
        {sourceLabel ? (
          <div className="mt-2 inline-block rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
            {sourceLabel}
          </div>
        ) : null}
      </div>
      <div className="mb-3 mt-3 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
        Value limitation: low perspective diversity
      </div>
      <div
        className={`min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-slate-800 ${
          presentationMode ? "text-base leading-7" : "text-sm leading-6"
        }`}
      >
        {text || (streaming ? "Streaming..." : "Run the demo to compare outputs.")}
      </div>
    </section>
  );
}
