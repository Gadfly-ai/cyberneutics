# Deliberation Records

This directory holds **directory-structured deliberation records** produced by the cyberneutics committee skill. Every `/committee [topic]` run creates a new subdirectory here (e.g. `agent/deliberations/microservices-adoption/`) and writes the standard set of files; there is no single-file or inline-only output. The review skill reads from these directories and can write the evaluation file. The **example/** subdirectory contains minimal template files showing the structure.

## Naming convention

Filenames are **`<chronology>-<type>[-<suffix>].md`**:

- **Numeric prefix (00, 01, 02, …)** = **chronology index** — order in the process. They are not file-type IDs; they ensure files sort in chronological order.
- **The rest of the name** = **type** — charter, roster, convening, deliberation, resolution, evaluation, remediation, etc.
- **Optional suffix** — When there is more than one instance of the same type, use **incrementing suffixes** (-1, -2, …) to keep filenames unique: e.g. `04-evaluation-1.md`, `06-evaluation-2.md` (multiple reviews); `05-remediation-1.md`, `07-remediation-2.md` (multiple remediation rounds).

So the "real" type is the type name (charter, deliberation, …); the number is when it occurs in the sequence. When the feedback loop runs (evaluate → remediate → re-evaluate → …), both evaluations and remediations can have multiple instances; the **chronology index** (04, 05, 06, 07, …) increments for each new file so lexical sort stays chronological (e.g. 04-evaluation-1 → 05-remediation-1 → 06-evaluation-2 → 07-remediation-2).

## Structure (per deliberation)

| File | Type | Purpose |
|------|------|---------|
| `00-charter.md` | charter | Goal, context, success criteria, exit conditions, deliverable format |
| `01-roster.md` | roster | Committee roster (copied from `agent/roster.md`); roles and propensities |
| `01-convening.md` | convening | Selection rationale, composition notes, outcome. Optional **Remediation parameters** (for the evaluation feedback loop): **remediation_threshold** (default 13; pass if sum of five rubric scores ≥ this), **max_remediation_rounds** (default 2). Add a short "Remediation parameters" section when this deliberation uses non-default values. |
| `02-deliberation.md` | deliberation | Full transcript: opening statements, rounds, analyses, consensus, decision space map |
| `03-resolution.md` | resolution | Decision, summary, votes, implementation plan, signatures |
| `04-evaluation-1.md` | evaluation | First review: resolution-only evaluation and/or transcript review (rubric scores, verdict). **Always use a number** for the first evaluation file (04-evaluation-1.md). |
| `06-evaluation-2.md`, `08-evaluation-3.md`, … | evaluation | Subsequent reviews after remediation rounds (suffix -2, -3, …). |
| `05-remediation-1.md`, `07-remediation-2.md`, … | remediation | Committee's response to evaluation (point-by-point, new round in 02). Present when the deliberation "went overtime." Suffix for each remediation round. |

### Checkpoint model

Every step in the feedback loop is a **checkpoint**. The agent completes one step, shows a status banner, then **stops and waits for the user** to say "continue" or "done." The agent never auto-chains to the next step.

```
00-charter → 01-roster/convening → 02-deliberation → 03-resolution
    [checkpoint: "deliberation complete — run /review?"]
→ 04-evaluation-1
    [checkpoint: "score X/15 — run remediation?"]
→ 05-remediation-1
    [checkpoint: "default pipeline complete — review again?"]
→ 06-evaluation-2          (only if user says yes)
    [checkpoint: "score X/15 — remediate again?"]
→ 07-remediation-2         (only if user says yes)
    [checkpoint: "max rounds — final review?"]
→ 08-evaluation-3          (only if user says yes)
    ■ HARD STOP — max 2 remediation rounds
```

Every arrow between files requires user confirmation. The user can say "done" or simply not respond at any checkpoint. Use Cursor's stop button (square icon) to halt mid-generation.

**Evaluation files** (`04-evaluation-1.md`, `06-evaluation-2.md`, `08-evaluation-3.md`, …) can contain (both optional):

- **resolution_evaluation** — Charter vs resolution only (no transcript). Reviewer reads `00-charter.md` and `03-resolution.md`, scores alignment_with_goal, completeness, feasibility, risk_mitigation; writes outcome (RATIFIED | REVISE | REJECT), critique, recommendation. Request via the review skill: e.g. "evaluate the resolution" or "run resolution-only evaluation" for this directory.
- **transcript_review** — Full transcript evaluation. Reviewer reads `02-deliberation.md` (and optionally `00-charter.md`), scores the five rubrics (reasoning completeness, adversarial rigor, assumption surfacing, evidence standards, trade-off explicitness), writes verdict (High/Medium/Low), biggest_gaps, recommendations. Produced when you run `/review agent/deliberations/<topic-slug>`; the review skill writes to the appropriate evaluation file (`04-evaluation-1.md` for first review, `06-evaluation-2.md` after first remediation, etc.).

All paths and references stay **under the cyberneutics repository**. Roster and character details come from `agent/roster.md` (operational definitions) and `artifacts/character-propensity-reference.md` (extended commentary); evaluation rubrics from `.claude/skills/review/SKILL.md` and `artifacts/evaluation-rubrics-reference.md`.

See **agent/archive/augmentation-plan.md** for full schemas and implementation details; **agent/investigation-report.md** for how this structure was derived.

## File format: all files are Markdown

All deliberation record files use **Markdown** (`.md`). Files that carry structured data (charter, roster, resolution, evaluation) store it in **YAML front matter** (delimited by `---`). Files that are primarily narrative (convening, deliberation, remediation) use standard Markdown with optional front matter.

This uniform format means every artifact in the pipeline is a **decorated text** in the palgebra sense: `(text, metadata)` where metadata lives in YAML front matter and text lives in the body. Structured-data files simply have an empty (or minimal) body — the front matter carries the payload. This eliminates special-casing: all files can be read, enriched, and gated with the same operations regardless of whether their content is primarily structured or narrative.
