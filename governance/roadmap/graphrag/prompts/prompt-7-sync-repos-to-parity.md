# Prompt 7 — bring all repos to a consistent, current pipeline state

Copy everything below the line into a fresh Claude Code session in this repo. Independent of prompts #5/#6 (different scope), safe to run in parallel — check `git status` first regardless, since other sessions may be active.

**Standing rule: do not run `git add` or `git commit` under any circumstances.** Leave all changes uncommitted and report back — only the user commits, always.

---

Real, current gaps found today (2026-09-11) across this project's own status audits (`governance/roadmap/consolidation/*.md`) and the ongoing `stableFactId()`/intra-repo-edges fix batch (`governance/roadmap/graphrag/`) — collected here as one real "bring everything to parity" pass before the project moves into its next real phase of work (a PRD-generation architecture redesign, unrelated to this task).

## What to actually do

1. **Confirm every onboarded repo's `extraction_runs.is_current` row genuinely reflects its latest real extraction** — query Postgres directly (`SELECT repo, run_id, extracted_at FROM extraction_runs WHERE is_current = true ORDER BY repo`), cross-check each against that repo's real, actual latest run directory under `output/runs/{repo}/`. Report any repo where these don't match — don't assume they're all current just because no one has flagged otherwise.

2. **Re-run the resolved-graph build step for the 4 currently-blocked Swift-family repos**: `swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, `swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`. A peer session (working `prompt-6-kotlin-swift-intra-repo-edges.md`) found their current extraction runs have raw AST output but no `resolved-engineering-graph.json` — the resolved-graph build step hasn't been re-run since their last rescan, so no real cross-module/same-module call resolution exists for them yet at all. Identify the real, correct script for this step yourself (check `pipeline/swift/phase-01-ast-extraction/` for the current shared-script structure — don't assume a script name or number without checking, this pipeline was restructured 2026-09-10) and run it for each of the 4. Report real before/after: did a `resolved-engineering-graph.json` get produced, and what are its real `crossModuleCallEdges`/`sameModuleResolvedCalls`/`unresolvedEligibleCalls` counts per repo? This doesn't need to load anything into `cross_repo_edges` itself — that's prompt #6's job, once these repos have current graph files to work from. Just get each repo to the point where a current graph file exists.

3. **Swift's embeddings — currently zero, across all 33,714 real facts, real known gap** (per `governance/roadmap/consolidation/swift-ios.md` §2a: facts fully synced, `embedding IS NULL` for every one — search/`walk_cluster` can't see any Swift-derived evidence at all until this runs). Before running anything:
   - Query `embedding_calls` for real historical per-fact token averages across repos already embedded (`SELECT repo, avg(total_token_count::float / NULLIF(fact_count,0)) FROM embedding_calls GROUP BY repo`) to ground your estimate in real numbers, not a guess.
   - `gemini-embedding-2` is $0.20 per million tokens on Vertex AI.
   - Compute and report the real estimated cost for embedding all 33,714 Swift facts, per repo, before running anything. This is a meaningfully larger batch than anything embedded today (the largest so far was Firebase's 1,760 facts) — say the real number plainly, then ask before running. Small or not, the point is informed consent before the spend, not avoiding it.
   - If approved, run it per-repo (matching this pipeline's existing per-module sync convention), and report the real, final cost against your estimate.

4. **Leave all changes uncommitted.** Report your real findings and numbers plainly — per the standing rule above, this session never commits.

If any of these turn out to already be done, or the real current state doesn't match what's described above, say so directly rather than assuming the gap is still open.
