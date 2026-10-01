# Extraction update for the wiki team: Swift method-level calls (T-130), 2026-10-01

**From:** the extraction pipeline. Answers `2026-10-01-extraction-swift-calls.md` (T-130) items 1 and 2. Everything below is live in `facts_index` as of about 23:00 CEST on 2026-10-01. **Take a fresh copy to re-test.** Item 3 is still waiting for your description.

**Since your reference copy (`facts_index_20260927`):** facts **69,643** (unchanged), edges 19,816 → **22,058** (+2,242), facts without an embedding 0, dangling edges 0. **No `fact_id` or `fact_ref` changed** in any repo, and every pre-existing edge is byte-identical, so your citations and existing queries are unaffected.

## Item 1: app → kit method calls: done

- **New edge type `PACKAGE_METHOD_CALL`** (`provenance: ast_derived`, all `resolved`): an iOS call site → the kit **method** it calls. 404 edges into 4 kits (cloud 227, ui 146, ble 20, webrtc 11), 0 unresolved.
- **Your test case:** `OSKInviteGuestViewModel.swift:203` → `OSKCloudKit::OSKCKUserInvitesService.userSendInvitation` (`OSKCKUserInvitesService.swift:26`). The same for the quick-code flow: `OSKPinCodeGenerationViewModel.swift:59` → `OSKCKPinCodeService.generatePinCode` (`:27`).
- **The source carries the caller's class and method**: `source_symbol` is `<file>:<line> -> <callerClass>.<callerMember>`. `attributes` holds `memberResolutionMethod`, `calleeMember`, `callerMember`, `callerMemberKind`, `matchedBy`, `targetKind` and `memberTargetIsProtocolRequirement`.
- `PACKAGE_SYMBOL_USE` (app → kit **type**, 389 edges) is unchanged. A call can have both: it uses the type, and it calls the method. **If your queries filter on a named connection type, add `PACKAGE_METHOD_CALL`** (or use `LIKE 'PACKAGE_%'`).

## Item 2: in-app calls with no target: fixed by adding edges alongside the old ones

- **Cause:** the Swift resolver only ever resolved the first word of a call (`userInviteService` in `userInviteService.userSendInvitation(...)`), never the method. And the old `INTRA_REPO_CALL` edges for Swift never had targets by design, so traversal never followed them.
- **Fix:** member-level resolution in the Swift extractor (property types, `Type.shared.method`, the caller's own type, initializers, overloads by argument labels, supertypes). New `INTRA_REPO_CALL_DECLARED` edges (resolved, with targets): ios **1,283**, webrtc 202, cloud 136, ui 84, ble 59.
- **The old target-less `INTRA_REPO_CALL` rows are still there, unchanged** (keeping existing data stable was a hard rule). The new edges sit alongside them, from the same call facts.
- **Your counts, our method** (edges from the source / of those with a target):

  | Source | Before | After |
  |---|---|---|
  | `OSKInviteGuestViewModel.sendUserInvitation` | 18 / 1 | 22 / **5** |
  | `OSKInviteGuestScreen.swift` (whole file) | 27 / 2 | 34 / **9** |

  Your own method (15 of 16 / 14 of 15) needs re-running on the fresh copy; the "with a target" share should rise the same way.

## Also new, worth knowing

- **node-iot now has same-repo call edges:** `INTRA_REPO_CALL_DECLARED` 74 (its first followable intra-repo edges).
- **New payload fields on Swift `call_expression` facts** (additive; legacy fields unchanged and still root-level): `memberResolutionStatus`, `memberResolutionMethod`, `memberDeclarationFile` / `Line` / `Module` / `Class` / `Method` / `Repo`, `memberUnresolvedReason`, `memberCandidateCount`, `memberTargetIsProtocolRequirement`, `calleeMember`, `callerMember`, `callerMemberKind`. **`callerMember` names the enclosing member for 17,173 of 17,442 iOS calls**, including computed properties such as `body` (the old `callerFunction` covered 5,640). So SwiftUI button actions are now attributable to the view property they sit in.
- **On Swift `model_property` facts:** `declaredTypeName`, `declaredTypeSource`, `propertyScope`. **Data-quality note:** about a quarter of Swift `model_property` facts (iOS 1,144 of 4,350) are **local variables inside functions**, not type members. That's long-standing behaviour. Filter with `propertyScope = 'member'`.
- **`memberTargetIsProtocolRequirement = true`** (81 W6 edges; 41 iOS calls) means the target is a protocol's requirement, not the implementation that runs.
- **Hubs:** on W6, very heavily called targets are skipped by a data-derived fence (iOS: `trackEvent` 62, `trackScreen` 43, `triggerHapticFeedback` 17, one `init` 18). On `PACKAGE_METHOD_CALL` nothing is skipped: `OSKUIExpanded.init` has 79 incoming edges (plus 85 `PACKAGE_SYMBOL_USE`), so a walk from it is large. Traversal-side hub handling is a known follow-up on our side.

## Still open on our side

- Android (Kotlin) has the same root-only resolution gap (3,716 `INTRA_REPO_CALL` edges, none with a target); it's next, using the same contract.
- 6 node-iot calls point at their own import line (the alias defect fixed for Firebase earlier); 5 are real in-repo functions.
- No edge yet from a method's declaration to the call facts inside its body. A walk reaches `OSKCKUserInvitesService.userSendInvitation` (`:26`) via `PACKAGE_METHOD_CALL`, but the `HTTP_API_CALL` to `user::createUserInvitation` starts at the call fact at `:37`. Join them yourself on (file, `callerClass`, `callerMember`) until we add a containment link.
- Call descriptions will soon name the resolved target class and repo (about 2,300 Swift call facts re-described and re-embedded; IDs unchanged). A follow-up note will confirm when it lands.
