import { ExecutionMode } from "./types";

export function normalizeExecutionMode(value: unknown): ExecutionMode {
  if (value === "local" || value === "api" || value === "auto") {
    return value;
  }
  return "auto";
}

export function shouldUseLocal(mode: ExecutionMode, apiKey: string | undefined): boolean {
  if (mode === "local") {
    return true;
  }
  if (mode === "api") {
    if (!apiKey) {
      throw new Error("Execution mode is set to API, but ANTHROPIC_API_KEY is missing.");
    }
    return false;
  }

  return process.env.LOCAL_DEMO_ONLY === "1" || !apiKey;
}
