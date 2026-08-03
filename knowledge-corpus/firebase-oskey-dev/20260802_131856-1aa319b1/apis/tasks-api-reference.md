# API Reference — tasks

## 0. Generation Metadata

- runId: `20260802_131856-1aa319b1`
- generatedAt: `2026-08-02T13:19:00.967Z`
- repoName: `firebase-oskey-dev`
- targetModule: `tasks`
- llmConfigKey: `claude-default`
- llmProvider: `anthropic`
- llmModel: `claude-sonnet-5`

## 1. API Contracts

This is a lookup reference of every `api_contract` and `firestore_trigger` fact evidenced for the `tasks` module. No `firestore_trigger` facts exist in this module's evidence graph (`firestoreTriggers: 0` in summary).

---

### `handleTask`

- **Type:** HTTP (`https.onRequest`)
- **Path / Binding:** Registered via `getHttpsFunctionTriggers()` in `functions/src/modules/tasks/index.ts:11` — `https.onRequest(OSKTaskHandlerService.handleTask)`. No explicit URL path string is present in evidence; the trigger binding is the exported Cloud Function itself.
- **Handler:** `OSKTaskHandlerService.handleTask` (`functions/src/modules/tasks/services/task_handler.service.ts:16-73`), resolution status `resolved`.
- **Request Schema:** Type expression is bare `Request` (from `firebase-functions/v1`). **No `model_property` facts matched this type name in this module's evidence** — the Resolved API Request/Response Schemas section explicitly states no requestType/responseType resolved to any model_property facts in this scope. Presenting the raw type expression rather than a field list:

```
requestType: Request
```

- **Response Schema:** Type expression is `void`. No `model_property` facts apply (not an object schema). 

```
responseType: void
```

- **`pubsubPushReceiver`:** `false` — this is a plain HTTP-triggered handler, not a Pub/Sub push receiver, per the fact's own field.
- **Description (evidence-grounded):** Dispatches on `payload.taskType` from the request body to one of two internal task handlers — `refreshPincodeTask` (calls `OSKPincodeRefreshWorkerService.executePincodeRefresh` in the `admin` module, line 41) or `activateIntercomCommunicationTask` / `deactivateIntercomCommunicationTask` (calls `OSKIntercomCommunicationService.executeScheduledActivation`/`executeScheduledDeactivation` in the `organization` module, lines 45/49). Returns `403` on an unauthorized-caller check (line 25-26, exact authorization mechanism not shown in evidence), `200` on success (line 62), `500` on error (line 71).

---

## No Firestore Triggers Evidenced

`firestoreTriggers: 0` in the evidence graph summary, and no `firestore_trigger`-typed facts appear in the facts array. This module's evidence contains no scheduled/document trigger bindings — only the one HTTP contract above and two internal `service_method` facts (`OSKTaskSchedulerService.scheduleTask`, `OSKTaskSchedulerService.cancelTask`) which are not themselves `api_contract` or `firestore_trigger` facts and are therefore out of scope for this lookup table (they are invoked directly by other modules' code, per the Cross-Module Dependency Graph and Resolved Cross-Module Call Edges — not exposed as independent API contracts in this evidence).