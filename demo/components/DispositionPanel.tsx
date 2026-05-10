import { ConcernRecord, DispositionOutcome } from "@/lib/types";

interface DispositionPanelProps {
  presentationMode?: boolean;
  concerns: ConcernRecord[];
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

export function DispositionPanel({
  presentationMode = false,
  concerns,
  onDispositionComplete,
}: DispositionPanelProps) {
  const actionable = concerns.filter((concern) => concern.status !== "closed");
  const shell = presentationMode
    ? "rounded-lg border border-slate-200 bg-white p-3 shadow-none"
    : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <section className={shell}>
      <div className="mb-2 border-b border-slate-200 pb-2">
        <h2 className={`font-semibold text-slate-900 ${presentationMode ? "text-sm" : "text-base"}`}>
          Mandatory disposition
        </h2>
        {!presentationMode ? (
          <p className="text-sm text-slate-600">
            Every concern must be dispositioned as accept, mitigate, or override.
          </p>
        ) : null}
      </div>

      <div className={presentationMode ? "space-y-2" : "space-y-3"}>
        {actionable.length === 0 ? (
          <div
            className={`rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-600 ${
              presentationMode ? "p-2 text-xs" : "p-3 text-sm"
            }`}
          >
            No open concerns requiring disposition.
          </div>
        ) : (
          actionable.map((concern) => (
            <DispositionForm
              key={concern.id}
              concern={concern}
              onDispositionComplete={onDispositionComplete}
              compact={presentationMode}
            />
          ))
        )}
      </div>
    </section>
  );
}

function DispositionForm({
  concern,
  onDispositionComplete,
  compact,
}: {
  concern: ConcernRecord;
  onDispositionComplete: DispositionPanelProps["onDispositionComplete"];
  compact: boolean;
}) {
  const t = compact ? "text-xs" : "text-sm";
  const minH = compact ? "min-h-[56px]" : "min-h-[72px]";

  return (
    <form
      className={`rounded-md border border-slate-200 bg-slate-50 p-2 ${compact ? "text-xs" : ""}`}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const rationale = String(data.get("rationale") ?? "").trim();
        const decidedBy = String(data.get("decidedBy") ?? "").trim();
        const outcome = String(data.get("outcome") ?? "accept") as DispositionOutcome;
        if (!rationale || !decidedBy) return;
        onDispositionComplete({
          concernId: concern.id,
          outcome,
          rationale,
          decidedBy,
          mitigationActions: String(data.get("mitigationActions") ?? "").trim(),
          mitigationOwner: String(data.get("mitigationOwner") ?? "").trim(),
          mitigationDueDate: String(data.get("mitigationDueDate") ?? "").trim() || null,
          overrideAuthority: String(data.get("overrideAuthority") ?? "").trim(),
          residualRisk: String(data.get("residualRisk") ?? "").trim(),
          reviewDate: String(data.get("reviewDate") ?? "").trim() || null,
        });
      }}
    >
      <div className={`mb-1 font-semibold text-slate-900 ${compact ? "text-xs" : "text-sm"}`}>
        {concern.title}
      </div>
      <div className={`mb-2 text-slate-600 ${compact ? "text-[11px] leading-relaxed" : "text-xs"}`}>
        {concern.description}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <select
          name="outcome"
          defaultValue="accept"
          className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
        >
          <option value="accept">accept</option>
          <option value="mitigate">mitigate</option>
          <option value="override">override</option>
        </select>
        <input
          name="decidedBy"
          placeholder="Decided by"
          className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
          required
        />
      </div>
      <textarea
        name="rationale"
        placeholder="Disposition rationale"
        className={`mt-2 ${minH} w-full rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
        required
      />
      {compact ? (
        <>
          <details className="mt-2 rounded border border-slate-200 bg-white">
            <summary className="cursor-pointer px-2 py-1.5 text-[11px] font-medium text-slate-600">
              Mitigation fields (if mitigating)
            </summary>
            <div className="grid gap-2 border-t border-slate-100 p-2 md:grid-cols-3">
              <input
                name="mitigationActions"
                placeholder="Mitigation actions"
                className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
              />
              <input
                name="mitigationOwner"
                placeholder="Mitigation owner"
                className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
              />
              <input
                name="mitigationDueDate"
                type="date"
                className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
              />
            </div>
          </details>
          <details className="mt-2 rounded border border-slate-200 bg-white">
            <summary className="cursor-pointer px-2 py-1.5 text-[11px] font-medium text-slate-600">
              Override fields (if overriding)
            </summary>
            <div className="grid gap-2 border-t border-slate-100 p-2 md:grid-cols-3">
              <input
                name="overrideAuthority"
                placeholder="Override authority"
                className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
              />
              <input
                name="residualRisk"
                placeholder="Residual risk statement"
                className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
              />
              <input
                name="reviewDate"
                type="date"
                className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
              />
            </div>
          </details>
        </>
      ) : (
        <>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <input
              name="mitigationActions"
              placeholder="Mitigation actions (if mitigating)"
              className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
            />
            <input
              name="mitigationOwner"
              placeholder="Mitigation owner"
              className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
            />
            <input
              name="mitigationDueDate"
              type="date"
              className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
            />
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <input
              name="overrideAuthority"
              placeholder="Override authority (if override)"
              className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
            />
            <input
              name="residualRisk"
              placeholder="Residual risk statement"
              className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
            />
            <input
              name="reviewDate"
              type="date"
              className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${t}`}
            />
          </div>
        </>
      )}
      <div className="mt-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          Save disposition
        </button>
      </div>
    </form>
  );
}
