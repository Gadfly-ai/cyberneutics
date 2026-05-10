import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { normalizeExecutionMode, shouldUseLocal } from "@/lib/executionMode";
import { buildLocalEvaluation } from "@/lib/localDemo";
import { EVALUATOR_PROMPT } from "@/lib/prompts";
import { EvaluationResult } from "@/lib/types";

const MODEL = "claude-sonnet-4-5";

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object found in evaluator response.");
  }
  return match[0];
}

export async function POST(req: Request) {
  try {
    const { question, transcript, mode, executionMode } = (await req.json()) as {
      question?: string;
      transcript?: string;
      mode?: "naive" | "committee";
      executionMode?: "local" | "api" | "auto";
    };

    if (!question?.trim() || !transcript?.trim()) {
      return NextResponse.json(
        { error: "Both question and transcript are required." },
        { status: 400 },
      );
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const useLocal = shouldUseLocal(normalizeExecutionMode(executionMode), apiKey);

    if (useLocal) {
      return NextResponse.json(buildLocalEvaluation(mode ?? "committee"));
    }

    const client = new Anthropic({ apiKey: apiKey! });
    const result = await client.messages.create({
      model: MODEL,
      max_tokens: 900,
      system: EVALUATOR_PROMPT,
      messages: [
        {
          role: "user",
          content: `Question:\n${question}\n\nTranscript type: ${mode ?? "committee"}\n\nTranscript:\n${transcript}`,
        },
      ],
    });

    const text = result.content
      .map((item) => (item.type === "text" ? item.text : ""))
      .join("\n")
      .trim();

    const parsed = JSON.parse(extractJson(text)) as EvaluationResult;

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to evaluate committee transcript." },
      { status: 500 },
    );
  }
}
