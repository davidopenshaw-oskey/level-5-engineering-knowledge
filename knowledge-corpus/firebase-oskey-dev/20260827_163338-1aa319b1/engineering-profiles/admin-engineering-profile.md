### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T16:48:41.667Z
- repoName: firebase-oskey-dev
- targetModule: admin
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash

### 1. Executive Summary

The `admin` module serves as the master administrative and maintenance engine of the Oskey platform [Confirmed]. It provides high-level platform administration capabilities—including the management of organizations, buildings, users, devices, and invitations—and hosts a comprehensive suite of system maintenance, data migration, and database repair utilities [Confirmed]. It acts as a secure gateway for platform-level operators (such as Oskey SAS Administrators) to execute critical operations that cross standard tenant boundaries [Confirmed].

### 2. Architectural Position

The `admin` module sits at the apex of the platform's administrative hierarchy, positioned above standard tenant-scoped modules to facilitate cross-tenant operations [Inferred]. 
- **Parent Scope**: Platform-level administrative and system-wide maintenance scope [Inferred].
- **Owned Concepts**: Platform-wide administrative workflows, database migrations, cross-tenant maintenance scripts, and platform-level organization/user auditing [Confirmed].
- **Provided Capabilities**: Aggregates and exposes secure callable Cloud Function triggers from its submodules (`admin_buildings`, `admin_organization`, `admin_users`, and `admin_maintenance`) to platform administrators [Confirmed].

### 3. Primary Responsibilities

#### _module_root

- **Aggregation of Administrative Cloud Functions**: Consolidates callable function triggers from various administrative submodules into a single exportable trigger builder function `getAdminCallableFunctionTriggers` [Confirmed: `functions/src/modules/admin/index.ts` (lines 20-27)].
- **Shared Administrative Data Models**: Defines and exports common data structures, such as the `OSKWithAdminOrganizationId` type alias, which enforces the presence of an `adminOrganizationId` property [Confirmed: `functions/src/modules/admin/models/with_admin_organization_id.model.ts` (lines 6-7)].

#### admin_buildings

This capability is responsible for the following features:
- **Retrieving Buildings and Units**: Orchestrates the retrieval of all buildings and maps their nested units (including unit ID, unit number, and name) into a structured response payload [Confirmed: `functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts` (lines 47-58)].
- **Administrative RBAC Enforcement**: Validates that the requesting user belongs to the specified organization and possesses the required administrative permissions before executing queries [Confirmed: `functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts` (lines 29-43)].
- **Querying Firestore Collections**: Directly queries the `/buildings` collection and the nested `/buildings/{buildingId}/units` subcollections via dedicated document controllers [Confirmed: `functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts` (lines 18-20); `functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts` (lines 17-19)].

---

#### admin_maintenance

### Pincode Refresh Orchestration
- **Inhabitant Pincode Refreshing**: Orchestrates the rotation and refreshing of inhabitant pincodes for a specific building. It queries existing pincodes, schedules asynchronous refresh tasks via Google Cloud Tasks, and publishes updates to the Access Control Devices (ACDs) offline caches `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|executePincodeRefreshCallable|#1` ``.
- **Pincode Refresh Worker**: Executes individual pincode refresh tasks by generating a new pincode, deleting the old pincode document, and publishing the update to all authorized ACDs `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service.ts|OSKPincodeRefreshWorkerService|executePincodeRefresh|#1` ``.

### Access Document and Token Recreation
- **MongoDB Access Projection Recreation**: Recreates access documents in MongoDB for all ACDs in a building to ensure edge devices have the correct, synchronized access permissions `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|recreateAccessDocumentInMongoDbByBuilding|#1` ``.
- **BLE Token Regeneration**: Regenerates Bluetooth Low Energy (BLE) access tokens for building users to resolve synchronization issues with mobile devices `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|recreateTokensForBuildingUsers|#1` ``.

### Database Consistency & Cleanup
- **Orphaned Access Removal**: Identifies and removes building access documents for users who no longer exist in the primary `/users` collection `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|removeNonExistingUserAccessInBuilding|#1` ``.
- **Access Synchronization**: Synchronizes building-level accesses with user-level accesses to resolve discrepancies between user profiles and building access lists `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|syncBuildingAccessesWithUserAccesses|#1` ``.
- **Main Access Field Repair**: Scans and repairs missing `isMainAccess` fields in both user and building access documents to ensure proper routing and authorization logic `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService|fixMissingMainAccessFields|#1` ``.

### Schema & Field Migrations
- **Intercom Display Name Field Migration**: Adds or deletes the `intercomDisplayName` field across building settings and user-specific building settings `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|OSKDbBuildingSettingsService|onMaintenanceAddIntercomDisplayNameField|#1` ``.
- **Unit Number Field Migration**: Migrates building settings and user-specific building settings to support the `allowUnitNumber` configuration `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|OSKDbBuildingSettingsService|onMaintenanceAddUnitNumberField|#1` ``.
- **ACD Model Updates**: Updates the underlying data model for Access Control Devices across main collections and sub-collections `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|updateAccessControlDeviceModel|#1` ``.

### Intercom Directory & Call Transfer List Management
- **Intercom Base Creation**: Initializes base intercom entries for buildings and doors `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|createBuildingIntercomsBase|#1` ``.
- **Call Transfer List Cleanup**: Deletes obsolete call transfer lists for intercoms to prevent routing errors `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService|deleteCallTransferLists|#1` ``.
- **Intercom Unit Number Fields**: Updates intercom directory entries with unit numbers to support unit-based directory views `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercom_allowUnitNumber.service.ts|OSKDbIntercomUnitNumberService|onMaintenanceIntercomAddUnitNumberFields|#1` ``.

### Resident & Organization Setup
- **Resident Profile Creation**: Generates resident profiles in bulk from existing onboarding cards for specified organizations `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|OSKDbResidentsService|createResidents|#1` ``.
- **Resident Unit Info Synchronization**: Updates resident profiles with floor and unit number information retrieved from the building unit configuration `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|OSKDbResidentsService|onMaintenanceUpdateResidentsWithUnitInfo|#1` ``.
- **Organization Prompt Templates**: Provisions default prompt templates for organizations `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_organizations/db_organization_prompt.service.ts|OSKDbOrganizationPromptService|onMaintenanceCreateOrganizationsPrompt|#1` ``.

### Property Linking
- **Building-to-Property Linking**: Automatically links unassigned buildings to their parent properties within the organization hierarchy `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_propertiesIds/db_propertiesIds.service.ts|OSKDbPropertiesService|onMaintenanceLinkBuildingsToProperties|#1` ``.

### Auth Display Name Synchronization
- **Firebase Auth Display Name Sync**: Synchronizes user display names from Firestore user profiles to Firebase Authentication user records `` `service_method|admin|functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts|OSKDbUserSettingsService|onMaintenanceSyncAuthDisplayNames|#1` ``.

---

#### admin_organization

### Retrieve All Organizations
Allows an authorized administrator to query and retrieve a list of all organizations registered in the system. [Confirmed]
- **Implementation**: The service calls `OSKOragnizationListController.getAll()` to query the underlying Firestore collection. `` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListController.default.getAll|getAllOrganizations||#1` ``.
- **Citations**: `` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getAllOrganizations|#1` ``, `` `controller_method|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController|getAll|#1` ``.

### Retrieve Organization Details by ID
Allows an authorized administrator to fetch detailed information about a specific organization by its unique identifier. [Confirmed]
- **Implementation**: The service calls `OSKOragnizationListController.getById()` with the target `OrganizationId`. `` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListController.default.getById|getOrganizationDetailsById|requestData.OrganizationId|#1` ``.
- **Citations**: `` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getOrganizationDetailsById|#1` ``, `` `controller_method|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController|getById|#1` ``.

### Enforce Administrative RBAC Permissions
Ensures that only users with valid administrative roles can access organization data. [Confirmed]
- **Implementation**: Before executing queries, the service retrieves the requesting user's consolidated roles and verifies them against a list of required administrative permissions. `` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|getAllOrganizations|adminOskeyUser.roles,rolesToCheck|#1` ``.
- **Citations**: `functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts` (lines 48-62, 96-110).

---

#### admin_users

The `admin_users` capability is structured around several core administrative domains:

### Administrative User Management [Confirmed]
- **Fetch All Users**: Retrieves a list of all users registered in the system `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUsers|#1` ``.
- **Fetch User Details by ID**: Retrieves detailed user profiles, including aggregated counts of their devices, invitations, and accesses, as well as the units they inhabit `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getUserById|#1` ``.
- **Delete User Data**: Performs administrative deletion of user-associated data, including accesses, devices, and invitations `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|deleteUserData|#1` ``.

### Administrative Inhabitant Unit Management [Confirmed]
- **Add Inhabitant to Unit**: Assigns a user as an inhabitant of a specific building unit, resolving authorized doors and creating the corresponding access records `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|addInhabitantToUnit|#1` ``.
- **Remove Inhabitant from Unit**: Revokes a user's inhabitant status from a specific unit `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeInhabitantFromUnit|#1` ``.
- **Fetch Inhabitant Units**: Retrieves all building units associated with a specific inhabitant user `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getInhabitantUserUnits|#1` ``.
- **Grant Inhabitant Access**: Provisions explicit inhabitant access to a unit and its authorized doors `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|giveInhabitantAccessToUnitInhabitant|#1` ``.

### Administrative User Access Management [Confirmed]
- **Fetch All User Accesses**: Retrieves all active accesses associated with a user `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserAccesses|#1` ``.
- **Fetch User Access by ID**: Retrieves a specific user access record by its ID `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getUserAccessById|#1` ``.
- **Remove User Accesses**: Revokes specific user accesses or all accesses associated with a user `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeUserAccesses|#1` `` `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeAllUserAccesses|#1` ``.
- **Remove Specific Access Items**: Revokes specific door or building access items from a user's consolidated access record `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeUserAccessAccesses|#1` ``.

### Administrative User Device Management [Confirmed]
- **Fetch All User Devices**: Retrieves all registered devices (e.g., mobile phones, smartwatches) associated with a user `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserDevices|#1` ``.
- **Remove User Devices**: Deletes specific devices or all devices associated with a user `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeUserDevices|#1` `` `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeAllUserDevices|#1` ``.

### Administrative User Invitation Management [Confirmed]
- **Fetch All User Invitations**: Retrieves all invitations sent to or by a user `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserInvitations|#1` ``.
- **Remove User Invitations**: Deletes specific invitations or all invitations associated with a user `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeUserInvitations|#1` `` `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|removeAllUserInvitations|#1` ``.
- **Create Invitation Access**: Provisions access rights based on an accepted building unit invitation `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|createUserInvitationAccess|#1` ``.

### 4. Public Interfaces

#### _module_root

- **`getAdminCallableFunctionTriggers`**: A public function that aggregates and returns the callable function triggers for the administrative submodules [Confirmed: `function_declaration|admin|functions/src/modules/admin/index.ts|getAdminCallableFunctionTriggers|#1`].
- **`OSKWithAdminOrganizationId`**: A shared type alias exported for use within the module to represent payloads containing an administrative organization ID [Confirmed: `exported_symbol|admin|functions/src/modules/admin/index.ts|./models/with_admin_organization_id.model|#1`].

#### admin_buildings

This capability exposes the following internal controllers and entry points:
- **`OSKAdminBuildingController`**: Extends `OSKDocumentController` to manage queries against the primary `/buildings` collection [Confirmed: `functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts` (lines 10-15)].
- **`OSKAdminBuildingUnitController`**: Extends `OSKDocumentController` to manage queries against the `/buildings/{buildingId}/units` subcollection [Confirmed: `functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts` (lines 10-14)].
- **`OSKAdminBuildingService`**: Orchestrates the business logic, permission checks, and data mapping for the administrative building workflows [Confirmed: `functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts` (lines 18-20)].
- **`getAdminBuildingsCallableFunctionTriggers`**: The Firebase HTTPS callable function entry point that registers the `getAllBuildingsWithUnits` API contract [Confirmed: `functions/src/modules/admin/modules/admin_buildings/index.ts` (lines 17-23)].

---

#### admin_maintenance

The capability exposes its maintenance operations through a single entry point file that registers Firebase HTTPS Callable Functions:
- **`functions/src/modules/admin/modules/admin_maintenance/index.ts`**: Exposes the `getCallableFunctionTriggers` function, which registers all maintenance callable endpoints `` `function_declaration|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|getCallableFunctionTriggers|#1` ``.

The business logic is encapsulated in the following specialized maintenance services:
- **`OSKDbAccessService`**: Manages access projection recreation, token regeneration, and access document repairs `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService` ``.
- **`OSKDbBuildingSettingsService`**: Handles building-level settings migrations `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts|OSKDbBuildingSettingsService` ``.
- **`OSKDbIntercomUnitNumberService`**: Manages intercom directory unit number migrations `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercom_allowUnitNumber.service.ts|OSKDbIntercomUnitNumberService` ``.
- **`OSKDbIntercomService`**: Handles intercom base creation, deletion, and device model updates `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts|OSKDbIntercomService` ``.
- **`OSKDbOrganizationPromptService`**: Provisions organization prompt templates `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_organizations/db_organization_prompt.service.ts|OSKDbOrganizationPromptService` ``.
- **`OSKDbPincodesService`**: Orchestrates building-wide pincode refreshes `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|OSKDbPincodesService` ``.
- **`OSKPincodeRefreshWorkerService`**: Executes individual pincode refresh tasks `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service.ts|OSKPincodeRefreshWorkerService` ``.
- **`OSKDbPropertiesService`**: Links buildings to properties `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_propertiesIds/db_propertiesIds.service.ts|OSKDbPropertiesService` ``.
- **`OSKDbResidentsService`**: Manages resident profile creation and synchronization `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts|OSKDbResidentsService` ``.
- **`OSKDbUserSettingsService`**: Manages user-level settings migrations and Firebase Auth synchronization `` `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts|OSKDbUserSettingsService` ``.

---

#### admin_organization

### Controllers
- **`OSKOragnizationListController`** (extends `OSKDocumentController` from `@oskey/core`): Handles direct document retrieval and querying for the organization list.
  - **Methods**:
    - `getAll()`: Queries the organization collection. `` `controller_method|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController|getAll|#1` ``.
    - `getById(id: string)`: Fetches a single organization document. `` `controller_method|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController|getById|#1` ``.
  - **Citations**: `functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts` (lines 12-28).

### Services
- **`OSKOragnizationListService`**: Orchestrates permission checks, user validation, and controller calls for organization administration.
  - **Methods**:
    - `getAllOrganizations(request)`: Validates the administrator's identity and permissions, then returns all organizations. `` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getAllOrganizations|#1` ``.
    - `getOrganizationDetailsById(request)`: Validates permissions and returns details for a specific organization. `` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getOrganizationDetailsById|#1` ``.
  - **Citations**: `functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts` (lines 18-123).

### Entry Points (Callable Cloud Functions)
- **`getAllOrganizations`**: HTTPS callable function trigger. `` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAllOrganizations|#1` ``.
- **`getOrganizationDetailsById`**: HTTPS callable function trigger. `` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getOrganizationDetailsById|#1` ``.
- **Citations**: `functions/src/modules/admin/modules/admin_organization/index.ts` (lines 22-123).

---

#### admin_users

The capability exposes its functionality through specialized controllers and a single entry point for Cloud Functions:

### Controllers [Confirmed]
- **`OSKAdminInhabitantUserController`**: Manages the `/buildings/${buildingId}/units/${unitId}/inhabitants` collection group and documents `` `functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts` (lines 9-45) ``.
- **`OSKAdminUserAccessController`**: Manages the `/users/${userId}/accesses` collection and documents `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts` (lines 9-24) ``.
- **`OSKAdminUserDeviceController`**: Manages the `/users/${userId}/devices` collection and documents `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts` (lines 9-28) ``.
- **`OSKAdminUserInvitationController`**: Manages user invitations across `/users/${userId}/invitations`, `/buildings/${buildingId}/units/${unitId}/invitations`, and `/users/${userId}/sentInvitations` collections `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 9-87) ``.
- **`OSKAdminUserController`**: Manages the `/users` collection and documents `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts` (lines 9-25) ``.

### Entry Points [Confirmed]
- **`getAdminUsersCallableFunctionTriggers`**: The main entry point that registers all callable HTTPS triggers for the `admin_users` capability `` `functions/src/modules/admin/modules/admin_users/index.ts` (lines 32-67) ``.

### 5. Internal Structure

*Note: This section contains only the intra-module coupling note derived from AST import resolution.*

The `admin` module is structured into five submodules: the module root (`_module_root`) and four specialized submodules (`admin_buildings`, `admin_maintenance`, `admin_organization`, and `admin_users`) [Confirmed]. Intra-module coupling is deterministically established as follows:
- **`_module_root`** acts as the central orchestrator, importing and exposing callable triggers from all four submodules: `admin_buildings`, `admin_maintenance`, `admin_organization`, and `admin_users` [Confirmed].
- **`admin_buildings`** exhibits outbound coupling to `_module_root` (importing the shared `OSKWithAdminOrganizationId` model) and to `admin_users` (importing the utility `getAdminOrganizationUser`) [Confirmed].
- **`admin_maintenance`** exhibits outbound coupling to `admin_organization` (importing `OSKOragnizationListController` to facilitate organization-level maintenance tasks) [Confirmed].
- **`admin_users`** exhibits outbound coupling to `_module_root` (importing the shared `OSKWithAdminOrganizationId` model) [Confirmed].
- **`admin_organization`** has no outbound intra-module dependencies but receives inbound coupling from `admin_maintenance` [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains only the cross-cutting data ownership conclusion.*

The `admin` module does not act as the primary business "owner" of the core domain collections (such as `/buildings`, `/users`, `/organizations`, or `/properties`) during standard runtime operations [Inferred]. Instead, its data access patterns are characterized by two distinct modalities:
1. **Platform-Level Read/Write Maintenance**: The `admin_maintenance` submodule acts as a master repair and migration engine, possessing broad read, write, and delete capabilities across almost all major collections (e.g., `/buildings/{id}/accesses`, `/buildings/{id}/settings`, `/buildings/{id}/intercoms`, `/users/{id}/accesses`, `/properties`) [Confirmed]. This is a system-level administrative override rather than business domain ownership [Inferred].
2. **Platform-Level Administration**: The `admin_organization` submodule defines the `OSKOragnizationListController` which reads from `/organizations` [Confirmed]. While it is called internally by `admin_maintenance` [Confirmed], the authoritative business ownership of the `/organizations` collection belongs to the `organization` module, with `admin` acting as a platform-level inspector [Inferred].
3. **Asynchronous Task Execution**: The `admin_maintenance` submodule defines `OSKPincodeRefreshWorkerService`, which is called by the external `tasks` module to execute scheduled pincode refreshes [Confirmed]. This indicates that while `admin` contains the execution logic for pincode regeneration, the lifecycle trigger is owned and orchestrated by the `tasks` module [Inferred].

**Per-capability evidence:**

#### _module_root

No direct Firestore path operations are evidenced within this root capability's pack [Confirmed].

#### admin_buildings

This capability queries and reads from the following Firestore paths:
- **`/buildings`**: Read-only access via `OSKAdminBuildingController` [Confirmed: `` `call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts|OSKAdminBuildingController.default._query|getAll|OSKAdminBuildingController.collection|#1` ``].
- **`/buildings/{buildingId}/units`**: Read-only access via `OSKAdminBuildingUnitController` [Confirmed: `` `call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts|OSKAdminBuildingUnitController.default._query|getAll|`/buildings/${buildingId}/units`|#1` ``].

---

#### admin_maintenance

The `admin_maintenance` capability does not "own" any primary business collections in the sense of being their sole writer during normal operations. Instead, as a maintenance capability, it has broad read, write, and delete permissions across almost all major Firestore collections to perform migrations and repairs:

| Firestore Collection Path | Operations | Description |
| :--- | :--- | :--- |
| `/buildings/{buildingId}/accesses` | Read, Write, Delete | Repairs `isMainAccess` fields, removes orphaned accesses, and syncs with user accesses `` `functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts` (lines 284-479) ``. |
| `/buildings/{buildingId}/settings` | Read, Write | Migrates building settings for intercom display names and unit numbers `` `functions/src/modules/admin/modules/admin_maintenance/db_building/db_building_settings.service.ts` (lines 43-181) ``. |
| `/buildings/{buildingId}/intercoms` | Read, Write, Delete | Creates base intercoms, updates entries with unit numbers, and deletes intercoms `` `functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts` (lines 460-488) ``. |
| `/buildings/{buildingId}/callTransferList` | Read, Delete | Deletes obsolete call transfer lists `` `functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts` (lines 322-336) ``. |
| `/organizations/{organizationId}/promptTemplates` | Write | Provisions default prompt templates `` `functions/src/modules/admin/modules/admin_maintenance/db_organizations/db_organization_prompt.service.ts` (lines 13-93) ``. |
| `/organizations/{organizationId}/residents` | Read, Write | Creates resident profiles and updates them with unit info `` `functions/src/modules/admin/modules/admin_maintenance/db_residents/db_residents.service.ts` (lines 81-212) ``. |
| `/properties` | Read, Write | Links unassigned buildings to properties `` `functions/src/modules/admin/modules/admin_maintenance/db_propertiesIds/db_propertiesIds.service.ts` (lines 13-72) ``. |
| `/users/{userId}/accesses` | Read, Write | Repairs `isMainAccess` fields and syncs accesses `` `functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts` (lines 365-445) ``. |
| `/users/{userId}/buildingSettings` | Read, Write | Migrates user-specific building settings `` `functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts` (lines 119-161) ``. |
| `/users/{userId}/buildingSettings/{buildingId}/unitSettings` | Read, Write | Provisions user unit settings `` `functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts` (lines 163-235) ``. |
| `/users` | Read | Queries users for display name sync and existence checks `` `functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts` (lines 79-117) ``. |
| `/accessControlDevices` | Read, Write | Updates device models `` `functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts` (lines 367-446) ``. |

---

#### admin_organization

### Firestore Collections Read
- **`/organizations`**: The capability reads organization documents via `OSKOragnizationListController` (which maps to the `/organizations` collection). [Confirmed]
  - **Citations**: `` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._get|getById|OSKOragnizationListController.collection,OrganizationId|#1` ``, `` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._query|getAll|OSKOragnizationListController.collection|#1` ``.

---

#### admin_users

The `admin_users` capability performs read, write, and delete operations on the following Firestore collection paths:

### `/buildings/{buildingId}/units/{unitId}/inhabitants` [Confirmed]
- **Operations**: Read, Write `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts|OSKAdminInhabitantUserController.default._get|getInhabitantUserById|`/buildings/${buildingId}/units/${unitId}/inhabitants`,userId|#1` `` `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts|OSKAdminInhabitantUserController.default._update|updateInhabitantUser|`/buildings/${buildingId}/units/${unitId}/inhabitants`,userId,data|#1` ``.

### `/users/{userId}/accesses` [Confirmed]
- **Operations**: Read, Write `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts|OSKAdminUserAccessController.default._get|getById|`/users/${userId}/accesses`,userAccessId|#1` ``.

### `/users/{userId}/devices` [Confirmed]
- **Operations**: Read, Delete `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts|OSKAdminUserDeviceController.default._delete|delete|`/users/${userId}/devices`,deviceId|#1` `` `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts|OSKAdminUserDeviceController.default._deleteAll|deleteAll|`/users/${userId}/devices`|#1` ``.

### `/buildings/{buildingId}/units/{unitId}/invitations` [Confirmed]
- **Operations**: Read, Write, Delete `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts|OSKAdminUserInvitationController.default._get|getBuildingInvitation|`/buildings/${buildingId}/units/${unitId}/invitations`,invitationId|#1` `` `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts|OSKAdminUserInvitationController.default._delete|deleteBuildingInvitation|`/buildings/${buildingId}/units/${unitId}/invitations`,invitationId|#1` ``.

### `/users/{userId}/sentInvitations` [Confirmed]
- **Operations**: Write, Delete `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts|OSKAdminUserInvitationController.default._delete|deleteSenderInvitation|`/users/${userId}/sentInvitations`,invitationId|#1` ``.

### `/users/{userId}/invitations` [Confirmed]
- **Operations**: Read, Delete `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts|OSKAdminUserInvitationController.default._get|getUserInvitationById|`/users/${userId}/invitations`,invitationId|#1` `` `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts|OSKAdminUserInvitationController.default._delete|deleteUserInvitationById|`/users/${userId}/invitations`,invitationId|#1` ``.

### `/users` [Confirmed]
- **Operations**: Read `` `call_expression|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts|OSKAdminUserController.default._get|getById|OSKAdminUserController.collection,userId|#1` ``.

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

No direct API contracts (`api_contract` facts) or Firestore triggers are owned or declared within this root capability's evidence scope [Confirmed].

#### admin_buildings

This capability exposes one HTTPS callable API contract:

### `getAllBuildingsWithUnits`
- **Type**: Callable Function [Confirmed: `` `api_contract|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|getAllBuildingsWithUnits|#1` ``]
- **Request Schema**: `OSKGetAllBuildingsWithUnitsRequestData` (imported from `./models/functions/get_all_buildings_with_units_request.type`) [Confirmed: `functions/src/modules/admin/modules/admin_buildings/index.ts` (line 12)]
- **Response Schema**: `OSKGetAllBuildingsWithUnitsResponseData`
  - **Properties**:
    - `units`: `OSKBuildingUnit[]` [Confirmed: Resolved API Request/Response Schemas]

---

#### admin_maintenance

### API Contracts (Callable Functions)

The following callable functions are registered by this capability. Request schemas are defined below where matching `model_property` facts exist.

| Endpoint Name | Request Type | Response Type |
| :--- | :--- | :--- |
| `executePincodeRefreshCallable` | *Not specified in schemas* | *Not specified in schemas* |
| `onFixMissingMainAccessFieldsAll` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onMaintenanceAddIntercomDisplayNameField` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceAddUnitNumberField` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateBuildingsIntercomBases` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateIntercomsByUsers` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateOrganizationsPrompt` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateResidents` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateResidentSettingsForBuilding` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateUnitSettings` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateUserSettings` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceDeleteBuildingsIntercoms` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceDeleteCallTransferLists` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceDeleteIntercomDisplayNameField` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceDeleteUsersIntercoms` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceIntercomAddUnitNumberFields` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceLinkBuildingsToProperties` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceRecreateAccess` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onMaintenanceRefreshPincodes` | `OSKDbRefreshPincodes` | *Not specified in schemas* |
| `onMaintenanceSyncAuthDisplayNames` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceUpdateAccessControlDeviceModel` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceUpdateResidentsWithUnitInfo` | *Not specified in schemas* | *Not specified in schemas* |
| `onRecreateAccessDocumentInMongoDbByBuildingAll` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onRecreateTokensForBuildingUsersAll` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onRemoveNonExistingUserAccessInBuildingALL` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onSyncBuildingAccessesWithUserAccessesAll` | `OSKDbRecreateAccess` | *Not specified in schemas* |

### Resolved API Request/Response Schemas

#### `OSKDbRecreateAccess`
- **`buildingIds`**: `string[]`

#### `OSKDbRefreshPincodes`
- **`buildingId`**: `string`

---

#### admin_organization

### API Contracts (Callable Functions)

#### `getAllOrganizations`
- **Request Type**: `OSKGetAllOrganizationsListRequestDocument`
  - `adminsOskeyId`: `string`
- **Response Type**: `any` (Returns an array of organization documents)

#### `getOrganizationDetailsById`
- **Request Type**: `OSKGetOrganizationsDetailsByIdRequestDocument`
  - `adminsOskeyId`: `string`
  - `OrganizationId`: `string`
- **Response Type**: `OSKOrganizationList`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress` (imported from `@oskey/core`)
  - `taxNumber`: `string`
  - `userId`: `string`

### Firestore Triggers
No Firestore triggers are defined or owned by this capability.

---

#### admin_users

The following are the callable API contracts exposed by the `admin_users` capability, along with their request and response schemas:

### `addInhabitantToUnit` [Confirmed]
- **Request Type**: `OSKAddInhabitantFromUnitRequestData`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
  - `unitId`: `string`
- **Response Type**: `OSKAddInhabitantFromUnitResponseData`
  - `accessId`: `string | undefined` (optional)
  - `inhabitantId`: `string`

### `createUserInvitationAccess` [Confirmed]
- **Request Type**: `OSKCreateInvitationAccessRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `deleteUserData` [Confirmed]
- **Request Type**: `OSKDeleteUserDataRequestData`
  - `accesses`: `boolean`
  - `devices`: `boolean`
  - `invitations`: `boolean`
- **Response Type**: *None*

### `getAllUserAccesses` [Confirmed]
- **Request Type**: `OSKGetAllUserAccessesRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getAllUserDevices` [Confirmed]
- **Request Type**: `OSKGetUserDevicesRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getAllUserInvitations` [Confirmed]
- **Request Type**: `OSKGetAllUserInvitationsRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getAllUsers` [Confirmed]
- **Request Type**: `OSKGetAllUsersRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getInhabitantUserUnits` [Confirmed]
- **Request Type**: `OSKGetInhabitantUserUnitsRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getUserAccessById` [Confirmed]
- **Request Type**: `OSKGetUserAccessByIdRequestData`
  - `userAccessId`: `string`
- **Response Type**: *None*

### `getUserById` [Confirmed]
- **Request Type**: `OSKGetUserByIdRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: `OSKGetUserByIdResponseData`
  - `devicesCount`: `number`
  - `inhabitantIn`: `{ buildingsCount: number; unitsCount: number; }`
  - `invitationsCount`: `number`
  - `userAccessesCount`: `number`

### `giveInhabitantAccessToUnitInhabitant` [Confirmed]
- **Request Type**: `OSKGiveInhabitantAccessRequestData`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `unitId`: `string`
- **Response Type**: *None*

### `removeAllUserAccesses` [Confirmed]
- **Request Type**: `OSKRemoveAllUserAccessesRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `removeAllUserDevices` [Confirmed]
- **Request Type**: `OSKRemoveAllUSerDevicesRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `removeAllUserInvitations` [Confirmed]
- **Request Type**: `OSKRemoveAllUserInvitationsRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `removeInhabitantFromUnit` [Confirmed]
- **Request Type**: `OSKRemoveInhabitantFromUnitRequestData`
  - `buildingId`: `string`
  - `unitId`: `string`
- **Response Type**: *None*

### `removeUserAccessAccesses` [Confirmed]
- **Request Type**: `OSKRemoveUserAccessAccessesRequestData`
  - `accessIds`: `string[]`
  - `userAccess`: `OSKUserAccesses`
- **Response Type**: *None*

### `removeUserAccesses` [Confirmed]
- **Request Type**: `OSKRemoveUserAccessesRequestData`
  - `userAccesses`: `OSKUserAccesses[]`
- **Response Type**: *None*

### `removeUserDevices` [Confirmed]
- **Request Type**: `OSKRemoveUserDevicesRequestData`
  - `deviceIds`: `string[]`
- **Response Type**: *None*

### `removeUserInvitations` [Confirmed]
- **Request Type**: `OSKRemoveUserInvitationsRequestData`
  - `invitations`: `OSKUserInvitationToRemove[]`
- **Response Type**: *None*

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains only the cross-cutting security and risk callouts.*

Comparing the permission enforcement strategies across the submodules reveals several cross-cutting security patterns and anomalies:
- **Asymmetric Permission Granularity**: There is a stark contrast in permission granularity between submodules. While `admin_users` enforces highly granular, action-specific RBAC strings (e.g., distinguishing between `v1.admin.user.devices.view` and `v1.admin.user.devices.delete`) [Confirmed], `admin_buildings` and `admin_organization` utilize overly broad permission checks. Specifically, `admin_buildings` requires the write-level permission `v1.admin.user.accesses.create` to perform a read-only list operation (`getAllBuildingsWithUnits`) [Inferred]. Similarly, `admin_organization` checks write-level permissions (`v1.admin.org.register`, `v1.admin.org.edit`, `v1.admin.org.delete`, `v1.admin.org.validate`) alongside `v1.admin.org.view` to authorize read-only listing operations [Inferred].
- **Master Platform Override**: The `admin_maintenance` submodule bypasses granular RBAC checks in favor of a master platform-level check (`OSKMaintenancePermissionChecks.isOskeyAdmin`), which validates membership in the "OSkey SAS" organization and the presence of the high-level `v1.admin` role [Confirmed]. This creates a dual-track security model: granular RBAC for standard administrative operations, and a monolithic "super-admin" check for maintenance scripts [Inferred].
- **Unattributed Security-Relevant Signals**:
  - `admin_organization` raises 1 explicit `permission-denied` error when a user fails the multi-permission check in `organization_list.service.ts`, with no single specific RBAC string identifiable as the sole blocker due to the "any-of" logical OR check [Confirmed].

**Per-capability evidence:**

#### _module_root

No explicit permission strings or RBAC roles are directly referenced or evaluated within this root capability's evidence pack [Confirmed].

#### admin_buildings

This capability references the following permission string:
- **`v1.admin.user.accesses.create`**: Checked during the administrative authorization phase in `OSKAdminBuildingService` [Confirmed: `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|v1.admin.user.accesses.create|#1` ``].

### RBAC Cross-Check & Mismatch Analysis
- **Mismatch**: The permission `v1.admin.user.accesses.create` is defined in `rbac-roles.json` as "Allows to create a user access". However, this capability uses it to authorize the *retrieval* (reading) of buildings and units [Inferred: `functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts` (lines 34-43)]. Typically, a read permission such as `v1.admin.building.view` or `v1.org.buildings.view` would be expected for listing buildings and units.

---

#### admin_maintenance

### Permission Enforcement
The capability enforces strict security checks to ensure only authorized Oskey Administrators can execute maintenance scripts:
- **`OSKMaintenancePermissionChecks.isOskeyAdmin`**: A custom utility that verifies if the calling user is an administrator of the "OSkey SAS" organization and possesses the necessary roles `` `functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts` (lines 13-28) ``.
- **`v1.admin`**: Referenced as a versioned permission candidate required to execute maintenance scripts `` `functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts` (line 19) ``.
- **`OSKSecurityChecks.user_security_checks`**: Enforces standard user authentication and integrity checks on incoming requests `` `functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts` (line 38) ``.

### RBAC Cross-Check
The permission candidate `v1.admin` is a high-level administrative role. According to the RBAC roles document, specific administrative permissions are versioned with the `v1.admin.` prefix (e.g., `v1.admin.building.edit`, `v1.admin.user.view`). The maintenance utility checks for the general `v1.admin` role, which acts as a master permission for platform-level maintenance `` `functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts` (line 19) ``.

---

#### admin_organization

### Enforced Permissions
The capability checks the requesting user's consolidated roles against the following administrative permissions:
- **`v1.admin.org.view`**: Allows viewing organization details. [Confirmed]
- **`v1.admin.org.register`**: Allows registering a new organization. [Confirmed]
- **`v1.admin.org.edit`**: Allows editing an organization. [Confirmed]
- **`v1.admin.org.delete`**: Allows deleting an organization. [Confirmed]
- **`v1.admin.org.validate`**: Allows validating an organization. [Confirmed]

### RBAC Alignment
All candidate permissions checked in `OSKOragnizationListService` align exactly with the platform's RBAC roles document. If the user does not possess at least one of these permissions, a `permission-denied` error is returned.
- **Citations**: 
  - `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.view|#1` ``
  - `` `permission_error|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|permission-denied|#1` ``

---

#### admin_users

The `admin_users` capability enforces strict role-based access control (RBAC) by checking the consolidated roles of the calling administrator against specific permission strings:

- **`v1.admin.user.accesses.create`**: Required to grant inhabitant access or accept invitations `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|v1.admin.user.accesses.create|#1` ``.
- **`v1.admin.user.accesses.delete`**: Required to administratively remove user accesses `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts|v1.admin.user.accesses.delete|#1` ``.
- **`v1.admin.user.accesses.view`**: Required to view user accesses `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts|v1.admin.user.accesses.view|#1` ``.
- **`v1.admin.user.devices.delete`**: Required to delete user devices `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts|v1.admin.user.devices.delete|#1` ``.
- **`v1.admin.user.devices.edit`**: Required to edit user devices `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts|v1.admin.user.devices.edit|#1` ``.
- **`v1.admin.user.devices.view`**: Required to view user devices `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts|v1.admin.user.devices.view|#1` ``.
- **`v1.admin.user.invitations.delete`**: Required to delete user invitations `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_invitation.service.ts|v1.admin.user.invitations.delete|#1` ``.
- **`v1.admin.user.invitations.view`**: Required to view user invitations `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_invitation.service.ts|v1.admin.user.invitations.view|#1` ``.
- **`v1.admin.user.delete`**: Required to delete user data `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts|v1.admin.user.delete|#1` ``.
- **`v1.admin.user.edit`**: Required to edit user details `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts|v1.admin.user.edit|#1` ``.
- **`v1.admin.user.view`**: Required to view user details `` `permission_candidate|admin|functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts|v1.admin.user.view|#1` ``.

### RBAC Cross-Check [Confirmed]
All permission candidates referenced in the code map exactly to the authoritative `rbac-roles.json` specification.

### 10. Cross-Module Relationships

The `admin` module maintains extensive relationships with other modules in the repository, acting as a platform-level orchestrator.

#### Outbound Dependencies (Confirmed)
- **`access_control_device`**: Imported by `admin_maintenance` (`db_intercoms.service.ts`) to resolve `OSKAccessControlDeviceController` and `OSKAccessControlDeviceDocument` [Confirmed].
- **`building`**: Imported extensively by `admin_buildings` (`admin_building_unit.controller.ts`, `admin_building.controller.ts`) and `admin_maintenance` to resolve building, unit, door, intercom, and settings controllers/documents [Confirmed].
- **`core`**: Imported across all submodules for base document controllers (`OSKDocumentController`), logging (`OSKLoggingService`), and access utilities/publishers (`OSKAccessMessagePublisherService`, `OSKAccessUtilsService`, `OSKPincodeService`) [Confirmed].
- **`organization`**: Imported by `admin_maintenance` (`db_organization_prompt.service.ts`, `db_residents.service.ts`, `db_propertiesIds.service.ts`) to resolve organization, prompt template, and property controllers/documents [Confirmed].
- **`settings`**: Imported by `admin_buildings`, `admin_maintenance`, and `admin_organization` to resolve `OSKConsolidatedRolesController` for RBAC checks [Confirmed].
- **`tasks`**: Imported by `admin_maintenance` (`db_pincodes.service.ts`) to resolve task payloads (`OSKPincodeRefreshTaskPayload`, `OSKTScheduledTaskPayload`) and schedule tasks via `OSKTaskSchedulerService` [Confirmed].
- **`user`**: Imported by `admin_maintenance` and `admin_users` to resolve user accesses (`OSKUserAccessesController`), devices (`OSKUserDeviceService`), pincodes, and user settings [Confirmed].

#### Inbound Dependencies (Confirmed)
- **`tasks`**: The `tasks` module imports `OSKPincodeRefreshWorkerService` from `admin_maintenance` (`pincode_refresh_worker.service.ts`) to execute scheduled pincode refreshes [Confirmed].

#### Resolved Cross-Module Call Edges (Confirmed)
- **Calls to `core`**: Executes `_query`, `_get`, `_update`, `_delete`, `_deleteAll`, `logError`, `logInfo`, and `logWarning` [Confirmed].
- **Calls to `settings`**: Executes `checkUserPermissions` to validate administrative roles [Confirmed].
- **Calls to `building`**: Executes `deletePerUser`, `getAll`, `update`, `getAllSafe`, `getAllIntercomByBuilding`, `get`, `set`, `updateBuildingSettings`, `createIntercomEntry`, and `addInhabitantInAllIntercoms` [Confirmed].
- **Calls to `user`**: Executes `getPerBuilding`, `getPerBuildingSafe`, `update`, `get`, `createAccessDeviceToken`, `getAll`, and `getAllId` [Confirmed].
- **Calls to `access_control_device`**: Executes `getAll` and `update` [Confirmed].
- **Calls to `organization`**: Executes `get`, `save`, `queryAll`, `update`, `getAll`, `queryOnboardingDocuments`, `getOrganizationByNameSafe`, and `getSafe` [Confirmed].
- **Calls to `tasks`**: Executes `scheduleTask` to queue background pincode refreshes [Confirmed].
- **Inbound Calls from `tasks`**: Receives calls to `OSKPincodeRefreshWorkerService.executePincodeRefresh` [Confirmed].

### 11. External Hooks

#### _module_root

No external hooks, Pub/Sub topics, environment variables, or external storage paths are directly evidenced within this root capability's pack [Confirmed].

#### admin_buildings

No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or cloud storage paths) are evidenced within this capability's pack [Confirmed].

---

#### admin_maintenance

The capability interacts with several external boundaries and asynchronous pipelines:

### Asynchronous Pub/Sub Pipelines
- **`OSKAccessMessagePublisherService.publishMessageAccessRecreateToACD`**: Publishes messages to GCP Pub/Sub to push recreated access projections down to MongoDB and edge devices `` `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKAccessMessagePublisherService.publishMessageAccessRecreateToACD|recreateAccessDocumentInMongoDbByBuilding|buildingId,doorId,acdId,accessesToRecreate|#1` ``.
- **`OSKAccessMessagePublisherService.publishMessageToAllACDs`**: Publishes pincode updates to all authorized ACDs during pincode refreshes `` `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|executePincodeRefresh|userId,buildingId,{                     accessId,                     accessRights: accessData.accessRights,                     creationDate: accessData.creationDate,                     isMainAccess: accessData.isMainAccess,                     operation: OSKAccessMessageOperation.Update,                 },accessData.authorizedDoors,isAppUser ? { category: 'oskUser' } : { category: 'nonAppUser', buildingId, unitId }|#1` ``.
- **`OSKIntercomMessagePublisherService.publishMessageIntercomUpdate`**: Publishes intercom directory updates to edge devices `` `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercom_allowUnitNumber.service.ts|OSKIntercomMessagePublisherService.publishMessageIntercomUpdate|updateIntercomEntriesFields|{                 ...intercom,                 intercomEntries: newEntries,                 modificationDate: intercom.modificationDate ?? Timestamp.now(),             }|#1` ``.

### Google Cloud Tasks
- **`OSKTaskSchedulerService.scheduleTask`**: Schedules Cloud Tasks to distribute pincode refresh executions over time, preventing system overload `` `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|OSKTaskSchedulerService.scheduleTask|onMaintenanceRefreshPincodes|scheduleDate,payload,targetUrl|#1` ``.

### Firebase Authentication
- **`auth.getUser` / `auth.updateUser`**: Directly interacts with Firebase Authentication to synchronize user display names from Firestore `` `functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts` (lines 95-104) ``.

---

#### admin_organization

### Environment Variables
- **`OSK_FIREBASE_EMULATOR`**: Used to conditionally bypass App Check enforcement when running in a local emulator environment. [Confirmed]
  - **Citations**: `` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/index.ts|functionBuilder.runWith|getAdminOrganizationCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.

---

#### admin_users

There are no external hooks, Pub/Sub topics, environment variables, or storage paths directly evidenced within this capability's pack. [Confirmed]

### 12. Architectural Observations

- **Administrative Orchestration Layer**: The `admin` module acts as a centralized orchestration layer that coordinates specialized services across multiple other modules (`building`, `user`, `organization`, `access_control_device`) [Confirmed]. It does not define its own primary business logic but instead wraps and exposes cross-module operations (such as linking buildings to properties, migrating user settings, or repairing accesses) [Inferred].
- **Dual-Write and Synchronization Patterns**: The module heavily relies on cross-module calls to maintain data consistency. For example, during access repair operations, `admin_maintenance` calls `OSKBuildingAccessesController` and `OSKUserAccessesController` to synchronize accesses across both building-centric and user-centric collections [Confirmed]. It also utilizes `OSKAccessMessagePublisherService` to publish synchronization events to physical hardware asynchronously via Pub/Sub, decoupling administrative state changes from edge device availability [Confirmed].
- **Platform-Level Override vs. Encapsulation**: While the platform generally enforces strict encapsulation (e.g., users only accessing their own `/users` subcollections), the `admin` module is architected to deliberately bypass these boundaries for maintenance purposes [Inferred]. This is evidenced by `admin_maintenance` performing direct read/write/delete operations across collections owned by other modules, acting as a highly coupled, platform-wide utility [Confirmed].
- **Asynchronous Task Delegation**: The relationship with the `tasks` module demonstrates a clear separation of scheduling and execution. The `admin` module schedules pincode refresh tasks via `OSKTaskSchedulerService` [Confirmed], but the actual execution is triggered inbound from the `tasks` module calling back into `OSKPincodeRefreshWorkerService` [Confirmed].

### 13. Risks & Open Questions

**Cross-cutting risks:**

*Note: This section contains only cross-cutting risks and open questions.*

- **RBAC Permission Mismatch / Over-Privileging**: The `admin_buildings` submodule requires `v1.admin.user.accesses.create` (a write-level permission defined in `rbac-roles.json` as "Allows to create a user access") to perform a read-only list operation (`getAllBuildingsWithUnits`) [Inferred]. This violates the principle of least privilege, as users who only need to view buildings must be granted write access to user accesses [Inferred].
- **Broad Logical OR Permission Checks**: The `admin_organization` submodule allows users with write-level permissions (`v1.admin.org.register`, `v1.admin.org.edit`, `v1.admin.org.delete`, `v1.admin.org.validate`) to execute read-only listing operations (`getAllOrganizations`) [Inferred]. This broad check dilutes the security boundary of view-only roles and risks accidental over-privileging [Inferred].
- **Monolithic Maintenance Security Track**: The `admin_maintenance` submodule relies on a single custom check (`OSKMaintenancePermissionChecks.isOskeyAdmin`) and the general `v1.admin` role to authorize highly destructive database operations (such as deleting call transfer lists or modifying device configurations) [Confirmed]. This bypasses the granular RBAC model defined in `rbac-roles.json` and prevents fine-grained auditing or restriction of maintenance capabilities [Inferred].
- **Auth0 Deletion Synchronization Gap**: While `admin_users` provides the capability to administratively delete a user's Firestore records (accesses, devices, invitations) via `deleteUserData` [Confirmed], it remains an open question whether this operation synchronizes with Auth0 to suspend or delete the corresponding external identity, potentially leaving orphaned Auth0 credentials [Inferred].

**Per-capability open questions:**

#### _module_root

- **Submodule Functionality**: What specific administrative operations and endpoints are defined inside the submodules (`admin_buildings`, `admin_organization`, `admin_users`, `admin_maintenance`)? [Inferred]
- **Security Context**: Are there specific RBAC roles or security rules applied to the aggregated callable functions exported by `getAdminCallableFunctionTriggers` at the submodule level? [Inferred]

#### admin_buildings

- **Permission Scope**: Why does `OSKAdminBuildingService` require the write-level permission `v1.admin.user.accesses.create` to perform a read-only list operation (`getAllBuildingsWithUnits`)? Is this a temporary placeholder or an intentional security design choice? [Inferred]
- **App Check Enforcement**: The callable function trigger conditionally enforces App Check based on whether the Firebase Emulator is running (`!process.env.OSK_FIREBASE_EMULATOR`) [Confirmed: `` `call_expression|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|functionBuilder.runWith|getAdminBuildingsCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``]. Are there other environment variables or configurations required for production App Check validation that are not documented here? [Inferred]

#### admin_maintenance

- **Wildcard Admin Check**: The `OSKMaintenancePermissionChecks.isOskeyAdmin` method checks for the `v1.admin` role. It is unclear if this maps to a specific wildcard role in the database or if it is hardcoded to grant access to any user belonging to the "OSkey SAS" organization with any `v1.admin.*` permission.
- **Pub/Sub Topic Names**: The exact GCP Pub/Sub topic names utilized by `OSKAccessMessagePublisherService` and `OSKIntercomMessagePublisherService` are encapsulated within the `core` and `building` modules and are not visible in this capability's evidence pack.
- **Task Target URL**: The target URL used for scheduling pincode refresh tasks via `OSKTaskSchedulerService.scheduleTask` is dynamically constructed and not explicitly defined in the static facts of this submodule.

#### admin_organization

- **Broad Permission Check**: The service methods `getAllOrganizations` and `getOrganizationDetailsById` check for write-level permissions (such as `v1.admin.org.register`, `v1.admin.org.edit`, `v1.admin.org.delete`, and `v1.admin.org.validate`) in addition to `v1.admin.org.view` to authorize read-only listing operations. It is unclear if this is a deliberate design choice to allow any administrative role access, or if it should be restricted strictly to view-level permissions.
- **Response Schema for `getAllOrganizations`**: The response type for `getAllOrganizations` is not explicitly defined as a typed document in the codebase, returning a generic array of organization documents instead.

#### admin_users

- **Auth0 Synchronization**: While `deleteUserData` administratively deletes Firestore records for a user's accesses, devices, and invitations, it is unclear from the evidence pack whether this also triggers a deletion or suspension of the user's Auth0 identity. [Inferred]
- **Consolidated Roles Resolution**: The exact mechanism by which `OSKConsolidatedRolesController` resolves and caches consolidated roles for organization users is handled outside this submodule. [Inferred]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.