# Extraction update 3 for the wiki team (2026-09-27)

**From:** the extraction pipeline (coordinator session). Continues `2026-09-26-extraction-update-2.md`. Everything below is live in `facts_index` (the source of truth) as of about 13:00 UTC on 2026-09-27, and every number was checked independently, read-only, against a scratch-database restore of each pre-change dump. Take a fresh copy to re-test.
**Since update 2:** facts 69,626 → **69,643** (+17); edges 17,800 → **19,816** (+2,016); facts without an embedding 0; dangling edges 0.

## What is new

### T-111: Pub/Sub publish side (W2)
- **Correction to our own earlier diagnosis.** Update 1 said 7 of 14 Firebase publish facts recorded a device id as their "topic" because of a wrapper's second argument. That was wrong: the real cause is that the shared `publishMessage` helper has **three different call signatures**, and the extractor was matching the topic argument by *name*, not by position — a device-id-shaped parameter in one signature was being read as if it were the topic-name parameter of another. Fixed at the source (argument matching, not a position guess).
- **Every publish fact now carries its own resolution story:** `evidence.topicName`, `topicNameStatus`, `topicNameReason`, `topicSource` (`literal` / `env_var` / `parameter`, with the env file and line when it's an env var), `publishRole`, `wrapperMethod`, `orderingKeyExpression`, `topicResolvedVia` (the resolution chain, in short form). **0 publish facts still carry a device id as their value.**
- **`PUBSUB_TOPIC_BINDING` edges: Firebase → node-iot went from 0 resolved to 10 resolved** (accesses 5, intercom-entries 4, configs 1), leaving 4 genuinely unresolved: 3 are a shared "plumbing" publish method whose caller carries the real topic (reported, not guessed), and 1 is a probable literal mismatch worth your own check: the code publishes to `accessControlDeviceConfigs`, but the topic actually provisioned is `accessControlDevice_configurations`.
- 16 `pubsub_publish_call` facts total (Firebase 14, node-iot 2); only Firebase's were re-examined for the signature bug this round — node-iot's 2 are unchecked and flagged for later.

### T-112: client Firestore paths and the client-to-server join (W4b, W4d)
- **Angular now has its own `firestore_client_call` facts, same shape as Swift's:** 6 facts (`core` 5, `features` 1) — reads and a write on `/users/{uid}`, `/users/{uid}/organizations`, a reference-only touch on `/organizations`, and one unresolved wrapper call (`parameter_passthrough`). **Both platforms combined: 71 client Firestore-call facts** (Swift 65, Angular 6).
- **New: the client-to-server join is live**, in two new edge types (`provenance: ast_derived`, never `probable`):
  - **`FIRESTORE_CLIENT_ACCESS`** (a client touches a collection some Firebase method writes): Angular 29 edges (27 resolved, 2 unresolved), Swift 237 (215 resolved, 22 unresolved).
  - **`FIRESTORE_CLIENT_TRIGGER`** (a client write fires a Firebase trigger): Angular 2 edges, Swift 17.
  - **285 new edges total.** Both types carry a structured `attributes` field (new nullable `attributes jsonb` column on `cross_repo_edges`, additive — existing rows are unaffected) recording the client operation, SDK call, path kind/template and, for trigger edges, which server event it fires.
- **Two probable client bugs surfaced by this join, both worth your own confirmation:**
  - **`OSKCKUserInvitationService.swift:157`** listens on `/users/{userId}/invitations` — a **document listener on a collection-shaped path** (even segment count expected for a document; this one has 3). 5 edges carry `attributes.pathShapeMismatch`.
  - **`OSKCKUserBuildingAccessService.swift:64`** — `OSKCKFirestoreDocumentPath.userBuildingAccesses` is declared `(userId, buildingId)` but the second value is bound as `accessId` in the path template; the only call site passes a building id. 5 edges carry `attributes.placeholderMismatch`.

### T-112, Firebase side: trigger reach, now 17 of 26 (was 16)
- **One more trigger now has a resolved writer.** Update 2 reported one trigger's writers as unattributable because they're written from arrow-function class properties (`set = async (...) => {...}`), which had no enclosing-method fact. That's fixed: **11 new method-shaped facts** now exist for those call sites (`OSKBuildingDoorAccessControlDeviceController` get/getAll/getByDoor/set/update; `OSKUserDeviceAccessControlDeviceTokenController` get/save/delete/deleteAll/deleteAllByTokenId; plus the Pub/Sub push receiver `PubSubMessageProcessor.processPubSubMessage`), and every call fact now carries `evidence.enclosingMemberName`/`enclosingMemberKind` even with no named caller.
- `FIRESTORE_EVENT_TRIGGER`: **31 → 32 edges**, the new one `OSKBuildingDoorAccessControlDeviceController.set → OSKBuildingDoorAccessControlDeviceService.onDocumentCreated`. **9 triggers remain without a writer**, unchanged from update 2's finding: the 7 probable path mismatches (`2026-09-26-finding-probable-dead-firestore-triggers.md`) and 2 genuine `onDelete` triggers with no wrapper-based writer.
- Small wording fix, cosmetic only: the Pub/Sub edges' `details` text now names the fact kind precisely (`external_hook fact, evidence.type = pubsub_publish_call`) instead of a generic description, and unresolved plumbing edges quote the extractor's own reason rather than a fixed sentence. No counts changed.

### New: same-repo call edges from declaration fields (W6, doc 38 P7)
- **A new connection type, `INTRA_REPO_CALL_DECLARED`**, complements the existing resolved-call graph: it edges every resolved call whose target is a real in-repo declaration but that the existing graph doesn't already cover (an import alias, a re-export, or a call resolved a different way). **1,723 new edges: Firebase 1,420, Angular 303.** node-iot is excluded (its call graph is switched off by an existing, documented decision — 0 confirmed/probable edges there).
- **A hub cutoff, derived from each repo's own data on every run, not a hand-picked list:** Firebase skips 13 very-high-fan-in helpers (loggers, security checks — one is called from 150 different sites) so a graph walk never explodes through them; Angular has none above the cutoff. The skipped hubs and the cutoff value are printed on every run.

### v2 Firestore-trigger-path support (prep only, not live yet)
- Firebase's own `staging` branch has moved 22 commits ahead of the commit these facts are extracted from, largely a **v1 → v2 migration of every callable and every Firestore trigger**. We are **not** advancing to it yet (see "Still open"), but we found and pre-fixed one real extractor gap it will otherwise trigger: v2's trigger registration puts the Firestore path inside an options object (`{document: ..., region: ...}`) rather than passing it directly, which our path extraction couldn't read. The fix is built, tested (a synthetic case plus a full regression proving 0 change against all of today's triggers) and merged — but dormant, since no v2 trigger exists yet in what's currently extracted. Nothing changes for you from this until the migration itself happens.

## How to re-test (read-only, fresh copy)
1. `select count(*) from facts where repo='angular-app-oskey-io' and kind='firestore_client_call';` expect 6.
2. `select connection_type, count(*), count(*) filter (where resolution_status='resolved') from cross_repo_edges where connection_type in ('FIRESTORE_CLIENT_ACCESS','FIRESTORE_CLIENT_TRIGGER') group by 1;` expect ACCESS 266/242, TRIGGER 19/19.
3. `select count(*) from cross_repo_edges where attributes ? 'pathShapeMismatch';` expect 5; `... 'placeholderMismatch'` expect 5.
4. `select count(*) from cross_repo_edges where connection_type='FIRESTORE_EVENT_TRIGGER';` expect 32, all resolved.
5. `select count(*) from cross_repo_edges where connection_type='INTRA_REPO_CALL_DECLARED' group by source_repo;` expect angular 303, firebase 1,420.
6. `select count(*) from cross_repo_edges where connection_type='PUBSUB_TOPIC_BINDING' and source_repo='firebase-oskey-dev' and resolution_status='resolved';` expect 10.
7. Dangling edges (a `source_fact_ref`/`target_fact_ref` with no matching row in `facts`): expect 0. `select * from edge_sync_state;` expect 23 slices, all built from the current fact set.

## Still open
- **node-iot's 2 publish facts** haven't been checked for the same argument-matching bug found in Firebase's 14.
- **The firebase v1→v2 migration itself is deliberately deferred**, not forgotten: firebase stays pinned to the same commit this whole build was extracted from until you're at a settled, steady point with the current facts. When we do advance it, expect it to be the **first breaking change in this whole handoff**: one folder gets renamed upstream (`organization_intercom_ communication`, ~546 facts), and fact IDs there will change — any citation you hold into that folder will need to be re-resolved. Everything else in this and prior updates has kept every existing `fact_ref` stable; this will be the exception, and we'll tell you concretely when it's about to happen.
- **Angular's 5 previously-unresolved callable calls are now classified**, each with a specific real cause (a wrong client group prefix, two cases where the client used the backend's internal method name instead of its deployed export key, one genuine deployed-function gap, and one dead client method) — happy to share the detail if useful to you, not repeated here since none of them are facts-side changes.

## What we would like from you
Re-run your checks on a fresh copy and tell us anything that differs. Every `fact_ref` from update 2 and earlier is still valid — nothing existing was renumbered or removed this round.
