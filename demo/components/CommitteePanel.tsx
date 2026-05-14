import { CHARACTERS } from "@/lib/characters";
import { CharacterRoundState } from "@/lib/types";
import { CharacterCard } from "./CharacterCard";

interface CommitteePanelProps {
  currentPhase: number;
  characterResponses: Record<string, CharacterRoundState>;
  sourceLabel?: string;
  presentationMode?: boolean;
}

export function CommitteePanel({
  currentPhase,
  characterResponses,
  sourceLabel,
  presentationMode = false,
}: CommitteePanelProps) {
  const researchSummary = Object.values(characterResponses).reduce(
    (acc, state) => {
      acc[state.researchState] += 1;
      return acc;
    },
    { idle: 0, running: 0, ok: 0, failed: 0, skipped: 0 },
  );

  return (
    <section className="flex h-[min(70vh,42rem)] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="shrink-0 border-b border-slate-200 pb-2">
        <h2 className="text-base font-semibold text-slate-900" title="Five characters with different perspectives argue in structured rounds">ADVERSARIAL COMMITTEE</h2>
        <p className="text-xs text-slate-600">Five roles, structured disagreement, explicit trade-offs</p>
        {sourceLabel ? (
          <div className="mt-2 inline-block rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
            {sourceLabel}
          </div>
        ) : null}
      </div>

      <div
        className={`mb-3 mt-3 shrink-0 rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-700 ${
          presentationMode ? "text-base" : "text-sm"
        }`}
      >
        {currentPhase === 0 && "Waiting to begin"}
        {currentPhase === 1 && "PHASE 1: Individual Responses"}
        {currentPhase === 2 && "PHASE 2: Cross-Examination"}
        {currentPhase > 2 && `PHASE ${currentPhase}: Additional Deliberation`}
      </div>

      <div className="mb-3 shrink-0 rounded-md border border-slate-200 bg-slate-50 p-2">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Research Health
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-slate-700">
            idle: {researchSummary.idle}
          </span>
          <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-sky-700">
            running: {researchSummary.running}
          </span>
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-emerald-700">
            ok: {researchSummary.ok}
          </span>
          <span className="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-rose-700">
            failed: {researchSummary.failed}
          </span>
          <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-slate-700">
            skipped: {researchSummary.skipped}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {CHARACTERS.map((character) => {
          const state = characterResponses[character.id];
          const content = currentPhase < 2 ? state.phase1 : `${state.phase1}\n\n${state.phase2}`.trim();

          return (
            <CharacterCard
              key={character.id}
              character={character}
              phase={currentPhase === 2 ? 2 : 1}
              content={content}
              isStreaming={state.streaming}
              isDone={state.done}
              researchState={state.researchState}
              researchPacket={state.researchPacket}
            />
          );
        })}
      </div>
    </section>
  );
}
