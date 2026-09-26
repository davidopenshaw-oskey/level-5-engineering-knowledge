# Build plan: extraction gaps from the wiki handoff (and our own open items)

Decide-stage doc, written 2026-09-26. **Nothing built.** No code edited, no database rows written,
no git add/commit. Managed from the validator/coordinator session (ref `4fa3bd`); built by a
separate build session using
[prompts/prompt-8-extraction-gaps-build.md](prompts/prompt-8-extraction-gaps-build.md).
Follows the investigate → decide → build pattern of doc 38.

Inputs: the downstream wiki team's handoff
(`governance/roadmap/downstream-app-feedback/2026-09-26-extraction-team.md`), doc 38's open
proposals (P1–P10), and today's read-only verification against the live database.

**The build session's prompt is authoritative on process; this doc is authoritative on scope,
order, evidence and acceptance. Where anything in the wiki's own prompt file conflicts, this
doc and prompt-8 win** (that file is marked superseded).

---

# AUTHORITATIVE BUILD SPEC (2026-09-26)

## Decisions made by the user, 2026-09-26

1. **Order as proposed:** W1 (export registry) early; the Swift work last of the wiki items.
2. **W1 scope:** `functions/src/index.ts`, `functions/src/utils/` (incl. `errors_helper.ts`) and
   `functions/src/decorators/` (`securityChecks.ts` = `OSKUserSecurityChecks`, `accessChecks.ts` =
   `OSKVerifyAccessValid`).
3. **The live database stays the source of truth.** No DB copy for the build. Downstream (wiki)
   testing runs on their own early copies and reports issues back. Safeguards replace the copy
   (see "Live-DB safeguards").
4. **Swift extractor change is approved** (W4c). Fix as much as can be fixed; downstream keeps
   testing us.
5. **P7 and W5(c) stay on the list.** The coordinator controls the order and pushes the wiki
   items early.

## Order

| Step | Item | Source | Size |
|---|---|---|---|
| 0 | **W0** reply note to the wiki team, and their prompt marked superseded | this review | small (done by coordinator, not the build session) |
| 1 | **W5a** `pipeline:edges` entry point, **W5b** per-repo edge-sync state | doc 38 P4, wiki T-103 | small |
| 2 | **W1** export registry + extra Firebase source roots | wiki T-105/T-108/T-106, doc 38 P3/A2 | small–medium |
| 3 | **W4a** structured Firestore trigger path + writer resolved paths | wiki T-112, doc 38 P1 | small–medium |
| 4 | **W2** Pub/Sub publish side | wiki T-111, doc 38 P2/D2 | medium |
| 5 | **W3** Angular templates without facts | wiki T-110 | small–medium |
| 6 | **W4b** Angular Firestore path facts | wiki T-112 | medium |
| 7 | **W4c** Swift Firestore path facts (extractor binary change) | wiki T-112 | large |
| 8 | **W4d** client ↔ firebase Firestore edges | wiki T-112 | medium |
| 9 | **W4e** wider Firebase Firestore coverage | wiki T-104 | large, may overlap W4a |
| 10 | **W6 (P7)** same-repo call-edge join | doc 38 P7 | medium |
| 11 | **W5c** clear the 151 dangling `INTRA_REPO_CALL` edges | wiki T-101, doc 38 P5 | small |

Why this order: W5a/b first because every later item re-extracts and syncs a repo, and edges are
otherwise left stale (see W5). W1 next because it unlocks the most (export names, the 7 `unit-*`
calls, decorator facts). W4a is a quick win for the wiki (structured trigger path). W4c is the
heaviest so it comes after the cheaper wiki items, and W5c naturally follows it because the Swift
kits get re-extracted and their edges rebuilt.

**Parked (not scheduled, recorded so they are not lost):** shared payload shapes across languages
(Swift `cases[{name,associatedValues}]` vs TS `enumMembers[{name,value}]`; `callerFunction` vs
`callerMethod`): any change must be additive, never a rename; the Android user app
(`android-oskey-io`, benched by the user) and digicom (not in the index); P8 hub cap; P9 Apigee
export; iOS ↔ door-intercom edges (wiki T-102); loading deployed GCP config as facts (T-109; the
staging snapshot file exists).

## Verified today against the live database (read-only)

Do not re-derive these, but re-verify any number you build on.

- **The wiki's F8 is a misreading.** `pubsub_publish_call` facts exist: 14 firebase + 2 node-iot,
  as **kind `external_hook`, `payload->'evidence'->>'type' = 'pubsub_publish_call'`**. They queried
  for a kind of that name. The edge `details` text is right.
- **T-111's core finding is correct and new.** Of the 14 firebase publish facts, 7 record an
  *ordering key* as the topic (`intercomDoc.accessControlDeviceId` ×2, `intercomId`,
  `buildingDoorACD.accessControlDeviceId` ×3, `acdId`); 5 are pass-through parameters
  (`topicName` ×3, `topic` ×2); 1 is a partial env var
  (`{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}`); 1 is the resolved literal
  `accessControlDeviceConfigs`. Doc 39 had called the 7 "pass-through parameters"; that was wrong.
  Extractor emits these at `pipeline/firebase-oskey-dev/phase-01-ast-extraction/01-extract-ast-evidence.ts:1071` and `:1095`.
- **T-108: the export name already exists.** All 253 callable `api_contract` facts carry
  `evidence.callableExportName` (differs from `value` in 78, the wiki's 28%; e.g.
  `onCreatePincodeAnonymousAccess` → `createQuickcode`), emitted at `01-extract-ast-evidence.ts:1144`
  as the property key inside the module's trigger object. What is **missing** is the export
  *group* prefix (`unit`, `acd`, `core`, `user`…) defined in `functions/src/index.ts`, which the
  scan never sees: `00-scan-repo.ts:233-325` only walks directories under `modulesRoot`
  (`functions/src/modules`).
- **T-112 trigger path:** all 28 `firestore_trigger` facts have `evidence.firestorePath = "unknown"`;
  26 get a path from the sibling `firestore_path_touched` fact at the same file:line (the other 2
  are Firebase *auth* triggers with no path). Firestore write wrappers: 248 call sites, first
  argument readable for 101, not readable (identifier/call) for 147. The `firestore-trigger` join
  produces 17 edges, reaching 11 of 26 triggers.
- **Decorators:** `OSKUserSecurityChecks` applied 140× in 41 files (wiki says 138/40);
  `OSKVerifyAccessValid` applied once (`access_pincode.service.ts:285`); `errors_helper.ts` is a
  15-line `OSKLogAndError` (throws an `HttpsError` and logs it), which is why
  `OSKLoggingService.logError` has 534 callers.
- **Swift path enums** (`swift-cloud-kit-oskey-dev/Sources/OSKCloudKit/Firebase/Cloud Firestore/Models/Paths/`):
  `OSKCKFirestoreCollectionPath` (17 cases) and `OSKCKFirestoreDocumentPath` (15+ cases). Each has
  `var string: String { switch self { case .users: "/users" case let .userBuildingAccesses(userId): "/users/\(userId)/accesses" … } }`,
  i.e. the path is a **string literal with `\(param)` interpolation in a switch body**. The current
  extractor's enum visitor (`swift-extractor/Sources/swift-extractor/main.swift:287`,
  `EnumCaseDeclSyntax`) records case names and associated-value types only.
- **Angular:** 8 source files import `@angular/fire/firestore`. Template control extraction is at
  `pipeline/angular-app-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts:746-891`.
- **Wiki number cross-checks that match ours:** 15 unresolved client callable calls (5 Angular +
  10 swift-cloud-kit); 151 dangling `INTRA_REPO_CALL` (ui 108, webrtc 37, ble 6).
- **Not verified (wiki claims, treat as leads):** the exact list of missing Angular controls
  (2 static + 6 bound), the 84/67 expected counts, "10 of 14 publish sites resolvable via
  `.env`", digicom's existence, and the wiki's evidence folders (not in this repo).
- **Firebase's last extraction predates extractor changes.** Firebase's current run is
  `20260911_080454-00e1d9fd`; steps 01/02 changed since (e.g. bounded fact IDs). A re-extract at the
  same commit **may change some fact IDs**. This is why the pre-sync ID gate below is mandatory.

## Live-DB safeguards (apply to every item)

The live `facts_index` is the truth and other sessions and the wiki read it. So:

1. **Dump first.** Before each item's first write:
   `docker exec facts-postgres-index-local pg_dump -U facts_index -Fc facts_index > output/backups/facts_index-<date>-before-<item>.dump` (gitignored, ~275 MB).
2. **Baseline.** Before W5a, save `43-baseline-before-2026-09-26.json` next to this doc: facts per
   `(repo, module, kind)`, edges per `(connection_type, source_repo, target_repo, resolution_status,
   provenance)`, `extraction_runs` current rows. Re-baseline after each validated item.
3. **Upstream check.** `00-scan-repo` deletes the clone and re-clones the latest branch head. Before
   any re-extract, run `git ls-remote <gitUrl> refs/heads/<branch>` and compare with the run's
   commit. If upstream moved, **stop and tell the user** before proceeding.
4. **Pre-sync fact-ID gate (mandatory).** After extraction and before `sync-facts.ts`, compare the
   new run's capability-pack fact IDs with `facts.fact_id` for that repo and report: identical,
   new, would-be-pruned. For every changed ID list the consequences (embeddings lost; edges whose
   source/target ID changes). Never sync with unexplained ID changes. (Pattern: the read-only ID
   diff already used for Angular/node-iot on 2026-09-25: 8,747/8,747 and 1,432/1,432 identical.)
5. **Sync with `EMBED` off first.** It is free and prints how many facts need embedding. **Flag the
   count and estimated tokens (about 95 tokens per fact; android's 3,631 facts cost 250,784) and
   wait for the user's go-ahead before any `EMBED=true`.**
6. **Rebuild edges after every sync** (`pipeline:edges` once W5a exists) and read the coverage
   summary: 0 dangling on resolved/confirmed edges, no unexplained STALE.
7. **Never** run `DROP`, `TRUNCATE`, hand-written `UPDATE`/`DELETE` on `facts`, or change existing
   columns. Schema changes are additive and need the user's approval first. Only the documented
   scripts write to the database.
8. **Wiki contract (their rules, adopted):** `fact_ref` stays stable across a re-extract at the same
   commit; a run replaces a repo's facts completely; existing payload field names/meanings are
   never changed, only added to; anything the wiki joins on is a structured payload field or edge
   column, not prose in `details`; unresolved with a reason is fine, wrong is not.
9. After each **validated** item the coordinator writes a short downstream note in
   `governance/roadmap/downstream-app-feedback/` with the new numbers and what to re-test.

## Item specs

Each item: investigate → cite `file:line` → **propose** any new fact kind, payload field or edge
type and **wait for approval** → implement → run the safeguards → acceptance → append to the
`## Build log` at the end of this doc → stop for validation. Sizes are estimates.

### W5a: one edges entry point; W5b: per-repo edge-sync state (do first)

**Why first:** each item re-extracts and syncs; edges are computed from facts and are otherwise
silently stale (doc 38 P4; coverage summary shows 10 slices flagged). The Firebase re-extract in W1
is the riskiest case (see the ID note above).

- **W5a.** An npm script `pipeline:edges` running, in order: `build-intra-repo-edges.ts` for every
  repo it supports **that has a current run and a resolved graph whose `runId` matches** (discover
  from `extraction_runs` and the existing supported-repo logic; node-iot is intentionally skipped),
  then `build-cross-repo-edges.ts` (all joins), then `build-form-field-lineage-edges.ts`. Flags:
  `--repos=`, `--dry-run`, `--fail-on-stale`. Idempotent. Ends with the coverage summary.
  **Do not change the existing builders' behaviour**; this only orchestrates them. Note
  `build-form-field-lineage-edges.ts` hardcodes Angular; leave that (out of scope).
- **W5b.** Record edge-sync state so "stale" means "built from a different fact-ID set than is
  current", not a timestamp. Propose an **additive** table (e.g. `edge_sync_state`: repo,
  connection_type, facts_run_id, built_at, edge_count, dangling_source, dangling_target); propose
  the schema and wait for approval. The coverage summary should read it.
- **Acceptance:** after a sync of an unchanged run the summary shows no false STALE (today Angular,
  node-iot and android HTTP are flagged only because run timestamps moved); after a run with
  changed IDs it flags STALE until `pipeline:edges` runs; two consecutive runs of `pipeline:edges`
  leave the edge table identical; `FIELD_BINDING` 13 unchanged; totals equal the baseline.

### W1: export registry, decorators, utils (Firebase)

**Goal:** give the pipeline the missing Firebase files, and use the export registry to resolve
client callable names.

- **Extra source roots, config-driven, not hardcoded.** Firebase's scan only sees
  `functions/src/modules/*`. Add a configured list of additional roots in `config/repos.json`
  (e.g. `additionalSourcePaths`), covering `functions/src/index.ts`, `functions/src/utils/` and
  `functions/src/decorators/`, and discover the `.ts` files under them dynamically. Propose how
  these facts are namespaced (a `module` value for them; check what depends on `module`: sync per
  module, capability packs, search routing, the `module::handler` compound key) and wait for
  approval. `astErrorTolerancePercent` is 0 for Firebase, so any new file with a parse error aborts
  the run; report it if so.
- **New fact(s) for `index.ts`:** the export registry, e.g. `export const unit = {
  ...unitTriggers.getCallableFunctionTriggers(...) }` (imported from `@oskey/unit/management`)
  mapped to its module. Propose the kind and payload (export group, import specifier, resolved
  module directory, factory call). Derive the group → module mapping from the code; **never a
  hand-typed alias table.**
- **`api_contract` additive fields:** the export group and the full client-facing name
  (`<group>-<callableExportName>`). Do not rename `value` or `callableExportName`.
- **Decorators:** `OSKUserSecurityChecks` options (e.g. `checkUserIdMatch`) and
  `OSKVerifyAccessValid` behaviour should be visible as facts (the class/function extraction
  already applies once the files are in scope; add a fact that ties a decorator *application* to
  its *definition* if that is missing, and report what the extractor produces). `errors_helper`
  comes through the same way.
- **Join change (`build-cross-repo-edges.ts` `firebase-callable` join):** resolve `<group>-<export>`
  through the registry; keep the compound key and the fail-closed duplicate check.
- **Acceptance:**
  - all 7 `unit-*` swift-cloud-kit calls resolve (iOS → Firebase 24 → 31 of 34); the 3 dead ones
    (`organization-verifySmsOtpCode`, `user-approvePendingFriendRequest`,
    `user-rejectPendingFriendRequest`) stay `unresolved` with reasons;
  - each of the other 5 Angular unresolved calls
    (`organization-assigningBuildingToProperty`, `organization-getAllIntercomCommunicationService`,
    `organization-updateIntercomCommunication`, `supplier-getById`, `supplier-getStaffMember`) and
    the remaining wiki T-106 items either resolve or carry a specific reason (e.g. absent from the
    registry, a probable client bug);
  - Angular's 97 resolved `HTTP_API_CALL` edges unchanged or explained;
  - every callable `api_contract` has the group and client name, or a stated reason;
  - existing facts' IDs unchanged (pre-sync gate), or every change explained;
  - the new file roots add only the expected files (report the fact counts by module).
- **Re-extract:** firebase only. Embedding spend flagged before it happens.

### W4a: structured Firestore trigger path; writer resolved paths (Firebase)

- **Trigger path.** `evidence.firestorePath` is `"unknown"` on all 28 triggers although the path is
  available (26 via the sibling fact, and the literal is in the registration call). Find why the
  extractor sets `unknown`, fix it at the source, and record the path in a structured field.
  Auth triggers have no path: give them an explicit marker (e.g. a trigger source of `auth` and no
  path) rather than `unknown`; propose the shape.
- **Writer paths (doc 38 P1).** 147 of 248 write-wrapper first arguments are not readable
  (identifiers, `OSKUserController.collection`, `getCollectionPath(...)`). Record
  `evidence.resolvedPath` (a normalised template, `{x}` for parameters) where a static property or
  a call to a path-building method resolves it; leave the rest unresolved with a reason.
- **Then** re-run the `firestore-trigger` join.
- **Acceptance:** no trigger has `unknown` (auth triggers marked instead); readable-path writers up
  from 101 of 248 (report the new figure and reasons for the rest); triggers reached up from
  11 of 26 (report which of the 15 still have no writer and why); existing 17 edges preserved or
  explained; the existing `firestore_path_touched` payload fields keep their names.

### W2: Pub/Sub publish side (Firebase, then the join)

- **Bug:** for the wrapper `publishMessage(topicName, acdId, payload)` → `_publishMessage(topic,
  orderingKey, body)`, the extractor records the second argument (a device/ordering id) as the
  topic in 7 of 14 facts (`01-extract-ast-evidence.ts:1071`, `:1095`). Confirm against the wrapper
  source, fix the argument mapping, and record the ordering key separately if useful.
- **Resolve env-var topics** from Firebase's checked-in `functions/.env`
  (`OSK_PUBSUB_TOPIC_ACD_*` → topic names; `.env.staging/.env.prod/.env.dev` do not override).
  Treat it as a literal table read from the repo's own file, fail-closed to unresolved with a
  reason. Verify the wiki's claim that 10 of 14 sites are resolvable this way (we had counted only
  3 env getters read directly; the publisher services may read through them).
- **Generic wrappers** (about 4) resolve through their callers: if this needs cross-function
  argument propagation, propose the approach and stop; otherwise leave unresolved with a reason.
  `accessControlDeviceConfigs` (a literal not deployed in staging) stays flagged.
- **Join (`pubsub-binding`):** with resolved publisher topics, emit Firebase → node-iot edges using
  the committed snapshot `governance/reference-docs/pubsub.bindings.staging.json` (only where a
  fact exists on both ends); fix the `details` reason text that calls ordering keys "pass-through
  parameters".
- **Acceptance (wiki's, plus ours):** at most 4 firebase `PUBSUB_TOPIC_BINDING` publish edges
  unresolved; none has a device id or other ordering key as its topic; the `details` name the
  correct kind (`external_hook` with `evidence.type = pubsub_publish_call`); the existing
  node-iot → firebase `accessControlDevice_activities` edge is unchanged; staging only, stated in
  `details`. **Do not run any `gcloud` command.**

### W3: Angular templates without facts

- Investigate why `app.component.html`, `sign-in-with-email-link.component.html` and
  `sign-up-with-email-link.component.html` yield no form-control facts although their components
  look like extracted ones (`01-extract-ast-evidence.ts:746-891` is the template path), and why
  nested `formGroupName` (e.g. `phone.localPhoneNumber`) is not recorded.
- **Independently count** static and bound `formControlName` occurrences in the source at `8345d222`
  (HTML comments excluded) from `output/clones/angular-app-oskey-io`; do not take the wiki's 84/67
  on trust.
- **Acceptance:** the 3 templates yield facts; extracted counts equal your independent source
  count (wiki expects 84 static / 67 bound; currently 82/61); nested `formGroupName` recorded
  additively; `FIELD_BINDING` edges (13) unchanged.
- Angular's current run (`20260923_110233-8345d222`) is already synced; a re-extract at the same
  commit must keep existing IDs.

### W4b: Angular client Firestore path facts

- 8 source files import `@angular/fire/firestore` (`collection`, `collectionData`, `doc`, …).
  Propose the kind (reuse `firestore_path_touched` with an additive `side`/`client` marker, or a new
  kind; do not change the meaning of Firebase's existing facts), with: path template, operation
  (get / set / update / delete / listen), file:line, and the calling class/method.
- Unresolvable paths are recorded unresolved with a reason.
- **Acceptance:** every `@angular/fire/firestore` call site has a fact with a path and operation, or
  a stated reason; nothing changes for existing Angular fact IDs.

### W4c: Swift Firestore path facts (Swift extractor binary change)

- **Extractor:** add a SwiftSyntax visitor for a computed `string` property's `switch` body in the
  path enums, capturing each case's literal (with `\(param)` interpolation) as a normalised
  template (`{param}`), stored additively on the enum-case facts (`evidence.cases[].pathTemplate`
  or similar; do not remove `cases[{name, associatedValues}]`). Then emit client Firestore call
  facts for `OSKCKFirestoreService` and the 17 service classes (about 177 calls) with the path enum
  case, resolved template and operation.
- **Rebuild the binary:** `swift build -c release` in
  `pipeline/swift/phase-01-ast-extraction/swift-extractor/` (arm64, Swift 6.4 installed). The binary
  is shared by all 5 Swift repos, so **run the pre-sync ID gate for all five** and report any ID or
  description change before syncing any of them.
- **iOS:** the acceptance in the wiki's prompt expects iOS to have client path facts. Check whether
  `ios-oskey-dev` calls Firestore directly or only through swift-cloud-kit (which it already links
  to by `PACKAGE_SYMBOL_USE` edges). Report honestly which it is; do not invent iOS-side facts.
- **Acceptance:** every case of `OSKCKFirestoreCollectionPath` and `OSKCKFirestoreDocumentPath` has
  a path template; swift-cloud-kit has client path facts with operation; existing Swift fact IDs
  unchanged or explained; `swift-ui-kit`, `swift-ble-kit`, `swift-webrtc-kit` and iOS re-extracted
  and re-edged only if the gate shows a change. Embedding spend flagged first.

### W4d: client ↔ firebase Firestore edges

- New join in `build-cross-repo-edges.ts` (a `--join=` like the others, with the preflight and
  shrink guards) linking client path facts (W4b, W4c) to Firebase writers and triggers on the same
  collection/document pattern. Reuse the existing wildcard rule (a trigger wildcard matches any
  writer segment; a writer wildcard never matches a trigger literal). Propose the connection type
  and edge direction; status must be `resolved` (traversal ignores anything else; no `probable`).
  Record the operation in a structured column/field, not only in `details`.
- **Acceptance:** edges exist for client paths that match a Firebase collection; each unmatched
  client path or Firebase collection is listed with a reason; existing slices unchanged.

### W4e: wider Firebase Firestore coverage (wiki T-104)

- After W4a, list which collections (`entities`, `properties`, `units`, `pincodes`, `staff`,
  `nonAppUsers`, `userInvitations`, …) still have no path fact and why (unreadable first argument,
  no wrapper call, different access style). Fix what the extractor can resolve statically; report
  the rest. Overlaps with W4a's writer-path work: merge if the same change closes it.

### W6 (doc 38 P7): same-repo call edges

- 4,504 resolved Firebase calls name a declaration in the repo; 2,363 have an `INTRA_REPO_CALL` edge;
  **2,141 have none** (1,328 more resolved calls point outside the repo, at SDK/shared code, and
  are out of scope). Of the 2,141: same-module business code 1,471, security/permission checks
  204, other core utilities 188, logging 152, Firestore base wrappers 85, cross-module business
  code 41.
- Build a join over resolved `call_expression` facts (they record `declarationFile`,
  `declarationMethod`, `resolutionStatus`) to call-site → callee edges. **Skip heavily used
  callees using a fan-in threshold derived from the data, not a name list.** **Dry-run first** and
  report: edges added, largest new hubs (e.g. `OSKSecurityChecks.checkParameters` would be about
  150 callers), and the per-callee counts, before writing. Do **not** re-run
  `build-intra-repo-edges.ts` for this (it cannot produce these edges; established in doc 38).
- **Acceptance:** dry-run numbers reviewed by the user before the real run; hub sizes reported;
  existing slices unchanged; `resolved` edges have non-null targets.

### W5c: the 151 dangling `INTRA_REPO_CALL` edges

- swift-ui-kit 108 (23 `probable`, 85 `unresolved`), swift-webrtc-kit 37, swift-ble-kit 6; all have
  a null target, so traversal never follows them. After W4c re-extracts the Swift kits,
  `pipeline:edges` rebuilds them and this clears itself. If it does not, propose deleting the rows
  (safe: none is ever followed) and wait for approval.
- **Acceptance:** dangling count 0 on all statuses, or the remainder explained.

## Out of scope for this build

Anything marked parked above; `build-form-field-lineage-edges.ts` generalisation; the wiki's own
repo; any real LLM run; any `gcloud` command; changing existing payload field names.

## Spend

Zero LLM spend. Embedding spend only for new or changed facts, **flagged with a count and token
estimate before `EMBED=true` each time.**

## Session rules

One item at a time; **stop after each and report real numbers** so the validator session can
check it. Bounded dry run before each real write. If a number differs from this spec, say so and
explain; do not adjust code until it matches. If unsure whether something is in scope, it isn't:
ask. **Never `git add` or `git commit`;** only the user commits.

**Validation (validator session, after each item):** independent SQL against the baseline,
unchanged-slice checks, `fact_ref`/ID stability, dangling counts, one `findGraphNeighbors` call
per new edge type, source spot-checks against `output/clones/<repo>` on the branch in
`config/repos.json`, and a check that no `git add`/`git commit` was run.

---

## Build log

*(The build session appends one dated entry per item here.)*
