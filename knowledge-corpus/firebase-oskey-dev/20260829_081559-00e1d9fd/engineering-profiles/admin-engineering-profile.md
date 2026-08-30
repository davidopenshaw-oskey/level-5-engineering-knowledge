### 0. Generation Metadata

- **runId**: 20260829_081559-00e1d9fd
- **generatedAt**: 2026-08-29T13:32:02.955Z
- **repoName**: firebase-oskey-dev
- **targetModule**: admin
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

### 1. Executive Summary

The `admin` module serves as the centralized administrative control plane for the Oskey platform [Confirmed]. It aggregates and orchestrates administrative capabilities across multiple submodules, providing platform-level and organization-level administrators with the tools necessary to manage structural hierarchies (buildings and units), organizations, user accounts, devices, accesses, and invitations [Confirmed]. Crucially, the module contains a dedicated maintenance capability (`admin_maintenance`) that executes high-risk, system-wide operations, including database migrations, data consistency repairs, token recreations, and pincode refreshes across Firestore, MongoDB, and Firebase Auth [Confirmed].

### 2. Architectural Position

The `admin` module sits at the apex of the platform's administrative hierarchy [Inferred]. It acts as a privileged orchestrator that imports and calls controllers and services from almost every other domain module in the repository—including `building`, `user`, `organization`, `access_control_device`, `settings`, and `tasks` [Confirmed]. It bypasses standard tenant isolation boundaries to provide platform-wide visibility for Oskey Administrators, while also supporting scoped administrative workflows for Organization Administrators [Inferred].

### 3. Primary Responsibilities

#### _module_root

- **Orchestrating Administrative Triggers** [Confirmed]: Aggregates and returns callable function triggers from various administrative submodules via `getAdminCallableFunctionTriggers` `` `function_declaration|admin|functions/src/modules/admin/index.ts|getAdminCallableFunctionTriggers|#1` ``. This includes:
  - Building administration triggers via `getAdminBuildingsCallableFunctionTriggers` `` `call_expression|admin|functions/src/modules/admin/index.ts|getAdminBuildingsCallableFunctionTriggers|getAdminCallableFunctionTriggers|functionBuilder|#1` ``.
  - Organization administration triggers via `getAdminOrganizationCallableFunctionTriggers` `` `call_expression|admin|functions/src/modules/admin/index.ts|getAdminOrganizationCallableFunctionTriggers|getAdminCallableFunctionTriggers|functionBuilder|#1` ``.
  - User administration triggers via `getAdminUsersCallableFunctionTriggers` `` `call_expression|admin|functions/src/modules/admin/index.ts|getAdminUsersCallableFunctionTriggers|getAdminCallableFunctionTriggers|functionBuilder|#1` ``.
  - Maintenance administration triggers via `maintenanceCallableFunctions.getCallableFunctionTriggers` `` `call_expression|admin|functions/src/modules/admin/index.ts|maintenanceCallableFunctions.getCallableFunctionTriggers|getAdminCallableFunctionTriggers|functionBuilder|#1` ``.
- **Defining Shared Admin Models** [Confirmed]: Declares and exports the `OSKWithAdminOrganizationId` type alias containing the `adminOrganizationId` property, used to scope administrative operations to a specific organization `` `type_alias|admin|functions/src/modules/admin/models/with_admin_organization_id.model.ts|OSKWithAdminOrganizationId|#1` ``.

---

#### admin_buildings

- **Structural Hierarchy Retrieval**: Fetches all buildings associated with an organization and maps their corresponding units [Confirmed: `functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts` (lines 47-58)].
- **Administrative RBAC Validation**: Validates that the calling user has the required administrative permissions within the specified organization before executing queries [Confirmed: `call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|getAllBuildingsWithUnits|adminOrganizationUser.roles,rolesToCheck|#1`].
- **Data Mapping and Projection**: Transforms raw Firestore building and unit documents into a simplified, client-friendly response format containing only the building ID, unit ID, unit number, and name [Confirmed: `call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|units.map|getAllBuildingsWithUnits|(u) => ({ unitId: u.unitId, unitNumber: u.unitNumber, name: u.name })|#1`].

---

#### admin_maintenance

This capability is responsible for the following administrative and maintenance workflows:

1. **Access Document Reconciliation & Repair**:
   - Recreating access documents in MongoDB for edge devices (ACDs) by filtering valid accesses for a specific building [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|recreateAccessDocumentInMongoDbByBuilding|#1` ``].
   - Syncing building accesses with user accesses and removing accesses for users who no longer exist in the system [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|syncBuildingAccessesWithUserAccesses|#1` ``, `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|removeNonExistingUserAccessInBuilding|#1` ``].
   - Identifying and fixing missing `isMainAccess` fields on user and building accesses [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|fixMissingMainAccessFields|#1` ``].

2. **Access Token Re-issuance**:
   - Recreating access device tokens for building users to ensure mobile and wearable devices remain synchronized with physical door locks [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|recreateTokensForBuildingUsers|#1` ``].

3. **Pincode Refresh Orchestration**:
   - Refreshing inhabitant pincodes for a building by scheduling asynchronous tasks via Cloud Tasks [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|OSKDbPincodesService|onMaintenanceRefreshPincodes|#1` ``].
   - Executing the pincode refresh worker to delete old pincodes, generate new ones, and publish updates to all associated ACDs [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service.ts|OSKPincodeRefreshWorkerService|executePincodeRefresh|#1` ``].

4. **Building & User Settings Maintenance**:
   - Creating default resident settings documents for buildings [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|OSKDbBuildingSettingsService|onMaintenanceCreateResidentSettingsForBuilding|#1` ``].
   - Migrating building and user-specific settings to add new configuration fields such as `allowIntercomDisplayName` and `allowUnitNumber` [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|OSKDbBuildingSettingsService|onMaintenanceAddIntercomDisplayNameField|#1` ``, `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|OSKDbBuildingSettingsService|onMaintenanceAddUnitNumberField|#1` ``].
   - Creating unit settings for all users based on their inhabitant records [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts|OSKDbUserSettingsService|onMaintenanceCreateUnitSettings|#1` ``].

5. **Intercom & Call Transfer List Maintenance**:
   - Provisioning building intercom bases and filling them with inhabitant directory entries [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|createBuildingsIntercomsBases|#1` ``, `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|createAndFillIntercomsUsers|#1` ``].
   - Deleting building intercoms, user intercoms, and call transfer lists [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|deleteBuildingIntercoms|#1` ``, `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|deleteUserIntercoms|#1` ``, `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|deleteCallTransferLists|#1` ``].
   - Updating intercom entries to support unit number display configurations [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercom_allowUnitNumber.service.ts|OSKDbIntercomUnitNumberService|onMaintenanceIntercomAddUnitNumberFields|#1` ``].

6. **Resident Data Migration**:
   - Creating resident profiles from onboarding cards [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|OSKDbResidentsService|onMaintenanceCreateResidents|#1` ``].
   - Updating existing resident profiles with unit information (floor and unit number) [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|OSKDbResidentsService|onMaintenanceUpdateResidentsWithUnitInfo|#1` ``].

7. **Organization Prompt Templates**:
   - Creating default prompt templates for organizations [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_organizations/db_organization_prompt.service.ts|OSKDbOrganizationPromptService|onMaintenanceCreateOrganizationsPrompt|#1` ``].

8. **Auth Display Name Synchronization**:
   - Syncing user display names from Firestore to Firebase Auth to ensure consistency across identity and database layers [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts|OSKDbUserSettingsService|onMaintenanceSyncAuthDisplayNames|#1` ``].

9. **Property Linking**:
   - Linking unassigned buildings to properties [Confirmed; `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_propertiesIds/db_propertiesIds.service.ts|OSKDbPropertiesService|onMaintenanceLinkBuildingsToProperties|#1` ``].

---

#### admin_organization

- **Retrieving All Organizations**: Exposes a service method `getAllOrganizations` that queries the database to retrieve a list of all registered organizations [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getAllOrganizations|#1` ``).
- **Retrieving Specific Organization Details**: Exposes a service method `getOrganizationDetailsById` to fetch detailed information for a single organization by its ID [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getOrganizationDetailsById|#1` ``).
- **Enforcing Administrative Permissions**: Verifies that the requesting user possesses the necessary administrative roles (e.g., checking permissions like `v1.admin.org.view`, `v1.admin.org.register`, `v1.admin.org.edit`, `v1.admin.org.delete`, `v1.admin.org.validate`) before executing queries [Confirmed] (`` `functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts` (lines 50-55, 98-103) ``).
- **Resolving User and Organization User Profiles**: Fetches the requesting user's profile and organization-specific user roles to perform consolidated permission checks [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKUserController.default.get|getAllOrganizations|userId|#1` ``, `` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOrganizationUserController.default.get|getAllOrganizations|adminsOskeyId,userId|#1` ``).

#### admin_users

The `admin_users` capability is responsible for the following administrative workflows:

- **Inhabitant Unit Management**: 
  - Adding inhabitants to specific building units (`addInhabitantToUnit`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|addInhabitantToUnit|#1` ``.
  - Removing inhabitants from building units (`removeInhabitantFromUnit`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeInhabitantFromUnit|#1` ``.
  - Granting inhabitant access to a unit inhabitant (`giveInhabitantAccessToUnitInhabitant`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|giveInhabitantAccessToUnitInhabitant|#1` ``.
  - Querying all units associated with a specific inhabitant user (`getInhabitantUserUnits`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getInhabitantUserUnits|#1` ``.
- **User Access Management**:
  - Retrieving all accesses for a user (`getAllUserAccesses`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserAccesses|#1` ``.
  - Retrieving a specific user access by ID (`getUserAccessById`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getUserAccessById|#1` ``.
  - Removing specific user accesses (`removeUserAccesses`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeUserAccesses|#1` ``.
  - Removing individual accesses within a user access document (`removeUserAccessAccesses`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeUserAccessAccesses|#1` ``.
  - Purging all accesses for a user (`removeAllUserAccesses`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeAllUserAccesses|#1` ``.
- **User Device Management**:
  - Listing all registered devices for a user (`getAllUserDevices`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserDevices|#1` ``.
  - Removing specific user devices (`removeUserDevices`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeUserDevices|#1` ``.
  - Purging all registered devices for a user (`removeAllUserDevices`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeAllUserDevices|#1` ``.
- **User Invitation Management**:
  - Listing all invitations associated with a user (`getAllUserInvitations`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserInvitations|#1` ``.
  - Creating access for a user based on an invitation (`createUserInvitationAccess`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|createUserInvitationAccess|#1` ``.
  - Removing specific user invitations (`removeUserInvitations`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeUserInvitations|#1` ``.
  - Purging all invitations for a user (`removeAllUserInvitations`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeAllUserInvitations|#1` ``.
- **General User Administration**:
  - Listing all users (`getAllUsers`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUsers|#1` ``.
  - Retrieving a user's profile and metadata by ID (`getUserById`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getUserById|#1` ``.
  - Deleting a user's data across accesses, devices, and invitations (`deleteUserData`) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|deleteUserData|#1` ``.

[Confirmed]

### 4. Public Interfaces

#### _module_root

- **getAdminCallableFunctionTriggers** [Confirmed]: The primary entry point function in `functions/src/modules/admin/index.ts` (lines 20-27) that aggregates all administrative callable triggers.
- **Shared Models Export** [Confirmed]: Exports the model `./models/with_admin_organization_id.model` `` `exported_symbol|admin|functions/src/modules/admin/index.ts|./models/with_admin_organization_id.model|#1` ``.

---

#### admin_buildings

- **OSKAdminBuildingController**: Extends `OSKDocumentController` to handle direct document queries against the buildings collection [Confirmed: `source_class|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts|OSKAdminBuildingController`].
- **OSKAdminBuildingUnitController**: Extends `OSKDocumentController` to handle direct document queries against the units subcollection under a specific building [Confirmed: `source_class|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts|OSKAdminBuildingUnitController`].
- **OSKAdminBuildingService**: Orchestrates the business logic, permission checks, and data aggregation for administrative building operations [Confirmed: `source_class|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|OSKAdminBuildingService`].

---

#### admin_maintenance

The capability exposes its maintenance operations through a single entry point file containing callable Cloud Functions:
- **Entry Point**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/index.ts` (lines 33-84)]

The internal business logic is encapsulated in the following services:
- **OSKDbAccessService**: Manages access reconciliation, token recreation, and main access field fixes [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts` (lines 33-510)].
- **OSKDbBuildingSettingsService**: Manages building-level settings migrations [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts` (lines 16-182)].
- **OSKDbIntercomUnitNumberService**: Manages intercom unit number display migrations [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercom_allowUnitNumber.service.ts` (lines 20-118)].
- **OSKDbIntercomService**: Manages intercom provisioning, deletion, and call transfer list cleanup [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts` (lines 46-543)].
- **OSKDbOrganizationPromptService**: Manages organization prompt template creation [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_organizations/db_organization_prompt.service.ts` (lines 10-94)].
- **OSKDbPincodesService**: Orchestrates building-wide pincode refreshes [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts` (lines 28-144)].
- **OSKPincodeRefreshWorkerService**: Executes individual pincode refresh tasks [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service.ts` (lines 16-128)].
- **OSKDbPropertiesService**: Manages building-to-property linking [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_propertiesIds/db_propertiesIds.service.ts` (lines 10-73)].
- **OSKDbResidentsService**: Manages resident profile creation and updates [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts` (lines 26-213)].
- **OSKDbUserSettingsService**: Manages user settings migrations and Firebase Auth display name synchronization [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts` (lines 21-236)].

---

#### admin_organization

- **`OSKOragnizationListController`**: Extends `OSKDocumentController` and exposes methods `getAll` and `getById` to interact with the underlying Firestore documents [Confirmed] (`` `source_class|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController` ``).
- **`OSKOragnizationListService`**: Orchestrates the business logic, permission checks, and data retrieval for the callable functions [Confirmed] (`` `source_class|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService` ``).
- **`getAdminOrganizationCallableFunctionTriggers`**: The entry point function that registers the Firebase HTTPS callable triggers [Confirmed] (`` `function_declaration|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAdminOrganizationCallableFunctionTriggers|#1` ``).

#### admin_users

The capability exposes its functionality through several controllers and services:

### Controllers
- **`OSKAdminInhabitantUserController`**: Manages document-level operations for inhabitants within building units `` `functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts` (lines 9-43) ``.
- **`OSKAdminUserAccessController`**: Manages document-level operations for user accesses `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts` (lines 9-22) ``.
- **`OSKAdminUserDeviceController`**: Manages document-level operations for user devices `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts` (lines 9-26) ``.
- **`OSKAdminUserInvitationController`**: Manages document-level operations for user invitations `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 9-85) ``.
- **`OSKAdminUserController`**: Manages document-level operations for general user profiles `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts` (lines 9-23) ``.

### Services
- **`OSKAdminInhabitantUserService`**: Orchestrates business logic for inhabitant unit assignments and access provisioning `` `functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts` (lines 38-358) ``.
- **`OSKAdminUserAccessService`**: Orchestrates business logic for user accesses `` `functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts` (lines 24-223) ``.
- **`OSKAdminUserDeviceService`**: Orchestrates business logic for user devices `` `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` (lines 21-136) ``.
- **`OSKAdminUserInvitationService`**: Orchestrates business logic for user invitations `` `functions/src/modules/admin/modules/admin_users/services/admin_user_invitation.service.ts` (lines 29-321) ``.
- **`OSKAdminUserService`**: Orchestrates business logic for general user administration and data deletion `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (lines 30-148) ``.

### Entry Points
- **`getAdminUsersCallableFunctionTriggers`**: Registers all callable HTTPS triggers for the admin users capability `` `functions/src/modules/admin/modules/admin_users/index.ts` (lines 32-67) ``.

[Confirmed]

### 5. Internal Structure

The `admin` module is organized into five submodules: `_module_root`, `admin_buildings`, `admin_maintenance`, `admin_organization`, and `admin_users`. The intra-module coupling graph reveals the following structural relationships:
- **`_module_root`** acts as the central entry point, exporting and exposing callable Cloud Function triggers from all four sibling submodules: `admin_buildings`, `admin_maintenance`, `admin_organization`, and `admin_users` [Confirmed].
- **`admin_buildings`** depends on **`_module_root`** for shared administrative models (such as `OSKWithAdminOrganizationId`) [Confirmed] and is coupled to **`admin_users`** via an import of the utility `getAdminOrganizationUser` to resolve administrative context [Confirmed].
- **`admin_maintenance`** is coupled to **`admin_organization`** through its dependency on `OSKOragnizationListController` to perform maintenance and migration tasks [Confirmed].
- **`admin_users`** depends on **`_module_root`** for shared administrative models [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

The `admin` module does not natively "own" any primary business collections; instead, it acts as a highly privileged consumer and modifier of data owned by other modules [Inferred].
- **`/organizations`**: While `admin_organization` defines the `OSKOrganizationList` model and queries `/organizations` via `OSKOragnizationListController`, primary ownership of the organization lifecycle belongs to the `organization` module [Inferred]. The `admin` module's relationship is a read-only administrative view [Inferred].
- **`/buildings/{id}/pincodes` and `/users/{id}/pincodes`**: The `admin_maintenance` submodule performs bulk pincode refreshes and writes pincode documents [Confirmed]. However, the primary schema and standard lifecycle of these collections are owned by the `building` and `user` modules respectively [Inferred].
- **`/buildings/{id}/accesses` and `/users/{id}/accesses`**: Recreated and modified by `admin_maintenance` (`db_accesses.service.ts`) and managed by `admin_users` (`OSKAdminUserAccessController`) [Confirmed]. Primary ownership remains with the `building` and `user` modules, with `admin` acting as an administrative override [Inferred].
- **Data Ownership Signal Analysis**: `OSKOragnizationListController` (defined in `admin_organization`) is called by `admin_maintenance` internally, confirming that organization listing is shared across administrative submodules but not exposed as an API for other modules to write to [Confirmed]. `OSKPincodeRefreshWorkerService` (defined in `admin_maintenance`) is called by the external `tasks` module, confirming that the `admin` module acts as the execution engine for scheduled maintenance tasks owned by the platform [Confirmed].

**Per-capability evidence:**

#### _module_root

No direct Firestore paths are shown as touched or owned by this root capability's evidence [Confirmed].

---

#### admin_buildings

This capability performs read-only operations on the following Firestore paths:
- **`/buildings`**: Queried to retrieve all buildings belonging to an organization [Confirmed: `call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts|OSKAdminBuildingController.default._query|getAll|OSKAdminBuildingController.collection|#1`].
- **`/buildings/{buildingId}/units`**: Queried to retrieve all units associated with each retrieved building [Confirmed: `call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts|OSKAdminBuildingUnitController.default._query|getAll|\`/buildings/\${buildingId}/units\`|#1`].

---

#### admin_maintenance

### Firestore Collections Touched
Based on the controllers and services utilized, this capability reads, writes, updates, or deletes documents in the following Firestore collections:

- `/buildings/{id}/accesses` [Inferred; via `OSKBuildingAccessesController` in `db_accesses.service.ts`]
- `/users/{id}/accesses` [Inferred; via `OSKUserAccessesController` in `db_accesses.service.ts`]
- `/users` [Inferred; via `OSKUserController` in `db_accesses.service.ts`, `db_building_settings.service.ts`, `db_intercoms.service.ts`, `db_pincodes.service.ts`, `db_residents.service.ts`, `db_user_settings.ts`]
- `/buildings` [Inferred; via `OSKBuildingController` in `db_building_settings.service.ts`, `db_propertiesIds.service.ts`, `db_residents.service.ts`]
- `/buildings/{id}/settings` [Inferred; via `OSKBuildingSettingsController` in `db_building_settings.service.ts`, `db_user_settings.ts`]
- `/users/{id}/buildingSettings` [Inferred; via `OSKUserSettingsBuildingController` in `db_building_settings.service.ts`, `db_user_settings.ts`]
- `/buildings/{id}/intercoms` [Inferred; via `OSKBuildingIntercomController` in `db_intercom_allowUnitNumber.service.ts`, `db_intercoms.service.ts`]
- `/buildings/{id}/units` [Inferred; via `OSKBuildingUnitController` in `db_intercom_allowUnitNumber.service.ts`, `db_residents.service.ts`]
- `/accessControlDevices` [Inferred; via `OSKAccessControlDeviceController` in `db_intercoms.service.ts`]
- `/buildings/{id}/doors` [Inferred; via `OSKBuildingDoorController` in `db_intercoms.service.ts`]
- `/buildings/{id}/callTransferList` [Inferred; via `OSKBuildingIntercomCallTransferListController` in `db_intercoms.service.ts`]
- `/users/{id}/intercoms` [Inferred; via `OSKUserIntercomController` in `db_intercoms.service.ts`]
- `/buildings/{id}/units/{id}/inhabitants` [Inferred; via `OSKBuildingUnitInhabitantController` in `db_intercoms.service.ts`, `db_user_settings.ts`]
- `/organizations/{id}/promptTemplates` [Inferred; via `OSKOrganizationPromptTemplateController` in `db_organization_prompt.service.ts`]
- `/organizations` [Inferred; via `OSKOrganizationController` in `db_organization_prompt.service.ts`, `db_residents.service.ts`, `permissionChecks.util.ts`]
- `/buildings/{id}/pincodes` [Inferred; via `OSKBuildingPincodeController` in `db_pincodes.service.ts`]
- `/buildings/{id}/units/{id}/nonAppUsers` [Inferred; via `OSKBuildingUnitNonAppUserController` in `db_pincodes.service.ts`]
- `/organizations/{id}/onboardingInhabitants` [Inferred; via `OSKOrganizationOnboardingInhabitantController` in `db_residents.service.ts`]
- `/organizations/{id}/residents` [Inferred; via `OSKOrganizationResidentsController` in `db_residents.service.ts`]
- `/users/{id}/pincodes` [Inferred; via `OSKUserPincodeController` in `db_residents.service.ts`]
- `/users/{id}/buildingSettings/{id}/unitSettings` [Inferred; via `OSKUserSettingsUnitController` in `db_user_settings.ts`]
- `/properties` [Inferred; via `OSKPropertyController` in `db_propertiesIds.service.ts`]

---

#### admin_organization

### Firestore Paths
- **`/organizations`** [Inferred]: The controller `OSKOragnizationListController` queries and retrieves documents from an organization collection [Inferred] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._query|getAll|OSKOragnizationListController.collection|#1` ``, `` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._get|getById|OSKOragnizationListController.collection,OrganizationId|#1` ``). The model `OSKOrganizationList` defines properties matching the `/organizations` schema (e.g., `name`, `organizationId`, `streetAddress`, `taxNumber`, `userId`) [Confirmed] (`` `functions/src/modules/admin/modules/admin_organization/models/documents/organization_listdocument.model.ts` (lines 8-17) ``).

#### admin_users

The capability performs read, write, and delete operations on the following Firestore collections:

- **`/buildings/{buildingId}/units/{unitId}/inhabitants`** (Read/Write)
  - Accessed via `OSKAdminInhabitantUserController` to manage inhabitant records `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts|OSKAdminInhabitantUserController.default._get|getInhabitantUserById|`/buildings/${buildingId}/units/${unitId}/inhabitants`,userId|#1` ``.
- **`/users/{userId}/accesses`** (Read/Write/Delete)
  - Accessed via `OSKAdminUserAccessController` to manage user accesses `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts|OSKAdminUserAccessController.default._get|getById|`/users/${userId}/accesses`,userAccessId|#1` ``.
- **`/users/{userId}/devices`** (Read/Delete)
  - Accessed via `OSKAdminUserDeviceController` to manage user devices `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts|OSKAdminUserDeviceController.default._delete|delete|`/users/${userId}/devices`,deviceId|#1` ``.
- **`/buildings/{buildingId}/units/{unitId}/invitations`** (Read/Write/Delete)
  - Accessed via `OSKAdminUserInvitationController` to manage building-level invitations `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts|OSKAdminUserInvitationController.default._delete|deleteBuildingInvitation|`/buildings/${buildingId}/units/${unitId}/invitations`,invitationId|#1` ``.
- **`/users/{userId}/sentInvitations`** (Write/Delete)
  - Accessed via `OSKAdminUserInvitationController` to manage invitations sent by a user `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts|OSKAdminUserInvitationController.default._delete|deleteSenderInvitation|`/users/${userId}/sentInvitations`,invitationId|#1` ``.
- **`/users/{userId}/invitations`** (Read/Delete)
  - Accessed via `OSKAdminUserInvitationController` to manage invitations received by a user `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts|OSKAdminUserInvitationController.default._delete|deleteUserInvitationById|`/users/${userId}/invitations`,invitationId|#1` ``.
- **`/users`** (Read)
  - Accessed via `OSKAdminUserController` to retrieve user profiles `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts|OSKAdminUserController.default._get|getById|OSKAdminUserController.collection,userId|#1` ``.

[Confirmed]

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

No direct API contracts or Firestore triggers are defined in this root capability [Confirmed]. It delegates trigger definition to its submodules.

---

#### admin_buildings

#### Callable Functions
- **`getAllBuildingsWithUnits`**: Retrieves a nested list of all buildings and their units for a specific organization [Confirmed: `api_contract|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|getAllBuildingsWithUnits|#1`].
  - **Request Type**: `OSKGetAllBuildingsWithUnitsRequestData` (implied by service imports) [Inferred: `functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts` (line 16)].
  - **Response Type**: `OSKGetAllBuildingsWithUnitsResponseData` [Confirmed: `type_alias|admin|functions/src/modules/admin/modules/admin_buildings/models/functions/get_all_buildings_with_units_request.type.ts|OSKGetAllBuildingsWithUnitsResponseData|#1`].

#### Resolved API Request/Response Schemas
```typescript
interface OSKGetAllBuildingsWithUnitsResponseData {
  units: OSKBuildingUnit[];
}

type OSKBuildingUnit = {
  unitId: string;
  unitNumber: string;
  name: string;
};
```

---

#### admin_maintenance

### Callable Cloud Functions
The following callable functions are registered by this capability:

- **onFixMissingMainAccessFieldsAll**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onFixMissingMainAccessFieldsAll|#1` ``]

- **onMaintenanceRecreateAccess**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceRecreateAccess|#1` ``]

- **onMaintenanceRefreshPincodes**
  - **Request Type**: `OSKDbRefreshPincodes`
    - `buildingId`: `string`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceRefreshPincodes|#1` ``]

- **onRecreateAccessDocumentInMongoDbByBuildingAll**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onRecreateAccessDocumentInMongoDbByBuildingAll|#1` ``]

- **onRecreateTokensForBuildingUsersAll**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onRecreateTokensForBuildingUsersAll|#1` ``]

- **onRemoveNonExistingUserAccessInBuildingALL**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onRemoveNonExistingUserAccessInBuildingALL|#1` ``]

- **onSyncBuildingAccessesWithUserAccessesAll**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onSyncBuildingAccessesWithUserAccessesAll|#1` ``]

- **executePincodeRefreshCallable**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|executePincodeRefreshCallable|#1` ``]

- **onMaintenanceAddIntercomDisplayNameField**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceAddIntercomDisplayNameField|#1` ``]

- **onMaintenanceAddUnitNumberField**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceAddUnitNumberField|#1` ``]

- **onMaintenanceCreateBuildingsIntercomBases**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateBuildingsIntercomBases|#1` ``]

- **onMaintenanceCreateIntercomsByUsers**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateIntercomsByUsers|#1` ``]

- **onMaintenanceCreateOrganizationsPrompt**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateOrganizationsPrompt|#1` ``]

- **onMaintenanceCreateResidents**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateResidents|#1` ``]

- **onMaintenanceCreateResidentSettingsForBuilding**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateResidentSettingsForBuilding|#1` ``]

- **onMaintenanceCreateUnitSettings**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateUnitSettings|#1` ``]

- **onMaintenanceCreateUserSettings**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateUserSettings|#1` ``]

- **onMaintenanceDeleteBuildingsIntercoms**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceDeleteBuildingsIntercoms|#1` ``]

- **onMaintenanceDeleteCallTransferLists**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceDeleteCallTransferLists|#1` ``]

- **onMaintenanceDeleteIntercomDisplayNameField**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceDeleteIntercomDisplayNameField|#1` ``]

- **onMaintenanceDeleteUsersIntercoms**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceDeleteUsersIntercoms|#1` ``]

- **onMaintenanceIntercomAddUnitNumberFields**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceIntercomAddUnitNumberFields|#1` ``]

- **onMaintenanceLinkBuildingsToProperties**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceLinkBuildingsToProperties|#1` ``]

- **onMaintenanceSyncAuthDisplayNames**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceSyncAuthDisplayNames|#1` ``]

- **onMaintenanceUpdateAccessControlDeviceModel**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceUpdateAccessControlDeviceModel|#1` ``]

- **onMaintenanceUpdateResidentsWithUnitInfo**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceUpdateResidentsWithUnitInfo|#1` ``]

---

#### admin_organization

### Callable Functions
- **`getAllOrganizations`** [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAllOrganizations|#1` ``)
  - **Request Type**: `OSKGetAllOrganizationsListRequestDocument`
  - **Request Schema**:
    ```typescript
    adminsOskeyId: string
    ```
  - **Response Type**: `any` (No explicit response schema matched in this pack)

- **`getOrganizationDetailsById`** [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getOrganizationDetailsById|#1` ``)
  - **Request Type**: `OSKGetOrganizationsDetailsByIdRequestDocument`
  - **Request Schema**:
    ```typescript
    adminsOskeyId: string
    OrganizationId: string
    ```
  - **Response Type**: `OSKOrganizationList`
  - **Response Schema**:
    ```typescript
    name: string
    organizationId: string
    streetAddress: OSKStreetAddress // import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress
    taxNumber: string
    userId: string
    ```

### Firestore Triggers
- None evidenced in this capability pack.

#### admin_users

### API Contracts (Callable Functions)

#### `addInhabitantToUnit`
- **Request Type**: `OSKAddInhabitantFromUnitRequestData`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
  - `unitId`: `string`
- **Response Type**: `OSKAddInhabitantFromUnitResponseData`
  - `accessId`: `string | undefined` (optional)
  - `inhabitantId`: `string`

#### `deleteUserData`
- **Request Type**: `OSKDeleteUserDataRequestData`
  - `accesses`: `boolean`
  - `devices`: `boolean`
  - `invitations`: `boolean`
- **Response Type**: `void`

#### `getUserAccessById`
- **Request Type**: `OSKGetUserAccessByIdRequestData`
  - `userAccessId`: `string`
- **Response Type**: `void`

#### `getUserById`
- **Request Type**: `void`
- **Response Type**: `OSKGetUserByIdResponseData`
  - `devicesCount`: `number`
  - `inhabitantIn`: `{ buildingsCount: number; unitsCount: number; }`
  - `invitationsCount`: `number`
  - `userAccessesCount`: `number`

#### `giveInhabitantAccessToUnitInhabitant`
- **Request Type**: `OSKGiveInhabitantAccessRequestData`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `unitId`: `string`
- **Response Type**: `void`

#### `removeInhabitantFromUnit`
- **Request Type**: `OSKRemoveInhabitantFromUnitRequestData`
  - `buildingId`: `string`
  - `unitId`: `string`
- **Response Type**: `void`

#### `removeUserAccessAccesses`
- **Request Type**: `OSKRemoveUserAccessAccessesRequestData`
  - `accessIds`: `string[]`
  - `userAccess`: `OSKUserAccesses`
- **Response Type**: `void`

#### `removeUserAccesses`
- **Request Type**: `OSKRemoveUserAccessesRequestData`
  - `userAccesses`: `OSKUserAccesses[]`
- **Response Type**: `void`

#### `removeUserDevices`
- **Request Type**: `OSKRemoveUserDevicesRequestData`
  - `deviceIds`: `string[]`
- **Response Type**: `void`

#### `removeUserInvitations`
- **Request Type**: `OSKRemoveUserInvitationsRequestData`
  - `invitations`: `OSKUserInvitationToRemove[]`
- **Response Type**: `void`

*Note: No `model_property` facts matched within this pack for the remaining endpoints (`createUserInvitationAccess`, `getAllUserAccesses`, `getAllUserDevices`, `getAllUserInvitations`, `getAllUsers`, `getInhabitantUserUnits`, `removeAllUserAccesses`, `removeAllUserDevices`, `removeAllUserInvitations`), so request/response schemas are not expanded.*

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

### 9. Permissions & Security

**Cross-cutting risk callouts:**

Active comparison of the submodules' permission extracts reveals several cross-cutting security patterns and anomalies:
- **Asymmetric Permission Enforcement & Broad Checks**: The `admin_maintenance` submodule utilizes a broad, non-standard permission string `v1.admin` to guard highly sensitive database migrations, data purges, and token recreations [Confirmed]. This broad check contrasts sharply with the granular permissions enforced by `admin_organization` (e.g., `v1.admin.org.view`) and `admin_users` (e.g., `v1.admin.user.delete`) [Confirmed].
- **RBAC Schema Mismatch**: The broad `v1.admin` permission string checked by `admin_maintenance` is completely absent from the official `rbac-roles.json` schema [Confirmed]. This represents a critical security-relevant mismatch where the code enforces a permission that is undocumented and unmapped in the platform's standard RBAC role definitions [Inferred].
- **Functional Permission Anomaly**: The read-only capability `admin_buildings.getAllBuildingsWithUnits` checks the permission `v1.admin.user.accesses.create` ("Allows to create a user access") instead of a building-specific view permission like `v1.admin.building.view` or `v1.admin.building.list` [Confirmed]. This creates an asymmetric security model where a user must possess write-level access-creation authority simply to view the building and unit hierarchy [Inferred].
- **Unattributed Security-Relevant Signals**: There are no unattributed security-relevant signals or raw `permission-denied` errors raised without an identifiable RBAC string behind them; all submodules explicitly map their authorization failures to either granular RBAC strings or the broad `v1.admin` string [Confirmed].

**Per-capability evidence:**

#### _module_root

No direct permission strings are referenced in this root capability's evidence [Confirmed].

---

#### admin_buildings

- **`v1.admin.user.accesses.create`**: This permission string is referenced as a candidate permission checked during the execution of `getAllBuildingsWithUnits` [Confirmed: `permission_candidate|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|v1.admin.user.accesses.create|#1`].
- **Security Mismatch / Anomaly**: The permission `v1.admin.user.accesses.create` is defined in the RBAC roles document as "Allows to create a user access." It is anomalous that a read-only structural retrieval function (`getAllBuildingsWithUnits`) checks a creation permission for user accesses rather than a building-specific read permission like `v1.admin.building.list` or `v1.admin.building.view` [Inferred].
- **Error Handling**: Throws a `permission-denied` error if the user lacks the required roles [Confirmed: `permission_error|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|permission-denied|#1`].

---

#### admin_maintenance

### Permission Mismatches & Broad Checks
- **Broad Permission Check**: The utility class `OSKMaintenancePermissionChecks` checks for a generic `v1.admin` permission string [Confirmed; `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts|v1.admin|#1` ``].
- **RBAC Mismatch**: The supplied RBAC roles document does not contain a bare `v1.admin` permission. Instead, it defines granular permissions such as `v1.admin.user.view`, `v1.admin.building.edit`, etc. This indicates a mismatch where the maintenance scripts rely on a broad, non-standard permission string that is not explicitly mapped in the granular RBAC roles document.

### Security Checks
- **User Security Checks**: All callable functions execute `OSKSecurityChecks.user_security_checks` to validate the caller's context [Confirmed; e.g., `` `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKSecurityChecks.user_security_checks|onFixMissingMainAccessFieldsAll|{ request, context }|#1` ``].
- **Parameter Validation**: Input parameters are validated using `OSKSecurityChecks.checkParameters` [Confirmed; e.g., `` `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKSecurityChecks.checkParameters|onFixMissingMainAccessFieldsAll|[{ name: 'buildingIds', value: request.buildingIds, type: 'array' }]|#1` ``].

---

#### admin_organization

The capability references several permission strings during its authorization checks:
- `v1.admin.org.view` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.view|#1` ``)
- `v1.admin.org.register` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.register|#1` ``)
- `v1.admin.org.edit` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.edit|#1` ``)
- `v1.admin.org.delete` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.delete|#1` ``)
- `v1.admin.org.validate` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.validate|#1` ``)

### Cross-Check Against RBAC Roles Document
All candidate permissions are fully aligned with the RBAC roles document:
- `v1.admin.org.view` -> "v1.admin - Allows to view the details of an organization"
- `v1.admin.org.register` -> "v1.admin - Allows to register a new organization"
- `v1.admin.org.edit` -> "v1.admin - Allows to edit an existing organization"
- `v1.admin.org.delete` -> "v1.admin - Allows to delete an organization"
- `v1.admin.org.validate` -> "v1.admin - Allows to validate a new organization"

If authorization fails, a `permission-denied` error is thrown [Confirmed] (`` `permission_error|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|permission-denied|#1` ``).

#### admin_users

The capability references several administrative permission strings to authorize requests. These permissions are checked against the consolidated roles of the calling administrator:

- **`v1.admin.user.accesses.create`**: Checked when adding inhabitants to units or creating invitation accesses `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|v1.admin.user.accesses.create|#1` ``.
- **`v1.admin.user.accesses.delete`**: Checked when removing accesses or inhabitants `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|v1.admin.user.accesses.delete|#1` ``.
- **`v1.admin.user.accesses.view`**: Checked when listing or retrieving user accesses `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts|v1.admin.user.accesses.view|#1` ``.
- **`v1.admin.user.devices.delete`**: Checked when deleting user devices `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts|v1.admin.user.devices.delete|#1` ``.
- **`v1.admin.user.devices.edit`**: Checked when modifying user devices `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts|v1.admin.user.devices.edit|#1` ``.
- **`v1.admin.user.devices.view`**: Checked when listing user devices `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts|v1.admin.user.devices.view|#1` ``.
- **`v1.admin.user.invitations.delete`**: Checked when deleting user invitations `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_invitation.service.ts|v1.admin.user.invitations.delete|#1` ``.
- **`v1.admin.user.invitations.view`**: Checked when listing user invitations `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_invitation.service.ts|v1.admin.user.invitations.view|#1` ``.
- **`v1.admin.user.delete`**: Checked when deleting user data `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts|v1.admin.user.delete|#1` ``.
- **`v1.admin.user.edit`**: Checked when editing user profiles `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts|v1.admin.user.edit|#1` ``.
- **`v1.admin.user.view`**: Checked when listing or retrieving users `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts|v1.admin.user.view|#1` ``.

### RBAC Cross-Check
All permission strings candidate-referenced in the code match the official `rbac-roles.json` specification exactly. There are no mismatches. [Confirmed]

### 10. Cross-Module Relationships

The `admin` module maintains extensive outbound dependencies and a single critical inbound dependency, as verified by the deterministic dependency graph:
- **Outbound Dependencies (Confirmed)**:
  - **`access_control_device`**: Imported by `admin_maintenance` (`db_intercoms.service.ts`) to query and update physical intercom configurations via `OSKAccessControlDeviceController` and `OSKAccessControlDeviceDocument`.
  - **`building`**: Heavily imported by `admin_buildings`, `admin_maintenance`, and `admin_users` to manage structural entities (`OSKBuildingDocument`, `OSKBuildingUnitDocument`), door configurations, intercoms, and building-level accesses.
  - **`core`**: Imported across all submodules to leverage base controllers (`OSKDocumentController`), logging services (`OSKLoggingService`), and core access utilities (`OSKAccessMessagePublisherService`, `OSKAccessUtilsService`, `OSKPincodeService`).
  - **`organization`**: Imported by `admin_maintenance` and `admin_organization` to query organization details, manage onboarding inhabitants, and save prompt templates.
  - **`settings`**: Imported by `admin_buildings`, `admin_maintenance`, and `admin_organization` to perform permission checks via `OSKConsolidatedRolesController`.
  - **`tasks`**: Imported by `admin_maintenance` (`db_pincodes.service.ts`) to schedule background tasks via `OSKTaskSchedulerService` using payloads like `OSKPincodeRefreshTaskPayload`.
  - **`user`**: Imported by `admin_maintenance` and `admin_users` to manage user profiles (`OSKUserController`), user accesses (`OSKUserAccessesController`), devices (`OSKUserDeviceService`), and user-specific pincodes.
- **Inbound Dependencies (Confirmed)**:
  - **`tasks`**: The `tasks` module depends on `admin` to execute scheduled pincode refreshes, calling `OSKPincodeRefreshWorkerService.executePincodeRefresh` from `task_handler.service.ts`.

### 11. External Hooks

#### _module_root

No external hooks, Pub/Sub topics, or environment variables are directly evidenced in this root capability [Confirmed].

---

#### admin_buildings

*No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or Cloud Storage paths) are evidenced within this capability's pack.*

---

#### admin_maintenance

### Confirmed Integrations
- **Firebase Auth**:
  - The service `OSKDbUserSettingsService` directly interacts with Firebase Auth via `auth.getUser` and `auth.updateUser` to synchronize user display names [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts` (lines 95, 104)].
- **Cloud Tasks / Task Scheduler**:
  - `OSKDbPincodesService` schedules asynchronous pincode refresh tasks using `OSKTaskSchedulerService.scheduleTask` [Confirmed; `` `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|OSKTaskSchedulerService.scheduleTask|onMaintenanceRefreshPincodes|scheduleDate,payload,targetUrl|#1` ``].

---

#### admin_organization

- **App Check Enforcement**: The callable functions are configured with App Check enforcement unless running in the Firebase Emulator environment (`enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR`) [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/index.ts|functionBuilder.runWith|getAdminOrganizationCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

#### admin_users

No external hooks, Pub/Sub topics, environment variables, or external integrations are evidenced within this capability's pack. [Confirmed]

### 12. Architectural Observations

- **High-Risk Orchestration & Coupling**: The `admin` module exhibits extremely high outbound coupling, directly calling methods across 7 other modules [Confirmed]. It acts as a "super-orchestrator" rather than a self-contained domain. This design centralizes administrative power but makes the `admin` module highly sensitive to schema or controller changes in downstream modules like `building`, `user`, and `organization` [Inferred].
- **Decoupled Asynchronous Execution**: The integration with the `tasks` module for pincode refreshes demonstrates a clean separation of concerns. Instead of executing long-running, resource-intensive pincode regenerations synchronously, `admin_maintenance` schedules these via `OSKTaskSchedulerService` [Confirmed]. The `tasks` module then calls back into `admin`'s `OSKPincodeRefreshWorkerService` asynchronously, preventing HTTP timeout issues during bulk operations [Inferred].
- **Bypassing Standard Domain Boundaries**: The `admin_maintenance` submodule frequently bypasses standard domain boundaries by executing direct database writes and recreations across collections owned by other modules (e.g., `/users/{id}/accesses`, `/buildings/{id}/pincodes`) [Confirmed]. While necessary for database migrations and consistency fixes, this pattern circumvents the localized validation logic defined in the respective owner modules [Inferred].

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Broad `v1.admin` Permission Bypass**: The use of the broad, undocumented `v1.admin` permission string in `admin_maintenance` poses a significant security risk [Inferred]. Because this permission is not defined in the official `rbac-roles.json` schema, it is unclear how it is assigned, audited, or consolidated. If a user is mistakenly granted a role containing this string, they gain unchecked access to destructive database migrations, token purges, and global configuration overrides [Inferred].
- **Privilege Escalation via Functional Anomaly**: The requirement of `v1.admin.user.accesses.create` to execute the read-only `getAllBuildingsWithUnits` function is a security risk [Inferred]. Administrators who only require read-only visibility into the building hierarchy must be granted access-creation privileges, violating the Principle of Least Privilege and increasing the risk of accidental or unauthorized access provisioning [Inferred].
- **Direct Cross-Domain Writes**: The maintenance services perform direct, unvalidated writes to collections owned by other modules (such as `user` and `building`) [Confirmed]. This bypasses the business rules and validation hooks of those modules, potentially introducing data corruption or out-of-sync states between Firestore and MongoDB if a migration script fails mid-execution [Inferred].

**Per-capability open questions:**

#### _module_root

- What specific administrative operations are exposed by the submodules (`admin_buildings`, `admin_organization`, `admin_users`, `admin_maintenance`)? [Inferred - evidence for these submodules is not present in this pack].
- How is the `OSKWithAdminOrganizationId` model utilized across the submodules? [Inferred].

#### admin_buildings

- **Permission Check Anomaly**: Why does `OSKAdminBuildingService.getAllBuildingsWithUnits` check the permission `v1.admin.user.accesses.create` instead of a building-specific view permission (e.g., `v1.admin.building.view` or `v1.admin.building.list`)? This could represent a copy-paste error or an intentional but undocumented coupling where building/unit lists are only exposed to users who can assign accesses.
- **Request Schema Resolution**: The exact request payload fields for `OSKGetAllBuildingsWithUnitsRequestData` are not fully detailed in the `model_property` facts of this capability pack, although the response schema is fully resolved.

#### admin_maintenance

- **Granular vs. Broad Admin Permissions**: Why does the maintenance utility check for a broad `v1.admin` permission when the RBAC roles document specifies granular permissions? Is there a plan to migrate these scripts to granular admin permissions?
- **MongoDB Access Schema**: What is the exact schema of the access documents recreated in MongoDB, and how does the Cloud Run middleware handle the delta payload delivery for these recreated accesses?
- **App Check Enforcement**: The callable functions are configured with `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR` [Confirmed; `functions/src/modules/admin/modules/admin_maintenance/index.ts` (line 34)]. Are there any specific App Check token requirements for administrative scripts running in production?

#### admin_organization

- **Exact Collection Path**: The exact collection path for `OSKOragnizationListController` is not explicitly declared in the facts, though it is inferred to be `/organizations` based on the controller's name and the schema.
- **Response Type of `getAllOrganizations`**: The response type of `getAllOrganizations` is not explicitly defined in the resolved schemas table, though it likely returns an array of `OSKOrganizationList` or similar.

#### admin_users

- **`OSKDocumentController` Implementation**: The capability controllers extend `OSKDocumentController` from `@oskey/core`, which encapsulates the underlying Firestore query and write operations. The exact implementation details of this base class are outside the scope of this pack. [Inferred]
- **Admin Organization Context**: The utility `getAdminOrganizationUser` resolves the calling user's admin context within an organization. The exact mechanism of how organization users are mapped to high-level platform admins is handled by the `organization` module. [Inferred]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.