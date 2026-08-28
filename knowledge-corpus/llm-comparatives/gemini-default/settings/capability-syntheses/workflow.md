# Capability Synthesis — workflow

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.523Z
- **repoName**: firebase-oskey-dev
- **targetModule**: settings
- **capability**: workflow
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `workflow` capability within the `settings` module manages the lifecycle and orchestration of building and organization request workflows. It provides administrative controllers, Firestore document triggers, and App Check-verified callable APIs to create, save, retrieve, and delete workflow configurations that define how requests are routed and approved across different countries and organizations. (Confirmed)

---

## 2. Primary Responsibilities
The `workflow` capability is responsible for the following distinct features:

- **Building Request Workflow Management**: Handles the creation, retrieval, updating, and deletion of building request workflows via `OSKBuildingRequestWorkflowController` `` `functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts` (lines 15-40) `` and `OSKBuildingRequestWorkflowService` `` `functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts` (lines 15-77) ``. (Confirmed)
- **Organization Request Workflow Management**: Handles the creation, retrieval, updating, and deletion of organization request workflows via `OSKOrganizationRequestWorkflowController` `` `functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts` (lines 15-40) `` and `OSKOrganizationRequestWorkflowService` `` `functions/src/modules/settings/modules/workflow/services/organization_request_workflow.service.ts` (lines 15-77) ``. (Confirmed)
- **Firestore Trigger Orchestration**: Listens to document changes (creation, updates, deletions) on building and organization request workflow paths to synchronize state and execute downstream business logic `` `functions/src/modules/settings/modules/workflow/index.ts` (lines 36-58) ``. (Confirmed)
- **Programmatic Workflow Initialization**: Exposes callable functions to programmatically batch-create workflows for buildings and organizations based on predefined templates `` `functions/src/modules/settings/modules/workflow/index.ts` (lines 60-70) ``. (Confirmed)

---

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes the following public entry points and services:

- **OSKBuildingRequestWorkflowController**: Extends `OSKDocumentController` to expose standard document operations (`get`, `save`, `create`, `delete`) for building request workflows `` `functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts` (lines 15-40) ``. (Confirmed)
- **OSKOrganizationRequestWorkflowController**: Extends `OSKDocumentController` to expose standard document operations (`get`, `save`, `create`, `delete`) for organization request workflows `` `functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts` (lines 15-40) ``. (Confirmed)
- **OSKBuildingRequestWorkflowService**: Orchestrates business logic for building request workflows, including handling triggers and callable API requests `` `functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts` (lines 15-77) ``. (Confirmed)
- **OSKOrganizationRequestWorkflowService**: Orchestrates business logic for organization request workflows, including handling triggers and callable API requests `` `functions/src/modules/settings/modules/workflow/services/organization_request_workflow.service.ts` (lines 15-77) ``. (Confirmed)

---

## 4. API Contracts & Firestore Triggers

### Callable Functions
- **`onCreateBuildingRequestWorkflowsCalled`**: Callable endpoint that triggers the programmatic creation of building request workflows `` `api_contract|settings|functions/src/modules/settings/modules/workflow/index.ts|onCreateBuildingRequestWorkflowsCalled|#1` ``.
- **`onCreateOrganizationRequestWorkflowsCalled`**: Callable endpoint that triggers the programmatic creation of organization request workflows `` `api_contract|settings|functions/src/modules/settings/modules/workflow/index.ts|onCreateOrganizationRequestWorkflowsCalled|#1` ``.

### Firestore Triggers
- **Building Request Workflow Triggers**:
  - **`onCreate`** on `/settings/workflows/buildingRequests/{workflowId}` -> Triggers `OSKBuildingRequestWorkflowService.onDocumentCreated` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(buildingRequestWorkflowPath)             .onCreate|getWorkflowFirestoreTriggers|OSKBuildingRequestWorkflowService.onDocumentCreated|#1` ``.
  - **`onUpdate`** on `/settings/workflows/buildingRequests/{workflowId}` -> Triggers `OSKBuildingRequestWorkflowService.onDocumentUpdated` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(buildingRequestWorkflowPath)             .onUpdate|getWorkflowFirestoreTriggers|OSKBuildingRequestWorkflowService.onDocumentUpdated|#1` ``.
  - **`onDelete`** on `/settings/workflows/buildingRequests/{workflowId}` -> Triggers `OSKBuildingRequestWorkflowService.onDocumentDeleted` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(buildingRequestWorkflowPath)             .onDelete|getWorkflowFirestoreTriggers|OSKBuildingRequestWorkflowService.onDocumentDeleted|#1` ``.
- **Organization Request Workflow Triggers**:
  - **`onCreate`** on `/setting/workflows/organizationRequest/{workflowId}` -> Triggers `OSKOrganizationRequestWorkflowService.onDocumentCreated` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(organizationRequestWorkflowPath)             .onCreate|getWorkflowFirestoreTriggers|OSKOrganizationRequestWorkflowService.onDocumentCreated|#1` ``.
  - **`onUpdate`** on `/setting/workflows/organizationRequest/{workflowId}` -> Triggers `OSKOrganizationRequestWorkflowService.onDocumentUpdated` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(organizationRequestWorkflowPath)             .onUpdate|getWorkflowFirestoreTriggers|OSKOrganizationRequestWorkflowService.onDocumentUpdated|#1` ``.
  - **`onDelete`** on `/setting/workflows/organizationRequest/{workflowId}` -> Triggers `OSKOrganizationRequestWorkflowService.onDocumentDeleted` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(organizationRequestWorkflowPath)             .onDelete|getWorkflowFirestoreTriggers|OSKOrganizationRequestWorkflowService.onDocumentDeleted|#1` ``.

### Resolved API Request/Response Schemas
*(No `api_contract` requestType/responseType resolved to any `model_property` facts in this evidence scope)*

---

## 5. Data Ownership

### Firestore Paths Touched
This capability directly references and manages documents under the following Firestore paths:

- **`/settings/workflows/buildingRequests/{workflowId}`** (Touch Type: `path_reference`, Operation Detection Scope: `undetermined_may_be_indirect`, Detection Method: `resolved_constant`) `` `firestore_path_touched|settings|functions/src/modules/settings/modules/workflow/index.ts|/settings/workflows/buildingRequests/{workflowId}|#1` ``.
- **`/setting/workflows/organizationRequest/{workflowId}`** (Touch Type: `path_reference`, Operation Detection Scope: `undetermined_may_be_indirect`, Detection Method: `resolved_constant`) `` `firestore_path_touched|settings|functions/src/modules/settings/modules/workflow/index.ts|/setting/workflows/organizationRequest/{workflowId}|#1` ``.

Additionally, the underlying controllers perform operations on the following paths:
- **`'/settings/workflows/buildingRequest'`**:
  - `_get` (Read) `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController.default._get|get|'/settings/workflows/buildingRequest',roleId|#1` ``.
  - `_set` (Write/Create) `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController.default._set|create|'/settings/workflows/buildingRequest',roleId,{             ...role,             creationDate: ts,         }|#1` ``.
  - `_delete` (Delete) `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController.default._delete|delete|'/settings/workflows/buildingRequest',roleId|#1` ``.
- **`'/settings/workflows/organizationRequests'`**:
  - `_get` (Read) `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts|this._get|get|'/settings/workflows/organizationRequests',roleId|#1` ``.
  - `_set` (Write/Create) `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts|this._set|create|'/settings/workflows/organizationRequests',roleId,{             ...role,             creationDate: ts,         }|#1` ``.
  - `_delete` (Delete) `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts|this._delete|delete|'/settings/workflows/organizationRequests',roleId|#1` ``.

### Data Models
- **`OSKBuildingRequestWorkflow`**: Contains fields `isoCountryCode` (string) and `approvingOrganizationId` (string) `` `functions/src/modules/settings/modules/workflow/models/documents/building_request_workflow_document.model.ts` (lines 8-10) ``.
- **`OSKOrganizationRequestWorkflow`**: Contains fields `isoCountryCode` (string) and `approvingOrganizationId` (string) `` `functions/src/modules/settings/modules/workflow/models/documents/organization_request_workflow_document.model.ts` (lines 8-10) ``.

---

## 6. Outbound Coupling

### Cross-Module Coupling
This capability depends on the following external modules:

- **`core`**:
  - Imports `OSKDocumentController` from `@oskey/core/controllers/document` in `functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts` (line 6) and `functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts` (line 6).
  - Imports `@oskey/core` in `functions/src/modules/settings/modules/workflow/models/documents/building_request_workflow_document.model.ts` (line 6) and `functions/src/modules/settings/modules/workflow/models/documents/organization_request_workflow_document.model.ts` (line 6).
  - Imports `OSKLoggingService` from `@oskey/core/logger` in `functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts` (line 10) and `functions/src/modules/settings/modules/workflow/services/organization_request_workflow.service.ts` (line 10).

### Intra-Module Coupling
- All other imports are relative paths within the `workflow` submodule itself (e.g., controllers, models, services, and data files).

---

## 7. Permissions & Security

### Enforced Permissions
The controller methods delegate operations to `OSKDocumentController` by passing a `roleId` parameter `` `functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts` (lines 22-40) ``. Based on the RBAC roles document, the expected matching permissions are:
- `v1.admin.settings.workflow.create` (Allows to create a new workflow)
- `v1.admin.settings.workflow.delete` (Allows to delete a workflow)
- `v1.admin.settings.workflow.edit` (Allows to edit an existing workflow)
- `v1.admin.settings.workflow.view` (Allows to view the details of a workflow)

### Security Guardrails
- **App Check Verification**: The callable functions enforce App Check verification unless bypassed in emulator environments `` `functions/src/modules/settings/modules/workflow/index.ts` (line 61) ``.
- **Authentication Checks**: The services verify that the caller is authenticated and log errors if unauthenticated `` `functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts` (line 72) ``.

---

## 8. External Hooks
- **Firebase App Check**: Integrates with Firebase App Check to secure callable functions `` `functions/src/modules/settings/modules/workflow/index.ts` (line 61) ``.
- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally disable App Check enforcement during local emulation `` `functions/src/modules/settings/modules/workflow/index.ts` (line 61) ``.

---

## 9. Open Questions
- **Exact Role Mapping**: The exact mapping of the `roleId` parameter passed into the controllers to specific RBAC strings (e.g., `v1.admin.settings.workflow.view`) is handled dynamically by the base `OSKDocumentController` and is not explicitly hardcoded in this submodule's files.
- **Template Data Source**: The exact structure and origin of the predefined workflow templates in `workflows.data.ts` are not fully detailed in the provided facts.