# Prompt 13 findings — fact_id → surrogate key code touch-point inventory (2026-09-17)

Investigation only, per `governance/roadmap/graphrag/prompts/prompt-13-factid-surrogate-key-code-inventory.md`. Reference document: `governance/adrs/adr-010.md`. No code, schema, or pipeline/mcp-server files were modified to produce this. No git add/commit run.

---

## 1. Every place fact_id is *generated*

**Confirmed: 5 duplicated `stableFactId()`/`boundedIdComponent()` copies**, one per repo pipeline, all under `phase-01-ast-extraction/02-build-module-evidence.ts`:

| Repo | File | `boundedIdComponent()` | `stableFactId()` | `MAX_ID_COMPONENT_LENGTH` |
|---|---|---|---|---|
| android-intercom-oskey-io (Kotlin) | `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts` | line 93 | line 99 | **2000** (line 92) |
| angular-app-oskey-io | `pipeline/angular-app-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts` | line 93 | line 99 | **2000** (line 92) |
| firebase-oskey-dev | `pipeline/firebase-oskey-dev/phase-01-ast-extraction/02-build-module-evidence.ts` | line 104 | line 110 | **2000** (line 103) |
| node-iot-api-oskey-io | `pipeline/node-iot-api-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts` | line 113 | line 119 | **500** (line 112) |
| swift (shared extractor for all 4 iOS repos, see note below) | `pipeline/swift/phase-01-ast-extraction/02-build-module-evidence.ts` | line 67 | line 73 | **200** (line 66) |

**Identical vs. different — checked by diffing the actual function bodies, not assumed:**
- `boundedIdComponent()` body is **byte-identical across all 5** (truncate + `sha1` hash-suffix at 12 hex chars).
- `stableFactId()`'s return-string composition is **identical across all 5**: `` `${type}|${module}|${cleanPath}|${primaryKey}${sec}${ord}` ``. Angular/firebase/node-iot's input type additionally accepts `repo`, `line`, `sourceStart` fields that android-intercom/swift's signature omits — but none of those three extra fields are actually used in the returned string in any of the 5 copies, so this is a signature-shape difference only, not a logic difference.
- **The only real behavioral difference across the 5 copies is `MAX_ID_COMPONENT_LENGTH`**: 2000 (android-intercom, angular, firebase) vs. 500 (node-iot) vs. 200 (swift) — three distinct thresholds, not five. Comments in each file explain the threshold was sized against that repo's own worst-case combined-component length, not chosen arbitrarily.
- **Consolidation implication**: because the truncation/hashing logic itself is identical and only the threshold constant varies, a single shared generator parameterized by `maxIdComponentLength` (or repo) would faithfully replace all 5 copies with no behavior change — this is a real, low-risk consolidation opportunity, not just a nice-to-have. (Note: ADR-010 already benches this as a `build`-session decision, not decided here — see §3 of the ADR. This finding is offered as evidence for that decision, not a change.)

**Note on Swift's shared extractor**: `pipeline/ios-oskey-dev/` (found separately in `pipeline/`) contains only `phase-01-ast-extraction/00-scan-repo.ts` and `_shared/run-utils.ts` — no `02-build-module-evidence.ts`, no `stableFactId()` of its own. Per `[project_swift_kotlin_prep]` memory, Swift covers 4 real repos (`swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`, `swift-cloud-kit-oskey-dev`, `swift-ble-kit-oskey-dev`, plus `ios-oskey-dev` itself as a 5th in the live `repo` column — see §4 below) through the single shared `pipeline/swift/` extractor, confirmed by the live Postgres data in §4 showing all 5 iOS-family repo values populated from one generator. So the "5 duplicated copies" count is correct at the *pipeline-directory* level (5 top-level pipeline dirs, each with its own copy) even though it covers more than 5 real target repos.

**A second, real, less-obvious generation site — not part of ADR-010's original ~5-copy count:**

`04-build-resolved-graph.ts` exists in **all 5** pipeline dirs (`android-intercom-oskey-io`, `angular-app-oskey-io`, `firebase-oskey-dev`, `node-iot-api-oskey-io`, `swift` — confirmed via `find`), and each one **re-uses** (does not regenerate) the `stableFactId()`-produced `.id` values already assigned earlier in phase-01, threading them through as `sourceCallFactId`/`targetFactId` fields (e.g. `pipeline/angular-app-oskey-io/phase-01-ast-extraction/04-build-resolved-graph.ts:501-502`: `sourceCallFactId: call.id, targetFactId: target.id`) into an intermediate `resolved-engineering-graph.json` artifact (written at `pipeline/angular-app-oskey-io/phase-01-ast-extraction/04-build-resolved-graph.ts:884-885`, same pattern per repo). This isn't a second generator — it's a real, additional opaque-equality *consumer* of the fact_id string, one pipeline stage before Postgres, that the follow-up build session needs to know about because it's the direct input to `build-intra-repo-edges.ts` (see §2). Confirmed present with the same shape (`sourceCallFactId`/`targetFactId` fields) in android-intercom and swift's copies too, not just angular/firebase/node-iot.

---

## 2. Every place fact_id is *written to Postgres*

**Confirmed: these are separate loader scripts from §1**, all under `pipeline/facts-postgres-index/` (not the per-repo phase-01 directories):

- **`facts.fact_id`**: `pipeline/facts-postgres-index/sync-facts.ts:555-560` — multi-row `INSERT INTO facts (fact_id, repo, module, submodule, kind, file, line, symbol_name, payload, description, run_id) ... ON CONFLICT (fact_id) DO UPDATE SET ...`. Also: `sync-facts.ts:590` (`DELETE FROM facts WHERE ... NOT (fact_id = ANY($3::text[])) RETURNING fact_id` — the stale-row cleanup, matches by fact_id), `sync-facts.ts:623-624` (`SELECT fact_id, ... WHERE embedding IS NULL`), `sync-facts.ts:638` (`UPDATE facts SET embedding = $1::vector WHERE fact_id = $2`).
- **`cross_repo_edges.source_fact_id`/`target_fact_id`** — four separate INSERT sites, all in `pipeline/facts-postgres-index/`:
  - `build-cross-repo-edges.ts:213` (`HTTP_API_CALL` edges, Angular→Firebase)
  - `build-cross-repo-edges.ts:292` (`PUBSUB_TOPIC_BINDING` edges)
  - `build-intra-repo-edges.ts:343` (`INTRA_REPO_CALL` edges, run per-repo via `REPO_NAME = process.env.REPO_NAME` at `build-intra-repo-edges.ts:248` — one script, invoked once per repo, not 5 separate files)
  - `build-form-field-lineage-edges.ts:284-291` (`FIELD_BINDING` edges, hardcoded to `angular-app-oskey-io`/`firebase-oskey-dev` in the query itself, not parameterized)

All four read their `source_fact_id`/`target_fact_id` values from upstream fact_id strings already produced in §1 (either directly from `facts` table SELECTs, or — for `build-intra-repo-edges.ts` specifically — from the `resolved-engineering-graph.json` intermediate described in §1's second finding).

---

## 3. Every place fact_id is *read, compared, or passed as a tool argument* in `mcp-server/`

Confirmed and expanded on ADR-010's list. Classification: **(a)** opaque equality/lookup, safe to swap with no logic change; **(b)** display/citation use, unaffected by this ADR; **(c)** doesn't fit cleanly, flagged.

### `mcp-server/db/search.ts`
- Line 113/116: `SELECT fact_id, repo, module, kind, symbol_name, description, embedding <-> $1::vector AS distance FROM facts ...` — **(a)**.
- Line 125: `factId: row.fact_id` mapped into `SearchResult` — **(a)**.

### `mcp-server/db/graph-traversal.ts`
- Line 71: `[Fail-Closed] Anchor fact_id '${anchorFactId}' has no assigned number` — **(a)**, error message interpolates the string but the check itself is a Map lookup by identity.
- Lines 84-88, 194-198: `SELECT fact_id, ... FROM facts WHERE fact_id = ANY($1::text[])` — **(a)**.
- Line 91, 201: `[Fail-Closed] Graph edge(s) reference fact_id(s) not found in facts` — **(a)**.
- Lines 217-226 (`findGraphNeighbors`): `SELECT ... target_fact_id as other_fact_id ... WHERE source_fact_id = $1 ...` (and the incoming-direction mirror) — **(a)**.

### `mcp-server/agent-poc/validators.ts`
- `extractRealFactIds()` (line 18) — builds the real-fact_id set from tool-result shapes (`SearchResult.factId`, `GraphNeighborFact.factId`, `ClusterMember.factId`/`ClusterEdge.sourceFactId`+`targetFactId`) — **(a)**.
- `normalizeFactId()` (line 64) — whitespace-collapse canonicalization from the prompt-12 fix (real incident #2 in ADR-010 §1b) — **(a)**, this is exactly the kind of instability-tolerance logic that becomes unnecessary once fact_id is no longer the join key; worth flagging to the build session as something that may become simplifiable, not just swappable.
- `checkFabrication()` (line 105) — compares cited ids against `realFactIds`/`normalizedRealFactIds` — **(a)**.
- `checkTemplateConformance()` (line 165) — no fact_id involvement, listed by the earlier function grep but irrelevant here.

### `mcp-server/agent-poc/atomic-prd-agent.ts`
- Line 135, 174, 176: `seenFactIds` dedup set (`Set<string>`), `alreadyRetrieved: seenFactIds.has(r.factId)` — **(a)**.
- Lines 185-196 (`get_graph_neighbors` tool def): `factIds` input array passed straight to `expandWithGraphNeighbors` — **(a)**, this is the exact tool-call-argument path ADR-010 §2 identifies as the real fix target for the transcription-drift bug (case 2a).
- Line 207 (`walk_cluster` tool description) — **(b)**, descriptive text only.
- Line 246: `SELECT DISTINCT repo FROM facts WHERE fact_id = ANY($1::text[])` — **(a)**.
- Line 276-278 (`factRepoMap` build): `SELECT fact_id, repo FROM facts WHERE fact_id = ANY($1::text[])` — **(a)**.
- Line 364: `for (const id of item.evidenceIds)` — **(a)** for the fail-closed repo-lookup at line 453 (`factRepoMap incomplete`); the *value itself* stored in `evidenceIds` remains the citation text — see line 439/468 below.
- **Line 439, 468** (Evidence Used/Audit Trail appendix rendering, confirmed at the exact lines ADR-010 cites): `` `- <a id="evidence-${n}"></a>[**#${n}**](#cite-${n}) \`${id}\` [↩](#cite-${n})` `` and `` `- <a id="evidence-${n}"></a>**#${n}** \`${id}\`` `` — **(b)**, explicitly out of scope per ADR-010 §3. Verified these are the only two raw-fact_id-rendering sites in this file.
- **Lines 756, 760, 762-765** (fabrication near-miss diagnostic) — confirmed at the exact lines ADR-010 cites. Line 762: `const suffix = id.split("|").slice(-2).join("|");` and line 763: `const nearMiss = [...realFactIds].filter(r => r.split("|").slice(-2).join("|") === suffix);` — **(c), flagged**: this is the one real site that parses fact_id's internal pipe-delimited structure, confirmed. It's diagnostic-only (console output, not a data-path or validator decision), but it will need either (i) a genuine replacement that still finds "near misses" using the new opaque key plus the retained display text, or (ii) an explicit decision to drop this diagnostic, because a short opaque hash has no internal `|`-delimited structure to split on. Not safe to auto-swap; needs a real design call in the build session.
- Line 771: summary log line, string interpolation only — **(b)**.

### `mcp-server/agent-poc/capability-fanout-prd-agent.ts`
- Lines 85, 91, 103, 105, 210-211: per-capability `seenFactIds` dedup set (own instance per `makeCapabilityTools()` call, not shared with the one-hit agent's set) — **(a)**.
- Lines 114-125 (`get_graph_neighbors` tool def, per-capability) — **(a)**, same tool-argument path as atomic-prd-agent.ts.
- Line 136 (`walk_cluster` description) — **(b)**.
- Line 282, 286 (`evidenceIds` dedup key construction: `` `${item.claim.trim()}::${[...item.evidenceIds].sort().join(",")}` ``) — **(a)**, sorts/joins the id strings for a dedup key; behavior-preserving under a swap since it only needs stable equality, not the specific string shape.
- Line 414: summary log line — **(b)**.
- **No near-miss diagnostic equivalent to atomic-prd-agent.ts:762-763 exists in this file** — it relies on the shared `validators.ts` functions only. Confirmed by grep; not an omission on my part.

### `mcp-server/src/index.ts` (tool schemas)
- Line 22: `search_facts` tool description text — **(b)**.
- Line 31-38 (`get_graph_neighbors`): `inputSchema: z.object({ factIds: z.array(z.string()) })` — **(a)**, this is the actual Zod schema the model's tool call is validated against; the type itself (`string[]`) doesn't need to change for a short opaque id, but this is the concrete site where a "reference" type/format could be tightened later if desired.
- Line 48 (`walk_cluster` description, `anchorFactId: z.string()` inferred from the earlier grep at line 31 area) — **(a)** for the schema, **(b)** for the description text.

### A real site not in ADR-010's original mcp-server list, found here:
**`mcp-server/agent-poc/section-content.ts`** — `renderSectionContent()`/`renderCitations()` (lines 60, 75-77) take a `citationNumberOf?: (factId: string) => number` callback and render `(see #N)` links, falling back to raw `evidenceIds.join(", ")` when no lookup is given — **(b)**, pure display, consistent with ADR-010 §1d's "main body never shows a raw fact_id" claim (this is the renderer that makes that true). Not a location needing a code change for this ADR, but should be named explicitly in the build-session's file list since it's the renderer ADR-010 §1d references without a file:line.

---

## 4. Existing repo pgVector data — real backfill scope

Queried live against the running `facts-postgres-index-local` Postgres container (`docker exec facts-postgres-index-local psql -U facts_index -d facts_index`), not estimated:

**`facts` table — 68,902 rows total** (matches ADR-010 §1c's corpus-wide figure exactly):

| repo | count |
|---|---|
| ios-oskey-dev | 25,458 |
| firebase-oskey-dev | 15,259 |
| android-intercom-oskey-io | 9,750 |
| angular-app-oskey-io | 8,747 |
| swift-cloud-kit-oskey-dev | 2,488 |
| swift-webrtc-kit-oskey-io | 2,487 |
| swift-ui-kit-oskey-dev | 2,482 |
| node-iot-api-oskey-io | 1,432 |
| swift-ble-kit-oskey-dev | 799 |

**`cross_repo_edges` table — 17,195 rows total**, by `source_repo`:

| source_repo | count |
|---|---|
| ios-oskey-dev | 8,734 |
| android-intercom-oskey-io | 3,590 |
| firebase-oskey-dev | 2,377 |
| swift-webrtc-kit-oskey-io | 651 |
| swift-ui-kit-oskey-dev | 625 |
| swift-cloud-kit-oskey-dev | 510 |
| angular-app-oskey-io | 461 |
| swift-ble-kit-oskey-dev | 245 |
| node-iot-api-oskey-io | 2 |

**Backfill scope, stated plainly**: a one-time script computing the new surrogate (per ADR-010, likely a content hash) for every existing row would need to touch **68,902 `facts` rows + 17,195 `cross_repo_edges` rows = 86,097 rows total**. This is a single-pass, deterministic computation over existing `fact_id` text (no re-extraction needed) — real but not large by the standards of what `sync-facts.ts` already does in normal operation (it already batches 500 rows/INSERT per `CHUNK_SIZE` at `sync-facts.ts:25`). Not a script — just the real scope number, as instructed.

---

## 5. Anything else genuinely touching fact_id, found while looking (scoped to `pipeline/` and `mcp-server/` only)

### A real, load-bearing finding: `mcp-server/db/` is a deliberate, undocumented-outside-comments **fork** of `pipeline/facts-postgres-index/_shared/`, not an import — both copies need the surrogate-key swap independently

Confirmed by diffing directly (not assumed): `pipeline/facts-postgres-index/_shared/graph-traversal.ts` and `pipeline/facts-postgres-index/_shared/search.ts` are near-duplicates of `mcp-server/db/graph-traversal.ts` and `mcp-server/db/search.ts` respectively. A comment at the top of the `mcp-server/db/` versions confirms this is intentional:

> "Deliberate fork of pipeline/facts-postgres-index/_shared/graph-traversal.ts, not an import, as of the 2026-09-07 mcp-server/ repo-root move (`governance/roadmap/mcp-direction/21-task1-mcp-server-repo-root-move-2026-09-07.md`) ... not kept in sync automatically with the pipeline's copy."

This means **§3's `mcp-server/db/*.ts` fact_id sites have a second, real, separately-maintained twin** that ADR-010 did not enumerate (ADR-010 §1d only lists the `mcp-server/` consumers):

- `pipeline/facts-postgres-index/_shared/graph-traversal.ts` — same `fact_id = ANY(...)` / `source_fact_id`/`target_fact_id` opaque-lookup pattern as `mcp-server/db/graph-traversal.ts` (lines 64-94, 167-194) — **(a)**.
- `pipeline/facts-postgres-index/_shared/search.ts` — same `SELECT fact_id, ...` pattern as `mcp-server/db/search.ts` — **(a)**.
- `pipeline/facts-postgres-index/_shared/render-evidence.ts:58,73` — `` `${...} \`${r.factId}\`` `` / `` `${...} \`${n.factId}\`` `` raw-string rendering — **(b)**, this pipeline copy's equivalent of `atomic-prd-agent.ts`'s appendix rendering; has no `mcp-server/` equivalent (`section-content.ts` covers that role there instead).

**Real, unresolved ambiguity — flagging explicitly, not guessing**: this `pipeline/facts-postgres-index/generate-atomic-prd.ts` + its `_shared/` support files (`graph-traversal.ts`, `search.ts`, `render-evidence.ts`, `technical-proposal.ts`, `assemble-prd.ts`) were **all last modified 2026-09-07** — the day of the fork — while `mcp-server/agent-poc/atomic-prd-agent.ts` has been actively modified through **2026-09-17** (today). This strongly suggests `generate-atomic-prd.ts` is the frozen, pre-fork predecessor CLI script to `atomic-prd-agent.ts`, not a currently-run tool — but I did not find a README or comment explicitly declaring it deprecated, and it is real, present, importable code in `pipeline/facts-postgres-index/` (in scope per the prompt's directory boundary). **The build session needs to decide**: does this frozen copy get the surrogate-key swap too (if it might still be invoked), or is it explicitly out of scope as dead code? I'm flagging this rather than assuming either answer.

### Older, likely-superseded per-repo phase-02 synthesis pipeline — also genuinely touches fact_id, also flagged as ambiguous scope

A separate, older layer exists per-repo under `phase-02-inter-module-synthesis/_shared/` (confirmed present for angular, firebase, node-iot — not android-intercom or swift, which have no `phase-02` directory at all):

- `citation-validator.ts` (angular/firebase/node-iot) — parses `FACT_ID_PATTERN` out of free text (`factIdPattern.exec(text)`, e.g. `angular-app-oskey-io/.../citation-validator.ts:100-102`), builds a `factIdSet` from `facts.map(f => f.id)`, and at line ~190 does `citation.factId!.split("|")` — this is a **second, independent site that parses fact_id's internal `|`-delimited structure**, beyond the one ADR-010 confirmed (`atomic-prd-agent.ts:762-763`). This one is **(c), flagged** for the same reason.
- `capability-synthesis.ts`, `provenance-sidecar.ts` (angular/firebase/node-iot) — consume/pass through `factId` fields, mostly **(a)**/**(b)** display use.
- `pipeline/angular-app-oskey-io/phase-01-ast-extraction/_shared/run-utils.ts` (and its firebase/node-iot equivalents) — `FACT_ID_CITATION_BLOCK_PATTERN` regex for parsing `` `fact-id::...` `` markdown citation blocks out of generated doc text — **(b)**-ish, older citation-formatting concern.

**Why flagged as ambiguous rather than just listed**: `citation-validator.ts`'s last real commit (`git log`) is **2026-08-31**, well before `sync-facts.ts` (2026-09-11) and `mcp-server/` (through 2026-09-17). Per existing project memory (`[project_workflow_clustering_and_angular_ux]`: "SUPERSEDED by ADR-007... Task 1/3"), this per-repo phase-02 synthesis approach appears to be the pre-ADR-007 architecture that the MCP + agent-persona pivot replaced. `pipeline/README.md`'s own documented directory tree (`phase-00-repo-scanner/`, `phase-03-ecosystem-topology/`, `phase-05-atomic-prd-impact/`) doesn't even match what's actually on disk today, reinforcing that this README and the phase-02 layer it describes are stale. I'm listing these files because they are real and genuinely touch fact_id and are under `pipeline/` (in scope per the prompt), but **whether the build session needs to touch them at all is a real open question**, not something I resolved here — they may be dead code from an already-superseded architecture rather than a live touch point.

### Test fixtures / gold-set files

- `mcp-server/gold/evals/1a-ownernonresident.eval.json`, `2a-resident-departure.eval.json` — each contain 1 literal fact_id reference (real hardcoded strings used as eval assertions). `3-intercom-home-button.eval.json` has none.
- `mcp-server/gold/debug-logs/*.jsonl` (4 files) — raw tool-call/response logs from real past test runs, contain many literal fact_id strings (6-40 occurrences each) as recorded data, not code. These are historical debug artifacts, not something the build session edits, but worth naming since they'll visually "look wrong" (still showing the old natural-key format) after the swap — not a functional concern, just noted per the prompt's "anything else" instruction.
- `mcp-server/skills/prd/skill.md`, `skill.v2.md`, `skill.v3.md`, and `mcp-server/skills/experiments/technical-proposal-only-low-freedom/skill.md` — **prompt text instructing the model**, not code, but genuinely load-bearing: these are the actual system-prompt-equivalent instructions telling the model to "copy the real `factId` field itself, verbatim" and to cite "the real `fact_id`(s)... taken verbatim." Per `[project_atomic_prd_skills_file_iterative]`, `skill.v3.md` is the currently-active persona. **This is a real, necessary build-session touch point that the ADR's code-only framing could miss**: once tool calls accept a short opaque reference instead of the long natural key (ADR-010 §2's "primary real benefit"), these skill files' explicit verbatim-copying instructions need to be rewritten to match the new short-reference argument shape, or the model will keep trying to verbatim-copy the wrong thing (the display-only `fact_id` text) into tool arguments. Not a code file, but should not be missed.
- `mcp-server/README.md:12` — one descriptive line, **(b)**, no change needed beyond consistency.

### Schema documentation

- `pipeline/facts-postgres-index/schema-proposal.sql:38,124,127,140-141` — the column/index comments and definitions ADR-010 §1d already describes accurately (confirmed by reading directly): `fact_id text PRIMARY KEY`, `source_fact_id`/`target_fact_id` columns with real, dated rationale comments, and the two btree index definitions. This file is the living schema documentation/DDL source the build session will need to edit directly (add the new column, re-point the 3 indexes) — not new information beyond ADR-010, but confirmed as the real file:line location.

---

## Summary for the build session

- **§1**: 5 real generator copies (identical logic, 3 distinct thresholds: 2000/500/200) — real consolidation opportunity, not decided here. Plus a real second consumer site (`04-build-resolved-graph.ts`, all 5 repos) feeding the fact_id through an intermediate JSON before Postgres.
- **§2**: 5 real Postgres write sites, all in `pipeline/facts-postgres-index/`, separate from the generators.
- **§3**: ADR-010's `mcp-server/` list confirmed accurate and expanded with `section-content.ts` (display-only). One real **(c)**-flagged site confirmed (`atomic-prd-agent.ts:762-763`).
- **§4**: 68,902 `facts` rows + 17,195 `cross_repo_edges` rows = 86,097 total rows needing a computed surrogate, real live numbers.
- **§5**: Two real, load-bearing findings beyond ADR-010's original scope — (1) `pipeline/facts-postgres-index/_shared/` is an independently-maintained fork of `mcp-server/db/`, doubling several §3 touch points, with a genuine open question about whether the frozen `generate-atomic-prd.ts` CLI predecessor needs the swap too; (2) a second **(c)**-flagged internal-structure-parsing site in the (likely-superseded, unconfirmed) phase-02 `citation-validator.ts` files; (3) the skill prompt files (`skill.v3.md` etc.) need real rewriting, not just code — they explicitly instruct verbatim fact_id copying into tool arguments, which is the exact behavior ADR-010 is trying to eliminate.

No migration/build plan proposed here, per the prompt's instruction — this is inventory only.
