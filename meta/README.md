# Meta: Reflective Documentation

This directory contains documentation *about* the methodology's
evolution, adoption, and self-assessment — distinct from the
methodology itself (essays/, artifacts/) and from operational
session state (agent/).

| Audience | Directory |
|---|---|
| **Community, future committees, contributors** | `meta/` (this directory) |
| **Successor agents, session continuity** | `agent/` (handoffs, diaries, deliberation records) |
| **Practitioners learning the methodology** | `artifacts/` (techniques, templates, guides) |
| **Theorists understanding the foundations** | `essays/` (theoretical framework) |
| **Formalists specifying pipelines** | `palgebra/` (the algebra) |

## Contents

### [research-plan.md](research-plan.md) ← **Start here if you want to contribute**

Ten concrete action items derived from the [Societies of Thought analysis](../essays/societies-of-thought-synthesis.md). Each item specifies what to build, why it matters, how to do it, and a success metric. Items span four categories:

- **Category A** — Strengthen existing infrastructure: personality architecture for committee characters, balance metrics, reconciliation protocols
- **Category B** — Test generalization: transfer learning across domains, domain-specific character variants
- **Category C** — Formalize theory: information-theoretic foundations essay, social scaling theory
- **Category D** — Expand evidence: worked examples library, comparative effectiveness study

Phases 1–3 are accessible without deep repo context. If any item interests you — as practitioner, theorist, or builder — pick it up and run.

### [methodology-evolution.md](methodology-evolution.md)

How the methodology developed: mistakes made, dead ends explored,
patterns that emerged, and a chronological development trajectory
from January 29, 2026 through the present. Includes maturity
assessment and open questions.

### [uptake-and-usage.md](uptake-and-usage.md)

External adoption signals: forks, platform integrations, practitioner
feedback, and what they tell us about whether the methodology works
outside its birthplace. Tracks against the predictions made by the
Feb 1, 2026 self-evaluation.

### [is-author-crackpot.md](is-author-crackpot.md)

Two adversarial committee runs (Feb 17 and Feb 21, 2026) assessing
whether the repository's interdisciplinary synthesis is genuine or
crackpottery. Verdict: not a crackpot, but the live question is
whether the methodology outperforms simpler approaches. Includes
the probability distribution, debate history, and calibration anchors
for what evidence would change the numbers.

### [repository-review-and-run-guide.md](repository-review-and-run-guide.md)

In-depth review of the repo and a concrete run/test guide: what is
runnable (skills in an AI session, the string-diagram Python script),
how to run the methodology and the script, current testing state, and
recommended lightweight automation (including `scripts/test_string_diagram.py`).

## Why This Directory Exists

The methodology claims to be self-improving: applying Cyberneutics to
itself should produce measurable improvements. This directory is where
that claim gets tested.

- **research-plan.md** is the active work queue — what needs doing and how
- **methodology-evolution.md** shows whether the methodology actually
  evolved through practice (not just accumulated documentation)
- **uptake-and-usage.md** shows whether anyone outside the project
  finds it useful (the external validation gap)

Future `/committee` deliberations about project direction should read
this directory first to understand the project's current state and
what external signals say about where to invest effort.
