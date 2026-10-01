# Extraction update for the wiki team: Android (Kotlin) method-level calls and a node-iot fix, 2026-10-01 (round 2)

**From:** the extraction pipeline. Follows `2026-10-01-extraction-update-t130-swift-calls.md`, and closes two of its "still open" items. Everything below is live in `facts_index` as of about 23:55 CEST on 2026-10-01. **Take a fresh copy to re-test.**

**Since the T-130 update:** facts **69,643** (unchanged), edges 22,058 → **22,678** (+620), facts without an embedding 0, dangling edges 0. **No `fact_id` or `fact_ref` changed** in any repo, and **all 30 edge slices that existed before are byte-identical**, so your citations and existing queries are unaffected. The only new slice is the Android one below. Two repos have a new current run: android-intercom-oskey-io `20261001_213350-ee4493bf` and node-iot-api-oskey-io `20261001_212348-a6cba122`. Both are the same upstream commits as before; only the extraction changed.

## Android (android-intercom-oskey-io): followable same-repo call edges

- **Before:** 3,716 `INTRA_REPO_CALL` edges, none with a target, so a walk could never follow a Kotlin call. It was the same root-only resolution gap Swift had.
- **Now: 615 new `INTRA_REPO_CALL_DECLARED` edges** (all `resolved`, each targeting the called method's `function_declaration` fact; 52 cross Kotlin module boundaries, for example app → kotlin-ble-kit). The old 3,716 `INTRA_REPO_CALL` rows are still there, unchanged.
- **How they resolve** (`attributes.memberResolutionMethod`): the caller's own class 260, a typed property 135, `Type.method()` / object / companion 102, a top-level function such as a Compose screen calling another composable 85, **a typed function parameter** 29 (how Compose screens reach their ViewModel: `viewModel.closeSession()` → `ConnectionViewModel.closeSession`), supertype 4.
- **Hubs:** 6 very heavily called methods are skipped by the same data-derived fence as Swift (fan-in above 16): `ButtonTestBenchComponent` 26, `OSKSignalingService.emit` 24, `sendIntentToServiceClass` 18, `trackEvent` 17, `setDevice` 17, `checkAndStopLocalRingBackTone` 16 (118 edges in all).
- **`memberTargetIsProtocolRequirement = true`** (57 edges) means the target is an **interface** method without a body (for example a repository interface), not the implementation that runs. The description text says "protocol requirement", Swift's word; for Kotlin, read it as "interface method".

## Android: new fields on facts (additive; every existing field is unchanged)

- **`call_expression`** (all 5,505): the same `member*` fields as Swift (`memberResolutionStatus`, `memberResolutionMethod`, `memberDeclarationFile` / `Line` / `Module` / `Class` / `Method`, `memberUnresolvedReason`, `memberCandidateCount`, `memberTargetIsProtocolRequirement`), plus `calleeMember`, `callerMember`, `callerMemberKind`. 733 calls are member-resolved. Two Kotlin-only tier values: `resolved_via_parameter_type` and `resolved_via_package_function`. `memberDeclarationRepo` is never set (everything is in one repo). Constructor calls stay unresolved (`memberUnresolvedReason: constructor_call`), because Kotlin has no separate constructor fact to point at.
- **Descriptions:** those 733 calls now end with `-- calls method: <Class>.<method>` (no class for top-level functions), so vector search finds a method's callers. On 30 of them, the old `-- resolves to: <file>` segment was dropped, because it named the wrong file (two functions with the same name).
- **`model_property`** (all 1,594): `propertyScope`, `declaredTypeName`, `declaredTypeSource`. **Data-quality note, the same as Swift:** 730 of them are **local variables inside functions**, not class members. Filter with `propertyScope = 'member'` (853).
- **Known label artefact:** 16 calls into two files the parser can't fully read (`OSKBaseBenchmarkViewModel.kt`, `OSKMainActivityViewModel.kt`) are labelled `resolved_via_package_function` with no class. Their targets are correct; only the label is less specific.

## node-iot: 5 calls that pointed at their own import line

- **Fixed:** calls to an imported function used to "resolve" to the import line in the calling file. They now carry `evidence.aliasedDeclarationFile` / `Line` / `Class` / `Method` (the same fields as Firebase), and W6 follows them. node-iot `INTRA_REPO_CALL_DECLARED` goes **74 → 79**; the 5 new edges have `attributes.viaAlias = true`. The old 74 are unchanged.
- The 4 keys are present (null when unknown) on all 761 node-iot call facts, as in Firebase. The lodash `isEqual` call stays without a target (external package).

## Still open on our side

- No edge yet from a method's declaration to the call facts inside its body (as described in the T-130 update), and no traversal-side hub handling. These are next, as one design.
- Angular: checked, the same import-alias pattern there is almost entirely calls into external libraries (Angular, rxjs), which get no in-repo target by design; only 1 call is an in-repo function.
