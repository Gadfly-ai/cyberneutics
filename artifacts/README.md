# Artifacts: Practical Techniques and Protocols

This directory contains concrete techniques, protocols, and examples for implementing Cyberneutics methodology.

## Core Techniques

These four techniques form the foundation of the methodology. Use them together for maximum effectiveness.

### [Adversarial Committees](./adversarial-committees.md)
Fixed character rosters with incompatible propensities that systematically surface blind spots and failure modes. Learn how to design characters, when to use each perspective, and how to prevent theatrical debate.

### [Robert's Rules as Forcing Functions](./roberts-rules-forcing-function.md)
Procedural overhead that prevents statistical shortcuts and forces genuine exploration of decision space. Understand why bureaucracy is computational necessity, not administrative burden.

### [Independent Evaluation Protocols](./independent-evaluation.md)
Breaking the hermeneutic circle by evaluating deliberations with fresh model instances against explicit rubrics. Learn the five core rubrics and how to iterate based on feedback.

### [Cross-Scenario Learning](./cross-scenario-learning.md)
Building institutional memory by extracting lessons from past deliberations and injecting them into future ones. See how the methodology improves over time through compounding learning.

### [Scenario Generation](./scenario-generation.md)
Divergent narrative exploration of possible futures. Deploy independent narrative lenses to generate distinct, internally consistent scenarios from an ambiguous situation. The **fan** operation — the categorical dual of the committee (**funnel**). Formalized in [palgebra/duality-and-composition.md](../palgebra/duality-and-composition.md).

### [Deliberated Choice Workflow](./deliberated-choice-workflow.md)
The composed fan→funnel pipeline: generate divergent scenarios, then deliberate across them with the adversarial committee. Converts ambiguity into justified commitment. Documents the manual workflow for chaining `/scenarios` and `/committee`.

### [Decision Accountability Layer](./decision-accountability-layer.md)
Advisory oversight with mandatory disposition and override logging. Defines concern lifecycle, data contracts, governance cadence, and backtesting protocol so concerns cannot be ignored without traceability.

## Getting Started

### [Quick Start Guide](./quick-start-guide.md)
Your first committee deliberation in 30 minutes. Minimal viable implementation, most common mistakes, and when to use which techniques.

### [Committee Setup Template](./committee-setup-template.md)
Prompt templates for initializing characters, presenting problems, and structuring deliberations. Ready-to-use starting points.

### [Evidence Evaluation Prompt](./evaluating-evidence-quality-prompt.md)
Specialized prompt for determining if vendor reports and white papers are high-quality enough to justify a selection decision. Only used when data quality is suspect.

### [Product Ranking Prompt](./product-ranking-prompt.md)
The Phase 2 prompt. Use this AFTER the committee has agreed the evidence is sufficient. Focuses on weighted scoring, risk analysis, and final selection.

### [Lesson Extraction Template](./lesson-extraction-template.md)
Structured template for documenting what worked, what failed, and how to apply lessons in future scenarios. Includes workflow checklist.

## Examples and Case Studies

### Complete Worked Examples

**[Hiring Decision Example](./examples/hiring-decision-example.md)**
Complete transcript of a hiring deliberation using adversarial committees and Robert's Rules, with independent evaluation scores, lessons extracted, and decision rationale.

**[Repository Review Example](./examples/repository-review-example.md)**
The methodology applied to reviewing a codebase.

See the [examples directory](./examples/) for the full collection.

## Troubleshooting

### [Common Problems and Solutions](./troubleshooting.md) failure modes and fixes
Diagnostic guide for when things go wrong:
- "My committee just agrees with everything"
- "Characters are too polite / not adversarial enough"
- "Evaluation scores are consistently low"
- "I don't know which lessons to inject"
- "Deliberation takes too long / goes in circles"
- "Robert's Rules feel too bureaucratic"
- "How do I know if this is actually working?"

## Reference Materials

### [Evaluation Rubrics Reference](./evaluation-rubrics-reference.md)
Quick reference card with:
- Five core rubrics (0-3 scoring)
- Concrete examples at each score level
- What to look for when evaluating
- How to cite evidence from transcripts

### [Character Propensity Reference](./character-propensity-reference.md)
Deep dive into each committee character:
- Maya (Paranoid Realism)
- Frankie (Idealism / Values Guardian)
- Joe (Continuity Guardian)
- Vic (Evidence Prosecutor)
- Tammy (Systems Thinker)

Including: when each is essential, failure modes, calibration notes, interaction patterns.

### Deliberation records (directory structure)
When using the committee and review skills (`.claude/skills/committee/`, `.claude/skills/review/`), every committee run writes a deliberation record to `agent/deliberations/<topic-slug>/` with files `00-charter.md`, `01-roster.md`, `01-convening.md`, `02-deliberation.md`, and `03-resolution.md`. Use `/review agent/deliberations/<topic-slug>` to evaluate the transcript and write to `04-evaluation-1.md` (and, when the feedback loop runs, `06-evaluation-2.md`, etc.). **Evaluation feedback loop (remediation):** when the evaluation sum is below threshold (default 13), the committee can run a remediation round; see [Independent Evaluation — Evaluation Feedback Loop](./independent-evaluation.md#evaluation-feedback-loop-remediation) and `agent/deliberations/README.md`.

## Integration

### [Integration with MOOLLM](./integration-with-moollm.md)
How Cyberneutics techniques map to MOOLLM's architecture:
- Where these protocols fit in the MOOLLM stack
- Example MOOLLM configurations
- How to use MOOLLM's microworld features with these techniques
- State management and persistence patterns

## Usage Patterns

### When to Use What

**For simple queries** (known-good answers, straightforward information):
- Don't use this methodology
- Direct prompting is fine

**For medium complexity** (some ambiguity, multiple valid approaches):
- Use adversarial committee (3-5 characters)
- Skip Robert's Rules unless debate gets circular
- Light independent evaluation (quick rubric check)

**For high complexity** (strategic decisions, significant consequences):
- Full adversarial committee (all 5 characters)
- Strict Robert's Rules enforcement
- Comprehensive independent evaluation
- Cross-scenario learning (inject relevant lessons)
- Multiple evaluation instances for critical decisions

**For recurring problems** (hiring, resource allocation, similar strategic choices):
- Build lesson library for that domain
- Refine character calibration over time
- Track evaluation score trends
- Develop domain-specific shortcuts

### Combination Patterns

The techniques are designed to work together:

```
┌─────────────────────────────────────────┐
│ Adversarial Committee                   │
│ (diverse perspectives)                  │
│           ↓                             │
│ Robert's Rules                          │
│ (procedural rigor)                      │
│           ↓                             │
│ Independent Evaluation                  │
│ (external validation)                   │
│           ↓                             │
│ Cross-Scenario Learning                 │
│ (institutional memory)                  │
└─────────────────────────────────────────┘
```

Each layer addresses a specific failure mode:
1. Committees prevent single-narrative collapse
2. Robert's Rules prevents statistical shortcuts
3. Independent evaluation prevents self-confirmation
4. Cross-scenario learning prevents repeating mistakes

### Formal grounding

This combination pattern is formalized in the [palgebra](../palgebra/):

- A committee deliberation is a **transformation morphism** (consumes a charter, produces a transcript)
- Rubric evaluation is an **enrichment morphism** (scores the transcript without changing it)
- The quality gate is a **coproduct** (above threshold → accepted; below → remediation)
- The feedback loop is a **bounded trace** (max 2 remediation rounds)
- Character propensities and evaluation rubrics are **catalytic inputs** (used but not consumed)

See [Committee as Palgebra](../palgebra/committee-as-palgebra.md) for the full pipeline as resource equations, and the [Palgebra Reference](../palgebra/reference.md) for the formalism.

## Contributing

### Adding New Techniques
If you develop new protocols that fit the Cyberneutics framework:
- Document the problem it solves
- Provide concrete examples
- Show how it integrates with existing techniques
- Include evaluation criteria

### Sharing Examples
Anonymized transcripts of real deliberations are valuable:
- Redact sensitive details
- Note what domain/context
- Include evaluation scores if applicable
- Extract lessons learned

### Reporting Issues
If a technique doesn't work as documented:
- Describe the context
- Show what you tried
- Explain what happened vs. what you expected
- Suggest improvements

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

## License

MIT License - these are practical tools meant to be used, modified, and shared.

---

**Remember**: These techniques are tools, not rules. Adapt them to your context. The goal is rigorous sense-making, not procedural purity.

If a technique isn't helping, skip it. If you develop better approaches, share them. The methodology should evolve as we learn what actually works.
