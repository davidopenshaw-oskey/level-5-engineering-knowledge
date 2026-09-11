# Task 12 — Cross-Repo Declaration Resolution, Built and Verified, 2026-09-10

Implements the real, reactive, direction-agnostic design already recorded in `10-p1-build-tasklist-2026-09-10.md`'s own Task 12 entry — no design change, this is the build.

## What was built

`resolved_via_import` (the third call-resolution tier, permanently 0 across every repo in this family until now) is implemented in the SHARED `pipeline/swift/phase-01-ast-extraction/01-extract-ast-evidence.ts` — not a new script, not forked per repo. New function `loadCrossRepoDeclarations()`:

1. Builds a real `moduleName -> ownerRepo` index from every OTHER Swift repo's own already-written `facts/modules.json` (only repos that have actually been scanned at least once — a sibling never run is a real, honest no-op, not an error). No package name is hardcoded anywhere; SPM's own real convention (the name after `import` IS the real target/module name) is what makes this possible without a lookup table.
2. Intersects that index against THIS repo's own real, current `import` statements (collected from the already-extracted `file.imports` — not re-parsed).
3. For each real, currently-imported sibling, loads its `public`/`open` declarations only (Swift's own real access-control rule — an `internal`/`private`/`fileprivate` declaration genuinely is not visible from another module; verified this matters — see the real numbers below).
4. Same-target resolution is checked **first**; cross-repo is only consulted on a same-target miss. This ordering **is** the real "local declaration shadows a same-named import" rule from Task 1/5 — implemented by construction, not a special-cased name check.

Costs nothing for a repo whose real imports never name a sibling (4 of 5 leaf packages) — confirmed by direct re-run: `swift-ble-kit-oskey-dev` produced byte-identical same-target/unresolved counts (71 / 337, 433 total) before and after this change, `resolved_via_import` correctly stayed 0.

## Real, measured result on `ios-oskey-dev` — the one real importer of siblings today

Re-ran `01-extract-ast-evidence` for real:

- **4 of 5 configured siblings loaded** (`swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, `swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`) — `swift-ai-kit-oskey-io` correctly absent (no manifest exists; it was removed from pipeline scope 2026-09-10 for its own unrelated, unresolved reason — an honest no-op, not a bug in this feature).
- **383 public/open declarations indexed**, 91 real flat-map name collisions across the 4 siblings' own combined public APIs (kept-first, same accepted limitation class as same-target resolution already has — not a new problem).
- **389 real calls now resolve `resolved_via_import`** — the first non-zero value for this tier anywhere in this family. Call resolution for `ios-oskey-dev` moved from (389 via-import didn't exist) to `389 via import, 4838 via same-target, 12074 unresolved` (17,442 total calls, unchanged).
- Downstream: `04-build-resolved-graph`'s `crossModuleCallEdges` rose from 108 to 497 — reconciles exactly (108 pre-existing same-target-but-cross-target edges from the 2 real files shared between `iOS App`/`OSKDoorUnlockActivityExtension`, doc 15, + 389 new `resolved_via_import` edges = 497). `06`/`07` stay correctly empty — this task only touched the CALL resolution tier, not `imports_dependency`'s own `resolvedTargetModule` field (see "Explicitly not done" below).

## Real, honest correction to the shadow-rule's own motivating example

Doc `08-swiftsyntax-vs-npm-treesitter-bounded-test-2026-09-09.md` §5c cited `OSKBKCentralManagerHostViewModifier` (defined public in `swift-ble-kit-oskey-dev`, "also locally shadowed inside `ios-oskey-dev`") as the concrete case motivating this whole task. Checked directly once real target-membership and real visibility data existed:

- The local declaration is real (`iOS App/Views/Data Views/OSKBKHostViewModifier.swift:9`) — but it is one of the **13 real orphaned files** found in Task 11 (doc 14 Finding 5): confirmed absent from `project.pbxproj` entirely, not compiled into any target, correctly excluded from extraction by `00-scan-repo.ts`'s own real scope decision.
- It is also declared `private`, not `internal`/`public` — even if it WERE compiled, a file-scoped `private` type cannot shadow anything cross-module in the way originally described; that access level is narrower than the scenario the original finding assumed.

**Net result**: the specific example that motivated this task does not actually exercise the shadow rule in the real, compiled app — a real, worth-recording correction, not swept aside. The underlying capability is still real and independently verified: a direct query of `ios-oskey-dev`'s own real declarations against its 4 real imported siblings' real public APIs found **44 genuine name overlaps** (`connect`, `disconnect`, `unlock`, `sign`, `configure`, `OSKCode`, `CodingKeys`, and others) — same-target resolution is checked first for every one of them, so the shadow rule is exercised 44+ times over in the real, current call-resolution output, just via different real names than the one originally cited.

## Explicitly not done (real, deliberate scope boundary)

- **`imports_dependency`'s own `resolvedTargetModule`/`resolvedTargetSubmodule`/`importResolutionStatus` fields** (built in `02-build-module-evidence.ts`, consumed by `06-build-cross-module-dependency-graph.ts`) are **not** touched by this task — they still emit `null`/`"not_yet_implemented"` for every repo, `ios-oskey-dev` included. Task 12 as scoped was specifically about the CALL resolution tier (`resolutionMethod`) firing `resolved_via_import` — the only mechanism the task doc named. `06`'s own script is additionally scoped to cross-module edges WITHIN one repo's own module set (no concept of a cross-REPO edge at all in its current data model) — resolving cross-repo IMPORT-level edges for real would need a new script/schema, not a small extension of an existing one. Real, worth a future task, not silently rolled into this one.
- No change to `05-partition-capability-packs.ts`/`07-build-intra-module-coupling-graph.ts` — neither reads call-resolution data.
