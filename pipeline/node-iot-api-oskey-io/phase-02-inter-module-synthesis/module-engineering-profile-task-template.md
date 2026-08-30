# Module Engineering Profile — Task Template (node-iot)

*Adapted from the Firebase pipeline's version — same purpose: what you'd paste as the message in a manual chat test, filled in per module. The automated pipeline assembles its own equivalent programmatically; this file exists as a supporting-contract document and as a manual-testing convenience.*

---

## Task

Generate the Module Engineering Profile and API Reference for the module specified below, following the system instructions exactly.

## Generation Metadata

*(copy these values before pasting — do not make the model extract them from inside the evidence JSON blob. runId/generatedAt come from the root of the evidence graph JSON below; llmConfigKey/llmProvider/llmModel describe whichever LLM you're running this chat with — fill in the actual values for your session, the ones below are the real values from this repo's most recent verified Phase 1 run, not yet a real Phase 2 run.)*

- runId: `20260828_165412-a6cba122`
- generatedAt: `2026-08-28T16:54:12.000Z`
- repoName: `node-iot-api-oskey-io`
- targetModule: `access_control_device`
- llmConfigKey: *(fill in for your session — no Phase 2 run has happened yet)*
- llmProvider: *(fill in for your session)*
- llmModel: *(fill in for your session)*

## Current Modules in This Repository

*(paste the live list from this run's `modules.json` — this is the only set of module names you may reference for cross-module dependency resolution; do not assume any other module exists. This repo has exactly one, always — see Section 10 of the system instructions.)*

```
access_control_device
```

## Target Module Evidence Graph

*(paste the full contents of `access_control_device-evidence-graph.json` here)*

```json
<paste evidence graph JSON here>
```

---

## Format note (illustrative only — not real data)

The worked example below is a **fictional capability**, deliberately invented to demonstrate the expected format only. Do not treat any fact in it as real, and do not let it influence the content of your actual output — it exists purely to show shape, not substance.

> **Example (fictional "beacons" capability) — Section 3 format:**
> - **Capability:** Beacon telemetry retrieval per device — **Confirmed**. Evidenced by `route_definition` fact `route_definition|access_control_device|src/v1/routes/access_control_device_beacons.route.ts|/access-control-devices/:accessControlDeviceId/beacons|GET|2023-01-01|#1`, resolving to `OSKAccessControlDeviceBeaconController.get` (`mongo_operation` fact, `collectionName: "accessControlDeviceBeacons"`, `collectionResolutionStatus: "resolved_from_collections_map"`).
> - **Capability:** Beacon low-battery alerting via Pub/Sub — **Inferred**. `pubsub_operation_route` fact shows an `operationValue: "lowBattery"` dispatch inside `processBeaconPubSubMessage`, but no `mongo_operation` or outbound `pubsub_publish_call` fact shows what happens after the alert is received — the evidence confirms the routing exists, not what downstream effect it produces.
