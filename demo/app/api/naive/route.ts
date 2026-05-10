import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { normalizeExecutionMode, shouldUseLocal } from "@/lib/executionMode";
import { buildLocalNaiveAnswer } from "@/lib/localDemo";
import { NAIVE_SYSTEM_PROMPT } from "@/lib/prompts";

const MODEL = "claude-sonnet-4-5";

export async function POST(req: Request) {
  try {
    const { question, executionMode } = (await req.json()) as {
      question?: string;
      executionMode?: "local" | "api" | "auto";
    };
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const useLocal = shouldUseLocal(normalizeExecutionMode(executionMode), apiKey);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (useLocal) {
            const text = buildLocalNaiveAnswer(question);
            for (const chunk of text.match(/.{1,30}/g) ?? [text]) {
              controller.enqueue(encoder.encode(chunk));
            }
            return;
          }

          const client = new Anthropic({ apiKey: apiKey! });
          const response = client.messages.stream({
            model: MODEL,
            max_tokens: 500,
            system: NAIVE_SYSTEM_PROMPT,
            messages: [{ role: "user", content: question }],
          });

          for await (const chunk of response) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(`\n\n[Naive call failed: ${(error as Error).message ?? "Unknown error"}]`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to run naive call." },
      { status: 500 },
    );
  }
}
