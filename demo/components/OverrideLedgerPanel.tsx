import { ConcernRecord, OverrideRecord } from "@/lib/types";

interface OverrideLedgerPanelProps {
  presentationMode?: boolean;
  overrides: OverrideRecord[];
  concerns: ConcernRecord[];
}

export function OverrideLedgerPanel({
  presentationMode = false,
  overrides,
  concerns,
}: OverrideLedgerPanelProps) {
  const concernMap = new Map(concerns.map((concern) => [concern.id, concern]));
  const shell = presentationMode
    ? "rounded-lg border border-slate-200 bg-white p-3 shadow-none"
    : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <section className={shell}>
      <div className="mb-2 border-b border-slate-200 pb-2">
        <h2 className={`font-semibold text-slate-900 ${presentationMode ? "text-sm" : "text-base"}`}>
          Override ledger
        </h2>
        {!presentationMode ? (
          <p className="text-sm text-slate-600">Every override is attributable and reviewable.</p>
        ) : null}
      </div>
      <div className="space-y-2">
        {overrides.length === 0 ? (
          <div
            className={`rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-600 ${
              presentationMode ? "p-2 text-xs" : "p-3 text-sm"
            }`}
          >
            No overrides recorded for this decision.
          </div>
        ) : (
          overrides.map((override) => {
            const concern = concernMap.get(override.concernId);
            const body = (
              <>
                <div className={`mt-1 text-slate-700 ${presentationMode ? "text-xs" : "text-xs"}`}>
                  {override.rationale}
                </div>
                <div
                  className={`mt-2 grid gap-2 text-slate-600 md:grid-cols-3 ${
                    presentationMode ? "text-[11px]" : "text-xs"
                  }`}
                >
                  <div>Approved by: {override.approvedBy || "-"}</div>
                  <div>Approved at: {override.approvedAt}</div>
                  <div>Review date: {override.reviewDate || "-"}</div>
                </div>
                <div className={`mt-2 text-slate-600 ${presentationMode ? "text-[11px]" : "text-xs"}`}>
                  Residual risk: {override.residualRisk || "-"}
                </div>
              </>
            );

            if (presentationMode) {
              return (
                <details
                  key={override.id}
                  className="rounded-md border border-slate-200 bg-slate-50 open:bg-white"
                >
                  <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
                    {concern?.title ?? "Unknown concern"}
                    <span className="ml-2 text-slate-500">{override.approvedAt.slice(0, 10)}</span>
                  </summary>
                  <div className="border-t border-slate-200 p-3">{body}</div>
                </details>
              );
            }

            return (
              <article key={override.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-semibold text-slate-900">
                  {concern?.title ?? "Unknown concern"}
                </div>
                {body}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
