# CJT-Style Run: Independent Votes (No Cross-Reading)

**Question:** Should we add a second CI job (e.g. link-check or structure check) in addition to the existing string-diagram test? Aye or Nay.

Each character was prompted in isolation: same question and context, no access to other characters' responses. Votes and rationales below.

---

## Maya

**Vote:** Nay

**Rationale:** Adding a second CI job increases the surface area we're obligated to maintain. When the link-check or structure check breaks — and it will — who fixes it? We just committed to one job and documented that it's the only automated test. A second job without a clear owner or decision boundary looks like scope creep. I want to know who benefits from "one more check" and whether we're optimizing for signal or for the appearance of coverage. Until that's explicit, Nay.

---

## Frankie

**Vote:** Aye

**Rationale:** The run guide says we could add structure checks (roster, deliberation dirs). If we're going to document that possibility, we should either add them or say why we're not. Principle: if it's in the runbook as a recommended check, the pipeline should run it. One job was the minimum; a second job for structure or links is consistent with rigor and traceability. Aye, with the same guard as the first job — document scope and fix or remove if it rots.

---

## Joe

**Vote:** Nay

**Rationale:** We just added the first CI job. We don't yet have evidence that it's stable in the wild — we haven't seen a full cycle of PRs with it green. Adding a second job before we've validated the first repeats the pattern I've seen before: pile on checks, then the maintainer gets busy and one or both go red and stay red. Let's run with one job for a few weeks or months, then decide whether a second is justified. Nay for now.

---

## Vic

**Vote:** Nay

**Rationale:** What would falsify "we should add a second CI job"? We'd need evidence that link-check or structure check catches problems the string-diagram test doesn't, or that contributors are introducing link breaks or structural violations at a rate that justifies the maintenance. We don't have that evidence. We have one script and one test; adding a second job is a maintenance cost without a demonstrated benefit. Nay until we have a reason to believe the second job would catch real issues.

---

## Tammy

**Vote:** Nay

**Rationale:** The first CI job set a precedent: we documented that it's the only automated test and that more checks require a separate decision. Adding a second job now without going through that decision blurs the boundary. If we add link-check or structure check, what's the stopping rule? The system grows when we add jobs without explicit scope. I'd rather keep the one-job boundary clear and revisit only when we have a decision record that justifies a second. Nay.

---

## Aggregate (CJT-style)

| Character | Vote |
|-----------|------|
| Maya     | Nay  |
| Frankie  | Aye  |
| Joe      | Nay  |
| Vic      | Nay  |
| Tammy    | Nay  |

**Majority: Nay (4–1).** Aggregate result: do not add a second CI job at this time.
