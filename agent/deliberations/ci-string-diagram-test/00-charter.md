---
charter:
  goal: "Decide whether to add a CI job that runs scripts/test_string_diagram.py on push/PR."
  context: |
    The repo has one automated test (smoke test for the equation→Mermaid script). It was added with the repository review and run guide. No CI exists today. The decision is whether to add a GitHub Actions (or similar) job that runs this test automatically.
  success_criteria:
    - "Clear recommendation: add CI or not, with rationale"
    - "Trade-offs named (maintenance, signal, contributor expectations)"
    - "Evidence requirements or next steps if deferred"
  exit_conditions:
    - "Committee delivers a resolution (PASSED / DEFERRED / NO_CONSENSUS) with votes"
    - "Decision space map surfaced for the user"
  deliverable_format: "Resolution Artifact + Decision Space Map"
---
