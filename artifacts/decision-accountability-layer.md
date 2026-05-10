# Decision Accountability Layer

## What this is

The Decision Accountability Layer is a lightweight governance protocol that converts oversight into auditable action.

It is designed for contexts where:

- Concerns can be surfaced, but follow-through is inconsistent
- Hard veto authority is politically or operationally out of scope for now
- Teams need accountability without freezing decision velocity

This v1 protocol uses **advisory oversight + mandatory disposition**:

- advisory signals can be raised by humans or agents
- every concern must be dispositioned before a decision is finalized
- overrides are allowed, but must be explicit, attributable, and reviewable

## When to use

Use this layer when a decision is:

- high stakes (material downside if wrong)
- non-routine (judgment-heavy, value-laden, or novel)
- likely to produce conflicting interpretations

For low-stakes routine decisions, use simpler workflow and sampled audits.

## Core principle

The system does not ask "did someone raise a concern?"
It asks "what happened to each concern, and who owns that outcome?"

## Lifecycle

Each concern moves through this lifecycle:

1. **Raised** - concern is logged with evidence and severity
2. **Triaged** - concern is scoped, deduplicated, and assigned
3. **Dispositioned** - concern is resolved as `accept`, `mitigate`, or `override`
4. **Closed** - disposition is completed and traceable
5. **Backtested** - later outcomes are compared to the original disposition

## Required disposition outcomes

Every concern must end in exactly one disposition:

- `accept` - concern is valid, decision/process is changed now
- `mitigate` - concern is valid, risk controls and owner/deadline are defined
- `override` - concern is acknowledged but decision proceeds with explicit rationale

No concern may remain in undecided limbo at decision close.

## Data contract

### Concern record (required fields)

- `concern_id` (stable ID)
- `decision_id` (target decision)
- `title`
- `description`
- `severity` (`low` | `medium` | `high` | `critical`)
- `raised_by`
- `raised_at`
- `evidence_refs` (links to transcript snippets, docs, logs, or artifacts)
- `owner` (person accountable for disposition)
- `status` (`raised` | `triaged` | `dispositioned` | `closed`)

### Disposition record (required fields)

- `concern_id`
- `decision_id`
- `outcome` (`accept` | `mitigate` | `override`)
- `rationale` (why this outcome was chosen)
- `decided_by`
- `decided_at`

Additional required fields by outcome:

- For `mitigate`: `mitigation_actions`, `mitigation_owner`, `mitigation_due_date`
- For `override`: `override_authority`, `review_date`, `residual_risk_statement`

### Decision close record (required fields)

- `decision_id`
- `decision_owner`
- `closed_at`
- `open_concern_count` (must be `0`)
- `concern_summary` (counts by severity and disposition)

## Override policy (v1)

Override is allowed, but constrained:

- Only designated override authorities can approve
- Override requires rationale and residual risk statement
- Override requires a review date (time-bounded exception, not permanent immunity)
- Overrides are reviewed in recurring governance cadence

## Roles

- **Concern owner:** accountable for moving concern to valid disposition
- **Decision owner:** accountable that no concern is left undispositioned at close
- **Override authority:** explicitly named role allowed to approve overrides
- **Reviewer/evaluator:** audits rationale quality and trend signals

## Governance cadence

- **Weekly override review:** inspect all new overrides, challenge weak rationales
- **Monthly trend review:** false positives, misses, aging concerns, latency burden
- **Quarterly policy tuning:** severity thresholds, triage criteria, review SLAs

## Metrics (MVP)

Track these baseline indicators:

- **Disposition completeness rate:** percent of concerns dispositioned before close
- **Time to disposition:** median hours/days from raise to disposition
- **Override frequency by severity:** are serious concerns being routinely overridden?
- **Open concern aging:** long-running unresolved concerns by severity

## Backtesting protocol

For significant incidents or postmortems:

1. Link incident to prior `decision_id` and relevant `concern_id` values
2. Classify each linked concern:
   - correctly accepted
   - correctly mitigated
   - incorrectly overridden (regret signal)
   - missed (no concern was raised, but should have been)
3. Record lessons and threshold updates in governance review notes

The objective is institutional learning, not blame assignment.

## Integration with committee workflow

- Committee deliberation generates candidate concerns
- Accountability layer enforces disposition and override traceability
- Independent evaluation can enrich concern quality and rationale quality scores

This is an enrichment layer, not a replacement for committee deliberation.

