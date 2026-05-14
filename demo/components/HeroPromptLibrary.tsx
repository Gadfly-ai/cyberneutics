import type { PresetQuestion } from "@/lib/prompts";

interface HeroPromptLibraryProps {
  presets: readonly PresetQuestion[];
  activeQuestion: string;
  onSelect: (question: string) => void;
  disabled: boolean;
  isCybercool: boolean;
}

function chipLabel(preset: PresetQuestion): string {
  return preset.label
    .replace(/^(Convergent|Divergent|Strategy|Governance|Operations|Research|Policy|Philosophy):\s*/i, "")
    .trim();
}

export function HeroPromptLibrary({
  presets,
  activeQuestion,
  onSelect,
  disabled,
  isCybercool,
}: HeroPromptLibraryProps) {
  const isActive = (q: string) => activeQuestion.trim() === q.trim();

  return (
    <div className={`mt-4 ${isCybercool ? "font-mono" : ""}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {isCybercool ? "// suggested_prompts" : "Suggested prompts"}
      </div>
      <div
        className="mt-1.5 flex items-center gap-1.5 overflow-x-auto overflow-y-visible py-0.5 pb-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
        role="list"
        aria-label="Suggested decision prompts"
      >
        {presets.map((preset) => {
          const active = isActive(preset.question);
          return (
            <button
              key={preset.label}
              type="button"
              role="listitem"
              disabled={disabled}
              title={preset.question}
              onClick={() => onSelect(preset.question)}
              className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] leading-tight transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "border-sky-500 bg-sky-50 font-medium text-sky-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="block max-w-[11rem] truncate sm:max-w-[13rem]">{chipLabel(preset)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
