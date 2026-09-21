# Findings: why `walk_cluster`/`get_graph_neighbors` never surfaced a cross-repo fact

> **Partly superseded 2026-09-21, see [31](31-findings-cross-repo-edges-extension-scope-2026-09-21.md)
> and the build plan [38](38-build-plan-cross-repo-edges-four-joins-2026-09-21.md).** The core
> finding below (the graph is sparse because `build-cross-repo-edges.ts` was scoped to one join,
> not because data is corrupt) still stands. Three secondary claims were refined or reversed by
> doc 31's real checks; the original reasoning is left intact below:
> - **Category 1 ("genuinely not AST-derivable… not something a smarter parser fixes") is no
>   longer accurate.** True of source parsing, but the topic→subscription→push-endpoint binding
>   is queryable live via `gcloud pubsub subscriptions list` (doc 31 §5). Pubsub is now a
>   buildable join, though see doc 38 for a real caveat on how many edges it yields.
> - **The android-intercom Category 1 guess was wrong.** No pubsub or Firebase usage there; its
>   real cross-repo link is 5 REST calls matching node-iot routes (doc 31 §1).
> - **"Model never anchored the pubsub edge" was wrong.** `search_facts` never surfaced the fact
>   at all, so this is a retrieval gap, not a graph-traversal one (doc 31 §2).
> - The Category 2 join key is better than `imports_dependency`: `call_expression` facts carry
>   `declarationRepo` + `declarationFile` (symbol-level, doc 31 §3). And the "UIKit/OSKEY need
>   filtering" worry is moot: extraction already excludes system frameworks.
> - Precision: "316 real `imports_dependency` facts" below is the resolved-cross-repo subset
>   only (176+118+18+4); iOS has 1,101 in total.

Prompted by the user's real concern — after 5 consecutive dummy-PRD test runs against the
previously-untested repos (`ios-oskey-dev`, `android-intercom-oskey-io`,
`node-iot-api-oskey-io`) never once surfaced a cross-repo graph neighbor, including a run
specifically built around a cross-repo pubsub flow — whether the underlying Postgres data is
actually trustworthy. Read-only, zero LLM calls: real Postgres queries plus a direct read of
`pipeline/facts-postgres-index/build-cross-repo-edges.ts`, the one script responsible for
building genuine cross-repo edges.

## Real answer: the data isn't corrupted — the edge-building script's scope is just narrow

`cross_repo_edges` has **17,195 real rows total**. Broken down by (source_repo, target_repo):

| pair | count |
|---|---|
| every same-repo pair (8 repos) | 17,064 (99.2%) |
| `angular-app-oskey-io` → `firebase-oskey-dev` | 110 |
| `node-iot-api-oskey-io` → `firebase-oskey-dev` | **1** |
| `firebase-oskey-dev`/`angular-app-oskey-io` → `unknown` (unresolved) | 20 |

**Zero rows exist for any of**: `android-intercom` ↔ `firebase`, `android-intercom` ↔
`node-iot`, `ios-oskey-dev` ↔ `firebase`, `ios-oskey-dev` ↔ any of the 4 `swift-*-kit` repos,
`node-iot` ↔ `android-intercom`. Every one of these is a real, expected dependency in the
actual system architecture (node-iot exists specifically to bridge cloud and the Intercom
device; the iOS app depends on its own Swift kits as real package imports) — none of it is
represented in the graph at all.

## Root cause, read directly from the script

`build-cross-repo-edges.ts`'s own header names its scope precisely: **"Task 2 of
governance/roadmap/facts-serving-strategy/14-inbound-outbound-surface-graph-tasklist.md: real,
deterministic cross-repo edges between Angular's `firebase_callable_call` facts and Firebase's
`api_contract` facts."** That's the entire HTTP_API_CALL join — one specific, deliberately
narrow pair, never extended. A second connection type, PUBSUB_TOPIC_BINDING, adds exactly one
more real edge (`node-iot` → `firebase`, topic `accessControlDevice_activities` →
`processPubSubMessage`), and it's not derived by any join at all — it's a single,
**manually-curated, human-confirmed** entry (`CONFIRMED_PUBSUB_BINDINGS`), verified via three
independent pieces of evidence outside the AST (GCP subscription naming, a code comment,
matching payload shape). No other repo pair, and no other topic, has ever gone through that
manual confirmation process.

This is not a bug and not bad data — it's a script that did exactly what it was scoped to do
(Task 2, one pair), that nobody has extended since. Two genuinely different reasons the gap
exists, worth treating differently:

### Category 1 — genuinely not AST-derivable, correctly left unresolved

The script's own comment explains this precisely: **"node-iot's real, resolved publish call
site never names the receiving Firebase endpoint, and Firebase's real receiver... never
references the topic name anywhere in its own source. The topic → subscription → push-endpoint
binding lives entirely in GCP Pub/Sub subscription config, external to both repos' application
source."** Confirmed further: node-iot's own other real publish call site is a genuinely
dynamic topic name (`topicResolutionStatus: "unsupported"`), and Firebase separately has 14 of
its own unresolved publish calls (dynamic env-var topic names). This is a real, structural
boundary of AST-only extraction — the pubsub topic → subscription binding is genuinely
external, GCP-console-level configuration, not something a smarter parser fixes. Any similar
`android-intercom` ↔ `node-iot`/`firebase` pubsub relationship is very plausibly in this same
category, not checked individually here.

### Category 2 — genuinely resolvable, just never attempted

Checked directly: `ios-oskey-dev` already has **316 real `imports_dependency` facts** that
literally name the exact Swift-kit package identifiers —
`OSKCloudKit` (118), `OSKUIKit` (176), `OSKBluetoothLEKit` (18), `OSKWebRTCKit` (4). These are
real Swift `import` statements, already correctly extracted, sitting completely unused for
cross-repo linking. This is the *same shape* of problem `build-cross-repo-edges.ts` already
solves for Angular→Firebase (a compound-key join on real, extracted symbol names) — nobody has
ever built the iOS↔Swift-kit equivalent. Unlike the pubsub case, this is a real, concrete,
buildable fix: the data needed to resolve these edges already exists in Postgres today.

## What this means for the dummy-PRD testing

Every dummy PRD run so far against the untested repos happened to land on pairs with zero real
edges (`ios-oskey-dev`+`swift-ble-kit`, `firebase`+`node-iot`+`android-intercom`) — the one
run that *did* touch a pair with a real edge (`node-iot`→`firebase`) still didn't surface it,
plausibly because the model never anchored `walk_cluster`/`get_graph_neighbors` on the specific
fact that edge connects to (not checked here — a real, separate, smaller question worth a
follow-up if it matters: did the run's own gathered evidence include the specific
`pubsub_publish_call`/`processPubSubMessage` facts that edge links, and if so, why didn't a
graph call anchor there). The absence of cross-repo citations in these runs is **not** evidence
the retrieval mechanism is broken — it's a direct, structural consequence of how little of the
real graph exists for these repo pairs yet.

## Explicitly not done here

- No fix built. This is a real, concrete, scoped gap (Category 2 especially) that a future
  decide/build session could close — extending `build-cross-repo-edges.ts` with an
  iOS↔Swift-kit join is a real, bounded piece of work, not investigated further here.
- Not checked: whether `android-intercom-oskey-io` has its own real, resolvable import-based
  dependency on the Swift/Kotlin kits it shares logic with, or genuine dynamic-pubsub-only
  relationships (Category 1) — worth checking before assuming its whole gap is Category 2.
- Not checked: whether the one real `node-iot`→`firebase` edge was reachable but simply never
  anchored by the model in the pubsub dummy-PRD run — a smaller, separate question from the
  main structural finding here.
