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

## Lane model and DB write protocol (added 2026-09-26, decided by the user)

The work is split across three parallel sessions ("lanes") so no session holds it all and lanes
that touch different files can proceed together. **Where this section conflicts with the
per-item text below, this section wins on who does what and when the database may be written;
the item text still wins on scope and acceptance.**

| Lane | Session | Items | Owns (edits only these) | Prompt |
|---|---|---|---|---|
| **A: Edges** | the session already running (`-29`) | W5a, W5b, then every change to the edge builders: W1's join change, W2's join, W4d, W6, W5c | `pipeline/facts-postgres-index/build-*.ts`, `sync-facts.ts`, `build-edges.ts`, the `edge_sync_state` table, `package.json` scripts | `prompts/prompt-8-extraction-gaps-build.md` (Lane A section) |
| **B: Firebase + Angular** | new | W1 (extraction part), W4a, W2 (extraction part), W3, W4b, W4e | `pipeline/firebase-oskey-dev/**`, `pipeline/angular-app-oskey-io/**`, those repos' entries in `config/repos.json` | `prompts/prompt-8b-lane-firebase-angular.md` |
| **C: Swift** | new | W4c, then re-extract of the Swift repos | `pipeline/swift/**`, `pipeline/ios-oskey-dev/**`, the Swift extractor binary | `prompts/prompt-8c-lane-swift.md` |

**Why the edge builders belong to lane A only:** `build-cross-repo-edges.ts` is one file that W1,
W2, W4a, W4d and W6 all touch; two sessions editing it would clobber each other. Lanes B and C
deliver **facts** (new kinds and payload fields, approved first). Lane A turns them into **edges**.
A lane that needs a join changed writes the request (what facts, which fields, expected edges)
under "Interface contracts" below; lane A implements it.

**Interface contracts.** Any new fact kind, payload field or edge type is proposed under a
heading in this section and approved by the user before code is written. **W4b (Angular) and W4c
(Swift) must emit the same payload shape for client Firestore path facts** (path template,
operation, file:line, calling class/method, `side: client` or equivalent). Whichever lane proposes
first posts it here; the other adopts it unless it objects in writing. One approval covers both.

### DB write protocol

- **Lanes may always do:** read-only queries; edit their own files; run extraction
  (`pipeline:<repo>`, which writes only under `output/`) **after checking upstream first**
  (safeguard 3); run the pre-sync fact-ID gate (read-only); take a `pg_dump`.
- **Lanes may only do in a "write turn":** `sync-facts.ts` (any module, `EMBED` on or off),
  any edge builder or `pipeline:edges`, any schema change, deleting rows.
- **Only one write turn is open at a time.** Sequence: the lane finishes extraction and the
  pre-sync ID gate, records a `READY TO SYNC` entry (gate numbers, embedding estimate) in its log,
  and stops. The user brings it to the coordinator; the coordinator reviews the gate and replies
  go or no-go; the user tells the lane. The write turn covers sync, `pipeline:edges` (once W5a
  exists), the coverage summary, and the lane's report; it is closed by a `WRITE TURN RELEASED`
  line. Nothing syncs before W5a exists, so edges never go stale.
- **Embedding** stays flagged and approved per run by the user, and only inside a write turn.
  Parallel embedding runs would risk the Vertex quota, so they are serialised by the same rule.
- **Restoring any dump means stopping every lane first.** A restore wipes the other lanes' work.
- **Coordinator log:** the coordinator appends `WRITE TURN GRANTED: <lane> <item>` and
  `WRITE TURN RELEASED: <lane>` lines under `### Write-turn log` at the end of the Build log.
  If the last line is not a RELEASED line, do not start a write turn.

### Shared files, commits and logs

- **You (the user) commit.** Each lane's prompt lists the files it owns, so `git add` per lane
  stays clean. No session runs `git add` or `git commit`.
- **Logs:** each lane appends dated entries prefixed `[Lane A]`, `[Lane B]` or `[Lane C]` to the
  `## Build log` at the end of this doc, using **append-only shell writes** (`cat >> file <<'EOF'`),
  never a full-file rewrite, so concurrent lanes don't overwrite each other.
- A lane never edits a file owned by another lane. If it needs to, it stops and asks.

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

Session `level-5-engineering-knowledge-29`. No `git add`/`git commit` run by the build session.

### 2026-09-26: Baseline and W5a/W5b investigation (nothing built yet; awaiting approval of the proposals below)

**Safeguards done.**
- Dump: `output/backups/facts_index-2026-09-26-before-W5a.dump` (275 MB, gitignored). Readable: `pg_restore -l` lists the archive (43 TOC entries).
- Baseline: `43-baseline-before-2026-09-26.json` (next to this doc). Totals: **69,215 facts, 17,775 edges, 0 facts without an embedding**; 9 current `extraction_runs`; 350 `(repo,module,kind)` fact groups; 33 edge groups; 17 `(connection_type, source_repo)` slice fingerprints (md5 over everything except `edge_id`/`synthesis_id`/`generated_at`, same method as doc 38's baseline).
- Current runs (all equal `extraction_runs.is_current`): firebase `20260911_080454-00e1d9fd`, angular `20260923_110233-8345d222`, node-iot `20260923_110250-a6cba122`, android-intercom `20260925_124505-ee4493bf`, ios `20260920_165124-e660bda2`, swift-cloud-kit `…165044-32772e4a`, swift-ui-kit `…165053-9a75c7c6`, swift-webrtc-kit `…165059-e8aeea9d`, swift-ble-kit `…165106-f8cdf199`.
- No upstream check or pre-sync ID gate needed for W5a (no re-extract, no sync).

**Verified today (read-only).**
- All 9 repos have a `resolved-engineering-graph.json` whose `runId` equals the current run (so all pass the intra builder's freshness check).
- `INTRA_REPO_CALL` edges were built 2026-09-11 for angular, firebase, ios and the four Swift kits; android-intercom's were rebuilt 2026-09-25. Graph row counts equal the existing edge counts for every repo (e.g. swift-ui-kit 625, ios 8,734), so a rebuild is expected to keep totals but replace the source fact IDs (the 151 dangling rows in ui/webrtc/ble come from the older extraction; they should clear on rebuild, which is W5c's acceptance and so would be reached early).
- Current coverage summary flags **10 STALE slices**, all by timestamp: `extraction_runs.extracted_at` is set at sync time (android 2026-09-25 12:45, angular 12:43, node-iot 12:43, Swift/ios 2026-09-20 16:5x) and compared with `edges.generated_at`. Angular/node-iot were re-extracted at the same commit with identical fact IDs (8,747/8,747 and 1,432/1,432, read-only diff 2026-09-25), so their flags are false. Android HTTP_API_CALL (built 09-21, run changed 09-18 → 09-25) and the Swift/ios INTRA_REPO_CALL slices may be genuinely stale; timestamps cannot tell.

**Code facts that shape the design (cited).**
- `build-intra-repo-edges.ts:247-356` takes one repo from `REPO_NAME`; it has a freshness guard (`:268`, graph `runId` must equal the current run) and a scoped replace (`:339`), but **no shrink guard and no `--dry-run`**. There is **no supported-repo list**: it dispatches on graph shape (`:282`), so node-iot's skip is only a convention in README Stage C ("intentionally not loaded"); the builder would load it if asked. node-iot's graph today: 0 confirmed, 0 probable, 1 unresolved, 62 eligible calls of 761.
- `build-cross-repo-edges.ts:1425-1474` `main` runs every join (each with preflight + shrink guard + scoped replace, `:1212-1298`) and ends with `printCoverageSummary` (`:1341`); its staleness test is the timestamp comparison at `:1396-1410`. Exits 1 if any join failed.
- `build-form-field-lineage-edges.ts` is Angular-only and has no flags (`main` at `:130`).
- `package.json` has no script for any of this.

### Write-turn log

*(Coordinator appends `WRITE TURN GRANTED: <lane> <item>` and `WRITE TURN RELEASED: <lane>` lines here. If the last line is not a RELEASED line, no write turn may start.)*
- 2026-09-26: lane model adopted. Lane A = `-29` (W5a/b in progress, no write turn open). Lanes B and C not yet started. No write turn open.

### 2026-09-26: [Lane C] W4c investigation and PROPOSAL (read-only; nothing edited, built, extracted or written to the DB; awaiting user approval of the shape below)

Session `1eab3d42` (Lane C). No `prompt-8c-lane-swift.md` existed when this lane started, so it worked from the lane table and the W4c item text. No `git add`/`git commit` run.

**Verified today (read-only: live DB, `output/clones/*`, source).**
- **Path enums** (swift-cloud-kit `Models/Paths/`): `OSKCKFirestoreCollectionPath` 17 cases, `OSKCKFirestoreDocumentPath` 15 cases. Each has `var string: String { switch self { case .x: "<literal with \(param)>" } }` and a `collectionRef`/`documentRef` property that calls `Firestore.firestore().collection(string)` / `.document(string)`. Clone commit `32772e4` = current run `…165044-32772e4a`.
- **The path is never a literal at the call site.** `OSKCKFirestoreService<T>` methods take the enum as an argument (`get(_ documentPath:)`, `getAll(_ collectionPath:)`, `create(_:atPath:)` ×2 overloads, `update(from:atPath:)` ×2, `delete`, `documentSnapshotListener`, `collectionSnapshotListener`, `querySnapshotListener`, `getPaginated`) and the SDK call is inside, e.g. `documentPath.documentRef.getDocument()`. The 17 subclasses call the inherited methods as `get(.userDevice(userId: userId, deviceId: deviceId))`, `super.documentSnapshotListener(.userDevice(…))` or `firestoreService.collectionSnapshotListener(…)`.
- **Call-site count differs from the spec.** The spec says "about 177 calls". Existing `call_expression` facts (their `arguments` already hold the raw text, e.g. `.userDevice(userId: userId, deviceId: deviceId)`) give **61 call sites** with a path-enum case argument (64 regex hits minus 3 `container.decode` false positives), across **exactly 17 classes** (`OSKCKUserService` 8, `OSKCKUserDeviceService` 7, six with 6/6/6/5/5/4 … 1 each; one is `OSKCKUserActivity`, a model not a service). All 67 calls to the service verbs (`get`/`getAll`/… bare, `super.` or `firestoreService.`) are accounted for except 6 whose argument is not an enum case (to be reported by reason). The 177 is not reproduced; I will report the real figure and not pad to it.
- **iOS does not call Firestore paths directly.** `ios-oskey-dev@e660bda2`: 4 files `import FirebaseFirestore` (`DefaultInvitationRepository`, `DefaultActivityRepository`, `DefaultPincodeRepository`, `OSKNotificationViewModel`) plus `OSKAppDelegate`, whose only direct API use is `Firestore.firestore().settings = …` (line 155). No `.collection(`/`.document(`/`addSnapshotListener`/path string anywhere. **iOS gets no client path facts**; it reaches Firestore only through swift-cloud-kit (already linked by `PACKAGE_SYMBOL_USE`). Nothing invented.
- **Source quirks the template extractor must handle (real, in the enums):** (1) `userActivity` has no leading `/` (`"users/\(userId)/activityAggregates/\(buildingId)/activities"`); (2) `Document.userBuildingAccesses` is declared `(userId, buildingId)` but the switch binds `(userId, accessId)` positionally and the path says `accesses/\(accessId)`; (3) `Document.userNotification` binds with labels (`userId: userId, notificationId: notificationId`) and `Collection.userNotifications` binds `userId: userId`; (4) `Document.userStatus` uses `\(userId)` twice; (5) two case names exist in both enums (`userBuildingAccesses`, `userInvitations`). For 5: `userBuildingAccesses` differs by arity (1 vs 2), but `userInvitations(userId:)` is identical in both with the same template `/users/{userId}/invitations`; whether it is a collection or a document is then decided by the called method's overload (`getAll` → collection), else recorded `pathKind: null` with a reason.
- **Existing extractor:** `swift-extractor/Sources/swift-extractor/main.swift:287` `EnumCaseDeclSyntax` records `name`, `rawValue`, `associatedValues` (types only); nothing reads a computed property's `switch`. The binary was built 2026-09-10 (`.build/release/swift-extractor`, 18.9 MB); installed toolchain Apple Swift 6.4, arm64.
- **Firebase's existing `firestore_path_touched` evidence** (for the shared shape): `value` (template with `{roleId}`), `operation` (`get`/`set`/`delete`/null), `touchType`, `pathResolutionMethod`, `operationDetectionScope`, `module`, `submodule`, `path` (file), `line`. Leading `/` on `value`.
- Live DB: swift-cloud-kit has 857 `call_expression`, 42 `enum_declaration`, 34 `firebase_callable_call`, 0 Firestore path facts. `swift-ai-kit-oskey-io` has a clone but no facts in the DB (not in this lane's scope; noting it).

**PROPOSAL 1 (extractor binary, additive, needs approval).** In `main.swift`, add a visitor that, for **any** enum with a computed `String` property whose body is `switch self` with one literal per case, records per case `computedStrings: [{property, template}]`, where `template` is the literal with each `\(x)` replaced by `{name}`, `name` taken from the declared associated-value label at that position when the switch binds positionally (`{buildingId}`, not `{accessId}`, when they disagree; the source spelling is kept in `rawTemplate`). No enum or property names hardcoded. Existing `cases[{name, rawValue, associatedValues}]` untouched. The 01 script then keeps `computedStrings` on the fact **only for enums that are Firestore path enums, detected structurally** (a sibling property whose body calls `Firestore.firestore().collection(...)`/`.document(...)` with that string), so no other enum fact in any of the 5 repos changes (expected: existing fact IDs and descriptions identical everywhere; the pre-sync gate proves it on all five).

**PROPOSAL 2 (new fact kind and shared payload for W4b + W4c; per the lane rules Lane B adopts it unless it objects in writing).**
New kind **`firestore_client_call`** (not a reuse of `firestore_path_touched`: the Firebase join and the wiki read that kind by name and its meaning is "server-side code touches a path"; a new kind cannot pollute them). Evidence fields, additive names taken from the Firebase fact where the meaning is the same:
- `value` path template, always with a leading `/`, `{param}` placeholders (Angular `{param}` from its own path segments); `rawTemplate` original spelling
- `side: "client"`, `platform: "swift"` (W4b: `"angular"`)
- `pathKind`: `collection` | `document` | `null` (+ `pathKindReason` when null)
- `operation`: `get` | `set` | `update` | `delete` | `listen`; `sdkCall`: the SDK method it was derived from (`getDocument`, `getDocuments`, `addSnapshotListener`, `addDocument`, `setData`, `delete`, `whereField`…). The operation is **derived from the body of the wrapper method** (the SDK call applied to `<param>.documentRef/collectionRef`), not from a hand-typed method-name table; a subclass call resolves to its base method by name, and an overload set with different operations records `operation: null` + reason.
- `pathResolutionMethod`: `resolved_enum_template` | `unresolved` (+ `unresolvedReason`)
- `pathSource: {enum, case}`, `pathArguments` (raw text of the case arguments)
- `file`, `line`, `callerClass`, `callerFunction`, `module`
- Non-enum path arguments or an unmatched case are emitted as `unresolved` with a reason, never dropped.
Also each path enum case's template is on the existing `enum_declaration` fact (`cases[].computedStrings`), so all 32 cases have a template independent of call sites.

**Expected result if approved:** every case of both enums has a template (32/32); ~61 `firestore_client_call` facts in swift-cloud-kit (17 classes), every one with a template and operation or a stated reason; iOS/ui/ble/webrtc unchanged; edges for these facts belong to Lane A (W4d).

**Plan once approved (in this order, stopping at READY TO SYNC):** (a) build the binary change and test it against the two enum files only (bounded, before/after diff of `ast-enums` output); (b) `swift build -c release` and diff the raw output for all 5 repos against the current run's (expect only the additive field, or nothing); (c) implement the 01/02 script changes, `pipeline:<repo>` extraction into `output/` for swift-cloud-kit; (d) run the pre-sync fact-ID gate on all five and append `READY TO SYNC` with the numbers and the embedding estimate (about 61 new facts, ~95 tokens each, ~5.8k tokens: flagged before any `EMBED=true`). No sync, no edge builder, no schema change from this lane outside a granted write turn.

**Questions for the user:** (1) approve Proposals 1 and 2 as written, or change them? (2) new kind `firestore_client_call` vs reuse of `firestore_path_touched`: I recommend the new kind. (3) OK to start extraction runs for the Swift repos (writes only under `output/`, no spend)? Upstream check is not applicable to the pinned-commit Swift kits (the scan re-clones the pinned commit), but I will verify the pinned commit still resolves before running.

### 2026-09-26: [Lane B] W1 extraction part: investigation and proposals (nothing built, no write, no extract run)

Session: Lane B (Firebase + Angular). The lane prompt `prompts/prompt-8b-lane-firebase-angular.md` does not exist yet; I followed prompt-8's per-item procedure and this doc's lane model. No `git add`/`git commit`.

**Upstream check (safeguard 3): MOVED.** `git ls-remote firebase-oskey-dev refs/heads/staging` = `73ea6997…`; the current run and `output/clones/firebase-oskey-dev` are at `00e1d9fd`. Any re-extract re-clones the head, so it would pull in unrelated upstream changes and blur the pre-sync ID gate. Stopped; waiting for the user's decision (see questions in the session reply).

**Verified (read-only, live DB + clone at `00e1d9fd`).**
- `functions/src/index.ts` (214 lines) has 11 live `export const <group> = { ...<alias>.<factory>(builder) }` groups (acd, building, call, core, organization, settings, user, unit, admin, supplier, tasks); the rest is commented-out legacy. `admin` is a named import, `tasks` a relative import (`./modules/tasks`); the others are `import * as x from '@oskey/...'`.
- **Group → module is derivable from the code, not a hand table:** the specifier resolves through `functions/tsconfig.json` `paths` (ts-morph resolves it). `unit` ← `@oskey/unit/management` → `src/modules/unit_management` (module `unit_management`, which is why `unit-*` calls miss today). Every module holding callables maps to exactly one group (12 modules with `api_contract`; `apps` has none and no group), so `<group>-<callableExportName>` is unique per module; 5 export names repeat across modules (`createBuildingSettings`, `createUserSettings`, `getActivityById`, `getAllOrganizations`, `removeInhabitantFromUnit`), so the group prefix is what disambiguates them.
- Modules today: 12 (`access_control_device` 521 facts … `user` 2,992; `unit_management` 556). Scan (`00-scan-repo.ts:233-325`) only walks directories under `modulesRoot`; `files.json` `module` drives everything (`01-extract…:552` `fileToModuleMap`, `02-build-module-evidence.ts:372…` per-module filters, `modules.json` iterated by steps 02–07 and by sync).
- **Decorators are already extracted as `call_expression` facts:** 139 `OSKUserSecurityChecks` (options in `evidence.arguments`: 111 × `{ checkUserIdMatch: false }`, 28 × none) + 1 `OSKVerifyAccessValid`, all `resolutionStatus: resolved`. **But `declarationFile` is the importing file itself** (936 of 5,832 resolved calls have `declarationFile == file`), because `01-extract…:~929` takes the declaration of the *alias* symbol (the `ImportSpecifier`); `getAliasedSymbol()` is called but only its name is kept. So no fact ties an application to `functions/src/decorators/*.ts`. (This alias gap also matters for Lane A's W6.)
- `errors_helper.ts` `OSKLogAndError`: used via `new`, not a call expression, so no `call_expression` fact; `import` facts to it are `resolved_outside_module_boundary` (80).
- **Blast radius on existing facts of adding the roots:** 249 `imports_dependency` facts point at `@oskey/utils/*` or `…/decorators/*` and are `resolved_outside_module_boundary` today (errors_helper 80, https-response 72, security_check 50, securityChecks ~40, dates 6). With the files in scope they become `resolved_in_repo` with a `resolvedTargetModule`: same fact IDs (ID = type|module|path|key, module of the importing file unchanged), but payload and `descriptionFor` text change (~249 re-embeds, about 24k tokens at ~95/fact). Step 06 (cross-module graph) gains edges into the new modules. Lane A note: the `INTRA_REPO_CALL` builder will see calls into these modules resolve after the change (W6's "security 204 / logging 152 / core utilities 188" buckets overlap).
- Also seen while reading (W4a, not done): `01-extract…:1116` `firestorePath: firestorePath || "unknown"` after `resolveExpressionValue(arg0)`.

**Proposals awaiting approval (nothing written):**
1. **Config:** `additionalSourcePaths` on the firebase entry in `config/repos.json`: `[{path, module}]`, three entries: `functions/src/index.ts` → `entrypoint`, `functions/src/utils` → `utils`, `functions/src/decorators` → `decorators` (a file or a directory; `.ts` discovered recursively with the same exclusions; submodule null; fail-closed if a `module` name collides with a `modulesRoot` directory or a path is missing).
2. **New fact kind `export_registry_entry`** (module `entrypoint`, one per live spread entry of an exported group): `symbolName` = group; evidence `exportGroup`, `spreadIndex`, `factoryCall`, `factoryQualifier`, `importSpecifier`, `resolvedTargetFile`, `resolvedTargetModule`, `resolvedTargetSubmodule`, `resolutionStatus`. Derived by AST walk over `index.ts` exported object-literal spreads plus ts-morph specifier resolution, then `fileToModuleMap`. Anything unresolvable is recorded with a reason.
3. **`api_contract` additive fields** `evidence.exportGroup` and `evidence.clientFunctionName` (`<group>-<callableExportName>`; null plus `evidence.clientFunctionNameStatus` reason when the module has no group, more than one, or no export name). `value` and `callableExportName` untouched.
4. **Alias-resolved declaration, additive, on `call_expression`:** `aliasedDeclarationFile`, `aliasedDeclarationLine`, `aliasedDeclarationClass`, `aliasedDeclarationMethod`, set only when `getAliasedSymbol()` yields a declaration. Existing `declarationFile` etc. keep their values (so the 936 self-pointing facts stay as they are, with the truth added beside them).
5. **Interface requests to Lane A (not edited by Lane B):** (a) `firebase-callable` join resolves `<group>-<export>` via `clientFunctionName`, keeping the compound key and fail-closed duplicate check; (b) `sync-facts.ts` `descriptionFor` needs an `export_registry_entry` section, otherwise it gets the bare "{kind} in {module}: {symbol}" floor.
- 2026-09-26 (coordinator, session-map correction; supersedes the line above): Lane A = session `LANE A` [40ba29] (the old `-29`); Lane B = session `level-5-engineering-knowledge-8f` [6744e5] (unnamed, to be confirmed by the user); Lane C = session `LANE C` [7015db]. All three are idle and have done **read-only investigation only**. Lanes B and C started from the lane table before `prompt-8b`/`prompt-8c` existed and must re-read them. Verified: live DB unchanged from the baseline (69,215 facts, 17,775 edges, no new tables or runs), no code changed. **No write turn open.**

### 2026-09-26: [Lane B] W1 extraction part: BUILT, extracted at the pinned commit, pre-sync gate run. READY TO SYNC (blocked on prerequisites listed at the end)

Approvals (proposals 1-5 and the upstream decision) were relayed by the coordinator (session `-47`) from the user. No `git add`/`git commit`. Database **not written** (verified after extraction: firebase 15,259 facts, total 69,215, edges 17,775, current firebase run still `20260911_080454-00e1d9fd`). No spend, no LLM, no `gcloud`.

**Corrections to my earlier Lane B entry (measured against the source, not memory).** `@OSKUserSecurityChecks` is applied **138 times in 40 files** in `functions/src/modules` (matches the wiki; the spec's 140/41 is off) plus **1** `@OSKVerifyAccessValid` = 139 decorator `call_expression` facts (not 139 + 1). Options: 108 × `{ checkUserIdMatch: false }`, 30 × none (I wrote 111/28). And the "936 self-pointing" figure: `declarationFile == file` holds for 936 resolved calls, but only **243** of the 957 in the new run are import aliases (the other ~714 are legitimately same-file declarations), so the alias gap is 243 facts, not 936.

**Code changes (all in Lane B files).**
- `config/repos.json` firebase entry: `branch` replaced by `commit` = `00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3` (exactly one of the two is allowed), plus `additionalSourcePaths` = `functions/src/index.ts` → `entrypoint`, `functions/src/utils` → `utils`, `functions/src/decorators` → `decorators`.
- `00-scan-repo.ts`: scans `additionalSourcePaths` (file or directory, same `.ts` filters, submodule null); fail-closed on malformed entry, path escaping the repo, missing path, an entry contributing zero files, a module name colliding with a `modulesRoot` directory, or a file claimed twice; adds the modules to `modules.json`.
- `01-extract-ast-evidence.ts`: (a) pre-pass building the export registry: exported object literals whose properties spread call results, in files belonging to an `additionalSourcePaths` module only; import resolved by ts-morph then `fileToModuleMap`; writes `ast-export-registry.json` (added to the manifest as required). (b) `api_contract` gets `evidence.exportGroup`, `clientFunctionName`, `clientFunctionNameStatus`. (c) `call_expression` gets `aliasedDeclarationFile/Line/Class/Method` (null unless `getAliasedSymbol()` has a declaration).
- `02-build-module-evidence.ts`: new kind `export_registry_entry` (ID `export_registry_entry|<module>|<file>|<group>|<spreadIndex>`); count in the module summary. Steps 03-07 needed no change (05 partitions by submodule generically).

**Run:** `20260926_073212-00e1d9fd` at `00e1d9fd`, `npm run pipeline:firebase`, exit 0. **No parse errors** (`ast-errors.json` empty; tolerance stays 0). Scan: index.ts 1 file, utils 4, decorators 2. Only warning: the existing `UNRESOLVED_CALLS_WARNING` (22).

**Pre-sync ID gate (read-only, new run capability packs vs `facts.fact_id`, firebase):**

| | count |
|---|---|
| DB facts / new-run facts | 15,259 / 15,442 |
| **identical IDs** | **15,259** (all) |
| **new** | **183** = entrypoint 68, decorators 35, utils 80 (call_expression 86, imports 33, export_registry_entry 19, class_method 19, model_property 6, source_file 7, source_class 5, permission_error 4, function_declaration 2, type_alias 2) |
| **would be pruned** | **0** |

For the 15,259 identical IDs (payload compared field by field): every fact's `runId` changes (expected, new run) and nothing else changes except:
- **249 `imports_dependency`**: `resolvedTargetModule` and `importResolutionStatus` change from `resolved_outside_module_boundary` to `resolved_in_repo` (target `utils` / `decorators`); their description gains "-- resolves to: utils (resolved_in_repo)". **249 description changes, as predicted.**
- **2 `model_property`** (organization intercom communication model, `Message.type`): `propertyType` union order flips (`"intercom" | "push"` → `"push" | "intercom"`), which changes the description. Not caused by a rule I wrote; my hypothesis (unverified) is TypeScript's union ordering depending on type-creation order, which shifts when more files are in the program. Flagging it as 2 extra re-embeds.
- **Additive keys only otherwise:** `api_contract` +`evidence.exportGroup/clientFunctionName/clientFunctionNameStatus` on all 256; `call_expression` +`evidence.aliasedDeclarationFile/Line/Class/Method` on all 6,655.
- **Condition confirmed: the alias fields change no `call_expression` description.** Description changes by kind: `imports_dependency` 249, `model_property` 2, `call_expression` 0. (Measured with the live `descriptionFor` from `sync-facts.ts`.)

**Embedding estimate (flag, nothing run):** 183 new + 251 changed = **434 facts, about 41k tokens** at ~95/fact. The 19 `export_registry_entry` descriptions are the bare floor until Lane A adds a `descriptionFor` section; the count does not change when it does, only their text. Re-run the gate after Lane A's change lands (script kept in the session scratchpad, outside the repo).

**Acceptance checked against the new run (read-only):**
- Registry: 19 entries in 11 groups (acd 2, admin 1, building 2, call 1, core 3, organization 1, settings 2, supplier 1, tasks 1, unit 1, user 4), all `resolved_in_repo`, none unresolved. `unit` → `@oskey/unit/management` → module `unit_management`; `tasks` → relative `./modules/tasks`; `admin` from a named import. `apps` has no group (and no callables).
- `api_contract`: **256 of 256** have group and client name (`clientFunctionNameStatus` = `resolved`), incl. 3 http (`call`, `core`, `tasks`); zero duplicate client names; the 5 export names that repeat across modules are now distinct (e.g. `admin-getAllOrganizations` vs `organization-getAllOrganizations`); `unit_management` gives `unit-createUnitInvitation`, `unit-getUnitPerson`, `unit-removeInhabitantFromUnit`, … (10). `value` and `callableExportName` unchanged.
- Decorators: all 139 applications now carry `aliasedDeclarationFile` = `functions/src/decorators/securityChecks.ts` (138, method `OSKUserSecurityChecks`) and `.../accessChecks.ts` (1, `OSKVerifyAccessValid`). The definitions are facts in module `decorators` (2 `function_declaration`; the options interface's `checkUserIdMatch` appears as a `model_property`, `OSKUserSecurityChecksOptions.checkUserIdMatch`). `errors_helper` comes through as class `OSKLogAndError` in `utils`; `utils` also has `OSKSecurityChecks`, `OSKDatesHelper`, `OSKHttpsErrorResponse`, `OSKHttpsSuccessResponse`.
- Alias coverage: 243 of 6,741 call facts have alias fields; 8 of them resolve into `node_modules` and carry a `../../../node_modules/...` style path (same style the existing `toRepoPath` already gives outside-repo declarations).
- New file roots add exactly the expected files (7) and no existing module's fact count changed (all 12 identical).

**Consequences for Lane A (edges).** Nothing in the DB changed, so no edge is stale yet. After sync: (1) the `firebase-callable` join can resolve `<group>-<export>` via `evidence.clientFunctionName` (unique across all 256; keep the compound key and duplicate check); expected effect per spec: the 7 `unit-*` swift-cloud-kit calls resolve; (2) `INTRA_REPO_CALL` rebuild will see calls into `utils`/`decorators` resolve; W6's 2,141-missing buckets partly overlap; (3) `firestore-trigger`/`pubsub-binding` inputs are unchanged by this item.

**READY TO SYNC: not yet grantable. Open prerequisites:** (a) `[Lane A] W5a DONE` in this Build log (not present at the time of writing); (b) Lane A adds the `descriptionFor` section for `export_registry_entry` and the join change (interface requests logged in the proposal above); (c) coordinator grants a write turn via the user; (d) `pg_dump` before the sync (`facts_index-<date>-before-W1.dump`), sync firebase with `EMBED` off, then the embedding go-ahead for the ~434 facts (~41k tokens) from the user, then `pipeline:edges`. The upstream pin stays; advancing the commit is a separate step with its own gate.

### 2026-09-26: [Lane A] W5a/W5b BUILT and dry-run verified; NOT yet run for real (needs a write turn). `pipeline:edges` exists as code; the `[Lane A] W5a DONE` line follows the first real run

Session `-29`, Lane A. Proposals approved by the user (relayed by the coordinator, session `-47`) with the coordinator's amendments; the user then said "proceed". No `git add`/`git commit`. **No database write has been made** (`edge_sync_state` does not exist yet; edges still 17,775; the only DB access this entry was read-only queries and `--dry-run`).

**Fingerprint proof (amendment 1), read-only, before relying on it.** Fingerprint of a repo = `md5(string_agg(fact_ref || ':' || md5(payload minus top-level runId/generatedAt minus evidence.runId/evidence.generatedAt), ',' ORDER BY fact_ref))`. Computed with the same SQL over (a) the live `facts` rows and (b) the on-disk capability packs of two same-commit runs:
- angular: live `9a2823dfcd41294ae21b292fb79c0093` (8,747 facts); run `20260911_092322-8345d222` packs `9a2823df…` (8,747); run `20260923_110233-8345d222` packs `9a2823df…` (8,747). **All equal.**
- node-iot: live `7d0c7d687479d728e134420b017956b4` (1,432); runs `20260911_080505-a6cba122` and `20260923_110250-a6cba122` both `7d0c7d68…` (1,432). **All equal.**
- The same rows unstripped give angular `51abcf88…`, so the stripping is what makes two extractions comparable, and top-level `runId` is on 8,747/8,747 angular facts (`evidence.runId` on 8,047). No `generatedAt` key is present in the facts (0/8,747 top-level, 0 in evidence); it is stripped anyway as the amendment says.
- A "two no-op syncs" test on the live DB itself is not possible without a write, so it is proven this way (same commit, two independent extractions, plus live) and will be re-shown after the first real run (state recorded, then a second `pipeline:edges` leaves every slice `ok`).

**What was built (all in Lane A's files, plus one config key).**
- `pipeline/facts-postgres-index/_shared/edge-sync-state.ts` (new): fingerprints, slice markers, `recordEdgeSyncState`, `evaluateSlices`, `printEdgeSyncReport`. Slice = `(connection_type, source_repo)`; inputs = source repo plus the target repos of its edges; status `ok` / `STALE` (an input's fingerprint differs) / `UNRECORDED` (no state row, or edges rebuilt after the state was recorded = a hand-run builder). **Known limit:** a slice whose edges are all `unresolved` to `unknown` depends on its source repo only (e.g. `PUBSUB_TOPIC_BINDING / firebase-oskey-dev`), so a change in a repo it could newly resolve against is not flagged for that slice; every real run of `pipeline:edges` rebuilds all joins anyway.
- `pipeline/facts-postgres-index/edge-sync-state.sql` (new; same DDL appended to `schema-proposal.sql`): additive table `edge_sync_state`, PK `(connection_type, source_repo)`, columns `built_at, synthesis_id, facts_run_id, edge_count, resolved_count, dangling_source, dangling_target, inputs jsonb`. **Not applied.**
- `pipeline/facts-postgres-index/build-edges.ts` (new) + `package.json` script `pipeline:edges`. Steps `intra` (per eligible repo, discovered from `extraction_runs`), `cross` (all joins), `lineage`; flags `--repos=`, `--steps=`, `--dry-run`, `--accept-shrink`, `--fail-on-stale`. Fingerprints and slice markers are taken before the builders run and re-checked after; state is recorded only for slices whose edges were actually rewritten and only if no fact set moved during the run. FIELD_BINDING count is checked before/after the lineage builder (which deletes and re-inserts without a transaction; not changed, as specified). The lineage step is not run in `--dry-run` (that builder has no dry run).
- `build-intra-repo-edges.ts` v1.1.0: default-off `--dry-run`, `--accept-shrink`, and a **shrink guard** (aborts, nothing changed, if the slice total or the resolved/confirmed count would fall), plus a comparison line (existing vs new counts, and how many source fact IDs are identical / only-old / only-new). Also: the BEGIN/COMMIT now run on one dedicated client (before, `db.query('BEGIN')` on a Pool could land on different connections). No edge logic changed.
- `build-cross-repo-edges.ts` v1.8.0: coverage-summary section 3 now prints the edge-sync report instead of the timestamp comparison; new `--no-summary` and `--summary-only` (no joins, no writes). Join behaviour untouched.
- `config/repos.json`, node-iot entry only: `intraRepoEdges: { enabled: false, reason }` (amendment 2). Lane B's uncommitted edits to the firebase entry were present and are untouched.

**Dry run of everything (`npm run pipeline:edges -- --dry-run`, exit 0, nothing written; edges still 17,775):**
- Eligible for intra: android, angular, firebase, ios, swift-ble/cloud/ui/webrtc (all 8 have a graph whose runId equals the current run). node-iot: skipped with the config reason, and its graph still has 0 confirmed/probable edges.
- Intra slices, existing → new (all equal in size, no shrink): android 3,716 → 3,716; angular 346 → 346; firebase 2,363 → 2,363; ios 8,734 → 8,734; swift-ble 245 → 245; swift-cloud 510 → 510; swift-ui 625 → 625; swift-webrtc 651 → 651.
- **Source fact IDs (acceptance):** firebase 2,363/2,363 identical; angular 346/346 identical; android 3,716/3,716 identical; **ios 8,734/8,734 identical**; swift-cloud 510/510 identical. **Changes: swift-ble 6 (all 6 old IDs no longer in `facts`), swift-ui-kit 108 (108/108 no longer in `facts`), swift-webrtc 37 (37/37)** = exactly the 151 dangling `INTRA_REPO_CALL` edges, so a real run clears them (W5c's goal reached early, as predicted). No other ID changes anywhere.
- Cross joins: every slice reproduces existing → new with identical counts and status splits (HTTP_API_CALL angular 102 (97/5), swift-cloud-kit 34 (24/10), android 5; PUBSUB 14 / 2 / 9; PACKAGE_SYMBOL_USE 389; FIRESTORE_EVENT_TRIGGER 17).
- Coverage summary now reads the state table; because it does not exist yet, all 17 slices print UNRECORDED (no false STALE).

**Still to do for W5a (needs a granted write turn; nothing below has been run):** fresh dump; a scratch-database exercise of the shrink guard, of a changed-fact-set STALE and of idempotency (a separate database in the same container, restored from the dump and dropped afterwards, `facts_index` untouched); apply `edge-sync-state.sql`; staged first real run: Firebase intra (`--steps=intra --repos=firebase-oskey-dev`), then the rest; then acceptance checks (17,775 total; dangling 151 → 0; no false STALE; FIELD_BINDING 13; cross and lineage slices fingerprint-identical to `43-baseline-before-2026-09-26.json`; second run leaves the table identical).

### 2026-09-26: [Lane C] W4c BUILT and extracted (files only); READY TO SYNC. Nothing synced, no edge builder run, no schema change, no DB write. No `git add`/`git commit`.

Proposals 1 and 2 approved via the coordinator (session -47). Session `1eab3d42`.

**Corrections to my own earlier entry.** The "61 call sites" figure was an undercount from a regex that missed 3 multi-line calls (`create(<big constructor>, atPath: .userX(...))`, in `OSKCKUserAccessInvitationService:124`, `OSKCKUserDeviceService:112`, `OSKCKUserFriendRequestService:103`; each confirmed in source). The real figure, from the new extractor and cross-checked line by line against source, is **65 call sites in 16 classes: 64 resolved, 1 unresolved** (the spec's "about 177" is still not reproduced). The 17th class in the earlier count was a false positive of the same regex.

**What changed (all inside Lane C's files).**
- `pipeline/swift/phase-01-ast-extraction/swift-extractor/Sources/swift-extractor/main.swift`: additive visitor; `EnumCaseFact.computedStrings[{property, template, rawTemplate, reason}]`, omitted when absent. Binary rebuilt with `swift build -c release` (Swift 6.4, SwiftSyntax 603.0.2, 129 s).
- `pipeline/swift/phase-01-ast-extraction/_shared/firestore-client-calls.ts` (new): discovers path enums (a computed-string enum whose sibling property passes it to `Firestore.firestore().collection/.document`), wrapper methods (bodies touching `<x>.<refProperty>`), derives the operation from the SDK calls in the wrapper body, and emits the call facts. No enum, case, path or method name is hardcoded; the only fixed table is the Firebase SDK's own verbs (`getDocument`/`getDocuments` -> get, `addSnapshotListener` -> listen, `addDocument`/`setData` -> set, `updateData` -> update, `delete` -> delete).
- `01-extract-ast-evidence.ts`: runs the analyzer, writes `ast-firestore-client-calls.json` (manifest `firestoreClientCalls`, required), and keeps `computedStrings` only on path enums.
- `02-build-module-evidence.ts`: new fact type `firestore_client_call` (`EXPECTED_EVIDENCE_TYPES`, summary count `firestoreClientCalls`). ID = `firestore_client_call|<module>|<file>|<Class>.<method>|<wrapper>:<case>|#n`.

**Bounded test, before/after of the binary's raw output, all five repos** (old binary copy vs new, same clones at the current runs' commits; the old binary is deterministic, run twice identical): everything except the new field is byte-identical for all 5. The new field appears on 32/32 cases of the two path enums (swift-cloud-kit) and on 13 cases of 4 unrelated UI enums in ios (`CallMode`, `OSKLanguages`, `AlertType`, `OSKToastAlertType`), which step 01 drops because they are not Firestore path enums. ui/ble/webrtc: no change. All 32 templates checked by eye against source, including `userActivity` (no leading `/` in source; the fact value adds it, `rawTemplate` keeps the source) and `userStatus` (`{userId}` twice).

**Extraction (files only, no spend)** all exit 0: swift-cloud-kit `20260926_073744-32772e4a`, swift-ui-kit `…073755-9a75c7c6`, swift-ble-kit `…073758-f8cdf199`, swift-webrtc-kit `…073801-e8aeea9d`, ios `20260926_073857-e660bda2` (upstream `git ls-remote … master` = `e660bda2…`, unchanged). The four kits are pinned commits, so no upstream check applies; each new run has the same commit as the run currently in the DB. Run directories are per run, so the DB-current runs' directories (used by `build-intra-repo-edges.ts`) are untouched; **`output/<repo>/run-context.json` now points at the new runs, so a `sync-facts` run will load them.**

**Pre-sync fact-ID gate, all five repos** (new run's capability-pack facts vs live `facts`; descriptions computed with the real, exported `descriptionFor`; payload compared key by key, order-insensitively):

| repo | new-run facts | DB facts | IDs identical | new | would-be-pruned | description changed | payload differences |
|---|---|---|---|---|---|---|---|
| swift-cloud-kit | 2,587 | 2,522 | 2,522 | **65** (`firestore_client_call`) | 0 | 0 | `runId` on all; `computedStrings` on the 2 path-enum facts |
| swift-ui-kit | 2,482 | 2,482 | 2,482 | 0 | 0 | 0 | `runId` only |
| swift-ble-kit | 799 | 799 | 799 | 0 | 0 | 0 | `runId` only |
| swift-webrtc-kit | 2,487 | 2,487 | 2,487 | 0 | 0 | 0 | `runId` only |
| ios | 25,458 | 25,458 | 25,458 | 0 | 0 | 0 | `runId` only |

Consequences: no fact ID changes, so no embeddings lost and **no edge's source/target ID changes**; 0 facts pruned; only the 65 new facts need embedding.

**Embedding estimate (flag before any `EMBED=true`; needs the user's go-ahead):** 65 facts. Project rule of thumb (~95 tokens/fact) = **about 6,200 tokens**; the current default description is 157 characters on average (10,177 in total, about 2,600 tokens), but Lane A's richer `descriptionFor` for this kind (operation, side, path kind) will lengthen it, so plan for up to about 10,000 tokens. Negligible cost either way.

**Sample new fact** (`evidence`): `value` `/users/{userId}/accesses/{accessId}/invitations`, `rawTemplate` `/users/\(userId)/accesses/\(accessId)/invitations`, `side` `client`, `platform` `swift`, `pathKind` `collection`, `operation` `listen`, `sdkCall` `addSnapshotListener`, `wrapperMethod` `collectionSnapshotListener`, `pathResolutionMethod` `resolved_enum_template`, `pathSource` `{enum: OSKCKFirestoreCollectionPath, case: userAccessInvitations}`, `pathArguments`, `callerClass`, `callerFunction`, `file`, `line`. Its default description today is `firestore_client_call in OSKCloudKit: <path> (<file>:<line>)`, with no operation: **Lane A's `descriptionFor` support for this kind must exist before the sync**, as the coordinator noted.

**Numbers for the new facts (swift-cloud-kit).** Operations: get 28, listen 23, set 10, delete 4; `update` wrappers show as `set` (they call `setData`), with `wrapperMethod` recording the name. `pathKind`: document 36, collection 28, null 1 (the unresolved one). Resolved `resolved_enum_template` 64; unresolved 1: `OSKCKUserBuildingSettingsService.swift:42`, `documentSnapshotListener(path)` where `path` is a local `let path = OSKCKFirestoreDocumentPath.userBuildingSettings(...)`; local bindings are not tracked, so it is recorded unresolved with that reason (its operation, `listen`, is still known). A subclass's own overload (`get(deviceId, userId:)` in `OSKCKUserDeviceService.deviceExists`) is deliberately not reported. No case is ambiguous between the two enums for any call site (`userBuildingAccesses` is separated by arity; `userInvitations` never occurs with a method that accepts both). Every one of the 32 enum cases has a template (32/32).

**iOS, honestly:** `ios-oskey-dev` has no direct Firestore path calls; 4 files `import FirebaseFirestore` and `OSKAppDelegate.swift:155` sets `Firestore.firestore().settings`, nothing else. It reaches Firestore only through swift-cloud-kit services. No iOS facts were invented; the gate shows ios unchanged.

**Probable client bug, for the wiki team.** In `OSKCKFirestoreDocumentPath.userBuildingAccesses` the case is declared `(userId, buildingId)` but the `string` switch binds the second value as `accessId` and the path segment is `accesses/\(accessId)`. The only document-path call site (`OSKCKUserBuildingAccessService.swift:64`) passes `buildingId: buildingId`, so a building id is used as the access-document id. This is correct only if access documents are keyed by building id; otherwise it is a naming or logic bug. The fact's `value` uses the declared label (`/users/{userId}/accesses/{buildingId}`) and `rawTemplate` keeps the source spelling, so a consumer can see both. Firebase's side (which id keys `users/{uid}/accesses/{id}`) is not verified here.

**W5c (151 dangling `INTRA_REPO_CALL`), verified read-only.** All 151 are edges whose `source_fact_id` is not in `facts` (ui 23 probable + 85 unresolved, webrtc 37, ble 6; 0 dangling targets). Every fact ID in the new runs exists in the DB, so a rebuild of those slices from the new runs (`pipeline:edges` after the sync, Lane A) should reference only existing source IDs. Not yet run; the acceptance check is dangling = 0 after that rebuild.

**Cleanup.** Scratch scripts and raw before/after JSON were in the session temp dir and are deleted; the only files left are the ones listed under "What changed".

**Request:** write turn for the sync of swift-cloud-kit (65 new `firestore_client_call` facts; `EMBED` off first, then flagged), and the sync of the four other repos (`run_id` and `payload.runId` update only, 0 embedding impact), then `pipeline:edges` with Lane A. Blocked until `[Lane A] W5a DONE` and Lane A's `descriptionFor` support for `firestore_client_call`; the last line of the Write-turn log must be a RELEASED line.

### 2026-09-26: [Lane A] `descriptionFor` for the two new fact kinds (code only; nothing synced, no embedding spend)

`sync-facts.ts` v1.1.0: two new branches in `descriptionFor`, each firing only for its own kind, so no existing fact's description can change. Built from the fields the lanes' extractors emit today (Firebase `02-build-module-evidence.ts` step 12c, Swift `02` step 13; Angular W4b uses the same `firestore_client_call` shape, per the shared contract), reading `fact.x ?? fact.evidence?.x`, skipping absent fields, inventing nothing.
- `export_registry_entry`: `-- deployed function group '<group>': clients call its functions as '<group>-<name>' -- built by <factoryCall> from '<importSpecifier>' -- resolves to module: <module>[/<submodule>]` (or `-- module not resolved (<status>)`). The symbol is `value` (= the group), which `symbolNameFor` already picks up.
- `firestore_client_call`: `-- <side> (<platform>) Firestore <operation|access> [via <sdkCall>] on <collection|document> path -- path enum case: <enum>.<case> -- called from: <Class>.<function>`, plus `(operation not determined: <reason>)` and `-- path unresolved: <reason>` where present. The path template is already the symbol (`value`).
- **Regression check (before and after the edit, read-only): the function reproduces the stored `description` of all 69,215 live facts exactly (0 differ)**, so no existing fact is re-described and none would be re-embedded. The two branches were exercised on hand-built facts shaped like the lanes' output (resolved and unresolved variants of both kinds); output reads correctly. Lanes B and C can therefore sync these kinds with a real description once W5a's real run is done; any field they rename must be told to Lane A.
- Not done here: `firestore_path_touched`, `firestore_trigger` and `external_hook` still get the bare floor description (unchanged, out of scope).

### Coordinator note 2026-09-26: write-turn grant and spec corrections (append-only; original spec text above is left intact)

- **WRITE TURN GRANTED: Lane A W5a** (exclusive; Lanes B and C wait). Coordinator preconditions verified read-only: live DB at baseline (69,215 facts, 17,775 edges, no new tables, last write 2026-09-25), no active queries, existing dump `facts_index-2026-09-26-before-W5a.dump` is still current. The container also holds `facts_index_prebuild` (a 2026-09-22 snapshot from another session, docs 41/42); leave it alone.
- **Next turns, in order:** Lane B (W1 sync, firebase), then Lane C (W4c sync, five Swift repos), each after `[Lane A] W5a DONE` and after Lane A's `descriptionFor` change has landed and each lane has re-run its gate.
- **Spec corrections from the lanes' measurements (supersede the spec text):** decorator counts are `@OSKUserSecurityChecks` 138 applications in 40 files plus 1 `@OSKVerifyAccessValid` (Lane B, source count; the spec's 140/41 was a call-fact count that included both). The "936 self-pointing" alias figure is really 243 import-alias facts (the other ~714 are legitimate same-file declarations). W4c's "about 177 calls" is **65 `firestore_client_call` sites across 16 classes in swift-cloud-kit (64 resolved, 1 unresolved: `OSKCKUserBuildingSettingsService.swift:42`)** (Lane C; line-by-line against source); iOS has no direct Firestore path calls, so its W4c acceptance is "reaches Firestore only via swift-cloud-kit; no iOS facts". The one unresolved call and the `userBuildingAccesses` positional mismatch (probable client bug) go to the wiki team.
- **Temporary, expected drift:** `output/<repo>/run-context.json` for firebase, swift-cloud-kit, ios and the other Swift repos now points at the Lane B/C runs that are extracted but not yet synced, so the README's run-level drift check shows DRIFT for them until their write turns. Any `sync-facts.ts` run would load those runs, which is why no one syncs outside a granted turn.

### 2026-09-26: [Lane A] W5a write turn started (granted by the coordinator's line above). SQL to be applied, pasted before applying (only CREATE TABLE IF NOT EXISTS, no ALTER/DROP, no index, nothing on an existing object)

```sql
-- edge_sync_state (W5b, 2026-09-26): additive, one row per (connection_type, source_repo) slice of
-- cross_repo_edges. Written only by pipeline:edges (build-edges.ts) via _shared/edge-sync-state.ts.
-- Apply once, in a granted write turn:
--   docker exec -i facts-postgres-index-local psql -U facts_index -d facts_index < pipeline/facts-postgres-index/edge-sync-state.sql
-- Idempotent. Touches no existing table or column.
CREATE TABLE IF NOT EXISTS edge_sync_state (
    connection_type text NOT NULL,
    source_repo     text NOT NULL,
    built_at        timestamptz NOT NULL,
    synthesis_id    text,             -- newest synthesis_id in the slice when recorded; a later value in the edge table means a builder was run by hand ("unrecorded")
    facts_run_id    text,             -- the source repo's current extraction run when recorded (informational; null for source_repo 'unknown')
    edge_count      integer NOT NULL,
    resolved_count  integer NOT NULL, -- resolved + confirmed, the statuses graph traversal follows
    dangling_source integer NOT NULL, -- edges whose source_fact_id has no fact
    dangling_target integer NOT NULL,
    inputs          jsonb NOT NULL,   -- {"<repo>": {"run_id", "fact_count", "fingerprint"}} for the source repo and the target repos of the slice's edges
    PRIMARY KEY (connection_type, source_repo)
);
```

Order: (1) scratch database `facts_index_w5a_scratch` restored from `facts_index-2026-09-26-before-W5a.dump` (restore time and counts reported below), tests there only, dropped at the end; (2) the SQL above on `facts_index`; (3) Firebase intra rebuild with a row-set comparison; (4) the rest.
- 2026-09-26 (coordinator): **Embedding pre-approved by the user** for the two pending syncs, to be run only inside each lane's granted write turn with `EMBED=true` after the `EMBED`-off sync reports its counts: **Lane B firebase, about 434 facts (~41k tokens); Lane C swift-cloud-kit, about 65 facts (~6k to 10k tokens).** If a lane's re-run gate or sync count differs materially (more than about 20%) from these figures, it stops and asks the user again. Actual tokens are recorded from `embedding_calls` in the lane's log.

### 2026-09-26: [Lane B] W4a investigation and PROPOSALS (read-only; no code changed, the held W1 run untouched, no DB write; awaiting user approval)

Measured with throwaway scripts against the clone at `00e1d9fd` and the held run `20260926_073212-00e1d9fd` (scripts deleted after this entry). No `git add`/`git commit`.

**Cause 1: trigger path is `unknown`.** `01-extract-ast-evidence.ts:~1249-1262` (section 8c) matches `.onCreate/.onUpdate/.onDelete/.onWrite(handler)` and then resolves **`arguments[0]` of that call**, which is the *handler*, not the path. The path is in the receiver chain: 26 of the 28 triggers have the shape `<x>.document(<pathExpr>).onCreate(handler)` (`db`, or `functionBuilder.firestore`), and `<pathExpr>` is a module-level `const` (e.g. `accessControlDevicePath`). `resolveExpressionValue` (already used by the sibling `document(...)` path fact, section 8a) resolves it, which is why the sibling `firestore_path_touched` fact has the path while the trigger says `unknown`. The other 2 (`user/index.ts:84,85`) are `auth.user().onCreate/onDelete(...)`: Firebase Auth triggers.

**Cause 2: 147 unreadable writer paths.** Re-measured: 248 write-wrapper call sites; first argument is a readable literal for 101; the 147 are: **86** identifiers (`collectionPath` 60, `collection` 25, `collectionName` 1), **39** class properties (`OSKUserController.collection` 8, …, `this.compositeRolesCollection` 4), **22** direct `X.default.getCollectionPath(a, b)` calls. `resolveExpressionValue` handles variable/property-assignment initializers and enum members only; it has no rule for **class property declarations** or for **a call to a method whose body is `return <template>`**. And most of the 86 "generic pass-throughs" are not generic: e.g. `building_accesses.controller.ts:51` is `const collectionPath = OSKBuildingAccessesController.default.getCollectionPath(buildingId)` (a local const initialised by a path-method call), which the same two rules resolve.

**Prototype (read-only, extended resolver = the existing rules + class-property initializer + single-`return` path-method call with `${param}` kept as `{param}`):**

| | today | prototype |
|---|---|---|
| write-wrapper first argument resolved to a path | 101 / 248 | **241 / 248** |
| resolved via: literal 21, template 80, class property 39, local const → path method 79, path method 22 | | |
| unresolved (with reason) | 147 | **7**, all `parameter_passthrough`: `core/controllers/document_and_message.controller.ts:45,49,53,57,65`, `core/controllers/document.controller.ts:264`, `organization_user_invitation.controller.ts:105` (a base helper's own parameter; its callers are the resolved sites above) |
| triggers with a structured path | 0 / 28 | **26 / 26** real Firestore triggers; the 2 auth triggers are recognisable by receiver `auth.user()` |
| triggers reached by ≥1 writer (offline replication of the doc 38 join rule; Lane A's join gives the real figure) | 11 | **17** (32 writer/trigger pairs, 27 writer methods) |

**The 9 triggers still unreached, and why (source facts, not extractor gaps):** 7 are **path mismatches inside the repo itself**: `settings/modules/role/index.ts:12` triggers on `/setting/roles/roles/{roleId}` (singular `setting`) while `role.controller.model.ts` writes `/settings/roles/roles`; `workflow/index.ts:12` triggers on `/setting/workflows/organizationRequest/{workflowId}` while the writer uses `/settings/workflows/organizationRequests`; the building-request trigger uses `buildingRequests` (plural) while the writer uses `buildingRequest`. Correctly no edge (a wrong match is worse than none); worth telling the wiki team and the repo owners. 2 have no wrapper writer at all: `accessControlDevices/{deviceId}` `onDelete` (access_control_device/index.ts:81) and building-door device `onDelete` (building/modules/…:47).

**Rule scope check (so the writer field does not add noise):** applying "first argument resolves to a path-shaped string" to **all 6,741** call facts touches **528**: the 248 write wrappers plus read wrappers (`_get` 97, `_query` 93, `_generateDocId` 17, `_listDocuments` 15), `_removeFromArrayField*` 2 (doc 38 P1's follow-up), and a handful of others; about 4 are HTTP client paths (`devices/{deviceId}` in the node-iot API controllers), so the field means "first argument resolves to a path-shaped string", not "is Firestore"; the join still decides which methods are wrappers. Read paths help W4e (T-104: collections with no path fact).

**PROPOSALS (nothing written):**
1. **Trigger facts (`firestore_trigger`)**, fix at the source (8c): resolve the path from the receiver `document(<expr>)` argument with the existing `resolveExpressionValue` (extended as in 3). New additive evidence fields: `triggerSource` (`firestore` | `auth`; derived from the receiver chain, not a name list: a receiver `document(...)` call = firestore, otherwise the receiver's text), `triggerEvent` (`create|update|delete|write`, from the registration method), `firestorePathStatus` (`resolved` | `not_applicable` | `unresolved` + reason). **One non-additive item needing your explicit approval:** the existing `evidence.firestorePath` value changes from the sentinel `"unknown"` to the resolved path (`null` for auth triggers). Same field name and meaning; only the placeholder goes away. Alternative if you prefer strictly additive: keep `"unknown"` and add `resolvedFirestorePath`; I recommend changing the value. `triggerType: "FIRESTORE_TRIGGER"` stays as is (the join and wiki may filter on it); auth triggers are told apart by `triggerSource = auth`.
2. **Writer paths (`call_expression`)**: additive `evidence.resolvedPath` (template, `{param}` placeholders named after the argument's last identifier, leading `/` kept as written), `resolvedPathVia` (chain, e.g. `local_const>path_method>template`), `resolvedPathStatus` (`resolved`, or `parameter_passthrough` with `resolvedPathParameter` when the first argument is a bare parameter of the enclosing function and the callee resolves in-repo). Only set when the first argument resolves to a path-shaped string or is a parameter pass-through as described; null otherwise. Existing `arguments`, `declaration*` untouched.
3. **Resolver extension (internal, no schema effect):** class property declarations (static/instance, initializer), and calls to a same-repo method whose body is a single `return` of a string/template. `this.x` is covered by the property rule. Depth-bounded and cycle-safe like the existing resolver.
4. **Requests to Lane A (not edited by Lane B):** (a) `firestore-trigger` join reads `evidence.firestorePath` directly (and skips `triggerSource = auth`) instead of joining the sibling fact by line; (b) writer side reads `evidence.resolvedPath` (falling back to the literal in `arguments[0]` for calls without it). Expected effect: reach 11 → about 17 of 26 triggers, existing 17 edges preserved (my replication had them inside the 32 pairs; Lane A confirms with the real join).
5. **Expected DB effect when synced:** no fact IDs change; every call/trigger fact gains fields (payload only). `descriptionFor` does not read `firestorePath` or `resolvedPath` (checked in `sync-facts.ts`), so **no description changes and no re-embedding** are expected from W4a; the pre-sync gate will confirm.

**Not started:** no W4a code until the user approves 1-4. The W1 run is held and unchanged; W4a code would change the extractor, so if W4a is approved before W1 syncs, I will extract W4a into a separate run and gate it against the DB *after* W1 is synced (one write turn per gate), unless the coordinator prefers to fold both into one run.

### 2026-09-26: [Lane A] W5a write-turn results: `pipeline:edges` ran live for intra + cross; **lineage step NOT run: found a determinism bug in `build-form-field-lineage-edges.ts` (STOP-and-report); `[Lane A] W5a DONE` is NOT announced yet**

Session `-29`. No `git add`/`git commit`. No `sync-facts.ts`, no `EMBED`, no deletes outside the builders' own scoped replaces.

**Restore test (scratch database `facts_index_w5a_scratch`, from `facts_index-2026-09-26-before-W5a.dump`).** `createdb` then `pg_restore -U facts_index -d facts_index_w5a_scratch --no-owner < dump` (the `-i` on `docker exec` is required for stdin). **Restore time 29 s.** Counts equal the live database exactly: facts 69,215; cross_repo_edges 17,775; extraction_runs 27; embedding_calls 1,115; facts with an embedding 69,215; extensions and the 7 `facts` indexes present, generated `fact_ref` column works. Every scratch command set `PG_DATABASE` inline and ran `select current_database()` first; `facts_index_prebuild` was not touched. **The scratch database has NOT been dropped yet** (kept in case the lineage fix below is approved and needs a test bed; drop it when that is settled).

**Scratch tests (all on the scratch copy, live untouched).**
- Shrink guard (intra builder): with one throwaway row added to the swift-ble slice (existing 246, new 245): refused, `Nothing was changed`, throwaway row still present; with `--accept-shrink`: removed, slice 245.
- Full `pipeline:edges` on scratch: exit 0, state recorded for 17 slices, 17/17 ok, dangling 0, FIELD_BINDING 13, total 17,775. A second run leaves every slice content-identical to the first (per-slice md5 diff empty). 
- Changing only `payload.runId` and `evidence.runId` on all 8,747 angular facts: all 17 slices still ok (**no false STALE**). Adding one payload field to one firebase `api_contract` fact (same fact_id): exactly the 7 slices that depend on firebase flip to STALE, the other 10 stay ok. `--fail-on-stale` exits 1 (with the STALE list). Hand-running one cross join alone: that slice shows UNRECORDED (not STALE) with the reason. A rerun of `pipeline:edges` returns all 17 to ok.

**Live (`facts_index`), staged as instructed.**
1. `edge-sync-state.sql` applied (SQL pasted above; only `CREATE TABLE IF NOT EXISTS edge_sync_state`).
2. `pipeline:edges --steps=intra --repos=firebase-oskey-dev`: slice 2,363 → 2,363; source IDs 2,363/2,363 identical. **Row set on (source_fact_id, target_fact_id, resolution_status) identical before and after** (3,190 lines of text because fact IDs contain newlines; same md5 `a1e09368feb62723db13811ca4abb2a0`, `cmp` clean); **2,341 confirmed and 22 unresolved unchanged**; total 17,775.
3. `pipeline:edges --steps=intra,cross` (everything except lineage): exit 0. Intra source-ID comparison, existing vs new: **android 3,716/3,716, angular 346/346, firebase 2,363/2,363, ios 8,734/8,734, swift-cloud 510/510 identical.** Changed: **swift-ble 6, swift-ui 108, swift-webrtc 37** (every old ID was already absent from `facts`); no other ID changed anywhere. No shrink anywhere. Cross joins: HTTP_API_CALL angular 102 (97/5), swift-cloud-kit 34 (24/10), android 5; PUBSUB 14/2/9; PACKAGE_SYMBOL_USE 389; FIRESTORE_EVENT_TRIGGER 17: all identical to before.
4. **Acceptance, measured on live against `43-baseline-before-2026-09-26.json`:** total **17,775** (= baseline); dangling **151 → 0** (source 0, target 0; resolved/confirmed edges with a missing target 0); FIELD_BINDING **13**; all 13 cross-repo, FIELD_BINDING and non-Swift intra slices fingerprint-**IDENTICAL** to the baseline; only the three Swift kit intra slices differ (ble, ui, webrtc), exactly the 151 rows above (this is W5c's goal reached early). State recorded for 16 slices, **16 ok, 0 STALE**; the false STALE flags are gone. Only `FIELD_BINDING / angular-app-oskey-io` is UNRECORDED (its builder was not run).

**FINDING (contradicts the spec's acceptance "lineage slice fingerprint-identical"; found on the scratch copy, not on live).** On the scratch database the lineage builder produced 13 FIELD_BINDING edges with the same sources and targets but ONE row's `details` changed: `OSKCreateOrganizationInhabitantComponent.inhabitantType`: live/baseline "real allowed values: owner, tenant, resident" vs scratch "field type is not a union". Cause (`build-form-field-lineage-edges.ts:262-266`): the type-alias lookup is `SELECT payload->'evidence'->'unionMembers' FROM facts WHERE kind = 'type_alias' AND symbol_name = $1 LIMIT 1`, with **no repo filter and no ORDER BY**, and `OSKBuildingUnitInhabitantType` exists as a `type_alias` in TWO repos: firebase (3 union members) and angular (0 captured). Which one `LIMIT 1` returns depends on the physical row order / plan, not on the data. **Checked on live: the same query today returns the angular alias (no union) on both live and scratch,** so a live lineage run right now would silently degrade that live row (a still-`resolved` edge, but its `details` would lose the allowed values). The current live row survived only because it was built before angular was re-synced. **The lineage step was therefore NOT run on live**, and `FIELD_BINDING` (13, baseline-identical) was left untouched.

**Proposed fix, needs the user's approval because the spec says not to change the lineage builder:** in `build-form-field-lineage-edges.ts`, look the alias up in the same repo as the property fact (the target fact's repo, which is already in hand as `field.rows[0]`) and add `ORDER BY file, line` so the result is deterministic; expected result on live: the 13 edges reproduce the baseline fingerprint exactly (firebase alias, 3 values). I would test it on the scratch copy first, then run the lineage step live (a write turn). Alternative if the user prefers not to touch that file: leave FIELD_BINDING as the manual, unrecorded slice and run `pipeline:edges --steps=intra,cross` in future (a default `pipeline:edges` would run lineage and degrade the row, so the orchestrator should not run lineage by default until this is fixed; I would change the default steps in that case).

**Not done, and why.** (1) A second live `pipeline:edges` run to show idempotency on live: the command that included it was denied by the auto-mode permission classifier ("Modify Shared Resources"), so I did not retry it; the idempotency proof is the scratch one above. (2) Lineage on live: see the finding. (3) The scratch database drop and the closing `WRITE TURN RELEASED` are pending those decisions.

**[Lane A] safeguard added right after the finding (code only, my own file, no DB write):** `build-edges.ts` now defaults to `--steps=intra,cross`; the lineage step runs only with an explicit `--steps=intra,cross,lineage`. Reason: Lanes B and C are told to run `pipeline:edges` in their write turns, and a default run would otherwise re-run the lineage builder and degrade the live FIELD_BINDING row described above. Verified read-only: `pipeline:edges --dry-run` header shows `steps: intra, cross`. **Lanes B and C: run `pipeline:edges` with no `--steps` (it is safe); do not add `lineage`.**

### 2026-09-26: [Lane B] W4a BUILT and tested in an isolated sandbox (no `pipeline:firebase` run, real `run-context.json` and the held W1 run untouched, no DB write, no `git add`/`git commit`)

Approved by the user via the coordinator with three amendments, all applied: (1) top-level `payload.value` carries the resolved path too; (2) **fact IDs unchanged**: the ID keeps the legacy placeholder via a named constant with a comment (`LEGACY_TRIGGER_ID_PATH_PLACEHOLDER`, `02-build-module-evidence.ts`); (3) no `pipeline:firebase` until the W1 write turn is released.

**Code (Lane B files only).** `01-extract-ast-evidence.ts`: new `resolvePathValue` (separate from `resolveExpressionValue`, so no existing fact field changes value), `PATH_SHAPED`, `triggerEventFor`; section 8c resolves the path from the `document(<expr>)` in the receiver chain (v2 `onDocument*` styles: `arg0`), marks triggers without one by `triggerSource` (root identifier of the receiver chain, e.g. `auth`) and `firestorePathStatus: not_applicable`; call facts get `resolvedPath/Via/Status/Parameter`. `02-build-module-evidence.ts`: trigger ID built from the placeholder constant (both the primary key and the ordinal counter, exactly as before); `value` = resolved path.

**How it was tested without touching the real run:** steps 01-07 executed with `cwd` = a scratch directory (the scripts take `projectRoot = process.cwd()`), containing a copy of the clone, a `node_modules` link at the same relative position, and a copy of the held run's `files.json`/`modules.json` under a sandbox run id. The real `output/firebase-oskey-dev/run-context.json` still points at `20260926_073212-00e1d9fd`. (A first attempt with a symlinked clone showed spurious differences from module resolution and was discarded; the corrected sandbox reproduces the W1 gate numbers exactly, which is the control.)

**Gate against the live DB (sandbox run, firebase):** 15,259 DB facts / 15,442 run facts; **15,259 identical, 183 new, 0 would be pruned**, i.e. **all 28 trigger IDs identical** (and unchanged versus the held W1 run: same 15,442 IDs). Description changes 251 (249 `imports_dependency` + 2 `model_property`), **identical to the W1 gate: W4a adds 0 description changes and 0 re-embeds** (as predicted: `descriptionFor` reads neither `firestorePath` nor `resolvedPath`; `symbolNameFor` takes `handlerName` before `value`). Versus the held W1 run, the only value changes (excluding `runId`) are: `firestore_trigger` `value` and `evidence.firestorePath` (28 each), plus the new additive keys. Differences in `declarationFile` for outside-repo paths (`../../..`) are a sandbox path-depth artefact; none involves an in-repo path.

**Acceptance numbers (from the sandbox run):**
- **Triggers:** 28 = 26 `firestore/resolved` + 2 `auth/not_applicable`. No `unknown` left in `value` or `evidence.firestorePath`; `value == evidence.firestorePath` on all 28; auth triggers are `null` with `triggerSource = auth`. Events: create 11, delete 10, update 7. Resolution chain shown per trigger (`local_const>literal` etc.). IDs still contain `|unknown|`, deliberately.
- **Writers:** 248 wrapper call sites, **241 with `resolvedPath`** (was 101 readable): template 80, local const → path method 79, class property 39, path method 22, literal 21. The **7** unresolved are `parameter_passthrough` exactly as predicted: `core/controllers/document_and_message.controller.ts:45,49,53,57,65`, `core/controllers/document.controller.ts:264`, `organization_user_invitation.controller.ts:105`.
- **Rule scope:** `resolvedPath` on **528** of 6,741 call facts (248 write wrappers + `_get` 97, `_query` 93, `_generateDocId` 17, `_listDocuments` 15, `_removeFromArrayField` 1, a few others; ~4 HTTP-client paths). **`resolvedPathStatus = parameter_passthrough` is set on 752 call facts** (any call whose first argument is a bare parameter and whose callee resolves in-repo), far more than the 7 that matter; if you prefer it narrowed (e.g. dropped, since Lane A knows which methods are wrappers), that is a one-line change. Reach with the real join is Lane A's to confirm (my offline replication: 11 → 17 of 26 triggers).

**Source-verified trigger/writer path mismatches for the wiki team and repo owners (probable dead triggers; clone `00e1d9fd`, `functions/src/modules/settings/modules/`).** The writers use `/settings/...`, the triggers listen on a different string, so those triggers can never fire from these writers:
1. `role/index.ts:12` `rolePath = '/setting/roles/roles/{roleId}'` (singular `setting`), registered at `:45` (`onSettingsRoleCreated`, onCreate only; the update/delete registrations at `:46-47` are commented out). Writers: `role/controllers/role.controller.model.ts:30,35` (`_set`), `:43` (`_update`), `:49` (`_delete`) all on `'/settings/roles/roles'`.
2. `workflow/index.ts:12` `organizationRequestWorkflowPath = '/setting/workflows/organizationRequest/{workflowId}'` (singular `setting`, singular `organizationRequest`), registered `:49`, `:52`, `:55` (create/update/delete). Writers: `workflow/controllers/organization_request_workflow.contoller.ts:27,32` (`_set`), `:39` (`_delete`) on `'/settings/workflows/organizationRequests'` (plural).
3. `workflow/index.ts:11` `buildingRequestWorkflowPath = '/settings/workflows/buildingRequests/{workflowId}'` (plural `buildingRequests`), registered `:40`, `:43`, `:46`. Writers: `workflow/controllers/building_request_workflow.controller.ts:27,32` (`_set`), `:39` (`_delete`) on `'/settings/workflows/buildingRequest'` (singular).
That is 1 + 3 + 3 = 7 triggers. (The composite-role triggers, `role/index.ts:11`, use `/settings/...` and do match their writers.) The other 2 unreached triggers have no wrapper writer at all: `access_control_device/index.ts:78-83` `onAccessControlDeviceDeleted` and `building/modules/building_door/index.ts:44-49` `onBuildingDoorAccessControlDeviceDeleted` (their documents are deleted by other means, not the write wrappers). Whether any of these is intentional is for the repo owners to say; nothing here was changed.

**State:** W4a code is written and unit-tested only. It changes the extractor, so **W4a needs its own extraction run and own gate after the W1 write turn is released** (one variable per write turn). Not run: `pipeline:firebase`. Lane A requests unchanged (join reads `evidence.firestorePath` and skips `triggerSource = auth`; writer side reads `evidence.resolvedPath`). Still waiting on `[Lane A] W5a DONE` and Lane A's `descriptionFor` change for W1's `export_registry_entry`.

### 2026-09-26: [Lane B] W4a amendment: `resolvedPathStatus` / `resolvedPathParameter` DROPPED, sandbox gate re-run (no `pipeline:firebase`, no DB write, no `git add`/`git commit`)

Decision relayed by the coordinator (narrows an approved additive field, no further approval needed): the 752-fact `parameter_passthrough` status is noise for 7 sites and would need wrapper names. `01-extract-ast-evidence.ts` now sets only `evidence.resolvedPath` and `evidence.resolvedPathVia`, and only where a path resolves (null otherwise); no status or parameter field. Sandbox rebuilt from scratch and steps 01-07 re-run (real `run-context.json` still `20260926_073212-00e1d9fd`).

**Re-confirmed against the live DB (firebase):** **15,259 identical, 183 new, 0 would be pruned**; same 15,442 IDs as the held W1 run; **all 28 trigger IDs unchanged** (still `|unknown|` by design). **Description changes 251 = 249 `imports_dependency` + 2 `model_property`, identical to the W1 gate: W4a adds 0.** Triggers: 26 `firestore/resolved` + 2 `auth/not_applicable`, no `unknown` left in `value` or `evidence.firestorePath`. Writers: **241 of 248** wrapper call sites resolve; `resolvedPath` on 528 of 6,741 call facts. Keys added on call facts are now only `resolvedPath` and `resolvedPathVia` (all other added keys as in the previous entry).

**The 7 unresolved wrapper call sites (for checking Lane A's generic reason): `core/controllers/document_and_message.controller.ts:45,49,53,57,65`; `core/controllers/document.controller.ts:264`; `organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts:105`.** In each, `arguments[0]` is a parameter of the enclosing method (`collection` / `collectionName`), so it does not resolve to a path; the value is supplied by that method's callers, which are the resolved sites.

### 2026-09-26: [Lane A] W5a/W5b FINAL: lineage fix, live full runs twice, scratch dropped, README updated

Session `-29`. No `git add`/`git commit`, no `sync-facts.ts` run, no `EMBED`, no schema change beyond `edge_sync_state`. (The lineage-fix approval and the live re-run approval arrived through the coordinator, session `-47`, as its relay of the user's decision; both live runs executed without a permission prompt or denial.)

**Lineage fix (`build-form-field-lineage-edges.ts` v1.0.1, the alias lookup only).** The type-alias lookup now filters `repo = <repo of the property fact>` (`FieldResolution` gained `repo`, taken from the same `direct` query) and orders `ORDER BY file, line, fact_id`. Tested first on the scratch copy (which had the degraded row): the fixed builder produced 13 resolved / 257 unresolved, and **the 13 FIELD_BINDING rows equal the live/baseline rows byte for byte on (source_symbol, source_fact_id, target_repo, target_symbol, target_fact_id, resolution_status, details), including "real allowed values: owner, tenant, resident"**; slice fingerprint IDENTICAL to the baseline.

**Other unscoped or unordered lookups in that file (reported, NOT changed; tell the coordinator before touching):**
1. `resolveFieldRecursive` `direct` / `siblings` queries (`:98`, `:107`) have no repo filter by design (documented: nested types cross repos) and no ORDER BY. They collect every match and require exactly one, so the outcome cannot depend on order; but `siblings` iteration order decides which path first reaches a type in the `visited` set, so the `resolvedVia` text ("A -> B.field") could in principle differ between physical layouts when a type is reachable by two paths. Not observed (all 13 rows reproduced identically on a differently laid-out scratch copy). Same class, low risk; the fix would be `ORDER BY symbol_name` on `siblings`, one line.
2. `siblings` uses `LIKE '<type>.%'`: an `_` or `%` in a type name acts as a wildcard. Not observed in this data.
3. Step 4 loads every `HTTP_API_CALL` edge into a map keyed by `source_fact_id` with no order: harmless while each source fact has one edge (true today), a silent last-wins if that ever changes.
4. `DELETE ... FIELD_BINDING` then per-row INSERT run with no transaction (a failure mid-way leaves the slice empty or partial); `'angular-app-oskey-io'`, `'firebase-oskey-dev'` are hardcoded (the known generalisation, out of scope). `pipeline:edges` guards the first by checking the FIELD_BINDING count before/after.

**Live full runs (`pipeline:edges --steps=intra,cross,lineage`, twice).** Both exit 0. Per-slice content md5 (excludes edge_id/synthesis_id/generated_at): **run 1 leaves every one of the 17 slices identical to the state before it (including FIELD_BINDING); run 2 is identical to run 1.** After run 2, coverage summary: **17 ok, 0 STALE, 0 UNRECORDED** (FIELD_BINDING now recorded; `edge_sync_state` has 17 rows).

**Final acceptance (live, against `43-baseline-before-2026-09-26.json`):**
- total edges **17,775**; facts 69,215 (untouched); dangling source 0, dangling target 0, resolved/confirmed edges with a missing target 0 (**151 → 0**);
- FIELD_BINDING **13**, slice fingerprint IDENTICAL to the baseline (the lineage row unchanged);
- **all cross-repo slices identical to the baseline** (HTTP_API_CALL ×3, PUBSUB_TOPIC_BINDING ×3, PACKAGE_SYMBOL_USE, FIRESTORE_EVENT_TRIGGER), and the non-Swift intra slices identical;
- Firebase intra source IDs 2,363/2,363 identical (row set on source_fact_id/target_fact_id/status identical, 2,341 confirmed); Angular 346/346; android 3,716/3,716; iOS 8,734/8,734; swift-cloud 510/510; **the only intra changes are swift-ble 6, swift-ui-kit 108, swift-webrtc-kit 37 source IDs (the former 151 dangling rows, all old IDs absent from `facts`)**;
- no false STALE: the coverage summary reads `edge_sync_state`.

**Default steps (my call):** lineage is **on by default again** (`pipeline:edges` with no `--steps` = intra, cross, lineage), because the fix is proven (scratch, then live twice). The 2026-09-26 opt-in safeguard above is superseded by this line. Lanes B and C: plain `pipeline:edges` is right.

**Scratch database dropped.** `dropdb facts_index_w5a_scratch`; `\l` afterwards shows `facts_index`, `facts_index_prebuild` (not touched), `postgres`, templates. Live afterwards: facts 69,215, edges 17,775, edge_sync_state 17.

**Restore facts for README_postgres.md (coordinator).** `docker exec facts-postgres-index-local createdb -U facts_index <scratch>` then `docker exec -i facts-postgres-index-local pg_restore -U facts_index -d <scratch> --no-owner < output/backups/<dump>` (**`-i` is required or stdin is empty; `pg_restore -l` needs it too**). 275 MB dump restored in **29 s**. Matched the live database exactly: facts 69,215; cross_repo_edges 17,775; extraction_runs 27; embedding_calls 1,115; facts with an embedding 69,215; all 7 `facts` indexes and the 4 extensions present; the generated `fact_ref` column and `edge_sync_state` DDL work in the copy. The restore procedure in README_postgres.md works as written apart from the `-i` on `pg_restore -l`. Drop with `dropdb`; `pg_stat_activity` showed no locks.

**Docs:** `pipeline/README.md` updated (new "Rebuilding edges" section with flags and the edge-sync state rules, the "what to run when" table, the old drift note marked resolved 2026-09-26). Scratch scripts deleted.

[Lane A] W5a DONE: pipeline:edges available, write turn released

### Coordinator note 2026-09-26 (after Lane A's W5a): validation and next turns

- **W5a/W5b independently validated (coordinator, read-only):** all 33 edge groups equal the baseline exactly (counts and keys, none only-in-baseline, none only-in-live); 17,775 edges; 0 dangling on source and target (fact_ref anti-join; was 151); facts untouched (69,215); `edge_sync_state` present with 17 rows; `facts_index_w5a_scratch` dropped (`facts_index_prebuild` untouched); the live FIELD_BINDING "real allowed values" row is intact; the lineage diff is minimal (repo-scoped alias lookup plus `ORDER BY file, line, fact_id`, version 1.0.1); no commit was made. Lane A's two live full runs and the scratch proofs are accepted.
- **WRITE TURN RELEASED: Lane A W5a.** No write turn is open.
- **Next turns, in order:** Lane B (W1 sync, firebase), then Lane C (W4c sync, five Swift repos). Each first re-runs its read-only gate and posts an updated READY TO SYNC; the coordinator then grants the turn. Each lane runs plain `pipeline:edges` after its sync.
- **Lane A next (no live writes without a granted turn):** Lane B's `firebase-callable` join change (`evidence.clientFunctionName`), developed and tested on a NEW scratch database restored from the existing before-W5a dump with Lane B's held W1 run loaded into it via `PG_DATABASE`; then the W4a join changes. The extra lineage lookups Lane A listed are queued as a low-priority follow-up (fix only with a scratch proof that the baseline rows do not change).

### 2026-09-26: [Lane B] READY TO SYNC (W1, firebase, run `20260926_073212-00e1d9fd`): gate re-run with Lane A's live `descriptionFor` (read-only; no DB write, no `git add`/`git commit`)

Checked just now: `output/firebase-oskey-dev/run-context.json` still points at the held run; live DB unchanged (69,215 facts, firebase 15,259, 17,775 edges, current firebase run `20260911_080454-00e1d9fd`).

**Gate (held run vs `facts.fact_id`, firebase):** DB 15,259 / run 15,442; **15,259 identical, 183 new, 0 would be pruned.** Description changes on identical IDs: **251** (249 `imports_dependency`, 2 `model_property`), unchanged from the earlier gate; the 183 new facts now carry their real text (the 19 `export_registry_entry` read e.g. `export_registry_entry in entrypoint: acd -- deployed function group 'acd': clients call its functions as 'acd-<name>' -- built by getFirestoreTriggers from '@oskey/access_control_device' -- resolves to module: access_control_device (functions/src/index.ts:81)`).

**To embed: 434 = 183 new + 251 changed** (the estimate is unchanged). By module (new + changed): access_control_device 0+2, admin 0+32, building 0+46, core 0+22, organization 0+44, settings 0+10, supplier 0+24, tasks 0+1, unit_management 0+14, user 0+56, **decorators 35+0, entrypoint 68+0, utils 80+0**; `apps` and `call` 0. Total description text 79,277 characters, about **20k tokens by chars/4; my earlier ~41k figure (95 tokens/fact) is the conservative upper bound**; the real figure comes from `embedding_calls`.

**One metadata side effect to know before the sync:** the run-context now has `commit` (pin) and no `branch`, and `sync-facts.ts:556` records `branch ?? "unknown"`, so the new `extraction_runs` row will say `branch = 'unknown'` (was `staging`). No fact or edge is affected; if anyone reads `extraction_runs.branch`, they will see `unknown` until the pin is lifted. Lane A owns `sync-facts.ts` (a one-line fallback to the pinned commit is theirs to make if wanted); I do not touch it.

**Exact commands I will run in the write turn (all from the repo root, in this order; nothing is run before `WRITE TURN GRANTED: Lane B W1` is the last line of the write-turn log):**
1. Precondition reads: last write-turn-log line; `run-context.json` runId; `select count(*)` on facts (69,215), firebase facts (15,259), edges (17,775).
2. **Dump:** `docker exec facts-postgres-index-local pg_dump -U facts_index -Fc facts_index > output/backups/facts_index-2026-09-26-before-W1.dump`, then `pg_restore -l` on it to confirm it is readable.
3. **Sync, `EMBED` unset, one command per module** (15 modules from `modules.json`: access_control_device, admin, apps, building, call, core, organization, settings, supplier, tasks, unit_management, user, decorators, entrypoint, utils): `REPO_NAME=firebase-oskey-dev MODULE_NAME=<module> node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts`. **Expected printed counts** (per module `new / need embedding / removed`): decorators 35/35/0, entrypoint 68/68/0, utils 80/80/0, and 0 new / 2, 32, 46, 22, 44, 10, 24, 1, 14, 56 need embedding for access_control_device, admin, building, core, organization, settings, supplier, tasks, unit_management, user; apps and call 0/0; **0 removed everywhere.** Sum: 183 new, 434 need embedding, 0 removed.
4. **Read-only check after the EMBED-off sync:** facts total 69,398, firebase 15,442, exactly 434 firebase facts with `embedding IS NULL`, current firebase run `20260926_073212-00e1d9fd`, 0 pruned. **Stop and ask if any of these differ, or if 434 is more than about 20% off.**
5. **EMBED=true only after you confirm directly in this window** (the coordinator says you are aware; I still ask): the same sync command per module with `EMBED=true`, only for modules with pending facts; then record the actual tokens from `embedding_calls` in the log and check 0 firebase facts without an embedding.
6. **Edges:** `npm run pipeline:edges` (plain: lineage on by default, per the coordinator), then read the coverage summary and verify against `43-baseline-before-2026-09-26.json`: 0 dangling on resolved/confirmed edges, `FIELD_BINDING` still 13, edge groups equal to baseline except where the payload-content fingerprint deliberately flags the re-synced firebase slices, and one `findGraphNeighbors` call on a firebase edge.
7. Append the result to this Build log and stop; the coordinator writes `WRITE TURN RELEASED: Lane B`.
No `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; no `pipeline:firebase`; if the live-DB permission classifier asks the user to approve a command, I wait for that approval and never work around a denial.

### 2026-09-26: [Lane C] READY TO SYNC (updated): gate re-run read-only with Lane A's live `descriptionFor`; no DB write, no extraction, no git add/commit

Preconditions checked in the doc: `[Lane A] W5a DONE` present (line ~777, write turn released) and `descriptionFor` handles `firestore_client_call` (`sync-facts.ts` ~507). My held runs are untouched: `output/<repo>/run-context.json` still names the runs below (no `pipeline:swift-*` re-run since).

**Gate, all five repos** (new run's capability-pack facts vs live `facts`; descriptions from the live exported `descriptionFor`; payloads compared key by key, order-insensitive; module of every existing fact matches its pack directory):

| repo (module) | new-run facts | DB facts | IDs identical | new | would-be-pruned | description changed (existing) | payload diffs on existing |
|---|---|---|---|---|---|---|---|
| swift-cloud-kit (OSKCloudKit) `20260926_073744-32772e4a` | 2,587 | 2,522 | 2,522 | **65** `firestore_client_call` | 0 | **0** | `runId` on all; `computedStrings` on the 2 path-enum facts only |
| swift-ui-kit (OSKUIKit) `…073755-9a75c7c6` | 2,482 | 2,482 | 2,482 | 0 | 0 | 0 | `runId` only |
| swift-ble-kit (OSKBluetoothLEKit) `…073758-f8cdf199` | 799 | 799 | 799 | 0 | 0 | 0 | `runId` only |
| swift-webrtc-kit (OSKWebRTCKit) `…073801-e8aeea9d` | 2,487 | 2,487 | 2,487 | 0 | 0 | 0 | `runId` only |
| ios (OSKDoorUnlockActivityExtension, OSKEYTests, iOS App) `20260926_073857-e660bda2` | 25,458 | 25,458 | 25,458 | 0 | 0 | 0 | `runId` only |

Every Swift repo has 0 facts without an embedding today. Expected result confirmed: existing IDs identical, 0 pruned, 0 description changes on existing facts, 65 new facts (all swift-cloud-kit). **Embedding: 65 facts, none elsewhere.** The 65 new descriptions total 22,695 characters (average 349), which is about 5,700 tokens at 4 characters per token and about 6,200 at the project's ~95 tokens per fact; the user's pre-approved range is 6k to 10k. Sample: `firestore_client_call in OSKCloudKit: /users/{userId}/accesses/{accessId}/invitations -- client (swift) Firestore listen via addSnapshotListener on collection path -- path enum case: OSKCKFirestoreCollectionPath.userAccessInvitations -- called from: OSKCKUserAccessInvitationService.collectionSnapshot (…:94)`; the one unresolved fact says `-- path unresolved: the path argument is a variable or expression (`path`)…`.

**Exact commands I will run, only inside a granted write turn, in this order** (from the repo root; the live-DB classifier may ask the user to approve some; on any denial I stop and tell the user, no workaround):
1. Dump: `docker exec facts-postgres-index-local pg_dump -U facts_index -Fc facts_index > output/backups/facts_index-2026-09-26-before-W4c.dump` (date of the turn if it differs), then `pg_restore -l` on it to confirm it is readable.
2. Sync with `EMBED` unset (7 module syncs; `sync-facts.ts` is per module, and each marks that repo's new run current and prunes only within its module): `REPO_NAME=<repo> MODULE_NAME=<module> node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts` for swift-cloud-kit/OSKCloudKit first, then swift-ui-kit/OSKUIKit, swift-ble-kit/OSKBluetoothLEKit, swift-webrtc-kit/OSKWebRTCKit, and ios-oskey-dev with each of `OSKDoorUnlockActivityExtension`, `OSKEYTests`, `iOS App`. **Expected printed counts:** cloud-kit `65 new facts`, `65 facts need (re-)embedding`, `2,522 still-valid`, `0 stale facts removed`; every other module `0 new`, `0 need embedding`, all unchanged, `0 removed`. Note the sync updates `run_id` and `payload.runId` on every fact (all 5 repos), which changes no ID, description or embedding. Any deviation (more than about 20% off 65, or any other module needing embedding, or anything removed) and I stop and ask the user.
3. Embed, swift-cloud-kit only: `EMBED=true REPO_NAME=swift-cloud-kit-oskey-dev MODULE_NAME=OSKCloudKit node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts`, after the user confirms directly in this window with the printed counts. Then record the actual tokens from `embedding_calls` here.
4. `npm run pipeline:edges` (plain, Lane A's entry point). Expected: Swift `INTRA_REPO_CALL` dangling sources 151 → 0 (ui 108, webrtc 37, ble 6), the Swift slices recorded in `edge_sync_state`, all other slices unchanged, `FIELD_BINDING` 13, no `resolved` or `confirmed` edge pointing at a missing fact.
5. Read-only verification, then a `[Lane C]` results entry and a request for `WRITE TURN RELEASED`. Scratch scripts deleted.

Waiting for Lane B's turn to be released and the coordinator's `WRITE TURN GRANTED: Lane C W4c`; the last line of the Write-turn log must be a RELEASED line before I start.

- **WRITE TURN GRANTED: Lane B W1** (exclusive; Lanes A and C make no live writes). Coordinator preconditions verified: gate re-run independently (held run `20260926_073212-00e1d9fd` vs DB firebase: 15,259 identical, 183 new [entrypoint 68, decorators 35, utils 80], 0 pruned; 15 modules on disk), DB at the post-W5a state (69,215 facts, 17,775 edges, no active queries), Lane A's `descriptionFor` live. Accepted: `extraction_runs.branch = 'unknown'` for the pinned run (the pinned Swift kits already record `unknown`); real embed about 20k tokens by chars/4, within the pre-approved 41k. **Expected and acceptable in this turn:** Firebase `INTRA_REPO_CALL` grows (calls into `utils`/`decorators` now resolve); the acceptance is that the old edge set is a **subset** of the new one (nothing lost) and nothing else changes.

### 2026-09-26: [Lane A] `firebase-callable` join change (Lane B's request): BUILT and tested on scratch copies; NOT queued live yet (dry-run numbers below for review). No live write by Lane A.

Session `-29`. No live database write (the only live access was read-only dry runs and a read-only `pg_dump`), no `git add`/`git commit`, no `EMBED`. Lane B's live write turn was open while this ran; I touched nothing live.

**Code (`build-cross-repo-edges.ts` v1.9.0, `firebase-callable` join only).** The Firebase callable index is now keyed two ways: (1) **`evidence.clientFunctionName`** (`<exportGroup>-<callableExportName>`, from Lane B's export registry): the client's `functionName` is matched to it exactly; a duplicate client name is fail-closed (throws). (2) the existing **module-name compound key** `module::callableExportName` (duplicate check kept, still over all callables) is used **only for a callable that carries no registry name** (an older extraction). A callable that has a registry name is never matched by its module name, so a client passing a name nothing is deployed under still fails. Unresolved `details` are derived from the data: with the registry, "Export group 'P' has no callable 'X'; the name exists as 'g-X' (module 'M', file:line) ..." or "... the client prefix 'P' is not an export group in the registry"; without it, the old wording, unchanged. A resolved edge whose group differs from its module gets ` -- resolved through export group 'unit' (module 'unit_management'), from the export registry in functions/src/index.ts` appended to `details`; `target_symbol` stays `module::handler`. New `CONTRACT` entries `clientFunctionName`, `exportGroup`. Preflight, shrink guard and scoped replace untouched.

**Test 1: safe to deploy before Lane B's facts arrive (pre-W1 scratch copy `facts_index_join_scratch_pre`, restored from a read-only post-W5a dump `output/backups/facts_index-2026-09-26-after-W5a.dump`, 30 s).** Real run of the new join on facts with no registry names (`0 carry a registry client name`): **every slice's content md5 is identical before and after, both HTTP_API_CALL callable slices (angular 102, swift-cloud-kit 34) included, details text included.** So the new code reproduces the old output exactly when the registry fields are absent.

**Test 2: with Lane B's held W1 run (`20260926_073212-00e1d9fd`) loaded into `facts_index_join_scratch`** (`sync-facts.ts` with `PG_DATABASE` pointing at the scratch DB, `EMBED` off, all 15 modules; firebase 15,442 facts, 434 without an embedding = the 183 new + 251 changed Lane B predicted; live unaffected, verified with `current_database()` each time). `253 carry a registry client name, 9 export groups.` Dry-run numbers, existing → new:
- **`HTTP_API_CALL / swift-cloud-kit-oskey-dev`: 34 (24 resolved, 10 unresolved) → 34 (31 resolved, 3 unresolved).** Exactly the 7 `unit-*` calls flip to resolved, all to `unit_management` (including `unit-removeInhabitantFromUnit`, which resolves to `unit_management`, not `admin`, because the registry name is unique; `unit-getUnitPerson` at `:65` and `:89`, `unit-createUnitInvitation`, `unit-getAllUnitInhabitantsAndGuests`, `unit-removePermanentGuest`, `unit-removePendingInvitation`). The 3 dead calls stay unresolved with the reason "No callable named 'X' exists in any module (searched 253 callables across 9 modules)": `organization-verifySmsOtpCode`, `user-approvePendingFriendRequest`, `user-rejectPendingFriendRequest`. iOS → Firebase: 24 → **31 of 34**.
- **`HTTP_API_CALL / angular-app-oskey-io`: 102 (97 resolved, 5 unresolved) → 102 (97, 5).** The 97 resolved rows are byte-identical (not in the row diff). Only the `details` of 1 unresolved row changed: `organization-assigningBuildingToProperty` now reads "Export group 'organization' has no callable 'assigningBuildingToProperty'; the name exists as 'building-assigningBuildingToProperty' (module 'building', functions/src/modules/building/index.ts:53). Left unresolved: a different group is not the one the client named." The other 4 (`getAllIntercomCommunicationService`, `updateIntercomCommunication`, `supplier-getById`, `supplier-getStaffMember`) keep their text ("No callable named ... exists in any module").
- Row-level diff of the two slices before/after on scratch: 7 swift rows unresolved → resolved, 1 angular `details` change, nothing else. Resolved edges with a missing target on scratch: 0; dangling 0. Shrink guard did not fire (resolved 121 → 128 overall). Coverage summary on scratch behaves as designed: after the W1 sync the firebase-dependent slices read STALE, after the hand-run of this join its slices read UNRECORDED.
- Note for the wiki/T-106: `organization-assigningBuildingToProperty` is a real client-side naming mismatch (deployed as `building-assigningBuildingToProperty`), a candidate client bug, not a resolver gap.

**A live read-only dry run (during Lane B's turn, after its sync had landed the registry fields) gave the same numbers:** angular 97/5 → 97/5, swift-cloud-kit 24/10 → 31/3.

**To take this live:** nothing extra to sync; the join reads facts already in the DB once Lane B's sync is done. It runs as part of a plain `pipeline:edges` in a granted write turn (Lane B's own turn already runs `pipeline:edges` after its sync, so these 7 edges appear then). Both scratch databases and the scratch scripts are deleted (see the next line).
- scratch databases `facts_index_join_scratch` and `facts_index_join_scratch_pre` dropped (`\l` shows facts_index, facts_index_prebuild, postgres, templates); scratch scripts deleted.

### 2026-09-26: [Lane B] W1 DONE (numbers) and write turn released

Turn `WRITE TURN GRANTED: Lane B W1` (exclusive). Sequence run exactly as in the READY TO SYNC entry. No `git add`/`git commit`; no `pipeline:firebase`; no `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; every command ran without a permission denial.

1. **Preconditions:** last write-turn-log line = the GRANTED line; `run-context.json` = `20260926_073212-00e1d9fd`; facts 69,215, firebase 15,259, edges 17,775, 0 facts without an embedding.
2. **Dump:** `output/backups/facts_index-2026-09-26-before-W1.dump` (275,553,501 bytes, gitignored, `pg_restore -l` lists 57 entries). This is the restore point (`before-W1`).
3. **Sync, `EMBED` unset, 15 modules.** Printed counts (new / need embedding / removed) matched the prediction on every module: access_control_device 0/2/0, admin 0/32/0, apps 0/0/0, building 0/46/0, call 0/0/0, core 0/22/0, organization 0/44/0, settings 0/10/0, supplier 0/24/0, tasks 0/1/0, unit_management 0/14/0, user 0/56/0, decorators 35/35/0, entrypoint 68/68/0, utils 80/80/0. **Sum 183 new, 434 need embedding, 0 removed.**
4. **Read-only check before embedding:** facts 69,398; firebase 15,442 (all at run `20260926_073212-00e1d9fd`); other repos 53,956 (= 69,215 − 15,259, untouched); exactly **434** firebase facts without an embedding; current firebase run = the new run (`branch = 'unknown'`, accepted); edges still 17,775.
5. **Embedding (user confirmed directly in the window):** `EMBED=true`, the 13 modules with pending facts. 434 facts embedded (2+32+46+22+44+10+24+1+14+56+35+68+80). **Actual tokens from `embedding_calls` (call_ids 1116-1128, model `gemini-embedding-2`, 768 dims): 26,790 total** (150, 2,450, 3,464, 1,473, 3,305, 678, 1,663, 64, 974, 4,015, 1,596, 3,560, 3,398), none truncated; inside the pre-approved 41k. Facts without an embedding afterwards: 0 (whole DB).
6. **Edges:** plain `npm run pipeline:edges` (intra, cross, lineage), exit 0, 13 s. Shrink guard did not fire; 0 dangling on resolved/confirmed edges and 0 on the other statuses; **17 slices recorded in `edge_sync_state`, all `ok`.**

**Edge results (snapshot of all 17,775 edges before vs after, compared row by row incl. a content hash of symbols/details):** total **17,775 → 17,784 (+9)**.
- **Firebase `INTRA_REPO_CALL`: 2,363 → 2,372 (+9 confirmed; 2,341 → 2,350 confirmed, 22 unresolved unchanged).** The old edge set is a strict subset of the new: **0 old (source, target, status) rows missing, 0 old rows changed**, the 2,341 confirmed intact. The 9 new edges are calls **from** the new modules **into** existing ones, not into them: sources `decorators` 3 (`accessChecks.ts:66,68,69`), `entrypoint` 5 (`index.ts:49,53,58,63,68`), `utils` 1 (`errors_helper.ts:13`); **by target module: building 2, user 3, core 2, organization 2** (utils/decorators/entrypoint as a target: 0). So my earlier expectation that calls INTO utils/decorators would resolve was wrong for this graph builder; the 183 `security_checks` calls and the decorator applications still produce no INTRA edge (an W6 matter, for Lane A).
- **`HTTP_API_CALL / swift-cloud-kit-oskey-dev`: 34 (24 resolved, 10 unresolved) → 34 (31 resolved, 3 unresolved). This is the W1 acceptance result, not an accident:** Lane A's `firebase-callable` join change (v1.9.0, already in the working tree, tested on scratch DBs, and stated in Lane A's log to run in this turn's `pipeline:edges`) went live with this run. The 7 `unit-*` calls resolve to `unit_management` (`unit-getUnitPerson` at :65 and :89, `-createUnitInvitation`, `-getAllUnitInhabitantsAndGuests`, `-removePermanentGuest`, `-removePendingInvitation`, `-removeInhabitantFromUnit`), each with "resolved through export group 'unit' (module 'unit_management')" in `details`; the 3 dead calls stay unresolved with reasons (`organization-verifySmsOtpCode`, `user-approvePendingFriendRequest`, `user-rejectPendingFriendRequest`). **iOS → Firebase 24 → 31 of 34.** This matches Lane A's dry-run numbers exactly. (The coordinator's acceptance said join outputs should not change yet; this deviation is the pre-announced Lane A join change, flagged here so it is not mistaken for drift.)
- **`HTTP_API_CALL / angular-app-oskey-io`: 102 (97 resolved, 5 unresolved) → unchanged counts;** the 97 resolved rows are byte-identical; only the `details` text of 1 unresolved row changed (`organization-assigningBuildingToProperty` now says the name exists as `building-assigningBuildingToProperty`, a probable client naming bug), as in Lane A's dry run.
- **Everything else identical to the baseline, including content:** `FIELD_BINDING` 13; `PACKAGE_SYMBOL_USE` 389 (ios → ble 20, cloud-kit 135, ui-kit 222, webrtc-kit 12); `PUBSUB_TOPIC_BINDING` 14 + 1 + 1 + 3 + 6 unchanged; `FIRESTORE_EVENT_TRIGGER` 17 (17 resolved); all other `INTRA_REPO_CALL` slices (android 3,716, angular 346, ios 8,734, ble 245, cloud-kit 510, ui-kit 625, webrtc-kit 651) equal.
- **`findGraphNeighbors`** on the firebase `getUnitPerson` `api_contract` fact: 2 incoming `HTTP_API_CALL` resolved edges (both `unit-getUnitPerson` swift call sites).

**What W1 delivered (acceptance from the spec):** all 7 `unit-*` swift-cloud-kit calls resolve (24 → 31 of 34) and the 3 dead ones stay unresolved with reasons; each of the other 5 Angular unresolved calls carries a specific reason (4 "no such callable in any module", 1 a name deployed under another group); Angular's 97 resolved edges unchanged; all 256 callable/http `api_contract` facts have the group and client name; existing fact IDs unchanged (15,259 identical); the new roots added exactly 183 facts (entrypoint 68, decorators 35, utils 80). Deferred, per Lane A: nothing left for W1 except the W6 note above.

**State left behind:** live DB = post-W1 (facts 69,398, edges 17,784, 0 without an embedding, firebase current run `20260926_073212-00e1d9fd`). Restore point `facts_index-2026-09-26-before-W1.dump`. Scratch files deleted (gate script kept in the session scratchpad for W4a's gate). Next in my lane: **W4a's own extraction run and gate** (code already written and sandbox-tested; needs its own write turn). Nothing else running.

- 2026-09-26 (Lane B): write turn released. Requesting `WRITE TURN RELEASED: Lane B W1` from the coordinator.

### Coordinator note 2026-09-26 (after Lane B's W1): validation, release and Lane C's grant

- **W1 independently validated (coordinator, read-only).** 69,398 facts (+183), 17,784 edges (+9), 0 facts without an embedding, 0 dangling on source and target, 0 duplicate edge pairs. Embedding: 434 facts, 26,790 tokens in 13 calls, 0 truncated (within the approved 41k). Edge groups versus the baseline: **30 of 33 identical**; the only three differences are exactly the expected ones: `HTTP_API_CALL swift-cloud-kit -> firebase` resolved 24 -> 31 and unresolved 10 -> 3, and `INTRA_REPO_CALL firebase` confirmed 2,341 -> 2,350. The 7 newly resolved iOS calls all land on the correct `unit_management` `api_contract` facts with matching `clientFunctionName` (`unit-createUnitInvitation`, `unit-getAllUnitInhabitantsAndGuests`, `unit-getUnitPerson` x2 call sites, `unit-removeInhabitantFromUnit`, `unit-removePendingInvitation`, `unit-removePermanentGuest`); the 3 dead client calls stay unresolved with a specific reason (no callable of that name in any module). Firebase INTRA: **the old 2,363-row set is an exact subset of the new 2,372** (0 old rows missing, checked against the 09-22 snapshot of the 09-11 build); the 9 new edges are real and sourced in the new modules (decorators `accessChecks.ts` -> `getSafe` methods; `index.ts` -> the `uploadImage` handlers and `registerTriggers`; `errors_helper.ts` `OSKLogAndError` -> `OSKLoggingService.logError`).
- **Process note:** Lane A's approved-in-principle `firebase-callable` join change was already in the shared working tree, so Lane B's plain `pipeline:edges` applied it live. The result is exactly the spec's expected effect and is accepted, but the rule is now: **`pipeline:edges` runs whatever join code is in the tree, so nothing unproven may sit in `build-cross-repo-edges.ts` (or another builder) while any lane holds a write turn.** Lane A develops unapproved join changes in a copy or behind a guard that falls back when the new fields are absent, and asks the coordinator before they enter the tree.
- **WRITE TURN RELEASED: Lane B W1.**
- **WRITE TURN GRANTED: Lane C W4c** (exclusive). Preconditions verified: DB at the post-W1 state above; Lane C's re-run gate is in its READY TO SYNC entry (existing IDs identical, 0 pruned, 0 description changes on existing facts, 65 new `firestore_client_call` facts in swift-cloud-kit, about 5.7k tokens to embed). The tree contains only the validated `firebase-callable` join change. **Expected in this turn:** Swift `INTRA_REPO_CALL` row sets identical to now, `PACKAGE_SYMBOL_USE` 389 and `HTTP_API_CALL` swift 31/3 unchanged, total edges unchanged (17,784: the join for the new facts is W4d, later), 0 dangling.

### 2026-09-26: [Lane C] W4c write turn started; STOPPED at step 2 (first sync denied by the permission classifier). No git add/commit.

Turn `WRITE TURN GRANTED: Lane C W4c` (last Write-turn log line was `RELEASED: Lane B W1`, then the grant). Checked first, read-only: DB at 69,398 facts, 17,784 edges, 0 facts without an embedding; all five held `run-context.json` unchanged.
- **Step 1 done:** `output/backups/facts_index-2026-09-26-before-W4c.dump` (277,471,500 bytes); `pg_restore -l` on it lists 57 TOC entries (readable). Gitignored.
- **Step 2 NOT run:** `REPO_NAME=swift-cloud-kit-oskey-dev MODULE_NAME=OSKCloudKit node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts` (`EMBED` unset) was denied by the auto-mode classifier ("Modify Shared Resources"). Not retried, no workaround. **Nothing was written to the database: no sync, no embed, no edges.** The DB is at the pre-turn state; the dump is the rollback point if the user later approves and something goes wrong.
- **Waiting for the user** to approve the sync commands in this window (or add a Bash permission rule for them). The write turn stays open and held by Lane C; no other lane should write meanwhile.

### 2026-09-26: [Lane B] W3 investigation and PROPOSALS (read-only; no code changed, no `pipeline:angular` run, no DB write; awaiting user approval)

Measured against `output/clones/angular-app-oskey-io` at `8345d222` (upstream `staging` head re-checked with `git ls-remote`: still `8345d222`, so no drift) using Angular's own `parseTemplate` from the already-installed `@angular/compiler` 22.1.4 and the live DB. Throwaway scripts deleted after this entry. No `git add`/`git commit`.

**Independent source count (comments stripped, all 100+ `.html` under `hosting/web-app/src`, 23 files with controls): 84 static `formControlName="…"` and 67 bound `[formControlName]="…"`.** Exactly the wiki's expected 84 / 67 (their number is right), against **82 / 61 extracted** (DB: 82 `angular_template_attribute` with `attributeName = formControlName`, 61 `angular_template_binding` with `bindingName = formControlName`). The gap is **2 static + 6 bound = 8 controls, and both causes are now explained exactly:**

**Cause 1: the template walker cannot enter `@switch` blocks (6 of the 8 controls).** `01-extract-ast-evidence.ts:~832-913` (`visitNode`) follows only `node.children` and `node.branches`. Angular's `SwitchBlock` keeps its content in `groups[].children` (`SwitchBlockCaseGroup`), so everything inside a `@switch` is invisible: **all** template facts (composition, bindings, attributes), not only controls. Both email-link templates are a single root `@switch (currentStep())`, so they yield **zero facts of any kind** (verified in the DB): `sign-in-with-email-link.component.html` 15 of 15 elements hidden, `sign-up-with-email-link.component.html` 73 of 73 hidden. A third template, `sign-in/sign-in.component.html`, is **partially** hidden (6 of 16 elements) and already has 3 facts. Total **94 unreachable elements** across the repo, in exactly those three templates. The 6 controls lost: `email` (sign-in-with-email-link:24, bound) and `firstName`, `lastName`, `email`, `isoCountryCode`, `localPhoneNumber` (sign-up-with-email-link:41,45,101 bound / :50,63 static). No parse errors. Other container kinds the walk may miss (`@empty` of `@for`, `@defer` blocks) do not occur in this repo today, but the same fix covers them.

**Cause 2: `app.component.html` is outside the scan (the other 2 bound controls).** `00-scan-repo` only walks *directories* under `modulesRoot` (`hosting/web-app/src/app`), so the 4 loose files at its root (`app.component.ts`, `app.config.ts`, `app.routes.ts`, and the spec) are never scanned; the DB has 0 facts for them and modules are only `components`, `core`, `features`. The walker is fine on this template (27 elements, 2 bound `formControlName`). Beyond the spec: `app.routes.ts` (the root route table, 5 `path:` entries) and `app.config.ts` are unscanned too, so the app's root routes and providers are missing from the facts (59 `angular_route` facts exist, all from feature route files).

**Nested groups (`phone.localPhoneNumber`):** 53 of the 151 controls sit under a `formGroupName` / `formArrayName` (chains: `phone` 2, `streetAddress` 24, `streetAddress.coordinate` 8, `address` 9, `staffMembers.[i / $index]` 10). The extractor's attribute allowlist is `value|ngValue|formControlName`, so the enclosing group name is not recorded anywhere and a control's leaf name is all a consumer gets.

**PROPOSALS (nothing written):**
1. **Walker: use Angular's own recursive visitor** (`TmplAstRecursiveVisitor`, exported by the same package; it enters every node kind: switch groups, `@empty`, `@defer` blocks) instead of extending a hand-kept list of properties. **To keep every existing fact ID stable, two passes:** pass 1 is the current walk unchanged (same order, so the `#n` ordinals of all existing template facts are unchanged, which matters because IDs are `type|module|template|class|tag-or-name|#ordinal` and `sign-in.component.html` already has facts); pass 2 records only the elements pass 1 did not reach, appended after, in document order (deterministic). Expected: about **65 new template facts** in the three templates (33 composition, 30 binding, 2 static `formControlName`), controls **84 static / 67 bound**, equal to the independent count.
2. **Root files: a config key `rootFilesModule`** (a module name, e.g. `app_root`) on the Angular entry: any `.ts` file **directly under `modulesRoot`** (same spec/`.d.ts` filters) is attributed to that module, discovered dynamically (no file names in code), fail-closed if the name collides with a directory under `modulesRoot`. This brings in `app.component.ts` (and so `app.component.html`, closing the last 2 bound controls) and, beyond the wiki's list, `app.config.ts` and `app.routes.ts`. **Scope note for you:** that widens W3 by two files' worth of facts (their count is unknown until the gate; the gate will report it and the embedding estimate). If you want only `app.component.html`, say so and I will restrict it to that one file.
3. **Nested group path, additive:** on each `angular_template_attribute` `formControlName` fact and each `angular_template_binding` with `bindingName = formControlName`: `evidence.formGroupChain` (array of `{kind: "formGroupName"|"formArrayName", name, bound}`, outermost first; bound names kept as their source expression, e.g. `$index`) and `evidence.formControlPath` (dotted: `phone.localPhoneNumber`, bound parts as `{expr}`). No new fact kind; `formGroupName` / `formArrayName` are not made facts themselves. Computed with one pre-pass carrying an ancestor stack (the Angular AST has no parent links).
4. **Expected DB effect (to be proven by the gate, own extraction run + own write turn, after W4a's turn unless the coordinator says otherwise):** existing fact IDs identical (the two-pass order); new facts only (about 65 + the root files); payload-only additive changes on the 143 existing controls plus the new ones; **no description changes** expected (`sync-facts.ts` `angularTemplateAttributeDoc` is built from element/attribute/value; the gate will confirm). Embedding spend: about 65 facts (about 6k tokens) plus the root-file facts (to be counted), flagged before any `EMBED=true`. `FIELD_BINDING` is 13 today; the lineage builder (Lane A) may resolve more once 2 static controls exist (the acceptance text says unchanged, so a change would be reported and explained, not hidden). Angular's current run is `20260923_110233-8345d222`; a re-extract at the same commit must keep existing IDs (gate).
5. **Nothing for Lane A to change** for W3 (facts only); their lineage join reads the new controls after the sync.

### 2026-09-26: [Lane A] W4a join changes: written in a COPY, proven on a scratch database with EMULATED W4a fields; NOT in the shared tree; needs Lane B's real W4a run for the final numbers. No live write by Lane A.

Session `-29`. No `git add`/`git commit`, no `sync-facts.ts` on live, no `EMBED`. Lane C held the write turn during this work; the shared `build-cross-repo-edges.ts` (v1.9.0, only the validated `firebase-callable` change) was **not touched**.

**Where the code is:** `pipeline/facts-postgres-index/_dev-w4a-build-cross-repo-edges.ts` (untracked; a full copy of the builder with the W4a changes; `pipeline:edges` never runs it; it is deleted when the change is merged or dropped). **Do not `git add` it.** Ask before it replaces the shared file.

**What it changes (`firestore-trigger` join only; every change falls back to today's behaviour when the new fields are absent).**
1. *Trigger path:* reads the trigger's own `evidence.firestorePath` (Lane B's W4a value); only when it is missing or the pre-W4a placeholder `"unknown"` does it use the sibling `firestore_path_touched` fact, as today. Where both exist and differ it prints a WARN and trusts the trigger.
2. *Auth triggers:* `evidence.triggerSource = 'auth'` are skipped explicitly and reported as "auth trigger(s) with no Firestore path", not as a missing path.
3. *Event:* still from the callee's last identifier; `evidence.triggerEvent` (create/update/delete) is used only if the callee does not name one.
4. *Writer path:* reads `evidence.resolvedPath` (a `{param}` template, new helper `templatePathSegments`; a segment containing `{` is a wildcard, the existing wildcard rule is unchanged), falling back to the quoted literal in `arguments[0]`. The site text in an edge's `details` shows `= <resolved>` only where `arguments[0]` was not itself a literal, so an edge whose writer path was already readable keeps exactly its old `details`.
5. *Generic reason for unknown writer paths:* every write-wrapper call with no known collection path is reported in the join log ("first argument is not a literal and no evidence.resolvedPath was extracted, so the collection is not statically known at this call site"; first 12 listed, then a count), computed from the fact itself, no name list. This covers the 7 base-controller sites (`document_and_message.controller.ts:45,49,53,57,65`, `document.controller.ts:264`, `organization_user_invitation.controller.ts:105`) once Lane B's data resolves everything else.
New `CONTRACT` entries: `firestorePath`, `"unknown"`, `triggerSource`, `"auth"`, `triggerEvent`, `resolvedPath`.

**Tests, all on a scratch database `facts_index_join_scratch` (restored from `facts_index-2026-09-26-after-W5a.dump`; dropped afterwards; `facts_index_prebuild` untouched):**
- **A. Fallback, pre-W4a facts:** real run of the copy: 26 triggers usable via the sibling fact, 2 (auth, still unmarked) skipped, writers known for 101 of 248, join result 17 edges reaching 11 of 26; **slice fingerprint identical to the pre-run state** (`a5f4e790…`, 17 edges), details included.
- **B. Emulated W4a fields (SQL on the scratch copy only, derived from the existing data: `firestorePath`/`triggerSource`/`triggerEvent` from the sibling facts, the 2 auth triggers marked `auth`/null, `resolvedPath` on the 101 literal-argument writers):** 26 triggers via their own path, 2 auth skipped explicitly, 101 writers via `evidence.resolvedPath`; 17 edges reaching 11 of 26; **slice fingerprint again identical** to the pre-W4a one. The new-field paths therefore reproduce today's edges exactly when the fields carry what today's join already read.
- **C. Disagreement/guard:** one trigger's path changed to `/zzz/{id}`: WARN printed, the trigger's own path is used, and the existing shrink guard fires (17 → 14, RESOLVED DROP) in the dry run.

**Not yet shown (needs real W4a data, which no longer exists on disk: Lane B's sandbox was deleted after its gate):** the real figures for triggers reached (Lane B's offline replication: 11 → 17 of 26, 32 writer/trigger pairs) and the count of known-path writers (101 → 241 of 248), and whether the existing 17 edges remain a subset of the new set. **Request to the coordinator/Lane B:** extract W4a into a held run under `output/` (as W1 was, upstream/pin check first) so Lane A can load it into a scratch database with `sync-facts.ts` (`PG_DATABASE` pointed at the scratch DB, `EMBED` off) and post the dry-run numbers. Nothing goes live until that run is synced in Lane B's own turn.

**Incident, disclosed:** while checking that the copy compiled I ran `node -r ts-node/register -e "require('.../_dev-w4a-build-cross-repo-edges.ts')"` with `PG_DATABASE` unset. These builders run `main()` on import, so it started all joins against **live**. The command was piped to `head -3`, the process died on the closed pipe after printing the `firebase-callable` "Loaded 253 ..." line, before any write. Verified read-only straight afterwards: newest `generated_at` in `cross_repo_edges` is `08:17:32` (Lane B's earlier `pipeline:edges`), every `HTTP_API_CALL` slice still carries its `081726/081727` synthesis id, 0 non-idle sessions, 17,784 edges, and the coverage summary reads 17 ok / 0 STALE. **Nothing was written.** From here every command sets `PG_DATABASE` explicitly and I never `require` a builder to type-check it.

### 2026-09-26: [Lane B] W4a extracted into a HELD run and gated. READY TO SYNC (waiting for Lane C's `WRITE TURN RELEASED` and a granted W4a turn)

**HELD RUN ID: `20260926_082903-00e1d9fd`** (firebase, pinned commit `00e1d9fd`, path `output/runs/firebase-oskey-dev/20260926_082903-00e1d9fd/`; 15 modules, capability packs under `knowledge-pipeline/modules/*/capability-packs/`). For Lane A's scratch-DB join numbers. The W1 run `20260926_073212-00e1d9fd` is the one currently in the live DB. **Caution:** `output/firebase-oskey-dev/run-context.json` now points at the W4a run, so a firebase `sync-facts.ts` would load it; nobody syncs firebase outside a granted turn. Extraction only (`npm run pipeline:firebase`, writes under `output/`); no DB write, no sync, no `EMBED`, no edges; no `git add`/`git commit`. Live DB during this entry: 69,463 facts (Lane C's turn in progress), 17,784 edges, firebase current run still the W1 run.

**Extraction:** exit 0, 9 s, no parse errors (`ast-errors.json` empty), only the existing `UNRESOLVED_CALLS_WARNING`. Clone at `00e1d9fd`.

**Pre-sync fact-ID gate (firebase, the held run vs `facts.fact_id`, using the live `descriptionFor`):**

| | count |
|---|---|
| DB facts / run facts | 15,442 / 15,442 |
| **identical IDs** | **15,442** (includes all 28 trigger IDs, still `\|unknown\|` by design) |
| **new** | **0** |
| **would be pruned** | **0** |
| description changes | **0** |
| facts to (re-)embed | **0** (~0 tokens) |

Payload differences on the identical IDs (excluding `runId`, which changes on every fact by design): **existing values changed: only the 28 `firestore_trigger` facts** (`value` and `evidence.firestorePath`, `"unknown"` → the resolved path, `null` for the 2 auth triggers). **Additive keys only otherwise:** `firestore_trigger` +`evidence.firestorePathStatus/firestorePathResolutionMethod/firestorePathReason/triggerSource/triggerEvent` (28 each); `call_expression` +`evidence.resolvedPath` and `evidence.resolvedPathVia` (present on all 6,741, non-null on 528).

**Acceptance (from the held run's packs):** triggers 28 = 26 `firestore/resolved` + 2 `auth/not_applicable`; no `unknown` in `value` or `evidence.firestorePath`; `value == evidence.firestorePath` on all 28. Writers: **241 of 248** wrapper call sites have `resolvedPath` (was 101 readable); the 7 unresolved sites unchanged from the earlier entry (`document.controller.ts:264`, `document_and_message.controller.ts:45,49,53,57,65`, `organization_user_invitation.controller.ts:105`). No `resolvedPathStatus` / `resolvedPathParameter` keys exist. The W1 fields (registry, `clientFunctionName`, alias fields) carry over unchanged (0 differences from the live DB other than the above).

**Exact commands for the W4a write turn (only after `WRITE TURN RELEASED: Lane C` and `WRITE TURN GRANTED: Lane B W4a` are the last lines of the write-turn log):**
1. Preconditions: `run-context.json` = `20260926_082903-00e1d9fd`; live DB read-only counts (record them); re-run the gate against the then-live DB (it must still show 15,442 identical / 0 new / 0 pruned / 0 descriptions).
2. `pg_dump` to `output/backups/facts_index-2026-09-26-before-W4a.dump` and `pg_restore -l` it.
3. Sync, `EMBED` unset, all 15 modules (`REPO_NAME=firebase-oskey-dev MODULE_NAME=<module> node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts`): expected **0 new / 0 need embedding / 0 removed on every module** (the payload rewrite is why every module is synced, not because anything embeds). **Stop and ask if any module prints a non-zero new/need-embedding/removed.** No `EMBED=true` is needed (nothing to embed).
4. Read-only check: facts total unchanged from step 1, firebase 15,442 at the new run id, 0 without an embedding, current firebase run = the new run.
5. Plain `npm run pipeline:edges`; expected: firebase `INTRA_REPO_CALL`, `HTTP_API_CALL`, `PUBSUB_TOPIC_BINDING` and `FIRESTORE_EVENT_TRIGGER` counts unchanged (Lane A's W4a join change is not in the shared tree yet, so the trigger join still reads the sibling path facts; edge rows byte-identical), 0 dangling, all `edge_sync_state` slices ok, `FIELD_BINDING` 13.
6. Append the results and stop; the coordinator releases the turn. No `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`. If the live-DB classifier asks the user to approve a command, I wait and never work around a denial.

### Coordinator note 2026-09-26 (after a coordinator session gap): Lane C's W4c validated, released; Lane B's W4a granted

- **What happened:** the coordinator session hit a usage limit for about four hours; the lanes waited on standby. During that gap Lane C's turn ran (after the user approved the permission prompts in its window) but Lane C had not yet appended its completion entry, so the write-turn log still showed its grant as open.
- **W4c independently validated (coordinator, read-only, database state as found):** 69,463 facts (69,398 + 65), 17,784 edges (unchanged, as expected: the join for the new facts is W4d), 0 facts without an embedding, 0 dangling on source and target, 0 duplicate edge pairs, no active sessions. All five Swift repos and iOS have their new 2026-09-26 runs as current; Swift and iOS facts total 33,813 = 33,748 + 65 (only swift-cloud-kit grew). The 65 `firestore_client_call` facts: 64 `resolved_enum_template` + 1 `unresolved`; operations get 28, listen 22 (+1 unresolved), set 10, delete 4; descriptions carry the operation and path enum case (Lane A's `descriptionFor`). Embedding: one call, 65 facts, 6,849 tokens, not truncated (approved about 5.7k to 10k). Swift/iOS `INTRA_REPO_CALL` slice counts unchanged (ble 245, cloud 510, ui 625, webrtc 651, ios 8,734), `PACKAGE_SYMBOL_USE` 389, `HTTP_API_CALL` swift 34 (31 resolved / 3 unresolved); all 17 `edge_sync_state` slices rebuilt at 08:29:21 UTC with 0 dangling.
- **WRITE TURN RELEASED: Lane C W4c.** Lane C is asked to append its own completion entry (documentation only).
- **Shared-tree check before the next grant:** no builder edited since before Lane B's W1 edges (last edit 08:15 UTC), the shared `build-cross-repo-edges.ts` contains no W4a-field reads (Lane A's W4a join lives only in the untracked `_dev-w4a-build-cross-repo-edges.ts`), no active database sessions.
- **WRITE TURN GRANTED: Lane B W4a** (exclusive). The held run is `20260926_082903-00e1d9fd`; its gate was validated by the coordinator (15,442 identical, 0 new, 0 pruned, 0 description changes, only the 28 triggers' `value`/`firestorePath` change). Expected: 0 new / 0 to embed / 0 removed per module; edges byte-identical after `pipeline:edges` because the join in the tree still reads the sibling path facts. The tree stays frozen (no builder edits by anyone) until Lane B's turn is released.

### 2026-09-26: [Lane C] W4c DONE and write turn released (this entry supersedes "STOPPED at step 2" above). No `git add`/`git commit`; no `pipeline:swift-*` re-extraction; no `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`. Coordinator validated independently (session -47).

**Commands actually run, in order** (repo root; `EMBED` unset except step 3):
1. `docker exec facts-postgres-index-local pg_dump -U facts_index -Fc facts_index > output/backups/facts_index-2026-09-26-before-W4c.dump` (277,471,500 bytes); `pg_restore -l` on it: 57 TOC entries.
2. `REPO_NAME=<repo> MODULE_NAME=<module> node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts`, 7 times (below).
3. `EMBED=true REPO_NAME=swift-cloud-kit-oskey-dev MODULE_NAME=OSKCloudKit node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts` (the user approved this directly in the window once the step-2 counts were exactly 65).
4. `npm run pipeline:edges` (plain).

**Printed counts, EMBED unset** (new facts / needing embedding / still-valid / removed): swift-cloud-kit `OSKCloudKit` 65 / 65 / 2,522 / 0; swift-ui-kit `OSKUIKit` 0 / 0 / 2,482 / 0; swift-ble-kit `OSKBluetoothLEKit` 0 / 0 / 799 / 0; swift-webrtc-kit `OSKWebRTCKit` 0 / 0 / 2,487 / 0; ios `OSKDoorUnlockActivityExtension` 0 / 0 / 439 / 0, `OSKEYTests` 0 / 0 / 87 / 0, `iOS App` 0 / 0 / 24,932 / 0 (ios sums to 25,458). Read-only check afterwards: 69,463 facts (69,398 + 65), exactly 65 without an embedding (all swift-cloud-kit `firestore_client_call`, none elsewhere), every Swift repo's current run = the held run (`…073744-32772e4a`, `…073755-9a75c7c6`, `…073758-f8cdf199`, `…073801-e8aeea9d`, `…073857-e660bda2`), 0 facts on a non-current run, edges still 17,784.

**Embed (actual, from `embedding_calls`):** call_id 1129, 2026-09-26 08:28:44 UTC, swift-cloud-kit / OSKCloudKit, **65 facts, 6,849 total tokens**, `any_truncated` false, model `gemini-embedding-2`, 768 dimensions (billable characters not recorded by the script). Estimate was about 5.7k to 6.2k tokens, so 6,849 is about 10% above the top of that estimate and inside the approved 6k to 10k range. Afterwards 69,463 facts, 0 without an embedding.

**`pipeline:edges` summary:** exit 0. Swift and iOS slices as printed: `INTRA_REPO_CALL` ble 245 (71 probable, 174 unresolved), cloud-kit 510 (188 / 322), ui 625 (178 / 447), webrtc 651 (163 / 488), ios 8,734 (2,525 / 6,209); `PACKAGE_SYMBOL_USE` ios to ble 20, cloud-kit 135, ui 222, webrtc 12 (389 total); `HTTP_API_CALL` swift-cloud-kit to firebase 31 resolved, 3 unresolved; Angular 97 resolved / 5 unresolved; `PUBSUB_TOPIC_BINDING` unchanged. Coverage summary: expected pairs with zero edges none; dangling on resolved/confirmed edges 0 and 0 on statuses traversal never follows; all 17 `edge_sync_state` slices `ok`, recorded 08:29:20 UTC.
My own before/after comparison of the 35 edge-slice rows (counts plus md5 over source/target symbol, provenance, confirmed_via, details, source and target fact IDs), taken immediately before and after `pipeline:edges`: identical. Total edges 17,784, unchanged, as expected (the join for the new facts is W4d, Lane A, later).

**Prompts and deviations (all reported, none worked around).**
- The first step-2 sync command was **denied** by the auto-mode classifier ("Modify Shared Resources"); I stopped and logged it. The user then approved directly and in writing, including the embed, and every later command ran; no further denial occurred.
- The relayed pre-approval of the embed had come through the coordinator; I asked for the user's own confirmation, which they then gave directly.
- **W5c was not cleared by this turn:** the 151 dangling `INTRA_REPO_CALL` source IDs were already 0 before my `pipeline:edges` run (my pre-run snapshot shows dangling 0/0), because Lane A's W5a rebuild had already replaced those slices. Acceptance (dangling 0 on all statuses) holds, but the credit is Lane A's.
- One read-only verification command of mine hung (a heredoc via `/dev/stdin` to `docker exec`); it was my mistake, not a database issue, and it wrote nothing. The slice comparison it belonged to had already completed.
- Numbers that differ from the original spec, for the record: 65 call sites in 16 classes (spec: about 177, and my own first figure of 61 was a regex undercount); iOS has no direct Firestore path calls; embed 6,849 tokens.

**W4c acceptance (spec) against the live DB.** Every case of `OSKCKFirestoreCollectionPath` (17) and `OSKCKFirestoreDocumentPath` (15) has a template on its enum fact (`cases[].computedStrings`): 32/32. swift-cloud-kit has 65 `firestore_client_call` facts: 64 `resolved_enum_template` and 1 unresolved (`OSKCKUserBuildingSettingsService.swift:42`, local variable path, reason recorded); operations get 28, listen 23, set 10, delete 4; `pathKind` document 36, collection 28, null 1. Existing Swift fact IDs unchanged (0 changed, 0 pruned, 0 description changes on existing facts). ui, ble, webrtc and ios were re-synced (run id only) and needed no re-edging beyond the plain `pipeline:edges` run. Embedding spend was flagged first and approved.

**Held for later / open:** W4d (join of these facts to Firebase writers and triggers) is Lane A's, after Lane B's Angular W4b facts exist; the shared payload fields it needs are `evidence.value` (path template, leading `/`, `{param}`), `pathKind`, `operation`, `side`, `pathResolutionMethod`, `pathSource`. The unresolved local-binding call at `OSKCKUserBuildingSettingsService.swift:42` is a possible follow-up (track a local `let` bound to an enum case); the `Document.userBuildingAccesses` positional-name mismatch goes to the wiki team. Scratch files and the raw run logs in the session temp dir are deleted. Lane C's files: `swift-extractor/Sources/swift-extractor/main.swift`, `pipeline/swift/phase-01-ast-extraction/01-extract-ast-evidence.ts`, `02-build-module-evidence.ts`, and the new `_shared/firestore-client-calls.ts`.

- **WRITE TURN RELEASED: Lane C W4c** (requested here; the coordinator's release line is authoritative).

### 2026-09-26: [Lane B] W4a DONE (numbers) and write turn released

Turn `WRITE TURN GRANTED: Lane B W4a` (exclusive; last write-turn-log line was that grant, after `RELEASED: Lane C W4c`). Sequence exactly as in the READY TO SYNC entry. No `git add`/`git commit`; no `EMBED` (nothing to embed); no `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; no command was denied.

1. **Preconditions:** `run-context.json` = `20260926_082903-00e1d9fd`; live DB 69,463 facts (includes Lane C's 65), firebase 15,442, 17,784 edges, 0 without an embedding, no active sessions; firebase current run = the W1 run. **Gate re-run against the then-live DB:** 15,442 identical, 0 new, 0 would be pruned, 0 description changes, 0 to embed.
2. **Dump:** `output/backups/facts_index-2026-09-26-before-W4a.dump` (276,299,438 bytes, gitignored, `pg_restore -l` lists 57 entries). This is the restore point (`before-W4a`).
3. **Sync, `EMBED` unset, all 15 modules:** every module printed **0 new, 0 need embedding, 0 removed** (15 of 15; the sync loop was set to stop on any other value and did not stop).
4. **Read-only check:** facts 69,463 (unchanged); firebase 15,442, all at `20260926_082903-00e1d9fd`; other repos 54,021 (untouched); **0 facts without an embedding**; current firebase run = the W4a run; 2 triggers with a null `value` (the auth triggers), **0 triggers with `unknown`** in `value` or `evidence.firestorePath`; **528 call facts with `resolvedPath`**; edges still 17,784.
5. **Edges:** plain `npm run pipeline:edges`, exit 0. **All 17,784 edge rows are identical before and after, including the content hash of symbols/details (0 removed, 0 added),** as predicted (the shared tree has no W4a-field reads, so the trigger join still uses the sibling path facts). Firebase `INTRA_REPO_CALL` 2,372 (2,350 confirmed, 22 unresolved) unchanged; `FIRESTORE_EVENT_TRIGGER` 17; `FIELD_BINDING` 13 before → 13 after; 0 dangling on resolved/confirmed edges and 0 on the other statuses; shrink guard did not fire; **all 17 `edge_sync_state` slices `ok`** (the 28 triggers' payload change was fully absorbed by the rebuild, no leftover STALE).

**What W4a delivered (spec acceptance):** no trigger has `unknown` (auth triggers marked `triggerSource = auth`, path `null`); readable-path writers up from 101 to **241 of 248** (7 base-controller pass-throughs unchanged, listed in the earlier entry); triggers with a structured path 26 of 26; existing 17 edges preserved; `firestore_path_touched` fields unchanged; existing fact IDs identical (15,442). The reach improvement (11 → about 17 of 26 triggers) needs Lane A's W4a join change (still not in the shared tree); the facts it reads are now live.

**State left behind:** live DB = post-W4a (69,463 facts, 17,784 edges, firebase run `20260926_082903-00e1d9fd`). Restore point `facts_index-2026-09-26-before-W4a.dump`. Scratch files deleted (gate script kept in the session scratchpad for W3's gate). Nothing running. Next in my lane: **W3** (approved; Angular to be pinned to `8345d222` first, code, held run, its own gate); its write turn queues after this release.

- 2026-09-26 (Lane B): write turn released. Requesting `WRITE TURN RELEASED: Lane B W4a` from the coordinator.

### Coordinator note 2026-09-26 (12:42 UTC): Lane B's W4a validated and released; W4c edge-identity check closed

- **W4a independently validated (coordinator, read-only, live database):** 69,463 facts, 17,784 edges, 0 missing embeddings, 0 dangling, no active sessions. Firebase current run is now `20260926_082903-00e1d9fd` (15,442 facts). The 28 triggers: **26 `firestore/resolved` + 2 `auth/not_applicable` (null value)**, 0 with `unknown` in `value` or `evidence.firestorePath`; **all 28 trigger fact IDs still carry the legacy `|unknown|` key by design (IDs and `fact_ref`s unchanged)**. 528 call facts have `resolvedPath`; 0 facts carry the dropped `resolvedPathStatus`. `edge_sync_state`: 17 slices, newest build 12:40:05 UTC, 0 dangling.
- **Edge identity, both turns (closes Lane C's unfinished check):** extracted `cross_repo_edges` straight from `facts_index-2026-09-26-before-W4c.dump` (`pg_restore -a -t`, no database created) and compared every column except `edge_id`/`synthesis_id`/`generated_at` per `(connection_type, source_repo)` slice against the live table **after Lane B's W4a `pipeline:edges` (12:40:05 UTC)**: 17,784 rows both sides, **17 of 17 slices identical, 0 different**. So W4c and W4a changed no edge, as expected.
- **WRITE TURN RELEASED: Lane B W4a.** No write turn is open. (Lane C's turn was released earlier in this log; Lane C has not yet appended its own completion entry.)
- **Note on turn state:** cross-session messages to the lanes were held for the user's approval, so the lanes' own views of turn state lagged this log for a while (Lane B ran its W4a turn only after its grant was delivered). The log above is authoritative.
- **Lane B is proceeding with W3** (approved by the user; pin Angular to `8345d222`, write the code, extract to a HELD run; files only, no live writes).

### 2026-09-26: [Lane A] W4a join: REAL numbers from Lane B's held run (scratch only; nothing live; awaiting the coordinator's approval before anything is queued)

Session `-29`. No live write, no `git add`/`git commit`, no `sync-facts.ts` on live, no `EMBED`. The shared tree was not touched (frozen); the change is still only in the untracked copy `pipeline/facts-postgres-index/_dev-w4a-build-cross-repo-edges.ts`. Scratch databases were `facts_index_join_scratch` and `facts_index_join_scratch_pre` (both dropped below; `facts_index`, `facts_index_prebuild` untouched; `PG_DATABASE` explicit and `current_database()` checked on every command).

**Setup.** `facts_index_join_scratch` restored from `output/backups/facts_index-2026-09-26-before-W4c.dump` (post-W1, edges 17,784); Lane B's held run `20260926_082903-00e1d9fd` loaded into it with `sync-facts.ts` for all 15 firebase modules, `EMBED` off: firebase 15,442 facts, current run the W4a run, **0 facts without an embedding** (no description changed, so no re-embed, as Lane B predicted). Then the dev join copy, dry run first, then a real run on the scratch.

**Numbers (`firestore-trigger`, dev copy, W4a facts present):**
- **Triggers:** 28 facts = 26 usable, path from the trigger's own `evidence.firestorePath` for **26**, from the sibling fact for 0; **2 auth triggers skipped explicitly** (`user/index.ts:84 auth.user().onCreate`, `:85 onDelete`); 0 with no path / ambiguous / unknown event / no handler; 0 WARN disagreements between the trigger's path and the sibling fact.
- **Writers with a known collection path: 241 of 248** (was 101), **all 241 via `evidence.resolvedPath`**; unknown for **7**. 26 known-path sites land on a trigger collection; 1 more had no enclosing method fact and was skipped (see below).
- **Edges: FIRESTORE_EVENT_TRIGGER 17 → 31, all `resolved`** (31 resolved, 0 other); 31 distinct writer-method → handler pairs reaching **16 of 26 triggers** (handlers: OSKUserService 8, OSKUserDeviceService 6, OSKCompositeRoleService 6, OSKAccessControlDeviceConfigService 4, OSKUserNotificationService 2, OSKAccessControlDeviceService 3, OSKAccessControlDevicePublicKeysService 2). 0 dangling source or target on the slice.
- **Existing 17 preserved: 17 of 17 are byte-identical in the new set** (same source and target fact ids, `source_symbol`, `target_symbol`, status and `details`), **0 missing**.
- **Slice fingerprint (`connection_type / source_repo`, excludes edge_id/synthesis_id/generated_at):** live and pre-W4a scratch `a5f4e7903e9735de8aeb459f9dd97ac5` (17 edges); W4a scratch after the real run `edca9030240cb1381737a927c001d887` (31 edges). **The other 16 slices are identical between the scratch and live** (the join replaces only its own slice).
- **Fallback check, W4a facts ABSENT** (fresh scratch `facts_index_join_scratch_pre` from the same dump, firebase still on the W1 run: 0 call facts with `resolvedPath`, 28 triggers with `firestorePath = "unknown"`): real run of the dev copy: paths from the sibling fact for 26, writers known for 101 of 248, **17 resolved edges reaching 11 of 26, slice fingerprint identical (`a5f4e790…`)**. So a scratch run without W4a facts reproduces today's behaviour exactly.

**Versus the expectation (about 17 of 26, 9 unreached): 16 of 26 reached, 10 unreached. The 1 difference is explained, not adjusted.** The 10 unreached triggers and why (each confirmed against the source or the facts):
1. **7 path mismatches inside the repo** (Lane B's finding, `functions/src/modules/settings/modules/`): `create /setting/roles/roles/{roleId}` (writers use `/settings/roles/roles`); `create|update|delete /setting/workflows/organizationRequest/{workflowId}` (writers `/settings/workflows/organizationRequests`); `create|update|delete /settings/workflows/buildingRequests/{workflowId}` (writers `/settings/workflows/buildingRequest`). Correctly no edge: a wrong match is worse than none.
2. **2 `onDelete` triggers with no wrapper writer at all:** `delete /accessControlDevices/{deviceId}` and `delete /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` (no write-wrapper call for a delete on those collections).
3. **1 trigger with a writer the join cannot attribute:** `create /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`. Its writers, `building_door_access_control_device.controller.ts:57` (`_set`) and `:67` (`_update`) resolve to `/buildings/{buildingId}/doors/{doorId}/accessControlDevices`, but they are **arrow-function class properties** (`set = async (...) => { ... }`), for which the extractor records no `callerName`/`callerStartLine` and there is no `class_method` fact, so there is no source fact to hang an edge on (the join skipped it as "no single enclosing method fact"). Lane B's offline replication did not need an enclosing fact, which is why it counted 17. **This is an extractor gap for Lane B (arrow-function properties have no caller attribution), not a join defect;** fixing it would add this edge (16 → 17 triggers) and probably others elsewhere in the repo.

**The 7 write-wrapper call sites with no known path, and their generic reason (printed by the join, computed from the fact, no name list):** `core/controllers/document_and_message.controller.ts:45` `_create(collection)`, `:49` `_set(collection)`, `:53` `_update(collection)`, `:57` `_delete(collection)`, `:65` `_deleteAll(collection)`; `core/controllers/document.controller.ts:264` `_delete(collection)`; `organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts:105` `_update(collectionName)`. Reason: "first argument is not a literal and no evidence.resolvedPath was extracted, so the collection is not statically known at this call site." These are exactly Lane B's 7 `parameter_passthrough` sites.

**Also in the join log (unchanged behaviour):** 5 base-controller methods called from other files are in neither the write table nor the known-reader list: `_deleteImage` (4 call sites), `_publishMessage` (4), `_uploadImage` (4), `_removeFromArrayField` (1), `_removeFromArrayFieldByPredicate` (1). None is treated as a writer; `_removeFromArrayField*` is doc 38 P1's follow-up.

**What is needed to take this live (after the coordinator approves the numbers):** in a Lane A write turn after Lane B's W4a release: (1) the dev copy replaces `build-cross-repo-edges.ts` (diff shown first), together with the `require.main === module` guard; (2) a plain `pipeline:edges` (expected: FIRESTORE_EVENT_TRIGGER 17 → 31, everything else unchanged). Until Lane B's W4a facts are in the live DB the copy behaves exactly like today's join (fallback proven above), so it could also enter the tree before the sync without changing any edge.
- scratch databases dropped (`\l`: facts_index, facts_index_prebuild, postgres, templates); scratch files deleted.

### 2026-09-26: [Lane B] W3 extracted into a HELD run and gated. READY TO SYNC (waiting for its write turn, queued after W4a's release)

Approved by the user via the coordinator (proposals 1-3 incl. the wider root-file scope). Files only: no sync, no `EMBED`, no edges, no DB write; no `git add`/`git commit`. **HELD RUN ID: `20260926_125017-8345d222`** (angular, pinned commit `8345d222a7f9879282de7b0a49f63f4771bdc1b2`, `output/runs/angular-app-oskey-io/20260926_125017-8345d222/`). The DB's current Angular run is still `20260923_110233-8345d222`. **Caution:** `output/angular-app-oskey-io/run-context.json` now points at the held run, so an Angular `sync-facts.ts` would load it; nobody syncs Angular outside a granted turn.

**Conditions met:** (1) `git ls-remote` before the run: `staging` = `8345d222…` (no drift); `config/repos.json` Angular entry now uses `commit` (full SHA) instead of `branch`, with a note. (2) Existing IDs identical (below). (3) Tolerance 0: **no parse error** (`ast-errors.json` empty; only the existing `UNRESOLVED_CALLS_WARNING`, 25 calls). (4) **Root module name: `app_root`**, set by `rootFilesModule` in the Angular config entry; the scan fails closed if it equals a directory under `modulesRoot` (today: `components`, `core`, `features`) or if the key is set and no `.ts` file sits directly in `modulesRoot`; it picked up exactly 3 files: `app.component.ts`, `app.config.ts`, `app.routes.ts` (spec excluded).

**Code (Lane B files only).** `00-scan-repo.ts` (angular): `rootFilesModule` discovery, dynamic, adds the module to `modules.json`. `01-extract-ast-evidence.ts` (angular): the template walk is split into `recordNode` / `visitNode`; **pass 1 is the original walk unchanged** (so existing facts keep order, ID and `#n` ordinal), **pass 2** uses Angular's own `TmplAstRecursiveVisitor` and records only elements pass 1 never saw, appended after; a pre-pass (`FormGroupChainVisitor`, ancestor stack) supplies `formGroupChain` / `formControlPath`. `02-build-module-evidence.ts`: no change needed (`evidence: { ...item }`).

**Pre-sync fact-ID gate (angular, held run vs `facts.fact_id`, live `descriptionFor`):**

| | count |
|---|---|
| DB facts / run facts | 8,747 / 8,910 |
| **identical IDs** | **8,747** (all) |
| **new** | **163** = `app_root` 98 + `features` 65 (components 0, core 0) |
| **would be pruned** | **0** |
| **description changes on existing facts** | **0** (no import re-resolution this time: the root files are imported by nothing that existed) |
| to embed | **163 new = about 6.8k tokens by chars/4 (upper bound about 15.5k at 95/fact)** |

New facts by kind: `app_root`: `call_expression` 36, `imports_dependency` 31, `angular_template_composition` 11, `angular_template_binding` 6, `angular_route` 5, `class_method` 4, `source_file` 3, `angular_component` 1, `source_class` 1. `features`: `angular_template_composition` 33, `angular_template_binding` 30, `angular_template_attribute` 2 (exactly the estimate: the 94 hidden elements in the two email-link templates and `sign-in.component.html`). The 5 root routes: `**`, ``, `auth`, `organization/:organizationId`, `user`.
Payload changes on the 8,747 existing facts (excluding `runId`, which changes on every fact by design): **no existing value changes**; additive only: `formGroupChain` + `formControlPath` on the 82 static and 61 bound existing `formControlName` facts.

**Acceptance against my independent source count (comments stripped, all `.html`):** static `formControlName` **84 = 84**, bound **67 = 67**, total **151 = 151** (was 82 / 61); nested under a group/array **53 = 53** (chains: `streetAddress` 24, `address` 9, `streetAddress.coordinate` 8, `staffMembers.i` 5, `staffMembers.$index` 5, `phone` 2). `sign-up-with-email-link`: `phone.isoCountryCode` (:50), `phone.localPhoneNumber` (:63), `firstName`, `lastName`, `email`; `sign-in-with-email-link`: `email`; array controls read `staffMembers.{$index}.email` / `staffMembers.{i}.firstName` etc. The three templates now yield facts (sign-in-with-email-link 11, sign-up-with-email-link 36, app.component.html 17; `sign-in.component.html` now 21 instead of 3).

**Downstream effects to note, not acted on (per the coordinator):** `extract-screen-map-angular.ts` will see a second module with `angular_route` facts (`app_root`, 5 routes, blank screen names for a human); the `FIELD_BINDING` lineage may gain edges from the extra controls (check afterwards: the existing 13 are a subset); `INTRA_REPO_CALL` for Angular may grow (36 root calls).

**Exact commands for the W3 write turn (only after `WRITE TURN RELEASED: Lane B W4a` and `WRITE TURN GRANTED: Lane B W3` are the last lines of the write-turn log):**
1. Preconditions: `run-context.json` = `20260926_125017-8345d222`; record live counts (facts, angular facts 8,747, edges); re-run the gate against the then-live DB (must still show 8,747 identical / 163 new / 0 pruned / 0 description changes on existing).
2. `pg_dump` to `output/backups/facts_index-2026-09-26-before-W3.dump` + `pg_restore -l`.
3. Sync, `EMBED` unset, 4 modules (`REPO_NAME=angular-app-oskey-io MODULE_NAME=<m> node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts`): **expected new / need embedding / removed: components 0/0/0, core 0/0/0, features 65/65/0, app_root 98/98/0. Stop and ask if any differs.**
4. Read-only check: facts total = previous + 163; angular 8,910 at the new run; exactly 163 angular facts without an embedding; current Angular run = the held run.
5. `EMBED=true` only after the user confirms directly in the window: modules `features` and `app_root`; record actual tokens from `embedding_calls`.
6. Plain `npm run pipeline:edges`; verify: shrink guard silent, 0 dangling, all `edge_sync_state` slices ok, the old Angular `INTRA_REPO_CALL` set is a subset of the new one (report rows added and by target module), `HTTP_API_CALL` angular slice unchanged (97 resolved, 5 unresolved), `FIELD_BINDING` 13 old ⊆ new (report any added), every other slice byte-identical.
7. Append results and stop; the coordinator releases. No `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; if the live-DB classifier asks the user to approve a command, I wait and never work around a denial.

### Coordinator note 2026-09-26 (about 13:00 UTC): Lane A's W4a join numbers approved; Lane B's W3 gate validated; Lane A's turn granted

- **Lane A's W4a join numbers independently reproduced (coordinator, read-only):** ran the dev copy `_dev-w4a-build-cross-repo-edges.ts --join=firestore-trigger --dry-run` against the live database with `PG_DATABASE` set explicitly (writes nothing; live edges unchanged at 17,784 / trigger slice 17): **31 resolved edges (from 17), reaching 16 of 26 triggers; 26 triggers use their own `evidence.firestorePath`, 2 auth triggers skipped explicitly; 241 of 248 writers have a known path, all 241 via `evidence.resolvedPath`; 7 unknown = the base-controller sites, each with the generic reason.** The 14 new edges read correctly (for example `OSKUserController.create -> OSKUserService.onDocumentCreated`, updates -> `onDocumentUpdated`, deletes -> `onDocumentDeleted`, `OSKUserDeviceController.save -> created + updated`). The shared-file diff is fully additive with the fallback to the sibling fact when the new fields are absent. The 10 unreached triggers: 7 real path mismatches (see the dead-triggers finding), 2 `onDelete` triggers with no wrapper writer, 1 with writers inside arrow-function class properties (`set = async (...) =>`), which the extractor records without an enclosing method: **routed to Lane B as W4e scope**.
- **Lane B's W3 held run independently validated:** run `20260926_125017-8345d222`, pinned via `commit` in `config/repos.json`. Gate vs the live DB: **8,747 identical, 163 new (app_root 98, features 65), 0 pruned; 0 existing values changed** (additive keys `formGroupChain`/`formControlPath` on 143 controls only). Controls in the held run: **84 static (`angular_template_attribute`) and 67 bound (`angular_template_binding`)**, matching the wiki's 84/67. New root routes: 5 `angular_route` facts.
- **WRITE TURN GRANTED: Lane A W4a-join** (exclusive; edges only): replace the shared `build-cross-repo-edges.ts` with the approved dev copy plus the `require.main === module` guard (diff posted in the log first), table-only dump, plain `pipeline:edges`. Expected: `FIRESTORE_EVENT_TRIGGER` 17 -> 31, total edges 17,784 -> 17,798, every other slice byte-identical, 0 dangling.
- **Next turn after that:** Lane B W3 (163 new facts; embed about 6.8k tokens needs the user's direct confirmation).

### 2026-09-26: [Lane A] W4a join write turn started (granted by the coordinator's line in this log). Diff posted BEFORE applying

**Rollback:** `output/backups/edges-2026-09-26-before-W4a-join.dump` (table-only: `cross_repo_edges` + `edge_sync_state`, 728,805 bytes; `pg_restore -l` lists both tables and both TABLE DATA entries), or revert the code and re-run `pipeline:edges`.

**1. The `require.main === module` guard (already applied to `build-cross-repo-edges.ts`, `build-intra-repo-edges.ts`, `build-form-field-lineage-edges.ts`, `build-edges.ts`; this is the only change in the last three).** The last lines of each builder were `main().catch(err => {console.error(err); process.exit(1);});`; now:
```ts
// Run only when executed (`node -r ts-node/register <file>`), never on import: importing this file to type-check it must not start a run against the database (2026-09-26 near-miss, doc 43).
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
```
(`build-edges.ts`: the same guard on its one-line `main().catch(...)`.) **Proof:** importing each of the four with `PG_DATABASE` set to a database that does not exist prints only "imported, nothing started" (before the guard the import ran `main()`); executing `build-cross-repo-edges.ts --join=firestore-trigger --dry-run` directly still runs main (existing 17 -> new 17, "nothing written"); `pipeline:edges --dry-run --steps=intra --repos=...` still runs the intra builder as a child process and ends with the coverage summary (17 ok).

**2. The W4a replacement: `_dev-w4a-build-cross-repo-edges.ts` (v1.10.0, with the guard) over `build-cross-repo-edges.ts` (v1.9.0 + guard). The full diff, shared -> dev:**
```diff
@@ -1,4 +1,4 @@
-// **version:** 1.9.0
+// **version:** 1.10.0
 // **location:** level-5 P2 facts index
 // © Oskey SAS. All rights reserved.
 //
@@ -150,6 +150,17 @@
   // NOTE the kind also tags Firebase AUTH triggers (`auth.user().onCreate`); those have
   // no sibling path fact and are skipped as "no path".
   TRIGGER_KIND: "firestore_trigger",
+  // W4a (2026-09-26, Lane B's extractor): a trigger fact now carries its own document path in
+  // `evidence.firestorePath` (and top-level `value`), the receiver kind in `evidence.triggerSource`
+  // ("firestore", or "auth" for a Firebase Auth trigger, which has no path), and the registration
+  // event in `evidence.triggerEvent` ("create" | "update" | "delete" | "write"). Facts extracted
+  // before W4a have `firestorePath = "unknown"` and none of the other two; the join then falls back
+  // to the sibling `firestore_path_touched` fact exactly as before.
+  TRIGGER_PATH: "firestorePath", // under payload.evidence
+  TRIGGER_PATH_UNKNOWN: "unknown", // the pre-W4a placeholder
+  TRIGGER_SOURCE: "triggerSource", // under payload.evidence
+  TRIGGER_SOURCE_AUTH: "auth",
+  TRIGGER_EVENT: "triggerEvent", // under payload.evidence
   TRIGGER_CALLEE: "calleeExpression", // under payload.evidence
   TRIGGER_HANDLER_EXPRESSION: "handlerExpression", // under payload.evidence, e.g. "Service.onDocumentCreated"
   TRIGGER_HANDLER_NAME: "handlerName", // under payload.evidence
@@ -172,6 +183,11 @@
   CALL_CALLER_NAME: "callerName", // under payload.evidence
   CALL_CALLER_CLASS: "callerClass", // under payload.evidence
   CALL_CALLER_START_LINE: "callerStartLine", // under payload.evidence
+  // W4a: `evidence.resolvedPath` is the first argument resolved to a path template (`{param}` for a
+  // parameter, e.g. "/buildings/{buildingId}/doors"), set only where it resolves to a path-shaped
+  // string; absent/null otherwise. Facts extracted before W4a have none: the writer path is then read
+  // from the literal in `arguments[0]` as before.
+  CALL_RESOLVED_PATH: "resolvedPath", // under payload.evidence
 } as const;
 
 // Stage E (Firestore triggers). The Firebase repo's base controllers (core/controllers/
@@ -1064,6 +1080,14 @@
 
 // Same length; a trigger wildcard matches any writer segment; a writer wildcard never
 // matches a trigger literal (it cannot be shown to be that collection).
+// A resolved path template ("/a/{x}/b"), as the W4a extractor writes `evidence.resolvedPath`: a segment that is
+// or contains a `{param}` placeholder is a wildcard, every other segment a literal. Unlike staticPathSegments
+// this text is not quoted.
+function templatePathSegments(text: string | undefined | null): Seg[] | null {
+  if (!text) return null;
+  const segs = text.trim().split("/").filter(s => s.length > 0);
+  return segs.length === 0 ? null : segs.map(s => (s.includes("{") ? null : s));
+}
 function collectionMatches(writer: Seg[], trigger: Seg[]): boolean {
   return writer.length === trigger.length && writer.every((w, i) => trigger[i] === null || (w !== null && w === trigger[i]));
 }
@@ -1100,9 +1124,10 @@
 
   async compute(db, sourceRepos) {
     const ev = (field: string) => `payload->'evidence'->>'${field}'`; // field names are CONTRACT constants, never user input
-    const triggers = await db.query<{ fact_id: string; repo: string; file: string; line: number; run_id: string | null; callee: string | null; handler_expr: string | null; handler_name: string | null; handler_file: string | null; handler_line: string | null; handler_res: string | null }>(
+    const triggers = await db.query<{ fact_id: string; repo: string; file: string; line: number; run_id: string | null; callee: string | null; handler_expr: string | null; handler_name: string | null; handler_file: string | null; handler_line: string | null; handler_res: string | null; fs_path: string | null; trig_source: string | null; trig_event: string | null }>(
       `SELECT fact_id, repo, file, line, payload->>'${CONTRACT.FACT_RUN_ID}' AS run_id, ${ev(CONTRACT.TRIGGER_CALLEE)} AS callee, ${ev(CONTRACT.TRIGGER_HANDLER_EXPRESSION)} AS handler_expr,
-              ${ev(CONTRACT.TRIGGER_HANDLER_NAME)} AS handler_name, ${ev(CONTRACT.TRIGGER_HANDLER_FILE)} AS handler_file, ${ev(CONTRACT.TRIGGER_HANDLER_START_LINE)} AS handler_line, ${ev(CONTRACT.TRIGGER_HANDLER_RESOLUTION)} AS handler_res
+              ${ev(CONTRACT.TRIGGER_HANDLER_NAME)} AS handler_name, ${ev(CONTRACT.TRIGGER_HANDLER_FILE)} AS handler_file, ${ev(CONTRACT.TRIGGER_HANDLER_START_LINE)} AS handler_line, ${ev(CONTRACT.TRIGGER_HANDLER_RESOLUTION)} AS handler_res,
+              ${ev(CONTRACT.TRIGGER_PATH)} AS fs_path, ${ev(CONTRACT.TRIGGER_SOURCE)} AS trig_source, ${ev(CONTRACT.TRIGGER_EVENT)} AS trig_event
        FROM facts WHERE repo = ANY($1::text[]) AND kind = $2 ORDER BY repo, file, line`,
       [sourceRepos, CONTRACT.TRIGGER_KIND]
     );
@@ -1131,34 +1156,51 @@
     // 1. Triggers: path (sibling fact), event (callee), handler (declaration fact).
     type Trig = { fact_id: string; repo: string; file: string; line: number; event: string; path: string; collection: Seg[]; handler: { fact_id: string; repo: string; file: string; line: number }; handlerExpr: string };
     const trigs: Trig[] = [];
-    const notes = { noPath: [] as string[], ambiguousPath: [] as string[], unknownEvent: [] as string[], noHandler: [] as string[] };
+    const notes = { noPath: [] as string[], ambiguousPath: [] as string[], unknownEvent: [] as string[], noHandler: [] as string[], auth: [] as string[], disagree: [] as string[] };
+    let pathFromTrigger = 0, pathFromSibling = 0;
     const wantHandlers = triggers.rows.filter(t => t.handler_res === CONTRACT.TRIGGER_HANDLER_RESOLVED && t.handler_name && t.handler_file && t.handler_line && Number.isFinite(Number(t.handler_line)))
       .map(t => ({ repo: t.repo, file: t.handler_file!, name: t.handler_name!, line: Number(t.handler_line) }));
     const handlerFacts = await lookupDecls(wantHandlers);
     for (const t of triggers.rows) {
       const where = `${t.file}:${t.line}`;
       // The callee can span lines (`db\n .document(p)\n .onCreate`), so the pattern must cross newlines.
-      const eventName = FIRESTORE_TRIGGER_EVENTS[(t.callee ?? "").replace(/^[\s\S]*\./, "").trim()];
-      const paths = pathsAt.get(siblingKey(t.repo, t.file, t.line, t.run_id)) ?? [];
+      // A Firebase Auth trigger has no Firestore path by design (W4a marks it triggerSource = auth): not a "missing path".
+      if (t.trig_source === CONTRACT.TRIGGER_SOURCE_AUTH) { notes.auth.push(`${where} (${(t.callee ?? "").replace(/\s+/g, " ").slice(0, 60)})`); continue; }
+      // The callee's last identifier gives the event; for a registration style it does not name, the extractor's own triggerEvent.
+      const eventName = FIRESTORE_TRIGGER_EVENTS[(t.callee ?? "").replace(/^[\s\S]*\./, "").trim()]
+        ?? (t.trig_event && Object.values(FIRESTORE_TRIGGER_EVENTS).includes(t.trig_event) ? t.trig_event : undefined);
+      const siblingPaths = pathsAt.get(siblingKey(t.repo, t.file, t.line, t.run_id)) ?? [];
+      // The trigger's own path first (W4a); the sibling firestore_path_touched fact only when the trigger carries none
+      // (a fact extracted before W4a, whose path is the placeholder "unknown"). Where both exist and differ: warn, and trust the trigger.
+      const ownPath = t.fs_path && t.fs_path !== CONTRACT.TRIGGER_PATH_UNKNOWN ? t.fs_path : null;
+      if (ownPath && siblingPaths.length === 1 && siblingPaths[0] !== ownPath) notes.disagree.push(`${where}: trigger '${ownPath}' vs sibling fact '${siblingPaths[0]}'`);
+      const paths = ownPath ? [ownPath] : siblingPaths;
       if (paths.length === 0) { notes.noPath.push(`${where} (${(t.callee ?? "").replace(/\s+/g, " ").slice(0, 60)})`); continue; }
       if (paths.length > 1) { notes.ambiguousPath.push(`${where}: ${paths.join(" | ")}`); continue; }
       if (!eventName) { notes.unknownEvent.push(`${where}: ${(t.callee ?? "").replace(/\s+/g, " ").slice(0, 60)}`); continue; }
       const hf = t.handler_res === CONTRACT.TRIGGER_HANDLER_RESOLVED && t.handler_name && t.handler_file ? (handlerFacts.get(declKey(t.repo, t.handler_file, t.handler_name, Number(t.handler_line))) ?? []) : [];
       if (hf.length !== 1) { notes.noHandler.push(`${where}: ${t.handler_expr ?? t.handler_name} (${hf.length} declaration facts)`); continue; }
+      if (ownPath) pathFromTrigger++; else pathFromSibling++;
       const segs = pathSegments(paths[0]);
       trigs.push({ fact_id: t.fact_id, repo: t.repo, file: t.file, line: t.line, event: eventName, path: paths[0], collection: segs.slice(0, -1), handler: hf[0], handlerExpr: t.handler_expr ?? t.handler_name! });
     }
-    console.log(`  Triggers: ${triggers.rows.length} facts -> ${trigs.length} usable (path from sibling fact, event, handler fact). Skipped: ${notes.noPath.length} with no sibling path fact${notes.noPath.length ? ` [${notes.noPath.join("; ")}]` : ""}, ${notes.ambiguousPath.length} ambiguous path, ${notes.unknownEvent.length} unknown event, ${notes.noHandler.length} handler fact not found${notes.noHandler.length ? ` [${notes.noHandler.join("; ")}]` : ""}.`);
+    console.log(`  Triggers: ${triggers.rows.length} facts -> ${trigs.length} usable (path from the trigger's own evidence.${CONTRACT.TRIGGER_PATH} for ${pathFromTrigger}, from the sibling fact for ${pathFromSibling}). Skipped: ${notes.auth.length} auth trigger(s) with no Firestore path${notes.auth.length ? ` [${notes.auth.join("; ")}]` : ""}, ${notes.noPath.length} with no path${notes.noPath.length ? ` [${notes.noPath.join("; ")}]` : ""}, ${notes.ambiguousPath.length} with ambiguous paths, ${notes.unknownEvent.length} with an unknown event${notes.unknownEvent.length ? ` [${notes.unknownEvent.join("; ")}]` : ""}, ${notes.noHandler.length} with no handler fact${notes.noHandler.length ? ` [${notes.noHandler.join("; ")}]` : ""}.`);
+    for (const d of notes.disagree) console.log(`  WARN trigger path disagreement (the trigger's own path is used): ${d}`);
     for (const a of notes.ambiguousPath) console.log(`  AMBIGUOUS trigger path (skipped): ${a}`);
 
     // 2. Writers: calls resolved to a write wrapper, with their enclosing method fact.
-    const writers = await db.query<{ fact_id: string; repo: string; file: string; line: number; wrapper: string; decl_file: string | null; arg0: string | null; caller_name: string | null; caller_class: string | null; caller_line: string | null }>(
-      `SELECT fact_id, repo, file, line, ${ev(CONTRACT.CALL_DECLARATION_METHOD)} AS wrapper, ${ev(CONTRACT.CALL_DECLARATION_FILE)} AS decl_file, payload->'evidence'->'${CONTRACT.CALL_ARGUMENTS}'->>0 AS arg0,
+    const writers = await db.query<{ fact_id: string; repo: string; file: string; line: number; wrapper: string; decl_file: string | null; arg0: string | null; resolved_path: string | null; caller_name: string | null; caller_class: string | null; caller_line: string | null }>(
+      `SELECT fact_id, repo, file, line, ${ev(CONTRACT.CALL_DECLARATION_METHOD)} AS wrapper, ${ev(CONTRACT.CALL_DECLARATION_FILE)} AS decl_file, payload->'evidence'->'${CONTRACT.CALL_ARGUMENTS}'->>0 AS arg0, ${ev(CONTRACT.CALL_RESOLVED_PATH)} AS resolved_path,
               ${ev(CONTRACT.CALL_CALLER_NAME)} AS caller_name, ${ev(CONTRACT.CALL_CALLER_CLASS)} AS caller_class, ${ev(CONTRACT.CALL_CALLER_START_LINE)} AS caller_line
        FROM facts WHERE repo = ANY($1::text[]) AND kind = $2 AND ${ev(CONTRACT.CALL_RESOLUTION_STATUS)} = $3 AND ${ev(CONTRACT.CALL_DECLARATION_METHOD)} = ANY($4::text[]) ORDER BY repo, file, line`,
       [sourceRepos, CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_RESOLUTION_OK, Object.keys(FIRESTORE_WRITE_WRAPPERS)]
     );
-    const derivable = writers.rows.filter(w => staticPathSegments(w.arg0) !== null);
+    // The writer's collection path: the extractor's resolved template (W4a) when present, else the literal in
+    // arguments[0] (a fact extracted before W4a, or a call the extractor could not resolve but is a literal).
+    const writerSegments = (w: { arg0: string | null; resolved_path: string | null }): Seg[] | null =>
+      (w.resolved_path ? templatePathSegments(w.resolved_path) : null) ?? staticPathSegments(w.arg0);
+    const derivable = writers.rows.filter(w => writerSegments(w) !== null);
+    const viaResolvedPath = derivable.filter(w => !!w.resolved_path && templatePathSegments(w.resolved_path) !== null).length;
     const enclosing = await lookupDecls(derivable.filter(w => w.caller_name && w.caller_line && Number.isFinite(Number(w.caller_line))).map(w => ({ repo: w.repo, file: w.file, name: w.caller_name!, line: Number(w.caller_line) })));
 
     // 3. Match, one edge per (writer method, handler).
@@ -1167,7 +1209,7 @@
     let unattributed = 0, matchedSites = 0;
     const reached = new Set<string>();
     for (const w of derivable) {
-      const wsegs = staticPathSegments(w.arg0)!;
+      const wsegs = writerSegments(w)!;
       const fires = FIRESTORE_WRITE_WRAPPERS[w.wrapper];
       const hits = trigs.filter(t => t.repo === w.repo && fires.includes(t.event) && collectionMatches(wsegs, t.collection));
       if (hits.length === 0) continue;
@@ -1178,7 +1220,9 @@
         reached.add(t.fact_id);
         const key = `${m[0].fact_id}\u0000${t.handler.fact_id}`;
         const g = groups.get(key) ?? { method: m[0], cls: w.caller_class, trig: t, sites: [], wrappers: new Set<string>() };
-        g.sites.push(`${w.wrapper}(${w.arg0}) at ${w.file}:${w.line}`);
+        // The resolved template is shown only where it was needed (arguments[0] is not itself a literal), so an edge whose writer
+        // path was already readable keeps exactly the details it had before W4a.
+        g.sites.push(`${w.wrapper}(${w.arg0}${w.resolved_path && staticPathSegments(w.arg0) === null ? ` = ${w.resolved_path}` : ""}) at ${w.file}:${w.line}`);
         g.wrappers.add(w.wrapper);
         groups.set(key, g);
       }
@@ -1216,8 +1260,15 @@
     )).rows;
     console.log(`  Base controllers (${baseFiles.length} file(s) declaring a write wrapper): ${unclassified.length === 0 ? "every called method is classified (write table or known-reader list)." : `${unclassified.length} called method(s) in NEITHER the write-wrapper table nor the known-reader list, review them: ${unclassified.map(u => `${u.method} (${u.n} call site${u.n === "1" ? "" : "s"}, ${u.file.replace(/^.*\//, "")})`).join("; ")}.`}`);
     const unreached = trigs.filter(t => !reached.has(t.fact_id));
-    console.log(`  Writers: ${writers.rows.length} write-wrapper call sites; first argument is a readable path for ${derivable.length}, not readable (identifier/call) for ${writers.rows.length - derivable.length}. ${matchedSites} readable-path sites land on a trigger collection (${unattributed} more had no single enclosing method fact and were skipped).`);
-    console.log(`  Join result: ${edges.length} resolved edges (writer method -> handler), reaching ${reached.size} of ${trigs.length} triggers; ${unreached.length} triggers have no readable-path writer${unreached.length ? `: ${unreached.map(t => `${t.event} ${t.path}`).join("; ")}` : ""}.`);
+    const noPath = writers.rows.filter(w => writerSegments(w) === null);
+    console.log(`  Writers: ${writers.rows.length} write-wrapper call sites; the collection path is known for ${derivable.length} (${viaResolvedPath} via evidence.${CONTRACT.CALL_RESOLVED_PATH}, ${derivable.length - viaResolvedPath} via the literal in arguments[0]), unknown for ${noPath.length}. ${matchedSites} known-path sites land on a trigger collection (${unattributed} more had no single enclosing method fact and were skipped).`);
+    // Write-wrapper calls whose collection path is not known: the first argument is not a literal and the extractor resolved no
+    // path for it (W4a `evidence.resolvedPath` absent), so it is not a statically known collection at this call site. Generic
+    // reason worked out from the fact itself (no name list); no edge is made for it, and that is not a claim that the write
+    // reaches no trigger. Listed (first 12) so a new one shows up.
+    for (const w of noPath.slice(0, 12)) console.log(`    path unknown: ${w.file}:${w.line} ${w.wrapper}(${(w.arg0 ?? "<no arguments>").replace(/\s+/g, " ").slice(0, 60)}): first argument is not a literal and no evidence.${CONTRACT.CALL_RESOLVED_PATH} was extracted, so the collection is not statically known at this call site.`);
+    if (noPath.length > 12) console.log(`    ... and ${noPath.length - 12} more write-wrapper call site(s) with an unknown collection path.`);
+    console.log(`  Join result: ${edges.length} resolved edges (writer method -> handler), reaching ${reached.size} of ${trigs.length} triggers; ${unreached.length} triggers have no known-path writer${unreached.length ? `: ${unreached.map(t => `${t.event} ${t.path}`).join("; ")}` : ""}.`);
     return edges;
   },
 };
```
- 2026-09-26 (coordinator): **Embedding pre-approved by the user for Lane B's W3 sync:** angular-app-oskey-io only, about 163 new facts, up to about 15.5k tokens (about 6.8k by character count), run only inside Lane B's granted write turn with `EMBED=true` after the `EMBED`-off sync reports its counts. If the counts show more than about 20% variance from 163, or any other repo needs embedding, Lane B stops and asks the user again. Lane B will still ask the user to confirm directly in its own window.

### 2026-09-26: [Lane A] W4a join APPLIED and verified live (results)

Session `-29`. No `sync-facts.ts`, no `EMBED`, no `git add`/`git commit`, no `DROP`/`TRUNCATE`/hand-written UPDATE/DELETE. Commands: table-only dump, the diff above, `cp` of the approved dev copy over `build-cross-repo-edges.ts` (v1.10.0), then plain `npm run pipeline:edges` (all three steps, exit 0, no permission prompt or denial). The `_dev-w4a-build-cross-repo-edges.ts` copy is deleted.

**Verification against the per-slice md5 taken immediately before (content excludes edge_id/synthesis_id/generated_at):**
- `FIRESTORE_EVENT_TRIGGER / firebase-oskey-dev`: **17 → 31 edges, all `resolved`**; fingerprint `a5f4e790…` → `edca9030…` (the same fingerprint the scratch run produced). **All 17 old rows present and byte-identical (source/target fact ids, symbols, status, details): 17 of 17**; 14 new.
- **Every other slice byte-identical to before** (the diff of the two 17-slice fingerprint lists contains only that one line).
- **Total edges 17,798** (17,784 + 14). FIELD_BINDING **13**. Dangling source **0**, dangling target **0**, resolved/confirmed edges without a live target **0**. `edge_sync_state` 17 rows, **all 17 slices ok**, 0 STALE, 0 UNRECORDED. Facts untouched (69,463).
- Live join log: 26 triggers via their own path, 2 auth skipped, 241 of 248 writers known, 31 edges reaching 16 of 26 triggers; the 10 unreached and the 7 unknown-path base-controller sites are as reported in the numbers entry (the unattributable trigger, writers inside arrow-function class properties, is Lane B's W4e scope; no join change).

**Guard:** `require.main === module` is now in `build-cross-repo-edges.ts`, `build-intra-repo-edges.ts`, `build-form-field-lineage-edges.ts` and `build-edges.ts` (proofs in the entry above); importing any of them no longer starts a run, and the orchestrator's child processes still run them.

**Rollback if wanted:** `output/backups/edges-2026-09-26-before-W4a-join.dump` (table-only), or restore the previous join by reverting the W4a hunks in `build-cross-repo-edges.ts` (the diff is posted above) and re-running `pipeline:edges`.

[Lane A] W4a join DONE (numbers) and write turn released

### 2026-09-26: [Lane B] W4e scope from Lane A: call facts with no enclosing method (arrow-function class properties): investigation and PROPOSAL (read-only; no code, no extraction, no DB write; awaiting user approval; no `git add`/`git commit`)

Measured from the live DB (firebase, 6,741 `call_expression` facts) and re-classified from source (clone `00e1d9fd`, held W4a run files; throwaway script, deleted after this entry). **Only `call_expression` carries caller information** (`callerClass`, `callerName`, `callerStartLine/EndLine`); no other firebase kind has a `callerName`, so the gap is on calls only.

**Cause.** `01-extract-ast-evidence.ts` (section 8) sets `callerName` from `callExpr.getFirstAncestorByKind(MethodDeclaration)` or, failing that, a `FunctionDeclaration`. An arrow function assigned to a class property (`set = async (...) => { ... }`, a `PropertyDeclaration`) is neither, so `callerName`, `callerStartLine` and `callerEndLine` are null although `callerClass` is set. The same class of property is also skipped on the *method fact* side (`cls.getMethods()` only), and on the *callee* side (`declarationMethod` is set only for a `MethodDeclaration` / `FunctionDeclaration`).

**How many (all 404 of the 6,741 call facts with no `callerName`, every one classified from its source):**

| enclosing construct | call facts |
|---|---|
| constructor (incl. `super(...)`) | 173 |
| module-level code, no class (e.g. `index.ts` registrations) | 149 |
| **arrow-function class property** | **73** (11 properties, all in 3 classes) |
| class property initializer that is not a function (e.g. `= express()`) | 5 |
| function inside an object-literal property (`index.ts` storage triggers) | 4 |

**The 11 arrow-function class properties are all there are in the repo** (each hosts at least 1 call): `OSKBuildingDoorAccessControlDeviceController` `get` (:21), `getAll` (:30), `getByDoor` (:38), `set` (:50), `update` (:60) in `building/modules/building_door/controllers/building_door_access_control_device.controller.ts`; `OSKUserDeviceAccessControlDeviceTokenController` `get` (:18), `save` (:27), `delete` (:37), `deleteAll` (:42), `deleteAllByTokenId` (:48) in `user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts`; `PubSubMessageProcessor.processPubSubMessage` (52 of the 73 calls) in `core/services/pub_sub_receiver.service.ts:44`. **None has a method fact** (the door-device controller has exactly one method fact, `getCollectionPath`).

**Write-wrapper calls specifically: 248 in total, 5 of them (2%) have no enclosing method, all inside arrow-function properties, none in constructors or module-level code:** door-device `set` `_set` (`building_door_access_control_device.controller.ts:57`, the writer of the trigger Lane A found: `create /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`) and `update` `_update` (:67); token controller `save` `_set` (`user_device_access_control_device_token.controller.ts:34`), `delete` `_delete` (:39), `deleteAll` `_deleteAll` (:44).

**Callee side, same root cause:** **17** call facts *into* these properties have `declarationMethod = null` (their declaration is a property, not a method): door-device `getAll` 7, `getByDoor` 2, `get` 1, `set` 1, `update` 1; token controller `delete`, `deleteAll`, `deleteAllByTokenId`, `get`, `save` 1 each.

**Important constraint found while designing the fix:** `callerName` is part of every call fact's ID (`02-build-module-evidence.ts`: `secondaryKey = ${item.callerName || "anon"}|${argSig}` plus an ordinal keyed on it). **Setting `callerName` to the property name would change the ID (and `fact_ref`) of those 73 call facts**, and `INTRA_REPO_CALL` edges use call facts as their source, so it would break the "`fact_ref` stable at the same commit" rule.

**PROPOSAL (nothing written):**
1. **Additive fields on `call_expression`, existing fields untouched (recommended):** `evidence.enclosingMemberName`, `evidence.enclosingMemberKind` (`method` | `function` | `arrow_function_property` | `constructor` | `accessor` | null, derived from the AST node kind), `evidence.enclosingMemberStartLine` / `EndLine`; and on the callee side `evidence.declarationMemberName` / `declarationMemberKind` when the declaration is a property with a function initializer. `callerName` and `declarationMethod` stay as they are (so all IDs stay identical); a consumer reads `coalesce(callerName, enclosingMemberName)`. Expected: 73 caller-side and 17 callee-side facts get the new fields set; no existing value changes.
2. **New method-shaped facts for arrow-function class properties:** one fact per property (11 today), in the same kind the classification rules give a method of that class (`controller_method` / `service_method` / `class_method`), with an additive `memberKind: "arrow_function_property"` marker, `methodName` = the property name, `isAsync` / `visibility` / return type from the arrow, so the join has a source method fact. Expected: **11 new facts**, about 1k tokens to embed. Existing method facts unchanged.
3. **Constructors (173 calls) and accessors** have the same gap. Not requested and no write-wrapper call lives there, so I do **not** propose fixing them now; the `enclosingMemberKind` field in (1) would already distinguish them (`constructor`) at no extra cost, and making them method facts is a separate decision for you.
4. **Request to Lane A** (not edited by Lane B): the writer/source lookup reads `coalesce(callerName, enclosingMemberName)` with `callerClass` and matches the new method facts; expected effect: the 5 write-wrapper sites gain a source, in particular door-device `set`/`update` for `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` create.
5. **Gate expectations (to be proven, own run and turn, after W3):** existing IDs identical; new facts 11; payload-additive changes on 73 + 17 call facts; 0 description changes on existing facts (`descriptionFor` builds the call description from `callerName` and the declaration fields, not the new ones; the gate will confirm); embed ~11 facts.

### Coordinator note 2026-09-26 (about 13:20 UTC): Lane A's W4a-join turn validated and released; Lane B's W3 turn granted

- **Lane A's turn independently validated (coordinator, read-only):** compared every column except `edge_id`/`synthesis_id`/`generated_at`, per `(connection_type, source_repo)` slice, between the pre-W4c dump (`facts_index-2026-09-26-before-W4c.dump`, edges extracted with `pg_restore -a -t`) and the live table: **16 of 17 slices byte-identical; the only difference is `FIRESTORE_EVENT_TRIGGER firebase-oskey-dev`, 17 -> 31, with 0 old rows missing.** Live: 69,463 facts (untouched), 17,798 edges, 0 dangling on source and target, 0 duplicate pairs, FIELD_BINDING 13, `FIRESTORE_EVENT_TRIGGER` 31 (all resolved), `edge_sync_state` 17 slices with 0 dangling, 0 missing embeddings, no active sessions. The `require.main === module` guard is present in all four builders (`build-cross-repo-edges.ts`, `build-intra-repo-edges.ts`, `build-form-field-lineage-edges.ts`, `build-edges.ts`); the dev copy is deleted.
- **WRITE TURN RELEASED: Lane A W4a-join.** The shared builders are now the validated ones (cross builder v1.10.0).
- **WRITE TURN GRANTED: Lane B W3** (exclusive). Held run `20260926_125017-8345d222`, gate validated by the coordinator (8,747 identical / 163 new [app_root 98, features 65] / 0 pruned / 0 existing values changed). Embed pre-approved (see above), still to be confirmed by the user directly in Lane B's window. Expected: sync counts per module 0 new except `app_root` 98 and `features` 65; facts 69,463 -> 69,626; total edges 17,798 plus any new `FIELD_BINDING` edges (the existing 13 must be a strict subset); every other slice byte-identical.
- **W4e proposal from Lane B is logged (arrow-function class properties, 11 members, additive `enclosingMember*` fields and 11 new method-shaped facts because `callerName` is part of every call fact's ID).** Not approved yet; queued after W3 and W2 for the user's decision.

### 2026-09-26: [Lane B] W3 DONE (numbers) and write turn released

Turn `WRITE TURN GRANTED: Lane B W3` (exclusive; last write-turn-log line was that grant, after `RELEASED: Lane A W4a-join`). Sequence exactly as in the READY TO SYNC entry. No `git add`/`git commit`; no `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; no command was denied.

1. **Preconditions:** `run-context.json` = `20260926_125017-8345d222`; live DB 69,463 facts, angular 8,747, 17,798 edges, 0 without an embedding, no active sessions, current Angular run `20260923_110233-8345d222`. **Gate re-run just before the turn:** 8,747 identical / 163 new / 0 pruned / 0 description changes / 0 existing values changed.
2. **Dump:** `output/backups/facts_index-2026-09-26-before-W3.dump` (276,544,004 bytes, gitignored, `pg_restore -l` lists 57 entries). Restore point (`before-W3`).
3. **Sync, `EMBED` unset, 4 modules** (the loop was set to stop on any deviation and did not): components 0 new / 0 embed / 0 removed, core 0/0/0, **features 65/65/0, app_root 98/98/0.**
4. **Read-only check before embedding:** facts 69,626; angular 8,910 all at `20260926_125017-8345d222`; other repos 60,716 (untouched); exactly **163 facts without an embedding, all angular**; current Angular run = the held run; `app_root` 98 facts; edges still 17,798.
5. **Embedding (user confirmed directly in the window):** `EMBED=true` for `features` and `app_root` only. 163 embedded (65 + 98). **Actual tokens from `embedding_calls` (call_ids 1130, 1131, model `gemini-embedding-2`): 10,530 total (5,424 + 5,106),** none truncated; inside the pre-approved 15.5k (my chars/4 estimate of 6.8k was low; the 95-tokens-per-fact rule of thumb gave 15.5k). Facts without an embedding afterwards: 0 (whole DB).
6. **Edges:** plain `npm run pipeline:edges`, exit 0; shrink guard silent; 0 dangling on resolved/confirmed edges and on the other statuses; **all 17 `edge_sync_state` slices `ok`.** Row-level comparison of all edges before vs after (content hash included): **17,798 → 17,800 (+2); 0 old rows missing; nothing removed.**
   - **Only one slice differs: Angular `INTRA_REPO_CALL` 346 → 348** (282 → 284 confirmed, 39 probable and 25 unresolved unchanged; the 346 old rows intact). The 2 new edges are calls from the new `app_root` module: `app.component.ts:153` `this.authService.updateUserProfile` → `features/authentication/services/auth.service.ts:284`, and `app.component.ts:129` `this.cookieConsentService.showBanner` → `components/cookie-consent/services/cookie_consent.service.ts:58` (both confirmed, cross-module). The other 34 root call facts produced no edge.
   - **`FIELD_BINDING`: 13 → 13, all 13 old rows present and byte-identical** (the 2 extra static controls did not resolve a lineage chain; the unresolved reasons are unchanged).
   - **Angular `HTTP_API_CALL` unchanged: 97 resolved, 5 unresolved. Every other slice is byte-identical to before the turn** (per-slice row sets compared, content hash included): `HTTP_API_CALL` android/swift-cloud-kit, all other `INTRA_REPO_CALL` slices, `PACKAGE_SYMBOL_USE`, `PUBSUB_TOPIC_BINDING`, `FIRESTORE_EVENT_TRIGGER` (31, Lane A's).

**What W3 delivered (spec acceptance):** the 3 templates yield facts; extracted controls **84 static / 67 bound = the independent source count** (was 82 / 61); nested `formGroupName` / `formArrayName` recorded additively (`formGroupChain`, `formControlPath`: 53 nested controls, e.g. `phone.localPhoneNumber`); existing fact IDs identical (8,747); `FIELD_BINDING` 13 unchanged; the root module `app_root` adds 98 facts incl. 5 root routes; no parse error.

**State left behind:** live DB = post-W3 (69,626 facts, 17,800 edges, 0 without an embedding, Angular current run `20260926_125017-8345d222`). Restore point `facts_index-2026-09-26-before-W3.dump`. Scratch files deleted. Nothing running. Next in my lane: **W2 (Pub/Sub publish side), investigation and proposals first.** Downstream note (not acted on): `extract-screen-map-angular.ts` will now see the `app_root` module's 5 routes (blank screen names for a human to fill).

- 2026-09-26 (Lane B): write turn released. Requesting `WRITE TURN RELEASED: Lane B W3` from the coordinator.

### Coordinator note 2026-09-26 (about 13:45 UTC): Lane B's W3 validated and released

- **W3 independently validated (coordinator, read-only):** compared every edge column except `edge_id`/`synthesis_id`/`generated_at` per slice between `facts_index-2026-09-26-before-W3.dump` and the live table: **16 of 17 slices byte-identical; the only difference is Angular `INTRA_REPO_CALL`, 346 -> 348, with 0 old rows missing** (the 2 new edges are real: `app.component.ts:129 showCookieConsent -> OSKCookieConsentService.showBanner`, `app.component.ts:153 createUser -> OSKAuthService.updateUserProfile`). `FIELD_BINDING` 13 identical (it did not gain edges), Angular `HTTP_API_CALL` unchanged, `FIRESTORE_EVENT_TRIGGER` 31. Live: 69,626 facts (+163), 17,800 edges, 0 missing embeddings, 0 dangling, 0 duplicate pairs, no active sessions, `edge_sync_state` 17 slices with 0 dangling. Angular modules: `app_root` 98, `components` 109, `core` 726, `features` 7,977 (7,912 + 65). Root routes: `angular_route` `app_root` 5, `features` 59. Embedding: 2 calls, 163 facts, 10,530 tokens, none truncated (within the approved 15.5k).
- **WRITE TURN RELEASED: Lane B W3.** No write turn is open.
- **State of the plan:** done and validated: W5a/W5b, W1, W4a (facts and join), W4c, W3. Remaining: W4b (Angular Firestore paths, next for Lane B because it unblocks W4d and completes the priority-1 T-112), W2 (Pub/Sub publish side), W4d (Lane A, after W4b), W4e (decision pending), W6/P7, plus classification of Angular's 5 unresolved callables.
- **Side effect to act on:** the Angular screen-map script (`extract-screen-map-angular.ts`, zero spend, merge-aware, read-only against Postgres) now sees a second module with routes (`app_root`, 5 root routes); running it will add those 5 routes with blank names to `governance/reference-docs/screen-map-angular-features.json` for a human to fill. Not run yet; the user decides.

### 2026-09-26: [Lane B] W4b investigation and PROPOSAL (Angular client Firestore path facts; read-only: no code, no extraction, no DB write; awaiting user approval; no `git add`/`git commit`)

Priority changed by the coordinator: W4b before W2. Measured on `output/clones/angular-app-oskey-io` at `8345d222` (source) and against Lane C's live `firestore_client_call` facts (swift-cloud-kit, 65 facts) for the shape. I **adopt Lane C's shape exactly** (below), with the Angular-specific choices flagged.

**Real usage, complete (grep over all of `hosting/web-app/src`, spec files excluded):** exactly the 8 files that import `@angular/fire/firestore` (+ 3 that import `Timestamp` from `firebase/firestore`); **only 2 of them call the SDK with a path**; the rest are type-only (`Timestamp`) or setup. **Nothing under `app_root`** (`app.component.ts`, `app.config.ts`, `app.routes.ts` do not touch Firestore); no `AngularFirestore` / `firebase/compat` use.

| # | file:line | SDK calls | path | operation |
|---|---|---|---|---|
| 1 | `core/firebase/services/auth/firebase-auth.service.ts:122-123` (`setDoc(docDTO, path, ...pathSegments)`) | `doc(firestore, path, ...pathSegments)` then `setDoc` | **parameters** (`path`, `pathSegments`): a generic wrapper | `set` |
| 1b | its only caller `features/authentication/services/auth.service.ts:261` `this.firebase.setDoc(userDTO, 'users', userDTO.userId)` | (through the wrapper) | `/users/{userId}` | `set` |
| 2 | `firebase-auth.service.ts:134-136` `getUserByUid` | `doc(firestore, 'users', uid)` then `docData` (consumed once via `firstValueFrom`) | `/users/{uid}` | `docData` is a stream: `listen` |
| 3 | `firebase-auth.service.ts:142` `generateOrganizationId` | `doc(collection(firestore, 'organizations')).id` | `/organizations` (collection) | none: an id is generated, nothing is read or written |
| 4 | `core/injection-tokens/current-user.token.ts:133,142` | `docRef = doc(firestore, 'users', fbUser.uid)` then `onSnapshot(docRef, …)` | `/users/{uid}` | `listen` |
| 5 | `current-user.token.ts:145-154` | `collection(firestore, 'users/' + fbUser.uid, 'organizations')` then `collectionData` | `/users/{uid}/organizations` (collection) | `listen` |

Setup, not paths (no fact, listed so the acceptance "every call site has a fact or a stated reason" is auditable): `core/firebase/providers/firebase.provider.ts:65-68` `provideFirestore` / `getFirestore` / `connectFirestoreEmulator`. The 6 `Timestamp` imports are type-only.

**Why the current extractor sees none of this:** Angular's 01 records calls as `call_expression` facts (arguments as text), but nothing resolves a path or an operation, and `docRef` is assigned (`let docRef = null; … docRef = doc(...)`), which even the existing resolver would not follow.

**PROPOSAL (nothing written):**
1. **New facts, Lane C's kind and shape:** kind `firestore_client_call`, module by file (`core` here), one fact per SDK call site that performs an operation or carries a path. Evidence fields exactly as Lane C's: `value` (path template, leading `/`, `{param}` placeholders named after the last identifier: `{uid}`, `{userId}`), `rawTemplate`, `side: "client"`, `platform: "angular"`, `pathKind` (`collection` | `document` | null + `pathKindReason`), `operation` (`get` | `set` | `update` | `delete` | `listen` | null + `operationReason`), `sdkCall`, `pathResolutionMethod` (`resolved_sdk_segments`, `resolved_via_wrapper_caller`, `unresolved`) + `unresolvedReason`, `pathArguments` (raw text of the SDK call's arguments), `wrapperMethod` (when a fact is at a wrapper's call site), `callerClass`, `callerFunction`, `file`, `line`, `module`; `pathSource` is Swift's enum case and stays absent. ID pattern as Lane C's: `firestore_client_call|<module>|<file>|<callerClass>.<callerFunction>|<sdkCall>:<template>|#n`. Unresolvable paths are recorded `unresolved` with a reason, never dropped.
2. **Expected facts today: 6** (rows 1, 1b, 2, 3, 4, 5): row 1 `unresolved` (`parameter_passthrough: path, pathSegments`), row 1b `resolved_via_wrapper_caller` (`/users/{userId}`, `wrapperMethod: setDoc`), rows 2, 4, 5 resolved, row 3 with `operation: null` and the reason above.
3. **Path building (Angular's SDK semantics, in the Angular extractor):** `doc(db, s1, s2, …)` / `collection(db, s1, …)` join their segments with `/` (a segment may itself contain slashes); `doc(collectionRef)` (auto-id) keeps the collection path; a literal-plus-expression string (`'users/' + fbUser.uid`) becomes `users/{uid}`; an identifier is followed to its initializer **or, when declared as `null`/`undefined`, to the single assignment before the use in the same scope** (bounded; otherwise unresolved with a reason). Generic wrappers: when the SDK call's segments are the enclosing method's own parameters (including a rest parameter), each in-repo caller of that method gets its own fact with the arguments substituted (`wrapperMethod` set); the wrapper's own site stays `unresolved`. Derived from the code, no method names listed.
4. **Decision for you: how the operation is derived.** The coordinator asked for "the SDK call, not a name list". The Angular SDK is external (no body to read, unlike Lane C's Swift wrapper), so the only source is the imported function itself. **Recommended:** a small, explicit **config table for the external SDK** (`firestoreClientSdk` on the Angular entry in `config/repos.json`: the module specifiers `@angular/fire/firestore` and `firebase/firestore`, and per SDK export its role: path reference `doc`/`collection`/`collectionGroup`, operation `getDoc(s)`→get, `setDoc`/`addDoc`→set, `updateDoc`→update, `deleteDoc`→delete, `onSnapshot`/`docData`/`collectionData`→listen, setup functions → none). Calls are recognised by their import specifier through the symbol (alias-safe), not by text. It is a name table, but for the Firestore SDK's own public API, reviewable in config and not repo-specific; the alternative (guessing the verb from the function name in code) is worse. Say if you want it different.
5. **`docData` consumed once** (row 2, `firstValueFrom(docData(ref))`): the SDK-derived operation is `listen`; I would record it as such plus an additive `readMode: "once"` when the call is directly wrapped in `firstValueFrom`/`lastValueFrom`, and leave the interpretation to the join (Lane A). A wrong `get` is worse than an honest `listen` + hint.
6. **Expected DB effect (own run, gate, turn):** existing IDs identical; **6 new facts** (module `core`), about 1k tokens to embed (flagged, needs your go-ahead); 0 description changes on existing facts; no existing value changes. `descriptionFor` already handles the kind (Lane A). **Lane A (W4d)** reads these together with Lane C's; expected: Angular reads/listens on `/users/{…}`, `/users/{…}/organizations`, and the set on `/users/{…}` matched to the Firebase side by path.
7. No `app_root` facts expected; if any appears at the gate it is reported, not hidden.

- 2026-09-26 (coordinator): **The user APPROVED Lane B's W4b proposal** (Angular client Firestore path facts): (1) the external-SDK operation table in config (`firestoreClientSdk` on the Angular entry; module specifiers `@angular/fire/firestore` and `firebase/firestore`; per-export role and operation; matched by import specifier through the symbol), with the coordinator's added condition that an SDK export used in the code but absent from the table produces a fact with `operation: null` and `operationReason: 'sdk_export_not_in_table'`, so table gaps are visible; (2) `docData` consumed once via `firstValueFrom`/`lastValueFrom` recorded as `operation: listen` plus additive `readMode: "once"`. **Embedding pre-approved:** angular-app-oskey-io only, about 6 new facts, about 1k tokens, run only inside Lane B's granted write turn after the `EMBED`-off sync reports its counts (stop and ask again if it differs materially). No Postgres schema change is involved: the facts are a new-value-of-`kind` plus JSONB payload; the only schema addition in this whole build remains `edge_sync_state`.

### Coordinator note 2026-09-26 (about 14:10 UTC): work assignments while Lane B builds W4b

- **W4e APPROVED by the user** on Lane B's design: additive `enclosingMemberName/Kind/StartLine/EndLine` on call facts that sit in arrow-function class properties (73 facts), `declarationMemberName/Kind` on the callee side (17 calls), and 11 new method-shaped facts (`memberKind: arrow_function_property`); existing IDs unchanged (`callerName` stays in the ID as `anon`). Lane B implements it after W4b, as its own held run, gate and write turn. Lane A's joins will read `coalesce(callerName, enclosingMemberName)`.
- **Lane order for Lane B:** W4b (in progress) -> W4e -> W2 implementation.
- **Lane A (read-only, in a COPY of the builder plus scratch databases; nothing enters the shared tree or the live DB):** (1) W4d design for the Swift side: link the live Swift `firestore_client_call` facts to Firebase writers (`evidence.resolvedPath`) and triggers by path pattern; the Angular facts join in once W4b is live; propose the connection type, direction, `resolved` status and a structured operation column for the user's approval; (2) W6 (P7) design and dry-run: edges added, hub sizes and per-callee counts with a data-derived fan-in threshold, for the user's review before any live turn. W4d first, then W6.
- **Lane C (read-only):** W2 investigation and proposals (the Pub/Sub publish side), so Lane B can implement it after W4b/W4e without starting cold. Lane B owns the Firebase extractor files; Lane C edits nothing.
- **New sessions:** not needed now.

### 2026-09-26: [Lane B] W4b extracted into a HELD run and gated. READY TO SYNC (waiting for a granted write turn)

Approved by the user via the coordinator (Lane C's `firestore_client_call` shape, the config SDK table, `readMode: "once"`, plus the condition that a table gap must be visible). Files only: no sync, no `EMBED`, no edges, no DB write; no `git add`/`git commit`. **HELD RUN ID: `20260926_131550-8345d222`** (angular, pinned commit `8345d222`, `output/runs/angular-app-oskey-io/20260926_131550-8345d222/`). The DB's current Angular run is still the W3 run `20260926_125017-8345d222`. **Caution:** `output/angular-app-oskey-io/run-context.json` points at the held run, so an Angular `sync-facts.ts` would load it; nobody syncs Angular outside a granted turn. (Two earlier attempts of mine under `output/runs/angular-app-oskey-io/` were superseded by rule fixes and deleted; the W3 run is untouched.)

**Code (Lane B files only).** `config/repos.json` Angular entry: new `firestoreClientSdk` table (specifiers `@angular/fire/firestore`, `firebase/firestore`; per SDK export a role: `path_ref` doc/collection/collectionGroup with `pathKind`; `operation` getDoc/getDocs get, setDoc/addDoc set, updateDoc update, deleteDoc delete, onSnapshot/docData/collectionData/docSnapshots/collectionSnapshots listen; `query_modifier` query/where/orderBy/limit/startAt/startAfter/endAt/endBefore; `setup` getFirestore/provideFirestore/connectFirestoreEmulator; `value_helper` serverTimestamp/increment/arrayUnion/arrayRemove/deleteField; and `consumeOnce` = rxjs `firstValueFrom`/`lastValueFrom`). New `pipeline/angular-app-oskey-io/phase-01-ast-extraction/_shared/firestore-client-calls.ts`, called from `01-extract-ast-evidence.ts` (skipped when a repo has no table; writes `ast-firestore-client-calls.json`, a required manifest artefact; table gaps become `FIRESTORE_SDK_EXPORT_NOT_IN_TABLE` warnings in `run-notifications.json`); `02-build-module-evidence.ts` builds the facts with the Swift ID pattern (`firestore_client_call|<module>|<file>|<class>.<function>|<sdkCall>:<path>|#n`; `no_class` when there is no class). A call is recognised by its import specifier through the symbol (alias-safe and namespace-import safe), never by text.

**Rules learned while testing (all in the shared module):** (1) a parameter makes a method a *generic wrapper* only when it decides where the path starts (a first segment made only of parameters, or a rest parameter); a parameter deeper in the path is just a `{placeholder}` (that is why `getUserByUid` is a resolved `/users/{uid}` and not a wrapper; my first draft got this wrong and produced 7 facts, corrected to 6); a literal prefix (`'orders/' + id`) also names the collection. (2) A caller that only relays its own parameters is still `unresolved`. (3) The caller of a fact is the enclosing method/function/function property; only when there is none (an InjectionToken factory) the outermost enclosing variable names it, never a local `const`.

**Pre-sync fact-ID gate (angular, held run vs `facts.fact_id`, live `descriptionFor`):**

| | count |
|---|---|
| DB facts / run facts | 8,910 / 8,916 |
| **identical IDs** | **8,910** (all) |
| **new** | **6** = core 5 + features 1 (all `firestore_client_call`) |
| **would be pruned** | **0** |
| description changes on existing facts | **0** |
| existing values changed (excluding `runId`, which changes on every fact by design) | **0** (no added keys either) |
| to embed | **6** (about 420 tokens by chars/4; under 1k at 95/fact) |

**The 6 facts (module by file; the proposal said all 6 in `core`, the caller of the wrapper lives in `features` so it is 5 + 1):**
1. `core/firebase/services/auth/firebase-auth.service.ts:123` `OSKFirebaseAuthService.setDoc`: `setDoc`, op **set**, pathKind document, path **unresolved**, `parameter_passthrough: path, pathSegments` (the generic wrapper).
2. `…/firebase-auth.service.ts:136` `getUserByUid`: `docData`, op **listen**, `readMode: "once"` (wrapped in `firstValueFrom`), document, **`/users/{uid}`**, `resolved_sdk_segments`.
3. `…/firebase-auth.service.ts:142` `generateOrganizationId`: `doc`, op **null** (`operationReason`: reference only, nothing reads or writes), pathKind collection (`doc(collectionRef)` without an id), **`/organizations`**.
4. `core/injection-tokens/current-user.token.ts:142` (`no_class.OSKCurrentUserToken`): `onSnapshot`, op **listen**, document, **`/users/{uid}`**; the `let docRef = null; … docRef = doc(...)` assignment was followed.
5. `…/current-user.token.ts:154`: `collectionData`, op **listen**, collection, **`/users/{uid}/organizations`** (from `'users/' + fbUser.uid`).
6. `features/authentication/services/auth.service.ts:261` `OSKAuthService.createUser`: `setDoc`, op **set**, document, **`/users/{userId}`**, `resolved_via_wrapper_caller`, `wrapperMethod: setDoc`.
Each carries `side: client`, `platform: angular`, `sdkCall`, `pathArguments`, `callerClass`, `callerFunction`, `file`, `line`, `module`, `rawTemplate`, `pathResolutionMethod` (+ `unresolvedReason` on #1). Nothing under `app_root`.

**SDK-table gap report (real code): 0 gaps** (every SDK call in the code is in the table). **Skipped by role (no path or operation, no fact): `setup` 3** (`firebase.provider.ts:65` `provideFirestore`, `:66` `getFirestore`, `:68` `connectFirestoreEmulator`). **Gap detection proven on a synthetic file** (in-memory, deleted): an SDK export absent from the table (`getDocFromCache`, `runTransaction`) produced facts with `operation: null`, `operationReason: "sdk_export_not_in_table"` and was returned in the gap list; an aliased import (`doc as makeDoc`, `setDoc as save`) and a namespace import (`fs.deleteDoc(fs.doc(...))`) resolved correctly.

**Exact commands for the W4b write turn (only after a `WRITE TURN GRANTED: Lane B W4b` is the last write-turn-log line):**
1. Preconditions: `run-context.json` = `20260926_131550-8345d222`; record live counts; re-run the gate against the then-live DB (must still show 8,910 identical / 6 new / 0 pruned / 0 description changes).
2. `pg_dump` to `output/backups/facts_index-2026-09-26-before-W4b.dump` + `pg_restore -l`.
3. Sync, `EMBED` unset, 4 modules (`REPO_NAME=angular-app-oskey-io MODULE_NAME=<m> node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts`); **expected new / need embedding / removed: components 0/0/0, core 5/5/0, features 1/1/0, app_root 0/0/0. Stop and ask if any differs.**
4. Read-only check: facts = previous + 6; angular 8,916 at the held run; exactly 6 angular facts without an embedding; current Angular run = the held run.
5. `EMBED=true` only after the user confirms directly in the window (pre-approved by the coordinator; still asked): modules `core` and `features`; record actual tokens from `embedding_calls`.
6. Plain `npm run pipeline:edges`; expect **every edge slice byte-identical to before** (Lane A's W4d join is not in the shared tree, so nothing reads the new kind yet), 0 dangling, all `edge_sync_state` slices ok, `FIELD_BINDING` 13, Angular `HTTP_API_CALL` 97 resolved / 5 unresolved. Append the results; the coordinator releases. No `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; if the live-DB classifier asks the user to approve a command I wait and never work around a denial.

### Coordinator note 2026-09-26 (about 14:25 UTC): Lane B's W4b gate validated; W4b write turn granted

- **W4b held run independently validated (coordinator, read-only):** run `20260926_131550-8345d222` vs the live database (angular): **8,910 identical, 6 new, 0 pruned, 0 existing values changed, no keys added to existing facts.** The 6 `firestore_client_call` facts: `core` 5 + `features` 1 (the wrapper caller `auth.service.ts:261` lives in `features`): `/users/{uid}` listen with `readMode: once` (`getUserByUid`, `firebase-auth.service.ts:136`), `/users/{uid}` listen (`current-user.token.ts:142`), `/users/{uid}/organizations` listen (`:154`), `/organizations` reference only (operation null, reason stated), `/users/{userId}` set via the wrapper caller (`resolved_via_wrapper_caller`), and the generic `setDoc` wrapper `unresolved` (`parameter_passthrough: path, pathSegments`). **Shape matches Lane C's live Swift facts**: the only differences are Angular's optional reason keys (`operationReason`, `pathKindReason`, `unresolvedReason`, `readMode`, absent when not needed) and Swift's `pathSource` (Swift-only by contract).
- **WRITE TURN GRANTED: Lane B W4b** (exclusive). Preconditions: live DB at 69,626 facts, 17,800 edges, 0 missing embeddings, no active sessions, DB current Angular run is the W3 run. Expected: sync counts `core` +5, `features` +1, `components`/`app_root` 0; total facts 69,632; embed 6 facts (about 420 tokens by characters, within the pre-approved 1k); edges unchanged (the join for these facts is W4d), 0 dangling.

### 2026-09-26: [Lane A] W4d design (Swift side) for the USER'S APPROVAL: client Firestore calls ↔ Firebase writers and triggers. Read-only: no code in the shared tree, nothing written to any database, no `git add`/`git commit`

Session `-29`. Numbers come from read-only queries against live `facts_index` (69,626 facts, 17,800 edges, no write turn open) run through throwaway scripts (deleted afterwards). Nothing is built; the join does not exist yet. Angular's `firestore_client_call` facts join the same way after Lane B's W4b is live.

**Inputs (live).** 65 `firestore_client_call` facts, all `swift-cloud-kit-oskey-dev`: 64 with a resolved path template (`resolved_enum_template`) and **1 unresolved** (`OSKCKUserBuildingSettingsService.swift:42`, listen: "the path argument is a variable or expression (`path`), not an inline enum case; local bindings are not tracked"). By operation: get 28, listen 23, set 10, delete 4, update 0. Firebase side: 241 write-wrapper call facts with `evidence.resolvedPath`, 26 Firestore triggers with `evidence.firestorePath`.

**What one edge means, and the two relations proposed.** A client call is not a call into Firebase code; it touches a Firestore path that Firebase code also touches. So two relations, two new connection types (both `provenance = ast_derived`, `resolution_status = resolved`; never `probable`):
1. **`FIRESTORE_CLIENT_TRIGGER`**: a client **write** (set / update / delete) → the Firebase trigger handler that fires on it. Direction: client call fact (source) → trigger handler declaration fact (target), the same target the existing `FIRESTORE_EVENT_TRIGGER` edges use. Events as the existing join: `set` on a document → create and update (same text "fires as create if the document is new, as update if it exists"); `set` by adding to a collection → create; `update` → update; `delete` → delete. Reads (get, listen) fire nothing and get no trigger edge.
2. **`FIRESTORE_CLIENT_ACCESS`**: any client call (get, listen, set, delete) → each Firebase **writer method** that writes the same collection ("the app touches a collection this backend method writes"). Direction: client call fact (source) → the writer's enclosing method fact (target), one edge per (client call, writer method), exactly as `FIRESTORE_EVENT_TRIGGER` groups writers. The existing wildcard rules are reused: a trigger wildcard matches any client segment; a wildcard on either of the other sides matches only a wildcard, never a literal. A client document path is compared by its parent collection; whether a path is a collection or a document is taken from its segment count (odd = collection) and cross-checked against the extractor's `pathKind`.

**Structured operation (not only in `details`).** `cross_repo_edges` has no column for it. Proposal (a schema change, additive, needs your approval): one nullable column **`attributes jsonb`** on `cross_repo_edges` (existing rows stay NULL; existing joins pass nothing). For these edges: `{"clientOperation":"set","clientSdkCall":"setData","pathKind":"document","pathTemplate":"/users/{userId}","platform":"swift","serverEvent":"create"}` for trigger edges, `{"clientOperation":"listen", ..., "serverWrapper":"_set"}` for access edges, plus the two flags below when they apply. The graph-traversal SQL selects explicit columns, so nothing breaks; exposing `attributes` through `findGraphNeighbors` would be a later, separate change in `mcp-server/` (not my files). **Alternative with no schema change:** encode the operation in the type (`FIRESTORE_CLIENT_WRITE_TRIGGER`, `FIRESTORE_CLIENT_READ_ACCESS`, …): structured but coarse, and it multiplies types. I recommend the column.

**Client calls that do not match (all recorded, none dropped).** Each becomes an `unresolved` edge (target repo `unknown`, no target fact, the reason in `details`, `attributes` filled), the way the `firebase-callable` join records its misses; traversal ignores them, the wiki can read them. 26 of the 65 client facts have no Firebase writer method or trigger to link to:
- **1 unresolved client path** (`OSKCKUserBuildingSettingsService.swift:42`, listen): reason from the extractor as above; the `/users/{userId}/buildingSettings` collection itself does match writers, but the path of this call is unknown, so no edge is inferred.
- **15 facts on three collections no Firebase fact mentions at all:** `/users/{}/friendRequests` (6), `/users/{}/friends` (5), `/users/{}/pendingFriendRequests` (4): no writer, no reader, no trigger, no path-touched fact anywhere in Firebase. Consistent with the three dead friend-request callables the Swift client also calls.
- **6 facts on `/users/{}/accesses/{}/invitations`** (get, listen, set, delete): no Firebase fact touches that collection (Firebase's `invitations` paths are under `/buildings/{}/units/{}`).
- **4 facts on `/users/{}/devices/{}/accessControlDeviceTokens`** (get ×2, listen ×2): **Firebase does write this collection (3 write-wrapper call sites) but none has an enclosing method fact** (arrow-function class properties: the extractor gap Lane B already has as W4e), so there is nothing to attach an edge to. Reason text says exactly that. This is not "no collection".

**Dry-run report (simulation of the proposed rules on live data; the real join would be built in a copy and dry-run against live before any turn):**
- **`FIRESTORE_CLIENT_ACCESS`: 39 of 65 client facts match at least one Firebase writer method → 203 edges** (get 87, listen 53, set 58, delete 5), reaching **48 distinct Firebase writer methods**; largest fan-out from one client fact **8** (`/users/{userId}`), largest fan-in to one Firebase writer method **11** client facts. 12 Firebase writer call sites had no enclosing method fact and were skipped (the 4 `accessControlDeviceTokens` facts above and other arrow-function-property writers).
- **`FIRESTORE_CLIENT_TRIGGER`: 14 client write facts, 9 match → 17 edges** reaching **5 of the 26 triggers**: `OSKUserService.onDocumentCreated` and `onDocumentUpdated` (`/users/{userId}`), `OSKUserDeviceService.onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted` (`/users/{userId}/devices/{deviceId}`); max 6 client edges into one trigger. The other 5 client writes match no trigger (`friendRequests` ×2, `friends` ×1, `accesses/{}/invitations` ×2: no Firebase trigger exists on those).
- **Ambiguity:** none of the 39 matched facts is ambiguous in the sense of matching two different collections; the multiplicity is 1 client call → several writer methods (a shared collection with several writers), which is the point of the relation, not a conflict.
- Hub note for `findGraphNeighbors`/cluster walks: the `/users/{userId}` collection has 8 writer methods and 11 client calls, so a walk from one of them gets a 19-node neighbourhood through `FIRESTORE_CLIENT_ACCESS`; still small next to the existing `INTRA_REPO_CALL` hubs, but the bounded cluster walk should be checked once.

**Two probable client bugs the matching must not hide (both found in the live facts; the join reports them, it does not fix or suppress them):**
1. **`userBuildingAccesses` placeholder** (Lane C's finding, confirmed): `OSKCKUserBuildingAccessService.swift:64` (`OSKCKFirestoreDocumentPath.userBuildingAccesses`): the normalised template is `/users/{userId}/accesses/{buildingId}` (the declared label) but the source interpolates `/users/\(userId)/accesses/\(accessId)`. Wildcards match by position, so the edge itself is correct; the join therefore compares each fact's `rawTemplate` interpolation names with its template names and, on a difference, sets `attributes.placeholderMismatch` (`{"template":"buildingId","source":"accessId"}`) on every edge from that fact and prints it in the coverage/dry-run report. Today: exactly 1 client fact.
2. **`userInvitations` declared as a document path but shaped as a collection** (new): `OSKCKUserInvitationService.swift:157`: `pathKind = document` (`OSKCKFirestoreDocumentPath.userInvitations`) with template `/users/{userId}/invitations` = 3 segments, the shape of a **collection**; a Firestore document reference needs an even segment count, so this listener would fail at runtime if the case is really a document path (the case name also exists in the collection enum with the identical template; Lane C already noted the duplicate). The join takes the shape from the segment count (so the edge goes to the invitations writers, which is what the code intends) and sets `attributes.pathShapeMismatch` (`{"declared":"document","segments":3}`). Today: exactly 1 client fact. Worth telling the wiki team and the Swift owners.

**Decisions I need from the user before any code goes live:**
1. Two new connection types `FIRESTORE_CLIENT_TRIGGER` and `FIRESTORE_CLIENT_ACCESS` (or another split)?
2. The additive column `attributes jsonb` on `cross_repo_edges` (recommended) versus encoding the operation in the type name?
3. Unmatched and unresolved client calls recorded as `unresolved` edges (recommended) versus not recorded?
4. `FIRESTORE_CLIENT_ACCESS` to writer methods only (as above), or also to Firebase readers (28 more reader facts have a resolved path)? I recommend writers only for now: the request was writers and triggers.
Also for the shared tree: none of this touches the shared files until approved; it will be built in a copy, dry-run against live, and applied in a Lane A write turn with the diff posted first.

**Correction to decision 4 above (append-only):** I wrote "28 more reader facts have a resolved path"; that number was not measured. Measured now (live, read-only): Firebase has **207 read-wrapper call facts** (`_get`, `_query`, `_queryOr`, `_queryWithPagination`, `_queryCollectionGroup`, `_listDocuments`, `_getDocRef`) with an `evidence.resolvedPath`, on **75 distinct paths**. My recommendation is unchanged (writers only for now).

### 2026-09-26: [Lane C] W2 (Pub/Sub publish side, wiki T-111): READ-ONLY investigation and PROPOSALS for user approval (nothing edited, no extraction, no DB write, no gcloud; no git add/commit)

Assigned by the coordinator (session -47), user-approved as read-only. Sources: live `facts_index` (read-only SQL), pinned clone `output/clones/firebase-oskey-dev` at `00e1d9fd`, `functions/.env*`, `governance/reference-docs/pubsub.bindings.staging.json` (project `staging-oskey-io`, extractedAt 2026-09-21T06:50:31Z), `build-cross-repo-edges.ts`. For Lane B (extractor) and Lane A (join) to start without re-investigating.

## 1. The argument-mapping bug: the premise needs correcting

The extractor takes the **first** argument in both detection branches, not the second: `pipeline/firebase-oskey-dev/phase-01-ast-extraction/01-extract-ast-evidence.ts:1389` (structural `pubSub.topic(x).publishMessage`) and `:1413` (name-matched wrapper), in the committed version at `:1066-1090` and `:1088-1110` (the `:1071`/`:1095` in doc 43's spec are the `type: "pubsub_publish_call"` lines of the same two blocks; Lane B's edits moved them). The name match is `PUBSUB_PUBLISH_METHODS = new Set(["_publishMessage", "publishMessage"])` at `:533` (committed `:430`), by method name only.
The real defect is that **the name `publishMessage` has three different signatures in this repo**, and the extractor assumes argument 0 is the topic for all:
- `_publishMessage(topic, orderingKey, body)`: `message.controller.ts:18` (`topicName, orderingKey, body`, calls `pubSub.topic(topicName).publishMessage({data, orderingKey})` at `:31-34`), `document_and_message.controller.ts:74` (internal class, `publishMessage(topic, orderingKey, body)`) and `:155`. Argument 0 = topic. Correct.
- `OSKAccessController.publishMessage(accessControlDeviceId, payload)`: `access.controller.ts:69-72`. **Argument 0 = the device id** (it becomes the Pub/Sub ordering key); the topic is computed inside (`topicName = this.getTopicName()`, `:70`) and passed on at `:71`.
- `OSKBuildingIntercomController.publishMessage(acdId, payload)`: `building_intercom.controller.ts:60-63`. Argument 0 = the device id; topic inside at `:61`.
The 7 wrong facts are exactly the 7 **callers of those two 2-argument wrappers**: `access_message_publisher.service.ts:136,169,192` (`buildingDoorACD.accessControlDeviceId`), `:225` (`acdId`); `building_intercom_message_publisher.service.ts:24,56` (`intercomDoc.accessControlDeviceId`), `:64` (`intercomId`). Verified live: 14 `external_hook` / `pubsub_publish_call` facts in firebase; 7 with an ordering key as `value`; 5 pass-through (`topicName` at `message.controller.ts:31`, `access.controller.ts:71`, `access_control_device_config.controller.ts:92`; `topic` at `document_and_message.controller.ts:75` and `:156`); 1 partial (`{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}` at `building_intercom.controller.ts:62`); 1 resolved literal (`accessControlDeviceConfigs`, `access_control_device_public_keys.controller.ts:84`). The two 2-arg wrappers are *callers* of `_publishMessage`, not publish origins, which is why their facts carry the wrong thing.
Evidence already on each fact that makes the fix possible: `calleeSymbol`, `declarationFile` (the wrapper's file) and `resolutionStatus: resolved` (fact `external_hook|core|…access_message_publisher.service.ts|buildingDoorACD.accessControlDeviceId|#1`).

## 2. Env-var resolution: the wiki's 10 is right; exactly which sites and by what chain

`functions/.env` is tracked in git (last change `b9e22365`, 2026-06-10). It holds 7 topic variables: `OSK_PUBSUB_TOPIC_ACD_ACCESSES=accessControlDevice_accesses`, `_ACCESS_LOGS=accessControlDevice_accessLogs`, `_ACCESS_COMMANDS=accessControlDevice_accessCommands`, `_CONFIGURATIONS=accessControlDevice_configurations`, `_INTERCOM_ENTRIES=accessControlDevice_intercomEntries`, `_STATES=accessControlDevice_states`, `_SYSTEM_LOGS=accessControlDevice_systemLogs`. `.env.local`, `.env.dev`, `.env.staging`, `.env.prod` (all tracked) contain **0** `OSK_PUBSUB`/`TOPIC` lines, so nothing overrides. Only **3** of the 7 are referenced in Firebase source (grep of `src/`): `access.controller.ts:75` (`getTopicName()` returns `` `${process.env.OSK_PUBSUB_TOPIC_ACD_ACCESSES}` ``), `access_control_device_config.controller.ts:87` (`_CONFIGURATIONS`), `building_intercom.controller.ts:61` (`_INTERCOM_ENTRIES`). The other 4 are published by the devices themselves (not an indexed repo).

| # | site (file:line) | chain | topic (from `.env`) | in staging snapshot | receiving route in node-iot facts |
|---|---|---|---|---|---|
| 1 | `access.controller.ts:71` | `const topicName = this.getTopicName()` (`:70`) -> method body (`:74-76`) -> template with `process.env.OSK_PUBSUB_TOPIC_ACD_ACCESSES` | `accessControlDevice_accesses` | yes, push | `POST /access-control-devices/pubsub/accesses`, `access_control_device_accesses.route.ts:44` |
| 2-5 | `access_message_publisher.service.ts:136, 169, 192, 225` | call `OSKAccessController.default.publishMessage(<device id>, payload)` -> declaration `access.controller.ts:69` -> site 1 | same | same | same |
| 6 | `building_intercom.controller.ts:62` | `const topicName = ` template with `process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` (`:61`) | `accessControlDevice_intercomEntries` | yes, push | `POST /access-control-devices/pubsub/intercom-entries`, `access_control_device_intercom_entries.route.ts:28` |
| 7-9 | `building_intercom_message_publisher.service.ts:24, 56, 64` | call `OSKBuildingIntercomController.default.publishMessage(<id>, payload)` -> declaration `building_intercom.controller.ts:60` -> site 6 | same | same | same |
| 10 | `access_control_device_config.controller.ts:92` | `const topicName = this.getTopicName()` (`:91`) -> `:86-88` env `OSK_PUBSUB_TOPIC_ACD_CONFIGURATIONS` | `accessControlDevice_configurations` | yes, push | `POST /access-control-devices/pubsub/configs`, `access_control_device_configs.route.ts:25` |
| 11 | `access_control_device_public_keys.controller.ts:84` | literal first argument `'accessControlDeviceConfigs'` (`_publishMessage('accessControlDeviceConfigs', deviceId, {...})`) | `accessControlDeviceConfigs` | **no** (not among the 11 topics; note it differs from the env topic `accessControlDevice_configurations`) | none |
| 12-14 | `message.controller.ts:31`, `document_and_message.controller.ts:75`, `:156` | shared plumbing: topic is the method's own parameter (`topicName` / `topic`); the concrete topic is supplied by the callers, which are sites 1, 6, 10, 11 | not a topic | n/a | n/a |

So **10 of 14 resolve to a concrete topic** (rows 1-10), by two chain shapes: 3 direct (`_publishMessage(topicName, …)` with a local or getter-derived env template: rows 1, 6, 10) and 7 through a wrapper call (rows 2-5, 7-9). Of the remaining 4: 1 resolves in source but is not deployed in staging (row 11) and 3 are pass-through parameters of shared plumbing (rows 12-14). Matches the wiki's acceptance ("at most 4 unresolved") exactly. Earlier "3 env getters read directly" was right and is consistent: 3 direct env reads feed all 10.
Why the extractor cannot do it today: `resolveExpressionValue` (`01-extract-ast-evidence.ts:199`) has no case for a call expression (`this.getTopicName()`), and treats `process.env.X` inside a template as an unresolved span, which is why row 6 became `partial` with `{process.env.…}` in `value`.

## 3. Join side: which Firebase to node-iot edges become possible

The join (`pubsubBindingJoin`, `build-cross-repo-edges.ts:567`) already does topic -> subscription -> push endpoint -> node-iot route (`:620-735`); it reads the topic from `evidence.value` and requires `evidence.topicResolutionStatus === "resolved"` (`:96-103`, `:622-623`, `:680`). Nothing is wrong with its binding logic; it only starves for resolved publisher facts. Each of the three topics has exactly one subscription and its route exists in the facts (the current rows already carry `target_fact_id`). With rows 1-10 resolved: **10 `resolved` firebase -> node-iot edges** (accesses 5, intercomEntries 4, configurations 1), one per publish-site fact, `source_fact_id` = the site's fact, `target_fact_id` = the route fact, staging only (already stated in `details`/`confirmed_via`).
Current slice (25): firebase -> unknown 14 unresolved; node-iot -> firebase 1 resolved (`route.handler.ts:101` activities); node-iot -> unknown 1; unknown -> node-iot 3 unresolved (the 3 topic-only "no publisher fact" rows for exactly these three topics); unknown -> unknown 6. Expected after: firebase -> node-iot **10 resolved**, firebase -> unknown **4 unresolved** (3 pass-through + row 11), node-iot -> firebase 1, node-iot -> unknown 1, unknown -> node-iot **0** (the join marks a binding `covered` once a publisher reaches it, `:709`, so those 3 rows stop being emitted), unknown -> unknown 6: **22 rows, down from 25, and total edges 17,784 -> 17,781** (assuming nothing else changes). **That is a decrease of 3, so the shrink guard will refuse it: Lane A needs an explicit, user-approved allowance** (the 3 rows are superseded, not lost). The other 4 device-published topics (`accessLogs`, `accessCommands`, `states`, `systemLogs`) have no Firebase publisher and stay `unknown -> unknown`/unresolved, correctly.

## 4. Proposals (all additive; nothing renamed; no `value` change)

**Do not change `evidence.value`, `confidence`, `topicResolutionStatus` or the fact ID.** The ID embeds `value` (`external_hook|core|<file>|<value>|#n`), so correcting `value` on the 7 wrong facts would change their IDs (embeddings and any edge references lost) and break the wiki's `fact_ref` stability rule. New fields instead:

Extractor (Lane B, `firebase-oskey-dev` 01/02 only), on every `pubsub_publish_call` fact:
- `topicName`: the concrete topic string (`accessControlDevice_accesses`), or absent.
- `topicNameStatus`: `resolved` | `pass_through_parameter` | `env_var_not_defined` | `env_var_overridden` (defined in more than one `.env*` file) | `unresolved` (+ `topicNameReason` in words).
- `topicSource`: `{ kind: "literal" | "env_var" | "parameter", envVar?, envFile?, envLine? }`.
- `publishRole`: `origin` (calls `_publishMessage`/the SDK with a resolved topic) | `via_wrapper` (calls a method that publishes; then `wrapperDeclarationFile`/`wrapperMethod`) | `plumbing` (topic is a parameter of the method itself).
- `orderingKeyExpression`: source text of the ordering key (the argument the wrapper forwards, e.g. `buildingDoorACD.accessControlDeviceId`), recorded separately from the topic.
- `topicResolvedVia`: short ordered chain, e.g. `["OSKAccessController.publishMessage @ access.controller.ts:69", "getTopicName @ access.controller.ts:74", "env OSK_PUBSUB_TOPIC_ACD_ACCESSES = accessControlDevice_accesses @ functions/.env:27"]`.
Algorithm (general, not a name table): for a publish-method call with a resolved `declarationFile` and declaration, find the publish call inside that declaration, map its topic argument through the declaration's parameters (a topic that is a parameter is `plumbing`; otherwise evaluate it in the declaration), map its ordering-key argument back to the caller's argument, recurse with a depth cap and cycle guard; if the declaration has no publish call inside, it is not a publish site. New helper, opt-in for this path only (**do not change `resolveExpressionValue` globally**, other facts depend on it): follow a call to a method whose body is a single `return <expr>`; resolve `process.env.NAME` from a table read **literally from the repo's own `.env*` files, discovered dynamically** (glob `.env*` next to the functions root, config-driven like W1's `additionalSourcePaths`), fail-closed: name not found, defined in several files with different values, or a non-literal RHS -> unresolved with a reason. Parse dotenv literally (`KEY=value`, no interpolation).
Join (Lane A, `build-cross-repo-edges.ts` only): read the topic from `evidence.topicName` when `topicNameStatus = resolved`, else fall back to the old fields (so node-iot's facts, which lack the new fields, behave exactly as today); treat `plumbing` as unresolved with a specific reason ("topic is a parameter of a shared publish method; the concrete topic is recorded on its callers") instead of "a pass-through parameter at this call site" (`:685`), and use the parameter name, not an ordering key, in the edge symbol; reword the "no fact on the publishing end" text (`:734`) to name the right kind ("`external_hook` fact with `evidence.type = pubsub_publish_call`") since the wiki's F8 was a misreading of that; allow the 3-row shrink. Also `sync-facts.ts` `descriptionFor` (Lane A): add ` -- topic: <topicName> (<topicSource>) -- ordering key: <orderingKeyExpression> -- <publishRole>` for this type, so the 14 descriptions stop reading like a bare device id.

**Acceptance (wiki's, plus ours):** 14 facts still 14, IDs identical (pre-sync gate; only payload additions); `topicNameStatus = resolved` on exactly rows 1-11 (10 to a snapshot topic + row 11 to a topic not in the snapshot), `plumbing` on rows 12-14; PUBSUB_TOPIC_BINDING: firebase -> node-iot 10 resolved with non-null targets, firebase unresolved 4 (at most 4), no edge symbol is an ordering key or device id, `details` name `external_hook` / `pubsub_publish_call`; the node-iot -> firebase `accessControlDevice_activities` edge unchanged; slice 22 rows, total 17,781; every other slice identical; `resolved` edges dangling 0; staging stated in `details`. Independent source check: 3 topics x sites as in the table (5 / 4 / 1).
**Embedding:** the 14 firebase descriptions change only if `descriptionFor` is extended: 14 facts, about 1.5k to 2k tokens (negligible); with no `descriptionFor` change, payload-only, 0 embeds. node-iot's 2 are unaffected.

**What the extractor cannot know statically (record, do not guess):** the deployed value of each variable (Cloud Functions loads the checked-in `.env` files at deploy, but a runtime override set in the GCP console/CI is invisible; prod/dev topic names could differ, and the snapshot is staging only); whether topic `accessControlDeviceConfigs` exists in prod (row 11 is unresolved only against the staging snapshot; it is not `accessControlDevice_configurations`, so those key updates may never reach node-iot: worth telling the wiki team as a **probable bug or dead path**, unverified); the runtime value of an ordering key; `message.controller.ts:29` skips publishing entirely when the project id is `sandbox-oskey-io`; `publishMessageIntercomDelete` passes an *intercom* id where the wrapper's parameter is named `acdId` (`building_intercom_message_publisher.service.ts:64`), which is consistent only if intercom documents are keyed by the device id (not verified).

**Decisions for the user:** (1) approve leaving `value`/IDs untouched and adding the fields above (recommended) versus correcting `value` (changes 7 fact IDs); (2) approve the 3-row shrink on this slice (25 -> 22) as superseded topic-only rows; (3) approve the `descriptionFor` extension (about 2k embed tokens); (4) hand to Lane B after W4b/W4e, then Lane A for the join, then a write turn each per the protocol. Cost: zero LLM spend besides that embed. I stop here.

### 2026-09-26: [Lane A] W6 (P7) design and DRY-RUN numbers for the USER'S REVIEW: same-repo call edges from the call facts' own declaration fields. Read-only: no code in the shared tree, nothing written to any database, no `git add`/`git commit`

Session `-29`. Numbers are from read-only queries against live `facts_index` (Firebase run `20260926_082903-00e1d9fd`, 69,626 facts, 17,800 edges, no write turn open) through a throwaway script (deleted afterwards). The live run is later (after W4e) and only after the user has reviewed these numbers.

**Population (Firebase `call_expression`, live).** 5,907 resolved calls (`resolutionStatus = resolved`); **4,546 of them name a declaration inside the repo** (`functions/...`), the other 1,361 point outside it (SDK/node_modules/shared code, out of scope). Of the 4,546, **2,350 already have a followed `INTRA_REPO_CALL` edge** (the resolved-graph edges; all target `controller_method` / `service_method` facts, 323 distinct callees) and **2,196 have none** (the spec's "2,141", now 2,196 because W1 brought `utils`/`decorators` in scope).

**The join.** A new join (in the cross-repo builder, with the usual preflight, shrink guard and scoped replace; **not** `build-intra-repo-edges.ts`, which cannot produce these). For each in-repo resolved call fact with no existing followed `INTRA_REPO_CALL` edge: callee location = the call's `evidence.aliasedDeclarationFile/Line/Class/Method` when present (Lane B's alias fields), else `declarationFile/Line/Method`; callee fact = the declaration fact (`controller_method`, `service_method`, `class_method`, `function_declaration`) at that file and line (and name where the line has more than one). Edge: call-site fact (source) → callee declaration fact (target), `resolved`, `ast_derived`. **A new connection type is needed** because a second writer of `INTRA_REPO_CALL` for the same source repo would delete the intra builder's rows (slice ownership guard): I propose `INTRA_REPO_CALL_DECLARED` (name for the user to confirm). It runs after the intra step in `pipeline:edges`, since it skips call sites the intra step already edged.

**Dry-run numbers.**
- Candidates 2,196 → **2,027 with a callee fact (edges), 0 ambiguous, 0 self-calls, 169 with no callee fact.** The 169: **128 have no `declarationMethod` at all** (the callee is an arrow-function class property or a constructor: `controllers/document.controller.ts` 69, `document_and_message.controller.ts` 10, `user.controller.ts` 8, …: the same arrow-function-property gap Lane B has as W4e) and **41 have a method name but no declaration fact** (`OSKCallService.*` 17, `OSKBuildingDoorAccessControlDeviceController.*` 12, …). No edge for them; reported by the join. 34 distinct callees.
- **Same-module 1,631 (81%), cross-module 396.** By callee kind: controller_method 896, service_method 546, function_declaration 313, class_method 272. The +2,027 is +86% on the 2,350 existing followed Firebase intra edges (edges total 17,800 → 19,827 without any hub handling).
- Same-module edges by callee module: building 346, core 323, user 306, organization 271, admin 147, supplier 86, settings 47, access_control_device 31, unit_management 25, apps 23, utils 17, call 9. Cross-module edges by callee module: **utils 208, decorators 139**, core 20, organization 8, building 6, user 5, access_control_device 3, settings 2, and one each call, admin, supplier, tasks, unit_management. So the cross-module bucket is almost entirely the new shared-code modules `utils` and `decorators` (347 of 396), which W1 added.
- **Effect of the alias fields: 235 of the 2,027 edges exist only because of them** (the call's own `declarationFile` is the importing file; the alias gives the real declaration): decorators::OSKUserSecurityChecks 138, building::createField 20, admin::getAdminOrganizationUser 20, admin::getUserById 18, core::areTypeOSK…AccessRight 6+5+3+…, etc. Without the alias fields the join would give 1,792 edges.

**Fan-in and hubs.** 755 distinct callees receive the 2,027 edges. Fan-in percentiles p50/p75/p90/p95/p99/max = **1 / 2 / 4 / 6 / 21 / 150**; histogram: 467 callees at 1, 143 at 2, 45 at 3, 26 at 4, 20 at 5, 18 at 6, then a thin tail up to 19 (1–4 callees per value), and 21, 28, 29, 38, 52, 62, 138, 150 (one callee each). **Top callees (edges in):** utils::checkParameters 150, decorators::OSKUserSecurityChecks 138 (all via alias), core::logInfo 62, core::logError 52, building::createField 38, utils::user_security_checks 29, user::get 28, admin::isOskeyAdmin 21, admin::getAdminOrganizationUser 20, core::logDebug 20, building::get 19, core::ensureInitialized 19, admin::getUserById 18, organization::_getTime 15, organization::getOrganizationUser 14, organization::get 13, core::logWarning 11, core::getManagementApiAccessToken 11, utils::convertToDateString 10, building::getCollectionPath 10, utils::convertToDateObject 10, organization::get 10, building::getCollectionPath 9, core::publishMessageToAllACDs 9, … (the full per-callee list is reproducible from the join's dry-run). **Kind of callee, by what the top hubs are:** security/permission checks (checkParameters, OSKUserSecurityChecks, user_security_checks, isOskeyAdmin), logging (logInfo, logError, logDebug, logWarning), core utilities (ensureInitialized, getManagementApiAccessToken, convertTo…, getCollectionPath), and a few same-module business hubs (createField 38, user::get 28, getAdminOrganizationUser 20, building::get 19, getUserById 18).

**Fan-in threshold derived from the data, not a name list.** The distribution is heavy-tailed (median 1), so a raw-count Tukey fence is far too aggressive (fence 3.5 would skip 100 callees / 1,139 edges). On the **log of the fan-in**:
| rule | threshold | callees skipped | edges skipped | edges kept |
|---|---|---|---|---|
| no threshold | none | 0 | 0 | 2,027 |
| inner fence (Q3 + 1.5·IQR of log fan-in) | > 5.7 | 54 | 935 | 1,092 |
| **outer fence (Q3 + 3·IQR of log fan-in)** | **> 16.0** | **13** | **614** | **1,413** |
At the **outer fence** the 13 skipped callees are exactly the ones an engineer would call infrastructure hubs plus a few business hubs: checkParameters 150, OSKUserSecurityChecks 138, logInfo 62, logError 52, createField 38, user_security_checks 29, user::get 28, isOskeyAdmin 21, getAdminOrganizationUser 20, logDebug 20, building::get 19, ensureInitialized 19, getUserById 18; skipped edges by callee module: utils 179, core 153, decorators 138, admin 59, building 57, user 28. Kept: **1,413 edges = 1,336 same-module + 77 cross-module, of which 39 alias-dependent** (196 of the 235 alias edges land on hubs, mostly the 138 decorator applications, which stay discoverable through the alias fields on the call facts themselves). The threshold would be computed at run time from the data and printed with the skipped callees on every run (same discipline as the other joins' preflight/report), never a name list. I recommend the outer fence.

**Options for hub handling (for the user to choose):**
1. **Skip edges into callees above the derived fence and report them (recommended):** 1,413 edges, total 17,800 → 19,213; the 13 hubs and their fan-in are printed by the join. Cost: `checkParameters` and the decorator applications have no incoming edge; their callers are still visible in the facts (`declarationFile`/alias fields).
2. **Keep every edge (2,027):** completeness, but `findGraphNeighbors`/bounded cluster walks on a hub return 150-node neighbour lists (this repo's INTRA graph already has 323 callees; these 13 hubs are what the earlier investigation (doc 38 P8) wanted capped).
3. **Keep hub edges under a separate connection type** (e.g. `INTRA_REPO_CALL_HUB`): nothing lost, consumers can filter; but today's traversal follows every resolved edge regardless of type, so it needs a change in `mcp-server/` (not my files) to be useful.
4. **Cap per hub** (keep K callers per hub): rejected; K would be arbitrary and the kept subset unrepresentative.
Also to decide: (a) the type name `INTRA_REPO_CALL_DECLARED`; (b) the 169 no-callee-fact call sites are reported only (recommended), not stored as `unresolved` rows; (c) the join only for repos where call facts carry `declarationFile/Line` (today Firebase, discovered from the data, not named); Angular's call facts have the same fields and would need their own dry-run before being included.

**Not run / not decided:** no code written in the shared tree; the join has not been built yet (these numbers are from a read-only simulation of the rules above, so the built join's dry-run may differ slightly and will be posted before any live turn).

### 2026-09-26: [Lane B] W4b DONE (numbers) and write turn released

Turn `WRITE TURN GRANTED: Lane B W4b` (exclusive; last write-turn-log line was that grant). Sequence exactly as in the READY TO SYNC entry. No `git add`/`git commit`; no `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; no command was denied.

1. **Preconditions:** `run-context.json` = `20260926_131550-8345d222`; live DB 69,626 facts, angular 8,910, 17,800 edges, 0 without an embedding, no active sessions, current Angular run = the W3 run. **Gate re-run just before the turn:** 8,910 identical / 6 new / 0 pruned / 0 description changes.
2. **Dump:** `output/backups/facts_index-2026-09-26-before-W4b.dump` (278,287,516 bytes, gitignored, `pg_restore -l` lists 57 entries). Restore point (`before-W4b`).
3. **Sync, `EMBED` unset, 4 modules** (the loop stops on any deviation and did not): components 0/0/0, **core 5/5/0, features 1/1/0**, app_root 0/0/0 (new / need embedding / removed).
4. **Read-only check:** facts 69,632 (+6); angular 8,916 all at `20260926_131550-8345d222`; exactly **6 angular facts without an embedding**; current Angular run = the held run; edges still 17,800.
5. **Embedding (user confirmed directly in the window):** `EMBED=true` for `core` and `features` only. 6 embedded (5 + 1). **Actual tokens from `embedding_calls` (call_ids 1132, 1133, `gemini-embedding-2`): 499 total (424 + 75),** none truncated. Facts without an embedding afterwards: 0 (whole DB).
6. **Edges:** plain `npm run pipeline:edges`, exit 0, shrink guard silent, **0 dangling** (resolved/confirmed and other statuses), **all 17 `edge_sync_state` slices `ok`.** **All 17,800 edge rows are identical before and after, content hash included (0 removed, 0 added)**, as predicted (nothing reads the new kind until W4d): `FIELD_BINDING` 13 → 13; Angular `HTTP_API_CALL` 97 resolved / 5 unresolved; every other slice unchanged.

**What W4b delivered (spec acceptance):** every real `@angular/fire/firestore` call site with a path or an operation has a `firestore_client_call` fact (6) with path template and operation, or a stated reason (the generic `setDoc` wrapper is `unresolved: parameter_passthrough`, the id-generation site has `operation: null` with its reason); the 3 setup calls are listed as skipped by role; the SDK-table gap report was 0 in the real code; nothing changed for existing Angular fact IDs (8,910 identical); shape identical to Lane C's Swift facts, so Lane A's W4d can read both.

**State left behind:** live DB = post-W4b (69,632 facts, 17,800 edges, 0 without an embedding, Angular current run `20260926_131550-8345d222`). Restore point `facts_index-2026-09-26-before-W4b.dump`. Scratch files deleted. Nothing running. Next: **W4e** (approved) as its own held run, gate and turn; the code is being written now (firebase files only; no `pipeline:firebase` run before this release).

- 2026-09-26 (Lane B): write turn released. Requesting `WRITE TURN RELEASED: Lane B W4b` from the coordinator.

**Check of decision (c) above (append-only):** measured live: Angular has 2,363 resolved call facts, all with `declarationFile` and `declarationLine`; node-iot has 277, all with both (node-iot's INTRA_REPO_CALL is switched off in `config/repos.json`; a W6 join would need that decision revisited for it). So the join is not Firebase-specific in what it reads; including Angular or node-iot needs its own dry-run and the user's go.

### Coordinator note 2026-09-26 (about 14:45 UTC): Lane B's W4b validated and released

- **W4b independently validated (coordinator, read-only):** every edge slice compared between `facts_index-2026-09-26-before-W4b.dump` and the live table: **17 of 17 slices byte-identical, 0 different** (17,800 rows both sides), as expected (the join for these facts is W4d). Live: 69,632 facts (+6), 0 missing embeddings, 0 dangling, `edge_sync_state` 17 slices with 0 dangling. Angular current run is `20260926_131550-8345d222`; `firestore_client_call` in Angular: `core` 5, `features` 1. Embedding: 499 tokens for the 6 facts (W3's 10,530 plus this 499 = 11,029 in the window), none truncated. The only active database session was autovacuum on the facts table (normal housekeeping after the writes).
- **WRITE TURN RELEASED: Lane B W4b.** No write turn is open.
- **Client Firestore facts now live on both platforms:** Swift 65 + Angular 6 = 71 `firestore_client_call` facts on one shared shape; Lane A's W4d can read both.

### 2026-09-26: [Lane B] W4e extracted into a HELD run and gated. READY TO SYNC (waiting for a granted write turn)

Approved by the user via the coordinator (additive design: enclosing member on call facts, callee-side member, 11 method-shaped facts; existing IDs unchanged). Files only: no sync, no `EMBED`, no edges, no DB write; no `git add`/`git commit`. **HELD RUN ID: `20260926_132249-00e1d9fd`** (firebase, pinned commit `00e1d9fd`, `output/runs/firebase-oskey-dev/20260926_132249-00e1d9fd/`). The DB's current firebase run is still the W4a run `20260926_082903-00e1d9fd`. **Caution:** `output/firebase-oskey-dev/run-context.json` points at the held run, so a firebase `sync-facts.ts` would load it; nobody syncs firebase outside a granted turn. Extraction: exit 0, **no parse error** (`ast-errors.json` empty), only the existing `UNRESOLVED_CALLS_WARNING`.

**Code (Lane B files only), `01-extract-ast-evidence.ts` + `02-build-module-evidence.ts` (firebase):** (a) function-valued class properties (`set = async (...) => {...}`) are recorded as method-shaped facts through the same `rawMethods` path and the same kind rules as methods (`controller_method` / `service_method` / `class_method`), with `evidence.memberKind: "arrow_function_property"` (present **only** on the new facts; existing method facts are unchanged). (b) Every call fact gets `evidence.enclosingMemberName`, `enclosingMemberKind` (`method` | `function` | `arrow_function_property` | `constructor` | `accessor` | null), `enclosingMemberStartLine`, `enclosingMemberEndLine`; callbacks nested in a member belong to that member. (c) Every call fact gets `evidence.declarationMemberName` / `declarationMemberKind` (`arrow_function_property`) when the callee's declaration is a function-valued property. `callerName` and `declarationMethod` are untouched (so all IDs are unchanged; `callerName` stays in the call fact ID as `anon`).

**Pre-sync fact-ID gate (firebase, held run vs `facts.fact_id`, live `descriptionFor`):**

| | count |
|---|---|
| DB facts / run facts | 15,442 / 15,453 |
| **identical IDs** | **15,442** (all) |
| **new** | **11** = building 5 + user 5 (`controller_method`), core 1 (`service_method`) |
| **would be pruned** | **0** |
| description changes on existing facts | **0** (none) |
| existing values changed (excluding `runId`) | **0** |
| to embed | **11**: 2,102 characters, about **526 tokens by chars/4 (about 1k at 95/fact)** |

**Additive keys on call facts (all 6,741, null where not applicable; consumers treat null as "none"):** `enclosingMemberName/Kind/StartLine/EndLine`, `declarationMemberName/Kind`. **Values:** `enclosingMemberKind` = method 5,844, function 493, **constructor 173**, **arrow_function_property 73**, null 158 (149 module-level code, 5 non-function property initializers, 4 object-literal functions; those stay null). Of the **404** call facts that have no `callerName`, **246 now have an enclosing member** (73 arrow-function property + 173 constructor); 158 still have none, by construction. **Callee side: 17 call facts carry `declarationMemberName`** (door-device controller `getAll` 7, `getByDoor` 2, `get` 1, `set` 1, `update` 1; token controller `delete`, `deleteAll`, `deleteAllByTokenId`, `get`, `save` 1 each), as measured before.

**The 11 new facts:** `OSKBuildingDoorAccessControlDeviceController` `get` (:21), `getAll` (:30), `getByDoor` (:38), `set` (:50), `update` (:60) in `building/modules/building_door/controllers/building_door_access_control_device.controller.ts`; `OSKUserDeviceAccessControlDeviceTokenController` `get` (:18), `save` (:27), `delete` (:37), `deleteAll` (:42), `deleteAllByTokenId` (:48) in `user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts`; `PubSubMessageProcessor.processPubSubMessage` (`core/services/pub_sub_receiver.service.ts:44`). All `isAsync: true`, `visibility: public`, `isStatic: false`.

**The 5 write-wrapper calls that had no source now all resolve to an enclosing member (the join reads `coalesce(callerName, enclosingMemberName)` with `callerClass`):** `building_door_access_control_device.controller.ts:57` `_set` → `OSKBuildingDoorAccessControlDeviceController.set` [50-58] and `:67` `_update` → `.update` [60-68] (the writer of `create /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`); `user_device_access_control_device_token.controller.ts:34` `_set` → `OSKUserDeviceAccessControlDeviceTokenController.save` [27-35], `:39` `_delete` → `.delete` [37-40], `:44` `_deleteAll` → `.deleteAll` [42-45]. Each of those members now also has its method fact.

**Exact commands for the W4e write turn (only after a `WRITE TURN GRANTED: Lane B W4e` is the last write-turn-log line):**
1. Preconditions: `run-context.json` = `20260926_132249-00e1d9fd`; record live counts; re-run the gate against the then-live DB (must still show 15,442 identical / 11 new / 0 pruned / 0 description changes).
2. `pg_dump` to `output/backups/facts_index-2026-09-26-before-W4e.dump` + `pg_restore -l`.
3. Sync, `EMBED` unset, all 15 modules; **expected new / need embedding / removed: building 5/5/0, user 5/5/0, core 1/1/0, every other module 0/0/0.** Stop and ask if any differs.
4. Read-only check: facts = previous + 11; firebase 15,453 at the held run; exactly 11 firebase facts without an embedding; current firebase run = the held run.
5. `EMBED=true` only after the user confirms directly in the window; modules `building`, `user`, `core`; record actual tokens from `embedding_calls`.
6. Plain `npm run pipeline:edges`; verify against a per-slice snapshot taken immediately before: 0 dangling, all `edge_sync_state` slices ok, `FIELD_BINDING` 13, and every slice byte-identical (nothing reads these keys until Lane A's builders do; if a builder in the shared tree already reads `enclosingMember*`, I report exactly which rows change, old rows a strict subset). Append the results; the coordinator releases. No `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; if the live-DB classifier asks the user to approve a command I wait and never work around a denial.

### Coordinator note 2026-09-26 (about 15:05 UTC): Lane B's W4e gate validated and turn granted; Lane A's W4d/W6 designs under review

- **W4e held run independently validated (coordinator, read-only):** run `20260926_132249-00e1d9fd` vs the live database (firebase): **15,442 identical, 11 new (building 5, user 5, core 1), 0 pruned, 0 existing values changed**; additive keys `enclosingMember{Name,Kind,StartLine,EndLine}` and `declarationMember{Name,Kind}` on all 6,741 call facts (null where not applicable); 246 call facts that had no `callerName` now have an enclosing member (73 in arrow-function properties). The 11 new facts are `controller_method`/`service_method` facts with `memberKind: arrow_function_property`: `OSKBuildingDoorAccessControlDeviceController` get/getAll/getByDoor/set/update, `OSKUserDeviceAccessControlDeviceTokenController` get/save/delete/deleteAll/deleteAllByTokenId, and `PubSubMessageProcessor.processPubSubMessage` (core; the Pub/Sub push receiver, relevant to W2).
- **WRITE TURN GRANTED: Lane B W4e** (exclusive). Expected: sync 15 modules with 0 new except `building` +5, `user` +5, `core` +1; total facts 69,643; embed 11 facts (about 526 tokens, pre-approved up to about 1k); every edge slice byte-identical after `pipeline:edges` (the joins do not read the new keys yet).
- **Lane A's designs (W4d Swift side, W6):** independently spot-checked one new finding: `OSKCKFirestoreDocumentPath.userInvitations` has the template `/users/{userId}/invitations` (3 segments) while every other one of the 32 path cases has the right parity (documents even, collections odd); its single client call site is `OSKCKUserInvitationService.swift:157` (`listen`): a probable client bug (a document listener on a collection-shaped path would fail at runtime). The 15 friends-related client facts match Lane A's count. Decisions for the user are pending; no live work until approved.

### 2026-09-26: [Lane B] W4e DONE (numbers) and write turn released

Turn `WRITE TURN GRANTED: Lane B W4e` (exclusive; last write-turn-log line was that grant). Sequence exactly as in the READY TO SYNC entry. No `git add`/`git commit`; no `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; no command was denied.

1. **Preconditions:** `run-context.json` = `20260926_132249-00e1d9fd`; live DB 69,632 facts, firebase 15,442, 17,800 edges, 0 without an embedding, no active sessions, current firebase run = the W4a run. **Gate re-run just before the turn:** 15,442 identical / 11 new / 0 pruned / 0 description changes.
2. **Dump:** `output/backups/facts_index-2026-09-26-before-W4e.dump` (277,932,130 bytes, gitignored, `pg_restore -l` lists 57 entries). Restore point (`before-W4e`).
3. **Sync, `EMBED` unset, 15 modules** (the loop stops on any deviation and did not): every module matched: **building 5/5/0, user 5/5/0, core 1/1/0**, all 12 others 0/0/0 (new / need embedding / removed).
4. **Read-only check:** facts 69,643 (+11); firebase 15,453 all at `20260926_132249-00e1d9fd`; exactly **11 firebase facts without an embedding**; current firebase run = the held run; edges still 17,800 before the edge step.
5. **Embedding (user confirmed directly in the window):** `EMBED=true` for `building`, `user`, `core` only. 11 embedded (5 + 5 + 1). **Actual tokens from `embedding_calls` (call_ids 1134-1136, `gemini-embedding-2`): 635 total (305 + 287 + 43),** none truncated. Facts without an embedding afterwards: 0 (whole DB).
6. **Edges:** plain `npm run pipeline:edges`, exit 0, shrink guard silent, **0 dangling** (resolved/confirmed and other statuses), **all 17 `edge_sync_state` slices `ok`.** Row-level comparison of all 17,800 edges before vs after (content hash included): **17,800 → 17,810 (+10), 0 old rows missing or changed.**

**This deviates from my prediction ("every slice byte-identical, nothing reads the new keys yet"), so here is the cause.** The only change is **firebase `INTRA_REPO_CALL` 2,372 → 2,382 (2,350 → 2,360 confirmed; 22 unresolved unchanged; 2,372 old source fact ids identical, 10 only in the new slice).** The shared intra builder resolves a call to a *method fact*; the 11 new method-shaped facts are now targets it can find, so calls INTO those arrow-function members, the callee-side calls I measured (17 with `declarationMemberName`), gained edges (10 of them resolve): callers `OSKAccessMessagePublisherService.publishMessageToAllACDs`, `OSKAccessUtilsService.getAccessControlDevicesPerDoor` and `OSKUserDeviceService.createAccessDeviceToken` (`.default.getAll`, module `core`/`user`), `OSKDbIntercomService.updateAccessControlDeviceModel` (`.get`, `.update`) and `.createBuildingIntercomsBase` (`.getAll`) (`admin`), `OSKIntercomCommunicationService.createIntercomCommunication` and `._updateDeviceConfigWithMessage` (`.getByDoor`) and `OSKPropertyService._getDevicesCountForBuildings` (`.getAll`) (`organization`), `OSKAccessService.deleteAccessById` → token controller `deleteAllByTokenId` (`core`); **by target module: building 8, user 1** (all controller methods, all confirmed). This is the intended effect of giving those members facts, not drift; it was not a new join reading the new keys. **Nothing else moved: `FIELD_BINDING` 13 → 13, `FIRESTORE_EVENT_TRIGGER` 31, Angular `HTTP_API_CALL` unchanged, every other slice byte-identical.**

**What W4e delivered:** the 11 arrow-function class properties have method facts (building 5, user 5, core 1); 73 call facts inside them and 173 in constructors now name an enclosing member (246 of the 404 with no `callerName`); the 17 calls into those properties carry `declarationMemberName`; all 5 write-wrapper calls resolve to an enclosing member (door-device `set`/`update`, token `save`/`delete`/`deleteAll`), ready for Lane A's `coalesce(callerName, enclosingMemberName)`; existing fact IDs identical (15,442); no existing value changed; 0 description changes.

**State left behind:** live DB = post-W4e (69,643 facts, 17,810 edges, 0 without an embedding, firebase current run `20260926_132249-00e1d9fd`). Restore point `facts_index-2026-09-26-before-W4e.dump`. Scratch files deleted. Nothing running. Next: W2 waits for Lane C's investigation and the user's approval.

- 2026-09-26 (Lane B): write turn released. Requesting `WRITE TURN RELEASED: Lane B W4e` from the coordinator.

### Coordinator note 2026-09-26 (about 15:25 UTC): Lane B's W4e validated and released

- **W4e independently validated (coordinator, read-only):** compared every edge column except `edge_id`/`synthesis_id`/`generated_at` per slice between `facts_index-2026-09-26-before-W4e.dump` and the live table: **16 of 17 slices byte-identical; the only difference is Firebase `INTRA_REPO_CALL`, 2,372 -> 2,382, with 0 old rows missing and exactly 10 added `confirmed` edges, every one targeting one of the new arrow-function member facts** (9 into the `OSKBuildingDoorAccessControlDeviceController` methods, 1 into the `OSKUserDeviceAccessControlDeviceTokenController` methods, from services in admin, core, organization and user). Lane B's "byte-identical" prediction was wrong for this one slice for a good reason: the intra builder now finds method-fact targets that did not exist before; the joins do not read the new keys yet. Live: 69,643 facts (+11), 17,810 edges (+10), 0 missing embeddings, 0 dangling, 0 duplicate pairs, `edge_sync_state` 17 slices with 0 dangling; firebase current run `20260926_132249-00e1d9fd`. Embedding: 3 calls, 11 facts, 635 tokens, none truncated (approved up to about 1k).
- **WRITE TURN RELEASED: Lane B W4e.** No write turn is open. Lane A's W4d dry-run can now be re-run so the `accessControlDeviceTokens` client calls attach to the new token-controller methods.
- **Done and validated so far:** W5a/W5b, W1, W4a (facts and join), W4c, W3, W4b, W4e. **Waiting on the user's decisions:** Lane A's W4d and W6 designs (eight questions), Lane C's W2 proposals (not yet posted). **Not started:** W2 implementation, W4d/W6 live runs, classification of Angular's 5 unresolved callables.

### 2026-09-26: [Lane A] Read-only follow-ups to W4d and W6 (Angular in W4d; W4d after Lane B's W4e sync; W6 for Angular and node-iot). Nothing written, nothing in the shared tree, no `git add`/`git commit`

Session `-29`. All numbers from read-only queries against live `facts_index` through throwaway scripts (kept only in my session scratchpad, outside the repo, until the post-release re-run; not committed anywhere). **The live database moved while I ran:** 69,626 → **69,643 facts** and 17,800 → **17,810 edges** (Lane B's W4b/W4e turns). Firebase figures below are as of 69,643 facts (W4e's 17 new method facts are in), so the Firebase W6 figure differs slightly from my earlier entry (2,027 → 2,044 edges); the numbers will be re-run once Lane B's W4e turn is released and posted again.

**1. W4d with Angular (per platform).** The 6 live Angular `firestore_client_call` facts: `firebase-auth.service.ts:123` (setDoc wrapper, **unresolved**: `parameter_passthrough: path, pathSegments`; the caller is `auth.service.ts:261`, resolved via the wrapper caller), `:136` (`/users/{uid}` listen), `:142` (`/organizations`, **operation null**, "reference only: the reference is built but no read, write or listener consumes it here"), `current-user.token.ts:142` (`/users/{uid}` listen), `:154` (`/users/{uid}/organizations` listen), `auth.service.ts:261` (`/users/{userId}` set).
| platform | client facts | matched to writers (`FIRESTORE_CLIENT_ACCESS`) | trigger edges (`FIRESTORE_CLIENT_TRIGGER`) | unresolved | no operation | no Firebase match |
|---|---|---|---|---|---|---|
| angular | 6 | 4 facts → **27 edges** (`/users/{uid}` ×2 → 8 writer methods each; `/users/{userId}` set → 8; `/users/{uid}/organizations` → 3) | 1 fact → **2 edges** (`auth.service.ts:261` set on `/users/{userId}` → `OSKUserService.onDocumentCreated` and `onDocumentUpdated`) | 1 (the wrapper) | 1 (reference only) | 0 (besides those two) |
| swift | 65 | 39 facts → **203 edges** | 9 facts → **17 edges** | 1 | 0 | 26 including the 1 unresolved (15 friends-related, 6 `accesses/{}/invitations`, 4 `accessControlDeviceTokens`) |
| **both** | 71 | **230 edges** | **19 edges** | 2 | 1 | |
Rules applied on Angular: a fact with `pathResolutionMethod = unresolved` (its `value` is the literal text `unresolved`, on both platforms) is an unresolved record, never matched; a fact with `operation = null` has no access to link and is listed in the report only (no edge). Placeholder names differ across platforms (`{uid}` vs `{userId}`); matching is by segment position, so this is fine, and the `placeholderMismatch` check stays a within-fact comparison of `rawTemplate` against `value`.

**2. W4d after Lane B's W4e sync: the 4 `accessControlDeviceTokens` client calls are STILL unattributed.** W4e's new facts are in the DB (the token controller now has `controller_method` facts `save` :27, `delete` :37, `deleteAll` :42, `deleteAllByTokenId`; `memberKind = arrow_function_property`), but **the call facts at `user_device_access_control_device_token.controller.ts:34, 39, 44` still have `callerName` and `callerStartLine` null** (run `20260926_132249-00e1d9fd`), and the join finds a writer's enclosing method by exactly those two fields. So the join still cannot attach these writers, and the 4 Swift facts stay "no match". Measured: **404 of 6,741 Firebase call facts have no `callerName`; 225 of those are resolved calls; 5 of the 225 are write-wrapper calls with a resolved path** (`building_door_access_control_device.controller.ts:57, 67`, `user_device_access_control_device_token.controller.ts:34, 39, 44`). Two ways to close it (for the coordinator/user): **(A) Lane B populates `callerName`/`callerStartLine`/`callerClass` for calls inside arrow-function properties** (the source fix, an extraction + sync); **(B) a join-side fallback: when a writer call has no `callerName`, attach it to the nearest preceding method fact in the same file whose class equals the call's `callerClass`**. I tested (B) read-only: **5 of 5 attributable, class matches 5 of 5** (e.g. `:39 _delete` → `OSKUserDeviceAccessControlDeviceTokenController.delete:37`, `:57 _set` → `OSKBuildingDoorAccessControlDeviceController.set:50`, `:67 _update` → `.update:60`). Method facts carry a start line but no end line, so (B) is an approximation (correct for sequential class members, wrong if a method were nested or if a non-method member sat between); across all 225 nameless resolved calls only 63 attribute by that rule, so I would NOT use it beyond write wrappers. If (B): the 3 token writers would give the 4 client facts 1 writer method (`_set`, `_delete`, `_deleteAll` → `save`, `delete`, `deleteAll`: 3 methods) and the door-device `_set`/`_update` would also reach the previously unattributable `create /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` trigger (16 → 17 of 26). I recommend (A). I will re-run this dry-run when the coordinator tells me W4e is released.

**3. W6 (`INTRA_REPO_CALL_DECLARED`) dry-run for all three repos with call facts** (repo-agnostic: a callee is "in repo" when its declaration file is a file the repo has facts for; declaration facts = kinds ending `_method` or `function_declaration`; existing followed `INTRA_REPO_CALL` sources are skipped):
| repo | resolved calls | in-repo declaration | already edged | candidates | **edges** | no method name | same/cross-module | callees | fan-in p50/p75/p90/p95/p99/max | inner / outer fence (log-Tukey) | outer fence skips | kept |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| firebase-oskey-dev | 5,907 | 4,546 | 2,350 | 2,196 | **2,044** | 152 | 1,638 / 406 | 765 | 1 / 2 / 4 / 6 / 21 / 150 | 5.7 / 16.0 | 13 callees, 614 edges | 1,430 |
| angular-app-oskey-io | 2,363 | 1,555 | 284 | 1,271 | **303** | 962 (+6 no fact) | 303 / 0 | 201 | 1 / 2 / 3 / 3 / 5 / 7 | 5.7 / 16.0 | 0 (inner fence would skip 1 callee, 7 edges) | 303 |
| node-iot-api-oskey-io | 277 | 116 | 0 (no intra edges at all) | 116 | **74** | 42 | 74 / 0 | 45 | 1 / 2 / 4 / 5 / 6 / 6 | 5.7 / 16.0 | 0 (inner fence: 2 callees, 12 edges) | 74 |
- **Firebase:** as in the earlier entry (hubs: checkParameters 150, OSKUserSecurityChecks 138, logInfo 62, logError 52, createField 38, user_security_checks 29, user::get 28, isOskeyAdmin 21, getAdminOrganizationUser 20, logDebug 20, building::get 19, ensureInitialized 19, getUserById 18); 235 edges alias-dependent. At the outer fence: 1,430 kept of 2,044.
- **Angular:** 303 edges, all same-module, **no hub at all** (max fan-in 7: `convertToDate` 7, `core::instant` 5, `isTimestamp` 5, `createUser` 4, `signUpWithEmailLink` 4, `loadEntities` 4, `loadBuildings` 4, `loadCommunications` 4), so a fence changes nothing (outer skips 0; the data-derived fence is above every fan-in). **The large "no method name" bucket (962) is not missing edges but import-alias artefacts:** these calls' `declarationFile` is the calling file itself and `declarationMethod` is empty because the callee is a framework function imported from `@angular/core` (`inject` 281, `signal` 99, `Component` 61, `Input` 57, `Injectable` 35, `map` 22, `from` 19, `ViewChild` 19, `computed` 17, `of` 12, …): the same self-pointing defect Lane B fixed for Firebase with `aliasedDeclaration*`, which Angular's extractor does not have. They point outside the repo anyway, so no edge is lost; the truthful in-repo population for Angular is about 609 (284 already edged + 303 matched + 6 with a name but no declaration fact + ~16 other), and the join matches 303 of the 309 not yet edged (98%). The 6 with a name but no declaration fact are in the report.
- **node-iot:** 74 edges, all same-module (one business module), max fan-in 6 (`logMessage` 6, `_getDateTime` 6, `convertDateStringToDateObject` 5, `logInfo` 4, `get` 4 / 3, …), no hubs. Its "no method name" 42 are `next(...)` calls: an Express callback parameter of the route handler, not a declared method; not real callees. node-iot's `INTRA_REPO_CALL` is switched off in `config/repos.json` (its resolved graph had 0 confirmed edges); the W6 join does not use the graph, only the call facts' own declaration fields, so it would give node-iot its first same-repo call edges (74) without reversing that decision, but it is the user's call whether node-iot is in scope.
- **Totals if all three repos are in scope, no hub handling:** 2,044 + 303 + 74 = **2,421 new edges** (17,810 → 20,231); at the derived outer fence: 1,430 + 303 + 74 = **1,807** (17,810 → 19,617), i.e. the fence only ever bites in Firebase.
- **Scope note for the user:** the derived fence is computed per repo from its own fan-in distribution, so it needs no repo-specific setting; for Angular and node-iot it comes out above every fan-in (nothing skipped), for Firebase it skips the 13 infrastructure/business hubs.

- 2026-09-26 (Lane B, correction to the W4e DONE entry, appended because the log is append-only): the 10 new firebase `INTRA_REPO_CALL` edges target **9 door-device controller members** (`getAll` 5, `getByDoor` 2, `get` 1, `update` 1) **and 1 token controller member** (`deleteAllByTokenId`), not "building 8, user 1" as I wrote (a miscount on my side; the coordinator's independent count of 9 + 1 is right). The rest of the entry (10 edges, 0 old rows missing, cause, all other slices byte-identical) stands.

### Coordinator note 2026-09-26 (about 15:40 UTC): the user's decisions on Lane A's W4d and W6 designs

- **APPROVED by the user (all eight recommendations):** **W4d:** (1) both new connection types `FIRESTORE_CLIENT_TRIGGER` and `FIRESTORE_CLIENT_ACCESS` (`resolved`, `ast_derived`); (2) an additive, nullable `attributes jsonb` column on `cross_repo_edges` (the first change to an existing table; only adds a column, existing rows stay NULL) to hold the structured operation and flags; (3) client calls that match nothing are recorded as `unresolved` edges with the reason; (4) writers only (Firebase readers, 207 read-wrapper facts, are a later option). **W6:** (1) hub option: skip edges into hubs above the run-time-derived fence and print them on every run; (2) type name `INTRA_REPO_CALL_DECLARED`; (3) the 169 no-callee calls are reported only; (4) Angular and node-iot are dry-run first and the user decides their scope from the numbers (Firebase first).
- **Correction to how the `userInvitations` finding is worded (the user's point):** it is unrelated to the compound-index query. The flagged call, `OSKCKUserInvitationService.swift:157` `documentSnapshot(...)`, is a document listener built on `Document.userInvitations` (`/users/{userId}/invitations`, 3 segments, collection-shaped); nothing in iOS or the Swift kits calls it, so it is a latent wrong-shaped path in an unused method, not a runtime failure. The paginated query at lines 103-118 (`orderBy`/`startAfter`, where a composite index would matter) uses the collection enum and is unaffected. The join keeps the flag (`attributes.pathShapeMismatch`) but describes it as latent.

### 2026-09-26: [Lane A] Deltas after Lane B's W4e release (W4d, the trigger join, W6). Read-only; nothing written, nothing in the shared tree, no `git add`/`git commit`

Session `-29`. Live at the time: 69,643 facts, 17,810 edges (Firebase `INTRA_REPO_CALL` 2,382 rows, 2,360 confirmed; `FIRESTORE_EVENT_TRIGGER` still 31). What W4e changed for the joins: every write-wrapper call now has an enclosing member (`evidence.enclosingMemberName` / `enclosingMemberStartLine` / `enclosingMemberEndLine` / `enclosingMemberKind`, used as a fallback when `callerName` is null); callee-side calls carry `declarationMemberName` / `declarationMemberKind`. **Both joins need a one-line change to read these** (the trigger join's writer query must use `coalesce(callerName, enclosingMemberName)` and `coalesce(callerStartLine, enclosingMemberStartLine)`; the W6 join uses `coalesce(declarationMethod, declarationMemberName)`); the shipped `firestore-trigger` join does not read them yet, so **today's live `FIRESTORE_EVENT_TRIGGER` slice is still 31 edges**. The numbers below apply those coalesces in a read-only simulation (the same rules as the join), not a change to the shared file.

**1. W4d (Swift): the 4 `accessControlDeviceTokens` client calls now attach.** `FIRESTORE_CLIENT_ACCESS`: Swift 39 → **43 client facts matched, 203 → 215 edges** (+12: each of the 4 facts reaches 3 writer methods, the token controller's `save`, `delete`, `deleteAll`); Angular unchanged (4 facts, 27 edges); **both platforms 230 → 242 edges**. `FIRESTORE_CLIENT_TRIGGER` unchanged (Swift 17, Angular 2 = 19; no trigger exists on that collection). Unmatched Swift facts **26 → 22**: the 15 friends-related, the 6 `accesses/{}/invitations`, and the 1 unresolved path (`OSKCKUserBuildingSettingsService.swift:42`); the reason text "Firebase writes it but no enclosing method fact" is gone. The two probable client bugs (`userBuildingAccesses` placeholder, `userInvitations` shape) are unchanged.

**2. Trigger join (`firestore-trigger`, existing rules) with the new attribution: 31 → 32 writer-method/handler edges, 16 → 17 of 26 triggers reached, 0 unattributed writer sites (was 1).** The previously unattributable trigger `create /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` **now gets an edge** (from `OSKBuildingDoorAccessControlDeviceController.set`, the arrow-function property at `building_door_access_control_device.controller.ts:57`; the `_update` writer at `:67` fires only update and has no update trigger, so it makes no edge). The 9 still-unreached triggers are exactly the source-verified ones: 7 path mismatches (`create /setting/roles/roles/{roleId}`; `create|update|delete /setting/workflows/organizationRequest/{workflowId}`; `create|update|delete /settings/workflows/buildingRequests/{workflowId}`) and 2 `onDelete` triggers with no wrapper writer (`delete /accessControlDevices/{deviceId}`, `delete /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`). This matches Lane B's offline replication (32 pairs, 17 of 26). To make it live, the writer query in the join needs the two coalesces above (a small change to the shared file, in a Lane A write turn with the diff posted, after the user decides).

**3. W6 Firebase refresh.** The 17 call facts with `declarationMemberName` (callee is an arrow-function member): **10 already have a followed `INTRA_REPO_CALL` edge** (Lane B's `pipeline:edges` after W4e rebuilt the intra slice: 2,350 → 2,360 confirmed) and **7 have none**, which the W6 join picks up through `coalesce(declarationMethod, declarationMemberName)`. Numbers now: in-repo declarations 4,546 (unchanged); already edged **2,360** (was 2,350); candidates **2,186** (was 2,196); **edges 2,034** (was 2,027 in my first entry and 2,044 in my second, which had counted the 10 calls that the graph has since edged); no method name 152; ambiguous 0; same-module 1,638, cross-module 396; alias-dependent 235; callees 761; fan-in p50/p75/p90/p95/p99/max 1/2/4/6/21/150; fences 5.7 (inner) / 16.0 (outer); at the outer fence **13 callees / 614 edges skipped, 1,420 kept** (inner fence: 54 / 935, 1,099 kept); the 13 hubs are unchanged (checkParameters 150, OSKUserSecurityChecks 138, logInfo 62, logError 52, createField 38, user_security_checks 29, user::get 28, isOskeyAdmin 21, getAdminOrganizationUser 20, logDebug 20, building::get 19, ensureInitialized 19, getUserById 18). Angular (303 edges, no hub) and node-iot (74 edges, no hub) are unchanged. **Totals across the three repos: 2,034 + 303 + 74 = 2,411 new edges (17,810 → 20,221); with the outer fence 1,420 + 303 + 74 = 1,797 (→ 19,607).**

The earlier suggestion of a line-proximity fallback ("nearest preceding method fact", option B) is now unnecessary: the extractor supplies the enclosing member directly. Scratch scripts deleted.

### 2026-09-26: [Lane A] W4d implementation in a COPY: exact SQL for the schema change, pasted BEFORE any use (scratch first; nothing applied to `facts_index`)

The user-approved schema change is exactly this one statement (no default, no index, no drop, nothing on any other object):
```sql
ALTER TABLE cross_repo_edges ADD COLUMN IF NOT EXISTS attributes jsonb;
```
It will be added to `schema-proposal.sql` and to a one-statement file `pipeline/facts-postgres-index/edge-attributes.sql` at apply time (in the write turn). It is being tried first on scratch databases only (`facts_index_w4d_scratch`, `facts_index_w4d_scratch2`, dropped afterwards; `facts_index_prebuild` untouched; `PG_DATABASE` explicit and `current_database()` checked on every command).

### Coordinator note 2026-09-26 (about 16:00 UTC): W2 approved by the user; env-variable question answered

- **Verified in the pinned Firebase source (coordinator, read-only):** the extractor bug is Lane C's diagnosis, not the wiki's: `publishMessage` has three signatures: `document_and_message.controller.ts:74` `(topic, orderingKey, body)`, and the two-argument wrappers `access.controller.ts:69` `(accessControlDeviceId, payload)` and `building_intercom.controller.ts:60` `(acdId, payload)`, which compute the topic inside from `process.env.OSK_PUBSUB_TOPIC_ACD_ACCESSES` and `..._INTERCOM_ENTRIES` and then call `_publishMessage(topicName, deviceId, payload)`. The extractor matches by name and reads the first argument, so callers of the two wrappers were recorded with the device id as their "topic". (The wiki's "second argument" description was a misreading of this; our own earlier notes repeated it.)
- **The user asked whether the `.env` topic variables are live or dead because the dev team promoted Secret Manager. Answer:** Secret Manager is used, but for **credentials** (Twilio, Auth0, Mailtrap, APNs, the Pub/Sub service-account key and email) through `OSKSecretService.getSecret(OSKApiName.X)`; `defineSecret` is commented out in `index.ts`. **No Pub/Sub topic name is ever fetched as a secret**: topic names are plain config, read as `process.env.*`. Of the 7 topic variables in the tracked `functions/.env`, **3 are read in source (`ACCESSES`, `CONFIGURATIONS`, `INTERCOM_ENTRIES`) and are live; 4 are dead** (`ACCESS_LOGS`, `ACCESS_COMMANDS`, `STATES`, `SYSTEM_LOGS`: added with the 2024-05-13 topic-removal commit, never read; consistent with the removed node-iot routes). `.env.staging`/`.env.prod`/`.env.dev` carry no Pub/Sub keys, so nothing overrides the base file; the file is actively maintained (edited through June 2026). The three live values equal the deployed staging topic names in `pubsub.bindings.staging.json`. **Caveat:** the deployed runtime environment itself is not visible to us (no `gcloud` in this build), so the resolution is "from the repository's own `.env`", not a proof of what is deployed; the facts will say so (`topicResolvedVia`), staging only.
- **APPROVED by the user (all four decisions, with the coordinator's modification of decision 1):** (1) correct `value` to the resolved topic on the affected publish facts **and keep every fact ID unchanged** (legacy key, as done for the triggers in W4a), plus Lane C's additive fields (`topicName`, `topicNameStatus`, `publishRole`, `orderingKeyExpression`, `topicResolvedVia`); (2) accept the expected shrink on the `PUBSUB_TOPIC_BINDING` slice (unknown-source rows 9 -> 6, resolved edges 1 -> 11, slice total 25 -> 22; no resolved edge lost), with `--accept-shrink` for that join only; (3) extend `descriptionFor` and embed the 14 facts (about 1.5k to 2k tokens, pre-approved); (4) Lane B implements the extractor in its own held run, gate and write turn; the existing join needs no change.

### 2026-09-26: [Lane A] W4d BUILT in a copy and proven on scratch databases: diff + dry-run numbers for the coordinator's approval. NOT in the shared tree, nothing applied to `facts_index`, no `git add`/`git commit`

Session `-29`. The approved design (two types, `attributes jsonb`, unresolved rows for unmatched client calls, writers only) is implemented in the untracked copy `pipeline/facts-postgres-index/_dev-w4d-build-cross-repo-edges.ts` (v1.11.0 = the shared v1.10.0 plus the W4d hunks below; type-checks clean; the copy has the `require.main` guard, so nothing runs on import). The shared builders are untouched. Scratch databases used (all dropped at the end): `facts_index_w4d_scratch` and `facts_index_w4d_scratch2`, restored from a fresh read-only dump of live taken now (`output/backups/facts_index-2026-09-26-after-W4e.dump`, 69,643 facts / 17,810 edges); `PG_DATABASE` explicit and `current_database()` checked on every command.

**What the code does (all in the copy).**
- `EdgeRow.attributes` (optional); `replaceSlices` inserts the `attributes` column **only for an edge that has attributes**, so every older join's INSERT is byte-for-byte the old statement. A module-level `DRY_RUN` lets the new joins' preflight report "the column does not exist yet" as a problem in a real run but stay silent in `--dry-run` (so the dry-run against today's live DB works before the ALTER).
- Two joins, `firestore-client-trigger` (`FIRESTORE_CLIENT_TRIGGER`) and `firestore-client-access` (`FIRESTORE_CLIENT_ACCESS`), both `ast_derived`, source repos = repos with `firestore_client_call` facts (discovered), Firebase side discovered from the data. Writer attribution uses `coalesce(callerName, enclosingMemberName)` and `coalesce(callerStartLine, enclosingMemberStartLine)` (W4e); this is inside the new joins only, **the existing `firestore-trigger` join is deliberately unchanged** so its slice stays byte-identical (its 31 → 32 change is a separate decision).
- Path rules: trigger wildcard matches any client segment; any other wildcard only a wildcard; collection vs document from the segment count, cross-checked with `pathKind`. `set` on a document → create and update (existing wording "fires as create if the document is new, as update if it exists"); `set` adding to a collection → create; `update` → update; `delete` → delete. A write with no trigger on its path gets no row.
- **Misses recorded as `unresolved` `FIRESTORE_CLIENT_ACCESS` edges with a reason computed from the data**: unresolved client path (the extractor's reason), no operation (Angular `doc(collectionRef)` reference only), no Firebase fact at all names the collection, Firebase code touches it but no write-wrapper writes it, or Firebase writes it but no writer has an enclosing method fact.
- **Structured `attributes`** on every new edge: `platform`, `clientOperation`, `clientSdkCall`, `pathKind` (as declared), `pathShape` (from the segment count), `pathTemplate`, plus `serverEvents` + `triggerPath` (trigger edges) or `serverCollection` + `serverWrappers` (access edges), plus the two flags below. Unresolved rows carry `reason` (`path_unresolved`, `no_operation`, `no_firebase_writer`).
- **The two flags (both kept, neither hides the matching):** `pathShapeMismatch` = `{declared, segments, shape}` (only `OSKCKUserInvitationService.swift:157`; the details text says "declared document but the template has 3 segment(s), the shape of a collection"); `placeholderMismatch` = `[{template, source}]` (only `OSKCKUserBuildingAccessService.swift:64`: template `buildingId`, source `accessId`). Wording per the coordinator: the `userInvitations` case is **latent** (an unused document-listener method), unrelated to the paginated query at lines 103-118 (that uses the collection enum and is the separate compound-index concern); the join states the shape fact only.

**Live dry-run of the copy (`--dry-run`, read-only, `PG_DATABASE=facts_index`, 69,643 facts):**
| slice | existing → new |
|---|---|
| `FIRESTORE_CLIENT_TRIGGER / angular-app-oskey-io` | 0 → **2** resolved |
| `FIRESTORE_CLIENT_TRIGGER / swift-cloud-kit-oskey-dev` | 0 → **17** resolved (9 of 14 client writes match a trigger; 5 have no trigger and get no row) |
| `FIRESTORE_CLIENT_ACCESS / angular-app-oskey-io` | 0 → **29** = 27 resolved + 2 unresolved (the setDoc wrapper: `parameter_passthrough: path, pathSegments`; the reference-only `doc(collectionRef)`) |
| `FIRESTORE_CLIENT_ACCESS / swift-cloud-kit-oskey-dev` | 0 → **237** = 215 resolved + 22 unresolved (15 friends-related and 6 `accesses/{}/invitations`: "No Firebase fact names collection ...", and 1 unresolved path at `OSKCKUserBuildingSettingsService.swift:42`) |
So **19 trigger edges + 242 resolved access edges (43 of 65 Swift facts, 4 of 6 Angular facts) + 24 unresolved = 285 new rows**; identical to the read-only simulation posted earlier. The 4 `accessControlDeviceTokens` client calls are matched (each to the token controller's `save`, `delete`, `deleteAll`).

**Scratch proofs (on `facts_index_w4d_scratch`, a restore of live):**
1. **ALTER** (`ALTER TABLE cross_repo_edges ADD COLUMN IF NOT EXISTS attributes jsonb;`): column added as `jsonb`, nullable, no default; 17,810 rows, 0 with attributes; **all 17 existing slice fingerprints identical before and after**; **`edge_sync_state` identical** (md5 of all 17 rows equal); the shared builder's coverage summary still works (17,810 edges, 0 dangling, 17 ok).
2. **The real orchestrator with the replacement file** (a throwaway tree in my scratchpad with symlinks to `node_modules`, `output`, `config`, `governance`, pointed at the scratch DB; exactly what the write turn will run): `pipeline:edges` exit 0 → **21 `edge_sync_state` slices recorded, all 21 ok** (17 + the 4 new); total edges **18,095 = 17,810 + 285**; FIELD_BINDING 13; dangling 0; **the 17 existing slices byte-identical to before** (per-slice md5 diff shows only the 4 new slices); a second and third run left all 21 slices identical (idempotent). One wording fix found on the way (trigger `details` for a `set` now uses the existing "create if new / update if exists" text on each edge); after it, run 3 = run 2.
3. **`findGraphNeighbors`** (the real `mcp-server/db/graph-traversal.ts`, on the scratch DB): for a `FIRESTORE_CLIENT_ACCESS` edge the source has it outgoing and the target has it incoming (source 8 neighbours, target 15); same for `FIRESTORE_CLIENT_TRIGGER` (10 / 9). **`walkBoundedCluster`** from the biggest hubs (a client fact with 8 writer methods; the Firebase method with 14 client edges) returns bounded, truncated clusters (26 members / 130 edges and 24 / 154) without error.
4. **`pg_dump`/`pg_restore` round trip** of the scratch DB with the new column into a second scratch DB: 18,095 edges, 285 with attributes, md5 of all attributes equal, 21 state rows, per-slice fingerprints equal, the column comes back `jsonb`; running the ALTER again is a no-op (`IF NOT EXISTS`).
5. **Structured flags verified in the stored jsonb:** `pathShapeMismatch` on the `userInvitations` edges (5 edges, one per invitations writer method), `placeholderMismatch` on the `userBuildingAccesses` edges (5 edges); nothing else carries a flag. A trigger edge's attributes, for example: `{"pathKind":"document","platform":"swift","pathShape":"document","triggerPath":"/users/{userId}/devices/{deviceId}","pathTemplate":"...","serverEvents":["create"],"clientSdkCall":"addDocument|setData","clientOperation":"set"}`.

**Sequence for the write turn (unchanged, after your approval of this diff):** table-only dump (`cross_repo_edges` + `edge_sync_state`); the ALTER above (also added to `schema-proposal.sql` and `edge-attributes.sql`); replace `build-cross-repo-edges.ts` with the copy; plain `pipeline:edges`; per-slice before/after md5 (all 17 existing slices byte-identical, only the 4 new slices appear; expect 18,095 edges, 21 slices ok, FIELD_BINDING 13, 0 dangling). Rollback: the table-only dump (it lacks the column: restoring it and re-running is clean) or revert the code and `ALTER TABLE ... DROP COLUMN attributes` (only with your approval, since that drops a column).

**The diff (shared `build-cross-repo-edges.ts` v1.10.0 → the copy v1.11.0):**
```diff
@@ -1,4 +1,4 @@
-// **version:** 1.10.0
+// **version:** 1.11.0
 // **location:** level-5 P2 facts index
 // © Oskey SAS. All rights reserved.
 //
@@ -188,6 +188,28 @@
   // string; absent/null otherwise. Facts extracted before W4a have none: the writer path is then read
   // from the literal in `arguments[0]` as before.
   CALL_RESOLVED_PATH: "resolvedPath", // under payload.evidence
+  // W4e: a call inside an arrow-function class property has no `callerName`; the extractor supplies the enclosing
+  // member instead (`enclosingMemberName`, `enclosingMemberStartLine`). Used only by the W4d joins below.
+  CALL_ENCLOSING_MEMBER_NAME: "enclosingMemberName", // under payload.evidence
+  CALL_ENCLOSING_MEMBER_START_LINE: "enclosingMemberStartLine", // under payload.evidence
+  // firestore_client_call (W4b Angular, W4c Swift; one shared shape): a client call that touches a Firestore path.
+  // `evidence.value` is the path template ("/users/{userId}/devices"), or the literal text "unresolved" when
+  // `pathResolutionMethod = "unresolved"`; `operation` is get | set | update | delete | listen, or null when the
+  // reference is built but nothing consumes it (`operationReason` says why); `pathKind` is collection | document.
+  CLIENT_CALL_KIND: "firestore_client_call",
+  CLIENT_VALUE: "value", // under payload.evidence
+  CLIENT_OPERATION: "operation", // under payload.evidence
+  CLIENT_OPERATION_REASON: "operationReason", // under payload.evidence
+  CLIENT_PATH_KIND: "pathKind", // under payload.evidence
+  CLIENT_PATH_RESOLUTION: "pathResolutionMethod", // under payload.evidence
+  CLIENT_PATH_UNRESOLVED: "unresolved",
+  CLIENT_UNRESOLVED_REASON: "unresolvedReason", // under payload.evidence
+  CLIENT_SDK_CALL: "sdkCall", // under payload.evidence
+  CLIENT_PLATFORM: "platform", // under payload.evidence
+  CLIENT_RAW_TEMPLATE: "rawTemplate", // under payload.evidence
+  CLIENT_CALLER_CLASS: "callerClass", // under payload.evidence
+  CLIENT_CALLER_FUNCTION: "callerFunction", // under payload.evidence (Swift); Angular uses callerMethod
+  CLIENT_CALLER_METHOD: "callerMethod", // under payload.evidence
 } as const;
 
 // Stage E (Firestore triggers). The Firebase repo's base controllers (core/controllers/
@@ -327,6 +349,17 @@
   resolutionStatus: "resolved" | "unresolved";
   confirmedVia: string | null;
   details: string;
+  // Structured, machine-readable facts about the edge (W4d): stored in cross_repo_edges.attributes (jsonb, nullable,
+  // NULL for every edge the older joins write). Only joins that set it need the column.
+  attributes?: Record<string, unknown> | null;
+}
+
+// Set from --dry-run in main(); lets a preflight skip the "column exists" check for a read-only dry run.
+let DRY_RUN = false;
+async function attributesColumnProblems(db: Pool): Promise<string[]> {
+  const r = await db.query<{ n: string }>(`SELECT count(*)::text AS n FROM information_schema.columns WHERE table_name = 'cross_repo_edges' AND column_name = 'attributes'`);
+  if (Number(r.rows[0].n) > 0) return [];
+  return DRY_RUN ? [] : [`cross_repo_edges has no 'attributes' column yet (apply: ALTER TABLE cross_repo_edges ADD COLUMN IF NOT EXISTS attributes jsonb; a schema change, only in a granted write turn)`];
 }
 
 // One join = one way of deriving edges of one connection_type. `sourceRepos`
@@ -1273,8 +1306,269 @@
   },
 };
 
-const JOINS: Join[] = [firebaseCallableJoin, pubsubBindingJoin, packageSymbolUseJoin, restRouteJoin, firestoreTriggerJoin];
+// ---------------------------------------------------------------------------
+// W4d: client Firestore calls (Swift W4c, Angular W4b) <-> the Firebase side. A client call is not a call into
+// Firebase code: it touches a Firestore path that Firebase code also touches. Two relations, two connection types
+// (both resolved, ast_derived), each edge carrying its structured facts in `attributes` (jsonb):
+//   FIRESTORE_CLIENT_TRIGGER  a client WRITE (set / update / delete) -> the Firebase trigger handler that fires on it.
+//   FIRESTORE_CLIENT_ACCESS   any client call -> each Firebase writer METHOD that writes the same collection.
+// Path matching reuses the existing wildcard rules: a trigger wildcard matches any client segment; any other
+// wildcard (client or writer) matches only a wildcard, never a literal. Whether a client path is a collection or a
+// document is taken from its segment count (odd = collection), and checked against the extractor's `pathKind`.
+// A client call that links to nothing is recorded as an `unresolved` FIRESTORE_CLIENT_ACCESS edge with the reason
+// (a client write that simply has no trigger is not a gap and gets no row). Nothing here names a repo, a
+// collection, an operation table other than the wrapper table above, or a platform: source repos are the repos
+// that have `firestore_client_call` facts, the Firebase side is whatever repo has the writer/trigger facts.
+// ---------------------------------------------------------------------------
+interface ClientCall { fact_id: string; repo: string; file: string; line: number; ev: any }
+
+const lastIdentifier = (expr: string): string => (/([A-Za-z_]\w*)\s*\)?\s*$/.exec(expr.replace(/\.\.\./g, ""))?.[1] ?? expr.trim());
+// Interpolated names in a raw client path template: Swift "\(name)", Angular "${expr}" (its last identifier).
+function rawPlaceholderNames(raw: string | null | undefined): string[] {
+  if (!raw) return [];
+  const out: string[] = [];
+  for (const m of raw.matchAll(/\\\(([^)]*)\)|\$\{([^}]*)\}/g)) out.push(lastIdentifier(m[1] ?? m[2] ?? ""));
+  return out;
+}
+const templatePlaceholderNames = (t: string): string[] => [...t.matchAll(/\{([^}]*)\}/g)].map(m => m[1]);
+// Wildcard on both sides only matches a wildcard; a literal only matches the same literal.
+const bothMatch = (a: Seg[], b: Seg[]): boolean => a.length === b.length && a.every((x, i) => (x === null && b[i] === null) || (x !== null && b[i] !== null && x === b[i]));
+const collectionText = (segs: Seg[]): string => "/" + segs.map(s => s ?? "{}").join("/");
+
+type ClientInfo =
+  | { ok: false; why: "path_unresolved" | "no_operation"; reason: string; op: string | null; sdk: string | null; platform: string }
+  | { ok: true; op: string; sdk: string | null; platform: string; template: string; full: Seg[]; collectionShape: boolean; collection: Seg[]; declaredKind: string | null; flags: Record<string, unknown> };
+
+function analyseClient(c: ClientCall): ClientInfo {
+  const ev = c.ev;
+  const op: string | null = ev[CONTRACT.CLIENT_OPERATION] ?? null;
+  const sdk: string | null = ev[CONTRACT.CLIENT_SDK_CALL] ?? null;
+  const platform: string = ev[CONTRACT.CLIENT_PLATFORM] ?? c.repo;
+  const value: string | undefined = ev[CONTRACT.CLIENT_VALUE];
+  const full = ev[CONTRACT.CLIENT_PATH_RESOLUTION] === CONTRACT.CLIENT_PATH_UNRESOLVED || !value ? null : templatePathSegments(value);
+  if (!full || !value) return { ok: false, why: "path_unresolved", reason: `the client path is not resolved${ev[CONTRACT.CLIENT_UNRESOLVED_REASON] ? `: ${ev[CONTRACT.CLIENT_UNRESOLVED_REASON]}` : ""}`, op, sdk, platform };
+  if (!op) return { ok: false, why: "no_operation", reason: `the client call has no operation${ev[CONTRACT.CLIENT_OPERATION_REASON] ? `: ${ev[CONTRACT.CLIENT_OPERATION_REASON]}` : ""}`, op, sdk, platform };
+  const collectionShape = full.length % 2 === 1; // Firestore: an odd segment count is a collection, an even one a document
+  const declaredKind: string | null = ev[CONTRACT.CLIENT_PATH_KIND] ?? null;
+  const flags: Record<string, unknown> = {};
+  // Not hidden, only reported: a declared kind that contradicts the path's own shape, and a template whose placeholder
+  // names differ from the names the source interpolates (the matching itself is by segment position).
+  if (declaredKind && declaredKind !== (collectionShape ? "collection" : "document")) flags.pathShapeMismatch = { declared: declaredKind, segments: full.length, shape: collectionShape ? "collection" : "document" };
+  const rawNames = rawPlaceholderNames(ev[CONTRACT.CLIENT_RAW_TEMPLATE]);
+  const tplNames = templatePlaceholderNames(value);
+  if (rawNames.length > 0 && rawNames.length === tplNames.length && rawNames.some((n, i) => n !== tplNames[i])) {
+    flags.placeholderMismatch = rawNames.map((n, i) => (n !== tplNames[i] ? { template: tplNames[i], source: n } : null)).filter(Boolean);
+  }
+  return { ok: true, op, sdk, platform, template: value, full, collectionShape, collection: collectionShape ? full : full.slice(0, -1), declaredKind, flags };
+}
+
+async function loadClientCalls(db: Pool, sourceRepos: string[]): Promise<ClientCall[]> {
+  const r = await db.query<{ fact_id: string; repo: string; file: string; line: number; ev: any }>(
+    `SELECT fact_id, repo, file, line, payload->'evidence' AS ev FROM facts WHERE repo = ANY($1::text[]) AND kind = $2 ORDER BY repo, file, line`,
+    [sourceRepos, CONTRACT.CLIENT_CALL_KIND]
+  );
+  return r.rows;
+}
+
+interface FbWriter { fact_id: string; repo: string; file: string; line: number; wrapper: string; path: string; segs: Seg[]; callerName: string | null; callerClass: string | null; callerLine: number | null }
+interface FbTrigger { fact_id: string; repo: string; file: string; line: number; event: string; path: string; segs: Seg[]; handlerExpr: string | null; handlerName: string | null; handlerFile: string | null; handlerLine: number | null; handlerResolved: boolean }
+interface FbTouched { path: string; segs: Seg[]; via: string }
+
+// The Firebase side, discovered from the data: write-wrapper call sites with a resolved collection path (their
+// enclosing member is the method; W4e supplies it for arrow-function properties), Firestore triggers with their own
+// path, and every other Firebase fact that names a path (used only to word a miss).
+async function loadFirebaseFirestoreSide(db: Pool): Promise<{ writers: FbWriter[]; triggers: FbTrigger[]; touched: FbTouched[] }> {
+  const ev = (f: string) => `payload->'evidence'->>'${f}'`;
+  const w = await db.query<{ fact_id: string; repo: string; file: string; line: number; wrapper: string; path: string; caller_name: string | null; caller_class: string | null; caller_line: string | null }>(
+    `SELECT fact_id, repo, file, line, ${ev(CONTRACT.CALL_DECLARATION_METHOD)} AS wrapper, ${ev(CONTRACT.CALL_RESOLVED_PATH)} AS path,
+            coalesce(${ev(CONTRACT.CALL_CALLER_NAME)}, ${ev(CONTRACT.CALL_ENCLOSING_MEMBER_NAME)}) AS caller_name, ${ev(CONTRACT.CALL_CALLER_CLASS)} AS caller_class,
+            coalesce(${ev(CONTRACT.CALL_CALLER_START_LINE)}, ${ev(CONTRACT.CALL_ENCLOSING_MEMBER_START_LINE)}) AS caller_line
+     FROM facts WHERE kind = $1 AND ${ev(CONTRACT.CALL_RESOLUTION_STATUS)} = $2 AND ${ev(CONTRACT.CALL_DECLARATION_METHOD)} = ANY($3::text[]) AND ${ev(CONTRACT.CALL_RESOLVED_PATH)} IS NOT NULL
+     ORDER BY repo, file, line`,
+    [CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_RESOLUTION_OK, Object.keys(FIRESTORE_WRITE_WRAPPERS)]
+  );
+  const writers: FbWriter[] = w.rows.flatMap(r => { const segs = templatePathSegments(r.path); return segs ? [{ fact_id: r.fact_id, repo: r.repo, file: r.file, line: r.line, wrapper: r.wrapper, path: r.path, segs, callerName: r.caller_name, callerClass: r.caller_class, callerLine: r.caller_line !== null && Number.isFinite(Number(r.caller_line)) ? Number(r.caller_line) : null }] : []; });
+  const t = await db.query<{ fact_id: string; repo: string; file: string; line: number; path: string; callee: string | null; trig_event: string | null; handler_expr: string | null; handler_name: string | null; handler_file: string | null; handler_line: string | null; handler_res: string | null }>(
+    `SELECT fact_id, repo, file, line, ${ev(CONTRACT.TRIGGER_PATH)} AS path, ${ev(CONTRACT.TRIGGER_CALLEE)} AS callee, ${ev(CONTRACT.TRIGGER_EVENT)} AS trig_event,
+            ${ev(CONTRACT.TRIGGER_HANDLER_EXPRESSION)} AS handler_expr, ${ev(CONTRACT.TRIGGER_HANDLER_NAME)} AS handler_name, ${ev(CONTRACT.TRIGGER_HANDLER_FILE)} AS handler_file,
+            ${ev(CONTRACT.TRIGGER_HANDLER_START_LINE)} AS handler_line, ${ev(CONTRACT.TRIGGER_HANDLER_RESOLUTION)} AS handler_res
+     FROM facts WHERE kind = $1 AND ${ev(CONTRACT.TRIGGER_PATH)} IS NOT NULL AND ${ev(CONTRACT.TRIGGER_PATH)} <> $2 AND coalesce(${ev(CONTRACT.TRIGGER_SOURCE)}, '') <> $3
+     ORDER BY repo, file, line`,
+    [CONTRACT.TRIGGER_KIND, CONTRACT.TRIGGER_PATH_UNKNOWN, CONTRACT.TRIGGER_SOURCE_AUTH]
+  );
+  const triggers: FbTrigger[] = t.rows.flatMap(r => {
+    const event = FIRESTORE_TRIGGER_EVENTS[(r.callee ?? "").replace(/^[\s\S]*\./, "").trim()] ?? (r.trig_event && Object.values(FIRESTORE_TRIGGER_EVENTS).includes(r.trig_event) ? r.trig_event : undefined);
+    if (!event) return [];
+    return [{ fact_id: r.fact_id, repo: r.repo, file: r.file, line: r.line, event, path: r.path, segs: pathSegments(r.path), handlerExpr: r.handler_expr, handlerName: r.handler_name, handlerFile: r.handler_file, handlerLine: r.handler_line !== null && Number.isFinite(Number(r.handler_line)) ? Number(r.handler_line) : null, handlerResolved: r.handler_res === CONTRACT.TRIGGER_HANDLER_RESOLVED }];
+  });
+  const o = await db.query<{ p: string; m: string | null; n: string }>(
+    `SELECT ${ev(CONTRACT.CALL_RESOLVED_PATH)} AS p, ${ev(CONTRACT.CALL_DECLARATION_METHOD)} AS m, count(*)::text AS n FROM facts WHERE kind = $1 AND ${ev(CONTRACT.CALL_RESOLVED_PATH)} IS NOT NULL GROUP BY 1, 2`,
+    [CONTRACT.CALL_EXPRESSION_KIND]
+  );
+  const touched: FbTouched[] = o.rows.flatMap(r => { const segs = templatePathSegments(r.p); return segs ? [{ path: r.p, segs, via: `${r.m ?? "a call"} x${r.n}` }] : []; });
+  const pt = await db.query<{ p: string }>(`SELECT DISTINCT payload->>'${CONTRACT.PATH_VALUE}' AS p FROM facts WHERE kind = $1 AND payload->>'${CONTRACT.PATH_VALUE}' IS NOT NULL`, [CONTRACT.PATH_KIND]);
+  for (const r of pt.rows) { const segs = templatePathSegments(r.p); if (segs) touched.push({ path: r.p, segs, via: "firestore_path_touched" }); }
+  return { writers, triggers, touched };
+}
+
+// Declaration facts by (repo, file, name, start line): enclosing writer methods and trigger handlers.
+async function lookupDeclFacts(db: Pool, want: { repo: string; file: string; name: string; line: number }[]) {
+  const out = new Map<string, { fact_id: string; repo: string; file: string; line: number; kind: string; symbol_name: string }[]>();
+  if (want.length === 0) return out;
+  const rows = await db.query<{ fact_id: string; repo: string; file: string; line: number; kind: string; symbol_name: string }>(
+    `SELECT fact_id, repo, file, line, kind, symbol_name FROM facts
+     WHERE kind <> $1 AND (repo, file, symbol_name, line) IN (SELECT * FROM unnest($2::text[], $3::text[], $4::text[], $5::int[]))`,
+    [CONTRACT.CALL_EXPRESSION_KIND, want.map(w => w.repo), want.map(w => w.file), want.map(w => w.name), want.map(w => w.line)]
+  );
+  for (const r of rows.rows) { const k = `${r.repo}\u0000${r.file}\u0000${r.symbol_name}\u0000${r.line}`; out.set(k, [...(out.get(k) ?? []), r]); }
+  return out;
+}
+const declLookupKey = (repo: string, file: string, name: string, line: number) => `${repo}\u0000${file}\u0000${name}\u0000${line}`;
+
+async function clientJoinPreflight(db: Pool, sourceRepos: string[]): Promise<string[]> {
+  const problems: string[] = [];
+  if (sourceRepos.length === 0) problems.push(`no repo has any '${CONTRACT.CLIENT_CALL_KIND}' facts`);
+  else {
+    const withOp = await countFacts(db, `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence' ? $3`, [sourceRepos, CONTRACT.CLIENT_CALL_KIND, CONTRACT.CLIENT_OPERATION]);
+    if (withOp === 0) problems.push(`no '${CONTRACT.CLIENT_CALL_KIND}' fact has evidence.${CONTRACT.CLIENT_OPERATION} (extractor field renamed?)`);
+    const withValue = await countFacts(db, `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence' ? $3`, [sourceRepos, CONTRACT.CLIENT_CALL_KIND, CONTRACT.CLIENT_VALUE]);
+    if (withValue === 0) problems.push(`no '${CONTRACT.CLIENT_CALL_KIND}' fact has evidence.${CONTRACT.CLIENT_VALUE} (extractor field renamed?)`);
+  }
+  const writers = await countFacts(db, `kind = $1 AND payload->'evidence'->>$2 = ANY($3::text[]) AND payload->'evidence'->>$4 IS NOT NULL`, [CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_DECLARATION_METHOD, Object.keys(FIRESTORE_WRITE_WRAPPERS), CONTRACT.CALL_RESOLVED_PATH]);
+  if (writers === 0) problems.push(`no '${CONTRACT.CALL_EXPRESSION_KIND}' fact resolves to a Firestore write wrapper with evidence.${CONTRACT.CALL_RESOLVED_PATH} (extractor field renamed, or W4a not loaded?)`);
+  problems.push(...(await attributesColumnProblems(db)));
+  return problems;
+}
+const clientSourceRepos = async (db: Pool): Promise<string[]> =>
+  (await db.query<{ repo: string }>(`SELECT DISTINCT repo FROM facts WHERE kind = $1 ORDER BY repo`, [CONTRACT.CLIENT_CALL_KIND])).rows.map(r => r.repo);
 
+const clientLabel = (c: ClientCall): string => {
+  const who = [c.ev[CONTRACT.CLIENT_CALLER_CLASS], c.ev[CONTRACT.CLIENT_CALLER_FUNCTION] ?? c.ev[CONTRACT.CLIENT_CALLER_METHOD]].filter(Boolean).join(".");
+  return `${c.file}:${c.line}${who ? " " + who : ""}`;
+};
+const clientAttrs = (i: Extract<ClientInfo, { ok: true }>) => ({ platform: i.platform, clientOperation: i.op, clientSdkCall: i.sdk, pathKind: i.declaredKind, pathShape: i.collectionShape ? "collection" : "document", pathTemplate: i.template, ...i.flags });
+const flagText = (i: Extract<ClientInfo, { ok: true }>): string =>
+  `${i.flags.pathShapeMismatch ? ` NOTE: declared ${(i.flags.pathShapeMismatch as any).declared} but the template has ${(i.flags.pathShapeMismatch as any).segments} segment(s), the shape of a ${(i.flags.pathShapeMismatch as any).shape}.` : ""}${i.flags.placeholderMismatch ? ` NOTE: the template names ${(i.flags.placeholderMismatch as any[]).map(m => `{${m.template}}`).join(", ")} but the source interpolates ${(i.flags.placeholderMismatch as any[]).map(m => m.source).join(", ")}.` : ""}`;
+
+// Join: client write -> trigger handler.
+const firestoreClientTriggerJoin: Join = {
+  name: "firestore-client-trigger",
+  connectionType: "FIRESTORE_CLIENT_TRIGGER",
+  provenance: "ast_derived",
+  discoverSourceRepos: clientSourceRepos,
+  preflight: clientJoinPreflight,
+
+  async compute(db, sourceRepos) {
+    const clients = await loadClientCalls(db, sourceRepos);
+    const side = await loadFirebaseFirestoreSide(db);
+    const handlerFacts = await lookupDeclFacts(db, side.triggers.filter(t => t.handlerResolved && t.handlerName && t.handlerFile && t.handlerLine !== null).map(t => ({ repo: t.repo, file: t.handlerFile!, name: t.handlerName!, line: t.handlerLine! })));
+    const handlerOf = (t: FbTrigger) => (t.handlerResolved && t.handlerName && t.handlerFile && t.handlerLine !== null ? handlerFacts.get(declLookupKey(t.repo, t.handlerFile, t.handlerName, t.handlerLine)) ?? [] : []);
+    type G = { c: ClientCall; info: Extract<ClientInfo, { ok: true }>; handler: { fact_id: string; repo: string }; handlerExpr: string; events: Set<string>; trig: FbTrigger };
+    const groups = new Map<string, G>();
+    const perPlatform = new Map<string, { writes: number; matched: Set<string> }>();
+    let writes = 0, noHandler = 0;
+    for (const c of clients) {
+      const info = analyseClient(c);
+      if (!info.ok || !["set", "update", "delete"].includes(info.op)) continue;
+      writes++;
+      const pp = perPlatform.get(info.platform) ?? { writes: 0, matched: new Set<string>() }; pp.writes++; perPlatform.set(info.platform, pp);
+      // set on a document: create or update (unknown which); set that adds to a collection: create; update: update; delete: delete.
+      const events = info.op === "set" ? (info.collectionShape ? ["create"] : ["create", "update"]) : info.collectionShape ? [] : [info.op];
+      for (const t of side.triggers) {
+        if (!events.includes(t.event)) continue;
+        if (!collectionMatches(info.full, info.collectionShape ? t.segs.slice(0, -1) : t.segs)) continue;
+        const hf = handlerOf(t);
+        if (hf.length !== 1) { noHandler++; continue; }
+        const key = `${c.fact_id}\u0000${hf[0].fact_id}`;
+        const g = groups.get(key) ?? { c, info, handler: hf[0], handlerExpr: t.handlerExpr ?? t.handlerName ?? "", events: new Set<string>(), trig: t };
+        g.events.add(t.event); groups.set(key, g); pp.matched.add(c.fact_id);
+      }
+    }
+    const edges: EdgeRow[] = [];
+    for (const g of groups.values()) {
+      const ev = [...g.events].sort();
+      // Same wording as the existing writer -> trigger join: a `set` on a document fires create if the document is new, update if it exists.
+      const eventText = g.info.op === "set" && !g.info.collectionShape && ev.some(e => e === "create" || e === "update") ? SET_EVENT_DETAILS : `fires on document ${ev.join(" and ")}`;
+      edges.push({
+        sourceRepo: g.c.repo, sourceSymbol: `${clientLabel(g.c)} -> ${g.info.op} ${g.info.template}`, sourceFactId: g.c.fact_id,
+        targetRepo: g.handler.repo, targetSymbol: g.handlerExpr, targetFactId: g.handler.fact_id, resolutionStatus: "resolved", confirmedVia: null,
+        details: `Client ${g.info.platform} ${g.info.op}${g.info.sdk ? ` (${g.info.sdk})` : ""} on ${g.info.collectionShape ? "collection" : "document"} '${g.info.template}': ${eventText}. Trigger on ${ev.join("/")} of '${g.trig.path}' registered at ${g.trig.file}:${g.trig.line} runs ${g.handlerExpr}.${flagText(g.info)}`,
+        attributes: { ...clientAttrs(g.info), serverEvents: ev, triggerPath: g.trig.path },
+      });
+    }
+    console.log(`  Client writes (set/update/delete): ${writes} from ${clients.length} client fact(s); ${[...perPlatform.entries()].sort().map(([p, v]) => `${p}: ${v.matched.size} of ${v.writes} match a trigger`).join(", ")}${noHandler ? `; ${noHandler} trigger match(es) skipped: no single handler declaration fact` : ""}.`);
+    console.log(`  Join result: ${edges.length} resolved edges (client write -> trigger handler), reaching ${new Set(edges.map(e => e.targetFactId)).size} handler(s). A client write with no trigger on its path is not a gap and gets no row.`);
+    return edges;
+  },
+};
+
+// Join: any client call -> each Firebase writer method on the same collection; misses recorded as unresolved.
+const firestoreClientAccessJoin: Join = {
+  name: "firestore-client-access",
+  connectionType: "FIRESTORE_CLIENT_ACCESS",
+  provenance: "ast_derived",
+  discoverSourceRepos: clientSourceRepos,
+  preflight: clientJoinPreflight,
+
+  async compute(db, sourceRepos) {
+    const clients = await loadClientCalls(db, sourceRepos);
+    const side = await loadFirebaseFirestoreSide(db);
+    const methodFacts = await lookupDeclFacts(db, side.writers.filter(w => w.callerName && w.callerLine !== null).map(w => ({ repo: w.repo, file: w.file, name: w.callerName!, line: w.callerLine! })));
+    const methodOf = (w: FbWriter) => (w.callerName && w.callerLine !== null ? methodFacts.get(declLookupKey(w.repo, w.file, w.callerName, w.callerLine)) ?? [] : []);
+    const edges: EdgeRow[] = [];
+    const stat = new Map<string, { facts: number; matched: number; edges: number; unresolved: number }>();
+    for (const c of clients) {
+      const info = analyseClient(c);
+      const plat = info.platform;
+      const st = stat.get(plat) ?? { facts: 0, matched: 0, edges: 0, unresolved: 0 }; st.facts++; stat.set(plat, st);
+      const miss = (why: string, reason: string, i: ClientInfo) => {
+        st.unresolved++;
+        edges.push({
+          sourceRepo: c.repo, sourceSymbol: `${clientLabel(c)} -> ${i.op ?? "?"} ${i.ok ? i.template : "(path unresolved)"}`, sourceFactId: c.fact_id,
+          targetRepo: UNKNOWN_REPO, targetSymbol: i.ok ? i.template : "unresolved", targetFactId: null, resolutionStatus: "unresolved", confirmedVia: null,
+          details: `Client ${i.platform} ${i.op ?? "call"}${i.sdk ? ` (${i.sdk})` : ""} not linked to a Firebase writer: ${reason}${i.ok ? flagText(i) : ""}`,
+          attributes: { platform: i.platform, clientOperation: i.op, clientSdkCall: i.sdk, reason: why, ...(i.ok ? clientAttrs(i) : {}) },
+        });
+      };
+      if (!info.ok) { miss(info.why, info.reason, info); continue; }
+      const matched = side.writers.filter(w => bothMatch(info.collection, w.segs));
+      const byMethod = new Map<string, { m: { fact_id: string; repo: string; file: string; line: number; symbol_name: string }; cls: string | null; sites: string[]; wrappers: Set<string>; paths: Set<string> }>();
+      for (const w of matched) {
+        const mf = methodOf(w);
+        if (mf.length !== 1) continue;
+        const g = byMethod.get(mf[0].fact_id) ?? { m: mf[0], cls: w.callerClass, sites: [], wrappers: new Set<string>(), paths: new Set<string>() };
+        g.sites.push(`${w.wrapper}(${w.path}) at ${w.file}:${w.line}`); g.wrappers.add(w.wrapper); g.paths.add(w.path); byMethod.set(mf[0].fact_id, g);
+      }
+      if (byMethod.size === 0) {
+        const coll = collectionText(info.collection);
+        const other = side.touched.filter(t => bothMatch(info.collection, t.segs));
+        const reason = matched.length > 0
+          ? `Firebase writes collection '${coll}' in ${matched.length} write-wrapper call site(s) (${matched.slice(0, 3).map(w => `${w.file}:${w.line}`).join(", ")}${matched.length > 3 ? ", ..." : ""}) but none has an enclosing method fact, so there is nothing to attach an edge to.`
+          : other.length > 0
+            ? `Firebase code touches collection '${coll}' (${[...new Set(other.map(o => o.via))].slice(0, 4).join(", ")}) but no write-wrapper call writes it.`
+            : `No Firebase fact names collection '${coll}': no write-wrapper call, read call, trigger or ${CONTRACT.PATH_KIND} fact has a path matching it.`;
+        miss("no_firebase_writer", reason, info);
+        continue;
+      }
+      st.matched++;
+      for (const g of byMethod.values()) {
+        st.edges++;
+        edges.push({
+          sourceRepo: c.repo, sourceSymbol: `${clientLabel(c)} -> ${info.op} ${info.template}`, sourceFactId: c.fact_id,
+          targetRepo: g.m.repo, targetSymbol: `${g.m.file}:${g.m.line} ${g.cls ? g.cls + "." : ""}${g.m.symbol_name}`, targetFactId: g.m.fact_id, resolutionStatus: "resolved", confirmedVia: null,
+          details: `Client ${info.platform} ${info.op}${info.sdk ? ` (${info.sdk})` : ""} on ${info.collectionShape ? "collection" : "document"} '${info.template}' touches collection '${collectionText(info.collection)}', which this Firebase method writes: ${g.sites.slice(0, 3).join("; ")}${g.sites.length > 3 ? `; +${g.sites.length - 3} more` : ""}.${flagText(info)}`,
+          attributes: { ...clientAttrs(info), serverCollection: [...g.paths].sort(), serverWrappers: [...g.wrappers].sort() },
+        });
+      }
+    }
+    for (const [p, v] of [...stat.entries()].sort()) console.log(`  ${p}: ${v.facts} client fact(s): ${v.matched} matched a Firebase writer method -> ${v.edges} resolved edge(s); ${v.unresolved} recorded unresolved.`);
+    console.log(`  Join result: ${edges.filter(e => e.resolutionStatus === "resolved").length} resolved, ${edges.filter(e => e.resolutionStatus === "unresolved").length} unresolved (each with its reason).`);
+    return edges;
+  },
+};
+
+const JOINS: Join[] = [firebaseCallableJoin, pubsubBindingJoin, packageSymbolUseJoin, restRouteJoin, firestoreTriggerJoin, firestoreClientTriggerJoin, firestoreClientAccessJoin];
+
 // ---------------------------------------------------------------------------
 // Shared scoped replace. Compute first, replace second: the new edge set for a
 // join is fully built in memory before anything is touched. Each
@@ -1366,6 +1660,15 @@
       console.log(`  Removed ${deleted.rowCount} stale ${join.connectionType} edge(s) for ${repo}.`);
     }
     for (const edge of edges) {
+      // The attributes column is written only by joins that set it, so every older join's INSERT is unchanged.
+      if (edge.attributes) {
+        await client.query(
+          `INSERT INTO cross_repo_edges (source_repo, source_symbol, source_fact_id, target_repo, target_symbol, target_fact_id, connection_type, resolution_status, provenance, confirmed_via, details, synthesis_id, generated_at, attributes)
+           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), $13::jsonb)`,
+          [edge.sourceRepo, edge.sourceSymbol, edge.sourceFactId, edge.targetRepo, edge.targetSymbol, edge.targetFactId, join.connectionType, edge.resolutionStatus, join.provenance, edge.confirmedVia, edge.details, synthesisId, JSON.stringify(edge.attributes)]
+        );
+        continue;
+      }
       await client.query(
         `INSERT INTO cross_repo_edges (source_repo, source_symbol, source_fact_id, target_repo, target_symbol, target_fact_id, connection_type, resolution_status, provenance, confirmed_via, details, synthesis_id, generated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())`,
@@ -1504,6 +1807,7 @@
 
 async function main() {
   const args = parseArgs(process.argv.slice(2));
+  DRY_RUN = args.dryRun;
   const unknown = args.joins.filter(n => !JOINS.some(j => j.name === n));
   if (unknown.length > 0) throw new Error(`Unknown --join value(s): ${unknown.join(", ")}. Joins: ${JOINS.map(j => j.name).join(", ")}`);
   if (args.summaryOnly && (args.joins.length > 0 || args.dryRun || args.acceptShrink || args.printEdges || args.noSummary)) throw new Error(`--summary-only takes no other flag: it runs no join and writes nothing.`);
```

### 2026-09-26: [Lane A] W2: `descriptionFor` for Pub/Sub publish facts, built in a COPY (field names for Lane B to confirm, regression over all live facts, diff). Nothing in the shared tree, no DB write, no `git add`/`git commit`, no `EMBED`

Session `-29`. The existing `pubsub-binding` join needs no change (as the coordinator said). The copy is the untracked `pipeline/facts-postgres-index/_dev-sync-facts.ts` (v1.2.0 = shared `sync-facts.ts` v1.1.0 plus the one block below); it enters the tree with W4d in my next write turn, after the coordinator's approval, and must land before Lane B's W2 sync.

**Field names read (Lane B: please confirm or correct in this log before your held-run gate; these are Lane C's proposal names, read as `fact.X ?? fact.evidence.X`, all optional):** `evidence.type = "pubsub_publish_call"` (on `kind = external_hook`, which today has exactly these 16 facts: 14 firebase, 2 node-iot), `topicName`, `topicNameStatus` (`resolved` | `pass_through_parameter` | `env_var_not_defined` | `env_var_overridden` | `unresolved`), `topicNameReason`, `topicSource` (`{kind: literal | env_var | parameter, envVar, envFile}`), `publishRole` (`origin` | `via_wrapper` | `plumbing`), `wrapperMethod`, `orderingKeyExpression`, `topicResolvedVia` (array of steps). The top-level `value` is untouched by me (it is the symbol in the description's first part, so Lane B's corrected `value` shows there).

**Behaviour.** The text is added **only when at least one of `topicName`, `topicNameStatus` or `publishRole` is present**, so a publish fact extracted before W2, and node-iot's two (which lack the fields), keep exactly today's description. With the fields: ` -- publishes to topic: <topicName> (from env var <envVar> in <envFile> | literal | parameter)` or ` -- topic not resolved (<status words>: <reason>)`, then ` -- ordering key: <expression>`, then the role (` -- publishes directly` | ` -- publishes via <wrapperMethod>` | ` -- shared publish method: the topic is a parameter, the concrete topic is recorded on its callers`), then ` -- resolved via: <step> -> <step> ...`. Examples produced from synthetic facts shaped like Lane C's proposal (resolved via env var through a wrapper, a plumbing pass-through, a direct literal) read correctly; a pre-W2-shaped fact is unchanged.

**Regression (read-only, over ALL live facts, all 9 repos):** the copy reproduces the stored `description` of **69,643 of 69,643** facts, **0 differ** (the 16 publish facts included, since none has the new fields yet). So no existing fact is re-described or re-embedded by this change; only the publish facts whose fields Lane B adds will change, on the run that carries the fields (about 14 firebase facts; the estimate stays 1.5k to 2k tokens; the pre-sync gate will count exactly).

**Diff (shared `sync-facts.ts` v1.1.0 → the copy v1.2.0):**
```diff
@@ -1,4 +1,4 @@
-// **version:** 1.1.0
+// **version:** 1.2.0
 // **location:** level-5 P2 facts index
 // © Oskey SAS. All rights reserved.
 //
@@ -493,6 +493,27 @@
     ? `${exportGroup ? ` -- deployed function group '${exportGroup}': clients call its functions as '${exportGroup}-<name>'` : ""}${exportFactoryCall ? ` -- built by ${exportFactoryCall}` : ""}${exportImportSpecifier ? ` from '${exportImportSpecifier}'` : ""}${exportTargetModule ? ` -- resolves to module: ${exportTargetModule}${exportTargetSubmodule ? `/${exportTargetSubmodule}` : ""}` : exportResolutionStatus ? ` -- module not resolved (${exportResolutionStatus})` : ""}`
     : "";
 
+  // Added 2026-09-26 (Lane A, doc 43 W2): a Pub/Sub publish call site (`external_hook` with evidence.type =
+  // pubsub_publish_call) used to get only the floor text. Lane B's W2 extractor adds these fields (additive; the fact
+  // ID and top-level `value` semantics are handled there): `topicName` (the concrete topic), `topicNameStatus`
+  // (resolved | pass_through_parameter | env_var_not_defined | env_var_overridden | unresolved), `topicNameReason`,
+  // `topicSource` ({kind: literal | env_var | parameter, envVar, envFile}), `publishRole` (origin | via_wrapper |
+  // plumbing), `wrapperMethod`, `orderingKeyExpression`, `topicResolvedVia` (an ordered chain). The text is added only
+  // when at least one of them is present, so a publish fact extracted before W2 (and node-iot's, which lack them)
+  // keeps exactly the description it has today; nothing is invented, an absent field is skipped.
+  const hookType: string | undefined = fact.evidence?.type ?? fact.hookType;
+  const psTopic: string | undefined = fact.topicName ?? fact.evidence?.topicName;
+  const psStatus: string | undefined = fact.topicNameStatus ?? fact.evidence?.topicNameStatus;
+  const psReason: string | undefined = fact.topicNameReason ?? fact.evidence?.topicNameReason;
+  const psSource: { kind?: string; envVar?: string; envFile?: string } | undefined = fact.topicSource ?? fact.evidence?.topicSource;
+  const psRole: string | undefined = fact.publishRole ?? fact.evidence?.publishRole;
+  const psWrapper: string | undefined = fact.wrapperMethod ?? fact.evidence?.wrapperMethod;
+  const psOrdering: string | undefined = fact.orderingKeyExpression ?? fact.evidence?.orderingKeyExpression;
+  const psVia: string[] | undefined = fact.topicResolvedVia ?? fact.evidence?.topicResolvedVia;
+  const pubsubPublishCallDoc = fact.type === "external_hook" && hookType === "pubsub_publish_call" && (psTopic || psStatus || psRole)
+    ? `${psTopic ? ` -- publishes to topic: ${psTopic}${psSource?.kind === "env_var" && psSource.envVar ? ` (from env var ${psSource.envVar}${psSource.envFile ? ` in ${psSource.envFile}` : ""})` : psSource?.kind ? ` (${psSource.kind.replace(/_/g, " ")})` : ""}` : psStatus ? ` -- topic not resolved (${psStatus.replace(/_/g, " ")}${psReason ? `: ${psReason}` : ""})` : ""}${psOrdering ? ` -- ordering key: ${psOrdering}` : ""}${psRole === "origin" ? " -- publishes directly" : psRole === "via_wrapper" ? ` -- publishes via ${psWrapper ?? "a wrapper method"}` : psRole === "plumbing" ? " -- shared publish method: the topic is a parameter, the concrete topic is recorded on its callers" : ""}${Array.isArray(psVia) && psVia.length > 0 ? ` -- resolved via: ${psVia.join(" -> ")}` : ""}`
+    : "";
+
   const fcSide: string | undefined = fact.side ?? fact.evidence?.side;
   const fcPlatform: string | undefined = fact.platform ?? fact.evidence?.platform;
   const fcOperation: string | null | undefined = fact.operation ?? fact.evidence?.operation;
@@ -508,7 +529,7 @@
     ? ` -- ${fcSide ?? "client"}${fcPlatform ? ` (${fcPlatform})` : ""} Firestore ${fcOperation ?? "access"}${fcSdkCall ? ` via ${fcSdkCall}` : ""} on ${fcPathKind ? `${fcPathKind} path` : "a path"}${fcOperation ? "" : fcOperationReason ? ` (operation not determined: ${fcOperationReason})` : ""}${fcPathSource?.enum && fcPathSource?.case ? ` -- path enum case: ${fcPathSource.enum}.${fcPathSource.case}` : ""}${fcCallerClass || fcCallerFunction ? ` -- called from: ${[fcCallerClass, fcCallerFunction].filter(Boolean).join(".")}` : ""}${fcResolution === "unresolved" ? ` -- path unresolved${fcUnresolvedReason ? `: ${fcUnresolvedReason}` : ""}` : ""}`
     : "";
 
-  return `${fact.type} in ${module}${sub}: ${sym}${values}${managesDoc}${implementsInterfacesDoc}${returnsDoc}${apiContractDoc}${callExpressionDoc}${kotlinCallResolutionDoc}${kotlinCallArgumentsDoc}${firebaseCallableCallDoc}${routeDefinitionDoc}${pubsubOperationRouteDoc}${pubsubEventRouteDoc}${angularRouteDoc}${angularComponentDoc}${angularInjectableDoc}${angularTemplateAttributeDoc}${modelPropertyDoc}${importsDependencyDoc}${enumDeclarationDoc}${tsEnumDeclarationDoc}${swiftEnumDeclarationDoc}${swiftInheritanceDoc}${extensionDeclarationDoc}${sealedHierarchyDoc}${composableDoc}${functionOwningClassDoc}${constructorPromotedDoc}${bleGattDoc}${usbWireConstantDoc}${webrtcTouchpointDoc}${exportRegistryEntryDoc}${firestoreClientCallDoc} (${loc})`;
+  return `${fact.type} in ${module}${sub}: ${sym}${values}${managesDoc}${implementsInterfacesDoc}${returnsDoc}${apiContractDoc}${callExpressionDoc}${kotlinCallResolutionDoc}${kotlinCallArgumentsDoc}${firebaseCallableCallDoc}${routeDefinitionDoc}${pubsubOperationRouteDoc}${pubsubEventRouteDoc}${angularRouteDoc}${angularComponentDoc}${angularInjectableDoc}${angularTemplateAttributeDoc}${modelPropertyDoc}${importsDependencyDoc}${enumDeclarationDoc}${tsEnumDeclarationDoc}${swiftEnumDeclarationDoc}${swiftInheritanceDoc}${extensionDeclarationDoc}${sealedHierarchyDoc}${composableDoc}${functionOwningClassDoc}${constructorPromotedDoc}${bleGattDoc}${usbWireConstantDoc}${webrtcTouchpointDoc}${exportRegistryEntryDoc}${firestoreClientCallDoc}${pubsubPublishCallDoc} (${loc})`;
 }
 
 function pool(): Pool {
```

### 2026-09-26: [Lane B] W2 extracted into a HELD run and gated. READY TO SYNC (description part PROVISIONAL, see the Lane A dependency below; waiting for validation and a granted write turn)

Approved by the user via the coordinator (Lane C's W2 proposals with the coordinator's modification of decision 1). Files only: no sync, no `EMBED`, no edges, no DB write, no `gcloud`; no `git add`/`git commit`. **HELD RUN ID: `20260926_134105-00e1d9fd`** (firebase, pinned commit `00e1d9fd`, `output/runs/firebase-oskey-dev/20260926_134105-00e1d9fd/`). The DB's current firebase run is still the W4e run `20260926_132249-00e1d9fd`. **Caution:** `output/firebase-oskey-dev/run-context.json` points at the held run, so a firebase `sync-facts.ts` would load it; nobody syncs firebase outside a granted turn. Extraction: exit 0, **no parse error**, only the existing `UNRESOLVED_CALLS_WARNING`.

**Code (Lane B files only).** New `pipeline/firebase-oskey-dev/phase-01-ast-extraction/_shared/pubsub-publish-topics.ts`, called from both publish-detection blocks of `01-extract-ast-evidence.ts`; `02-build-module-evidence.ts` builds the ID from `legacyValue`. **Which argument is the topic is derived from the callee's own body, recursively, not from a name list:** a method is a publish method when its body reaches `<x>.topic(<t>).publishMessage({ data, orderingKey })` directly or through another publish method (depth cap 8, cycle guard); per method the topic is one of its parameters or a fixed expression inside it, and the ordering key likewise. (Site selection is still the existing name match, unchanged; only the argument mapping and the evaluation are new.) **Topic evaluation:** literals, templates, local constants, calls to a single-`return` method (`this.getTopicName()`), `process.env.NAME` (from a table built **literally** from the `.env*` files next to the functions root, no interpolation; not defined, defined with different values in several files, or a non-literal value each fail closed with a reason), then the extractor's existing resolver for constants. The value is what the repository's committed `functions/.env` says, **not the deployed runtime, staging-relevant only**; that sentence is in `topicResolvedVia` on every env-resolved fact.

**Pre-sync fact-ID gate (firebase, held run vs `facts.fact_id`, live `descriptionFor`):**

| | count |
|---|---|
| DB facts / run facts | 15,453 / 15,453 |
| **identical IDs** | **15,453** (all; the 14 publish facts keep their legacy-value IDs, e.g. `external_hook\|core\|…\|buildingDoorACD.accessControlDeviceId\|#1`) |
| **new / would be pruned** | **0 / 0** |
| existing values changed (excluding `runId`) | **only on 10 publish facts:** `value`, `evidence.value`, `evidence.confidence` (`candidate` → `confirmed`), `evidence.topicResolutionStatus` (→ `resolved`); nothing else |
| additive keys | on all **14** publish facts: `legacyValue`, `topicName`, `topicNameStatus`, `topicNameReason`, `topicSource`, `publishRole`, `orderingKeyExpression`, `topicResolvedVia`; on **7**: `wrapperMethod`, `wrapperDeclarationFile` |
| description changes | **10** with today's `descriptionFor` (only the `value` in the text changes); see the dependency below |

**The 14 publish facts (`legacy value` → `value`, status, role):**
- **Resolved to a staging topic (10):** `access.controller.ts:71` `topicName` → `accessControlDevice_accesses` (origin) and its 4 wrapper callers `access_message_publisher.service.ts:136,169,192` (`buildingDoorACD.accessControlDeviceId`) and `:225` (`acdId`) → `accessControlDevice_accesses` (`via_wrapper`, `wrapperMethod: publishMessage`); `building_intercom.controller.ts:62` `{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}` → `accessControlDevice_intercomEntries` (origin) and its 3 callers `building_intercom_message_publisher.service.ts:24,56` (`intercomDoc.accessControlDeviceId`) and `:64` (`intercomId`) → the same (`via_wrapper`); `access_control_device_config.controller.ts:92` `topicName` → `accessControlDevice_configurations` (origin). **Counts by topic: accesses 5, intercomEntries 4, configurations 1**, as specified. `orderingKeyExpression` is now the device/intercom id (e.g. `buildingDoorACD.accessControlDeviceId`), recorded apart from the topic; `topicSource` = `env_var` with `envFile`, `envLine`.
- **Literal, resolved but flagged (1):** `access_control_device_public_keys.controller.ts:84` `accessControlDeviceConfigs` (origin, `topicSource` literal); value unchanged. It is not among the staging snapshot's topics; that is the join's to report, the extractor does not resolve it further (probable dead path, unverified, per Lane C).
- **Plumbing (3):** `message.controller.ts:31`, `document_and_message.controller.ts:75` and `:156`: `topicNameStatus: pass_through_parameter`, `publishRole: plumbing`, reason "`topic`/`topicName` is a parameter of the enclosing method; the concrete topic is supplied by its callers"; `value` unchanged (the parameter name), `confidence: candidate`.
The 7 that were wrong (`value` an ordering key) are exactly the 7 wrapper callers above; all 7 now carry the topic.

**Dependency on Lane A (descriptions).** `descriptionFor` does not yet have a section for these facts, so today's text only changes where `value` changed (10 descriptions, 1,700 chars, about 425 tokens by chars/4). Lane A's planned extension (` -- topic: <topicName> (<topicSource>) -- ordering key: <orderingKeyExpression> -- <publishRole>`) makes all **14** change (about 1.5k-2k tokens, pre-approved). **The description numbers must be re-run after that lands; this gate is provisional on that one point, everything else is final.** Asking Lane A to post the change in this doc before the turn.

**Expected edge effect at the write turn (per the approved design; the join is unchanged):** `PUBSUB_TOPIC_BINDING` 25 → 22 (unknown-source rows 9 → 6, resolved edges 1 → 11, no resolved edge lost), total 17,810 → 17,807; the 10 new resolved edges: accesses 5 sources, intercomEntries 4, configurations 1, into node-iot; every other slice byte-identical. The shrink guard will refuse that in a plain run, and `build-edges.ts` passes `--accept-shrink` to **every** cross join (broader than the approval), so the turn runs the builder directly for that one join.

**Exact commands for the W2 write turn (only after a `WRITE TURN GRANTED: Lane B W2` is the last write-turn-log line):**
1. Preconditions: `run-context.json` = `20260926_134105-00e1d9fd`; record live counts; re-run the gate against the then-live DB (must still show 15,453 identical / 0 new / 0 pruned; description count per Lane A's final text).
2. `pg_dump` to `output/backups/facts_index-2026-09-26-before-W2.dump` + `pg_restore -l`.
3. Sync, `EMBED` unset, all 15 modules; **expected new / need embedding / removed: 0 / 0 / 0 everywhere except the modules holding the publish facts** (access_control_device, building, core), where "need embedding" equals that module's changed-description count (10 in total today, 14 once Lane A's text lands). Stop and ask if any differs.
4. Read-only check: facts total unchanged (69,643); firebase 15,453 at the held run; exactly the expected number (10 or 14) without an embedding; current firebase run = the held run.
5. `EMBED=true` only after the user confirms directly in the window (pre-approved up to about 2k tokens; still asked); modules access_control_device, building, core; record actual tokens.
6. Take a per-slice snapshot, then run **`node -r ts-node/register pipeline/facts-postgres-index/build-cross-repo-edges.ts --join=pubsub-binding --accept-shrink`** (that one join only), then a plain `npm run pipeline:edges` to rebuild and record state. Verify: `PUBSUB_TOPIC_BINDING` 25 → 22 exactly as above with no resolved edge lost and the 10 new edges' sources/targets as listed; **every other slice byte-identical**; 0 dangling; all `edge_sync_state` slices ok; `FIELD_BINDING` 13. Append the results; the coordinator releases. No `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; if the live-DB classifier asks the user to approve a command I wait and never work around a denial.

### Coordinator note 2026-09-26 (about 16:35 UTC): Lane B's W2 held-run gate validated (provisional on `descriptionFor`); turn order changed

- **W2 held run independently validated (coordinator, read-only):** run `20260926_134105-00e1d9fd` vs the live database (firebase): **15,453 identical, 0 new, 0 pruned; all 14 publish fact IDs kept; existing values change only on 10 `external_hook` facts** (`value`, `evidence.value`, `evidence.confidence`, `evidence.topicResolutionStatus`); additive keys on all 14 (`legacyValue`, `orderingKeyExpression`, `publishRole`, `topicName`, `topicNameReason`, `topicNameStatus`, `topicResolvedVia`, `topicSource`) and `wrapperMethod`/`wrapperDeclarationFile` on 7. **Outcome matches Lane C's expected mapping:** 10 resolve to a staging topic (accesses 5 = 1 origin + 4 via wrapper, intercomEntries 4 = 1 origin + 3 via wrapper, configurations 1), the 7 formerly device-id facts now carry the topic with the ordering key recorded separately (`publishRole: via_wrapper`), 3 shared-plumbing facts are `pass_through_parameter`, the literal `accessControlDeviceConfigs` fact is unchanged; **0 publish facts still have a device id as their value.** Expected edge result when applied: 10 resolved firebase -> node-iot edges, 4 unresolved (3 plumbing + the literal), meeting the wiki's "at most 4".
- **Dependency and re-sequencing:** the gate is provisional until Lane A's `descriptionFor` extension for these facts is final (10 descriptions change today, all 14 after Lane A's extension). **`descriptionFor` is code-only in a shared file and needs no write turn**, so it enters the shared tree as its own approved change now (diff and full-DB regression posted first, no other change bundled), instead of waiting for Lane A's W4d turn. Then Lane B re-runs the gate with the final text, and Lane B's W2 write turn comes next; Lane A's W4d turn (schema column, two joins) follows.
- **Accepted:** Lane B's narrower shrink approach (run `build-cross-repo-edges.ts --join=pubsub-binding --accept-shrink` directly, because the orchestrator would pass `--accept-shrink` to every cross join), followed by a plain `pipeline:edges`.

### Step U (HIGH PRIORITY, after W2, W4d and W6): unpin firebase and angular and refresh to current `staging`

- **Raised by the user (about 16:45 UTC):** `config/repos.json` no longer has `branch: staging` for firebase and angular. **Coordinator finding: this is the deliberate pin from this build, not a stray debug edit, and it is still UNCOMMITTED.** The committed `config/repos.json` at `HEAD` has `branch: "staging"` for firebase, angular and node-iot. In the working tree only firebase (`commit 00e1d9fd568f...`) and angular (`commit 8345d222a7f9...`) were changed, on 2026-09-26 by Lane B on the coordinator's instruction, each with a `_note_commit` saying "Pinned 2026-09-26 (was branch 'staging')". **node-iot is untouched (`branch: staging`).** Reason for the pins: firebase `staging` had moved 22 commits and 230 files ahead of the extracted commit and touched the very files W1 targeted; extracting the latest would have mixed extractor changes with upstream changes. The scan requires exactly one of `branch`/`commit`, so a pin necessarily replaces the branch.
- **The risk the user spotted is real:** if the pinned `config/repos.json` were committed and forgotten, the pipeline would silently stop tracking `staging` for those two repos. Mitigations already in place: the `_note_commit` text, and the pipeline README table now marks both as TEMPORARILY pinned (this note).
- **Step U (to schedule, its own investigation first, then held run, gate, write turn):** restore `branch: "staging"` (removing `commit` for both), re-extract firebase and angular at the current `staging` head, and treat it as its own controlled step: (1) investigation (read-only): what changed upstream since the pins (firebase: 22 commits, 230 files, including `index.ts`, both decorators and `utils/`; angular: check), and whether the W1/W3/W4b/W4e/W2 extractor changes still hold on the new code (parse errors at tolerance 0, the export registry, root routes, arrow-function members, publish wrappers); (2) held run and gate: the fact-ID comparison against the live database will show real changes this time (new/changed/pruned facts from the upstream commits, embeddings for changed descriptions, edges dangling until rebuilt); (3) write turn with dump, sync, embed (flagged), `pipeline:edges`, validation; (4) tell the wiki team the reference commit changed. Until then, do not commit the pinned `config/repos.json` without this step written down as the next action.

### 2026-09-26: [Lane A] `descriptionFor` for Pub/Sub publish facts: FINAL text, diff, regression over ALL live facts, and the 14 held-run descriptions. Ready to enter the shared tree on the coordinator's confirmation. Nothing in the shared tree yet, no DB write, no `EMBED`, no `git add`/`git commit`

Session `-29`. This is the ONLY change in the copy `pipeline/facts-postgres-index/_dev-sync-facts.ts` (v1.2.0) relative to the shared `sync-facts.ts` (v1.1.0): one new block plus its slot in the return string and the version line, nothing bundled (W4d is separate, in its own file). It supersedes my earlier W2 entry in one respect: the `topicResolvedVia` steps are now shortened to their names (each step's `@ file:line` part and the long "read from the repository's committed .env files" sentence are dropped, and one short "(repository's committed .env files, not the deployed runtime)" is appended when a step carried it), because the full chain made each description about 900 characters; the full chain stays in the payload. **I say clean and ready: the coordinator can approve it into the shared tree straight away** (I will then copy the file over `sync-facts.ts`, re-run the regression against the shared file, and tell Lane B; I will not touch the shared file before the coordinator confirms in this doc).

**Field names, checked against Lane B's held run `20260926_134105-00e1d9fd` (the real payloads, not my earlier guesses):** `evidence.type = pubsub_publish_call`, `topicName`, `topicNameStatus`, `topicNameReason`, `topicSource` (`{kind: literal | env_var | parameter, envVar, envFile, envLine}`), `publishRole`, `wrapperMethod`, `orderingKeyExpression`, `topicResolvedVia` (array of strings). All match what the block reads; `legacyValue` and `wrapperDeclarationFile` are not used. The text is added only when at least one of `topicName`, `topicNameStatus`, `publishRole` is present.

**Regression over ALL live facts (read-only, `facts_index`, all 9 repos): the copy reproduces the stored `description` of 69,643 of 69,643 facts, 0 differ** (the 16 publish facts included: the live ones do not have the new fields yet, so their text is unchanged). So no fact is re-described until Lane B's W2 payloads are synced.

**Run against Lane B's held-run payloads (the 14 publish facts, read from the run's capability packs):** **all 14 descriptions change relative to the live text** (10 already change with today's function because `value` changed; the 4 others are the literal `accessControlDeviceConfigs` and the 3 plumbing facts). The 14 new descriptions total **    6976 characters, about 1744 tokens at chars/4** (the pre-approved envelope is 1.5k to 2k; the earlier long-chain version would have been about 3.5k). Each, in file order:
```
external_hook in access_control_device: accessControlDevice_configurations -- publishes to topic: accessControlDevice_configurations (from env var OSK_PUBSUB_TOPIC_ACD_CONFIGURATIONS in functions/.env) -- ordering key: accessControlDeviceId -- publishes directly -- resolved via: const topicName -> getTopicName -> env OSK_PUBSUB_TOPIC_ACD_CONFIGURATIONS = accessControlDevice_configurations (repository's committed .env files, not the deployed runtime) (functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts:92)
external_hook in access_control_device: accessControlDeviceConfigs -- publishes to topic: accessControlDeviceConfigs (literal) -- ordering key: deviceId -- publishes directly (functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts:84)
external_hook in building/building_intercom: accessControlDevice_intercomEntries -- publishes to topic: accessControlDevice_intercomEntries (from env var OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES in functions/.env) -- ordering key: acdId -- publishes directly -- resolved via: const topicName -> env OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES = accessControlDevice_intercomEntries (repository's committed .env files, not the deployed runtime) (functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts:62)
external_hook in building/building_intercom: accessControlDevice_intercomEntries -- publishes to topic: accessControlDevice_intercomEntries (from env var OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES in functions/.env) -- ordering key: intercomDoc.accessControlDeviceId -- publishes via publishMessage -- resolved via: publishMessage -> const topicName -> env OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES = accessControlDevice_intercomEntries (repository's committed .env files, not the deployed runtime) (functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts:24)
external_hook in building/building_intercom: accessControlDevice_intercomEntries -- publishes to topic: accessControlDevice_intercomEntries (from env var OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES in functions/.env) -- ordering key: intercomDoc.accessControlDeviceId -- publishes via publishMessage -- resolved via: publishMessage -> const topicName -> env OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES = accessControlDevice_intercomEntries (repository's committed .env files, not the deployed runtime) (functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts:56)
external_hook in building/building_intercom: accessControlDevice_intercomEntries -- publishes to topic: accessControlDevice_intercomEntries (from env var OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES in functions/.env) -- ordering key: intercomId -- publishes via publishMessage -- resolved via: publishMessage -> const topicName -> env OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES = accessControlDevice_intercomEntries (repository's committed .env files, not the deployed runtime) (functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts:64)
external_hook in core: topic -- topic not resolved (pass through parameter: `topic` is a parameter of the enclosing method; the concrete topic is supplied by its callers) -- ordering key: orderingKey -- shared publish method: the topic is a parameter, the concrete topic is recorded on its callers (functions/src/modules/core/controllers/document_and_message.controller.ts:75)
external_hook in core: topic -- topic not resolved (pass through parameter: `topic` is a parameter of the enclosing method; the concrete topic is supplied by its callers) -- ordering key: orderingKey -- shared publish method: the topic is a parameter, the concrete topic is recorded on its callers (functions/src/modules/core/controllers/document_and_message.controller.ts:156)
external_hook in core: topicName -- topic not resolved (pass through parameter: `topicName` is a parameter of the enclosing method; the concrete topic is supplied by its callers) -- ordering key: orderingKey -- shared publish method: the topic is a parameter, the concrete topic is recorded on its callers (functions/src/modules/core/controllers/message.controller.ts:31)
external_hook in core/access: accessControlDevice_accesses -- publishes to topic: accessControlDevice_accesses (from env var OSK_PUBSUB_TOPIC_ACD_ACCESSES in functions/.env) -- ordering key: accessControlDeviceId -- publishes directly -- resolved via: const topicName -> getTopicName -> env OSK_PUBSUB_TOPIC_ACD_ACCESSES = accessControlDevice_accesses (repository's committed .env files, not the deployed runtime) (functions/src/modules/core/modules/access/controllers/access.controller.ts:71)
external_hook in core/access: accessControlDevice_accesses -- publishes to topic: accessControlDevice_accesses (from env var OSK_PUBSUB_TOPIC_ACD_ACCESSES in functions/.env) -- ordering key: buildingDoorACD.accessControlDeviceId -- publishes via publishMessage -- resolved via: publishMessage -> const topicName -> getTopicName -> env OSK_PUBSUB_TOPIC_ACD_ACCESSES = accessControlDevice_accesses (repository's committed .env files, not the deployed runtime) (functions/src/modules/core/modules/access/services/access_message_publisher.service.ts:136)
external_hook in core/access: accessControlDevice_accesses -- publishes to topic: accessControlDevice_accesses (from env var OSK_PUBSUB_TOPIC_ACD_ACCESSES in functions/.env) -- ordering key: buildingDoorACD.accessControlDeviceId -- publishes via publishMessage -- resolved via: publishMessage -> const topicName -> getTopicName -> env OSK_PUBSUB_TOPIC_ACD_ACCESSES = accessControlDevice_accesses (repository's committed .env files, not the deployed runtime) (functions/src/modules/core/modules/access/services/access_message_publisher.service.ts:169)
external_hook in core/access: accessControlDevice_accesses -- publishes to topic: accessControlDevice_accesses (from env var OSK_PUBSUB_TOPIC_ACD_ACCESSES in functions/.env) -- ordering key: buildingDoorACD.accessControlDeviceId -- publishes via publishMessage -- resolved via: publishMessage -> const topicName -> getTopicName -> env OSK_PUBSUB_TOPIC_ACD_ACCESSES = accessControlDevice_accesses (repository's committed .env files, not the deployed runtime) (functions/src/modules/core/modules/access/services/access_message_publisher.service.ts:192)
external_hook in core/access: accessControlDevice_accesses -- publishes to topic: accessControlDevice_accesses (from env var OSK_PUBSUB_TOPIC_ACD_ACCESSES in functions/.env) -- ordering key: acdId -- publishes via publishMessage -- resolved via: publishMessage -> const topicName -> getTopicName -> env OSK_PUBSUB_TOPIC_ACD_ACCESSES = accessControlDevice_accesses (repository's committed .env files, not the deployed runtime) (functions/src/modules/core/modules/access/services/access_message_publisher.service.ts:225)
```

**Diff (shared `sync-facts.ts` v1.1.0 → the copy v1.2.0):**
```diff
@@ -1,4 +1,4 @@
-// **version:** 1.1.0
+// **version:** 1.2.0
 // **location:** level-5 P2 facts index
 // © Oskey SAS. All rights reserved.
 //
@@ -491,6 +491,28 @@
   // search for a client function name needs to land on the module that implements it.
   const exportRegistryEntryDoc = fact.type === "export_registry_entry"
     ? `${exportGroup ? ` -- deployed function group '${exportGroup}': clients call its functions as '${exportGroup}-<name>'` : ""}${exportFactoryCall ? ` -- built by ${exportFactoryCall}` : ""}${exportImportSpecifier ? ` from '${exportImportSpecifier}'` : ""}${exportTargetModule ? ` -- resolves to module: ${exportTargetModule}${exportTargetSubmodule ? `/${exportTargetSubmodule}` : ""}` : exportResolutionStatus ? ` -- module not resolved (${exportResolutionStatus})` : ""}`
+    : "";
+
+  // Added 2026-09-26 (Lane A, doc 43 W2): a Pub/Sub publish call site (`external_hook` with evidence.type =
+  // pubsub_publish_call) used to get only the floor text. Lane B's W2 extractor adds these fields (additive; the fact
+  // ID and top-level `value` semantics are handled there): `topicName` (the concrete topic), `topicNameStatus`
+  // (resolved | pass_through_parameter | env_var_not_defined | env_var_overridden | unresolved), `topicNameReason`,
+  // `topicSource` ({kind: literal | env_var | parameter, envVar, envFile}), `publishRole` (origin | via_wrapper |
+  // plumbing), `wrapperMethod`, `orderingKeyExpression`, `topicResolvedVia` (an ordered chain). The text is added only
+  // when at least one of them is present, so a publish fact extracted before W2 (and node-iot's, which lack them)
+  // keeps exactly the description it has today; nothing is invented, an absent field is skipped. The
+  // `topicResolvedVia` steps are shortened to their names (the "@ file:line" parts stay in the payload) to keep the embedded text small.
+  const hookType: string | undefined = fact.evidence?.type ?? fact.hookType;
+  const psTopic: string | undefined = fact.topicName ?? fact.evidence?.topicName;
+  const psStatus: string | undefined = fact.topicNameStatus ?? fact.evidence?.topicNameStatus;
+  const psReason: string | undefined = fact.topicNameReason ?? fact.evidence?.topicNameReason;
+  const psSource: { kind?: string; envVar?: string; envFile?: string } | undefined = fact.topicSource ?? fact.evidence?.topicSource;
+  const psRole: string | undefined = fact.publishRole ?? fact.evidence?.publishRole;
+  const psWrapper: string | undefined = fact.wrapperMethod ?? fact.evidence?.wrapperMethod;
+  const psOrdering: string | undefined = fact.orderingKeyExpression ?? fact.evidence?.orderingKeyExpression;
+  const psVia: string[] | undefined = fact.topicResolvedVia ?? fact.evidence?.topicResolvedVia;
+  const pubsubPublishCallDoc = fact.type === "external_hook" && hookType === "pubsub_publish_call" && (psTopic || psStatus || psRole)
+    ? `${psTopic ? ` -- publishes to topic: ${psTopic}${psSource?.kind === "env_var" && psSource.envVar ? ` (from env var ${psSource.envVar}${psSource.envFile ? ` in ${psSource.envFile}` : ""})` : psSource?.kind ? ` (${psSource.kind.replace(/_/g, " ")})` : ""}` : psStatus ? ` -- topic not resolved (${psStatus.replace(/_/g, " ")}${psReason ? `: ${psReason}` : ""})` : ""}${psOrdering ? ` -- ordering key: ${psOrdering}` : ""}${psRole === "origin" ? " -- publishes directly" : psRole === "via_wrapper" ? ` -- publishes via ${psWrapper ?? "a wrapper method"}` : psRole === "plumbing" ? " -- shared publish method: the topic is a parameter, the concrete topic is recorded on its callers" : ""}${Array.isArray(psVia) && psVia.length > 0 ? ` -- resolved via: ${psVia.map(step => step.replace(/\s*\(read from .*$/, "").replace(/\s*@\s*\S+$/, "")).join(" -> ")}${psVia.some(step => /committed \.env/.test(step)) ? " (repository's committed .env files, not the deployed runtime)" : ""}` : ""}`
     : "";
 
   const fcSide: string | undefined = fact.side ?? fact.evidence?.side;
@@ -508,7 +530,7 @@
     ? ` -- ${fcSide ?? "client"}${fcPlatform ? ` (${fcPlatform})` : ""} Firestore ${fcOperation ?? "access"}${fcSdkCall ? ` via ${fcSdkCall}` : ""} on ${fcPathKind ? `${fcPathKind} path` : "a path"}${fcOperation ? "" : fcOperationReason ? ` (operation not determined: ${fcOperationReason})` : ""}${fcPathSource?.enum && fcPathSource?.case ? ` -- path enum case: ${fcPathSource.enum}.${fcPathSource.case}` : ""}${fcCallerClass || fcCallerFunction ? ` -- called from: ${[fcCallerClass, fcCallerFunction].filter(Boolean).join(".")}` : ""}${fcResolution === "unresolved" ? ` -- path unresolved${fcUnresolvedReason ? `: ${fcUnresolvedReason}` : ""}` : ""}`
     : "";
 
-  return `${fact.type} in ${module}${sub}: ${sym}${values}${managesDoc}${implementsInterfacesDoc}${returnsDoc}${apiContractDoc}${callExpressionDoc}${kotlinCallResolutionDoc}${kotlinCallArgumentsDoc}${firebaseCallableCallDoc}${routeDefinitionDoc}${pubsubOperationRouteDoc}${pubsubEventRouteDoc}${angularRouteDoc}${angularComponentDoc}${angularInjectableDoc}${angularTemplateAttributeDoc}${modelPropertyDoc}${importsDependencyDoc}${enumDeclarationDoc}${tsEnumDeclarationDoc}${swiftEnumDeclarationDoc}${swiftInheritanceDoc}${extensionDeclarationDoc}${sealedHierarchyDoc}${composableDoc}${functionOwningClassDoc}${constructorPromotedDoc}${bleGattDoc}${usbWireConstantDoc}${webrtcTouchpointDoc}${exportRegistryEntryDoc}${firestoreClientCallDoc} (${loc})`;
+  return `${fact.type} in ${module}${sub}: ${sym}${values}${managesDoc}${implementsInterfacesDoc}${returnsDoc}${apiContractDoc}${callExpressionDoc}${kotlinCallResolutionDoc}${kotlinCallArgumentsDoc}${firebaseCallableCallDoc}${routeDefinitionDoc}${pubsubOperationRouteDoc}${pubsubEventRouteDoc}${angularRouteDoc}${angularComponentDoc}${angularInjectableDoc}${angularTemplateAttributeDoc}${modelPropertyDoc}${importsDependencyDoc}${enumDeclarationDoc}${tsEnumDeclarationDoc}${swiftEnumDeclarationDoc}${swiftInheritanceDoc}${extensionDeclarationDoc}${sealedHierarchyDoc}${composableDoc}${functionOwningClassDoc}${constructorPromotedDoc}${bleGattDoc}${usbWireConstantDoc}${webrtcTouchpointDoc}${exportRegistryEntryDoc}${firestoreClientCallDoc}${pubsubPublishCallDoc} (${loc})`;
 }
 
 function pool(): Pool {
```

### Coordinator note 2026-09-26 (about 17:10 UTC): Lane A's `descriptionFor` APPROVED into the shared tree; W4d numbers reproduced and approved for a Lane A turn after W2

- **`descriptionFor` (Lane A's FINAL text, `sync-facts.ts` v1.1.0 -> v1.2.0, one block only): APPROVED to enter the shared tree now** (code only, no write turn needed: no lane holds one). Basis: Lane A's regression reproduces the stored description of **69,643 of 69,643 live facts (0 differ)**, so nothing is re-described until Lane B's W2 payloads are synced; the 14 held-run descriptions total about 1,744 tokens (inside the pre-approved 1.5k to 2k); each states that the topic comes from the repository's committed `.env` files, not the deployed runtime. Lane A copies the file over `sync-facts.ts`, re-runs the regression against the SHARED file, posts the result, and tells Lane B.
- **W4d numbers independently reproduced (coordinator, read-only):** the dev copy `_dev-w4d-build-cross-repo-edges.ts` (v1.11.0) with `--join=firestore-client-trigger,firestore-client-access --dry-run` against the live database (`PG_DATABASE` explicit, nothing written; live still 17,810 edges and no `attributes` column): **`FIRESTORE_CLIENT_TRIGGER` 19 resolved (Angular 2, Swift 17), reaching 5 handlers; `FIRESTORE_CLIENT_ACCESS` 266 = 242 resolved + 24 unresolved (Angular 29 = 27 + 2, Swift 237 = 215 + 22): 285 new rows, identical to Lane A's figures.** Lane A's scratch proofs (ALTER leaves all 17 existing slice fingerprints and `edge_sync_state` identical; the real orchestrator on a scratch copy gives 21 slices ok, 0 dangling, idempotent over three runs; `findGraphNeighbors`/`walkBoundedCluster` work on the new types; dump/restore round trip with the new column) are accepted.
- **W4d approved for a Lane A write turn, AFTER Lane B's W2 turn is released** (the two turns are serialized and must not interleave; the shared builder is replaced only inside Lane A's turn). Expected totals must be recomputed on the state after W2: total edges after W2 = 17,807 (the `PUBSUB_TOPIC_BINDING` slice shrinks 25 -> 22 by design), so after W4d **18,092 = 17,807 + 285**, 21 `edge_sync_state` slices ok, FIELD_BINDING 13, 0 dangling, the 17 pre-existing slices byte-identical except the pubsub slice changed by W2.
- **Separate small follow-up (recommended, to be decided after W4d is validated):** the existing `firestore-trigger` join could also use `coalesce(callerName, enclosingMemberName)` so the previously unattributable trigger gets edges (its slice would grow from 31 by a few edges). Kept out of W4d on purpose so the W4d turn can prove every existing slice byte-identical.

### 2026-09-27: [Lane A] `descriptionFor` (sync-facts.ts v1.2.0) is IN the shared tree; regression run against the SHARED file (posted late: the copy and the run were done on 2026-09-26 after the 17:10 UTC approval, the entry was not written then). Read-only, no DB write, no `EMBED`, no `git add`/`git commit`

Session `-29`. `_dev-sync-facts.ts` was copied over `pipeline/facts-postgres-index/sync-facts.ts` (now v1.2.0; the change is the single block and its slot in the return string, as in the approved diff) and the `_dev-sync-facts.ts` copy deleted. **Regression against the shared file itself** (read-only, `PG_DATABASE=facts_index`, `SELECT current_database()` shown): **69,643 of 69,643 stored descriptions reproduced, 0 differ, 9 repos**, re-run again this morning with the same result. **Against Lane B's held W2 run `20260926_134105-00e1d9fd`** (payloads read from its capability packs): all **14** publish-fact descriptions change relative to live, total 6,962 characters, about **1,741 tokens** at chars/4 (inside the pre-approved 1.5k to 2k). Live at the time of this entry: 69,643 facts, 17,810 edges (W2 not yet applied), no `attributes` column, databases `facts_index`, `facts_index_prebuild`, `postgres` only. The only `_dev-` file left is the untracked `_dev-w4d-build-cross-repo-edges.ts` (unchanged since the approved dry-run). **Lane B can re-run its gate with the final text.** W4d waits for Lane B's W2 turn to be released; expected totals for my turn: 17,807 edges before, 18,092 after (17 pre-existing slices byte-identical except the pubsub slice, 21 `edge_sync_state` slices ok, FIELD_BINDING 13, 0 dangling).

### 2026-09-27: [Lane B] W2 READY TO SYNC (updated): gate re-run with the FINAL descriptions (shared `sync-facts.ts` v1.2.0). Read-only; no extraction, no DB write, no `git add`/`git commit`

Held run unchanged: **`20260926_134105-00e1d9fd`** (firebase, pinned `00e1d9fd`). Confirmed just now: `output/firebase-oskey-dev/run-context.json` points at it; the DB's current firebase run is the W4e run `20260926_132249-00e1d9fd`; live DB **69,643 facts, 17,810 edges, 0 without an embedding, no active sessions** (unchanged since W4e); the shared `sync-facts.ts` is v1.2.0 and contains Lane A's publish-fact description block. No code or config was changed by me since the W2 held-run entry.

**Gate (firebase, held run vs `facts.fact_id`, live `descriptionFor` v1.2.0):**

| | count |
|---|---|
| DB facts / run facts | 15,453 / 15,453 |
| **identical IDs** | **15,453** |
| **new / would be pruned** | **0 / 0** |
| existing values changed (excluding `runId`) | **only on the 10 publish facts**: `value`, `evidence.value`, `evidence.confidence`, `evidence.topicResolutionStatus` (10 each) |
| **description changes** | **14, all `external_hook`** (the 10 resolved + the literal + the 3 plumbing) |
| **to embed** | **14** = access_control_device 2 (840 chars), building 4 (2,337), core 8 (3,785); **6,962 characters, about 1,741 tokens by chars/4** (inside the pre-approved 1.5k to 2k) |

The additive keys are as in the first W2 entry (14 publish facts: `legacyValue`, `topicName`, `topicNameStatus`, `topicNameReason`, `topicSource`, `publishRole`, `orderingKeyExpression`, `topicResolvedVia`; 7 also `wrapperMethod`, `wrapperDeclarationFile`). Lane A's field-name check against this run matches what the block reads.

**Turn plan unchanged (accepted by the coordinator):** (1) preconditions + gate re-run; (2) `pg_dump` `facts_index-2026-09-27-before-W2.dump` + `pg_restore -l`; (3) sync 15 modules, `EMBED` unset: expected 0 new / **need embedding 2, 4, 8 for access_control_device, building, core** / 0 removed, all other modules 0/0/0 (stop and ask if any differs); (4) read-only check (69,643 facts; firebase 15,453 at the held run; exactly 14 without an embedding); (5) `EMBED=true` for those three modules only after the user confirms directly (about 1,741 tokens); (6) per-slice snapshot, then `node -r ts-node/register pipeline/facts-postgres-index/build-cross-repo-edges.ts --join=pubsub-binding --accept-shrink` (that one join), then plain `npm run pipeline:edges`; expected `PUBSUB_TOPIC_BINDING` 25 → 22, total 17,810 → 17,807, the 10 new resolved edges (accesses 5, intercomEntries 4, configurations 1) into node-iot, 4 unresolved firebase publish edges (3 plumbing + the literal), every other slice byte-identical, 0 dangling, all `edge_sync_state` slices ok.

### Coordinator note 2026-09-27 (about 06:30 UTC): status after the coordinator session gap; Lane B's W2 turn granted

- **Status replies received:** Lane A (descriptionFor copied into the shared tree as `sync-facts.ts` v1.2.0, shared-file regression 69,643 of 69,643 identical, the 14 held-run descriptions about 1,741 tokens; W4d dev copy `_dev-w4d-build-cross-repo-edges.ts` untouched and the only `_dev-` file left; no scratch databases; no other change to the shared tree), Lane B (W2 gate re-run with the final v1.2.0 descriptions: 15,453 identical, 0 new, 0 pruned, existing values changed only on the 10 publish facts, description changes on all 14, embed 14 facts, 6,962 characters, about 1,741 tokens; firebase `run-context.json` = held run `20260926_134105-00e1d9fd`; DB current firebase run = the W4e run), Lane C (idle, nothing unfinished; assigned two read-only investigations: Step U and `swift-ai-kit`). **Corrections noted:** the 151 dangling `INTRA_REPO_CALL` edges were cleared by Lane A's W5a rebuild, not by W4c.
- **Coordinator's own check of the shared state:** live database unchanged since 2026-09-26 13:26 UTC (69,643 facts, 17,810 edges, 0 missing embeddings, no active sessions); shared `sync-facts.ts` v1.2.0, shared cross builder v1.10.0 (no W4d code).
- **WRITE TURN GRANTED: Lane B W2** (exclusive; Lanes A and C read-only). Held run `20260926_134105-00e1d9fd`, gate validated twice (before and after the final descriptions). Expected: sync 15 modules with 0 new / 0 removed and 14 facts needing embedding; embed 14 facts, about 1,741 tokens (pre-approved 1.5k to 2k); `PUBSUB_TOPIC_BINDING` slice 25 -> 22 (unknown-source rows 9 -> 6, resolved edges 1 -> 11), total edges 17,810 -> 17,807, every other slice byte-identical.
- **Also found (not in scope of any current item):** `ios-oskey-dev` depends on `swift-ai-kit-oskey-io` (it imports `SwiftRecognition` in 4 face-recognition files) but the kit is not registered, so those imports are classified `external_or_unresolved`; it is a 4-file kit. Scoping was assigned to Lane C for the user to decide.

### 2026-09-27: [Lane B] W2 DONE (numbers) and write turn released

Turn `WRITE TURN GRANTED: Lane B W2` (exclusive; last write-turn-log line was that grant). Sequence exactly as in the READY TO SYNC (updated) entry. No `git add`/`git commit`; no `gcloud`; no `DROP`/`TRUNCATE`/hand-written `UPDATE`/`DELETE`; no command was denied.

1. **Preconditions:** `run-context.json` = `20260926_134105-00e1d9fd`; live DB 69,643 facts, firebase 15,453, 17,810 edges, 0 without an embedding, no active sessions, current firebase run = the W4e run. **Gate re-run just before the turn:** 15,453 identical / 0 new / 0 pruned / 14 description changes / 1,741 tokens by chars/4.
2. **Dump:** `output/backups/facts_index-2026-09-27-before-W2.dump` (278,299,759 bytes, gitignored, `pg_restore -l` lists 57 entries). Restore point (`before-W2`).
3. **Sync, `EMBED` unset, 15 modules** (the loop stops on any deviation and did not): **0 new / 0 removed on every module; need embedding: access_control_device 2, building 4, core 8**, all others 0.
4. **Read-only check before embedding:** facts 69,643 (unchanged); firebase 15,453 all at `20260926_134105-00e1d9fd`; **exactly 14 firebase facts without an embedding** (2 / 4 / 8); current firebase run = the held run; edges still 17,810.
5. **Embedding (user confirmed directly in the window):** `EMBED=true` for access_control_device, building, core only. 14 embedded. **Actual tokens from `embedding_calls` (call_ids 1137-1139, `gemini-embedding-2`): 1,868 total (218 + 640 + 1,010),** none truncated; inside the pre-approved 1.5k-2k (chars/4 said 1,741). Facts without an embedding afterwards: 0 (whole DB).
6. **Edges:** per-slice snapshot of all 17,810 rows taken first. **Dry run of the join** (`build-cross-repo-edges.ts --join=pubsub-binding --dry-run --accept-shrink`, `PG_DATABASE=facts_index`) matched the prediction exactly (firebase slice 14 → 10 resolved + 4 unresolved; unknown slice 9 → 6, the shrink being exactly the 3 topic-only rows for accesses, configurations, intercomEntries); then the real run of **that one join** (`--join=pubsub-binding --accept-shrink`, exit 0: removed 14 + 2 + 9, inserted 22); then a plain `npm run pipeline:edges` (exit 0, shrink guard silent, 0 dangling on every status, **all 17 `edge_sync_state` slices `ok`**, `FIELD_BINDING` 13 → 13).

**Edge results (row-by-row before vs after, content hash included): 17,810 → 17,807 (−3).** Only two slices differ: `PUBSUB_TOPIC_BINDING` / firebase-oskey-dev and / unknown; **every other slice is byte-identical** (all 15 other (connection_type, source_repo) groups). **`PUBSUB_TOPIC_BINDING` 25 → 22:** firebase → unknown 14 unresolved → **firebase → node-iot 10 resolved** + firebase → unknown **4 unresolved**; unknown → node-iot 3 unresolved → **0**; node-iot → firebase 1 resolved (the `accessControlDevice_activities` edge) unchanged; node-iot → unknown 1 unchanged; unknown → unknown 6 unchanged. Removed 13 rows (10 + 3), added 10; no resolved edge lost.
- **The 10 new resolved edges (all with a target route fact, staging stated in `details`):** `accessControlDevice_accesses` **5** → `POST /access-control-devices/pubsub/accesses` (`access.controller.ts:71` origin; `access_message_publisher.service.ts:136,169,192,225` via_wrapper); `accessControlDevice_intercomEntries` **4** → `POST /access-control-devices/pubsub/intercom-entries` (`building_intercom.controller.ts:62` origin; `building_intercom_message_publisher.service.ts:24,56,64` via_wrapper); `accessControlDevice_configurations` **1** → `POST /access-control-devices/pubsub/configs` (`access_control_device_config.controller.ts:92` origin). No edge symbol is an ordering key or device id.
- **The 4 unresolved firebase publish edges:** the literal `accessControlDeviceConfigs` at `access_control_device_public_keys.controller.ts:84` ("resolved in source, but it is not among the 11 topics in the snapshot, so no binding exists to follow"; probable dead path, unverified) and the 3 plumbing sites (`message.controller.ts:31`, `document_and_message.controller.ts:75`, `:156`).
- **Two cosmetic notes for Lane A (join text; not changed, the approved design said the join needs no change):** the 3 plumbing edges still read "a pass-through parameter at this call site, not a literal" (Lane C's proposal was to say the topic is a parameter of a shared publish method with the concrete topic on its callers); the resolved edges' `details` do not name the fact kind (`external_hook` with `evidence.type = pubsub_publish_call`), which only mattered for the "no publisher fact" rows that are now gone.

**What W2 delivered (acceptance):** 14 facts still 14, IDs identical (15,453); `topicNameStatus = resolved` on 11 (10 to a staging topic + the literal), `plumbing` on 3; every device-id-as-topic is gone (0 publish facts with an ordering key as `value`); firebase → node-iot 10 resolved with non-null targets; at most 4 unresolved (exactly 4); the `activities` edge unchanged; slice 22 rows; every other slice identical; 0 dangling; staging stated. The value is what the repository's committed `functions/.env` says, not the deployed runtime.

**State left behind:** live DB = post-W2 (69,643 facts, 17,807 edges, 0 without an embedding, firebase current run `20260926_134105-00e1d9fd`). Restore point `facts_index-2026-09-27-before-W2.dump`. Scratch files deleted. Nothing running. Next: Lane A's W4d turn.

- 2026-09-27 (Lane B): write turn released. Requesting `WRITE TURN RELEASED: Lane B W2` from the coordinator.

### Coordinator note 2026-09-27 (about 07:10 UTC): Lane B's W2 validated and released; Lane A's W4d turn granted

- **W2 independently validated (coordinator, read-only):** every edge column except `edge_id`/`synthesis_id`/`generated_at`, per `(connection_type, source_repo)` slice, compared between `facts_index-2026-09-27-before-W2.dump` and the live table: **15 of 17 slices byte-identical; the only differences are the two Pub/Sub slices, exactly as designed:** `PUBSUB_TOPIC_BINDING firebase-oskey-dev` 14 -> 14 (10 unresolved rows replaced by **10 resolved firebase -> node-iot edges**: `POST /access-control-devices/pubsub/accesses` 5, `.../intercom-entries` 4, `.../configs` 1; 4 unresolved remain = 3 plumbing + the literal `accessControlDeviceConfigs`) and `PUBSUB_TOPIC_BINDING unknown` 9 -> 6 (the 3 topic-only rows now represented by publisher edges). Slice by status now: firebase -> node-iot resolved 10, firebase -> unknown unresolved 4, node-iot -> firebase resolved 1, node-iot -> unknown unresolved 1, unknown -> unknown unresolved 6. Live: 69,643 facts (unchanged), **17,807 edges**, 0 missing embeddings, 0 dangling, 0 duplicate pairs, `edge_sync_state` 17 slices with 0 dangling; firebase current run `20260926_134105-00e1d9fd`; **0 publish facts still carry a device id as their value**. Embedding: 3 calls, 14 facts, 1,868 tokens, none truncated (approved 1.5k to 2k). The wiki's acceptance holds: at most 4 firebase publish edges unresolved, none with a device id as its topic.
- **WRITE TURN RELEASED: Lane B W2.** No write turn is open.
- **WRITE TURN GRANTED: Lane A W4d** (exclusive; Lanes B and C read-only). Preconditions: 17,807 edges, 69,643 facts, no active sessions, shared builders as approved (`sync-facts.ts` v1.2.0, cross builder v1.10.0), W4d dev copy v1.11.0 untouched since the approved dry-run. Expected: `attributes jsonb` column added (nothing else in the DDL); total **18,092 = 17,807 + 285** (19 trigger edges, 242 resolved + 24 unresolved access rows); `edge_sync_state` 21 slices ok; FIELD_BINDING 13; 0 dangling; the 17 pre-existing slices byte-identical to their state at the start of the turn (the Pub/Sub slices are already in their W2 state).
- **Cosmetic join-text notes from Lane B (queued for Lane A, not part of this turn):** the 3 plumbing publish edges still say "a pass-through parameter at this call site", and the resolved Pub/Sub edges' `details` do not name `external_hook`.

### 2026-09-27: [Lane A] W4d write turn STARTED (granted in the write-turn log above). SQL pasted before applying; rollback dump taken
Rollback: `output/backups/edges-2026-09-27-before-W4d.dump` (table-only: `cross_repo_edges` + `edge_sync_state`, 715,751 bytes; `pg_restore -l` lists both tables and both TABLE DATA entries). Pre-turn per-slice snapshot taken (17 slices; `edge_sync_state` 17 rows, md5 `58f06abc…`). The one schema statement, exactly, and nothing else (no default, no index, no drop):
```sql
ALTER TABLE cross_repo_edges ADD COLUMN IF NOT EXISTS attributes jsonb;
```

### 2026-09-27: [Lane A] W4d APPLIED and verified live (results)

Session `-29`. Sequence run inside the granted turn: table-only dump; the ALTER (pasted above); `edge-attributes.sql` created and the same statement appended to `schema-proposal.sql`; `build-cross-repo-edges.ts` replaced by the approved copy (v1.11.0, `require.main` guard included) and the `_dev-w4d-...` file deleted (no `_dev-` file remains); then plain `npm run pipeline:edges` (all three steps, exit 0, no permission prompt or denial). No `sync-facts.ts`, no `EMBED`, no `git add`/`git commit`, no `DROP`/`TRUNCATE`/hand-written UPDATE/DELETE.

**Verification against the per-slice snapshot taken immediately before the turn (after W2; content md5 excludes edge_id/synthesis_id/generated_at):**
- **The 17 pre-existing slices are byte-identical** (the diff of the two 17-slice snapshots contains only the four new lines).
- **The 4 new slices appear with the expected counts:** `FIRESTORE_CLIENT_TRIGGER` angular-app-oskey-io **2**, swift-cloud-kit-oskey-dev **17**; `FIRESTORE_CLIENT_ACCESS` angular-app-oskey-io **29** (27 resolved + 2 unresolved), swift-cloud-kit-oskey-dev **237** (215 resolved + 22 unresolved). Their fingerprints equal the ones the scratch run produced (`5c83053f…`, `f2963543…`, `48cc39c3…`, `ef459a3b…`).
- **Total edges 18,092** (= 17,807 + 285). FIELD_BINDING **13**. **Dangling source/target 0**; resolved/confirmed edges without a live target 0. `edge_sync_state` **21 rows, all 21 slices ok** (0 STALE, 0 UNRECORDED). Facts untouched (69,643). The new column: `attributes jsonb`, nullable, no default; set on 285 rows only (`FIRESTORE_CLIENT_ACCESS` 266, `FIRESTORE_CLIENT_TRIGGER` 19), NULL on the other 17,807.
- **Structured flags present:** `pathShapeMismatch` on **5** edges, all from `OSKCKUserInvitationService.swift:157` (one per invitations writer method); `placeholderMismatch` on **5** edges, all from `OSKCKUserBuildingAccessService.swift:64` (template `buildingId`, source `accessId`). Nothing else carries a flag.
- **`findGraphNeighbors` (the real `mcp-server/db/graph-traversal.ts`, live, read-only), one call per new type:** `FIRESTORE_CLIENT_ACCESS`: source has it outgoing (8 neighbours), target `OSKUserController.create` has it incoming (15); `FIRESTORE_CLIENT_TRIGGER`: source outgoing (10), target `OSKUserService.onDocumentCreated` incoming (9).

**Rollback if wanted:** restore `output/backups/edges-2026-09-27-before-W4d.dump` (table-only; it lacks the column), or revert the W4d hunks in `build-cross-repo-edges.ts` (diff posted earlier) and re-run `pipeline:edges`; dropping the column only with the user's approval.

[Lane A] W4d DONE (numbers) and write turn released

### Coordinator note 2026-09-27 (about 08:30 UTC): Lane A's W4d validated and released

- **Independent validation (coordinator, read-only; scratch database restored from `edges-2026-09-27-before-W4d.dump`, then dropped):** per-slice md5 of every edge column except `edge_id`/`synthesis_id`/`generated_at`/`attributes`, before vs live. **All 17 pre-existing slices are byte-identical** (17,807 rows before). **Exactly 4 new slices, nothing else changed:** `FIRESTORE_CLIENT_TRIGGER` angular 2, swift-cloud-kit 17; `FIRESTORE_CLIENT_ACCESS` angular 29 (27 resolved, 2 unresolved), swift-cloud-kit 237 (215 resolved, 22 unresolved). Total **18,092** (+285). Live: 69,643 facts (unchanged), 0 missing embeddings, 0 dangling, 0 duplicate pairs, FIELD_BINDING 13, `edge_sync_state` 21 slices.
- **`attributes jsonb`:** set on exactly 285 rows (the 4 new slices only; 0 on any other slice). `pathShapeMismatch` on 5 edges (all from `OSKCKUserInvitationService.swift:157`), `placeholderMismatch` on 5 (all from `OSKCKUserBuildingAccessService.swift:64`). The 24 unresolved rows carry reasons: `no_firebase_writer` 21, `path_unresolved` 2, `no_operation` 1. Angular `set` on `/users/{userId}` produces both the create and update trigger edges, with the description saying which one fires.
- The `_dev-w4d-...` file is gone; `build-cross-repo-edges.ts` is v1.11.0 in the shared tree. New untracked pipeline files: `edge-attributes.sql` (plus the earlier `build-edges.ts`, `edge-sync-state.sql`, `_shared/edge-sync-state.ts`).
- **WRITE TURN RELEASED: Lane A W4d.** No write turn is open. Queued for Lane A, each needing its own go: (a) the cosmetic join-text notes, (b) the trigger-join `coalesce(callerName, enclosingMemberName)` follow-up, (c) W6 (with refreshed numbers, user reviews before any live run).

### 2026-09-27: [Lane C] Step U investigation (READ-ONLY: `git fetch origin staging` in the three disposable clones, `git diff`/`git log`/`git grep`, read-only SQL; no checkout, no pipeline run, no edit, no DB write, no git add/commit)

Assigned by the coordinator, user-approved. Clones after fetch: firebase `origin/staging` = `73ea6997`, angular `8345d222`, node-iot `a6cba122`. DB current runs: firebase `20260926_132249-00e1d9fd`, angular `20260926_131550-8345d222`, node-iot `20260923_110250-a6cba122`.

**1. Angular and node-iot: nothing changed upstream.** `origin/staging` equals each run's commit (angular `8345d222`, node-iot `a6cba122`); 0 commits ahead. No re-extract is needed for either; restoring `branch: "staging"` for them is a no-op today.

**2. Firebase: 22 commits ahead, 0 behind** (`00e1d9fd` -> `73ea6997`, 2026-07-06 to 2026-09-25, last one "Merge develop into staging"). 230 files, +12,256 / -6,954; 198 modified, 25 added, 1 deleted, 6 renamed. By area: tests 34 (`test/src`, outside our scan); under `functions/src/modules`: organization 33, user 31, building 26, admin 26, core 19, supplier 12, access_control_device 10, settings 9, apps 7, unit_management 5, tasks 4, call 1 (183 source files in total); plus `index.ts`, `decorators/` 2, `utils/` 2 (+1 new `hybrid_helper.ts`), `package.json` (+`libphonenumber-js`), `firestore/firestore.indexes.json`, docs and one script. Source lines 57,565 -> 60,063. Two themes: a **v1 -> v2 migration of every callable and every Firestore trigger** (commits `4f27348f` ... `139ef281`, `8414b94e` etc., new `core/runtime/v2_callable_options.ts`) and features (CLD1-1489 ACD add/remove/replace `2c7c8ff8`; a CSV resident importer; invitation and notification fixes).

**3. Our extractor dependencies, one by one** (all measured at `00e1d9fd` vs `origin/staging`):
| dependency | upstream change | effect |
|---|---|---|
| `functions/src/index.ts` (W1 registry) | rewritten: factories renamed `get…` -> `getV2…`, `adminTriggers` now a namespace import, group order changed, **new group `tasks`** from a relative import `./modules/tasks`; still 11 exported groups of spreads | Lane B's registry code is structural (`01-extract-ast-evidence.ts:760-880`, no group/factory names, relative imports resolved by the compiler), so it should hold; `tasks` maps to the existing `tasks` module. Needs a check in the held run. |
| decorators | both changed (79 and 85 lines: generics, `import type`, v2 `CallableRequest` support, new `OSKHybridHelper`); names/exports unchanged; **`@OSKUserSecurityChecks` applications 140 -> 264**, `@OSKVerifyAccessValid` still 1 | ~124 more decorator-application facts (if W1 emits per application); parser-safe (no new syntax, below) |
| `utils/` | `security_checks.ts` +23/-…, new `hybrid_helper.ts`; `errors_helper.ts` untouched | small |
| callables (`api_contract`) | **every `https.onCall(handler)` became bare `onCall(v2CriticalCallableOptions, handler)`**: 253 v1 -> 260 v2. Extractor matches `onCall` by identifier (`:1149-1153`) and takes `args[1] \|\| args[0]` as the handler (`:1546`), so it copes. Callable set by (module, export name): **-2 removed** (`admin.recreateBuildingAccessFixTokens`, `organization.bulkCreateOrganizationResidents`), **+13 added** (4 acd management callables, `deleteBuilding`, `getOrUpdateCoordonatesAndRnbIdInBuilding`, 3 admin/org getters, `createIntercomCommunication`, `cancelBuildingInhabitantInvitation`, `getInhabitantDetailsById`, `getPendingOrganizationById`, `onMaintenanceCreateOrganizationsResidentsFromCsv`) | No indexed client calls the 2 removed (0 edges, 0 hits in angular/swift clones). None of the 13 added is among the 5 Angular unresolved calls or the 3 dead Swift calls, so the HTTP slices should stay 97/5 (Angular) and 31/3 (swift-cloud-kit), 5 android; 6 callable targets in the renamed folder (below) get new fact IDs and re-resolve on rebuild. |
| **Firestore trigger registrations (W4a)** | 26 of the 28 triggers moved to v2, **and their registration shape is `onDocumentCreated({ document: <path const>, region: 'europe-west1' }, handler)`: the path is a property of an OBJECT LITERAL in arg 0, not a string** (e.g. `access_control_device/index.ts:80-81`, `building_door/index.ts:49-50`, `settings/modules/role/index.ts:37-38`); the 2 remaining v1 are the auth triggers | **BREAKS a W4a assumption.** `01-extract-ast-evidence.ts:1482-1490` treats arg 0 of `onDocument*` as the path (`pathNode = arg0`); `resolvePathValue` (`:314-380`) has no object-literal branch and returns `unsupported:ObjectLiteralExpression`. So all 26 v2 triggers would get `firestorePathStatus: unresolved`, `firestorePath` null, W4a's acceptance ("no trigger has unknown / paths resolved") fails, and the `firestore-trigger` join loses all its trigger paths: **FIRESTORE_EVENT_TRIGGER 17 edges -> about 0 (shrink guard fires)**. The constants themselves are plain literals (`const accessControlDevicePath = '/accessControlDevices/{deviceId}'`), so the fix is small: read the `document` property of an object-literal arg 0, then the existing branches resolve it. The handler is arg 1 (`:1475`), already right. |
| Firestore write wrappers | `document.controller.ts` changed type-only plus returns `path: doc.ref.path`; `_create/_set/_update/_delete/_add` call sites 220 -> 224 | W4a writer-path logic holds |
| arrow-function class properties | 4 -> 5 | negligible |
| publish wrappers (W2) | signatures unchanged (`access.controller.ts:90`, `building_intercom.controller.ts:60`, `document_and_message.controller.ts:74,155`, `message.controller.ts:18`); publish call lines 16 -> 16; `building_intercom_message_publisher.service.ts` only null-safety edits; `access.controller.ts` gained two methods (line shifts) | W2 assumptions hold |
| `functions/.env` and `.env.*` | **unchanged** | W2 env table unaffected |

**4. Consequences (predicted).**
- **Renamed folder:** `organization/modules/organization_intercom_ communication/` (with a space) -> `organization_intercom_communication/` (6 files, incl. its callables). **546 live facts** sit in those files; the file path is part of every fact ID and the submodule name changes, so all 546 get new IDs (old ones pruned, embeddings lost) and 6 HTTP_API_CALL edge targets (Angular's intercom-communication callables) plus 88 edge endpoints in total in renamed files are re-pointed by a rebuild. Deleted: `building_pincode_trash.service.ts` (2 facts).
- **Facts:** of 15,453 live firebase facts, mapping each fact's line through the diff hunks: **6,535 (42%) in untouched files**, 2,187 (14%) in touched files but at the same line, **4,759 (31%) shifted line**, **1,970 (13%) inside a changed region** (modified or removed, so many will be pruned and replaced), 2 in the deleted file. By module the largest are organization (1,757 affected), user (1,324), admin (937), building (877), core (743). New facts: about 9,188 added source lines at the repo's density (0.27 facts per line) suggests about +1.5k to +2.5k new facts, net roughly +600 (+4%, about 16.1k facts).
- **Embed volume:** descriptions end in `(file:line)`, so every shifted and modified fact changes description: about 4.8k (shifted) + 1.0k to 2.0k (modified survivors) + up to ~450 more in the renamed folder + new facts, i.e. **about 7k to 9k facts, roughly 0.55M to 0.85M tokens** (rule of thumb 70 to 95 tokens per fact; android's 3,631 facts cost 250,784). Flag and ask before it, as always.
- **AST risk at tolerance 0: low.** Scan of the 9,188 added source lines: no `satisfies`, `using`, `accessor`, `<const`, `??=`, `||=`, `&&=`, import attributes; the 126 `@X(` are the existing decorator style; 16 `import type` (already valid); TypeScript pin unchanged (`^5.6.2`), `firebase-functions` `^6.4.0` unchanged, `tsconfig` unchanged. The new dependency `libphonenumber-js` only adds an import that the compiler may not resolve (a declaration-resolution gap, not a syntax error). A syntax-only parse of the 183 changed files in the held run would prove it at no cost.
- **Edges likely to dangle until `pipeline:edges` rebuilds** (edge endpoints on firebase facts: 2,475 in touched files, 88 in renamed files, 2,397 in untouched files; IDs contain the file but not the line, so shifted-only facts keep their IDs): INTRA_REPO_CALL (2,372) most affected, HTTP_API_CALL targets (6 renamed), FIRESTORE_EVENT_TRIGGER (17, and see the object-literal break), PUBSUB (fine if W2 is in). Dangling is transient (between sync and rebuild) and the shrink guard/`edge_sync_state` catch a real drop.
- **Other W-item assumptions:** W1 export registry (see table), W2 publish and env (hold), W3/W4b/W4e Angular (repo unchanged, hold), W4c Swift and W5 (independent). New callable `createAccessControlDevice`, `deleteAccessControlDevice` etc. are new client-facing names with no client yet.

**5. Recommendation (order of work).**
1. **Angular and node-iot: no action** (no upstream change). Restore `branch: "staging"` in `config/repos.json` for them in the same edit as firebase, as a no-op.
2. **Prerequisite (Lane B, before any run):** make the trigger path extraction read `document` from an object-literal arg 0 for `onDocument*` (keeping the string-arg case), with a unit test on the three shapes above; nothing else in the extractor needs a change.
3. **Firebase: advance to the latest `staging`, `73ea6997`, as one step** (do not stop at an intermediate commit: the 22 commits are one migration plus features; a midpoint mixes v1/v2 in ways the extractor has never seen), **pin that exact SHA in `config/repos.json` for the held run, gate and write turn** so a further push cannot move the target mid-step, and restore the floating `branch: "staging"` only after validation as a separate decision. Then: held run (files only), a syntax-only parse report first, the pre-sync gate (expect real ID changes: ~546 renamed + pruned/new from ~1,970 modified regions + ~264-140 decorator/application facts), a write turn with dump, sync `EMBED` off, flagged embed, `pipeline:edges` and validation, then tell the wiki team (their reference commit changes; the renamed folder, 2 removed and 13 added callables, v2 trigger paths).
4. Repo order: firebase only, since the other two did not move.

**Questions for the user:** (a) approve pinning firebase to `73ea6997` for Step U, and restoring `branch: staging` afterwards as its own decision? (b) approve Lane B fixing the v2 object-literal trigger path first (a small W4a follow-up; without it W4a acceptance fails and FIRESTORE_EVENT_TRIGGER goes from 17 edges to about 0)? (c) accept a firebase embed of roughly 0.55M to 0.85M tokens (about 7k to 9k facts)? (d) is upstream still moving (22 commits in 2.5 months, last merge 2026-09-25); should the team freeze on `73ea6997` for the duration? (e) which of W2's Lane B work should land before or after Step U (they are independent, but two firebase re-extracts in a row means two write turns and two embed rounds)? Suggest **W2 first, then Step U**, so W2's 14 description changes are not embedded twice; or fold W2 into the Step U held run if Lane B is ready.

### 2026-09-27: [Lane C] swift-ai-kit-oskey-io scoping (READ-ONLY; nothing run, nothing edited, no DB write, no git add/commit)

**What it is.** SPM package `OSKAIKit` (swift-tools-version 5.10, iOS 15 / visionOS 1), pinned by iOS at `1.1.2` = `cee618a81d1776d87741fdf00de6276eee9fceb6` (`Package.resolved`, `project.pbxproj:4688`, requirement `upToNextMajor 1.0.0`); the clone is at exactly `cee618a`. Targets: 5 binary xcframeworks (ncnn, opencv2, MoltenVK, glslang, openmp: headers only, under `Frameworks/`, outside `Sources/`), a **C++ target `CxxRecognition`** (`MTCNN.cpp/.hpp`, `FaceEmbedder.cpp/.hpp`, `OSKImageBridge.mm/.h`: about 1,500 lines, on-device MTCNN face detection and embedding) and the **Swift target `SwiftRecognition`** (2 files, 228 lines: `OSKAIKit.swift` 189, `UIImage+Preparation.swift` 39, `interoperabilityMode(.Cxx)`). The only product is `OSKAIKit` -> `SwiftRecognition`.

**What iOS actually uses.** 4 files import `SwiftRecognition` (`FaceEmbedder.swift:16`, `OSKRecognitionCameraView.swift:19`, `OSKCameraView.swift:18`, `OSKAccessMethodView.swift:16`); the last one imports it but uses none of its API (it only instantiates iOS's own `OSKFaceRecognitionView`, `:133`). Real call sites into the kit: **7 static calls on `OSKFaceRecognition`** (`FaceEmbedder.swift:29 extractEmbedding, :33 extractEmbeddingWithRect, :44 detectFace`; `OSKCameraView.swift:126 getLastLandmarks, :186 reset, :349 initialize`; `OSKRecognitionCameraView.swift:156 initialize`) plus 2 uses of the `UIImage` extension (`.fixedOrientation().resized(maxDimension:)` at `OSKCameraView.swift:373`, `OSKRecognitionCameraView.swift:167`). 7 of the kit's 12 public statics are used (`cleanup`, `isModelLoaded`, `getLastDetectedFace`, `getLastDetectedFaceCount`, `initializeFromMainBundle`, `debugTestDetection` are not). Business meaning: on-device face recognition as a door-unlock access method (`Presentation/FaceRecognition/`, `AccessMethods/`).

**Could the Swift extractor index it? Yes for the Swift wrapper, no for the C++ core, by design.** `00-scan-repo.ts:280-360` discovers every directory under `Sources/` as a module and collects only `.swift` files, so `SwiftRecognition` yields 2 files; `CxxRecognition` is discovered as a module but has **0 Swift files** (its `.cpp/.hpp/.mm/.h` are never parsed). The scan's own header (`:270-278`) already cites this repo as the two-module case that made discovery dynamic. **Not tested by me** (a parse of the 2 files is a seconds-long extraction; I did not run one under the read-only rule). One real unknown to test first: whether steps 02 to 07 cope with a module that has zero files (`CxxRecognition`); the sync must simply skip that module (no packs, 0 facts). `astErrorTolerancePercent` 0 should be fine: the 2 files use ordinary Swift (the Cxx interop is a build setting, not syntax).

**What registering would take** (all Lane C's files except two): (1) `config/repos.json`: a new `swift-ai-kit-oskey-io` entry copying the other kits' shape (`gitUrl` https, `commit` `cee618a…` pinned to what iOS's `Package.resolved` pins, `modulesRoot: "Sources"`, `astTool: SwiftSyntax`, tolerance 0); (2) a `pipeline:swift-ai-kit` script in `package.json` (the same chain as the other kits; **`package.json` is Lane A's file**); (3) extract the kit (files only), then **re-extract `ios-oskey-dev`** so its 4 imports become `resolved_cross_repo` and its calls with root `OSKFaceRecognition` resolve via `declarationRepo` (cross-repo resolution reads sibling `facts/modules.json`, `01-extract-ast-evidence.ts:112-170`; the class is `public final`, so it is visible); (4) pre-sync gate on ios, a write turn: dump, sync the kit's `SwiftRecognition` module and ios's 3 modules with `EMBED` off, flagged embed, `pipeline:edges`. The PACKAGE_SYMBOL_USE join is generic (`build-cross-repo-edges.ts:796`, discovers source repos from the call facts), so no join change.

**Expected result.** New facts in the kit: about 80 to 130 (2 source files, about 4 structs, 1 class, 1 extension, ~15 functions, ~15 properties, ~40 calls, imports). iOS: same 25,458 IDs; the 4 import facts and the 7 kit calls change payload (`resolvedTargetRepo`, `declarationRepo`, `declarationFile`, `resolutionMethod`), and only some descriptions (call facts that print their resolution), so about 10 to 15 iOS facts to re-embed. **PACKAGE_SYMBOL_USE: 389 -> about 396** (one resolved edge per resolved call, target = the class `OSKFaceRecognition` fact, exactly one primary declaration); the two `UIImage` extension calls stay unresolved (variable receiver, extension), as for every kit. Slices otherwise unchanged; ios `INTRA_REPO_CALL` unchanged.

**Cost.** Zero LLM spend. Embed about 100 to 145 facts, roughly 10k to 14k tokens. Effort: small, about one focused session for a Swift lane (config entry, one extraction and one ios re-extraction, gate, one write turn), needing Lane A only for the `package.json` script. Risk: low. It completes the iOS -> kit dependency picture (4 of the 5 kits are linked today; this is the fifth), for a feature (face recognition) that is real but small. **Suggestion:** after Step U (its write turn is exclusive and higher priority); the user decides whether it is worth a turn. Question: register it, and if so before or after Step U?

### 2026-09-27: [Lane A] Queue items (a) and (b) as DRY-RUN results in two separate copies, for the coordinator's review. Nothing in the shared tree, no live write, no `git add`/`git commit`, no `sync-facts.ts`, no `EMBED`

Session `-29`. Two independent, untracked copies of the shared builder (v1.11.0), each a single small change, type-checked: `pipeline/facts-postgres-index/_dev-a-build-cross-repo-edges.ts` (a: join wording) and `_dev-b-build-cross-repo-edges.ts` (b: trigger-join attribution). They touch different hunks, so either can go in alone or both in sequence (each diff is against the then-current shared file). Live at the time: 69,643 facts, 18,092 edges, no write turn open. Row-level proofs ran on a scratch database `facts_index_join_scratch` restored from a fresh read-only dump of live (dropped afterwards; `facts_index_prebuild` untouched; `PG_DATABASE` explicit and `current_database()` checked).

**(a) Join wording (`pubsub-binding` join only), DETAILS COLUMN ONLY.**
- Changes: (1) an unresolved publish edge whose fact carries Lane B's `topicNameStatus` now says `The topic is not a concrete name at this publish site (topicNameStatus: <status>: <topicNameReason>)` plus, when `publishRole = plumbing`, `; this is a shared publish method, so the concrete topic is recorded on the facts of the code that calls it, not here.`; a fact without those fields (node-iot's) keeps the old text unchanged; (2) a resolved edge's details now read `...; publish site (external_hook fact, evidence.type = pubsub_publish_call) of topic '...' -> subscription ...`; (3) the "no fact on the publishing end" text and its counts sentence name the right kind (`external_hook` fact with `evidence.type = pubsub_publish_call`, not a kind called `pubsub_publish_call`, which was the wiki's F8 misreading). Three new `CONTRACT` constants (`topicNameStatus`, `topicNameReason`, `publishRole` = `plumbing`).
- **Dry run against live:** the slice counts are unchanged: firebase 14 (10 resolved, 4 unresolved), node-iot 2 (1, 1), unknown 6 (6 unresolved) = 22 rows.
- **Before/after on scratch, every column compared:** **all 22 rows are identical in every column except `details`** (source/target repo, symbols and fact ids, connection type, status, provenance, confirmed_via all equal). **14 rows' details change: 10 firebase resolved + 1 node-iot resolved (the new "publish site (external_hook fact, ...)" wording) and the 3 firebase plumbing unresolved rows (the new reason)**; the other 8 (the literal `accessControlDeviceConfigs` unresolved, node-iot's unresolved, and the 6 unknown-source rows) are byte-identical. Example, a plumbing row: was "Topic name not statically resolvable in source (topicResolutionStatus: unsupported) -- a pass-through parameter at this call site, not a literal." now "The topic is not a concrete name at this publish site (topicNameStatus: pass_through_parameter: `topic` is a parameter of the enclosing method; the concrete topic is supplied by its callers); this is a shared publish method, so the concrete topic is recorded on the facts of the code that calls it, not here."
- Expected at a live turn: PUBSUB_TOPIC_BINDING 22 rows before and after; total edges unchanged (18,092); all 21 `edge_sync_state` slices ok after `pipeline:edges` (the slice is rewritten with new details only); every other slice byte-identical.

**(b) `firestore-trigger` join: attribution with `coalesce(callerName, enclosingMemberName)` and `coalesce(callerStartLine, enclosingMemberStartLine)` (W4e), one query, 7 changed lines.**
- **Predicted delta, exact:** `FIRESTORE_EVENT_TRIGGER / firebase-oskey-dev` **31 → 32** resolved edges, reaching **17 of 26** triggers (was 16); **no other slice changes; total edges 18,092 → 18,093.** The dry run against live and the scratch run agree (32; "0 more had no single enclosing method fact", was 1).
- **Scratch row-level result:** **the 31 existing rows are present and byte-identical (31 of 31)**; exactly 1 new row: `functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device.controller.ts:50 OSKBuildingDoorAccessControlDeviceController.set` → `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated` ("fires as create if the document is new, as update if it exists. Write: _set(collectionPath = /buildings/{buildingId}/doors/{doorId}/accessControlDevices) at ...controller.ts:57"), i.e. the previously unattributable trigger `create /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` now has its edge. The 9 still-unreached triggers are the 7 path mismatches and the 2 `onDelete` triggers with no wrapper writer.
- Expected at a live turn: as above, `edge_sync_state` 21 slices ok after `pipeline:edges`, FIELD_BINDING 13, 0 dangling, the other 20 slices byte-identical.

**Diff (a): shared `build-cross-repo-edges.ts` v1.11.0 → `_dev-a` (v1.11.1):**
```diff
@@ -1,4 +1,4 @@
-// **version:** 1.11.0
+// **version:** 1.11.1
 // **location:** level-5 P2 facts index
 // © Oskey SAS. All rights reserved.
 //
@@ -103,6 +103,13 @@
   EXTERNAL_HOOK_TOPIC_VALUE: "value", // under payload.evidence
   EXTERNAL_HOOK_TOPIC_STATUS: "topicResolutionStatus", // under payload.evidence
   EXTERNAL_HOOK_TOPIC_STATUS_RESOLVED: "resolved",
+  // W2 (Firebase extractor, 2026-09-27), additive, used only to word an unresolved edge's `details`: why the topic is
+  // not a concrete name at this site, and the site's role. A publish fact extracted before W2 (and node-iot's) has
+  // none of them and keeps the older wording.
+  EXTERNAL_HOOK_TOPIC_NAME_STATUS: "topicNameStatus", // under payload.evidence
+  EXTERNAL_HOOK_TOPIC_NAME_REASON: "topicNameReason", // under payload.evidence
+  EXTERNAL_HOOK_PUBLISH_ROLE: "publishRole", // under payload.evidence
+  EXTERNAL_HOOK_PUBLISH_ROLE_PLUMBING: "plumbing",
 
   // call_expression: emitted by the Swift extractor for each call site.
   // `evidence.resolutionMethod = 'resolved_via_import'` plus a
@@ -657,7 +664,7 @@
     for (const r of publishCalls.rows) perRepo.set(r.repo, (perRepo.get(r.repo) ?? 0) + 1);
     const resolvedTopics = [...new Set(publishCalls.rows.filter(isResolved).map(topicOf))].sort();
     const unresolvedSites = publishCalls.rows.filter(r => !isResolved(r)).length;
-    const publisherFacts = `${publishCalls.rows.length} pubsub_publish_call facts (${[...perRepo.entries()].sort().map(([r, n]) => `${r} ${n}`).join(", ")}); the topic is statically resolved for ${resolvedTopics.length} (${resolvedTopics.join(", ") || "none"}), and ${unresolvedSites} publish site(s) have a topic that could not be resolved and may publish to it`;
+    const publisherFacts = `${publishCalls.rows.length} external_hook facts with evidence.type = pubsub_publish_call (${[...perRepo.entries()].sort().map(([r, n]) => `${r} ${n}`).join(", ")}); the topic is statically resolved for ${resolvedTopics.length} (${resolvedTopics.join(", ") || "none"}), and ${unresolvedSites} publish site(s) have a topic that could not be resolved and may publish to it`;
 
     // What each binding's push endpoint reaches in the facts.
     type Target =
@@ -713,9 +720,16 @@
 
       if (!isResolved(row)) {
         unresolvedCount++;
+        // With the W2 fields the reason is the extractor's own; without them (older facts, node-iot) the older wording stays.
+        const ev = row.payload.evidence;
+        const nameStatus: string | undefined = ev[CONTRACT.EXTERNAL_HOOK_TOPIC_NAME_STATUS];
+        const nameReason: string | undefined = ev[CONTRACT.EXTERNAL_HOOK_TOPIC_NAME_REASON];
+        const plumbing = ev[CONTRACT.EXTERNAL_HOOK_PUBLISH_ROLE] === CONTRACT.EXTERNAL_HOOK_PUBLISH_ROLE_PLUMBING;
         edges.push({
           ...base, targetRepo: UNKNOWN_REPO, targetSymbol: topicValue, targetFactId: null, resolutionStatus: "unresolved", confirmedVia: null,
-          details: `Topic name not statically resolvable in source (topicResolutionStatus: ${topicResolutionStatus}) -- a pass-through parameter at this call site, not a literal.`,
+          details: nameStatus
+            ? `The topic is not a concrete name at this publish site (topicNameStatus: ${nameStatus}${nameReason ? `: ${nameReason}` : ""})${plumbing ? "; this is a shared publish method, so the concrete topic is recorded on the facts of the code that calls it, not here" : ""}.`
+            : `Topic name not statically resolvable in source (topicResolutionStatus: ${topicResolutionStatus}) -- a pass-through parameter at this call site, not a literal.`,
         });
         continue;
       }
@@ -745,7 +759,7 @@
         resolvedCount++;
         edges.push({
           ...base, targetRepo: pair.repo, targetSymbol: pair.symbol, targetFactId: pair.factId, resolutionStatus: "resolved", confirmedVia: snapshotSource(snapshot),
-          details: `${pair.where}; publish site of topic '${topicValue}' -> subscription '${b.subscription}' (push ${b.pushEndpointPath}). ${snapshotNote(snapshot)}${known ? ` Also independently confirmed 2026-08-29 (CONFIRMED_PUBSUB_BINDINGS): ${known.confirmedVia}` : ""}`,
+          details: `${pair.where}; publish site (external_hook fact, evidence.type = pubsub_publish_call) of topic '${topicValue}' -> subscription '${b.subscription}' (push ${b.pushEndpointPath}). ${snapshotNote(snapshot)}${known ? ` Also independently confirmed 2026-08-29 (CONFIRMED_PUBSUB_BINDINGS): ${known.confirmedVia}` : ""}`,
         });
       }
     }
@@ -764,7 +778,7 @@
         const target = t.kind === "route" ? { repo: t.route.repo, symbol: t.route.raw, factId: t.route.factId, what: `route '${t.route.raw}' at ${t.route.repo}/${t.route.file}:${t.route.line}` }
                                           : { repo: t.receiver.repo, symbol: t.receiver.value, factId: t.receiver.fact_id, what: `push receiver ${t.receiver.module}-${t.receiver.value} at ${t.receiver.repo}/${t.receiver.file}:${t.receiver.line}` };
         edges.push({ sourceRepo: UNKNOWN_REPO, sourceSymbol, sourceFactId: null, targetRepo: target.repo, targetSymbol: target.symbol, targetFactId: target.factId, resolutionStatus: "unresolved", confirmedVia: snapshotSource(snapshot),
-          details: `Subscription '${b.subscription}' pushes topic '${b.topic}' to ${target.what}, which exists in the facts, but no pubsub_publish_call fact names topic '${b.topic}', so there is no fact on the publishing end: ${publisherFacts}. ${snapshotNote(snapshot)}` });
+          details: `Subscription '${b.subscription}' pushes topic '${b.topic}' to ${target.what}, which exists in the facts, but no external_hook fact with evidence.type = pubsub_publish_call names topic '${b.topic}', so there is no fact on the publishing end: ${publisherFacts}. ${snapshotNote(snapshot)}` });
       }
     }
 
```

**Diff (b): shared `build-cross-repo-edges.ts` v1.11.0 → `_dev-b` (v1.11.1):**
```diff
@@ -1,4 +1,4 @@
-// **version:** 1.11.0
+// **version:** 1.11.1
 // **location:** level-5 P2 facts index
 // © Oskey SAS. All rights reserved.
 //
@@ -1222,9 +1222,12 @@
     for (const a of notes.ambiguousPath) console.log(`  AMBIGUOUS trigger path (skipped): ${a}`);
 
     // 2. Writers: calls resolved to a write wrapper, with their enclosing method fact.
+    // W4e: a call inside an arrow-function class property has no callerName/callerStartLine; the extractor supplies the enclosing
+    // member (enclosingMemberName / enclosingMemberStartLine) instead, so the writer can be attributed to its method fact.
     const writers = await db.query<{ fact_id: string; repo: string; file: string; line: number; wrapper: string; decl_file: string | null; arg0: string | null; resolved_path: string | null; caller_name: string | null; caller_class: string | null; caller_line: string | null }>(
       `SELECT fact_id, repo, file, line, ${ev(CONTRACT.CALL_DECLARATION_METHOD)} AS wrapper, ${ev(CONTRACT.CALL_DECLARATION_FILE)} AS decl_file, payload->'evidence'->'${CONTRACT.CALL_ARGUMENTS}'->>0 AS arg0, ${ev(CONTRACT.CALL_RESOLVED_PATH)} AS resolved_path,
-              ${ev(CONTRACT.CALL_CALLER_NAME)} AS caller_name, ${ev(CONTRACT.CALL_CALLER_CLASS)} AS caller_class, ${ev(CONTRACT.CALL_CALLER_START_LINE)} AS caller_line
+              coalesce(${ev(CONTRACT.CALL_CALLER_NAME)}, ${ev(CONTRACT.CALL_ENCLOSING_MEMBER_NAME)}) AS caller_name, ${ev(CONTRACT.CALL_CALLER_CLASS)} AS caller_class,
+              coalesce(${ev(CONTRACT.CALL_CALLER_START_LINE)}, ${ev(CONTRACT.CALL_ENCLOSING_MEMBER_START_LINE)}) AS caller_line
        FROM facts WHERE repo = ANY($1::text[]) AND kind = $2 AND ${ev(CONTRACT.CALL_RESOLUTION_STATUS)} = $3 AND ${ev(CONTRACT.CALL_DECLARATION_METHOD)} = ANY($4::text[]) ORDER BY repo, file, line`,
       [sourceRepos, CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_RESOLUTION_OK, Object.keys(FIRESTORE_WRITE_WRAPPERS)]
     );
```

### 2026-09-27: [Lane A] Queue item (c): W6 (`INTRA_REPO_CALL_DECLARED`) numbers REFRESHED, dry-run only, for the user's review before any live run. Read-only, nothing in the shared tree, no `git add`/`git commit`

Session `-29`. Same rules and the same read-only simulation as my earlier W6 entries, re-run against live now (69,643 facts, 18,092 edges, after W2 and W4d, script deleted afterwards). **The numbers are unchanged from the post-W4e refresh** (W2 and W4d did not touch Firebase call facts or the `INTRA_REPO_CALL` slices):
| repo | resolved calls | in-repo declaration | already edged | candidates | **edges** | no method name / no decl fact | same / cross-module | callees | fan-in p50/p75/p90/p95/p99/max | inner / outer fence | outer fence skips | kept |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| firebase-oskey-dev | 5,907 | 4,546 | 2,360 | 2,186 | **2,034** | 152 / 0 | 1,638 / 396 | 761 | 1 / 2 / 4 / 6 / 21 / 150 | 5.7 / 16.0 | 13 callees, 614 edges | 1,420 |
| angular-app-oskey-io | 2,363 | 1,555 | 284 | 1,271 | **303** | 962 / 6 | 303 / 0 | 201 | 1 / 2 / 3 / 3 / 5 / 7 | 5.7 / 16.0 | 0 | 303 |
| node-iot-api-oskey-io | 277 | 116 | 0 | 116 | **74** | 42 / 0 | 74 / 0 | 45 | 1 / 2 / 4 / 5 / 6 / 6 | 5.7 / 16.0 | 0 | 74 |
- Firebase hubs above the outer fence (unchanged): utils::checkParameters 150, decorators::OSKUserSecurityChecks 138 (all via the alias fields), core::logInfo 62, core::logError 52, building::createField 38, utils::user_security_checks 29, user::get 28, admin::isOskeyAdmin 21, admin::getAdminOrganizationUser 20, core::logDebug 20, building::get 19, core::ensureInitialized 19, admin::getUserById 18. 235 of Firebase's 2,034 edges depend on the alias fields (196 of them land on those hubs). Angular's largest fan-in is 7 (`convertToDate`) and node-iot's 6, so no hub there; Angular's 962 "no method name" calls are import-alias artefacts of framework functions (`inject`, `signal`, `Component`, ...) pointing outside the repo, node-iot's 42 are Express `next(...)` calls: neither is a missing edge.
- **Totals if all three repos are in scope:** 2,034 + 303 + 74 = **2,411 new edges** (18,092 → 20,503); with the derived outer fence (skip hubs above it, printed on every run): 1,420 + 303 + 74 = **1,797** (18,092 → **19,889**). Firebase only, with the fence: 1,420 (→ 19,512). The approved decisions stand: skip hubs above the run-time-derived fence, type name `INTRA_REPO_CALL_DECLARED`, the no-callee calls reported only, Firebase first; Angular's and node-iot's scope is the user's call from these numbers (node-iot's `INTRA_REPO_CALL` stays switched off in `config/repos.json`; this join would give it its first same-repo call edges without reversing that).
- Not built yet: the W6 join itself (it needs its own copy, dry-run in the built form, and a granted turn); these numbers are from the simulation of the agreed rules.

### Coordinator note 2026-09-27 (about 09:00 UTC): user "go"; Lane A's (a)+(b) turn granted, W6 scope decided

- **User approved ("go") the coordinator's two recommendations:** (1) queue items (a) join-text wording and (b) trigger-join `coalesce(callerName, enclosingMemberName)` go live together in ONE Lane A write turn (edges only, no embeddings, no cost); (2) W6 scope: **Firebase (with the run-time-derived hub fence) and Angular; node-iot NOT included** (its `INTRA_REPO_CALL` stays switched off in `config/repos.json`); W6's own turn comes only after this one is validated and released.
- Coordinator's own review of the dry-run: (b) is 7 lines; independently checked in live facts that the newly attributed arrow-property writers of `/buildings/{buildingId}/doors/{doorId}/accessControlDevices` reach only the `create` trigger through `set` (`update`/`get` and the token controller's calls have no matching trigger), which fits the predicted +1.
- **WRITE TURN GRANTED: Lane A (a)+(b)** (exclusive). Preconditions checked: 69,643 facts, 18,092 edges, no active sessions. Expected: `FIRESTORE_EVENT_TRIGGER` 31 -> 32 (17 of 26 triggers), total 18,093, the 31 old trigger rows byte-identical, `PUBSUB_TOPIC_BINDING` 22 rows with exactly 14 `details` changed and every other column identical, all other slices byte-identical, `edge_sync_state` 21 slices ok, 0 dangling.

### 2026-09-27: [Lane A] (a)+(b) APPLIED and verified live (results)

Session `-29`. Inside the granted turn: table-only dump (`output/backups/edges-2026-09-27-before-a-b.dump`, 730,339 bytes, `pg_restore -l` lists both tables and their data); per-slice snapshot immediately before; the two copies merged into ONE `build-cross-repo-edges.ts` (**v1.11.2**): started from the shared v1.11.0, applied (a)'s hunks by copying `_dev-a` (v1.11.1 = v1.11.0 + (a) only) and (b)'s two hunks (the coalesce query and its comment) by exact replacement, then the version line; **checked: every added/removed line of the merged file versus the original v1.11.0 comes from the (a) or (b) diffs, and none of their lines is missing (0 and 0; 29 changed lines in all)**; type-checks clean; no DDL; plain `npm run pipeline:edges` (exit 0, no permission prompt or denial); both `_dev-` files deleted (none remains). No `sync-facts.ts`, no `EMBED`, no `git add`/`git commit`, no `DROP`/`TRUNCATE`/hand-written UPDATE/DELETE. (A first `patch` attempt of the second diff hit the shared version-line hunk and was discarded before any run; the file was rebuilt as described above and re-verified.)

**Verification against the snapshot taken just before (per-slice content md5):**
- Only **`FIRESTORE_EVENT_TRIGGER`** (31 → **32**) and **`PUBSUB_TOPIC_BINDING`** (the firebase and node-iot slices; the unknown-source slice is byte-identical) differ; **every other slice is byte-identical.**
- **Trigger slice: the 31 old rows are present and byte-identical (31 of 31); exactly 1 new row:** `building_door_access_control_device.controller.ts:50 OSKBuildingDoorAccessControlDeviceController.set` → `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated`.
- **`PUBSUB_TOPIC_BINDING`: still 22 rows; exactly 14 rows' `details` changed (10 firebase resolved + 1 node-iot resolved + 3 firebase plumbing unresolved); every other column of all 22 rows is identical** (the md5 of source/target/symbol/status columns is `a0bbf0c1…` before and after).
- **Total edges 18,093** (18,092 + 1). FIELD_BINDING 13. **Dangling 0.** `edge_sync_state` **21 rows, all 21 slices ok**. Facts untouched (69,643). `attributes` still set on 285 rows only.

**Rollback if wanted:** restore `output/backups/edges-2026-09-27-before-a-b.dump`, or revert the (a)+(b) hunks (diffs posted in the earlier entry) and re-run `pipeline:edges`.

[Lane A] (a)+(b) DONE (numbers) and write turn released

### Coordinator note 2026-09-27 (about 09:40 UTC): Lane A's (a)+(b) validated and released

- **Independent validation (scratch restore of `edges-2026-09-27-before-a-b.dump`, per-slice md5, then dropped):** 18,092 rows before. Slices that changed: `FIRESTORE_EVENT_TRIGGER firebase` 31 -> 32; `PUBSUB_TOPIC_BINDING firebase` (14 rows) and `node-iot` (2 rows). **Excluding the `details` column, the only difference anywhere is the trigger slice (+1 row);** the two Pub/Sub slices differ in `details` only. Every other slice byte-identical, in full. Live: 69,643 facts, **18,093 edges**, 0 dangling, 0 duplicates, 0 missing embeddings, `edge_sync_state` 21 slices with 0 dangling, trigger edges reach **17 distinct triggers**. One edge still carries the old "pass-through parameter" wording: node-iot's own `pubsub.service.ts:19 -> topicName` (a pre-W2 fact with no `topicNameStatus`), as predicted. Builder is v1.11.2; both `_dev-` files are gone.
- **WRITE TURN RELEASED: Lane A (a)+(b).** No write turn is open. Lane A may now build W6 in a copy (Firebase with the derived fence + Angular; node-iot excluded), dry-run in built form, and post for review; its turn comes only after review.

### 2026-09-27: [Lane A] W6 BUILT in a COPY (Firebase with the derived hub fence + Angular; node-iot excluded) and dry-run in built form: per-slice counts, fence, hubs, determinism, no existing slice changes. NOT in the shared tree; the write turn needs the coordinator's grant. No live write, no `git add`/`git commit`, no `sync-facts.ts`, no `EMBED`

Session `-29`. The copy is the untracked `pipeline/facts-postgres-index/_dev-w6-build-cross-repo-edges.ts` (v1.12.0 = the shared v1.11.2 plus one new join and its block; type-checks clean). Please do not `git add` it. Proofs ran on a scratch database `facts_index_w6_scratch` restored from a fresh read-only dump of live (69,643 facts, 18,093 edges; dropped afterwards; `facts_index_prebuild` untouched; `PG_DATABASE` explicit, `current_database()` checked), through the real orchestrator (`build-edges.ts` in a throwaway tree whose `build-cross-repo-edges.ts` is the copy, exactly what the turn will run).

**The join (`intra-repo-call-declared`, connection type `INTRA_REPO_CALL_DECLARED`, `ast_derived`, `resolved`).** For each resolved `call_expression` fact whose declaration file is a file the repo has facts for and that has no followed `INTRA_REPO_CALL` edge: the callee's declaration fact (kind ending `_method` or `function_declaration`) at the call's `declarationFile`/`declarationLine` (name-filtered where the line holds more than one; fallback by file and name); a call with an import alias uses `aliasedDeclaration*` (W1); the callee name falls back to `declarationMemberName` (W4e). Edge: call-site fact -> callee declaration fact, `attributes` = `{viaAlias, crossModule, calleeFanIn, calleeKind}`. **Hub fence derived at run time, per repo: the Tukey outer fence (Q3 + 3·IQR) of the log of the callees' fan-in; edges into callees above it are skipped and the fence, the count skipped and each hub with its fan-in are printed on every run.** Calls with no callee fact are counted in the report only (no rows). **node-iot is excluded through the existing config key, no repo-name literal:** a repo with `intraRepoEdges.enabled = false` in `config/repos.json` is skipped and its reason printed (`pipeline:edges` already treats that key the same way for the intra step). Source repos are otherwise discovered from the data.

**Built-form dry run (against live, then the real run on scratch; identical numbers):**
| slice | existing → new |
|---|---|
| `INTRA_REPO_CALL_DECLARED / angular-app-oskey-io` | 0 → **303** resolved |
| `INTRA_REPO_CALL_DECLARED / firebase-oskey-dev` | 0 → **1,420** resolved |
= **1,723 new edges (1,420 + 303, as expected)**; total edges 18,093 → **19,816**.
- **Angular:** 2,363 resolved calls; 1,555 name an in-repo declaration; 284 already have an intra edge; 1,271 candidates → 303 with a callee fact (0 via alias), 0 ambiguous, 962 with no method name (framework functions imported from `@angular/core`: `inject`, `signal`, `Component`, ...) and 6 with a name but no declaration fact (reported only). 201 callees; **fence 16.0; 0 hubs, 0 skipped, 303 kept** (largest fan-in 7).
- **Firebase:** 5,907 resolved calls; 4,546 in-repo; 2,360 already edged; 2,186 candidates → 2,034 with a callee fact (235 via the import alias), 0 ambiguous, 152 with no method name (reported only). 761 callees; **fence 16.0; 13 hub callees above it, 614 edges skipped, 1,420 kept** (largest kept fan-in 15). **Hub list (fan-in):** utils::checkParameters 150, decorators::OSKUserSecurityChecks 138, core::logInfo 62, core::logError 52, building::createField 38, utils::user_security_checks 29, user::get 28, admin::isOskeyAdmin 21, admin::getAdminOrganizationUser 20, core::logDebug 20, building::get 19, core::ensureInitialized 19, admin::getUserById 18.
- node-iot: skipped with its config reason printed; 0 rows.

**Proofs (scratch, real orchestrator):**
1. **No existing slice changes:** the per-slice content md5 of all 21 pre-existing slices is byte-identical before and after; only the 2 new slices appear (`35e73249…` angular, `9dc7b882…` firebase).
2. **Determinism: a second full `pipeline:edges` leaves all 23 slices content-identical to the first.**
3. Total 19,816; FIELD_BINDING 13; **dangling 0**; every new edge is `resolved` with a live target; **0 call facts have both a followed `INTRA_REPO_CALL` edge and a new edge; 0 duplicate (source, target) pairs**; `edge_sync_state` 23 rows, **all 23 ok**; `attributes` set on 1,723 new rows (plus the earlier 285), NULL elsewhere; kept fan-in never exceeds the fence (Angular max 7, Firebase max 15).
4. **`findGraphNeighbors`** (real `mcp-server/db/graph-traversal.ts`): the new type is outgoing on the source and incoming on the target; **`walkBoundedCluster`** from the kept callee with the most callers (15) returns 16 members / 30 edges, not truncated.

**Sequence at a write turn (no DDL; the `attributes` column exists):** table-only dump (`cross_repo_edges` + `edge_sync_state`); replace `build-cross-repo-edges.ts` with the copy (diff below); plain `npm run pipeline:edges`; per-slice before/after md5 (the 21 existing slices byte-identical, 2 new slices 303 and 1,420), total 19,816, `edge_sync_state` 23 slices ok, FIELD_BINDING 13, 0 dangling, one `findGraphNeighbors` call on the new type. Rollback: the dump, or revert the block and re-run `pipeline:edges`.

**Diff (shared `build-cross-repo-edges.ts` v1.11.2 → the copy v1.12.0):**
```diff
@@ -1,4 +1,4 @@
-// **version:** 1.11.2
+// **version:** 1.12.0
 // **location:** level-5 P2 facts index
 // © Oskey SAS. All rights reserved.
 //
@@ -1584,8 +1584,153 @@
   },
 };
 
-const JOINS: Join[] = [firebaseCallableJoin, pubsubBindingJoin, packageSymbolUseJoin, restRouteJoin, firestoreTriggerJoin, firestoreClientTriggerJoin, firestoreClientAccessJoin];
+// ---------------------------------------------------------------------------
+// W6 (doc 38 P7, doc 43): same-repo call edges from the call facts' OWN declaration fields. The resolved graph
+// (INTRA_REPO_CALL, build-intra-repo-edges.ts) covers only part of the resolved calls whose declaration is in the
+// repo; this join edges the rest: call-site fact -> the callee's declaration fact (controller_method, service_method,
+// class_method, ... or function_declaration), for a call fact whose `declarationFile` is a file the repo has facts
+// for. A call that has an import alias (`aliasedDeclaration*`, W1) uses the alias's declaration, since its own
+// `declarationFile` is then the importing file. Call sites that already have a followed INTRA_REPO_CALL edge are
+// skipped (the two never duplicate). It is a NEW connection type because a second writer of INTRA_REPO_CALL for a
+// repo would delete the intra builder's rows (slice ownership).
+//
+// Hubs: a callee with a very high fan-in (a logger, a security check) would give every neighbour walk a huge
+// neighbour list. The threshold is DERIVED FROM THE DATA at every run, per repo, never a name list: the Tukey outer
+// fence (Q3 + 3 * IQR) of the logarithm of the callees' fan-in. Edges into callees above it are skipped, and the
+// fence, the number skipped and each hub with its fan-in are printed on every run. Calls with no callee fact
+// (arrow-function properties, framework functions, `next(...)`) get no edge and are counted in the report only.
+// A repo whose config/repos.json entry sets `intraRepoEdges.enabled = false` is left out, with its reason printed.
+// ---------------------------------------------------------------------------
+const W6 = {
+  // Callee declaration facts are recognised by kind: a `<construct>_method` fact or a `function_declaration`.
+  DECLARATION_KIND_METHOD_SUFFIX: "_method",
+  DECLARATION_KIND_FUNCTION: "function_declaration",
+  CALL_MEMBER_NAME: "declarationMemberName", // under payload.evidence: W4e, callee is an arrow-function member
+  CALL_ALIASED_FILE: "aliasedDeclarationFile", // under payload.evidence: W1
+  CALL_ALIASED_LINE: "aliasedDeclarationLine",
+  CALL_ALIASED_METHOD: "aliasedDeclarationMethod",
+  CALL_ALIASED_CLASS: "aliasedDeclarationClass",
+  CALL_ALIASED_SYMBOL: "aliasedCalleeSymbol",
+  CALL_DECLARATION_LINE: "declarationLine",
+  CALL_DECLARATION_CLASS: "declarationClass",
+  INTRA_CONNECTION_TYPE: "INTRA_REPO_CALL",
+  FOLLOWED: ["resolved", "confirmed"],
+} as const;
+
+const fenceQuantile = (sorted: number[], p: number): number => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
+
+function loadIntraSwitchOff(): Map<string, string> {
+  // Repos switched off for intra-repo call edges in config/repos.json (`intraRepoEdges.enabled = false`, with a reason).
+  const file = path.resolve(__dirname, "..", "..", "config", "repos.json");
+  const out = new Map<string, string>();
+  if (!fs.existsSync(file)) return out;
+  const j = JSON.parse(fs.readFileSync(file, "utf8"));
+  const list: any[] = Array.isArray(j.repositories) ? j.repositories : Object.values(j.repositories ?? {});
+  for (const r of list) if (r?.intraRepoEdges?.enabled === false) out.set(r.name, r.intraRepoEdges.reason ?? "(no reason given)");
+  return out;
+}
 
+const intraRepoCallDeclaredJoin: Join = {
+  name: "intra-repo-call-declared",
+  connectionType: "INTRA_REPO_CALL_DECLARED",
+  provenance: "ast_derived",
+
+  async discoverSourceRepos(db) {
+    const r = await db.query<{ repo: string }>(
+      `SELECT DISTINCT repo FROM facts WHERE kind = $1 AND payload->'evidence'->>$2 = $3 AND payload->'evidence'->>$4 IS NOT NULL ORDER BY repo`,
+      [CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_RESOLUTION_STATUS, CONTRACT.CALL_RESOLUTION_OK, CONTRACT.CALL_DECLARATION_FILE]
+    );
+    const off = loadIntraSwitchOff();
+    for (const repo of r.rows.map(x => x.repo).filter(x => off.has(x))) console.log(`  intra-repo-call-declared: skipping ${repo}: switched off in config/repos.json (intraRepoEdges.enabled = false) -- ${off.get(repo)}`);
+    return r.rows.map(x => x.repo).filter(x => !off.has(x));
+  },
+
+  async preflight(db, sourceRepos) {
+    const problems: string[] = [];
+    if (sourceRepos.length === 0) problems.push(`no repo has a resolved '${CONTRACT.CALL_EXPRESSION_KIND}' fact with evidence.${CONTRACT.CALL_DECLARATION_FILE}`);
+    else {
+      const withLine = await countFacts(db, `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence' ? $3`, [sourceRepos, CONTRACT.CALL_EXPRESSION_KIND, W6.CALL_DECLARATION_LINE]);
+      if (withLine === 0) problems.push(`no '${CONTRACT.CALL_EXPRESSION_KIND}' fact has evidence.${W6.CALL_DECLARATION_LINE} (extractor field renamed?)`);
+      const decls = await countFacts(db, `repo = ANY($1::text[]) AND (kind LIKE $2 OR kind = $3)`, [sourceRepos, `%${W6.DECLARATION_KIND_METHOD_SUFFIX}`, W6.DECLARATION_KIND_FUNCTION]);
+      if (decls === 0) problems.push(`no declaration fact (kind ending '${W6.DECLARATION_KIND_METHOD_SUFFIX}' or '${W6.DECLARATION_KIND_FUNCTION}') in ${sourceRepos.join(", ")}`);
+    }
+    problems.push(...(await attributesColumnProblems(db)));
+    return problems;
+  },
+
+  async compute(db, sourceRepos) {
+    const edges: EdgeRow[] = [];
+    for (const repo of sourceRepos) {
+      const files = new Set((await db.query<{ file: string }>(`SELECT DISTINCT file FROM facts WHERE repo = $1`, [repo])).rows.map(r => r.file));
+      const calls = (await db.query<{ fact_id: string; file: string; line: number; module: string; ev: any }>(
+        `SELECT fact_id, file, line, module, payload->'evidence' AS ev FROM facts WHERE repo = $1 AND kind = $2 AND payload->'evidence'->>$3 = $4 ORDER BY fact_id`,
+        [repo, CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_RESOLUTION_STATUS, CONTRACT.CALL_RESOLUTION_OK]
+      )).rows;
+      const decls = (await db.query<{ fact_id: string; kind: string; file: string; line: number; module: string; symbol_name: string }>(
+        `SELECT fact_id, kind, file, line, module, symbol_name FROM facts WHERE repo = $1 AND (kind LIKE $2 OR kind = $3) ORDER BY fact_id`,
+        [repo, `%${W6.DECLARATION_KIND_METHOD_SUFFIX}`, W6.DECLARATION_KIND_FUNCTION]
+      )).rows;
+      const already = new Set((await db.query<{ source_fact_id: string }>(
+        `SELECT source_fact_id FROM cross_repo_edges WHERE connection_type = $1 AND source_repo = $2 AND resolution_status = ANY($3::text[]) AND source_fact_id IS NOT NULL`,
+        [W6.INTRA_CONNECTION_TYPE, repo, [...W6.FOLLOWED]]
+      )).rows.map(r => r.source_fact_id));
+      const byFileLine = new Map<string, typeof decls>(), byFileName = new Map<string, typeof decls>();
+      for (const d of decls) {
+        const k1 = `${d.file}\u0000${d.line}`; byFileLine.set(k1, [...(byFileLine.get(k1) ?? []), d]);
+        const k2 = `${d.file}\u0000${d.symbol_name}`; byFileName.set(k2, [...(byFileName.get(k2) ?? []), d]);
+      }
+      const st = { resolvedCalls: calls.length, inRepoDeclaration: 0, alreadyEdged: 0, candidates: 0, matched: 0, viaAlias: 0, ambiguous: 0, noMethodName: 0, noDeclarationFact: 0 };
+      type Cand = { c: (typeof calls)[number]; t: (typeof decls)[number]; alias: boolean; cls: string | null };
+      const cands: Cand[] = [];
+      for (const c of calls) {
+        const e = c.ev;
+        const alias = !!e[W6.CALL_ALIASED_FILE];
+        const df: string | undefined = alias ? e[W6.CALL_ALIASED_FILE] : e[CONTRACT.CALL_DECLARATION_FILE];
+        const dl = alias ? e[W6.CALL_ALIASED_LINE] : e[W6.CALL_DECLARATION_LINE];
+        const dm: string | undefined = alias ? (e[W6.CALL_ALIASED_METHOD] ?? e[W6.CALL_ALIASED_SYMBOL]) : (e[CONTRACT.CALL_DECLARATION_METHOD] ?? e[W6.CALL_MEMBER_NAME]);
+        const cls: string | null = (alias ? e[W6.CALL_ALIASED_CLASS] : e[W6.CALL_DECLARATION_CLASS]) ?? null;
+        if (!df || !files.has(df)) continue;
+        st.inRepoDeclaration++;
+        if (already.has(c.fact_id)) { st.alreadyEdged++; continue; }
+        st.candidates++;
+        let t = byFileLine.get(`${df}\u0000${dl}`) ?? [];
+        if (t.length > 1 && dm) t = t.filter(x => x.symbol_name === dm);
+        if (t.length === 0 && dm) t = byFileName.get(`${df}\u0000${dm}`) ?? [];
+        if (t.length === 0) { if (dm) st.noDeclarationFact++; else st.noMethodName++; continue; }
+        if (t.length > 1) { st.ambiguous++; continue; }
+        if (t[0].fact_id === c.fact_id) continue;
+        st.matched++; if (alias) st.viaAlias++;
+        cands.push({ c, t: t[0], alias, cls });
+      }
+      // The hub fence, derived from this repo's own fan-in distribution.
+      const fan = new Map<string, number>();
+      for (const x of cands) fan.set(x.t.fact_id, (fan.get(x.t.fact_id) ?? 0) + 1);
+      const logs = [...fan.values()].sort((a, b) => a - b).map(v => Math.log(v));
+      const fence = logs.length === 0 ? Infinity : Math.exp(fenceQuantile(logs, 0.75) + 3 * (fenceQuantile(logs, 0.75) - fenceQuantile(logs, 0.25)));
+      const kept = cands.filter(x => fan.get(x.t.fact_id)! <= fence);
+      const hubs = [...fan.entries()].filter(([, n]) => n > fence).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
+      const symOf = new Map(cands.map(x => [x.t.fact_id, `${x.t.module}::${x.t.symbol_name}`]));
+      const skipped = hubs.reduce((s, [, n]) => s + n, 0);
+      console.log(`  ${repo}: ${st.resolvedCalls} resolved calls; ${st.inRepoDeclaration} name an in-repo declaration; ${st.alreadyEdged} already have an ${W6.INTRA_CONNECTION_TYPE} edge; ${st.candidates} candidates -> ${st.matched} with a callee fact (${st.viaAlias} through the import alias), ${st.ambiguous} ambiguous, ${st.noMethodName} with no method name and ${st.noDeclarationFact} with a name but no declaration fact (reported only, no edge).`);
+      console.log(`  ${repo}: ${fan.size} callees; hub fence (Tukey outer fence of log fan-in) = ${Number.isFinite(fence) ? fence.toFixed(1) : "n/a"}; ${hubs.length} hub callee(s) above it, ${skipped} edge(s) skipped, ${kept.length} kept. Hubs: ${hubs.length ? hubs.map(([id, n]) => `${symOf.get(id)} (${n})`).join(", ") : "none"}.`);
+      for (const x of kept) {
+        const e = x.c.ev;
+        const crossModule = x.c.module !== x.t.module;
+        edges.push({
+          sourceRepo: repo, sourceSymbol: `${x.c.file}:${x.c.line} -> ${e[CONTRACT.CALL_CALLER_NAME] ?? e[CONTRACT.CALL_ENCLOSING_MEMBER_NAME] ?? "(unknown caller)"}`, sourceFactId: x.c.fact_id,
+          targetRepo: repo, targetSymbol: `${x.t.module}::${x.cls ? x.cls + "." : ""}${x.t.symbol_name}`, targetFactId: x.t.fact_id, resolutionStatus: "resolved", confirmedVia: null,
+          details: `via ${e[CONTRACT.CALL_CALLEE_EXPRESSION] ?? "(call)"} (the call fact's own declaration fields${x.alias ? ", through the import alias" : ""}) -- ${crossModule ? `cross-module ('${x.c.module}' -> '${x.t.module}')` : `same module ('${x.c.module}')`}`,
+          attributes: { viaAlias: x.alias, crossModule, calleeFanIn: fan.get(x.t.fact_id)!, calleeKind: x.t.kind },
+        });
+      }
+    }
+    console.log(`  Join result: ${edges.length} resolved INTRA_REPO_CALL_DECLARED edge(s) across ${sourceRepos.length} repo(s).`);
+    return edges;
+  },
+};
+
+const JOINS: Join[] = [firebaseCallableJoin, pubsubBindingJoin, packageSymbolUseJoin, restRouteJoin, firestoreTriggerJoin, firestoreClientTriggerJoin, firestoreClientAccessJoin, intraRepoCallDeclaredJoin];
+
 // ---------------------------------------------------------------------------
 // Shared scoped replace. Compute first, replace second: the new edge set for a
 // join is fully built in memory before anything is touched. Each
```

### Coordinator note 2026-09-27 (about 10:10 UTC): W6 dry-run reviewed; Lane A's W6 write turn granted

- **Coordinator's review (read-only):** read the full copy-vs-shared diff (v1.11.2 -> v1.12.0: one new join, appended to `JOINS`, nothing else touched); the node-iot exclusion goes through the existing `intraRepoEdges.enabled = false` key in `config/repos.json` (verified the key and shape: `repositories[].name`, only node-iot has it) with no repo-name literal in the code; the hub fence is derived per run (Tukey outer fence of log fan-in), printed with every hub. **Independent semantic spot-check in live facts:** 8 sampled Firebase call facts with no existing followed `INTRA_REPO_CALL` edge; in each, the call's `declarationFile:declarationLine` is exactly the declaration fact whose `symbol_name` is the called method and whose class matches the callee expression (e.g. `OSKSecurityChecks.validateEmailFormat` -> `utils/security_checks.ts:55 class_method validateEmailFormat`).
- **User approved the scope** ("go", 09:00 UTC): Firebase with the derived fence and Angular; node-iot excluded. Reviewed numbers: 1,420 + 303 = 1,723 new edges; 13 Firebase hubs skipped (614 edges), Angular none.
- **WRITE TURN GRANTED: Lane A W6** (exclusive). Preconditions: 69,643 facts, 18,093 edges, no active sessions. Expected: `INTRA_REPO_CALL_DECLARED` angular 303, firebase 1,420; total **19,816**; the 21 pre-existing slices byte-identical (full columns including `details` and `attributes`); `edge_sync_state` 23 slices ok; FIELD_BINDING 13; 0 dangling; 0 duplicate pairs; 0 call facts with both an `INTRA_REPO_CALL` (followed) and an `INTRA_REPO_CALL_DECLARED` edge; a second `pipeline:edges` leaves all 23 slices identical. No DDL.

### 2026-09-27: [Lane A] W6 APPLIED and verified live (results)

Session `-29`. Inside the granted turn: table-only dump (`output/backups/edges-2026-09-27-before-W6.dump`, 729,368 bytes, `pg_restore -l` lists both tables and their data); per-slice md5 snapshot of all 21 slices immediately before (now including the `attributes` column in the md5); `build-cross-repo-edges.ts` replaced by the approved copy (**v1.12.0**) and `_dev-w6-build-cross-repo-edges.ts` deleted (no `_dev-` file remains); no DDL; plain `npm run pipeline:edges` twice (both exit 0, no permission prompt or denial). No `sync-facts.ts`, no `EMBED`, no `git add`/`git commit`, no `DROP`/`TRUNCATE`/hand-written UPDATE/DELETE.

**Printed in the run output (run 1), pasted:**
- node-iot skipped: `intra-repo-call-declared: skipping node-iot-api-oskey-io: switched off in config/repos.json (intraRepoEdges.enabled = false) -- Not loaded as INTRA_REPO_CALL edges, by decision ...`
- `angular-app-oskey-io: 201 callees; hub fence (Tukey outer fence of log fan-in) = 16.0; 0 hub callee(s) above it, 0 edge(s) skipped, 303 kept. Hubs: none.`
- `firebase-oskey-dev: 761 callees; hub fence (Tukey outer fence of log fan-in) = 16.0; 13 hub callee(s) above it, 614 edge(s) skipped, 1420 kept. Hubs: utils::checkParameters (150), decorators::OSKUserSecurityChecks (138), core::logInfo (62), core::logError (52), building::createField (38), utils::user_security_checks (29), user::get (28), admin::isOskeyAdmin (21), admin::getAdminOrganizationUser (20), core::logDebug (20), building::get (19), core::ensureInitialized (19), admin::getUserById (18).`
- `Join result: 1723 resolved INTRA_REPO_CALL_DECLARED edge(s) across 2 repo(s).` / slice `INTRA_REPO_CALL_DECLARED / angular-app-oskey-io: existing 0 -> new 303 (303 resolved)` / slice `... / firebase-oskey-dev: existing 0 -> new 1420 (1420 resolved)`.

**Verification against the pre-turn snapshot (all columns, attributes included):**
- **The 21 pre-existing slices are byte-identical**; only the 2 new slices appear: `INTRA_REPO_CALL_DECLARED / angular-app-oskey-io` **303** and `/ firebase-oskey-dev` **1,420** (fingerprints `c0ac03f0…`, `5ab454b9…`).
- **Total edges 19,816** (18,093 + 1,723). FIELD_BINDING **13**. **Dangling 0.** Every new edge is `resolved` with a live target (0 exceptions). **0 call facts have both a followed `INTRA_REPO_CALL` edge and a new edge; 0 duplicate (source, target) pairs.** `edge_sync_state` **23 rows, all 23 slices ok** (0 STALE, 0 UNRECORDED). Facts untouched (69,643). `attributes` set on 2,008 rows (285 + 1,723).
- **`findGraphNeighbors`** (real `mcp-server/db/graph-traversal.ts`, live, read-only), once per direction on the new type: the source call fact has it **outgoing**, the target callee (a controller/service method fact in the repo, `OSKNodeIoTAPIService.delete` in module `access_control_device`) has it **incoming**.

**Second `pipeline:edges` run:** exit 0; **all 23 slices content-identical to run 1** (per-slice md5 with attributes; total still 19,816). What the orchestrator does with `edge_sync_state` on a repeat run: it **rebuilds every slice and records all 23 again ("edge_sync_state recorded for 23 rewritten slice(s)")**, i.e. "rebuilt-identical", not "unchanged" (each builder deletes and re-inserts its slices, so their synthesis ids change; the content does not); the summary reads 23 ok.

**Rollback if wanted:** restore `output/backups/edges-2026-09-27-before-W6.dump`, or revert the appended join block in `build-cross-repo-edges.ts` (diff posted in the W6 entry) and re-run `pipeline:edges`.

[Lane A] W6 DONE (numbers) and write turn released

### Coordinator note 2026-09-27 (about 10:40 UTC): Lane A's W6 validated and released

- **Independent validation (scratch restore of `edges-2026-09-27-before-W6.dump`, per-slice md5 over every column including `details` and `attributes`, then dropped):** 18,093 rows before. **All 21 pre-existing slices byte-identical; exactly two new slices:** `INTRA_REPO_CALL_DECLARED` angular 303, firebase 1,420. Live: 69,643 facts (unchanged), **19,816 edges**, 0 dangling, 0 duplicate pairs, 0 missing embeddings, `edge_sync_state` 23 slices with 0 dangling. 0 call facts carry both a followed `INTRA_REPO_CALL` and a DECLARED edge; every DECLARED edge is resolved; 0 self-loops; 0 node-iot rows; `attributes` appears only on the DECLARED and FIRESTORE_CLIENT_* slices; highest `calleeFanIn` kept is 15 (fence 16.0). Target kinds: controller_method 856, service_method 508, class_method 259, function_declaration 100.
- **Process note (Lane A's own disclosure):** Lane A fixed one wording slip in its own just-written entry with an in-place `sed`, breaking the append-only convention for that line. Only its own phrase was changed. Coordinator's structural check: the file's coordinator notes are all present. Rule stands: fixes to a log go in as a new appended correction, not an edit.
- **WRITE TURN RELEASED: Lane A W6.** No write turn is open. The edge-side plan is complete (W5a/b, W1, W2, W3, W4a to W4e, W6). Remaining: Step U (restore `branch: staging` and refresh firebase and angular), the Angular 5 unresolved callables, the wiki update 3, the trigger and Pub/Sub findings hand-off, and user-owned items.

### Coordinator note 2026-09-27 (about 11:15 UTC): Step U re-sequenced by the user; firebase v2 migration deferred, code-fix built and validated first

- **User's decision (challenged and confirmed):** firebase's pin stays at `00e1d9fd` for now (no config change). This session's remaining code fixing finishes first: (a) the v2 Firestore-trigger-path fix (object-literal `document` property, keeping the existing string-argument case), built and validated with a synthetic unit test (no v2 triggers exist yet at the current pin) plus a full regression over all 26 live triggers proving zero change today; (b) classifying Angular's 5 unresolved callables (already pending, unrelated). Once both are confirmed, that is the commit point. **The firebase v2 migration (advance to current staging, re-extract, gate, embed, validate) becomes its own next initiative/session**, deliberately framed as the project's first documented case of a major upstream migration flowing through the whole pipeline (and the first case in this build where fact IDs are NOT additive-only: the renamed `organization_intercom_communication` folder breaks ~546 citations, to be documented plainly for the wiki team rather than treated as a defect).
- **Coordinator's technical note for whoever runs the eventual advance:** resolve `branch: staging` to its exact commit SHA once at the start of that run and hold it fixed through scan, gate and write turn (staging is actively moving); decide the config's end state (pinned vs floating) afterward per the freeze-policy answer above (stay pinned to the validated SHA).
- **Immediate actions:** Angular and node-iot `branch: staging` restored now (confirmed no-ops). Firebase's pin untouched. Lane B builds the trigger-path fix in a copy for review (no live write, no spend). swift-ai-kit-oskey-io registration: user said skip for now, parked with the other benched items.

### 2026-09-27: [Lane B] Step U, task 1 (branch restore) DONE; task 2 (v2 Firestore-trigger-path fix) built in a DEV COPY, validated, PROPOSAL for the coordinator's review. No live write, no `sync-facts`, no `EMBED`, no `git add`/`git commit` either way.

**Task 1 (config/README, no pipeline run, confirmed no-op first).** `git ls-remote` on Angular's `staging`: still `8345d222…`, equal to the pinned commit. `config/repos.json`: Angular's `commit` key replaced by `branch: "staging"` (a dated note records the restore and the prior pin); node-iot already had `branch: "staging"` in the working copy, untouched; **firebase's pin left exactly as is** (`00e1d9fd`), per instruction. `pipeline/README.md`'s repo table: firebase's row now says restoring it is its own later initiative, deferred pending v2 support; Angular's row says `branch \`staging\`` with a note that it was temporarily pinned and is now restored.

**Task 2. Cause (Lane C's Step U investigation, confirmed by reading the code):** `01-extract-ast-evidence.ts` section 8c takes `pathNode = isDocumentStyle ? arg0 : documentCall?.getArguments()[0]` for v2's `onDocumentCreated`/`onDocumentUpdated`/`onDocumentDeleted`/`onDocumentWritten`. That is right only when arg0 is the path itself; the real Cloud Functions v2 API also accepts `onDocumentCreated({ document: <path>, region: ... }, handler)`, an **options object**, and `resolvePathValue` has no case for `ObjectLiteralExpression`, so such a trigger would resolve to `unresolved: unsupported:ObjectLiteralExpression` today. **No v2 trigger exists at the current pin (`00e1d9fd`)** (all 28 triggers in the live DB are v1-style `<x>.document(<path>).on*(handler)` or v1 auth triggers), so this is dormant, forward-looking code, not a fix to anything live.

**Built as a dev copy, not in the shared tree:** `pipeline/firebase-oskey-dev/phase-01-ast-extraction/_dev-01-extract-ast-evidence.ts` (full copy of the shared file plus the change below), following Lane A's `_dev-sync-facts.ts` convention. **The only functional diff:**
```diff
+function v2ObjectLiteralPathArg(arg0: Node | undefined): Node | undefined {
+  if (!arg0 || !Node.isObjectLiteralExpression(arg0)) return arg0;
+  const prop = arg0.getProperty("document");
+  if (!prop) return undefined;
+  if (Node.isPropertyAssignment(prop)) return prop.getInitializer() ?? undefined;
+  if (Node.isShorthandPropertyAssignment(prop)) return prop.getNameNode();
+  return undefined;
+}
...
-          const pathNode = isDocumentStyle ? arg0 : documentCall?.getArguments()[0];
+          const pathNode = isDocumentStyle ? v2ObjectLiteralPathArg(arg0) : documentCall?.getArguments()[0];
```
A v2 call whose arg0 is already a bare string (as the extractor's own doc-comment for v2 describes it) passes through the helper unchanged (`return arg0`), so no existing v2-shaped assumption is disturbed; only the object-literal case is new. Everything downstream (`resolvePathValue`, `firestorePathStatus`, the trigger event/source fields) runs exactly as before on whatever node the helper returns.

**(a) Synthetic unit test (in-memory ts-morph source, deleted after use), the real upstream shape Lane C found:**
```ts
const accessControlDevicePath = "/accessControlDevices/{deviceId}";
export const onAccessControlDeviceCreated = onDocumentCreated(
  { document: accessControlDevicePath, region: "europe-west1" },
  (event) => { /* handler */ }
);
export const onLegacyV2StringPath = onDocumentCreated("/legacy/{id}", (event) => {});
```
Result: the object-literal site resolves the path constant through `document` to **`/accessControlDevices/{deviceId}`** (today's code would call this unsupported); the bare-string site still resolves to **`/legacy/{id}`**, unchanged by the fix. Matches Lane C's note that the constants themselves are plain literals.

**(b) Regression over all 26 live triggers (28 trigger facts incl. the 2 auth triggers), run in an isolated sandbox** (separate cwd, a copy of the pinned clone `00e1d9fd`, a `node_modules` symlink, two fresh run ids so nothing touches the real held/current run or `run-context.json`): the shared script and the dev copy were each run once, and **every one of the 17 raw fact files is identical between them, field for field, except the two runIds and the manifest's wall-clock `generatedAt`** (not a fact) — **28 of 28 trigger facts byte-identical, 0 change**, and 0 change in every other fact type (calls, imports, api contracts, etc.), confirming the diff above touches only the v2-object-literal path and nothing else.

**Not done (per instruction):** no live write, no `sync-facts`, no `EMBED`, no `git add`/`git commit`; firebase's actual v2 migration (advancing the pin, re-extracting, gating, embedding) stays a separate, later initiative. This entry is for the coordinator's review; the dev copy stays out of the shared tree until told otherwise.

### Coordinator note 2026-09-27 (about 11:45 UTC): Step U tasks 1+2 reviewed; v2 trigger-path fix cleared for the shared tree

- **Config/README review:** `git diff` confirms angular's pin replaced by `branch: "staging"` (node-iot already was), firebase's pin (`00e1d9fd`) untouched, and `pipeline/README.md`'s pin table matches (firebase "temporarily pinned ... deferred pending v2 Firestore-trigger support"; angular restored).
- **v2 trigger-path fix, independently tested (not just reading Lane B's report):** read the `_dev-01-extract-ast-evidence.ts` diff -- confirmed the new `v2ObjectLiteralPathArg()` call site only replaces `pathNode` inside the `isDocumentStyle` branch (`exactMethodName.startsWith("onDocument")`); the v1 chained `.document(path).onCreate(handler)` branch (`documentCall`) is untouched code, not merely untested. Ran the helper verbatim against 3 synthetic cases (`ts-morph`, in-memory, no live files): (1) the real upstream shape (`onDocumentCreated({document: accessControlDevicePath, region: ...}, handler)`) resolves to the constant identifier node, for `resolvePathValue()` to resolve as before; (2) a bare-string `onDocumentCreated(path, handler)` site passes through unchanged; (3) an object literal with no `document` property returns `undefined` (fails safe, marks `not_applicable` rather than guessing). Confirmed `'onCreate'.startsWith('onDocument') === false`, so a v1-style call (any commit from before the v2 migration, e.g. a run from 2+ months ago) never reaches the new code at all -- forward- and backward-compatible by construction, not by luck.
- **Lane B's regression (28/28 trigger facts byte-identical, sandbox isolated from the real run) accepted on top of the above.**
- **CLEARED: Lane B may merge the fix into the shared `01-extract-ast-evidence.ts` and delete the `_dev-` file.** This is a code-only change (no DB write, no live effect while the pin stays at `00e1d9fd`) -- not a write turn, no dump needed, but still no `git add`/`git commit`.
- **Remaining before the user's commit point:** Angular's 5 unresolved callables classification (task pending, unrelated to Step U).

### 2026-09-27: [Lane B] v2 Firestore-trigger-path fix MERGED into the shared `01-extract-ast-evidence.ts`; dev copy deleted. Code-only, no DB write, no `git add`/`git commit`

Cleared by the coordinator (independently re-verified: 3 synthetic cases, and confirmed the v1 `document(path).onCreate()` branch is untouched since `"onCreate".startsWith("onDocument")` is false). Merged exactly the functional diff from the dev copy (the `v2ObjectLiteralPathArg` helper plus its one call site for `pathNode`); the dev-copy-only header note was dropped and its content folded into the helper's own comment instead. `pipeline/firebase-oskey-dev/phase-01-ast-extraction/_dev-01-extract-ast-evidence.ts` deleted. `tsc --noEmit` clean. Dormant at the current pin (`00e1d9fd`): no v2 trigger exists yet, so nothing changes for any live fact; the next real extraction at this commit is covered by the regression already in the entry above.

### 2026-09-27: [Lane B] Classifying Angular's 5 unresolved callable calls: real client-side causes, per site (read-only; no facts changed, no code, no DB write, no `git add`/`git commit`)

Source-verified at both ends (Angular `8345d222`, firebase `00e1d9fd`). Two of the five share the same real root cause, not previously named.

**1. `organization-assigningBuildingToProperty` (already known from the join's own message): wrong group, right method name.** Angular calls `'organization-assigningBuildingToProperty'` (`organization-property-service.service.ts:105`). Firebase deploys it as `building.assigningBuildingToProperty` (`building/index.ts:53` `assigningBuildingToProperty: https.onCall(OSKBuildingService.assigningBuildingToProperty)`; the export key and the service method name agree). **Client bug: the client used the feature area it lives in (`organization`) as the group prefix instead of the module that actually deploys it (`building`).**

**2. `organization-getAllIntercomCommunicationService` and 5. `supplier-getStaffMember`: the SAME real cause, found by reading both deploy sites — the client used the backend's internal method name, not its deployed export key.**
- `message-center-service.service.ts:61` calls `'organization-getAllIntercomCommunicationService'`. Firebase deploys it as `organization/modules/organization_intercom_ communication/index.ts:56`: `getAllIntercomCommunication: https.onCall(OSKIntercomCommunicationService.getAllIntercomCommunicationService)`. **The export key is `getAllIntercomCommunication`; the underlying service method (visible in the same source file, one hop away) is literally named `getAllIntercomCommunicationService`.** The client author read the method name, not the key next to it.
- `suppliers.service.ts:93` `getStaffMember()` calls `'supplier-getStaffMember'`. Firebase deploys it as `supplier/modules/supplierStaff/index.ts:53`: `getSupplierStaff: https.onCall(OSKSupplierStaffService.getStaffMember)`. **Export key `getSupplierStaff`; method name `getStaffMember`.** Same mistake, same shape.
Both are genuine client bugs (a wrong string, fixable in the client), and both point at the same real hazard for the wiki/repo owners: **the deployed export key and the underlying method name differ in this repo, and a developer reading the method (not the trigger registration) will get it wrong.** Worth flagging as a pattern, not two unrelated typos.

**3. `organization-updateIntercomCommunication`: not a naming mismatch — the callable was never deployed.** `message-center-service.service.ts:75-84` `updateIntercomCommunication()` is fully implemented client-side, with its own request type `OSKUpdateIntercomCommunicationRequestData` (imported, typed, used). Firebase's `organization_intercom_ communication/index.ts` exports `getAllIntercomCommunication`, `getArchivedIntercomCommunications`, `getIntercomCommunicationById`, `createIntercomCommunication`, `deleteIntercomCommunication`, `reformulateCommunicationWithGemini`, `getAllIntercomCommunicationsByEntityId`, `getAllIntercomCommunicationsByPropertyId` — **create, read (4 ways) and delete all exist; no update.** `OSKUpdateIntercomCommunicationRequestData` itself is defined in the backend's own model file (`models/functions/organization_intercom_communication_request.model.ts:51`) but never used by anything that registers a trigger. **Probable gap: an edit feature built (or planned) on both ends but never wired to a deployed function**, not a name to correct.

**4. `supplier-getById`: dead/duplicate client code, not a live bug.** `suppliers.service.ts:47-56` `getSupplierById(organizationId, supplierId)` calls `'supplier-getById'`, which matches nothing deployed. Three lines later, `getSupplier(organizationId, supplierId)` (**identical parameters and return type**) correctly calls `'supplier-getSupplier'`, which is deployed (`supplier/index.ts:45`, export key = method name = `getSupplier`). **`getById` matches neither the current export key nor the current method name anywhere in the supplier module** — it looks like an earlier, now-superseded version of the same call, left behind when `getSupplier` was added or renamed. **Grep confirms `getSupplierById(` has no caller anywhere else in `hosting/web-app/src`: dead code, not a live client bug reaching users.**

**Summary for the wiki/repo owners:** 1 wrong group prefix (assigningBuildingToProperty), 2 "used the method name instead of the deployed key" (a real, named pattern worth a general note, not just two typos), 1 feature gap (update never deployed), 1 dead/duplicate client method (never called). None of the five is an extractor gap; all five are source-verified facts about the client and backend code, not something to change in the pipeline.

**On adding a reason field:** not done. This classification is prose for the report, not a schema change; if the coordinator wants it captured as a structured field on the unresolved edges (e.g. `probableCause`), that is a join-side, additive change and its own small held-run/gate/turn, and I would ask first as instructed. Nothing was written to any fact or edge.

### Coordinator note 2026-09-27 (about 12:10 UTC): v2 fix merge confirmed; Angular's 5 unresolved callables independently verified against source; session's code-fixing checklist complete

- **Merge confirmed:** `git diff --stat` shows only `01-extract-ast-evidence.ts` changed (+460/-8), `_dev-01-extract-ast-evidence.ts` is gone, `v2ObjectLiteralPathArg` is in the shared file at its call site. No DB write.
- **Angular's 5 unresolved callables, independently checked against the real cloned source (not just Lane B's report):**
  1. `organization-assigningBuildingToProperty` -- confirmed: `firebase-oskey-dev/functions/src/modules/building/index.ts:53` exports it as `building.assigningBuildingToProperty`; client used the wrong group prefix.
  2. `organization-getAllIntercomCommunicationService` and 5. `supplier-getStaffMember` -- confirmed, same real cause: `organization_intercom_ communication/index.ts` exports `getAllIntercomCommunication: https.onCall(OSKIntercomCommunicationService.getAllIntercomCommunicationService)` and `supplierStaff/index.ts` exports `getSupplierStaff: https.onCall(OSKSupplierStaffService.getStaffMember)` -- the client used the backend's internal method name instead of the exported callable key, in both cases. Agree this is worth flagging to the wiki team as a repo-wide naming trap.
  3. `organization-updateIntercomCommunication` -- confirmed: Angular's `message-center-service.service.ts:75-82` has a full `updateIntercomCommunication()` method calling that name, with a real `OSKUpdateIntercomCommunicationRequestData` type; firebase's `organization_intercom_ communication/index.ts` exports create/read x4/delete/reformulate but genuinely has no update export. Real gap, not a naming issue.
  4. `supplier-getById` -- confirmed dead code: `suppliers.service.ts` has both `getSupplierById()` (calls `supplier-getById`, no export exists) and `getSupplier()` (calls `supplier-getSupplier`, which IS exported and correct); `getSupplierById(` has exactly one match repo-wide (its own definition) -- 0 callers.
- **This session's code-fixing checklist is now complete:** the v2 trigger-path fix (built, tested, merged) and Angular's 5 unresolved callables (classified, verified). Nothing else is outstanding from the build. This is a natural commit point (user's call, as always); the firebase v2 migration remains its own deferred later initiative.

### 2026-09-27: [Lane A] FINAL CAPTURE NOTE (before release) — not a new build item, not yet written up elsewhere

Two things I know from this session's own testing that aren't in an acceptance check or a build entry above, and would otherwise be lost:

1. **`FIRESTORE_CLIENT_ACCESS`/`FIRESTORE_CLIENT_TRIGGER` have no hub fence, unlike `INTRA_REPO_CALL_DECLARED`.** In the W4d scratch proof I ran `walkBoundedCluster` (real `mcp-server/db/graph-traversal.ts`) from the busiest client-access endpoints and it came back **truncated on both sides already, at today's small scale** (26 members/130 edges and 24 members/154 edges, both `truncated: true`), while the same test on W6's busiest kept callee was not truncated (16/30, `truncated: false`) because W6 has the derived fence. `/users/{userId}` alone reaches 8 writer methods and 11+ client calls today (65 Swift facts, 6 Angular); if more platforms or more Firestore call sites are added later (W4b growth, another Swift kit, a future Kotlin client), a neighbour walk from a common collection like `/users/{userId}` could grow into a real hub with no mechanism to cap it. Not a defect in what shipped (the design brief only asked for writers and triggers, and unresolved misses are recorded, not hidden) — just worth watching, and revisiting with a fence of the same kind if it becomes a real problem in practice, not preemptively.

2. **The "no Firebase fact touches this collection at all" pattern is now corroborated by a second, independent method, not just W1's callable-name misses.** W1 found 3 dead Swift callables by name matching (`organization-verifySmsOtpCode`, `user-approve/rejectPendingFriendRequest`). W4d's path-based join independently found the *same* dead area from a completely different angle (Firestore collection paths, not callable names): `friends`, `friendRequests` and `pendingFriendRequests` (15 Swift client facts across all CRUD operations) and `accesses/{}/invitations` (6 facts) have **no Firebase writer, reader, trigger, or `firestore_path_touched` fact anywhere** — not "unreachable from this join," genuinely absent from the server side as far as the facts show. Two unrelated extraction mechanisms landing on the same conclusion is stronger evidence than either alone that this iOS/Swift client code is dead or talks to something outside the indexed repos, and is worth flagging to the wiki team as a corroborated finding, not a fresh one-off suspicion.

Nothing else from this build exists only in my head; everything else of substance (the lineage builder's other unordered lookups, the commit-pin-vs-branch note for Step U, the near-miss, every numeric result) is already in the entries above or in `config/repos.json`'s own inline note.

### 2026-09-27: [Lane B] FINAL KNOWLEDGE CAPTURE (session close-out, at the coordinator's request). Not a build item; nothing new tested or changed. No `git add`/`git commit`

A few things that are real and only existed in this session's own context, not written elsewhere:

1. **A sandbox-testing technique used repeatedly (W4a, W3, W4b, W4e, the v2 trigger fix), never named anywhere as a reusable pattern.** To test an extractor change without touching the real held/current run or `run-context.json`: make a scratch directory, copy the pinned clone into it, symlink the real `node_modules` into it, copy the target run's `files.json`/`modules.json`/`run-notifications.json` under a fresh run id, point a scratch `run-context.json` at that id, then run the phase-01/02 scripts with `cwd` set to the scratch directory (they take `projectRoot = process.cwd()`). Run the shared script and the modified copy this way with two different run ids and diff every raw fact file with `runId` stripped; any surviving diff is real. Cheap (seconds), fully isolated, and works because nothing about the scripts is hardcoded to the repo root except `process.cwd()`. Worth writing into a real doc (e.g. `pipeline/README.md` or a testing-notes file) so the next lane doesn't reinvent it or, worse, skip testing because the obvious way (running the real pipeline command) would corrupt `run-context.json`.

2. **`resolvePathValue` (W4a) and the newer resolvers built on the same shape (W4b's, W2's) only follow declaration-site initializers, never constructor-body assignments.** `class X { path: string; constructor() { this.path = '...'; } }` resolves to `no_static_value`, not the literal, because `PropertyDeclaration.getInitializer()` is empty and nothing walks the constructor body looking for `this.path = ...`. Not a live bug today — I checked at the time that all 7 of W4a's remaining unresolved writer sites are `parameter_passthrough`, none is constructor-assigned — but it is a real, silent blind spot the next person improving writer-path or Pub/Sub-topic coverage will eventually hit and might mistake for something else.

3. **`loadEnvTable` (W2, `.env*` parsing) fails closed on any `${`, `` ` ``, or `$(` in a value**, treating it as non-literal. That is deliberately conservative for Pub/Sub topic names (all plain strings today), but if this helper is ever reused for other `.env` config, a value that legitimately contains one of those characters (e.g. a secret with a `$`) would be wrongly reported unresolved rather than read. Fine as shipped; worth a comment if the helper is generalized.

4. **The `readMode: "once"` flag (W4b) is a narrow, textual check, not real dataflow.** `consumedOnce` only recognizes the exact shape `firstValueFrom(docData(ref))` / `lastValueFrom(...)` as the immediate parent call; a `.pipe(...)` in between, or the same call reached through an intermediate variable, would not be flagged even though the read is still "once" in effect. Matches the one real site in Angular today; anyone adding more Angular Firestore reads should know the flag can under-report.

5. **Adding a new extractor-side helper module under `_shared/` needs zero registration anywhere** (`pipeline/facts-postgres-index/_shared/firestore-client-calls.ts`, `pubsub-publish-topics.ts`) — no `package.json` script, no manifest entry, nothing beyond the relative `import` in `01-extract-ast-evidence.ts`; `ts-node` resolves it like any other TS file. I relied on this every time and it always worked; worth confirming explicitly so nobody wastes time looking for a registry that doesn't exist.

6. **`pubsub-publish-topics.ts`'s `signatureMemo` is a module-level `Map` cache**, safe only because every `npm run pipeline:*` invocation is a fresh `node` process (one extraction run per process). If phase-01 scripts are ever refactored to be importable/composable within one long-lived process (there is already a hint of that direction: `sync-facts.ts`'s own comment about being import-safe without triggering `main()`), this cache would leak stale AST-node keys across runs. Not a risk today; would be a real, hard-to-diagnose bug if that refactor happens without noticing this file.

Nothing else comes to mind that is real, checked, and not already in doc 43 or the wiki-facing docs. Session close-out acknowledged; thank you.

### 2026-09-27: [Lane C] FINAL CAPTURE NOTE (session end, requested by the coordinator) — three things not written elsewhere

No DB access, no edits beyond this entry, no git add/commit. Checked each item against the committed code and the rest of doc 43 before writing it down, so nothing here duplicates what is already recorded.

1. **A latent fragility in `pipeline/swift/phase-01-ast-extraction/_shared/firestore-client-calls.ts` (W4c), undocumented in the code itself.** The wrapper-method table (`wrappers`, built in `extractFirestoreClientCalls`) is keyed only by **method name**, not by (class, method): the first call site that touches a path-enum ref property sets `baseClass` for that name, and every later call with the same method name — even from an unrelated class — is folded into the same entry (`w.enums.add(...)`, no class check on write). Today this is harmless: verified against the live swift-cloud-kit facts, every wrapper name (`get`, `getAll`, `create`, `update`, `delete`, `documentSnapshotListener`, `collectionSnapshotListener`, `getPaginated`) is defined exactly once, on `OSKCKFirestoreService`. But if a **future** class anywhere in swift-cloud-kit (or a future repo running the same shared code) defines its own method literally named e.g. `get` or `delete` that also happens to touch a differently-named ref property of some other enum, the two would silently merge into one wrapper entry with the wrong `baseClass`, corrupting both its `operation` (unioned from both) and which calls are treated as "calls from a subclass, not the base". No test would catch this quietly; it would show up only as wrong `operation`/`pathKind` on new facts after a future re-extract. Worth a comment in the file and/or scoping the wrapper key to (baseClass, method) if this repo grows more service classes.

2. **W2's proposal only examined firebase's 7 wrong-argument publish facts; node-iot's own 2 `pubsub_publish_call` facts were never checked for the same class of bug.** The join's own detail text (quoted at doc 43 line ~1519 above) reports "16 pubsub_publish_call facts (firebase-oskey-dev 14, node-iot-api-oskey-io 2)" — I used that count but never opened node-iot's extractor or source to see whether its 2 facts have an analogous argument-mapping issue (a wrapper whose first argument isn't the topic). If node-iot's publish side is ever revisited, check those 2 facts the same way this session checked firebase's 14.

3. **The Step U "+600 net facts / 7k–9k facts to embed" figures are a rough heuristic, not a count.** They come from extrapolating the repo's existing lines-of-code-to-facts density (0.27 facts/line) onto the 9,188 added source lines, plus the line-shift/hunk classification of *existing* facts (which *is* an exact count, cross-checked against the diff hunks). The *new*-fact estimate has no such grounding — TypeScript facts-per-line varies a lot by what kind of code is added (a big data-only CSV importer service undercounts against a small decorator with many properties). Whoever runs Step U's held run should treat the real gate output as authoritative and not be surprised if the new-fact count differs from this estimate by a wide margin.

Nothing else from this session's context is missing from doc 43 or the wiki-facing docs, to the best of my own review. Lane C signing off.

### Coordinator note 2026-09-27 (about 13:00 UTC): sequencing decided; baseline recorded for the future firebase v2 case study; wiki team not yet asked to define "settled"

- **User's decision (challenged, understood, adjusted):** the wiki project is in its initial design/build phase, so a concrete "settled" checkpoint is not defined now (all 5 challenge points below are logged and understood, to be revisited once the wiki side has a real shape). Sequence stands as: (1) hand the wiki team this clean, committed baseline now; (2) they build/design against it; (3) once genuinely settled (steady, ongoing real use, not just "finished a validation pass" -- see point 2 below), come back and run the firebase v2 staging extract as **case study 1** (pipeline performance under a major upstream migration); (4) if that succeeds, run **case study 2** (wiki performance/resilience when a major upstream migration lands under it).
- **The 5 points raised, logged for whoever resumes this:**
  1. Define "settled" as a concrete checkpoint before treating it as a gate, not a vibe (deferred -- wiki is pre-design, no checkpoint to define yet).
  2. For case study 2 to measure the right thing, "settled" must mean the wiki is in **steady, ongoing real use** of the facts at the moment the migration lands, not "finished validating and moved on" -- otherwise there is no live usage left to disrupt and case study 2 collapses into case study 1 again.
  3. Staging keeps moving (22 commits / 230 files in ~2.5 months, last merge 2 days before Lane C's snapshot); an open-ended wait makes the eventual diff bigger and stales Lane C's analysis. Recommend a soft time ceiling on the wait rather than none, and treat **re-running the upstream diff fresh** as the mandatory first step on resumption -- never reuse today's numbers.
  4. Tell the wiki team NOW, as part of onboarding them to this baseline, that a future major upstream migration is expected to break some citations (the renamed `organization_intercom_ communication` folder, ~546 facts) by design -- so case study 2 tests resilience to a flagged, known risk, not an unannounced ambush. Not yet done (wiki is pre-design; revisit when there is a real audience for this warning).
  5. Even after the wait, do not jump straight to the full pin+re-extract+embed run: re-fetch staging first and confirm the v2 object-literal trigger shape the merged fix expects hasn't changed again, as one more cheap check before committing to the real spend.
- **Case study 1 success criteria, written down now while Lane C's predictions are fresh** (so "monitor" has a pass/fail bar, not just an impression later): parse-error rate stays at the tolerance-0 bar on the changed files; fact-ID churn lands near the predicted ~546 renamed (from the folder rename) + ~1,970 modified-region facts, net roughly +600 facts; embed token spend lands near whatever FRESH estimate is taken at resumption time (do not reuse the 0.55-0.85M token figure without re-checking); edges go dangling then clear to 0 after `pipeline:edges`; and, the actual point of the exercise, the real v2 Firestore triggers resolve correctly under the merged fix (not just the synthetic test case) -- confirm this specifically, since it is the one thing the fix has never seen live data for.
- **Live baseline recorded for future comparison** (checked live via a `build-edges.ts --dry-run`, nothing written): **69,643 facts, 19,816 edges, 0 missing embeddings, 0 dangling, all 23 edge_sync_state slices "ok"** (every recorded fingerprint matches the current fact set). Every repo's `config/repos.json` entry matches its current `extraction_runs` row exactly: firebase `commit 00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3`, angular and node-iot `branch staging` (current runs `8345d222` / `a6cba122`), swift kits and ios on their normal pins, android-intercom `develop`. **This is the reference point case study 1 and case study 2 both measure change against.** Nothing needs re-running now; the database is fully synced, embedded and edge-consistent as of commit `5db6288`.
