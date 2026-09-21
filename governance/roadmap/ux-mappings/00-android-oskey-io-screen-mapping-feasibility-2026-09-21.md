# 00 — android-oskey-io screen-mapping feasibility (investigation only)

**Mode: investigation only.** No extraction code was written or run, the pipeline was not touched, and no onboarding decision was made — all per `governance/roadmap/ux-mappings/prompts/prompt-1-android-oskey-io-screen-mapping-feasibility.md`. `android-oskey-io` still has zero entry in `config/repos.json` (confirmed live 2026-09-21) and zero Postgres facts. Real spend: zero — local file reads only, no Postgres queries were needed (the question turned out to be answerable from `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts`'s own source, not from querying facts that don't exist for this repo).

## Bottom line

**Yes — the `OSK*Dests.kt` route registry is a real, viable, extractor-friendly alternative to the Composable-naming heuristic, and it is a stronger source of ground truth than initially framed: the true dest→screen link is not the route string at all, it's the `composableHolder(<Dest>) { <Composable>(...) }` call site in the app's NavHost graph.** That pairing is a direct, structural fact (a call expression's argument identifies the dest, its trailing lambda's body identifies the real screen composable) — no naming heuristic, no route-string matching, no basename convention needed at all. This is a materially better answer than "extract the route property," which was this investigation's starting hypothesis.

The `OSK*Dests.kt` sealed classes are real and live (confirmed: `NavigationDispatcher`/`OSKInvitationRedirectionHelper`/`OSKBottomBarViewModel` all navigate via `navigationDispatcher.navigateTo(OSKMainDests.Unlock)`-style typed references, not raw strings) — but they are half of the picture, not the whole thing.

## 1. Does today's Kotlin AST extractor already capture the `OSK*Dests.kt` route values?

**No — checked directly against real code, not assumed.** `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts` §7 (lines 352–380) does produce `kotlin_sealed_hierarchy` facts, and its structural walk (`object_declaration`/`class_declaration` inside a sealed class's `class_body`, matched via `heritageOf(sub).extendsClass === name`) would correctly identify every `object FacialScan : OSKMenuDests()`-style member here — that part transfers unchanged, confirmed by reading the real `OSK*Dests.kt` files (they use exactly this `object X : SealedClassName()` shape, same as android-intercom's `OSKIntercomScreens.kt`).

But §7 only captures `{ name, kind, line }` per subclass — it does **not** descend into a subclass's own `class_body` to read any property inside it. The `route` value here is not an enum-style `constructorArgs` capture (§6, `enum_entry` → `value_arguments`) — it's a `property_declaration` on the `NavigationAction` interface's `route: String` member, overridden per-object in one of two real shapes (confirmed by reading all 10 `OSK*Dests.kt` files, 62 declarations, 18/44 split):

```kotlin
// shape A (18/62) — getter body
object FacialScan : OSKMenuDests() {
    override val route: String
        get() = "facialScan"
}

// shape B (44/62) — direct initializer, often string-templated against a
// file-local `const val`
object SignInSignUp : OSKAuthenticationDests() {
    override val route = "signInSignUp/$NEXT_ROUTE_PARAM"
}
```

So this is a real, bounded extension, not a one-line tweak: a new pass would need to (a) walk each sealed subclass's `class_body` for a `property_declaration` named `route`, (b) handle both the getter-body and direct-initializer shapes, and (c) for the templated case, resolve `$CONST_NAME` interpolations against that file's own top-level `const val` declarations (e.g. `OSKMenuDests.kt`'s `USER_DEVICE_ID_PARAM = "{$USER_DEVICE_ID}"`, itself built from `USER_DEVICE_ID = "user_device_id"`) — a two-level, per-file const join, structurally similar in *spirit* to (but not reusable code from) the enum-literal-table join `extract-firebase-callable-calls.ts` already had to build for a different, unrelated construct.

## 2. What a route-derived fact shape would look like — and why it's not the real answer

A sketch of the naive version (route registry only, don't build):

```json
{
  "destSymbol": "OSKMenuDests.FacialScan",
  "sealedClass": "OSKMenuDests",
  "objectName": "FacialScan",
  "kind": "object",
  "route": "facialScan",
  "file": "app/.../navigation/destinations/OSKMenuDests.kt:31"
}
```

This alone gets you a real route inventory, but **not** a screen map — it tells you a destination exists and what URL-shaped string identifies it, not which Composable renders it. The real, stronger fact is the wiring call site, found by directly reading `app/src/main/java/io/oskey/app/router/OSKAppRouter.kt` and `.../ui/view/screens/auth/navigation/OSKAuthNavigation.kt`:

```kotlin
composableHolder(OSKMainDests.Unlock) {
    OSKMainHomeScreen()
}
```

`composableHolder`/`dialogHolder`/`bottomSheetHolder` are three thin real wrappers (`app/src/main/java/io/oskey/app/navigation/OSKComposableWrapper.kt`) around Compose Navigation's own `composable()`/`dialog()`/`bottomSheet()`, each taking a `NavigationAction` (the dest object) and a trailing `@Composable` lambda. A structural extraction that finds every `composableHolder(...)`/`dialogHolder(...)`/`bottomSheetHolder(...)` call, reads its first argument (the dest reference) and the first top-level call expression inside its trailing lambda (the real screen Composable invoked), produces exactly the angular_route-equivalent fact this investigation was asked to chase:

```json
{
  "destSymbol": "OSKMainDests.Unlock",
  "screenSymbol": "OSKMainHomeScreen",
  "wiringKind": "composableHolder",
  "file": "app/src/main/java/io/oskey/app/router/OSKAppRouter.kt:392"
}
```

This is a real call-expression-shaped extraction (parse `call_expression` → check callee name against `{composableHolder, dialogHolder, bottomSheetHolder}` → first argument → trailing lambda's first call), not a naming heuristic at all — closer in kind to the existing pipeline's own call-graph extraction than to §7's sealed-hierarchy walk. It sidesteps the route-property-parsing problem in §1 entirely for the *screen-map* use case (the route string doesn't need to be resolved at all to link a dest to a screen) — though the route fact from §1 is still separately useful for other purposes (e.g. deep-link inventories), so both are worth keeping distinct, real fact kinds rather than collapsing into one.

**A real naming-drift case this found, worth stating plainly because it validates the approach**: `OSKMainDests.Unlock`'s real screen is `OSKMainHomeScreen` — not a substring match, not a near-miss, completely unrelated words. No naming heuristic of any kind (basename-matching, `endsWith('Screen')` + parameter check, anything) would ever have found this pairing. Only the direct `composableHolder(...) { ... }` call site gives you the true link. This is the single strongest piece of evidence in this investigation that the wiring-call-site approach, not the route-registry approach, is the real fix.

## 3. Real gap check: do all 62 route declarations correspond to a live, wired screen?

**No — checked directly, not assumed, and the gap is smaller than initially estimated but real.**

- Wired via `composableHolder`/`dialogHolder`/`bottomSheetHolder` in the two router files (`OSKAppRouter.kt`: 47 calls; `OSKAuthNavigation.kt`: 4 calls): **51 of the 62 declared destinations** (qualified by owning sealed class, to correctly separate real same-name-different-class pairs — see below).
- **2 real, confirmed dead destinations**: `OSKAccessesDests.Accesses` and `OSKLoadingDests.Loading` have zero references anywhere in the repo outside their own declaration — not navigated to, not wired to any composable. Same shape as the already-found dead `menu/navigation/Screen.kt` sealed class: real code that reads as live but isn't reachable.
- **A real route collision, found while checking this**: `OSKAccessesDests.Accesses` (dead) and `OSKMainDests.Accesses` (live, wired to `OSKInvitationsMainScreen()`) both declare the literal route string `"accesses"`. Since Compose Navigation registers routes by string within one NavHost graph, two dest *objects* sharing one route string is a real, load-bearing fact for any future fact-id design here: **dest-object identity, route-string identity, and screen identity are three different keys, not one** — `OSKMainDests.UnlockWithClearStack` is a second, confirmed real example (same `"unlock"` route as `OSKMainDests.Unlock`, deliberately reused purely to carry a different `clearStack` navigation-dispatch flag, not a second screen registration).
- **4 declarations referenced in code but not found wired via the two router files' `composableHolder`/`dialogHolder`/`bottomSheetHolder` calls**: `OSKProfileDests.{UpdateEmailForm, UpdateEmailDialog, UpdateEmailReAuthSentCheck, MainDetailsScreen}`. `UpdateEmailForm` is real (`navigationDispatcher.navigateTo(OSKProfileDests.UpdateEmailForm)` in `OSKProfileViewModel.kt`); `MainDetailsScreen`'s `.route` string is read directly in two ViewModels. A nested `NavHost` does exist elsewhere (`OSKMenuContent.kt`, confirmed real) but its own `composable(...)` calls use raw string routes, not these dest objects or the `composableHolder` wrapper — so it is not the answer either. **Left genuinely unresolved** rather than guessed: a real, separate wiring path exists for these 4 that this bounded pass didn't chase to ground. Flagging honestly rather than asserting a location not directly confirmed.

Net: of 62 declared, 51 confirmed live-wired, 2 confirmed dead, 4 confirmed real-but-not-yet-located, 5 unaccounted for in this pass (arithmetic: 62 − 51 − 2 − 4 = 5, not individually chased). **A structural extraction should walk every `NavHost(...)` body in the repo generically** (there is at least one more beyond the two files checked here, per `OSKMenuContent.kt`) rather than assume `OSKAppRouter.kt` + `OSKAuthNavigation.kt` are exhaustive — consistent with this project's own standing "always dynamic, never hardcoded" rule, since a future PR could add another nested NavHost without this investigation's manual two-file list keeping up.

Separately, on the 62-vs-71-screens framing from the prior pass: this session counted **70** real `*Screen.kt` files under `ui/view/screens/` (not 71) — a minor discrepancy from the prior same-day count, most likely a file added/removed or a miscount, not investigated further as it doesn't change any conclusion here.

## 4. Is `extract-firebase-callable-calls.ts` relevant groundwork for this?

**No — confirmed by reading it directly, not a guess.** It is scoped entirely to a different, unrelated concern: resolving `getHttpsCallable(CloudFunctions.SOME_CASE.value)` call sites in one specific file (`OSKFirebaseFunctionsDataSource.kt`) against that file's own `enum_entry` → literal table, for Firebase callable-function invocations. It shares no file, package, or construct with navigation/screens. Its only transferable *value* to this investigation is methodological, not code: it demonstrates the project already has precedent for a two-pass "collect a literal table, then join call sites against it" extraction shape, which is the same rough shape §1's route-string-template resolution would need (though for a structurally different AST construct — `property_declaration` initializers, not `enum_entry` `value_arguments` — so no code ports directly).

## 5. Onboarding scope

Not addressed — that decision remains the user's, per the already-recorded 2026-09-18 deferral (`governance/roadmap/dynamic-pipeline-architecture/04-prompt-3-layer2-build-plan-2026-09-18.md` §2). No extraction script was built in this pass, per the prompt's explicit instruction.

## Recommendation for a future build session (not decided here)

If/when `android-oskey-io` is onboarded, the real, evidence-based screen-map approach for this repo should be:

1. A new fact kind (name TBD, not `kotlin_sealed_hierarchy`) built from a **call-site walk**, not a naming heuristic and not the sealed-hierarchy extraction as-is: find every `composableHolder(...)`/`dialogHolder(...)`/`bottomSheetHolder(...)` call (and any other `NavHost`-registration wrapper found by walking every real `NavHost(...)` in the repo, not just the two files checked here), pair each call's dest argument with the first Composable invoked in its trailing lambda.
2. Keep the `OSK*Dests.kt` route-string extraction (§1/§2 above) as a **separate**, second fact kind if a route inventory is independently useful (e.g. deep links) — don't conflate it with the screen map, since route identity and screen identity are provably not 1:1 here (§3).
3. Any dest-object fact id must be qualified by owning sealed class (`OSKMainDests.Accesses` ≠ `OSKAccessesDests.Accesses`) — bare object names collide for real, confirmed reasons, not a hypothetical edge case.

This sketch is offered for scoping a future build prompt the way `governance/roadmap/dynamic-pipeline-architecture/03-prompt-2-layer2-findings-2026-09-18.md` did for the Swift/Kotlin integration-call investigation — not built, not decided, left for the user.
