import { ConcernRecord, DispositionRecord, OverrideRecord } from "./types";

const STORAGE_KEY = "cyberneutics:decision-accountability:v1";

interface StoredDecisionMemory {
  concerns: ConcernRecord[];
  dispositions: DispositionRecord[];
  overrides: OverrideRecord[];
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emptyStore(): StoredDecisionMemory {
  return { concerns: [], dispositions: [], overrides: [] };
}

function readStore(): StoredDecisionMemory {
  if (!isBrowser()) return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as StoredDecisionMemory;
    if (!parsed) return emptyStore();
    return {
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      dispositions: Array.isArray(parsed.dispositions) ? parsed.dispositions : [],
      overrides: Array.isArray(parsed.overrides) ? parsed.overrides : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoredDecisionMemory): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createDecisionRecordId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listDecisionMemoryByQuestion(questionKey: string): StoredDecisionMemory {
  const store = readStore();
  return {
    concerns: store.concerns.filter((item) => item.questionKey === questionKey),
    dispositions: store.dispositions.filter((item) => item.questionKey === questionKey),
    overrides: store.overrides.filter((item) => item.questionKey === questionKey),
  };
}

export function upsertConcern(record: ConcernRecord): StoredDecisionMemory {
  const store = readStore();
  const concerns = store.concerns.filter((item) => item.id !== record.id);
  concerns.push(record);
  const next = { ...store, concerns };
  writeStore(next);
  return next;
}

export function upsertDisposition(record: DispositionRecord): StoredDecisionMemory {
  const store = readStore();
  const dispositions = store.dispositions.filter((item) => item.id !== record.id);
  dispositions.push(record);
  const next = { ...store, dispositions };
  writeStore(next);
  return next;
}

export function appendOverride(record: OverrideRecord): StoredDecisionMemory {
  const store = readStore();
  const overrides = [...store.overrides, record];
  const next = { ...store, overrides };
  writeStore(next);
  return next;
}

export function clearDecisionMemoryByQuestion(questionKey: string): StoredDecisionMemory {
  const store = readStore();
  const next = {
    concerns: store.concerns.filter((item) => item.questionKey !== questionKey),
    dispositions: store.dispositions.filter((item) => item.questionKey !== questionKey),
    overrides: store.overrides.filter((item) => item.questionKey !== questionKey),
  };
  writeStore(next);
  return next;
}
