import type { ReactNode } from "react";

import { TechnicalBreakout } from "@/components/TechnicalBreakout";
import { EvidenceReadiness, EvidenceSummary, RunSnapshot } from "@/lib/types";

interface EvidenceRibbonPanelProps {
  runs: RunSnapshot[];
  evidenceSummary: EvidenceSummary;
  presentationMode?: boolean;
}

function formatReadiness(readiness: EvidenceSummary["readiness"]): string {
  if (readiness === "insufficient_data") return "Insufficient data";
  if (readiness === "tentative") return "Tentative";
  if (readiness === "robust") return "Robust";
  return "Unstable";
}

/** Plain-language rubric for the readiness badge (hover / a11y). */
function readinessDetail(summary: EvidenceSummary): string {
  const n = summary.runCount;
  const { agreementRate, instability } = summary.stability;
  const agrPct = Math.round(agreementRate * 100);
  const inst = instability.toFixed(2);
  if (summary.readiness === "insufficient_data") {
    return `Readiness needs at least 3 saved runs (you have ${n}).`;
  }
  const base = `Across runs: ${agrPct}% outcome repeatability (share of runs whose final vote matches the most common final vote here). Committee score spread (std dev) ≈ ${inst}.`;
  if (summary.readiness === "robust") {
    return `${base} Labeled robust when repeatability is high and spread stays within the “stable” band.`;
  }
  if (summary.readiness === "tentative") {
    return `${base} Tentative = middling repeatability or spread — useful, not yet a firm pattern.`;
  }
  return `${base} Unstable = outcomes or scores swing enough that you should not treat one run as representative.`;
}

const readinessBadge: Record<EvidenceReadiness, string> = {
  insufficient_data: "border-slate-200 bg-slate-100 text-slate-800",
  tentative: "border-amber-200 bg-amber-50 text-amber-950",
  robust: "border-emerald-200 bg-emerald-50 text-emerald-900",
  unstable: "border-rose-200 bg-rose-50 text-rose-900",
};

function majorityPillClass(majority: string): string {
  if (majority === "Aye") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (majority === "Nay") return "border-rose-200 bg-rose-50 text-rose-900";
  return "border-slate-200 bg-slate-100 text-slate-800";
}

function shortMajorityLabel(majority: string): string {
  if (majority === "Undetermined") return "Und.";
  return majority;
}

function formatRunWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StickyMetricLabel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="sticky left-0 z-[2] flex min-h-[2.125rem] items-center border-r border-slate-200/90 bg-white px-1.5 py-1 text-right shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]"
      title={title}
    >
      <div className="ml-auto flex flex-col items-end gap-0 leading-tight">
        <span className="text-[10px] font-semibold text-slate-800">{children}</span>
        {subtitle ? (
          <span className="max-w-[9.5rem] text-[9px] font-normal text-slate-500">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}

function colStripeClass(runIndex: number): string {
  return runIndex % 2 === 0 ? "bg-white" : "bg-slate-50/90";
}

export function EvidenceRibbonPanel({
  runs,
  evidenceSummary,
  presentationMode = false,
}: EvidenceRibbonPanelProps) {
  const shell = presentationMode
    ? "rounded-lg border border-slate-200 bg-white p-2 shadow-none"
    : "rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm";

  const committeeScores = runs.map((r) => r.committeeAverage);
  const cMin = committeeScores.length ? Math.min(...committeeScores) : 0;
  const cMax = committeeScores.length ? Math.max(...committeeScores) : 1;
  const cRange = cMax - cMin || 1;

  const agreementPct = Math.round(evidenceSummary.stability.agreementRate * 100);

  const gridCols = `minmax(7rem, 8.75rem) repeat(${Math.max(runs.length, 1)}, minmax(3rem, 1fr))`;

  const cell =
    "flex min-h-[2.125rem] items-center justify-center px-1 py-1 text-center tabular-nums text-[11px]";

  return (
    <section className={shell}>
      <div className="mb-2 border-b border-slate-200/80 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="min-w-0">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Evidence ribbon
            </h3>
            <p className="mt-0.5 max-w-[42rem] text-[10px] leading-snug text-slate-600">
              Columns = saved runs on this question. One row = one measure; scan across to see how it varies.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${readinessBadge[evidenceSummary.readiness]}`}
            title={readinessDetail(evidenceSummary)}
          >
            {formatReadiness(evidenceSummary.readiness)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1.5">
          <div className="flex min-w-[9rem] flex-1 flex-col gap-0.5 sm:max-w-[14rem]" title={readinessDetail(evidenceSummary)}>
            <div className="flex justify-between gap-2 text-[9px] font-medium text-slate-500">
              <span className="leading-tight">
                Outcome repeatability
                <span className="mt-0.5 block font-normal text-slate-400">
                  % of runs matching the most common final vote
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-slate-700">{agreementPct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-[width]"
                style={{ width: `${agreementPct}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-600">
            <span className="font-semibold text-slate-700">n</span> = {runs.length}
          </span>
          {evidenceSummary.warning ? (
            <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-950">
              {evidenceSummary.warning}
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-slate-500">
          <span className="font-medium text-slate-600">Votes</span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Aye
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
            Nay
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
            Other
          </span>
        </div>
      </div>

      {runs.length === 0 ? (
        <p className="text-xs text-slate-600">
          No runs recorded for this question yet. Complete a run to populate the ribbon.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto pb-0.5 [scrollbar-width:thin]">
            <div
              className="grid gap-px rounded-lg border border-slate-200/90 bg-slate-200/70 text-[10px] leading-tight shadow-sm"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div
                className={`sticky left-0 z-[2] flex min-h-[2.25rem] items-center border-r border-slate-200/90 bg-slate-100 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]`}
              >
                Metric / run
              </div>
              {runs.map((run, idx) => (
                <div
                  key={`${run.id}-head`}
                  className={`flex min-h-[2.25rem] flex-col items-center justify-center gap-0 px-0.5 py-1 text-center ${colStripeClass(idx)}`}
                  title={run.timestamp}
                >
                  <span className="text-[10px] font-bold tabular-nums text-slate-900">#{idx + 1}</span>
                  <span className="text-[9px] leading-none text-slate-500">{formatRunWhen(run.timestamp)}</span>
                </div>
              ))}

              <StickyMetricLabel
                title="Evaluator mean score for the full committee transcript (same rubric as the naive row)."
                subtitle="Rubric mean"
              >
                Committee
              </StickyMetricLabel>
              {runs.map((run, idx) => (
                <div key={`${run.id}-c`} className={`${cell} font-semibold text-slate-900 ${colStripeClass(idx)}`}>
                  {run.committeeAverage.toFixed(1)}
                </div>
              ))}

              <StickyMetricLabel
                title="Evaluator mean for the single naive (one-model) output."
                subtitle="One model"
              >
                Naive
              </StickyMetricLabel>
              {runs.map((run, idx) => (
                <div key={`${run.id}-n`} className={`${cell} text-slate-600 ${colStripeClass(idx)}`}>
                  {run.naiveAverage.toFixed(1)}
                </div>
              ))}

              <StickyMetricLabel
                title="Committee mean minus naive mean on the same rubric. Positive = committee scored higher."
                subtitle="Committee − naive"
              >
                Δ
              </StickyMetricLabel>
              {runs.map((run, idx) => (
                <div
                  key={`${run.id}-d`}
                  className={`${cell} font-semibold ${run.delta >= 0 ? "text-emerald-700" : "text-rose-700"} ${colStripeClass(idx)}`}
                  title={`Committee ${run.committeeAverage.toFixed(1)} − naive ${run.naiveAverage.toFixed(1)}`}
                >
                  {run.delta >= 0 ? "+" : ""}
                  {run.delta.toFixed(1)}
                </div>
              ))}

              <StickyMetricLabel
                title="Inferred final vote majority after deliberation (parsed from the transcript)."
                subtitle="Inferred"
              >
                Final
              </StickyMetricLabel>
              {runs.map((run, idx) => (
                <div key={`${run.id}-maj`} className={`${cell} ${colStripeClass(idx)}`}>
                  <span
                    className={`rounded-full border px-1.5 py-px text-[9px] font-semibold ${majorityPillClass(run.majorityAfter)}`}
                    title={`Final majority: ${run.majorityAfter}`}
                  >
                    {shortMajorityLabel(run.majorityAfter)}
                  </span>
                </div>
              ))}

              <StickyMetricLabel
                title="Yes if the majority after round 1 differs from the final majority — deliberation moved the outcome."
                subtitle="Round 1 → final"
              >
                Flip
              </StickyMetricLabel>
              {runs.map((run, idx) => {
                const flipped = run.majorityBefore !== run.majorityAfter;
                return (
                  <div
                    key={`${run.id}-flip`}
                    className={`${cell} ${colStripeClass(idx)}`}
                    title={
                      flipped
                        ? `Majority changed: ${run.majorityBefore} → ${run.majorityAfter}`
                        : "Majority stable from round 1 to final"
                    }
                  >
                    <span
                      className={`inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full text-[10px] font-semibold ${
                        flipped
                          ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {flipped ? "Yes" : "—"}
                    </span>
                  </div>
                );
              })}

              <StickyMetricLabel
                title="How many committee members changed their vote across rounds (inferred from the transcript)."
                subtitle="Member changes"
              >
                Shifts
              </StickyMetricLabel>
              {runs.map((run, idx) => (
                <div key={`${run.id}-sh`} className={`${cell} text-slate-800 ${colStripeClass(idx)}`}>
                  {run.inferredVoteShifts}
                </div>
              ))}

              <StickyMetricLabel
                title="Count of metacognition / self-reflection cue phrases in the transcript (higher ≈ more explicit second-order reasoning)."
                subtitle="Cue hits"
              >
                Meta
              </StickyMetricLabel>
              {runs.map((run, idx) => (
                <div key={`${run.id}-meta`} className={`${cell} text-slate-800 ${colStripeClass(idx)}`}>
                  {run.metacognitionTotal}
                </div>
              ))}

              <StickyMetricLabel
                title="Relative committee score on this ribbon only: bar height maps min→max committee mean among the runs shown (not an absolute scale)."
                subtitle="vs min–max here"
              >
                Strength
              </StickyMetricLabel>
              {runs.map((run, idx) => {
                const barH = Math.round(((run.committeeAverage - cMin) / cRange) * 14) + 4;
                return (
                  <div
                    key={`${run.id}-bar`}
                    className={`flex h-7 items-end justify-center px-0.5 pb-0.5 pt-0.5 ${colStripeClass(idx)}`}
                    title={`Committee ${run.committeeAverage.toFixed(1)} — scaled between ${cMin.toFixed(1)} and ${cMax.toFixed(1)} on this ribbon only`}
                  >
                    <div
                      className="w-3.5 rounded-t-sm bg-gradient-to-t from-sky-700 to-sky-500 ring-1 ring-sky-600/15"
                      style={{ height: `${barH}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {!presentationMode ? (
            <TechnicalBreakout className="mt-2 bg-white/80" title="fields and normalization">
              <p className="text-xs text-slate-700">
                Each column is one <code className="rounded bg-slate-200 px-1">RunSnapshot</code> for the current
                question. Scores are evaluator means (same rubric for committee vs naive). Δ is the gap between
                those means. Final vote, flip, and shifts are inferred from the transcript. Meta counts
                metacognition keyword hits. Strength is only relative to the min and max committee score on this
                ribbon — it does not compare across questions.
              </p>
            </TechnicalBreakout>
          ) : null}
        </>
      )}
    </section>
  );
}
