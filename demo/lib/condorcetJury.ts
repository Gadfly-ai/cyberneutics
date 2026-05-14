/**
 * Classical Condorcet jury theorem (independent voters, homogeneous competence p).
 * Majority = strictly more than n/2 correct votes. Ties (exactly half when n is even)
 * are not counted as a correct majority here — probability mass for k === n/2 is excluded.
 */
function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  const useK = k > n / 2 ? n - k : k;
  for (let i = 0; i < useK; i++) {
    c = (c * (n - i)) / (i + 1);
  }
  return c;
}

export function majorityCorrectProbability(n: number, p: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const kMin = Math.floor(n / 2) + 1;
  let sum = 0;
  for (let k = kMin; k <= n; k++) {
    sum += binomialCoefficient(n, k) * p ** k * (1 - p) ** (n - k);
  }
  return sum;
}

/** P(majority correct) for n = 1 .. maxN at fixed p (for charts). */
export function majorityCorrectCurve(maxN: number, p: number): { n: number; probability: number }[] {
  const cap = Math.max(1, Math.min(51, Math.floor(maxN)));
  const out: { n: number; probability: number }[] = [];
  for (let n = 1; n <= cap; n++) {
    out.push({ n, probability: majorityCorrectProbability(n, p) });
  }
  return out;
}
