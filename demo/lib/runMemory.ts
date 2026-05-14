import { RunSnapshot } from "./types";

const STORAGE_KEY_V2 = "cyberneutics:run-memory:v2";
const STORAGE_KEY_V1 = "cyberneutics:run-memory:v1";

interface StoredRunMemory {
  runs: RunSnapshot[];
}

function normalizeSnapshot(run: RunSnapshot): RunSnapshot {
  const batchIndex = run.batchIndex === undefined ? null : run.batchIndex;
  const batchTotal = run.batchTotal === undefined ? null : run.batchTotal;
  return {
    ...run,
    deliberationRoundsConfigured: run.deliberationRoundsConfigured ?? run.roundsUsed,
    adaptiveDepth: run.adaptiveDepth ?? false,
    naiveKeyFinding: run.naiveKeyFinding ?? "",
    committeeKeyFinding: run.committeeKeyFinding ?? "",
    naiveOutputExcerpt: run.naiveOutputExcerpt ?? "",
    committeeTranscriptExcerpt: run.committeeTranscriptExcerpt ?? "",
    runKind: run.runKind ?? (batchIndex != null && batchTotal != null ? "batch" : "single"),
    batchIndex,
    batchTotal,
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStore(): StoredRunMemory {
  if (!isBrowser()) return { runs: [] };
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as StoredRunMemory;
      if (!parsed || !Array.isArray(parsed.runs)) return { runs: [] };
      return { runs: parsed.runs.map(normalizeSnapshot) };
    }
    const rawV1 = window.localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as StoredRunMemory;
      if (!parsed || !Array.isArray(parsed.runs)) return { runs: [] };
      const runs = parsed.runs.map(normalizeSnapshot);
      writeStore({ runs });
      try {
        window.localStorage.removeItem(STORAGE_KEY_V1);
      } catch {
        /* ignore */
      }
      return { runs };
    }
    return { runs: [] };
  } catch {
    return { runs: [] };
  }
}

function writeStore(store: StoredRunMemory): void {
  if (!isBrowser()) return;
  const normalized = { runs: store.runs.map(normalizeSnapshot) };
  window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(normalized));
}

export function normalizeQuestionKey(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}

export function createRunSnapshotId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listRunMemoryByQuestion(questionKey: string): RunSnapshot[] {
  const store = readStore();
  return store.runs.filter((run) => run.questionKey === questionKey);
}

export function listAllRunMemory(): RunSnapshot[] {
  return readStore().runs;
}

export function appendRunMemory(snapshot: RunSnapshot): RunSnapshot[] {
  const store = readStore();
  const runs = [...store.runs, snapshot];
  writeStore({ runs });
  return runs;
}

export function clearRunMemoryByQuestion(questionKey: string): RunSnapshot[] {
  const store = readStore();
  const runs = store.runs.filter((run) => run.questionKey !== questionKey);
  writeStore({ runs });
  return runs;
}
