import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";
import { ConcernRecord, DispositionRecord, OverrideRecord } from "@/lib/types";
import { useState } from "react";

interface DecisionAccountabilityMetricsPanelProps {
  presentationMode?: boolean;
  concerns: ConcernRecord[];
  dispositions: DispositionRecord[];
  overrides: OverrideRecord[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function DecisionAccountabilityMetricsPanel({
  presentationMode = false,
  concerns,
  dispositions,
  overrides,
}: DecisionAccountabilityMetricsPanelProps) {
  const [capturedNow] = useState<number>(() => Date.now());
  const dispositionedConcernIds = new Set(dispositions.map((item) => item.concernId));
  const completenessRate =
    concerns.length === 0 ? 1 : dispositionedConcernIds.size / concerns.length;

  const dispositionDurations = dispositions
    .filter((item) => item.decidedAt)
    .map((item) => {
      const concern = concerns.find((candidate) => candidate.id === item.concernId);
      if (!concern || !item.decidedAt) return null;
      const raisedAt = new Date(concern.raisedAt).getTime();
      const decidedAt = new Date(item.decidedAt).getTime();
      if (Number.isNaN(raisedAt) || Number.isNaN(decidedAt) || decidedAt < raisedAt) return null;
      return Math.round((decidedAt - raisedAt) / (1000 * 60 * 60));
    })
    .filter((value): value is number => value !== null);

  const openAgesHours = concerns
    .filter((concern) => concern.status !== "closed")
    .map((concern) =>
      Math.max(
        0,
        Math.round((capturedNow - new Date(concern.raisedAt).getTime()) / (1000 * 60 * 60)),
      ),
    );

  const overrideBySeverity = concerns.reduce<Record<string, number>>((acc, concern) => {
    const wasOverridden = dispositions.some(
      (item) => item.concernId === concern.id && item.outcome === "override",
    );
    if (wasOverridden) {
      acc[concern.severity] = (acc[concern.severity] ?? 0) + 1;
    }
    return acc;
  }, {});

  const shell = presentationMode
    ? "rounded-lg border border-slate-200 bg-white p-3 shadow-none"
    : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <section className={shell}>
      <div className="mb-2 border-b border-slate-200 pb-2">
        <h2 className={`font-semibold text-slate-900 ${presentationMode ? "text-sm" : "text-base"}`}>
          Accountability metrics
        </h2>
        {!presentationMode ? (
          <p className="text-sm text-slate-600">
            Baseline KPI view for disposition quality and risk posture.
          </p>
        ) : null}
      </div>

      <div
        className={`grid gap-2 ${presentationMode ? "sm:grid-cols-2" : "gap-3 md:grid-cols-2 xl:grid-cols-4"}`}
      >
        <MetricCard
          label="Disposition completeness"
          value={`${Math.round(completenessRate * 100)}%`}
          detail={`${dispositionedConcernIds.size}/${concerns.length} concerns`}
          compact={presentationMode}
        />
        <MetricCard
          label="Median time to disposition"
          value={`${median(dispositionDurations)}h`}
          detail={`${dispositionDurations.length} dispositioned concerns`}
          compact={presentationMode}
        />
        <MetricCard
          label="Override records"
          value={`${overrides.length}`}
          detail="Tracked for weekly review"
          compact={presentationMode}
        />
        <MetricCard
          label="Median open concern age"
          value={`${median(openAgesHours)}h`}
          detail="Open concerns only"
          compact={presentationMode}
        />
      </div>
      <TechnicalBreakout className="mt-3 bg-slate-50" title="accountability metric formulas and time caveat">
        <p>
          These metrics are computed from local concern, disposition, and override records for the current
          question. They measure process completeness and traceability, not whether the final decision is
          substantively correct.
        </p>
        <AlgorithmBlock>{`dispositionCompleteness =
  unique(dispositions.concernId).size / concerns.length

timeToDispositionHours =
  round((disposition.decidedAt - concern.raisedAt) / 1 hour)

medianTimeToDisposition = median(valid timeToDispositionHours)
medianOpenConcernAge =
  median(round((capturedNow - concern.raisedAt) / 1 hour))

overridesBySeverity =
  count concerns whose disposition outcome == override, grouped by concern.severity`}</AlgorithmBlock>
        <p>
          The open-age clock uses a single timestamp captured when this metrics component mounts. It is a
          snapshot for presentation, not a live timer.
        </p>
      </TechnicalBreakout>

      {presentationMode ? (
        <details className="mt-2 rounded-md border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">
            Overrides by severity
          </summary>
          <div className="border-t border-slate-200 p-3 text-xs text-slate-700">
            {Object.keys(overrideBySeverity).length === 0
              ? "None yet"
              : Object.entries(overrideBySeverity)
                  .map(([severity, count]) => `${severity}: ${count}`)
                  .join(" | ")}
          </div>
        </details>
      ) : (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div className="font-semibold text-slate-900">Overrides by severity</div>
          <div className="mt-1">
            {Object.keys(overrideBySeverity).length === 0
              ? "None yet"
              : Object.entries(overrideBySeverity)
                  .map(([severity, count]) => `${severity}: ${count}`)
                  .join(" | ")}
          </div>
        </div>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  compact,
}: {
  label: string;
  value: string;
  detail: string;
  compact: boolean;
}) {
  return (
    <article
      className={`rounded-md border border-slate-200 bg-slate-50 ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <div
        className={`uppercase tracking-wide text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {label}
      </div>
      <div className={`mt-0.5 font-semibold text-slate-900 ${compact ? "text-base" : "text-lg"}`}>
        {value}
      </div>
      <div className={`mt-0.5 text-slate-600 ${compact ? "text-[11px]" : "text-xs"}`}>{detail}</div>
    </article>
  );
}
