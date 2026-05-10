import { CHARACTERS } from "./characters";
import { CharacterRoundState } from "./types";

export type NodeName = "Maya" | "Frankie" | "Joe" | "Vic" | "Tammy";

export interface NodePosition {
  x: number;
  y: number;
}

export const FULL_POSITIONS: Record<NodeName, NodePosition> = {
  Maya: { x: 80, y: 40 },
  Frankie: { x: 250, y: 40 },
  Joe: { x: 340, y: 150 },
  Vic: { x: 170, y: 220 },
  Tammy: { x: 20, y: 150 },
};

/** Live mini graph: four corners of a rectangle + center (reads as a box, not a ring). */
export const MINI_POSITIONS: Record<NodeName, NodePosition> = {
  Maya: { x: 45, y: 55 },
  Frankie: { x: 195, y: 55 },
  Tammy: { x: 45, y: 265 },
  Vic: { x: 195, y: 265 },
  Joe: { x: 120, y: 160 },
};

export const RESEARCH_RUNNING_FILL = "#8b5cf6";

export function voteColor(vote: string): string {
  if (vote === "Aye") return "#16a34a";
  if (vote === "Nay") return "#dc2626";
  return "#64748b";
}

export function voteChangeRingColor(changed: boolean): string {
  return changed ? "#f59e0b" : "#cbd5e1";
}

export function edgeColor(weight: number): string {
  if (weight >= 3) return "#0ea5e9";
  if (weight === 2) return "#38bdf8";
  return "#94a3b8";
}

export function nodeFillForState(
  vote: string,
  researchState: CharacterRoundState["researchState"],
): string {
  if (researchState === "running") return RESEARCH_RUNNING_FILL;
  return voteColor(vote);
}

export interface InteractionEdge {
  from: NodeName;
  to: NodeName;
  weight: number;
}

export function buildInteractionEdges(
  state: Record<string, CharacterRoundState>,
): InteractionEdge[] {
  const names = CHARACTERS.map((c) => c.name) as NodeName[];
  const edges: InteractionEdge[] = [];

  for (const speaker of CHARACTERS) {
    const text = (state[speaker.id]?.phase2 ?? "").toLowerCase();
    for (const target of names) {
      if (target.toLowerCase() === speaker.name.toLowerCase()) continue;
      const mentions = (text.match(new RegExp(`\\b${target.toLowerCase()}\\b`, "g")) ?? []).length;
      if (mentions > 0) {
        edges.push({ from: speaker.name as NodeName, to: target, weight: mentions });
      }
    }
  }

  return edges;
}
