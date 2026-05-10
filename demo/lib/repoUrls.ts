const DEFAULT_ORIGIN = "https://github.com/Gadfly-ai/cyberneutics";
const DEFAULT_BRANCH = "main";

function normalizeOrigin(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return DEFAULT_ORIGIN;
  return trimmed.replace(/\/+$/, "");
}

/**
 * Public GitHub (or Git forge) repo root, no trailing slash.
 * Set `NEXT_PUBLIC_REPO_URL` for a fork so in-app links match your remote.
 */
export const REPO_ORIGIN = normalizeOrigin(
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_REPO_URL : undefined,
);

/**
 * Branch used in `/blob/<branch>/...` links from the UI.
 * Override with `NEXT_PUBLIC_REPO_BRANCH` (e.g. `master` or a release tag).
 */
export const REPO_BRANCH =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_REPO_BRANCH?.trim()
    ? process.env.NEXT_PUBLIC_REPO_BRANCH.trim()
    : DEFAULT_BRANCH;

/** `blob` view for a path relative to the repo root (e.g. `demo/README.md`). */
export function repoBlobUrl(pathFromRepoRoot: string): string {
  const path = pathFromRepoRoot.replace(/^\/+/, "");
  return `${REPO_ORIGIN}/blob/${REPO_BRANCH}/${path}`;
}
