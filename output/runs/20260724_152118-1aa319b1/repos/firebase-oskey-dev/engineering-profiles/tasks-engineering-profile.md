<!-- © Oskey SAS. All rights reserved. -->

# Module Engineering Profile: tasks

*© Oskey SAS. All rights reserved.*

## Metadata

| Property | Value |
| :--- | :--- |
| **Module** | `tasks` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_152118-1aa319b1` |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Overall Confidence** | High |
| **Status** | Completed & Grounded |

---

## 1. Executive Summary

### Interpretation

Evidence indicates that the `tasks` module is a small infrastructure module for scheduling and handling asynchronous backend work. It exposes an HTTP task handler and a scheduler service backed by Google Cloud Tasks. It does not own Firestore collections and does not expose Firestore triggers.

The module currently routes three confirmed task types: `refreshPincodeTask`, `activateIntercomCommunicationTask`, and `deactivateIntercomCommunicationTask`. These delegate to pincode refresh maintenance and intercom communication lifecycle services.

### Evidence Used

- Service: `OSKTaskHandlerService` implements `handleTask`.
- Service: `OSKTaskSchedulerService` implements `scheduleTask` and `cancelTask`.
- Public Interface: `functions/src/modules/tasks/index.ts` exposes `https.onRequest(OSKTaskHandlerService.handleTask)`.
- Task Handler: `refreshPincodeTask` delegates to `OSKPincodeRefreshWorkerService.executePincodeRefresh`.
- Task Handler: `activateIntercomCommunicationTask` delegates to `OSKIntercomCommunicationService.executeScheduledActivation`.
- Task Handler: `deactivateIntercomCommunicationTask` delegates to `OSKIntercomCommunicationService.executeScheduledDeactivation`.
- External Hooks: scheduler reads `GCLOUD_PROJECT`, `LOCATION_ID`, and `QUEUE_TASK_NAME`.
- Manifest: `tasks` contains 5 files, 2 services, 0 controllers, 34 call expressions, 0 Firestore hints, 0 permission hints, and 0 Firestore triggers.

### Confidence

High.

---

## 2. Architectural Position

Include:

- Parent scope: Backend infrastructure and asynchronous orchestration.
- Owned concepts: Scheduled task dispatch and HTTP task handling.
- Provided capabilities: Schedule Cloud Tasks, cancel Cloud Tasks, route incoming task payloads to domain workers.
- Downstream consumers or candidate consumers: Intercom communication scheduling, pincode refresh maintenance, any service that imports `OSKTaskSchedulerService`.
- Confidence: High for current capabilities; medium for consumers beyond evidenced imports/calls.

### Interpretation

The module sits outside domain ownership. It is a cross-cutting execution utility that allows domain modules to defer work until a future time or process work asynchronously via an HTTP endpoint.

Architecture grounding specifically supports the intercom communication use case: creating an intercom communication can schedule future activation/deactivation through `OSKTaskSchedulerService.scheduleTask`, and scheduled execution later calls the intercom communication service to change message state. The pincode refresh use case is evidenced by module imports and handler calls, but its broader lifecycle is outside this module's supplied evidence.

### Evidence Used

- Architecture/Data: `OSkey Backend Services & Data Architecture.md` states intercom communication creation schedules future work through `OSKTaskSchedulerService.scheduleTask`.
- Architecture/Data: Intercom communication scheduling creates `activateIntercomCommunicationTask` and `deactivateIntercomCommunicationTask`.
- Service Method: `OSKTaskSchedulerService.scheduleTask`.
- Service Method: `OSKTaskSchedulerService.cancelTask`.
- Service Method: `OSKTaskHandlerService.handleTask`.
- Cross-Module Dependency: `OSKTaskHandlerService` imports `OSKPincodeRefreshWorkerService`.
- Cross-Module Dependency: `OSKTaskHandlerService` imports `OSKIntercomCommunicationService`.

### Confidence

High.

---

## 3. Primary Responsibilities

- Capability: Expose an HTTP task handler endpoint.
- Implemented by:
 * Controller: None supplied.
 * Service: `OSKTaskHandlerService`
 * Representative Service Method: `handleTask`
- Evidence: `functions/src/modules/tasks/index.ts` registers `https.onRequest(OSKTaskHandlerService.handleTask)`.
- Confidence: High.

- Capability: Route task payloads to domain handlers.
- Implemented by:
 * Controller: None supplied.
 * Service: `OSKTaskHandlerService`
 * Representative Service Method: `handleTask`
- Evidence: `handleTask` routes `refreshPincodeTask` to `OSKPincodeRefreshWorkerService.executePincodeRefresh`, `activateIntercomCommunicationTask` to `OSKIntercomCommunicationService.executeScheduledActivation`, and `deactivateIntercomCommunicationTask` to `OSKIntercomCommunicationService.executeScheduledDeactivation`.
- Confidence: High.

- Capability: Schedule future Cloud Tasks.
- Implemented by:
 * Controller: None supplied.
 * Service: `OSKTaskSchedulerService`
 * Representative Service Method: `scheduleTask`
- Evidence: `scheduleTask` builds a queue path from `GCLOUD_PROJECT`, `LOCATION_ID`, and `QUEUE_TASK_NAME`, base64-encodes a JSON payload, sets `scheduleTime` from a requested date, and calls `tasksClient.createTask({ parent, task })`.
- Confidence: High.

- Capability: Cancel scheduled tasks.
- Implemented by:
 * Controller: None supplied.
 * Service: `OSKTaskSchedulerService`
 * Representative Service Method: `cancelTask`
- Evidence: `cancelTask` calls `tasksClient.deleteTask({ name: taskId })` and logs warning if cancellation fails, including the case where a task may already have executed or been deleted.
- Confidence: High.

### Interpretation

The module's responsibilities are deliberately narrow. It does not implement pincode refresh, intercom communication state transitions, or Firestore persistence. It receives/schedules task execution and delegates domain work to owning modules.

### Evidence Used

- Public Interface: `https.onRequest(OSKTaskHandlerService.handleTask)`.
- Service Method: `OSKTaskHandlerService.handleTask`.
- Service Method: `OSKTaskSchedulerService.scheduleTask`.
- Service Method: `OSKTaskSchedulerService.cancelTask`.
- Task Type: `refreshPincodeTask`.
- Task Type: `activateIntercomCommunicationTask`.
- Task Type: `deactivateIntercomCommunicationTask`.

### Confidence

High.

---

## 4. Public Interfaces

### Interpretation

The only confirmed runtime endpoint is an HTTPS request handler for task execution. The module also exports the scheduler and handler services for internal backend consumers.

There are no controllers in the supplied evidence and no callable functions. The scheduler is a service API rather than a public HTTP endpoint.

### Evidence Used

- Public Interface: `functions/src/modules/tasks/index.ts` exports `getHttpsFunctionTriggers`.
- Public Interface: `https.onRequest(OSKTaskHandlerService.handleTask)`.
- Export: `OSKTaskSchedulerService`.
- Export: `OSKTaskHandlerService`.
- Export: `OSKPincodeRefreshTaskPayload`.
- Export: `OSKIntercomCommunicationTaskPayload`.
- Export: `OSKTScheduledTaskPayload`.
- Controller Evidence: `tasks-controllers.json` is an empty array.

### Confidence

High.

---

## 5. Internal Structure

### Interpretation

The module is organized around two services:

- `OSKTaskSchedulerService`: creates and deletes Cloud Tasks.
- `OSKTaskHandlerService`: receives HTTP task execution requests and dispatches the payload by task type.

Supporting model exports define task payload shapes for pincode refresh and intercom communication tasks. The module has no persistence controller layer because it does not directly own Firestore data.

### Evidence Used

- Service: `OSKTaskHandlerService` has method `handleTask`.
- Service: `OSKTaskSchedulerService` has methods `scheduleTask` and `cancelTask`.
- Export: `OSKPincodeRefreshTaskPayload`.
- Export: `OSKIntercomCommunicationTaskPayload`.
- Export: `OSKTScheduledTaskPayload`.
- Manifest: 5 files, 2 classes, 3 methods, 1 function, 0 controllers.

### Confidence

High.

---

## 6. Firestore & Data Ownership

### Interpretation

The `tasks` module has no confirmed Firestore persistence ownership. It does not expose controllers, Firestore paths, schema-backed collections, or Firestore trigger handlers.

Its downstream tasks may cause other modules to read or write Firestore. For example, intercom communication activation/deactivation is architecture-grounded as a state transition over intercom communication data, and pincode refresh maintenance likely affects pincode-related data. Those data changes belong to the downstream domain services, not to this module.

### Evidence Used

- Firestore Evidence: `tasks-evidence.json` has an empty `firestoreEvidence` array.
- Controller Evidence: `tasks-controllers.json` is an empty array.
- Manifest Summary: `firestoreHints` count is `0`.
- Schema: no task-owned collection was identified in `firestore-schema.md`.
- Downstream Service: `OSKIntercomCommunicationService.executeScheduledActivation`.
- Downstream Service: `OSKIntercomCommunicationService.executeScheduledDeactivation`.
- Downstream Service: `OSKPincodeRefreshWorkerService.executePincodeRefresh`.

### Confidence

High.

---

## 7. API Endpoints

This section is detailed in the companion `api-reference/tasks-api-reference.md` document.

---

## 8. API Endpoints

This section is detailed in the companion `api-reference/tasks-api-reference.md` document.

---

## 9. Firestore Triggers

### Interpretation

No Firestore document triggers are supplied for the `tasks` module. Runtime behavior is initiated through an HTTP request handler and Cloud Tasks client calls, not Firestore document events.

### Evidence Used

- Firestore Trigger Evidence: `tasks-firestore-triggers.json` is an empty array.
- Manifest Summary: `firestoreTriggers` count is `0`.
- Public Interface Evidence: `functions/src/modules/tasks/index.ts` uses `https.onRequest`.

### Confidence

High.

---

## 10. Permissions & Security

### Interpretation

No RBAC permission strings are present in the task module evidence. Security evidence is limited to the task handler rejecting unauthorized calls with HTTP 403, but the exact authorization condition or trusted caller mechanism is not visible in the extracted facts.

This module appears to rely on an infrastructure-level task invocation boundary rather than user-facing RBAC. Requires confirmation from source or deployment configuration before making stronger claims.

### Evidence Used

- Permission Evidence: `tasks-evidence.json` has an empty `permissionEvidence` array.
- Handler Security: `OSKTaskHandlerService.handleTask` logs `Unauthorized attempt to call task handler`.
- Handler Security: unauthorized task handler calls return `res.status(403).send('Forbidden')`.
- RBAC Context: no `tasks` permission strings were found in `rbac-roles.json`.

### Confidence

Medium. Unauthorized handling is confirmed; the authorization mechanism is not.

---

## 11. Cross-Module Relationships

### Interpretation

The module has two confirmed downstream domain relationships:

- Admin maintenance pincode refresh work.
- Organization intercom communication scheduled activation/deactivation.

It also has a platform infrastructure relationship with Google Cloud Tasks through its scheduler service.

### Evidence Used

- Cross-Module Dependency: `task_handler.service.ts` imports `OSKPincodeRefreshWorkerService` from admin maintenance pincode refresh worker service.
- Cross-Module Dependency: `task_handler.service.ts` imports `OSKIntercomCommunicationService` from organization intercom communication service.
- Service Call: `OSKPincodeRefreshWorkerService.executePincodeRefresh(payload.data)`.
- Service Call: `OSKIntercomCommunicationService.executeScheduledActivation(payload.data)`.
- Service Call: `OSKIntercomCommunicationService.executeScheduledDeactivation(payload.data)`.
- Infrastructure Call: `OSKTaskSchedulerService.tasksClient.queuePath`.
- Infrastructure Call: `OSKTaskSchedulerService.tasksClient.createTask`.
- Infrastructure Call: `OSKTaskSchedulerService.tasksClient.deleteTask`.

### Confidence

High.

---

## 12. External Hooks

### Interpretation

Confirmed external hooks are Google Cloud Tasks configuration and the HTTP request handler used by Cloud Tasks to invoke work. The scheduler depends on environment variables for GCP project, location, and queue name.

Cloud Tasks is a confirmed external infrastructure dependency because the scheduler uses a task client to create and delete tasks. The exact task target URL, service account, OIDC settings, queue retry configuration, and handler authentication mechanism are not present in the supplied evidence.

### Evidence Used

- External Hook: `GCLOUD_PROJECT`.
- External Hook: `LOCATION_ID`.
- External Hook: `QUEUE_TASK_NAME`.
- Infrastructure Call: `tasksClient.queuePath(PROJECT_ID!, LOCATION_ID!, QUEUE_TASK_NAME!)`.
- Infrastructure Call: `tasksClient.createTask({ parent, task })`.
- Infrastructure Call: `tasksClient.deleteTask({ name: taskId })`.
- Public Endpoint: `https.onRequest(OSKTaskHandlerService.handleTask)`.
- Payload Encoding: scheduler serializes payload with `JSON.stringify(payload)` and base64-encodes it with `Buffer.from(...).toString('base64')`.

### Confidence

High for Cloud Tasks usage; medium for invocation security details.

---

## 13. Architectural Observations

### Interpretation

The module implements a lightweight asynchronous orchestration pattern. Domain modules can schedule future work without owning Cloud Tasks mechanics, while the handler delegates execution back into domain services by task type.

The design decouples time-based workflows from synchronous user/admin requests. This is directly grounded for intercom communications: future activation/deactivation can be scheduled at creation time and executed later by the task handler.

The module intentionally avoids data ownership. This keeps task infrastructure generic, but it also means operational correctness depends on the payload contract and downstream service idempotency/error handling, neither of which is fully visible in the supplied evidence.

### Evidence Used

- Service Method: `OSKTaskSchedulerService.scheduleTask`.
- Service Method: `OSKTaskHandlerService.handleTask`.
- Architecture/Data: intercom communication uses Cloud Tasks for scheduled activation and deactivation.
- Handler Branch: `activateIntercomCommunicationTask`.
- Handler Branch: `deactivateIntercomCommunicationTask`.
- Handler Branch: `refreshPincodeTask`.
- Handler Response: success returns HTTP 200 with `Task processed successfully.`
- Handler Response: processing error returns HTTP 500 with `Task processing failed.`

### Confidence

High.

---

## 14. Risks & Open Questions

### Interpretation

- The task handler authorization mechanism is not visible in the evidence. The handler rejects unauthorized calls, but the exact trusted header, token, or Cloud Tasks identity check requires confirmation.
- The scheduler's constructed task payload is evidenced, but the target URL and HTTP method are not visible in the extracted call evidence.
- No Firestore persistence exists in this module, so downstream data mutations must be documented in the owning modules, not here.
- The task type model appears finite from handler evidence, but no exhaustive schema validation evidence is supplied for payload shape.
- Cloud Tasks retry behavior, deduplication/task naming strategy, and idempotency guarantees are not visible in the supplied artefacts.
- `cancelTask` logs failed cancellation as a warning if a task may already have executed or been deleted; downstream modules that store task IDs should account for that uncertainty, but this module evidence does not show those storage locations.

### Evidence Used

- Handler Security: unauthorized calls return 403, but no explicit auth condition is surfaced in call evidence.
- Scheduler Evidence: `tasksClient.createTask({ parent, task })` but no literal target URL appears in the extracted facts.
- Firestore Evidence: no Firestore hints, no controllers, no triggers.
- Export Evidence: payload model exports exist, but no validation call evidence is supplied.
- Scheduler Evidence: `cancelTask` catches failures and logs that a task may have already executed or been deleted.

### Confidence

High.

---

## 15. Evidence References

- `ai-runtime/contracts/module-engineering-profile/contract.md`
- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/module-engineering-profile/work-order.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/firestore.indexes.json`
- `ai-runtime/contracts/docs/rbac-roles.json`
- `output/knowledge-pipeline/modules/tasks/tasks-manifest.json`
- `output/knowledge-pipeline/modules/tasks/tasks-services.json`
- `output/knowledge-pipeline/modules/tasks/tasks-controllers.json`
- `output/knowledge-pipeline/modules/tasks/tasks-evidence.json`
- `output/knowledge-pipeline/modules/tasks/tasks-evidence-graph.json`
- `output/knowledge-pipeline/modules/tasks/tasks-firestore-triggers.json`
