# Module Engineering Profile: `tasks`

## 0. Generation Metadata
- runId: `20260802_131856-1aa319b1`
- generatedAt: `2026-08-02T13:19:00.967Z`
- repoName: `firebase-oskey-dev`
- targetModule: `tasks`
- llmConfigKey: `claude-default`
- llmProvider: `anthropic`
- llmModel: `claude-sonnet-5`

---

## 1. Executive Summary

**Confirmed.** The `tasks` module provides a small, generic Google Cloud Tasks scheduling/dispatch layer used by other modules to defer work into the future and then execute it via an HTTP callback. It exposes two services: `OSKTaskSchedulerService` (create/cancel a deferred Cloud Task) and `OSKTaskHandlerService` (the HTTP handler that Cloud Tasks invokes when a scheduled task fires, which routes execution by `taskType` to logic owned by other modules — `admin` for pincode refresh, `organization` for intercom communication activation/deactivation).

**Inferred.** The module itself owns no business data — it is a thin orchestration/infrastructure layer sitting between the domain modules that need deferred execution (`admin`, `organization`) and Google Cloud Tasks as the underlying scheduling primitive.

---

## 2. Architectural Position

**Confirmed.** `tasks` is called into by `admin` (`db_pincodes.service.ts`) and `organization` (`organization_intercom_communication.service.ts`) via `OSKTaskSchedulerService.scheduleTask` / `.cancelTask` (see Cross-Module Dependency Graph, inbound). In the outbound direction, `tasks`' own `OSKTaskHandlerService.handleTask` calls back into `admin`'s `OSKPincodeRefreshWorkerService.executePincodeRefresh` and `organization`'s `OSKIntercomCommunicationService.executeScheduledActivation`/`executeScheduledDeactivation`. It also depends on `core` for logging (`OSKLoggingService`).

**Confirmed.** Owned concepts (per this module's evidence): task-scheduling primitives (`scheduleTask`, `cancelTask`), an HTTP task-dispatch entrypoint (`handleTask`), and task payload models (`OSKPincodeRefreshTaskPayload`, `OSKIntercomCommunicationTaskPayload`, `OSKTScheduledTaskPayload`).

**Unknown.** No Firestore touch points, no permission hints, and no Firestore triggers appear anywhere in this module's evidence graph (`firestoreHints: 0`, `permissionHints: 0`, `firestoreTriggers: 0`). No scope/limitation label (e.g. `operationDetectionScope`) accompanies this absence, so it is reported as "no evidence of any Firestore/permission footprint" rather than a confirmed absence.

---

## 3. Primary Responsibilities

- **Task scheduling** — **Confirmed**. `OSKTaskSchedulerService.scheduleTask` (task_scheduler.service.ts:31) builds a queue path via `tasksClient.queuePath(PROJECT_ID!, LOCATION_ID!, QUEUE_TASK_NAME!)`, base64-encodes the JSON payload (`Buffer.from(JSON.stringify(payload)).toString('base64')`), computes a schedule time (`Math.floor(scheduleDate.getTime() / 1000)`), and calls `tasksClient.createTask({ parent, task })`.
- **Task cancellation** — **Confirmed**. `OSKTaskSchedulerService.cancelTask` (task_scheduler.service.ts:71) calls `tasksClient.deleteTask({ name: taskId })`, logging a warning on failure ("It may have already executed or been deleted").
- **HTTP task dispatch** — **Confirmed**. `OSKTaskHandlerService.handleTask` (task_handler.service.ts:16–73) is registered as an `https.onRequest` HTTP Cloud Function (index.ts:11) and is the callback endpoint invoked when a scheduled Cloud Task fires.
- **Task-type routing to other modules' domain logic** — **Confirmed**. Inside `handleTask`, payload.taskType branches to: `refreshPincodeTask` → `OSKPincodeRefreshWorkerService.executePincodeRefresh` (admin module, line 41); `activateIntercomCommunicationTask` → `OSKIntercomCommunicationService.executeScheduledActivation` (organization module, line 45); `deactivateIntercomCommunicationTask` → `OSKIntercomCommunicationService.executeScheduledDeactivation` (organization module, line 49).
- **Unknown task-type handling** — **Confirmed**. An else/default branch logs `OSKTaskHandlerService.logger.logWarning` with the unrecognized `taskType` (line 56) rather than throwing.
- **Request rejection path** — **Confirmed** (existence of the branch), **Unknown** (mechanism). Lines 25–26 log `'[TaskHandler] Unauthorized attempt to call task handler.'` and return `res.status(403).send('Forbidden')`, but no evidenced call/fact shows what determines "unauthorized" (no permission-check call expression is captured before this branch).
- **Task payload modeling** — **Confirmed**. `OSKPincodeRefreshTaskPayload` (buildingId, unitId, userId, accessId, oldPincode, isAppUser) and `OSKIntercomCommunicationTaskPayload` (organizationId, buildingId, communicationId, optional communicationType: `"intercom" | "push"`), plus the `OSKTScheduledTaskPayload` type alias that presumably unions/wraps these (declaration itself not expanded in evidence).

---

## 4. Public Interfaces

- **`getHttpsFunctionTriggers()`** — exported function (index.ts:7), returns `{ taskHandler: any }`, registers `https.onRequest(OSKTaskHandlerService.handleTask)`. **Confirmed.**
- **`OSKTaskHandlerService.handleTask`** — static async public method, `Promise<void>` return, the module's sole HTTP entrypoint. **Confirmed.**
- **`OSKTaskSchedulerService.scheduleTask`** — static async public method, `Promise<string | null | undefined>`. Exported from module via `index.ts` re-export of `./services/task_scheduler.service`. **Confirmed.**
- **`OSKTaskSchedulerService.cancelTask`** — static async public method, `Promise<void>`. **Confirmed.**
- **Exported models**: `OSKPincodeRefreshTaskPayload`, `OSKIntercomCommunicationTaskPayload`, `OSKTScheduledTaskPayload` (all consumed by `admin` and `organization` per the Cross-Module Dependency Graph inbound entries). **Confirmed.**

---

## 5. Internal Structure

**Confirmed** (per the supplied Intra-Module Coupling Graph, `submoduleCount: 0`, empty `submodules` object) — `tasks` has **no internal submodules** and therefore no intra-module cross-submodule coupling to report. It is a flat module consisting of:

- `functions/src/modules/tasks/index.ts` — trigger registration (`getHttpsFunctionTriggers`), re-exports of both services.
- `functions/src/modules/tasks/services/task_handler.service.ts` — class `OSKTaskHandlerService`.
- `functions/src/modules/tasks/services/task_scheduler.service.ts` — class `OSKTaskSchedulerService`.
- `functions/src/modules/tasks/models/tasks.model.ts` — `OSKTScheduledTaskPayload` (type alias), `OSKIntercomCommunicationTaskPayload`; imports `./pincode_refresh_task.model` locally.
- `functions/src/modules/tasks/models/pincode_refresh_task.model.ts` — `OSKPincodeRefreshTaskPayload`.

**Cross-module dependencies (named per rule, not "infrastructure"):**
- `task_handler.service.ts` imports `OSKPincodeRefreshWorkerService` from the **admin** module, specifically its `admin_maintenance` submodule (`admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service.ts`). **Confirmed.**
- `task_handler.service.ts` imports `OSKIntercomCommunicationService` from the **organization** module, specifically its `organization_intercom_ communication` submodule. **Confirmed.**
- Both `task_handler.service.ts` and `task_scheduler.service.ts` import `OSKLoggingService` from the **core** module (`@oskey/core/logger`). **Confirmed.**

---

## 6. Firestore & Data Ownership

**Confirmed.** This module's evidence graph contains zero `firestore_path_touched`/Firestore-hint facts (`summary.firestoreHints: 0`). No collection paths, nested structures, or fan-out targets are evidenced anywhere in `tasks`' own source files.

**Unknown.** Because no scope/limitation label (e.g., `operationDetectionScope: "undetermined_may_be_indirect"`) accompanies this absence, it cannot be asserted with certainty that `tasks` truly touches no Firestore data at all — only that no such touch point was captured in this evidence graph. Any Firestore reads/writes related to pincode refresh or intercom activation happen inside the **admin** and **organization** services that `tasks` calls into, which are out of this module's own evidence scope.

**Data Ownership Hint (supplied):** `OSKTaskSchedulerService` is called by 0 other submodules and 2 other modules (`admin`, `organization`). Combined with the complete absence of any Firestore paths owned by this module, this supports (**Inferred**, not Confirmed) the characterization of `tasks` as a shared, dataless orchestration utility rather than an owner of any business collection.

---

## 7. API Endpoints

### `handleTask` (HTTP)
- **Type:** `http` (Firebase `https.onRequest`)
- **Handler:** `OSKTaskHandlerService.handleTask` (functions/src/modules/tasks/services/task_handler.service.ts:16–73), resolution status `resolved`.
- **Trigger registration:** `functions/src/modules/tasks/index.ts:11`, `https.onRequest(OSKTaskHandlerService.handleTask)`.
- **Request type:** `Request` (raw type expression from `firebase-functions/v1`, not a custom domain type).
- **Response type:** `void`.

**Schema note (per the Resolved API Request/Response Schemas section supplied):** No `api_contract` requestType/responseType in this module resolved to any `model_property` fact. That is, `Request` and `void` are generic/library types — no domain-specific field schema exists for this endpoint's request or response in the evidence. This is stated explicitly rather than presenting the bare type name as if it were a full schema.

---

## 8. Firestore Triggers

**Confirmed.** None. `summary.firestoreTriggers: 0` and no `firestore_trigger` facts appear anywhere in this module's evidence graph.

---

## 9. Permissions & Security

**Confirmed.** No `permission_hint`/RBAC-string facts appear anywhere in this module's evidence (`summary.permissionHints: 0`). No permission string (e.g. `v1.org.*`, `v1.admin.*`) is referenced by any file in `tasks`.

**Confirmed (existence), Unknown (mechanism).** `handleTask` does contain a rejection branch: it logs `'[TaskHandler] Unauthorized attempt to call task handler.'` (line 25) and responds `res.status(403).send('Forbidden')` (line 26). A request-headers log statement immediately precedes it (`'[TaskHandler] headers'`, `{ headers: req.headers }`, line 22), suggesting the authorization check may be header-based (e.g., an OIDC token issued by Cloud Tasks itself) rather than the platform's `v1.*` RBAC model — but no fact captures the actual conditional check, so this is not confirmed.

**RBAC cross-check:** Because zero permission strings are evidenced in this module, there is nothing to reconcile against `rbac-roles.json` — no mismatch is reported for this module, but the complete absence of any RBAC-style permission gate on an HTTP-exposed endpoint is flagged as a risk in Section 13.

---

## 10. Cross-Module Relationships

Per the supplied Cross-Module Dependency Graph (AST-derived, authoritative) — all entries **Confirmed**:

**Outbound (tasks depends on):**
- **admin** — `task_handler.service.ts:3` imports `OSKPincodeRefreshWorkerService` from `admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service`. Call edge: `task_handler.service.ts:41` → `OSKPincodeRefreshWorkerService.executePincodeRefresh`.
- **core** — `OSKLoggingService` imported in both service files (`@oskey/core/logger`). Numerous logging call edges (see Evidence References).
- **organization** — `task_handler.service.ts:5` imports `OSKIntercomCommunicationService` from `organization/modules/organization_intercom_ communication`. Call edges: `task_handler.service.ts:45` → `executeScheduledActivation`; `task_handler.service.ts:49` → `executeScheduledDeactivation`.

**Inbound (depends on tasks):**
- **admin** — `admin_maintenance/db_pincodes/services/db_pincodes.service.ts` imports `OSKPincodeRefreshTaskPayload`, `OSKTScheduledTaskPayload`, and `OSKTaskSchedulerService`; and `pincode_refresh_worker.service.ts` imports `OSKPincodeRefreshTaskPayload`. Resolved call edge: `db_pincodes.service.ts:106` → `OSKTaskSchedulerService.scheduleTask`.
- **organization** — `organization_intercom_communication.service.ts` imports `OSKIntercomCommunicationTaskPayload` and `OSKTaskSchedulerService`. Resolved call edges: multiple call sites (lines 1160, 1196, 1240, 1323) → `scheduleTask`; multiple call sites (lines 577, 1305, 1310, 1313, 1712, 1714) → `cancelTask`.

**Architectural interpretation (Inferred):** `admin`'s pincode-refresh workflow and `organization`'s intercom-communication scheduling workflow both delegate deferred execution to `tasks`, and `tasks` in turn calls back into the same two modules to execute the deferred work — a bidirectional "schedule now / execute later via callback" relationship, not a one-directional dependency.

---

## 11. External Hooks

- **Google Cloud Tasks (`@google-cloud/tasks`, `CloudTasksClient`)** — **Confirmed** external integration. `task_scheduler.service.ts` imports `CloudTasksClient` and calls `tasksClient.queuePath(...)`, `tasksClient.createTask({ parent, task })`, and `tasksClient.deleteTask({ name: taskId })`. This is the module's only confirmed external system boundary.
- **`firebase-functions/v1` `https.onRequest`** — **Confirmed** — exposes `handleTask` as a public/internal HTTP Cloud Function endpoint, the presumed callback target for the Cloud Tasks queue.
- **Not evidenced as connected:** No fact links the `task` object passed to `tasksClient.createTask` (which would normally carry the target HTTP URL for the queued task) to the `handleTask` HTTP endpoint's actual URL. The natural Cloud Tasks pattern (scheduled task → HTTP callback to `handleTask`) is architecturally very plausible but **not directly evidenced** in this graph — flagged as an open question in Section 13 rather than asserted.
- **Pub/Sub:** Not applicable — `summary.pubsubEventRoutes: 0`, no `pubsub_publish_call`/`pubsub_topic`/`pubsub_event_route` facts exist in this module's evidence.

---

## 12. Architectural Observations

- **Dispatcher/orchestration pattern** — **Confirmed**. `OSKTaskHandlerService.handleTask` is a single fan-in HTTP entrypoint that branches on `payload.taskType` to route to task-type-specific logic owned by other modules (`admin`, `organization`), rather than implementing that logic itself.
- **Deferred-execution decoupling** — **Confirmed**. Domain modules (`admin`, `organization`) do not implement their own scheduling; they delegate to `OSKTaskSchedulerService.scheduleTask`/`cancelTask`, centralizing all Cloud Tasks queue interaction in one place.
- **Concrete coupling, not abstraction** — **Confirmed**. `tasks` imports concrete service classes (`OSKPincodeRefreshWorkerService`, `OSKIntercomCommunicationService`) directly by relative/aliased path rather than through any shared interface, meaning changes to those classes' method signatures directly affect `tasks`.
- **No data ownership / stateless orchestration layer** — **Inferred**, consistent with the Data Ownership Hint (zero submodule callers, only cross-module callers) and the complete absence of Firestore facts.
- **Minimal surface area** — **Confirmed**. Only 2 classes, 3 methods, 1 HTTP endpoint, and 2 model files in the entire module — evidence of a narrowly scoped utility module rather than a broad domain module.

---

## 13. Risks & Open Questions

- **Unknown authorization mechanism.** `handleTask`'s 403/"Unauthorized" rejection path (lines 25–26) has no evidenced permission-check call expression; the actual authorization logic (e.g., verifying an OIDC token issued by Cloud Tasks, or some header check) is not captured by any fact in this graph.
- **No RBAC permission strings anywhere in this module.** Given the module exposes a public/internal HTTP endpoint, the complete absence of `v1.*`-style permission gates (as used elsewhere in the RBAC document) is notable and should be confirmed against actual deployment/IAM configuration, which is outside this evidence graph's scope.
- **Unconfirmed Cloud Tasks → HTTP callback linkage.** No fact ties the `task` argument passed to `tasksClient.createTask` to the `handleTask` HTTP endpoint URL. The two are very likely connected architecturally (this is the standard Cloud Tasks push pattern) but this is not directly evidenced.
- **No Firestore evidence, but no scope label explaining it.** Zero `firestore_hints` are present, but no `operationDetectionScope` label accompanies this — it is unclear whether `tasks` genuinely has zero Firestore footprint or whether this is simply outside detection scope for this module.
- **`OSKTScheduledTaskPayload` type alias not expanded.** The type alias (tasks.model.ts:18) is recorded as a fact but its underlying union/shape (presumably combining `OSKPincodeRefreshTaskPayload` and `OSKIntercomCommunicationTaskPayload`) is not itself detailed in any fact.
- **Handler request type is untyped (`Request`).** The `handleTask` HTTP contract's request/response types are generic library types with no resolvable domain schema (see Section 7) — the actual expected JSON payload shape for `handleTask` is only inferable from the internal `payload.taskType`/`payload.data` branching logic inside the handler body, not from any formal contract type.

---

## 14. Evidence References

- `api_contract|tasks|functions/src/modules/tasks/index.ts|11|handleTask`
- `call_expression|tasks|functions/src/modules/tasks/index.ts|11|https.onRequest|...`
- `service_method|tasks|functions/src/modules/tasks/services/task_handler.service.ts|16|OSKTaskHandlerService|handleTask`
- `service_method|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|31|OSKTaskSchedulerService|scheduleTask`
- `service_method|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|71|OSKTaskSchedulerService|cancelTask`
- `source_class|tasks|functions/src/modules/tasks/services/task_handler.service.ts|7|OSKTaskHandlerService`
- `source_class|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|21|OSKTaskSchedulerService`
- `call_expression|...task_handler.service.ts|41|OSKPincodeRefreshWorkerService.executePincodeRefresh|...`
- `call_expression|...task_handler.service.ts|45|OSKIntercomCommunicationService.executeScheduledActivation|...`
- `call_expression|...task_handler.service.ts|49|OSKIntercomCommunicationService.executeScheduledDeactivation|...`
- `call_expression|...task_handler.service.ts|25|OSKTaskHandlerService.logger.logError|'[TaskHandler] Unauthorized attempt to call task handler.'`
- `call_expression|...task_handler.service.ts|26|res.status(403).send|'Forbidden'`
- `call_expression|...task_scheduler.service.ts|37|OSKTaskSchedulerService.tasksClient.queuePath|...`
- `call_expression|...task_scheduler.service.ts|58|OSKTaskSchedulerService.tasksClient.createTask|...`
- `call_expression|...task_scheduler.service.ts|73|OSKTaskSchedulerService.tasksClient.deleteTask|...`
- `imports_dependency|...task_handler.service.ts|3|../../admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service`
- `imports_dependency|...task_handler.service.ts|5|../../organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service`
- `imports_dependency|...task_handler.service.ts|1|@oskey/core/logger`
- `imports_dependency|...task_scheduler.service.ts|1|@google-cloud/tasks`
- `model_property|tasks|functions/src/modules/tasks/models/pincode_refresh_task.model.ts|7-12|OSKPincodeRefreshTaskPayload.*`
- `model_property|tasks|functions/src/modules/tasks/models/tasks.model.ts|10-13|OSKIntercomCommunicationTaskPayload.*`
- `type_alias|tasks|functions/src/modules/tasks/models/tasks.model.ts|18|OSKTScheduledTaskPayload`
- Cross-Module Dependency Graph (`tasks/cross-module-dependencies.json`) — outbound: admin, core, organization; inbound: admin, organization
- Resolved Cross-Module Call Edges — full outbound/inbound list as supplied
- Data Ownership Hints — `OSKTaskSchedulerService` called by 0 submodules, 2 modules (admin, organization)
- Intra-Module Coupling Graph (`tasks/intra-module-coupling.json`) — `submoduleCount: 0`