# Phase 2: Deliberation

**Topic:** Should we add a CI job that runs scripts/test_string_diagram.py?  
**Protocol:** Robert's Rules (quick run — abbreviated).

---

## Opening Statements

**Maya:** Adding CI is a signal play. Who does it serve? If the repo stays single-maintainer, CI is theater — you'll run the test locally before pushing. If the goal is to attract contributors, CI says "we care about not breaking the one thing we can automatically check." But CI also creates a commitment: when the job breaks, someone has to fix it. I want to know whether we're optimizing for contributor trust or for avoiding future maintenance. If it's the latter, we're adding a liability. If it's the former, we should be honest that one Python smoke test is a small signal — the real signal is whether we run the methodology (committee, review) and document it. Don't dress up "we added a script" as "we have CI."

**Frankie:** The methodology claims rigor and traceability. We have one executable test. Hiding it behind "run this locally" undermines that claim. A repo that says "here's how to run and test" but doesn't actually run the test in the only place contributors look — the PR check — is saying "we value this enough to document it but not enough to enforce it." That's mission drift. Add the job. Keep the bar low: one script, no secrets, no flaky network. If we can't maintain that, we have a different problem. Principle: if it's in the runbook, it should be in the pipeline.

**Joe:** We didn't have CI before. The test was just added. The question isn't "is CI good" — it's "do we add it now or after we have more tests?" I've seen repos add CI for one test, then the test breaks on a dependency or platform change, and the maintainer disables the job or lets it rot. The cost of CI isn't just the YAML — it's the ongoing obligation. We have no evidence yet that this test is stable across environments (we couldn't run it in one environment already). I'd want to see the test green on at least two distinct setups — e.g. local Windows and one CI runner — before we make CI the source of truth. Otherwise we're committing to a single point of failure we haven't validated.

**Vic:** What would falsify "we should add CI"? If the test is flaky, adding CI hurts (red herrings). If no one but the author ever runs it, CI is redundant. If contributors would run it but don't because there's no check, CI adds value. We don't have data on contributor behavior. We do have: one script, no deps, pure stdlib. That's the lowest-risk CI job possible. The evidence question is: will this job ever fail for a good reason (caught a regression) vs. bad reasons (environment, timeout)? The script has no network, no randomness. Failure mode is "Python or path wrong" — and that's exactly what we want to catch. I'm in favor, with one condition: document in the workflow file that this is the only automated test and that PRs are not required to add more. Otherwise we're implying a standard we're not ready to uphold.

**Tammy:** CI doesn't just run a test — it changes behavior. Once the check exists, PRs get blocked on green. That creates a feedback loop: people fix the test when it breaks, or they work around it. For one script, the loop is simple. But the run guide also mentions optional structure checks (roster, deliberation dirs). If we add CI for the script now, the next ask is "add the structure checks." Then we have two jobs. Then someone wants lint or link-check. The system grows. I'm not against adding this job — I'm flagging that the first CI job is a commitment to a trajectory. Let's add it with an explicit scope: "This workflow runs the string-diagram smoke test only. Other checks may be added later by separate decision." That keeps the system boundary clear and avoids scope creep by precedent.

---

## Initial Positions Summary

| Member  | Stance                    | Confidence | Key Concern                                      |
|---------|---------------------------|------------|--------------------------------------------------|
| Maya    | Conditional oppose / clarify | Medium   | Who benefits; don't conflate one test with "we have CI" |
| Frankie | Aye                       | High       | Principle: runbook and pipeline should align     |
| Joe     | Defer until validated      | Medium     | Test stability across environments first         |
| Vic     | Aye with documentation    | High       | Low-risk job; document that it's the only test    |
| Tammy   | Aye with scope boundary    | Medium     | First CI job sets trajectory; name the scope     |

---

## Key Tensions Identified

1. **Signal vs. maintenance** — CI as trust signal for contributors vs. ongoing obligation when the job breaks (Maya vs. Frankie).
2. **When to add** — Add now (low-risk, principle) vs. validate test in multiple environments first (Joe vs. Vic).
3. **Scope** — One job only vs. precedent for more checks (Tammy).

---

## Synthesis

**Emerging consensus:** Add the CI job, with two guards: (1) document in the workflow that this is the only automated test and that more checks require a separate decision; (2) if the test proves flaky in CI, fix or remove the job rather than let it rot. Joe's concern (validate first) is partially addressed by "lowest-risk job possible" and by the fact that failure mode is visible and fixable. Maya's concern (who benefits) is addressed by being explicit that we're optimizing for "runbook and pipeline aligned" and for catching environment/path regressions, not for the appearance of a full test suite.

**Status:** DELIBERATION COMPLETE.

---

## KEY TENSIONS IDENTIFIED

- **Signal vs. maintenance:** CI improves contributor trust and aligns with the run guide, but creates a maintenance commitment. Mitigation: one job, no deps, document scope.
- **Add now vs. validate first:** Add now is low-risk (stdlib, no flake); validate-first would delay. Committee leans add now with explicit scope.

## ASSUMPTIONS SURFACED

- The test will run reliably in a typical GitHub Actions (or similar) environment. If it doesn't, we fix or remove rather than leave red.
- The repo will remain small enough that "one smoke test" is an honest representation of automated coverage; we're not implying broader coverage.

## EVIDENCE REQUIREMENTS

- None blocking. If the CI job fails in practice (e.g. path or Python version), that's evidence to fix the script or the workflow.

## DECISION SPACE MAP

- **Add CI with documented scope** → Aligns runbook and pipeline; small maintenance risk; sets precedent for "we have at least one check."
- **Don't add** → No maintenance; runbook says "run this locally" only; weaker signal for contributors.
- **Defer until multi-environment validation** → Delays signal and alignment; may be unnecessary for a stdlib-only script.

## RECOMMENDED NEXT STEPS

1. Add a CI workflow that runs `python scripts/test_string_diagram.py` on push/PR.
2. In the workflow file (or README), state that this is the only automated test and that additional checks require a separate decision.
3. If the job fails in CI, fix the script or the workflow path; do not leave a permanently red check.

---

## Response to evaluation (motion to recommit)

The independent review (04-evaluation-1.md) scored this deliberation 9/15 (below threshold 13). Biggest gaps: no direct debate (opening statements only); Joe's and Maya's positions never engaged; uncited claim ("we couldn't run it in one environment"). The committee accepts the three recommendations and adds **Round 2** below to address them. Note: the initial run was explicitly a **quick run** (opening statements only, no rounds); Round 2 is added in remediation to meet the evaluator's bar for adversarial rigor and evidence clarity.

---

## Round 2: CI job — direct exchange (remediation)

**Chair:** We're recommitting to address the evaluation. Two things we need to do on the record: first, Vic and Joe — the evaluator says we never actually debated your disagreement. Vic, you're for adding now; Joe, you wanted validation in multiple environments first. Vic, challenge Joe directly. Then we need someone to answer Maya's "who benefits?" so it's on the transcript. And Joe, we need to clarify what you meant by "we couldn't run it in one environment already."

**Vic:** Joe, you said we have no evidence yet that this test is stable across environments. I'm going to push back. The script is stdlib-only — no network, no randomness, no external deps. The only ways it can fail are: wrong Python version, wrong path, or broken script. If it fails in CI for path or Python, that's exactly what we want CI to catch. So "stable across environments" for this script doesn't mean "we've run it on five OSes" — it means "the failure mode is deterministic and environment-related." What would count as "validated" for you? Green on two different runners? Or would you accept that stdlib-only plus no flake sources is sufficient signal to add the job and fix if we're wrong?

**Joe:** I'll concede the point with a caveat. If the only failure modes are Python version and path, then yes — we're not in "might be flaky" territory. My worry was "we're committing to a job we haven't seen green anywhere." The evaluator also flagged my line about not being able to run it in one environment. I should clarify: when the run guide was being tested, the smoke test was executed in the Cursor sandbox; it exited with code 2 and the message "Cursor Sandbox is unsupported." So it wasn't that the script failed — the environment disallowed or restricted execution. That's an environment restriction, not a script bug. With that on the record, I'm not holding out for "green on two runners" before we add CI. I still think the *principle* of validating before committing is right, but for this specific script the risk is low enough. I change my vote to Aye, with the same guard everyone else has: if the job goes red in CI, we fix or remove.

**Chair:** Thank you, Joe. Frankie, address Maya — who benefits, and are we single-maintainer or not?

**Frankie:** Maya, you asked who this serves and said if the repo stays single-maintainer, CI is theater. I'm going to state it plainly so it's on the record. We're optimizing for two things: runbook–pipeline alignment — the guide says "run this test," and CI makes that the default for anyone opening a PR, including the maintainer — and catching environment and path regressions. We're not claiming the repo has multi-contributor traffic today. It might be single-maintainer. Even then, CI isn't theater: it's a self-signal. You run the test locally, but the check is the proof that the path and Python setup in the workflow are correct. If you add a second test later, you have a baseline. So "who benefits?" — the maintainer benefits from alignment and from having one canonical run; future contributors benefit from seeing a green check. We're not overclaiming. We're saying: add one job, document scope, fix or remove if it breaks.

**Maya:** I can live with that. As long as we're not telling ourselves "we have CI" in the sense of a full test suite or that we're contributor-ready. One job, documented scope, fix or remove — that's honest. I keep my Aye with condition.

**Chair:** Summary of Round 2. Joe conceded: stdlib-only is sufficient signal; his "couldn't run it in one environment" is clarified — Cursor sandbox restriction, not script failure. Maya's "who benefits?" was answered on the record: runbook–pipeline alignment, path regression, self-signal; we're not overclaiming. Resolution unchanged. Status: REMEDIATION ROUND COMPLETE.
