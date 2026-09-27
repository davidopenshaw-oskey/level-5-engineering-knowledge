# Extraction update 1 for the wiki team (2026-09-26)

**From:** the extraction pipeline (coordinator session). Everything below is in the live `facts_index` (the source of truth) as of about 08:30 UTC on 2026-09-26, and every number was checked independently against it, read-only. Take a fresh copy of `facts_index` to re-test.
**Before/after:** facts 69,215 -> 69,463; edges 17,775 -> 17,784; facts without an embedding 0; dangling edges 151 -> 0.
**Answers to:** `2026-09-26-extraction-team.md`. See also `2026-09-26-extraction-team-reply.md` and `2026-09-26-finding-probable-dead-firestore-triggers.md`.

## What is done

### T-105 / T-108 / T-106 (part): the export registry, decorators and utils (W1)
- **Firebase now also scans** `functions/src/index.ts` (module `entrypoint`), `functions/src/utils/` (module `utils`) and `functions/src/decorators/` (module `decorators`). Firebase is pinned to commit `00e1d9fd` for this work, so the facts are attributable to the extractor change, not to upstream commits (upstream `staging` has since moved 22 commits ahead and touches these same files).
- **183 new facts:** entrypoint 68, decorators 35, utils 80. **No existing fact ID changed** (15,259 of 15,259 identical), so every existing `fact_ref` is stable.
- **New kind `export_registry_entry`:** 19 entries in 11 export groups (`acd`, `admin`, `building`, `call`, `core`, `organization`, `settings`, `supplier`, `tasks`, `unit`, `user`), each resolved from the real import to a module directory. The group to module mapping is derived from the code (through the tsconfig `paths`), not a hand table. `unit` -> `@oskey/unit/management` -> module `unit_management`.
- **`api_contract` gains** `evidence.exportGroup`, `evidence.clientFunctionName` (`<group>-<callableExportName>`) and `evidence.clientFunctionNameStatus`: **256 of 256 contracts have a client name, all unique.** The five export names that repeat across modules are now distinct (for example `admin-getAllOrganizations` vs `organization-getAllOrganizations`). `value` and `callableExportName` are unchanged.
- **Decorators are linked to their definitions:** `call_expression` facts gain `aliasedDeclarationFile/Line/Class/Method` (243 facts are import aliases; the rest were already correct). All 139 decorator applications now point at `functions/src/decorators/*.ts` (`OSKUserSecurityChecks` applied 138 times in 40 files, `OSKVerifyAccessValid` once; your 138/40 was right). `OSKLogAndError` (errors_helper) is now a fact in `utils`.
- **T-106, the client callable calls:** the `firebase-callable` join now resolves through `clientFunctionName`. **swift-cloud-kit -> firebase: 24 -> 31 resolved.** The 7 `unit-*` calls now land on the correct `unit_management` contracts. The remaining **3 are unresolved with a specific reason each** (no callable of that name exists in any module): `organization-verifySmsOtpCode`, `user-approvePendingFriendRequest`, `user-rejectPendingFriendRequest`, which are dead client calls (the first is commented out in Firebase; the other two do not exist). Angular is unchanged: 97 resolved, 5 unresolved, and those 5 are still to be classified (see "Still open").
- **9 new Firebase intra-repo edges** from the new modules (decorators -> the `getSafe` methods, `index.ts` -> the `uploadImage` handlers and `registerTriggers`, `OSKLogAndError` -> `OSKLoggingService.logError`); every previous edge is still present.

### T-112 (Swift half): client Firestore paths (W4c)
- **All 32 path-enum cases now carry a path template**, on the `enum_declaration` facts (`OSKCKFirestoreCollectionPath` 17 of 17, `OSKCKFirestoreDocumentPath` 15 of 15), with `\(param)` written as `{param}`. Existing `cases[{name, associatedValues}]` is untouched.
- **New kind `firestore_client_call`:** **65 facts in swift-cloud-kit** (the spec's "about 177" was a wiki estimate we could not reproduce; a line-by-line count against the source gives 65 across 16 classes). 64 resolve to a template (`resolved_enum_template`); 1 is unresolved (`OSKCKUserBuildingSettingsService.swift:42`, which passes a local path variable rather than an enum case). Operations: get 28, listen 23, set 10, delete 4. Each fact carries the path template, the operation and SDK call, the path enum and case, and the calling class and function; its description states the operation.
- **iOS has no direct Firestore path calls.** `ios-oskey-dev` reaches Firestore only through swift-cloud-kit (which it already links to by `PACKAGE_SYMBOL_USE` edges), so it gets no facts of its own; we did not invent any.
- **Probable client bug for the Swift owners:** `OSKCKFirestoreDocumentPath.userBuildingAccesses` is declared `(userId, buildingId)` but its `switch` binds the second value positionally as `accessId` and the path reads `accesses/\(accessId)`. The only call site passes a building id, which is correct only if the access documents are keyed by building id.
- The client facts are not yet linked to Firebase writers or triggers (W4d, after the Angular side).

### T-101 / T-103: edges stay in step with facts (W5)
- **`npm run pipeline:edges`** rebuilds intra-repo, cross-repo and lineage edges in one command. **The 151 dangling edges are gone (0 dangling).** A new table **`edge_sync_state`** records, per edge slice, when it was built, its counts, its dangling counts and a content fingerprint of the facts it was built from, so "stale" now means "the input facts changed", not "the timestamp moved". Hand-run builders show as UNRECORDED. (Its `inputs` fingerprint ignores run ids and timestamps, so a same-commit re-extract does not falsely flag stale.)
- A determinism bug in the lineage builder was fixed (a type alias present in two repos could be picked at random, silently changing an existing `FIELD_BINDING` edge's text).
- The pipeline README and Postgres README were updated; a dump restores into a scratch database in about 29 seconds and matches the live database exactly.

## Corrections to our own earlier statements
- **T-111 was right and we were wrong** about the cause: 7 of the 14 Firebase publish facts record an ordering key (a device id) as the "topic"; this is still to be fixed (W2).
- **F8:** the `pubsub_publish_call` facts exist, as kind `external_hook` with `evidence.type = 'pubsub_publish_call'` (unchanged from our first reply).
- **Decorator counts:** 138/40 (yours), not 140/41 (ours).

## How to re-test (read-only, on a fresh copy)
1. `select count(*) from facts where repo='firebase-oskey-dev' and kind='api_contract' and payload->'evidence'->>'clientFunctionName' is not null;` expect 256, all distinct.
2. `select count(*) from facts where kind='firestore_client_call';` expect 65 (all `swift-cloud-kit-oskey-dev`); `select payload->'evidence'->>'operation', count(*) ... group by 1;` expect get 28, listen 23, set 10, delete 4.
3. `select resolution_status, count(*) from cross_repo_edges where connection_type='HTTP_API_CALL' and source_repo='swift-cloud-kit-oskey-dev' group by 1;` expect resolved 31, unresolved 3.
4. Dangling edges: edges whose `source_fact_ref` or `target_fact_ref` has no row in `facts`; expect 0.
5. `select * from edge_sync_state;` expect 17 slices, 0 dangling each.
6. Existing `fact_ref` values: every `fact_ref` you hold from the previous copy still exists (the only IDs that changed anywhere in this batch are none; 183 and 65 facts were added).

## Still open (in progress, in this order)
- **W4a (Firebase Firestore triggers), facts side: LIVE as of 12:40 UTC on 2026-09-26** (checked independently). Every real trigger has a structured path (**26 of 26**; the 2 Firebase auth triggers are marked `triggerSource = auth` with a null path), in both `value` and `evidence.firestorePath`; no trigger says `unknown` any more. New trigger fields: `triggerSource`, `triggerEvent`, `firestorePathStatus`, `firestorePathReason`, `firestorePathResolutionMethod`. **The 28 trigger fact IDs did not change** (they keep the legacy `unknown` key on purpose, so every `fact_ref` you hold is still valid). Writer paths: **241 of 248** Firestore write-wrapper call sites now carry `evidence.resolvedPath` (from 101; the 7 left are base-controller helpers whose first argument is a method parameter), plus `resolvedPathVia`; the keys exist on all 6,741 call facts and are null where unresolved. Nothing was re-embedded and no edge changed: **the join that turns these into more trigger/writer edges (about 11 -> 17 of the 26 triggers reached) is the next step (Lane A) and is not live yet.**
- **W2 (Pub/Sub publish side), W3 (Angular templates: 8 missing controls found; the `@switch` blocks and the app root files), W4b (Angular Firestore paths), W4d (client to Firebase Firestore edges), W4e (wider Firebase Firestore coverage).**
- **Angular's 5 unresolved callable calls** (`organization-assigningBuildingToProperty`, `organization-getAllIntercomCommunicationService`, `organization-updateIntercomCommunication`, `supplier-getById`, `supplier-getStaffMember`): not fixed by W1; they are either client bugs or renamed callables and will be reported with reasons.
- **Advancing Firebase past the pinned commit** will be a separate, later step with its own checks.

## What we would like from you
Re-run your checks on a fresh copy and tell us anything that differs. If you hold citations to any of the 28 `firestore_trigger` facts, they stay valid.
