---
comparison:
  topic: "Should we add a second CI job (e.g. link-check or structure check) in addition to the existing string-diagram test?"
  context: |
    The repo has one CI job (runs scripts/test_string_diagram.py). The run guide mentions optional structure checks (roster presence, deliberation dirs). No link-check or structure check exists. We are deciding whether to add a second job now.
  pipelines:
    - deliberative (committee skill)
    - cjt_style (independent vote then aggregate)
  roster: "agent/roster.md (same five characters)"
---
