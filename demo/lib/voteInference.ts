export type VoteLabel = "Aye" | "Nay" | "Undetermined";
export type VoteInferenceSource = "declared" | "fallback";
export interface VoteInferenceResult {
  vote: VoteLabel;
  source: VoteInferenceSource;
}

function countMatches(text: string, regex: RegExp): number {
  return (text.match(regex) ?? []).length;
}

function parseDeclaredVote(text: string): VoteLabel | null {
  const normalized = text.toLowerCase();
  const declarationPatterns: Array<{ pattern: RegExp; vote: VoteLabel }> = [
    { pattern: /\b(?:current\s+)?vote\s*:\s*aye\b/, vote: "Aye" },
    { pattern: /\b(?:current\s+)?vote\s*:\s*nay\b/, vote: "Nay" },
    { pattern: /\bi\s+vote\s+aye\b/, vote: "Aye" },
    { pattern: /\bi\s+vote\s+nay\b/, vote: "Nay" },
    { pattern: /\bmy\s+vote\s+is\s+aye\b/, vote: "Aye" },
    { pattern: /\bmy\s+vote\s+is\s+nay\b/, vote: "Nay" },
  ];

  for (const { pattern, vote } of declarationPatterns) {
    if (pattern.test(normalized)) return vote;
  }
  return null;
}

export function inferVoteWithSource(text: string): VoteInferenceResult {
  const declared = parseDeclaredVote(text);
  if (declared) return { vote: declared, source: "declared" };

  const lower = text.toLowerCase();
  const ayeHits = countMatches(
    lower,
    /\b(aye|yes|approve|adopt|proceed|go ahead|add now|ship now|implement now)\b/g,
  );
  const nayHits = countMatches(
    lower,
    /\b(nay|defer|not now|hold off|reject|decline|do not proceed|don't proceed|wait)\b/g,
  );

  const margin = Math.abs(ayeHits - nayHits);
  if (ayeHits === nayHits || margin < 1) return { vote: "Undetermined", source: "fallback" };
  return { vote: ayeHits > nayHits ? "Aye" : "Nay", source: "fallback" };
}

export function inferVote(text: string): VoteLabel {
  return inferVoteWithSource(text).vote;
}

export function inferMajority(votes: VoteLabel[]): VoteLabel {
  const aye = votes.filter((v) => v === "Aye").length;
  const nay = votes.filter((v) => v === "Nay").length;
  if (aye === nay) return "Undetermined";
  return aye > nay ? "Aye" : "Nay";
}
