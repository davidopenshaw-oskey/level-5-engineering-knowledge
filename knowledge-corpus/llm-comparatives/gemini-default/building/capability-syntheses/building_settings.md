## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.422Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: building_settings
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `building_settings` capability manages the configuration rules and access parameters for a specific building, such as allowed access methods (Bluetooth, PIN, face recognition, NFC, Sesame), invitation policies, resident addition rules, and intercom display preferences. **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|createBuildingSettings|#1` ``, `` `functions/src/modules/building/modules/building_settings/models/documents/building_settings.model.ts` (lines 27-51) ``.

## 2. Primary Responsibilities
- **Creating Building Settings**: Provisions default or custom configuration parameters for a building, including access methods, PIN code types, and invitation rules. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|createBuildingSettings|#1` ``.
- **Updating Building Settings**: Modifies existing configuration parameters for a building. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|updateBuildingSettings|#1` ``.
- **Retrieving Resident Settings**: Fetches the active settings for a building, which may be filtered or formatted for resident consumption. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|getResidentSettings|#1` ``.
- **Deleting Building Settings**: Removes the settings document associated with a building and cleans up corresponding user-level building settings. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|deleteBuildingSettings|#1` ``.
- **Resetting Building Settings**: Reverts a building's settings to their default values and updates corresponding user-level building settings. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|resetBuildingSettings|#1` ``.
- **Default Data Provisioning**: Generates default settings structures with metadata (e.g., `canBeChanged`, `isRequired`, `description`) for fields like `accessMethods`, `inhabitantPinCodeType`, `refreshCodeFrequency`, `allowQuickcodes`, etc. **Confirmed** `` `functions/src/modules/building/modules/building_settings/data/building_settings_default_data.ts` (lines 11-65) ``.

## 3. Public Interfaces (Controllers & Entry Points)
- **OSKBuildingSettingsController** (extends `OSKDocumentController`): The primary controller managing document-level operations (get, set, update, delete) on the Firestore collection path for building settings. **Confirmed** `` `source_class|building|functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts|OSKBuildingSettingsController` ``.
- **OSKBuildingSettingsService**: The core service orchestrating business logic, permission checks, and coordination with other modules (like `user` and `organization`). **Confirmed** `` `source_class|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService` ``.

## 4. API Contracts & Firestore Triggers

### API Contracts
The following callable functions are exposed by this capability:

- **createBuildingSettings**
  - **Request Schema**: `OSKBuildingSettingsCreateRequest`
    - `buildingId`: `string`
    - `buildingSettingsInputParams`: `OSKBuildingSettingsInputParams`
  - **Response Schema**: `Promise<void>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|createBuildingSettings|#1` ``.

- **deleteBuildingSettings**
  - **Request Schema**: `OSKBuildingDeleteOrResetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
  - **Response Schema**: `Promise<void>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|deleteBuildingSettings|#1` ``.

- **getResidentSettings**
  - **Request Schema**: `OSKBuildingGetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
  - **Response Schema**: `Promise<OSKBuildingSettingsDocument>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|getResidentSettings|#1` ``.

- **resetBuildingSettings**
  - **Request Schema**: `OSKBuildingDeleteOrResetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
  - **Response Schema**: `Promise<void>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|resetBuildingSettings|#1` ``.

- **updateBuildingSettings**
  - **Request Schema**: `OSKBuildingUpdateSettingsRequest`
    - `buildingId`: `string`
    - `update`: `Partial<OSKBuildingSettingsInputParams>`
  - **Response Schema**: `Promise<void>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|updateBuildingSettings|#1` ``.

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. **Confirmed** `` `functions/src/modules/building/modules/building_settings/index.ts` (lines 50-59) ``.

## 5. Data Ownership

### Firestore Paths
- **`/buildings/{buildingId}/settings/{settingsId}`**
  - **Operation Scope**: Read, Write, Delete.
  - **Description**: Stores the configuration settings for a specific building. The settings are stored as structured fields containing both a `value` and `metadata` (e.g., `canBeChanged`, `isRequired`, `description`). **Confirmed** `` `call_expression|building|functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts|OSKBuildingSettingsController.default._set|set|collectionPath,OSKBuildingSettingsController.default.DOCUMENT_ID,document|#1` ``, `` `functions/src/modules/building/modules/building_settings/models/documents/building_settings.model.ts` (lines 23-24) ``.

- **`/users/{userId}/buildingSettings/{buildingId}`**
  - **Operation Scope**: Read, Write, Delete (via external controller delegation).
  - **Description**: Interacts with user-specific building settings to clean up or update user settings when building-level settings are deleted or reset. **Confirmed** `` `call_expression|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKUserSettingsBuildingController.default.delete|deleteBuildingSettings|user.userId,request.buildingId|#1` ``.

## 6. Outbound Coupling

### Intra-Module Coupling (Submodule Siblings)
- **`building_door`**: Depends on `OSKBuildingDoorController` to retrieve the list of doors for a building when generating default settings. **Confirmed** `` `imports_dependency|building|functions/src/modules/building/modules/building_settings/data/building_settings_default_data.ts|@oskey/building/door|#1` ``.
- **`building` (Root)**: Depends on `OSKBuildingController` to fetch building details for validation. **Confirmed** `` `imports_dependency|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|@oskey/building|#1` ``.

### Cross-Module Coupling
- **`core`**: Inherits from `OSKDocumentController` for base document controller operations. **Confirmed** `` `imports_dependency|building|functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts|@oskey/core/controllers/document|#1` ``.
- **`organization`**: Depends on `OSKOrganizationUserController` (within the `organization_user` submodule) to fetch organization user details for permission checks. **Confirmed** `` `imports_dependency|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|@oskey/organization/user|#1` ``.
- **`settings`**: Depends on `OSKConsolidatedRolesController` (within the `role` submodule) to validate user permissions. **Confirmed** `` `imports_dependency|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|@oskey/settings/role|#1` ``.
- **`user`**: Depends on `OSKUserController` to fetch user profiles and `OSKUserSettingsBuildingController` (within the `user_settings` submodule) to manage user-specific building settings. **Confirmed** `` `imports_dependency|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|@oskey/user|#1` ``.

## 7. Permissions & Security
The capability references several permission strings for RBAC validation:
- **`v1.org.settings.create`**: Required to create building settings. **Confirmed** `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.create|#1` ``.
- **`v1.org.settings.view`**: Required to view resident settings. **Confirmed** `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.view|#1` ``.
- **`v1.org.settings.edit`**: Required to update building settings. **Confirmed** `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.edit|#1` ``.
- **`v1.org.settings.delete`**: Required to delete or reset building settings. **Confirmed** `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.delete|#1` ``.

### RBAC Cross-Check
All referenced permissions align perfectly with the supplied RBAC roles document:
- `v1.org.settings.create` -> "Allows to create a new management rule" (Matches)
- `v1.org.settings.view` -> "Allows to view the details of a management rule" (Matches)
- `v1.org.settings.edit` -> "Allows to edit an existing management rule" (Matches)
- `v1.org.settings.delete` -> "Allows to delete a management rule" (Matches)

## 8. External Hooks
No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced in this capability's pack. **Confirmed**

## 9. Open Questions
- **What is the exact value of `OSKBuildingSettingsController.DOCUMENT_ID`?** It is used as a constant but its literal value is not explicitly defined in the compact tables. **Inferred**
- **Are there any background synchronization tasks triggered when building settings are modified (e.g., pushing updates to edge devices)?** The architecture document mentions delta payloads and Pub/Sub synchronization, but the code in this capability pack only shows direct Firestore writes and calls to `user_settings`. **Inferred**