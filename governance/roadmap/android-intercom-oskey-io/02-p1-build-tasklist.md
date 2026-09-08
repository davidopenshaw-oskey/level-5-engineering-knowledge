# P1 Build Task List — `android-intercom-oskey-io`

Real, ordered build tasks for this repo's own `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/`, following the same convention as `facts-serving-strategy/05-tasklist.md`/`09-p2-build-tasklist.md` — struck through with a resolution note once done, not a running brainstorm. Grounded in the real investigation in `00-phase1-ast-extraction-design.md` and the standing principles in `01-standing-principles-and-lessons-from-ts-facts-pipeline-2026-09-07.md` — read both before starting any task below.

**Status:** Not started. All tasks below are build-mode work, deliberately not begun in the same session as the investigation, per this project's own session-scope discipline (`CLAUDE.md`) and a real, explicit checkpoint with the user (2026-09-07).

---

## Tasks

1. **Decide the real Kotlin extraction tool.** Open, not resolved by market research alone (`market-research/08-findings-swift-kotlin-ast-extraction-2026-09-06.md` §2): standalone Kotlin Analysis API (only Sourcegraph/JetBrains-adjacent adopters found for extraction specifically — a real, honest gap) vs. `sourcegraph/scip-kotlin` (a real, named, currently-maintained compiler-plugin route with a free snapshot/golden-testing verification tool as a bonus, per `market-research/10-...md` §5) vs. a lighter kotlinc-driven approach. This session verified the underlying K1 compiler frontend resolves real types cleanly (real `./gradlew compileDevelopmentDebugKotlin` success) — that derisks the *toolchain*, not the *tool choice*. Needs a real, small prototype of each candidate against this actual repo before committing, not a decision from research alone.

2. **Design this repo's own `config/repos.json`-equivalent config shape.** Per standing principle 1 — not forced into the existing single-`modulesRoot`-string shape. Real candidate: an array of Gradle module roots, or (better, per principle 2) no static module list at all — read `settings.gradle.kts`'s real `include(...)` calls dynamically at scan time instead. Branch: `develop` (decided). Scope: all 5 modules (decided).

3. **Write the `00-scan-repo.ts` port.** Real clone + checkout of `develop` (same fail-closed branch/commit validation as the existing scripts). Module list: dynamic, from `settings.gradle.kts`, per principle 2 — no hardcoded array, unlike node-iot's own precedent (explicitly not being copied here). Submodule detection inside `app`: the real BFS-from-`NavHost`-`composable()`-calls candidate (`00-...md`), extracting the real screen/route list from `OSKIntercomNavigation.kt`'s AST dynamically, not a fixed list. Open sub-question, not yet decided: do the 4 library modules (5-17 files each) need submodule partitioning at all, or — like node-iot's single ~166-200K-token module — are they small enough that module-level profiles suffice without a capability-pack split? Check real token-count estimates before deciding, same discipline as node-iot's own feasibility check.

4. **Write the `01-extract-ast-evidence.ts` port**, once task 1's tool choice is real and working. Real, known-must-have items from day one, not discovered the hard way like TS was (`01-standing-principles-...md`): full `enum class` member extraction AND full `sealed class`/`sealed interface` subclass extraction (both closed-set-value kinds — TS only had one and paid a real, measured retrieval-quality cost finding the gap); generic-type-argument descent for wrapper types (`Flow<T>`, `StateFlow<T>`, `Result<T>`, Hilt `@Provides` returns) and for heritage clauses (real base-class generic instantiation, not just the resolved declaration) — not yet confirmed which of these patterns actually occur in this repo's real code, check directly once this task starts.

5. **Design and build the domain-specific "wire format" fact types**, the real Kotlin-specific extension candidate from `01-standing-principles-...md`: BLE GATT service/characteristic UUIDs (`kotlin-ble-kit-oskey-io`), USB vendor/product IDs and command constants (`kotlin-usb-oskey-io`), WebRTC signaling event/message-type names (`kotlin-webrtc-data-oskey-io`) — this repo's own analog to the TS pipeline's proven `firestore_path_touched` win. Real, not yet scoped: exactly what these look like as extracted facts, and whether they're detectable via static AST alone (a literal UUID string constant) or need runtime/config inspection too.

6. **Verify real extraction coverage**, before trusting any of the above. Same discipline as the TS pipeline's own "92 of 160" technique — an independent grep/regex count of a specific real construct, cross-checked against what the extractor actually found. If task 1 lands on `scip-kotlin`/SCIP, real, named `scip snapshot` golden-testing (`market-research/10-...md` §5) is a real, more mature alternative/supplement worth using instead of only the reactive grep-check.

7. **Design what gets embedded, per fact kind — a separate task from extraction itself, per the most-repeated real lesson in `01-standing-principles-...md`.** Don't assume extraction correctness implies the embedded search text is complete. Audit each new Kotlin fact kind explicitly (Composable declarations, `@Inject`/`@HiltViewModel` sites, sealed-class/enum values, the wire-format facts from task 5) the same way the TS pipeline had to fix `descriptionFor()` five separate times after the fact.

8. **Downstream scripts** (`02`-`07` equivalents — module evidence, resolved graph, capability packs, cross-/intra-module coupling) — port once `00`/`01` are real and verified, not before. Likely mostly mechanical once the fact schema (tasks 4-5) is settled, per the "byte-identical at the relevant sections" precedent already observed across Firebase/Angular/node-iot's own copies of these scripts.

---

## Explicitly not in this task list

- The standalone P2/MCP-serving side for this repo's facts (Postgres sync, embedding, search) — downstream of P1 even being real, not scoped here.
- Any resolution of the `mcp-server`/`_shared` coupling question — that's Task 1 (a peer session, in progress as of 2026-09-07), independent of this list.
