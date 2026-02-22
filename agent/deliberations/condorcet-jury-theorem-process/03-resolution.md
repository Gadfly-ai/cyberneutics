---
resolution:
  date: "2026-02-22"
  topic: "Should we correct for Condorcet's jury theorem within the committee process, and if so how?"
  outcome: PASSED
  decision: "Do not change the committee process to satisfy or 'correct for' CJT. Document the relationship to Condorcet's jury theorem in an artifact: design goals first, CJT as motivating analogy, explicit list of deviations (no independence, no binary correct/incorrect, no literal p), and state that a CJT-compliant variant would be a different pipeline. Do not use 'correct for' in the recommendation or artifact; use 'document' / 'clarify' / 'state relationship and deviations.'"
  summary: |
    The committee recommends option (b): document and clarify, do not change process. Condorcet's jury theorem assumes independent voters and binary correct/incorrect; our process is deliberative and dependent by design. Changing the process to approximate CJT (e.g. independent generation then aggregate) would undermine stress-testing and map-making. The committee agreed to add an artifact (or section in adversarial-committees.md) that leads with design goals, introduces CJT as a motivating analogy for why multiple perspectives help, lists where we do not satisfy CJT, and states that a CJT-compliant variant would be a different pipeline — not a correction. Framing: we are not "correcting for" Condorcet; we are clarifying our relationship to the theorem so users and reviewers are not misled. All five members voted Aye.
  implementation_plan:
    - action: "Create artifact (e.g. artifacts/condorcet-jury-theorem-and-committee.md or section in artifacts/adversarial-committees.md): design goals first, CJT as analogy, list deviations, state CJT-compliant variant = different pipeline."
    - action: "Use 'document' / 'clarify' / 'state relationship and deviations' in the artifact; do not use 'correct for Condorcet.'"
    - action: "Optionally reference the artifact from the committee skill or README."
    - action: "If evidence later emerges from comparing deliberative vs. independent-aggregation pipelines, revisit."
  votes:
    Maya: "Aye (with condition: lead with design, not theorem; no 'correcting' language)"
    Frankie: "Aye"
    Joe: "Aye"
    Vic: "Aye"
    Tammy: "Aye"
  signatures:
    chair: "Committee (Cyberneutics)"
    ratified_by: "User"
---
