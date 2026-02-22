# Phase 2: Deliberation

**Topic:** Should we add a second CI job (e.g. link-check or structure check) in addition to the existing string-diagram test?  
**Protocol:** Robert's Rules (quick run).

---

## Opening Statements

**Maya:** Second job means second thing that can break and second obligation. We just added the first CI job and documented "this is the only automated test." Adding another now blurs that boundary. Who owns it when the link-check flakes? I'm Nay unless we have a clear owner and a decision record that justifies expanding scope.

**Frankie:** The run guide already mentions optional structure checks. If we're going to point people at that, we should either run those checks or say why we're not. Principle: runbook and pipeline should align. So I'm inclined Aye for a second job — same guard as the first, document scope.

**Joe:** We literally just added the first job. We don't have evidence yet that it's stable — we haven't seen a full cycle of contributors hitting it. I've seen repos add a second check before the first was validated; then both go red and stay red. Nay for now. Revisit when the first job has been green for a few weeks or months.

**Vic:** No evidence that a second job would catch problems the first doesn't. Link-check and structure check are plausible but we don't have data on how often we'd catch real issues vs. noise. Adding maintenance without evidence is Nay from me.

**Tammy:** First job set the precedent: one job, documented scope, "more checks require a separate decision." Adding a second job without going through that decision undercuts the boundary we just drew. Nay until we have a deliberate decision to expand.

---

## Round 1

**Chair:** Frankie, you're the only Aye. Joe and Vic both want to defer. Can you respond to Joe's "validate the first job first" point?

**Frankie:** Joe, I take the point that we're early. But the run guide already says we *could* add structure checks. If we're not adding them, we should say "we're not adding them yet because we're validating the first job" — that's a documented position, not silence. I could move to "Nay for now, but put 'revisit after first job stable' in the run guide" so we don't leave the impression that optional checks are abandoned.

**Joe:** I can support that. Nay for now, explicit revisit condition. That's a clear decision boundary.

**Vic:** Same. Nay now; revisit when we have evidence the first job is stable or evidence that a second would add value.

**Maya:** Nay. I'm fine with the revisit language as long as we don't commit to a second job without another decision.

**Tammy:** Nay. The resolution should state the boundary: we're not adding a second job until we've validated the first or have a new decision record.

**Chair:** So we have unanimity: Nay for now, with a clear revisit condition. Frankie, do you hold Aye or move to Nay with the revisit clause?

**Frankie:** I'll move to Nay with the revisit clause. The principle is preserved if we document "revisit when first job is stable or when we have evidence for a second." That's not abandoning the runbook; it's deferring with a condition.

---

## Synthesis

**Consensus:** Do not add a second CI job at this time. Revisit when (a) the first CI job has been stable (e.g. green for a sustained period) or (b) we have evidence that a second check (link-check or structure check) would catch real issues. Document this revisit condition in the run guide or comparison record so the decision boundary is explicit.

**Status:** DELIBERATION COMPLETE.

---

## KEY TENSIONS IDENTIFIED

- **Principle vs. timing:** Frankie (runbook/pipeline alignment) vs. Joe (validate first job before adding more). Resolved by "Nay now + explicit revisit condition."
- **Evidence:** Vic's "no evidence for second job" accepted; revisit when we have evidence.

## ASSUMPTIONS SURFACED

- The first CI job is not yet validated in production (few or no PRs with it green).
- Adding a second job without a decision boundary would blur the "one job, document scope" precedent.

## RECOMMENDED NEXT STEPS

1. Do not add a second CI job now.
2. Document revisit condition: when first job is stable or evidence supports a second check.
3. If revisiting, run a new decision (committee or comparison) before adding.
