import { NextResponse } from "next/server";
import { normalizeExecutionMode } from "@/lib/executionMode";
import { runCommitteePipeline } from "@/lib/pipeline";
import { CommitteeEvent } from "@/lib/types";

function sseEvent(event: CommitteeEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: Request) {
  try {
    const { question, rounds, executionMode } = (await req.json()) as {
      question?: string;
      rounds?: number;
      executionMode?: "local" | "api" | "auto";
    };
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: CommitteeEvent) => {
          controller.enqueue(encoder.encode(sseEvent(event)));
        };

        try {
          await runCommitteePipeline(question, {
            onPhase: (phase) => send({ type: "phase", phase }),
            onCharacterStart: (characterId, phase) =>
              send({ type: "character_start", characterId, phase }),
            onCharacterChunk: (characterId, chunk) =>
              send({ type: "character_chunk", characterId, chunk }),
            onCharacterDone: (characterId) => send({ type: "character_done", characterId }),
            onResearchStart: (characterId) => send({ type: "research_start", characterId }),
            onResearchDone: (characterId, packet) =>
              send({ type: "research_done", characterId, packet }),
            onResearchError: (characterId, message) =>
              send({ type: "research_error", characterId, message }),
            onDone: () => send({ type: "committee_done" }),
          }, { rounds, executionMode: normalizeExecutionMode(executionMode) });
        } catch (error) {
          send({
            type: "error",
            message: (error as Error).message ?? "Committee pipeline failed.",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to start committee." },
      { status: 500 },
    );
  }
}
