# Working with Cyberneutics: A Guide for AI Assistants

## What this repo is

Cyberneutics is a methodology for working with LLMs as collaborative sense-making partners. It treats LLMs as **narrative engines** rather than answer machines and provides rigorous, traceable techniques for **decisions under genuine uncertainty** — explore possible futures, evaluate them adversarially, repeat to map the decision landscape, trace every commitment to its sources. The methodology is documented in essays (why), artifacts (how), and a formal algebra called palgebra (what, precisely). For a fuller orientation, read `README.md`.

## Before you do anything: session start

1. **Read the most recent handoff**: `agent/handoff-[YYYY-MM-DD].md` (pick the largest date). It captures current context, what was just worked on, open questions, and next steps. Skipping this loses continuity.
2. **Check `agent/gap_analysis.md`** for known gaps and planned documents.
3. **If a `/committee` deliberation is relevant**, look in `agent/deliberations/` for records of prior runs on related topics before starting a new one.

## Repository map

| Directory | Contains | Read when you need to… |
|-----------|----------|------------------------|
| `essays/` | Theoretical foundations | Understand *why* the methodology works. See `essays/README.md` for reading paths by audience (Practitioner, Theorist, Skeptic). |
| `artifacts/` | Techniques, templates, guides | Find a practical technique to apply. See `artifacts/README.md` for the index. |
| `palgebra/` | Pipeline algebra formalism | Write resource equations or understand a pipeline. Start with `palgebra/reference.md` (syntax and how-to); read `palgebra/decorated-texts.md` for theory. |
| `applications/` | Domain analyses (e.g. narrative immune systems) | See the methodology applied to a real-world domain. |
| `meta/` | Methodology evolution, uptake tracking | Understand how the project has developed and what's been validated. Read before major planning decisions or `/committee` runs about project direction. |
| `wild/` | Incoming ideas, external material, not yet tamed | Browse when exploring adjacent territory. Don't treat as settled. |
| `references/` | Background reading | Find the theoretical sources cited in essays and artifacts. |
| `demo/` | Local Next.js app (naive vs committee UI) | Run on your machine: see `demo/README.md` (Node 20+, `npm install`, `npm run setup`, `npm run dev`). |
| `.claude/skills/` | Executable skill files for slash commands | **Read the relevant SKILL.md before invoking any slash command.** The summaries in this document tell you *when* to invoke; the SKILL.md tells you *how*. |

### `agent/` in more detail

- `handoff-[YYYY-MM-DD].md` — most recent session handoff; **read this first at session start**
- `roster.md` — committee character roster; read by the committee and review skills at invocation time
- `scenario-roster.md` — scenario character roster (divergent exploration lenses); read by the scenarios skill. Distinct from committee roster — different purpose, different characters.
- `deliberations/<topic-slug>/` — committee run records (00-charter through 04-evaluation); see `agent/deliberations/README.md` for schema
- `scenarios/<topic-slug>/` — scenario generation records (00-situation through 03-assessment); produced by `/scenarios`
- `probes/<topic-slug>/` — probe records (run-01/ through run-0N/, variance report, landscape map); produced by `/probe`
- `diary/` — exploratory writing between sessions; read when you want recent thinking that hasn't made it into a document yet. **Write to diary** for speculative or exploratory ideas mid-session that don't yet belong in a handoff; **write to handoff** for conclusions, decisions, and next steps.
- `gap_analysis.md` — known gaps and planned documents
- `archive/` — previous handoffs, completed plans; historical reference

### `meta/` in more detail

- `uptake-and-usage.md` — tracks which techniques have been validated and in what contexts
- `methodology-evolution.md` — records how the methodology has changed over time and why
- Read before major planning decisions or `/committee` runs about project direction; these files tell you what is settled vs. still being worked out.

### `wild/` in more detail

`wild/` holds incoming ideas and external material — talks, papers, adjacent projects — that haven't been integrated into the main methodology yet.

- Each topic gets its own sub-directory (e.g., `wild/harness-engineering/`)
- Each sub-directory contains at minimum a `README.md` (links, provenance, why it's interesting) and a `summary.md` (key takeaways, presenter/author info, relevant quotes)
- **Intake convention**: when starting work on a `wild/` topic, read both files before drawing on the material
- Don't treat `wild/` content as settled methodology — it's raw material for future essays or artifacts

## Available skills

Six slash commands are available. **Before invoking any skill, read its SKILL.md.** The table below tells you when to suggest them; the SKILL.md file contains the full operational instructions.

| Command | SKILL.md location | Suggest when… |
|---------|------------------|---------------|
| `/committee [topic]` | `.claude/skills/committee/SKILL.md` | User faces a complex decision, competing values, or asks "what are we missing?" Supports `scenario_context:` for deliberated choice. |
| `/scenarios [situation]` | `.claude/skills/scenarios/SKILL.md` | User faces genuine uncertainty about *what might happen* — explore possible futures before committing. The divergent (fan) half of the fan/funnel duality. |
| `/probe [situation]` | `.claude/skills/probe/SKILL.md` | High-stakes decisions where understanding the *decision landscape* matters — runs fan→funnel N times, compares resolutions, identifies eigenforms vs. residues. |
| `/review` | `.claude/skills/review/SKILL.md` | After any `/committee` run — evaluates the transcript against five rubrics, closes the feedback loop |
| `/handoff` | `.claude/skills/handoff/SKILL.md` | End of a significant session, before a break, after major milestones |
| `/string-diagram` | `.claude/skills/string-diagram/SKILL.md` | User describes a pipeline or workflow that could be formalized as resource equations. Supports `{spider: fan/funnel}` annotations for fan/funnel topology. |
| `/stop` | *(recognized by all skills)* | **Panic stop.** Immediately halts any running skill. The agent stops generating, finishes the current file cleanly, presents what's complete, and does not suggest continuing. Works during `/committee`, `/review`, `/scenarios`, and `/probe`. |

## Pipeline checkpoint model

**Every step in the feedback loop is a checkpoint.** The agent completes one step (deliberation, evaluation, or remediation), shows a status banner with the score and what comes next, then **stops and waits for the user to say "continue" or "done."** The agent never auto-chains to the next step.

The user has two ways to stop:
1. **At a checkpoint** — say "done", "no", or just don't respond. The process stops cleanly between steps.
2. **Mid-step** — use Cursor's stop button (square icon in chat) or type `/stop` to halt mid-generation.

If the user says "run until resolved" or gives blanket permission, the agent may proceed through multiple steps but **still shows each checkpoint banner** so the user can see progress and break out at any time.

## Core ideas

Five ideas underlie everything here. These are orientation, not instruction — for depth, see `essays/README.md`:

- **LLMs are narrative engines.** Everything they produce is a narrative construct. An LLM generating a narrative is **narrative computing** — the primitive operation, like a transistor amplifying a signal.
- **Narrative engineering composes unreliable primitives into reliable systems.** A single LLM call drifts and distorts. Redundancy (multiple perspectives), feedback (evaluation), iteration (generate-evaluate-revise), and staged composition (pipelines) make the system trustworthy. This is the discipline — analogous to how software engineering grew from symbolic computing.
- **Repetition produces difference.** Running the same prompt multiple times maps the latent space of possible interpretations — it's exploration, not redundancy.
- **Observation changes state.** Every response modifies the user's cognitive state. The goal is to help navigate complexity, not deliver finality.
- **The user is an editor.** Your role is to generate perspectives and framings; the user curates which get published to reality.

## Palgebra in brief

Three ideas to know as orientation before reading `palgebra/reference.md`:

- **Decorated texts**: every artifact is `(text, metadata)` where metadata is YAML front matter carrying scores, provenance, and type info.
- **Enrichment vs. transformation**: transformations produce new content; enrichments only update metadata (scoring, gating). Prefer enrichment when you can — it's idempotent and re-runnable.
- **Three propagation rules**: confidence can only degrade through a pipeline; provenance can only accumulate; content transforms.

For the committee pipeline formalized as a worked example, see `palgebra/committee-as-palgebra.md`. For the fan/funnel duality (scenario generation + committee as a decision monad) and iteration for mapping decision landscapes, see `palgebra/duality-and-composition.md` and `essays/10-decisions-under-uncertainty.md`.

## Working style

When collaborating with mg (the repo's author) on this repository:

- **Ask clarifying questions** when problem framing is ambiguous — the ambiguity is often what needs exploring
- **Offer multiple approaches** rather than collapsing to one
- **Show your reasoning** transparently
- **Use the techniques on themselves**: if discussing adversarial committees, consider generating a mini-committee; if discussing palgebra, use resource equation notation in your outputs
- **Create session handoffs** via `/handoff` at the end of significant sessions or when asked

The goal isn't to be a better answer machine. It's to be a better collaborator in sense-making.

## Common pitfalls

- **Don't collapse to single answers prematurely.** If you find yourself giving "the answer" quickly, you're probably missing the point.
- **Don't skip provenance.** When building pipelines, track where content came from and what operations transformed it.
- **Don't treat soft types as hard types.** A Medium-confidence artifact isn't broken — it's honestly scored. Work with graded quality.
- **Don't optimize for looking rigorous.** Three perspectives that disagree interestingly beat one polished analysis that papers over the tension.
