# Phase 2: Deliberation

**Topic:** Should we correct for Condorcet's jury theorem within the committee process, and if so how?  
**Protocol:** Robert's Rules (standard run).

---

## Opening Statements

**Maya:** "Correcting for" Condorcet sounds like we're fixing a bug. But CJT isn't a bug in our process — it's a different model. The theorem assumes independent voters and a binary correct answer. We have characters who read each other's arguments and respond. That's the opposite of independence. So the first question is: who benefits from saying we're "correcting for" CJT? If it's academic credibility — "our method has a theorem" — we're dressing up deliberation as jury aggregation. If it's genuine improvement, we need to say what we're actually changing. I'm suspicious of (a): changing the process to satisfy CJT would mean forcing independence, e.g. separate generation then aggregate. That could kill what makes the committee useful — the adversarial back-and-forth. Option (b), using CJT as analogy and documenting deviations, is honest only if we're explicit that we're *not* satisfying the theorem. Option (c), rejecting CJT, might be the cleanest: our goal is stress-testing and map-making, not maximizing probability of a correct binary vote. I want to see the incentive: are we optimizing for citeability or for decision quality?

**Frankie:** The methodology claims rigor. If there's a theorem that could formalize why multi-perspective deliberation helps, we owe it to users to engage it — not to pretend we're satisfying it when we're not, but to say where we stand. Option (b) is the principled path: document CJT as motivating analogy, state clearly where we deviate (no independence, no binary correct answer, no literal p), and explain why our design trades those for deliberative quality. That's intellectual honesty. Option (a) — changing the process to approximate CJT — risks turning the committee into a voting mechanism. The value is in the debate, not in the vote. If we add "independent generation then aggregate," we might satisfy a theorem and lose the thing that makes the pipeline work. Option (c), flat rejection, feels like we're saying "we don't care about formal foundations." I'd rather (b): one short document, maybe in essays/ or artifacts/, that says "CJT motivates the intuition that multiple perspectives can outperform one; our process deliberately violates independence and binary framing because we're optimizing for map-making and stress-testing; here's why that trade is justified."

**Joe:** I've seen methodology projects reach for a theorem to look rigorous. The danger is claiming CJT applies when it doesn't — then someone like Vic tears it apart and we look worse than if we'd never mentioned it. The charter cites work showing that without strong evidence of competence, the CJT thesis doesn't hold almost surely. So even if we *did* have independent voters and binary outcomes, we'd need to establish p_i > 1/2. We don't have that. We don't have a way to measure "probability this character is right" — we have propensities, not competence scores. So (a) is a trap: we'd be building process around a theorem we can't satisfy. (b) is defensible if we're careful: "CJT is a motivating analogy; we do not claim our process satisfies its conditions; we optimize for different goals." (c) is also defensible: "we're not doing jury aggregation; we're doing adversarial sense-making; different literature applies." I'd lean (b) with a strong caveat — and no claim that we're "correcting for" anything. We're not correcting; we're clarifying.

**Vic:** What would falsify "we should correct for CJT"? If correcting means changing the process to satisfy independence and maybe add a formal vote, we'd need evidence that the current process is worse than that. We don't have that evidence. We have deliberation records and review scores; we don't have a controlled comparison of "deliberative resolution" vs "independent votes then majority." So (a) is unsupported. What would falsify "we should document CJT as analogy and deviations"? Nothing we can measure — it's a documentation choice. The evidence question for (b) is: does documenting help users? Possibly — it preempts the "so does this satisfy the jury theorem?" question and answers it honestly. For (c), rejecting CJT: we'd need a clear alternative framing. "We're doing sense-making, not aggregation" is a claim; the evidence is that our outputs are decision-space maps and resolutions, not single binary votes. I'm in favor of (b) with minimal process change: document the analogy and the deviations. No roster change, no independence protocol, no new voting step. Add one artifact or essay section. If someone later produces evidence that an independence-preserving variant outperforms, we revisit.

**Tammy:** If we add anything that looks like "satisfy CJT," we change the system. Suppose we add an explicit vote step: each character casts Aye/Nay/Abstain after deliberation. That vote is *not* independent — they've just debated. So we'd have the form of a jury without the condition. That could mislead: people might cite CJT as if our vote aggregates independent judgments. Alternatively we add true independence: generate five separate positions without cross-reading, then aggregate. Then we lose the adversarial pressure — no one responds to anyone. So the system choice is: deliberation (dependence, no CJT) or aggregation (independence, possible CJT). We can't have both in the same pipeline. Option (b) — document and don't change process — keeps the current system and adds clarity. Option (a) forces a fork: either a "CJT-compliant" variant (separate generation, aggregate) that's a different product, or we're pretending. I'd recommend (b) and explicitly state the fork: "A CJT-style variant would require independent generation; that would be a different pipeline, not a correction to this one."

---

## Initial Positions Summary

| Member  | Stance | Confidence | Key Concern |
|---------|--------|------------|-------------|
| Maya    | Leans (c) or (b); oppose (a) | Medium | Who benefits; don't dress deliberation as jury aggregation |
| Frankie | (b) — document as analogy, state deviations | High | Intellectual honesty; don't reject formal foundations |
| Joe     | (b) with strong caveat; no "correcting" language | Medium | Don't claim CJT applies; formalization theater risk |
| Vic     | (b) — document only, no process change | High | No evidence for (a); (b) is falsifiable only by utility |
| Tammy  | (b); state that CJT-compliant = different pipeline | High | Can't have deliberation + independence; document the fork |

---

## Key Tensions Identified

1. **Correcting vs. clarifying** — "Correcting for" implies we're fixing a deviation from CJT. Joe and Tammy: we're not correcting; we're clarifying that we're not doing CJT.
2. **Analogy vs. rejection** — (b) keeps CJT as analogy; (c) rejects it. Frankie wants (b) for integrity; Maya is open to (c) if it's cleaner.
3. **Process change** — (a) would require independence or voting; consensus forming that (a) harms deliberative value.

---

## Round 1

**Chair:** We have a cluster around (b) — document CJT as analogy and deviations. Maya, you raised who benefits. Frankie and Vic both favor (b). Can someone engage Maya's concern that we're optimizing for citeability?

**Frankie:** Maya, the benefit isn't citeability for its own sake. It's that users and contributors will ask "does this satisfy the jury theorem?" If we say nothing, they'll assume we never thought about it or we're hiding the mismatch. If we document, we're saying "we've considered it; here's where we stand." The beneficiary is anyone who wants to use the methodology with intellectual honesty — and ourselves when we're challenged. The risk you're flagging is real: we must not imply we're satisfying CJT. The document should say "we do not satisfy independence; we do not have binary correct/incorrect; we optimize for decision-space mapping." That's the opposite of dressing up.

**Maya:** I'll accept that if the document leads with "we do not satisfy CJT." Not "we correct for it" — that implies we're fixing a bug. "We do not satisfy it; here's why our design is different and why that's intentional." If we lead with the theorem and then list deviations, it still reads as "we're almost a jury." Lead with the design goal — stress-testing, map-making — and then say "CJT motivates the intuition that many perspectives help; we don't implement a jury."

**Vic:** I'll second that. The framing should be design-first: our process is deliberative and dependent by choice. CJT is a reference point for why multiple perspectives can help in the abstract; we don't implement that abstraction. So the recommendation isn't "correct for Condorcet" — it's "document our relationship to Condorcet so we're not misunderstood."

**Joe:** Then we're agreeing on (b) with strict framing: no "correcting," no implication of compliance. One artifact or section: design goals first, CJT as analogy, explicit list of deviations, and "a CJT-compliant variant would be a different pipeline (independent generation, then aggregate)." I'm aye on that.

**Tammy:** I want the fork on the record. If we document that a CJT-compliant variant would be a different pipeline, we're leaving the door open for someone to build that variant — and to compare. That's a second-order effect: we might get evidence we don't have now. So (b) plus explicit fork is not just clarity; it's a research agenda.

---

## Round 1 Analysis

Emerging consensus: (b) with strict framing. No process change. Document design-first; CJT as analogy; list deviations; state that CJT-compliant would be a different pipeline. Maya's condition (lead with design, not theorem) adopted. Tammy's fork (leave room for future CJT-style variant and comparison) noted. No one is pushing (a). (c) is partially absorbed into (b) by the "we do not satisfy" language.

---

## Round 2

**Chair:** Any remaining objections to recommending (b) with the framing we've got? And do we want to specify where this document lives — essay, artifact, or both?

**Maya:** One more thing. The charter said "correcting for" in the user's question. Our resolution should not repeat that phrase as our recommendation. We're not recommending correction; we're recommending documentation and clarification. So the resolution text should say "document the relationship to Condorcet's jury theorem" or "clarify where the process does and does not relate to CJT," not "correct for CJT."

**Frankie:** Agreed. "Correct for" was the user's framing; our output is "document and clarify, do not change process."

**Vic:** Where it lives: I'd put it in artifacts/ — a short doc like "condorcet-jury-theorem-and-the-committee.md" or a section in adversarial-committees.md. Essays are for theory; this is "here's how we relate to an external theorem." If we want a theoretical treatment later — why deliberation might still aggregate information despite dependence — that could be an essay. For now, an artifact that practitioners and reviewers can hit is enough.

**Joe:** I'm fine with an artifact. Reference it from the main committee doc and from essays if we ever do a formal-foundations piece. No need to overbuild.

**Tammy:** Artifact works. I'd include in that artifact the explicit fork: "A pipeline that preserved independence (e.g. five separate generations, no cross-reading, then majority or supermajority) would be a different design; it could be built and compared to the deliberative pipeline." That invites the comparison without committing us to building it.

**Chair:** Any nay or abstain? Hearing none, we'll treat this as consensus for the resolution.

---

## Round 2 Analysis

Consensus holds. Resolution will recommend documentation/clarification (not "correction"); document location = artifact (with optional reference from essays); artifact to include design-first framing, CJT as analogy, deviations, and explicit fork for a future CJT-style variant. Ready for synthesis and resolution.

---

## Final Consensus

- **Recommendation:** Option (b) — document the relationship to Condorcet's jury theorem; do not change the committee process to satisfy or "correct for" CJT.
- **Framing:** Lead with design goals (stress-testing, decision-space mapping). State CJT as motivating analogy for "multiple perspectives can help." List explicit deviations: no independence (deliberation creates dependence), no binary correct/incorrect, no literal p per character. State that a CJT-compliant variant (independent generation, then aggregate) would be a different pipeline, not a correction to this one.
- **Location:** New artifact (e.g. in artifacts/) or a section in adversarial-committees.md; reference from main committee skill or docs. Optional: future essay on formal foundations if we develop theory further.
- **Language:** Do not use "correct for Condorcet" in the recommendation; use "document" / "clarify" / "state relationship and deviations."
- **Trade-off accepted:** We sacrifice the ability to claim CJT applies; we gain clarity and honesty, and we avoid process changes that would undermine deliberative quality.

**Status:** DELIBERATION COMPLETE.

---

## KEY TENSIONS IDENTIFIED

- **Correcting vs. clarifying:** The user asked to "correct for" CJT; the committee recommends clarifying and documenting, not changing process to satisfy the theorem.
- **Analogy vs. compliance:** CJT is useful as analogy (why many perspectives help); we do not and should not claim compliance. Document the gap.
- **Deliberation vs. independence:** Satisfying CJT would require independent judgments; our process is deliberative and dependent by design. These are different products; document the fork.

## ASSUMPTIONS SURFACED

- The current process is worth preserving; no one argued for replacing it with a CJT-compliant variant.
- Documentation has utility: it preempts misunderstanding and supports intellectual honesty.
- We do not have evidence that a CJT-style (independent) variant would outperform the deliberative pipeline; leaving the fork open allows future comparison.
- "Correcting for" was interpreted as "changing process to align with CJT"; the committee rejected that in favor of "document and clarify."

## EVIDENCE REQUIREMENTS

- None blocking the recommendation. If someone later builds a CJT-style variant (independent generation, aggregate) and compares it to the deliberative pipeline on the same rubric, that would inform whether to offer both variants or revisit the design.
- For the artifact: cite Condorcet (1785) and, if useful, the heterogeneous-competence and prior-probability work mentioned in the charter so readers can follow up.

## DECISION SPACE MAP

- **Option (a) — Change process to approximate CJT:** Would require independence (e.g. separate generation, no cross-reading) and possibly explicit vote. Trade-off: might satisfy theorem; would likely reduce deliberative quality and stress-testing. Committee rejected.
- **Option (b) — Document CJT as analogy and deviations:** No process change. Add artifact (or section) with design-first framing, analogy, deviations, and fork. Trade-off: we don't claim CJT applies; we gain clarity and honesty. Committee recommends.
- **Option (c) — Reject CJT as wrong model:** Defensible but (b) absorbs the "we're not doing jury aggregation" point while keeping the analogy available. Committee folded (c) into (b) via framing.

## RECOMMENDED NEXT STEPS

1. Create an artifact (e.g. `artifacts/condorcet-jury-theorem-and-committee.md` or a section in `artifacts/adversarial-committees.md`) that: (a) states committee design goals first; (b) introduces CJT as motivating analogy; (c) lists where the process does not satisfy CJT (no independence, no binary outcome, no literal p); (d) states that a CJT-compliant variant would be a different pipeline.
2. Do not use "correct for Condorcet" in the recommendation or artifact; use "document," "clarify," "state relationship and deviations."
3. Optionally reference the artifact from the committee skill or README so reviewers and contributors can find it.
4. If evidence later emerges from a comparison of deliberative vs. independent-aggregation pipelines, revisit whether to offer both or update the doc.
