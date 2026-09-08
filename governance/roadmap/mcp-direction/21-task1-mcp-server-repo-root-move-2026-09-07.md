# Task 1 — `mcp-server/` moved to repo root — 2026-09-07

Real build work, done this session, per Task 1 of `20-session-handoff-repo-restructure-and-kotlin-onboarding-2026-09-07.md`. A peer session ran Task 2 (new `android-intercom-oskey-io` repo onboarding) concurrently; confirmed via cross-session message it stayed out of `mcp-server/` and `_shared/` entirely — no file collision, and no concrete answer yet on how a future Kotlin-side pipeline would call into search/graph-traversal (that peer's own assessment: too early, still in P1 extraction investigation, likely a later session's question).

## The real design question, and how it was actually resolved

The deferred question (source: `08-sectioncontent-architecture-discussion-2026-09-06.md`, "Repo-split question") was framed as: does `mcp-server/` get its own direct DB access (duplicating `_shared/search.ts`/`graph-traversal.ts` logic), or does the shared code become an installable package?

Before deciding, checked the real coupling directly rather than assuming: `_shared/search.ts` + `_shared/graph-traversal.ts` (plus their one dependency, `_shared/embedding-adapter.ts`) were consumed by four real call sites — `_shared/render-evidence.ts`, `generate-atomic-prd.ts`, and both files now under `mcp-server/`. Transitive dependency closure was small and clean (`pg`, `@google/genai`, both already root deps). The repo has no workspaces or per-folder `package.json` anywhere — a literal installable npm package would have been new tooling with no existing precedent here.

Presented the user a real three-way choice (top-level shared folder / real npm workspace package / mcp-server owns a direct copy). **User's decision, with real rationale**: mcp-server owns a direct copy. Reason given: a real chance these two systems end up deployed/triggered separately — the pipeline runs on merge-to-prod/staging for AST extraction; `mcp-server` just serves tool calls, a different job. Deliberately choosing duplication over a shared-import boundary now, to avoid an artificial coupling between two systems expected to diverge in deployment topology.

## What actually moved

- `pipeline/facts-postgres-index/mcp-server/` → `mcp-server/` (repo root), via `git mv` (history preserved).
- New `mcp-server/db/` holds standalone copies of `search.ts`, `graph-traversal.ts`, `embedding-adapter.ts` (copied, not imported, from `pipeline/facts-postgres-index/_shared/`). Each copy carries a header comment stating it's a deliberate fork, why, and to check the other copy when fixing a bug in either — real risk now: the two copies will not stay in sync automatically.
- `mcp-server/src/index.ts` and `mcp-server/agent-poc/atomic-prd-agent.ts`: `../../_shared/search` / `../../_shared/graph-traversal` imports repointed to `../db/search` / `../db/graph-traversal`.
- `atomic-prd-agent.ts`'s `DEFAULT_TEMPLATE_PATH` hardcoded path fixed (`pipeline/facts-postgres-index/mcp-server/agent-poc/templates/...` → `mcp-server/agent-poc/templates/...`).
- Root `tsconfig.json`'s `include` was scoped to `pipeline/**/*.ts` only — a root-level `mcp-server/` would have silently fallen out of type-checking. Added `mcp-server/**/*.ts`.
- `mcp-server/README.md` updated to describe the new location, the ownership decision, and the local dev run command's new path.
- `mcp-server/config/` (self-contained Vertex AI config) was untouched — already built last session anticipating exactly this kind of split; no changes needed.

## Real verification performed (not just "ran without error")

- `npx tsc --noEmit -p tsconfig.json` across the whole repo: exit 0, no errors, after the move.
- Confirmed no remaining `_shared` *imports* anywhere under `mcp-server/` (only explanatory comments referencing the old path by name).
- Real runtime smoke test against the actual local Postgres (`facts-postgres-index-local` container, already running): booted `node -r ts-node/register mcp-server/src/index.ts` with stdin held open (a naive `/dev/null` stdin caused an immediate, expected EOF-triggered clean exit — not a bug, just how a stdio MCP transport behaves with no input stream). Confirmed the process stayed alive for 3+ seconds with zero stderr output — the relocated tool wiring (`search_facts`, `get_graph_neighbors`, `walk_cluster` → `db/search.ts` / `db/graph-traversal.ts`) resolves and starts correctly post-move.

## What was deliberately NOT touched

- `governance/adrs/adr-007.md`, `01-mcp-tool-server-tasklist.md`, `02-session-handoff-2026-09-06.md`, `04-step1-2-mcp-server-built-and-verified-2026-09-06.md`, `10-sectioncontent-implementation-tasklist.md` — all still say `pipeline/facts-postgres-index/mcp-server/`. Per this project's own documentation discipline (mark superseded, don't rewrite history), these are left as accurate records of what was true when written. ADR-007 gets a short superseded-path pointer to this file (see its own note), not a rewrite.
- `mcp-server/agent-poc/atomic-prd-agent.ts`'s `DEFAULT_PERSONA_PATH` (still points at `atomic-prd-agent-persona.md`, the known-broken original persona per `19-...md`/`20-...md` open item 1) — out of scope for this task, already tracked separately.
- The peer's Task 2 work (`governance/roadmap/android-intercom-oskey-io/`) — not read or touched.

## Real open risk this decision creates

The two copies of `search.ts`/`graph-traversal.ts`/`embedding-adapter.ts` (`pipeline/facts-postgres-index/_shared/` and `mcp-server/db/`) will drift silently — nothing enforces parity. Each file's header comment says to check the other copy on a bug fix, but that's a prompt-level reminder, not a code-level guarantee, matching this project's own repeated finding elsewhere that prompt-only rules are best-effort. Not fixed now — flagging honestly as a real, accepted cost of the deployment-independence decision above, not an oversight.
