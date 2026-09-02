# P3a Task List

Real, agreed action items only — added when something is actually decided, not a running brainstorm. Struck through with a resolution note once done, matching this project's existing `tasks.md` convention elsewhere.

---

1. **Extend Phase 1's type-alias extraction to capture literal union values, the same way enum extraction already captures `members`.** Found 2026-09-01 (`03-finding-facts-are-pointers-not-payloads.md`): a real enum fact carries its full member list; a real type-alias fact (even a plain `'a' | 'b' | 'c'` string union, e.g. `OSKAccessValidity`) carries only `{name, file, line, isExported}` — no values at all. Confirmed via direct comparison of two real fact records, not assumed. This is a small, specific, scoped extraction fix, not a source-reading workaround — it would make claims like "this type has exactly these three values" fact-backed instead of requiring a source read. Not yet started.

2. **Decide: production or staging branch as this pipeline's source of truth for extraction.** Explicitly deferred 2026-09-02 (`06-scope-clarification-and-staleness-finding.md`) — not blocking the POC (see that doc's Strategic Response section for why), but a real open decision, not forgotten.
