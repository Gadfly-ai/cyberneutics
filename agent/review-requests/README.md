# Review requests: exploratory improvements from repo reviews

This directory holds **exploratory improvement lists** produced by the **repo-review-to-improvements** script (see mvk repo `scripts/repo-review-to-improvements.py`) (or equivalent) when reviewing external repositories. Each list is then used as **context for a committee deliberation** so the Cyberneutics methodology can analyze the **quality of the technical decisions** behind those improvements.

## Workflow

1. **Generate improvements** (in the target repo, e.g. mvk or infctl-cli):
   ```bash
   python scripts/repo-review-to-improvements.py /path/to/repo -o exploratory-improvements.md --handoff /path/to/cyberneutics
   ```
   Or without handoff: write the list in the target repo, then copy it here and create a PROMPT file (see format below).

2. **Files here**
   - `/<repo-slug>-<date>.md` — The improvement list: **front matter** (repo_slug, profile, script_version, generated_at), **Repo context** section (name, purpose, stack, scan scope, profile), and **Improvements** (each with Category, Rationale, Evidence, optional Location).
   - `/<repo-slug>-<date>-PROMPT.md` — Instructions and exact `/committee` invocation; notes that the list file includes a Repo context section to scope the deliberation.

3. **Run the committee** (in this repo, in an AI session):
   - Open the corresponding `-PROMPT.md` file and follow the invocation.
   - Example: `/committee Evaluate the technical soundness and priority of these exploratory improvements for the mvk repository. The full list (with repo context) is in agent/review-requests/mvk-2026-02-28.md`

4. **Run the review** (after deliberation completes):
   - `/review agent/deliberations/<topic-slug>`
   - The review skill scores the deliberation against the five rubrics and writes the evaluation file.

## Purpose

The improvement list is **exploratory** (what could we do?), not a committed roadmap. The committee’s job is to stress-test those suggestions: are they technically sound? What’s missing? What are the trade-offs? The independent review then evaluates the quality of that deliberation (reasoning, adversarial rigor, etc.).

## Related

- Plan and script: see the **mvk** repo `docs/plan-repo-review-cyberneutics.md` and `scripts/repo-review-to-improvements.py`.
- Committee skill: `.claude/skills/committee/SKILL.md`
- Review skill: `.claude/skills/review/SKILL.md`
