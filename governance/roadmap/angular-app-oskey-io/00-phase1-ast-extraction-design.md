# Plan 00 (Angular) — Phase 1 AST Extraction Design

**Status:** Proposed — for review. Nothing built, no config or pipeline files touched yet.
**Created:** 2026-08-28
**Repo:** `https://github.com/oskey-io/angular-app-oskey-io`, branch `staging` (resolves to commit `8345d22...` as of this writing)

*First plan under this repo's own roadmap folder, mirroring the convention established in `governance/roadmap/firebase-oskey-dev/`. Written after a real shallow clone of the actual `staging` branch — every structural claim below is checked against the real source, not assumed from "it's Angular, so probably X."*

---

## Why this exists

You asked for the Firebase pipeline's design lessons carried over deliberately rather than rediscovered — this doc is that carry-over, plus a first concrete design for this repo's Phase 1 (fact extraction), informed by actually looking at the code first.

Several things surfaced by cloning the repo that change the plan meaningfully from a straight "same as Firebase" port. Flagging all of them here before writing any extraction logic.

---

## What's actually in this repo (verified, not assumed)

1. **This is not one Angular app — it's two.** `hosting/web-app` (199 `.ts` files) and `hosting/web-admin` (149 `.ts` files), each with its own `angular.json`, `package.json`, and `src/app` tree. They appear to share no code directly (no shared library package visible at the root). Both are Angular 17.3.7.

2. **Naming is inconsistent across three places, worth fixing before it causes confusion later:**
   - GitHub repo: `angular-app-oskey-io` (what you gave me)
   - Root `package.json`'s internal `name` field: `angular-admin-oskey-io`
   - This pipeline's existing placeholder folder (originally `angular-pgo-oskey-dev/`, then briefly `angular-app-oskey-dev/`)
   - **Done 2026-08-28**: renamed to `pipeline/angular-app-oskey-io/`, matching the actual GitHub repo name (it was untracked in git, so a plain filesystem rename was used). Stale references to the old name also fixed in `pipeline/README.md`, `pipeline/cross-repo-synthesis/README.md`, and `pipeline/cross-repo-synthesis/phase-03-ecosystem-topology/06-build-cross-repo-graph.ts`.

3. **This app is standalone-components-first, not `NgModule`-based.** 68 files use `standalone: true`; only 2 use `NgModule` at all. Routing is done via `app.routes.ts` + `app.config.ts`, not a root `AppModule`. This matters because Firebase's submodule-detection convention (look for a folder literally named `modules/`) has no equivalent here — there is no `modules/` folder in either app.

4. **The natural capability/feature boundary is `features/`, but it nests recursively, unlike Firebase's flat one-level `modules/<name>/`.** Example real structure under `web-app`:
   ```
   features/
     home/
     authentication/
     portals/
       organization/
         features/
           settings/
           onboarding-cards/
           notifications/
           entities/
       user/
         organizations/
         settings/
         account/
         notifications/
         invitations/
       sidemenu/
       shared/
   ```
   `portals` alone contains real internal sub-structure at two more levels deep. Partitioning only at the *top* level of `features/` (`home`, `portals`, `authentication` — 3 buckets for the whole app) would dump all of `portals`' real complexity into one oversized bucket — **this is the exact same mistake Plan 05 just spent a full investigation on in the Firebase repo** (one undifferentiated capability pack swallowing a module's real internal structure). Worth deciding the partition depth deliberately here, on day one, rather than discovering it the hard way again.

5. **Modern reactive state, not NgRx.** 63 files use Angular Signals (`signal()`/`computed()`); no `@ngrx`/`@ngxs` in either app's `package.json`. State-management facts should be modeled around Signals and services with `providedIn` scope, not a store/reducer pattern.

6. **`core/` holds the singleton infrastructure**: `guards`, `error-handler`, `injection-tokens`, `firebase` (SDK wrapper), `translate`/`locale` (i18n via `@ngx-translate`), `title-strategy`, `utils`, `types`. This is the closest Angular equivalent to Firebase's cross-cutting concerns (auth guards ≈ RBAC checks, injection tokens ≈ config/secrets).

7. **UI stack**: `@angular/material`, `@ngx-translate`, plus a few small utility libraries (`ngx-cookie-service`, `ngx-mat-timepicker`, `ngx-skeleton-loader`) — none of this is architecturally significant, noted only so nobody's surprised by the dependency list.

8. **Real scale is small — good for a fast POC.** 348 total `.ts` files across both apps combined, well under Firebase's 544-file single app. A first pass here should be quick and cheap once built.

9. **There is exactly one seam through which `web-app` talks to the Firebase backend — this is the key to making cross-repo synthesis actually testable.** `core/firebase/services/https/firebase-https.service.ts` (`OSKFirebaseHttpsService`) exposes a single generic method:
   ```typescript
   public call<RequestDataType, ResponseDataType>(
     functionName: string,
     data?: RequestDataType
   ): Promise<OSKHttpsSuccessResponse<ResponseDataType>>
   ```
   Every feature checked imports this one service (via the `@oskey/firebase` path alias) and calls `.call('someFunctionName', data)` — `functionName` is a **literal string**, matchable by name against Firebase's already-extracted callable-function facts (e.g. `organizationUserCreateBuildingUnit`). This is a real, deterministic, name-based join key between the two repos' evidence graphs — exactly the concrete case needed to test whether cross-repo synthesis (`pipeline/cross-repo-synthesis/`) actually works, not just whether it's theoretically designed to. Confirmed via `@angular/fire`'s `httpsCallable` underneath — no plain `HttpClient` calls to the OSkey backend found (`HttpClient` usage was a single hit, unrelated — i18n's HTTP loader).

10. **Templates use the new Angular 17 control-flow syntax exclusively.** 48 files use `@if`/`@for`/`@switch`; zero use the older `*ngIf`/`*ngFor` structural directives. One syntax to parse, not two. `@angular/compiler` (Angular's own template parser) is already a dependency — no new tooling needed to parse templates properly instead of via regex.

---

## Decisions (confirmed 2026-08-28)

### Decision 1 — Scope: `web-app` first
Confirmed. `web-app` is the OSkey PGO Portal for property managers — the first (and for now, only) app in scope. `web-admin` is deferred as a second, later extraction using the same pipeline once `web-app`'s is proven.

### Decision 2 — Two separate `REPO_NAME` entries
Confirmed: treat `web-app` and `web-admin` as two separate extractions feeding into the corpus as two distinct entries, not one merged repo entry. Matches option (a) from the original proposal — no `config/repos.json` schema change needed, just two config entries sharing the one `gitUrl`. Only `web-app`'s entry is being added now (per Decision 1); `web-admin`'s follows later as a config-only addition.

### Decision 3 — Partition by `.routes.ts` boundary
Confirmed: option (b). Reinforced by a deeper look at the real structure — nesting goes at least four levels deep in places (`portals/organization/features/entities/features/entity/features/suppliers/`), so a shallow top-level-only partition would have been badly insufficient, not just suboptimal.

### Decision 4 — Templates ARE in scope for v1, built properly
Reversed from the original recommendation, given the actual downstream goal (impact analysis, atomic PRDs) genuinely requires them — a `.ts`-only extraction can't answer "what breaks if I change this component's input," which is the whole point.
- **Use `@angular/compiler`'s own template parser**, not regex over HTML — it's already a dependency, and gives a real AST instead of something fragile against Angular's binding syntax.
- **Start with a minimal, high-value fact set**, not full binding-expression fidelity: which component inputs get bound (data flowing in), which outputs/events get triggered (data flowing out), and which child components a template renders (a UI composition graph — the frontend equivalent of Firebase's call-graph facts, "who renders whom" instead of "who calls whom"). Full pipe/interpolation-expression parsing can follow later if the first pass proves insufficient.
- **Honest cost**: this is real added scope to Stage 3, not free — noted so the timeline reflects it rather than being surprised by it later.

---

## Proposed fact vocabulary for Script 01 (replaces Firebase's Firestore/RBAC/Pub-Sub-specific facts)

| Firebase concept | Angular equivalent |
|---|---|
| `ast-firestore-hints` / `ast-firestore-triggers` | `@Component` decorators (selector, `standalone` flag, template/style file refs, inputs/outputs) |
| `ast-api-contracts` (callable functions) | **`OSKFirebaseHttpsService.call('functionName', data)` call sites** — the literal `functionName` string plus generic `RequestDataType`/`ResponseDataType` arguments. **Highest-priority fact type in this whole plan**: this is the deterministic join key against Firebase's own `ast-api-contracts` facts, and the concrete test of whether cross-repo synthesis works. Route definitions from `.routes.ts` (path, component, lazy children, guards) are a separate, secondary fact under this same row. |
| `ast-permission-hints` (RBAC strings) | Route guards (`canActivate`/`canMatch` functions in `core/guards`) |
| `ast-pubsub-event-routes` | N/A — no direct equivalent found; drop this fact type for this repo |
| (no Firebase equivalent) | Angular Signals usage (`signal`/`computed`/`effect`) as a state-management fact — new, since Firebase's backend has no client-side reactive state concept |
| (no Firebase equivalent) | **Template-derived facts (per Decision 4)**: component inputs bound in a parent's template (data in), outputs/events wired up (data out), and child components rendered (UI composition graph) — extracted via `@angular/compiler`'s template parser, not `ts-morph` (templates are `.html`, not `.ts`) |
| `ast-external-hooks` | `core/firebase` (Firebase SDK usage), `@ngx-translate` (i18n), other injected external SDKs |

Scripts `02` through `07` (evidence graph building, benchmark, resolved graph, capability partitioning, cross/intra-module dependency graphs) are structurally generic — they operate on `module`/`submodule`/fact-type shape, not on what the facts *mean*. Expect these to need config/normalization-rule changes (new `classificationRules`/`normalizationRules` in `config/repos.json`, matching the existing per-repo pattern already used for Firebase's `OSK`-prefix stripping) rather than logic rewrites.

---

## Task List

- [x] **Stage 0 — Decisions 1-4 confirmed 2026-08-28.**
- [x] **Stage 1a — Pipeline folder renamed** to `pipeline/angular-app-oskey-io/`, stale references fixed repo-wide.
- [x] **Stage 1b — Scaffolded and configured, done by Claude directly (mechanical, low-risk — not worth a Gemini+review round-trip)**:
  - Copied `pipeline/firebase-oskey-dev/phase-01-ast-extraction/` wholesale into `pipeline/angular-app-oskey-io/phase-01-ast-extraction/` as the starting template (scripts `00`-`07` + `_shared/run-utils.ts`).
  - Added `angular-app-oskey-io`'s entry to `config/repos.json` (`web-app` only, per Decision 1; `modulesRoot: "hosting/web-app/src/app"`).
  - Added `pipeline:angular` + `cloud:angular-*` npm scripts, mirroring the Firebase pattern exactly.
  - Mapped the real `.routes.ts` nesting depth before writing any handoff prompt (goes 6 levels deep under `portals/organization` — confirms Decision 3's concern was real, not theoretical) and worked out a precise recursive submodule-boundary rule, so Gemini implements a specified algorithm rather than inventing one.

### Remaining work, broken into small Gemini-handoff stages (per your request — much smaller than a single "build Phase 1" task, each checked before the next starts)

- [x] **Handoff 1 — DONE and verified 2026-08-28.** Rewrote `00-scan-repo.ts`'s `scanDirectory` submodule-boundary logic. Hand-traced the diff against the worked-example table before running anything (correct), then ran it for real against the live `staging` branch and cross-checked all 33 real file paths against expected values — 100% match, including an untested edge case (`authentication/features/sign-in/...`, correctly inherits rather than fragmenting since it has no `.routes.ts` of its own). Real output: **191 files → 31 capability packs across 3 modules** (`core`, `features`, `components`), max bucket size 23 files (`core/types`) — no oversized buckets, the depth-based partitioning works as intended. Run notifications clean (`highestSeverity: info`).
  - **Bug found and fixed along the way (not Gemini's fault)**: `_shared/run-utils.ts`'s `assertNoLocalAbsolutePaths` used `.includes("/home/")` to catch absolute Linux paths, which false-positived on this app's legitimate `features/home/` folder. Pre-existing latent defect inherited from the Firebase-pipeline copy used as scaffolding (never triggered there — no Firebase module/submodule happens to be named exactly "home"). Fixed in both copies by anchoring to `.startsWith()` instead of `.includes()` — narrows false positives only, doesn't weaken real absolute-path detection.
- [x] **Handoff 2 — DONE and verified 2026-08-28.** Added `@Component`/`@Injectable` decorator extraction (`ast-angular-decorators.json`) to `01-extract-ast-evidence.ts`. Both worked examples from the prompt matched exactly (one apparent mismatch — `OSKHomeComponent`'s line number — traced to an off-by-one slip in my own prompt, not a real defect: `cls.getStartLineNumber()` correctly includes the decorator, matching existing `rawClasses` precedent in the same file). Spot-checked every edge case the real data surfaced beyond the two worked examples: 3 `providedIn: null` records all traced to genuine zero-argument `@Injectable()` calls in the real source (not a parsing gap); the plural `styleUrls: [...]` array form (untested by the prompt's own examples) does exist in the real repo (`OSKFooterComponent`) and extracted correctly. **95 records** (60 `Component`, 35 `Injectable`) from 191 files, 0 extraction errors, `tsc --noEmit` clean.
- [x] **Handoff 3 — DONE and verified 2026-08-28**, after one incomplete first attempt. First result wired the plumbing correctly but never implemented the detection logic (`firebaseCallableCalls: 0` on a real run — caught only because the review protocol checks real output, not just "ran without erroring"). Targeted follow-up (`gemini-prompt-03b-httpscallable-followup.md`) fixed it correctly: reused the loop's existing `exactMethodName`/`expr` variables rather than recomputing them, wrapped type resolution in a try/catch (reasonable, though it swallows failures silently rather than logging them — a minor style mismatch with this codebase's usual notification-based observability, not worth its own follow-up). **Real result: 102 call sites, 87 unique function names** (`core-getCountries` alone reused across 8 different files, confirming the type-based match generalizes beyond the worked examples) — all three of the original prompt's worked examples matched exactly, including the multi-line generic-argument case. 5 records correctly show `null` type args (genuine no-generic calls). `tsc --noEmit` clean.
- [x] **Handoff 4b (guards) — DONE and verified 2026-08-28.** Fully correct on first attempt. All 3 real guards matched (`OSKLoggedInGuard`, plus 2 more found as instructed rather than assumed: `adminGuard`, `OSKUserRoleGuard`) — exact match on line/guardType/isExported.
- [x] **Handoff 4c (signals) — DONE and verified 2026-08-28.** Fully correct on first attempt. All 3 worked examples matched exactly, including line numbers (`OSKLocaleService._locale`/`.locale`, `OSKSuppliersDetailsComponent.loading`). 112 real records total.
- [x] **Handoff 4a (routes) — DONE and verified 2026-08-28, after one real bug found and fixed.** `pathMatch`/`loadComponentRaw`/`loadChildrenRaw`/`redirectTo`/`canActivate` extraction was all correct on first attempt (confirmed real multi-line `loadComponentRaw` text captured correctly). But **a field-name collision silently destroyed source-file provenance for every record**: the route's own `path` property was named `path` in the pushed object, same as `base.path` (the source file path) — since it came after `...base` in the object literal, it silently overwrote it. Every one of the 59 route records had lost its file path (though not `module`/`submodule`, which didn't collide) — caught only by actually opening the output and checking field values, not by the static code read (I missed the collision on that pass too, despite reading the exact line). **This one is on the prompt spec, not Gemini** — the original fact shape asked for a field called `path` without noticing it would collide with the file-provenance field every other fact type in this file already relies on. Fixed via a one-line rename (`path` → `routePath`) in a targeted follow-up — confirmed correct on re-run.

**Second mistake, also mine, caught during that re-verification**: I'd built the original worked example around `app.routes.ts`, which turns out to never be scanned at all — it's a loose file directly at `src/app/` (not inside `core/`, `features/`, or `components/`), and `00-scan-repo.ts`'s top-level loop only iterates directories under `modulesRoot`, never loose files sitting directly there (the same accepted limitation noted back in Handoff 1's review). Confirmed via `files.json` — `app.routes.ts` genuinely isn't in the scanned set. Not a defect, just a bad choice of example file. Re-verified the fix instead against real scanned files (`auth.routes.ts`, `entity.routes.ts`) — `path`/`routePath` both correct, `canActivate` correctly extracts guard arrays (15 real records, e.g. `["OSKUserRoleGuard"]`), `loadChildrenRaw` correctly captures multi-line text including relative imports that traverse up a directory (`../entity/features/...`). Fully correct.
- [x] **Handoff 5 — DONE and verified 2026-08-28.** Fully correct on first attempt, including the recursion-through-control-flow logic (duck-typing on `.name`/`.sourceSpan` to identify Element-like nodes, generic `.children` recursion covering both `Element` and `Template` nodes, separate `.branches` recursion for `IfBlock`) — no defects found on either the static read or the real run. Exact worked example matched (`osk-header`, `templateLine: 17`, confirming the 0-indexed-to-1-indexed conversion is right). Broader checks: zero non-hyphenated tags leaked into the 973 real composition records across every template in the app; 730 binding records (530 input / 200 output), zero empty values, real examples (`[routerLink]="['/']"` on a plain `<a>`, `(click)="close(true)"`) confirming bindings are correctly captured on both custom and native elements. **Prerequisite handled directly, not left to Gemini**: `@angular/compiler` installed as a dependency of this pipeline repo itself (the target app's `package.json` has it, this one didn't), verified working standalone via a real smoke test against actual templates before the prompt was even written — that smoke test is also what grounded the exact AST shape in the prompt (`Element`/`BoundAttribute`/`BoundEvent`/`IfBlock` shapes, 0-indexed `sourceSpan` lines) instead of guessing at the API.
- [x] **Handoff 6 — DONE and verified 2026-08-28.** Fully correct on first attempt — exact match to the provided pattern, no deviations, no field collisions. All four touch points present (fact-file loads, 5 mapping blocks, `EXPECTED_EVIDENCE_TYPES`, `summaryCounts`). Ran the full `00→01→02` chain per the prompt's requirement and verified two things precisely: (1) **every `id` correctly excludes the line number** — the one non-negotiable requirement — with `line` preserved separately as its own field (checked all 5 new fact types, including the edge case of an empty-string route path handled correctly via the existing occurrence-ordinal mechanism: `angular_route|...|auth.routes.ts||#1`); (2) **exact reconciliation** — summing each fact type across all three modules (`core`+`features`+`components`) reproduces the whole-repo totals from every prior handoff precisely (95 decorators, 102 callable calls, 59 routes, 3 guards, 112 signals) — zero facts lost or duplicated in the per-module split. Deliberately excludes Handoff 5's two template fact types, per the original scoping — that's the one remaining follow-up before `02` is fully complete.
- [x] **Handoff 7 — DONE and verified 2026-08-28.** Same class of gap as Handoff 6, found by audit rather than waiting to hit it: `03-build-benchmark.ts` had its own hardcoded `REQUIRED_SUMMARY_FIELDS` list and matching `totals` initializer, neither aware of the 6 new Angular summary fields — without this fix the new counts would never have reached the repo-wide benchmark, silently, even though nothing would have errored. Fixed directly (mechanical, not worth a Gemini round-trip) by adding the same 6 field names to both. Verified via a real `00→03` run: all 6 fields now correctly aggregate into repo-wide totals, matching every prior handoff's verified counts exactly.
- [x] **`04`/`05`/`06`/`07` audited and run for real for the first time — zero code changes needed.** Before assuming the plan doc's original "just run it" framing for these was safe, audited each for the same class of hardcoded-Firebase-assumption risk that `02`/`03` had:
  - **`04-build-resolved-graph.ts`**: its RBAC matrix section is genuinely generic (aggregates already-extracted permission facts by string, no external `rbac-roles.json` dependency, no Firebase-specific data requirement). Ran clean, produced 16 real RBAC requirements — confirmed directly relevant, not incidental: the user clarified RBAC role assignment is the actual (acknowledged-temporary) mechanism gating which pages/menu options a property manager sees, and the extracted data shows this exactly (`v1.admin` checked in `generate-admin-default-menu.util.ts`, the real sidemenu-generation logic). One calibration nuance, not a defect: all 16 requirements land as `confidence: "candidate"` rather than `"confirmed"`, since the upstream confidence classification (in `01`, not `04`) checks against a hardcoded whitelist of Firebase auth-check method names that Angular's real idiom (`.roles.includes(...)`) doesn't match — nothing is lost either way, per the script's own design (candidates are retained, not discarded). Possible future refinement, not urgent.
  - **`06`/`07`**: confirmed genuinely generic (key only off `imports_dependency` facts and fields already correctly populated since Handoff 1) — ran clean with sensible small-scale output for a 3-module app.
  - **`05`**: ran clean, but surfaced a real finding worth carrying forward: `portals_organization_entities_entity_suppliers` is **1,159 facts** — larger than any pack in the entire Firebase repo (vs. `core/access`'s 743, the whole subject of Plan 05). The recursive `.routes.ts` rule is working as designed elsewhere; `suppliers` just has real depth (list/details/creation/staff-access) with no further `.routes.ts` boundary to split on — the same "genuinely flat but large" shape `access_control_device` had on Firebase. Not acted on — flagged per the Plan 05 precedent of not reacting to a single number without more context (real-run variance turned out to matter more than raw size there).
- [x] **Handoff 8 — DONE and verified 2026-08-28.** Fully correct on first attempt — exact match to the provided pattern, including the deliberate `templatePath`/`templateLine` deviation from Handoff 6's pattern (confirmed in real output: `file` is a real `.html` path, `id` correctly excludes the line number, both `path` (.ts) and `templatePath` (.html) preserved in `evidence` for full traceability). **Closed the actual gap it existed to close**: `authentication`'s capability pack grew from 467 to 539 facts, with 45 `angular_template_composition` + 27 `angular_template_binding` records now present where there were zero before. Followed with the same mechanical `03` fix Handoff 7 did for the other 6 fields (done directly, not via Gemini) — verified via a real `00→03` run: `angularTemplateComposition: 973`, `angularTemplateBindings: 730`, matching Handoff 5's whole-repo totals exactly. **This closes every known gap in the Phase 1 pipeline** — all 8 handoffs done, `01`/`02`/`03` fully adapted, `04`/`05`/`06`/`07` audited and confirmed working with zero changes needed.
- [ ] **Stage 4 — Real run against one feature first** (e.g. `authentication`) to verify every fact type end-to-end before running the whole app.
- [ ] **Stage 5 — Full Phase 1 run** across `web-app`, producing capability packs, ready for Phase 2 (same `01a`/`01c`/`02` scripts, unmodified — just new contract/grounding docs for this repo's architecture).
- [ ] **Stage 6 — Cross-repo synthesis test**: once both this repo's and Firebase's callable-function facts exist, run `pipeline/cross-repo-synthesis/` for real and check whether `web-app`'s `.call('functionName', ...)` sites actually resolve against Firebase's facts by name. The acid test for whether the multi-repo corpus vision holds up in practice.

**Review protocol for each handoff** (so "check its work" means something concrete, not just "read the diff"): (1) confirm it only touched the file(s) named in its prompt — nothing in `pipeline/firebase-oskey-dev/` ever; (2) `npx tsc --noEmit -p .` clean; (3) actually run the affected script against the real cloned repo and check its output against the specific real test-case paths given in the prompt, not just "did it run without erroring." Prompts for Handoffs 2-5 get written once Handoff 1's real output shape is known, rather than all five drafted speculatively up front.

Not touching Phase 2 contract docs in this plan — that's a follow-up doc once Phase 1's fact shape is settled, since the contracts need to know what facts actually exist before they can ask an LLM to reason about them.
