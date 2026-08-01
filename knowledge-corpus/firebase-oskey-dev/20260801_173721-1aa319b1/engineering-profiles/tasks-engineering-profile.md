# Module Engineering Profile: `tasks`

## 0. Generation Metadata

- runId: `20260801_173721-1aa319b1`
- generatedAt: `2026-08-01T17:37:25.919Z`
- repoName: `firebase-oskey-dev`
- targetModule: `tasks`
- llmConfigKey: `claude-default`
- llmProvider: `anthropic`
- llmModel: `claude-sonnet-5`

---

## 1. Executive Summary

**Confirmed.** The `tasks` module is a small, self-contained infrastructure module providing generic deferred/scheduled work execution built on Google Cloud Tasks. It exposes two capabilities: (1) scheduling and cancelling Cloud Tasks (`OSKTaskSchedulerService.scheduleTask` / `cancelTask`), and (2) a single HTTP endpoint (`OSKTaskHandlerService.handleTask`) that receives fired tasks and routes them, by `taskType`, to business logic owned by other modules. The module contains no business logic of its own — it is a pure scheduling/dispatch layer consumed by the `admin` module (pincode refresh maintenance) and the `organization` module (intercom communication activation/deactivation scheduling).

---

## 2. Architectural Position

**Confirmed / Inferred.** `tasks` sits in the "Middleware & Backend Logic" tier described in the architecture documentation (GCP Cloud Functions layer), but unlike the Pub/Sub-based hardware synchronization backbone documented elsewhere, this module specifically wraps **Google Cloud Tasks** (`@google-cloud/tasks`) for time-based/deferred execution rather than event-driven fan-out. It owns no domain concepts, no Firestore collections, and no RBAC-governed resources (**Confirmed** by absence of `firestore_hints`, `firestore_triggers`, and `permission_hints` in the evidence graph — `summary.firestoreHints: 0`, `summary.firestoreTriggers: 0`, `summary.permissionHints: 0`). Its sole "owned concept" is the scheduled-task payload envelope (`OSKTScheduledTaskPayload`) and the two payload shapes it currently understands (`OSKPincodeRefreshTaskPayload`, `OSKIntercomCommunicationTaskPayload`). It is consumed by, and delegates execution to, the `admin` and `organization` modules (**Confirmed**, see Section 10).

---

## 3. Primary Responsibilities

- **Scheduling deferred Cloud Tasks** — **Confirmed**. `OSKTaskSchedulerService.scheduleTask` (task_scheduler.service.ts, lines 31–65) builds a queue path (`tasksClient.queuePath`), base64-encodes the JSON payload (`Buffer.from(JSON.stringify(payload)).toString('base64')`), computes a schedule timestamp (`Math.floor(scheduleDate.getTime() / 1000)`), and calls `tasksClient.createTask`.
- **Cancelling scheduled Cloud Tasks** — **Confirmed**. `OSKTaskSchedulerService.cancelTask` (lines 71–78) calls `tasksClient.deleteTask({ name: taskId })`, with a warning-level log (not error) on failure, reflecting tolerance for tasks that "may have already executed or been deleted."
- **Receiving and routing fired tasks via HTTP** — **Confirmed**. `OSKTaskHandlerService.handleTask` (task_handler.service.ts, lines 16–73) is registered as an `https.onRequest` handler and performs a `switch`-like dispatch on `payload.taskType`:
  - `refreshPincodeTask` → delegates to `OSKPincodeRefreshWorkerService.executePincodeRefresh` (owned by `admin`).
  - `activateIntercomCommunicationTask` → delegates to `OSKIntercomCommunicationService.executeScheduledActivation` (owned by `organization`).
  - `deactivateIntercomCommunicationTask` → delegates to `OSKIntercomCommunicationService.executeScheduledDeactivation` (owned by `organization`).
  - Unrecognized `taskType` → logs a warning only (`logWarning`), no further action taken.
- **Modeling scheduled-task payload shapes** — **Confirmed**. `OSKTScheduledTaskPayload` (type alias, tasks.model.ts) is the general envelope type; `OSKPincodeRefreshTaskPayload` (buildingId, unitId, userId, accessId, oldPincode, isAppUser) and `OSKIntercomCommunicationTaskPayload` (organizationId, buildingId, communicationId, optional communicationType) are the two concrete payload shapes currently modeled.
- **Rudimentary request gating on `handleTask`** — **Inferred**. The handler logs `'[TaskHandler] Unauthorized attempt to call task handler.'` and responds `403 Forbidden` under some (unspecified) condition before reaching the task-type dispatch logic. No `call_expression` fact identifies the specific check being performed (e.g., header/OIDC validation), so the precise gating mechanism is not confirmed by evidence — only its existence and its failure-path behavior are.

---

## 4. Public Interfaces

- **`getHttpsFunctionTriggers()`** — exported function (index.ts, line 7), `isExported: true`, returns `{ taskHandler: any }`. This is the module's Cloud Functions trigger registration entry point, wrapping `https.onRequest(OSKTaskHandlerService.handleTask)`.
- **`OSKTaskHandlerService.handleTask`** — static, async, public service method; the sole HTTP entry point of the module (`api_contract` type `http`).
- **`OSKTaskSchedulerService.scheduleTask`** — static, async, public service method (returns `Promise<string | null | undefined>`, presumably the created Cloud Task's name/resource path).
- **`OSKTaskSchedulerService.cancelTask`** — static, async, public service method (returns `Promise<void>`).
- **Module barrel exports** — index.ts re-exports `./services/task_scheduler.service` and `./services/task_handler.service` (both `exported_symbol` facts show `namedExports: []`). **Inferred**: this pattern (empty named-exports list on a module-specifier-only export) is consistent with a wildcard re-export (`export *`), but the evidence does not enumerate which specific symbols are thereby made public — flagged as an open question in Section 13.

---

## 5. Internal Structure

- **`functions/src/modules/tasks/index.ts`** — module entry point; defines and exports `getHttpsFunctionTriggers`; re-exports the two service files.
- **`functions/src/modules/tasks/services/task_handler.service.ts`** — defines `OSKTaskHandlerService` (exported class), containing `handleTask`. Imports `OSKLoggingService` (core), `OSKPincodeRefreshWorkerService` (admin), `OSKIntercomCommunicationService` (organization), and the local `OSKTScheduledTaskPayload` model.
- **`functions/src/modules/tasks/services/task_scheduler.service.ts`** — defines `OSKTaskSchedulerService` (exported class), containing `scheduleTask` and `cancelTask`. Uses `CloudTasksClient` from `@google-cloud/tasks` and `OSKLoggingService` (core).
- **`functions/src/modules/tasks/models/tasks.model.ts`** — defines `OSKTScheduledTaskPayload` (type alias) and `OSKIntercomCommunicationTaskPayload` (model). Imports `OSKPincodeRefreshTaskPayload` from the sibling model file.
- **`functions/src/modules/tasks/models/pincode_refresh_task.model.ts`** — defines `OSKPincodeRefreshTaskPayload` (model).

**Intra-module coupling check (per `@oskey/<module>/<submodule>` guidance):** No imports in this module's evidence use the `@oskey/tasks/...` alias pattern, and no submodules of `tasks` itself are referenced this way — **Confirmed** absence, nothing to reclassify here. The one `@oskey/*` import present (`@oskey/core/logger`) points at a genuinely different top-level module (`core`), not a `tasks` submodule, and is treated as a true cross-module dependency in Section 10.

---

## 6. Firestore & Data Ownership

**Confirmed (by absence).** The evidence graph contains zero `firestore_hints`, zero `firestore_triggers`, and no Firestore path-touch facts anywhere in this module's 70 facts. `tasks` does not appear to read or write Firestore directly. Because no fact carries an `operationDetectionScope` limitation label explaining this absence, the most defensible reading is that this module genuinely has no direct Firestore interaction — it is a pure scheduling/dispatch layer, and any Firestore effects of the tasks it dispatches occur entirely inside the delegated services (`OSKPincodeRefreshWorkerService` in `admin`, `OSKIntercomCommunicationService` in `organization`), which are out of scope for this module's evidence. This should not be read as certainty that the underlying business operations have no Firestore effect — only that `tasks` itself does not perform them.

- Primary persistence: **None** (Confirmed by absence of evidence).
- Confirmed collection paths: **None**.
- Confirmed nested structures: **None**.
- Candidate denormalized structures / fan-out targets: **None evidenced** — any fan-out occurs downstream in the delegated modules, not observable from this evidence graph.

---

## 7. API Endpoints

### `handleTask` (HTTP)

- **Fact:** `api_contract` — `functions/src/modules/tasks/index.ts:11`, `contractType: "http"`, registered via `https.onRequest(OSKTaskHandlerService.handleTask)`.
- **Handler:** `OSKTaskHandlerService.handleTask` (task_handler.service.ts, lines 16–73), `handlerResolutionStatus: "resolved"`.
- **requestType:** `Request` (from `firebase-functions/v1`) — **no `model_property` facts exist with `parentName: "Request"`**, so no expanded request schema can be presented for the raw HTTP envelope; this is the generic Express-style Request object, not an app-defined model.
- **responseType:** `void`.
- **pubsubPushReceiver:** `false` — this endpoint is explicitly *not* marked as a Pub/Sub push receiver in the evidence, despite structurally resembling one (an HTTP endpoint invoked by a GCP async delivery mechanism). It is the HTTP target of Google Cloud Tasks, a distinct mechanism from Pub/Sub push subscriptions (see Section 11).

**Inferred internal payload schema** (derived from the `handleTask` body's `switch`-like handling of `payload.taskType` and `payload.data`, cross-referenced against `model_property` facts for the two concrete payload shapes it dispatches on — the wrapping discriminated-union type `OSKTScheduledTaskPayload` itself has no matching `model_property` facts, so its exact shape/discriminant field is not directly evidenced):

```json
// When payload.taskType === "refreshPincodeTask", payload.data is inferred to conform to OSKPincodeRefreshTaskPayload:
{
  "buildingId": "string",
  "unitId": "string",
  "userId": "string",
  "accessId": "string",
  "oldPincode": "string",
  "isAppUser": "boolean"
}

// When payload.taskType === "activateIntercomCommunicationTask" | "deactivateIntercomCommunicationTask",
// payload.data is inferred to conform to OSKIntercomCommunicationTaskPayload:
{
  "organizationId": "string",
  "buildingId": "string",
  "communicationId": "string",
  "communicationType": "\"intercom\" | \"push\" | undefined (optional)"
}
```

No response body schema is evidenced beyond bare HTTP status/text (`res.status(200).send('Task processed successfully.')`, `res.status(403).send('Forbidden')`, `res.status(500).send('Task processing failed.')`).

---

## 8. Firestore Triggers

**Confirmed.** None exist in this module. `summary.firestoreTriggers: 0` and no `firestore_trigger`-typed facts appear anywhere in the evidence graph.

---

## 9. Permissions & Security

**Confirmed / Inferred.** No `permission_hints` facts exist for this module (`summary.permissionHints: 0`), and no `v1.*`-style permission strings appear in any call expression, service method, or API contract fact. The only security-relevant behavior evidenced is the conditional 403 response path in `handleTask` (lines 25–26: `logger.logError('[TaskHandler] Unauthorized attempt to call task handler.')` followed by `res.status(403).send('Forbidden')`), which is **Inferred** to represent some request-authentication gate (plausibly an OIDC token check typical of Cloud Tasks HTTP targets), but **the specific check itself is not captured by any call_expression fact** — only its logging and failure-response side effects are evidenced.

**RBAC cross-check (per mandatory instruction):** The `rbac-roles.json` document defines no permissions under any `tasks`-scoped namespace, and this module references no `v1.*` permission strings at all. There is therefore **no mismatch to report** in the conventional sense (no code-referenced permission is absent from the RBAC schema, and vice versa) — rather, this module simply operates entirely outside the RBAC permission model evidenced elsewhere in the platform. This absence itself is flagged as an open question in Section 13, since it means `handleTask`'s authorization boundary (whatever it is) is not expressible in, or auditable via, the standard RBAC permission catalogue.

---

## 10. Cross-Module Relationships

- **`core`** — **Confirmed**. Both `OSKTaskHandlerService` and `OSKTaskSchedulerService` import `OSKLoggingService` from `@oskey/core/logger` and use it extensively for structured logging (`logInfo`, `logError`, `logWarning`).
- **`admin`** — **Confirmed**. `task_handler.service.ts` imports `OSKPincodeRefreshWorkerService` from `../../admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service` and calls `OSKPincodeRefreshWorkerService.executePincodeRefresh(payload.data)` when handling `refreshPincodeTask`. Note the import reaches deep into an `admin` submodule path (`admin_maintenance/db_pincodes`) rather than a top-level `admin` public interface.
- **`organization`** — **Confirmed**. `task_handler.service.ts` imports `OSKIntercomCommunicationService` from `../../organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service` and calls `executeScheduledActivation` / `executeScheduledDeactivation` when handling the corresponding intercom communication task types. This import path also reaches into a nested `organization` submodule rather than a top-level public interface.
- **External library dependency (not a repo module):** `@google-cloud/tasks` (`CloudTasksClient`) — the Google Cloud Tasks SDK, used directly by `OSKTaskSchedulerService`. This is an external GCP client library, not an internal repo module, and is not part of the live module list.
- **External framework dependency:** `firebase-functions/v1` (`FunctionBuilder`, `Request`, `Response`) — used for HTTPS trigger definition and typing.

No other module relationships are evidenced.

---

## 11. External Hooks

- **Google Cloud Tasks queue (confirmed integration)** — `OSKTaskSchedulerService` directly manages Cloud Tasks queue entries via `tasksClient.queuePath`, `tasksClient.createTask`, and `tasksClient.deleteTask`. This is a **Confirmed** external system integration (GCP Cloud Tasks), architecturally distinct from the Pub/Sub synchronization backbone described in the platform architecture documents.
- **`handleTask` HTTP endpoint** — **Confirmed** as an `https.onRequest` HTTP target. Its most plausible consumer, based on the module's own scheduling logic and general Cloud Tasks architecture, is the Cloud Tasks queue itself invoking this URL as the task's execution target once a task's schedule time arrives — however, **no fact directly links `scheduleTask`'s `createTask` call to the specific URL/target of `handleTask`** (the `createTask` call's `httpRequest.url` construction is not captured in the evidence). This linkage is therefore **Inferred**, not directly evidenced.

**Pub/Sub note:** No `pubsub_publish_call`, `pubsub_topic`, or `pubsub_event_route` facts exist for this module (`summary.pubsubEventRoutes: 0`). The `handleTask` `api_contract` fact explicitly carries `pubsubPushReceiver: false`, confirming this endpoint is **not** classified as a Pub/Sub push receiver despite superficial resemblance to one (an async-invoked HTTP handler). There is no Event Routing Table to present for this module.

---

## 12. Architectural Observations

- **Producer/consumer separation** — **Confirmed**. `OSKTaskSchedulerService` (the "producer" side: create/cancel tasks) is cleanly separated from `OSKTaskHandlerService` (the "consumer"/execution side), mirroring — but structurally distinct from — the Pub/Sub producer/consumer pattern used elsewhere in the platform (per the `OSKAccessMessagePublisherService` / `PubSubMessageProcessor` pattern documented in the architectural grounding docs).
- **Pure dispatcher, zero embedded business logic** — **Confirmed**. `handleTask` contains no domain logic of its own beyond a `taskType` switch and structured logging; all actual work is delegated to `admin` and `organization` module services. This is architecturally consistent with an "Orchestration Service" pattern (as described for `OSKAccessService` in the grounding docs), but here the orchestration is generic/type-routed rather than domain-specific.
- **Deep, path-based coupling to internal submodules of other modules** — **Confirmed**. The imports of `OSKPincodeRefreshWorkerService` and `OSKIntercomCommunicationService` reach through multiple levels of nested submodule directories (`admin/modules/admin_maintenance/db_pincodes/services/...`, `organization/modules/organization_intercom_ communication/services/...`) rather than through a stable top-level module interface. This creates a coupling risk: any internal refactor of those modules' folder structures could break `tasks` without any change to `tasks`' own public contract.
- **No persistence ownership** — **Confirmed**. Unlike most other modules profiled in this platform, `tasks` owns no Firestore collections and performs no direct reads/writes, consistent with its role as pure infrastructure/orchestration.
- **Synchronous inline execution model** — **Inferred**. Because `handleTask` calls the downstream service (`executePincodeRefresh`, `executeScheduledActivation`, etc.) inline and returns an HTTP status based on its outcome, a single Cloud Task's execution failure surfaces as a direct 500 response to the Cloud Tasks caller (enabling its native retry behavior), rather than being decoupled via a secondary async hand-off as seen in some Pub/Sub-based flows elsewhere in the platform.

---

## 13. Risks & Open Questions

- The exact authorization/authentication mechanism guarding `handleTask` (producing the 403 "Forbidden" path) is not identified by any call_expression fact — the check itself (header validation, OIDC verification, shared secret, etc.) is unconfirmed.
- No RBAC permission strings (`v1.*`) are used anywhere in this module, and none exist in `rbac-roles.json` under a `tasks`-scoped namespace. It is unclear whether this is an intentional design decision (task execution is meant to be an internal service-to-service trust boundary outside the RBAC model) or a gap in permission coverage — flagged as an open question rather than resolved.
- Deep relative imports into `admin`'s and `organization`'s internal submodule paths (rather than each module's top-level public interface) represent a structural coupling risk not further evaluated here.
- No model_property facts exist for `OSKTScheduledTaskPayload` itself (the discriminated-union envelope type); its exact shape, discriminant field name, and full set of possible `taskType` values beyond the three handled in `handleTask` are not confirmed by evidence.
- The `namedExports: []` value on both `exported_symbol` facts in `index.ts` leaves ambiguous exactly which named symbols from `task_scheduler.service` and `task_handler.service` are re-exported at the module boundary (consistent with a wildcard `export *`, but not confirmed).
- No fact directly links `OSKTaskSchedulerService.scheduleTask`'s Cloud Task creation (`createTask`) to the specific target URL of `OSKTaskHandlerService.handleTask` — the assumption that scheduled tasks are delivered to this module's own HTTP endpoint is architecturally plausible but not directly evidenced.
- Retry/error-handling policy for failed task execution (beyond a generic 500 response) is not evidenced; whether Cloud Tasks' native retry configuration is relied upon is unconfirmed.

---

## 14. Evidence References

- `api_contract|tasks|functions/src/modules/tasks/index.ts|11|handleTask` — HTTP endpoint registration.
- `call_expression|tasks|functions/src/modules/tasks/index.ts|11|https.onRequest|...` — trigger wiring (unresolved callee, resolved handler).
- `source_class|tasks|functions/src/modules/tasks/services/task_handler.service.ts|7|OSKTaskHandlerService`
- `service_method|tasks|functions/src/modules/tasks/services/task_handler.service.ts|16|OSKTaskHandlerService|handleTask`
- `call_expression|tasks|.../task_handler.service.ts|25|...logError|'[TaskHandler] Unauthorized attempt...'` and `|26|res.status(403).send|'Forbidden'` — auth-gate failure path.
- `call_expression|tasks|.../task_handler.service.ts|41|OSKPincodeRefreshWorkerService.executePincodeRefresh` — admin module delegation.
- `call_expression|tasks|.../task_handler.service.ts|45|OSKIntercomCommunicationService.executeScheduledActivation` and `|49|...executeScheduledDeactivation` — organization module delegation.
- `call_expression|tasks|.../task_handler.service.ts|56|...logWarning|'Unknown task type...'` — unknown task fallback.
- `source_class|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|21|OSKTaskSchedulerService`
- `service_method|tasks|.../task_scheduler.service.ts|31|OSKTaskSchedulerService|scheduleTask`
- `service_method|tasks|.../task_scheduler.service.ts|71|OSKTaskSchedulerService|cancelTask`
- `call_expression|tasks|.../task_scheduler.service.ts|37|...tasksClient.queuePath`, `|58|...tasksClient.createTask`, `|73|...tasksClient.deleteTask` — Cloud Tasks SDK integration.
- `imports_dependency|tasks|.../task_handler.service.ts|1|@oskey/core/logger`
- `imports_dependency|tasks|.../task_handler.service.ts|3|../../admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service`
- `imports_dependency|tasks|.../task_handler.service.ts|5|../../organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service`
- `imports_dependency|tasks|.../task_scheduler.service.ts|1|@google-cloud/tasks`
- `type_alias|tasks|functions/src/modules/tasks/models/tasks.model.ts|18|OSKTScheduledTaskPayload`
- `model_property|tasks|.../models/pincode_refresh_task.model.ts|7-12|OSKPincodeRefreshTaskPayload.*`
- `model_property|tasks|.../models/tasks.model.ts|10-13|OSKIntercomCommunicationTaskPayload.*`
- `function_declaration|tasks|functions/src/modules/tasks/index.ts|7|getHttpsFunctionTriggers`
- `exported_symbol|tasks|functions/src/modules/tasks/index.ts|4|./services/task_scheduler.service` and `|5|./services/task_handler.service`