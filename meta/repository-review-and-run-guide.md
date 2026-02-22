# Repository Review and Run/Test Guide

**Purpose:** In-depth review of the Cyberneutics repository and a concrete guide for running and testing it. For session context, see the latest handoff in `agent/handoff-[YYYY-MM-DD].md` and `agent/gap_analysis.md`.

---

## 1. What This Repository Is

### 1.1 Summary

Cyberneutics is **methodology documentation plus one executable component**. It is not an application you "build and run"; it is:

- **Essays** — why narrative engines need narrative engineering, sense-making, decisions under uncertainty.
- **Artifacts** — how: adversarial committees, evaluation protocols, workflows, examples.
- **Palgebra** — formal algebra for pipelines (resource equations, string diagrams, propagation rules).
- **Agent skills** — slash commands (e.g. `/committee`, `/review`, `/scenarios`, `/probe`, `/handoff`, `/string-diagram`) that an AI agent executes when working in this repo; the skills are specified in `.claude/skills/*/SKILL.md` and **run inside an AI session**, not as standalone programs.
- **One script** — `.claude/skills/string-diagram/resource_equations_to_mermaid.py` (Python 3.7+, no external deps): parses resource equations and emits Mermaid flowcharts.

So "running" the repo has two meanings: (1) **using the methodology** by invoking skills in an AI session, and (2) **running the only code** (the equation→Mermaid script). "Testing" is currently **manual** — run skills, inspect outputs, compare to schemas and examples — plus optional **automation** for the script and for structural checks.

### 1.2 Repository Map (from CLAUDE.md)

| Directory       | Contents                    | Run/test relevance |
|----------------|-----------------------------|---------------------|
| `essays/`      | Theory                      | Read-only; link-check / lint if desired |
| `artifacts/`   | Techniques, templates       | Referenced by skills; examples are test-like evidence |
| `palgebra/`    | Formal algebra              | Referenced by string-diagram skill; equations in `.claude/skills/string-diagram/*.txt` |
| `applications/`| Domain analyses             | Read-only |
| `meta/`        | Methodology evolution, uptake| This doc; planning |
| `agent/`       | Handoffs, roster, deliberations, scenarios, probes | **Core of "running":** roster and scenario-roster drive skills; deliberations/scenarios/probes are outputs to validate |
| `.claude/skills/` | Slash-command specs + one Python script | **Executable surface** |
| `references/`  | Bibliography                | Read-only |

### 1.3 Dependencies and Platforms

- **No Node/npm, no package.json** — front-end or JS tooling is not used.
- **Python** — only for `resource_equations_to_mermaid.py`. Script uses stdlib only (`re`, `sys`, `argparse`, `dataclasses`); Python 3.7+.
- **No requirements.txt or pyproject.toml** — intentional; the script is dependency-free.
- **Skills** — require an AI agent (e.g. Claude in Cursor) that can read the repo and follow the SKILL.md instructions; no separate runtime.

---

## 2. How to Run the Repository

### 2.1 Running the Methodology (Skills)

**Where:** Inside an AI session (e.g. Cursor with this repo open), with the agent reading the appropriate SKILL.md when you invoke a command.

**Prerequisites:**

- `agent/roster.md` exists (required for `/committee`).
- `agent/scenario-roster.md` exists (required for `/scenarios`).
- You have a clear topic or situation to feed the skill.

**Commands and what they do:**

| Command | Action | Output location |
|--------|--------|------------------|
| `/committee [topic]` | Adversarial committee deliberation | `agent/deliberations/<topic-slug>/` (00–05+ files) |
| `/committee [topic] scenario_context: agent/scenarios/<slug>/` | Committee across scenarios (deliberated choice) | Same, with scenario-aware charter/resolution |
| `/review` or `/review agent/deliberations/<slug>` | Independent evaluation of a deliberation | `04-evaluation-1.md` (or 06/08 after remediation) |
| `/scenarios [situation]` | Divergent scenario generation (fan) | `agent/scenarios/<topic-slug>/` (00–03) |
| `/probe [situation]` | N× (scenarios→committee), then variance report + landscape map | `agent/probes/<topic-slug>/` |
| `/handoff` | Session handoff for successor agents | `agent/handoff-<date>.md`, previous archived to `agent/archive/` |
| `/string-diagram` | Turn resource equations into Mermaid diagram | Uses or creates `.txt` equations; can call the Python script |

**Recommended first run:** Use the [Quick Start Guide](artifacts/quick-start-guide.md): e.g. `/committee Should we hire two juniors or one senior?` with enough context, then optionally `/review agent/deliberations/<slug>`.

**Remediation:** If a review scores below the threshold (e.g. sum of five rubrics < 13), run committee remediation (e.g. "committee respond to evaluation for agent/deliberations/<slug>"); the skill writes 05-remediation-1.md and appends to 02-deliberation.md, then you can run `/review` again.

### 2.2 Running the Only Code (String-Diagram Script)

**Script:** `.claude/skills/string-diagram/resource_equations_to_mermaid.py`

**Usage:**

```bash
python .claude/skills/string-diagram/resource_equations_to_mermaid.py <equations.txt> [--direction LR|RL|TD|BT] [-o output.mermaid]
```

**Example equation files in repo:**

- `.claude/skills/string-diagram/decision-monad-equations.txt` — fan→funnel deliberated choice pipeline (with spider annotations).
- `.claude/skills/string-diagram/ai-study-equations.txt`
- `.claude/skills/string-diagram/lemon-pie-equations.txt`

**Example (from repo root):**

```bash
python .claude/skills/string-diagram/resource_equations_to_mermaid.py .claude/skills/string-diagram/decision-monad-equations.txt -o decision-monad.mermaid
```

Output is valid Mermaid flowchart syntax; you can paste it into Mermaid Live or any Mermaid-capable renderer.

---

## 3. How to Test the Repository

### 3.1 Current State

- **No automated test suite** — no pytest, jest, or CI config found.
- **No package.json or CI YAML** — nothing to "npm test" or "CI test" out of the box.
- **Evidence of “testing” in the methodological sense:**
  - Deliberation records (e.g. `agent/deliberations/testing-deliberated-choice-workflow/`, `is-author-crackpot-revisited/`) are real runs that validate the committee + review + remediation flow.
  - Handoff notes: `/probe` is still untested; `/review` on methodology-adoption (scenario-aware resolution) not yet run; comparative evaluation (one decision, three methods, same rubric) is the highest-value next evidence.

So "testing" here is a mix of: (1) **structural checks** (files present, schema-like front matter), (2) **script correctness** (equation parser and Mermaid output), and (3) **methodology validation** (run skills and inspect quality; compare to rubrics and examples).

### 3.2 What You Can Test Automatically (Recommendations)

**A. String-diagram script (unit/smoke)**

A minimal smoke test is provided: **`scripts/test_string_diagram.py`**. From the repository root:

```bash
python scripts/test_string_diagram.py
```

It runs the converter on the three equation files in `.claude/skills/string-diagram/` and checks exit code 0, non-empty output, and that the output contains `flowchart`. No dependencies beyond Python 3.7+.

- Optionally: snapshot the Mermaid output for `decision-monad-equations.txt` and diff on changes (catches regressions in parser or generator).

**B. Structural / schema checks**

- **Roster and scenario-roster:** Check `agent/roster.md` and `agent/scenario-roster.md` exist and contain valid YAML front matter with the expected keys (e.g. `roster.committee_name`, `roster.members`).
- **Deliberation records:** For a given `agent/deliberations/<slug>/`, check presence of 00-charter, 01-roster, 01-convening, 02-deliberation, 03-resolution; optional 04-evaluation-1, 05-remediation-1, etc. Optionally validate YAML front matter in charter, resolution, evaluation files against the schemas in `agent/archive/augmentation-plan.md` and `agent/deliberations/README.md`.

**C. Links and references**

- Check for broken internal links (e.g. from README, CLAUDE.md, artifacts to essays/palgebra) and for "coming soon" or placeholder links listed in `agent/gap_analysis.md`.

**D. Skill “smoke” (manual or light automation)**

- **Manual:** Run `/committee quick <simple topic>`, then `/review` on that deliberation; confirm 00–04 files exist and evaluation file has rubric scores and verdict.
- **Light automation:** A script could verify that after a run, `agent/deliberations/<slug>/` contains the minimal set of files and that 03-resolution.md and 04-evaluation-1.md have YAML blocks with expected keys. This does not run the AI; it only checks output shape.

### 3.3 What Remains Manual (Methodology Quality)

- **Rubric quality** — Does the deliberation actually satisfy the five rubrics? This requires human or AI review of the transcript (the `/review` skill does this).
- **Comparative evaluation** — Run one real decision through: (a) simple prompt, (b) multi-perspective prompt, (c) full pipeline; score all three on the same rubric. Handoff calls this the single most important next step for credibility.
- **Probe** — Run `/probe [situation]` (e.g. N=2 or 3) and inspect variance report and decision landscape map; expensive but validates the full fan→funnel iteration.

---

## 4. Recommended Runbook

### 4.1 One-Time / First-Time Setup

1. Read `README.md` and, if working as an AI agent, `CLAUDE.md` and the latest `agent/handoff-*.md`.
2. Confirm `agent/roster.md` and `agent/scenario-roster.md` exist.
3. (Optional) Run the string-diagram script on `decision-monad-equations.txt` and open the generated `.mermaid` in a viewer.

### 4.2 Regular “Run” (Using the Methodology)

1. Choose a concrete topic or situation (see Quick Start and committee skill for framing).
2. Option A — **Committee only:** `/committee [topic]` → then optionally `/review agent/deliberations/<topic-slug>`.
3. Option B — **Deliberated choice:** `/scenarios [situation]` → then `/committee [decision question] scenario_context: agent/scenarios/<topic-slug>/` → then optionally `/review`.
4. If review score is below threshold, run remediation (see committee SKILL.md), then `/review` again.
5. Use `/handoff` at end of session if continuity matters.

### 4.3 Lightweight Automated Tests (Included and Optional)

- **Included:** `scripts/test_string_diagram.py` — smoke test for the equation→Mermaid script (see §3.2 A). Run from repo root: `python scripts/test_string_diagram.py`.
- **Optional — structure:** A script or CI job that checks presence of `agent/roster.md` and `agent/scenario-roster.md` and, for one or two known deliberation directories, checks for 00–04 files and basic YAML structure in charter/resolution.
- **Optional — CI:** If you use GitHub Actions, a minimal job could: (1) run `python scripts/test_string_diagram.py`, (2) run the structural checks above. No network or secrets required.

---

## 5. Summary Table

| Question | Answer |
|----------|--------|
| **What do I “run”?** | (1) Skills inside an AI session (slash commands). (2) The Python script for equations → Mermaid. |
| **What do I “test”?** | Script (exit code, output shape), repo structure (rosters, deliberation dirs), and optionally link/schema checks; methodology quality by running skills and reviewing outputs. |
| **Where is the executable code?** | `.claude/skills/string-diagram/resource_equations_to_mermaid.py` only. |
| **Dependencies?** | Python 3.7+ (stdlib only). AI agent for skills. |
| **CI today?** | None. You can add a small job that runs `scripts/test_string_diagram.py` and optional structure checks. |
| **Best next evidence (from handoff)?** | Comparative evaluation (one decision, three methods, same rubric); then `/review` on methodology-adoption; then `/probe` test. |

---

## 6. Relation to Other Docs

- **Handoff** — Carries "immediate next steps" (e.g. comparative evaluation, `/probe` test, quickstart update). This guide complements that by defining *how* to run and test; the handoff defines *what* to do next.
- **gap_analysis.md** — Lists missing essays and artifacts; this guide does not duplicate that.
- **artifacts/quick-start-guide.md** — First-run path for the methodology; this guide adds the script and testing options.
- **agent/deliberations/README.md** and **agent/archive/augmentation-plan.md** — Schemas and naming for deliberation records; use them when adding structural or schema checks.

This document can be updated when you add CI, tests, or new run procedures.
