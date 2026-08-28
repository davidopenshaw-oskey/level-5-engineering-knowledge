### 0. Generation Metadata

- **runId**: `20260827_163338-1aa319b1`
- **generatedAt**: `2026-08-27T17:11:31.921Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `settings`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `settings` module serves as the platform's central administrative and security configuration engine. It is responsible for defining and managing global system-wide settings, orchestrating hierarchical Role-Based Access Control (RBAC) resolution, maintaining external app store configurations (including onboarding activation codes), and managing administrative approval workflows for building and organization requests. [Confirmed]

### 2. Architectural Position

The `settings` module occupies a foundational, cross-cutting position within the Oskey platform. It sits directly above the `core` utility layer and provides critical authorization services consumed by almost all functional modules in the repository. Specifically, its `role` submodule acts as the central security authority, resolving complex, nested role hierarchies into flat permission lists that other modules (`admin`, `building`, `organization`, `supplier`, and `user`) query to enforce access boundaries. Additionally, it serves as the system of record for global platform settings, app store links, and administrative approval workflows. [Confirmed]

### 3. Primary Responsibilities

#### _module_root

### Settings Document Management
The capability provides core CRUD operations for settings documents under the `/settings` collection path. This is handled by `OSKSettingController` methods (`create`, `get`, `delete`) which extend `OSKDocumentController` and delegate to its internal `_set`, `_get`, and `_delete` methods respectively `` `functions/src/modules/settings/controllers/setting.controller.ts` (lines 12-34) ``. [Confirmed]

### Settings Initialization Orchestration
The capability orchestrates the initialization of settings with default roles (`viewRole`, `createRole`, `editRole`, `deleteRole`, `adminCompositeRole`) via the `onCreateSettingsCalled` service method `` `service_method|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService|onCreateSettingsCalled|#1` ``. This method dynamically constructs the role strings based on the setting name and persists them using the controller `` `call_expression|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingController.default.create|onCreateSettingsCalled|`${setting}s`,{                     viewRole: `v1.admin.settings.${setting}.view`,                     createRole: `v1.admin.settings.${setting}.create`,                     editRole: `v1.admin.settings.${setting}.edit`,                     deleteRole: `v1.admin.settings.${setting}.delete`,                     adminCompositeRole: `v1.admin.settings.${setting}.admin`,                 }|#1` ``. [Confirmed]

### Submodule Trigger & Callable Aggregation
The capability aggregates and exports callable functions and Firestore triggers from sibling submodules (specifically `role` and `workflow`) via `getSettingsCallableFunction` and `getSettingsFirestoreTriggers` `` `functions/src/modules/settings/index.ts` (lines 23-37) ``. [Confirmed]

---

#### appstore

- **Retrieve App Store Information**: Maps and retrieves store names and download URLs for both the Apple App Store and Google Play Store from the centralized settings document. [Confirmed] `` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|getAppstoreInformation|#1` ``.
- **Validate App Store Activation Code**: Validates a provided activation code against the active codes stored in the app store settings document, ensuring the request is secure and verified. [Confirmed] `` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|validateAppStoreActivationCode|#1` ``.
- **Internal Activation Code Lookup**: Performs internal array searches on the retrieved settings document to match the provided activation code. [Confirmed] `` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|validateInternally|#1` ``.
- **App Store Settings Document Administration**: Exposes basic document-level operations (get, save, delete) for the underlying Firestore settings document. [Confirmed] `` `source_class|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController` ``.

---

#### role

### Role and Composite Role Synchronization [Confirmed]
The capability synchronizes static role hierarchies defined in code (such as `composite_role.data.ts` and `composite_roles_translated.data.ts`) directly into Firestore. The synchronization process is triggered by the `onCreateCompositeRolesCalled` service method, which compares the file-defined roles against existing Firestore documents, saving new or updated roles and deleting obsolete ones `` `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (lines 53-102) ``.

### Hierarchical Dependency Resolution [Confirmed]
It manages parent-child relationships between composite roles and standard roles. When a composite role is created, updated, or deleted, the system automatically propagates these changes to dependent roles using `createorUpdateDependantRoles` and `deleteOrUpdateDependantRoles` to ensure the integrity of the hierarchy `` `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` (lines 51-143) ``.

### Consolidated Role Resolution & Permission Checking [Confirmed]
The capability resolves a flat list of consolidated permissions from a set of assigned composite roles using `buildConsolidatedRoles` `` `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts` (lines 16-39) ``. It also provides security utility methods like `checkUserPermissions` and `checkUserPermissionsSafe` to verify if a user's consolidated roles contain the required permissions `` `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts` (lines 48-57) ``.

### Organization User Role Generation [Confirmed]
It generates assigned roles for organization users via `generateOrganizationUserRoles`, mapping assigned roles with timestamps and assigner details `` `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts` (lines 80-109) ``.

### Exposing Role Configurations via API [Confirmed]
Exposes callable endpoints to retrieve all roles (`getAllRoles`), all composite roles (`getAllCompositeRoles`), and organization-specific composite roles (filtering out `v1.admin` roles via `getOrganizationCompositeRoles`) `` `functions/src/modules/settings/modules/role/index.ts` (lines 43-165) ``.

---

#### workflow

The `workflow` capability is split into two parallel tracks: Building Request Workflows and Organization Request Workflows. Its primary responsibilities include:

- **Building Request Workflow Management**:
  - Exposes CRUD operations (`create`, `delete`, `get`, `save`) via `OSKBuildingRequestWorkflowController` which extends the core document controller `` `controller_method|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController|create|#1` ``. [Confirmed]
  - Provides a callable HTTPS endpoint `onCreateBuildingRequestWorkflowsCalled` to batch-create building request workflows from provided data, enforcing App Check and user authentication `` `service_method|settings|functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts|OSKBuildingRequestWorkflowService|onCreateBuildingRequestWorkflowsCalled|#1` ``. [Confirmed]
  - Reacts to Firestore document lifecycle events (`onCreate`, `onUpdate`, `onDelete`) for building request workflows via `OSKBuildingRequestWorkflowService` `` `functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts` (lines 18-39) ``. [Confirmed]

- **Organization Request Workflow Management**:
  - Exposes CRUD operations (`create`, `delete`, `get`, `save`) via `OSKOrganizationRequestWorkflowController` `` `controller_method|settings|functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts|OSKOrganizationRequestWorkflowController|create|#1` ``. [Confirmed]
  - Provides a callable HTTPS endpoint `onCreateOrganizationRequestWorkflowsCalled` to batch-create organization request workflows, enforcing App Check and user authentication `` `service_method|settings|functions/src/modules/settings/modules/workflow/services/organization_request_workflow.service.ts|OSKOrganizationRequestWorkflowService|onCreateOrganizationRequestWorkflowsCalled|#1` ``. [Confirmed]
  - Reacts to Firestore document lifecycle events (`onCreate`, `onUpdate`, `onDelete`) for organization request workflows via `OSKOrganizationRequestWorkflowService` `` `functions/src/modules/settings/modules/workflow/services/organization_request_workflow.service.ts` (lines 18-39) ``. [Confirmed]

- **Data Modeling**:
  - Defines the data structures for workflows, including properties like `isoCountryCode` and `approvingOrganizationId` `` `model_property|settings|functions/src/modules/settings/modules/workflow/models/documents/building_request_workflow_document.model.ts|OSKBuildingRequestWorkflow|approvingOrganizationId|#1` ``. [Confirmed]

---

### 4. Public Interfaces

#### _module_root

### OSKSettingController
Extends `OSKDocumentController` to handle CRUD operations on settings documents `` `source_class|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController` ``. It exposes the following endpoints:
- `get(settingId)`: Retrieves a settings document `` `controller_method|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController|get|#1` ``.
- `create(settingId, data)`: Creates a settings document with a creation timestamp `` `controller_method|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController|create|#1` ``.
- `delete(settingId)`: Deletes a settings document `` `controller_method|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController|delete|#1` ``.

### OSKSettingService
Provides business logic for settings creation and validation `` `source_class|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService` ``. It exposes:
- `onCreateSettingsCalled(data, context)`: Validates App Check and authentication, then initializes settings with default roles `` `service_method|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService|onCreateSettingsCalled|#1` ``.

### Module Entry Points
- `getSettingsCallableFunction(functionBuilder)`: Aggregates and returns callable functions for settings, roles, and workflows `` `function_declaration|settings|functions/src/modules/settings/index.ts|getSettingsCallableFunction|#1` ``.
- `getSettingsFirestoreTriggers(functionBuilder)`: Aggregates and returns Firestore triggers for roles and workflows `` `function_declaration|settings|functions/src/modules/settings/index.ts|getSettingsFirestoreTriggers|#1` ``.

---

#### appstore

- **`OSKAppStoreSettingsController`**: A document controller extending `OSKDocumentController` that exposes endpoints to get, save, and delete the app store settings document under the `/settings` collection path. `functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts` (lines 9-27).
- **`OSKAppStoreSettingsService`**: A service class containing the core business logic for retrieving store information and validating activation codes. `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 23-99).

---

#### role

The capability exposes the following controllers and services:

- **`OSKCompositeRoleController`**: Manages Firestore operations for composite roles, including hierarchical updates `` `source_class|settings|functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts|OSKCompositeRoleController` ``.
- **`OSKRoleController`**: Manages Firestore operations for standard roles `` `source_class|settings|functions/src/modules/settings/modules/role/controllers/role.controller.model.ts|OSKRoleController` ``.
- **`OSKConsolidatedRolesController`**: Handles permission checks, role consolidation, and organization user role generation `` `source_class|settings|functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts|OSKConsolidatedRolesController` ``.
- **`OSKCompositeRoleService`**: Orchestrates composite role business logic, Firestore triggers, and synchronization `` `source_class|settings|functions/src/modules/settings/modules/role/services/composite_role.service.ts|OSKCompositeRoleService` ``.
- **`OSKRoleService`**: Orchestrates standard role business logic and triggers `` `source_class|settings|functions/src/modules/settings/modules/role/services/role.service.ts|OSKRoleService` ``.

---

#### workflow

This capability exposes the following controllers and service entry points:

- **Controllers**:
  - `OSKBuildingRequestWorkflowController` (defined in `functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts` `` `source_class|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController` ``): Manages direct document operations for building request workflows. [Confirmed]
  - `OSKOrganizationRequestWorkflowController` (defined in `functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts` `` `source_class|settings|functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts|OSKOrganizationRequestWorkflowController` ``): Manages direct document operations for organization request workflows. [Confirmed]

- **Entry Points**:
  - `getWorkflowFirestoreTriggers` (defined in `functions/src/modules/settings/modules/workflow/index.ts` `` `function_declaration|settings|functions/src/modules/settings/modules/workflow/index.ts|getWorkflowFirestoreTriggers|#1` ``): Registers and returns the Firestore triggers for both building and organization request workflows. [Confirmed]
  - `getWorkflowCallableFunction` (defined in `functions/src/modules/settings/modules/workflow/index.ts` `` `function_declaration|settings|functions/src/modules/settings/modules/workflow/index.ts|getWorkflowCallableFunction|#1` ``): Registers and returns the callable HTTPS functions for batch workflow creation. [Confirmed]

---

### 5. Internal Structure

*Note: This section describes only the intra-module coupling of the settings module.*

The `settings` module is structured into distinct submodules: `_module_root`, `role`, and `workflow` (with `appstore` also evidenced as a functional capability). The internal coupling graph reveals a clean, unidirectional delegation pattern:

- **`_module_root` to Submodules**: **Confirmed**. The `_module_root` acts as the primary orchestrator and entry point, importing and exposing functions from both the `role` and `workflow` submodules. Specifically, it imports `getRoleCallableFunction` and `getRoleFirestoreTriggers` from `@oskey/settings/role`, and `getWorkflowCallableFunction` and `getWorkflowFirestoreTriggers` from `@oskey/settings/workflow`.
- **Submodule Isolation**: **Confirmed**. The `role` and `workflow` submodules are completely decoupled from one another, sharing no direct intra-module dependencies or imports.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section presents the synthesis and judgment of data ownership across the module.*

The `settings` module is the authoritative owner of the `/settings` collection and its nested subcollections. Based on the data ownership hints and capability extracts, the ownership of specific paths is resolved as follows:

- **`/settings/{id}` (Generic Settings)**: **Inferred** owner is `_module_root`. It manages generic system-wide settings documents (such as roles and workflows initialization) via `OSKSettingController`.
- **`/settings/appstore`**: **Inferred** owner is the `appstore` capability. It manages the `activationCodes`, `creationDate`, and `stores` arrays. Although the `organization` and `user` modules read and validate these settings, they do so strictly through read-only interfaces (`OSKAppStoreSettingsService.getAppstoreInformation` and `OSKAppStoreSettingsController.get`), confirming that write authority remains isolated within `settings`.
- **`/settings/roles/compositeRoles/{compositeRoleId}` and `/setting/roles/roles/{roleId}`**: **Inferred** owner is the `role` submodule. It manages the master definitions of permissions and composite roles. While six other modules query this data to perform permission checks, they do so via the `OSKConsolidatedRolesController` utility, leaving data modification strictly to the `role` submodule.
- **`/settings/workflows/buildingRequests/{workflowId}` and `/setting/workflows/organizationRequest/{workflowId}`**: **Inferred** owner is the `workflow` submodule. It manages the lifecycle and configuration of approval workflows.

**Per-capability evidence:**

#### _module_root

### Firestore Paths
- **Path**: `/settings/{id}` (or `/settings/{settingId}`)
  - **Operations**:
    - `get` (Read) via `OSKSettingController.default._get` `` `call_expression|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController.default._get|get|'/settings',settingId|#1` ``. [Confirmed]
    - `create` (Write/Set) via `OSKSettingController.default._set` `` `call_expression|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController.default._set|create|'/settings',settingId,{ ...data, creationDate: ts }|#1` ``. [Confirmed]
    - `delete` (Delete) via `OSKSettingController.default._delete` `` `call_expression|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController.default._delete|delete|'/settings',settingId|#1` ``. [Confirmed]
  - **Model**: `OSKSetting` / `OSKSettingDocument` `` `type_alias|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|#1` ``, `` `type_alias|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSettingDocument|#1` ``.
    - **Fields**:
      - `viewRole`: *string* `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|viewRole|#1` ``
      - `createRole`: *string* `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|createRole|#1` ``
      - `editRole`: *string* `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|editRole|#1` ``
      - `deleteRole`: *string* `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|deleteRole|#1` ``
      - `adminCompositeRole`: *string* `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|adminCompositeRole|#1` ``

---

#### appstore

- **Firestore Path**: `/settings/{id}` (specifically the document with ID `appstore`). [Confirmed] `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 57, 77).
- **Fields Managed**:
  - `activationCodes`: *array* [Confirmed] `` `model_property|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreSettings|activationCodes|#1` ``.
  - `creationDate`: *timestamp* [Confirmed] `` `model_property|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreSettings|creationDate|#1` ``.
  - `stores`: *array* [Confirmed] `` `model_property|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreSettings|stores|#1` ``.
    - Individual store elements map to `OSKAppStoreInfo` containing `appleStoreName`, `appleStoreUrl`, `googleStoreName`, and `googleStoreUrl`. `functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts` (lines 27-31).

---

#### role

The capability owns and manages the following Firestore paths:

- **`/settings/roles/compositeRoles/{compositeRoleId}`**
  - **Operations**: Read, Write, Delete (via `OSKCompositeRoleController` and triggers)
  - **Operation Detection Scope**: `settings` (undetermined_may_be_indirect)
  - **Citations**: `` `firestore_path_touched|settings|functions/src/modules/settings/modules/role/index.ts|/settings/roles/compositeRoles/{compositeRoleId}|#1` ``, `` `firestore_path_touched|settings|functions/src/modules/settings/modules/role/index.ts|/settings/roles/compositeRoles/{compositeRoleId}|#2` ``, `` `firestore_path_touched|settings|functions/src/modules/settings/modules/role/index.ts|/settings/roles/compositeRoles/{compositeRoleId}|#3` ``.

- **`/setting/roles/roles/{roleId}`**
  - **Operations**: Read, Write, Delete (via `OSKRoleController` and triggers)
  - **Operation Detection Scope**: `settings` (undetermined_may_be_indirect)
  - **Citation**: `` `firestore_path_touched|settings|functions/src/modules/settings/modules/role/index.ts|/setting/roles/roles/{roleId}|#1` ``.

---

#### workflow

This capability owns and modifies documents under the following Firestore paths:

- **`/settings/workflows/buildingRequests/{workflowId}`** (also referenced as `/settings/workflows/buildingRequest` in the controller)
  - **Operation Detection Scope**: `undetermined_may_be_indirect` `` `firestore_path_touched|settings|functions/src/modules/settings/modules/workflow/index.ts|/settings/workflows/buildingRequests/{workflowId}|#1` ``. [Confirmed]
  - **Controller Operations**: Handled via `OSKBuildingRequestWorkflowController` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController.default._get|get|'/settings/workflows/buildingRequest',roleId|#1` ``. [Confirmed]

- **`/setting/workflows/organizationRequest/{workflowId}`** (also referenced as `/settings/workflows/organizationRequests` in the controller)
  - **Operation Detection Scope**: `undetermined_may_be_indirect` `` `firestore_path_touched|settings|functions/src/modules/settings/modules/workflow/index.ts|/setting/workflows/organizationRequest/{workflowId}|#1` ``. [Confirmed]
  - **Controller Operations**: Handled via `OSKOrganizationRequestWorkflowController` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts|this._get|get|'/settings/workflows/organizationRequests',roleId|#1` ``. [Confirmed]

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### API Contracts
- **Callable**: `onCreateSettingsCalled`
  - **File**: `functions/src/modules/settings/index.ts` (lines 17-51) `` `api_contract|settings|functions/src/modules/settings/index.ts|onCreateSettingsCalled|#1` ``
  - **Handler**: `OSKSettingService.onCreateSettingsCalled`
  - **Request/Response Schema**: No `api_contract` requestType/responseType resolved to any `model_property` facts in this evidence scope.

### Firestore Triggers
No Firestore triggers are directly declared in this capability, but `getSettingsFirestoreTriggers` aggregates triggers from `@oskey/settings/role` and `@oskey/settings/workflow` `` `call_expression|settings|functions/src/modules/settings/index.ts|getRoleFirestoreTriggers|getSettingsFirestoreTriggers|functionBuilder|#1` ``, `` `call_expression|settings|functions/src/modules/settings/index.ts|getWorkflowFirestoreTriggers|getSettingsFirestoreTriggers|functionBuilder|#1` ``. [Confirmed]

---

#### appstore

No direct `api_contract` facts or Firestore triggers are defined within this capability's evidence pack. 

However, the capability exposes the following controller and service methods that act as internal entry points:
- **`OSKAppStoreSettingsController.get(documentId)`**: Retrieves the settings document. `` `controller_method|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController|get|#1` ``.
- **`OSKAppStoreSettingsController.save(documentId, data)`**: Saves or updates the settings document. `` `controller_method|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController|save|#1` ``.
- **`OSKAppStoreSettingsController.delete(documentId)`**: Deletes the settings document. `` `controller_method|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController|delete|#1` ``.
- **`OSKAppStoreSettingsService.validateAppStoreActivationCode(request)`**: Validates an activation code. Accepts `OSKAppStoreActivationRequest` and returns `Promise<OSKAppStoreActivationResponse>`. `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 26-43).

---

#### role

### Callable APIs

#### `getAllCompositeRoles`
- **Request Type**: `void`
- **Response Type**: `OSKCompositeRoleDocument`
- **Description**: Retrieves all composite roles `` `api_contract|settings|functions/src/modules/settings/modules/role/index.ts|getAllCompositeRoles|#1` ``.

#### `getAllRoles`
- **Request Type**: `void`
- **Response Type**: `OSKRoleDocument`
- **Description**: Retrieves all standard roles `` `api_contract|settings|functions/src/modules/settings/modules/role/index.ts|getAllRoles|#1` ``.

#### `getOrganizationCompositeRoles`
- **Request Type**: `void`
- **Response Type**: `OSKCompositeRoleDocument`
- **Description**: Retrieves organization-scoped composite roles (excluding `v1.admin` roles) `` `api_contract|settings|functions/src/modules/settings/modules/role/index.ts|getOrganizationCompositeRoles|#1` ``.

#### `onCreateCompositeRolesCalled`
- **Request Type**: `void`
- **Response Type**: `void`
- **Description**: Trigger to initialize/synchronize roles from code to Firestore `` `api_contract|settings|functions/src/modules/settings/modules/role/index.ts|onCreateCompositeRolesCalled|#1` ``.

### Firestore Triggers

- **`onDocumentCreated` (Composite Roles)**: Triggered on creation of a composite role document. Calls `OSKCompositeRoleService.onDocumentCreated` `` `firestore_trigger|settings|functions/src/modules/settings/modules/role/index.ts|unknown|onDocumentCreated|#1` ``.
- **`onDocumentUpdated` (Composite Roles)**: Triggered on update of a composite role document. Calls `OSKCompositeRoleService.onDocumentUpdated` `` `firestore_trigger|settings|functions/src/modules/settings/modules/role/index.ts|unknown|onDocumentUpdated|#1` ``.
- **`onDocumentDeleted` (Composite Roles)**: Triggered on deletion of a composite role document. Calls `OSKCompositeRoleService.onDocumentDeleted` `` `firestore_trigger|settings|functions/src/modules/settings/modules/role/index.ts|unknown|onDocumentDeleted|#1` ``.
- **`onDocumentCreated` (Roles)**: Triggered on creation of a standard role document. Calls `OSKRoleService.onDocumentCreated` `` `firestore_trigger|settings|functions/src/modules/settings/modules/role/index.ts|unknown|onDocumentCreated|#2` ``.

---

#### workflow

#### API Contracts (Callable HTTPS Functions)
- **`onCreateBuildingRequestWorkflowsCalled`** `` `api_contract|settings|functions/src/modules/settings/modules/workflow/index.ts|onCreateBuildingRequestWorkflowsCalled|#1` ``
  - **Handler**: `OSKBuildingRequestWorkflowService.onCreateBuildingRequestWorkflowsCalled`
  - **Request/Response Schemas**: No resolved schemas matched within this pack.

- **`onCreateOrganizationRequestWorkflowsCalled`** `` `api_contract|settings|functions/src/modules/settings/modules/workflow/index.ts|onCreateOrganizationRequestWorkflowsCalled|#1` ``
  - **Handler**: `OSKOrganizationRequestWorkflowService.onCreateOrganizationRequestWorkflowsCalled`
  - **Request/Response Schemas**: No resolved schemas matched within this pack.

#### Firestore Triggers
- **Building Request Workflow Triggers** (registered on path `/settings/workflows/buildingRequests/{workflowId}`):
  - `onCreate` mapped to `OSKBuildingRequestWorkflowService.onDocumentCreated` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(buildingRequestWorkflowPath)             .onCreate|getWorkflowFirestoreTriggers|OSKBuildingRequestWorkflowService.onDocumentCreated|#1` ``. [Confirmed]
  - `onUpdate` mapped to `OSKBuildingRequestWorkflowService.onDocumentUpdated` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(buildingRequestWorkflowPath)             .onUpdate|getWorkflowFirestoreTriggers|OSKBuildingRequestWorkflowService.onDocumentUpdated|#1` ``. [Confirmed]
  - `onDelete` mapped to `OSKBuildingRequestWorkflowService.onDocumentDeleted` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(buildingRequestWorkflowPath)             .onDelete|getWorkflowFirestoreTriggers|OSKBuildingRequestWorkflowService.onDocumentDeleted|#1` ``. [Confirmed]

- **Organization Request Workflow Triggers** (registered on path `/setting/workflows/organizationRequest/{workflowId}`):
  - `onCreate` mapped to `OSKOrganizationRequestWorkflowService.onDocumentCreated` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(organizationRequestWorkflowPath)             .onCreate|getWorkflowFirestoreTriggers|OSKOrganizationRequestWorkflowService.onDocumentCreated|#1` ``. [Confirmed]
  - `onUpdate` mapped to `OSKOrganizationRequestWorkflowService.onDocumentUpdated` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(organizationRequestWorkflowPath)             .onUpdate|getWorkflowFirestoreTriggers|OSKOrganizationRequestWorkflowService.onDocumentUpdated|#1` ``. [Confirmed]
  - `onDelete` mapped to `OSKOrganizationRequestWorkflowService.onDocumentDeleted` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|db             .document(organizationRequestWorkflowPath)             .onDelete|getWorkflowFirestoreTriggers|OSKOrganizationRequestWorkflowService.onDocumentDeleted|#1` ``. [Confirmed]

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section highlights cross-cutting security risks, asymmetries, and unattributed security signals across the module's capabilities.*

#### Mental Enforcement Tally
- **`_module_root`**: Enforces App Check verification and user authentication on `onCreateSettingsCalled`. [Confirmed]
- **`appstore`**: Enforces App Check verification and parameter validation on `validateAppStoreActivationCode`. [Confirmed] No explicit RBAC permission checks are performed in code; it relies entirely on Firestore rules. [Inferred]
- **`role`**: Uses `v1.admin` to filter administrative roles when fetching organization-scoped composite roles. [Confirmed]
- **`workflow`**: Enforces App Check verification (conditional on emulator environment) and user authentication on `onCreateBuildingRequestWorkflowsCalled`. [Confirmed] Delegates CRUD authorization checks to the underlying `OSKDocumentController` by passing a dynamic `roleId`. [Inferred]

#### Security Asymmetries & Risks
- **Administrative Controller Exposure vs. Firestore Rules**: A significant security asymmetry exists in the `appstore` capability. The Firestore rules (`firestore.rules.txt`) allow any valid signed-in user (`isValidUser()`) to read and write to `/settings/{docId}`. However, the `OSKAppStoreSettingsController` exposes administrative `save` and `delete` methods. If there are no controller-level RBAC checks (e.g., restricting access to `v1.admin` or a specific settings permission), any authenticated user could potentially modify or delete global app store configurations. [Inferred]

#### Unattributed Security-Relevant Signals
- **`appstore`**: The `validateAppStoreActivationCode` service raises a `failed-precondition` error if App Check is missing, but performs no RBAC checks, relying on the caller's authenticated state alone. [Confirmed]
- **`workflow`**: The `OSKBuildingRequestWorkflowController` and `OSKOrganizationRequestWorkflowController` accept a dynamic `roleId` parameter for CRUD operations. However, the resolution and validation of this `roleId` against the user's actual consolidated roles are not explicitly defined or verified within the `workflow` capability itself, relying entirely on downstream delegation to `OSKDocumentController`. [Inferred]

**Per-capability evidence:**

#### _module_root

### Security Checks
The `onCreateSettingsCalled` function enforces App Check verification and user authentication:
- Logs an error if App Check is missing: `"Failed-precondition: The function must be called from an App Check verified app."` `` `call_expression|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService.logger.logError|onCreateSettingsCalled|'Failed-precondition: The function must be called from an App Check verified app.'|#1` ``. [Confirmed]
- Logs an error if the user is unauthenticated: `"Unauthenticated: You must be authenticated to use onCreateSettingsCalled()"` `` `call_expression|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService.logger.logError|onCreateSettingsCalled|'Unauthenticated: You must be authenticated to use onCreateSettingsCalled()'|#1` ``. [Confirmed]

### Dynamic Role Generation
The settings document model defines roles dynamically based on the setting name:
- `v1.admin.settings.${setting}.view`
- `v1.admin.settings.${setting}.create`
- `v1.admin.settings.${setting}.edit`
- `v1.admin.settings.${setting}.delete`
- `v1.admin.settings.${setting}.admin`

These are passed to `OSKSettingController.default.create` during `onCreateSettingsCalled` `` `call_expression|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingController.default.create|onCreateSettingsCalled|`${setting}s`,{                     viewRole: `v1.admin.settings.${setting}.view`,                     createRole: `v1.admin.settings.${setting}.create`,                     editRole: `v1.admin.settings.${setting}.edit`,                     deleteRole: `v1.admin.settings.${setting}.delete`,                     adminCompositeRole: `v1.admin.settings.${setting}.admin`,                 }|#1` ``. [Confirmed]

### RBAC Cross-Check
Cross-checking against the supplied RBAC roles document:
- The RBAC roles document contains permissions like `v1.admin.settings.role.create`, `v1.admin.settings.role.delete`, `v1.admin.settings.role.edit`, `v1.admin.settings.role.list`, `v1.admin.settings.role.view`, and `v1.admin.settings.workflow.create`, etc.
- The dynamic generation pattern matches these roles (e.g., if `setting` is `"role"`, it generates `v1.admin.settings.role.view`, etc., which matches the RBAC roles document). [Confirmed]

---

#### appstore

- **App Check Verification**: The activation code validation service strictly enforces that the incoming request must originate from a Firebase App Check verified application. If verification fails, it logs a `failed-precondition` error. [Confirmed] `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 28-33).
- **Parameter Validation**: Input parameters (specifically `activationCode`) are validated for correct type and presence using `OSKSecurityChecks.checkParameters`. [Confirmed] `` `call_expression|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKSecurityChecks.checkParameters|validateAppStoreActivationCode|[{ name: 'activationCode', value: request.activationCode, type: 'string' }]|#1` ``.
- **Firestore Rules Alignment**: According to the system's Firestore rules, write and read access to `/settings/{docId}` is allowed for any valid signed-in user (`isValidUser()`). `firestore.rules.txt` (lines 515-518). No specific RBAC permission strings are explicitly referenced in this capability's code.

---

#### role

### Permissions Referenced
- **`v1.admin`**: Used to filter out administrative roles when fetching organization-scoped composite roles `` `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (line 162) ``.
- **Composite Role Identifiers**: The capability defines and manages composite roles (e.g., `v1.admin.accessControlDevice.admin`, `v1.admin.building.admin`, `v1.org.admin`, `v1.org.user.admin`) which group individual leaf permissions defined in the RBAC roles document `` `functions/src/modules/settings/modules/role/data/composite_role.data.ts` ``.

### Cross-Check Against RBAC Roles Document
The composite roles defined in `composite_role.data.ts` (e.g., `v1.admin.accessControlDevice.admin`) act as containers for the individual leaf permissions listed in the RBAC roles document (e.g., `v1.admin.accessControlDevice.delete`, `v1.admin.accessControlDevice.edit`). There are no mismatches; the composite roles correctly group the individual permissions.

---

#### workflow

- **RBAC Roles**:
  - The controllers accept a dynamic `roleId` parameter when performing CRUD operations `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController.default._get|get|'/settings/workflows/buildingRequest',roleId|#1` ``. [Confirmed]
  - While the RBAC roles document defines workflow-specific permissions (such as `v1.admin.settings.workflow.create`, `v1.admin.settings.workflow.edit`, `v1.admin.settings.workflow.delete`, `v1.admin.settings.workflow.list`, and `v1.admin.settings.workflow.view`), these are not hardcoded directly within the capability's code but are expected to be passed dynamically as `roleId` to the underlying `OSKDocumentController` methods. [Inferred]
- **App Check & Authentication**:
  - App Check is conditionally enforced on callable functions based on the environment: `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR` `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|functionBuilder.runWith|getWorkflowCallableFunction|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``. [Confirmed]
  - Services explicitly log errors if unauthenticated requests or non-App Check verified requests attempt to execute the callable functions `` `call_expression|settings|functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts|OSKBuildingRequestWorkflowService.logger.logError|onCreateBuildingRequestWorkflowsCalled|'Failed-precondition: The function must be called from an App Check verified app.'|#1` ``. [Confirmed]

---

### 10. Cross-Module Relationships

The `settings` module maintains the following confirmed relationships with other modules in the repository, derived from AST import resolution and method-level call edges:

#### Outbound Dependencies
- **`core`**: **Confirmed**. The `settings` module depends heavily on `core` for base controller functionality, database abstraction, and logging.
  - Imports `OSKDocumentController` and `OSKDocument` to perform standard CRUD operations across all submodules.
  - Calls `OSKDocumentController._delete`, `_get`, `_set`, `_listDocuments`, `_query`, and `_update` to manage Firestore documents.
  - Calls `OSKLoggingService.logError` for centralized error reporting.

#### Inbound Dependencies
- **`admin`**: **Confirmed**. Imports `@oskey/settings/role` to call `OSKConsolidatedRolesController.checkUserPermissions` (23 call sites) to authorize administrative building, organization, and maintenance workflows.
- **`building`**: **Confirmed**. Imports `@oskey/settings/role` to call `OSKConsolidatedRolesController.checkUserPermissions` (19 call sites) and `checkUserPermissionsSafe` to validate resident and door access permissions.
- **`core`**: **Confirmed**. Imports `@oskey/settings/role` to call `OSKConsolidatedRolesController.checkUserPermissions` (3 call sites) to authorize secure file storage operations.
- **`organization`**: **Confirmed**. Imports `@oskey/settings/role` to call `OSKConsolidatedRolesController.checkUserPermissions` (53 call sites), `OSKCompositeRoleController.listDocuments`, and `OSKConsolidatedRolesController.generateOrganizationUserRoles` (3 call sites). Also calls `OSKAppStoreSettingsService.validateInternally` to validate onboarding inhabitants.
- **`supplier`**: **Confirmed**. Imports `@oskey/settings/role` to call `OSKConsolidatedRolesController.checkUserPermissions` (17 call sites) to authorize supplier staff access and activity logging.
- **`user`**: **Confirmed**. Imports `@oskey/settings/appstore` to call `OSKAppStoreSettingsService.getAppstoreInformation` and `OSKAppStoreSettingsController.get` during external invitation workflows. Also imports `@oskey/settings/role` to call `OSKConsolidatedRolesController.generateOrganizationUserRoles` and `OSKConsolidatedRolesController.checkUserPermissions` (6 call sites) for user settings management.

### 11. External Hooks

#### _module_root

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced within this capability's own pack. [Confirmed]

---

#### appstore

- **Firebase App Check**: Integrates with Firebase App Check as a security boundary to verify client app authenticity before validating activation codes. [Confirmed] `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 28-33).
- **App Store Redirection Links**: References external URLs for the Apple App Store and Google Play Store. [Confirmed] `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 88-95).

---

#### role

No external hooks (such as `external_hook`, `pubsub_topic`, `pubsub_publish_call`, `http_or_client_path`, `environment_variable`, or `storage_path`) are evidenced within this capability's pack.

---

#### workflow

- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR` is used to determine whether to enforce App Check verification `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|functionBuilder.runWith|getWorkflowCallableFunction|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``. [Confirmed]
- No other external hooks (such as Pub/Sub topics, external HTTP integrations, or Cloud Storage paths) are evidenced within this capability's pack. [Confirmed]

---

### 12. Architectural Observations

- **Centralized Authorization Decoupling**: The module successfully centralizes the platform's RBAC evaluation. By exposing `OSKConsolidatedRolesController.checkUserPermissions`, it prevents functional modules from needing to understand or traverse nested role hierarchies, promoting a clean separation of concerns. [Confirmed]
- **High Inbound Coupling (Single Point of Failure)**: The `role` submodule is the most heavily coupled component in the entire repository, with over 120 confirmed inbound call sites across 6 different modules. Any latency, database contention, or failure in the role resolution logic will immediately degrade or halt authorization checks across the entire platform. [Confirmed]
- **Base Controller Inheritance**: The module relies extensively on inheriting from `OSKDocumentController` in the `core` module. While this minimizes boilerplate code for standard CRUD operations, it tightly couples the settings lifecycle to the core document controller's implementation. [Confirmed]

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Cross-Cutting Path Naming Discrepancies**: There are inconsistent collection path references across different submodules and layers, which introduces a high risk of silent failures in Firestore triggers or document routing:
  - **Role Path Mismatch**: The `role` submodule triggers register on `/setting/roles/roles/{roleId}` (singular `setting`), whereas the general schema and standard conventions use `/settings/roles/roles/{roleId}` (plural `settings`). [Confirmed]
  - **Workflow Path Mismatch**: The `workflow` triggers register on `/settings/workflows/buildingRequests/{workflowId}` (plural `buildingRequests`) and `/setting/workflows/organizationRequest/{workflowId}` (singular `setting` and `organizationRequest`). However, the controllers route requests to `/settings/workflows/buildingRequest` (singular) and `/settings/workflows/organizationRequests` (plural). [Confirmed]
- **Unprotected Administrative Endpoints**: The `appstore` controller exposes `save` and `delete` methods, but the Firestore rules allow any authenticated user (`isValidUser()`) write access to `/settings/{docId}`. If there are no controller-level RBAC checks, any signed-in user could potentially overwrite or delete global app store configurations. [Inferred]
- **Dynamic Role Validation**: It is unknown how the dynamic `roleId` parameter accepted by the `workflow` controllers is validated against the calling user's actual permissions before executing database writes. [Unknown]

**Per-capability open questions:**

#### _module_root

- What specific settings types (other than `role` and `workflow`) are initialized via `onCreateSettingsCalled`? The code uses a dynamic template string `` `${setting}s` `` and `` `v1.admin.settings.${setting}.*` ``, but the exact list of supported settings is not fully detailed in this pack's evidence. [Inferred]
- How is the `OSKDocumentController`'s authorization check configured for the `OSKSettingController`? The controller methods call super/internal methods, but the exact permission checks applied to `get`, `create`, and `delete` in `OSKSettingController` are not visible in this pack. [Inferred]

#### appstore

- **Activation Code Generation**: How are the activation codes populated or generated in the `/settings/appstore` document? The evidence pack only shows validation and retrieval, not the creation or management of these codes.
- **Access Control on Controller**: The controller exposes `save` and `delete` methods for the `/settings` document. While the Firestore rules allow any valid user to write to `/settings/{docId}`, it is unclear if there is additional controller-level middleware or RBAC checks restricting these administrative actions to Oskey Administrators.

#### role

- **Context Object Structure**: The exact structure of the `context` object passed to `OSKSecurityChecks.user_security_checks` is not fully detailed in this capability's evidence pack.
- **Firestore Path Pluralization**: There is a minor discrepancy in the path references between `/setting/roles/roles/{roleId}` `` `firestore_path_touched|settings|functions/src/modules/settings/modules/role/index.ts|/setting/roles/roles/{roleId}|#1` `` and `/settings/roles/roles/{roleId}` (implied by the module name and general schema). It is unclear if this is a typo in the path reference or an intentional singular collection name.

#### workflow

- **Path Naming Discrepancies**: There is a slight naming discrepancy between the Firestore paths touched in the triggers (`/settings/workflows/buildingRequests/{workflowId}` and `/setting/workflows/organizationRequest/{workflowId}`) `` `firestore_path_touched|settings|functions/src/modules/settings/modules/workflow/index.ts|/settings/workflows/buildingRequests/{workflowId}|#1` `` and the paths used in the controllers (`/settings/workflows/buildingRequest` and `/settings/workflows/organizationRequests`) `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController.default._get|get|'/settings/workflows/buildingRequest',roleId|#1` ``. It is unclear if this is intentional or a potential bug. [Unknown]
- **Dynamic Role Resolution**: It is not fully clear from the isolated evidence how the `roleId` parameter passed to the controllers is resolved or validated against the user's actual permissions before executing document operations. [Unknown]
- **Workflow Data Structure**: The exact structure of the workflow data (beyond `isoCountryCode` and `approvingOrganizationId`) is not fully detailed in the model properties. [Unknown]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.