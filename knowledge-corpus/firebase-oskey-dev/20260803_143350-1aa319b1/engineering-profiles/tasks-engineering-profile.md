### 0. Generation Metadata

- runId: `20260803_143350-1aa319b1`
- generatedAt: `2026-08-11T14:20:07.175Z`
- repoName: `firebase-oskey-dev`
- targetModule: `tasks`
- llmConfigKey: `claude-default`
- llmProvider: `anthropic`
- llmModel: `claude-sonnet-5`

### 1. Executive Summary

The `tasks` module provides generic, cross-cutting asynchronous task infrastructure for the platform, rather than owning any business domain itself. It consists of an HTTP-triggered task dispatcher (`OSKTaskHandlerService`) and a Google Cloud Tasks scheduling/cancellation service (`OSKTaskSchedulerService`), used by other modules to defer and orchestrate work — evidenced examples include pincode-refresh maintenance work and intercom-communication activation/deactivation. **Confirmed** (per the single `_module_root` capability's summary and corroborated by the Cross-Module Dependency Graph, which shows `admin` and `organization` as the module's only inbound dependents). The module owns no business data of its own; it is a shared orchestration utility consumed by other modules. **Inferred**, from the absence of any Firestore evidence in the capability pack combined with the module's exclusively dispatch/scheduling responsibilities.

### 2. Architectural Position

`tasks` sits below the business-domain modules as a shared, domain-agnostic infrastructure layer — architecturally analogous to `core` in that it is consumed by other modules rather than initiating business workflows of its own. **Inferred.** It has no submodules (the module consists solely of `_module_root`), and the Intra-Module Coupling Graph confirms zero internal submodule structure (`submoduleCount: 0`). **Confirmed.** Its owned concepts are limited to task dispatch (`handleTask`) and task scheduling/cancellation against Google Cloud Tasks (`scheduleTask`, `cancelTask`); it provides these as capabilities to `admin` (pincode-refresh maintenance) and `organization` (intercom communication scheduling), and itself depends outbound on `admin`, `core`, and `organization`. **Confirmed**, per the Cross-Module Dependency Graph and Resolved Cross-Module Call Edges.

### 3. Primary Responsibilities

#### _module_root

- **Task dispatch (`OSKTaskHandlerService.handleTask`)**: an HTTP handler that receives a task payload with a `taskType` discriminator and routes to the appropriate downstream service:
  - `refreshPincodeTask` → `OSKPincodeRefreshWorkerService.executePincodeRefresh` (admin module)
  - `activateIntercomCommunicationTask` → `OSKIntercomCommunicationService.executeScheduledActivation` (organization module)
  - `deactivateIntercomCommunicationTask` → `OSKIntercomCommunicationService.executeScheduledDeactivation` (organization module)
  **Confirmed** (evidence: `call_expression` facts at task_handler.service.ts lines 38–49).

- **Unauthorized-call rejection**: `handleTask` has a branch returning `res.status(403).send('Forbidden')` accompanied by a `logger.logError('[TaskHandler] Unauthorized attempt to call task handler.')` log. **Confirmed** the branch exists; the specific authorization check performed is **Unknown** (not evidenced in this pack — see Open Questions).

- **Unknown task type handling**: logs a warning `` `[TaskHandler] Unknown task type: ${unknownPayload.taskType ?? 'undefined'}` `` when the payload's `taskType` does not match a known handler. **Confirmed.**

- **Success/failure response contract**: on success, responds `res.status(200).send('Task processed successfully.')`; on caught error, logs via `logger.logError('[TaskHandler] Error processing task', ...)` and responds `res.status(500).send('Task processing failed.')`. **Confirmed.**

- **Task scheduling (`OSKTaskSchedulerService.scheduleTask`)**: creates a Google Cloud Tasks job via `tasksClient.createTask({ parent, task })`, where the queue path is derived from `tasksClient.queuePath(PROJECT_ID!, LOCATION_ID!, QUEUE_TASK_NAME!)`, the payload is base64-encoded JSON (`Buffer.from(JSON.stringify(payload)).toString('base64')`), and the scheduled execution time is computed via `Math.floor(scheduleDate.getTime() / 1000)`. **Confirmed.**

- **Task cancellation (`OSKTaskSchedulerService.cancelTask`)**: deletes a previously scheduled Cloud Task via `tasksClient.deleteTask({ name: taskId })`; logs a warning if deletion fails, noting the task "may have already executed or been deleted." **Confirmed.**

- **Task payload models**: defines `OSKPincodeRefreshTaskPayload` (`accessId`, `buildingId`, `isAppUser`, `oldPincode`, `unitId`, `userId`) and `OSKIntercomCommunicationTaskPayload` (`buildingId`, `communicationId`, `communicationType`, `organizationId`), unified under a `OSKTScheduledTaskPayload` type alias. **Confirmed** (model_property and type_alias facts).

### 4. Public Interfaces

#### _module_root

- `OSKTaskHandlerService` (`functions/src/modules/tasks/services/task_handler.service.ts`) — exported class exposing `handleTask`.
- `OSKTaskSchedulerService` (`functions/src/modules/tasks/services/task_scheduler.service.ts`) — exported class exposing `scheduleTask` and `cancelTask`.
- `getHttpsFunctionTriggers` (`functions/src/modules/tasks/index.ts`) — function that registers the `https.onRequest` Cloud Function trigger wrapping `handleTask`.

Both services are exported from the module root via `index.ts` (`exported_symbol` facts referencing `./services/task_handler.service` and `./services/task_scheduler.service`).

### 5. Internal Structure

The Intra-Module Coupling Graph reports zero submodules for `tasks` (`submoduleCount: 0`) — the module is a single, flat `_module_root` capability with no internal cross-submodule coupling to report. **Confirmed.**

### 6. Firestore & Data Ownership

**Ownership conclusion:**

No submodule or module touching `tasks`'-owned Firestore paths is evidenced anywhere in the per-capability Data Ownership extract — no `firestore_path_touched` facts appear for this module at all. Combined with the Data Ownership Hint that `OSKTaskSchedulerService` is called by 0 other submodules but 2 other modules (`admin`, `organization`), the picture is consistent with `tasks` being a pure orchestration/dispatch layer that owns no Firestore data itself: persistence for the work it schedules (pincode refresh records, intercom communication state) is owned by the calling modules (`admin`, `organization`), not by `tasks`. **Inferred** — the evidence gap is an absence-of-facts signal rather than a confirmed statement that `tasks` never touches Firestore; this is recorded as an open question below rather than asserted as fact.

**Per-capability evidence:**

#### _module_root

No Firestore path facts (reads/writes) appear in this capability's evidence pack. This capability appears to operate purely as an orchestration/dispatch layer, delegating any Firestore access to the downstream services it calls (`OSKPincodeRefreshWorkerService`, `OSKIntercomCommunicationService`), which belong to other modules/submodules. **Unknown** whether `tasks` itself touches Firestore directly — no evidence either way.

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

- **`handleTask`** — `api_contract` fact: `contractType: http`, method `handleTask`, defined in `functions/src/modules/tasks/index.ts`, `handlerResolutionStatus: resolved`. This is the HTTP endpoint registered by `getHttpsFunctionTriggers` (`https.onRequest`). **Confirmed** as an HTTP entry point.
  - Request/Response schema: the task's "Resolved API Request/Response Schemas" section reports no `model_property` facts matched for this contract's request/response types within this pack, so no request/response schema can be presented here. **Unknown** — the actual payload shape is inferable only from the task-handler branching logic (`payload.taskType`, `payload.data`) and the `OSKTScheduledTaskPayload` type alias / `OSKPincodeRefreshTaskPayload` / `OSKIntercomCommunicationTaskPayload` models, but these are not confirmed as resolved to the contract's declared request/response types.

- No Firestore triggers are evidenced in this pack.

### 9. Permissions & Security

**Cross-cutting risk callouts:**

No RBAC permission strings (`v1.admin.*`, `v1.org.*`, or otherwise) are evidenced anywhere in this module. The `handleTask` HTTP entry point does implement an authorization-rejection branch (403 response, "Unauthorized attempt to call task handler" log) but the underlying check performed is not evidenced — no header/token/IAM-invoker validation call was captured in the facts. Because no permission string exists to check, this cannot be cross-referenced against the RBAC roles document one way or the other; it is a genuine evidence gap, not a resolved match or mismatch. **Unknown.**

Cross-cutting concern: two other modules (`admin` and `organization`) call directly into `OSKTaskSchedulerService.scheduleTask`/`.cancelTask` (per the Resolved Cross-Module Call Edges), and neither this module's evidence nor either caller's extract shows any RBAC permission gate on those calls. Combined with the unevidenced authorization mechanism on `handleTask`, this suggests the entire task-scheduling/dispatch path may rely on infrastructure-level trust (e.g., Cloud Tasks IAM invoker binding) rather than application-level RBAC — plausible for internal service-to-service infrastructure, but **Unknown** given no such evidence was supplied. Flagged as a risk in Section 13 rather than resolved.

**Per-capability evidence:**

#### _module_root

No RBAC permission strings (e.g., `v1.admin.*`, `v1.org.*`) appear anywhere in this capability's evidence. The `handleTask` entry point does implement an authorization-rejection branch (`res.status(403).send('Forbidden')` with an "Unauthorized attempt to call task handler" log), but the pack contains no evidence of the specific check performed (no permission-string comparison, no header/token validation call captured in the facts). **Unknown** — cannot cross-check against the RBAC roles document because no permission string is evidenced; this is a gap rather than a resolved mismatch.

### 10. Cross-Module Relationships

Per the Cross-Module Dependency Graph (AST-derived, all entries **Confirmed**):

**Outbound** (tasks depends on):
- `admin` — `task_handler.service.ts` imports `OSKPincodeRefreshWorkerService` from `admin`'s `admin_maintenance/db_pincodes` submodule, and calls its `executePincodeRefresh` method.
- `core` — both `task_handler.service.ts` and `task_scheduler.service.ts` import `OSKLoggingService` from `@oskey/core/logger`, calling `logInfo`, `logWarning`, and `logError`.
- `organization` — `task_handler.service.ts` imports `OSKIntercomCommunicationService` from `organization`'s `organization_intercom_ communication` submodule, calling `executeScheduledActivation` and `executeScheduledDeactivation`.

**Inbound** (depends on tasks):
- `admin` — `admin_maintenance/db_pincodes/services/db_pincodes.service.ts` imports `OSKPincodeRefreshTaskPayload`, `OSKTScheduledTaskPayload`, and `OSKTaskSchedulerService`, calling `OSKTaskSchedulerService.scheduleTask`.
- `organization` — `organization_intercom_ communication.service.ts` imports `OSKIntercomCommunicationTaskPayload` and `OSKTaskSchedulerService`, calling both `scheduleTask` (4 call sites) and `cancelTask` (6 call sites).

This confirms `tasks` functions as a shared scheduling utility with a genuine two-way relationship to both `admin` and `organization`: each dispatches work into `tasks` for deferred execution, and `tasks` in turn calls back out into each module's specific handler method to actually perform that work.

### 11. External Hooks

#### _module_root

- **HTTP entry point (confirmed)**: `handleTask`, registered via `https.onRequest` in `getHttpsFunctionTriggers` — a Cloud Function HTTP trigger, consistent with the `api_contract` fact (`contractType: http`).
- **Google Cloud Tasks (confirmed)**: `OSKTaskSchedulerService` integrates directly with the GCP Cloud Tasks API via the `@google-cloud/tasks` client (`tasksClient.createTask`, `tasksClient.deleteTask`, `tasksClient.queuePath`). This is the module's core external boundary — it is what allows the platform to defer/schedule work (e.g., a future pincode refresh or intercom activation/deactivation).
- **Candidate environment variables**: `PROJECT_ID!`, `LOCATION_ID!`, `QUEUE_TASK_NAME!` are referenced (non-null-asserted) as arguments to `tasksClient.queuePath`. These strongly resemble environment-variable-backed configuration, but no `environment_variable` fact type is present in this pack to confirm their declaration/source — **Inferred**, not confirmed.
- No `pubsub_topic`/`pubsub_publish_call`, `storage_path`, or `external_hook` facts are present in this pack beyond the above.

### 12. Architectural Observations

- **Pure orchestration/infrastructure layer:** `tasks` exhibits no business-domain responsibilities and owns no Firestore data (per Section 6); its entire surface area is generic task dispatch and Cloud Tasks scheduling. **Inferred.**
- **Fan-in coupling from two domain modules:** Both `admin` and `organization` depend on the same `OSKTaskSchedulerService` for deferred execution, indicating a shared, reusable scheduling pattern rather than duplicated per-module task infrastructure. **Confirmed**, per the Cross-Module Dependency Graph and Data Ownership Hint (0 submodule callers, 2 module callers).
- **Bidirectional coupling with its callers:** Unlike a typical one-directional utility dependency, `tasks` both is called by (`scheduleTask`/`cancelTask`) and calls back into (`executePincodeRefresh`, `executeScheduledActivation`/`executeScheduledDeactivation`) the same two modules (`admin`, `organization`), forming a callback/dispatch round-trip rather than a simple one-way dependency. **Confirmed**, per the Resolved Cross-Module Call Edges (both outbound and inbound directions).
- **No internal decomposition:** The module has no submodules (`submoduleCount: 0`), consistent with its narrow, single-purpose infrastructure role. **Confirmed.**
- **Logging-only dependency on `core`:** The module's only outbound dependency besides its two callback targets is `core`'s logging service, reinforcing its role as thin infrastructure rather than a business-logic consumer. **Confirmed.**

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Unauthenticated-looking dispatch endpoint consumed by two modules:** `handleTask`'s authorization mechanism is unevidenced, yet it is the callback target reached (indirectly, via Cloud Tasks) for work enqueued by both `admin` and `organization`. Because neither this module's evidence nor its callers' extracts show an application-level permission check anywhere along this path, it's unclear whether the entire scheduling round-trip relies solely on infrastructure-level trust (e.g., Cloud Tasks IAM invoker binding) — this can only be flagged by comparing `tasks`' own gap against its two callers' extracts, neither of which fills it. **Unknown — risk.**
- **No RBAC permission strings anywhere in the module's evidence:** Nothing to cross-check against the RBAC roles document, which itself is unusual for a module reachable from two others — this absence should be confirmed as intentional (infrastructure exemption) rather than an oversight.
- **Firestore touch status of `tasks` itself is unconfirmed:** No `firestore_path_touched` facts appear for `_module_root`, but this could reflect either a true absence of direct persistence or an undetected/indirect touch point; the module's own capability output already flagged this as unknown and it remains unresolved at the module level.
- **Direction of dependency for callback methods is asymmetric with scheduling calls:** `admin` and `organization` both call `scheduleTask`, but only `organization` is evidenced calling `cancelTask` (6 call sites) — whether `admin`'s pincode-refresh tasks are ever cancelled, or are designed to run to completion without a cancellation path, is not evidenced and is only visible by comparing the two callers' usage patterns.

**Per-capability open questions:**

#### _module_root

- What mechanism determines "unauthorized" callers of `handleTask` (leading to the 403 branch)? No header check, secret comparison, or IAM-invoker check is evidenced in this pack — only the log message and response exist as facts.
- Is the `handleTask` HTTP endpoint's request/response type resolvable to a concrete schema? The join against `model_property` facts scoped to this pack returned nothing; the actual payload shape can only be inferred from the branching logic and the sibling model types (`OSKPincodeRefreshTaskPayload`, `OSKIntercomCommunicationTaskPayload`, `OSKTScheduledTaskPayload`), not confirmed as the contract's declared type.
- Does this capability read or write any Firestore data directly, or is it purely an orchestration/dispatch layer with all persistence delegated to the modules it calls into (`admin_maintenance`, `organization_intercom_ communication`)? No Firestore facts appear in this pack either way.
- Are `PROJECT_ID`, `LOCATION_ID`, and `QUEUE_TASK_NAME` environment variables, build-time constants, or something else? Not confirmed by any `environment_variable` fact in this pack.
- What component(s) elsewhere in the codebase actually call `OSKTaskSchedulerService.scheduleTask` / `.cancelTask` to enqueue these tasks in the first place? This pack shows outbound calls made *by* the scheduler/handler, but (per the contract's stated scope) cannot show inbound callers — that reconciliation belongs to the module-synthesis step.

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.