# Session hand-off: round 2 coordinator (2026-10-01)

**For:** a fresh coordinator/validator session taking over this initiative after round 1 (Swift member resolution, W6 for Swift and node-iot, `PACKAGE_METHOD_CALL`, D1 descriptions). Written by the round-1 coordinator at a phase boundary, before context compaction became a risk. Everything authoritative is in files; this note points at them.

## Read, in this order

1. `01-build-spec-2026-10-01.md`: the spec (§1 acceptance, §2 contract, **§2a is superseded**, see the Build log), §4 write protocol, then the **whole Build log**. It's the record of every decision, with the user's answers, and why.
2. `00-findings-and-plan-2026-10-01.md` §8: the open follow-ups (round 2's backlog).
3. `governance/roadmap/dynamic-pipeline-architecture/43-...md`: "Live-DB safeguards" and "Lane model and DB write protocol" (adopted by our §4). Also its W6 entries: the precedent for same-repo edges.
4. Memories: `project_call_resolution_same_repo_edges.md`, `feedback_coordinator_lanes_for_large_changes.md`.

## Live state at hand-off

- Facts 69,643; edges 22,058; 30 edge slices. Round-1 baseline: `01-baseline-before-2026-10-01.json` (19,816 edges, 23 slices). **Take a new baseline before round 2's first write** (same query shape; see "Validation toolkit" below).
- Swift current runs: cloud `20261001_201038`, ui `…201043`, ble `…201047`, webrtc `…201051`, ios `…201113` (ios `master` = `e660bda2`).
- **D1 done:** 2,308 Swift call descriptions now carry `-- calls method: <Class>.<method>[ in <repo>]` (83 with a protocol note); the legacy `-- resolves to:` was dropped on the 148 flat-name collisions only; 217,601 tokens ≈ $0.044. Live: 69,643 facts, 0 unembedded, 22,058 edges, 30 slices.
- Lanes: **Lane S released** (done). **Lane E released after D1.** Neither is reused in round 2 (user decision: fresh sessions).
- **Uncommitted (the user commits):** Lane S `main.swift`, `01-extract-ast-evidence.ts`, `_shared/member-resolution.ts`; Lane E `build-cross-repo-edges.ts`, `sync-facts.ts`, `config/repos.json`; coordinator `pipeline/README.md`, this folder, `consolidation/swift-ios.md`, two `downstream-app-feedback/2026-10-01-*` notes (neither sent yet, as far as this session knows).

## Round 2 backlog (from `00` §8; the user decides the order)

| Item | Kind | Suggested lane | Notes |
|---|---|---|---|
| **Kotlin (android-intercom)**: same root-only resolution gap, 3,716 target-less `INTRA_REPO_CALL` edges, 656 resolved in-repo calls | build | new **Lane K** (owns `pipeline/android-intercom-oskey-io/**`) | Reuse the Swift contract **as amended** (`member*` fields, legacy frozen). The resolver is string-split (`01-extract-ast-evidence.ts:468-497`, `pkg.Name` table), so start with an S1-style investigate-and-confirm. Edges then need W6 to discover Kotlin repos via `member*` (already does, as long as the fields match) |
| **Method → calls-in-its-body link**: a walk reaches a method's declaration but can't step to the calls inside it (e.g. `userSendInvitation :26` → the `HTTP_API_CALL` at `:37`) | design → build | new edges lane, or a traversal change | Affects every repo, including Firebase trigger handlers. Derivable from `callerMember`/`callerFunction` + `callerClass` + file (Swift) and `callerName`/`callerStartLine` (TS). Decide: a derived edge type vs a traversal-side containment step |
| **Traversal hubs** (`OSKUIExpanded`: 85 PSU + 79 PMC incoming) | investigate first | new session, investigate mode | `mcp-server/db/graph-traversal.ts:178-183` anticipates "include the hub with its count, don't expand". Needs a before/after real agent run: **LLM spend, flag first** |
| **node-iot import-alias fix**: 6 calls point at their own import line, 5 of them real functions | build, small | new small lane (owns `pipeline/node-iot-api-oskey-io/**`) | Same fix Lane B made for Firebase (doc 43 W1, `aliasedDeclaration*`). Then W6 node-iot rises from 74 to about 79 |

Item 2 overlaps with the hubs work (both are about how walks move), so consider designing them together.

## Traps that cost real time in round 1 (don't relearn them)

- **`fact_ref` = `sha1(fact_id)`, Postgres-generated** on `facts` and on both ends of `cross_repo_edges`. Never change `stableFactId()` inputs. For Swift that means `calleeExpression`, `callerFunction`, `callerClass` (put new caller info in `callerMember`, as Lane S did).
- **Some Swift `fact_id`s contain newlines.** Never compare raw `fact_id`s through a line-based export; compare `fact_ref`s (in files: `sha1(pack id)`). The round-1 coordinator's first gate check was wrong because of this.
- **Legacy call fields are read by three consumers** (`PACKAGE_SYMBOL_USE` `:821`, the Swift step 04 resolved graph, `descriptionFor`'s `-- resolves to:`). Changing them breaks existing slices and costs embeddings. That's why `member*` exists.
- **The W6 hub fence** is `exp(Q3 + 3·IQR)` of log fan-in. With IQR = 0 it degenerates to 1; the pooled fallback (option B) handles that. Expect it on small repos.
- **`edge_sync_state` has no `status` column** (STALE/ok is computed by `build-edges.ts`); per-slice md5 over `cross_repo_edges` is the real check.
- **Lanes sometimes run ahead of a pending decision** (Lane S posted READY TO SYNC before the protocol-flag decision arrived). Grant write turns only against the latest re-posted gate.

## Validation toolkit (what the round-1 coordinator actually ran)

- Per-slice md5: `md5(string_agg(concat_ws('|', source_fact_ref, target_fact_ref, source_symbol, target_symbol, target_repo, resolution_status, provenance, confirmed_via, details, attributes::text), E'\n' ORDER BY source_fact_ref, target_fact_ref, source_symbol, target_symbol, details))` grouped by `(connection_type, source_repo)`, compared against the baseline JSON.
- `fact_ref`-set md5 per repo: `md5(string_agg(fact_ref, ',' ORDER BY fact_ref))`.
- Held-run gate, independently: sha1 of every capability-pack `facts[].id` vs live `fact_ref`, per (repo, module).
- Dangling: edges whose `source_fact_id`/`target_fact_id` are not in `facts` (slow, ~2 min; run it in the background).
- Always reproduce a lane's key numbers with your own SQL before recommending a grant; quote both.

## How the user likes this run

The coordinator validates independently and brings each decision to the user with a recommendation and its trade-off, plainly explained (the user is a PM: no unexplained jargon). Lanes get decisions relayed via `SendMessage` (Lane names from `ListAgents`). The user confirms write turns in both windows. Never `git add`/`git commit`. Flag all spend before it happens.
