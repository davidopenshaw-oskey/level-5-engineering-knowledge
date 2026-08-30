### 0. Generation Metadata

- **runId**: `20260829_081559-00e1d9fd`
- **generatedAt**: `2026-08-29T13:36:03.116Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `settings`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `settings` module serves as the central administrative, authorization, and configuration engine for the Oskey platform. It manages the definition, translation, and hierarchical consolidation of Role-Based Access Control (RBAC) roles and composite roles, providing the core permission-evaluation engine used across all other platform modules. Additionally, the module orchestrates global system configurations, including mobile app store metadata, activation codes, and administrative approval workflows for building and organization registration requests. **Confirmed**.

### 2. Architectural Position

The `settings` module occupies a foundational, cross-cutting position in the platform architecture. It sits directly above the `core` module and acts as a critical runtime dependency for almost all other functional modules (`admin`, `building`, `organization`, `supplier`, and `user`). Rather than executing business workflows directly, it provides the underlying security and configuration fabric—specifically through the `role` submodule's permission-checking controllers—that other modules call to authorize their own operations. **Confirmed**.

### 3. Primary Responsibilities

#### _module_root

- **Settings Document Creation**: Dynamically provisions settings documents (e.g., for roles or workflows) with predefined permission strings (`viewRole`, `createRole`, `editRole`, `deleteRole`, `adminCompositeRole`) in the Firestore `/settings` collection. [Confirmed] `` `functions/src/modules/settings/services/setting.service.ts` (lines 17-51) ``
- **Settings Document CRUD Operations**: Exposes underlying controller methods to get, create, and delete settings documents by extending the core document controller. [Confirmed] `` `functions/src/modules/settings/controllers/setting.controller.ts` (lines 12-34) ``
- **Submodule Trigger & Callable Aggregation**: Consolidates and exports Firestore triggers and callable functions from sibling submodules (`role` and `workflow`) to the module's root entry point. [Confirmed] `` `functions/src/modules/settings/index.ts` (lines 23-37) ``
- **Security & App Check Enforcement**: Validates that incoming callable requests are authenticated and verified via Firebase App Check before executing administrative settings creation. [Confirmed] `` `functions/src/modules/settings/services/setting.service.ts` (lines 17-51) ``

---

#### appstore

- **Retrieve App Store Information**: Parses and returns Apple and Google store names and URLs from the database [Confirmed] (`` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|getAppstoreInformation|#1` ``).
- **Validate Activation Codes**: Validates incoming activation codes against stored store configurations [Confirmed] (`` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|validateAppStoreActivationCode|#1` ``).
- **App Check Verification**: Enforces that requests are made from App Check verified applications [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService.logger.logError|validateAppStoreActivationCode|'failed-precondition: The function must be called from an App Check verified app.'|#1` ``).
- **Manage App Store Settings Document**: Provides CRUD operations (get, save, delete) on the `/settings/appstore` Firestore document [Confirmed] (`` `source_class|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController` ``).

---

#### role

### Managing Role Definitions
The capability provides CRUD operations for individual granular roles (`OSKRole`) stored in Firestore under `/settings/roles/roles` [Confirmed]. This is managed by `OSKRoleController` `` `controller_method|settings|functions/src/modules/settings/modules/role/controllers/role.controller.model.ts|OSKRoleController|create|#1` ``.

### Managing Composite Roles
It supports the creation and management of composite roles (`OSKCompositeRole`), which are logical groupings of other roles or composite roles [Confirmed]. These are stored in Firestore under `/settings/roles/compositeRoles` and managed by `OSKCompositeRoleController` `` `controller_method|settings|functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts|OSKCompositeRoleController|create|#1` ``.

### Maintaining Role Hierarchies & Dependency Resolution
When a composite role or role is updated or deleted, the system automatically propagates these changes to any dependent parent composite roles [Confirmed]. This ensures the integrity of the hierarchical tree structure [Confirmed].
- **Adding/Updating Dependencies**: Handled by `createorUpdateDependantRoles` `` `controller_method|settings|functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts|OSKCompositeRoleController|createorUpdateDependantRoles|#1` ``.
- **Removing Dependencies**: Handled by `deleteOrUpdateDependantRoles` `` `controller_method|settings|functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts|OSKCompositeRoleController|deleteOrUpdateDependantRoles|#1` ``.

### Role Consolidation
The capability resolves a flat list of granular permissions from nested composite role hierarchies for a user or organization [Confirmed]. This is executed by `OSKConsolidatedRolesController.buildConsolidatedRoles` `` `controller_method|settings|functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts|OSKConsolidatedRolesController|buildConsolidatedRoles|#1` ``.

### Permission Verification
It provides utility methods to verify if a user possesses specific permissions based on their consolidated roles [Confirmed].
- **Permission Checking**: Handled by `checkUserPermissions` and `checkUserPermissionsSafe` `` `controller_method|settings|functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts|OSKConsolidatedRolesController|checkUserPermissions|#1` ``.

### Organization User Role Mapping
It maps and assigns roles to organization users, ensuring that the assigned roles are valid composite roles within the system [Confirmed]. This is handled by `generateOrganizationUserRoles` `` `controller_method|settings|functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts|OSKConsolidatedRolesController|generateOrganizationUserRoles|#1` ``.

### Static Role Synchronization
The capability processes static role definitions and translations (e.g., `composite_roles_translated.data.ts`) and synchronizes them into Firestore on demand [Confirmed]. This is executed via `onCreateCompositeRolesCalled` `` `service_method|settings|functions/src/modules/settings/modules/role/services/composite_role.service.ts|OSKCompositeRoleService|onCreateCompositeRolesCalled|#1` ``.

#### workflow

- **Building Request Workflow Management**: Provides controllers and services to create, save, retrieve, and delete building request workflows `` `functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts` (lines 22-40) ``. [Confirmed]
- **Organization Request Workflow Management**: Provides controllers and services to create, save, retrieve, and delete organization request workflows `` `functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts` (lines 22-40) ``. [Confirmed]
- **Bulk/Programmatic Workflow Creation**: Exposes callable HTTPS endpoints to programmatically initialize building and organization request workflows from predefined data `` `api_contract|settings|functions/src/modules/settings/modules/workflow/index.ts|onCreateBuildingRequestWorkflowsCalled|#1` `` and `` `api_contract|settings|functions/src/modules/settings/modules/workflow/index.ts|onCreateOrganizationRequestWorkflowsCalled|#1` ``. [Confirmed]
- **Firestore Trigger Orchestration**: Listens to document lifecycle events (`onCreate`, `onUpdate`, `onDelete`) on workflow collections to execute downstream business logic `` `functions/src/modules/settings/modules/workflow/index.ts` (lines 36-58) ``. [Confirmed]

---

### 4. Public Interfaces

#### _module_root

- **`OSKSettingController` (Controller)**: Extends `OSKDocumentController` to provide direct database access methods (`get`, `create`, `delete`) for settings documents. [Confirmed] `` `source_class|settings|functions/src/modules/settings/controllers/setting.controller.ts|OSKSettingController` ``
- **`OSKSettingService` (Service)**: Contains the business logic for handling settings creation requests, performing authentication checks, and logging errors. [Confirmed] `` `source_class|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService` ``
- **`getSettingsCallableFunction` (Entry Point)**: A module-level function that registers the `onCreateSettingsCalled` HTTPS callable function with App Check enforcement. [Confirmed] `` `function_declaration|settings|functions/src/modules/settings/index.ts|getSettingsCallableFunction|#1` ``
- **`getSettingsFirestoreTriggers` (Entry Point)**: A module-level function that aggregates and exports Firestore triggers from the `role` and `workflow` submodules. [Confirmed] `` `function_declaration|settings|functions/src/modules/settings/index.ts|getSettingsFirestoreTriggers|#1` ``

---

#### appstore

- **`OSKAppStoreSettingsController`** (extends `OSKDocumentController`): Exposes `get`, `save`, and `delete` methods to manage the app store settings document [Confirmed] (`` `source_class|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController` ``).
- **`OSKAppStoreSettingsService`**: Exposes business logic methods `validateAppStoreActivationCode`, `validateInternally`, and `getAppstoreInformation` [Confirmed] (`` `source_class|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService` ``).

---

#### role

### Controllers
- **`OSKCompositeRoleController`** (extends `OSKDocumentController`): Exposes methods for managing composite roles, including `create`, `save`, `get`, `getAll`, `listDocuments`, `updateParentCompositeRoles`, `createorUpdateDependantRoles`, and `deleteOrUpdateDependantRoles` `` `source_class|settings|functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts|OSKCompositeRoleController` ``. [Confirmed]
- **`OSKRoleController`** (extends `OSKDocumentController`): Exposes methods for managing individual roles, including `create`, `save`, `get`, `getAll`, `listDocuments`, and `updateParentCompositeRoles` `` `source_class|settings|functions/src/modules/settings/modules/role/controllers/role.controller.model.ts|OSKRoleController` ``. [Confirmed]
- **`OSKConsolidatedRolesController`**: Exposes methods for role consolidation and permission validation, including `buildConsolidatedRoles`, `checkUserPermissions`, `checkUserPermissionsSafe`, and `generateOrganizationUserRoles` `` `source_class|settings|functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts|OSKConsolidatedRolesController` ``. [Confirmed]

### Services
- **`OSKCompositeRoleService`**: Orchestrates business logic for composite roles, handling Firestore triggers and callable functions `` `source_class|settings|functions/src/modules/settings/modules/role/services/composite_role.service.ts|OSKCompositeRoleService` ``. [Confirmed]
- **`OSKRoleService`**: Orchestrates business logic for individual roles, handling Firestore triggers and callable functions `` `source_class|settings|functions/src/modules/settings/modules/role/services/role.service.ts|OSKRoleService` ``. [Confirmed]

#### workflow

- **`OSKBuildingRequestWorkflowController`**: Extends `OSKDocumentController` to expose standard document operations (`get`, `save`, `create`, `delete`) for building request workflows `` `source_class|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController` ``.
- **`OSKOrganizationRequestWorkflowController`**: Extends `OSKDocumentController` to expose standard document operations (`get`, `save`, `create`, `delete`) for organization request workflows `` `source_class|settings|functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts|OSKOrganizationRequestWorkflowController` ``.
- **`OSKBuildingRequestWorkflowService`**: Orchestrates the business logic for building request workflows, handling both the callable API entry point and Firestore document triggers `` `source_class|settings|functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts|OSKBuildingRequestWorkflowService` ``.
- **`OSKOrganizationRequestWorkflowService`**: Orchestrates the business logic for organization request workflows, handling both the callable API entry point and Firestore document triggers `` `source_class|settings|functions/src/modules/settings/modules/workflow/services/organization_request_workflow.service.ts|OSKOrganizationRequestWorkflowService` ``.

---

### 5. Internal Structure

*Note: This section contains only the cross-submodule coupling analysis derived from AST import resolution.*

The internal structure of the `settings` module is organized into a flat set of submodules coordinated by the module root:
- **`_module_root`** maintains outbound coupling to both sibling submodules, importing `getRoleCallableFunction` and `getRoleFirestoreTriggers` from `@oskey/settings/role` [Confirmed], and `getWorkflowCallableFunction` and `getWorkflowFirestoreTriggers` from `@oskey/settings/workflow` [Confirmed].
- **`role`** and **`workflow`** operate as independent submodules with no direct horizontal coupling between them [Confirmed].
- **`appstore`** operates as an isolated submodule, exposing services and controllers that are consumed directly by external modules (such as `user` and `organization`) rather than being coupled to internal sibling submodules [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains only the cross-cutting data ownership conclusion.*

The `settings` module is the sole system of record and authoritative owner of the `/settings` collection and all of its nested sub-collections. 

Based on the platform's data ownership signals, the submodules within `settings` maintain strict ownership boundaries over their respective paths:
- The `role` submodule owns the RBAC definitions stored in `/settings/roles/compositeRoles` and `/setting/roles/roles` [Confirmed].
- The `workflow` submodule owns the approval rules stored in `/settings/workflows/buildingRequests` and `/setting/workflows/organizationRequest` [Confirmed].
- The `appstore` submodule owns the store URLs and activation codes stored in `/settings/appstore` [Confirmed].

While external modules heavily query these paths—specifically the `user` module retrieving store URLs and the `organization` module validating activation codes—they do so strictly as read-only consumers. The write paths and schema definitions for all documents under `/settings` are exclusively owned and managed by the `settings` module. **Inferred**.

**Per-capability evidence:**

#### _module_root

### Firestore Paths
- **`/settings/{settingId}`**
  - **Operations**: Read (`get`), Write (`create`/`_set`), Delete (`delete`/`_delete`) [Confirmed] `` `functions/src/modules/settings/controllers/setting.controller.ts` (lines 19-33) ``
  - **Description**: Stores configuration documents defining administrative roles.
  - **Document Schema (`OSKSetting`)**:
    - `viewRole`: *string* [Confirmed] `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|viewRole|#1` ``
    - `createRole`: *string* [Confirmed] `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|createRole|#1` ``
    - `editRole`: *string* [Confirmed] `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|editRole|#1` ``
    - `deleteRole`: *string* [Confirmed] `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|deleteRole|#1` ``
    - `adminCompositeRole`: *string* [Confirmed] `` `model_property|settings|functions/src/modules/settings/models/documents/setting_document.model.ts|OSKSetting|adminCompositeRole|#1` ``

---

#### appstore

- **Firestore Path**: `/settings/{documentId}` where `documentId` is `'appstore'` [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController.default._get|get|'/settings',documentId|#1` `` and `` `call_expression|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsController.default.get|getAppstoreInformation|'appstore'|#1` ``).
- **Document Schema (`OSKAppStoreSettings`)**:
  - `stores`: Array of store configurations [Confirmed] (`` `model_property|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreSettings|stores|#1` ``).
  - `activationCodes`: Array of activation codes [Confirmed] (`` `model_property|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreSettings|activationCodes|#1` ``).
  - `creationDate`: Timestamp of creation [Confirmed] (`` `model_property|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreSettings|creationDate|#1` ``).

---

#### role

### Firestore Paths
The capability owns and directly writes to the following Firestore collections:
- **`/settings/roles/compositeRoles/{compositeRoleId}`** [Confirmed]
  - Touch Type: `path_reference` `` `firestore_path_touched|settings|functions/src/modules/settings/modules/role/index.ts|/settings/roles/compositeRoles/{compositeRoleId}|#1` ``
  - Operation Detection Scope: `undetermined_may_be_indirect`
- **`/setting/roles/roles/{roleId}`** [Confirmed]
  - Touch Type: `path_reference` `` `firestore_path_touched|settings|functions/src/modules/settings/modules/role/index.ts|/setting/roles/roles/{roleId}|#1` ``
  - Operation Detection Scope: `undetermined_may_be_indirect`

*Note: The schema map lists `/settings/{id}/compositeRoles` and `/settings/{id}/roles` which structurally match `/settings/roles/compositeRoles/{compositeRoleId}` and `/settings/roles/roles/{roleId}` when `{id}` is resolved to `"roles"` [Inferred].*

#### workflow

#### Firestore Paths
- **`/settings/workflows/buildingRequests/{workflowId}`** (also referenced as `'/settings/workflows/buildingRequest'`)
  - **Touch Type**: Path reference, read, write `` `firestore_path_touched|settings|functions/src/modules/settings/modules/workflow/index.ts|/settings/workflows/buildingRequests/{workflowId}|#1` `` and `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/building_request_workflow.controller.ts|OSKBuildingRequestWorkflowController.default._get|get|'/settings/workflows/buildingRequest',roleId|#1` ``.
  - **Operation Detection Scope**: Undetermined (may be indirect).
- **`/setting/workflows/organizationRequest/{workflowId}`** (also referenced as `'/settings/workflows/organizationRequests'`)
  - **Touch Type**: Path reference, read, write `` `firestore_path_touched|settings|functions/src/modules/settings/modules/workflow/index.ts|/setting/workflows/organizationRequest/{workflowId}|#1` `` and `` `call_expression|settings|functions/src/modules/settings/modules/workflow/controllers/organization_request_workflow.contoller.ts|this._get|get|'/settings/workflows/organizationRequests',roleId|#1` ``.
  - **Operation Detection Scope**: Undetermined (may be indirect).

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable API Contracts
- **`onCreateSettingsCalled`**
  - **File**: `functions/src/modules/settings/index.ts` (lines 17-51) [Confirmed] `` `api_contract|settings|functions/src/modules/settings/index.ts|onCreateSettingsCalled|#1` ``
  - **Trigger Type**: HTTPS Callable
  - **Request/Response Schemas**: No resolved schemas matched within this pack.

### Firestore Triggers
- **`getSettingsFirestoreTriggers`**
  - **File**: `functions/src/modules/settings/index.ts` (lines 23-28) [Confirmed] `` `function_declaration|settings|functions/src/modules/settings/index.ts|getSettingsFirestoreTriggers|#1` ``
  - **Description**: Aggregates and returns Firestore triggers from the `role` and `workflow` submodules. [Confirmed] `` `call_expression|settings|functions/src/modules/settings/index.ts|getRoleFirestoreTriggers|getSettingsFirestoreTriggers|functionBuilder|#1` ``, `` `call_expression|settings|functions/src/modules/settings/index.ts|getWorkflowFirestoreTriggers|getSettingsFirestoreTriggers|functionBuilder|#1` ``

---

#### appstore

- **API Contracts**: No `api_contract` facts matched within this pack [Confirmed].
- **Firestore Triggers**: No Firestore triggers are evidenced in this pack [Confirmed].

### Request/Response Models
- **`OSKAppStoreActivationRequest`**: `{ activationCode: string }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/functions/app_store_settings_request.model.ts|OSKAppStoreActivationRequest|#1` ``).
- **`OSKAppStoreActivationResponse`**: `{ isRecordFound: boolean, activationCode: string, appStoreDocument: OSKAppStoreSettings }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/functions/app_store_settings_request.model.ts|OSKAppStoreActivationResponse|#1` ``).

---

#### role

### API Contracts (Callable Functions)

#### `getAllCompositeRoles`
- **File**: `functions/src/modules/settings/modules/role/index.ts` (line 56) `` `api_contract|settings|functions/src/modules/settings/modules/role/index.ts|getAllCompositeRoles|#1` ``
- **Request Type**: `any` [Inferred]
- **Response Type**: `OSKCompositeRoleDocument` [Confirmed]
  - `creationDate`: `Timestamp`

#### `getAllRoles`
- **File**: `functions/src/modules/settings/modules/role/index.ts` (line 55) `` `api_contract|settings|functions/src/modules/settings/modules/role/index.ts|getAllRoles|#1` ``
- **Request Type**: `any` [Inferred]
- **Response Type**: `OSKRoleDocument` [Confirmed]
  - `creationDate`: `Timestamp`
  - `modificationDate`: `Timestamp`

#### `getOrganizationCompositeRoles`
- **File**: `functions/src/modules/settings/modules/role/index.ts` (line 57) `` `api_contract|settings|functions/src/modules/settings/modules/role/index.ts|getOrganizationCompositeRoles|#1` ``
- **Request Type**: `any` [Inferred]
- **Response Type**: `OSKCompositeRoleDocument` [Confirmed]
  - `creationDate`: `Timestamp`

#### `onCreateCompositeRolesCalled`
- **File**: `functions/src/modules/settings/modules/role/index.ts` (line 54) `` `api_contract|settings|functions/src/modules/settings/modules/role/index.ts|onCreateCompositeRolesCalled|#1` ``
- **Request Type**: `any` [Inferred]
- **Response Type**: `any` [Inferred]

---

### Firestore Triggers

#### Composite Role Triggers
- **Path**: `/settings/roles/compositeRoles/{compositeRoleId}`
- **`onDocumentCreated`**: Triggered when a new composite role is created; saves the document and updates dependencies `` `firestore_trigger|settings|functions/src/modules/settings/modules/role/index.ts|unknown|onDocumentCreated|#1` ``. [Confirmed]
- **`onDocumentUpdated`**: Triggered when a composite role is updated; updates dependent parent composite roles `` `firestore_trigger|settings|functions/src/modules/settings/modules/role/index.ts|unknown|onDocumentUpdated|#1` ``. [Confirmed]
- **`onDocumentDeleted`**: Triggered when a composite role is deleted; cleans up dependent parent composite roles `` `firestore_trigger|settings|functions/src/modules/settings/modules/role/index.ts|unknown|onDocumentDeleted|#1` ``. [Confirmed]

#### Role Triggers
- **Path**: `/setting/roles/roles/{roleId}`
- **`onDocumentCreated`**: Triggered when a new role is created; saves the role document `` `firestore_trigger|settings|functions/src/modules/settings/modules/role/index.ts|unknown|onDocumentCreated|#2` ``. [Confirmed]

#### workflow

#### Callable APIs
- **`onCreateBuildingRequestWorkflowsCalled`** `` `api_contract|settings|functions/src/modules/settings/modules/workflow/index.ts|onCreateBuildingRequestWorkflowsCalled|#1` ``
  - **Type**: Callable
  - **Handler**: `OSKBuildingRequestWorkflowService.onCreateBuildingRequestWorkflowsCalled`
  - **Request/Response Schemas**: No matching `model_property` facts resolved within this pack.
- **`onCreateOrganizationRequestWorkflowsCalled`** `` `api_contract|settings|functions/src/modules/settings/modules/workflow/index.ts|onCreateOrganizationRequestWorkflowsCalled|#1` ``
  - **Type**: Callable
  - **Handler**: `OSKOrganizationRequestWorkflowService.onCreateOrganizationRequestWorkflowsCalled`
  - **Request/Response Schemas**: No matching `model_property` facts resolved within this pack.

#### Firestore Triggers
- **Building Request Workflow Triggers** `` `functions/src/modules/settings/modules/workflow/index.ts` (lines 39-45) ``
  - **Path**: `/settings/workflows/buildingRequests/{workflowId}`
  - **Events**:
    - `onCreate` -> Calls `OSKBuildingRequestWorkflowService.onDocumentCreated`
    - `onUpdate` -> Calls `OSKBuildingRequestWorkflowService.onDocumentUpdated`
    - `onDelete` -> Calls `OSKBuildingRequestWorkflowService.onDocumentDeleted`
- **Organization Request Workflow Triggers** `` `functions/src/modules/settings/modules/workflow/index.ts` (lines 48-54) ``
  - **Path**: `/setting/workflows/organizationRequest/{workflowId}`
  - **Events**:
    - `onCreate` -> Calls `OSKOrganizationRequestWorkflowService.onDocumentCreated`
    - `onUpdate` -> Calls `OSKOrganizationRequestWorkflowService.onDocumentUpdated`
    - `onDelete` -> Calls `OSKOrganizationRequestWorkflowService.onDocumentDeleted`

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains only cross-cutting security and risk comparisons across capabilities.*

An active comparison of the security postures across the submodules reveals several key patterns and asymmetries:

- **Mental Enforcement Tally**:
  - `_module_root`: Enforces App Check and Authentication. Dynamically generates permission strings.
  - `role`: Enforces Authentication via `OSKUserSecurityChecks` and `OSKSecurityChecks.user_security_checks`. Throws explicit `permission-denied` errors.
  - `workflow`: Enforces explicit RBAC roles (`v1.admin.settings.workflow.create`, etc.) via the base `OSKDocumentController`. Enforces App Check and Authentication.
  - `appstore`: Enforces App Check and parameter validation. *No explicit RBAC permission checks are enforced on its endpoints.*

- **Asymmetric Security Posture**:
  While the `role` and `workflow` submodules are heavily guarded by explicit RBAC checks and user security decorators, the `appstore` submodule lacks any RBAC permission string enforcement on its controller endpoints (e.g., `OSKAppStoreSettingsController`). Although protected by App Check, the absence of user-role validation on a document containing sensitive activation codes represents a significant security asymmetry. **Inferred**.

- **Unattributed Security-Relevant Signals**:
  The `role` capability's `OSKConsolidatedRolesController` raises `permission-denied` errors (at least 1 explicit occurrence in the controller model) when consolidating or validating user permissions. Because these checks are performed dynamically by resolving nested composite roles, the exact permission string being violated is resolved at runtime, making static analysis of the authorization failure path difficult. **Inferred**.

- **RBAC Schema Mismatches**:
  The `_module_root` dynamically constructs administrative permission strings (e.g., `v1.admin.settings.role.admin`, `v1.admin.settings.workflow.admin`). While these composite admin roles are structurally defined in the Firestore schema, they are not explicitly listed as individual permission strings in the canonical `rbac-roles.json` table, which only defines granular permissions (e.g., `v1.admin.settings.role.create`). **Inferred**.

**Per-capability evidence:**

#### _module_root

- **Dynamic Permission Generation**:
  - The `onCreateSettingsCalled` function dynamically constructs permission strings based on the `setting` parameter (e.g., `"role"`, `"workflow"`):
    - `v1.admin.settings.${setting}.view` [Confirmed]
    - `v1.admin.settings.${setting}.create` [Confirmed]
    - `v1.admin.settings.${setting}.edit` [Confirmed]
    - `v1.admin.settings.${setting}.delete` [Confirmed]
    - `v1.admin.settings.${setting}.admin` [Confirmed]
  - *RBAC Cross-Check*: These dynamically generated strings map directly to the valid permissions defined in the RBAC roles document (e.g., `v1.admin.settings.role.create`, `v1.admin.settings.workflow.view`). However, the composite admin roles (e.g., `v1.admin.settings.role.admin`) are referenced in the Firestore schema but are not explicitly listed as individual permission strings in the `rbac-roles.json` table. [Inferred] `` `functions/src/modules/settings/services/setting.service.ts` (lines 32-38) ``
- **App Check & Authentication Guardrails**:
  - Enforces Firebase App Check verification unless running in the local emulator (`process.env.OSK_FIREBASE_EMULATOR`). [Confirmed] `` `call_expression|settings|functions/src/modules/settings/index.ts|functionBuilder.runWith|getSettingsCallableFunction|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``
  - Rejects unauthenticated requests with an explicit error log. [Confirmed] `` `call_expression|settings|functions/src/modules/settings/services/setting.service.ts|OSKSettingService.logger.logError|onCreateSettingsCalled|'Unauthenticated: You must be authenticated to use onCreateSettingsCalled()'|#1` ``

---

#### appstore

- **RBAC Permissions**: No specific RBAC permission strings are referenced in the provided facts for this capability [Confirmed].
- **Security Checks**:
  - App Check verification is enforced in `validateAppStoreActivationCode` [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService.logger.logError|validateAppStoreActivationCode|'failed-precondition: The function must be called from an App Check verified app.'|#1` ``).
  - Parameter validation is performed using `OSKSecurityChecks.checkParameters` for `activationCode` [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKSecurityChecks.checkParameters|validateAppStoreActivationCode|[{ name: 'activationCode', value: request.activationCode, type: 'string' }]|#1` ``).

---

#### role

### Permission Strings Referenced
- **`v1.admin`**: Used in `OSKCompositeRoleService.getOrganizationCompositeRoles` to filter out administrative roles from organization-level views `` `permission_candidate|settings|functions/src/modules/settings/modules/role/services/composite_role.service.ts|v1.admin|#1` ``. [Confirmed]
- **Static RBAC Definitions**: The static data files (`composite_role.data.ts` and `composite_roles_translated.data.ts`) define a comprehensive list of permission candidates (e.g., `v1.admin.accessControlDevice.admin`, `v1.admin.building.admin`, `v1.org.admin`, `v1.org.buildings.admin`, etc.) `` `permission_candidate|settings|functions/src/modules/settings/modules/role/data/composite_role.data.ts|v1.admin.accessControlDevice.admin|#1` ``. [Confirmed]
  - *Cross-Check*: All permission candidates defined in the static data files map directly to the platform's RBAC roles document. [Confirmed]

### Security Checks
- **`OSKSecurityChecks.user_security_checks`**: Called in `getAllCompositeRoles`, `getOrganizationCompositeRoles`, and `onCreateCompositeRolesCalled` to validate the caller's context `` `call_expression|settings|functions/src/modules/settings/modules/role/services/composite_role.service.ts|OSKSecurityChecks.user_security_checks|getAllCompositeRoles|{ context }|#1` ``. [Confirmed]
- **`OSKUserSecurityChecks` Decorator**: Applied to `getAllRoles` with `{ checkUserIdMatch: false }` to ensure the caller is authenticated `` `call_expression|settings|functions/src/modules/settings/modules/role/services/role.service.ts|OSKUserSecurityChecks|getAllRoles|{ checkUserIdMatch: false }|#1` ``. [Confirmed]
- **Error Handling**: Throws a `permission-denied` error if security checks fail `` `permission_error|settings|functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts|permission-denied|#1` ``. [Confirmed]

#### workflow

- **RBAC Role Enforcement**: The controllers accept a `roleId` parameter which is passed to the base `OSKDocumentController` methods to enforce access control on document operations [Inferred]. These map to the following roles defined in the RBAC roles document:
  - `v1.admin.settings.workflow.create`
  - `v1.admin.settings.workflow.delete`
  - `v1.admin.settings.workflow.edit`
  - `v1.admin.settings.workflow.list`
  - `v1.admin.settings.workflow.view`
- **App Check Verification**: Callable functions enforce App Check unless running in the Firebase Emulator environment `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|functionBuilder.runWith|getWorkflowCallableFunction|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``. If App Check is missing or invalid, a `'Failed-precondition'` error is logged `` `call_expression|settings|functions/src/modules/settings/modules/workflow/services/building_request_workflow.service.ts|OSKBuildingRequestWorkflowService.logger.logError|onCreateBuildingRequestWorkflowsCalled|'Failed-precondition: The function must be called from an App Check verified app.'|#1` ``. [Confirmed]
- **Authentication Guard**: Callable functions verify that the requesting user is authenticated, logging an `'Unauthenticated'` error if the check fails `` `call_expression|settings|functions/src/modules/settings/modules/workflow/services/organization_request_workflow.service.ts|OSKOrganizationRequestWorkflowService.logger.logError|onCreateOrganizationRequestWorkflowsCalled|'Unauthenticated: You must be authenticated to use onCreateOrganizationRequestWorkflowsCalled()'|#1` ``. [Confirmed]

---

### 10. Cross-Module Relationships

The `settings` module maintains extensive, high-frequency relationships across the repository, acting as the central authorization clearinghouse.

#### Outbound Dependencies
- **`core`**: **Confirmed**. The `settings` module depends on `core` to inherit standardized document management and logging capabilities. It calls `OSKDocumentController` methods (`_get`, `_set`, `_update`, `_delete`, `_query`, and `_listDocuments`) to execute Firestore operations, and utilizes `OSKLoggingService.logError` for system logging.

#### Inbound Dependencies
- **`admin`**: **Confirmed**. Calls `OSKConsolidatedRolesController.checkUserPermissions` (23 call sites) to authorize administrative building, organization, and maintenance workflows.
- **`building`**: **Confirmed**. Calls `OSKConsolidatedRolesController.checkUserPermissions` (19 call sites) and `checkUserPermissionsSafe` to authorize door management and intercom configuration.
- **`core`**: **Confirmed**. Calls `OSKConsolidatedRolesController.checkUserPermissions` (3 call sites) to authorize secure file storage operations.
- **`organization`**: **Confirmed**. Calls `OSKConsolidatedRolesController.checkUserPermissions` (53 call sites) to authorize entity, property, and resident management. It also calls `OSKAppStoreSettingsService.validateInternally` to verify onboarding activation codes, `OSKCompositeRoleController.listDocuments` to retrieve roles, and `OSKConsolidatedRolesController.generateOrganizationUserRoles` to provision staff roles.
- **`supplier`**: **Confirmed**. Calls `OSKConsolidatedRolesController.checkUserPermissions` (17 call sites) to authorize supplier staff access and activity logging.
- **`user`**: **Confirmed**. Calls `OSKConsolidatedRolesController.checkUserPermissions` (6 call sites) to authorize settings modifications, `OSKAppStoreSettingsService.getAppstoreInformation` and `OSKAppStoreSettingsController.get` to resolve app store links, and `OSKConsolidatedRolesController.generateOrganizationUserRoles` to process organization invitations.

### 11. External Hooks

#### _module_root

- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally bypass App Check enforcement during local development or testing. [Confirmed] `` `call_expression|settings|functions/src/modules/settings/index.ts|functionBuilder.runWith|getSettingsCallableFunction|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``

---

#### appstore

- This capability's pack has no external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) evidenced [Confirmed].

---

#### role

This capability does not evidence any direct external hooks, Pub/Sub publishers/subscribers, HTTP client paths, environment variables, or storage paths within its own pack [Confirmed].

#### workflow

#### Environment Variables
- **`OSK_FIREBASE_EMULATOR`**: Used to conditionally bypass App Check enforcement during local emulation `` `call_expression|settings|functions/src/modules/settings/modules/workflow/index.ts|functionBuilder.runWith|getWorkflowCallableFunction|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``. [Confirmed]

---

### 12. Architectural Observations

- **Centralized Gatekeeper Pattern**: The module exhibits extreme inbound coupling. The `OSKConsolidatedRolesController.checkUserPermissions` method is called more than 120 times across 6 different modules. This design centralizes authorization logic, ensuring that permission evaluation rules are applied consistently platform-wide. However, it also makes the `settings` module a single point of failure; any runtime disruption or performance degradation in this module will immediately paralyze the entire platform. **Inferred**.
- **Standardized CRUD Inheritance**: The module heavily leverages the `OSKDocumentController` from the `core` module. By extending this base controller, `settings` submodules inherit standardized Firestore access patterns and automatic RBAC role enforcement, minimizing boilerplate code. **Inferred**.
- **Decoupled Configuration**: The separation of the `appstore` configuration from business modules like `user` or `apps` ensures that store URLs and activation code validation parameters can be updated dynamically in Firestore without requiring redeployments of the consuming services. **Inferred**.

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Critical Single Point of Failure**: Because almost every module in the repository synchronously calls `OSKConsolidatedRolesController.checkUserPermissions` to authorize API operations, any failure in the `settings` module's database access or execution logic will cause a platform-wide outage. **Inferred**.
- **Appstore Endpoint Authorization Gap**: The `OSKAppStoreSettingsController` endpoints do not enforce RBAC user roles, relying solely on App Check. This creates a risk where an authenticated user without administrative privileges could potentially access or exploit the activation codes stored in `/settings/appstore`. **Inferred**.
- **Firestore Path Discrepancies**: There is a structural mismatch between the Firestore paths touched by triggers and those used by controllers in the `workflow` submodule. Triggers reference pluralized paths (`/settings/workflows/buildingRequests/{workflowId}` and `/setting/workflows/organizationRequest/{workflowId}`), while controllers reference singular/different pluralizations (`/settings/workflows/buildingRequest` and `/settings/workflows/organizationRequests`). It is unknown if these resolve to the same collections via aliases or if they represent disconnected data paths. **Inferred**.
- **RBAC Schema Mismatch**: Dynamically generated composite admin roles (e.g., `v1.admin.settings.role.admin`) are utilized in Firestore schemas and code logic but are completely absent from the canonical `rbac-roles.json` permission table, creating a discrepancy between documented roles and actual system behavior. **Inferred**.

**Per-capability open questions:**

#### _module_root

- **Payload Structure**: What is the exact structure of the request payload passed to `onCreateSettingsCalled`? The evidence shows it accepts a `setting` parameter, but any additional parameters or validation schemas are not fully detailed in this pack.
- **Downstream Usage**: How are the created settings documents in `/settings` evaluated at runtime? The capability handles creation and storage, but the enforcement mechanism is not visible in this submodule's evidence.

#### appstore

- How are the activation codes generated and populated in the `/settings/appstore` document? [Unknown]
- What is the exact structure of the `stores` array inside `OSKAppStoreSettings`? The service method `getAppstoreInformation` iterates over `stores` and checks `row.storeName` and `row.storeUrl`, but the exact type definition of the elements in the `stores` array is not fully detailed in the model properties [Unknown].
- Are there any RBAC roles protecting the `OSKAppStoreSettingsController` endpoints, or are they purely internal/system-level? [Unknown]

#### role

### How is the initial synchronization triggered?
`onCreateCompositeRolesCalled` is exposed as a callable function `` `api_contract|settings|functions/src/modules/settings/modules/role/index.ts|onCreateCompositeRolesCalled|#1` ``, but it is unclear if this is triggered automatically during deployment, via a CI/CD pipeline, or manually by an administrator. [Unknown]

### Are there any UI-driven role modifications?
The controllers support full CRUD (`create`, `save`, `delete`), but the architecture overview suggests roles are statically defined. It is unknown if the Property Manager Portal (PGO) or Oskey Administrators can dynamically create custom roles at runtime. [Unknown]

#### workflow

- **Predefined Workflow Data**: The exact structure and contents of `workflows.data.ts` are not fully detailed in the evidence pack, leaving the exact default workflows that can be programmatically created unknown. [Unknown]
- **Base Controller Implementation**: The exact mechanism of how `OSKDocumentController` handles the `roleId` parameter to restrict Firestore access is outside the scope of this capability's evidence. [Unknown]
- **Path Discrepancies**: There is a minor naming discrepancy between the Firestore paths touched by triggers (`/settings/workflows/buildingRequests/{workflowId}` and `/setting/workflows/organizationRequest/{workflowId}`) and the paths used in the controllers (`'/settings/workflows/buildingRequest'` and `'/settings/workflows/organizationRequests'`). It is unknown if these resolve to the same collections via aliases or if they represent separate collections. [Unknown]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.