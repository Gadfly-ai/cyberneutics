import { RunSnapshot } from "@/lib/types";

interface RunOutcomeLogPanelProps {
  question: string;
  runs: RunSnapshot[];
  presentationMode?: boolean;
  isCybercool?: boolean;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function sourceBadgeClass(source: RunSnapshot["executionSource"]): string {
  if (source === "API") return "border-violet-200 bg-violet-50 text-violet-900";
  return "border-slate-300 bg-slate-100 text-slate-800";
}

function runKindLabel(run: RunSnapshot): string | null {
  if (run.batchIndex == null || run.batchTotal == null) return null;
  const progress = `${run.batchIndex}/${run.batchTotal}`;
  if (run.runKind === "auto_resolve") return `Auto-resolve ${progress}`;
  if (run.runKind === "self_improvement") return `Self-improve ${progress}`;
  return `Batch ${progress}`;
}

export function RunOutcomeLogPanel({
  question,
  runs,
  presentationMode = false,
  isCybercool = false,
}: RunOutcomeLogPanelProps) {
  const sorted = [...runs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const shell = presentationMode
    ? "rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

  const headingClass = isCybercool
    ? "hackers-prompt text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600"
    : "text-xs font-semibold uppercase tracking-wide text-slate-700";

  return (
    <section className={shell} aria-label="Recorded run outcomes for this prompt">
      <div className="border-b border-slate-200 pb-3">
        <div className={headingClass}>Run outcome log</div>
        <p
          className={`mt-1 text-slate-700 ${presentationMode ? "text-sm leading-snug" : "text-sm"}`}
        >
          Each completed run is stored in order with the prompt, execution mode (local vs API), settings,
          and evaluator outcomes. Use this when comparing a local batch, an API batch, and follow-up
          batches side by side.
        </p>
        <div
          className={`mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 ${
            isCybercool ? "font-mono text-xs" : "text-sm"
          } text-slate-800`}
        >
          <span className="font-semibold text-slate-600">Prompt: </span>
          <span className="whitespace-pre-wrap break-words">{question.trim() || "(empty)"}</span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No runs recorded for this prompt yet.</p>
      ) : (
        <ul className="mt-3 max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {sorted.map((run, idx) => {
            const runKind = runKindLabel(run);
            const configured = run.deliberationRoundsConfigured ?? run.roundsUsed;
            const adaptive = run.adaptiveDepth ?? false;

            return (
              <li
                key={run.id}
                className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-800 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tabular-nums text-slate-900">#{idx + 1}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sourceBadgeClass(run.executionSource)}`}
                  >
                    {run.executionSource}
                  </span>
                  {runKind ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
                      {runKind}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-slate-500">{formatTime(run.timestamp)}</span>
                </div>

                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-slate-600">Scores: </span>
                    <span className="tabular-nums">
                      committee {run.committeeAverage.toFixed(2)} ({run.committeeTier}) · naive{" "}
                      {run.naiveAverage.toFixed(2)} ({run.naiveTier}) · Δ{" "}
                      <span className={run.delta >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                        {run.delta >= 0 ? "+" : ""}
                        {run.delta.toFixed(2)}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Majority: </span>
                    <span>
                      {run.majorityBefore} → {run.majorityAfter}
                      {run.resolvedByExtraRounds ? (
                        <span className="ml-1 text-[10px] font-semibold text-amber-800">
                          (extra rounds)
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Deliberation: </span>
                    <span>
                      {run.roundsUsed} rounds used · {configured} configured · adaptive{" "}
                      {adaptive ? "on" : "off"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Signals: </span>
                    <span className="tabular-nums">
                      vote shifts {run.inferredVoteShifts} · metacog {run.metacognitionTotal}
                    </span>
                  </div>
                </div>

                {(run.committeeKeyFinding || run.naiveKeyFinding) && (
                  <div className="mt-2 space-y-1 border-t border-slate-200/80 pt-2 text-[11px] leading-relaxed text-slate-700">
                    {run.committeeKeyFinding ? (
                      <p>
                        <span className="font-semibold text-slate-800">Committee finding: </span>
                        {run.committeeKeyFinding}
                      </p>
                    ) : null}
                    {run.naiveKeyFinding ? (
                      <p>
                        <span className="font-semibold text-slate-800">Naive finding: </span>
                        {run.naiveKeyFinding}
                      </p>
                    ) : null}
                  </div>
                )}

                {(run.naiveOutputExcerpt || run.committeeTranscriptExcerpt) && (
                  <details className="mt-2 border-t border-slate-200/80 pt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-slate-700">
                      Output excerpts (stored)
                    </summary>
                    <div className="mt-2 grid gap-2 lg:grid-cols-2">
                      {run.naiveOutputExcerpt ? (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Naive
                          </div>
                          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded border border-slate-200 bg-white p-2 text-[10px] leading-relaxed text-slate-700">
                            {run.naiveOutputExcerpt}
                          </pre>
                        </div>
                      ) : null}
                      {run.committeeTranscriptExcerpt ? (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Committee transcript
                          </div>
                          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded border border-slate-200 bg-white p-2 text-[10px] leading-relaxed text-slate-700">
                            {run.committeeTranscriptExcerpt}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
