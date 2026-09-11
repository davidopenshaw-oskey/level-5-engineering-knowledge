# Task 12 Follow-up — `imports_dependency`'s Own Resolution Fields, Fixed for Real, 2026-09-10

Directly requested by the user after Task 12's own write-up flagged this as an explicit, deliberate scope boundary ("we should fix it"). This closes that boundary.

## The real gap

`02-build-module-evidence.ts` always emitted `imports_dependency` facts (one per real `import` statement) with `resolvedTargetModule: null`, `resolvedTargetSubmodule: null`, `importResolutionStatus: "not_yet_implemented"` — permanently, regardless of anything Task 12 built, because Task 12 only touched CALL resolution (`ast-calls.json`'s `resolutionMethod`). The import statement itself — a structurally separate fact — was never resolved at all. Practical consequence: `06-build-cross-module-dependency-graph.ts` (the script that answers "what depends on what") reads exactly this field, so it stayed honestly empty for every repo, forever, even after Task 12 shipped.

## Real, unexpected complication found while fixing this correctly

Building the same-repo resolution case (does an import name one of THIS repo's own other targets?) surfaced a real, previously-unknown fact: an Xcode target's DISPLAY name (what this whole pipeline has been calling `module` — "iOS App") is **not necessarily** the real name you `import` in Swift. Confirmed directly: `ios-oskey-dev`'s `OSKEYTests` target does `@testable import OSKEY` — and "OSKEY" comes from the `iOS App` target's own `PRODUCT_NAME` build setting (`OSKEY`, identical and consistent across every real build configuration checked), not its display name at all. SPM targets never have this indirection (the name you `import` IS the target folder name, by SPM's own real convention) — this is purely an Xcode-project quirk, and `ios-oskey-dev` is the only repo in this family with an Xcode project.

Fixed by adding a real `realSwiftModuleName()` resolver to `pipeline/ios-oskey-dev/phase-01-ast-extraction/00-scan-repo.ts`: reads each target's real `PRODUCT_NAME` (via the real `XCConfigurationList`/`XCBuildConfiguration` objects in the parsed `.pbxproj`), falling back to the target's own name when `PRODUCT_NAME` is the Xcode-default `$(TARGET_NAME)`, then sanitizing non-identifier characters the way Swift/Clang actually derive a module name from a product name. `facts/modules.json` now carries both fields per module: `{module: "iOS App", realModuleName: "OSKEY"}`. The shared `pipeline/swift/00-scan-repo.ts` (used by the 5 SPM repos) also now emits `realModuleName` (always equal to `module` there, for schema consistency across the whole family — real, cheap, no behavior change for those repos).

## What was built

In the SHARED `01-extract-ast-evidence.ts`:

1. `loadCrossRepoDeclarations()`'s existing sibling-module index (built for Task 12's call resolution) now keys by `realModuleName` instead of the display `module`, and also records each sibling's display module name and owner repo together — a small, backward-compatible refinement, verified to cause zero change to Task 12's already-measured 389 resolved calls (the 4 leaf packages have no display/real-name divergence, so this only matters going forward).
2. A new, parallel same-repo lookup (`selfModuleByRealName`, built from THIS repo's own `facts/modules.json`) — the direct Swift analog of Kotlin's own `resolved_in_repo` tier.
3. Real, 3-tier import resolution, applied to every real `import` statement: same-repo checked first (`resolved_in_repo`), then cross-repo (`resolved_cross_repo`, a new status — no Kotlin/TS analog, since only Swift has a real multi-repo family), then `external_or_unresolved` (matches Kotlin's own naming convention, and is now an honest "checked, found nothing" rather than the old, literally-false "not_yet_implemented").
4. New field `resolvedTargetRepo` (only present when set) — a `resolved_cross_repo` fact names a *different repo*, not just a different module in the same one; no existing field could express that.

`02-build-module-evidence.ts` now passes these real fields through instead of hardcoding them to null/placeholder.

## Real, verified result — all 5 relevant repos re-run

| Repo | resolved_in_repo | resolved_cross_repo | external_or_unresolved |
|---|---|---|---|
| `swift-ble-kit-oskey-dev` | 0 | 0 | 56 |
| `swift-cloud-kit-oskey-dev` | 0 | 0 | 177 |
| `swift-webrtc-kit-oskey-io` | 0 | 0 | 143 |
| `swift-ui-kit-oskey-dev` | 0 | 0 | 118 |
| `ios-oskey-dev` | **2** | **316** | 783 |

Leaf packages: correctly all-zero for the two resolved tiers — matches the already-confirmed real topology (no leaf-to-leaf imports exist in this family) — and this is now a *measured* zero, not an unchecked placeholder. `ios-oskey-dev`'s own math reconciles exactly: 2 + 316 + 783 = 1,101 (its real total import count, unchanged).

The 2 real same-repo hits: both `OSKEYTests/*.swift` files' own `@testable import OSKEY`, correctly resolved to `resolvedTargetModule: "iOS App"`. A sample cross-repo hit: `Shared/API/BLE/Models/OSKBLELockPeripheral.swift`'s `import OSKBluetoothLEKit`, correctly resolved to `resolvedTargetModule: "OSKBluetoothLEKit"`, `resolvedTargetRepo: "swift-ble-kit-oskey-dev"`.

**Downstream, real, and previously impossible**: re-ran `06-build-cross-module-dependency-graph.ts` for `ios-oskey-dev` — it now reports a real, non-empty result for the first time in this family's entire history: `OSKEYTests` → 1 outbound edge, `iOS App` → 1 inbound edge, exactly matching the 2 real self-imports above. `06`/`07` required zero code changes to pick this up (both already filtered on `importResolutionStatus === "resolved_in_repo"` specifically, so the new `resolved_cross_repo` status is automatically, correctly excluded from that same-repo view rather than being wrongly conflated with it — confirmed by inspection before running, not discovered by accident).

## Explicitly not done — a real, separate, bigger piece of work

A cross-REPO dependency-graph output (an actual visualization/artifact of "`ios-oskey-dev` depends on `swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, ...") does not exist yet. `06`'s own script is architecturally scoped to edges *within* one repo's own module set — it has no concept of a cross-repo edge at all, by design (see its own header comment). The 316 real `resolved_cross_repo` facts now sitting in `ios-oskey-dev`'s own `ast-imports.json`/module evidence graphs are the real data such a script would consume.

**Deliberately, permanently deferred to P2, 2026-09-10 — see `18-cross-repo-dependency-graph-deferred-to-p2-2026-09-10.md`.** Before building this, checked why the project's prior cross-repo tooling was archived and found it was superseded by a live, Postgres-based pattern (`pipeline/facts-postgres-index/build-cross-repo-edges.ts`), not because cross-repo graphing itself was wrong. Building a new on-disk script here would have reintroduced the exact pattern already retired once. Put to the user directly; the real decision was to stop at P1 -- this fix stands as the complete P1 deliverable, and the artifact is real, deferred, future P2 work, not built now.
