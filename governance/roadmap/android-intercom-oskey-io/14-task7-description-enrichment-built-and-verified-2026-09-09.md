# Task 7 — What Gets Embedded, Per Kotlin Fact Kind

**Status: DONE, 2026-09-09.** Real branches added to the shared `pipeline/facts-postgres-index/sync-facts.ts`'s `descriptionFor()` — the same function every existing repo's facts are embedded through — and verified directly against this repo's real raw fact objects (Tasks 4-6's actual output), not assumed to work from reading the code.

## Real, structural finding this task surfaced: `type`/`id` tagging is a Task 8 concern, not yet done

`descriptionFor()` dispatches entirely on `fact.type`, and the database's primary key is a stable `fact.id`. Checked directly: in the TS pipelines, both are assigned in `02-build-module-evidence.ts` (via a `stableFactId({type, module, file, primaryKey, ...})` helper — format `{type}|{module}|{file}|{primaryKey}[|{secondaryKey}][|#{ordinal}]`), not in `01-extract-ast-evidence.ts`. Kotlin's own equivalent aggregation step doesn't exist yet (Task 8). This task's real, honest scope is therefore: design the real `fact.type` names and enrichment logic now, so Task 8 knows exactly which raw fields must survive into whatever wrapper shape it produces — verified by manually tagging real raw facts with their intended `type` and calling `descriptionFor()` directly, standing in for the full pipeline test that has to wait for Task 8.

## Real fact-type naming decision

Reused TS's exact type names where the underlying concept is identical (`enum_declaration`, `model_property`, `call_expression`) — `descriptionFor()` already had real, working branches for two of these (`call_expression`'s `callerClass`/`calleeExpression`, matching Kotlin's own field names exactly by design since Task 4). New, Kotlin/Android-specific names only where there's no TS analog at all: `kotlin_sealed_hierarchy`, `ble_gatt_constant`, `usb_wire_constant`, `webrtc_signaling_touchpoint`. `function_declaration` reused as-is, enriched with an `isComposable` check rather than invented as a new type — a Composable is still fundamentally a function.

## What got built and verified, per kind (real output shown)

- **`enum_declaration`**: extended (not replaced) the existing TS `unionMembers` enrichment with a richer check for Kotlin's `members: {name, constructorArgs}[]` shape, since Kotlin enum members can carry real constructor values TS's flat string array can't represent. Real output: `possible values: PERMANENT("permanent"), ONE_TIME("oneTime")`.
- **`kotlin_sealed_hierarchy`**: every real subtype, in full, from day one — per `01-standing-principles-...md`'s most-repeated lesson (closed-set values cost real retrieval rank when missing). Real output: all 11 real `Screen` subtypes listed by name.
- **`function_declaration` + `isComposable`**: real output includes the function's real parameters: `-- @Composable (mainActivityViewModel: OSKMainActivityViewModel)`.
- **`model_property` + constructor promotion**: surfaces `owningClass` (which class a Hilt-injected dependency serves) — Task 6's own real fix made this fact kind exist at all. Real output: `context -- injected into: OSKGetAccessesUseCase`.
- **`call_expression`**: extended the existing branch with Kotlin's own real, honestly-tagged resolution (never "confirmed" — see `07-call-graph-resolution-gap-major-finding-...md`). Real output on the exact `OSKAnalyticsService` case central to Task 1's decision: `resolves to: app/.../utils/OSKAnalyticsService.kt (resolved_via_import)` — correctly disambiguates the real target among 3 same-named classes, right in the embedded text.
- **`ble_gatt_constant` / `usb_wire_constant` / `webrtc_signaling_touchpoint`**: the Task 5 wire-format facts. The USB constant's real inline comment is surfaced *first*, before the raw hex value — it's the only place in the codebase stating what a byte value physically does. Real output: `open door command -- value: 0x01`.

## One honest, non-bug observation from the real test

The one real `socketIO?.emit(event.value, ...)` call (Task 5's single genuine wire-protocol emitter) produces `emitter event: event.value` — a variable reference, not a literal event name, because that's genuinely what the real source code contains at that call site (the event name is passed through dynamically, not hardcoded). The description accurately reflects the real code; it isn't a bug in the enrichment logic.

## What's still open

The actual end-to-end sync (real `fact.type`/`fact.id` assignment, real capability-pack aggregation, real Postgres upsert) can't be tested until Task 8 builds Kotlin's own `02`-`05` equivalents. This task's real deliverable is the enrichment logic itself, verified in isolation against real fact objects — Task 8 now has a concrete, tested spec for what shape to hand `descriptionFor()`.
