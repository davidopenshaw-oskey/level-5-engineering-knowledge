# `walkBoundedCluster()` Real Verification — 2026-09-06

**Purpose:** close the one real, flagged prerequisite from `02-session-handoff-2026-09-06.md` before wrapping `walkBoundedCluster()` in an MCP tool — it had never been run against real data. Two real tests, against the real local Postgres (`facts-postgres-index-local`), not synthetic data.

## Test 1 — the known anchor named in the hand-off

Anchor: `OSKCreateOrganizationInhabitantComponent`'s `inhabitantType` `formControlName` fact (`angular_template_attribute|...create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|formControlName|#3`).

Result: **2 members, 2 edges, `truncated: false`, 4ms.** Walk goes exactly one hop (Angular template attribute → `OSKInhabitantOnboardingCardRequest.inhabitantType` via `FIELD_BINDING`) and stops — the Firebase-side node has no further outgoing/incoming edges of its own. Matches the real chain already hand-mapped in `governance/roadmap/facts-serving-strategy/15-workflow-clustering-and-angular-ux-facts.md`.

**Real limitation of this test:** this anchor's only edge type is `FIELD_BINDING`. It does not exercise the fan-out risk the hand-off flagged (`INTRA_REPO_CALL`, 2,362 real edges) at all — a second test was needed to actually probe that.

## Test 2 — a real high-fan-out hub, found by querying `cross_repo_edges` directly

Queried real edge-type counts and per-node degree before picking a second anchor, rather than guessing:

```
INTRA_REPO_CALL      2341
HTTP_API_CALL          97
FIELD_BINDING          13
PUBSUB_TOPIC_BINDING     1
```

Highest-degree real `INTRA_REPO_CALL` nodes (source+target combined):

| fact | degree |
|---|---|
| `OSKLoggingService.logError` | 534 |
| `OSKLoggingService.logInfo` | 281 |
| `OSKConsolidatedRolesController.checkUserPermissions` | 121 |
| `OSKOrganizationUserController.get` | 89 |
| `OSKDocumentController._query` | 88 |

Anchored a second real walk directly on `OSKLoggingService.logError` (534 known direct edges).

Result: **80 members, 613 edges, `truncated: true`, 52ms.** All 79 non-anchor members land at depth 1 — `maxFacts = 80` saturates immediately, before depth 2 is ever reached; only 79 of the 534 real callers are surfaced, the rest silently dropped by the cap.

## What this actually confirms

- **The caps work as designed, no crash or runaway behavior.** Both the depth bound (never needed here) and the size bound (hit immediately on the hub case) behaved exactly as `graph-traversal.ts`'s own comments describe. 52ms for an 80-member truncated walk is not a performance concern.
- **The flagged fan-out risk is real, not hypothetical.** A cluster anchored on, or one hop from, a real hub (a shared logging/permission-check/generic-controller method) collapses to "80 arbitrary neighbors of the hub, truncated" — not a coherent view of any one workflow. `truncated: true` correctly signals this, but nothing today explains *why* it truncated (hub saturation vs. a genuinely large-but-real cluster) to whatever reads the result.
- **Real, not-yet-decided implication for the agent-persona layer (Step 5), not solved here:** an agent walking blindly from a business-relevant anchor could still pass *through* a hub one hop out and get a hub-dominated, low-signal cluster back with no explicit warning beyond the boolean `truncated` flag. Whether the fix belongs in the tool (e.g. surface per-neighbor degree so a caller can choose not to expand through obvious hubs) or the persona's own instructions ("if `truncated` and results look hub-dominated, don't walk further/narrow the query") is an open question — recorded here, not decided, consistent with `01-mcp-tool-server-tasklist.md`'s existing "defer to agent-layer judgment" pattern for the 92→42 symbol-ambiguity case.

## Verdict on the prerequisite

**Closed.** `walkBoundedCluster()` behaves correctly and safely against real data in both the shallow case and the real worst-case fan-out scenario found in this corpus. Safe to wrap as the `walk_cluster` MCP tool per Step 1 as planned. The hub-dominance nuance above is a real open question for the agent-persona design (Step 5), not a blocker for Step 1.

## Scripts used

`_test-walk-bounded-cluster.ts` and `_test-walk-bounded-cluster-hub.ts`, both in `pipeline/facts-postgres-index/` — deleted after this write-up per this project's diagnostic-script discipline (`CLAUDE.md`).
