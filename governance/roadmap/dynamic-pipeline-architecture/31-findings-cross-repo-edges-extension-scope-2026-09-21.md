# Findings: real scope for closing the cross-repo edge gap (doc 30's investigation)

> **Corrections added 2026-09-21, found while writing the build plan
> ([38](38-build-plan-cross-repo-edges-four-joins-2026-09-21.md)). The original text below is
> left intact.**
> 1. **§5 subscription count reconciles.** The "10 subscriptions" are 7 push to node-iot + 1 push
>    to Firebase (`core-processPubSubMessage`) + 1 push to the scheduled Cloud Function + 1
>    `accessControlDevice_activities-processPubSubMessage-dlq` (a **pull** subscription, no push
>    endpoint), per `pubsub.bindings.staging.json`. The "10th topic" wording and "six more
>    bindings" phrasing in §5 are loose; the JSON is authoritative.
> 2. **§3's "safe fallback" is not safe for traversal.** It proposed a coarser file-level edge
>    with no target `fact_id` for the 33% complex-callee slice. `findGraphNeighbors`
>    (`mcp-server/db/graph-traversal.ts`) only follows edges that are `resolved`/`confirmed`
>    and, for outgoing edges, have a non-null `target_fact_ref`; a target-less edge is invisible
>    to `walk_cluster`/`get_graph_neighbors`. It's still worth recording as an unresolved edge
>    for coverage reporting, but it doesn't close the traversal gap. See doc 38.
> 3. **§5's "something else publishes" is probably answerable.** `build-cross-repo-edges.ts`'s
>    own comments say Firebase has 14 real `pubsub_publish_call` facts with dynamic env-var topic
>    names (e.g. `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`), and those names resemble the 7
>    node-iot-bound topics. Firebase is a plausible publisher for those topics, but the env-var
>    → topic value link is unverified (a naming resemblance only). Whether the values can be read
>    deterministically is an open question doc 38 carries. It also limits how many pubsub edges
>    can actually be built: an edge needs a fact on both ends.
> 4. **The 4 unmatched node-iot push routes** use singular path tails (`access-command`,
>    `access-log`, `system-log`, `state`). Check node-iot's route files directly for those
>    before assuming an extraction gap (already listed under "Not resolved" below).

Answers doc 30's four investigation items. Read-only, zero LLM calls: real Postgres queries
against `facts` (via `docker exec facts-postgres-index-local psql`) plus a direct read of the
real debug trace at
`output/agent-runs/prds/test/debug/2026-09-21-002-1d-pubsub-edge-device-api/`. No fix built,
no `cross_repo_edges` rows written, no git add/commit — investigate + decide only, per doc 30's
own instruction.

**Headline: the real scope is bigger, and easier, than doc 29/30 assumed.** Two genuine,
concrete Category-2-shaped opportunities exist beyond the iOS↔Swift-kit one doc 30 named, and
the iOS↔Swift-kit join itself is cleaner than feared — the hard disambiguation work turns out to
already be done upstream, in extraction, not something a new join script needs to compute.

---

## 1. Android-intercom's real shape — hypothesis in doc 30 was wrong

Confirmed true: `kotlin-ble-kit-oskey-io`, `kotlin-webrtc-data-oskey-io`,
`kotlin-webrtc-domain-oskey-io`, `kotlin-usb-oskey-io` are real same-repo modules (all facts
have `repo = 'android-intercom-oskey-io'`, distinguished only by `module`), not separate git
repos the way iOS's Swift kits are. That part of doc 30's premise holds.

**But the follow-on guess — "its real cross-repo needs are probably firebase/node-iot-facing,
pubsub-shaped, likely Category 1" — is wrong on both counts:**

- **Zero evidence of any real Firebase usage at all.** No `imports_dependency` value contains
  "firebase" or "functions"; no fact kind resembling a callable/HTTP client to Firebase exists
  anywhere in the repo's 14 real fact kinds.
- **Zero evidence of pubsub usage at all.** Android-intercom has no `external_hook` fact kind
  and no fact of `type: pubsub_*` anywhere — unlike node-iot and Firebase, which both have real
  pubsub call sites. The Category-1 guess has literally nothing to be Category 1 *about*.

**What's actually there, real and concrete:** 5 `rest_endpoint_call` facts in
`OSKApiService.kt`, every one hitting a path under `/v1/iot/access-control-devices/...` — an
explicit "iot" prefix naming node-iot's own API. Checked directly against node-iot's 18 real
`route_definition` facts: 4 of the 5 match **exactly** (same path shape, same HTTP method, only
differing in param-token syntax — Android's `{accessControlDeviceId}` vs. node-iot's
`:accessControlDeviceId`), and the 5th matches with one param renamed
(`{modificationDate}` vs. `:timestamp`, same position, same route otherwise):

| Android `rest_endpoint_call` | node-iot `route_definition` | match |
|---|---|---|
| GET `/v1/iot/access-control-devices/{id}/config` | GET `/access-control-devices/:id/config` | exact |
| GET `/v1/iot/access-control-devices/{id}/intercom-entries` | GET `/access-control-devices/:id/intercom-entries` | exact |
| GET `/v1/iot/access-control-devices/{id}/accesses` | GET `/access-control-devices/:id/accesses` | exact |
| POST `/v1/iot/access-control-devices/{id}/activities/intercom` | POST `/access-control-devices/:id/activities/intercom` | exact |
| GET `/v1/iot/access-control-devices/{id}/config/{modificationDate}` | GET `/access-control-devices/:id/config/:timestamp` | shape match, param renamed |

This is a real, genuinely AST-derivable, **third join type** — HTTP path-template + method
matching (strip the `/v1/iot` client-side prefix, normalize `{param}` vs `:param` tokens) —
distinct from both the existing Angular→Firebase compound-key join and the iOS↔Swift-kit
import-based join. Small in current scope (5 real call sites today) but a real, buildable
android-intercom↔node-iot edge, not a Category-1 dead end.

**Separately found, genuinely out of scope:** android-intercom also has 14 real
`webrtc_signaling_touchpoint` facts (socket.io emit/listen events in
`kotlin-webrtc-data-oskey-io/.../OSKSignalingService.kt`) connecting to a real-time signaling
service. Checked: no other repo in this fact index has a matching kind (`angular_signal` is an
unrelated Angular reactivity primitive, not a signaling counterpart). Android-intercom's
signaling server isn't one of the 8 repos this graph covers at all — a real, structural
boundary (the counterpart doesn't exist in the fact index, not an extraction gap), worth noting
but not a build candidate.

## 2. Was the one real node-iot→firebase pubsub edge reachable but never anchored?

**No — the underlying fact never surfaced via `search_facts` at all**, in either direction.
Checked the full debug trace (`llm-*.json`, `tool-calls-*.jsonl`, `postgres-queries.jsonl`) for
the exact strings involved in the one confirmed edge
(`external_hook|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|accessControlDevice_activities|#1`):

- The literal topic value `accessControlDevice_activities` appears **zero times** anywhere in
  the trace — not in a query, not in a returned result, not in the final LLM output.
- Yet closely related content from the *same file* did surface: `activities_route.handler` and
  `publishMessage` both appear repeatedly, as `call_expression`/`service_method` facts (the
  method call site itself), just never as the specific `external_hook` fact the real
  `cross_repo_edges` row actually points to.
- The vector search (`postgres-queries.jsonl`) did return *other* `external_hook` facts at
  moderate distances (0.65–0.83) — Firebase's own `topicName` at
  `access_control_device_config.controller.ts:92`, and node-iot's own **unresolved** `topicName`
  at `pubsub.service.ts:19` — but never the one resolved fact that matters.

This confirms the "no" branch doc 30 flagged: **a retrieval gap, not a graph-traversal
failure.** The model never anchored `walk_cluster`/`get_graph_neighbors` on either side of the
real edge because `search_facts` never handed it that specific fact in the first place — its own
embedded description apparently scored below the threshold that got surfaced, even with
directly adjacent facts (same file, same call chain) scoring well enough to appear. Worth a
narrower follow-up if retrieval quality for `external_hook`/pubsub facts specifically becomes a
priority — not investigated further here (out of scope for this doc).

## 3. Real scope for iOS↔Swift-kit edges — cleaner than expected

**The disambiguation work doc 30 worried about is already done, upstream, at extraction time.**
Two independent real fact kinds already carry resolved cross-repo targets:

**`imports_dependency` (316 real facts across the 4 kits)** already carries
`importResolutionStatus`, `resolvedTargetRepo`, and `resolvedTargetModule` in its own payload —
computed by whatever pipeline stage produced these facts, not something a join needs to derive.
Full breakdown, all 1,101 real iOS `imports_dependency` facts:

| status | target repo | count |
|---|---|---|
| `resolved_cross_repo` | swift-ui-kit-oskey-dev | 176 |
| `resolved_cross_repo` | swift-cloud-kit-oskey-dev | 118 |
| `resolved_cross_repo` | swift-ble-kit-oskey-dev | 18 |
| `resolved_cross_repo` | swift-webrtc-kit-oskey-io | 4 |
| `resolved_in_repo` | (same repo) | 2 |
| `external_or_unresolved` | — | 783 |

Spot-checked the 783 "external_or_unresolved" bucket: genuinely system/third-party frameworks
(SwiftUI 275, Foundation 161, Combine 68, UIKit 29, FirebaseAuth 12, FirebaseStorage 10, etc.) —
already correctly excluded. Doc 29's worry that "UIKit/OSKEY mixed in among the real hits" would
need filtering is **not a real problem** — the filtering already happened.

**`call_expression` facts are even richer, and this is the better join source.** 389 real call
sites across the 4 kits carry `resolutionMethod: 'resolved_via_import'` plus a
`declarationRepo` **and** `declarationFile` pinpointing the exact target file (e.g.
`Sources/OSKUIKit/UI Elements/Expanded/Views/OSKUIExpanded.swift` in
`swift-ui-kit-oskey-dev`) — full symbol-level resolution, not just module-level:

| target module | resolved call sites |
|---|---|
| OSKUIKit | 222 |
| OSKCloudKit | 135 |
| OSKBluetoothLEKit | 20 |
| OSKWebRTCKit | 12 |

Checked directly: **262 of these 389 (67%) have a simple single-identifier `calleeExpression`**
(e.g. `OSKUIExpanded`), and for every one of those 262, a matching declaration fact
(`struct_declaration`/`class_declaration`/`function_declaration`/`enum_declaration`/
`protocol_declaration`) exists in the target repo at the exact `declarationFile`, with the exact
symbol name — **262/262, a 100% match rate.** No bare-name collision risk analogous to Angular's
`removeInhabitantFromUnit`/`getAllOrganizations` problem, because `declarationFile` is already
known precisely — the join key is (repo, file, symbol name), not a repo-wide bare name.

The remaining 127/389 (33%) have complex, multi-token `calleeExpression` values (method chains,
closures, e.g. `OSKUIBottomPopup { ... }.showAndReplace`) that would need the leading identifier
extracted before the same join applies — not verified how many of those resolve cleanly once
parsed (real, honest gap left here), but a safe fallback exists regardless: emit a coarser
file-level edge (target = `declarationFile`, no specific declaration `fact_id`) for any case that
doesn't parse cleanly, rather than leaving it out.

**One more real, useful finding:** this `resolved_via_import` + `declarationRepo` pattern exists
**only** for `ios-oskey-dev` — checked across every repo, no other repo (android-intercom,
angular, firebase, node-iot) has any `call_expression` fact with a `declarationRepo` differing
from its own repo. The Swift extractor evidently does full cross-repo symbol resolution at
extraction time (consistent with a SourceKit/Xcode-build-index-based extractor with full
workspace type information); the TS/Kotlin extractors don't attempt this at all, which is why
`build-cross-repo-edges.ts` exists as a separate post-hoc join step for those repos.

## 4. Decide-stage recommendation

**(a) — iOS↔Swift-kit is a clean, bounded, single build task, and genuinely *smaller* than the
original Angular→Firebase join, not comparable-or-messier as doc 30 worried.** The Angular join
had to write real disambiguation logic (module-qualified compound keys) to handle a real,
confirmed bare-name collision. The iOS↔Swift-kit case has no equivalent problem to solve — the
extraction already disambiguates via `declarationFile`, verified via a 100% match rate on the
subset checked. Recommend building against all 4 kits in one pass, not a single-kit
(`OSKCloudKit`-only) pilot — the evidence is uniform across kits, so gating on one kit first
would mostly cost time without hedging a real, distinct risk. The only genuinely open sub-task
is what to do with the 33% complex-`calleeExpression` slice; the safe default (coarser
file-level edge, no fact-level target) is enough to not block a full build.

**(b) — Two additional real, concrete opportunities were found in the course of answering (1)
and (3) that belong in the same decide/build scope, since they were surfaced doing this same
investigation and are directly relevant to "the real scope of closing the cross-repo graph gap"
(doc 30's own framing):**

1. **iOS→Firebase via `swift-cloud-kit-oskey-dev`, using the *existing* join unchanged.**
   `swift-cloud-kit-oskey-dev` has 34 real `firebase_callable_call` facts in the exact same
   `module-handlerName` shape Angular already uses (e.g. `unit-removeInhabitantFromUnit`,
   `user-getCurrentUserUnits`). Simulated the existing compound-key join from
   `build-cross-repo-edges.ts` against these 34 facts: **24/34 (71%) resolve cleanly** against
   Firebase's `api_contract` facts, no code changes to the join logic itself needed — only
   extending the script's Angular-only repo filter to also read
   `firebase_callable_call` facts from `swift-cloud-kit-oskey-dev`. This is the cheapest, lowest
   -risk item found in this whole investigation.
2. **android-intercom→node-iot via HTTP path-template matching** (see finding 1 above) — a real,
   new join type, small in current scope (5 call sites) but genuinely buildable today.

**Corrected framing for the next build-planning session:** the real remaining gap isn't one
iOS↔Swift-kit join — it's four independent, real, concrete opportunities (iOS↔Swift-kit via
`call_expression`/`declarationRepo`, iOS→Firebase via the existing join extended to one more
repo, android-intercom→node-iot via a new path-matching join, and — see finding 5 below — a
live-GCP-config-backed pubsub join), of clearly different sizes and risk profiles, all confirmed
buildable against live data. None of them require new manual curation the way the one
`CONFIRMED_PUBSUB_BINDINGS` entry did — all four are fully AST/extraction-or-live-config-derivable
already.

## 5. Live GCP Pub/Sub config directly closes the Category 1 gap (not just corroborates it)

Follow-up prompted by the user adding two real, hand-maintained reference files
(`governance/reference-docs/pubsub.topics.staging.md`, `pubsub.subscriptions.staging.md`) and
asking whether extraction could use them, then whether GCP could be queried directly instead.
Read-only: `gcloud pubsub {topics,subscriptions} list --project=staging-oskey-io`, using the
user's own already-authenticated `gcloud` identity (`david.openshaw@oskey.io`), against the real
`staging-oskey-io` GCP project. No mutation, no billed API usage (list/describe calls are free).

**The two hand-maintained files are already stale relative to live GCP state.** Real, direct
discrepancy found: `pubsub.topics.staging.md` lists `mdmDevice_heartbeats`, `device-logs`,
`device-states` as real topics — **none of the three exist in the live `staging-oskey-io`
project** (confirmed via `gcloud pubsub topics list`, 11 real topics total, none of those three
names present). Separately, the real `activities` subscription is named
`accessControlDevice_activities-processPubSubMessage` live, but the hand-typed file just says
`accessControlDevice_activities` (missing the handler suffix doc 29's manual investigation had
separately confirmed by other means). Static reference docs drift from live infra — itself the
argument for later getting either live query access or a devops-provided export instead of
maintaining these by hand, as the user proposed.

**Live query gives the actual missing piece: push endpoint URLs.** Finding 2 above (and doc 29
before it) identified that the one confirmed real pubsub edge
(`accessControlDevice_activities` → Firebase's `processPubSubMessage`) was only circumstantially
confirmed — naming convention + a code comment + matching payload shape, no direct config
evidence. `gcloud pubsub subscriptions list` returns the subscription's real
`pushConfig.pushEndpoint`, which **deterministically settles it**:

```
topic: accessControlDevice_activities
subscription: accessControlDevice_activities-processPubSubMessage
pushEndpoint: https://europe-west1-staging-oskey-io.cloudfunctions.net/core-processPubSubMessage
```

A literal Cloud Function URL naming `processPubSubMessage` in the `core` function group, region
`europe-west1` — replacing three-way circumstantial evidence with one authoritative config read.

**Six more real bindings, not previously known, most pointing at node-iot as a receiver — not
Firebase.** The live subscription list has 10 real entries (not 12 — two of the hand-typed
file's names don't exist). Full extraction saved to
`governance/reference-docs/pubsub.bindings.staging.json` (topic, subscription, delivery type,
push endpoint + parsed host/path, dead-letter topic). Beyond the one already-confirmed edge,
**7 total topics push to `node-iot-api-staging-oskey-io`'s own Cloud Run service** (a direction
not previously surfaced — something else publishes device state/access/config/log events that
node-iot itself *receives* via push, the reverse role from the one edge previously known):

| topic | push path | matches an extracted node-iot `route_definition`? |
|---|---|---|
| `accessControlDevice_accesses` | `/v1/access-control-devices/pubsub/accesses` | yes — `POST /access-control-devices/pubsub/accesses` |
| `accessControlDevice_intercomEntries` | `/v1/access-control-devices/pubsub/intercom-entries` | yes — `POST /access-control-devices/pubsub/intercom-entries` |
| `accessControlDevice_configurations` | `/v1/access-control-devices/pubsub/configs` | yes — `POST /access-control-devices/pubsub/configs` |
| `accessControlDevice_accessCommands` | `/v1/access-control-devices/pubsub/access-command` | **no** — no matching route_definition fact |
| `accessControlDevice_accessLogs` | `/v1/access-control-devices/pubsub/access-log` | **no** |
| `accessControlDevice_systemLogs` | `/v1/access-control-devices/pubsub/system-log` | **no** |
| `accessControlDevice_states` | `/v1/access-control-devices/pubsub/state` | **no** |

The 3 matches confirm real, path-identical bindings once the extra `/v1` prefix (present on the
live Cloud Run push path, absent from node-iot's own router-relative `route_definition` facts —
likely a base-path mount the extractor doesn't see) is normalized away — the same normalization
already needed for android-intercom's `/v1/iot/...`-prefixed calls in finding 1 above, now a
third real prefix variant to account for, not two.

The 4 non-matches are a real, honest gap worth noting, not resolved here: either the
corresponding node-iot route exists in code but wasn't captured by extraction, or genuinely
doesn't exist yet (topics/subscriptions provisioned ahead of the handler code) — not
distinguished in this pass.

The 10th topic, `firebase-schedule-user-checkAccountDelete-europe-west1`, confirms the
`gcf-{function}-{region}-{topic}` naming-convention pattern directly — its push endpoint is a
literal App Engine URL (`.../pubsub_trigger=true`) for a scheduled Cloud Function, matching the
name-decoded prediction exactly.

**What this changes about the decide-stage recommendation above:** finding 1's Category 1
(pubsub bindings) was treated as a real, structural, GCP-console-only boundary requiring manual
confirmation per-binding. **That's no longer accurate now that live query access is confirmed
working**: `gcloud pubsub subscriptions list --project=staging-oskey-io --format=json` is a
real, repeatable, zero-cost, read-only command any future build session (or a periodic pipeline
step) can run to get authoritative topic→subscription→push-endpoint data directly — the
`CONFIRMED_PUBSUB_BINDINGS` manual-curation pattern in `build-cross-repo-edges.ts` was working
around not having this, not around a genuine impossibility. This turns Category 1 into a fourth
real, concrete, buildable join type (topic → live push-endpoint → path/host match against the
receiving repo's own route/handler facts), same shape of work as the other three, not a
permanent manual-only category.

## Explicitly not done here

- No `cross_repo_edges` rows built or written; no code changes to `build-cross-repo-edges.ts`.
- Not resolved: what fraction of the 127 complex-`calleeExpression` iOS call sites would
  actually resolve after leading-identifier extraction — flagged as a real open question for
  the build session, not blocking the scope decision above.
- Not investigated: the retrieval-gap question raised in finding 2 (why `search_facts` never
  surfaced the one resolved `external_hook` pubsub fact) beyond confirming that it didn't — a
  separate, smaller retrieval-quality question, not a graph-completeness one.
- Not checked: whether android-intercom's 5 REST call sites are the only real ones, or whether
  a fuller audit of `app`'s network layer would find more (only `OSKApiService.kt`'s 5 facts
  were checked, since that's all that exists under `rest_endpoint_call` today).
- No join built or `cross_repo_edges` rows written for the live-GCP pubsub finding either; no
  change to `build-cross-repo-edges.ts` or `CONFIRMED_PUBSUB_BINDINGS`.
- Not resolved: why the 4 non-matching node-iot push targets (finding 5) lack a
  `route_definition` fact — worth checking directly (read node-iot's own route files) before
  assuming it's an extraction gap rather than an unimplemented route.
- Not checked: production (`oskey-io`) or dev (`dev-oskey-io`) projects' pubsub config —
  staging only, matching the scope of the user's own two reference files.
- Not set up: any live/scheduled re-fetch of the GCP pubsub data, or a devops-provided export —
  named as a deliberate later step, not part of this pass.
