"use client";

import { CommitteeInteractionGraphSvg } from "@/components/CommitteeInteractionGraphSvg";
import { CondorcetJuryExplorer } from "@/components/CondorcetJuryExplorer";
import { LiveMetricsStrip } from "@/components/LiveMetricsStrip";
import { CHARACTERS } from "@/lib/characters";
import { buildSparklinePoints } from "@/lib/sparklineUtils";
import { CharacterRoundState, EvaluationResult } from "@/lib/types";

export interface ObservabilityTrendPoint {
  runIndex: number;
  committeeAverage: number;
  naiveAverage: number;
  delta: number;
  metacognitionTotal: number;
  majorityAfter: string;
  executionSource: "LOCAL" | "API";
}

interface ObservabilityDockProps {
  isCybercool: boolean;
  isLiveGraphMinimized: boolean;
  hasAnyOutput: boolean;
  runMode: "local" | "api";
  activeSource: "LOCAL" | "API";
  phaseLabel: string;
  batchProgress: { current: number; total: number } | null;
  isRunning: boolean;
  isDecisionFinalized: boolean;
  undispositionedConcernsCount: number;
  characterResponses: Record<string, CharacterRoundState>;
  evaluation: EvaluationResult | null;
  naiveEvaluation: EvaluationResult | null;
  evaluating: boolean;
  historyCommitteeMean: number | null;
  currentPhase: number;
  trendPoints: ObservabilityTrendPoint[];
  dashboardStatus: string;
  convergenceLabel: string;
  committeeMean: number;
  deltaMean: number;
  runCount: number;
}

function CompactCrossRunTrends({
  trendPoints,
  dashboardStatus,
  convergenceLabel,
  committeeMean,
  deltaMean,
  runCount,
}: Pick<
  ObservabilityDockProps,
  "trendPoints" | "dashboardStatus" | "convergenceLabel" | "committeeMean" | "deltaMean" | "runCount"
>) {
  const confidenceSeries = trendPoints.map((p) => p.committeeAverage);
  const metacognitionSeries = trendPoints.map((p) => p.metacognitionTotal);
  const confidenceSparkline = buildSparklinePoints(confidenceSeries, 180, 36);
  const metacognitionSparkline = buildSparklinePoints(metacognitionSeries, 180, 36);
  const hasTrendData = trendPoints.length >= 2;

  return (
    <section
      id="observability-trends"
      className="shrink-0 scroll-mt-4 rounded-xl border border-slate-200/90 bg-white px-2.5 py-2 shadow-sm"
      aria-label="Cross-run trend summary"
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Cross-run trends</div>
      <p className="mt-1 text-[10px] leading-snug text-slate-600">
        Same question key. Full table and distributions stay in the Decision Dashboard below the main column.
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-800">
          {runCount} run{runCount === 1 ? "" : "s"}
        </span>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] text-sky-900">
          {dashboardStatus}
        </span>
      </div>
      {runCount > 0 ? (
        <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10px] text-slate-700">
          <div>
            <span className="text-slate-500">Committee μ</span>{" "}
            <span className="font-semibold tabular-nums text-slate-900">{committeeMean.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">Mean Δ</span>{" "}
            <span className="font-semibold tabular-nums text-slate-900">
              {deltaMean >= 0 ? "+" : ""}
              {deltaMean.toFixed(2)}
            </span>
          </div>
        </div>
      ) : null}
      <p className="mt-1 text-[9px] leading-snug text-slate-500">{convergenceLabel}</p>
      {hasTrendData ? (
        <div className="mt-2 grid gap-2">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">Committee avg</div>
            <svg viewBox="0 0 180 36" className="mt-0.5 h-8 w-full" aria-hidden>
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="1.75"
                points={confidenceSparkline || "0,18 180,18"}
              />
            </svg>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">Metacognition</div>
            <svg viewBox="0 0 180 36" className="mt-0.5 h-8 w-full" aria-hidden>
              <polyline
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.75"
                points={metacognitionSparkline || "0,18 180,18"}
              />
            </svg>
          </div>
        </div>
      ) : runCount === 1 ? (
        <p className="mt-2 text-[10px] text-slate-500">Run again to draw trend lines.</p>
      ) : runCount === 0 ? (
        <p className="mt-2 text-[10px] text-slate-500">No history for this question yet.</p>
      ) : null}
    </section>
  );
}

export function ObservabilityDock({
  isCybercool,
  isLiveGraphMinimized,
  hasAnyOutput,
  runMode,
  activeSource,
  phaseLabel,
  batchProgress,
  isRunning,
  isDecisionFinalized,
  undispositionedConcernsCount,
  characterResponses,
  evaluation,
  naiveEvaluation,
  evaluating,
  historyCommitteeMean,
  currentPhase,
  trendPoints,
  dashboardStatus,
  convergenceLabel,
  committeeMean,
  deltaMean,
  runCount,
}: ObservabilityDockProps) {
  const dockFont = isCybercool ? "font-mono" : "";
  const researching = CHARACTERS.filter(
    (character) => characterResponses[character.id]?.researchState === "running",
  );
  const activeSpeakers = CHARACTERS.filter((character) => characterResponses[character.id]?.streaming);

  const runStatusBlock = (
    <div
      className={`shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 shadow-sm ${dockFont}`}
      aria-label="Run status and live metrics"
    >
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        Run status
      </div>
      {hasAnyOutput ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
              {activeSource}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px]">
              {phaseLabel}
            </span>
            {batchProgress ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-800">
                Batch {batchProgress.current}/{batchProgress.total}
              </span>
            ) : null}
            {isRunning ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800">
                Running...
              </span>
            ) : null}
            {!isRunning ? (
              <span
                className={`rounded-full border px-1.5 py-0.5 text-[10px] ${
                  isDecisionFinalized
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {isDecisionFinalized
                  ? "Finalization ready"
                  : `Disposition (${undispositionedConcernsCount})`}
              </span>
            ) : null}
          </div>
          <LiveMetricsStrip
            characterResponses={characterResponses}
            evaluation={evaluation}
            naiveEvaluation={naiveEvaluation}
            evaluating={evaluating}
            historyCommitteeMean={historyCommitteeMean}
            currentPhase={currentPhase}
            isRunning={isRunning}
          />
        </>
      ) : (
        <div className="space-y-1.5 text-[11px] text-slate-600">
          <p className="leading-snug">
            Run a prompt to stream Condorcet, evaluator confidence, and metacognition here.
          </p>
          <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
            <span className="rounded-full border border-dashed border-slate-300 bg-slate-50 px-1.5 py-0.5">
              {runMode === "local" ? "LOCAL" : "API"}
            </span>
            <span className="rounded-full border border-dashed border-slate-300 bg-slate-50 px-1.5 py-0.5">
              Waiting
            </span>
          </div>
        </div>
      )}
      <div className="mt-2.5 border-t border-slate-200 pt-2.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Cross-interaction mirror
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {activeSpeakers.length > 0
              ? `${activeSpeakers.length} speaking`
              : researching.length > 0
                ? `${researching.length} researching`
                : "quiet"}
          </span>
        </div>
        <CommitteeInteractionGraphSvg
          characterResponses={characterResponses}
          className="h-auto w-full max-h-[7.5rem] rounded-md border border-slate-200 bg-slate-50"
        />
        <div className="mt-1.5 text-[11px] leading-snug text-slate-700">
          {activeSpeakers.length > 0 ? (
            activeSpeakers.slice(0, 1).map((character) => {
              const state = characterResponses[character.id];
              const text = currentPhase >= 2 ? state.phase2 : state.phase1;
              return (
                <div key={character.id}>
                  <span className="font-semibold" style={{ color: character.accentHex }}>
                    {character.name}:
                  </span>{" "}
                  <span className="line-clamp-2 whitespace-pre-wrap">{text || "..."}</span>
                </div>
              );
            })
          ) : researching.length > 0 ? (
            <span>{researching.map((character) => character.name).join(", ")} gathering context.</span>
          ) : (
            <span className="text-slate-500">No active speaker yet.</span>
          )}
        </div>
      </div>
    </div>
  );

  const trendsBlock = (
    <CompactCrossRunTrends
      trendPoints={trendPoints}
      dashboardStatus={dashboardStatus}
      convergenceLabel={convergenceLabel}
      committeeMean={committeeMean}
      deltaMean={deltaMean}
      runCount={runCount}
    />
  );

  const minimizedNote = (
    <section className="shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] text-slate-600 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Live graph & jury</div>
      <p className="mt-1 leading-snug">
        Minimized — use <strong>Quick actions</strong> to show the live interaction graph beside the run log and
        the jury theorem lab here.
      </p>
    </section>
  );

  return (
    <aside
      id="observability-dock"
      className={[
        "pointer-events-auto z-40 flex min-h-0 min-w-0 flex-col overflow-hidden overscroll-contain",
        "max-lg:fixed max-lg:bottom-[max(1rem,env(safe-area-inset-bottom,0px))] max-lg:right-[max(1rem,env(safe-area-inset-right,0px))]",
        "max-lg:w-[min(22rem,calc(100vw-2rem-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px)))]",
        "max-lg:h-[min(85dvh,calc(100dvh-6rem))] max-lg:max-h-[min(85dvh,calc(100dvh-6rem))]",
        "lg:sticky lg:top-14 lg:h-[calc(100dvh-4.75rem)] lg:max-h-[calc(100dvh-4.75rem)] lg:w-full lg:self-start",
        "max-lg:gap-0 max-lg:rounded-2xl max-lg:border max-lg:border-slate-200/90 max-lg:bg-white max-lg:shadow-2xl",
        "lg:gap-0 lg:rounded-2xl lg:border lg:border-slate-200/80 lg:bg-gradient-to-b lg:from-slate-50/95 lg:to-white lg:p-2.5 lg:shadow-sm",
        "drop-shadow-xl lg:drop-shadow-md",
        dockFont,
      ].join(" ")}
      aria-live="polite"
      role="complementary"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain px-0.5 pb-0.5 pt-0 lg:gap-2.5 lg:p-0 lg:pb-0 lg:pt-0 [scrollbar-gutter:stable]">
        {trendsBlock}
        {!isLiveGraphMinimized ? (
          <section
            id="live-dock-jury-theorem"
            className="shrink-0 scroll-mt-4 rounded-xl border border-indigo-200/80 bg-white shadow-sm"
          >
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/95 to-sky-50/80 px-2 py-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-950">
                Jury theorem lab
              </div>
              <p className="mt-0.5 text-[9px] leading-snug text-indigo-950/85">
                Independent ballots vs this deliberative assembly — contrast on purpose.
              </p>
            </div>
            <div className="px-0.5 pb-0.5 pt-0">
              <CondorcetJuryExplorer
                variant="livePanel"
                observabilityCompact
                characterResponses={characterResponses}
                isRunning={isRunning}
                className="!mt-0 !border-0 !bg-transparent !p-1.5 !shadow-none"
              />
            </div>
          </section>
        ) : (
          minimizedNote
        )}
        {runStatusBlock}
      </div>
    </aside>
  );
}
