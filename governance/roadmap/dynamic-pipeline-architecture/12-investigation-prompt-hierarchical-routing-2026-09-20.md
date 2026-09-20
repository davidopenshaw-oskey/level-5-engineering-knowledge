# Investigation prompt: hierarchical (fact→repo→cross-repo) routing — not yet run

Hand-off prompt for a new session, drafted 2026-09-20. Not yet dispatched/run as of writing
this file. Persisted here per this project's own discipline (write real findings/hand-offs
to files as they happen, not just chat scrollback) rather than left only in conversation.

---

Investigate whether real, hierarchical, aggregated data already exists in this pipeline
(fact -> intra-module -> inter-module -> repo -> cross-repo) that could serve as a
top-down first pass for query-time routing, or whether that infrastructure would need to
be built new. INVESTIGATE ONLY — no building, no fixing, no LLM calls (this whole
investigation should be free: reading pipeline code + direct read-only Postgres queries,
zero embedding/generation calls needed). Never git add/commit unless explicitly asked.

## Real context (don't re-derive)

The P1/P2 pipeline was originally designed around a fold/collapse aggregation model going
UP a hierarchy: individual fact -> intra-module -> inter-module -> repo -> cross-repo
architecture. Three repos have a real `phase-02-inter-module-synthesis` pipeline stage on
disk today: `pipeline/{firebase-oskey-dev,angular-app-oskey-io,node-iot-api-oskey-io}/
phase-02-inter-module-synthesis/` (confirmed present via `find`; `package.json` has matching
`synthesize:firebase`/`synthesize:angular`/`synthesize:node-iot` scripts calling each
repo's own `03-run-full-phase2.ts`). No Swift/Kotlin/iOS/Android repo has this folder at
all — so even if phase-02's output turns out to be real and usable, it structurally cannot
cover the iOS/Android side of the original motivating gap; that's a real, separate scope
boundary, not something this phase-02 investigation can resolve on its own.

Separately, project memory (this session's own auto-memory, may be stale — re-verify, don't
trust as-is) records: "Phase-02 reports: preserved, then decommissioned — SUPERSEDED
2026-09-18: DeepWiki-style docs need the agentic capability-fanout architecture, not
phase-02 — all 3 phase-02 folders being decommissioned." Confirm directly whether this is
still accurate (check for `decommissioned_`-prefixed files, this project's own real naming
convention for marking superseded code — e.g.
`pipeline/facts-postgres-index/decommissioned_generate-atomic-prd.ts` is a real precedent)
or whether phase-02 is still live/intact.

## The real problem this would address

Confirmed today, not hypothetical: `capability-fanout-prd-agent.ts`'s `routeCapabilities()`
(`mcp-server/agent-poc/capability-fanout-prd-agent.ts`) does ONE flat, unfiltered vector
search across all individual facts, groups results by module post-hoc, and takes a fixed
top-N (`CAPABILITY_MAX_CAPABILITIES`, default 5). This was confirmed today to silently miss
genuinely relevant repos for a real cross-repo/landscape business request
(`mcp-server/test-questions/1b-adding-a-owner-non-resident-type.md`) — iOS never entered
candidacy at all, even after the request text was rewritten to explicitly name iOS and
Android Intercom as in-scope platforms. The proposed direction: query-time routing should
mirror the extraction-time hierarchy top-down (repo/cross-repo level first, narrowing
through inter-module, intra-module, then the existing fact-level capability-fanout
mechanism) rather than inferring repo/module relevance as a side effect of flat fact-level
noise.

## What to investigate

1. Read phase-02-inter-module-synthesis's actual code for at least one repo (suggest
   `firebase-oskey-dev`, since it's the most-referenced in this project's own history) —
   what does it actually compute? Does it produce real per-module or per-repo SUMMARY
   documents (not just re-packaged individual facts)? Does it compute/store its OWN
   embeddings for those summaries, separate from individual fact embeddings?

2. Query Postgres directly to check what's actually persisted, not just what the pipeline
   code claims to produce:
   - `SELECT DISTINCT kind FROM facts` — does the real, current taxonomy include anything
     that looks like an aggregate/summary type, distinct from raw code-fact kinds like
     `model_property`/`call_expression`/`enum_declaration`/etc.?
   - Check `information_schema.tables` for any OTHER real table beyond `facts` and
     `cross_repo_edges` that might hold module/repo-level summaries.
   - For any candidate summary rows/tables found: do they have real, non-null `embedding`
     values (i.e. actually queryable via the same vector-search mechanism `search.ts`
     already uses), or only narrative text with no embedding at all?
   - If real summary data exists: check freshness (timestamps/run IDs vs. the underlying
     facts' own extraction dates) and completeness (present for all 3 phase-02 repos, or
     partial?).

3. Report clearly, with real numbers/evidence, which of these is actually true:
   - (a) real, embedded, queryable repo/module-level summaries already exist and could be
     reused directly as a first-pass routing signal with minimal new work;
   - (b) phase-02 computes real summaries but never embeds/persists them as queryable
     data — real but incomplete infrastructure, needs an embedding step added;
   - (c) phase-02 is genuinely decommissioned/stale and this needs real new aggregation
     infrastructure built from scratch for however many repos would need it.

4. If (a) or (b): estimate what a first, real routing preview against this data would
   actually look like (same "free, Postgres-only, one small embedding call" shape the other
   session already used to preview 1b's routing) — don't build it, just scope it concretely
   enough that a future decide-stage doc could commit to trying it.

5. Real, honest, separate question worth surfacing either way: if this hierarchy needs to
   be built or maintained ongoing, what's the real freshness/maintenance burden given this
   project's pipeline re-triggers on every merge to prod (dynamic, not one-off) — does a
   repo/module-level summary need regenerating on every single fact-level change, and if
   so, is that a real, bounded cost or an open-ended one?

Write findings to a new doc:
`governance/roadmap/dynamic-pipeline-architecture/13-findings-hierarchical-routing-investigation-2026-09-20.md`
(or the next real available number if others have landed since this prompt was written).
Investigate/decide/build stay separate sessions, same discipline as docs 06-11 — this is
investigate only.
