import Anthropic from "@anthropic-ai/sdk";
import { CHARACTERS } from "./characters";
import { buildLocalCommitteeRound1, buildLocalCommitteeRound2, localChunksForCharacter } from "./localDemo";
import {
  buildCrossExaminationPrompt,
  buildFollowupDeliberationPrompt,
  buildRoundOnePromptWithResearch,
} from "./prompts";
import { CommitteePhase, ExecutionMode, ResearchPacket } from "./types";
import { inferVote } from "./voteInference";
import { shouldUseLocal } from "./executionMode";
import { renderResearchPacket, runCharacterResearch } from "./research";

const MODEL = "claude-sonnet-4-5";

export interface PipelineCallbacks {
  onPhase: (phase: CommitteePhase) => void;
  onCharacterStart: (characterId: string, phase: CommitteePhase) => void;
  onCharacterChunk: (characterId: string, chunk: string) => void;
  onCharacterDone: (characterId: string) => void;
  onResearchStart: (characterId: string) => void;
  onResearchDone: (characterId: string, packet: ResearchPacket) => void;
  onResearchError: (characterId: string, message: string) => void;
  onDone: () => void;
}

interface RoundResult {
  [characterId: string]: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamCharacterResponse(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  characterId: string,
  callbacks: Pick<PipelineCallbacks, "onCharacterChunk">,
): Promise<string> {
  let fullText = "";

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      const delta = chunk.delta.text;
      fullText += delta;
      callbacks.onCharacterChunk(characterId, delta);
    }
  }

  return fullText;
}

function buildPhaseTwoContext(question: string, roundOne: RoundResult): string {
  const transcript = CHARACTERS.map(
    (character) => `${character.name} (Round 1):\n${roundOne[character.id] ?? "(no response)"}`,
  ).join("\n\n");

  return `Original question:
${question}

Round 1 responses:
${transcript}`;
}

function buildPhaseContext(question: string, rounds: RoundResult[]): string {
  const transcript = rounds
    .map((round, idx) => {
      const perCharacter = CHARACTERS.map(
        (character) => `${character.name} (Round ${idx + 1}):\n${round[character.id] ?? "(no response)"}`,
      ).join("\n\n");
      return `Round ${idx + 1} responses:\n${perCharacter}`;
    })
    .join("\n\n");

  return `Original question:
${question}

${transcript}`;
}

export async function runCommitteePipeline(
  question: string,
  callbacks: PipelineCallbacks,
  options?: { rounds?: number; executionMode?: ExecutionMode },
): Promise<{ rounds: RoundResult[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useLocal = shouldUseLocal(options?.executionMode ?? "auto", apiKey);
  const totalRounds = Math.max(2, Math.min(6, options?.rounds ?? 2));

  const roundOne: RoundResult = {};
  const roundTwo: RoundResult = {};

  if (useLocal) {
    callbacks.onPhase(1);
    const localRoundOne = buildLocalCommitteeRound1(question);
    for (const character of CHARACTERS) {
      callbacks.onCharacterStart(character.id, 1);
      const full = localRoundOne[character.id] ?? "";
      for (const chunk of localChunksForCharacter(full)) {
        callbacks.onCharacterChunk(character.id, chunk);
        await delay(25);
      }
      roundOne[character.id] = full;
      callbacks.onCharacterDone(character.id);
      await delay(40);
    }

    callbacks.onPhase(2);
    const localRoundTwo = buildLocalCommitteeRound2(question);
    for (const character of CHARACTERS) {
      callbacks.onCharacterStart(character.id, 2);
      const full = localRoundTwo[character.id] ?? "";
      for (const chunk of localChunksForCharacter(full)) {
        callbacks.onCharacterChunk(character.id, chunk);
        await delay(25);
      }
      roundTwo[character.id] = full;
      callbacks.onCharacterDone(character.id);
      await delay(40);
    }

    if (totalRounds > 2) {
      for (let phase = 3; phase <= totalRounds; phase += 1) {
        callbacks.onPhase(phase);
        for (const character of CHARACTERS) {
          callbacks.onCharacterStart(character.id, phase);
          const previous = localRoundTwo[character.id] ?? "";
          const inferred = inferVote(previous);
          const committedVote = inferred === "Undetermined" ? "Nay" : inferred;
          const full = `${previous}\n\nRound ${phase} update: I refine my position after additional challenge. Current vote: ${committedVote}. I will reverse only if new evidence clearly defeats my main concern.`;
          for (const chunk of localChunksForCharacter(full)) {
            callbacks.onCharacterChunk(character.id, chunk);
            await delay(25);
          }
          roundTwo[character.id] = full;
          callbacks.onCharacterDone(character.id);
          await delay(40);
        }
      }
    }

    callbacks.onDone();
    return { rounds: [roundOne, roundTwo] };
  }

  const client = new Anthropic({ apiKey: apiKey! });

  callbacks.onPhase(1);

  const researchByCharacter = Object.fromEntries(
    await Promise.all(
      CHARACTERS.map(async (character) => {
        callbacks.onResearchStart(character.id);
        const trace = await runCharacterResearch(apiKey!, {
          characterId: character.id,
          characterName: character.name,
          propensity: character.propensity,
          question,
        });
        if (trace.packet.status === "ok") {
          callbacks.onResearchDone(character.id, trace.packet);
        } else {
          callbacks.onResearchError(
            character.id,
            trace.packet.error ?? "Research call failed before a packet was produced.",
          );
        }
        return [character.id, trace.packet] as const;
      }),
    ),
  );

  await Promise.all(
    CHARACTERS.map(async (character) => {
      callbacks.onCharacterStart(character.id, 1);
      const researchContext = renderResearchPacket(researchByCharacter[character.id]);
      const response = await streamCharacterResponse(
        client,
        character.systemPrompt,
        buildRoundOnePromptWithResearch(character.name, question, researchContext),
        character.id,
        callbacks,
      );
      roundOne[character.id] = response;
      callbacks.onCharacterDone(character.id);
    }),
  );

  callbacks.onPhase(2);
  const phaseTwoBaseContext = buildPhaseTwoContext(question, roundOne);

  for (const character of CHARACTERS) {
    callbacks.onCharacterStart(character.id, 2);
    const response = await streamCharacterResponse(
      client,
      character.systemPrompt,
      `${buildCrossExaminationPrompt(character.name)}\n\n${phaseTwoBaseContext}`,
      character.id,
      callbacks,
    );
    roundTwo[character.id] = response;
    callbacks.onCharacterDone(character.id);
  }

  const rounds: RoundResult[] = [roundOne, roundTwo];
  for (let phase = 3; phase <= totalRounds; phase += 1) {
    callbacks.onPhase(phase);
    const nextRound: RoundResult = {};
    const context = buildPhaseContext(question, rounds);
    for (const character of CHARACTERS) {
      callbacks.onCharacterStart(character.id, phase);
      const response = await streamCharacterResponse(
        client,
        character.systemPrompt,
        `${buildFollowupDeliberationPrompt(character.name, phase)}\n\n${context}`,
        character.id,
        callbacks,
      );
      nextRound[character.id] = response;
      callbacks.onCharacterDone(character.id);
    }
    rounds.push(nextRound);
    Object.assign(roundTwo, nextRound);
  }

  callbacks.onDone();
  return { rounds };
}
