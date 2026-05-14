"use client";

import { CommitteeInteractionGraphSvg } from "@/components/CommitteeInteractionGraphSvg";
import { LiveMetricsStrip } from "@/components/LiveMetricsStrip";
import { PipelineStageStrip } from "@/components/PipelineStageStrip";
import { CHARACTERS } from "@/lib/characters";
import { anyCharacterStreaming } from "@/lib/insights";
import { buildSparklinePoints } from "@/lib/sparklineUtils";
import { CharacterRoundState, EvaluationResult } from "@/lib/types";

export interface CommandCenterTrendPoint {
  runIndex: number;
  committeeAverage: number;
  naiveAverage: number;
  delta: number;
  metacognitionTotal: number;
  majorityAfter: string;
  executionSource: "LOCAL" | "API";
}

interface LiveRunCommandCenterProps {
  isCybercool: boolean;
  question: string;
  runMode: "local" | "api";
  activeSource: "LOCAL" | "API";
  phaseLabel: string;
  batchProgress: { current: number; total: number } | null;
  isRunning: boolean;
  hasAnyOutput: boolean;
  naiveText: string;
  naiveStreaming: boolean;
  characterResponses: Record<string, CharacterRoundState>;
  evaluation: EvaluationResult | null;
  naiveEvaluation: EvaluationResult | null;
  evaluating: boolean;
  currentPhase: number;
  trendPoints: CommandCenterTrendPoint[];
  dashboardStatus: string;
  convergenceLabel: string;
  committeeMean: number;
  naiveMean: number;
  deltaMean: number;
  majorityStabilityRate: number;
  majorityInstabilityFraming: boolean;
  error: string | null;
}

type StageState = "waiting" | "running" | "done" | "error";

function Sparkline({
  label,
  points,
  stroke,
}: {
  label: string;
  points: string;
  stroke: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{label}</div>
      <svg viewBox="0 0 180 36" className="mt-1 h-8 w-full rounded bg-slate-50" aria-hidden>
        <polyline
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          points={points || "0,18 180,18"}
        />
      </svg>
    </div>
  );
}

export function LiveRunCommandCenter({
  isCybercool,
  question,
  runMode,
  activeSource,
  phaseLabel,
  batchProgress,
  isRunning,
  hasAnyOutput,
  naiveText,
  naiveStreaming,
  characterResponses,
  evaluation,
  naiveEvaluation,
  evaluating,
  currentPhase,
  trendPoints,
  dashboardStatus,
  convergenceLabel,
  committeeMean,
  naiveMean,
  deltaMean,
  majorityStabilityRate,
  majorityInstabilityFraming,
  error,
}: LiveRunCommandCenterProps) {
  const fontClass = isCybercool ? "font-mono" : "";
  const majorityOutcomeLabel = majorityInstabilityFraming ? "Majority Instability" : "Majority Stability";
  const majorityOutcomePercent = majorityInstabilityFraming
    ? (1 - majorityStabilityRate) * 100
    : majorityStabilityRate * 100;
  const streaming = anyCharacterStreaming(characterResponses);
  const researching = CHARACTERS.filter(
    (character) => characterResponses[character.id]?.researchState === "running",
  );
  const activeSpeakers = CHARACTERS.filter((character) => characterResponses[character.id]?.streaming);
  const phaseOneStarted = CHARACTERS.some((character) => characterResponses[character.id]?.phase1);
  const phaseTwoStarted = CHARACTERS.some((character) => characterResponses[character.id]?.phase2);
  const researchTouched = CHARACTERS.some((character) => {
    const state = characterResponses[character.id]?.researchState;
    return state === "ok" || state === "failed" || state === "skipped" || state === "running";
  });

  const stages: Array<{ label: string; state: StageState; detail: string }> = [
    {
      label: "Naive",
      state: naiveStreaming ? "running" : naiveText ? "done" : error ? "error" : "waiting",
      detail: naiveStreaming ? "streaming" : naiveText ? "captured" : "pending",
    },
    {
      label: "Research",
      state: researching.length > 0 ? "running" : researchTouched ? "done" : error ? "error" : "waiting",
      detail:
        activeSource === "LOCAL"
          ? researchTouched
            ? "simulated"
            : "local"
          : researching.length > 0
            ? `${researching.length} active`
            : researchTouched
              ? "complete"
              : "pending",
    },
    {
      label: "Round 1",
      state: currentPhase === 1 && streaming ? "running" : phaseOneStarted ? "done" : error ? "error" : "waiting",
      detail: currentPhase === 1 && streaming ? "speaking" : phaseOneStarted ? "complete" : "pending",
    },
    {
      label: "Cross-exam",
      state: currentPhase >= 2 && streaming ? "running" : phaseTwoStarted ? "done" : error ? "error" : "waiting",
      detail: currentPhase >= 2 && streaming ? "in progress" : phaseTwoStarted ? "complete" : "pending",
    },
    {
      label: "Evaluate",
      state: evaluating ? "running" : evaluation && naiveEvaluation ? "done" : error ? "error" : "waiting",
      detail: evaluating ? "scoring" : evaluation && naiveEvaluation ? "scored" : "pending",
    },
    {
      label: "Snapshot",
      state: trendPoints.length > 0 ? "done" : error ? "error" : "waiting",
      detail: trendPoints.length > 0 ? `${trendPoints.length} stored` : "not yet",
    },
  ];

  const latestTrend = trendPoints[trendPoints.length - 1] ?? null;
  const sourceCounts = trendPoints.reduce(
    (acc, point) => {
      acc[point.executionSource] += 1;
      return acc;
    },
    { LOCAL: 0, API: 0 },
  );
  const sourceWarning =
    sourceCounts.LOCAL > 0 && sourceCounts.API > 0
      ? "Mixed local/API evidence. Clear this prompt before comparing live variance."
      : sourceCounts.LOCAL > 0
        ? "Local runs are deterministic shape evidence."
        : sourceCounts.API > 0
          ? "API runs show live model/evaluator variation."
          : "No stored runs for this prompt yet.";

  const committeeSparkline = buildSparklinePoints(
    trendPoints.map((point) => point.committeeAverage),
    180,
    36,
  );
  const deltaSparkline = buildSparklinePoints(
    trendPoints.map((point) => point.delta),
    180,
    36,
  );
  const metacognitionSparkline = buildSparklinePoints(
    trendPoints.map((point) => point.metacognitionTotal),
    180,
    36,
  );

  return (
    <section
      id="live-run-command-center"
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${fontClass}`}
      aria-live="polite"
      aria-label="Live run command center"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            Live Run Command Center
          </div>
          <p className="mt-1 text-sm text-slate-700">
            Live interaction, run status, and cross-run evidence stay side by side while the prompt runs.
          </p>
          <p className="mt-2 max-w-4xl truncate rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <span className="font-semibold text-slate-600">Prompt:</span> {question.trim() || "(empty)"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 font-semibold text-slate-800">
            {activeSource}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
            Requested {runMode === "local" ? "LOCAL" : "API"}
          </span>
          {batchProgress ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 font-semibold text-sky-900">
              Batch {batchProgress.current}/{batchProgress.total}
            </span>
          ) : null}
          <span
            className={`rounded-full border px-2 py-1 font-semibold ${
              isRunning
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : hasAnyOutput
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {isRunning ? "Running" : hasAnyOutput ? "Ready to inspect" : "Waiting"}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <PipelineStageStrip stages={stages} isCybercool={isCybercool} />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Live Interaction</h2>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {activeSpeakers.length > 0
                ? `${activeSpeakers.length} speaking`
                : researching.length > 0
                  ? `${researching.length} researching`
                  : "quiet"}
            </span>
          </div>
          <CommitteeInteractionGraphSvg
            characterResponses={characterResponses}
            className="h-auto w-full max-h-[13rem] rounded-md border border-slate-200 bg-white"
          />
          <div className="mt-2 space-y-2">
            {activeSpeakers.length > 0 ? (
              activeSpeakers.slice(0, 2).map((character) => {
                const state = characterResponses[character.id];
                const text = currentPhase >= 2 ? state.phase2 : state.phase1;
                return (
                  <div
                    key={character.id}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-xs"
                    style={{ borderLeftWidth: "3px", borderLeftColor: character.accentHex }}
                  >
                    <div className="font-semibold" style={{ color: character.accentHex }}>
                      {character.name} speaking now
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-slate-700">{text || "..."}</p>
                  </div>
                );
              })
            ) : researching.length > 0 ? (
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-2 text-xs text-violet-950">
                {researching.map((character) => character.name).join(", ")} gathering context.
              </div>
            ) : (
              <p className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600">
                Start a run to see active speakers, research state, vote movement, and transcript excerpts here.
              </p>
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Run Status</h2>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">
              {phaseLabel}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <LiveMetricsStrip
              characterResponses={characterResponses}
              evaluation={evaluation}
              naiveEvaluation={naiveEvaluation}
              evaluating={evaluating}
              historyCommitteeMean={trendPoints.length > 0 ? committeeMean : null}
              currentPhase={currentPhase}
              isRunning={isRunning}
            />
          </div>
          {error ? (
            <div className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-2 text-xs text-rose-800">
              {error}
            </div>
          ) : null}
          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Latest summary
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-2 text-[11px] text-slate-700">
                <div className="font-semibold text-slate-900">Evaluator</div>
                <div className="mt-0.5">
                  {evaluating
                    ? "Scoring in progress."
                    : evaluation && naiveEvaluation
                      ? `Committee ${evaluation.average.toFixed(1)} vs naive ${naiveEvaluation.average.toFixed(1)}.`
                      : "Pending."}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-2 text-[11px] text-slate-700">
                <div className="font-semibold text-slate-900">Snapshot</div>
                <div className="mt-0.5">
                  {latestTrend
                    ? `#${latestTrend.runIndex}: ${latestTrend.majorityAfter}, delta ${
                        latestTrend.delta >= 0 ? "+" : ""
                      }${latestTrend.delta.toFixed(2)}.`
                    : "No stored run yet."}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Cross-interaction mirror
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {activeSpeakers.length > 0
                  ? `${activeSpeakers.length} speaking`
                  : researching.length > 0
                    ? `${researching.length} researching`
                    : "quiet"}
              </span>
            </div>
            <CommitteeInteractionGraphSvg
              characterResponses={characterResponses}
              className="h-auto w-full max-h-[9rem] rounded-md border border-slate-200 bg-slate-50"
            />
            <div className="mt-2 text-xs text-slate-700">
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
        </article>

        <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Cross-Run Trends</h2>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
              {dashboardStatus}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="text-slate-500">Runs</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{trendPoints.length}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="text-slate-500">{majorityOutcomeLabel}</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                {majorityOutcomePercent.toFixed(0)}%
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="text-slate-500">Committee Mean</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                {committeeMean.toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="text-slate-500">Mean Delta</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                {deltaMean >= 0 ? "+" : ""}
                {deltaMean.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Sparkline label="Committee avg" points={committeeSparkline} stroke="#0ea5e9" />
            <Sparkline label="Quality delta" points={deltaSparkline} stroke="#10b981" />
            <Sparkline label="Metacognition" points={metacognitionSparkline} stroke="#8b5cf6" />
          </div>
          <p className="mt-2 rounded-lg border border-slate-200 bg-white p-2 text-xs leading-snug text-slate-600">
            {convergenceLabel} {sourceWarning}
            {trendPoints.length === 1 ? " Run again to turn this snapshot into a trend." : ""}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Naive mean {naiveMean.toFixed(2)}. Learning here means accumulating evidence across independent runs,
            not changing model weights.
          </p>
        </article>
      </div>
    </section>
  );
}
