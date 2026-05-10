# Committee prompt: technical review of exploratory improvements

Use this when running the Cyberneutics committee skill on the improvement list for **mvk**.

The improvement list file includes a **Repo context** section (name, purpose, stack, scan scope, profile). Use it to scope your deliberation—e.g. whether an improvement is in scope for this repo type.

## Invocation

In the Cyberneutics repo, run:

```
/committee Evaluate the technical soundness and priority of these exploratory improvements for the mvk repository. Consider trade-offs, missing alternatives, and whether each improvement is well-justified. The full list (with repo context) is in this file: agent/review-requests/mvk-2026-02-28.md
```

Then, after the deliberation completes, run:

```
/review agent/deliberations/<topic-slug>
```

Replace `<topic-slug>` with the directory name created under `agent/deliberations/` (e.g. `exploratory-improvements-mvk-2026-02-28` or similar).

## Improvement list location

- **File:** `agent/review-requests/mvk-2026-02-28.md`
