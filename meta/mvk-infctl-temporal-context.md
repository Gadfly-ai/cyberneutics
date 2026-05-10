# MVK / infctl / Temporal: Cross-Repository Context

**Purpose:** This document is the **receiving end** for review context from the [MVK](https://codeberg.org/headshed/infctl-cli) documentation repo. It summarizes how Cyberneutics relates to the MVK/infctl/Temporal orchestration work and where the two efforts might connect.

---

## What was pointed here

From the MVK repository (docs for Minimal Viable Kubernetes and the infctl CLI):

- **Problem context doc:** `docs/problem-context-for-cyberneutics-review.md` — frames the question: where should pipeline/orchestration and “API mode” live (infctl-cli vs. cyberneutics vs. both)?
- **Temporal plan:** A phased plan for implementing `deployment_mode: "api"` in infctl-cli using [Temporal](https://temporal.io/) (workflows = pipeline runs, activities = steps). The plan lives in the MVK docs under Reference.

The ask: **review Cyberneutics** with that context in mind and decide how (or whether) the two repos relate.

---

## What Cyberneutics is (quick recap)

Cyberneutics is **methodology documentation + agent skills**. It is not an orchestration runtime:

- **Essays** — narrative engineering, sense-making, decisions under uncertainty.
- **Artifacts** — adversarial committees, evaluation protocols, workflows (human–AI deliberation).
- **Palgebra** — formal algebra for **LLM pipelines** (resource equations, morphisms, composition).
- **Agent skills** — slash commands (`/committee`, `/review`, `/scenarios`, etc.) that run **inside an AI session**; no standalone deployment or infra engine.
- **One script** — resource equations → Mermaid (Python, stdlib only).

There is **no overlapping orchestration**: no Kubernetes, no deployment pipelines, no Temporal workers. The “pipelines” in palgebra are **narrative/LLM pipelines** (e.g. scenario generation → committee → resolution), not infra execution pipelines.

---

## How the two repos relate

| Concern | MVK / infctl-cli | Cyberneutics |
|--------|-------------------|--------------|
| **Domain** | Infrastructure: minimal K8s, deployment steps (JSON pipelines, retries, k8s/shell). | Human–AI decision-making: narrative engines, committees, sense-making. |
| **Execution** | infctl-cli runs steps; Temporal (planned) for durable API-mode runs. | Skills run in an AI session; no separate execution engine. |
| **Pipeline** | Sequence of infra actions (e.g. create namespace, run script). | Sequence of narrative operations (generate → deliberate → evaluate). |

**Conclusion:** No conflict and no duplication. Cyberneutics does not implement (and does not need to implement) deployment orchestration. infctl-cli does not implement narrative methodology.

**Possible connections (optional):**

1. **Application note** — Under `applications/`, an analysis that applies the Cyberneutics framework to **infrastructure decisions**: e.g. rollout strategy, blast radius, “should we run this pipeline now?” — treating those as decisions under uncertainty and using committee-style deliberation where appropriate. The *decision* is narrative; the *execution* stays in infctl/Temporal.
2. **Documentation cross-link** — MVK docs could link to Cyberneutics for “deciding what to run”; Cyberneutics could link to MVK/infctl for “running it” when the domain is infra.
3. **Palgebra vs. infctl pipelines** — Clarify in writing: palgebra describes LLM/narrative pipeline composition; infctl describes deployment step composition. Different algebras, different purposes; no need to unify unless we explicitly model “human gate before running pipeline” as a palgebra collapse operator that triggers an infctl run.

---

## Recommendation

- **Temporal / API mode:** Implement in **infctl-cli** (or a dedicated orchestration service) as planned in the MVK Temporal plan. Cyberneutics does not need to own or run Temporal.
- **Cyberneutics:** Keep focus on methodology, essays, artifacts, and agent skills. Optionally add an **application** (e.g. “Infrastructure decisions under uncertainty”) that uses the methodology to inform *what* to run or *when*, with execution still in infctl/Temporal.
- **Both repos:** Keep this file and the MVK `docs/problem-context-for-cyberneutics-review.md` in sync when the relationship evolves (e.g. when an application note is added).

---

## References

- MVK problem context (in MVK repo): `docs/problem-context-for-cyberneutics-review.md`
- infctl-cli: [Codeberg — headshed/infctl-cli](https://codeberg.org/headshed/infctl-cli)
- Temporal: [temporal.io](https://temporal.io) / [Go SDK](https://docs.temporal.io/dev-guide/go)
- This repo: [repository-review-and-run-guide.md](repository-review-and-run-guide.md), [applications/README.md](../applications/README.md)
