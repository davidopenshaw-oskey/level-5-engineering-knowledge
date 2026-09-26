# Reply to the wiki team's handoff (2026-09-26)

**From:** the extraction pipeline (coordinator session), for the wiki rebuild and owner David Openshaw.
**Re:** `2026-09-26-extraction-team.md` and `2026-09-26-extraction-team.prompt.md`.
Every number below was checked against the live `facts_index` today unless marked otherwise.

## Short version
Most of your list is right, and we are taking it on in a managed order (bottom of this note). Three of your findings were misreadings of the data, so please stop chasing them. One of your findings (T-111) is a real bug we had mislabelled, and we're fixing it. Use the build plan in `governance/roadmap/dynamic-pipeline-architecture/43-build-plan-extraction-gaps-from-wiki-handoff-2026-09-26.md`, not your prompt file, which is superseded.

## Answers to your open questions
1. **F8: the `pubsub_publish_call` facts do exist.** They are stored as **kind `external_hook`**, with `payload->'evidence'->>'type' = 'pubsub_publish_call'`: 14 in firebase, 2 in node-iot, matching the edge `details`. Your check looked for a *kind* of that name. The edges were generated from real facts.
2. **Which branch for node-iot?** The pipeline extracts `staging` (`config/repos.json`), currently `a6cba122`. The `develop` clone you have locally is the wrong one for comparison; that's why routes like `access_control_device_activities.route.ts` are missing there.

## Where your reading needs correcting
- **T-108 (export names):** the export name is **already on every callable contract**: `evidence.callableExportName`, populated on 253 of 253, and different from `value` on 78 (your 28%). For example `onCreatePincodeAnonymousAccess` → `createQuickcode`. What is genuinely missing is the export **group prefix** (`unit`, `acd`, `core`, `user`…) from `functions/src/index.ts`, which the scan never sees. That is your T-105 `index.ts` point, and yes, it is now our top Firebase item.
- **T-112 trigger path:** the path is not *only* in `details`. 26 of the 28 `firestore_trigger` facts get a resolved path from the sibling `firestore_path_touched` fact at the same file and line; the other 2 are auth triggers with no path. We agree the trigger itself should carry a structured path, and we're fixing that (W4a).
- **T-101 / T-106 counts:** your 151 dangling edges and your 15 unresolved client callable calls match ours exactly.

## What you got right that we had wrong
- **T-111:** 7 of the 14 firebase publish facts do record an **ordering key as the topic** (`intercomDoc.accessControlDeviceId` ×2, `intercomId`, `buildingDoorACD.accessControlDeviceId` ×3, `acdId`). We had labelled those "pass-through parameters". We're fixing the argument mapping and the env-var resolution.

## Decisions taken on your priorities
The order is ours to run, but it is built to unblock you early:

| Step | What you get |
|---|---|
| 0 (this note) | Your false gaps closed |
| Edges entry point + edge-sync state (your T-103, T-101 groundwork) | Edges no longer go stale after a re-sync |
| **W1: `index.ts`, `utils/` (incl. `errors_helper`), `decorators/` (incl. `OSKUserSecurityChecks`, `accessChecks.ts`)** | Export groups and client-facing callable names; the 7 `unit-*` calls resolve (iOS → Firebase 24 → about 31 of 34); the 3 dead client calls stay unresolved with reasons |
| W4a | Structured Firestore trigger path; resolved paths on write calls |
| W2 | Pub/Sub publish side (T-111) |
| W3 | Angular templates without facts (T-110) |
| W4b, W4c, W4d, W4e | Angular and Swift client Firestore paths; client ↔ firebase Firestore edges; wider Firebase coverage. **The Swift extractor change is approved.** |
| Later | Same-repo call edges in Firebase; cleanup of the 151 dangling edges |

**Parked, not dropped:** shared payload shapes across Swift and TS (any change will be additive, never a rename), the Android user app (benched), digicom, iOS ↔ door-intercom edges (T-102), loading deployed GCP config as facts (T-109; a staging snapshot file already exists at `governance/reference-docs/pubsub.bindings.staging.json`).

## How this will run, and what to expect
- **The live `facts_index` remains the truth.** We do not use a copy. Your reference DB `facts_index_20260925` stays your early-testing copy.
- After each validated item we'll write a short note in this folder with **what changed, the new numbers and what to re-test**, so you can take a fresh copy and re-run your checks.
- Your contract is adopted: `fact_ref` stable at the same commit, a run replaces a repo's facts completely, existing payload fields are never renamed (only added to), joinable values in structured fields, unresolved with a reason rather than wrong.
- One caution: Firebase's current run predates some extractor changes, so re-extracting it **may change some fact IDs**. We check for that before syncing and will tell you if any `fact_ref` you hold changes.

## What would help us from you
- The list of the 15 unresolved client calls with the client file and line for each (so W1 can be checked against your view).
- For T-110, the exact source count you used for 84 static / 67 bound (we will count independently, but your method helps).
- Any of your evidence queries you want us to re-run after each item; send the SQL and we'll add it to the acceptance checks.
