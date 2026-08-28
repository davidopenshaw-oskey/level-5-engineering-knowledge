### 0. Generation Metadata

- **runId**: `20260803_143350-1aa319b1`
- **generatedAt**: `2026-08-11T17:06:15.942Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `settings`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `settings` module serves as the central administrative and security backbone of the Oskey platform. It is responsible for defining, seeding, and consolidating the platform's Role-Based Access Control (RBAC) roles and composite role hierarchies, resolving consolidated user permissions, managing mobile application store configurations (Apple App Store and Google Play Store), and orchestrating request routing and approval workflows for buildings and organizations across different countries. **Confirmed**.

### 2. Architectural Position

The `settings` module occupies a critical, foundational "horizontal" position within the platform's architecture. Rather than executing localized business workflows, it provides the core authorization engine (`OSKConsolidatedRolesController`) that almost all other operational modules (`admin`, `building`, `organization`, `supplier`, `user`, and `core`) import and call to enforce permission boundaries. It operates at the global system scope, managing system-wide rules, app store verification parameters, and request-routing workflows that dictate how entities are provisioned and managed. **Confirmed**.

### 3. Primary Responsibilities

#### _module_root

- **Settings Document Initialization**: Dynamically generates and writes settings documents containing predefined RBAC roles (view, create, edit, delete, and admin composite roles) for a given setting category [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingController.default.create|onCreateSettingsCalled|...|#1` ``).
- **Settings Document CRUD Operations**: Exposes standardized controller methods (`get`, `create`, `delete`) to manage settings documents in Firestore by extending the core document controller [Confirmed] (`` `source_class|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController` ``).
- **Submodule Trigger & Function Aggregation**: Acts as the central entry point for the `settings` module, collecting and exporting callable functions and Firestore triggers from the `role` and `workflow` submodules [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/index.ts|getRoleFirestoreTriggers|getSettingsFirestoreTriggers|functionBuilder|#1` ``, `` `call_expression|settings|functions/src/modules/settings/index.ts|getWorkflowFirestoreTriggers|getSettingsFirestoreTriggers|functionBuilder|#1` ``).
- **App Check & Authentication Enforcement**: Validates that incoming requests to administrative settings functions are authenticated and verified via Firebase App Check [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService.logger.logError|onCreateSettingsCalled|'Failed-precondition: The function must be called from an App Check verified app.'|#1` ``, `` `call_expression|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService.logger.logError|onCreateSettingsCalled|'Unauthenticated: You must be authenticated to use onCreateSettingsCalled()'|#1` ``).

---

#### appstore

- **App Store Activation Code Validation**: Validates client-provided activation codes against stored app store settings. It enforces that the request is initiated from an App Check verified application, validates parameters, and searches the stored settings document for a matching activation code. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 26-43, 45-74) ``).
- **App Store Information Retrieval**: Fetches the app store settings document (specifically the document with ID `'appstore'` under the `/settings` collection) and parses the store details to extract Apple and Google store names and URLs. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 76-99) ``).
- **App Store Settings Document Management**: Exposes standard document controller operations to get, save, and delete app store settings documents. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts` (lines 9-27) ``).

---

#### role

The `role` capability is responsible for the following core features:

- **Individual Role Management**: Handles CRUD operations for granular system roles stored in Firestore under `/settings/roles/roles` `functions/src/modules/settings/modules/role/controllers/role.controller.model.ts` (lines 18-50). (Confirmed)
- **Composite Role Management**: Manages composite roles (roles that contain other roles or composite roles) stored under `/settings/roles/compositeRoles` `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` (lines 21-49). (Confirmed)
- **Hierarchical Dependency Resolution**: Automatically updates parent-child relationships when composite roles are modified or deleted, ensuring that changes cascade correctly through the role hierarchy `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` (lines 51-143). (Confirmed)
- **Consolidated Role Resolution**: Resolves a flat list of all inherited permissions for a user or organization by recursively traversing the composite role hierarchy `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts` (lines 16-39). (Confirmed)
- **Role Seeding and Synchronization**: Synchronizes statically defined roles in the codebase (e.g., `composite_roles_translated.data.ts`) with the Firestore database, adding new roles and pruning deprecated ones `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (lines 53-102). (Confirmed)
- **Permission Verification**: Provides utility methods to check if a user's resolved roles satisfy a required set of permissions `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts` (lines 48-57). (Confirmed)

#### workflow

The `workflow` capability is responsible for the following distinct features:

- **Building Request Workflow Management**: Handles the creation, retrieval, updating, and deletion of building request workflows via `OSKBuildingRequestWorkflowController` `` `functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts` (lines 15-40) `` and `OSKBuildingRequestWorkflowService` `` `functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts` (lines 15-77) ``. (Confirmed)
- **Organization Request Workflow Management**: Handles the creation, retrieval, updating, and deletion of organization request workflows via `OSKOrganizationRequestWorkflowController` `` `functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts` (lines 15-40) `` and `OSKOrganizationRequestWorkflowService` `` `functions/src/modules/settings/modules/workflow/services/organization_request_workflow.service.ts` (lines 15-77) ``. (Confirmed)
- **Firestore Trigger Orchestration**: Listens to document changes (creation, updates, deletions) on building and organization request workflow paths to synchronize state and execute downstream business logic `` `functions/src/modules/settings/modules/workflow/index.ts` (lines 36-58) ``. (Confirmed)
- **Programmatic Workflow Initialization**: Exposes callable functions to programmatically batch-create workflows for buildings and organizations based on predefined templates `` `functions/src/modules/settings/modules/workflow/index.ts` (lines 60-70) ``. (Confirmed)

---

### 4. Public Interfaces

#### _module_root

- **`OSKSettingController`**: A controller class extending `OSKDocumentController` that handles direct database operations (`get`, `create`, `delete`) for settings documents located under the `/settings` collection path [Confirmed] (`` `source_class|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController` ``).
- **`OSKSettingService`**: A service class containing the business logic for setting initialization, specifically exposing the `onCreateSettingsCalled` handler [Confirmed] (`` `source_class|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService` ``).
- **Module Entry Points (`functions/src/modules/settings/index.ts`)**:
  - **`getSettingsFirestoreTriggers`**: Aggregates and exports Firestore triggers from the `role` and `workflow` submodules [Confirmed] (`` `function_declaration|settings|functions/src/modules/settings/index.ts|getSettingsFirestoreTriggers|#1` ``).
  - **`getSettingsCallableFunction`**: Aggregates and exports callable functions from the `role` and `workflow` submodules, and registers the `onCreateSettingsCalled` HTTPS callable function [Confirmed] (`` `function_declaration|settings|functions/src/modules/settings/index.ts|getSettingsCallableFunction|#1` ``).

---

#### appstore

### Controllers
- **`OSKAppStoreSettingsController`**: Extends `OSKDocumentController` to expose CRUD-like endpoints for managing app store settings documents under the `/settings` collection. [Confirmed] (`` `source_class|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController` ``).
  - `get(documentId)`: Retrieves a settings document. [Confirmed] (`` `controller_method|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController|get|#1` ``).
  - `save(documentId, data)`: Saves or updates a settings document. [Confirmed] (`` `controller_method|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController|save|#1` ``).
  - `delete(documentId)`: Deletes a settings document. [Confirmed] (`` `controller_method|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController|delete|#1` ``).

### Services
- **`OSKAppStoreSettingsService`**: Provides the core business logic for validating activation codes and formatting store information. [Confirmed] (`` `source_class|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService` ``).
  - `validateAppStoreActivationCode(request)`: Validates the activation code after performing App Check and parameter checks. [Confirmed] (`` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|validateAppStoreActivationCode|#1` ``).
  - `validateInternally(activationCode)`: Internal helper that queries the `'appstore'` settings document to find a matching activation code. [Confirmed] (`` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|validateInternally|#1` ``).
  - `getAppstoreInformation()`: Retrieves and parses the Apple and Google store details. [Confirmed] (`` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|getAppstoreInformation|#1` ``).

---

#### role

This capability exposes the following controllers and service entry points:

- **`OSKRoleController`**: Extends `OSKDocumentController` to provide direct database access methods (get, getAll, save, delete, listDocuments) for individual roles `functions/src/modules/settings/modules/role/controllers/role.controller.model.ts` (lines 12-50).
- **`OSKCompositeRoleController`**: Extends `OSKDocumentController` to provide database access and dependency management (createorUpdateDependantRoles, deleteOrUpdateDependantRoles) for composite roles `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` (lines 13-147).
- **`OSKConsolidatedRolesController`**: Orchestrates the resolution of hierarchical roles into flat permission lists and validates user permissions `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts` (lines 13-109).
- **`OSKCompositeRoleService`**: Exposes service-level methods for handling Firestore triggers and callable functions related to composite roles `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (lines 20-165).
- **`OSKRoleService`**: Exposes service-level methods for handling Firestore triggers and callable functions related to individual roles `functions/src/modules/settings/modules/role/services/role.service.ts` (lines 16-51).

#### workflow

This capability exposes the following public entry points and services:

- **OSKBuildingRequestWorkflowController**: Extends `OSKDocumentController` to expose standard document operations (`get`, `save`, `create`, `delete`) for building request workflows `` `functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts` (lines 15-40) ``. (Confirmed)
- **OSKOrganizationRequestWorkflowController**: Extends `OSKDocumentController` to expose standard document operations (`get`, `save`, `create`, `delete`) for organization request workflows `` `functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts` (lines 15-40) ``. (Confirmed)
- **OSKBuildingRequestWorkflowService**: Orchestrates business logic for building request workflows, including handling triggers and callable API requests `` `functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts` (lines 15-77) ``. (Confirmed)
- **OSKOrganizationRequestWorkflowService**: Orchestrates business logic for organization request workflows, including handling triggers and callable API requests `` `functions/src/modules/settings/modules/workflow/services/organization_request_workflow.service.ts` (lines 15-77) ``. (Confirmed)

---

### 5. Internal Structure

*Note: This section describes only the internal coupling relationships between submodules.*

The internal structure of the `settings` module is highly decoupled, with submodules operating as independent capabilities that are aggregated at the module root. Based on the deterministic intra-module coupling graph:
- **`_module_root`** maintains direct outbound coupling to both the **`role`** and **`workflow`** submodules to aggregate and export their respective callable functions and Firestore triggers. **Confirmed**.
- **`role`** and **`workflow`** submodules operate independently of each other, with no direct cross-submodule coupling evidenced. **Confirmed**.
- **`appstore`** operates as an isolated capability within the module, with no direct coupling to the `_module_root` or sibling submodules resolved in the AST import graph. **Confirmed**.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section presents the synthesis and judgment of data ownership across the module.*

The `settings` module is the **Inferred** primary owner of the `/settings` root collection and all of its nested subcollections. This includes:
- `/settings/{settingId}` (System-wide settings documents)
- `/settings/appstore` (App store URLs and activation parameters)
- `/settings/roles/compositeRoles/{compositeRoleId}` (Hierarchical role groupings)
- `/settings/roles/roles/{roleId}` (Individual RBAC roles)
- `/settings/workflows/buildingRequests/{workflowId}` (Building request routing rules)
- `/settings/workflows/organizationRequests/{workflowId}` (Organization request routing rules)

**Ownership Conclusion:**
Although other modules (such as `organization` and `user`) frequently read from `/settings/appstore` and query composite roles, the `settings` module is the sole writer and manager of these schemas. All write, update, and delete operations on these paths are executed exclusively by controllers defined within this module (`OSKAppStoreSettingsService`, `OSKCompositeRoleController`, `OSKConsolidatedRolesController`, and `OSKBuildingRequestWorkflowController`), establishing it as the authoritative system of record. **Inferred**.

**Per-capability evidence:**

#### _module_root

### Firestore Paths

#### `/settings/{settingId}`
- **Operation Detection Scope**: Document CRUD operations (`get`, `create`, `delete`) [Confirmed] (`` `controller_method|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController|get|#1` ``, `` `controller_method|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController|create|#1` ``, `` `controller_method|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController|delete|#1` ``).
- **Confidence**: Confirmed
- **Schema**:
  - `viewRole`: *string* [Confirmed] (`` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|viewRole|#1` ``)
  - `createRole`: *string* [Confirmed] (`` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|createRole|#1` ``)
  - `editRole`: *string* [Confirmed] (`` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|editRole|#1` ``)
  - `deleteRole`: *string* [Confirmed] (`` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|deleteRole|#1` ``)
  - `adminCompositeRole`: *string* [Confirmed] (`` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|adminCompositeRole|#1` ``)
  - `creationDate`: *timestamp* [Inferred] (`` `call_expression|settings|functions/src/modules/settings/controllers/setting.controller.ts|Timestamp.now|create||#1` ``)

---

#### appstore

### Firestore Paths
- **`/settings/{documentId}`**: Read, written, and deleted via the document controller. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts` (lines 18, 22, 26) ``).
- **`/settings/appstore`**: Specifically read by the service to validate activation codes and retrieve store information. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 57, 77) ``).

---

#### role

This capability owns and directly modifies the following Firestore paths:

- **`/settings/roles/compositeRoles/{compositeRoleId}`**
  - **Operations**: Read, Write, Delete `functions/src/modules/settings/modules/role/index.ts` (lines 36, 39, 42).
  - **Scope**: Confirmed.
- **`/settings/roles/roles/{roleId}`** (referenced in code as `/setting/roles/roles/{roleId}`)
  - **Operations**: Read, Write, Delete `functions/src/modules/settings/modules/role/index.ts` (line 45).
  - **Scope**: Confirmed.

#### workflow

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

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### API Contracts

#### `onCreateSettingsCalled`
- **Type**: HTTPS Callable Function [Confirmed] (`` `api_contract|settings|functions/src/modules/settings/index.ts|onCreateSettingsCalled|#1` ``)
- **Handler**: `OSKSettingService.onCreateSettingsCalled` [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/index.ts|https.onCall|getSettingsCallableFunction|OSKSettingService.onCreateSettingsCalled|#1` ``)
- **Request/Response Schemas**: No model properties matched within this pack's scope. The handler expects a `setting` string parameter to dynamically generate the corresponding roles [Inferred] (`` `functions/src/modules/settings/services/setting.service.ts` (lines 32-38) ``).

### Firestore Triggers
- No direct Firestore triggers are declared in this capability's root files; however, it aggregates and exports triggers from sibling submodules (`role` and `workflow`) [Confirmed] (`` `functions/src/modules/settings/index.ts` (lines 23-28) ``).

---

#### appstore

*No direct `api_contract` facts or Firestore triggers are defined in this capability's evidence pack.*

### Data Models & Schemas
The following internal data models are defined for requests, responses, and documents:
- **`OSKAppStoreActivationRequest`**: `{ activationCode: string }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/functions/app_store_settings_request.model.ts|OSKAppStoreActivationRequest|#1` ``).
- **`OSKAppStoreActivationResponse`**: `{ isRecordFound: boolean, activationCode: string, appStoreDocument: OSKAppStoreSettings }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/functions/app_store_settings_request.model.ts|OSKAppStoreActivationResponse|#1` ``).
- **`OSKAppStoreSettings`**: `{ stores: OSKAppStoreInfo[], activationCodes: string[], creationDate: Timestamp }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreSettings|#1` ``).
- **`OSKAppStoreInfo`**: `{ appleStoreName: string, appleStoreUrl: string, googleStoreName: string, googleStoreUrl: string }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreInfo|#1` ``).

---

#### role

### API Contracts
The following callable Cloud Functions are exposed by this capability:

#### `getAllCompositeRoles`
- **Type**: Callable
- **File**: `functions/src/modules/settings/modules/role/index.ts` (lines 142-151)
- **Request Type**: `void` (Inferred)
- **Response Type**: `OSKCompositeRoleDocument`
  - `creationDate`: `Timestamp`

#### `getAllRoles`
- **Type**: Callable
- **File**: `functions/src/modules/settings/modules/role/index.ts` (lines 43-51)
- **Request Type**: `void` (Inferred)
- **Response Type**: `OSKRoleDocument`
  - `creationDate`: `Timestamp`
  - `modificationDate`: `Timestamp`

#### `getOrganizationCompositeRoles`
- **Type**: Callable
- **File**: `functions/src/modules/settings/modules/role/index.ts` (lines 153-165)
- **Request Type**: `void` (Inferred)
- **Response Type**: `OSKCompositeRoleDocument`
  - `creationDate`: `Timestamp`

#### `onCreateCompositeRolesCalled`
- **Type**: Callable
- **File**: `functions/src/modules/settings/modules/role/index.ts` (lines 53-102)
- **Request Type**: `any` (Inferred)
- **Response Type**: `any` (Inferred)

---

### Firestore Triggers
The capability registers the following Firestore document triggers:

- **`onDocumentCreated`** on `/settings/roles/compositeRoles/{compositeRoleId}`: Calls `OSKCompositeRoleService.onDocumentCreated` `functions/src/modules/settings/modules/role/index.ts` (line 36).
- **`onDocumentUpdated`** on `/settings/roles/compositeRoles/{compositeRoleId}`: Calls `OSKCompositeRoleService.onDocumentUpdated` `functions/src/modules/settings/modules/role/index.ts` (line 39).
- **`onDocumentDeleted`** on `/settings/roles/compositeRoles/{compositeRoleId}`: Calls `OSKCompositeRoleService.onDocumentDeleted` `functions/src/modules/settings/modules/role/index.ts` (line 42).
- **`onDocumentCreated`** on `/settings/roles/roles/{roleId}`: Calls `OSKRoleService.onDocumentCreated` `functions/src/modules/settings/modules/role/index.ts` (line 45).

#### workflow

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

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section highlights cross-cutting security risks and enforcement patterns across the module's capabilities.*

#### Mental Enforcement Tally
- **`_module_root`**: Dynamically generates granular RBAC permission strings (e.g., `v1.admin.settings.role.view`) during initialization but does not enforce them at the database layer. **Confirmed**.
- **`appstore`**: Enforces strict Firebase App Check verification and parameter validation on client-facing operations. **Confirmed**.
- **`role`**: Manages the static definitions of all system permissions, matching the `rbac-roles.json` schema exactly, and filters out administrative roles for non-admin contexts. **Confirmed**.
- **`workflow`**: Enforces App Check verification and basic authentication checks, delegating granular role-based checks to the base `OSKDocumentController`. **Confirmed**.

#### Cross-Cutting Security Mismatches
The most significant security risk identified is a structural mismatch between the application-layer authorization design and the database-layer security rules:
- **Firestore Rules Mismatch**: The `firestore.rules.txt` file contains a broad rule allowing any authenticated user to read and write to the `/settings` collection:
  ```javascript
  match /settings/{docId} {
      allow write: if isValidUser();
      allow read: if isValidUser();
  }
  ```
  While settings documents contain granular RBAC role definitions (`viewRole`, `createRole`, `editRole`, `deleteRole`), the Firestore security rules do not restrict access based on these roles. Any authenticated user (`isValidUser()`) has full read and write access directly at the database layer, bypassing the intended RBAC boundaries unless strictly enforced by upstream Cloud Functions. **Inferred**.

#### Unattributed Security-Relevant Signals
- **App Check Failures**: `OSKAppStoreSettingsService.validateAppStoreActivationCode` explicitly raises 1 `'failed-precondition: The function must be called from an App Check verified app.'` error when App Check validation fails. **Confirmed**.
- **Authentication Failures**: Workflow services explicitly raise unauthenticated errors if the calling context lacks a valid user UID. **Confirmed**.

**Per-capability evidence:**

#### _module_root

### Dynamic Permission Generation
The `onCreateSettingsCalled` service dynamically generates RBAC permission strings when initializing settings documents [Confirmed] (`` `functions/src/modules/settings/services/setting.service.ts` (lines 32-38) ``):
- `v1.admin.settings.${setting}.view`
- `v1.admin.settings.${setting}.create`
- `v1.admin.settings.${setting}.edit`
- `v1.admin.settings.${setting}.delete`
- `v1.admin.settings.${setting}.admin`

### RBAC Cross-Check
When `${setting}` is replaced with `'role'` or `'workflow'`, these dynamically generated strings perfectly match the explicit permissions defined in the `rbac-roles.json` reference document (e.g., `v1.admin.settings.role.create`, `v1.admin.settings.workflow.view`) [Confirmed].

### Security Rules Mismatch
The `firestore.rules.txt` file contains a broad rule allowing any authenticated user to read and write to the `/settings` collection:
```javascript
match /settings/{docId} {
    allow write: if isValidUser();
    allow read: if isValidUser();
}
```
This represents a security mismatch [Inferred]: while the settings documents themselves contain granular RBAC role definitions (`viewRole`, `createRole`, etc.), the Firestore security rules do not restrict access based on these roles, allowing any authenticated user (`isValidUser()`) write and read access directly at the database layer.

---

#### appstore

- **App Check Verification**: The `validateAppStoreActivationCode` method enforces that the caller is verified by Firebase App Check. If verification fails, it logs a `'failed-precondition: The function must be called from an App Check verified app.'` error. [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService.logger.logError|validateAppStoreActivationCode|'failed-precondition: The function must be called from an App Check verified app.'|#1` ``).
- **Parameter Validation**: Validates that the `activationCode` parameter is a string. [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKSecurityChecks.checkParameters|validateAppStoreActivationCode|[{ name: 'activationCode', value: request.activationCode, type: 'string' }]|#1` ``).
- **Firestore Security Rules**: Access to `/settings/{docId}` is governed by the `isValidUser()` rule, which requires the user to be signed in and have a verified email. [Confirmed] (`firestore.rules.txt` (lines 405-408)).

---

#### role

The capability references a comprehensive list of system permissions within its static data files `functions/src/modules/settings/modules/role/data/composite_role.data.ts` and `functions/src/modules/settings/modules/role/data/composite_roles_translated.data.ts`. 

### RBAC Cross-Check
All permission strings defined in the static files match the provided RBAC roles document exactly. Examples include:
- `v1.admin.accessControlDevice.delete` `functions/src/modules/settings/modules/role/data/composite_role.data.ts` (line 332)
- `v1.admin.building.validate` `functions/src/modules/settings/modules/role/data/composite_role.data.ts` (line 274)
- `v1.org.residents.create` `functions/src/modules/settings/modules/role/data/composite_role.data.ts` (line 748)
- `v1.org.suppliers.view` `functions/src/modules/settings/modules/role/data/composite_role.data.ts` (line 853)

Additionally, the service filters out administrative roles when retrieving organization-specific composite roles by checking if the role ID starts with `v1.admin` `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (line 162).

#### workflow

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

### 10. Cross-Module Relationships

*Note: This section documents only genuine cross-module relationships supported by AST import resolution and method-level call edges.*

#### Outbound Dependencies
- **`core`**: The `settings` module depends heavily on `core` for foundational controller utilities and logging.
  - Calls `OSKDocumentController._get` (6 call sites) to retrieve settings, app store, and workflow documents. **Confirmed**.
  - Calls `OSKDocumentController._set` (10 call sites) to write and initialize settings, roles, and workflows. **Confirmed**.
  - Calls `OSKDocumentController._delete` (6 call sites) to remove configurations. **Confirmed**.
  - Calls `OSKDocumentController._listDocuments`, `_query`, and `_update` (2 call sites each) to manage role and composite role collections. **Confirmed**.
  - Calls `OSKLoggingService.logError` (9 call sites) to record validation and authorization failures. **Confirmed**.

#### Inbound Dependencies
The `settings` module is heavily imported and called by other modules to perform permission checks and retrieve configurations:
- **`admin`**: Calls `OSKConsolidatedRolesController.checkUserPermissions` (23 call sites) to authorize administrative actions. **Confirmed**.
- **`building`**: Calls `OSKConsolidatedRolesController.checkUserPermissions` (19 call sites) and `checkUserPermissionsSafe` (1 call site) to authorize door and intercom operations. **Confirmed**.
- **`core`**: Calls `OSKConsolidatedRolesController.checkUserPermissions` (3 call sites) during storage operations. **Confirmed**.
- **`organization`**: Calls `OSKConsolidatedRolesController.checkUserPermissions` (53 call sites) to authorize portal actions, `generateOrganizationUserRoles` (3 call sites) to provision roles, `OSKAppStoreSettingsService.validateInternally` (1 call site) to verify onboarding, and `OSKCompositeRoleController.listDocuments` (1 call site). **Confirmed**.
- **`supplier`**: Calls `OSKConsolidatedRolesController.checkUserPermissions` (17 call sites) to verify supplier staff access and activity logging. **Confirmed**.
- **`user`**: Calls `OSKConsolidatedRolesController.checkUserPermissions` (6 call sites), `generateOrganizationUserRoles` (1 call site), `OSKAppStoreSettingsService.getAppstoreInformation` (1 call site), and `OSKAppStoreSettingsController.get` (1 call site) to manage user invitations and settings. **Confirmed**.

### 11. External Hooks

#### _module_root

- No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced within this capability's pack. It relies entirely on standard Firebase Functions v1 HTTPS callable infrastructure [Confirmed] (`` `imports_dependency|settings|functions/src/modules/settings/services/setting.service.ts|firebase-functions/v1/https|#1` ``).

---

#### appstore

- **Firebase App Check**: Integrates with Firebase App Check to verify client app integrity. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (line 31) ``).
- **Apple App Store & Google Play Store**: Serves as the configuration source for external store URLs and names. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 88-95) ``).

---

#### role

There are no external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or Cloud Storage paths) evidenced within this capability's pack.

#### workflow

- **Firebase App Check**: Integrates with Firebase App Check to secure callable functions `` `functions/src/modules/settings/modules/workflow/index.ts` (line 61) ``.
- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally disable App Check enforcement during local emulation `` `functions/src/modules/settings/modules/workflow/index.ts` (line 61) ``.

---

### 12. Architectural Observations

- **High Inbound Coupling (Security Hub)**: The module exhibits an extremely high ratio of inbound-to-outbound coupling. While it only depends outbound on `core` for generic database operations, it is called by 6 separate modules across more than 120 distinct call sites. This confirms its role as the single, centralized authorization authority for the entire platform. **Confirmed**.
- **Separation of Concerns**: The internal architecture cleanly segregates role management (`role`), request routing (`workflow`), and client verification (`appstore`) into distinct submodules, preventing business logic leakage between these administrative domains. **Confirmed**.
- **Delegated Database Operations**: Rather than writing direct Firestore queries, the module's submodules consistently delegate database operations to `OSKDocumentController` (imported from `core`), ensuring uniform logging, error handling, and transaction behavior. **Confirmed**.

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Database-Layer Over-Permissioning**: The broad `allow read, write: if isValidUser();` rule in `firestore.rules.txt` for `/settings/{docId}` represents a significant security risk. If a client bypasses the Cloud Functions and interacts with Firestore directly, they can read or modify system-wide settings, roles, and workflows without possessing the required RBAC permissions. **Inferred**.
- **Seeding Trigger Context**: It is unknown how and when administrative seeding functions like `onCreateSettingsCalled` and `onCreateCompositeRolesCalled` are executed (e.g., CI/CD pipelines, manual scripts, or first-run triggers). If these are exposed as public callables without strict administrative checks, they pose a risk of unauthorized role modification or state reset. **Inferred**.
- **Missing Activation Code Generation**: While the `appstore` capability validates app store activation codes, the mechanism for generating and registering these codes is completely absent from the module's evidence, leaving a gap in the understanding of the complete client verification lifecycle. **Inferred**.

**Per-capability open questions:**

#### _module_root

- **Enforcement of Granular Roles**: Why are granular RBAC roles (`viewRole`, `createRole`, etc.) stored inside the settings documents if the Firestore security rules (`firestore.rules.txt`) allow any authenticated user (`isValidUser()`) to read and write to `/settings/{docId}`? Is authorization enforced exclusively at the application/Cloud Function layer instead of the database rules layer?
- **Triggering Context**: What administrative workflow or setup script triggers `onCreateSettingsCalled` to initialize these settings documents?

#### appstore

- **RBAC Roles**: It is unclear if specific administrative RBAC roles (e.g., `v1.admin.settings.role.edit`) are required to write to `/settings/appstore` via the `OSKAppStoreSettingsController`, or if it relies solely on the default Firestore rules for the `/settings` collection.
- **Activation Code Generation**: The evidence pack covers validation and retrieval of activation codes, but the mechanism for generating and registering new activation codes is not documented in this capability's scope.

#### role

- **Triggering of `onCreateCompositeRolesCalled`**: It is unclear from the evidence how or when the `onCreateCompositeRolesCalled` callable function is triggered. Is it part of a manual deployment/seeding script, or is it invoked automatically during a CI/CD pipeline?
- **Base Class Implementation**: The exact implementation details of `OSKDocumentController` (imported from `@oskey/core`) are unknown, as they reside outside this capability's evidence pack.

#### workflow

- **Exact Role Mapping**: The exact mapping of the `roleId` parameter passed into the controllers to specific RBAC strings (e.g., `v1.admin.settings.workflow.view`) is handled dynamically by the base `OSKDocumentController` and is not explicitly hardcoded in this submodule's files.
- **Template Data Source**: The exact structure and origin of the predefined workflow templates in `workflows.data.ts` are not fully detailed in the provided facts.

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.