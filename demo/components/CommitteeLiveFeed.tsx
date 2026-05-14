"use client";

import { useMemo, useState } from "react";
import { CHARACTERS } from "@/lib/characters";
import { CharacterRoundState } from "@/lib/types";

interface CommitteeLiveFeedProps {
  characterResponses: Record<string, CharacterRoundState>;
  currentPhase: number;
  presentationMode?: boolean;
}

function liveStreamingText(state: CharacterRoundState, currentPhase: number): string {
  const target = currentPhase >= 2 ? "phase2" : "phase1";
  return state[target];
}

export function CommitteeLiveFeed({
  characterResponses,
  currentPhase,
  presentationMode = false,
}: CommitteeLiveFeedProps) {
  /** Start collapsed so streaming is opt-in; expand from the bottom-left dock when you want it. */
  const [minimized, setMinimized] = useState(true);

  const { speaking, researching, count } = useMemo(() => {
    const speakingList: Array<{ character: (typeof CHARACTERS)[number]; state: CharacterRoundState }> =
      [];
    const researchingList: Array<{ character: (typeof CHARACTERS)[number]; state: CharacterRoundState }> =
      [];

    for (const character of CHARACTERS) {
      const state = characterResponses[character.id];
      if (!state) continue;
      if (state.streaming) {
        speakingList.push({ character, state });
      } else if (state.researchState === "running") {
        researchingList.push({ character, state });
      }
    }

    return {
      speaking: speakingList,
      researching: researchingList,
      count: speakingList.length + researchingList.length,
    };
  }, [characterResponses]);

  const hasLiveActivity = count > 0;

  if (!hasLiveActivity) {
    return null;
  }

  const bodyClass = presentationMode ? "text-sm leading-relaxed" : "text-xs leading-relaxed";
  const titleClass = presentationMode ? "text-sm font-semibold" : "text-xs font-semibold";

  if (minimized) {
    return (
      <div
        className="fixed bottom-4 left-4 z-50 max-md:bottom-3 max-md:left-3"
        role="status"
        aria-label={`Committee live activity: ${count} active`}
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 shadow-md transition hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-sky-500"
            aria-hidden
          />
          Live ({count})
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-50 max-h-[42vh] w-[min(100vw-1.5rem,22rem)] max-md:bottom-3 max-md:left-3 max-md:max-h-[38vh]"
      role="region"
      aria-label="Committee live communication"
    >
      <div className="flex max-h-[inherit] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-sky-500"
              aria-hidden
            />
            <span className={`text-slate-900 ${titleClass}`}>Live committee</span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              Phase {currentPhase}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Minimize live committee feed"
          >
            Minimize
          </button>
        </div>

        <div
          className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {researching.length > 0 ? (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Researching
              </div>
              <ul className="space-y-1.5">
                {researching.map(({ character }) => (
                  <li
                    key={character.id}
                    className="flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-sky-900"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-sky-500"
                      aria-hidden
                    />
                    <span className={`font-semibold ${bodyClass}`} style={{ color: character.accentHex }}>
                      {character.name}
                    </span>
                    <span className={`text-slate-600 ${bodyClass}`}>Gathering context…</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {speaking.length > 0 ? (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Speaking now
              </div>
              <ul className="space-y-2">
                {speaking.map(({ character, state }) => {
                  const phaseForLabel = currentPhase >= 2 ? 2 : 1;
                  const text = liveStreamingText(state, currentPhase);
                  return (
                    <li
                      key={character.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2"
                      style={{ borderLeftWidth: "3px", borderLeftColor: character.accentHex }}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span
                          className={`font-semibold ${presentationMode ? "text-sm" : "text-xs"}`}
                          style={{ color: character.accentHex }}
                        >
                          {character.name}
                        </span>
                        <span
                          className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold animate-pulse`}
                          style={{ borderColor: character.accentHex, color: character.accentHex }}
                        >
                          Round {phaseForLabel}
                        </span>
                      </div>
                      <div
                        className={`max-h-28 overflow-y-auto whitespace-pre-wrap break-words text-slate-800 ${bodyClass}`}
                      >
                        {text || "…"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
