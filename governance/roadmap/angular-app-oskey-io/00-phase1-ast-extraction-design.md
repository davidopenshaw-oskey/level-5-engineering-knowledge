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
- [ ] **Stage 1b — Add `web-app`'s `REPO_NAME` entry to `config/repos.json`** (gitUrl `https://github.com/oskey-io/angular-app-oskey-io`, branch `staging`, `modulesRoot` pointing at `hosting/web-app/src/app`).
- [ ] **Stage 2 — Adapt `00-scan-repo.ts`'s submodule detection** from "look for a folder named `modules`" to "look for a folder named `features`, partitioning at every `.routes.ts` boundary" (per Decision 3).
- [ ] **Stage 3 — Adapt `01-extract-ast-evidence.ts`** to the fact vocabulary above: `@Component`/`@Injectable` decorators, route definitions, `OSKFirebaseHttpsService.call()` sites (highest priority — the cross-repo join key), guards, Signals usage.
- [ ] **Stage 3b — Add template extraction** using `@angular/compiler`, per Decision 4: component-composition graph, input/output bindings. Separate sub-stage since it's a different parser (compiler AST, not `ts-morph`) and a different file type (`.html`, not `.ts`) from everything else in Stage 3.
- [ ] **Stage 4 — Real run against one feature first** (e.g. `authentication`, small and self-contained) to verify the new fact types — including the `.call()` join-key extraction and template facts — before running the whole app.
- [ ] **Stage 5 — Full Phase 1 run** across `web-app`, producing capability packs, ready for Phase 2 (which should need no code changes — same `01a`/`01c`/`02` scripts, just new contract/grounding docs for this repo's architecture).
- [ ] **Stage 6 — Cross-repo synthesis test**: once both this repo's and Firebase's `ast-api-contracts`-equivalent facts exist, run `pipeline/cross-repo-synthesis/` for real and check whether `web-app`'s `.call('functionName', ...)` sites actually resolve against Firebase's callable-function facts by name. This is the acid test for whether the multi-repo corpus vision holds up in practice.

Not touching Phase 2 contract docs in this plan — that's a follow-up doc once Phase 1's fact shape is settled, since the contracts need to know what facts actually exist before they can ask an LLM to reason about them.
