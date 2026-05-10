import { RunSnapshot } from "./types";

const STORAGE_KEY = "cyberneutics:run-memory:v1";

interface StoredRunMemory {
  runs: RunSnapshot[];
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStore(): StoredRunMemory {
  if (!isBrowser()) return { runs: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { runs: [] };
    const parsed = JSON.parse(raw) as StoredRunMemory;
    if (!parsed || !Array.isArray(parsed.runs)) return { runs: [] };
    return { runs: parsed.runs };
  } catch {
    return { runs: [] };
  }
}

function writeStore(store: StoredRunMemory): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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
