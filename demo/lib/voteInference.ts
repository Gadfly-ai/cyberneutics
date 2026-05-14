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
    {
      pattern: /\b(?:current\s+)?vote\s*:\s*undetermined\b/,
      vote: "Undetermined",
    },
    { pattern: /\bi\s+vote\s+aye\b/, vote: "Aye" },
    { pattern: /\bi\s+vote\s+nay\b/, vote: "Nay" },
    { pattern: /\bi\s+vote\s+undetermined\b/, vote: "Undetermined" },
    { pattern: /\bmy\s+vote\s+is\s+aye\b/, vote: "Aye" },
    { pattern: /\bmy\s+vote\s+is\s+nay\b/, vote: "Nay" },
    { pattern: /\bmy\s+vote\s+is\s+undetermined\b/, vote: "Undetermined" },
  ];

  let latest: { index: number; vote: VoteLabel } | null = null;
  for (const { pattern, vote } of declarationPatterns) {
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    for (const match of normalized.matchAll(re)) {
      const index = match.index ?? 0;
      if (!latest || index >= latest.index) {
        latest = { index, vote };
      }
    }
  }
  return latest?.vote ?? null;
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
  const clearMajority = Math.floor(votes.length / 2) + 1;
  if (aye >= clearMajority) return "Aye";
  if (nay >= clearMajority) return "Nay";
  return "Undetermined";
}
