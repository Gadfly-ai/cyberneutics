# Session Handoff: 2026-05-12 — Review of *Narrative Engineering v5* deck + alignment with Cyberneutics repo and demo

## Session Summary

**Source reviewed:** `C:\Users\salki\Downloads\narrative-engineering-v5.pptx` (exported slide text extracted from `ppt/slides/slide*.xml`, February 2026 session).

**What this handoff is:** A **successor-facing** review of the v5 talk: where it already matches the methodology repo, where **one slide contradicts** settled repo positioning (Condorcet / independence), where **neuroscience framing** risks overstating what the **interactive demo** measures, and **concrete edits** (URLs, API counts, optional depth pulls) so the next revision stays honest under technical scrutiny.

**Continuity:** The demo **engine-room** handoff is now archived at **`agent/archive/handoff-2026-05-11.md`** (archived to make this file the active dated handoff per repository convention). **Read that archive** whenever a successor needs file-level truth about `demo/` (SSE, `phase1`/`phase2` accumulation, vote inference, Condorcet explorer vs. committee). Slide-first pedagogy remains in **`agent/archive/handoff-2026-05-10.md`**.

---

## Deck inventory (v5, 27 slides)

| Slides | Arc |
|--------|-----|
| 1–3 | Title, origin story, audience fork (Practitioner / Theorist / Skeptic / Builder) |
| 4–8 | Wrong vs right mental model; narrative engine; paradigm table; reframed questions |
| 9–10 | Neuroscience + Society of Mind; Kim et al. internal dialogue / externalize |
| 11–13 | Condorcet theorem; why LLMs violate independence; committee **sidesteps** CJT |
| 14 | Five-character roster (matches `demo/lib/characters.ts` / methodology roster) |
| 15–18 | Metacognition (Flavell, Fleming); H-MetaD; Cacioli et al.; L1–L4 stack |
| 19–21 | Repo pointer; three layers (essays / artifacts / palgebra); live demo CTA |
| 22 | “Same five minutes” recap by audience quadrant |
| 23–26 | Three lessons + design imperative |
| 27 | Closing + contact |

**Overall:** Strong narrative spine aligned with `README.md` and `artifacts/adversarial-committees.md`. Condorcet block (11–13) is **substantively correct** relative to **`artifacts/condorcet-jury-theorem-and-committee.md`**.

---

## Critical alignment fix (do not ship v5 as-is)

### Slide 22 — THEORIST bullet (incorrect as written)

**On-slide text (approx.):** Condorcet’s independence assumption is “**solved** through role design, not statistical sampling,” plus “external metacognition in action.”

**Problem:** The repository’s explicit position is that the adversarial committee **does not satisfy** Condorcet’s conditions and **does not try to** — it **changes the objective** (decision-space map vs. maximizing P(majority correct)). Role design gives **engineered tension** and **non-overlapping epistemic stances**; it does **not** restore statistical **independence** of errors in the CJT sense. Saying independence is “**solved**” reads as “we fixed the theorem’s premises,” which **overclaims** and **contradicts** slides 11–13 and the Condorcet artifact.

**Recommended replacement (pick one tone):**

- **Precise:** “Condorcet’s **independence premise does not apply**: the committee is **deliberately dependent**—challenge/response is the mechanism. The point is a **different question** than majority correctness (see slide 13).”
- **Shorter:** “**Not a CJT ensemble**—adversarial deliberation trades independence for **auditable conflict** and a **map**, not a verdict.”

Keep “external metacognition in action” only if the **speaker verbally qualifies** that the demo’s “metacognition” signals are **heuristic** (see below), or rephrase to “**external monitoring layer** (committee + evaluation)” to avoid implying Type-2 psychophysics in the UI.

---

## Demo and repo alignment (slides 19–22, 21 especially)

### Live demo URL and layout

- Slide 21 points to **`github.com/Gadfly-ai/cyberneutics-demo`**. In the **pragsmike/cyberneutics** layout, the runnable app lives under **`demo/`** in the **main** repository (`demo/README.md`), not necessarily a separate `cyberneutics-demo` repo. **Action:** Confirm which URL is canonical for Sal’s fork; if talks use the monorepo, CTA should be **clone cyberneutics → `cd demo` → `npm run setup` → `npm run dev`** (matches archived technical handoff and README).

### “Two phases of deliberation” (slide 21, slide 22 BUILDER)

- The **pipeline** supports **2–6** deliberation rounds (clamped in `demo/lib/pipeline.ts`); **API** mode also runs a **per-character research** phase before round one. **Action:** Say “**structured multi-phase deliberation** (and optional research in API mode)” unless you intentionally anchor on the default two visible transcript columns.

### “Three API calls” (slide 22 BUILDER)

- **Undercounts** a full API committee run: naive stream + committee stream + **parallel research calls per character** + **one completion per character per phase** + evaluate. **Action:** Replace with something defensible, e.g. “**orchestrated multi-call pipeline** (naive path, committee path with staged character calls, independent evaluation)” or give a **range** if you want numeracy without live math on stage.

### Execution mode honesty

- If the live walkthrough uses **local** mode (no key), say so: deterministic **illustration** of shape, not live Claude behavior. Matches `demo/README.md` and `agent/archive/handoff-2026-05-11.md`.

---

## Metacognition slides (15–18) vs. what the demo computes

**Deck:** Flavell, Fleming / H-MetaD, M-ratio, Cacioli-style “metacognitive capacity ≠ confidence.”

**Demo:** “Metacognition” in UI is **per-role regex hit counts** on transcript text (`METACOGNITION_PATTERNS` in `demo/lib/insights.ts`) — a **lexical proxy**, not meta-d′ or M-ratio estimation.

**Recommendations:**

1. **Speaker note (minimum):** After slide 15–17, one line: “The **product demo** surfaces **role-shaped language** with simple counters; that is **not** the lab formalism from Fleming’s group.”
2. **Slide tweak (optional):** Add a footnote on slide 17 or 18: “Product telemetry ≠ H-MetaD.”
3. **Opportunity:** If you want alignment *without* new code, add one slide or appendix bullet pointing to **`demo/components/CalculationExplainer.tsx`** / `insights.ts` as “**cheap observability hooks**” that **rhyme with** metacognition rather than measuring it.

---

## Condorcet block (11–13) — keep; cross-link

Slides 11–13 are **aligned** with **`artifacts/condorcet-jury-theorem-and-committee.md`** (theorem as intuition; independence fails for LLMs; committee sidesteps with different objective).

**Expansion (optional, one slide or appendix):**

- Mention the in-demo **Condorcet jury explorer** as a **ballot lab** (classical `p`, `n`, binomial curve + Monte Carlo) **beside** deliberation — **not** evidence that the committee satisfies CJT. Technical wording lives in **`agent/archive/handoff-2026-05-11.md`** §Heuristic layer.

---

## Citations to verify before publication or recording

| Deck reference | Note |
|----------------|------|
| Kim et al. `arXiv:2601.10825` | Verify title/year/number against the paper you intend; avoid stale or mistyped IDs on video. |
| Cacioli et al. `arXiv:2603.25112` | Same. |
| Condorcet 1785 | Fine as historical anchor. |

---

## Strengths to preserve (no change needed)

- **Slides 4–8:** “Hallucination” reframing as successful narrative completion — matches Cyberneutics “narrative engine” framing.
- **Slide 7:** Numeric → symbolic → **narrative** engineering arc — matches repo README metaphor.
- **Slide 9–10:** Brain as predictor + externalizing internal dialogue — good bridge to committee **without** claiming the brain runs literal five-character prompts.
- **Slide 14:** Roster one-liners match the demo characters and `artifacts/adversarial-committees.md` spirit.
- **Slides 23–25:** Pipeline reliability, variance as exploration, transcript as audit artifact — matches palgebra enrichment/provenance themes at a high level.

---

## Suggested v6 edits (checklist)

- [ ] **Fix slide 22 THEORIST** — remove “solved independence through role design”; replace with sidesteps / different objective / deliberate dependence (see §Critical alignment fix).
- [ ] **Unify demo CTA URL** with actual fork layout (`demo/` vs separate demo repo).
- [ ] **Soften or qualify** “metacognition in action” on slide 22 if demo is shown the same session.
- [ ] **Update BUILDER** bullet — multi-call pipeline, not “three API calls”; optional rounds/research.
- [ ] **Optional:** One **QR or short path** slide: `demo/README.md` + Node 20+ (from archived 2026-05-10 cheat sheet).
- [ ] **Optional:** One **rubric** line — five dimensions from `demo/lib/types.ts` if you show evaluation (pulls from archived 2026-05-10 slide 11 list).
- [ ] **Fact-check** arXiv IDs on slides 10 and 17.

---

## Immediate next steps (for mg or Sal)

1. Patch **slide 22 THEORIST** before any audience that includes ML theory or decision-science reviewers.
2. Decide **canonical demo URL** and update slides 19–21 consistently.
3. If recording: rehearse **one sentence** bridging Fleming/M-ratio slides to “**demo counters are heuristics**” to avoid overstating measurement claims.

---

## Context for specific files

| File | Use when revising deck |
|------|-------------------------|
| `artifacts/condorcet-jury-theorem-and-committee.md` | Source of truth for CJT vs committee |
| `agent/archive/handoff-2026-05-11.md` | Demo pipeline, SSE, phase2 accumulation, vote inference |
| `agent/archive/handoff-2026-05-10.md` | Slide outlines, misconceptions, rubric plain-English |
| `demo/README.md` | Demo CTA, execution modes, glossary |
| `demo/lib/insights.ts` | Metacognition patterns, `buildCondorcetShift` |
| `README.md` | Repo elevator pitch alignment |

---

## Open questions

1. Will **Gadfly-ai/cyberneutics-demo** remain a separate repo, or will all CTAs point at **`demo/`** inside **`Gadfly-ai/cyberneutics`**?
2. Should slide 22 **SKEPTIC** explicitly name **`artifacts/condorcet-jury-theorem-and-committee.md`** as the “don’t overclaim CJT” pointer?

---

## Session metadata

- **Date:** 2026-05-12
- **Inputs:** `narrative-engineering-v5.pptx` (user Downloads path); archived `agent/handoff-2026-05-11.md`.
- **Deliverable:** This handoff + prioritized deck revision list.
