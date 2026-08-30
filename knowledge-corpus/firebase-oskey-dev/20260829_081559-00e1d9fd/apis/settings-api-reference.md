### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:36:33.723Z
- repoName: firebase-oskey-dev
- targetModule: settings
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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