# Condorcet's Jury Theorem and the Committee

This document clarifies the relationship between the Cyberneutics adversarial committee process and **Condorcet's jury theorem** (CJT). It states our design goals first, then introduces CJT as a motivating analogy, lists where our process does *not* satisfy the theorem's conditions, and states that a CJT-compliant variant would be a different pipeline — not a modification of this one.

**We do not satisfy Condorcet's jury theorem.** Our process is deliberative and dependent by design. This artifact documents that relationship so users and reviewers are not misled.

---

## 1. Design goals of the committee process

The committee is designed to:

- **Stress-test** a decision or situation by having multiple characters argue from different propensities (political awareness, evidence, continuity, values, systems).
- **Map the decision space** — surface trade-offs, hidden assumptions, and what evidence would distinguish between interpretations.
- **Produce a resolution and decision-space map**, not a single binary vote. The output is a structured record (charter, deliberation transcript, resolution, optional evaluation) that supports the user's judgment rather than replacing it.

The value is in the **adversarial back-and-forth**: characters read each other's arguments and respond. That interaction is essential. We are not aggregating independent judgments; we are generating a map through structured conflict.

---

## 2. Condorcet's jury theorem as motivating analogy

**Condorcet's jury theorem** (Condorcet, 1785) concerns a group that decides by **majority vote** between two options, one of which is correct. Each voter has an **independent** probability *p* of voting for the correct option. The theorem states:

- If *p* > 1/2 (each voter is more likely than not to be right), then adding more voters **increases** the probability that the majority is correct, approaching 1 as the number of voters grows.
- If *p* < 1/2, adding more voters **worsens** the outcome; the "optimal jury" is a single voter.

Extensions allow **heterogeneous competence** (each voter has a possibly different *p*ₑ). Some modern work shows that without strong evidence of competence, the thesis of the theorem does not hold almost surely (e.g. Berend & Paroush, 1998; Romaniega Sancho, 2022 — see references below).

The **intuition** that motivates our use of multiple perspectives is related: many independent, moderately competent perspectives can outperform a single one. That intuition is consistent with CJT when its assumptions hold. Our process, however, **does not implement those assumptions**. We document the analogy so that the intuition is clear, and the gap is explicit.

---

## 3. Where we do not satisfy CJT

Our committee process **deliberately deviates** from the conditions of Condorcet's jury theorem. We do not claim compliance.

| CJT condition | Our process | Implication |
|---------------|-------------|-------------|
| **Independent** judgments | Characters **deliberate together**; they read and respond to each other. Judgments are **dependent**. | We are not aggregating independent votes. Dependence is intentional — it enables stress-testing and refutation. |
| **Binary** correct/incorrect outcome | Output is a **resolution plus decision-space map**, not a single "correct" or "incorrect" choice. The user is the editor; the committee informs, it does not decide. | We are not maximizing the probability of a correct binary vote. We are optimizing for map quality and adversarial rigor. |
| **Literal probability *p* (or *p*ₑ) per voter** | We have **propensities** (e.g. paranoid realism, evidence prosecutor), not competence scores. We do not measure or claim *p* > 1/2 for any character. | Even if we had a vote step, we could not claim CJT applies without evidence of competence; such evidence is not part of our design. |

**Summary:** We are not implementing a jury. We are implementing **adversarial sense-making**: multiple perspectives in tension, with the goal of surfacing what is at stake, not of producing a single "correct" answer by majority rule.

---

## 4. A CJT-compliant variant would be a different pipeline

A pipeline that *did* aim to satisfy (or approximate) CJT would look different:

- **Independent generation:** Each of *n* "voters" would produce a judgment **without** reading the others' outputs. No deliberation, no cross-reading.
- **Aggregation:** Those judgments would then be combined (e.g. by majority or supermajority) into a single binary or categorical outcome.
- **Competence:** One would need a way to assess or assume *p*ₑ > 1/2 (or similar) for the theorem's conclusion to hold.

That pipeline would be a **different design** — not a "correction" or tweak to the current committee. It would sacrifice deliberation and stress-testing for independence and aggregability. We do not build that variant here; we document it so that:

- Contributors who want to explore a CJT-style design can build it as a separate pipeline and compare it to the deliberative one.
- Users do not assume our committee "satisfies" or "corrects for" Condorcet; we clarify and document the relationship instead.

If evidence later emerges from comparing a deliberative pipeline to an independent-aggregation pipeline (e.g. on the same rubric), that could inform whether to offer both variants or revisit this document.

---

## 5. References

- **Condorcet, M. de** (1785). *Essai sur l'application de l'analyse à la probabilité des décisions rendues à la pluralité des voix.* (Essay on the application of analysis to the probability of majority decisions.)
- **Berend, D., & Paroush, J.** (1998). When is Condorcet's Jury Theorem valid? *Social Choice and Welfare*, 15(4), 481–488. (Heterogeneous competence.)
- **Romaniega Sancho, Á.** (2022). On the probability of the Condorcet Jury Theorem or the Miracle of Aggregation. *Mathematical Social Sciences*, 119, 41–55. (Prior probability of CJT holding without evidence of competence.)

For further reading, see the Wikipedia article on [Condorcet's jury theorem](https://en.wikipedia.org/wiki/Condorcet%27s_jury_theorem) and the repository's [references](../references/README.md) and [adversarial committees](adversarial-committees.md) artifact.

---

## Summary

- **Design first:** The committee is for stress-testing and decision-space mapping, not for aggregating independent votes.
- **CJT as analogy:** The theorem motivates the intuition that multiple perspectives can help; we do not implement its conditions.
- **Deviations:** We do not have independence, binary correct/incorrect, or literal *p*; we document these deviations so our relationship to CJT is clear.
- **Different pipeline:** A CJT-compliant variant would require independent generation and aggregation; that would be a different pipeline, not a correction to this one.

This document clarifies and states the relationship and deviations. It does not "correct for" Condorcet; it documents where we stand.
