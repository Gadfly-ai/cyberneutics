# Decisions Under Uncertainty

> "The question is not 'what is the right answer?' but 'what can we commit to that doesn't kill us in any of the futures we can imagine?'"

## Why this essay exists

Wicked problems don't have correct solutions. They have interventions with consequences that interact unpredictably with the environment. Traditional decision tools — expected utility, decision trees, cost-benefit analysis — assume you can enumerate outcomes and assign probabilities. For wicked problems, you can't. And the act of intervening changes both the outcome space and the probability distribution.

The essays in this series have developed a theoretical framework for working with narrative engines: sense-making produces bridges that change situations (Essay 03), observation changes state (Essay 04), repetition produces difference (Essay 06), and the palgebra formalizes all of this as typed pipeline operations with traceable quality propagation (Essay 08). But these essays have been largely *diagnostic* — explaining what narrative engines are and why they need engineering.

This essay is *prescriptive*. It shows how the framework supports rigorous, traceable decision-making under genuine uncertainty — not by pretending uncertainty away, but by giving it structure.

The core insight: the adversarial committee (already formalized in [Committee as Palgebra](../palgebra/committee-as-palgebra.md)) is one half of a dual pair. Its dual is **scenario generation** — the operation that explores what *might* happen before the committee debates what to *do*. Composing these dual operations yields a **decision pipeline** with formal properties: quality that propagates predictably, provenance that traces every commitment to the scenarios and arguments that produced it, and iteration that maps the topology of the decision space rather than collapsing prematurely to a single answer.

The formal treatment is in [Duality and Composition](../palgebra/duality-and-composition.md). This essay explains why the formalism is shaped the way it is, what it buys you in practice, and where it connects to the theoretical foundations developed in earlier essays.

---

## The fan and the funnel

Two operations. One diverges; the other converges. Both are necessary; neither alone is sufficient.

### The fan: exploring possible futures

Given an ambiguous situation — a hiring decision, a product strategy, a policy question — **scenario generation** produces multiple distinct narratives, each exploring a different future under different assumptions. The key word is *distinct*: the scenarios must genuinely diverge, not tell the same story in different words.

This is the operation that scenario planning practitioners (Schwartz, van der Heijden) have used since the 1970s. What cyberneutics adds is formalization: the fan is a typed pipeline operation with specified inputs, outputs, catalytic parameters, and quality criteria. It is a **coproduct** in the categorical sense — one input injected into multiple narrative contexts — and it has a dual.

The fan is narrative-mode thinking in Bruner's sense: associative, exploratory, concerned with plausibility rather than proof. It answers the question *"what could happen?"* — not with probabilities but with stories that make different failure modes viscerally concrete.

### The funnel: making commitments

The adversarial committee is the fan's dual. Where the fan diverges, the committee **converges**: multiple perspectives collapse into a single resolution. Five characters with incompatible propensities debate the scenarios, demand evidence, surface assumptions, and produce a commitment — a decision with a rationale, individual votes, and a trace to the arguments that drove it.

The funnel is paradigmatic-mode thinking in Bruner's sense: rule-governed, evaluative, concerned with evidence and logical coherence. It answers the question *"what should we do?"* — not with a cost-benefit calculation but with a resolution that survives adversarial scrutiny.

### The composition: from ambiguity to commitment

Composing fan → funnel produces a single operation: **situation in, resolution out**. This is the *deliberated choice* — a decision pipeline that converts ambiguity into justified commitment.

What the composition guarantees:

- The **fan** ensures the possibility space has been genuinely explored. The committee can't anchor on the first framing because multiple framings exist before deliberation begins.
- The **funnel** ensures a commitment has actually been made. The scenarios don't just sit as interesting stories; they are evaluated, debated, and resolved.
- The **evaluation loop** ensures quality. The same feedback mechanism from the committee pipeline — independent scoring against rubrics, quality gating, bounded remediation — applies to the composed output.

Neither half alone is sufficient. Scenarios without a committee is storytelling — creative but uncommitted, endlessly exploring without deciding. A committee without scenarios is debate — rigorous but anchored, evaluating whatever framing the problem arrived in without questioning whether it's the right framing.

The composed operation is Bruner's binocular vision made operational: narrative mode to explore, paradigmatic mode to evaluate, composed into a single pipeline that *does the thing we actually need* — makes a decision we can trace, defend, and learn from.

### Visual: first-order output vs. metacognitive output

```mermaid
flowchart TD
    A["Situation"] --> B["Fan: scenario generation"]
    B --> C["Funnel: adversarial deliberation"]

    subgraph FIRST["First-order (what we think)"]
        C --> D["Claims and recommendations"]
    end

    subgraph META["Second-order / metacognitive (how we know)"]
        C --> E["Confidence level and uncertainty markers"]
        C --> F["Provenance trail (which scenario/argument supports each commitment)"]
        C --> G["Load-bearing assumptions"]
        C --> H["What would change our minds (next evidence)"]
    end

    D --> I["Commitment decision"]
    E --> I
    F --> I
    G --> I
    H --> I
```

---

## The mathematics of commitment

The composed fan → funnel operation has the structure of a **monad** — the algebraic pattern of "wrap in context, do work, extract result." This isn't decorative category theory. The monad laws translate into quality criteria you can test.

### Unit: does the pipeline add value?

The unit law says: fan a situation into scenarios, then immediately collapse without real deliberation, and you should get back approximately what you started with. The pipeline added nothing.

This is a *test*. Run the composed pipeline with a trivially short deliberation — one round, no challenges, no adversarial friction. If the resolution differs substantively from the original situation framing, something in the scaffold is injecting content. The test distinguishes between a pipeline that genuinely explores and evaluates versus one that merely decorates the input with the appearance of rigor.

### Associativity: does nesting equal breadth?

The associativity law says: running the pipeline twice in sequence (decide, then fan *the decision* and decide again) should be equivalent to running it once with a broader initial exploration.

When the law holds: a single broad pass catches what nested passes would catch. The fan was broad enough.

When the law fails: the second pass found something the first missed. The *pattern* of failure is diagnostic — it reveals which regions of the decision space were invisible from the original framing but became visible after the first resolution shifted the observer's position. This is the cybernetic loop from Essay 04: observation changes state, and the new state reveals new territory. The law's failure is not a defect — it is *information about the decision space's curvature*.

### What the monad buys you

The monad structure means the composed pipeline is **composable**: you can chain operations. "We chose A — now what might go wrong with A?" is the monad's bind: take the resolution, use it as input to a new fan, and explore second-order consequences. Each stage is typed, quality-tracked, and traceable. Pipelines of arbitrary depth without losing the thread.

---

## Repetition as instrument

Running the composed pipeline multiple times from the same premises is not a consistency check. It is a *stability test* — and the results are diagnostic, not pass/fail.

### Architectural walks

Barry O'Reilly's [residuality theory](../wild/residuality-theory/README.md) introduces the concept of the **architectural walk**: knowledge built through repeated traversal. You walk a system multiple times; each repetition differs slightly; the differences accumulate into understanding that no single pass can provide.

O'Reilly roots this explicitly in Deleuze — the same philosophical ground as Essay 06. The walk is an instance of process philosophy in action: each repetition is not the same repetition, because both the walker and the path are different. This is the Deleuzian "repetition produces difference" made operational in software architecture.

The composed fan → funnel pipeline is an architectural walk through a decision space. Each run follows different lines of flight — different scenarios get generated, different arguments crystallize, different metaphors catch fire. The transcript is what the walk leaves behind.

### Residues and eigenforms

A single run produces a **residue**: the resolution, the surfaced tensions, the assumptions that bore weight. This is what one walk left behind.

Run the pipeline multiple times and compare. Some findings recur in every run. Some appear only occasionally. The distinction is precise:

- **Residues** are what any single walk discovers. They are local — products of this specific trajectory through the decision space.
- **Eigenforms** are what every walk discovers. They are global — fixed points of the pipeline, decisions that persist under repetition. (For the full treatment of eigenforms as recursive fixed points, see [Essay 04](./04-cybernetics-and-observation.md).)

The remediation loop *within* a single run hunts for eigenforms locally: "does this framing stabilize under self-assessment?" Repeated runs hunt for eigenforms globally: "does this *decision* stabilize under independent re-examination?"

Five runs yielding three A's and two B's means the decision landscape is **bistable**. The boundary between the basins of attraction — the ridge where small changes flip the outcome — is the most important thing to understand before committing. The divergence *is* the finding.

### Diagnosing instability

When repeated runs disagree, the disagreement has three possible sources:

**The situation framing is ambiguous.** Different runs interpret the same input differently because the input doesn't constrain interpretation tightly enough. The fix is upstream: tighten the situation description.

**The assumptions are load-bearing.** Small perturbations in assumptions or character propensities flip outcomes. This is the most valuable finding — it identifies the ridge. The fix is not to eliminate the instability but to *understand it*: which assumptions matter most? Which can you verify before committing?

**The pipeline is noisy.** LLM stochasticity, presentation order effects, anchoring. This is an engineering problem: lower temperature, randomize order, increase the number of runs. The instability is real but not informative — it tells you about the pipeline, not the decision.

Distinguishing these three sources is the purpose of the **variance report** — the output of running the pipeline N times and comparing results systematically. The report, in turn, feeds a **decision landscape map**: a topological summary showing basins of attraction, ridges, and robust actions that appear across multiple basins.

---

## The Sagan analogy

Carl Sagan's baloney detection kit gave people heuristics that *embody* formal logic in usable form. "What's the control experiment?" is really about conditional independence. "Could an alternative explanation account for the same observations?" is really about model identifiability. People use the heuristics; the mathematics guarantees they work.

Cyberneutics is building toward a **baloney detection kit for decisions under uncertainty**.

| Heuristic | What it operationalizes | Formal backing |
|-----------|------------------------|----------------|
| "Generate at least three distinct scenarios before deliberating" | Fan: explore before committing | Coproduct injection; coverage of divergence axes |
| "Demand evidence for every claim" | Funnel: adversarial cross-examination | Character propensities as catalytic inputs; evaluation rubrics |
| "Run it three times and look at what changes" | Probe: repetition maps topology | Decision monad iteration; residues vs. eigenforms |
| "Trace every commitment to the argument that produced it" | Provenance accumulation | Monotone provenance propagation rule |
| "Quality can't be added downstream — fix the source" | Confidence degradation | Monotone confidence propagation rule |

The heuristics are what practitioners use. The formalism — category theory, palgebra, pipeline composition — is the guarantee the heuristics aren't just vibes.

Enough formal structure that you can *trust* the process. Packaged as practices people can actually *follow*. That is the goal.

---

## Connection to the theoretical foundations

### Dervin's gaps (Essay 03)

The situation that enters the fan is Dervin's gap: a point where understanding has failed and a bridge is needed. The fan generates *multiple* bridges — multiple narratives that cross the gap differently. The funnel selects. The composition is gap-bridging as a typed, quality-tracked pipeline operation.

### The cybernetic loop (Essay 04)

The observation-changes-state principle from second-order cybernetics explains why the monad's associativity law fails informatively: the first pass's resolution *changes the observer's position*, making new regions of the decision space visible. Each iteration of the monad is a circuit of the cybernetic loop. The human gate — where the editor commits — is where the loop terminates: the eigenform is accepted, and the recursive self-assessment stops.

### Deleuzian difference (Essay 06)

Repetition produces difference. The Probe operation is the Deleuzian walk operationalized: run the pipeline multiple times, not to check consistency but to map the space of differences. The variance between runs is not noise to be eliminated — it is the decision space showing its topology. Each run actualizes a different trajectory through the virtual field of possible deliberations.

### Narrative engineering (Essay 07)

Boland's distinction between narrative computing (the primitive) and narrative engineering (the composition discipline) maps directly. A single LLM call generating scenarios is narrative computing. The fan → funnel → evaluation → human gate pipeline is narrative engineering. The monad structure says how these compositions behave under iteration.

Bruner's narrative/paradigmatic distinction — the binocular vision that Boland and cyberneutics both invoke — is now the fan/funnel duality. Narrative mode generates scenarios (fan). Paradigmatic mode evaluates them (funnel). The composed operation gives you both eyes.

### The methodology-to-formalism bridge (Essay 08)

Essay 08 showed that the essays and the palgebra describe the same phenomenon at different levels of abstraction. This essay extends that bridge: the fan/funnel duality adds a *compositional* dimension that neither the standalone committee formalism nor the essay series had captured. The composition reveals that the committee was always only half the story — the convergent half. The divergent half (scenario exploration) was implicit in practice (users explored informally before running the committee) but had no formal status. Now it does.

### Residuality theory

O'Reilly's residuality theory enters through the architectural walk. His three commitments — process over substance, criticality over correctness, difference over essence — mirror the foundations of cyberneutics point for point. The productive distinction between residues (single-walk findings) and eigenforms (persistent findings) sharpens what the essays describe philosophically. The remediation loop hunts local eigenforms; the Probe hunts global ones. Residuality theory provides the vocabulary for this distinction.

The palgebra and residuality theory offer complementary views of the same pipeline:

- **Palgebra asks**: what does each operation *add* to the artifact? (Enrichment, transformation, provenance.)
- **Residuality asks**: what *survives* across all operations? (Residues, eigenforms, architectural substrate.)

A deliberation record is both a palgebra artifact chain and the residue of the committee process. These are charts on the same manifold.

---

## What this means in practice

If you are facing a decision under genuine uncertainty — the kind where you can't enumerate outcomes or assign probabilities — here is what this framework offers:

1. **Explore before committing.** Generate scenarios (the fan) that cover the space of futures you can imagine. The value is coverage, not prediction. Did any scenario surface a failure mode that kills you? If not, generate another.

2. **Deliberate adversarially.** Run a committee across the scenarios (the funnel). The committee's job is not consensus but *stress-testing*: which actions survive scrutiny in all scenarios? This is minimax reasoning, not expected value reasoning. Pick the action whose worst case across scenarios is survivable.

3. **Repeat and compare.** Run the composed pipeline multiple times (the probe). Consistent results mean smooth terrain — commit with confidence. Inconsistent results mean you're near a ridge. Understand the ridge before committing. The ridge is *where the decision lives*.

4. **Trace everything.** Every commitment traces to the scenario that motivated it, the argument that defended it, the evaluation that scored it. Provenance is not bookkeeping — it is the mechanism that makes decisions auditable and revisable.

5. **Fix quality at the source.** Confidence can only degrade through the pipeline. A weak scenario set produces a weak resolution, no matter how good the committee. Invest in the fan — the quality of exploration determines the ceiling on the quality of commitment.

The appropriate success criterion for decisions under genuine uncertainty is not *maximizing expected value*. It is **satisficing subject to a survival constraint**: find an action that doesn't produce catastrophic failure in any scenario you can imagine, and commit to it with eyes open about what you don't know.

---

## Open territory

This essay describes what the duality reveals and what the composed pipeline offers. Several questions remain open and are documented in the [formal treatment](../palgebra/duality-and-composition.md#open-questions):

- **Scenario roster composition**: What archetypes serve divergent exploration? The committee roster is designed for convergent stress-testing; the scenario roster needs different design principles.
- **Variance report and landscape map structure**: How to represent multi-run comparison actionably?
- **Monad laws as executable tests**: Can we operationalize the quality criteria the monad structure provides?
- **Remediation depth vs. probe breadth**: When to go deeper within a run vs. wider across runs?

These questions should not block implementation of the basic pipeline. The fan operation, the composition with the existing committee, and simple iteration can all proceed while the design of variance reports and landscape maps matures through use.

---

**Previous essay**: [Narrative Immune Systems](./09-narrative-immune-systems.md) — the generator-discriminator architecture as immune function

**Related**:
- [Duality and Composition](../palgebra/duality-and-composition.md) — the formal treatment: resource equations, monad laws, new type definitions
- [Committee as Palgebra](../palgebra/committee-as-palgebra.md) — the funnel half formalized
- [Palgebra Reference](../palgebra/reference.md) — notation and composition laws
- [Residuality Theory](../wild/residuality-theory/README.md) — architectural walks, residues vs. eigenforms

**Next**: Implementation — the `/scenarios` skill, scenario roster design, and composed pipeline patterns
