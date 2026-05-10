interface PresetQuestion {
  category: string;
  label: string;
  question: string;
}

interface BatchProgress {
  current: number;
  total: number;
}

interface QuestionInputProps {
  question: string;
  onQuestionChange: (next: string) => void;
  onRun: () => void;
  deliberationRounds: number;
  onDeliberationRoundsChange: (next: number) => void;
  adaptiveDepth: boolean;
  onAdaptiveDepthChange: (next: boolean) => void;
  presets: readonly PresetQuestion[];
  disabled: boolean;
  presentationMode?: boolean;
  batchRunCount: number;
  onBatchRunCountChange: (next: number) => void;
  onBatchRun: () => void;
  onClearCurrentQuestionRuns: () => void;
  batchProgress: BatchProgress | null;
  sameQuestionRunsCount: number;
}

export function QuestionInput({
  question,
  onQuestionChange,
  onRun,
  deliberationRounds,
  onDeliberationRoundsChange,
  adaptiveDepth,
  onAdaptiveDepthChange,
  presets,
  disabled,
  presentationMode = false,
  batchRunCount,
  onBatchRunCountChange,
  onBatchRun,
  onClearCurrentQuestionRuns,
  batchProgress,
  sameQuestionRunsCount,
}: QuestionInputProps) {
  const groupedPresets = presets.reduce<Record<string, PresetQuestion[]>>((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {});

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        <textarea
          className={`min-h-32 flex-1 rounded-xl border border-slate-300 bg-white p-4 text-slate-900 shadow-inner outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 ${
            presentationMode ? "text-lg leading-8" : "text-base leading-7"
          }`}
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Ask a decision question. The same prompt is sent to both systems..."
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onRun}
          disabled={disabled || !question.trim()}
          className="flex min-h-32 items-center justify-center rounded-xl bg-slate-900 px-8 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:min-w-[180px]"
        >
          {disabled ? "Running..." : "Run Committee"}
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Try a preset
        </div>
        <div className="space-y-1.5">
          {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
            <div key={category} className="flex flex-wrap items-center gap-2">
              <span className="min-w-[88px] text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categoryPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 transition hover:border-sky-500 hover:bg-sky-50 hover:text-slate-900"
                    onClick={() => onQuestionChange(preset.question)}
                    disabled={disabled}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <details className="group rounded-xl border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-slate-700 marker:hidden">
          <span className="inline-flex items-center gap-2">
            <span className="transition group-open:rotate-90">&rsaquo;</span>
            Advanced settings
          </span>
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <span>Deliberation rounds</span>
            <input
              type="number"
              min={2}
              max={6}
              value={deliberationRounds}
              onChange={(event) => onDeliberationRoundsChange(Number(event.target.value) || 2)}
              disabled={disabled}
              className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-sm font-normal normal-case tracking-normal text-slate-800"
            />
          </label>

          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={adaptiveDepth}
              onChange={(event) => onAdaptiveDepthChange(event.target.checked)}
              disabled={disabled}
            />
            Auto-add rounds when outcome stays undetermined
          </label>

          <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Batch runs
              <input
                type="number"
                min={2}
                max={10}
                value={batchRunCount}
                onChange={(event) => onBatchRunCountChange(Number(event.target.value) || 2)}
                disabled={disabled}
                className="ml-2 w-16 rounded border border-slate-300 bg-white px-2 py-1 text-sm font-normal normal-case tracking-normal text-slate-800"
              />
            </label>
            <button
              type="button"
              onClick={onBatchRun}
              disabled={disabled || !question.trim()}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Run Batch
            </button>
            {batchProgress ? (
              <span className="text-xs text-slate-600">
                {batchProgress.current}/{batchProgress.total}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClearCurrentQuestionRuns}
            disabled={disabled || sameQuestionRunsCount === 0}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear runs for current question
            {sameQuestionRunsCount > 0 ? (
              <span className="ml-2 rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                {sameQuestionRunsCount}
              </span>
            ) : null}
          </button>
        </div>
      </details>
    </section>
  );
}
