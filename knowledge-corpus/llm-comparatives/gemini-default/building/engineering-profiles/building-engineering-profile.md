### 0. Generation Metadata

- **runId**: `20260803_143350-1aa319b1`
- **generatedAt**: `2026-08-11T16:38:39.381Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `building`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `building` module serves as the core physical and logical anchor of the Oskey platform [Confirmed]. It manages physical building entities, doors, units (apartments/offices), and intercom configurations, while orchestrating access permissions (PINs, accesses, non-app user lifecycles) and logging door activities [Confirmed]. It acts as the bridge between logical business structures (organizations, properties) and physical edge hardware (Access Control Devices, Digicoms, Intercoms) [Confirmed].

### 2. Architectural Position

The `building` module sits directly below the Organization and Property scopes and anchors the Unit scope within the platform's hierarchical domain model [Confirmed].
- **Owned Concepts**: Buildings (`/buildings/{id}`), Doors (`/buildings/{id}/doors`), Units (`/buildings/{id}/units`), Intercoms (`/buildings/{id}/intercoms`), Pincodes (`/buildings/{id}/pincodes`), Accesses (`/buildings/{id}/accesses`), and Non-App Users (`/buildings/{id}/units/{id}/nonAppUsers`) [Confirmed].
- **Provided Capabilities**: Physical building and door lifecycle management, hardware configuration provisioning (intercoms, ACDs), offline PIN code generation and synchronization, resident/tenant/co-inhabitant/non-app user access orchestration, and edge activity log ingestion [Confirmed].

### 3. Primary Responsibilities

#### _module_root

### Building Lifecycle Management
- **Building Creation**: Handles the creation of organization buildings (`createOrganizationBuilding`), generating a unique document ID, saving the building document, mapping it to the organization, and updating the associated property [Confirmed] (Citations: `api_contract|building|functions/src/modules/building/index.ts|createOrganizationBuilding|#1`, `functions/src/modules/building/services/building.service.ts` (lines 155-238)).
- **Building Updates**: Updates building details (`updateBuilding`) and synchronizes these changes with associated units and user accesses [Confirmed] (Citations: `api_contract|building|functions/src/modules/building/index.ts|updateBuilding|#1`, `functions/src/modules/building/services/building.service.ts` (lines 240-341)).
- **Building Deletion**: Deletes a building (`deleteBuilding`) only if it has no doors or units assigned, ensuring referential integrity [Confirmed] (Citations: `service_method|building|functions/src/modules/building/services/building.service.ts|OSKBuildingService|deleteBuilding|#1`, `functions/src/modules/building/services/building.service.ts` (lines 343-380)).

### Property Assignment
- **Assigning Building to Property**: Handles assigning or re-assigning a building to a property (`assigningBuildingToProperty`), which involves updating the building's `propertyId` and synchronizing the building list in both the old and new property documents [Confirmed] (Citations: `api_contract|building|functions/src/modules/building/index.ts|assigningBuildingToProperty|#1`, `functions/src/modules/building/services/building.service.ts` (lines 404-474)).

### Building Querying
- **Retrieval**: Supports retrieving all buildings (`getAllBuildings`), fetching a building by ID with its doors and units count (`getBuildingById`), and querying buildings associated with a specific property (`getBuildingsByPropertyId`) with optional filtering by Access Control Device (ACD) type [Confirmed] (Citations: `api_contract|building|functions/src/modules/building/index.ts|getAllBuildings|#1`, `api_contract|building|functions/src/modules/building/index.ts|getBuildingById|#1`, `api_contract|building|functions/src/modules/building/index.ts|getBuildingsByPropertyId|#1`).

### Image Management
- **Upload and Delete**: Manages building image uploads (`uploadImage`) and deletions (`deleteBuildingImage`), updating the building document's `imageFilename` field and interacting with Google Cloud Storage [Confirmed] (Citations: `service_method|building|functions/src/modules/building/services/building.service.ts|OSKBuildingService|uploadImage|#1`, `api_contract|building|functions/src/modules/building/index.ts|deleteBuildingImage|#1`).

### Trigger Orchestration
- **Trigger Aggregation**: Aggregates and exposes callable and Firestore triggers from both the root level and all submodules (`getCallableFunctionTriggers`, `getFirestoreTriggers`) [Confirmed] (Citations: `function_declaration|building|functions/src/modules/building/index.ts|getCallableFunctionTriggers|#1`, `function_declaration|building|functions/src/modules/building/index.ts|getFirestoreTriggers|#1`).

---

#### building_accesses

- **Managing Building Access Documents**: Exposes CRUD-like operations to create, retrieve, update, and delete access records for specific buildings and users/members [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 14-77)).
- **Orchestrating User Building Access**: Provides business logic to create or update building access records for standard users, appending new access configurations to their document using Firestore array unions [Confirmed] (evidenced by `` `service_method|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService|createOrUpdateBuildingAccess|#1` ``).
- **Orchestrating Staff and Non-App User Building Access**: Provides business logic to create or update building access records for staff members or non-app users, appending new access configurations to their document [Confirmed] (evidenced by `` `service_method|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService|createOrUpdateBuildingAccessForStaffOrNonAppUser|#1` ``).
- **Defining the Building Access Data Model**: Structuring the `OSKBuildingAccess` document with fields for `buildingId`, `userId`, `userFirstName`, `userLastName`, and an array of `accesses` [Confirmed] (evidenced by `` `type_alias|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|#1` ``).

---

#### building_activity

- **Ingesting and Saving Activity Logs**: Receives and enriches raw activity payloads from edge devices and saves them to the database via `ActivityReceivedForBuilding` `` `service_method|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService|ActivityReceivedForBuilding|#1` ``. [Confirmed]
- **Retrieving Activities**: Supports fetching a single activity log by ID (`getActivityById`) `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getActivityById|#1` `` or listing all activity logs for a specific building and door (`getAllBuildingActivities`) `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getAllBuildingActivities|#1` ``. [Confirmed]
- **Deleting Activity Logs**: Allows authorized deletion of a single activity log (`deleteBuildingActivityById`) `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteBuildingActivityById|#1` `` or purging all logs for a door (`deleteAllBuildingActivities`) `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteAllBuildingActivities|#1` ``. [Confirmed]
- **Security and Parameter Validation**: Enforces parameter type checks and user security constraints on all incoming requests `` `call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKSecurityChecks.checkParameters|getActivityById|#1` ``. [Confirmed]

#### building_door

### Door Lifecycle Management
- **Create, Read, Update, and Delete Doors**: The capability provides administrative interfaces to create, retrieve, update, and delete building doors. [Confirmed; `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserCreateBuildingDoor|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserUpdateBuildingDoor|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|deleteBuildingDoor|#1` ``]
- **Access Propagation on Update**: When a door's information (such as its name or street address) is updated, the capability triggers an asynchronous update to propagate these changes to all user accesses associated with that door. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKAccessUpdateService.updateUserAccessesDoorInfo|organizationUserUpdateBuildingDoor|oldBuildingDoor,doorInfo|#1` ``]
- **Access Pruning on Deletion**: When a door is deleted, the capability ensures that the door is removed from all user accesses and prevents deletion if active accesses still exist. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKAccessUpdateService.removeDoorFromUserAccesses|deleteBuildingDoor|request.doorId,request.buildingId|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKBuildingDoorService.logger.logError|deleteBuildingDoor|`internal: Cannot delete door with id ${request.doorId} because accesses exist!`,{ doorId: request.doorId }|#1` ``]

### Access Control Device (ACD) Assignment
- **Device Assignment Orchestration**: Upon the creation of a building door device document, the capability automatically assigns the physical ACD to the building and door, saves its configuration, and registers it in the intercom directory. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKAccessControlDeviceController.default.assignBuildingDoor|onDocumentCreated|deviceId,buildingId,doorId|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKAccessControlDeviceConfigController.default.save|onDocumentCreated|data|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKBuildingIntercomService.createIntercomEntry|onDocumentCreated|deviceId,buildingId,doorId|#1` ``]
- **Device Unassignment Orchestration**: Upon deletion of a building door device document, the capability unassigns the ACD and deletes its configuration. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKAccessControlDeviceController.default.unassignBuildingDoor|onDocumentDeleted|deviceId|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKAccessControlDeviceConfigController.default.deleteAll|onDocumentDeleted|deviceId|#1` ``]

### Cryptographic Key Management
- **Key Pair Generation**: When an ACD is assigned to a door, the capability generates an Elliptic Curve (prime256v1) public/private key pair. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|crypto.generateKeyPairSync|generateKeys|'ec',{             namedCurve: 'prime256v1',         }|#1` ``]
- **Secret Storage**: The generated private key is securely stored using the platform's secret service, while the public key is saved in Firestore. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|OSKSecretService.createPrivateKeySecret|generateKeys|accessControlDeviceId,privateKey|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|firestore()                 .collection(                     `/buildings/${buildingId}/doors/${doorId}/accessControlDevices/${accessControlDeviceId}/keys`                 )                 .doc('publicKey')                 .set|generateKeys|publicKey|#1` ``]
- **Key Deletion**: When a device is unassigned, its public keys are deleted from Firestore. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|db                 .collection(`/buildings/${buildingId}/doors/${doorId}/accessControlDevices/${deviceId}/keys`)                 .doc('publicKey')                 .delete|deletePublicKeys||#1` ``]

---

#### building_intercom

This capability provides the following distinct features and responsibilities:

*   **Intercom Entry & Display Name Management**: 
    *   Creates intercom entries when inhabitants are added to a unit (`addInhabitantInIntercom`, `addInhabitantInAllIntercoms`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 76-143).
    *   Updates display names (`updateIntercomDisplayName`) and automatically formats them based on tenant last names (`createIntercomDisplayName`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 166-252, 446-475).
    *   Deletes intercom entries or specific users from entries (`deleteIntercomEntry`, `deleteIntercomEntryUser`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 281-342, 348-440).
*   **Call Transfer List Management**:
    *   Creates, updates, and deletes call transfer lists (`createCallTransferList`, `updateIntercomCallTransferList`, `pushToCallTransferList`, `onUpdateBuildingIntercomsTransferList`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts` (lines 39-64, 90-122, 124-157, 185-217).
    *   Converts call transfer lists from ordered arrays to sequence numbers (`convertCallTransferListFromOrderedToSequenceNumber`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts` (lines 256-269).
*   **Hardware Synchronization (Pub/Sub)**:
    *   Publishes intercom creation, update, and deletion events to Pub/Sub topics to synchronize with edge Access Control Devices (ACDs) (`publishMessageIntercomCreate`, `publishMessageIntercomUpdate`, `publishMessageIntercomDelete`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts` (lines 15-25, 27-57, 59-65).

*Confidence Tag*: **Confirmed**

---

#### building_pincode

The capability is responsible for the following distinct features:

### Pincode Document Creation & Persistence
The capability provides specialized service methods to construct and persist structured pincode documents for different platform personas:
- **Inhabitant Pincodes**: Creates pincodes for residents with a reference to their unit `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 19-39).
- **Guest Pincodes**: Creates temporary pincodes containing inviter and invited user references `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 41-64).
- **Permanent Guest Pincodes**: Creates scheduled pincodes for recurring visitors `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 66-89).
- **Anonymous / Quickcode Pincodes**: Creates time-bound, entry-limited pincodes for anonymous visitors (e.g., delivery couriers) `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 90-110).
- **Supplier Pincodes**: Creates pincodes for third-party contractors and maintenance staff `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 112-130).

**Confidence Tag**: Confirmed

### Pincode Document Management (CRUD & Queries)
The capability exposes a controller to perform standard document operations on the Firestore database:
- **Set Pincode**: Writes or updates a pincode document using the pincode string as the document ID `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 19-22).
- **Get / GetSafe**: Retrieves a specific pincode document by ID, throwing a safe error helper if not found `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 24-40).
- **Querying**: Supports retrieving all pincodes for a building, filtering by pincode type, or querying by a specific `accessId` `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 42-81).
- **Delete**: Removes a pincode document from the building's collection `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 54-57).

**Confidence Tag**: Confirmed

### Type Validation
The capability provides utility functions to validate whether a pincode document or set of documents belongs to an inhabitant type `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` (lines 58-68).

**Confidence Tag**: Confirmed

#### building_pincode_trash

### Trashed Pincode Document Management [Confirmed]
- Provides standard CRUD operations (set, get, getAll, update, delete) for managing trashed pincode documents [Confirmed]. These operations are exposed via `OSKBuildingPincodeTrashController` which inherits from the core `OSKDocumentController` `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController` ``.
- Resolves the Firestore collection path dynamically per building using `getCollectionPath(buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getCollectionPath|#1` ``.

### Trashed Pincode Metadata Tracking [Confirmed]
- Defines the schema for trashed pincode documents via the `OSKBuildingPincodeTrashDocument` type alias `` `type_alias|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|#1` ``.
- Tracks the trash status of a pincode using `OSKPincodeTrashStatus` `` `type_alias|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKPincodeTrashStatus|#1` ``.
- Records the timestamp of the last status update (`lastStatusUpdate`) `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|lastStatusUpdate|#1` ``.
- Enforces an expiration date (`expirationDate`) for the trashed pincode, after which it is eligible for permanent deletion `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|expirationDate|#1` ``.

---

#### building_settings

- **Creating Building Settings**: Provisions default or custom configuration parameters for a building, including access methods, PIN code types, and invitation rules. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|createBuildingSettings|#1` ``.
- **Updating Building Settings**: Modifies existing configuration parameters for a building. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|updateBuildingSettings|#1` ``.
- **Retrieving Resident Settings**: Fetches the active settings for a building, which may be filtered or formatted for resident consumption. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|getResidentSettings|#1` ``.
- **Deleting Building Settings**: Removes the settings document associated with a building and cleans up corresponding user-level building settings. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|deleteBuildingSettings|#1` ``.
- **Resetting Building Settings**: Reverts a building's settings to their default values and updates corresponding user-level building settings. **Confirmed** `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|resetBuildingSettings|#1` ``.
- **Default Data Provisioning**: Generates default settings structures with metadata (e.g., `canBeChanged`, `isRequired`, `description`) for fields like `accessMethods`, `inhabitantPinCodeType`, `refreshCodeFrequency`, `allowQuickcodes`, etc. **Confirmed** `` `functions/src/modules/building/modules/building_settings/data/building_settings_default_data.ts` (lines 11-65) ``.

#### building_unit

- **Building Unit Lifecycle Management**: Handles the creation, retrieval, updating, and deletion of building units (`OSKBuildingUnit`) by authorized organization users `` `functions/src/modules/building/modules/building_unit/services/building_unit.service.ts` (lines 44-383) ``.
- **Inhabitant Management & Access Provisioning**: Manages the addition and removal of inhabitants (`OSKBuildingUnitInhabitant`) within a unit `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (lines 31-191) ``. Adding an inhabitant automatically provisions permanent access credentials via `OSKAccessService` `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKAccessService.createAccess|addInhabitant|inhabitant.userId,inhabitant.buildingId,accessOptions|#1` `` and synchronizes the resident to building intercom directories via `OSKBuildingIntercomService` `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingIntercomService.addInhabitantInAllIntercoms|addInhabitant|inhabitant.buildingId,inhabitant.unitId,inhabitant.userId,inhabitant.inhabitantType,inhabitant.doors|#1` ``.
- **Unit Door Management**: Assigns specific doors to units (`OSKBuildingUnitDoor`) `` `functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts` (lines 27-97) ``. When a door is assigned to a unit, the system automatically creates access permissions for all current inhabitants of that unit `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts|OSKAccessService.createAccess|createBuildingUnitDoor|inhabitant.userId,inhabitant.buildingId,{                                 type: OSKUserAccessType.InhabitantUser,                                 unitId: request.unitId,                                 accessRights: [{ validity: 'permanent', isValidOnce: false }],                                 doors: [buildingUnitDoor],                             }|#1` ``.
- **Permanent Guest Management**: Manages long-term, scheduled visitors (`OSKBuildingUnitPermanentGuest`) associated with a unit `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts` (lines 6-105) ``.
- **Invitation Management**: Manages inhabitant invitations (`OSKBuildingUnitInhabitantInvitation`) for onboarding new residents `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts` (lines 11-65) ``.
- **User Settings Initialization**: Automatically initializes user building settings and unit settings when a new inhabitant is added to a unit `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKUserSettingsBuildingController.default.set|addInhabitant|inhabitant.userId,userSettingsDocument|#1` `` and `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKUserSettingsUnitService.createUserSettingsUnitFromInhabitant|addInhabitant|inhabitant.userId,inhabitant.buildingId,inhabitant.unitId,inhabitant.inhabitantType|#1` ``.

*Confidence Tag: Confirmed*

---

#### building_unit_nonAppUser

- **Non-App User Profile Lifecycle**: Handles the creation, retrieval, updating, and deletion of non-app user profiles nested under a specific building unit path (`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}`) `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|createNonAppUser|#1` `` [Confirmed].
- **Access Rights Provisioning**: Configures and updates physical door access rights (`OSKNonAppUserAccess`) for non-app users, mapping them to specific doors within the building `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|createNonAppUserAccess|#1` `` [Confirmed].
- **Offline PIN Code Generation**: Generates and manages alphanumeric PIN codes associated with non-app user access rights, allowing offline keypad entry at physical ACDs `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|createNonAppUserWithAccess|#1` `` [Confirmed].
- **Edge Device Synchronization**: Publishes real-time access state updates (creations, updates, deletions) to edge hardware (ACDs) via Pub/Sub messaging to ensure offline validation caches are kept up to date `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|updateNonAppUserAccessDoors|#1` `` [Confirmed].
- **Activity Logging and Aggregation**: Ingestes raw door access events triggered by non-app users, enriches them with business context, and updates both individual activity logs and 30-day activity aggregates for the user `` `service_method|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity.service.ts|OSKNonAppUserActivityService|ActivityReceivedForNonAppUser|#1` `` [Confirmed].

#### building_user

This capability provides the following distinct responsibilities:

*   **Creation of Building Users**: Orchestrates the creation of a building user association [Confirmed]. The service validates the caller's authentication and permissions, retrieves the target user and building, provisions access rights via the core access service, and saves the building user record [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 26-120)).
*   **CRUD Operations on Building User Documents**: Exposes standard document-level operations (get, save, update, delete, list) targeting the Firestore path `/buildings/{buildingId}/users/{userId}` [Confirmed] (`functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts` (lines 11-44)).
*   **Automated Access Cleanup on Deletion**: Listens to building user document deletions via a Firestore trigger and automatically cleans up associated building accesses and user accesses [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 290-301)).

---

### 4. Public Interfaces

#### _module_root

### Controllers
- **`OSKBuildingController`** (defined in `functions/src/modules/building/controllers/building.controller.ts` (lines 12-73)): Extends `OSKDocumentController` to provide standardized Firestore CRUD operations, image uploads, and query filtering for the `/buildings` collection [Confirmed].

### Entry Points
- **`OSKBuildingService`** (defined in `functions/src/modules/building/services/building.service.ts` (lines 47-601)): The primary service class containing business logic, authorization checks, and coordination with other modules/submodules [Confirmed].
- **`getCallableFunctionTriggers`** (defined in `functions/src/modules/building/index.ts` (lines 45-62)): Exposes all callable Cloud Functions for the building module [Confirmed].
- **`getFirestoreTriggers`** (defined in `functions/src/modules/building/index.ts` (lines 39-43)): Exposes Firestore triggers, delegating to submodules [Confirmed].

---

#### building_accesses

- **`OSKBuildingAccessesController`**: A document controller extending `OSKDocumentController` that exposes low-level document operations for building access documents [Confirmed] (evidenced by `` `source_class|building|functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts|OSKBuildingAccessesController` ``).
- **`OSKBuildingAccessService`**: A service class providing high-level business logic to create or update building accesses for users, staff, and non-app users [Confirmed] (evidenced by `` `source_class|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService` ``).

---

#### building_activity

- **`OSKBuildingActivitiesController`**: Extends `OSKDocumentAndMessageController` to handle database operations (get, query, set, delete) for building activity documents `` `source_class|building|functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts|OSKBuildingActivitiesController` ``. [Confirmed]
- **`OSKBuildingActivitiesService`**: Orchestrates the business logic, security checks, and database interactions for building activities `` `source_class|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService` ``. [Confirmed]
- **`getCallableFunctionTriggers`**: Exposes the HTTPS callable Cloud Functions to the client applications `` `function_declaration|building|functions/src/modules/building/modules/building_activity/index.ts|getCallableFunctionTriggers|#1` ``. [Confirmed]

#### building_door

The capability exposes the following controllers and services as public entry points:

### `OSKBuildingDoorService`
- **File**: `functions/src/modules/building/modules/building_door/services/building_door.service.ts`
- **Description**: The primary service orchestrating the business logic for building doors, including permission checks, parameter validation, and coordination with other services. [Confirmed]

### `OSKBuildingDoorController`
- **File**: `functions/src/modules/building/modules/building_door/controllers/building_door.controller.ts`
- **Description**: A document controller extending `OSKDocumentController` that manages direct Firestore operations on the `/buildings/{buildingId}/doors` collection. [Confirmed]

### `OSKBuildingDoorAccessControlDeviceController`
- **File**: `functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device.controller.ts`
- **Description**: A document controller extending `OSKDocumentController` that manages direct Firestore operations on the `/buildings/{buildingId}/doors/{doorId}/accessControlDevices` collection. [Confirmed]

### `OSKBuildingDoorAccessControlDeviceKeysController`
- **File**: `functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts`
- **Description**: A controller dedicated to generating, retrieving, and deleting cryptographic keys for access control devices assigned to doors. [Confirmed]

### `OSKBuildingDoorAccessControlDeviceService`
- **File**: `functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts`
- **Description**: A service that handles Firestore document triggers for device assignments. [Confirmed]

---

#### building_intercom

This capability exposes the following public entry points and services:

*   **`OSKBuildingIntercomController`**: Extends `OSKDocumentAndMessageController` to manage master building intercom documents in Firestore and publish Pub/Sub messages `` `source_class|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|OSKBuildingIntercomController` ``.
*   **`OSKBuildingIntercomCallTransferListController`**: Extends `OSKDocumentController` to manage call transfer list documents in Firestore `` `source_class|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom_calltransferlist.controller.ts|OSKBuildingIntercomCallTransferListController` ``.
*   **`OSKBuildingIntercomCallTransferListService`**: Handles business logic for call transfer lists `` `source_class|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKBuildingIntercomCallTransferListService` ``.
*   **`OSKBuildingIntercomService`**: Handles business logic for intercom inhabitants and display names `` `source_class|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingIntercomService` ``.
*   **`OSKIntercomMessagePublisherService`**: Publishes messages to Pub/Sub for edge device synchronization `` `source_class|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts|OSKIntercomMessagePublisherService` ``.

---

#### building_pincode

This capability exposes the following public entry points:

### OSKBuildingPincodeController
An exported controller class extending `OSKDocumentController` that manages direct Firestore operations for building pincodes.
- **File**: `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 12-82)
- **Methods**:
  - `getCollectionPath(buildingId: string)`: Returns the path `buildings/${buildingId}/pincodes` `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getCollectionPath|#1` ``.
  - `set(document: OSKBuildingPincodeDocument)`: Writes the pincode document `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|set|#1` ``.
  - `get(pincodeId: string, buildingId: string)`: Retrieves a pincode document `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|get|#1` ``.
  - `getSafe(pincodeId: string, buildingId: string)`: Safely retrieves a pincode document or throws an error `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getSafe|#1` ``.
  - `getAll(buildingId: string)`: Retrieves all pincodes for a building `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getAll|#1` ``.
  - `getAllByType(buildingId: string, type: string)`: Queries pincodes by type `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getAllByType|#1` ``.
  - `getByAccessId(buildingId: string, accessId: string)`: Queries pincodes by access ID `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getByAccessId|#1` ``.
  - `delete(pincodeId: string, buildingId: string)`: Deletes a pincode document `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|delete|#1` ``.

### OSKBuildingPincodeService
An exported service class that orchestrates the creation of typed pincode documents.
- **File**: `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 18-131)
- **Methods**:
  - `createPincodeInhabitantDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeInhabitantDocument|#1` ``
  - `createPincodeGuestDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeGuestDocument|#1` ``
  - `createPincodePermanentGuestDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodePermanentGuestDocument|#1` ``
  - `createPincodeAnonymousDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeAnonymousDocument|#1` ``
  - `createPincodeSupplierDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeSupplierDocument|#1` ``

**Confidence Tag**: Confirmed

#### building_pincode_trash

This capability exposes the following public interfaces:

### Controllers [Confirmed]
- **`OSKBuildingPincodeTrashController`**: A document controller extending `OSKDocumentController` that handles HTTP/API requests for trashed pincodes `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController` ``. It exposes the following methods:
  - `getCollectionPath(buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getCollectionPath|#1` ``
  - `set(document)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|set|#1` ``
  - `get(pincodeId, buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|get|#1` ``
  - `getSafe(pincodeId, buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getSafe|#1` ``
  - `getAll(buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getAll|#1` ``
  - `getAllSafe(buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getAllSafe|#1` ``
  - `update(buildingId, pincodeId, data)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|update|#1` ``
  - `delete(buildingId, pincodeId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|delete|#1` ``

### Services [Confirmed]
- **`OSKBuildingPincodeTrashService`**: A service class exported by the submodule `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/services/building_pincode_trash.service.ts|OSKBuildingPincodeTrashService` ``.

---

#### building_settings

- **OSKBuildingSettingsController** (extends `OSKDocumentController`): The primary controller managing document-level operations (get, set, update, delete) on the Firestore collection path for building settings. **Confirmed** `` `source_class|building|functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts|OSKBuildingSettingsController` ``.
- **OSKBuildingSettingsService**: The core service orchestrating business logic, permission checks, and coordination with other modules (like `user` and `organization`). **Confirmed** `` `source_class|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService` ``.

#### building_unit

The capability exposes the following controllers and service entry points:
- **`OSKBuildingUnitController`**: Extends `OSKDocumentController` to manage the `/buildings/{buildingId}/units` collection `` `functions/src/modules/building/modules/building_unit/controllers/building_unit.controller.ts` (lines 11-74) ``.
- **`OSKBuildingUnitDoorController`**: Extends `OSKDocumentController` to manage unit-specific doors under `/buildings/{buildingId}/units/{unitId}/doors` `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_door.controller.ts` (lines 11-28) ``.
- **`OSKBuildingUnitInhabitantController`**: Extends `OSKDocumentController` to manage inhabitants under `/buildings/{buildingId}/units/{unitId}/inhabitants` `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_inhabitant.controller.ts` (lines 11-90) ``.
- **`OSKBuildingUnitInvitationController`**: Extends `OSKDocumentController` to manage invitations under `/buildings/{buildingId}/units/{unitId}/invitations` `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts` (lines 11-65) ``.
- **`OSKBuildingUnitPermanentGuestController`**: Extends `OSKDocumentController` to manage permanent guests under `/buildings/{buildingId}/units/{unitId}/permanentGuests` `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts` (lines 6-105) ``.
- **`OSKBuildingUnitService`**: Orchestrates high-level business logic for building units and exposes callable Cloud Functions triggers `` `functions/src/modules/building/modules/building_unit/services/building_unit.service.ts` (lines 41-383) ``.
- **`OSKBuildingUnitDoorService`**: Orchestrates unit door creation and inhabitant access synchronization `` `functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts` (lines 24-97) ``.
- **`OSKBuildingUnitInhabitantService`**: Orchestrates inhabitant additions, removals, and downstream settings/intercom updates `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (lines 20-257) ``.

*Confidence Tag: Confirmed*

---

#### building_unit_nonAppUser

This capability exposes several controllers and services as public entry points:

### Controllers
- **`OSKBuildingUnitNonAppUserController`**: Extends `OSKDocumentController` to manage the primary non-app user documents `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser.controller.ts|OSKBuildingUnitNonAppUserController` `` [Confirmed].
- **`OSKNonAppUserAccessController`**: Extends `OSKDocumentController` to manage access rights documents nested under the non-app user `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_access.controller.ts|OSKNonAppUserAccessController` `` [Confirmed].
- **`OSKNonAppUserPincodeController`**: Extends `OSKDocumentController` to manage PIN code documents nested under the non-app user `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_pincode.controller.ts|OSKNonAppUserPincodeController` `` [Confirmed].
- **`OSKNonAppUserActivitiesController`**: Extends `OSKDocumentAndMessageController` to manage individual activity logs nested under the non-app user `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_activity.controller.ts|OSKNonAppUserActivitiesController` `` [Confirmed].
- **`OSKNonAppUserActivityAggregatesController`**: Extends `OSKDocumentController` to manage 30-day activity aggregates nested under the non-app user `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_activity_aggregates.controller.ts|OSKNonAppUserActivityAggregatesController` `` [Confirmed].

### Services
- **`OSKBuildingUnitNonAppUserService`**: The primary orchestrator service handling high-level business logic for non-app users `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKBuildingUnitNonAppUserService` `` [Confirmed].
- **`OSKNonAppUserAccessService`**: Manages the creation and updates of access rights `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_access.service.ts|OSKNonAppUserAccessService` `` [Confirmed].
- **`OSKNonAppUserPincodeService`**: Manages the generation and storage of PIN codes `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_pincode.service.ts|OSKNonAppUserPincodeService` `` [Confirmed].
- **`OSKNonAppUserActivityService`**: Handles the ingestion and enrichment of individual door access activities `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity.service.ts|OSKNonAppUserActivityService` `` [Confirmed].
- **`OSKNonAppUserActivityAggregatesService`**: Handles the rolling 30-day aggregation of door access activities `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity_aggregates.service.ts|OSKNonAppUserActivityAggregatesService` `` [Confirmed].

#### building_user

This capability exposes the following public entry points and services:

*   **`OSKBuildingUserController`**: A document controller extending `OSKDocumentController` that manages Firestore operations for building user documents under the path `/buildings/${buildingId}/users` [Confirmed] (`functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts` (lines 11-44)).
*   **`OSKBuildingUserService`**: A service class containing the core business logic for creating building users and handling document deletion triggers [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 23-301)).
*   **`createBuildingUser` (Callable HTTPS Trigger)**: The primary external entry point for creating a building user association [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1`).

---

### 5. Internal Structure

*Note: This section contains the intra-module coupling note derived from AST import resolution.*

The `building` module is structured into 11 submodules with highly coupled internal relationships [Confirmed]:
- `_module_root` acts as the primary orchestrator, importing and delegating to `building_activity`, `building_door`, `building_intercom`, `building_settings`, `building_unit`, and `building_user` [Confirmed].
- Sibling submodules exhibit deep functional coupling to coordinate access and hardware states:
  - `building_unit_nonAppUser` depends on `_module_root`, `building_accesses`, `building_activity`, `building_door`, and `building_unit` to manage profiles, accesses, PINs, and activities for non-app users [Confirmed].
  - `building_door` is imported by `_module_root` and `building_intercom` [Confirmed], and itself imports `_module_root` and `building_intercom` [Confirmed].
  - `building_intercom` imports `_module_root`, `building_door`, `building_settings`, and `building_unit` [Confirmed], and is imported by `_module_root`, `building_door`, and `building_unit` [Confirmed].
  - `building_unit` imports `_module_root`, `building_door`, `building_intercom`, `building_settings`, and `building_unit_nonAppUser` [Confirmed], and is imported by `_module_root`, `building_intercom`, and `building_unit_nonAppUser` [Confirmed].
  - `building_pincode` is imported by `building_pincode_trash` [Confirmed] and imports `building_door` [Confirmed].
  - `building_settings` imports `_module_root` and `building_door` [Confirmed], and is imported by `_module_root`, `building_intercom`, and `building_unit` [Confirmed].
  - `building_user` imports `_module_root` and `building_accesses` [Confirmed], and is imported by `_module_root` [Confirmed].
  - `building_accesses` is imported by `building_unit_nonAppUser` and `building_user` [Confirmed].
  - `building_activity` is imported by `_module_root` and `building_unit_nonAppUser` [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains the cross-cutting data ownership conclusion.*

By combining the submodule data ownership extracts with the deterministic data ownership hints, the logical ownership of shared paths within the `building` module is resolved as follows:
- **`/buildings/{buildingId}`**: Owned by `_module_root` (via `OSKBuildingController`) [Confirmed]. It is the primary anchor. Although called by 7 other modules, it is the definitive representation of the building entity.
- **`/buildings/{buildingId}/doors/{doorId}`**: Owned by `building_door` (via `OSKBuildingDoorController`) [Inferred]. It is heavily called by sibling submodules (`building_intercom`, `building_settings`, `building_unit_nonAppUser`) and 7 external modules to resolve physical door configurations.
- **`/buildings/{buildingId}/accesses`**: Owned by `building_accesses` (via `OSKBuildingAccessesController`) [Inferred]. It acts as the central building-level accesses ledger, modified by `building_unit_nonAppUser` and `building_user` submodules, and queried by 6 external modules.
- **`/buildings/{buildingId}/units`**: Owned by `building_unit` (via `OSKBuildingUnitController` and `OSKBuildingUnitInhabitantController`) [Inferred]. It manages the logical unit hierarchy and is called by sibling submodules and 4 external modules.
- **`/buildings/{buildingId}/intercoms` and `/buildings/{buildingId}/callTransferList`**: Owned by `building_intercom` (via `OSKBuildingIntercomService` and `OSKBuildingIntercomCallTransferListController`) [Inferred]. It manages intercom hardware configurations and call routing.
- **`/buildings/{buildingId}/pincodes`**: Owned by `building_pincode` (via `OSKBuildingPincodeController` / `OSKBuildingPincodeService`) [Inferred]. It acts as the global building-level pincodes collection used by edge devices for offline validation. It is written to by `building_unit_nonAppUser` and queried/modified by external modules like `core` and `admin`.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers`**: Owned by `building_unit_nonAppUser` (via `OSKBuildingUnitNonAppUserController`) [Inferred]. It manages the lifecycle of non-app users and their subcollections (accesses, pincodes, activities, activityAggregates).

**Per-capability evidence:**

#### _module_root

### Firestore Paths

#### `/buildings/{id}`
- **Operations**: Read, Write, Delete [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._get|get|OSKBuildingController.collection,buildingId|#1`, `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._set|save|OSKBuildingController.collection,buildingId,data|#1`, `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._delete|delete|OSKBuildingController.collection,buildingId|#1`).
- **Description**: Represents the authoritative building document containing name, organizationId, propertyId, streetAddress, and imageFilename [Confirmed].

#### `/buildings/{id}/settings`
- **Operations**: Set, Delete [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingSettingsController.default.set|createOrganizationBuilding|defaultSettings|#1`, `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingSettingsController.default.delete|deleteBuilding|settingsId,request.buildingId|#1`).
- **Description**: Managed during building creation and deletion to provision default settings or clean up settings documents [Confirmed].

---

#### building_accesses

### Firestore Collections
- **Path**: `/buildings/{buildingId}/accesses/{userId}` (or `{memberId}`) [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (line 14) and the Firestore Schema document).
  - **Fields**:
    - `buildingId`: *string* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|buildingId|#1` ``)
    - `userId`: *string* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userId|#1` ``)
    - `userFirstName`: *string* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userFirstName|#1` ``)
    - `userLastName`: *string* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userLastName|#1` ``)
    - `accesses`: *array* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|accesses|#1` ``)
    - `creationDate`: *timestamp* [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/services/building_access.service.ts` (lines 37, 61) and the Firestore Schema document).
  - **Operations**: Read, Write (Create, Set, Update, Delete) [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 18-77)).

---

#### building_activity

- **Firestore Paths**:
  - The exact collection path is dynamically generated by `OSKBuildingActivitiesController.getCollectionPath(buildingId, doorId)` `` `controller_method|building|functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts|OSKBuildingActivitiesController|getCollectionPath|#1` ``. [Confirmed]
  - *Inferred Path*: Based on the parameters, this maps to `/buildings/{buildingId}/doors/{doorId}/activities` (or a similar subcollection structure) [Inferred].
- **Document Schema (`OSKBuildingActivity`)**:
  The document schema contains the following fields `` `functions/src/modules/building/modules/building_activity/models/documents/building_activity_document.model.ts` (lines 15-30) ``:
  - `activityId`: `string`
  - `accessControlDeviceId`: `string`
  - `acdType`: `string`
  - `timestamp`: `Timestamp`
  - `activityType`: `OSKAccessControlDeviceActivityType`
  - `userId`: `string`
  - `buildingId`: `string`
  - `buildingName`: `string`
  - `doorId`: `string`
  - `doorName`: `string`
  - `pincode`: `string`
  - `success`: `boolean`
  - `accessId`: `string`
  - `timestampKeystrokes`: `array`

#### building_door

The capability owns and performs direct read/write operations on the following Firestore paths:

| Firestore Path | Operations | Detection Scope |
| :--- | :--- | :--- |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{accessControlDeviceId}/keys` | `set` | `partial` [Confirmed; `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{accessControlDeviceId}/keys|#1` ``] |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys` | `get`, `delete` | `partial` [Confirmed; `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys|#1` ``] |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` | `onCreate`, `onDelete` | `resolved_constant` [Confirmed; `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/index.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}|#1` ``] |

---

#### building_intercom

This capability owns and performs operations on the following Firestore paths:

*   **`/buildings/{buildingId}/intercoms/{intercomId}`** [Confirmed]
    *   *Description*: Stores master intercom configuration and entries.
    *   *Operations*: Read, Create, Update, Delete.
    *   *Citation*: `functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts` (lines 17-58).
*   **`/buildings/{buildingId}/callTransferList/{callTransferListId}`** [Confirmed]
    *   *Description*: Stores call transfer lists for intercom routing.
    *   *Operations*: Read, Create, Update, Delete.
    *   *Citation*: `functions/src/modules/building/modules/building_intercom/controllers/building_intercom_calltransferlist.controller.ts` (lines 14-79).

*Confidence Tag*: **Confirmed**

---

#### building_pincode

This capability owns and manages documents under the following Firestore collection path:

### `/buildings/{buildingId}/pincodes/{pincodeId}`
- **Operations**: Read (`get`, `getAll`, `getAllByType`, `getByAccessId`), Write (`set`), Delete (`delete`) `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 15-82).
- **Schema Fields**:
  - `pincode`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|pincode|#1` ``
  - `userId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|userId|#1` ``
  - `buildingId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|buildingId|#1` ``
  - `doors`: *array* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|doors|#1` ``
  - `accessId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|accessId|#1` ``
  - `type`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|type|#1` ``
  - `creationDate`: *timestamp* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|creationDate|#1` ``
  - `unitId`: *string* (optional, present on Inhabitant, Guest, Permanent Guest, and Anonymous types) `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeInhabitantDocument|unitId|#1` ``
  - `inviterId`: *string* (optional, present on Guest and Permanent Guest types) `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeGuestDocument|inviterId|#1` ``
  - `invitedId`: *string* (optional, present on Guest and Permanent Guest types) `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeGuestDocument|invitedId|#1` ``

**Confidence Tag**: Confirmed

#### building_pincode_trash

### Firestore Paths [Inferred]
The exact Firestore collection path is resolved dynamically by `getCollectionPath(buildingId)` `` `functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts` (line 14) ``. 
- Based on the sibling `pincodes` collection path (`/buildings/{id}/pincodes`) and the requirement of `buildingId` to resolve the path, the collection path is highly likely nested under the building document, such as:
  - `/buildings/{buildingId}/pincodeTrash` [Inferred]

---

#### building_settings

### Firestore Paths
- **`/buildings/{buildingId}/settings/{settingsId}`**
  - **Operation Scope**: Read, Write, Delete.
  - **Description**: Stores the configuration settings for a specific building. The settings are stored as structured fields containing both a `value` and `metadata` (e.g., `canBeChanged`, `isRequired`, `description`). **Confirmed** `` `call_expression|building|functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts|OSKBuildingSettingsController.default._set|set|collectionPath,OSKBuildingSettingsController.default.DOCUMENT_ID,document|#1` ``, `` `functions/src/modules/building/modules/building_settings/models/documents/building_settings.model.ts` (lines 23-24) ``.

- **`/users/{userId}/buildingSettings/{buildingId}`**
  - **Operation Scope**: Read, Write, Delete (via external controller delegation).
  - **Description**: Interacts with user-specific building settings to clean up or update user settings when building-level settings are deleted or reset. **Confirmed** `` `call_expression|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKUserSettingsBuildingController.default.delete|deleteBuildingSettings|user.userId,request.buildingId|#1` ``.

#### building_unit

#### Firestore Collections & Paths
This capability owns and performs write operations on the following Firestore paths:
- **`/buildings/{buildingId}/units`** (Collection)
  - Documents: `OSKBuildingUnitDocument` `` `functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts` (lines 8-21) ``.
  - Operations: Create, Read, Update, Delete `` `functions/src/modules/building/modules/building_unit/controllers/building_unit.controller.ts` (lines 41-59) ``.
- **`/buildings/{buildingId}/units/{unitId}/doors`** (Subcollection)
  - Documents: `OSKBuildingUnitDoorDocument` `` `functions/src/modules/building/modules/building_unit/models/documents/building_unit_door_document.model.ts` (lines 9-14) ``.
  - Operations: Read, Write `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_door.controller.ts` (lines 18-28) ``.
- **`/buildings/{buildingId}/units/{unitId}/inhabitants`** (Subcollection)
  - Documents: `OSKBuildingUnitInhabitantDocument` `` `functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts` (lines 28-42) ``.
  - Operations: Create, Read, Update, Delete `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_inhabitant.controller.ts` (lines 18-90) ``.
- **`/buildings/{buildingId}/units/{unitId}/permanentGuests`** (Subcollection)
  - Documents: `OSKBuildingUnitPermanentGuestDocument` `` `functions/src/modules/building/modules/building_unit/models/documents/building_unit_permanent_guest_document.model.ts` (lines 9-21) ``.
  - Operations: Create, Read, Update, Delete `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts` (lines 13-105) ``.
- **`/buildings/{buildingId}/units/{unitId}/invitations`** (Subcollection)
  - Documents: `OSKBuildingUnitInhabitantInvitationDocument` `` `functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_invitation_document.model.ts` (lines 12-28) ``.
  - Operations: Create, Read, Delete `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts` (lines 18-65) ``.

*Confidence Tag: Confirmed*

---

#### building_unit_nonAppUser

This capability owns and manages documents within the following Firestore collection paths:

- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}`** [Confirmed]
  - *Description*: Stores the primary profile document (`OSKBuildingUnitNonAppUser`) for a non-app user.
  - *Operation Scope*: Create, Read, Update, Delete.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/accesses/{accessId}`** [Confirmed]
  - *Description*: Stores the specific access rights (`OSKNonAppUserAccessesDocument`) provisioned for the non-app user.
  - *Operation Scope*: Create, Read, Update, Delete.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes/{pincodeId}`** [Confirmed]
  - *Description*: Stores the offline alphanumeric PIN code document (`OSKNonAppUserPincodeDocument`) assigned to the non-app user.
  - *Operation Scope*: Create, Read, Delete.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activities/{activityId}`** [Confirmed]
  - *Description*: Stores individual door access activity logs (`OSKNonAppUserActivityDocument`) triggered by the non-app user.
  - *Operation Scope*: Create, Read, Delete.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activityAggregates/{buildingId}`** [Confirmed]
  - *Description*: Stores the rolling 30-day activity aggregates (`OSKNonAppUserActivityAggregateDocument`) for the non-app user.
  - *Operation Scope*: Create, Read, Update.

### Shared/Dual-Write Paths (Not Owned, but Modified)
- **`/buildings/{buildingId}/pincodes/{pincodeId}`** [Confirmed]
  - *Description*: The global building-level pincodes collection used by edge devices for offline validation. This capability writes to and deletes from this collection to sync non-app user PINs.
- **`/buildings/{buildingId}/accesses/{userId}`** [Confirmed]
  - *Description*: The global building-level accesses ledger. This capability updates this ledger when a non-app user's access rights are modified.

#### building_user

#### Firestore Paths
This capability owns and performs operations on the following Firestore path:
*   **`/buildings/{buildingId}/users/{userId}`** [Confirmed]
    *   *Operations*: Read, Write, Delete [Confirmed] (`call_expression|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|OSKBuildingUserController.default._get|get|`/buildings/${buildingId}/users`,userId|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|OSKBuildingUserController.default._set|save|`/buildings/${buildingId}/users`,userId,data|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|OSKBuildingUserController.default._delete|delete|`/buildings/${buildingId}/users`,userId|#1`).

#### Document Schemas
*   **`OSKBuildingUser` / `OSKBuildingUserDocument`** [Confirmed] (`type_alias|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|#1`, `type_alias|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUserDocument|#1`)
    *   `userId`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|userId|#1`)
    *   `buildingId`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|buildingId|#1`)
    *   `firstName`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|firstName|#1`)
    *   `lastName`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|lastName|#1`)
    *   `profileImageFilename`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|profileImageFilename|#1`)
    *   `organizationId`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|organizationId|#1`)
    *   `accessRights`: `OSKAccessRightWithTimestamp[]` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|accessRights|#1`)
    *   `authorizedDoors`: `OSKDoorInfo[]` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|authorizedDoors|#1`)
    *   `userType`: `OSKUserAccessType` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|userType|#1`)

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### API Contracts

#### `assigningBuildingToProperty`
- **Request Type**: `OSKPropertyAssigningBuildingRequestData`
  - `buildingData`: `Partial<OSKBuilding>`
  - `buildingId`: `string`
  - `newPropertyId`: `string`
  - `oldPropertyId`: `string | undefined` (optional)
  - `organizationId`: `string`
- **Response Type**: `void` (Inferred from handler signature)

#### `createOrganizationBuilding`
- **Request Type**: `OSKBuildingCreateRequest`
  - `imageFilename`: `string | undefined` (optional)
  - `name`: `string | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `streetAddress`: `OSKStreetAddress`
- **Response Type**: `void` (Inferred from handler signature)

#### `deleteBuildingImage`
- **Request Type**: `deleteBuildingImageRequest`
  - `buildingId`: `string`
  - `filename`: `string`
- **Response Type**: `void` (Inferred from handler signature)

#### `getAllBuildings`
- **Request Type**: `OSKBuildingGetAllRequestData`
  - `organizationId`: `string`
- **Response Type**: `void` (Inferred from handler signature)

#### `getBuildingById`
- **Request Type**: `OSKBuildingGetRequest`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKBuildingDetailsResponseData`
  - `building`: `OSKBuildingDocument`
  - `doorsCount`: `number`
  - `unitsCount`: `number`

#### `getBuildingsByPropertyId`
- **Request Type**: `OSKBuildingGetAllByPropertyRequest`
  - `accessControlDeviceType`: `OSKAccessControlDeviceType | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `void` (Inferred from handler signature)

#### `updateBuilding`
- **Request Type**: `OSKBuildingUpdateRequest`
  - `buildingId`: `string`
  - `data`: `Partial<OSKBuilding>`
  - `organizationId`: `string`
- **Response Type**: `void` (Inferred from handler signature)

### Firestore Triggers
- No direct Firestore triggers are declared in this root capability itself; it delegates trigger registration to the `building_door` submodule [Confirmed] (Citation: `call_expression|building|functions/src/modules/building/index.ts|buildingDoorTriggers.getFirestoreTriggers|getFirestoreTriggers|functionBuilder|#1`).

---

#### building_accesses

- No direct HTTP API contracts (`api_contract` facts) or Firestore triggers are defined in this capability's evidence pack [Confirmed].
- The controller methods (`get`, `getAll`, `save`, `create`, `update`, `deletePerUser`, `deleteAll`, `listDocuments`) are internal/module-level entry points extending `OSKDocumentController` [Inferred] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 14-77)).

---

#### building_activity

The capability exposes the following HTTPS callable functions:
- **`deleteAllBuildingActivities`**:
  - Request Type: `OSKDeleteAllBuildingActivitiesRequest`
    - `buildingId`: `string`
    - `doorId`: `string`
  - Handler: `OSKBuildingActivitiesService.deleteAllBuildingActivities` `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteAllBuildingActivities|#1` ``
- **`deleteBuildingActivityById`**:
  - Request Type: `OSKDeleteBuildingActivityByIdRequest`
    - `activityId`: `string`
    - `buildingId`: `string`
    - `doorId`: `string`
  - Handler: `OSKBuildingActivitiesService.deleteBuildingActivityById` `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteBuildingActivityById|#1` ``
- **`getActivityById`**:
  - Request Type: `OSKGetBuildingActivityByIdRequest`
    - `activityId`: `string`
    - `buildingId`: `string`
    - `doorId`: `string`
  - Handler: `OSKBuildingActivitiesService.getActivityById` `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getActivityById|#1` ``
- **`getAllBuildingActivities`**:
  - Request Type: `OSKGetAllBuildingActivitiesRequest`
    - `buildingId`: `string`
    - `doorId`: `string`
  - Handler: `OSKBuildingActivitiesService.getAllBuildingActivities` `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getAllBuildingActivities|#1` ``

*Note: No Firestore triggers are registered or owned by this capability's pack.* [Confirmed]

#### building_door

### Callable Functions
The capability exposes five callable Cloud Functions:

#### `organizationUserGetAllBuildingDoors`
- **Request Type**: `{ organizationId: string, buildingId: string }` [Confirmed; `` `functions/src/modules/building/modules/building_door/services/building_door.service.ts` (lines 35-40) ``]
- **Response Type**: `OSKBuildingDoor[]` [Inferred]

#### `organizationUserGetBuildingDoorById`
- **Request Type**: `OSKBuildingDoorGetRequest` [Confirmed]
- **Response Type**: `OSKBuildingDoor` [Inferred]

#### `organizationUserCreateBuildingDoor`
- **Request Type**: `OSKBuildingDoorCreateRequest` [Confirmed]
- **Response Type**: `OSKBuildingDoor` [Inferred]

#### `organizationUserUpdateBuildingDoor`
- **Request Type**: `OSKBuildingDoorUpdateRequest` [Confirmed]
- **Response Type**: `OSKBuildingDoor` [Inferred]

#### `deleteBuildingDoor`
- **Request Type**: `OSKBuildingDoorDeleteRequest` [Confirmed]
- **Response Type**: `void` [Inferred]

### Firestore Triggers
The capability registers two Firestore triggers on the `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` path:

#### `onDocumentCreated`
- **Trigger Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` [Confirmed; `` `functions/src/modules/building/modules/building_door/index.ts` (line 44) ``]
- **Handler**: `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated` [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/index.ts|db             .document(buildingDoorAccessControlDevicePath)             .onCreate|getFirestoreTriggers|OSKBuildingDoorAccessControlDeviceService.onDocumentCreated|#1` ``]

#### `onDocumentDeleted`
- **Trigger Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` [Confirmed; `` `functions/src/modules/building/modules/building_door/index.ts` (line 47) ``]
- **Handler**: `OSKBuildingDoorAccessControlDeviceService.onDocumentDeleted` [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/index.ts|db             .document(buildingDoorAccessControlDevicePath)             .onDelete|getFirestoreTriggers|OSKBuildingDoorAccessControlDeviceService.onDocumentDeleted|#1` ``]

---

#### building_intercom

This capability exposes the following Callable API contracts:

### Callable Functions

#### `deleteIntercomDisplayName`
*   **Request Type**: `OSKBuildingIntercomEntryDeleteRequest`
    *   `buildingId`: `string`
    *   `entryId`: `string`
    *   `organizationId`: `string`
*   **Response Type**: `Promise<void>` (Inferred)
*   **Citation**: `` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|deleteIntercomDisplayName|#1` ``

#### `onUpdateBuildingIntercomsTransferList`
*   **Request Type**: `OSKIntercomCallTransferListRequest`
    *   `buildingId`: `string`
    *   `callTransferList`: `OSKUserIntercomCallTransferListItem[]`
    *   `unitId`: `string`
    *   `userId`: `string`
*   **Response Type**: `Promise<void>` (Inferred)
*   **Citation**: `` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|onUpdateBuildingIntercomsTransferList|#1` ``

#### `updateIntercomDisplayName`
*   **Request Type**: `OSKBuildingIntercomDisplayNameRequest`
    *   `buildingId`: `string`
    *   `newDisplayName`: `string`
    *   `unitId`: `string`
*   **Response Type**: `Promise<void>` (Inferred)
*   **Citation**: `` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|updateIntercomDisplayName|#1` ``

### Firestore Triggers
*   None evidenced in this capability's pack.

---

#### building_pincode

No API contracts (`api_contract` facts) or Firestore triggers are defined within this capability's evidence pack.

**Confidence Tag**: Confirmed

#### building_pincode_trash

No explicit `api_contract` facts or Firestore triggers are evidenced within this capability's pack.

---

#### building_settings

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

#### building_unit

#### Callable Cloud Functions
The following callable functions are registered as public entry points `` `functions/src/modules/building/modules/building_unit/index.ts` (lines 67-77) ``:
- **`deleteBuildingUnit`**
- **`organizationUserCreateBuildingUnit`**
- **`organizationUserGetAllBuildingUnits`**
- **`organizationUserGetBuildingUnitById`**
- **`organizationUserUpdateBuildingUnit`**

#### Resolved API Request/Response Schemas

##### `deleteBuildingUnit`
- **Request Type**: `OSKBuildingUnitDeleteRequest`
  - `adminsOrganizationId`: `string | undefined` (optional)
  - `buildingId`: `string`
  - `unitId`: `string`

##### `organizationUserCreateBuildingUnit`
- **Request Type**: `OSKBuildingUnitCreateRequest`
  - `buildingId`: `string`
  - `capacity`: `string`
  - `floor`: `string`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress` (imported from `@oskey/core`)
  - `unitNumber`: `string`

##### `organizationUserUpdateBuildingUnit`
- **Request Type**: `OSKBuildingUnitUpdateRequest`
  - `buildingId`: `string`
  - `data`: `{ name: string; floor: string; unitNumber: string; streetAddress?: OSKStreetAddress; }`
  - `organizationId`: `string`
  - `unitId`: `string`

*Note: For `organizationUserGetAllBuildingUnits` and `organizationUserGetBuildingUnitById`, no matching `model_property` facts were resolved in this pack, so their schemas are not detailed here.*

#### Firestore Triggers
No Firestore triggers are defined or owned by this capability; all operations are driven via callable HTTPS functions `` `functions/src/modules/building/modules/building_unit/index.ts` (lines 67-77) ``.

*Confidence Tag: Confirmed*

---

#### building_unit_nonAppUser

This capability exposes several Firebase HTTPS Callable functions:

### Callable Functions
- **`createNonAppUser`**: Creates a new non-app user profile.
  - *Request Schema*: No `model_property` facts matched within this pack to resolve the request schema [Unknown].
- **`createNonAppUserAccess`**: Provisions access rights for an existing non-app user.
  - *Request Schema* (`OSKCreateNonAppUserAccessRequest`):
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `endDate`: `Date`
    - `nonAppUserId`: `string`
    - `startDate`: `Date`
    - `unitId`: `string`
- **`createNonAppUserWithAccess`**: Creates a non-app user and provisions their default access rights and PIN code in a single transaction.
  - *Request Schema* (`OSKCreateNonAppUserWithAccessRequest`):
    - `doorIds`: `string[] | undefined` (optional)
  - *Response Schema* (`OSKCreateNonAppUserwithAccessResponse`):
    - `accessId`: `string`
    - `fullName`: `string`
    - `nonAppUserId`: `string`
    - `pincode`: `string`
- **`deleteNonAppUser`**: Deletes a non-app user profile and revokes all associated access rights and PIN codes.
  - *Request Schema* (`OSKDeleteNonAppUserRequest`):
    - `buildingId`: `string`
    - `nonAppUserId`: `string`
    - `unitId`: `string`
- **`getAllNonAppUsers`**: Retrieves all non-app users registered in a specific unit.
  - *Request Schema* (`OSKGetAllNonAppUsersRequest`):
    - `buildingId`: `string`
    - `unitId`: `string`
- **`getNonAppUser`**: Retrieves a specific non-app user profile.
  - *Request Schema* (`OSKGetNonAppUserRequest`):
    - `buildingId`: `string`
    - `nonAppUserId`: `string`
    - `unitId`: `string`
- **`updateNonAppUser`**: Updates a non-app user's profile details.
  - *Request Schema* (`OSKUpdateNonAppUserRequest`):
    - `buildingId`: `string`
    - `dataToUpdate`: `UpdateData<OSKDocument<T>>`
    - `nonAppUserId`: `string`
    - `unitId`: `string`
- **`updateNonAppUserAccessDoors`**: Updates the authorized doors for a non-app user's access rights.
  - *Request Schema* (`OSKUpdateNonAppUserAccessDoorsRequest`):
    - `accessId`: `string`
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `nonAppUserId`: `string`
    - `unitId`: `string`

#### building_user

#### Callable API Contracts
*   **`createBuildingUser`** [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1`)
    *   **Request Schema**: `OSKBuildingUserCreateRequest`
        *   `accessRights`: `import("functions/src/modules/core/modules/access/models/access_right.model").OSKAccessRightWithTimestamp[]`
        *   `buildingId`: `string`
        *   `doors`: `import("functions/src/modules/core/models/shared/door_info.model").OSKDoorInfo[]`
        *   `firstName`: `string`
        *   `lastName`: `string`
        *   `organizationId`: `string`
        *   `userId`: `string`
        *   `userType`: `import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationUser | import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationGuestUser`
    *   **Response Schema**: No matching `model_property` facts were found in this pack for the response type of this endpoint [Unknown].

#### Firestore Triggers
*   **`onDocumentDeleted`**: Triggered when a document in the `/buildings/{buildingId}/users/{userId}` collection is deleted [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 290-301)).

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains the cross-cutting permissions and security risk callouts.*

Comparing the security implementations across all 11 submodules reveals significant asymmetries and enforcement patterns:
- **Enforcement Tally**:
  - **RBAC-Backed Submodules**: `_module_root` (enforces `v1.org.buildings.*`), `building_door` (enforces `v1.org.buildings.view/edit`), `building_intercom` (enforces `v1.admin.accessControlDevice.edit`), `building_settings` (enforces `v1.org.settings.*`), `building_unit` (enforces `v1.org.buildings.*`), and `building_user` (enforces `v1.org.buildings.create` and `v1.admin.building.register`) [Confirmed].
  - **No-RBAC Submodules**: `building_accesses`, `building_activity`, `building_pincode`, `building_pincode_trash`, and `building_unit_nonAppUser` reference **zero** explicit permission strings in their code [Confirmed]. They rely entirely on parameter validation, user-matching decorators (e.g., `@OSKUserSecurityChecks({ checkUserIdMatch: false })`), or parent controller delegation.
- **Unattributed Security-Relevant Signals**:
  - **`building_unit_nonAppUser`**: Executes `OSKSecurityChecks.checkParameters` across all service methods (at least 5 methods, including `createNonAppUser`) and raises parameter validation errors with no RBAC string identifiable behind them [Inferred].
  - **`building_activity`**: Executes `OSKSecurityChecks.checkParameters` across all public service methods (e.g., `getActivityById`, `deleteAllBuildingActivities`) and raises validation errors with no RBAC string identifiable behind them [Inferred].

**Per-capability evidence:**

#### _module_root

### Permission Candidates

- **`v1.org.buildings.create`**: Required to create an organization building [Confirmed] (Citation: `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.buildings.create|#1`). Matches `v1.org.buildings.create` in RBAC roles ("Allows to create a new building").
- **`v1.org.buildings.edit`**: Required to update building details [Confirmed] (Citation: `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.buildings.edit|#1`). Matches `v1.org.buildings.edit` in RBAC roles ("Allows to edit a building's information").
- **`v1.org.buildings.view`**: Required to view building details or list buildings [Confirmed] (Citation: `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.buildings.view|#1`). Matches `v1.org.buildings.view` in RBAC roles ("Allows to view the details of a building").
- **`v1.org.settings.create`**: Checked during `assigningBuildingToProperty` [Confirmed] (Citation: `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.settings.create|#1`). Matches `v1.org.settings.create` in RBAC roles ("Allows to create a new management rule").

### Security Rules Cross-Check
The `firestore.rules.txt` file defines rules for `/buildings/{buildingId}`:
- `allow read, write: if isValidUser();`
- Helper functions `canEditBuilding(buildingId)` and `canViewBuilding(buildingId)` enforce `v1.org.buildings.edit` and `v1.org.buildings.view` respectively. This aligns with the permission candidates checked in the service layer [Confirmed].

---

#### building_accesses

- No explicit permission strings are referenced in the code facts of this capability [Confirmed].
- **Security Rules Cross-Check**: The Firestore rules file (`firestore.rules.txt`) does not contain an explicit match for `/buildings/{buildingId}/accesses/{documentId}`. While `/buildings/{buildingId}` has `allow read, write: if isValidUser();`, this does not automatically cascade to subcollections in Firestore rules unless recursive wildcards are used (which are not used here). This represents a potential security rule mismatch or gap where access to `/buildings/{buildingId}/accesses` might be blocked by default or insufficiently restricted [Inferred] (evidenced by `firestore.rules.txt`).

---

#### building_activity

- **Security Decorators**: Service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` `` `call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKUserSecurityChecks|getActivityById|#1` ``. [Confirmed]
- **Parameter Validation**: Enforces strict parameter validation via `OSKSecurityChecks.checkParameters` on all public service methods `` `call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKSecurityChecks.checkParameters|getActivityById|#1` ``. [Confirmed]
- **RBAC Alignment**: No explicit permission strings (e.g., `v1.admin.building.view`) are directly referenced in the facts of this submodule. However, the base controller `OSKDocumentAndMessageController` or the decorator `OSKUserSecurityChecks` may implicitly handle authorization [Inferred].

#### building_door

The capability enforces the following permission checks:

| Operation | Permission String | RBAC Match Status |
| :--- | :--- | :--- |
| `organizationUserGetAllBuildingDoors` | `v1.org.buildings.view` | **Match**: Listed in RBAC roles as "Allows to view the details of a building". [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.view|#1` ``] |
| `organizationUserGetBuildingDoorById` | `v1.org.buildings.view` | **Match**: Listed in RBAC roles as "Allows to view the details of a building". [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.view|#1` ``] |
| `organizationUserCreateBuildingDoor` | `v1.org.buildings.edit` | **Match**: Listed in RBAC roles as "Allows to edit a building's information". [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.edit|#1` ``] |
| `organizationUserUpdateBuildingDoor` | `v1.org.buildings.edit` | **Match**: Listed in RBAC roles as "Allows to edit a building's information". [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.edit|#2` ``] |
| `deleteBuildingDoor` | `v1.org.buildings.createManager` | **Mismatch**: This permission string is referenced in code but is **not** present in the `rbac-roles.json` document. [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.createManager|#1` ``] |

---

#### building_intercom

This capability references and enforces the following security parameters:

*   **Permissions**:
    *   `v1.admin.accessControlDevice.edit`: Referenced as a permission candidate in `building_intercom_inhabitant.service.ts` `` `permission_candidate|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|v1.admin.accessControlDevice.edit|#1` ``.
        *   *Cross-check*: This permission exists in the RBAC roles document ("v1.admin - Allows to edit an existing access control device").
*   **Security Decorators**:
    *   `OSKUserSecurityChecks` with `{ checkUserIdMatch: false }` is applied to `onUpdateBuildingIntercomsTransferList` and `updateIntercomDisplayName` `` `call_expression|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKUserSecurityChecks|onUpdateBuildingIntercomsTransferList|{ checkUserIdMatch: false }|#1` ``.

*Confidence Tag*: **Confirmed**

---

#### building_pincode

No explicit permission strings (e.g., `v1.admin.*` or `v1.org.*`) are referenced directly within this capability's code files.

### Security Rules Analysis
Cross-checking against `firestore.rules.txt`, there is **no explicit match** defined for the collection path `/buildings/{buildingId}/pincodes/{pincodeId}`. 
- The default fallback rule in `firestore.rules.txt` is:
  ```javascript
  match /{document=**} {
    allow read, write: if false;
  }
  ```
- Because there is no recursive wildcard on the `/buildings/{buildingId}` match block, direct client-side reads or writes to `/buildings/{buildingId}/pincodes` are completely blocked.
- **Implication**: All pincode operations must be performed via backend Cloud Functions using the Firebase Admin SDK, which bypasses security rules.

**Confidence Tag**: Inferred

#### building_pincode_trash

No explicit permission strings are referenced in the provided evidence pack. However, because `OSKBuildingPincodeTrashController` inherits from `OSKDocumentController` `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController` ``, security and authorization checks are likely delegated to the base controller or Firestore security rules.

---

#### building_settings

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

#### building_unit

#### Permissions Referenced
The following permission strings are checked during execution:
- **`v1.org.buildings.view`**: Required to retrieve building units `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|organizationUserGetBuildingUnitById|organizationUser.roles,rolesToCheck|#1` ``.
- **`v1.org.buildings.edit`**: Required to create or update building units `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|organizationUserCreateBuildingUnit|organizationUser.roles,rolesToCheck|#1` ``.
- **`v1.org.buildings.create`**: Required to delete building units `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|deleteBuildingUnit|organizationUser.roles,rolesToCheck|#1` `` and create unit doors `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|createBuildingUnitDoor|organizationUser.roles,rolesToCheck|#1` ``.

#### RBAC Cross-Check
- `v1.org.buildings.view` matches the description "Allows to view the details of a building" in the RBAC roles document.
- `v1.org.buildings.edit` matches the description "Allows to edit a building's information" in the RBAC roles document.
- `v1.org.buildings.create` matches the description "Allows to create a new building" in the RBAC roles document. 

*Semantic Mismatch Note*: The permission `v1.org.buildings.create` is used to authorize the *deletion* of a building unit and the *creation* of a unit door. This is a slight semantic mismatch (using a building-creation permission for unit-level operations), but it is technically valid per the RBAC roles document.

*Confidence Tag: Confirmed*

---

#### building_unit_nonAppUser

- **Security Decorators**: All service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKUserSecurityChecks|createNonAppUser|{ checkUserIdMatch: false }|#1` `` [Confirmed]. This indicates that while the caller's identity is validated, they do not need to match the target non-app user's ID (since non-app users do not have Auth0 accounts or active sessions).
- **Parameter Validation**: Every service method executes `OSKSecurityChecks.checkParameters` to strictly validate incoming payloads (e.g., ensuring `buildingId`, `unitId`, and `nonAppUserId` are valid strings) `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKSecurityChecks.checkParameters|createNonAppUser|[             { name: 'context', value: context, type: 'object' },             { name: 'buildingId', value: request.buildingId, type: 'string' },             { name: 'unitId', value: request.unitId, type: 'string' },             { name: 'firstName', value: request.fullName, type: 'string' },             { name: 'inviterId', value: request.inviterId, type: 'string' },         ]|#1` `` [Confirmed].
- **RBAC Mismatch**: No explicit RBAC permission strings (e.g., `v1.org.residents.create`) are referenced directly within this submodule's code [Inferred]. Security checks likely rely on the caller being a verified ResidentAdmin of the unit or a Property Manager, but the exact mapping is handled by the decorator layer or parent controllers.

#### building_user

#### Permission Strings
The following permission strings are referenced by this capability's business logic:
*   **`v1.org.buildings.create`** [Confirmed] (`permission_candidate|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|v1.org.buildings.create|#1`)
*   **`v1.admin.building.register`** [Confirmed] (`permission_candidate|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|v1.admin.building.register|#1`)

#### RBAC Cross-Check
*   `v1.org.buildings.create` is defined in `rbac-roles.json` as "Allows to create a new building".
*   `v1.admin.building.register` is defined in `rbac-roles.json` as "v1.admin - Allows to register a new building".
*   *Note*: These permissions are checked during the creation of a building user association [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (line 49)). This represents a broad administrative permission check (building creation/registration) rather than a specific building-user assignment permission.

#### Firestore Security Rules
The security rules defined in `firestore.rules.txt` govern access to the `/buildings/{buildingId}/users/{userId}` collection:
*   **Read**: Allowed if the user is signed in and their email is verified [Confirmed] (`firestore.rules.txt` (lines 443-444)).
*   **Write**: Allowed if the user is signed in, their email is verified, and the target user document exists in the `/users` collection [Confirmed] (`firestore.rules.txt` (lines 443-445)).

---

### 10. Cross-Module Relationships

The `building` module maintains the following confirmed relationships with other modules in the repository [Confirmed]:

#### Outbound Dependencies (This module depends on)
- **`access_control_device`**: Imported by `building` models and submodules (e.g., `building_request.model.ts`, `building_activities.service.ts`, `building_door_access_control_device_document.model.ts`) to reference device types (`OSKAccessControlDeviceType`) and enrich activity data [Confirmed].
- **`core`**: Heavily imported (98 touchpoints) for base controllers (`OSKDocumentController`, `OSKDocumentAndMessageController`), common models (`OSKDocument`, `OSKStreetAddress`), logging (`OSKLoggingService`), secret management (`OSKSecretService`), and access utilities (`OSKAccessService`, `OSKPincodeService`) [Confirmed].
- **`organization`**: Imported to manage organization users (`OSKOrganizationUserController`), organization residents (`OSKOrganizationResidentsController`), and property associations (`OSKPropertyController`) [Confirmed].
- **`settings`**: Imported to perform role-based access control checks (`OSKConsolidatedRolesController`) [Confirmed].
- **`user`**: Imported to manage user documents (`OSKUserDocument`), user accesses (`OSKAccess`), and user intercom configurations (`OSKUserIntercomService`, `OSKUserSettingsBuildingController`) [Confirmed].

#### Inbound Dependencies (Other modules depend on this module)
- **`access_control_device`**: Depends on `building` to reference building activity documents (`OSKBuildingActivityDocument`) and query building accesses (`OSKBuildingAccessesController`) [Confirmed].
- **`admin`**: Heavily depends on `building` (32 touchpoints) to perform maintenance operations, query buildings/units, manage building settings, and clean up intercom call transfer lists [Confirmed].
- **`call`**: Depends on `building` to resolve door configurations (`OSKBuildingDoorController`) and retrieve intercom call transfer lists (`OSKBuildingIntercomCallTransferListController`) for WebRTC routing [Confirmed].
- **`core`**: Depends on `building` to handle Pub/Sub activity ingestion and manage non-app user pincodes (`OSKNonAppUserPincodeController`) [Confirmed].
- **`organization`**: Depends on `building` (33 touchpoints) to manage building invitations, resolve unit doors, and create/delete non-app users during resident onboarding [Confirmed].
- **`supplier`**: Depends on `building` to resolve supplier staff accesses and log supplier door activities [Confirmed].
- **`unit_management`**: Depends on `building` (17 touchpoints) to manage unit inhabitants, permanent guests, and non-app users [Confirmed].
- **`user`**: Depends on `building` (38 touchpoints) to resolve user inhabitant types, map user doors, and manage user building settings [Confirmed].

### 11. External Hooks

#### _module_root

### Google Cloud Storage
- **Image Uploads & Deletions**: The capability performs image uploads (`_uploadImage`) and deletions (`_deleteImage`) which interact with Google Cloud Storage buckets [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._uploadImage|uploadImage|bucket,imagePath,contentType,'imageFilename'|#1`, `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._deleteImage|deleteImage|filePath,imagePath|#1`).

---

#### building_accesses

- No external hooks, Pub/Sub topics, environment variables, or storage paths are evidenced in this capability's pack [Confirmed].

---

#### building_activity

- No direct external hooks (such as Pub/Sub topics, HTTP webhooks, or Cloud Storage paths) are explicitly declared in this capability's pack. [Confirmed]
- **Architectural Candidate**: The method `ActivityReceivedForBuilding` `` `service_method|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService|ActivityReceivedForBuilding|#1` `` acts as an ingestion sink, suggesting it is called by an external event handler (e.g., an IoT Pub/Sub subscriber or an API gateway in the `access_control_device` module) when a physical device transmits a door event [Inferred].

#### building_door

No external hooks (such as Pub/Sub publishers, external HTTP integrations, or cloud storage paths) are directly evidenced within this capability's pack. [Confirmed]

---

#### building_intercom

This capability integrates with the following external boundaries:

*   **Pub/Sub Topic**:
    *   `process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`: Environment variable specifying the Pub/Sub topic used to publish intercom updates to edge devices `` `external_hook|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}|#1` ``.
*   **Edge Device IDs (External Integrations)**:
    *   `intercomDoc.accessControlDeviceId` / `intercomId`: Used as a routing key or identifier when publishing messages to Pub/Sub `` `external_hook|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts|intercomDoc.accessControlDeviceId|#1` ``.

*Confidence Tag*: **Confirmed**

---

#### building_pincode

No direct external hooks, Pub/Sub publishers, or environment variables are explicitly declared in this capability's code.

### Architectural Candidates
According to the *Oskey Architecture* document:
- Pincodes generated in the cloud are synchronized to physical edge hardware (ACDs) asynchronously via GCP Pub/Sub and MongoDB.
- While the `building_pincode` capability handles the authoritative Firestore writes, a downstream synchronization pipeline (likely triggered by Firestore document write events in another capability) handles the actual Pub/Sub dispatch.

**Confidence Tag**: Inferred (from Grounding Documents)

#### building_pincode_trash

No external hooks, Pub/Sub topics, or external integrations are evidenced within this capability's pack.

---

#### building_settings

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced in this capability's pack. **Confirmed**

#### building_unit

No external hooks (such as Pub/Sub publish calls, HTTP client paths, environment variables, or storage paths) are directly evidenced within this capability's pack.

*Confidence Tag: Confirmed*

---

#### building_unit_nonAppUser

- **IoT Integration (ACD Sync)**: This capability integrates with the platform's asynchronous IoT data pipeline by calling `OSKAccessMessagePublisherService.publishMessageToAllACDs` `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|_deleteAccessSideEffects|nonAppUserId,buildingId,{                 operation: OSKAccessMessageOperation.Delete,                 accessId: access.accessId,                 creationDate: access.creationDate,             },access.authorizedDoors,{ category: 'nonAppUser', buildingId, unitId }|#1` `` [Confirmed]. This publishes state changes (creations, updates, deletions) to GCP Pub/Sub, which are subsequently synced to physical Intercoms and Digicoms.

#### building_user

No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or Cloud Storage paths) are directly evidenced within this capability's own pack [Confirmed].

---

### 12. Architectural Observations

- **Decoupled Edge Projection Pattern**: The module acts as the primary business validator and orchestrator for access credentials (PINs, accesses) [Confirmed]. It persists these in Firestore (e.g., `/buildings/{id}/pincodes`), which are then projected asynchronously to MongoDB and edge devices via Pub/Sub (evidenced by `OSKAccessMessagePublisherService.publishMessageToAllACDs` and `OSKIntercomMessagePublisherService.publishMessageIntercomUpdate`) [Confirmed]. This decouples business logic from physical hardware availability.
- **Deep Submodule Coupling**: Sibling submodules like `building_unit_nonAppUser` and `building_intercom` act as orchestrators that perform dual-writes across sibling subcollections (e.g., writing to both `/buildings/{id}/pincodes` and `/buildings/{id}/accesses`), bypassing strict encapsulation boundaries to maintain denormalized data consistency [Inferred].
- **Delegated Core Controller Layering**: All submodules leverage `core`'s serverless CRUD controllers (`OSKDocumentController` and `OSKDocumentAndMessageController`) for standard Firestore operations [Confirmed]. This enforces a highly standardized data access layer across the entire module, but shifts the responsibility of security and validation entirely to service-layer decorators and parameter checks.
- **Asymmetric Security Enforcement**: There is a clear architectural split between submodules that enforce strict RBAC permissions (e.g., `building_settings`, `building_unit`, `_module_root`) and those that rely entirely on parameter validation and user-matching decorators (e.g., `building_activity`, `building_unit_nonAppUser`, `building_accesses`) [Inferred]. This suggests that submodules managing administrative metadata are heavily guarded by RBAC, while submodules managing operational access states rely on implicit contextual security.

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **RBAC Mismatch (Undefined Permission in Code)**: The `building_door` submodule references the permission string `v1.org.buildings.createManager` in `deleteBuildingDoor` [Confirmed]. This permission string is completely missing from the authoritative `rbac-roles.json` document, creating a risk of authorization failures or unvalidated operations.
- **Broad Administrative Permission Overreach**: The `building_user` submodule checks for `v1.org.buildings.create` and `v1.admin.building.register` to authorize the creation of a building-user association [Confirmed]. Similarly, `building_unit` checks `v1.org.buildings.create` to authorize unit deletion and unit door creation [Confirmed]. Using high-level building creation/registration permissions for unit-level and user-assignment operations violates the Principle of Least Privilege.
- **Firestore Security Rules Gaps for Subcollections**: There are no explicit match rules in `firestore.rules.txt` for several critical subcollections, including `/buildings/{buildingId}/accesses` [Confirmed], `/buildings/{buildingId}/pincodes` [Confirmed], and `/buildings/{buildingId}/units/{unitId}/nonAppUsers` [Confirmed]. While this safely blocks client-side SDK access (falling back to the default `allow read, write: if false;` rule), it forces complete reliance on backend Cloud Functions using the Admin SDK. If any of these submodules do not strictly enforce RBAC checks in their service layers (as seen in `building_accesses` and `building_unit_nonAppUser` which reference zero explicit permission strings in code), there is a risk of privilege escalation if a Cloud Function is exposed without proper wrapper guards.
- **Unattributed Security-Relevant Signals**:
  - `building_unit_nonAppUser` executes `OSKSecurityChecks.checkParameters` across all service methods (at least 5 methods) and raises parameter validation errors with no RBAC string identifiable behind them [Inferred].
  - `building_activity` executes `OSKSecurityChecks.checkParameters` across all public service methods and raises validation errors with no RBAC string identifiable behind them [Inferred].

**Per-capability open questions:**

#### _module_root

- **Permission Mismatch**: Why does `assigningBuildingToProperty` check for `v1.org.settings.create` instead of a building-specific or property-specific edit permission? [Inferred]
- **Direct Firestore Triggers**: Are there any direct Firestore triggers defined for the `/buildings` collection itself, or are all triggers delegated to submodules (like `building_door`)? [Inferred]

#### building_accesses

- **Controller Exposure**: How are the controller methods of `OSKBuildingAccessesController` exposed? Are they wrapped in HTTP endpoints in a parent module/submodule, or are they strictly used internally by other services? [Inferred]
- **Security Rules Gap**: Why is there no explicit match for `/buildings/{buildingId}/accesses` in `firestore.rules.txt`? Is this collection intended to be accessed strictly via Admin SDK / Cloud Functions (bypassing client-side security rules), or is there a missing rule? [Inferred]

#### building_activity

- What is the exact Firestore collection path returned by `getCollectionPath(buildingId, doorId)`?
- How is `ActivityReceivedForBuilding` triggered? Is it invoked via a Pub/Sub subscription, an HTTPS endpoint, or direct Firestore triggers in another module?
- Which specific RBAC roles/permissions are required to invoke the callable functions (`deleteAllBuildingActivities`, etc.)? The decorators specify `{ checkUserIdMatch: false }` but do not explicitly list permission strings in the provided facts.

#### building_door

- **RBAC Permission Mismatch**: Why does `deleteBuildingDoor` check for `v1.org.buildings.createManager` instead of `v1.org.buildings.delete` or `v1.org.buildings.edit`? The permission `v1.org.buildings.createManager` is completely missing from the authoritative RBAC roles document. [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.createManager|#1` ``]
- **Inbound Coupling**: Which other capabilities or modules depend on `building_door` to read door configurations or validate access? (This is invisible from the current capability pack). [Inferred]

#### building_intercom

*   Are there any Firestore triggers that automatically clean up intercom entries when a building or door is deleted, or is that handled entirely by other modules?
*   How does the STUN/TURN/ICE signaling server (mentioned in the architecture overview) interact with the WebRTC contact IDs (`contactId`) stored in the intercom entries?

#### building_pincode

1. **Downstream Synchronization Trigger**: How is the asynchronous synchronization to MongoDB/PubSub triggered? Is there a Firestore `onWrite` trigger defined in another capability that listens to `/buildings/{buildingId}/pincodes/{pincodeId}` changes?
2. **Client-Side Access**: Is it intentional that `/buildings/{buildingId}/pincodes` has no explicit Firestore security rules, thereby completely preventing client-side SDK access?

#### building_pincode_trash

- **Exact Firestore Path**: What is the exact string returned by `getCollectionPath(buildingId)`?
- **Trash Status Values**: What are the allowed string literal values for `OSKPincodeTrashStatus`?
- **Service Logic**: What business logic does `OSKBuildingPincodeTrashService` implement, given that it is exported but has no method calls evidenced in this pack?
- **Retention Policy**: Is there an active background cron job or Cloud Function that automatically purges documents from this "trash" collection once `expirationDate` is reached?

#### building_settings

- **What is the exact value of `OSKBuildingSettingsController.DOCUMENT_ID`?** It is used as a constant but its literal value is not explicitly defined in the compact tables. **Inferred**
- **Are there any background synchronization tasks triggered when building settings are modified (e.g., pushing updates to edge devices)?** The architecture document mentions delta payloads and Pub/Sub synchronization, but the code in this capability pack only shows direct Firestore writes and calls to `user_settings`. **Inferred**

#### building_unit

- **Permission Granularity**: Why is the high-level `v1.org.buildings.create` permission used for deleting a building unit and creating a unit door, rather than a unit-specific permission or `v1.org.buildings.edit`?
- **Invitation Resolution**: While the `OSKBuildingUnitInvitationController` exists to manage invitations, the service-level logic for resolving or accepting invitations is not evidenced in this pack. Where is the invitation acceptance flow handled?

*Confidence Tag: Confirmed*

#### building_unit_nonAppUser

- **Firestore Rules Mismatch**: The `firestore.rules.txt` file does not contain any match rules for the `nonAppUsers` collection path (`/buildings/{buildingId}/units/{unitId}/nonAppUsers`) [Confirmed]. It is highly likely that this collection is restricted to server-side Admin SDK access only (via Cloud Functions), but if client-side SDKs ever need to query non-app users directly, they will be blocked by the default `allow read, write: if false;` rule.
- **Missing Request Schema**: The request schema for `createNonAppUser` is not resolved in the `model_property` facts of this pack [Unknown].

#### building_user

*   **Permission Mismatch**: Why does `createBuildingUser` check for building creation permissions (`v1.org.buildings.create` or `v1.admin.building.register`) instead of a more granular user-management or building-user assignment permission? [Inferred]
*   **Response Schema**: What is the exact response structure returned by the `createBuildingUser` callable function, as no model properties for its response type were defined in this pack? [Unknown]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.