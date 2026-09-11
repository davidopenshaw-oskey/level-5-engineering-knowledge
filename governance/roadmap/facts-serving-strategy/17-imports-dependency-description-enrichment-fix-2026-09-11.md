# `imports_dependency` Description Enrichment Fix, 2026-09-11

Found while checking `sync-facts.ts`'s real readiness for its first-ever Swift sync (`ios-oskey-dev` family, P1 now complete — see `governance/roadmap/ios-oskey-dev/17-task12-followup-imports-dependency-resolution-2026-09-10.md` and `18-cross-repo-dependency-graph-deferred-to-p2-2026-09-10.md`), not something anticipated in advance.

## The real gap

`descriptionFor()` in `pipeline/facts-postgres-index/sync-facts.ts` had enrichment branches for most real fact kinds (`api_contract`, `call_expression`, `model_property`, `angular_route`, Kotlin's sealed hierarchies/composables, Swift's enum cases/inheritance, etc.) but **never had one for `imports_dependency`**, in any language, since the very first version of this script. Confirmed directly against live Postgres, not assumed: **2,547 real `resolved_in_repo` `imports_dependency` facts already sit unenriched** across the 4 repos already synced —

| repo | resolved_in_repo facts affected |
|---|---|
| `firebase-oskey-dev` | 1,740 |
| `angular-app-oskey-io` | 491 |
| `android-intercom-oskey-io` | 244 |
| `node-iot-api-oskey-io` | 72 |

Every one of these facts already carried a real `resolvedTargetModule` (and for Firebase/node-iot, a real `resolvedTargetSubmodule`) in its `payload`, but that information never reached the `description` text actually used for embedding/retrieval — a real, silent, cross-language gap, not a Swift-specific one, that just happened to surface while checking Swift's own readiness.

## The fix

Added a new `importsDependencyDoc` branch to `descriptionFor()`, real and general across every language: fires only when `resolvedTargetModule` is actually populated (an external/unresolved import — whatever this repo's own real status string calls it: `external_or_unresolved` / `unresolved_by_compiler` / `resolved_outside_module_boundary` all appear for real across this project — has nothing further, true, non-fabricated information to add beyond the bare import name already shown, so it stays silent rather than restating "unresolved"). Renders as:

```
... -- resolves to: {targetRepo}/{targetModule}/{targetSubmodule} ({importResolutionStatus})
```

`resolvedTargetRepo` (only present, and only ever populated, for Swift's `resolved_cross_repo` facts — see `ios-oskey-dev/17-...md`) is the one piece with no TS/Kotlin analog: a `resolved_cross_repo` fact names a *different repo*, not just a different module in the current one, and no existing field could express that.

## Verified for real before calling it done

Ran `descriptionFor()` directly against 4 real fact payloads, not just read the code:

- Swift `resolved_cross_repo` (`ios-oskey-dev` importing `swift-ble-kit-oskey-dev`): `"... -- resolves to: swift-ble-kit-oskey-dev/OSKBluetoothLEKit (resolved_cross_repo) ..."`
- Swift `resolved_in_repo` (`OSKEYTests` -> `iOS App`, the real `@testable import OSKEY` case): `"... -- resolves to: iOS App (resolved_in_repo) ..."`
- Swift `external_or_unresolved` (`import CoreBluetooth`): unchanged, correctly silent — no fabricated text.
- **A real, already-synced Kotlin fact pulled live from Postgres** (`android-intercom-oskey-io`, `OSKGattServerManager.kt`'s own real `import io.oskey.ble_intercom_lib.definition.OSKUUIDTable`): `"... -- resolves to: kotlin-ble-kit-oskey-io (resolved_in_repo) ..."` — confirms the fix retroactively improves already-live data, not just future Swift syncs.

## Not yet done

The fix is in the code (`descriptionFor()`), but the 2,547 already-synced facts above still carry their OLD, unenriched `description` in Postgres until each affected repo/module is re-synced (`sync-facts.ts` only recomputes `description` — and invalidates the embedding — on its next real run for that repo/module; it does not retroactively rewrite rows sitting untouched). Re-running the 4 existing repos' syncs to pick this up is a real, low-risk, additive follow-up (upsert-based, and only descriptions that actually change get their embedding invalidated) — not done automatically here, since it touches already-live, already-embedded production data and wasn't asked for in this pass.
