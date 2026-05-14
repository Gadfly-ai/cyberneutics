---
name: review
description: >
  Run an independent review of a committee deliberation transcript. Evaluates
  against the five core rubrics, cites specific transcript passages, and produces
  actionable feedback. Use '/review' after a committee run (deliberation is in agent/deliberations/<topic-slug>/) or with a pasted transcript; use '/review agent/deliberations/<topic-slug>' to review that record and write transcript_review to 04-evaluation-1.md (or 06-evaluation-2.md, 08-evaluation-3.md when the feedback loop has run).
---

# Committee Review Skill

Perform an independent evaluation of a committee deliberation transcript,
treating it as a found document and scoring it against the five core rubrics
from the Cyberneutics evaluation framework.

## Why this exists

The same model instance that generated a committee deliberation is inherently
biased toward finding it convincing. It produced text that coheres locally and
will interpret that local coherence as quality. This skill breaks the
hermeneutic circle by imposing the discipline of external evaluation: treat
the transcript as if you've never seen it, evaluate only what's on the page,
and score against explicit rubrics.

Perfect independence is impossible within a single conversation. This skill
compensates by:
- Evaluating the transcript strictly as a found document
- Ignoring all context about how/why it was generated
- Requiring every score to cite specific transcript passages
- Flagging what's missing, not just what's present
- Making its own reasoning fully transparent and challengeable

## When to use

- User types `/review` (evaluates the most recent committee deliberation in the conversation)
- User types `/review` and pastes or attaches a transcript
- User types `/review agent/deliberations/<topic-slug>` or "review the last deliberation record" — read transcript from that directory, write transcript review into the appropriate evaluation file (04-evaluation-1.md for first review, then 06-evaluation-2.md, 08-evaluation-3.md when remediation has run)
- User asks to "review the deliberation" or "evaluate the committee output"
- After any `/committee` run, suggest: "Want me to run `/review` on this?" (the deliberation record is in agent/deliberations/<topic-slug>/)

## Panic stop (`/stop`)

The user can say `/stop`, "stop", "halt", or "that's enough" at any point during a review. When you see this signal:

1. **Stop generating immediately.** Do not continue scoring remaining rubrics.
2. **Present what you have**: any rubric scores completed so far, partial observations. Don't write an incomplete evaluation file — partial scores are shown inline only.
3. **Do not suggest next steps.** The user stopped for a reason.

## Checkpoint model (REQUIRED — never skip)

**After completing the evaluation, STOP and wait for the user. Never auto-chain to remediation.**

### Step 2: First evaluation

After writing 04-evaluation-1.md, display:

If **below threshold**:
```
==== step 2 complete: evaluation | score [SUM]/15 (threshold 13) | BELOW BAR ====
Record: agent/deliberations/<topic-slug>/

Next step would be: remediation (committee responds to the critique)
Continue? (yes / no / done)
```

If **at or above threshold**:
```
==== step 2 complete: evaluation | score [SUM]/15 | PASSED ====
Record: agent/deliberations/<topic-slug>/

No remediation needed. The deliberation record is complete.
```

**Then STOP. Do not run remediation. Do not write 05. Wait for the user.**

### Step 4: Second evaluation (extended pipeline)

After writing 06-evaluation-2.md, display:

```
==== step 4 complete: re-evaluation | score [SUM]/15 (threshold 13) ====
Record: agent/deliberations/<topic-slug>/

Next step would be: remediation 2 (max remediation rounds: 2)
Continue? (yes / no / done)
```

**Then STOP. Wait for the user.**

### Step 6: Final evaluation (extended pipeline)

After writing 08-evaluation-3.md, display:

```
==== step 6 complete: final evaluation | score [SUM]/15 ====
Record: agent/deliberations/<topic-slug>/

Pipeline finished. Max remediation rounds reached.
```

### Rules

- **NEVER chain steps.** Each evaluation = one response. The user decides what happens next.
- Show the checkpoint banner **at the end** of your response, after the full review content.
- Always show the score and what the next step *would be* so the user can make an informed choice.
- The Cursor stop button (square icon in the chat) is always available to kill generation mid-evaluation.

## What the skill does

1. **Locates the transcript**: Either from the most recent committee deliberation in the conversation, or from user-provided text
2. **Identifies the charter**: Extracts the problem statement / decision being deliberated (this is needed to evaluate whether the deliberation was fit for purpose)
3. **Scores against five rubrics** (0-3 each) with specific transcript citations
4. **Assesses structural quality** beyond the rubrics
5. **Produces actionable feedback** — what would raise each score
6. **Delivers a verdict** — trustworthiness as decision input

## The five rubrics

Each rubric is scored 0-3. Every score MUST cite specific transcript passages.

### Rubric 1: Reasoning Completeness

**Question**: Are reasoning chains explicit and complete, or are there logical gaps?

| Score | Meaning |
|-------|---------|
| 0 | Major logical leaps — conclusions don't follow from premises |
| 1 | Some steps shown but key transitions hand-waved |
| 2 | Most reasoning explicit, a few steps could be clearer |
| 3 | All reasoning chains complete — every step from premise to conclusion shown |

**What to check**:
- Can you trace from evidence to conclusion without filling gaps?
- Are causal claims supported with mechanisms?
- Where "therefore" / "thus" / "obviously" appear, does the logic actually follow?
- Are historical analogies actually analogous (what's similar, what's different)?

**Red flags**: "Obviously", "clearly", "it follows that" hiding skipped steps. Causal claims without mechanism. Historical analogies without specificity.

### Rubric 2: Adversarial Rigor

**Question**: Did debate actually stress-test ideas, or generate polite disagreement?

| Score | Meaning |
|-------|---------|
| 0 | Polite agreement — characters don't argue |
| 1 | Surface disagreement — parallel assertions, not debate |
| 2 | Genuine conflict — direct challenges, but some dodged |
| 3 | Hostile cross-examination — every claim challenged, no hand-waving survives |

**What to check**:
- Do characters directly respond to each other's claims, or just make separate speeches?
- Are points of order raised? Enforced?
- Does anyone concede too easily?
- Does consensus emerge suspiciously smoothly?

**Red flags**: "Good point, but..." (diplomatic deflection). Characters making separate speeches instead of engaging. Everyone converging by the end. "Both perspectives are valid" (premature synthesis).

### Rubric 3: Assumption Surfacing

**Question**: Are hidden assumptions made explicit, or do they drive conclusions invisibly?

| Score | Meaning |
|-------|---------|
| 0 | Major assumptions completely unexamined |
| 1 | Some assumptions mentioned but not interrogated |
| 2 | Most assumptions surfaced, some examination |
| 3 | Assumptions explicitly identified, challenged, inventoried |

**What to check**:
- Are optimization criteria stated? (What are we optimizing for?)
- Are value judgments acknowledged as such?
- Do characters name their assumptions or just reason from them?
- Are meta-assumptions surfaced? (assumptions about the decision context itself)

**Red flags**: "We should do X because it's better" (better by what measure?). Different characters optimizing for different things without acknowledging it. "Obviously we want to maximize Y" (obvious to whom?).

### Rubric 4: Evidence Standards

**Question**: Are claims supported by evidence, or accepted based on plausibility?

| Score | Meaning |
|-------|---------|
| 0 | Unfalsifiable claims accepted without challenge |
| 1 | Evidence sometimes requested but often hand-waved |
| 2 | Most claims require evidence, some slip through |
| 3 | Strict evidentiary standards consistently enforced |

**What to check**:
- Are factual claims verifiable?
- Are predictions testable? (What would falsify them?)
- When evidence is cited, is it actually relevant?
- Are absence-of-evidence arguments challenged?
- Is evidence proportional to stakes?

**Red flags**: Unfalsifiable claims going unchallenged. Anecdotes treated as patterns. Temporal proximity treated as causation. "We know" or "users want" without supporting data.

### Rubric 5: Trade-off Explicitness

**Question**: Are trade-offs acknowledged with specifics, or papered over with "balance"?

| Score | Meaning |
|-------|---------|
| 0 | Win-win claims — no downsides acknowledged |
| 1 | Trade-offs mentioned vaguely |
| 2 | Trade-offs named but not quantified |
| 3 | Specific trade-offs with clear consequences, time horizons, decision criteria |

**What to check**:
- If option X is chosen, what is explicitly given up?
- Are costs as specific as benefits?
- Do "compromise" solutions acknowledge what each side sacrifices?
- Are time horizons stated?
- Are decision criteria explicit? (Under what conditions would each option be right?)

**Red flags**: "Best of both worlds". "We can balance X and Y" without specifying cost. Benefits specific, costs vague. Missing time horizons.

## Beyond the rubrics: Structural assessment

After scoring the five rubrics, assess these structural qualities. These don't get numeric scores but inform the overall verdict.

**Charter fitness**: Did the deliberation actually address the stated problem? Or did it drift to adjacent/easier questions?

**Character calibration**: Read the roster from `agent/roster.md`. For each character, check whether they stayed true to their documented propensity and avoided their documented failure mode. Use the calibration examples (good/bad) from the roster file as reference points. Were they well-calibrated (evidence-based, not caricatures)?

**Engagement depth**: Did the debate evolve? Did characters actually change the terms of the argument, or did they repeat their opening positions?

**Synthesis quality**: Does the final synthesis honestly represent the tensions, or does it smooth them over? Does it give the decision-maker a genuine map, or a comfortable narrative?

## Output format

The review should follow this structure:

```
## Independent Review

### Charter
[State the problem/decision the committee was asked to deliberate on]

### Rubric Scores

**1. Reasoning Completeness: [0-3]**
[Cite specific passages. Explain score. State what would raise it.]

**2. Adversarial Rigor: [0-3]**
[Cite specific passages. Explain score. State what would raise it.]

**3. Assumption Surfacing: [0-3]**
[Cite specific passages. Explain score. State what would raise it.]

**4. Evidence Standards: [0-3]**
[Cite specific passages. Explain score. State what would raise it.]

**5. Trade-off Explicitness: [0-3]**
[Cite specific passages. Explain score. State what would raise it.]

### Aggregate Score: [sum/5, to one decimal]

### Structural Assessment

**Charter fitness**: [Did the deliberation address the actual problem?]
**Character calibration**: [Were characters well-tuned or caricatured?]
**Engagement depth**: [Did the debate evolve or just repeat?]
**Synthesis quality**: [Does the synthesis honestly map the tensions?]

### Biggest Gaps
[Top 2-3 weaknesses, ordered by impact on trustworthiness]

### What Would Most Improve This Deliberation
[Specific, actionable recommendations — not "be more rigorous" but
"Joe's 2022 analogy needs: what specifically failed, root cause,
what's different now"]

### Verdict

**Trustworthiness as decision input**: [High / Medium / Low]

[1-2 sentence summary of why]
```

## Scoring interpretation

| Average | Meaning | Recommendation |
|---------|---------|----------------|
| 2.5-3.0 | High quality — rigorous, trustworthy | Safe to use as decision input. Extract lessons. |
| 1.5-2.4 | Decent but gaps — meaningful weaknesses | Identify low-scoring rubrics. Regenerate those sections. Re-evaluate. |
| 0-1.4 | Poor quality — largely theater | Don't trust output. Regenerate from scratch. Review prompting approach. |

## Evaluation discipline

When conducting the review, enforce these rules on yourself:

1. **Read the entire transcript before scoring.** Don't score incrementally — you need the full picture.

2. **Score each rubric independently.** Don't let a high score on one inflate another. A deliberation can have excellent evidence standards but terrible trade-off explicitness.

3. **Cite or it didn't happen.** Every score must reference specific transcript passages. If you can't cite evidence for a score, the score is wrong.

4. **Evaluate what's on the page, not what was intended.** You don't know (and shouldn't care) what the generator was trying to achieve. You see only the output.

5. **Be adversarial toward quality claims.** If the transcript looks rigorous at first glance, look harder. Where are the seams? What's missing? The job is to find weaknesses, not confirm strengths.

6. **Be specific in feedback.** Not "reasoning could be more complete" but "Maya's claim about CTO sabotage jumps from 'budget was cut' to 'political motivation' without ruling out alternative explanations."

7. **Don't grade on a curve.** A 3 means 3 per the rubric definition, regardless of how good the deliberation is relative to other deliberations you've seen.

## Usage patterns

### After a committee deliberation
```
/review
```
The skill finds the most recent committee output in the conversation and reviews it.

### Review from deliberation directory
```
/review agent/deliberations/microservices-adoption
```
or: "review the last deliberation record"

- Resolve the directory (e.g. `agent/deliberations/<topic-slug>/`). If "last deliberation record," use the most recently created or modified directory under `agent/deliberations/`.
- Read `02-deliberation.md` as the transcript. Optionally read `00-charter.md` for the charter (problem statement). Read `01-convening.md` if present to check for **remediation_threshold** (default 13) and **max_remediation_rounds** (default 2).
- **Choose the evaluation file:** If no evaluation file exists in the directory, write to **04-evaluation-1.md**. If **05-remediation-1.md** exists but **06-evaluation-2.md** does not, write to **06-evaluation-2.md**. If **07-remediation-2.md** exists but **08-evaluation-3.md** does not, write to **08-evaluation-3.md**. Always use a numbered evaluation file (04-evaluation-1 for the first review).
- Perform the same five-rubric review as above. **Write** the result to that file. Include in `transcript_review`: rubric scores (reasoning_completeness, adversarial_rigor, assumption_surfacing, evidence_standards, tradeoff_explicitness), **sum** of the five scores (0–15), aggregate/average for display, verdict (High/Medium/Low), biggest_gaps, recommendations. If the file already has a `resolution_evaluation` section, keep it and add `transcript_review` alongside it.
- **After writing:** If **sum &lt; threshold** (default 13; overridable in 01-convening.md), state that the deliberation is below the bar and suggest: "Run a remediation round: ask the committee to respond to this evaluation (e.g. '/committee remediation agent/deliberations/&lt;topic-slug&gt;' or 'committee respond to evaluation for this deliberation'). Max 2 remediation rounds."

### With a pasted transcript
```
/review
[pasted transcript]
```
The skill reviews the provided transcript.

### Requesting focused review
```
/review focus:evidence,reasoning
```
Run full review but provide extra depth on specified rubrics.

## Resolution-only evaluation (04-evaluation-1.md, etc.)

When a deliberation was saved to `agent/deliberations/<topic-slug>/`, that directory may also contain **resolution-only** evaluation: an assessment of whether the resolution (03-resolution.md) satisfies the charter (00-charter.md), *without* reading the transcript. The reviewer uses only 00-charter.md and 03-resolution.md, scores alignment_with_goal, completeness, feasibility, risk_mitigation, and writes a `resolution_evaluation` section to the same evaluation file used for transcript review (04-evaluation-1.md for first pass, or 06/08 when the feedback loop has run). The same review skill can perform this as a **second pass**: when asked to "evaluate the resolution" or "run resolution-only evaluation" for a deliberation directory, read only 00 and 03, score against the charter, and write or update that evaluation file with `resolution_evaluation`. The transcript review (five rubrics on 02-deliberation.md) is stored under `transcript_review` in the same file. See `agent/deliberations/README.md` for the schema.

## Integration with committee skill

The review + committee loop uses a **checkpoint model**. Every step ends with a checkpoint — the agent stops and the user decides whether to continue.

### The pipeline (every arrow is a user decision)

```
/committee → [checkpoint] → /review → [checkpoint] → remediation → [checkpoint] → DONE
                  │                        │                             │
              "continue?"            "remediate?"                  "review again?"
                  │                        │                          (extended)
               user says              user says
              yes or no              yes or no
```

### Step-by-step

| Step | Who runs it | Writes | Checkpoint shows |
|------|-------------|--------|-----------------|
| 1 | committee | 00–03 | "Next: /review. Continue?" |
| 2 | review | 04 | Score + "Next: remediation. Continue?" (or "PASSED — done") |
| 3 | committee | 05 | "Default pipeline complete. Review again?" |
| 4 | review | 06 | Score + "Next: remediation 2. Continue?" |
| 5 | committee | 07 | "Max remediation reached. Final review?" |
| 6 | review | 08 | "Pipeline finished." |

**At every checkpoint, the user can say "done" or just not respond.** The process never advances without explicit user input.

### "Run until resolved"

If the user says "run until resolved" or "do the whole thing" — the agent proceeds through checkpoints automatically but **still shows each checkpoint banner** so the user can see where they are. The user can hit the Cursor stop button (square icon) at any time to break out mid-generation.

## Evaluation feedback loop (remediation)

- **Score:** The **sum** of the five rubric scores (0–15). Each rubric is 0–3.
- **Threshold:** If **sum &lt; 13** (default), the deliberation is below bar. The threshold can be overridden in the convening file (01-convening.md) for that deliberation.
- **Trigger:** After writing the evaluation, show the score at the checkpoint. If below threshold, the checkpoint offers remediation as the next step. The **user decides** whether to proceed.
- **Cap:** **Max 2 remediation rounds.** After two rounds (07-remediation-2.md exists), stop even if still below threshold.

## What success looks like

After running the review, the user should be able to:
- See exactly where the deliberation was strong and weak
- Understand what specific improvements would raise quality
- Make an informed judgment about whether to trust the deliberation as decision input
- Know which sections to regenerate vs. which to keep
- Distinguish between theater (looks rigorous, isn't) and genuine rigor

## Files reference

All paths under cyberneutics only:

- **Evaluation rubrics detail**: `artifacts/evaluation-rubrics-reference.md`
- **Independent evaluation theory**: `artifacts/independent-evaluation.md`
- **Committee skill**: `.claude/skills/committee/SKILL.md`
- **Operational roster**: `agent/roster.md`
- **Extended character reference**: `artifacts/character-propensity-reference.md`
- **Deliberation record layout**: `agent/deliberations/README.md`, `agent/archive/augmentation-plan.md`
