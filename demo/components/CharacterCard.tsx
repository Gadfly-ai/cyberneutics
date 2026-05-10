import { Character, ResearchPacket } from "@/lib/types";

interface CharacterCardProps {
  character: Character;
  phase: 1 | 2;
  content: string;
  isStreaming: boolean;
  isDone: boolean;
  researchState: "idle" | "running" | "ok" | "failed" | "skipped";
  researchPacket: ResearchPacket | null;
}

export function CharacterCard({
  character,
  phase,
  content,
  isStreaming,
  isDone,
  researchState,
  researchPacket,
}: CharacterCardProps) {
  const waiting = !content && !isStreaming && !isDone;
  const borderColor = isStreaming ? character.accentHex : "#cbd5e1";
  const opacity = waiting ? "opacity-60" : "opacity-100";

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 transition-all ${opacity}`}
      style={{ borderLeftWidth: "4px", borderLeftColor: borderColor }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: character.accentHex }}>
            {character.name}
          </div>
          <div className="text-xs text-slate-600">{character.propensity}</div>
        </div>
        <div
          className={`rounded-full border px-2 py-0.5 text-xs ${
            isStreaming ? "animate-pulse" : ""
          }`}
          style={{ borderColor: character.accentHex, color: character.accentHex }}
        >
          Round {phase}
        </div>
      </div>
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <span className="font-semibold uppercase tracking-wide text-slate-500">Research</span>
        <span
          className={`rounded-full border px-2 py-0.5 ${
            researchState === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : researchState === "failed"
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : researchState === "running"
                  ? "border-sky-300 bg-sky-50 text-sky-700"
                  : "border-slate-300 bg-slate-50 text-slate-600"
          }`}
        >
          {researchState}
        </span>
      </div>
      {researchPacket ? (
        <details className="mb-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
          <summary className="cursor-pointer font-medium text-slate-800">Research packet</summary>
          {researchPacket.result ? (
            <div className="mt-2 space-y-2">
              <div>
                <div className="font-semibold">Query</div>
                <div>{researchPacket.result.query}</div>
              </div>
              <div>
                <div className="font-semibold">Findings</div>
                <ul className="list-disc pl-5">
                  {researchPacket.result.findings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-semibold">Caveats</div>
                <ul className="list-disc pl-5">
                  {researchPacket.result.caveats.map((caveat) => (
                    <li key={caveat}>{caveat}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-rose-700">{researchPacket.error ?? "No research data."}</div>
          )}
        </details>
      ) : null}
      <div className="min-h-20 whitespace-pre-wrap text-sm leading-6 text-slate-800">
        {waiting ? "Waiting..." : content}
      </div>
    </div>
  );
}
