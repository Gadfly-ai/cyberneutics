# Comparison Summary: Deliberative vs. CJT-Style (Second CI Job)

**Question:** Should we add a second CI job (e.g. link-check or structure check) in addition to the existing string-diagram test?

**Pipelines:** Same roster, same charter. Deliberative = committee with debate. CJT-style = five independent votes (no cross-reading), then majority.

---

## Outcomes

| Pipeline      | Aggregate / Resolution | Votes (Aye–Nay–Abstain) |
|---------------|------------------------|--------------------------|
| **Deliberative** | Do not add second CI job now; revisit when first job stable or evidence for second check. Document revisit condition. | 0–5–0 (unanimous Nay) |
| **CJT-style**    | Majority Nay (4–1). Do not add a second CI job at this time. | 1–4–0 (Frankie Aye, rest Nay) |

**Outcome agreement:** Both pipelines recommend **Nay** — do not add a second CI job now.

---

## Differences

1. **Vote distribution**
   - **CJT-style:** Frankie was the only Aye; others Nay. No one could respond to Frankie’s “runbook/pipeline align” argument, so his vote stood alone.
   - **Deliberative:** After Round 1, Frankie moved to Nay on condition that we document a revisit clause. Unanimous Nay.

2. **Rationale**
   - **CJT-style:** Five separate rationales; no refinement by debate. Each character gave a single-shot reason (maintenance, principle, validate first, evidence, boundary).
   - **Deliberative:** Tensions named (principle vs. timing); Frankie’s principle was preserved by “Nay now + explicit revisit condition” instead of “add now.” Resolution includes implementation steps (document revisit condition, run new decision if revisiting).

3. **Output shape**
   - **CJT-style:** One aggregate verdict + five short rationales. No decision-space map, no stress-testing of “add now” vs. “defer.”
   - **Deliberative:** Resolution + decision-space map (tensions, assumptions, recommended next steps). One vote changed (Frankie) as a result of debate.

---

## Interpretation

- **Same bottom line:** Both pipelines said Nay. So on this question, independent aggregation and deliberative committee did not disagree on the verdict.
- **Deliberation changed one vote:** Frankie went from Aye (CJT-style) to Nay (deliberative) when the group offered a way to preserve his principle (revisit condition). That illustrates how debate can shift a vote without changing the aggregate outcome.
- **Richer output from deliberation:** The deliberative run produced a clear revisit condition and implementation steps; the CJT-style run produced only “Nay 4–1” and five rationales. For a user, the deliberative output is more actionable (when to revisit, what to document).

**Conclusion:** One comparison run; both pipelines agreed (Nay). Deliberation added nuance (revisit condition, one vote change) and a more actionable resolution. To generalize, run more questions or repeat this one (e.g. multiple CJT-style draws) and compare agreement rates and outcome quality.
