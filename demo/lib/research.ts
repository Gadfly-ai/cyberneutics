import Anthropic from "@anthropic-ai/sdk";
import { CharacterResearchTrace, ResearchPacket, ResearchResult } from "./types";
import { buildResearchUserPrompt, RESEARCHER_SYSTEM_PROMPT } from "./prompts";

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 500;

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object found in research response.");
  }
  return match[0];
}

function normalizeResearchResult(raw: unknown): ResearchResult {
  const value = (raw ?? {}) as Partial<ResearchResult>;
  const findings = Array.isArray(value.findings)
    ? value.findings.filter((item): item is string => typeof item === "string").slice(0, 4)
    : [];
  const caveats = Array.isArray(value.caveats)
    ? value.caveats.filter((item): item is string => typeof item === "string").slice(0, 3)
    : [];
  const confidence =
    value.confidence === "low" || value.confidence === "medium" || value.confidence === "high"
      ? value.confidence
      : "medium";

  return {
    query:
      typeof value.query === "string" && value.query.trim().length > 0
        ? value.query.trim()
        : "Context-aware committee evidence synthesis",
    findings:
      findings.length > 0
        ? findings
        : ["No high-confidence finding was extracted from the research response."],
    caveats:
      caveats.length > 0
        ? caveats
        : ["Research response was incomplete; treat this packet as low confidence."],
    confidence,
  };
}

export function renderResearchPacket(packet: ResearchPacket): string {
  if (packet.status !== "ok" || !packet.result) {
    return `Status: ${packet.status}\nError: ${packet.error ?? "No research packet available."}`;
  }

  return [
    `Status: ok`,
    `Query: ${packet.result.query}`,
    `Confidence: ${packet.result.confidence}`,
    `Findings:`,
    ...packet.result.findings.map((item) => `- ${item}`),
    `Caveats:`,
    ...packet.result.caveats.map((item) => `- ${item}`),
  ].join("\n");
}

export async function runCharacterResearch(
  apiKey: string,
  input: { characterId: string; characterName: string; propensity: string; question: string },
): Promise<CharacterResearchTrace> {
  const basePacket: Omit<ResearchPacket, "status"> = {
    provider: "anthropic",
    fetchedAt: new Date().toISOString(),
  };

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: RESEARCHER_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildResearchUserPrompt(input.characterName, input.propensity, input.question),
        },
      ],
    });

    const text = response.content
      .map((item) => (item.type === "text" ? item.text : ""))
      .join("\n")
      .trim();
    const parsed = JSON.parse(extractJson(text));
    const result = normalizeResearchResult(parsed);

    return {
      characterId: input.characterId,
      packet: {
        ...basePacket,
        status: "ok",
        result,
      },
    };
  } catch (error) {
    return {
      characterId: input.characterId,
      packet: {
        ...basePacket,
        status: "failed",
        error: (error as Error).message ?? "Research call failed.",
      },
    };
  }
}
