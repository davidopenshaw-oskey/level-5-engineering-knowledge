### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T17:06:45.940Z
- repoName: firebase-oskey-dev
- targetModule: settings
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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