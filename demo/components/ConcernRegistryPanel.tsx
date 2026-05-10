import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";
import { ConcernRecord, RiskSeverity } from "@/lib/types";

interface ConcernRegistryPanelProps {
  presentationMode?: boolean;
  concerns: ConcernRecord[];
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
}

const SEVERITY_OPTIONS: RiskSeverity[] = ["low", "medium", "high", "critical"];

export function ConcernRegistryPanel({
  presentationMode = false,
  concerns,
  onAddConcern,
  onUpdateConcern,
  onSeedFromTranscript,
}: ConcernRegistryPanelProps) {
  const shell = presentationMode
    ? "rounded-lg border border-slate-200 bg-white p-3 shadow-none"
    : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <section className={shell}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div>
          <h2 className={`font-semibold text-slate-900 ${presentationMode ? "text-sm" : "text-base"}`}>
            Concern registry
          </h2>
          {!presentationMode ? (
            <p className="text-sm text-slate-600">Capture and triage concerns before decision close.</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onSeedFromTranscript}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 transition hover:border-sky-500"
        >
          Seed from transcript
        </button>
      </div>
      <TechnicalBreakout className="mb-3 bg-slate-50" title="concern seeding and finalization relevance">
        <p>
          Seeded concerns come from a transcript scan. The scan is intentionally conservative and inspectable:
          it looks for longer transcript lines containing risk/accountability vocabulary, deduplicates exact
          lines, and caps auto-seeding at five concerns. Manual concerns use the same record shape.
        </p>
        <AlgorithmBlock>{`candidateLines =
  transcript.split("\\n")
    .map(trim)
    .filter(line.length > 30)
    .filter(/risk|concern|failure|assumption|accountability|override|authority|mitigate/i)

seededConcerns =
  unique(candidateLines)
    .slice(0, 5)
    .map((line, index) => {
      title: "Concern " + (index + 1),
      description: line.slice(0, 220),
      severity: "medium",
      evidenceRef: "committee transcript",
      raisedBy: "committee"
    })`}</AlgorithmBlock>
      </TechnicalBreakout>

      {presentationMode ? (
        <details className="mb-3 rounded-md border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">
            Add a concern
          </summary>
          <div className="border-t border-slate-200 p-2">
            <AddConcernForm onAddConcern={onAddConcern} compact />
          </div>
        </details>
      ) : (
        <div className="mb-3">
          <AddConcernForm onAddConcern={onAddConcern} compact={false} />
        </div>
      )}

      <div className="space-y-2">
        {concerns.length === 0 ? (
          <div
            className={`rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-600 ${
              presentationMode ? "p-2 text-xs" : "p-3 text-sm"
            }`}
          >
            No concerns yet.
          </div>
        ) : (
          concerns.map((concern) =>
            presentationMode ? (
              <details
                key={concern.id}
                className="rounded-md border border-slate-200 bg-slate-50 open:bg-white"
              >
                <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
                  <span className="mr-2">{concern.title}</span>
                  <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                    {concern.severity}
                  </span>
                  <span className="ml-2 text-slate-500">{concern.status}</span>
                </summary>
                <div className="border-t border-slate-200 p-3">
                  <ConcernRowFields concern={concern} onUpdateConcern={onUpdateConcern} compact />
                </div>
              </details>
            ) : (
              <div key={concern.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <ConcernRowFields concern={concern} onUpdateConcern={onUpdateConcern} compact={false} />
              </div>
            ),
          )
        )}
      </div>
    </section>
  );
}

function ConcernRowFields({
  concern,
  onUpdateConcern,
  compact,
}: {
  concern: ConcernRecord;
  onUpdateConcern: (concern: ConcernRecord) => void;
  compact: boolean;
}) {
  const labelCls = compact ? "text-[11px]" : "text-xs";
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {!compact ? (
            <>
              <div className="text-sm font-semibold text-slate-900">{concern.title}</div>
              <div className="text-xs text-slate-600">{concern.description}</div>
            </>
          ) : (
            <div className="text-xs text-slate-600">{concern.description}</div>
          )}
        </div>
        <div className={`flex items-center gap-2 ${labelCls}`}>
          <select
            value={concern.severity}
            onChange={(event) =>
              onUpdateConcern({ ...concern, severity: event.target.value as RiskSeverity })
            }
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={concern.status}
            onChange={(event) =>
              onUpdateConcern({
                ...concern,
                status: event.target.value as ConcernRecord["status"],
              })
            }
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            <option value="raised">raised</option>
            <option value="triaged">triaged</option>
            <option value="dispositioned">dispositioned</option>
            <option value="closed">closed</option>
          </select>
        </div>
      </div>
      <div className={`mt-2 grid gap-2 md:grid-cols-3 ${labelCls}`}>
        <input
          value={concern.owner}
          onChange={(event) => onUpdateConcern({ ...concern, owner: event.target.value })}
          className="rounded border border-slate-300 bg-white px-2 py-1"
          placeholder="Owner"
        />
        <input
          value={concern.raisedBy}
          onChange={(event) => onUpdateConcern({ ...concern, raisedBy: event.target.value })}
          className="rounded border border-slate-300 bg-white px-2 py-1"
          placeholder="Raised by"
        />
        <input
          value={concern.evidenceRef}
          onChange={(event) => onUpdateConcern({ ...concern, evidenceRef: event.target.value })}
          className="rounded border border-slate-300 bg-white px-2 py-1"
          placeholder="Evidence ref"
        />
      </div>
    </>
  );
}

function AddConcernForm({
  onAddConcern,
  compact = false,
}: {
  onAddConcern: ConcernRegistryPanelProps["onAddConcern"];
  compact?: boolean;
}) {
  return (
    <form
      className={
        compact
          ? "grid gap-2 rounded-md border border-slate-200 bg-white p-2 text-xs"
          : "grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3"
      }
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title") ?? "").trim();
        const description = String(data.get("description") ?? "").trim();
        if (!title || !description) return;
        onAddConcern({
          title,
          description,
          severity: (String(data.get("severity") ?? "medium") as RiskSeverity) ?? "medium",
          owner: String(data.get("owner") ?? "").trim(),
          evidenceRef: String(data.get("evidenceRef") ?? "").trim(),
          raisedBy: String(data.get("raisedBy") ?? "committee").trim(),
        });
        event.currentTarget.reset();
      }}
    >
      <div className="grid gap-2 md:grid-cols-2">
        <input
          name="title"
          placeholder="Concern title"
          className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${compact ? "text-xs" : "text-sm"}`}
          required
        />
        <select
          name="severity"
          defaultValue="medium"
          className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${compact ? "text-xs" : "text-sm"}`}
        >
          {SEVERITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <input
        name="description"
        placeholder="Description"
        className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${compact ? "text-xs" : "text-sm"}`}
        required
      />
      <div className="grid gap-2 md:grid-cols-3">
        <input
          name="owner"
          placeholder="Owner"
          className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${compact ? "text-xs" : "text-sm"}`}
        />
        <input
          name="raisedBy"
          placeholder="Raised by"
          defaultValue="committee"
          className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${compact ? "text-xs" : "text-sm"}`}
        />
        <input
          name="evidenceRef"
          placeholder="Evidence ref"
          className={`rounded border border-slate-300 bg-white px-2 py-1.5 ${compact ? "text-xs" : "text-sm"}`}
        />
      </div>
      <div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          Add concern
        </button>
      </div>
    </form>
  );
}
