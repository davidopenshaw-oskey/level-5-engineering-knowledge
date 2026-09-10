# Session Hand-off — 2026-09-10

**Purpose of this file:** written proactively ahead of a likely context compaction, not at a natural session close — treat it the same way as `07-session-handoff-2026-09-09.md` (read first, follow its pointers, don't assume this file is the full record). Every real finding from this session is already written into the numbered docs below.

## Read, in this order

1. `09-task1-decision-swiftsyntax-2026-09-09.md` — Task 1 decision (SwiftSyntax), independently confirmed 2026-09-10.
2. `11-cross-pipeline-lessons-checked-against-swift-2026-09-10.md` — real TS/Kotlin lessons cross-checked against Swift; the init/deinit gap this session found and fixed came directly from this audit.
3. `12-pipeline-restructure-shared-swift-scripts-2026-09-10.md` — `pipeline/swift-ble-kit-oskey-dev/` → `pipeline/swift/`, one shared script set for all Swift repos, dynamic module discovery (not hardcoded), `astTool === "SwiftSyntax"` guard. Also records the real Firestore chain-walking risk (not yet live).
4. `10-p1-build-tasklist-2026-09-10.md` — **the live status doc, read last.** Tasks 1-9 DONE. Task 10 (propagate to leaf packages) mostly done as a side effect of validation — 3 of 4 remaining repos (`swift-webrtc-kit-oskey-io`, `swift-ui-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`) fully run through the whole `00`-`07` pipeline and verified; `swift-ai-kit-oskey-io` removed from scope (real file-count discrepancy, not resolved). Tasks 11 and 12 are real, scoped, NOT YET STARTED.

## Where things stand

The Swift pipeline (`pipeline/swift/phase-01-ast-extraction/00-07`) is real, complete, and verified end-to-end (`npm run pipeline:swift-ble-kit` works) for 4 of the 6 original repos. Config entries for those 4 are filled in (`astTool`/`astToolVersion`/`callResolutionStrategy`/`astErrorTolerancePercent`) in `config/repos.json`. `swift-ai-kit-oskey-io`'s entry was removed entirely (not disabled) — real artifacts were cleaned up too.

**Four real bugs were found and fixed in `swift-extractor` this session** (schema now 3.0.0), all via genuine measurement, not guessing — full detail in doc `10`'s Task 9 entry:
1. Generic-class constructor calls with explicit type arguments weren't resolving.
2. Implicit-member-expression shorthand (`.signUp(...)`) produced a confirmed false-positive resolution via name coincidence.
3. **Root-identifier computation was rewritten entirely** from string-splitting to a real recursive syntax-tree walk (`rootIdentifierOf`) — the string approach silently broke for any call chain deeper than ~2 hops.
4. A real, accepted (not fixed) limitation found while verifying #3: `swift-ui-kit-oskey-dev` has its own `enum Text` nested in `Color`, colliding with SwiftUI's own `Text` view — the flat, name-only resolver has no lexical-scope awareness, so ~122 real calls are misattributed. Documented as a known limitation, same class as Kotlin's own accepted call-resolution gaps.

## Real, open, NOT-yet-decided question — exactly what was being asked when compaction interrupted

**Task 11 vs. Task 12 — which to do first, or in parallel?** Both are real, scoped, independent tasks (see doc `10`'s own entries for each):

- **Task 11**: `ios-oskey-dev` itself — needs a real `.pbxproj`/`.xcworkspace`-aware `00-scan-repo.ts` variant (not SPM, no folder-implies-target convention), and resolving 3 real same-target duplicate names (`Provider`, `OSKUserIdKey`, `OSKStreetAddressPickerViewModel`) via direct `.pbxproj` inspection.
- **Task 12**: cross-repo declaration resolution — a real, minimal, direction-agnostic mechanism (each repo checks its own real imports, loads a matching sibling's declaration table if one exists on disk). **CONFIRMED 2026-09-10 with the real iOS dev team**: no traffic between sub-repos, only the parent app talks to them — a deliberate architectural boundary, not coincidental. This means Task 12's only real-world use case today is the `ios-oskey-dev` → leaf-package direction, motivated concretely by the `OSKBKCentralManagerHostViewModifier` shadow case (defined in `swift-ble-kit-oskey-dev`, also locally shadowed inside `ios-oskey-dev`).

**Real dependency worth weighing before deciding order**: Task 12's only real, currently-existing use case is the hub (`ios-oskey-dev`) importing leaf packages — which means Task 12 can't be meaningfully *tested* against real cross-repo data until Task 11 gets `ios-oskey-dev` itself onboarded and scanning. Building Task 12 first would be real, buildable work, but verifying it actually resolves a real cross-repo call correctly would have to wait for Task 11 regardless. This leans toward Task 11 first, then Task 12 — but this reasoning was not yet confirmed with the user before compaction interrupted; surface it, don't just act on it.

## Also real and worth knowing about

- **Standing principle established this session, saved to memory** (`feedback_dynamic_recursive_never_hardcoded.md`): always dynamic discovery and recursive tree walks, never hardcoded assumptions about structure/depth/shape — directly motivated by the real bug history above. Apply this to Task 11's `.pbxproj` parsing and Task 12's design both.
- The other 4 repos in the whole project (`firebase-oskey-dev`/`angular-app-oskey-io`/`node-iot-api-oskey-io` TS, `android-intercom-oskey-io` Kotlin) were **not touched** this session — read-only precedent/template material only.
- Nothing was committed to git this session (per standing project rule — commits are user-initiated only).
