# Layer 2 findings: real Swift/Kotlin outbound integration-call patterns

Answers `prompts/prompt-2-swift-kotlin-integration-call-extraction.md`. Investigation only — no extraction code written. Everything below is read directly from real source in `output/clones/` (fresh clones already on disk from a prior pipeline run) or, for the Kotlin AST shape, verified with a small bounded script against the real tree-sitter-kotlin parse tree (deleted after the finding was recorded, per this project's temp-script discipline).

## Headline finding: iOS and Android use two structurally different, non-overlapping integration mechanisms, hitting two different backends

- **iOS (`ios-oskey-dev` → `swift-cloud-kit-oskey-dev`)**: real Firebase iOS SDK usage — both **Callable Functions** (`Functions.functions(region:).httpsCallable(...)`) and **Firestore** (`Firestore.firestore()...`) — hitting `firebase-oskey-dev`.
- **Android (`android-intercom-oskey-io`)**: real, plain **REST via Retrofit2/OkHttp** (`@GET`/`@POST` annotated interface methods) — hitting `node-iot-api-oskey-io`, **not** `firebase-oskey-dev`. Zero real Firebase/Firestore SDK usage anywhere in the repo.

Both are real, structural, reliably pattern-matchable — but they are two different fact kinds pointing at two different backend repos, not one shared kind. Neither currently produces anything.

## 1. iOS / Swift — Firebase Callable Functions + Firestore, both confirmed real

### Where it lives

`ios-oskey-dev` (the Xcode app, 3 native targets) has **zero direct Firebase SDK usage** for real business calls — confirmed by grep across the whole clone: the only hit is `Firestore.firestore().settings = settings` in `OSKAppDelegate.swift`, which is SDK configuration, not a real call. All 124 files that touch Cloud data do so exclusively through `import OSKCloudKit`, one of the app's 5 first-party SPM dependencies.

All real Firebase usage is centralized in **`swift-cloud-kit-oskey-dev`**, under `Sources/OSKCloudKit/Firebase/` (`Cloud Functions/`, `Cloud Firestore/`, `Cloud Storage/`, `Cloud Messaging/`, `Core/`) and `Sources/OSKCloudKit/OSKEY Cloud/` (the ~30 business-domain service classes that consume those wrappers). Checked the real, complete dependency set — not a guess: `ios-oskey-dev`'s own `Package.resolved` names exactly 5 first-party SPM packages (`swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`, `swift-ui-kit-oskey-dev`, `swift-ai-kit-oskey-io`), confirming this is the full, authoritative list. Checked all 5 directly (the 5th, `swift-ai-kit-oskey-io`, wasn't cloned in this project until this pass — pulled read-only into `output/clones/` the same way, nothing added to `config/repos.json`) — zero Firebase/network references in any of the other 4. `swift-ai-kit-oskey-io` is a real on-device computer-vision package (`SwiftRecognition`/`CxxRecognition` sources, bundled `opencv2`/`ncnn`/`glslang`/`MoltenVK` xcframeworks — genuinely local ML/recognition work, no networking surface of any kind), confirmed actually imported and used by 4 real files in `ios-oskey-dev` (not a dead/unused dependency). **Note, per the user directly (2026-09-18): this package is currently out of scope for this initiative** — checked here only to confirm it carries zero real integration-call surface (real negative finding, not a gap), not because it's a target for future extraction work. This is a real, clean architectural boundary — Cloud/network access is 100% confined to `swift-cloud-kit-oskey-dev`, confirmed across the complete dependency set, not an assumption or a partial check.

### Pattern A — Callable Functions (`OSKCKFunctionService`)

`Firebase/Cloud Functions/Services/OSKCKFunctionService.swift` is a generic wrapper:

```swift
public class OSKCKFunctionService</* Body */ OSKCKResponse: Codable> {
    let name: String
    let region: String
    public init(_ name: String, in region: String) { ... }
}
// .call(...) internally does:
//   Functions.functions(region: region).httpsCallable(name).call(body)
```

Real call sites never call `Functions.functions(...).httpsCallable(...)` directly — they instantiate this wrapper with a literal function name, e.g. (`OSKCKUserService.swift`):

```swift
let updateUserPhoneNumberFunctionService = OSKCKFunctionService<OSKCKNoResponse>("user-updatePhoneNumber", in: "europe-west1")
try await updateUserPhoneNumberFunctionService.call(phoneNumber.dictionary)
```

**Confirmed real and non-trivial, not a one-off**: ~~36~~ **CORRECTED 2026-09-18, during the build pass (`04-prompt-3-layer2-build-plan-2026-09-18.md`), see that doc's testing section**: the real, structural-extraction-verified count is **34**, not 36 -- the original 36 was a raw grep count that included 2 false positives, both commented-out code (one `//`-commented line in `OSKCKUserBuildingAccessService.swift`, one whole function inside a `/* ... */` block in `OSKCKUserInvitationService.swift`). The real SwiftSyntax-based extraction correctly excluded both (comments are trivia, never real call expressions) -- this is real, direct evidence that structural AST extraction is more accurate than a text grep for exactly the reason this whole initiative exists, not a discrepancy to be worried about. Original text preserved below, uncorrected, per this project's "mark superseded, don't rewrite" rule -- the reasoning was sound for what it checked (a raw text match), it just wasn't the same check the real extraction code now performs. 36 real `OSKCKFunctionService<...>(...)` instantiation call sites across 12 service files. Every one uses region `"europe-west1"` (grepped for all `in: "..."` values — one value, no variance). Cross-checked the function-name convention against the real backend: `"user-updatePhoneNumber"` and `"core-getMfaPhoneNumber"` (another real call site) both resolve to real modules (`user`, `core`) in `firebase-oskey-dev/functions/src/modules/` — the same `module-functionName` naming convention Angular's own `firebase_callable_call` extraction already relies on for its cross-repo join. This is real, joinable evidence, not a coincidence.

**AST shape, already partially captured today**: the Swift extractor (`swift-extractor/Sources/swift-extractor/main.swift`) already walks every `FunctionCallExprSyntax` into a generic `CallFact` (`calleeExpression`, `rootIdentifier`, `arguments`, `callerFunction`, `callerType`). For `OSKCKFunctionService<OSKCKNoResponse>("user-updatePhoneNumber", in: "europe-west1")`:
- `calleeExpression` = `"OSKCKFunctionService<OSKCKNoResponse>"` (the whole generic specialization text — **varies per response type, not a stable match key**).
- `rootIdentifier` = `"OSKCKFunctionService"` (stable — the extractor's own `rootIdentifierOf` already recurses through `GenericSpecializationExprSyntax` down to the base identifier, exactly the case here).
- `arguments` = `["\"user-updatePhoneNumber\"", "in: \"europe-west1\""]` (raw source text per argument, existing convention).

This means matching must key on **`rootIdentifier === "OSKCKFunctionService"`**, not `calleeExpression` — the existing `ble_gatt_constant` precedent (matches `calleeExpression === "CBUUID"`) is the wrong template to copy verbatim here because `CBUUID(...)` is never generic; a future build session should copy the *matching-on-a-known-wrapper-type* idea but key off `rootIdentifier`, and pull the function name from `arguments[0]` (strip the surrounding quotes) and region from the `arguments` entry starting `"in:"`.

### Pattern B — Firestore documents/collections (the thing you flagged to also check)

`Firebase/Cloud Firestore/Services/OSKCKFirestoreService.swift` is a second generic wrapper (`get`, `getAll`, `getPaginated`, `documentSnapshotListener`, `collectionSnapshotListener`, `create`, `update`, `delete`), all built on `Firestore.firestore()` plus a path.

The real, high-value part: **every real Firestore path in the app is enumerated in exactly two exhaustive enums** —`OSKCKFirestoreDocumentPath` (15 cases) and `OSKCKFirestoreCollectionPath` (17 cases) — each case mapping a semantic name to a literal path template, e.g.:

```swift
case userBuildingAccesses(userId: String, buildingId: String):
    "/users/\(userId)/accesses/\(accessId)"
```

This is structurally the Swift analog of a route table — a closed, real, enumerable list of every Firestore location this app reads or writes, each with real string-interpolation placeholders instead of REST path params. It is at least as reliable a match target as `api_contract`, arguably more so: no runtime string needs parsing at all, the enum's own `case` declarations and their `string` computed-property bodies are the fact.

A future build session extracting this would walk `EnumDeclSyntax` nodes named `OSKCKFirestoreDocumentPath`/`OSKCKFirestoreCollectionPath` (or, more generally, any enum whose `string` property switches over string-literal-with-interpolation return expressions) and emit one fact per `case`, carrying the case name, its parameter names, and the literal path template. This needs its own design pass — it is a different AST shape (enum case + computed property) from the callable-call pattern above, not a variant of it.

### Proposed fact kind(s) for a future build session (not built here)

1. **`firebase_callable_call`** (Swift) — one per `OSKCKFunctionService<...>(...)` initializer call site. Fields: `functionName` (from the first literal argument), `region`, `callerFunction`/`callerClass` (already resolved by the existing call-graph machinery), `repo`/`module`/`file`/`line`. Match key: `rootIdentifier === "OSKCKFunctionService"`.
2. **`firestore_document_access`** / **`firestore_collection_access`** (Swift) — one per `case` in `OSKCKFirestoreDocumentPath` / `OSKCKFirestoreCollectionPath` (or their real equivalents, if this pattern generalizes to other Swift repos later — only checked in `swift-cloud-kit-oskey-dev` so far, and this repo is the only one with any Firebase code at all). Fields: case name, path template, parameter names. This is a genuinely different, real integration surface from Callable Functions (reads/writes go straight through the Firestore SDK, never through a Cloud Function), and would need its own cross-repo edge logic (joining against `firebase-oskey-dev`'s `firestore.rules.txt`/schema docs, not its Cloud Functions).

## 2. Android / Kotlin — plain REST via Retrofit, zero Firebase, targets a different backend entirely

### Real, checked, negative finding on Firebase

Grepped every `.kt`/`.gradle*`/`.xml` file in the whole `android-intercom-oskey-io` clone (app module + all 4 bundled kit modules — `kotlin-ble-kit-oskey-io`, `kotlin-usb-oskey-io`, `kotlin-webrtc-data-oskey-io`, `kotlin-webrtc-domain-oskey-io`) for `firebase`/`firestore`, case-insensitive: **one hit, total**, and it's a string literal analytics event key (`"firebase_call_id"` in `OSKSignalingAnalytics.kt`) — not an SDK call. No `firebase-*` Gradle dependency anywhere. This repo genuinely does not use Firebase Callable Functions, Firestore, or Firebase Cloud Messaging. This is a real, valid "no such pattern" answer for half of this prompt's question, per point 4 of the prompt's own framing — not something to force.

### What it actually does: Retrofit2 + OkHttp REST, one interface, 5 endpoints

`app/build.gradle.kts` declares `retrofit2:retrofit:2.9.0`, `retrofit2:converter-gson`, `okhttp3`. The **entire** real usage is one file: `app/src/main/java/io/oskey/intercom/core/network/OSKApiService.kt`:

```kotlin
interface OSKApiService {
    @GET("/v1/iot/access-control-devices/{accessControlDeviceId}/config")
    fun getConfiguration(@Path("accessControlDeviceId") accessControlDeviceId: String, ...): Call<OSKConfiguration>

    @GET(".../intercom-entries")   fun getResidents(...): Call<OSKResidents>
    @GET(".../accesses")           fun getAccesses(...): Call<OSKAccesses>
    @GET(".../config/{modificationDate}") fun getLastConfiguration(...): Call<OSKConfiguration>
    @POST(".../activities/intercom") fun postActivity(..., @Body request: OSKActivityRequest, ...): Call<Void>
}
```

Confirmed **exhaustive**, not a sample: grepped the whole repo (app + all 4 kit modules) for `@GET(`/`@POST(`/`@PUT(`/`@DELETE(`/`@PATCH(` — exactly 5 matches, all in this one file. `kotlin-webrtc-data-oskey-io` also declares a Retrofit dependency in its own `build.gradle.kts` but has zero real Retrofit/`retrofit2` source usage anywhere in its `src/` — an unused/legacy dependency declaration, not a second real call site.

**Real, verified cross-repo join, same discipline as the Swift side**: every one of these 5 literal paths (`/v1/iot/access-control-devices/{accessControlDeviceId}/config`, `.../intercom-entries`, `.../accesses`, `.../activities/intercom`) matches — path-for-path — real registered routes in `node-iot-api-oskey-io/src/v1/routes/*.route.ts` (`access_control_device_configs.route.ts`, `access_control_device_intercom_entries.route.ts`, `access_control_device_accesses.route.ts`, `access_control_device_activities.route.ts`). This is the **real target backend for Android's integration calls — `node-iot-api-oskey-io`, a repo the pipeline already extracts, not `firebase-oskey-dev`**. Worth flagging explicitly for whoever picks up Layer 1 (`build-cross-repo-edges.ts` generalization): Android's new edge target is a repo pair (`android-intercom-oskey-io` → `node-iot-api-oskey-io`) that doesn't exist in the current hardcoded set at all (today's hardcoding only knows about `angular-app-oskey-io` ↔ `firebase-oskey-dev`).

### Real AST shape, verified directly against the live tree-sitter-kotlin parse tree

The project's own `kotlin-ast-utils.ts` already has `annotationNamesIn`/`isAnnotatedWith` helpers (used today only for `@Composable` detection) but **neither is wired into `01-extract-ast-evidence.ts` for any HTTP annotation**, and neither currently extracts an annotation's *arguments* — only its name. Wrote a small bounded script (per this project's "cheap, real, bounded test before scaling" rule; deleted immediately after) parsing the real `OSKApiService.kt` file to confirm the real node shape before proposing anything:

```
annotation
  constructor_invocation
    user_type / type_identifier         -- "GET" / "POST" / etc.
    value_arguments
      value_argument
        string_literal
          string_content                -- the real literal path, e.g. "/v1/iot/access-control-devices/{accessControlDeviceId}/config"
```

This is a clean, fully structural walk (annotation → constructor_invocation → type_identifier for the method, → value_arguments → value_argument → string_literal → string_content for the path) — no text-splitting or regex-on-whole-annotation-text needed, consistent with this project's "always structural, never string-split" precedent (the same reasoning that drove the Swift extractor's `rootIdentifierOf` rewrite).

~~**One real gap to flag for the build session**: `findEnclosingClassName`... needs that helper extended... to also match `interface_declaration`~~ — **CORRECTED 2026-09-18, during the build pass**: this was wrong, caught by reading `01-extract-ast-evidence.ts`'s own header comment before writing the fix. This grammar has **no separate `interface_declaration` node type at all** — `interface Foo {}` parses as a `class_declaration` whose first child is the literal token `interface` instead of `class` (already documented in that file's own section-2 comment, just not cross-checked against this doc's claim before now). `findEnclosingClassName` already matches `class_declaration` and therefore already walks through an interface correctly, with zero changes needed — confirmed directly: the real build emitted all 5 `rest_endpoint_call` facts with `owningInterface: "OSKApiService"` populated correctly, unmodified helper. Original claim preserved above per this project's "mark superseded, don't rewrite" rule.

### Proposed fact kind for a future build session (not built here)

**`rest_endpoint_call`** (Kotlin) — one per `@GET`/`@POST`/`@PUT`/`@DELETE`/`@PATCH`-annotated interface method. Fields: `httpMethod` (from the annotation's `type_identifier`), `path` (from the annotation's `string_content`), `functionName` (the Kotlin method name), `owningInterface` (needs the `interface_declaration` fix above), `parameters` (from existing param-extraction logic, already present for `function_declaration` facts). Small, fully-enumerable surface (5 real endpoints today) — cheap to build and cheap to verify against a real "before" baseline.

## Addendum (same day): a third repo, `android-oskey-io` — the real Android end-user app

Caught live by the user after the first pass of this doc was written: **`android-intercom-oskey-io` is the intercom *edge device* app** (mounted hardware, answers/routes calls), not the Android analog of `ios-oskey-dev`. The real end-user mobile counterpart to iOS — the door-open/answer-call app — is a separate repo, **`android-oskey-io`** (`https://github.com/oskey-io/android-oskey-io`), not yet added to `config/repos.json` or onboarded to this pipeline in any way. Per the user's explicit instruction, this was cloned read-only straight into `output/clones/android-oskey-io/` (same convention `00-scan-repo.ts` already uses for every other repo) — no pipeline config, script, or `repos.json` entry was touched, so the pipeline's structure is unaffected.

The user's live hypothesis was that this app "will be making all the identical calls" as iOS. **Checked directly, not assumed** — the real answer is more precise than "identical": **same backend, same functions, same region, different AST shape from both other repos already investigated.**

### Real, confirmed structure

`android-oskey-io` is a multi-module Gradle repo, real modules: `app`, `kotlin-cloud-kit-oskey-io`, `kotlin-ble-kit-oskey-io`, `kotlin-ui-kit-oskey-io`, `kotlin-core-kit-oskey-io`, `kotlin-features-kit-oskey-io`, `kotlin-webrtc-data-oskey-io`, `kotlin-webrtc-domain-oskey-io`, `kotlin-webrtc-presentaion-oskey-io` — a real, close structural mirror of iOS's App+BLE+Cloud+UI+WebRTC package split, not a coincidence. `kotlin-cloud-kit-oskey-io` is the direct Kotlin analog of `swift-cloud-kit-oskey-dev`.

**Zero real REST/Retrofit usage anywhere in this repo** — grepped the whole tree for `@GET(`/`@POST(`/`@PUT(`/`@DELETE(`/`@PATCH(`: zero matches, despite `retrofit2` being declared as a Gradle dependency in 3 modules (`app`, `kotlin-webrtc-data-oskey-io`, `kotlin-webrtc-presentaion-oskey-io`) — the same "declared but never actually used" pattern already seen in `android-intercom-oskey-io`'s own `kotlin-webrtc-data-oskey-io`. This app is Firebase-only, confirmed by absence as much as by presence.

### Pattern A confirmed — Firebase Callable Functions, real region match, real function-name overlap with iOS

`kotlin-cloud-kit-oskey-io/.../functions/OSKCKFirebaseFunctionsInitializer.kt`:
```kotlin
private const val REGION = "europe-west1"
object OSKCKFirebaseFunctionsInitializer {
    val firebaseFunctions: FirebaseFunctions by lazy { FirebaseFunctions.getInstance(REGION) }
}
```
Same region string as iOS's `OSKCKFunctionService`, byte-for-byte — real, direct confirmation this is the same Cloud project/backend, not a coincidence of convention.

**But the real call-site shape is different from both other repos.** All 32 real callable-function call sites live in one file, `app/.../data/auth/functions/OSKFirebaseFunctionsDataSource.kt`, structured as a private `enum class CloudFunctions(val value: String)` with 32 real entries (e.g. `CLOUD_FUNCTION_UPDATE_USER_PHONE_NUMBER("user-updatePhoneNumber")`), then called as:
```kotlin
firebaseFunctions.getHttpsCallable(CloudFunctions.CLOUD_FUNCTION_UPDATE_USER_PHONE_NUMBER.value).call(data)
```
**Real function-name overlap with iOS, confirmed directly**: `"user-updatePhoneNumber"` and `"core-getMfaPhoneNumber"` appear verbatim in both `android-oskey-io`'s `CloudFunctions` enum and Swift's `OSKCKUserService.swift` call sites — hard, concrete evidence both first-party client apps share the same real backend function surface (`firebase-oskey-dev`).

This is genuinely a **third, distinct AST pattern**, not a variant of either prior one:
- Swift: literal string passed directly as the first argument to a generic wrapper's initializer (`OSKCKFunctionService<T>("name", in: "region")`).
- Kotlin (`android-oskey-io`): the literal string lives on an **enum case's constructor argument**, and the real call site passes a **property-access expression** (`CloudFunctions.X.value`) to `.getHttpsCallable(...)` — not a string literal at the call site at all. Extracting the real function name requires a two-hop resolution: find the `.getHttpsCallable(...)` call → resolve its argument to the enum case it references → look up that case's own declared string-literal constructor argument. A naive "does this call have a string-literal argument" check (the pattern that works for both Swift and `android-intercom-oskey-io`'s Retrofit annotations) would find **zero** matches here — real, structural reason this needs its own extraction logic, not a shared one.

### Pattern B confirmed — Firestore, same path shape as iOS, plus a real extra: WebRTC signaling also goes through Firestore

`OSKCKFirestoreDocumentPath`/`OSKCKFirestoreCollectionPath` exist here too, same real paths as Swift's own enums (e.g. `/users/$userId/accesses/$accessId`), but as a Kotlin `object` with real functions returning interpolated strings rather than Swift's `enum` with computed cases — same real data, different declaration shape (functions vs enum cases), which is itself useful to note since it means the Swift extraction design (walk enum cases) will not directly port to Kotlin's version of this pattern; Kotlin's equivalent would need to walk `object`-scoped functions whose body is a single string-template return.

Real, additional finding beyond what iOS showed: Firestore usage in `android-oskey-io` is **not confined to `kotlin-cloud-kit-oskey-io`** — `kotlin-webrtc-data-oskey-io`'s own `OSKFireStoreRepositoryImpl`/`OSKSignalRepositoryImpl` use `FirebaseFirestore` directly for real-time call-signaling state, not just user/account data. Consistent with this app's real job (answering intercom calls) — WebRTC signaling coordinated through Firestore makes real sense here — but it means a future Kotlin `firestore_document_access` fact kind can't assume the pattern lives in one module the way Swift's does; it needs to scan across modules.

### What this means for the earlier sections above

- The "Kotlin" findings in section 2 above are real and correct, but scoped to the **wrong product** for this initiative's actual goal — they describe the intercom edge-device app, not the end-user mobile app. Both are real Kotlin repos this project may eventually want fact extraction for, but **`android-oskey-io` is the one structurally comparable to `ios-oskey-dev`**, and it needs its own, third fact-kind design — not a reuse of either `android-intercom-oskey-io`'s REST pattern or Swift's initializer pattern.
- Recommend the eventual build session treat this as **three real integration patterns across three repos**, not two: Swift-initializer-literal (iOS), Kotlin-annotation-literal (`android-intercom-oskey-io`, REST → `node-iot-api-oskey-io`), and Kotlin-enum-property-access (`android-oskey-io`, Callable/Firestore → `firebase-oskey-dev`). Each is cheap and structurally reliable on its own; none generalizes to cover another.
- `android-oskey-io` is not yet in `config/repos.json` — before any extraction work can run against it for real (vs. this one-off manual read), it needs a real onboarding pass (branch/commit pin decision, module discovery, `astTool` config) the same way `ios-oskey-dev`/`android-intercom-oskey-io` already went through. That's real, separate scoping work, not assumed to be trivial just because the module shape looks similar to iOS.

## Addendum 2 (same day): a third real integration category, missed in the first pass — WebRTC/Socket.IO signaling, present in every client repo

Found while double-checking whether `android-oskey-io` truly has "no sibling repos" (real answer: confirmed true, see below) — a `SIGNALING_URL` buildConfigField pointed at `api.oskey.io`, the same host `node-iot-api-oskey-io`'s REST layer uses, but at a path (`v1/rtc/signaling/...`) that doesn't match any route in that repo. Chasing that down surfaced a real, substantial integration surface this whole doc had missed until now: **real-time call signaling over Socket.IO, structurally present in all three client repos** (`ios-oskey-dev` via `swift-webrtc-kit-oskey-io`, `android-oskey-io` via `kotlin-webrtc-domain-oskey-io`, and `android-intercom-oskey-io` via its own `kotlin-webrtc-data-oskey-io`) — none of it Firebase Callable, Firestore, or REST, and none of it caught by this doc's original grep passes (which only searched for `firebase|firestore|httpsCallable|@GET|@POST|...`, not signaling/socket terms).

### Real, confirmed shape

**Swift** (`swift-webrtc-kit-oskey-io/.../Signaling/Services/OSKWKSignalingService.swift` + `.../Configuration/OSKWKSignalingConfiguration.swift`): real `import SocketIO` (the Socket.IO Swift client), connecting to a per-environment host/path/API-key triple hardcoded directly in source:
```swift
static let release = OSKWKSignalingConfiguration(
    protocol: .wss, hostname: "api.oskey.io",
    path: "/v1/rtc/signaling/socket-io",
    apiKey: "Q61nexzNVjXlAkrWG3vWQvfio8beDEIBuVwoJdiAhDVJftRN"
)
```
(dev/staging/release all present, all real, real API keys checked into source — worth flagging as a separate security-hygiene note, not this doc's concern). Real message-level protocol: ~20 distinct inbound/outbound message body types (`OSKWKSignalingOfferMessageBody`, `OSKWKSignalingJoinCallMessageBody`, `OSKWKSignalingICECandidatesMessageBody`, etc.) under `Utils/Signaling/Models/Messages/{Inbound,Outbound}/`.

**Android** (`kotlin-webrtc-domain-oskey-io/.../OSKConfigurationData.kt` + `kotlin-webrtc-data-oskey-io/.../socketIO/OSKSignalingService.kt`): real `io.socket:socket.io-client:2.1.1` Gradle dependency (same protocol as Swift, not raw `okhttp3.WebSocket` despite a misleading `signalingTransport = "websocket"` constant — that's Socket.IO's own transport setting, not a different mechanism), same host family (`api.{env}.oskey.io`), same path family (`v1/rtc/signaling/ws/...`), separate caller/participant endpoints with their own API keys. **Confirmed present in both real Android repos** — `android-oskey-io` (end-user app) and `android-intercom-oskey-io` (edge device) each carry their own copy of this module (same package name `io.oskey.webrtc_data`/`io.oskey.webrtc_domain`, same real class names — copy-derived, not shared by a common dependency, confirmed by the `android-intercom-oskey-io` copyright header surviving verbatim inside `android-oskey-io`'s own `kotlin-webrtc-data-oskey-io/build.gradle.kts` file).

### Real, honest open question: which backend serves this?

Checked both backend repos this pipeline already knows about, directly:
- `node-iot-api-oskey-io/src/v1/routes/*.route.ts` — no `rtc`/`signaling` route registered anywhere.
- `firebase-oskey-dev/functions/src/modules/call/` — a real `call` module exists (Firestore documents + Callable Functions for call *metadata* — creation, participant state), but no Socket.IO/WebSocket *server* code — consistent with Cloud Functions' own stateless-HTTP model, which can't easily host a persistent Socket.IO server anyway.

**Neither repo structurally serves `/v1/rtc/signaling/...`.** This is a real, honest gap, not a guess dressed up as an answer: there is very likely a fourth backend service (a dedicated, persistent signaling server — plausibly Cloud Run or similar, given it needs long-lived WebSocket connections a Cloud Function can't hold) that isn't in this project's repo set at all yet. Flagging this explicitly rather than assuming it's covered by one of the two backends already checked.

### Real product context, and a deliberate scope decision (per the user directly, 2026-09-18)

**What this signaling channel is actually for**: this is the real mechanism by which a physical intercom at a building's door calls a resident's phone. Someone at the door selects a resident from the intercom's on-device directory; the intercom (`android-intercom-oskey-io`) places a real-time call over this Socket.IO channel; the resident's phone (`ios-oskey-dev` or `android-oskey-io`, whichever they run) receives and answers it over the same channel. This is the real reason all three client repos share the identical signaling protocol — it's not incidental overlap, it's the literal call path the whole product exists to support.

**Explicitly out of scope for now — a sequencing decision, not an oversight.** Per the user directly: bringing this into scope alongside the Firebase-Callable/Firestore/REST work already identified would have made getting the pipeline itself tested and running end-to-end significantly harder, for no immediate benefit. Left out deliberately, **for now** — not because it's unimportant (it's arguably the most product-central integration surface of the three), and not a finding that should be treated as "still needs closing" the way the Layer 1/Layer 2 hardcoding gaps do. Real, standing note for whoever (human or a future Claude session) picks this initiative back up: **the moment signaling extraction becomes worth doing, this section already has the real structure, real file locations, and the real open backend-identification question ready to hand off from** — no re-investigation needed, just a scope decision to bring it in.

### Why this matters for the initiative

This is arguably **the single most universal real integration pattern across the whole client fleet** — Firebase Callable Functions is iOS/Android-end-user-app-only (not the intercom device, per section 2 above), REST-via-Retrofit is intercom-device-only, but Socket.IO signaling is confirmed present in **all three** client repos with the same real protocol. A future build session extracting "outbound integration calls" that stops at Firebase+REST would miss the one pattern every client shares. Proposed fact kind: **`realtime_signaling_channel`** — one per `SocketManager`/`socket.io-client` connection-configuration site, fields: `host`, `path`, `protocol` (ws/wss), real per-message-type facts for the ~20 inbound/outbound message bodies if that granularity proves useful later (not decided here — flagging the existence and shape, not designing the full fact schema, consistent with this whole doc's investigation-only scope).

### Real answer to "does `android-oskey-io` have siblings" (the question that led here)

**Confirmed: no.** No `.gitmodules`, no nested `.git` directories — every `kotlin-*-oskey-io` folder inside `android-oskey-io` is a plain Gradle module committed directly into the one monorepo (`rootProject.name = "OSKey"`, `include(":kotlin-cloud-kit-oskey-io")` etc. in the real `settings.gradle.kts`), not a separate GitHub repo the way iOS's 5 SPM packages are. The devs were right about that specific claim. What the check *did* surface, though, was the WebRTC-signaling gap above — a different, more consequential finding than the literal question asked.

## Summary for whoever builds this next

| | iOS / Swift (`ios-oskey-dev`) | Android end-user app (`android-oskey-io`) | Android intercom edge device (`android-intercom-oskey-io`) |
|---|---|---|---|
| Real product role | door-open / answer-call end-user app | door-open / answer-call end-user app (Android counterpart to iOS) | mounted intercom hardware, not a phone app |
| Real mechanism | Firebase Callable Functions + Firestore SDK | Firebase Callable Functions + Firestore SDK | Plain REST, Retrofit2/OkHttp |
| Where | `swift-cloud-kit-oskey-dev` only | `kotlin-cloud-kit-oskey-io` (Callable init/region, Firestore paths) + `app/.../OSKFirebaseFunctionsDataSource.kt` (call sites) + `kotlin-webrtc-data-oskey-io` (Firestore signaling) | `android-intercom-oskey-io/app` only, one file |
| Target backend | `firebase-oskey-dev` | `firebase-oskey-dev` (region + function names confirmed overlapping with iOS) | `node-iot-api-oskey-io` (**not** Firebase) |
| Real call-site count | ~~36~~ **34** (Callable, corrected 2026-09-18 during the build pass — see §1's own correction note) + 32 (Firestore path cases) | 32 (Callable, all in one file) + 4 (Firestore document paths) + 17 (Firestore collection paths) | 5 |
| Real call-site shape | literal string passed directly to a generic wrapper's initializer | literal string lives on an enum case's constructor arg; call site passes `Enum.CASE.value` (property access, not a literal) — needs 2-hop resolution | annotation argument, structural literal string |
| New fact kind(s) | `firebase_callable_call`, `firestore_document_access`/`firestore_collection_access` | same conceptual kinds as iOS, but **separate extraction logic** — different AST shape | `rest_endpoint_call` |
| Match key | `rootIdentifier === "OSKCKFunctionService"` (calleeExpression varies — generic) | `.getHttpsCallable(...)` call whose argument resolves to an enum-case property access; resolve function name via the enum case's own declared literal | annotation `type_identifier` ∈ {GET,POST,PUT,DELETE,PATCH} |
| Known gap in existing helpers | none found | none checked yet (repo not onboarded — `annotationNamesIn`/`isAnnotatedWith` gaps don't apply here, this is calls not annotations) | `findEnclosingClassName` doesn't walk `interface_declaration` |
| Onboarded to pipeline today? | yes | **no** — not in `config/repos.json`, this was a one-off manual clone | yes |
| Also has WebRTC/Socket.IO signaling? | yes (`swift-webrtc-kit-oskey-io`) | yes (`kotlin-webrtc-domain-oskey-io`) | yes (`kotlin-webrtc-data-oskey-io`) |

Plus a **fifth real integration pattern, present in all three repos** (Addendum 2): Socket.IO-based real-time call signaling against `api.{env}.oskey.io/v1/rtc/signaling/...` — the real mechanism by which the intercom calls a resident's phone. Real backend not yet identified (checked and ruled out both `node-iot-api-oskey-io` and `firebase-oskey-dev` structurally). **Deliberately out of scope for this initiative for now** (user decision, 2026-09-18 — bringing it in now would have made getting the rest of the pipeline tested and running harder, for no immediate benefit), not an unresolved gap needing action. Proposed fact kind, ready whenever it's brought into scope: `realtime_signaling_channel`.

Five real, distinct fact-extraction patterns across three client repos and two languages, not one shared kind per language — each cheap and structurally reliable to build on its own, none built here per this prompt's investigation-only scope. Three things Layer 1 (`build-cross-repo-edges.ts` generalization) should know before it finalizes its generic-discovery logic:

1. Android intercom's real new edge is `android-intercom-oskey-io` → `node-iot-api-oskey-io`, a repo pair not covered by today's hardcoded Angular/Firebase-only assumption.
2. `android-oskey-io` is a real, confirmed-relevant fourth client repo for this whole initiative, sharing `firebase-oskey-dev` as a backend with iOS — but it isn't in the pipeline's `config/repos.json` yet at all, so it can't produce any edges (old or new) until it gets a real onboarding pass (branch/commit pin, module discovery, `astTool`), independent of whatever Layer 1/Layer 2 build first.
3. The Socket.IO signaling edge's real backend repo is genuinely unknown/unonboarded — don't assume it's `firebase-oskey-dev` or `node-iot-api-oskey-io` just because the host overlaps. Not urgent (deliberately deferred, see Addendum 2), but when it does come into scope, its real backend needs identifying before any edge can be built for it.
