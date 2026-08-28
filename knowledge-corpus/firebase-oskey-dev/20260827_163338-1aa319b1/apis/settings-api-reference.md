### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T17:12:14.932Z
- repoName: firebase-oskey-dev
- targetModule: settings
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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