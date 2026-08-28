### 0. Generation Metadata

- **runId**: `20260803_143350-1aa319b1`
- **generatedAt**: `2026-08-11T16:45:43.861Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `admin`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `admin` module serves as the centralized administrative and maintenance engine of the Oskey platform [Confirmed]. It provides high-level administrative orchestration and interfaces to manage organizations, buildings, units, users, devices, and accesses [Confirmed]. Additionally, it houses a powerful maintenance submodule (`admin_maintenance`) designed for platform-wide data repair, synchronization, and migration tasks across both Firestore and MongoDB [Confirmed].

### 2. Architectural Position

The `admin` module sits at the top of the administrative hierarchy, acting as an orchestration layer that coordinates operations across multiple domain modules, including `building`, `user`, `organization`, `access_control_device`, `settings`, and `tasks` [Confirmed]. It exposes Firebase Callable Functions to the Property Manager Portal (PGO) and platform administrators [Confirmed]. The module does not own low-level domain concepts directly; instead, it imports and orchestrates controllers and services from other modules to present administrative views and execute cross-domain maintenance scripts [Inferred].

### 3. Primary Responsibilities

#### _module_root

- **Aggregating Administrative Triggers**: Exposes a unified function `getAdminCallableFunctionTriggers` to register all administrative callable triggers. (**Confirmed**; `` `function_declaration|admin|functions/src/modules/admin/index.ts|getAdminCallableFunctionTriggers|#1` ``).
- **Orchestrating Submodule Triggers**: Calls the trigger registration functions of its sibling submodules:
  - `getAdminBuildingsCallableFunctionTriggers` (**Confirmed**; `` `call_expression|admin|functions/src/modules/admin/index.ts|getAdminBuildingsCallableFunctionTriggers|getAdminCallableFunctionTriggers|functionBuilder|#1` ``).
  - `getAdminOrganizationCallableFunctionTriggers` (**Confirmed**; `` `call_expression|admin|functions/src/modules/admin/index.ts|getAdminOrganizationCallableFunctionTriggers|getAdminCallableFunctionTriggers|functionBuilder|#1` ``).
  - `getAdminUsersCallableFunctionTriggers` (**Confirmed**; `` `call_expression|admin|functions/src/modules/admin/index.ts|getAdminUsersCallableFunctionTriggers|getAdminCallableFunctionTriggers|functionBuilder|#1` ``).
  - `maintenanceCallableFunctions.getCallableFunctionTriggers` (**Confirmed**; `` `call_expression|admin|functions/src/modules/admin/index.ts|maintenanceCallableFunctions.getCallableFunctionTriggers|getAdminCallableFunctionTriggers|functionBuilder|#1` ``).
- **Defining Shared Administrative Models**: Declares the `OSKWithAdminOrganizationId` type alias containing the `adminOrganizationId` property to enforce organization-scoped administrative contexts. (**Confirmed**; `` `type_alias|admin|functions/src/modules/admin/models/with_admin_organization_id.model.ts|OSKWithAdminOrganizationId|#1` `` and `` `model_property|admin|functions/src/modules/admin/models/with_admin_organization_id.model.ts|OSKWithAdminOrganizationId|adminOrganizationId|#1` ``).

---

#### admin_buildings

- **Expose Administrative Entry Points**: Exposes the `getAllBuildingsWithUnits` HTTPS callable API endpoint to allow administrative clients to retrieve building and unit structures [Confirmed] (`api_contract|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|getAllBuildingsWithUnits|#1`).
- **Enforce Administrative RBAC & Scope**: Resolves the administrative user's organization membership [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|getAdminOrganizationUser|getAllBuildingsWithUnits|context.auth?.uid,requestData.adminOrganizationId|#1`) and checks their consolidated permissions [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|getAllBuildingsWithUnits|adminOrganizationUser.roles,rolesToCheck|#1`) before executing queries.
- **Query Buildings and Units**: Queries the Firestore database to fetch all buildings [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts|OSKAdminBuildingController.default._query|getAll|OSKAdminBuildingController.collection|#1`) and maps their nested units [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|OSKAdminBuildingUnitController.getAll|getAllBuildingsWithUnits|building.buildingId|#1`) into a structured response payload [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|units.map|getAllBuildingsWithUnits|(u) => ({ unitId: u.unitId, unitNumber: u.unitNumber, name: u.name })|#1`).

---

#### admin_maintenance

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

#### admin_organization

### Retrieve All Organizations
The capability exposes a service method to query and return a list of all organizations registered in the system. [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getAllOrganizations|#1` ``). This operation:
- Validates that the requesting user exists in the system. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKUserController.default.get|getAllOrganizations|userId|#1` ``).
- Resolves the user's organization-level roles. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOrganizationUserController.default.get|getAllOrganizations|adminsOskeyId,userId|#1` ``).
- Enforces that the user possesses the required administrative permissions (specifically `v1.admin.org.view`, `v1.admin.org.register`, `v1.admin.org.edit`, `v1.admin.org.delete`, or `v1.admin.org.validate`). [Confirmed] (`` `functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts` (lines 50-55) ``).
- Queries the underlying Firestore collection using the document controller. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._query|getAll|OSKOragnizationListController.collection|#1` ``).

### Retrieve Organization Details by ID
The capability allows administrators to fetch the detailed configuration of a specific organization by its unique identifier. [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getOrganizationDetailsById|#1` ``). This operation:
- Verifies the requesting user's identity and retrieves their profile. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKUserController.default.get|getOrganizationDetailsById|userId|#1` ``).
- Fetches the user's organization-specific roles. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOrganizationUserController.default.get|getOrganizationDetailsById|adminsOrganizationId,userId|#1` ``).
- Performs RBAC validation to ensure the user is authorized to view, register, edit, delete, or validate organizations. [Confirmed] (`` `functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts` (lines 98-103) ``).
- Retrieves the specific organization document from Firestore. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._get|getById|OSKOragnizationListController.collection,OrganizationId|#1` ``).

---

#### admin_users

- **User Data Management**: Retrieves all users, gets user details by ID (including counts of devices, accesses, and invitations), and deletes user data (accesses, devices, and invitations) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|deleteUserData|#1` ``. [Confirmed]
- **Inhabitant Management**: Adds inhabitants to units, removes inhabitants from units, retrieves inhabitant user units, and grants inhabitant access to unit inhabitants `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|addInhabitantToUnit|#1` ``. [Confirmed]
- **User Access Management**: Retrieves all user accesses, gets user access by ID, removes user accesses, removes all user accesses, and removes specific accesses from a user access document `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserAccesses|#1` ``. [Confirmed]
- **User Device Management**: Retrieves all user devices, removes user devices, and removes all user devices `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserDevices|#1` ``. [Confirmed]
- **User Invitation Management**: Retrieves all user invitations, removes user invitations, removes all user invitations, and creates user invitation access `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserInvitations|#1` ``. [Confirmed]
- **Permission Verification**: Validates that the calling administrator has the required RBAC permissions (e.g., `v1.admin.user.view`, `v1.admin.user.edit`, `v1.admin.user.delete`, `v1.admin.user.accesses.create`, etc.) within their organization before executing any operations `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (lines 46-47) ``. [Confirmed]

### 4. Public Interfaces

#### _module_root

- **`getAdminCallableFunctionTriggers`**: The main entry point function exported by the module root to register administrative callable triggers. (**Confirmed**; `` `functions/src/modules/admin/index.ts` (lines 20-27) ``).
- **`OSKWithAdminOrganizationId`**: Exported model type alias used to enforce administrative organization scoping. (**Confirmed**; `` `exported_symbol|admin|functions/src/modules/admin/index.ts|./models/with_admin_organization_id.model|#1` ``).

---

#### admin_buildings

This capability exposes the following internal controllers and services:
- **`OSKAdminBuildingController`**: Handles querying and document operations for the `/buildings` collection [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts`, lines 10-20).
- **`OSKAdminBuildingUnitController`**: Handles querying and document operations for the nested `/buildings/{buildingId}/units` collection [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts`, lines 10-19).
- **`OSKAdminBuildingService`**: Orchestrates the business logic, permission checks, and data aggregation for administrative building queries [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts`, lines 18-62).

---

#### admin_maintenance

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

#### admin_organization

### Controllers
- **`OSKOragnizationListController`**: Extends the core `OSKDocumentController` to handle direct Firestore document operations (`_get` and `_query`) on the organization collection. [Confirmed] (`` `source_class|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController` ``).
  - `getAll()`: Queries all organization documents. [Confirmed] (`` `controller_method|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController|getAll|#1` ``).
  - `getById(OrganizationId: string)`: Retrieves a single organization document by ID. [Confirmed] (`` `controller_method|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController|getById|#1` ``).

### Services
- **`OSKOragnizationListService`**: Orchestrates the business logic, user verification, permission checks, and calls the controller to fetch data. [Confirmed] (`` `source_class|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService` ``).
  - `getAllOrganizations(request)`: Validates permissions and returns all organizations. [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getAllOrganizations|#1` ``).
  - `getOrganizationDetailsById(request)`: Validates permissions and returns a specific organization's details. [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getOrganizationDetailsById|#1` ``).

### Entry Points
- **`getAdminOrganizationCallableFunctionTriggers`**: Exposes the HTTPS callable Cloud Functions to the platform. [Confirmed] (`` `function_declaration|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAdminOrganizationCallableFunctionTriggers|#1` ``).

---

#### admin_users

### Controllers
- **`OSKAdminInhabitantUserController`**: Manages inhabitant-to-unit mappings and queries collection groups for inhabitant units `` `functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts` (lines 9-43) ``. [Confirmed]
- **`OSKAdminUserAccessController`**: Handles administrative queries and operations on user accesses `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts` (lines 9-22) ``. [Confirmed]
- **`OSKAdminUserDeviceController`**: Handles administrative deletions and queries on user devices `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts` (lines 9-26) ``. [Confirmed]
- **`OSKAdminUserInvitationController`**: Manages administrative queries, updates, and deletions on user invitations `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 9-85) ``. [Confirmed]
- **`OSKAdminUserController`**: Handles administrative queries for users `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts` (lines 9-23) ``. [Confirmed]

### Services
- **`OSKAdminInhabitantUserService`**: Orchestrates adding/removing inhabitants and granting inhabitant access `` `functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts` (lines 38-358) ``. [Confirmed]
- **`OSKAdminUserAccessService`**: Orchestrates administrative user access queries and deletions `` `functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts` (lines 24-223) ``. [Confirmed]
- **`OSKAdminUserDeviceService`**: Orchestrates administrative user device queries and deletions `` `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` (lines 21-136) ``. [Confirmed]
- **`OSKAdminUserInvitationService`**: Orchestrates administrative user invitation queries, deletions, and access creation `` `functions/src/modules/admin/modules/admin_users/services/admin_user_invitation.service.ts` (lines 29-321) ``. [Confirmed]
- **`OSKAdminUserService`**: Orchestrates administrative user queries and user data deletion `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (lines 30-148) ``. [Confirmed]

### Entry Points
- **`getAdminUsersCallableFunctionTriggers`**: Exposes all administrative user-related callable functions to Firebase Functions `` `functions/src/modules/admin/modules/admin_users/index.ts` (lines 32-67) ``. [Confirmed]

### 5. Internal Structure

*Note: This section contains the intra-module coupling analysis derived from AST import resolution.*

The `admin` module is structured into five submodules: `_module_root`, `admin_buildings`, `admin_maintenance`, `admin_organization`, and `admin_users` [Confirmed]. 

- **`_module_root`**: Acts as the central entry point, importing and exposing callable function triggers from `admin_buildings`, `admin_maintenance`, `admin_organization`, and `admin_users` [Confirmed].
- **`admin_buildings`**: Exhibits outbound coupling to `admin_users` to resolve organization users (`getAdminOrganizationUser`) and to `_module_root` for shared models (`OSKWithAdminOrganizationId`) [Confirmed].
- **`admin_maintenance`**: Couples to `admin_organization` by calling `OSKOragnizationListController` to list and process organizations during maintenance routines [Confirmed].
- **`admin_users`**: Couples back to `_module_root` to utilize shared administrative models [Confirmed].
- **`admin_organization`**: Operates with no outbound intra-module dependencies [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains the cross-cutting data ownership conclusion.*

The `admin` module does not act as the primary system of record or "true owner" for any core domain collections [Inferred]. Core collections such as `/buildings`, `/users`, `/organizations`, `/properties`, and `/suppliers` are owned by their respective domain modules (`building`, `user`, `organization`, `supplier`) [Inferred]. 

The `admin_maintenance` submodule touches almost every collection in the system (including settings, accesses, doors, intercoms, units, inhabitants, prompt templates, residents, and pincodes) [Confirmed]. However, these are strictly maintenance-level reads and writes (repairs, migrations, delta syncs) rather than primary business-logic ownership [Inferred].

The Data Ownership Hints indicate that `OSKOragnizationListController` (defined in `admin_organization`) is called by `admin_maintenance` but has no external module callers, confirming that organization listing within this module is an internal administrative view [Confirmed]. Similarly, `OSKPincodeRefreshWorkerService` (defined in `admin_maintenance`) is called by the `tasks` module to execute scheduled pincode refreshes, demonstrating that `admin` hosts the worker execution logic while the scheduling state is owned by `tasks` [Confirmed].

**Per-capability evidence:**

#### _module_root

No direct Firestore paths are shown as touched or owned by this root capability's evidence pack. (**Confirmed**).

---

#### admin_buildings

### Firestore Paths Read
- **`/buildings`** [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts|OSKAdminBuildingController.default._query|getAll|OSKAdminBuildingController.collection|#1`)
  - **Operation Scope**: Read/Query
- **`/buildings/{buildingId}/units`** [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts|OSKAdminBuildingUnitController.default._query|getAll|`/buildings/${buildingId}/units`|#1`)
  - **Operation Scope**: Read/Query

---

#### admin_maintenance

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

#### admin_organization

### Firestore Paths
This capability reads from the following Firestore collection:
- `/organizations` (via `OSKOragnizationListController.collection` mapping to the `OSKOrganizationListDocument` model). [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._query|getAll|OSKOragnizationListController.collection|#1` ``, `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|../models/documents/organization_listdocument.model|#1` ``).

*Note: Based on the evidence pack, this capability only performs read operations (`_get` and `_query`) on the `/organizations` collection. No write operations (create, update, delete) are evidenced within this submodule.* [Confirmed] (`` `functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts` (lines 17-27) ``).

---

#### admin_users

This capability performs read, write, and delete operations on the following Firestore paths:
- **`/users/{userId}/accesses`**: Read/Write via `OSKAdminUserAccessController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts` (lines 16-22) ``. [Confirmed]
- **`/users/{userId}/devices`**: Read/Write/Delete via `OSKAdminUserDeviceController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts` (lines 16-26) ``. [Confirmed]
- **`/users/{userId}/invitations`**: Read/Delete via `OSKAdminUserInvitationController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 18-38) ``. [Confirmed]
- **`/users/{userId}/sentInvitations`**: Write/Delete via `OSKAdminUserInvitationController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 71-85) ``. [Confirmed]
- **`/buildings/{buildingId}/units/{unitId}/inhabitants`**: Read/Write via `OSKAdminInhabitantUserController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts` (lines 16-43) ``. [Confirmed]
- **`/buildings/{buildingId}/units/{unitId}/invitations`**: Read/Write/Delete via `OSKAdminUserInvitationController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 40-69) ``. [Confirmed]
- **`/users`**: Read via `OSKAdminUserController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts` (lines 17-23) ``. [Confirmed]
- **`/organizations/{organizationId}/users/{userId}`**: Read via `OSKOrganizationUserController` in `getAdminOrganizationUser` utility `` `functions/src/modules/admin/modules/admin_users/utils/get_admin_organization_user.util.ts` (lines 38-39) ``. [Confirmed]
- **`/organizations/{organizationId}`**: Read via `OSKOrganizationController` in `getAdminOrganizationUser` utility `` `functions/src/modules/admin/modules/admin_users/utils/get_admin_organization_user.util.ts` (lines 29-30) ``. [Confirmed]

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

No direct API contracts or Firestore triggers are defined in this root capability itself; it delegates trigger definitions to its submodules. (**Confirmed**; `` `functions/src/modules/admin/index.ts` (lines 20-27) ``).

---

#### admin_buildings

### Callable Functions
- **`getAllBuildingsWithUnits`** [Confirmed] (`api_contract|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|getAllBuildingsWithUnits|#1`)
  - **Request Type**: `OSKGetAllBuildingsWithUnitsRequestData` (No matching `model_property` facts are present in this pack to detail the request fields, but it is imported as the request payload type) [Inferred] (`functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts`, line 16).
  - **Response Type**: `OSKGetAllBuildingsWithUnitsResponseData` [Confirmed]
    - **`units`**: `OSKBuildingUnit[]` [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/models/functions/get_all_buildings_with_units_request.type.ts`, line 7).

### Firestore Triggers
- None evidenced in this capability pack [Confirmed].

---

#### admin_maintenance

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

#### admin_organization

### API Contracts
The capability exposes two HTTPS callable functions:

#### `getAllOrganizations`
- **Type**: Callable Function [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAllOrganizations|#1` ``)
- **Request Schema**: `OSKGetAllOrganizationsListRequestDocument`
  - `adminsOskeyId`: `string`
- **Response Schema**: `OSKOrganizationList[]` (Inferred based on service orchestration returning a list of organizations).

#### `getOrganizationDetailsById`
- **Type**: Callable Function [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getOrganizationDetailsById|#1` ``)
- **Request Schema**: `OSKGetOrganizationsDetailsByIdRequestDocument`
  - `adminsOskeyId`: `string`
  - `OrganizationId`: `string`
- **Response Schema**: `OSKOrganizationList`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress` (imported from core)
  - `taxNumber`: `string`
  - `userId`: `string`

---

#### admin_users

### Callable Functions
- **`addInhabitantToUnit`**
  - Request Type: `OSKAddInhabitantFromUnitRequestData`
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
    - `unitId`: `string`
  - Response Type: `OSKAddInhabitantFromUnitResponseData`
    - `accessId`: `string | undefined` (optional)
    - `inhabitantId`: `string`
- **`createUserInvitationAccess`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`deleteUserData`**
  - Request Type: `OSKDeleteUserDataRequestData`
    - `accesses`: `boolean`
    - `devices`: `boolean`
    - `invitations`: `boolean`
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUserAccesses`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUserDevices`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUserInvitations`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUsers`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getInhabitantUserUnits`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getUserAccessById`**
  - Request Type: `OSKGetUserAccessByIdRequestData`
    - `userAccessId`: `string`
  - Response Type: No `model_property` facts matched within this pack.
- **`getUserById`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: `OSKGetUserByIdResponseData`
    - `devicesCount`: `number`
    - `inhabitantIn`: `{ buildingsCount: number; unitsCount: number; }`
    - `invitationsCount`: `number`
    - `userAccessesCount`: `number`
- **`giveInhabitantAccessToUnitInhabitant`**
  - Request Type: `OSKGiveInhabitantAccessRequestData`
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `unitId`: `string`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeAllUserAccesses`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`removeAllUserDevices`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`removeAllUserInvitations`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`removeInhabitantFromUnit`**
  - Request Type: `OSKRemoveInhabitantFromUnitRequestData`
    - `buildingId`: `string`
    - `unitId`: `string`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserAccessAccesses`**
  - Request Type: `OSKRemoveUserAccessAccessesRequestData`
    - `accessIds`: `string[]`
    - `userAccess`: `OSKUserAccesses`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserAccesses`**
  - Request Type: `OSKRemoveUserAccessesRequestData`
    - `userAccesses`: `OSKUserAccesses[]`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserDevices`**
  - Request Type: `OSKRemoveUserDevicesRequestData`
    - `deviceIds`: `string[]`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserInvitations`**
  - Request Type: `OSKRemoveUserInvitationsRequestData`
    - `invitations`: `OSKUserInvitationToRemove[]`
  - Response Type: No `model_property` facts matched within this pack.

### Firestore Triggers
No Firestore triggers are evidenced within this capability's pack. [Confirmed]

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains cross-cutting risk callouts and mental enforcement tallies across submodules.*

#### Mental Enforcement Tally
- **`admin_buildings`**: Enforces permission checks but exhibits a functional mismatch by checking `v1.admin.user.accesses.create` for a read-only operation (`getAllBuildingsWithUnits`) [Confirmed].
- **`admin_maintenance`**: Bypasses granular RBAC checks entirely by using a custom wildcard helper `OSKMaintenancePermissionChecks.isOskeyAdmin` which verifies a single `v1.admin` permission string against the "OSkey SAS" organization [Confirmed].
- **`admin_organization`**: Enforces standard granular RBAC checks (`v1.admin.org.view`, `v1.admin.org.register`, `v1.admin.org.edit`, `v1.admin.org.delete`, `v1.admin.org.validate`) [Confirmed].
- **`admin_users`**: Enforces standard granular RBAC checks (`v1.admin.user.*`) [Confirmed].

#### Cross-Cutting Risk Callouts
1. **Wildcard Permission Bypass**: The `admin_maintenance` submodule uses a custom helper `OSKMaintenancePermissionChecks.isOskeyAdmin` to check for a non-standard `v1.admin` permission string [Confirmed]. This bypasses all granular RBAC roles defined in `rbac-roles.json` for highly sensitive operations (including deleting user data, modifying settings, and recreating accesses) [Confirmed].
2. **Permission Mismatch in Buildings**: `admin_buildings` checks `v1.admin.user.accesses.create` to retrieve buildings and units [Confirmed]. This violates the principle of least privilege, as a write-level permission is required to perform a read-only query [Inferred].

**Per-capability evidence:**

#### _module_root

No explicit permission strings are directly referenced in this root capability's evidence pack. (**Confirmed**).

---

#### admin_buildings

### Permissions Referenced
- **`v1.admin.user.accesses.create`** [Confirmed] (`permission_candidate|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|v1.admin.user.accesses.create|#1`)
  - **Cross-Check**: This permission is defined in the RBAC roles document as "Allows to create a user access". 

---

#### admin_maintenance

### Permission Checks
All maintenance functions are strictly guarded by the `OSKMaintenancePermissionChecks.isOskeyAdmin` helper [Confirmed, `class_method|admin|functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts|OSKMaintenancePermissionChecks|isOskeyAdmin|#1`].

This helper performs the following checks [Confirmed, `functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts` (lines 13-28)]:
1. Resolves the organization named `'OSkey SAS'`.
2. Fetches the organization user record for the calling user.
3. Verifies if the user has the `v1.admin` permission string.

### Cross-Check Against RBAC Roles
- The permission string `v1.admin` is checked as a versioned permission candidate [Confirmed, `permission_candidate|admin|functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts|v1.admin|#1`].
- In the supplied RBAC roles document, there is no single `v1.admin` permission; instead, there are granular permissions prefixed with `v1.admin.` (e.g., `v1.admin.building.delete`, `v1.admin.user.view`). The use of `v1.admin` as a wildcard or master permission for Oskey platform administrators is an implementation-level design choice to bypass granular checks for global maintenance scripts.

#### admin_organization

### Enforced Permissions
The capability checks the requesting user's roles against a set of candidate administrative permissions. If the user possesses *any* of the following permissions, access is granted:
- `v1.admin.org.view` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.view|#1` ``)
- `v1.admin.org.register` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.register|#1` ``)
- `v1.admin.org.edit` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.edit|#1` ``)
- `v1.admin.org.delete` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.delete|#1` ``)
- `v1.admin.org.validate` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.validate|#1` ``)

### RBAC Cross-Check
All five permissions checked by the service match the authoritative `rbac-roles.json` definitions exactly:
- `v1.admin.org.view`: "v1.admin - Allows to view the details of an organization" (Match)
- `v1.admin.org.register`: "v1.admin - Allows to register a new organization" (Match)
- `v1.admin.org.edit`: "v1.admin - Allows to edit an existing organization" (Match)
- `v1.admin.org.delete`: "v1.admin - Allows to delete an organization" (Match)
- `v1.admin.org.validate`: "v1.admin - Allows to validate a new organization" (Match)

### Security Violations & Error Handling
If the user does not possess any of the required permissions, the service throws an HTTPS `permission-denied` error. [Confirmed] (`` `permission_error|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|permission-denied|#1` ``).

---

#### admin_users

The following permission strings are referenced and checked by this capability's services:
- `v1.admin.user.accesses.create` `` `functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts` (line 65) ``
- `v1.admin.user.accesses.delete` `` `functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts` (line 164) ``
- `v1.admin.user.accesses.view` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts` (line 41) ``
- `v1.admin.user.devices.delete` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` (line 41) ``
- `v1.admin.user.devices.edit` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` (line 40) ``
- `v1.admin.user.devices.view` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` (line 39) ``
- `v1.admin.user.invitations.delete` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_invitation.service.ts` (line 46) ``
- `v1.admin.user.invitations.view` `` `functions/src/modules/admin/modules/admin_user_invitation.service.ts` (line 46) ``
- `v1.admin.user.delete` `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (line 46) ``
- `v1.admin.user.edit` `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (line 46) ``
- `v1.admin.user.view` `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (line 46) ``

### Cross-Check Against RBAC Roles Document
All referenced permission strings match the definitions in `rbac-roles.json` exactly. [Confirmed]

### 10. Cross-Module Relationships

*Note: This section is populated entirely from the Cross-Module Dependency Graph and Resolved Cross-Module Call Edges.*

#### Outbound Dependencies (Confirmed)
- **`access_control_device`**: Imported by `admin_maintenance` (`db_intercoms.service.ts`) to manage intercom configurations and documents (`OSKAccessControlDeviceController`, `OSKAccessControlDeviceDocument`).
- **`building`**: Heavily imported by `admin_buildings`, `admin_maintenance`, and `admin_users` to manage buildings, units, doors, intercoms, settings, and accesses (`OSKBuildingDocument`, `OSKBuildingUnitDocument`, `OSKBuildingAccessesController`, `OSKBuildingDoorController`, `OSKBuildingIntercomController`, etc.).
- **`core`**: Imported across all submodules for base document controller operations (`OSKDocumentController`), logging (`OSKLoggingService`), and access message publishing (`OSKAccessMessagePublisherService`, `OSKPincodeService`).
- **`organization`**: Imported by `admin_maintenance` and `admin_users` to manage organizations, properties, prompt templates, and residents (`OSKOrganizationController`, `OSKOrganizationPromptTemplateController`, `OSKPropertyController`, `OSKOrganizationResidentsController`).
- **`settings`**: Imported by `admin_buildings`, `admin_maintenance`, and `admin_organization` to perform consolidated role and permission checks (`OSKConsolidatedRolesController`).
- **`tasks`**: Imported by `admin_maintenance` (`db_pincodes.service.ts`) to schedule background tasks (`OSKTaskSchedulerService`, `OSKPincodeRefreshTaskPayload`).
- **`user`**: Imported by `admin_maintenance` and `admin_users` to manage user profiles, accesses, devices, and settings (`OSKUserAccessesController`, `OSKUserController`, `OSKUserDeviceService`, `OSKUserSettingsBuildingController`).

#### Inbound Dependencies (Confirmed)
- **`tasks`**: The `tasks` module depends on `admin` to execute scheduled pincode refreshes. Specifically, `functions/src/modules/tasks/services/task_handler.service.ts` imports and calls `OSKPincodeRefreshWorkerService.executePincodeRefresh` from the `admin_maintenance` submodule.

### 11. External Hooks

#### _module_root

No external hooks, pubsub topics, or environment variables are directly evidenced in this root capability's pack. (**Confirmed**).

---

#### admin_buildings

- None evidenced in this capability pack [Confirmed].

---

#### admin_maintenance

### Confirmed Integrations
- **Firebase Auth**: Integrates with Firebase Auth to retrieve and update user display names [Confirmed, `functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts` (lines 90-104)].
- **GCP Cloud Tasks**: Integrates with `OSKTaskSchedulerService` to schedule background pincode refresh tasks [Confirmed, `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|OSKTaskSchedulerService.scheduleTask|onMaintenanceRefreshPincodes|scheduleDate,payload,targetUrl|#1`].

#### admin_organization

### HTTPS Callable Functions
The capability registers two external entry points via Firebase Functions:
- `getAllOrganizations` [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/index.ts|https.onCall|OSKOragnizationListService.getAllOrganizations|#1` ``).
- `getOrganizationDetailsById` [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/index.ts|https.onCall|OSKOragnizationListService.getOrganizationDetailsById|#1` ``).

### App Check Enforcement
The callable functions are configured with App Check enforcement enabled in non-emulator environments:
- `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR` [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/index.ts|functionBuilder.runWith|getAdminOrganizationCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

---

#### admin_users

No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or Cloud Storage paths) are directly evidenced within this capability's pack. [Confirmed]

### 12. Architectural Observations

- **Orchestration Layer Pattern**: The `admin` module acts strictly as an administrative orchestration layer. It does not implement low-level database operations or business logic for domain entities; instead, it imports controllers and services from `building`, `user`, and `organization` to perform actions [Inferred]. This is highly visible in `admin_users`, which coordinates complex multi-step workflows (e.g., adding an inhabitant involves calling `OSKAccessService.createAccess`, `OSKBuildingDoorController.getSafe`, and `OSKBuildingUnitInhabitantService.addInhabitant`) [Confirmed].
- **Maintenance Bypass Pattern**: The `admin_maintenance` submodule represents a "backdoor" architectural pattern. While the rest of the application enforces strict domain boundaries and granular RBAC, `admin_maintenance` consolidates cross-domain read/write capabilities under a single wildcard permission (`v1.admin`) to perform platform-wide repairs and migrations [Inferred].
- **Asynchronous Task Execution**: The coupling with the `tasks` module demonstrates a clean separation between task scheduling (owned by `tasks`) and task execution (delegated to `admin_maintenance`'s `OSKPincodeRefreshWorkerService`) [Confirmed].

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Wildcard Permission Mismatch**: The permission string `v1.admin` used by `admin_maintenance` is completely absent from the authoritative `rbac-roles.json` schema [Confirmed]. This creates an unmapped security boundary where platform-wide write access is granted via an undocumented role [Inferred].
- **Least Privilege Violation in Buildings**: The requirement of `v1.admin.user.accesses.create` for the read-only `getAllBuildingsWithUnits` endpoint prevents standard read-only administrative roles from accessing building lists without also gaining access-creation privileges [Inferred].
- **Typo-Induced Maintenance Risks**: The classes `OSKOragnizationListController` and `OSKOragnizationListService` contain a structural typo ("Oragnization") [Confirmed]. While functional, this introduces risks of developer confusion and integration errors during maintenance or refactoring [Inferred].
- **Unresolved Request/Response Schemas**: Multiple administrative endpoints (e.g., `createUserInvitationAccess`, `getAllUserAccesses`, `getAllUserDevices`) lack resolved request/response schemas due to missing `model_property` facts in the evidence [Inferred].
- **Auth0 Deletion Synchronization Gap**: It is unknown whether administrative user deletion (`deleteUserData` in `admin_users`) triggers corresponding identity deletion or suspension in Auth0, potentially leaving orphaned credentials in the identity provider [Inferred].

**Per-capability open questions:**

#### _module_root

- **Submodule Functionality**: What specific administrative actions and endpoints are exposed by the submodules (`admin_buildings`, `admin_organization`, `admin_users`, `admin_maintenance`)? (**Inferred**; this is handled by those submodules' capability syntheses, but remains an open question from the perspective of this root capability alone).
- **Model Usage**: How is the `OSKWithAdminOrganizationId` model utilized across the platform? (**Inferred**; the evidence pack shows its definition but not its downstream usage).

#### admin_buildings

- **Permission Mismatch**: Why does `OSKAdminBuildingService.getAllBuildingsWithUnits` check the permission `v1.admin.user.accesses.create` [Confirmed] (`permission_candidate|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|v1.admin.user.accesses.create|#1`)? This permission is defined as "Allows to create a user access" in the RBAC roles document, which seems functionally mismatched for a read-only operation retrieving buildings and units.
- **Request Schema Details**: What are the exact fields of `OSKGetAllBuildingsWithUnitsRequestData`? No `model_property` facts were provided in this pack to define its structure [Unknown].

#### admin_maintenance

- **Wildcard Permission Resolution**: How is the `v1.admin` permission mapped to the granular `v1.admin.*` permissions in the settings/role module, given that `v1.admin` itself is not listed in the standard RBAC roles document? [Inferred]
- **Task Target URL**: What is the exact target URL used when scheduling pincode refresh tasks via `OSKTaskSchedulerService`? [Unknown]

#### admin_organization

- **Write Operations**: The service checks permissions for editing, deleting, registering, and validating organizations (`v1.admin.org.edit`, `v1.admin.org.delete`, `v1.admin.org.register`, `v1.admin.org.validate`), but the submodule only implements read-only operations (`getAllOrganizations` and `getOrganizationDetailsById`). Are the corresponding write operations implemented in a different submodule of `admin` or a different module entirely? [Unknown]
- **Typo in Class Names**: The classes `OSKOragnizationListController` and `OSKOragnizationListService` contain a typo ("Oragnization" instead of "Organization"). This is confirmed in the codebase but noted here to prevent manual refactoring mismatches. [Confirmed] (`` `source_class|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController` ``, `` `source_class|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService` ``).

#### admin_users

- **Unresolved Request/Response Schemas**: The exact structures of request/response payloads for `createUserInvitationAccess`, `getAllUserAccesses`, `getAllUserDevices`, `getAllUserInvitations`, `getAllUsers`, `getInhabitantUserUnits`, `removeAllUserAccesses`, `removeAllUserDevices`, and `removeAllUserInvitations` are not fully resolved in the provided evidence pack due to missing `model_property` facts. [Inferred]
- **Auth0 Synchronization**: It is unclear from the evidence pack whether deleting user data via `deleteUserData` also triggers a deletion or suspension of the user's Auth0 identity, or if that is handled asynchronously by another module. [Inferred]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.