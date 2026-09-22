# Fail-safe: exact session state, 2026-09-22

Written as a fail-safe, not a polished hand-off — the user is checking a Claude usage/account
situation (99% of weekly usage, resets in ~2 days) and this session may be interrupted without
warning. Everything below is real and current as of writing. No git add/commit run by this
session at any point (standing rule).

## Real git status right now

```
 M governance/roadmap/dynamic-pipeline-architecture/11-build-completion-duplicate-search-queries-fix-2026-09-20.md
 M mcp-server/agent-poc/atomic-prd-agent.ts
 M mcp-server/agent-poc/capability-fanout-prd-agent.ts
 M mcp-server/db/search.ts
?? governance/roadmap/dynamic-pipeline-architecture/40-research-agent-loop-governance-and-model-comparison-2026-09-22.md
?? governance/roadmap/dynamic-pipeline-architecture/41-build-completion-near-duplicate-detector-and-flatline-finding-2026-09-22.md
?? governance/roadmap/dynamic-pipeline-architecture/prompts/prompt-5-research-agent-loop-governance.md
?? governance/roadmap/dynamic-pipeline-architecture/prompts/prompt-6-near-duplicate-and-flatline-detection.md
?? mcp-server/test-questions/1e-dummy-prd-ios-invitations-cloudkit-firebase.md
```

Everything earlier (the cross-repo-edges build, docs 29/30/31/35/36/38/39, `41`'s prerequisite
work) is already committed (see `git log`, commits `33f73d1` and earlier) — not re-listed here.

## Thread 1: cross-repo-edges build — DONE, closed

Doc 38 (`governance/roadmap/dynamic-pipeline-architecture/38-build-plan-cross-repo-edges-four-joins-2026-09-21.md`)
is the authoritative spec + Build log. All 5 stages (0, A, B, C, D1, E) built by peer session
`level-5-engineering-knowledge-c3` and independently re-verified by this session at every stage
(re-derived numbers from raw Postgres/embedding data, not just read reports). Table went
17,195 → 17,649 `cross_repo_edges` rows. Close-out done (coverage summary, both
`graph-traversal.ts` comment updates). **Real, still-open decisions, not built, listed as
proposals P1-P10 in doc 38's Build log** — worth reading before starting new work here: A2
(export-group alias mapping), D2 (Firebase→node-iot publisher edges), the `handler→publishConfig`
intra-repo gap, hub-payload handling (§ pointer block at top of doc 38), the edges-entry-point
question, cleanup of the 153 pre-existing dangling `INTRA_REPO_CALL` edges, retiring
`CONFIRMED_PUBSUB_BINDINGS`/`REMOVED_PUSH_ROUTES`. Nothing here is blocking; this thread is
genuinely closed pending user prioritization.

## Thread 2: agent speed/quality investigation — IN PROGRESS, at a real decision point

**Sequence of real findings, all independently verified by this session, read in this order if
resuming:**

1. `11-build-completion-duplicate-search-queries-fix-2026-09-20.md`, "Note, 2026-09-21/22"
   section (bottom of file) — the original problem: a real 23.5-min/$0.9955 run
   (`output/agent-runs/prds/test/2026-09-21-005-1e-invitations-edit-baseline-prebuild-edges.md`)
   had one capability (node-iot) burn 3 turns on near-duplicate queries, coinciding with a
   Gemini `thoughtSignature` blob ballooning to ~313KB for 3 turns (real, Google-acknowledged
   bug, `google-gemini/gemini-cli#20933`).
2. **Architecture diagnosis** (conversation only, not a doc): the system is agentic *within*
   each capability but a plain sequential script *across* capabilities — no parallel dispatch,
   no shared budget, no live supervision of a stuck capability. This is real and still
   unaddressed by anything built so far; it's a separate, bigger fix than what's below.
3. `40-research-agent-loop-governance-and-model-comparison-2026-09-22.md` — real, externally
   verified research (5 of its highest-stakes citations independently re-fetched and confirmed
   this session, not just trusted). Names the deterministic-stopping-rule principle used below.
4. `prompts/prompt-6-near-duplicate-and-flatline-detection.md` → executed by peer session
   `level-5-engineering-knowledge-4a` →
   `41-build-completion-near-duplicate-detector-and-flatline-finding-2026-09-22.md`.
   **Fix 1 (near-duplicate-query detector): BUILT, independently verified twice by this
   session** — once by re-deriving its cosine-distance replay from a Python reimplementation,
   once more rigorously by extracting the real embeddings straight out of
   `postgres-queries.jsonl` and replaying the exact shipped algorithm from scratch (caught and
   the peer session fixed one real doc transcription error along the way — `nearDupCount` for
   call 15 was written as 0, should be 1; corrected in the doc, doesn't change the real
   behavior). **Fix 2 (flatline detector): NOT built** — real, honest negative result
   (literal spec never fires on the real trace; a redesign pointer using consecutive-turn
   embedding distance per arXiv 2606.27009 is left in doc 41 for a future session).
   Code changes: `mcp-server/db/search.ts` (additive `queryEmbedding` field),
   `mcp-server/agent-poc/capability-fanout-prd-agent.ts` (the detector itself),
   `mcp-server/agent-poc/atomic-prd-agent.ts` (a necessary side-fix: stripping the new
   `queryEmbedding` field before it reaches that file's own tool responses). **All three files
   are modified, uncommitted, real, and type-checked clean** (`npx tsc --noEmit`, 7 pre-existing
   unrelated errors confirmed elsewhere, zero new).
5. **Real A/B test, same question both times**
   (`mcp-server/test-questions/1e-dummy-prd-ios-invitations-cloudkit-firebase.md`, same
   persona/template/`FULL_DEBUG`/`GROUNDING_DOCS` flags, same database
   `PG_DATABASE=facts_index_prebuild` both runs, deliberately kept constant for a clean
   comparison):
   - **Run 1** (`2026-09-21-005-...`): `maxTurns=20`, no fixes. $0.9955, 23.5 min.
   - **Run 2** (`2026-09-22-001-1e-invitations-edit-fixed-maxturns10-nearduprfix`):
     `maxTurns=10`, Fix 1 active. **$0.4361, 8.1 min.** Zero near-dup blocks fired — node-iot
     wrapped up within its smaller budget before reaching the kind of repetition that caused
     the original problem, so this run confirms Fix 1 doesn't false-trigger on real work, but
     does **not** yet prove Fix 1 actually catches a live loop (it was never given the chance
     to fire this time).

## The exact point this session was interrupted at

User asked how to test that Fix 1 really fires (not just stays quiet), given the usage
constraint. Two real options were proposed, **neither run yet**:

- **Option A** (recommended first step, near-zero cost): temporarily export
  `makeCapabilityTools` from `capability-fanout-prd-agent.ts` (same pattern already used once,
  doc 11), write a throwaway script calling the real `searchFacts` closure 3x with the exact
  real trio queries ("processAccessPubSubMessage update" / "...update handler" /
  "...update implementation"), confirm the 3rd call returns `blocked: true`. Costs 3 real
  embedding calls only, no generation cost. Revert the temporary export after. Not yet run.
- **Option B** (real spend, not yet approved): a single-capability real run scoped to just
  node-iot (drop the other 3 `<!-- repo -->` blocks from a copy of the 1e question file),
  `maxTurns=20` again to give it room, watched live, killed once `blocked: true` appears in the
  trace. Rough, honest estimate ~$0.15-0.35. Not run, needs explicit go-ahead.

**Nothing has been decided between A and B.** Conversation paused here for the user to check
their account situation.

## Real resources still live, not cleaned up

- **Postgres database `facts_index_prebuild`** — a full copy of `facts_index` with the
  pre-cross-repo-edges-build `cross_repo_edges` table loaded (17,195 rows), created for the
  edges A/B comparison and reused for the Run 1/Run 2 turn-budget comparison. Still exists.
  Drop it (`DROP DATABASE facts_index_prebuild`) once no further comparison runs against the
  baseline are planned — not done automatically, needs a decision.
- **`output/backups/cross_repo_edges-2026-09-21.sql`** — the pre-build table backup, gitignored,
  still on disk. Harmless to keep.
- Peer sessions `level-5-engineering-knowledge-c3` (cross-repo-edges build) and
  `level-5-engineering-knowledge-4a` (Fix 1/Fix 2 build) both finished their assigned work and
  were last confirmed idle/done — not actively running anything as of this note.

## If resuming after the usage reset

Read this doc, then decide: (a) run Option A (cheap, quick, closes the "does the shipped code
really block" gap), (b) approve and run Option B (real spend, tests live model behavior), (c)
move to the bigger architecture question (parallel/supervised dispatch across capabilities —
diagnosed in conversation, not yet in any doc), or (d) pick up one of doc 38's P1-P10 proposals
instead. Nothing here is time-sensitive or decaying except the live Postgres resource noted
above.
