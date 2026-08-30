### 0. Generation Metadata

- **runId**: `20260829_081559-00e1d9fd`
- **generatedAt**: `2026-08-29T13:33:14.266Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `building`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `building` module serves as the core physical and logical anchor of the Oskey platform, managing the lifecycle of buildings, units, doors, intercom directories, pincodes, and building-specific user accesses [Confirmed]. It orchestrates the mapping of physical Access Control Devices (ACDs) to doors, manages resident and non-app user onboarding, and handles the synchronization of access permissions and intercom directories to edge hardware [Confirmed]. By maintaining the authoritative state of physical real estate assets and their associated credentials, this module acts as the primary gateway for translating cloud-configured administrative policies into offline-executable physical access permissions [Inferred].

### 2. Architectural Position

The `building` module sits at the center of the platform's nested hierarchical data model, bridging the gap between the high-level administrative scopes (`Organization`, `Entity`, `Property`) and the granular, user-facing scopes (`Unit`, `User`) [Confirmed]. It provides the primary domain concepts of `Building`, `Unit`, `Door`, `Intercom`, `Pincode`, and `BuildingAccess` [Confirmed]. 

Architecturally, it acts as a middle-tier domain service [Inferred]. It consumes base CRUD and storage operations from the `core` module [Confirmed] and exposes domain-specific controllers and services to higher-level orchestration modules, including `admin`, `organization`, `unit_management`, and `user` [Confirmed]. It does not communicate directly with physical hardware; instead, it writes authoritative state to Firestore collections, which are projected downstream to MongoDB and synchronized to edge devices asynchronously [Inferred].

### 3. Primary Responsibilities

#### _module_root

The root capability of the building module is responsible for the following core features:

- **Building Creation**: Orchestrates the creation of a building document under `/buildings`, registers it under the organization's building list, initializes default building settings, and appends the building to its designated property [Confirmed]. This is handled via `createOrganizationBuilding` `` `api_contract|building|functions/src/modules/building/index.ts|createOrganizationBuilding|#1` ``.
- **Building Retrieval**: Retrieves details of a specific building by ID (including counts of associated doors and units) or lists all buildings under an organization [Confirmed]. This is handled via `getBuildingById` `` `api_contract|building|functions/src/modules/building/index.ts|getBuildingById|#1` `` and `getAllBuildings` `` `api_contract|building|functions/src/modules/building/index.ts|getAllBuildings|#1` ``.
- **Building Updates**: Updates building metadata (such as name and street address) and propagates these changes to associated user accesses and organization records [Confirmed]. This is handled via `updateBuilding` `` `api_contract|building|functions/src/modules/building/index.ts|updateBuilding|#1` ``.
- **Building Deletion**: Deletes a building and its settings, enforcing a strict precondition that the building must not have any active doors or units assigned [Confirmed]. This is handled via `deleteBuilding` `` `service_method|building|functions/src/modules/building/services/building.service.ts|OSKBuildingService|deleteBuilding|#1` ``.
- **Property Assignment**: Handles the transition of a building between properties, updating the building's `propertyId` and modifying the respective properties' building lists [Confirmed]. This is handled via `assigningBuildingToProperty` `` `api_contract|building|functions/src/modules/building/index.ts|assigningBuildingToProperty|#1` ``.
- **Image Management**: Manages the upload and deletion of building-associated images in Cloud Storage, updating the building's `imageFilename` field accordingly [Confirmed]. This is handled via `uploadImage` `` `service_method|building|functions/src/modules/building/services/building.service.ts|OSKBuildingService|uploadImage|#1` `` and `deleteBuildingImage` `` `api_contract|building|functions/src/modules/building/index.ts|deleteBuildingImage|#1` ``.

#### building_accesses

- **Building Access Document Management**: Defines the structure of building access documents (`OSKBuildingAccessDocument`) which map users to their authorized accesses within a specific building, containing fields such as `buildingId`, `userId`, `userFirstName`, `userLastName`, and an array of `accesses` `` `type_alias|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|#1` ``.
- **Access Provisioning & Updates**: Provides service methods to append new accesses to a user's building access ledger using Firestore's `FieldValue.arrayUnion` `` `call_expression|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|FieldValue.arrayUnion|createOrUpdateBuildingAccess|newAccess|#1` ``.
  - `createOrUpdateBuildingAccess`: Creates or updates building accesses for regular users `` `service_method|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService|createOrUpdateBuildingAccess|#1` ``.
  - `createOrUpdateBuildingAccessForStaffOrNonAppUser`: Creates or updates building accesses for staff members or non-app users `` `service_method|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService|createOrUpdateBuildingAccessForStaffOrNonAppUser|#1` ``.
- **Document Controller Operations**: Exposes standard CRUD and query operations for building accesses via `OSKBuildingAccessesController` (which extends `OSKDocumentController`), including `get`, `getAll`, `save`, `update`, `deletePerUser`, and `deleteAll` `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 11-77) ``.

---

#### building_activity

### Activity Ingestion and Storage
- **Enriched Activity Saving**: Receives enriched activity data from the access control system and persists it to Firestore [Confirmed] (`service_method|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService|ActivityReceivedForBuilding|#1`). It maps properties such as `accessControlDeviceId`, `acdType`, `activityType`, `userId`, `pincode`, and `success` status into a structured `OSKBuildingActivity` document [Confirmed] (`functions/src/modules/building/modules/building_activity/models/documents/building_activity_document.model.ts`, lines 15-30).
- **Document ID Generation**: Generates unique document IDs for new activity records using a centralized core controller utility [Confirmed] (`call_expression|building|functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts|OSKBuildingActivitiesController.default._generateDocId|generateDocId|collection|#1`).

### Activity Retrieval
- **Single Activity Lookup**: Retrieves a specific building activity record by its unique ID, building ID, and door ID [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getActivityById|#1`).
- **Bulk Activity Retrieval**: Queries and returns all activity logs associated with a specific building and door [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getAllBuildingActivities|#1`).

### Activity Deletion and Purging
- **Single Activity Deletion**: Deletes a single activity record by its ID [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteBuildingActivityById|#1`).
- **Purge All Activities**: Purges all logged activities for a specific building and door [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteAllBuildingActivities|#1`).

### Security and Parameter Validation
- **Parameter Validation**: Enforces strict type and presence checks on incoming request parameters (e.g., verifying that `buildingId`, `doorId`, and `activityId` are valid strings) before executing database operations [Confirmed] (`call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKSecurityChecks.checkParameters|getActivityById|[             { name: 'context', value: context, type: 'object' },             { name: 'buildingId', value: request.buildingId, type: 'string' },             { name: 'doorId', value: request.doorId, type: 'string' },             { name: 'activityId', value: request.activityId, type: 'string' },         ]|#1`).
- **User Security Checks**: Applies the `@OSKUserSecurityChecks` decorator to verify user context, though it bypasses direct user-ID matching since activities are queried at the building/door level rather than the individual user level [Confirmed] (`call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKUserSecurityChecks|getActivityById|{ checkUserIdMatch: false }|#1`).

---

#### building_door

### Door Administration & Lifecycle
- **Door Creation**: Allows organization users with appropriate permissions to provision new doors within a building, specifying the name, street address, and whether the door is accessible to all residents (`isForAllResidents`) `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserCreateBuildingDoor|#1` ``.
- **Door Modification**: Allows updating a door's name and street address `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserUpdateBuildingDoor|#1` ``.
- **Door Deletion**: Deletes a door from a building, verifying first that no active user accesses are associated with it, and then cleaning up the door reference from user access records `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|deleteBuildingDoor|#1` ``.

**Confidence Tag**: Confirmed

### Access Control Device (ACD) Assignment & Orchestration
- **Assignment Trigger**: Listens to Firestore document creation events on `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` to automatically assign the device to the building door, generate cryptographic keys, and provision intercom entries `` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentCreated|#1` ``.
- **Unassignment Trigger**: Listens to Firestore document deletion events on `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` to unassign the device, delete its configuration, and remove its public/private keys `` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentDeleted|#1` ``.

**Confidence Tag**: Confirmed

### Cryptographic Key Management
- **Key Generation**: Generates an Elliptic Curve (EC) key pair using the `prime256v1` curve for newly assigned ACDs `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|crypto.generateKeyPairSync|generateKeys|'ec',{             namedCurve: 'prime256v1',         }|#1` ``.
- **Secret Storage**: Persists the generated private key securely using the `OSKSecretService` `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|OSKSecretService.createPrivateKeySecret|generateKeys|accessControlDeviceId,privateKey|#1` ``.
- **Public Key Storage**: Stores the public key (both compressed and decompressed JWK formats) in Firestore under the device's subcollection `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{accessControlDeviceId}/keys|#1` ``.

**Confidence Tag**: Confirmed

### User Access Synchronization
- **Access Pruning**: Automatically removes deleted doors from user access profiles to prevent stale permissions `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKAccessUpdateService.removeDoorFromUserAccesses|deleteBuildingDoor|request.doorId,request.buildingId|#1` ``.
- **Access Updates**: Propagates door name or address updates to all associated user access documents `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKAccessUpdateService.updateUserAccessesDoorInfo|organizationUserUpdateBuildingDoor|oldBuildingDoor,doorInfo|#1` ``.

**Confidence Tag**: Confirmed

---

#### building_intercom

- **Intercom Entry Management**: Handles adding, updating, and deleting intercom entries for building inhabitants (specifically tenants) within the building's intercom documents. `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 106-143) [Confirmed]
- **Display Name Customization**: Exposes endpoints to update and delete custom display names for intercom entries, allowing inhabitants to control how their names appear on physical intercom screens. `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|updateIntercomDisplayName|#1`, `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|deleteIntercomDisplayName|#1` [Confirmed]
- **Call Transfer List Orchestration**: Manages the sequence and timeout configurations for routing intercom directory calls to inhabitants' mobile devices. `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|onUpdateBuildingIntercomsTransferList|#1` [Confirmed]
- **Hardware Synchronization**: Publishes serialized intercom configuration payloads to GCP Pub/Sub to update physical edge hardware (ACDs) asynchronously. `call_expression|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKIntercomMessagePublisherService.publishMessageIntercomUpdate|updateIntercomDisplayName|{                 ...intercomDoc,                 intercomEntries: updatedEntries,                 modificationDate,             }|#1` [Confirmed]
- **User Intercom Synchronization**: Synchronizes building-level intercom updates to denormalized user-scoped intercom documents. `call_expression|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKUserIntercomService.updateAllUserIntercomEntry|updateIntercomDisplayName|intercomId,buildingUnitInhabitantDocList,{                 displayName: request.newDisplayName,             }|#1` [Confirmed]

#### building_pincode

- **Specialized PIN Code Document Generation**: The capability defines and instantiates specialized PIN code documents tailored to different platform personas:
  - **Inhabitants**: Generates PIN codes for regular residents using `createPincodeInhabitantDocument` [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeInhabitantDocument|#1` ``.
  - **Guests**: Generates temporary PIN codes for guests using `createPincodeGuestDocument` [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeGuestDocument|#1` ``.
  - **Permanent Guests**: Generates scheduled PIN codes for recurring trusted visitors using `createPincodePermanentGuestDocument` [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodePermanentGuestDocument|#1` ``.
  - **Anonymous / Quickcode Recipients**: Generates time-bound, entry-limited PIN codes for anonymous visitors (e.g., delivery drivers) using `createPincodeAnonymousDocument` [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeAnonymousDocument|#1` ``.
  - **Suppliers**: Generates operational PIN codes for third-party contractors using `createPincodeSupplierDocument` [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeSupplierDocument|#1` ``.
- **PIN Code Document Persistence & Lifecycle Management**: Exposes standard CRUD-like operations for PIN code documents via `OSKBuildingPincodeController` [Confirmed] `` `source_class|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController` ``:
  - **Set**: Persists a PIN code document to Firestore [Confirmed] `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|set|#1` ``.
  - **Get / GetSafe**: Retrieves a specific PIN code document [Confirmed] `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|get|#1` ``.
  - **Delete**: Removes a PIN code document [Confirmed] `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|delete|#1` ``.
- **Querying & Filtering**: Supports querying PIN codes by building, type, or access ID:
  - **GetAll**: Retrieves all PIN codes for a building [Confirmed] `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getAll|#1` ``.
  - **GetAllByType**: Filters PIN codes within a building by their persona type [Confirmed] `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getAllByType|#1` ``.
  - **GetByAccessId**: Queries PIN codes associated with a specific access ID [Confirmed] `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getByAccessId|#1` ``.
- **Type Validation**: Validates whether a PIN code document belongs to an inhabitant type using helper functions `isPincodeTypeInhabitant` and `arePincodeTypeInhabitant` [Confirmed] `` `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` (lines 58-68) ``.

---

#### building_pincode_trash

- **Trash Document Management**: Provides CRUD-like operations for managing trashed pincode documents, including setting, retrieving, querying, updating, and deleting records within the trash collection `` `functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts` (lines 14-61) `` (**Confirmed**).
- **Trash Metadata Tracking**: Tracks the lifecycle state of trashed pincodes using the `OSKBuildingPincodeTrashDocument` model, which records the trash status, the timestamp of the last status update, and the expiration date for automatic cleanup `` `functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts` (lines 11-16) `` (**Confirmed**).
- **Collection Path Resolution**: Dynamically resolves the Firestore collection path for a building's trashed pincodes based on the building's unique identifier `` `call_expression|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController.default.getCollectionPath|get|buildingId|#1` `` (**Confirmed**).

---

#### building_settings

- **Creation of Building Settings**: Initializes default or custom settings for a building, validating parameters and checking permissions `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|createBuildingSettings|#1` ``. [Confirmed]
- **Retrieval of Resident Settings**: Fetches the settings applicable to residents of a building, ensuring the caller has the appropriate permissions `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|getResidentSettings|#1` ``. [Confirmed]
- **Updating Building Settings**: Modifies specific configuration fields and propagates updates to user-level building settings `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|updateBuildingSettings|#1` ``. [Confirmed]
- **Deletion of Building Settings**: Removes settings for a building and deletes corresponding user-level building settings `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|deleteBuildingSettings|#1` ``. [Confirmed]
- **Resetting Building Settings**: Resets building settings back to default values and updates user-level building settings accordingly `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|resetBuildingSettings|#1` ``. [Confirmed]
- **Default Data Generation**: Generates default settings documents with metadata fields (such as `canBeChanged`, `isRequired`, and `description`) `` `function_declaration|building|functions/src/modules/building/modules/building_settings/data/building_settings_default_data.ts|getBuildingSettingsDefaultDocumentData|#1` ``. [Confirmed]

---

#### building_unit

### Building Unit CRUD Management
- Handles the creation, retrieval, updating, and deletion of building units under the `/buildings/{buildingId}/units/{unitId}` Firestore path. [Confirmed]
- Validates unit creation and update payloads, ensuring mandatory fields such as `name`, `floor`, `unitNumber`, and `buildingId` are provided and correctly formatted. [Confirmed]
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserCreateBuildingUnit|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserUpdateBuildingUnit|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|deleteBuildingUnit|#1` ``.

### Unit Inhabitant Lifecycle Management
- Manages the onboarding and offboarding of inhabitants (tenants, residents, co-inhabitants) within a specific unit. [Confirmed]
- Provisions permanent access credentials for inhabitants by calling `OSKAccessService.createAccess` and configures user-specific building and unit settings. [Confirmed]
- Synchronizes inhabitant records with the building's intercom directories by calling `OSKBuildingIntercomService.addInhabitantInAllIntercoms` and `deleteIntercomEntryUser`. [Confirmed]
- *Citations*: `` `service_method|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingUnitInhabitantService|addInhabitant|#1` ``, `` `service_method|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingUnitInhabitantService|removeInhabitant|#1` ``.

### Unit Door Management
- Manages doors assigned to specific units and provisions permanent access for unit inhabitants to those doors. [Confirmed]
- *Citations*: `` `service_method|building|functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts|OSKBuildingUnitDoorService|createBuildingUnitDoor|#1` ``.

### Permanent Guest Management
- Manages permanent guests associated with a unit, allowing ResidentAdmins to provision scheduled, recurring access for trusted visitors (e.g., nannies, carers). [Confirmed]
- *Citations*: `` `source_class|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts|OSKBuildingUnitPermanentGuestController` ``.

### Inhabitant Invitation Management
- Manages invitations sent to prospective inhabitants, allowing them to onboard into a unit and claim their digital keys. [Confirmed]
- *Citations*: `` `source_class|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts|OSKBuildingUnitInvitationController` ``.

#### building_unit_nonAppUser

- **Request Schema**: `OSKCreateNonAppUserAccessRequest`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `endDate`: `Date`
  - `nonAppUserId`: `string`
  - `startDate`: `Date`
  - `unitId`: `string`
- **Response Schema**: `void` (Inferred).

#### building_user

### Building User Provisioning
Handles the creation of building users via the `createBuildingUser` callable function [Confirmed, `` `api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1` ``]. This process involves:
- Verifying that the request is authenticated and has valid permissions (checking for `v1.org.buildings.create` or `v1.admin.building.register`) [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 45-53) ``].
- Retrieving the target building and user documents [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 58-59) ``].
- Creating an access record using `OSKAccessService.createAccess` [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 81-87) ``].
- Saving the building user document to Firestore under `/buildings/{buildingId}/users/{userId}` [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (line 92) ``].

### Building User Document Management
Exposes standard CRUD operations (get, getAll, save, update, delete, deleteAll, listDocuments) for documents under `/buildings/{buildingId}/users/{userId}` via `OSKBuildingUserController` [Confirmed, `` `functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts` (lines 11-45) ``].

### Access Cleanup on Deletion
Listens to the deletion of building user documents (`onDocumentDeleted`) and triggers the deletion of associated building accesses and user accesses [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 290-301) ``].

---

### 4. Public Interfaces

#### _module_root

This capability exposes the following public controllers and entry points:

- **OSKBuildingController**: Located in `functions/src/modules/building/controllers/building.controller.ts` `` `source_class|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController` ``. It extends `OSKDocumentController` and exposes standard document operations (`_get`, `_set`, `_update`, `_delete`, `_uploadImage`, `_deleteImage`) customized for the `/buildings` collection.
- **OSKBuildingService**: Located in `functions/src/modules/building/services/building.service.ts` `` `source_class|building|functions/src/modules/building/services/building.service.ts|OSKBuildingService` ``. It acts as the primary orchestrator for building business logic, parameter validation, and permission checks.
- **Callable Cloud Functions**: Exposed in `functions/src/modules/building/index.ts` `` `source_file|building|functions/src/modules/building/index.ts|functions/src/modules/building/index.ts` ``:
  - `assigningBuildingToProperty`
  - `createOrganizationBuilding`
  - `deleteBuildingImage`
  - `getAllBuildings`
  - `getBuildingById`
  - `getBuildingsByPropertyId`
  - `updateBuilding`

#### building_accesses

- **`OSKBuildingAccessesController`**: Extends `OSKDocumentController` to expose REST/Cloud Function entry points for managing building access documents `` `source_class|building|functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts|OSKBuildingAccessesController` ``.
- **`OSKBuildingAccessService`**: Service class providing the core business logic for creating and updating building accesses `` `source_class|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService` ``.

---

#### building_activity

### Controllers
- **`OSKBuildingActivitiesController`** [Confirmed] (`source_class|building|functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts|OSKBuildingActivitiesController`):
  Extends `OSKDocumentAndMessageController` from the `core` module to inherit standard Firestore CRUD operations [Confirmed] (`functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts`, lines 10-17). It encapsulates the collection path resolution logic based on `buildingId` and `doorId` [Confirmed] (`controller_method|building|functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts|OSKBuildingActivitiesController|getCollectionPath|#1`).

### Services
- **`OSKBuildingActivitiesService`** [Confirmed] (`source_class|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService`):
  The primary orchestrator of business logic. It handles parameter validation, executes security checks, and calls the controller to perform database operations [Confirmed] (`functions/src/modules/building/modules/building_activity/services/building_activities.service.ts`, lines 18-115).

### Entry Points
- **`getCallableFunctionTriggers`** [Confirmed] (`function_declaration|building|functions/src/modules/building/modules/building_activity/index.ts|getCallableFunctionTriggers|#1`):
  Exposes the capability's HTTPS callable functions to the Firebase environment, enforcing App Check validation when not running in an emulator [Confirmed] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 38-46).

---

#### building_door

The capability exposes the following public classes and entry points:

- **`OSKBuildingDoorController`** (extends `OSKDocumentController`): Manages direct Firestore operations on the `/buildings/{buildingId}/doors` collection `` `source_class|building|functions/src/modules/building/modules/building_door/controllers/building_door.controller.ts|OSKBuildingDoorController` ``.
- **`OSKBuildingDoorAccessControlDeviceController`** (extends `OSKDocumentController`): Manages operations on the `/buildings/{buildingId}/doors/{doorId}/accessControlDevices` subcollection `` `source_class|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device.controller.ts|OSKBuildingDoorAccessControlDeviceController` ``.
- **`OSKBuildingDoorAccessControlDeviceKeysController`**: Handles cryptographic key generation, retrieval, and deletion for assigned ACDs `` `source_class|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|OSKBuildingDoorAccessControlDeviceKeysController` ``.
- **`OSKBuildingDoorService`**: Orchestrates high-level business logic for callable Cloud Functions, including permission checks and parameter validation `` `source_class|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKBuildingDoorService` ``.
- **`OSKBuildingDoorAccessControlDeviceService`**: Implements the background trigger handlers for Firestore document changes `` `source_class|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKBuildingDoorAccessControlDeviceService` ``.

---

#### building_intercom

- **OSKBuildingIntercomController**: Manages master building intercom documents and publishes Pub/Sub messages. `source_class|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|OSKBuildingIntercomController` [Confirmed]
- **OSKBuildingIntercomCallTransferListController**: Manages call transfer list documents. `source_class|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom_calltransferlist.controller.ts|OSKBuildingIntercomCallTransferListController` [Confirmed]
- **getCallableFunctionTriggers**: Exposes the callable Cloud Functions for external clients (mobile app and PGO). `functions/src/modules/building/modules/building_intercom/index.ts` (lines 60-69) [Confirmed]

#### building_pincode

The capability exposes the following public classes and services:
- **`OSKBuildingPincodeController`**: A document controller extending `OSKDocumentController` that manages direct Firestore operations for building PIN codes [Confirmed] `` `source_class|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController` ``.
- **`OSKBuildingPincodeService`**: A service class providing business logic to construct and format specialized PIN code documents for different user types before persistence [Confirmed] `` `source_class|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService` ``.

---

#### building_pincode_trash

- **OSKBuildingPincodeTrashController**: A document controller class extending `OSKDocumentController` that exposes endpoints/methods to manage trashed pincode documents `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController` `` (**Confirmed**).
  - `getCollectionPath(buildingId: string)`: Resolves the Firestore path for the building's pincode trash collection `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getCollectionPath|#1` ``.
  - `set(document: OSKBuildingPincodeTrashDocument)`: Adds a pincode document to the trash `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|set|#1` ``.
  - `get(pincodeId: string, buildingId: string)` / `getSafe(...)`: Retrieves a specific trashed pincode document `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|get|#1` ``.
  - `getAll(buildingId: string)` / `getAllSafe(...)`: Queries all trashed pincodes for a building `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getAll|#1` ``.
  - `update(buildingId: string, pincodeId: string, data: Partial<OSKBuildingPincodeTrashDocument>)`: Updates a trashed pincode document `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|update|#1` ``.
  - `delete(buildingId: string, pincodeId: string)`: Permanently deletes a pincode document from the trash `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|delete|#1` ``.
- **OSKBuildingPincodeTrashService**: An exported service class within the submodule `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/services/building_pincode_trash.service.ts|OSKBuildingPincodeTrashService` `` (**Confirmed**).

---

#### building_settings

- **OSKBuildingSettingsController**: Exposes methods to get, set, update, and delete building settings documents `` `source_class|building|functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts|OSKBuildingSettingsController` ``. [Confirmed]
- **OSKBuildingSettingsService**: Serverless entry point containing the callable Cloud Functions (`createBuildingSettings`, `deleteBuildingSettings`, `getResidentSettings`, `resetBuildingSettings`, `updateBuildingSettings`) `` `source_class|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService` ``. [Confirmed]

---

#### building_unit

This capability exposes the following controllers and services as public entry points:

### Controllers
- **`OSKBuildingUnitController`** (`functions/src/modules/building/modules/building_unit/controllers/building_unit.controller.ts`): Exposes standard CRUD operations for building units. [Confirmed]
- **`OSKBuildingUnitDoorController`** (`functions/src/modules/building/modules/building_unit/controllers/building_unit_door.controller.ts`): Manages unit-specific doors. [Confirmed]
- **`OSKBuildingUnitInhabitantController`** (`functions/src/modules/building/modules/building_unit/controllers/building_unit_inhabitant.controller.ts`): Manages unit inhabitant documents. [Confirmed]
- **`OSKBuildingUnitInvitationController`** (`functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts`): Manages inhabitant invitations. [Confirmed]
- **`OSKBuildingUnitPermanentGuestController`** (`functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts`): Manages permanent guest documents. [Confirmed]

### Services
- **`OSKBuildingUnitService`** (`functions/src/modules/building/modules/building_unit/services/building_unit.service.ts`): Orchestrates high-level business logic for unit creation, updates, and deletion. [Confirmed]
- **`OSKBuildingUnitInhabitantService`** (`functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts`): Orchestrates inhabitant addition, removal, and settings propagation. [Confirmed]
- **`OSKBuildingUnitDoorService`** (`functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts`): Orchestrates unit door creation and access synchronization. [Confirmed]

#### building_unit_nonAppUser

- **Request Schema**: `OSKCreateNonAppUserWithAccessRequest`
  - `doorIds`: `string[] | undefined` (optional)
- **Response Schema**: `OSKCreateNonAppUserwithAccessResponse`
  - `accessId`: `string`
  - `fullName`: `string`
  - `nonAppUserId`: `string`
  - `pincode`: `string`

#### building_user

### `OSKBuildingUserController`
Exposes standard document operations for building user documents, extending `OSKDocumentController` [Confirmed, `` `functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts` (lines 11-45) ``]:
- `get`
- `getAll`
- `save`
- `update`
- `delete`
- `deleteAll`
- `listDocuments`

### `OSKBuildingUserService`
Exposes the core service methods and trigger handlers [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 26, 290) ``]:
- `createBuildingUser` (Callable API handler)
- `onDocumentDeleted` (Firestore trigger handler)

---

### 5. Internal Structure

#### Submodule Coupling Note
The `building` module is structured into 11 submodules with dense internal coupling centered around `_module_root`, `building_door`, `building_unit`, and `building_unit_nonAppUser` [Confirmed]. Based on the AST import resolution graph, the submodules interact through the following confirmed coupling paths:

- **`_module_root`**: Maintains outbound dependencies on `building_activity`, `building_door`, `building_intercom`, `building_settings`, `building_unit`, and `building_user` [Confirmed]. It receives inbound imports from `building_door`, `building_intercom`, `building_settings`, `building_unit`, `building_unit_nonAppUser`, and `building_user` [Confirmed].
- **`building_accesses`**: Receives inbound imports from `building_unit_nonAppUser` and `building_user` [Confirmed].
- **`building_activity`**: Receives inbound imports from `_module_root` and `building_unit_nonAppUser` [Confirmed].
- **`building_door`**: Maintains outbound dependencies on `_module_root` and `building_intercom` [Confirmed]. It receives inbound imports from `_module_root`, `building_intercom`, `building_pincode`, `building_settings`, `building_unit`, and `building_unit_nonAppUser` [Confirmed].
- **`building_intercom`**: Maintains outbound dependencies on `_module_root`, `building_door`, `building_settings`, and `building_unit` [Confirmed]. It receives inbound imports from `_module_root`, `building_door`, and `building_unit` [Confirmed].
- **`building_pincode`**: Maintains outbound dependencies on `building_door` [Confirmed]. It receives inbound imports from `building_pincode_trash` [Confirmed].
- **`building_pincode_trash`**: Maintains outbound dependencies on `building_pincode` [Confirmed].
- **`building_settings`**: Maintains outbound dependencies on `_module_root` and `building_door` [Confirmed]. It receives inbound imports from `_module_root`, `building_intercom`, and `building_unit` [Confirmed].
- **`building_unit`**: Maintains outbound dependencies on `_module_root`, `building_door`, `building_intercom`, `building_settings`, and `building_unit_nonAppUser` [Confirmed]. It receives inbound imports from `_module_root`, `building_intercom`, and `building_unit_nonAppUser` [Confirmed].
- **`building_unit_nonAppUser`**: Maintains outbound dependencies on `_module_root`, `building_accesses`, `building_activity`, `building_door`, and `building_unit` [Confirmed]. It receives inbound imports from `building_unit` [Confirmed].
- **`building_user`**: Maintains outbound dependencies on `_module_root` and `building_accesses` [Confirmed]. It receives inbound imports from `_module_root` [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

#### Data Ownership Conclusion
While multiple submodules and external modules read and write across the building-scoped collections, the primary ownership of shared Firestore paths is resolved as follows:

- **`/buildings/{buildingId}`**: Owned by `_module_root` [Confirmed]. It manages the primary building metadata document.
- **`/buildings/{buildingId}/doors/{doorId}`**: Owned by `building_door` [Confirmed]. Its controller (`OSKBuildingDoorController`) is the authoritative interface called by 3 submodules and 7 external modules to manage door entities [Inferred].
- **`/buildings/{buildingId}/accesses/{userId}`**: Owned by `building_accesses` [Confirmed]. Its controller (`OSKBuildingAccessesController`) is the authoritative interface called by 2 submodules and 6 external modules to manage building-level access ledgers [Inferred].
- **`/buildings/{buildingId}/units/{unitId}`**: Owned by `building_unit` [Confirmed]. Its controller (`OSKBuildingUnitController`) is the authoritative interface called by 2 submodules and 4 external modules [Inferred].
- **`/buildings/{buildingId}/intercoms/{intercomId}`**: Owned by `building_intercom` [Confirmed]. Its service (`OSKBuildingIntercomService`) is the authoritative interface called by 2 submodules and 3 external modules [Inferred].
- **`/buildings/{buildingId}/settings/{settingsId}`**: Owned by `building_settings` [Confirmed]. Its controller (`OSKBuildingSettingsController`) is the authoritative interface called by 2 submodules and 1 external module [Inferred].
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}`**: Owned by `building_unit_nonAppUser` [Confirmed]. Its controller (`OSKBuildingUnitNonAppUserController`) is the authoritative interface called by 4 external modules [Inferred].
- **`/buildings/{buildingId}/pincodes/{pincode}`**: Owned by `building_pincode` [Confirmed]. Its controller (`OSKBuildingPincodeController`) is the authoritative interface called by 2 external modules [Inferred].
- **`/buildings/{buildingId}/pincodes_trash`**: Owned by `building_pincode_trash` [Confirmed]. Its controller (`OSKBuildingPincodeTrashController`) is the authoritative interface called by 1 external module [Inferred].

**Per-capability evidence:**

#### _module_root

This capability owns and manages the following Firestore paths:

- **`/buildings/{buildingId}`** [Confirmed]
  - **Operations**: Read, Write, Update, Delete.
  - **Description**: Stores the primary building metadata (name, organizationId, propertyId, streetAddress, imageFilename) `` `model_property|building|functions/src/modules/building/models/documents/building_document.model.ts|OSKBuilding|buildingId|#1` ``.
- **`/organizations/{organizationId}/buildings/{buildingId}`** [Confirmed]
  - **Operations**: Write, Update.
  - **Description**: Stores a denormalized reference of the building under the organization's subcollection `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKOrganizationBuildingController.default.save|createOrganizationBuilding|organizationId,buildingId,organizationBuilding|#1` ``.
- **`/properties/{propertyId}`** [Inferred]
  - **Operations**: Update (via `FieldValue.arrayUnion` and `removeBuildingFromProperty`).
  - **Description**: Modifies the `buildings` array field on the property document to maintain the property-to-building relationship `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKPropertyController.default.update|assigningBuildingToProperty|newPropertyId,{             buildings: FieldValue.arrayUnion(buildingInputParams),         }|#1` ``.

#### building_accesses

- **Firestore Path**: `/buildings/{buildingId}/accesses/{userId}` [Confirmed]
  - Governed by the `OSKBuildingAccess` model `` `type_alias|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|#1` ``.
  - Fields owned:
    - `buildingId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|buildingId|#1` ``
    - `userId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userId|#1` ``
    - `userFirstName`: *string* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userFirstName|#1` ``
    - `userLastName`: *string* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userLastName|#1` ``
    - `accesses`: *array* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|accesses|#1` ``

---

#### building_activity

### Firestore Paths
- **`buildings/{buildingId}/doors/{doorId}/[activities]`** [Inferred]:
  The exact subcollection path is dynamically resolved by `OSKBuildingActivitiesController.getCollectionPath(buildingId, doorId)` [Confirmed] (`controller_method|building|functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts|OSKBuildingActivitiesController|getCollectionPath|#1`). This subcollection holds documents conforming to the `OSKBuildingActivityDocument` type [Confirmed] (`functions/src/modules/building/modules/building_activity/models/documents/building_activity_document.model.ts`, lines 32-33).
  - **Operations**: Read (`get`, `getAll`), Write (`save`), Delete (`delete`, `deleteAll`) [Confirmed] (`functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts`, lines 20-54).

---

#### building_door

This capability owns and modifies the following Firestore paths:

| Firestore Path | Operation | Detection Scope | Citation |
| :--- | :--- | :--- | :--- |
| `/buildings/{buildingId}/doors/{doorId}` | `create`, `update`, `delete`, `get` | Full | `` `controller_method|building|functions/src/modules/building/modules/building_door/controllers/building_door.controller.ts|OSKBuildingDoorController|save|#1` `` |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` | `set`, `get`, `delete` | Full | `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/index.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}|#1` `` |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys/publicKey` | `set`, `get`, `delete` | Full | `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys|#1` `` |

---

#### building_intercom

- **Firestore Paths**:
  - `/buildings/{buildingId}/intercoms/{intercomId}`: Read, Write, Update, Delete. `functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts` (lines 17-58) [Confirmed]
  - `/buildings/{buildingId}/callTransferList/{callTransferListId}`: Read, Write, Update, Delete. `functions/src/modules/building/modules/building_intercom/controllers/building_intercom_calltransferlist.controller.ts` (lines 14-79) [Confirmed]

#### building_pincode

- **Firestore Path**: `/buildings/{buildingId}/pincodes/{pincode}`
  - **Description**: This capability owns and manages documents under the building-scoped pincodes subcollection [Confirmed].
  - **Operations**:
    - **Read**: Evidenced by `_get` and `_query` calls in `OSKBuildingPincodeController` [Confirmed] `` `call_expression|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController.default._get|get|collectionPath,pincodeId|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController.default._query|getAll|collectionPath|#1` ``.
    - **Write**: Evidenced by `_set` calls in `OSKBuildingPincodeController` [Confirmed] `` `call_expression|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController.default._set|set|collectionPath,document.pincode,document|#1` ``.
    - **Delete**: Evidenced by `_delete` calls in `OSKBuildingPincodeController` [Confirmed] `` `call_expression|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController.default._delete|delete|collectionPath,pincodeId|#1` ``.
  - **Schema Fields**: Based on the model properties, the base document (`OSKBuildingPincodeBaseDocument`) contains the following fields [Confirmed] `` `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` (lines 10-17) ``:
    - `pincode`: *string*
    - `userId`: *string*
    - `buildingId`: *string*
    - `doors`: *array*
    - `accessId`: *string*
    - `type`: *string*
    - `creationDate`: *timestamp*

---

#### building_pincode_trash

### Firestore Paths
- **`/buildings/{buildingId}/pincodes_trash`** (**Inferred**):
  - *Detection Scope*: Submodule Internal.
  - *Description*: Based on the controller's `getCollectionPath(buildingId)` method `` `call_expression|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController.default.getCollectionPath|get|buildingId|#1` `` and the capability's domain, this capability owns the subcollection containing trashed pincode documents under a specific building.
  - *Document Schema*: `OSKBuildingPincodeTrashDocument` `` `type_alias|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|#1` `` containing:
    - `status`: `OSKPincodeTrashStatus` `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|status|#1` ``
    - `lastStatusUpdate`: `Timestamp` `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|lastStatusUpdate|#1` ``
    - `expirationDate`: `Timestamp` `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|expirationDate|#1` ``

---

#### building_settings

- **`/buildings/{buildingId}/settings`**: This capability owns the settings document for each building, which is stored at `/buildings/{buildingId}/settings/{settingsId}` (where `settingsId` is typically a fixed document ID like `settings`) `` `functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts` (lines 13-17) ``. [Confirmed]
- **`/users/{userId}/buildingSettings`**: This capability updates and deletes user-level building settings documents via `OSKUserSettingsBuildingController` `` `functions/src/modules/building/modules/building_settings/services/building_settings.service.ts` (lines 371-373, 430, 491) ``. [Confirmed]

---

#### building_unit

This capability owns and performs read/write operations on the following Firestore paths:

### `/buildings/{buildingId}/units`
- **Operations**: Create, Read, Update, Delete. [Confirmed]
- *Citations*: `` `functions/src/modules/building/modules/building_unit/controllers/building_unit.controller.ts` (lines 18-74) ``.

### `/buildings/{buildingId}/units/{unitId}/doors`
- **Operations**: Read, Write. [Confirmed]
- *Citations*: `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_door.controller.ts` (lines 18-28) ``.

### `/buildings/{buildingId}/units/{unitId}/inhabitants`
- **Operations**: Create, Read, Update, Delete. [Confirmed]
- *Citations*: `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_inhabitant.controller.ts` (lines 14-90) ``.

### `/buildings/{buildingId}/units/{unitId}/permanentGuests`
- **Operations**: Create, Read, Update, Delete. [Confirmed]
- *Citations*: `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts` (lines 13-105) ``.

### `/buildings/{buildingId}/units/{unitId}/invitations`
- **Operations**: Create, Read, Delete. [Confirmed]
- *Citations*: `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts` (lines 14-65) ``.

#### building_unit_nonAppUser

This capability owns and performs write operations on the following Firestore paths:

### Primary Collections [Confirmed]
- **Non-App Users**: `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}` [Confirmed]
  - *Operation Scope*: Full CRUD.
  - *Controller*: `OSKBuildingUnitNonAppUserController`.
- **Accesses**: `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/accesses/{accessId}` [Confirmed]
  - *Operation Scope*: Full CRUD.
  - *Controller*: `OSKNonAppUserAccessController`.
- **Pincodes**: `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes/{pincodeId}` [Confirmed]
  - *Operation Scope*: Full CRUD.
  - *Controller*: `OSKNonAppUserPincodeController`.
- **Activities**: `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activities/{activityId}` [Confirmed]
  - *Operation Scope*: Full CRUD.
  - *Controller*: `OSKNonAppUserActivitiesController`.
- **Activity Aggregates**: `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activityAggregates/{buildingId}` [Confirmed]
  - *Operation Scope*: Full CRUD.
  - *Controller*: `OSKNonAppUserActivityAggregatesController`.

### Shared/External Collections Written To [Confirmed]
- **Building Accesses**: `/buildings/{buildingId}/accesses/{nonAppUserId}` [Confirmed]
  - *Operation Scope*: Write/Update/Delete.
  - *Controller*: `OSKBuildingAccessesController` (Sibling submodule).
  - *Context*: Synchronizes the Non-App User's consolidated accesses to the building-level access ledger for hardware projection generation.

---

#### building_user

### Firestore Paths
- `/buildings/{buildingId}/users/{userId}` [Confirmed, `` `functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts` (lines 19, 23, 27, 31, 35, 39, 43) ``]
  - **Operations**: Read, Write (Create, Update, Delete)
  - **Confidence**: Confirmed (evidenced by controller methods and Firestore security rules).

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable API Contracts
The following callable API contracts are exposed by this capability:

#### `assigningBuildingToProperty`
- **Request Type**: `OSKPropertyAssigningBuildingRequestData`
  - `buildingData`: `Partial<OSKBuilding>`
  - `buildingId`: `string`
  - `newPropertyId`: `string`
  - `oldPropertyId`: `string | undefined` (optional)
  - `organizationId`: `string`

#### `createOrganizationBuilding`
- **Request Type**: `OSKBuildingCreateRequest`
  - `imageFilename`: `string | undefined` (optional)
  - `name`: `string | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `streetAddress`: `OSKStreetAddress`

#### `getAllBuildings`
- **Request Type**: `OSKBuildingGetAllRequestData`
  - `organizationId`: `string`

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

#### `updateBuilding`
- **Request Type**: `OSKBuildingUpdateRequest`
  - `buildingId`: `string`
  - `data`: `Partial<OSKBuilding>`
  - `organizationId`: `string`

#### `deleteBuildingImage`
- **Request Type**: `deleteBuildingImageRequest`
  - `buildingId`: `string`
  - `filename`: `string`

### Firestore Triggers
The root capability does not define direct Firestore triggers on the `/buildings` collection itself, but it orchestrates and registers triggers owned by its submodules (such as `building_door` and `building_activity`) during initialization `` `call_expression|building|functions/src/modules/building/index.ts|buildingDoorTriggers.getFirestoreTriggers|getFirestoreTriggers|functionBuilder|#1` ``.

#### building_accesses

- **API Contracts**: No explicit `api_contract` facts are present in this capability's evidence scope.
- **Firestore Triggers**: No Firestore triggers are defined within this capability's evidence scope.

---

#### building_activity

### API Contracts (Callable Functions)

#### `deleteAllBuildingActivities`
- **Request Type**: `OSKDeleteAllBuildingActivitiesRequest` [Confirmed]
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: Standard HTTPS response [Inferred] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 103-114)

#### `deleteBuildingActivityById`
- **Request Type**: `OSKDeleteBuildingActivityByIdRequest` [Confirmed]
  - `activityId`: `string`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: Standard HTTPS response [Inferred] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 90-102)

#### `getActivityById`
- **Request Type**: `OSKGetBuildingActivityByIdRequest` [Confirmed]
  - `activityId`: `string`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `OSKBuildingActivityDocument` [Inferred] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 59-76)

#### `getAllBuildingActivities`
- **Request Type**: `OSKGetAllBuildingActivitiesRequest` [Confirmed]
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: Array of `OSKBuildingActivityDocument` [Inferred] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 77-89)

### Firestore Triggers
- No Firestore triggers are owned or declared by this capability [Confirmed] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 38-46).

---

#### building_door

### Callable API Contracts

#### `deleteBuildingDoor`
- **Request Type**: `OSKBuildingDoorDeleteRequest`
  - `adminsOrganizationId`: `string | undefined` (optional)
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: Not explicitly defined in resolved schemas (returns void or status).
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 199-255)

#### `organizationUserCreateBuildingDoor`
- **Request Type**: `OSKBuildingDoorCreateRequest`
  - `buildingId`: `string`
  - `isForAllResidents`: `boolean`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress`
- **Response Type**: Not explicitly defined in resolved schemas.
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 94-145)

#### `organizationUserUpdateBuildingDoor`
- **Request Type**: `OSKBuildingDoorUpdateRequest`
  - `buildingId`: `string`
  - `data`: `Partial<Pick<OSKBuildingDoor, "name" | "streetAddress">>`
  - `doorId`: `string`
  - `organizationId`: `string`
- **Response Type**: Not explicitly defined in resolved schemas.
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 147-197)

#### `organizationUserGetAllBuildingDoors`
- **Request Type**: Not listed in resolved schemas.
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 35-54)

#### `organizationUserGetBuildingDoorById`
- **Request Type**: Not listed in resolved schemas.
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 56-93)

---

### Firestore Triggers

- **`onDocumentCreated`**: Triggered when a document is created at `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` `` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentCreated|#1` ``.
- **`onDocumentDeleted`**: Triggered when a document is deleted at `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` `` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentDeleted|#1` ``.

---

#### building_intercom

### Callable Functions
- **deleteIntercomDisplayName** (Request: `OSKBuildingIntercomEntryDeleteRequest`)
  - `buildingId`: `string`
  - `entryId`: `string`
  - `organizationId`: `string`
- **onUpdateBuildingIntercomsTransferList** (Request: `OSKIntercomCallTransferListRequest`)
  - `buildingId`: `string`
  - `callTransferList`: `OSKUserIntercomCallTransferListItem[]`
  - `unitId`: `string`
  - `userId`: `string`
- **updateIntercomDisplayName** (Request: `OSKBuildingIntercomDisplayNameRequest`)
  - `buildingId`: `string`
  - `newDisplayName`: `string`
  - `unitId`: `string`

### Firestore Triggers
- None evidenced in this capability pack. [Confirmed]

#### building_pincode

No API contracts (`api_contract` facts) or Firestore triggers are evidenced within this capability's pack [Confirmed].

---

#### building_pincode_trash

- No external HTTP API contracts (`api_contract` facts) or Firestore triggers are directly evidenced as owned by this capability's pack (**Confirmed**).

---

#### building_settings

#### Callable APIs
- **createBuildingSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|createBuildingSettings|#1` ``
  - **Request Type**: `OSKBuildingSettingsCreateRequest`
    - `buildingId`: `string`
    - `buildingSettingsInputParams`: `import("functions/src/modules/building/modules/building_settings/models/documents/building_settings.model").OSKBuildingSettingsInputParams`
- **deleteBuildingSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|deleteBuildingSettings|#1` ``
  - **Request Type**: `OSKBuildingDeleteOrResetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
- **getResidentSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|getResidentSettings|#1` ``
  - **Request Type**: `OSKBuildingGetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
- **resetBuildingSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|resetBuildingSettings|#1` ``
  - **Request Type**: `OSKBuildingDeleteOrResetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
- **updateBuildingSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|updateBuildingSettings|#1` ``
  - **Request Type**: `OSKBuildingUpdateSettingsRequest`
    - `buildingId`: `string`
    - `update`: `Partial<import("functions/src/modules/building/modules/building_settings/models/documents/building_settings.model").OSKBuildingSettingsInputParams>`

No Firestore triggers are evidenced in this capability's pack. [Confirmed]

---

#### building_unit

### API Contracts (Callable Functions)

#### `deleteBuildingUnit`
- **Request Type**: `OSKBuildingUnitDeleteRequest`
  - `adminsOrganizationId`: `string | undefined` (optional)
  - `buildingId`: `string`
  - `unitId`: `string`
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|deleteBuildingUnit|#1` ``.

#### `organizationUserCreateBuildingUnit`
- **Request Type**: `OSKBuildingUnitCreateRequest`
  - `buildingId`: `string`
  - `capacity`: `string`
  - `floor`: `string`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress`
  - `unitNumber`: `string`
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserCreateBuildingUnit|#1` ``.

#### `organizationUserUpdateBuildingUnit`
- **Request Type**: `OSKBuildingUnitUpdateRequest`
  - `buildingId`: `string`
  - `data`: `{ name: string; floor: string; unitNumber: string; streetAddress?: OSKStreetAddress; }`
  - `organizationId`: `string`
  - `unitId`: `string`
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserUpdateBuildingUnit|#1` ``.

#### `organizationUserGetAllBuildingUnits`
- **Request Type**: Not listed in resolved schemas. [Unknown]
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserGetAllBuildingUnits|#1` ``.

#### `organizationUserGetBuildingUnitById`
- **Request Type**: Not listed in resolved schemas. [Unknown]
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserGetBuildingUnitById|#1` ``.

### Firestore Triggers
- **`nonAppUserTriggers.getCallableFunctionTriggers`**: Registers callable triggers for non-app users. [Confirmed]
- *Citations*: `` `functions/src/modules/building/modules/building_unit/index.ts` (line 70) ``.

#### building_unit_nonAppUser

- **Request Schema**: `OSKDeleteNonAppUserRequest`
  - `buildingId`: `string`
  - `nonAppUserId`: `string`
  - `unitId`: `string`
- **Response Schema**: `void` (Inferred).

#### building_user

### Callable API Contracts

#### `createBuildingUser`
- **Request Type**: `OSKBuildingUserCreateRequest` [Confirmed, `` `api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1` ``]
- **Request Schema**:
  ```typescript
  {
    accessRights: import("functions/src/modules/core/modules/access/models/access_right.model").OSKAccessRightWithTimestamp[];
    buildingId: string;
    doors: import("functions/src/modules/core/models/shared/door_info.model").OSKDoorInfo[];
    firstName: string;
    lastName: string;
    organizationId: string;
    userId: string;
    userType: import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationUser | import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationGuestUser;
  }
  ```
- **Response Type**: No response schema matched within this pack [Confirmed].

### Firestore Triggers

#### `onDocumentDeleted`
- **Trigger Source**: Deletion of a document in `/buildings/{buildingId}/users/{userId}` [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 290-301) ``].
- **Action**: Calls `OSKBuildingAccessesController.deletePerUser` and `OSKUserAccessesController.deleteAllUserAccesses` to clean up access records [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 297-300) ``].

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

#### Cross-Cutting Security Risk Callouts
A comparative analysis of security enforcement across the 11 submodules reveals significant asymmetries and potential risks:

- **Security Enforcement Asymmetry**: There is an inconsistent security posture between administrative configuration and credential management [Inferred]. Highly sensitive credential-management submodules—such as `building_pincode` (PIN generation), `building_pincode_trash` (soft-deleted PIN retention), and `building_unit_nonAppUser` (non-app user credentials)—do not enforce explicit, granular RBAC permission strings in their service layers [Inferred]. Instead, they rely on generic `@OSKUserSecurityChecks({ checkUserIdMatch: false })` or parameter checks [Confirmed]. Conversely, less sensitive submodules like `building_settings` strictly enforce granular RBAC permissions (e.g., `v1.org.settings.edit`, `v1.org.settings.view`) [Confirmed].
- **Unattributed Security-Relevant Signals**:
  - `building_unit_nonAppUser` raises 2 parameter validation/permission errors (via `OSKSecurityChecks.checkParameters`) with no RBAC string backing them [Inferred].
  - `building_activity` raises 2 parameter validation errors with no RBAC string backing them [Inferred].
  - `building_intercom` contains 2 methods (`updateIntercomDisplayName` and `onUpdateBuildingIntercomsTransferList`) that bypass strict user-document matching but lack explicit RBAC permission checks [Inferred].
- **Domain Permission Mismatch**: `building_user` checks for building creation/registration permissions (`v1.org.buildings.create` and `v1.admin.building.register`) to authorize creating a building-user association [Confirmed]. This is a domain mismatch, as building creation permissions are used to guard user-onboarding operations instead of user/resident management permissions (e.g., `v1.org.residents.create`) [Inferred].
- **RBAC Schema Mismatches**:
  - **`v1.org.buildings.createManager`**: Referenced in `building_door.service.ts` [Confirmed]. This permission string is completely missing from the master `rbac-roles.json` schema [Confirmed].

**Per-capability evidence:**

#### _module_root

This capability references and enforces the following permission strings:

- **`v1.org.buildings.create`**: Checked during building creation `` `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.buildings.create|#1` ``. Matches the RBAC role "Allows to create a new building".
- **`v1.org.buildings.edit`**: Checked during building updates `` `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.buildings.edit|#1` ``. Matches the RBAC role "Allows to edit a building's information".
- **`v1.org.buildings.view`**: Checked during building retrieval `` `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.buildings.view|#1` ``. Matches the RBAC role "Allows to view the details of a building".
- **`v1.org.settings.create`**: Checked during building creation to initialize default settings `` `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.settings.create|#1` ``. Matches the RBAC role "Allows to create a new management rule".

### Security Decorators & Helpers
- **`OSKUserSecurityChecks`**: Enforces authentication and App Check verification on service methods `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKUserSecurityChecks|createOrganizationBuilding|{ checkUserIdMatch: false }|#1` ``.
- **`OSKSecurityChecks.checkParameters`**: Validates that required parameters (such as `context`, `organizationId`, `buildingId`) are present and of the correct type `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKSecurityChecks.checkParameters|createOrganizationBuilding|[                 { name: 'context', value: context, type: 'object' },                 { name: 'organizationId', value: request.organizationId, type: 'string' },                 { name: 'propertyId', value: request.propertyId, type: 'string' },             ]|#1` ``.

#### building_accesses

- **Firestore Security Rules**:
  - Accesses are stored under `/buildings/{buildingId}/accesses/{userId}`.
  - According to the global `firestore.rules.txt` file, the `/buildings/{buildingId}` path allows read and write operations if the user is signed in and has a verified email:
    ```javascript
    match /buildings/{buildingId} {
      allow read, write: if isValidUser();
      ...
    }
    ```
- **RBAC Roles**: No explicit permission strings (e.g., `v1.admin.user.accesses.create`) are directly referenced in the code facts of this pack, but the base controller `OSKDocumentController` may enforce them dynamically.

---

#### building_activity

- **Security Decorators**: The callable service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` [Confirmed] (`call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKUserSecurityChecks|getActivityById|{ checkUserIdMatch: false }|#1`). This ensures that the user is authenticated and has a valid session, but bypasses strict user-document matching since activity logs are queried at the building/door level [Inferred].
- **RBAC Alignment**: No explicit permission strings (e.g., `v1.admin.building.view`) are directly referenced in the capability's code facts [Confirmed]. However, access is implicitly restricted to authorized users who pass the decorator checks [Inferred].

---

#### building_door

The capability references the following permission strings:

- **`v1.org.buildings.view`**: Required to list doors or retrieve a door by ID `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.view|#1` ``.
- **`v1.org.buildings.edit`**: Required to create, update, or delete a building door `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.edit|#1` ``.
- **`v1.org.buildings.createManager`**: Referenced in `building_door.service.ts` `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.createManager|#1` ``.

### RBAC Cross-Check & Mismatches
- `v1.org.buildings.view` and `v1.org.buildings.edit` match the supplied RBAC roles document exactly.
- **Mismatch**: `v1.org.buildings.createManager` is referenced in the code but is **not** present in the supplied RBAC roles document. The closest valid permission in the RBAC document is `v1.org.user.create` or `v1.org.buildings.create`.

---

#### building_intercom

- **v1.admin.accessControlDevice.edit**: Referenced as a required permission for deleting an intercom entry's display name. `permission_candidate|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|v1.admin.accessControlDevice.edit|#1`. This matches the RBAC roles document description: "v1.admin - Allows to edit an existing access control device". [Confirmed]

#### building_pincode

- No specific permission strings (e.g., RBAC permissions) are explicitly referenced or checked within the source code of this capability's pack [Confirmed].
- Security rules for the `/buildings/{buildingId}/pincodes` subcollection are not explicitly defined in the provided `firestore.rules.txt` file, although general building subcollections are governed by `isValidUser()` [Inferred].

---

#### building_pincode_trash

- No explicit permission strings are referenced in the provided facts for this capability (**Unknown**). 
- *Note*: Security is likely enforced at the parent `OSKDocumentController` level or via Firestore Security Rules, but no direct evidence of specific RBAC permissions (e.g., `v1.org.residents.edit`) is present in this capability's pack.

---

#### building_settings

- **`v1.org.settings.create`**: Required to create building settings `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.create|#1` ``. [Confirmed]
- **`v1.org.settings.view`**: Required to view resident settings `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.view|#1` ``. [Confirmed]
- **`v1.org.settings.edit`**: Required to update building settings `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.edit|#1` ``. [Confirmed]
- **`v1.org.settings.delete`**: Required to delete or reset building settings `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.delete|#1` ``. [Confirmed]

#### RBAC Cross-Check
All candidate permissions match the RBAC roles document exactly:
- `v1.org.settings.create` -> "Allows to create a new management rule" [Confirmed]
- `v1.org.settings.view` -> "Allows to view the details of a management rule" [Confirmed]
- `v1.org.settings.edit` -> "Allows to edit an existing management rule" [Confirmed]
- `v1.org.settings.delete` -> "Allows to delete a management rule" [Confirmed]

---

#### building_unit

This capability references the following permission strings to authorize administrative operations:

- **`v1.org.buildings.create`**: Checked when creating a building unit or unit door. [Confirmed]
- **`v1.org.buildings.edit`**: Checked when updating a building unit. [Confirmed]
- **`v1.org.buildings.view`**: Checked when retrieving building unit details. [Confirmed]
- *Citations*: `` `functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts` (line 46) ``, `` `functions/src/modules/building/modules/building_unit/services/building_unit.service.ts` (lines 135, 204, 287, 333) ``.

### RBAC Cross-Check
- `v1.org.buildings.create` matches the description "Allows to create a new building" in the RBAC roles document. [Confirmed]
- `v1.org.buildings.edit` matches the description "Allows to edit a building's information" in the RBAC roles document. [Confirmed]
- `v1.org.buildings.view` matches the description "Allows to view the details of a building" in the RBAC roles document. [Confirmed]

*Note*: The capability uses building-level permissions (`v1.org.buildings.*`) to authorize unit-level operations, indicating that unit management is treated as a subset of building administration. [Inferred]

#### building_unit_nonAppUser

### Security Decorators [Confirmed]
All primary service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` [Confirmed] (`functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts`):
- This decorator delegates authorization checks to the core security layer, ensuring that the caller has administrative rights over the target building/unit (e.g., is a ResidentAdmin or Property Manager) without requiring their user ID to match the Non-App User's ID (since Non-App Users do not have Auth0 accounts).

### RBAC Cross-Check [Confirmed]
- No explicit RBAC permission strings (e.g., `v1.org.residents.create`) are directly referenced in the code of this capability [Confirmed] (`functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts`). Instead, security is handled dynamically via the `@OSKUserSecurityChecks` decorator and parameter validation checks (`OSKSecurityChecks.checkParameters`).

---

#### building_user

### Permissions Referenced
- `v1.org.buildings.create` [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (line 49) ``]
- `v1.admin.building.register` [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (line 49) ``]

### RBAC Cross-Check
- `v1.org.buildings.create` is defined in `rbac-roles.json` as "Allows to create a new building".
- `v1.admin.building.register` is defined in `rbac-roles.json` as "v1.admin - Allows to register a new building".
- *Note*: The use of building creation/registration permissions to authorize the creation of a *building user* is a potential domain mismatch (one might expect a resident/user management permission instead, such as `v1.org.residents.create` or `v1.org.user.create`).

---

### 10. Cross-Module Relationships

Based on the deterministic AST import resolution and method-level call graphs, the `building` module maintains the following relationships:

#### Outbound Dependencies (This module depends on and calls)
- **`access_control_device`** [Confirmed]:
  - Imports `OSKAccessControlDeviceType` and `OSKAccessControlDevice`.
  - Calls `OSKAccessControlDeviceConfigController.save` and `deleteAll`.
  - Calls `OSKAccessControlDeviceController.assignBuildingDoor`, `get`, and `unassignBuildingDoor`.
- **`core`** [Confirmed]:
  - Inherits from `OSKDocumentController` and `OSKDocumentAndMessageController` for base CRUD, querying, and image handling.
  - Calls `OSKLoggingService.logError`, `logInfo`, and `logWarning`.
  - Calls `OSKSecretService.createPrivateKeySecret` and `getPrivateKey`.
  - Calls `OSKAccessUpdateService.removeDoorFromUserAccesses` and `updateUserAccessesDoorInfo`.
  - Calls `OSKAccessUtilsService.generateAccessId`, `getAccessInviterName`, and `getAccessControlDevicesPerDoor`.
  - Calls `OSKAccessMessagePublisherService.publishMessageToAllACDs`.
  - Calls `OSKAccessService.createAccess` and `deleteAccessById`.
  - Calls `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash`.
  - Calls `OSKAccessUpdateService.updateUserAccessesBuildingInfo`.
- **`organization`** [Confirmed]:
  - Imports `OSKOrganizationUserController`, `OSKOrganizationUserUtils`, `OSKWithOrganizationId`, `OSKOrganizationResidentDocument`, and `OSKOrganizationResidentsController`.
  - Calls `OSKOrganizationUserController.get`.
  - Calls `OSKOrganizationResidentsController.get` and `getResidentsQueryFilters`.
  - Calls `OSKOrganizationBuildingController.save` and `update`.
  - Calls `OSKPropertyController.get`, `removeBuildingFromProperty`, and `update`.
- **`settings`** [Confirmed]:
  - Imports `OSKConsolidatedRolesController` from `@oskey/settings/role`.
  - Calls `OSKConsolidatedRolesController.checkUserPermissions` and `checkUserPermissionsSafe`.
- **`user`** [Confirmed]:
  - Imports `OSKAccess` and `OSKUserDocument`.
  - Calls `OSKUserIntercomService.updateAllUserIntercomEntry`, `cleanUpUserIntercomsAfterInhabitantDeletion`, `createAndUpdateUsersIntercomEntry`, and `deleteUserIntercom`.
  - Calls `OSKUserController.get` and `getAll`.
  - Calls `OSKUserSettingsBuildingController.delete`, `get`, and `update`.
  - Calls `OSKUserSettingsBuildingService.createUserSettingsFromBuildingSettings`.
  - Calls `OSKUserSettingsUnitService.createUserSettingsUnitFromInhabitant`.

#### Inbound Dependencies (Other modules depend on and call this module)
- **`access_control_device`** [Confirmed]:
  - Calls `OSKBuildingAccessesController.get`.
  - Calls `OSKBuildingController.getSafe`.
  - Calls `OSKBuildingDoorController.getSafe`.
- **`admin`** [Confirmed]:
  - Calls `OSKBuildingAccessesController.deletePerUser`, `getAll`, and `update`.
  - Calls `OSKBuildingDoorController.getAllSafe`, `getAll`, and `getSafe`.
  - Calls `OSKBuildingIntercomController.getAllIntercomByBuilding`, `update`, and `delete`.
  - Calls `OSKBuildingController.getAll`, `get`, and `update`.
  - Calls `OSKBuildingSettingsController.get`, `set`, `updateBuildingSettings`, and `getDocumentId`.
  - Calls `OSKBuildingUnitController.get` and `getAll`.
  - Calls `OSKIntercomMessagePublisherService.publishMessageIntercomUpdate`.
  - Calls `OSKBuildingIntercomCallTransferListController.delete` and `getAll`.
  - Calls `OSKBuildingIntercomService.addInhabitantInAllIntercoms` and `createIntercomEntry`.
  - Calls `OSKBuildingUnitInhabitantController.getAll` and `queryInhabitants`.
  - Calls `OSKBuildingPincodeController.getAllByType`.
  - Calls `OSKBuildingUnitNonAppUserController.get`.
  - Calls `OSKNonAppUserAccessController.getPerBuildingSafe`.
  - Calls `OSKBuildingUnitInhabitantService.addInhabitant` and `removeInhabitant`.
- **`call`** [Confirmed]:
  - Calls `OSKBuildingDoorController.get`.
  - Calls `OSKBuildingIntercomCallTransferListController.get`.
- **`core`** [Confirmed]:
  - Calls `OSKBuildingAccessesController.getAll`, `get`, `update`, and `deletePerUser`.
  - Calls `OSKNonAppUserPincodeController.getByAccessId` and `delete`.
  - Calls `OSKBuildingController.get` and `getSafe`.
  - Calls `OSKBuildingPincodeController.get`, `delete`, and `getSafe`.
  - Calls `OSKBuildingPincodeTrashController.get`, `set`, `update`.
  - Calls `OSKBuildingDoorController.get` and `getAll`.
  - Calls `OSKBuildingPincodeService.createPincodeAnonymousDocument`, `createPincodeGuestDocument`, `createPincodeInhabitantDocument`, `createPincodePermanentGuestDocument`, and `createPincodeSupplierDocument`.
  - Calls `OSKBuildingUnitNonAppUserController.get` and `getSafe`.
  - Calls `OSKNonAppUserPincodeService.createPincodeDocument`.
  - Calls `OSKBuildingAccessService.createOrUpdateBuildingAccess` and `createOrUpdateBuildingAccessForStaffOrNonAppUser`.
  - Calls `OSKBuildingUnitInhabitantController.get` and `update`.
  - Calls `OSKNonAppUserAccessService.createOrUpdateNonAppUserAccess` and `setupNonAppUserAccess`.
  - Calls `OSKBuildingActivitiesService.ActivityReceivedForBuilding`.
  - Calls `OSKNonAppUserActivityAggregatesService.ActivityReceivedForNonAppUser`.
  - Calls `OSKNonAppUserActivityService.ActivityReceivedForNonAppUser`.
- **`organization`** [Confirmed]:
  - Calls `OSKBuildingDoorController.getSafe`, `getAll`, and `get`.
  - Calls `OSKBuildingUnitController.get`, `getAll`, and `deleteCollection`.
  - Calls `OSKBuildingUnitInhabitantService.addInhabitant` and `removeInhabitant`.
  - Calls `OSKBuildingUnitInvitationController.create`, `deleteInvitation`, `generateInvitationId`, and `queryInvitations`.
  - Calls `OSKBuildingController.get`, `getBuildingsQueryFilters`, `queryAllBuildings`, and `update`.
  - Calls `OSKBuildingUnitNonAppUserController.create`, `delete`, `generateDocId`, and `getAll`.
  - Calls `OSKBuildingAccessesController.deletePerUser`.
  - Calls `OSKBuildingIntercomService.deleteIntercomEntry` and `deleteIntercomEntryUser`.
  - Calls `OSKBuildingUnitInhabitantController.delete`, `get`, `getAll`, and `update`.
  - Calls `OSKBuildingUnitNonAppUserService._createNonAppUserAccess` and `_deleteAccessSideEffects`.
  - Calls `OSKBuildingUnitPermanentGuestController.delete` and `getAll`.
  - Calls `OSKNonAppUserAccessController.delete` and `getAll`.
  - Calls `OSKNonAppUserPincodeController.delete`, `get`, and `getByAccessId`.
- **`supplier`** [Confirmed]:
  - Calls `OSKBuildingController.getSafe` and `get`.
  - Calls `OSKBuildingAccessesController.deletePerUser`, `get`, and `update`.
  - Calls `OSKBuildingDoorController.get` and `getAll`.
- **`unit_management`** [Confirmed]:
  - Calls `OSKBuildingController.get` and `OSKBuildingUnitController.get`.
  - Calls `OSKBuildingIntercomService.deleteIntercomEntryUser`.
  - Calls `OSKBuildingUnitInhabitantController.delete`, `get`, `getUnitInhabitants`, `update`, and `getSafe`.
  - Calls `OSKBuildingUnitNonAppUserController.get` and `getAll`.
  - Calls `OSKBuildingUnitPermanentGuestController.getUnitPermanentGuests`, `create`, `get`, `update`, `delete`, and `getSafe`.
  - Calls `OSKNonAppUserPincodeController.getAll`.
  - Calls `OSKBuildingUnitInhabitantService.addInhabitant`.
- **`user`** [Confirmed]:
  - Calls `OSKBuildingController.getSafe`, `get`, and `getAll`.
  - Calls `OSKBuildingUnitInhabitantService.addInhabitant` and `removeInhabitant`.
  - Calls `OSKBuildingDoorController.getAllSafe` and `getSafe`.
  - Calls `OSKBuildingUnitController.get`.
  - Calls `OSKBuildingAccessesController.get` and `update`.
  - Calls `OSKBuildingUnitInhabitantController.get`, `queryInhabitants`, and `update`.
  - Calls `OSKBuildingUserController.get` and `update`.

### 11. External Hooks

#### _module_root

This capability interacts with the following external boundaries:

- **Google Cloud Storage**:
  - Uploads building images to a Cloud Storage bucket via `_uploadImage` `` `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._uploadImage|uploadImage|bucket,imagePath,contentType,'imageFilename'|#1` ``.
  - Deletes building images from Cloud Storage via `_deleteImage` `` `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._deleteImage|deleteImage|filePath,imagePath|#1` ``.

#### building_accesses

- No external hooks, Pub/Sub topics, or environment variables are directly evidenced within this capability's pack.

---

#### building_activity

- No external hooks, Pub/Sub topics, environment variables, or external storage paths are directly declared or referenced in this capability's evidence pack [Confirmed].

---

#### building_door

- **GCP Secret Manager**: Integrated via `OSKSecretService` to securely store the generated private keys for Access Control Devices `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|OSKSecretService.createPrivateKeySecret|generateKeys|accessControlDeviceId,privateKey|#1` ``.
- **Node.js Crypto Library**: Uses the native `crypto` module to generate EC prime256v1 key pairs `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|crypto.generateKeyPairSync|generateKeys|'ec',{             namedCurve: 'prime256v1',         }|#1` ``.

---

#### building_intercom

- **GCP Pub/Sub Topic**: Updates are published to the topic defined by `process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` to synchronize configurations with physical edge intercom hardware. `external_hook|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}|#1` [Confirmed]
- **Device ID Integration**: The physical device ID (`intercomDoc.accessControlDeviceId`) is used as the routing key/attribute for Pub/Sub messages. `external_hook|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts|intercomDoc.accessControlDeviceId|#1` [Confirmed]

#### building_pincode

No external hooks, Pub/Sub topics, environment variables, or external storage paths are evidenced within this capability's pack [Confirmed].

---

#### building_pincode_trash

- No external hooks, Pub/Sub topics, environment variables, or external storage paths are evidenced within this capability's pack (**Confirmed**).

---

#### building_settings

No external hooks (Pub/Sub, external HTTP, storage, environment variables) are directly evidenced in this capability's pack. [Confirmed]

---

#### building_unit

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or Cloud Storage paths) are directly evidenced within this capability's pack. [Confirmed]

#### building_unit_nonAppUser

- No external hooks, Pub/Sub topics, HTTP paths, environment variables, or storage paths are directly declared or referenced within this capability's pack [Confirmed] (`functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts`).
- *Note*: Decoupled synchronization to physical hardware is handled indirectly by calling `OSKAccessMessagePublisherService.publishMessageToAllACDs`, which publishes to the platform's central Pub/Sub backbone [Confirmed] (`functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts`).

---

#### building_user

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are evidenced within this capability's pack [Confirmed].

---

### 12. Architectural Observations

- **Separation of Concerns**: The module enforces a clean separation between physical hardware abstractions (`building_door`), logical residential boundaries (`building_unit`), and credentialing mechanisms (`building_pincode`, `building_unit_nonAppUser`) [Inferred].
- **High Intra-Module Coupling**: The AST import resolution graph reveals extremely high coupling, with almost all submodules depending on `_module_root` and `building_door` [Confirmed]. This reflects the central role of the building and door concepts in validating any access request [Inferred].
- **Asynchronous Edge Projection**: The module relies on Firestore dual-writes and collection-level triggers to project access permissions downstream [Inferred]. It does not directly manage hardware connections, decoupling business logic from edge device availability [Inferred].
- **Denormalization (Paired Document Pattern)**: The module heavily utilizes denormalization, particularly in `building_accesses` and `building_intercom`, where user-scoped and building-scoped views of the same data are maintained to optimize read paths for both mobile clients and edge hardware [Inferred].

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **RBAC Schema Mismatch**: The permission string `v1.org.buildings.createManager` is referenced in `building_door.service.ts` [Confirmed] but is completely missing from the master `rbac-roles.json` schema [Confirmed].
- **Domain Permission Mismatch**: `building_user` checks for building creation/registration permissions (`v1.org.buildings.create` and `v1.admin.building.register`) to authorize creating a building-user association [Confirmed]. This is a domain mismatch, as building creation permissions are used to guard user-onboarding operations instead of user/resident management permissions (e.g., `v1.org.residents.create`) [Inferred].
- **Security Enforcement Asymmetry**: Highly sensitive credential-management submodules (`building_pincode`, `building_pincode_trash`, and `building_unit_nonAppUser`) do not enforce explicit granular RBAC permission strings in their service layers [Inferred]. They rely on generic `@OSKUserSecurityChecks({ checkUserIdMatch: false })` [Confirmed]. In contrast, less sensitive submodules like `building_settings` enforce strict, granular RBAC permissions (e.g., `v1.org.settings.edit`) [Confirmed]. This creates an inconsistent security posture across the module [Inferred].
- **Unattributed Security-Relevant Signals**:
  - `building_unit_nonAppUser` raises 2 parameter validation/permission errors with no RBAC string backing them [Inferred].
  - `building_activity` raises 2 parameter validation errors with no RBAC string backing them [Inferred].
  - `building_intercom` contains 2 methods (`updateIntercomDisplayName` and `onUpdateBuildingIntercomsTransferList`) that bypass strict user-document matching but lack explicit RBAC permission checks [Inferred].

**Per-capability open questions:**

#### _module_root

- **Cloud Storage Bucket Resolution**: How is the Cloud Storage bucket name resolved dynamically? The code shows `bucket` passed as a parameter to `uploadImage` but does not expose its configuration source within this capability pack.
- **Image Cleanup on Deletion**: When a building is deleted, does the system automatically trigger a background cleanup task to delete its associated images in Cloud Storage, or is this handled manually?

#### building_accesses

- **Hardware Synchronization**: The architecture document states that "every grant or revocation synchronizes to physical hardware asynchronously via Pub/Sub." However, there are no Pub/Sub publish calls or external hooks evidenced in this specific capability pack. How does the write to `/buildings/{buildingId}/accesses` trigger the downstream Pub/Sub sync? Is it handled by a Firestore trigger in another capability (e.g., a shared database trigger capability)?
- **RBAC Enforcement**: Does `OSKBuildingAccessesController` rely entirely on Firestore rules for security, or does the base `OSKDocumentController` dynamically resolve and enforce RBAC permissions (such as `v1.admin.user.accesses.create`) based on the collection path?

#### building_activity

- **Triggering Mechanism**: How is `ActivityReceivedForBuilding` invoked? The evidence pack shows the service method exists to save activities, but the direct caller (e.g., a Pub/Sub subscriber or an HTTP webhook) is not present in this capability's facts [Unknown].
- **Exact Collection Path**: What is the exact string structure of the collection path returned by `OSKBuildingActivitiesController.getCollectionPath`? While it is inferred to be nested under buildings and doors, the exact path template is encapsulated in the controller [Unknown].

#### building_door

1. **RBAC Mismatch**: Why is `v1.org.buildings.createManager` referenced in `building_door.service.ts` when it is not defined in the master RBAC roles document? Is this a legacy permission or a pending feature?
2. **Missing API Schemas**: The request/response schemas for `organizationUserGetAllBuildingDoors` and `organizationUserGetBuildingDoorById` are not listed in the resolved API schemas. What are their exact types?
3. **Hardware Synchronization**: When a door is deleted, does the system publish a Pub/Sub message to notify the physical hardware, or is the hardware synchronization entirely handled implicitly via the `OSKAccessUpdateService`?

#### building_intercom

- How are the WebRTC signaling servers and STUN/TURN/ICE configurations negotiated? The models contain `webRTC.contactId` and `iceServers` properties, but the actual signaling logic is not present in this submodule. [Inferred]
- Are there specific RBAC permissions required for `updateIntercomDisplayName` and `onUpdateBuildingIntercomsTransferList`? The code uses `OSKUserSecurityChecks` with `checkUserIdMatch: false` but does not explicitly check a specific RBAC permission string in the provided evidence. [Inferred]

#### building_pincode

- **ACD Synchronization**: How are the generated PIN codes synchronized to the physical Access Control Devices (ACDs)? The architecture document mentions delta synchronization via Pub/Sub and MongoDB, but the direct trigger or integration point is not evidenced in this submodule's code [Unknown].
- **RBAC Enforcement**: Are the controller endpoints protected by specific RBAC permissions (e.g., `v1.admin.user.accesses.create`), or is authorization handled implicitly by the base `OSKDocumentController` or Firebase Security Rules? [Unknown].

#### building_pincode_trash

- **Exact Collection Path**: What is the exact string format returned by `getCollectionPath`? (e.g., is it explicitly `/buildings/{buildingId}/pincodes_trash` or does it use a different naming convention?)
- **Trash Status States**: What are the allowed string/enum values for `OSKPincodeTrashStatus`?
- **Cleanup Mechanism**: Is there an active background worker, Cloud Scheduler task, or TTL policy that automatically deletes documents once they pass their `expirationDate`?

#### building_settings

- **User Settings Propagation**: The exact mechanism of how `OSKUserSettingsBuildingController` propagates changes to individual users is handled in the `user` module, which is outside the scope of this capability's evidence. [Inferred]

#### building_unit

- Why are building-level permissions (`v1.org.buildings.create`, `v1.org.buildings.edit`, `v1.org.buildings.view`) used for unit-level operations instead of unit-specific permissions? [Inferred]
- What is the exact schema of `OSKBuildingUnitInhabitantInvitation` and how is it processed? (The API contracts do not list invitation endpoints directly, though the controller exists). [Unknown]
- How does the `building_unit_nonAppUser` submodule integrate with `building_unit` beyond the index trigger registration? [Unknown]

#### building_unit_nonAppUser

1. **Manual Pincode Delivery**: Since Non-App Users do not have the mobile application, how are newly generated pincodes communicated to them? Is there an offline/manual handover process managed by the inviter, or is there an unevidenced notification channel (like SMS to the inviter) used? [Inferred: Handed over manually by the inviter/ResidentAdmin].
2. **Security Decorator Internals**: What specific roles are validated by `@OSKUserSecurityChecks({ checkUserIdMatch: false })` when executed within the context of a nested unit subcollection? Does it automatically verify if the caller is a `ResidentAdmin` of the parent unit? [Unknown].

#### building_user

- Why does `createBuildingUser` check for building creation permissions (`v1.org.buildings.create` / `v1.admin.building.register`) rather than user/resident management permissions? [Inferred permission mismatch]
- What is the exact response schema returned by the `createBuildingUser` callable function? [Missing evidence]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.