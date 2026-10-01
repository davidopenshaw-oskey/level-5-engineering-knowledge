# Call resolution and same-repo call edges: findings and plan (2026-10-01)

**Status:** investigation done, read-only; nothing built, no DB write, no spend. Awaiting the user's decisions in §5.

**Trigger:** the wiki team's request T-130 (`wiki/docs/handoffs/2026-10-01-extraction-swift-calls.md` in the wiki repo; their prompt was pasted into this session, not copied here). It asked for:
1. App → kit **method** edges. Test case: `OSKInviteGuestViewModel.sendUserInvitation` (ios-oskey-dev) → `OSKCKUserInvitesService.userSendInvitation` (swift-cloud-kit-oskey-dev).
2. A fix for in-app call edges with no target.

The user widened the scope: (a) same-repo call edges, (b) the extractor fix behind (1), and (c) checking every repo, not just Swift, for the same miss.

Related: `consolidation/swift-ios.md` §7b-1; `dynamic-pipeline-architecture/43-...md` W6 (the Firebase/Angular precedent); doc 38 P7.

---

## 1. Every repo, live (read-only, 2026-10-01)

Intra-repo call edges and whether traversal can follow them (traversal follows only `resolved`/`confirmed` edges with a target):

| Repo | `INTRA_REPO_CALL` | With target | `INTRA_REPO_CALL_DECLARED` (W6) | Followable today |
|---|---|---|---|---|
| firebase-oskey-dev | 2,382 (2,360 confirmed) | 2,360 | 1,420 | **yes** |
| angular-app-oskey-io | 348 (284 confirmed, 39 probable) | 323 | 303 | **yes** |
| node-iot-api-oskey-io | none (switched off in `config/repos.json`) | — | none (excluded from W6 by user decision, 2026-09-27) | **no** |
| android-intercom-oskey-io | 3,716 (656 probable, 3,060 unresolved) | **0** | none | **no** |
| ios-oskey-dev | 8,734 (2,525 probable, 6,209 unresolved) | **0** | none | **no** |
| swift-ble-kit-oskey-dev | 245 | **0** | none | **no** |
| swift-cloud-kit-oskey-dev | 510 | **0** | none | **no** |
| swift-ui-kit-oskey-dev | 625 | **0** | none | **no** |
| swift-webrtc-kit-oskey-io | 651 | **0** | none | **no** |

Resolved call facts whose declaration is in the same repo (the raw input a same-repo edge needs):

| Repo | Resolved calls with `declarationFile` | Declaration in this repo |
|---|---|---|
| firebase-oskey-dev | 5,907 | 4,554 |
| angular-app-oskey-io | 2,363 | 1,555 |
| ios-oskey-dev | 5,227 | 4,838 (+389 into the kits) |
| android-intercom-oskey-io | 656 | 656 |
| swift-ui-kit / cloud-kit / webrtc-kit / ble-kit | 300 / 188 / 163 / 71 | all |
| node-iot-api-oskey-io | 277 | 116 |

**Answer to (c):** the miss is not Swift-only. **android-intercom (Kotlin)** has exactly the same gap (no followable intra-repo edges, 656 resolved in-repo calls). **node-iot** has none either, but that was a deliberate decision, made on the resolved-graph numbers (0 confirmed/probable edges). The W6-style facts-based join was never sized for node-iot: 116 in-repo resolved calls. Worth a re-decision; it's small.

## 2. Why W6 doesn't already cover Swift and Kotlin

`intraRepoCallDeclaredJoin` (`pipeline/facts-postgres-index/build-cross-repo-edges.ts:1633-1730`) discovers source repos by `evidence.resolutionStatus = 'resolved'` (`:1640`), and matches a call to its callee by `declarationFile` + `declarationLine` + `declarationMethod`/`declarationClass` (`:1688-1698`). Those are the TypeScript extractors' fields. Swift and Kotlin call facts carry only `resolutionMethod`, `declarationFile` and `declarationModule` (plus `declarationRepo` cross-repo). There's no line, no method and no status, so the join never sees them.

Live samples, one per language:
- **Swift:** `{calleeExpression: "OSKAppViewModel", callerClass: "OSKApp", declarationFile: ".../OSKAppViewModel.swift", resolutionMethod: "resolved_via_same_target"}`
- **Kotlin:** `{calleeExpression: "OSKAccesses", callerName: "invoke", callerClass: "OSKGetAccessesUseCase", declarationFile: ".../OSKAccesses.kt", resolutionMethod: "resolved_via_import"}`
- **TS (node-iot):** `{..., declarationFile, declarationLine, declarationClass, declarationMethod, resolutionStatus: "resolved", callerStartLine, callerEndLine}`

## 3. Root cause of the wiki's item 1: Swift (and Kotlin) resolve the *root* of a call, never the member called

`pipeline/swift/phase-01-ast-extraction/01-extract-ast-evidence.ts:498-527`: a call is resolved by looking up its **root identifier** (`rootIdentifierOf`, `swift-extractor/.../main.swift:186-201`) in a flat name → file table (`declLocation`, `:316-341`). The table indexes classes, structs, enums, protocols and functions by bare name; it has no properties and no (type, member) key. Consequences:

| Call shape (iOS) | Root | Result today |
|---|---|---|
| `OSKAppViewModel(...)` (constructor) | `OSKAppViewModel` | resolved, to the **type** |
| `stopScan()` (implicit self) | `stopScan` | resolved by bare name; collides across classes (accepted limitation, `:309-315`) |
| `OSKBKCentralManagerService.shared.initIfNeeded()` | the class | resolved to the **type's file**, never to `initIfNeeded` |
| `userInviteService.userSendInvitation(...)` (the wiki's test case) | `userInviteService` (a stored property) | **unresolved**: properties aren't in the table |
| `self.foo()` | `self` | `self_reference`, no target (141 in iOS) |

The stored property itself is captured, but without a type: `PropertyFact` (`main.swift:83-90`) is `{name, line, visibility, isStatic, isLet, parentType}`. The visitor (`:410-427`) ignores both `binding.typeAnnotation` and `binding.initializer`. Live, the fact for `OSKInviteGuestViewModel.userInviteService` has no type, although the source says `private let userInviteService = OSKCKUserInvitesService()` (`OSKInviteGuestViewModel.swift:55`). The quick-code flow has the identical pattern (`pinCodeService = OSKCKPinCodeService()`, `OSKPinCodeGenerationViewModel.swift:31`).

**Size (approximate, live):** of iOS's 12,074 unresolved calls, about **1,454** are `<own stored property>.<member>(...)` (root = a property declared on the caller's own type). That's the class of calls a property-type fix opens up. Most of the rest are SwiftUI/Foundation chains, which stay unresolved by design. A further ~2,600 *resolved* calls are dotted (`Type.shared.method()`, `Type.static()`) and currently point at the type rather than the method.

Kotlin's resolver has the same root-only model (`pipeline/android-intercom-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts:468-497`: `calleeText.split(".")[0].split("(")[0]`, matched against a `pkg.Name` type table).

## 4. Proposed plan

Design principle: make Swift (then Kotlin) call facts carry the **same additive fields the TS extractors already emit**. Then the existing W6 join covers them with little more than wider discovery: one join for all languages, not a Swift fork. Nothing existing is renamed (`resolutionMethod` stays).

**Step 1: Swift extractor: member-level resolution (the wiki's item 1; all 5 Swift repos).**
- `PropertyFact` gains `declaredType` (from the type annotation; failing that, from an initializer of the shape `TypeName(...)` or `TypeName.shared`). Any other shape → `null`. No guessing.
- `CallFact` gains the call's member name (the last segment of the callee, e.g. `userSendInvitation`) next to the existing `rootIdentifier`.
- Step 01 builds a `(type, member) → function declaration (file, line)` index from function facts' `parentType`, including extensions (`parentType` = the extended type's name, `main.swift:342-354`). It resolves, in order: (a) `<own property>.member` via the property's `declaredType`; (b) `TypeName.member` and `TypeName.shared.member`; (c) bare `member()` and `self.member()` against the caller's own type first, then the existing flat lookup. Each of (a)-(c) also works cross-repo through the kit declaration tables already loaded for `resolved_via_import` (`01-extract-ast-evidence.ts:112-170`). That's what yields the wiki's `sendUserInvitation → userSendInvitation` edge.
- New additive call fields, TS-compatible: `declarationLine`, `declarationMethod`, `declarationClass`, `resolutionStatus` (`resolved` / `unresolved`), plus `resolutionMethod` values for the new tiers (e.g. `resolved_via_property_type`).
- Bounded test first: the wiki's test case and the quick-code case on a held run, with a before baseline of the resolution counts.

**Step 2: same-repo edges for Swift (the wiki's item 2).** Widen W6 discovery so Swift repos are picked up. The match then uses the new fields unchanged. The run-time hub fence applies per repo (`OSKUIExpanded`-style SwiftUI hubs are exactly what it's for). Cross-repo app → kit **method** edges: either extend `PACKAGE_SYMBOL_USE` to target the method fact when `declarationMethod` is set, or add a method-level type. To decide (§5).

**Step 3: Kotlin (android-intercom), same two steps.** Same field contract; Kotlin's resolver is string-split based, so it's its own design pass. Sized separately after Swift lands.

**Step 4: node-iot re-decision.** 116 in-repo resolved calls already carry the TS fields. Turning W6 on for node-iot is a config change plus a dry-run, no extractor work.

## 5. Decisions needed from the user

1. **Order.** Recommended: Swift extractor (Step 1) → Swift edges (Step 2) → Kotlin → node-iot. Alternative: the cheap edges first. Not recommended: today's Swift "resolved" calls point at types, so edges built now would be re-pointed once Step 1 lands.
2. **App → kit method edges:** extend `PACKAGE_SYMBOL_USE` (same type, target becomes the method when known), or a new connection type? Recommended: a new type (e.g. `PACKAGE_METHOD_CALL`), so the 389 existing type-level edges and the wiki's queries against them stay byte-identical.
3. **Where to re-extract:** the wiki asked for a **copy** of the DB; our protocol writes live `facts_index` after a dump, in a write turn. Recommended: build and dry-run against a scratch copy, then apply live with a dump. The wiki's reference copy `facts_index_20260927` isn't on this machine and is never touched.
4. **node-iot:** revisit the exclusion (Step 4) now, or leave it?

## 6. Cost and risk

- **Spend:** zero LLM. Embedding: call facts whose description prints their resolution will change. iOS alone could be a few thousand facts at ~143 tokens/fact (`graphrag/03`): roughly 0.3-0.7M tokens, about $0.06-0.15 at $0.20/M. To be measured by the pre-sync gate and flagged before any `EMBED=true`.
- **Fact IDs:** the change is additive, so IDs should be unchanged. The pre-sync gate must prove that for all 5 Swift repos (one shared binary).
- **Known limits that remain:** properties typed by protocol (resolves to the protocol's method, not an implementation); locals and closure parameters; SwiftUI view-builder chains; nested-type name collisions (`enum Text`, `Provider`).
- **Latent:** the flat bare-name table still resolves ambiguous bare calls to the last-indexed declaration. Step 1(c) reduces this by checking the caller's own type first, but doesn't remove it.

---

## 7. User decisions, 2026-10-01

1. **Order: extractor first.** Swift member-level resolution (Step 1) → Swift same-repo edges (Step 2) → Kotlin (Step 3) → node-iot (Step 4).
2. **App → kit method edges: still open.** The user asked which is better, so they can test and monitor how the wiki picks the change up. The trade-off was explained in the session; the recommendation is a **new connection type**. Checked, so it isn't just assumed: `mcp-server/db/graph-traversal.ts:262-268` follows any `connection_type` that is `resolved`/`confirmed` with a target. There's no type allowlist, so a new type is followed with no MCP change. Only wiki queries that filter by a named type would need the new name added.
3. **DB target: scratch copy, then live.** Build and dry-run against a scratch copy of `facts_index`; apply to live after a dump, in a write turn.
4. **node-iot: yes.** Dry-run W6 for node-iot (config switch-off review plus dry-run numbers for the user) as Step 4.

## 8. Follow-ups found during the build (not in scope of lanes S/E)

- **node-iot import-alias self-pointing calls** (Lane E, E1, 2026-10-01): 6 resolved calls whose `declarationFile`/`declarationLine` is the calling file's own import line (`compareAccessLists`, `mergeDeltas`, `isEqual` (lodash), `convertAccessPayloadDateStringToDate`, `isDateString`, `isPubsubPayloadUpdate`). 5 are real in-repo functions. The fix is the `aliasedDeclaration*` extractor change Lane B made for Firebase (doc 43 W1), applied to node-iot's extractor; Angular has the same defect at much larger scale (962 calls with no method name in W6's report).
- **Swift `model_property` facts include function-local variables** (Lane S, S1, 2026-10-01): iOS 1,144 of 4,350 property facts are locals inside functions (cloud 133, ui 53, ble 38, webrtc 101). That's existing extractor behaviour, deliberately left unchanged (changing it would prune facts). The approved `propertyScope` field (`member`/`local`/`top_level`) lets consumers filter them once Lane S's facts are synced. **Tell the wiki team in the downstream note for this initiative**: until then, treat Swift `model_property` as "variable declarations", not "type members".
- **Traversal hub handling (doc 38 P8, still open; sharper after this build):** `OSKUIExpanded` will have 85 incoming `PACKAGE_SYMBOL_USE` plus 79 incoming `PACKAGE_METHOD_CALL` (to its `init`). The user chose not to fence PMC (2026-10-01) and to handle flooding in `mcp-server/db/graph-traversal.ts` instead, e.g. "return the hub with its count, don't expand through it" (`graph-traversal.ts:178-183` anticipates this). Needs its own design, plus a before/after on a real agent run (LLM spend: flag first).
- **No "method → the calls in its body" link (coordinator, 2026-10-01; affects every repo).** Call edges run call fact → callee declaration (`INTRA_REPO_CALL_DECLARED`, `PACKAGE_METHOD_CALL`, `HTTP_API_CALL` from a call site), and `mcp-server/db/graph-traversal.ts` has no containment step (grep for contain/enclos/caller: nothing). So a walk reaches `OSKCKUserInvitesService.userSendInvitation`'s **declaration** (`:26`) through `PACKAGE_METHOD_CALL`, but can't continue to the `HTTP_API_CALL` that starts at the **call fact inside it** (`:37` → Firebase `user::createUserInvitation`). Button → backend is therefore findable hop by hop (search + graph), but not as one continuous walk. Candidate fix: a derived containment edge (declaration → each call fact whose `callerMember`/`callerFunction` + `callerClass` + file match it; TS facts via `callerName`/`callerStartLine`), or a containment step in traversal. Needs its own design; the same gap exists from Firebase trigger handlers to their bodies (doc 38 P7 option b).
