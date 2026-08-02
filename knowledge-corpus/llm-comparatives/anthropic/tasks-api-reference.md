# API Reference: tasks

## 0. Generation Metadata

- **runId:** `20260801_173721-1aa319b1`
- **generatedAt:** `2026-08-01T17:37:25.919Z`
- **repoName:** `firebase-oskey-dev`
- **targetModule:** `tasks`
- **llmConfigKey:** `claude-default`
- **llmProvider:** `anthropic`
- **llmModel:** `claude-sonnet-5`

---

## 1. API Contracts

This module contains **one** `api_contract` fact and **zero** `firestore_trigger` facts in the evidence graph (`summary.apiContracts: 1`, `summary.firestoreTriggers: 0`). No trigger-bound entries are listed below because none exist in evidence.

### 1.1 `handleTask`

| Field | Value |
|---|---|
| **Name** | `handleTask` |
| **Type** | HTTP (Cloud Function, `https.onRequest`) — **Confirmed** (`api_contract` fact, `contractType: "http"`) |
| **Trigger binding** | Registered via `https.onRequest(OSKTaskHandlerService.handleTask)` in `functions/src/modules/tasks/index.ts:11`, inside the exported `getHttpsFunctionTriggers` function, which returns `{ taskHandler: any }` — implying the exposed Cloud Function name is `taskHandler`. — **Confirmed** (`function_declaration` fact, returnType `{ taskHandler: any; }`) |
| **Handler** | `OSKTaskHandlerService.handleTask` (`functions/src/modules/tasks/services/task_handler.service.ts:16-73`), resolution status: `resolved` |
| **calleeExpression resolution** | The `https.onRequest` call itself is `resolutionStatus: "unresolved"` (SDK call, not a project symbol); the handler resolution (`handlerResolutionStatus`) is `resolved`. |
| **requestType** | `Request` (bare type name from the `api_contract` fact). **No `model_property` facts exist with `parentName: "Request"`** — this is the generic `firebase-functions/v1` `Request` type (imported at `task_handler.service.ts:2`), not a project-defined model, so no field-level schema can be rendered for it. |
| **responseType** | `void`. The handler does not return a typed body; it writes directly to the Express-style `Response` object using `res.status(...).send(<string>)` (see status codes below). |
| **pubsubPushReceiver** | `false` — this is a plain HTTP endpoint, not a Pub/Sub push-subscription receiver. |
| **Description** | HTTP-triggered task-processing endpoint invoked by Google Cloud Tasks (per the module's role as a Cloud Tasks payload handler — see `task_scheduler.service.ts`, which schedules tasks via `CloudTasksClient`). It reads `req.headers` and the request body (`payload`), and routes on `payload.taskType` to one of: `refreshPincodeTask` → `OSKPincodeRefreshWorkerService.executePincodeRefresh(payload.data)`; `activateIntercomCommunicationTask` → `OSKIntercomCommunicationService.executeScheduledActivation(payload.data)`; `deactivateIntercomCommunicationTask` → `OSKIntercomCommunicationService.executeScheduledDeactivation(payload.data)`. An unrecognized `taskType` logs a warning (`logWarning`) but does not error. — **Confirmed** (`call_expression` facts, lines 38-56 of `task_handler.service.ts`). |

**Observed HTTP status responses (from `call_expression` evidence, all `resolutionStatus: "unresolved"` since `res` is not a project-resolved symbol):**

| Status | Line | Condition (per surrounding evidence) |
|---|---|---|
| `403` | `task_handler.service.ts:26` | Unauthorized caller (logged via `logError` at line 25: `'[TaskHandler] Unauthorized attempt to call task handler.'`) — body: `'Forbidden'` |
| `200` | `task_handler.service.ts:62` | Successful processing — body: `'Task processed successfully.'` |
| `500` | `task_handler.service.ts:71` | Error during task processing (logged via `logError` at line 69 with `errorDetails`) — body: `'Task processing failed.'` |

**Request/Response schema:**

```
// requestType: "Request"
// No model_property facts found with parentName "Request".
// This bare type name cannot be expanded into a field-level schema from evidence.
```

```
// responseType: "void"
// No response body schema — handler terminates the HTTP response directly
// via res.status(<code>).send(<string>); no structured JSON response is evidenced.
```

---

### 1.2 Related Data Types (not formally cross-referenced to `handleTask`'s request/response contract)

The evidence graph contains `model_property` facts for two payload shapes that are consumed as `payload.data` inside `handleTask`'s task-type branches, and a `type_alias` fact for the overall scheduled-task envelope. **None of these are linked by a `model_property.parentName` match to the `api_contract` fact's `requestType` ("Request")** — the contract's declared request type is the generic Express `Request`, and the task payload is only accessed dynamically (`payload.data`, `payload.taskType`) inside the handler body. These are presented here for completeness as evidenced payload shapes, not as the formal contract schema.

#### `OSKTScheduledTaskPayload` (type_alias, `functions/src/modules/tasks/models/tasks.model.ts:18`)
- **Confirmed** as an exported type alias (`isExported: true`).
- No `model_property` facts exist with `parentName: "OSKTScheduledTaskPayload"` — its member shape is not evidenced (it is likely a discriminated union over `taskType`, per the branching logic in `handleTask`, but this is **Inferred**, not directly evidenced).

#### `OSKPincodeRefreshTaskPayload` (`functions/src/modules/tasks/models/pincode_refresh_task.model.ts`)
Consumed by the `refreshPincodeTask` branch (passed to `OSKPincodeRefreshWorkerService.executePincodeRefresh`).

```json
{
  "buildingId": "string",
  "unitId": "string",
  "userId": "string",
  "accessId": "string",
  "oldPincode": "string",
  "isAppUser": "boolean"
}
```

#### `OSKIntercomCommunicationTaskPayload` (`functions/src/modules/tasks/models/tasks.model.ts`)
Consumed by the `activateIntercomCommunicationTask` / `deactivateIntercomCommunicationTask` branches (passed to `OSKIntercomCommunicationService.executeScheduledActivation` / `executeScheduledDeactivation`).

```json
{
  "organizationId": "string",
  "buildingId": "string",
  "communicationId": "string",
  "communicationType": "\"intercom\" | \"push\" | undefined (optional)"
}
```

---

## 2. Firestore Triggers

No `firestore_trigger` facts are present in the evidence graph for this module (`summary.firestoreTriggers: 0`). This module's evidenced entry point is the single HTTP contract listed above; it is not shown to be bound to any Firestore document event.