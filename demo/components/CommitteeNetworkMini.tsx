import { CommitteeInteractionGraphSvg } from "@/components/CommitteeInteractionGraphSvg";
import { AlgorithmBlock, TechnicalBreakout } from "@/components/TechnicalBreakout";
import { CHARACTERS } from "@/lib/characters";
import { CharacterRoundState } from "@/lib/types";

interface CommitteeNetworkMiniProps {
  /** Narrow dock / sidebar: tighter graph cap so legend + technical notes stay scrollable. */
  variant?: "default" | "sidebar";
  /** When true, strip outer card chrome so a parent dock supplies border/background. */
  dockEmbedded?: boolean;
  /** Observability column: shorter graph and hide deep-dive technical notes. */
  compactDock?: boolean;
  characterResponses: Record<string, CharacterRoundState>;
  isRunning?: boolean;
  currentPhase?: number;
  batchProgress?: { current: number; total: number } | null;
}

const SIDEBAR_GRAPH_CLASS =
  "h-auto w-full max-h-[min(26svh,11rem)] sm:max-h-[min(30svh,12rem)] md:max-h-[min(32svh,13rem)] rounded-md border border-slate-200 bg-slate-50";

const SIDEBAR_GRAPH_COMPACT_CLASS =
  "h-auto w-full max-h-[min(20svh,8.5rem)] sm:max-h-[min(22svh,9.25rem)] rounded-md border border-slate-200 bg-slate-50";

export function CommitteeNetworkMini({
  variant = "default",
  dockEmbedded = false,
  compactDock = false,
  characterResponses,
  isRunning = false,
  currentPhase = 0,
  batchProgress = null,
}: CommitteeNetworkMiniProps) {
  const researchByName = CHARACTERS.reduce<Record<string, CharacterRoundState["researchState"]>>(
    (acc, character) => {
      acc[character.name] = characterResponses[character.id]?.researchState ?? "idle";
      return acc;
    },
    {},
  );

  const anyResearchRunning = Object.values(researchByName).some((state) => state === "running");
  const runningLabel =
    currentPhase === 0
      ? "Starting committee"
      : currentPhase === 1
        ? "Phase 1: collecting independent responses"
        : currentPhase === 2
          ? "Phase 2: cross-examination in progress"
          : `Phase ${currentPhase}: additional deliberation`;

  const shellClass = dockEmbedded
    ? `rounded-none border-0 bg-transparent ${compactDock ? "p-1.5 pt-2" : "p-2 pt-3"} shadow-none transition ${
        isRunning ? "ring-2 ring-amber-300/60 ring-inset" : "ring-0"
      }`
    : `rounded-xl border bg-white p-3 shadow-sm transition ${
        isRunning ? "border-amber-300 ring-2 ring-amber-200" : "border-slate-200"
      }`;

  return (
    <section className={shellClass} aria-busy={isRunning}>
      <div className={`mb-2 flex items-center justify-between ${dockEmbedded ? "px-1" : ""}`}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Live Interaction
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {isRunning ? (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              committee running
            </span>
          ) : null}
          {anyResearchRunning ? (
            <span className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
              researching
            </span>
          ) : null}
        </div>
      </div>

      {isRunning ? (
        <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide">Committee still running</div>
              <div className="mt-0.5 text-[11px] text-amber-900">
                {runningLabel}
                {batchProgress ? ` (${batchProgress.current}/${batchProgress.total})` : ""}
              </div>
            </div>
            <div className="flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500 [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      ) : null}

      <CommitteeInteractionGraphSvg
        characterResponses={characterResponses}
        className={
          variant === "sidebar"
            ? compactDock
              ? SIDEBAR_GRAPH_COMPACT_CLASS
              : SIDEBAR_GRAPH_CLASS
            : undefined
        }
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
          Aye
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-600" />
          Nay
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-slate-500" />
          Undet.
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
          Researching
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border border-amber-500" />
          Vote changed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-px w-3 bg-sky-500" />
          Cross-talk
        </span>
      </div>
      {compactDock ? null : (
        <TechnicalBreakout className="mt-2 bg-slate-50" title="node size, rings, fills, and cross-talk edges">
          <p>
            The graph is a compact derived view of the same transcript. It is not a semantic conversation
            graph; edges are literal name mentions during cross-examination text only.
          </p>
          <AlgorithmBlock>{`edge(fromRole, toRole).weight =
  count(case-insensitive whole-word mentions of toRole.name in fromRole.phase2)

edge color:
  weight >= 3 -> strong sky
  weight == 2 -> medium sky
  otherwise  -> slate

node fill =
  research is running ? violet
  : inferred final vote Aye ? green
  : inferred final vote Nay ? red
  : gray

node ring = amber if inferred vote changed, slate otherwise
node radius = 18 + (metacognitionPressure / maxPressure) * 4`}</AlgorithmBlock>
        </TechnicalBreakout>
      )}
    </section>
  );
}
