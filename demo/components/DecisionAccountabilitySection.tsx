"use client";

import { useState } from "react";
import { ConcernRegistryPanel } from "@/components/ConcernRegistryPanel";
import { DecisionAccountabilityMetricsPanel } from "@/components/DecisionAccountabilityMetricsPanel";
import { DispositionPanel } from "@/components/DispositionPanel";
import { OverrideLedgerPanel } from "@/components/OverrideLedgerPanel";
import {
  ConcernRecord,
  DispositionOutcome,
  DispositionRecord,
  OverrideRecord,
  RiskSeverity,
} from "@/lib/types";

type AccountabilityTab = "registry" | "disposition" | "ledger" | "metrics";

interface DecisionAccountabilitySectionProps {
  presentationMode: boolean;
  isDecisionFinalized: boolean;
  undispositionedCount: number;
  concerns: ConcernRecord[];
  dispositions: DispositionRecord[];
  overrides: OverrideRecord[];
  onAddConcern: (input: {
    title: string;
    description: string;
    severity: RiskSeverity;
    owner: string;
    evidenceRef: string;
    raisedBy: string;
  }) => void;
  onUpdateConcern: (concern: ConcernRecord) => void;
  onSeedFromTranscript: () => void;
  onDispositionComplete: (payload: {
    concernId: string;
    outcome: DispositionOutcome;
    rationale: string;
    decidedBy: string;
    mitigationActions: string;
    mitigationOwner: string;
    mitigationDueDate: string | null;
    overrideAuthority: string;
    residualRisk: string;
    reviewDate: string | null;
  }) => void;
}

const TAB_LABELS: Record<AccountabilityTab, string> = {
  registry: "Registry",
  disposition: "Disposition",
  ledger: "Overrides",
  metrics: "Metrics",
};

export function DecisionAccountabilitySection({
  presentationMode,
  isDecisionFinalized,
  undispositionedCount,
  concerns,
  dispositions,
  overrides,
  onAddConcern,
  onUpdateConcern,
  onSeedFromTranscript,
  onDispositionComplete,
}: DecisionAccountabilitySectionProps) {
  const [activeTab, setActiveTab] = useState<AccountabilityTab>("registry");

  const openConcerns = concerns.filter((c) => c.status !== "closed").length;

  return (
    <details
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${
        presentationMode ? "text-[15px]" : ""
      }`}
    >
      <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Decision accountability
            </div>
            <div className="mt-0.5 text-sm text-slate-700">
              Concerns, mandatory disposition, override ledger — expand for depth.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
              {concerns.length} concern{concerns.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
              {openConcerns} open
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
              {overrides.length} override{overrides.length === 1 ? "" : "s"}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 ${
                isDecisionFinalized
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {isDecisionFinalized ? "Ready" : `${undispositionedCount} pending`}
            </span>
          </div>
        </div>
      </summary>

      <div className="border-t border-slate-200 px-3 pb-3 pt-2">
        <div
          role="tablist"
          aria-label="Accountability sections"
          className="mb-3 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1"
        >
          {(Object.keys(TAB_LABELS) as AccountabilityTab[]).map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  selected
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-white/80"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" className="min-h-[120px]">
          {activeTab === "registry" ? (
            <ConcernRegistryPanel
              concerns={concerns}
              onAddConcern={onAddConcern}
              onUpdateConcern={onUpdateConcern}
              onSeedFromTranscript={onSeedFromTranscript}
              presentationMode={presentationMode}
            />
          ) : null}
          {activeTab === "disposition" ? (
            <DispositionPanel
              concerns={concerns}
              onDispositionComplete={onDispositionComplete}
              presentationMode={presentationMode}
            />
          ) : null}
          {activeTab === "ledger" ? (
            <OverrideLedgerPanel
              concerns={concerns}
              overrides={overrides}
              presentationMode={presentationMode}
            />
          ) : null}
          {activeTab === "metrics" ? (
            <DecisionAccountabilityMetricsPanel
              concerns={concerns}
              dispositions={dispositions}
              overrides={overrides}
              presentationMode={presentationMode}
            />
          ) : null}
        </div>
      </div>
    </details>
  );
}
