# Capability Synthesis — admin_maintenance

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.373Z
- **repoName**: firebase-oskey-dev
- **targetModule**: admin
- **capability**: admin_maintenance
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `admin_maintenance` capability provides administrative maintenance utilities and data migration scripts exposed as Firebase Callable Functions. These utilities allow platform administrators to repair, migrate, sync, and recreate database records (Firestore and MongoDB) across buildings, users, organizations, pincodes, and intercoms. [Confirmed]

## 2. Primary Responsibilities

### Access and Token Reconstruction
- **Recreate Access Documents in MongoDB**: Publishes messages to recreate access documents for Access Control Devices (ACDs) in MongoDB by building [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|recreateAccessDocumentInMongoDbByBuilding|#1`].
- **Remove Non-Existing User Accesses**: Checks if users exist in the `/users` collection and deletes their accesses from `/buildings/{id}/accesses` if they do not [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|removeNonExistingUserAccessInBuilding|#1`].
- **Sync Building Accesses with User Accesses**: Reconstructs building accesses using the user's authoritative accesses [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|syncBuildingAccessesWithUserAccesses|#1`].
- **Fix Missing Main Access Fields**: Scans building and user accesses to ensure the `isMainAccess` field is populated, updating documents where it is missing [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|fixMissingMainAccessFields|#1`].
- **Recreate BLE Access Tokens**: Recreates Bluetooth Low Energy (BLE) access tokens for building users [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|recreateTokensForBuildingUsers|#1`].

### Building and User Settings Maintenance
- **Create Default Resident Settings**: Generates default resident settings documents for buildings [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|OSKDbBuildingSettingsService|onMaintenanceCreateResidentSettingsForBuilding|#1`].
- **Add/Delete Settings Fields**: Adds or deletes fields such as `intercomDisplayName` and `allowUnitNumber` at both building-level settings and user-specific building settings [Confirmed, `functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts` (lines 43-181)].
- **Create Unit Settings**: Generates unit settings documents from existing inhabitant records for all users [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts|OSKDbUserSettingsService|onMaintenanceCreateUnitSettings|#1`].

### Intercom and Call Transfer List Management
- **Create Building Intercom Bases**: Initializes base intercom entries for doors in a building [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|createBuildingIntercomsBase|#1`].
- **Fill Intercoms by Users**: Populates building intercoms with valid inhabitants [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|createAndFillIntercomsByBuilding|#1`].
- **Delete Building/User Intercoms**: Deletes intercom entries for buildings or specific users [Confirmed, `functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts` (lines 452-466)].
- **Delete Call Transfer Lists**: Deletes call transfer list documents for a building [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|deleteCallTransferLists|#1`].
- **Add Unit Number Fields to Intercom Entries**: Updates intercom entries with unit numbers fetched from building units [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercom_allowUnitNumber.service.ts|OSKDbIntercomUnitNumberService|onMaintenanceIntercomAddUnitNumberFields|#1`].

### Organization and Resident Migration
- **Create Organization Prompt Templates**: Saves default prompt templates for organizations [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_organizations/db_organization_prompt.service.ts|OSKDbOrganizationPromptService|onMaintenanceCreateOrganizationsPrompt|#1`].
- **Create Resident Profiles**: Generates resident profiles in organizations from onboarding cards [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|OSKDbResidentsService|createResidents|#1`].
- **Update Resident Profiles with Unit Info**: Updates resident profiles with floor and unit number details [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|OSKDbResidentsService|onMaintenanceUpdateResidentsWithUnitInfo|#1`].

### Pincode Refresh Orchestration
- **Refresh Inhabitant Pincodes**: Orchestrates the refresh of inhabitant pincodes for a building by scheduling background refresh tasks via Cloud Tasks [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|OSKDbPincodesService|onMaintenanceRefreshPincodes|#1`].
- **Execute Pincode Refresh Task**: Worker service that deletes old pincodes, generates new ones, and publishes updates to ACDs [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service.ts|OSKPincodeRefreshWorkerService|executePincodeRefresh|#1`].

### Property Linking
- **Link Buildings to Properties**: Finds unassigned buildings and links them to the first available property under the organization [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_propertiesIds/db_propertiesIds.service.ts|OSKDbPropertiesService|onMaintenanceLinkBuildingsToProperties|#1`].

### Auth Display Name Sync
- **Sync Display Names**: Syncs user display names from Firestore (`firstName` and `lastName`) to Firebase Auth [Confirmed, `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts|OSKDbUserSettingsService|onMaintenanceSyncAuthDisplayNames|#1`].

## 3. Public Interfaces (Controllers & Entry Points)

This capability exposes public entry points via Firebase Callable Functions defined in `functions/src/modules/admin/modules/admin_maintenance/index.ts` [Confirmed, `functions/src/modules/admin/modules/admin_maintenance/index.ts` (lines 33-84)].

### Exported Services
- **`OSKDbAccessService`**: Manages access migrations, token recreation, and access synchronization [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService`].
- **`OSKDbBuildingSettingsService`**: Manages building settings migrations [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|OSKDbBuildingSettingsService`].
- **`OSKDbIntercomUnitNumberService`**: Manages intercom unit number updates [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercom_allowUnitNumber.service.ts|OSKDbIntercomUnitNumberService`].
- **`OSKDbIntercomService`**: Manages intercom and call transfer list migrations [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService`].
- **`OSKDbOrganizationPromptService`**: Manages organization prompt template creation [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_organizations/db_organization_prompt.service.ts|OSKDbOrganizationPromptService`].
- **`OSKDbPincodesService`**: Orchestrates pincode refreshes [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|OSKDbPincodesService`].
- **`OSKPincodeRefreshWorkerService`**: Worker service executing individual pincode refreshes [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service.ts|OSKPincodeRefreshWorkerService`].
- **`OSKDbPropertiesService`**: Manages building-to-property linking [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_propertiesIds/db_propertiesIds.service.ts|OSKDbPropertiesService`].
- **`OSKDbResidentsService`**: Manages resident profile creation and updates [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|OSKDbResidentsService`].
- **`OSKDbUserSettingsService`**: Manages user settings, unit settings, and Auth display name synchronization [Confirmed, `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts|OSKDbUserSettingsService`].

## 4. API Contracts & Firestore Triggers

### API Contracts (Callable Functions)
All entry points are Firebase Callable Functions [Confirmed, `functions/src/modules/admin/modules/admin_maintenance/index.ts` (lines 33-84)].

| Function Name | Request Type | Response Type |
| :--- | :--- | :--- |
| `executePincodeRefreshCallable` | `any` | `any` |
| `onFixMissingMainAccessFieldsAll` | `OSKDbRecreateAccess` | `any` |
| `onMaintenanceAddIntercomDisplayNameField` | `any` | `any` |
| `onMaintenanceAddUnitNumberField` | `any` | `any` |
| `onMaintenanceCreateBuildingsIntercomBases` | `any` | `any` |
| `onMaintenanceCreateIntercomsByUsers` | `any` | `any` |
| `onMaintenanceCreateOrganizationsPrompt` | `any` | `any` |
| `onMaintenanceCreateResidents` | `any` | `any` |
| `onMaintenanceCreateResidentSettingsForBuilding` | `any` | `any` |
| `onMaintenanceCreateUnitSettings` | `any` | `any` |
| `onMaintenanceCreateUserSettings` | `any` | `any` |
| `onMaintenanceDeleteBuildingsIntercoms` | `any` | `any` |
| `onMaintenanceDeleteCallTransferLists` | `any` | `any` |
| `onMaintenanceDeleteIntercomDisplayNameField` | `any` | `any` |
| `onMaintenanceDeleteUsersIntercoms` | `any` | `any` |
| `onMaintenanceIntercomAddUnitNumberFields` | `any` | `any` |
| `onMaintenanceLinkBuildingsToProperties` | `any` | `any` |
| `onMaintenanceRecreateAccess` | `OSKDbRecreateAccess` | `any` |
| `onMaintenanceRefreshPincodes` | `OSKDbRefreshPincodes` | `any` |
| `onMaintenanceSyncAuthDisplayNames` | `any` | `any` |
| `onMaintenanceUpdateAccessControlDeviceModel` | `any` | `any` |
| `onMaintenanceUpdateResidentsWithUnitInfo` | `any` | `any` |
| `onRecreateAccessDocumentInMongoDbByBuildingAll` | `OSKDbRecreateAccess` | `any` |
| `onRecreateTokensForBuildingUsersAll` | `OSKDbRecreateAccess` | `any` |
| `onRemoveNonExistingUserAccessInBuildingALL` | `OSKDbRecreateAccess` | `any` |
| `onSyncBuildingAccessesWithUserAccessesAll` | `OSKDbRecreateAccess` | `any` |

### Resolved API Request/Response Schemas
- **`OSKDbRecreateAccess`**
  - `buildingIds`: `string[]`
- **`OSKDbRefreshPincodes`**
  - `buildingId`: `string`

### Firestore Triggers
No Firestore triggers are owned by this capability. [Confirmed]

## 5. Data Ownership

### Firestore Paths Touched
This capability performs read, write, update, and delete operations across a wide range of Firestore collections for maintenance purposes [Confirmed]:
- `/buildings/{id}/settings` (via `OSKBuildingSettingsController`)
- `/buildings/{id}/accesses` (via `OSKBuildingAccessesController`)
- `/buildings/{id}/doors` (via `OSKBuildingDoorController`)
- `/buildings/{id}/intercoms` (via `OSKBuildingIntercomController`)
- `/buildings/{id}/callTransferList` (via `OSKBuildingIntercomCallTransferListController`)
- `/buildings/{id}/units` (via `OSKBuildingUnitController`)
- `/buildings/{id}/units/{id}/inhabitants` (via `OSKBuildingUnitInhabitantController`)
- `/organizations/{id}/promptTemplates` (via `OSKOrganizationPromptTemplateController`)
- `/organizations/{id}/residents` (via `OSKOrganizationResidentsController`)
- `/organizations/{id}/onboardingInhabitants` (via `OSKOrganizationOnboardingInhabitantController`)
- `/users/{id}/buildingSettings` (via `OSKUserSettingsBuildingController`)
- `/users/{id}/buildingSettings/{id}/unitSettings` (via `OSKUserSettingsUnitController`)
- `/users/{id}/accesses` (via `OSKUserAccessesController`)
- `/users/{id}/pincodes` (via `OSKUserPincodeController`)
- `/users` (via `OSKUserController`)
- `/properties` (via `OSKPropertyController`)
- `/organizations` (via `OSKOrganizationController`)

## 6. Outbound Coupling

### Cross-Module Coupling
This capability depends heavily on controllers and services from other modules to perform database operations [Confirmed]:
- **`building` module**:
  - `building_accesses` submodule: Imports `@oskey/building/accesses` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/models/recreate_accesses.model.ts|@oskey/building/accesses|#1`].
  - `building_door` submodule: Imports `@oskey/building/door` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|@oskey/building/door|#1`].
  - `building_intercom` submodule: Imports `@oskey/building/intercom` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|@oskey/building/intercom|#1`].
  - `building_settings` submodule: Imports `@oskey/building/settings` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|@oskey/building/settings|#1`].
  - `building_unit` submodule: Imports `@oskey/building/unit` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercom_allowUnitNumber.service.ts|@oskey/building/unit|#1`].
  - `building_pincode` submodule: Imports `@oskey/building/pincode` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/models/refresh_pincodes.model.ts|@oskey/building/pincode|#1`].
  - `building_unit_nonAppUser` submodule: Imports `@oskey/building/unit/nonAppUsers` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|@oskey/building/unit/nonAppUsers|#1`].
  - Root `building` module: Imports `@oskey/building` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|@oskey/building|#1`].
- **`user` module**:
  - `user_access` submodule: Imports `@oskey/user/access` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/models/recreate_accesses.model.ts|@oskey/user/access|#1`].
  - `user_device` submodule: Imports `@oskey/user/device` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|@oskey/user/device|#1`].
  - `user_intercoms` submodule: Imports `@oskey/user/intercom` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|@oskey/user/intercom|#1`].
  - `user_pincode` submodule: Imports `@oskey/user/pincode` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|@oskey/user/pincode|#1`].
  - Root `user` module: Imports `@oskey/user` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|@oskey/user|#1`].
- **`core` module**:
  - `access` submodule: Imports `@oskey/core/access` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|@oskey/core/access|#1`].
  - Root `core` module: Imports `@oskey/core/logger` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|@oskey/core/logger|#1`] and `@oskey/core` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|@oskey/core|#1`].
- **`organization` module**:
  - `organization_property` submodule: Imports `@oskey/organization/property` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_propertiesIds/db_propertiesIds.service.ts|@oskey/organization/property|#1`].
  - `organization_residents` submodule: Imports `@oskey/organization/residents` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|@oskey/organization/residents|#1`].
  - `organization_onboarding_inhabitant` submodule: Imports `@oskey/organization/user/onboarding/inhabitant` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|@oskey/organization/user/onboarding/inhabitant|#1`].
  - `organization_user` submodule: Imports `@oskey/organization/user` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts|@oskey/organization/user|#1`].
  - Root `organization` module: Imports `@oskey/organization` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_organizations/db_organization_prompt.service.ts|@oskey/organization|#1`].
- **`settings` module**:
  - `role` submodule: Imports `@oskey/settings/role` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts|@oskey/settings/role|#1`].
- **`tasks` module**:
  - Root `tasks` module: Imports `../../../../../tasks/models/pincode_refresh_task.model` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|../../../../../tasks/models/pincode_refresh_task.model|#1`] and `../../../../../tasks/services/task_scheduler.service` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|../../../../../tasks/services/task_scheduler.service|#1`].

### Intra-Module Coupling (Sibling Submodules)
- **`admin_organization` submodule**: Imports `../../admin_organization/controllers/organization_list.controller` [Confirmed, `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|../../admin_organization/controllers/organization_list.controller|#1`].

## 7. Permissions & Security

### Permission Checks
All maintenance functions are strictly guarded by the `OSKMaintenancePermissionChecks.isOskeyAdmin` helper [Confirmed, `class_method|admin|functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts|OSKMaintenancePermissionChecks|isOskeyAdmin|#1`].

This helper performs the following checks [Confirmed, `functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts` (lines 13-28)]:
1. Resolves the organization named `'OSkey SAS'`.
2. Fetches the organization user record for the calling user.
3. Verifies if the user has the `v1.admin` permission string.

### Cross-Check Against RBAC Roles
- The permission string `v1.admin` is checked as a versioned permission candidate [Confirmed, `permission_candidate|admin|functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts|v1.admin|#1`].
- In the supplied RBAC roles document, there is no single `v1.admin` permission; instead, there are granular permissions prefixed with `v1.admin.` (e.g., `v1.admin.building.delete`, `v1.admin.user.view`). The use of `v1.admin` as a wildcard or master permission for Oskey platform administrators is an implementation-level design choice to bypass granular checks for global maintenance scripts.

## 8. External Hooks

### Confirmed Integrations
- **Firebase Auth**: Integrates with Firebase Auth to retrieve and update user display names [Confirmed, `functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts` (lines 90-104)].
- **GCP Cloud Tasks**: Integrates with `OSKTaskSchedulerService` to schedule background pincode refresh tasks [Confirmed, `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|OSKTaskSchedulerService.scheduleTask|onMaintenanceRefreshPincodes|scheduleDate,payload,targetUrl|#1`].

## 9. Open Questions
- **Wildcard Permission Resolution**: How is the `v1.admin` permission mapped to the granular `v1.admin.*` permissions in the settings/role module, given that `v1.admin` itself is not listed in the standard RBAC roles document? [Inferred]
- **Task Target URL**: What is the exact target URL used when scheduling pincode refresh tasks via `OSKTaskSchedulerService`? [Unknown]