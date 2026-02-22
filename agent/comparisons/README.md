# Comparison Runs: Deliberative vs. CJT-Style

This directory holds **comparison runs** that pit the deliberative committee pipeline against a CJT-style (independent vote, then aggregate) pipeline on the **same** question. Purpose: test whether outcomes differ and how (see [comparison protocol](../artifacts/comparison-protocol-deliberative-vs-cjt.md)).

## Layout per run

Each subdirectory `<topic-slug>/` contains:

- **00-charter.md** — Shared question and context for both pipelines.
- **01-deliberative-summary.md** — Pointer to and summary of `agent/deliberations/<topic-slug>/` (resolution, votes).
- **02-cjt-style-votes.md** — Five independent votes and rationales (no cross-reading).
- **03-cjt-style-result.md** — Aggregate result (e.g. majority Nay).
- **04-comparison-summary.md** — Outcome agreement, vote differences, and interpretation.

## Current runs

- **second-ci-job/** — "Should we add a second CI job (e.g. link-check) in addition to the string-diagram test?" Deliberative: unanimous Nay with revisit condition. CJT-style: Nay 4–1. Same verdict; deliberation changed one vote (Frankie Aye → Nay) and added a clear revisit condition.

- **code-of-conduct/** — "Should we add a Code of Conduct (CoC) to the repository?" **CJT-style: Aye 3–2.** **Deliberative: Nay 5–0.** Opposite verdicts. Three votes flipped (Frankie, Vic, Tammy Aye → Nay) after debate on enforcement and weaponization; deliberation stress-tested the "add a CoC" position and the committee rejected it.
