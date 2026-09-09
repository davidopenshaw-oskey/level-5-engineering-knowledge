# How the Pipeline's Layers Compose Into Cross-Repo Business Flows

**Purpose of this file:** a standing orientation doc, not tied to any one repo's onboarding — point any new session here first if its task touches how facts flow from raw AST extraction up to a business-flow-spanning PRD or impact analysis. Written 2026-09-08 by directly reading the real pipeline code (not from memory), while investigating the Kotlin repo's own call-graph-resolution question surfaced that this layering is easy to get wrong without seeing it end to end. If a later session finds this doc drifted from the real code, fix the code's behavior first, then correct this doc — this is a map, not the territory.

## The real shape: five layers, each building on the last

### Layer 1 — Per-repo AST extraction and within-repo resolved graph (`pipeline/<repo>/phase-01-ast-extraction/`)

Every onboarded repo (`firebase-oskey-dev`, `angular-app-oskey-io`, `node-iot-api-oskey-io`, and now `android-intercom-oskey-io`) gets its own copy of the same real script shape:

`00-scan-repo` (clone + module/file inventory) → `01-extract-ast-evidence` (raw AST facts) → `02-build-module-evidence` (per-module aggregation) → `03-build-benchmark` → `04-build-resolved-graph` (**the real within-repo resolved graph**: compiler-exact call edges, RBAC requirement matrix, API entry points, shared Firestore touch points, pubsub event routing) → `05-partition-capability-packs` → `06-build-cross-module-dependency-graph` (module-to-module coupling, still entirely inside this one repo) → `07-build-intra-module-coupling-graph` (submodule-to-submodule, inside one module).

**The critical thing this layer produces, beyond its own internal graph**: a repo's real, exposed *external interface* — the facts that describe what this repo looks like from *outside itself*. Concretely, from `04`'s own real output shape: `apiEntryPoints` (its callable/HTTP contracts), `firestoreSharedTouches` (Firestore paths it reads/writes), `eventEndpoints`/`pubsubEventRoutingTable` (topics/triggers it publishes or receives). These aren't a separate concept bolted on — they're the same resolved-graph output, just the subset of it that matters to anyone *outside* this repo.

### Layer 2 — Per-repo inter-module synthesis (`pipeline/<repo>/phase-02-inter-module-synthesis/`)

LLM-driven synthesis over Layer 1's facts: per-module or per-capability profiles, then a repo-level report (`02-generate-repo-report.ts`). Still entirely repo-local — no cross-repo awareness exists at this layer. Confirmed by direct grep (2026-09-08): none of these scripts touch `ts-morph`/AST APIs directly; they consume Layer 1's JSON as-is. Quality here is bounded by how complete and well-described Layer 1's facts are — garbage or thin fact descriptions in, garbage or thin synthesis out.

### Layer 3 — Cross-repo ecosystem topology (`pipeline/cross-repo-synthesis/phase-03-ecosystem-topology/`)

**This is the layer that actually connects repos to each other**, and it works by *joining each repo's own already-produced Layer-1 "exposed interface" facts by name* — it does not re-parse source or re-run any AST tool. Real, verified example from `06-build-cross-repo-graph.ts`: Angular's own extracted `ast-firebase-callable-calls.json` (functions it calls) is joined against Firebase's own extracted `ast-api-contracts.json` (functions it exposes), matched by function name, producing a `crossRepoEdges` entry tagged `connectionType: 'HTTP_API_CALL'` and `resolutionStatus: 'resolved' | 'unresolved'`.

**Real, honest limitation worth carrying forward**: not every cross-repo connection is AST-derivable at all. The same file's `PUBSUB_TOPIC_BINDING` handling is a real, named exception — the actual topic→subscription→handler binding between `node-iot-api-oskey-io` and `firebase-oskey-dev` lives entirely in GCP Pub/Sub subscription config, external to both repos' source. Neither side's AST facts can resolve it. The real fix, on record in that script's own comments: a small, explicitly-sourced, manually-maintained table (`EXTERNAL_PUBSUB_BINDINGS`), with each entry required to cite independent confirmation (subscription naming convention + a code comment + a matching message shape) before being added — never a naming-convention guess. This is a genuine capability boundary of AST-only extraction, not a gap expected to close with cleverer parsing later. The project's own `cross-repo-synthesis/README.md` also names a Level 4 ("end-to-end trace maps") alongside this layer's Level 3 topology — not independently re-verified in this pass, worth reading directly if a task depends on its specifics.

### Layer 5 — Global impact analysis & atomic PRD delivery (`pipeline/cross-repo-synthesis/phase-05-atomic-prd-impact/`)

Queries the accumulated graph — Layer 1's within-repo resolved graphs plus Layer 3's cross-repo edges — to answer real business questions and produce atomic PRDs / impact analyses. This is the layer the whole project ultimately exists to feed. (No independently-verified "Layer 4" folder was found in this pass beyond the "end-to-end trace maps" mentioned inside `phase-03`'s own README — the numbering in this project's naming convention (`level-5-engineering-knowledge`) may not map to five equally-sized folders; don't assume a `phase-04-*` directory exists without checking.)

## Why this layering is the real reason a cross-repo-boundary PRD is possible at all

A business flow like a resident departure, or a future door-access event, is never contained inside one repo's graph. It's only answerable by walking: **a repo's own module-level facts → that repo's internal cross-module graph → that repo's exposed-interface facts (still Layer 1, just the outward-facing subset) → a Layer-3 cross-repo edge joining it to the next repo's own exposed-interface facts → that next repo's own internal graph, and so on.** Skip the "expose interface facts in a name-addressable way" step for any one repo, and Layer 3 has nothing to join against for that repo — its part of the flow becomes structurally invisible to any cross-repo PRD, no matter how good that repo's own internal graph is.

## What this means for onboarding a new repo (Kotlin now, Swift later)

Getting Layer 1 extraction "right" for a new repo isn't just about internal fidelity (enum members, call graphs, RBAC) — it also means producing the *outward-facing* facts in a form Layer 3 can actually join against by name, the same way `ast-api-contracts.json`/`ast-firebase-callable-calls.json` do for Firebase/Angular. For `android-intercom-oskey-io` specifically, this reframes the "wire format" facts already flagged as a real candidate in `android-intercom-oskey-io/01-standing-principles-and-lessons-from-ts-facts-pipeline-2026-09-07.md` (BLE GATT UUIDs, USB vendor/product/command constants, WebRTC signaling message types) as more than just nice-to-have domain facts — they're the literal mechanism that would let a future Layer 3 join this repo's BLE/USB commands against, say, `node-iot-api-oskey-io`'s own firmware-side handling of the same protocol, or `firebase-oskey-dev`'s device-activity ingestion. Worth designing with that join in mind from the start, not discovering the need for it after the fact the way several Layer-1 TS fixes were found.

## Real source files, for going deeper

- Layer 1 shape: `pipeline/angular-app-oskey-io/phase-01-ast-extraction/00-scan-repo.ts` through `07-build-intra-module-coupling-graph.ts` (byte-identical shape across the 3 existing TS repos' own copies, per each repo's own pipeline folder).
- Layer 2: `pipeline/angular-app-oskey-io/phase-02-inter-module-synthesis/02-generate-repo-report.ts` and its `_shared/` helpers.
- Layer 3: `pipeline/cross-repo-synthesis/phase-03-ecosystem-topology/06-build-cross-repo-graph.ts`, `pipeline/facts-postgres-index/build-cross-repo-edges.ts`, `pipeline/facts-postgres-index/build-intra-repo-edges.ts`.
- Layer 5: `pipeline/cross-repo-synthesis/phase-05-atomic-prd-impact/prompt-template.md` and `contract.md`.

## Epistemic note

Everything above was verified directly against the real code on 2026-09-08 (file reads, not memory or summary docs), except where explicitly marked as not independently re-checked (the Level 4 "end-to-end trace maps" claim, and the exact meaning of the project's "Level 1-5" numbering beyond what's stated in `cross-repo-synthesis/README.md`). Treat those two as real leads to verify, not confirmed facts, if a task depends on their specifics.
