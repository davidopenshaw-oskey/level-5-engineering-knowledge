### 0. Generation Metadata

- **runId**: `20260827_163338-1aa319b1`
- **generatedAt**: `2026-08-28T07:47:23.458Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `building`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `building` module is the core physical anchoring domain of the Oskey Access Platform. It manages the lifecycle, configurations, and security parameters of physical building structures, individual units (apartments/offices), doors, and intercom directories (**Confirmed**). 

Crucially, the module serves as the physical integration point for edge Access Control Devices (ACDs), orchestrating the provisioning of cryptographic keys, offline PIN code validation caches, and WebRTC/SIP call-routing transfer lists (**Confirmed**). It also implements the building-centric side of the platform's denormalized dual-write access ledger (the Paired Document Pattern), tracking real-time access permissions and activity logs for residents, co-inhabitants, permanent guests, suppliers, and non-app users (**Confirmed**).

### 2. Architectural Position

The `building` module occupies a critical mid-tier position in the platform's hierarchical authority model, situated below the global Organization, Entity, and Property scopes, and acting as the direct parent scope for Units, Doors, and Intercoms (**Confirmed**). 

It provides the physical context required by other modules:
- **Hardware Integration**: Maps physical doors to edge ACDs managed by the `access_control_device` module (**Confirmed**).
- **Access Control**: Translates user identities from the `user` module into building-scoped and unit-scoped access permissions (**Confirmed**).
- **Communication**: Resolves directory selections on physical intercoms into real-time WebRTC/SIP call routing lists consumed by the `call` module (**Confirmed**).
- **Administrative Operations**: Exposes sandboxed building-level management interfaces consumed by the `admin` and `organization` modules (**Confirmed**).

### 3. Primary Responsibilities

#### _module_root

- **Creating Organization Buildings**: Handles the creation of a building document, registers it under an organization, links it to a property, and provisions default building settings. (**Confirmed** - `` `api_contract|building|functions/src/modules/building/index.ts|createOrganizationBuilding|#1` ``, `` `call_expression|building|functions/src/modules/building/services/building.service.ts|Promise.all|createOrganizationBuilding|[                 OSKBuildingController.default.save(buildingId, building),                 OSKOrganizationBuildingController.default.save(organizationId, buildingId, organizationBuilding),                 OSKPropertyController.default.update(propertyId, {                     buildings: FieldValue.arrayUnion(building),                 }),             ]|#1` ``)
- **Updating Building Information**: Updates core building details (such as name and street address), synchronizes the name change to the organization-building mapping, and triggers updates to user accesses if the street address has changed. (**Confirmed** - `` `api_contract|building|functions/src/modules/building/index.ts|updateBuilding|#1` ``, `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKAccessUpdateService.updateUserAccessesBuildingInfo|updateBuilding|request.buildingId,buildingInfo|#1` ``)
- **Assigning Buildings to Properties**: Re-associates a building with a new property by updating the building's property reference, adding it to the new property's building list, and removing it from the old property's building list. (**Confirmed** - `` `api_contract|building|functions/src/modules/building/index.ts|assigningBuildingToProperty|#1` ``, `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKPropertyController.default.removeBuildingFromProperty|assigningBuildingToProperty|oldProperty.propertyId!,'buildings','buildingId',buildingId|#1` ``)
- **Retrieving Buildings**: Supports fetching all buildings, retrieving a building by ID (including door and unit counts), and listing buildings by property ID with optional filtering by access control device type. (**Confirmed** - `` `api_contract|building|functions/src/modules/building/index.ts|getAllBuildings|#1` ``, `` `api_contract|building|functions/src/modules/building/index.ts|getBuildingById|#1` ``, `` `api_contract|building|functions/src/modules/building/index.ts|getBuildingsByPropertyId|#1` ``)
- **Managing Building Images**: Handles uploading and deleting building images stored in Google Cloud Storage, updating the corresponding building document's `imageFilename` field. (**Confirmed** - `` `api_contract|building|functions/src/modules/building/index.ts|deleteBuildingImage|#1` ``, `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingController.default.uploadImage|uploadImage|bucket,imagePath,contentType|#1` ``)
- **Deleting Buildings**: Deletes a building and its associated settings, enforcing a precondition that no doors or units remain assigned to the building before deletion can proceed. (**Confirmed** - `` `service_method|building|functions/src/modules/building/services/building.service.ts|OSKBuildingService|deleteBuilding|#1` ``)

#### building_accesses

The `building_accesses` capability is responsible for the following distinct features:

- **Managing Building-Centric Access Ledgers**: Persisting and updating access permissions for users at the building level under the `/buildings/{buildingId}/accesses/{userId}` path, mirroring the user-centric accesses stored under `/users/{userId}/accesses` as part of the Paired Document Pattern described in the system architecture.
- **Standard Access Provisioning**: Appending new access permissions to a standard user's building access document using Firestore's `FieldValue.arrayUnion` via `OSKBuildingAccessService.createOrUpdateBuildingAccess` `` `service_method|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService|createOrUpdateBuildingAccess|#1` ``.
- **Staff and Non-App User Access Provisioning**: Appending new access permissions to a staff member's or non-app user's building access document using Firestore's `FieldValue.arrayUnion` via `OSKBuildingAccessService.createOrUpdateBuildingAccessForStaffOrNonAppUser` `` `service_method|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService|createOrUpdateBuildingAccessForStaffOrNonAppUser|#1` ``.
- **Document Controller Operations**: Exposing standard CRUD-like operations (`get`, `getAll`, `save`, `create`, `update`, `deletePerUser`, `deleteAll`, `listDocuments`) by extending `OSKDocumentController` inside `OSKBuildingAccessesController` `` `source_class|building|functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts|OSKBuildingAccessesController` ``.

**Confidence: Confirmed**

---

#### building_activity

### Activity Ingestion and Enrichment
- Receives raw IoT activity payloads from edge devices via `ActivityReceivedForBuilding` [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService|ActivityReceivedForBuilding|#1` ``.
- Enriches the raw payload with building and door context using the `access_control_device_activity_enrichment.service` [Confirmed] `` `imports_dependency|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|../../../../access_control_device/services/access_control_device_activity_enrichment.service|#1` ``.
- Persists the enriched activity document to Firestore [Confirmed] `` `call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesController.default.save|ActivityReceivedForBuilding|enrichedData.building.buildingId,enrichedData.door.doorId,activity.activityId,activityDocument|#1` ``.

### Activity Retrieval
- Retrieves a single activity record by its unique ID for a specific building and door [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService|getActivityById|#1` ``.
- Lists all activity logs associated with a specific building and door [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService|getAllBuildingActivities|#1` ``.

### Activity Deletion
- Deletes a specific activity log by its ID [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService|deleteBuildingActivityById|#1` ``.
- Purges all activity logs for a given building and door [Confirmed] `` `service_method|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService|deleteAllBuildingActivities|#1` ``.

### Security and Parameter Validation
- Validates incoming request parameters (such as `buildingId`, `doorId`, and `activityId`) to ensure they are well-formed [Confirmed] `` `call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKSecurityChecks.checkParameters|getActivityById|[             { name: 'context', value: context, type: 'object' },             { name: 'buildingId', value: request.buildingId, type: 'string' },             { name: 'doorId', value: request.doorId, type: 'string' },             { name: 'activityId', value: request.activityId, type: 'string' },         ]|#1` ``.
- Enforces user security checks on all callable entry points using the `@OSKUserSecurityChecks` decorator [Confirmed] `` `call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKUserSecurityChecks|getActivityById|{ checkUserIdMatch: false }|#1` ``.

---

#### building_door

- **Door Lifecycle Management**: Provides administrative endpoints to create, update, retrieve, and delete building doors [Confirmed] (`` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserCreateBuildingDoor|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserUpdateBuildingDoor|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|deleteBuildingDoor|#1` ``).
- **Access Control Device (ACD) Assignment Triggers**: Listens to Firestore document creation and deletion events on the subcollection path `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` to automatically assign or unassign the physical device [Confirmed] (`` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentCreated|#1` ``, `` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentDeleted|#1` ``).
- **Cryptographic Key Generation**: Generates elliptic curve (`prime256v1`) public/private key pairs for newly assigned ACDs, securely persisting the private key via GCP Secret Manager and storing the public key in Firestore [Confirmed] (`` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|crypto.generateKeyPairSync|generateKeys|'ec',{             namedCurve: 'prime256v1',         }|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|OSKSecretService.createPrivateKeySecret|generateKeys|accessControlDeviceId,privateKey|#1` ``).
- **Intercom Entry Provisioning**: Automatically triggers the creation of intercom entries when an ACD is assigned to a door [Confirmed] (`` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKBuildingIntercomService.createIntercomEntry|onDocumentCreated|deviceId,buildingId,doorId|#1` ``).
- **User Access Synchronization**: Ensures that when a door is deleted, it is removed from all user accesses, and when a door's details (such as name or address) are updated, those changes cascade to user access records [Confirmed] (`` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKAccessUpdateService.removeDoorFromUserAccesses|deleteBuildingDoor|request.doorId,request.buildingId|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKAccessUpdateService.updateUserAccessesDoorInfo|organizationUserUpdateBuildingDoor|oldBuildingDoor,doorInfo|#1` ``).

#### building_intercom

### Intercom Entry Management
- **Creating Intercom Entries**: Handles the initial creation of intercom entries for building units and inhabitants [Confirmed] (`functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 52-70)).
- **Adding Inhabitants**: Orchestrates adding inhabitants to units within intercoms, updating the master building intercom document and denormalized user views [Confirmed] (`` `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingIntercomService|addInhabitantInIntercom|#1` ``).
- **Deleting Inhabitants**: Cleans up intercom entries when inhabitants are deleted, removing the unit entry entirely if no tenant inhabitants remain [Confirmed] (`` `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingIntercomService|deleteIntercomEntryUser|#1` ``).

### Display Name Customization
- **Updating Display Names**: Allows updating the display name for a unit's intercom entry, marking it as manually changed [Confirmed] (`` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|updateIntercomDisplayName|#1` ``).
- **Deleting Custom Display Names**: Deletes custom display names and reverts them to system-generated defaults [Confirmed] (`` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|deleteIntercomDisplayName|#1` ``).
- **Automatic Default Generation**: Automatically generates default display names by joining uppercase tenant last names with " - " [Confirmed] (`` `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingIntercomService|createIntercomDisplayName|#1` ``).

### Call Transfer List Management
- **Routing Sequences**: Manages the sequence of call recipients (`callTransferList`) for WebRTC/SIP calls [Confirmed] (`` `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKBuildingIntercomCallTransferListService|onUpdateBuildingIntercomsTransferList|#1` ``).
- **Sequence Number Conversion**: Converts ordered lists of recipients into sequence-numbered items [Confirmed] (`` `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKBuildingIntercomCallTransferListService|convertCallTransferListFromOrderedToSequenceNumber|#1` ``).
- **Validation**: Validates call transfer lists against current unit inhabitants to prune stale or deleted users [Confirmed] (`` `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKBuildingIntercomCallTransferListService|checkCallTransferList|#1` ``).

### Hardware Synchronization
- **Pub/Sub Delta Delivery**: Decouples business logic from hardware by publishing delta updates (`OSKBuildingIntercomPubsubMessage`) to GCP Pub/Sub when intercom entries are created, updated, or deleted [Confirmed] (`` `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts|OSKIntercomMessagePublisherService|publishMessageIntercomUpdate|#1` ``).

---

#### building_pincode

### Creating Typed PIN Code Documents
The capability provides specialized service methods to construct and persist PIN code documents for different personas:
- **Inhabitants**: `createPincodeInhabitantDocument` creates a PIN code document of type `inhabitant` bound to a specific unit and user [Confirmed] (citing `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeInhabitantDocument|#1` ``).
- **Guests**: `createPincodeGuestDocument` creates a PIN code document of type `guest` containing inviter and invited identifiers [Confirmed] (citing `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeGuestDocument|#1` ``).
- **Permanent Guests**: `createPincodePermanentGuestDocument` creates a PIN code document of type `permanentGuest` containing inviter and invited identifiers [Confirmed] (citing `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodePermanentGuestDocument|#1` ``).
- **Anonymous/Quickcode Recipients**: `createPincodeAnonymousDocument` creates a PIN code document of type `anonymous` bound to a specific unit [Confirmed] (citing `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeAnonymousDocument|#1` ``).
- **Suppliers**: `createPincodeSupplierDocument` creates a PIN code document of type `supplier` [Confirmed] (citing `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeSupplierDocument|#1` ``).

### CRUD Operations on Firestore
The controller exposes endpoints to manage the lifecycle of PIN code documents:
- **Set**: Persists a PIN code document to the database [Confirmed] (citing `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|set|#1` ``).
- **Get / GetSafe**: Retrieves a specific PIN code document by its ID [Confirmed] (citing `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|get|#1` `` and `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getSafe|#1` ``).
- **GetAll**: Retrieves all PIN codes for a building [Confirmed] (citing `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getAll|#1` ``).
- **GetAllByType**: Filters PIN codes for a building by their type [Confirmed] (citing `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getAllByType|#1` ``).
- **GetByAccessId**: Queries PIN codes matching a specific access ID [Confirmed] (citing `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getByAccessId|#1` ``).
- **Delete**: Removes a PIN code document from the database [Confirmed] (citing `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|delete|#1` ``).

### PIN Code Type Validation
Helper functions validate whether a PIN code is associated with an inhabitant:
- `isPincodeTypeInhabitant`: Validates a single PIN code type [Confirmed] (citing `` `function_declaration|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|isPincodeTypeInhabitant|#1` ``).
- `arePincodeTypeInhabitant`: Validates an array of PIN code documents to ensure all are inhabitant-related [Confirmed] (citing `` `function_declaration|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|arePincodeTypeInhabitant|#1` ``).

---

#### building_pincode_trash

- **Trash Lifecycle Management**: Provides standard CRUD-like operations for pincodes in the trash state, including `set`, `get`, `getAll`, `update`, and `delete` [Confirmed; `` `functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts` (lines 18-61) ``].
- **Safe Document Access**: Implements safe retrieval wrappers (`getSafe` and `getAllSafe`) to enforce security boundaries when querying trashed pincodes [Confirmed; `` `functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts` (lines 28-35, 42-51) ``].
- **Data Modeling**: Defines the structure of a trashed pincode document (`OSKBuildingPincodeTrashDocument`), tracking its status, last status update, and expiration date [Confirmed; `` `functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts` (lines 11-16) ``].

---

#### building_settings

The capability provides administrative management of building-level settings through the following features:

- **Create Building Settings**: Initializes a building's configuration document with default parameters or custom input parameters `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|createBuildingSettings|#1` ``. [Confirmed]
- **Update Building Settings**: Modifies existing building settings and propagates updates to associated user-level building configurations `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|updateBuildingSettings|#1` ``. [Confirmed]
- **Retrieve Resident Settings**: Fetches the active settings configuration for a building `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|getResidentSettings|#1` ``. [Confirmed]
- **Delete Building Settings**: Removes a building's settings document and cleans up associated user-level building configurations `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|deleteBuildingSettings|#1` ``. [Confirmed]
- **Reset Building Settings**: Reverts a building's settings back to default parameters `` `service_method|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService|resetBuildingSettings|#1` ``. [Confirmed]
- **Default Data Generation**: Generates default settings payloads, dynamically mapping all existing building doors to the permitted invitation doors list `` `function_declaration|building|functions/src/modules/building/modules/building_settings/data/building_settings_default_data.ts|getBuildingSettingsDefaultDocumentData|#1` ``. [Confirmed]

#### building_unit

### Building Unit Lifecycle Management
- **Creation and Updates**: Allows organization users to create and update building units (`OSKBuildingUnit`) with specific details such as name, floor, unit number, capacity, and street address `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserCreateBuildingUnit|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserUpdateBuildingUnit|#1` ``. [Confirmed]
- **Deletion**: Handles the deletion of building units, which triggers notifications to affected users `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|deleteBuildingUnit|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|OSKBuildingUnitService.logger.logInfo|deleteBuildingUnit|`Sending user with id: ${user.userId} a unit removed email.`,{ userId: user.userId, userEmail: user.email }|#1` ``. [Confirmed]

### Unit Door Management
- **Door Provisioning**: Creates and registers doors associated with specific units (`OSKBuildingUnitDoor`) `` `service_method|building|functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts|OSKBuildingUnitDoorService|createBuildingUnitDoor|#1` ``. [Confirmed]
- **Access Propagation**: Automatically grants permanent access to all existing unit inhabitants when a new unit door is provisioned `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts|inhabitants.forEach|createBuildingUnitDoor|async (inhabitant) => { ... }|#1` ``. [Confirmed]

### Unit Inhabitant Management
- **Onboarding (Add Inhabitant)**: Orchestrates the onboarding of inhabitants (tenants or residents) to a unit. This process creates the inhabitant document, provisions their physical door access, configures their building and unit settings, and registers them in the building's intercom directories `` `service_method|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingUnitInhabitantService|addInhabitant|#1` ``. [Confirmed]
- **Offboarding (Remove Inhabitant)**: Revokes access rights, deletes the inhabitant document, and removes the user from all intercom directory entries `` `service_method|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingUnitInhabitantService|removeInhabitant|#1` ``. [Confirmed]

### Permanent Guest Management
- **Long-Term Access**: Manages long-term recurring guests (`OSKBuildingUnitPermanentGuest`) associated with a unit, allowing them to be created, updated, retrieved, and deleted `` `controller_method|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts|OSKBuildingUnitPermanentGuestController|create|#1` ``, `` `controller_method|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts|OSKBuildingUnitPermanentGuestController|delete|#1` ``. [Confirmed]

### Inhabitant Invitations
- **Prospective Inhabitants**: Manages invitations sent to prospective inhabitants (`OSKBuildingUnitInhabitantInvitation`), allowing unit administrators to invite new residents to join the unit `` `controller_method|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts|OSKBuildingUnitInvitationController|addInvitation|#1` ``. [Confirmed]

#### building_unit_nonAppUser

- **Non-App User Lifecycle Management**: Creating, retrieving, updating, and deleting non-app users within a unit. This is handled by the `OSKBuildingUnitNonAppUserService` and `OSKBuildingUnitNonAppUserController` which manage the creation and deletion of the user documents `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|createNonAppUser|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|deleteNonAppUser|#1` ``, and `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|updateNonAppUser|#1` ``.
- **Access Provisioning & Door Assignment**: Creating and updating access rights (e.g., permanent access) and assigning specific authorized doors to non-app users `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|createNonAppUserAccess|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|updateNonAppUserAccessDoors|#1` ``.
- **PIN Code Generation & Management**: Generating offline alphanumeric PIN codes for non-app users and managing their lifecycle (including deletion and moving to trash) `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|createNonAppUserWithAccess|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|_deleteAccessSideEffects|pincodeId,buildingId|#1` ``.
- **Activity Log & Aggregate Tracking**: Ingesting and enriching offline door access events triggered by non-app users, maintaining individual activity logs and 30-day rolling activity aggregates `` `service_method|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity.service.ts|OSKNonAppUserActivityService|ActivityReceivedForNonAppUser|#1` ``, `` `service_method|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity_aggregates.service.ts|OSKNonAppUserActivityAggregatesService|ActivityReceivedForNonAppUser|#1` ``.
- **Edge Synchronization**: Decoupling access state changes by publishing updates asynchronously to edge Access Control Devices (ACDs) via Pub/Sub `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|updateNonAppUserAccessDoors|nonAppUserId,buildingId,{                 operation: OSKAccessMessageOperation.Update,                 accessId: updatedAccess.accessId,                 accessRights: updatedAccess.accessRights,                 creationDate: updatedAccess.creationDate,                 isMainAccess: updatedAccess.isMainAccess,             },newAuthorizedDoors,{ category: 'nonAppUser', buildingId, unitId }|#1` ``.

---

#### building_user

- **Creating Building Users**: Orchestrates the creation of a building user record. It validates permissions, checks App Check, retrieves the user and building, provisions access rights via `OSKAccessService.createAccess`, and saves the building user record. (Confirmed, `` `service_method|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKBuildingUserService|createBuildingUser|#1` ``)
- **Managing Building User Documents**: Provides CRUD operations (get, getAll, save, update, delete, deleteAll, listDocuments) on building-scoped user documents under `/buildings/{buildingId}/users/{userId}`. (Confirmed, `` `source_class|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|OSKBuildingUserController` ``)
- **Handling Document Deletion Cleanup**: Cleans up associated accesses when a building user document is deleted by calling `deletePerUser` on `OSKBuildingAccessesController` and `deleteAllUserAccesses` on `OSKUserAccessesController`. (Confirmed, `` `service_method|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKBuildingUserService|onDocumentDeleted|#1` ``)

### 4. Public Interfaces

#### _module_root

- **OSKBuildingController**: Extends `OSKDocumentController` to provide standardized CRUD operations and image management for building documents. (**Confirmed** - `` `functions/src/modules/building/controllers/building.controller.ts` (lines 12-73) ``)
- **OSKBuildingService**: The core service orchestrating business logic, security checks, and cross-module updates for building operations. (**Confirmed** - `` `functions/src/modules/building/services/building.service.ts` (lines 47-601) ``)
- **getCallableFunctionTriggers**: Exposes the HTTPS callable Cloud Functions for client applications and the Property Manager Portal (PGO). (**Confirmed** - `` `functions/src/modules/building/index.ts` (lines 45-63) ``)
- **getFirestoreTriggers**: Exposes Firestore triggers for the building module (delegated to submodules). (**Confirmed** - `` `functions/src/modules/building/index.ts` (lines 39-44) ``)

#### building_accesses

This capability exposes the following public entry points and services:

### Controllers
- **`OSKBuildingAccessesController`** `` `source_class|building|functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts|OSKBuildingAccessesController` ``:
  - Extends `OSKDocumentController` `` `source_class|building|functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts|OSKBuildingAccessesController` ``.
  - Exposes methods to retrieve, save, update, and delete building access documents:
    - `get(buildingId, userId)`: Retrieves a specific user's building access document `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 18-32) ``.
    - `getAll(buildingId)`: Retrieves all building access documents for a building `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 34-37) ``.
    - `save(buildingId, userId, data)`: Saves a building access document `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 49-52) ``.
    - `create(buildingId, userId, data)`: Creates a building access document `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 54-57) ``.
    - `update(buildingId, userId, data)`: Updates a building access document `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 59-62) ``.
    - `deletePerUser(buildingId, userId)`: Deletes a specific user's building access document `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 64-67) ``.
    - `deleteAll(buildingId)`: Deletes all building access documents for a building `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 69-72) ``.
    - `listDocuments(buildingId)`: Lists building access documents `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 74-77) ``.

### Services
- **`OSKBuildingAccessService`** `` `source_class|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService` ``:
  - `createOrUpdateBuildingAccess(buildingId, userId, user, newAccess)`: Orchestrates the creation or update of a standard user's building access document, appending the new access to the `accesses` array `` `functions/src/modules/building/modules/building_accesses/services/building_access.service.ts` (lines 16-41) ``.
  - `createOrUpdateBuildingAccessForStaffOrNonAppUser(buildingId, memberId, member, newAccess)`: Orchestrates the creation or update of a staff member's or non-app user's building access document, appending the new access to the `accesses` array `` `functions/src/modules/building/modules/building_accesses/services/building_access.service.ts` (lines 43-65) ``.

**Confidence: Confirmed**

---

#### building_activity

### Controllers
- **`OSKBuildingActivitiesController`**: Inherits from `OSKDocumentAndMessageController` and provides low-level Firestore document operations (get, query, save, delete) mapped to the activity collection path [Confirmed] `` `source_class|building|functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts|OSKBuildingActivitiesController` ``.

### Services
- **`OSKBuildingActivitiesService`**: Orchestrates the business logic for receiving, retrieving, and deleting building activities [Confirmed] `` `source_class|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKBuildingActivitiesService` ``.

### Entry Points (Callable Cloud Functions)
The capability exposes four callable Cloud Functions via `getCallableFunctionTriggers` [Confirmed] `functions/src/modules/building/modules/building_activity/index.ts` (lines 38-46):
- `getActivityById`
- `getAllBuildingActivities`
- `deleteBuildingActivityById`
- `deleteAllBuildingActivities`

---

#### building_door

- **OSKBuildingDoorController** (`functions/src/modules/building/modules/building_door/controllers/building_door.controller.ts`): Extends `OSKDocumentController` to manage Firestore documents under `/buildings/{buildingId}/doors` [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_door/controllers/building_door.controller.ts|OSKBuildingDoorController` ``).
- **OSKBuildingDoorAccessControlDeviceController** (`functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device.controller.ts`): Extends `OSKDocumentController` to manage Firestore documents under `/buildings/{buildingId}/doors/{doorId}/accessControlDevices` [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device.controller.ts|OSKBuildingDoorAccessControlDeviceController` ``).
- **OSKBuildingDoorAccessControlDeviceKeysController** (`functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts`): Exposes methods to generate, retrieve, and delete cryptographic keys for assigned ACDs [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|OSKBuildingDoorAccessControlDeviceKeysController` ``).
- **OSKBuildingDoorService** (`functions/src/modules/building/modules/building_door/services/building_door.service.ts`): Orchestrates business logic and permission checks for callable API endpoints [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKBuildingDoorService` ``).
- **OSKBuildingDoorAccessControlDeviceService** (`functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts`): Handles background triggers for ACD lifecycle events [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKBuildingDoorAccessControlDeviceService` ``).

#### building_intercom

### Controllers
- **`OSKBuildingIntercomController`**: Extends `OSKDocumentAndMessageController`. Exposes CRUD operations and messaging capabilities for building intercom documents [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|OSKBuildingIntercomController` ``).
- **`OSKBuildingIntercomCallTransferListController`**: Extends `OSKDocumentController`. Exposes CRUD operations for call transfer lists [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom_calltransferlist.controller.ts|OSKBuildingIntercomCallTransferListController` ``).

### Services
- **`OSKBuildingIntercomCallTransferListService`**: Orchestrates call transfer list updates, sequence numbering, and validation [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKBuildingIntercomCallTransferListService` ``).
- **`OSKBuildingIntercomService`**: Orchestrates inhabitant intercom entry creation, deletion, and display name updates [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingIntercomService` ``).
- **`OSKIntercomMessagePublisherService`**: Formats and publishes Pub/Sub messages to synchronize intercom state with physical hardware [Confirmed] (`` `source_class|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts|OSKIntercomMessagePublisherService` ``).

---

#### building_pincode

### Controllers
- **`OSKBuildingPincodeController`**: Extends `OSKDocumentController` and exposes endpoints for CRUD operations on building PIN codes [Confirmed] (citing `` `source_class|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController` ``).

### Services
- **`OSKBuildingPincodeService`**: Orchestrates the creation of typed PIN code documents [Confirmed] (citing `` `source_class|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService` ``).

### Exported Entry Points
The capability exports its controllers, services, and models via its root index file [Confirmed] (citing `functions/src/modules/building/modules/building_pincode/index.ts` (lines 9-19)):
- `./controllers/building_pincode.controller` `` `exported_symbol|building|functions/src/modules/building/modules/building_pincode/index.ts|./controllers/building_pincode.controller|#1` ``
- `./services/building_pincode.service` `` `exported_symbol|building|functions/src/modules/building/modules/building_pincode/index.ts|./services/building_pincode.service|#1` ``
- `./models/documents/building_pincode_document.model` `` `exported_symbol|building|functions/src/modules/building/modules/building_pincode/index.ts|./models/documents/building_pincode_document.model|#1` ``

---

#### building_pincode_trash

This capability exposes the following controllers and services:
- **`OSKBuildingPincodeTrashController`**: Extends `OSKDocumentController` to handle Firestore document operations for trashed pincodes [Confirmed; `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController` ``].
- **`OSKBuildingPincodeTrashService`**: A service class encapsulating business logic for pincode trash management [Confirmed; `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/services/building_pincode_trash.service.ts|OSKBuildingPincodeTrashService` ``].

---

#### building_settings

The capability exposes its functionality through the following public components:

- **OSKBuildingSettingsController** `` `source_class|building|functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts|OSKBuildingSettingsController` ``: Extends `OSKDocumentController` to handle direct Firestore document operations (get, set, update, delete) for the building settings collection. [Confirmed]
- **OSKBuildingSettingsService** `` `source_class|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|OSKBuildingSettingsService` ``: Orchestrates the business logic, executes RBAC permission checks, validates parameters, and coordinates with external submodules (such as user settings). [Confirmed]

#### building_unit

The capability exposes the following controllers and services as public entry points:

### Controllers
- **`OSKBuildingUnitController`**: Inherits from `OSKDocumentController` and manages Firestore operations for the `/buildings/{buildingId}/units` collection `` `source_class|building|functions/src/modules/building/modules/building_unit/controllers/building_unit.controller.ts|OSKBuildingUnitController` ``.
- **`OSKBuildingUnitDoorController`**: Inherits from `OSKDocumentController` and manages Firestore operations for unit-specific doors under `/buildings/{buildingId}/units/{unitId}/doors` `` `source_class|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_door.controller.ts|OSKBuildingUnitDoorController` ``.
- **`OSKBuildingUnitInhabitantController`**: Inherits from `OSKDocumentController` and manages Firestore operations for unit inhabitants under `/buildings/{buildingId}/units/{unitId}/inhabitants` `` `source_class|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_inhabitant.controller.ts|OSKBuildingUnitInhabitantController` ``.
- **`OSKBuildingUnitInvitationController`**: Inherits from `OSKDocumentController` and manages Firestore operations for inhabitant invitations under `/buildings/{buildingId}/units/{unitId}/invitations` `` `source_class|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts|OSKBuildingUnitInvitationController` ``.
- **`OSKBuildingUnitPermanentGuestController`**: Inherits from `OSKDocumentController` and manages Firestore operations for permanent guests under `/buildings/{buildingId}/units/{unitId}/permanentGuests` `` `source_class|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts|OSKBuildingUnitPermanentGuestController` ``.

### Services
- **`OSKBuildingUnitService`**: Orchestrates high-level business logic for building units and exposes them via Firebase HTTPS Callable triggers `` `source_class|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|OSKBuildingUnitService` ``.
- **`OSKBuildingUnitInhabitantService`**: Orchestrates complex inhabitant onboarding, offboarding, and access synchronization workflows `` `source_class|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingUnitInhabitantService` ``.
- **`OSKBuildingUnitDoorService`**: Orchestrates unit door creation and propagates access to existing inhabitants `` `source_class|building|functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts|OSKBuildingUnitDoorService` ``.

#### building_unit_nonAppUser

The capability exposes several controllers and services as public entry points:
- `OSKBuildingUnitNonAppUserController` `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser.controller.ts|OSKBuildingUnitNonAppUserController` ``: Manages the core non-app user document operations.
- `OSKNonAppUserAccessController` `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_access.controller.ts|OSKNonAppUserAccessController` ``: Manages the access subcollection documents.
- `OSKNonAppUserPincodeController` `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_pincode.controller.ts|OSKNonAppUserPincodeController` ``: Manages the pincode subcollection documents.
- `OSKNonAppUserActivitiesController` `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_activity.controller.ts|OSKNonAppUserActivitiesController` ``: Manages the activity logs.
- `OSKNonAppUserActivityAggregatesController` `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_activity_aggregates.controller.ts|OSKNonAppUserActivityAggregatesController` ``: Manages 30-day activity aggregates.
- `OSKBuildingUnitNonAppUserService` `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKBuildingUnitNonAppUserService` ``: Orchestrates the business logic and coordinates with other services.

---

#### building_user

- **`OSKBuildingUserController` (Class)**: Exposes document-level operations for building users, extending `OSKDocumentController`. (Confirmed, `` `source_class|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|OSKBuildingUserController` ``)
- **`OSKBuildingUserService` (Class)**: Exposes business logic for creating building users and handling background deletion triggers. (Confirmed, `` `source_class|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKBuildingUserService` ``)

### 5. Internal Structure

*Note: This section details the internal coupling and submodule topology of the building module.*

The `building` module is highly modularized, consisting of 11 submodules. Their relationships are deterministically established by AST import analysis (**Confirmed**):

- **`_module_root`**: Acts as the primary entry point. It has outbound coupling to `building_activity`, `building_door`, `building_intercom`, `building_settings`, `building_unit`, and `building_user` (**Confirmed**). It receives inbound coupling from `building_door`, `building_intercom`, `building_settings`, `building_unit`, `building_unit_nonAppUser`, and `building_user` (**Confirmed**).
- **`building_door`**: Manages physical doors. It couples outbound to `_module_root` and `building_intercom` (**Confirmed**). It receives inbound coupling from `_module_root`, `building_intercom`, `building_pincode`, `building_settings`, `building_unit`, and `building_unit_nonAppUser` (**Confirmed**).
- **`building_intercom`**: Manages intercom hardware configurations and call transfer lists. It couples outbound to `_module_root`, `building_door`, `building_settings`, and `building_unit` (**Confirmed**). It receives inbound coupling from `_module_root`, `building_door`, and `building_unit` (**Confirmed**).
- **`building_settings`**: Manages building-wide configuration rules. It couples outbound to `_module_root` and `building_door` (**Confirmed**). It receives inbound coupling from `_module_root`, `building_intercom`, and `building_unit` (**Confirmed**).
- **`building_unit`**: Manages individual apartments/offices and inhabitants. It couples outbound to `_module_root`, `building_door`, `building_intercom`, `building_settings`, and `building_unit_nonAppUser` (**Confirmed**). It receives inbound coupling from `_module_root`, `building_intercom`, and `building_unit_nonAppUser` (**Confirmed**).
- **`building_unit_nonAppUser`**: Manages offline/non-app inhabitants (e.g., children, elderly). It couples outbound to `_module_root`, `building_accesses`, `building_activity`, `building_door`, and `building_unit` (**Confirmed**). It receives inbound coupling from `building_unit` (**Confirmed**).
- **`building_user`**: Associates standard users with buildings. It couples outbound to `_module_root` and `building_accesses` (**Confirmed**). It receives inbound coupling from `_module_root` (**Confirmed**).
- **`building_accesses`**: Manages building-level access ledgers. It receives inbound coupling from `building_unit_nonAppUser` and `building_user` (**Confirmed**).
- **`building_activity`**: Manages door-level activity logs. It receives inbound coupling from `_module_root` and `building_unit_nonAppUser` (**Confirmed**).
- **`building_pincode`**: Manages building-scoped PIN codes. It couples outbound to `building_door` (**Confirmed**). It receives inbound coupling from `building_pincode_trash` (**Confirmed**).
- **`building_pincode_trash`**: Manages soft-deleted PIN codes. It couples outbound to `building_pincode` (**Confirmed**).

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section synthesizes the module's data ownership boundaries based on data touchpoints and cross-submodule call signals.*

The `building` module exhibits a highly federated data ownership model where submodules own specific subcollections nested under the `/buildings/{buildingId}` root (**Inferred**). Based on deterministic call-edge signals (how frequently other submodules and external modules call into a given controller), the true ownership of shared paths is resolved as follows:

- **`/buildings/{buildingId}`**: Owned by `_module_root` (**Confirmed**). It is the authoritative parent document for all building metadata, called by 7 external modules to resolve building context (**Confirmed**).
- **`/buildings/{buildingId}/doors`**: Owned by `building_door` (**Inferred**). `OSKBuildingDoorController` is a major integration hub, called by 3 internal submodules and 7 external modules (including `access_control_device`, `call`, and `supplier`) to resolve physical door states (**Confirmed**).
- **`/buildings/{buildingId}/accesses`**: Owned by `building_accesses` (**Inferred**). `OSKBuildingAccessesController` is called by 2 internal submodules and 6 external modules to manage building-wide access ledgers (**Confirmed**).
- **`/buildings/{buildingId}/intercoms`** and **`/buildings/{buildingId}/callTransferList`**: Owned by `building_intercom` (**Inferred**). `OSKBuildingIntercomService` is called by 2 internal submodules and 3 external modules to manage intercom directories and WebRTC routing (**Confirmed**).
- **`/buildings/{buildingId}/units`**, **`/buildings/{buildingId}/units/{unitId}/doors`**, **`/buildings/{buildingId}/units/{unitId}/inhabitants`**, and **`/buildings/{buildingId}/units/{unitId}/permanentGuests`**: Owned by `building_unit` (**Inferred**). `OSKBuildingUnitController` and `OSKBuildingUnitInhabitantController` are called by multiple submodules and 5 external modules to manage residential occupancy models (**Confirmed**).
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers`** (and its nested accesses, pincodes, activities, and aggregates): Owned by `building_unit_nonAppUser` (**Inferred**). It manages offline credentials and syncs them to the building-wide accesses and pincodes collections (**Confirmed**).
- **`/buildings/{buildingId}/pincodes`**: Owned by `building_pincode` (**Inferred**). It acts as the building-scoped PIN registry, called by `admin` and `core` to manage offline keypad credentials (**Confirmed**).
- **`/buildings/{buildingId}/pincodes_trash`**: Owned by `building_pincode_trash` (**Inferred**). It manages soft-deleted PINs before permanent purging (**Confirmed**).
- **`/buildings/{buildingId}/settings`**: Owned by `building_settings` (**Inferred**). It manages building-wide configuration rules, called by `admin` and `building_intercom` (**Confirmed**).
- **`/buildings/{buildingId}/users`**: Owned by `building_user` (**Inferred**). It manages building-scoped user associations, called by `user` (**Confirmed**).
- **`/buildings/{buildingId}/doors/{doorId}/activities`**: Owned by `building_activity` (**Inferred**). It manages door-level activity logs, called by `core` to ingest edge events (**Confirmed**).

**Per-capability evidence:**

#### _module_root

### Firestore Collections & Paths
- `/buildings/{buildingId}`: Read, write, and delete access. (**Confirmed** - `` `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._delete|delete|OSKBuildingController.collection,buildingId|#1` ``, `` `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._set|save|OSKBuildingController.collection,buildingId,data|#1` ``)
- `/organizations/{organizationId}/buildings/{buildingId}`: Write access. (**Confirmed** - `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKOrganizationBuildingController.default.save|createOrganizationBuilding|organizationId,buildingId,organizationBuilding|#1` ``)
- `/properties/{propertyId}`: Write access (updating the nested `buildings` array). (**Confirmed** - `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKPropertyController.default.update|createOrganizationBuilding|propertyId,{                     buildings: FieldValue.arrayUnion(building),                 }|#1` ``)
- `/buildings/{buildingId}/settings/{settingsId}`: Delete access. (**Confirmed** - `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingSettingsController.default.delete|deleteBuilding|settingsId,request.buildingId|#1` ``)

#### building_accesses

This capability owns and manages documents within the following Firestore collection path:

### `/buildings/{buildingId}/accesses/{userId}`
- **Fields Managed**:
  - `buildingId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|buildingId|#1` ``
  - `userId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userId|#1` ``
  - `userFirstName`: *string* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userFirstName|#1` ``
  - `userLastName`: *string* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userLastName|#1` ``
  - `accesses`: *array* `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|accesses|#1` ``
- **Operations**:
  - **Read**: Performed via `OSKBuildingAccessesController.get` and `getAll` `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 18-37) ``.
  - **Write/Create/Update**: Performed via `OSKBuildingAccessesController.save`, `create`, `update` `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 49-62) `` and `OSKBuildingAccessService` `` `functions/src/modules/building/modules/building_accesses/services/building_access.service.ts` (lines 16-65) ``.
  - **Delete**: Performed via `OSKBuildingAccessesController.deletePerUser` and `deleteAll` `` `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 64-72) ``.

**Confidence: Confirmed**

---

#### building_activity

### Firestore Paths
- **`buildings/{buildingId}/doors/{doorId}/activities`** (Inferred)
  - *Description*: The collection path is dynamically resolved by `OSKBuildingActivitiesController.getCollectionPath(buildingId, doorId)` [Inferred] `` `call_expression|building|functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts|OSKBuildingActivitiesController.default.getCollectionPath|get|buildingId,doorId|#1` ``.
  - *Operations*: Read, Write, Delete [Confirmed] `functions/src/modules/building/modules/building_activity/controllers/building_activities.controller.ts` (lines 20-53).

---

#### building_door

### Firestore Paths Touched
- `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{accessControlDeviceId}/keys` (Operation: `set`) [Confirmed] (`` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{accessControlDeviceId}/keys|#1` ``)
- `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys` (Operations: `get`, `delete`) [Confirmed] (`` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys|#1` ``, `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys|#3` ``)
- `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` (Trigger Path) [Confirmed] (`` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/index.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}|#1` ``)

#### building_intercom

### Firestore Paths
- **`/buildings/{buildingId}/intercoms/{intercomId}`**: Master building intercom documents containing unit entries, display names, and WebRTC contact IDs [Confirmed] (`` `controller_method|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|OSKBuildingIntercomController|getCollectionPath|#1` ``).
- **`/buildings/{buildingId}/callTransferList/{callTransferListId}`**: Call transfer lists defining the routing sequence of call recipients for WebRTC/SIP calls [Confirmed] (`` `controller_method|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom_calltransferlist.controller.ts|OSKBuildingIntercomCallTransferListController|getCollectionPath|#1` ``).

---

#### building_pincode

### Firestore Paths
- **`/buildings/{buildingId}/pincodes/{pincodeId}`**: This capability owns the `pincodes` subcollection nested under buildings [Confirmed] (citing `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 15-17)).

### Operations
- **Create/Write**: Handled via the `set` method in `OSKBuildingPincodeController` [Confirmed] (citing `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|set|#1` ``).
- **Read**: Handled via `get`, `getSafe`, `getAll`, `getAllByType`, and `getByAccessId` in `OSKBuildingPincodeController` [Confirmed] (citing `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 24-82)).
- **Delete**: Handled via the `delete` method in `OSKBuildingPincodeController` [Confirmed] (citing `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|delete|#1` ``).

---

#### building_pincode_trash

### Firestore Paths
The capability dynamically resolves its collection path using `getCollectionPath(buildingId)` [Confirmed; `` `functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts` (line 14) ``]. 
- **Path Structure**: Based on the `buildingId` parameter, this likely maps to a subcollection under a building, such as `/buildings/{buildingId}/pincodes_trash` [Inferred].

### Data Models
- **`OSKBuildingPincodeTrashDocument`**: Represents a trashed pincode document [Confirmed; `` `type_alias|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|#1` ``].
  - `status`: `OSKPincodeTrashStatus` [Confirmed; `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|status|#1` ``].
  - `lastStatusUpdate`: Timestamp of the last status change [Confirmed; `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|lastStatusUpdate|#1` ``].
  - `expirationDate`: Timestamp when the trashed pincode expires or is eligible for permanent purging [Confirmed; `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|expirationDate|#1` ``].

---

#### building_settings

### Firestore Paths

This capability owns and performs write operations on the following Firestore collection paths:

- **`/buildings/{buildingId}/settings/{settingsId}`**
  - **Operations**: Create, Read, Update, Delete `` `functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts` (lines 21-66) ``
  - **Scope**: Document-level configuration for building settings. [Confirmed]

Additionally, this capability performs write operations on user-scoped building settings owned by the `user` module:

- **`/users/{userId}/buildingSettings/{buildingId}`**
  - **Operations**: Update, Delete `` `functions/src/modules/building/modules/building_settings/services/building_settings.service.ts` (lines 373, 430, 491) ``
  - **Scope**: Propagating building-level settings changes down to individual user settings. [Confirmed]

#### building_unit

This capability owns and performs direct read/write operations on the following Firestore paths:

### `/buildings/{buildingId}/units`
- **Description**: Stores the primary metadata for building units.
- **Operations**: Create, Read, Update, Delete `` `call_expression|building|functions/src/modules/building/modules/building_unit/controllers/building_unit.controller.ts|OSKBuildingUnitController.default._create|create|`/buildings/${buildingId}/units`,unitId,data|#1` ``. [Confirmed]

### `/buildings/{buildingId}/units/{unitId}/doors`
- **Description**: Stores doors assigned specifically to a unit.
- **Operations**: Create, Read, Update, Delete `` `call_expression|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_door.controller.ts|OSKBuildingUnitDoorController.default._query|getAll|`/buildings/${buildingId}/units/${unitId}/doors`|#1` ``. [Confirmed]

### `/buildings/{buildingId}/units/{unitId}/inhabitants`
- **Description**: Stores the inhabitants (tenants/residents) assigned to a unit.
- **Operations**: Create, Read, Update, Delete `` `call_expression|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_inhabitant.controller.ts|OSKBuildingUnitInhabitantController.default._get|get|collectionPath,userId|#1` ``. [Confirmed]

### `/buildings/{buildingId}/units/{unitId}/permanentGuests`
- **Description**: Stores permanent guests associated with a unit.
- **Operations**: Create, Read, Update, Delete `` `call_expression|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts|OSKBuildingUnitPermanentGuestController.default._create|create|`/buildings/${buildingId}/units/${unitId}/permanentGuests`,userId,data|#1` ``. [Confirmed]

### `/buildings/{buildingId}/units/{unitId}/invitations`
- **Description**: Stores invitations sent to prospective inhabitants.
- **Operations**: Create, Read, Delete `` `call_expression|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts|OSKBuildingUnitInvitationController.default._create|create|collectionPath,invitationId,data|#1` ``. [Inferred]

#### building_unit_nonAppUser

This capability owns and performs CRUD operations on the following Firestore paths [Confirmed]:
- `buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}`: Stores the core non-app user profile `` `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser.controller.ts` (lines 22-25) ``.
- `buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/accesses/{accessId}`: Stores the access rights and schedules `` `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_access.controller.ts` (lines 14-17) ``.
- `buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes/{pincodeId}`: Stores the generated PIN codes `` `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_pincode.controller.ts` (lines 15-18) ``.
- `buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activities/{activityId}`: Stores individual access activity logs `` `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_activity.controller.ts` (lines 13-16) ``.
- `buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activityAggregates/{buildingId}`: Stores 30-day activity aggregates `` `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_activity_aggregates.controller.ts` (lines 17-20) ``.

Additionally, it performs dual-writes/updates to the following shared ledgers [Confirmed]:
- `buildings/{buildingId}/accesses/{userId}`: Updates the building-wide accesses list `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKBuildingAccessesController.default.update|updateNonAppUserAccessDoors|buildingId,nonAppUserId,{                     accesses: updatedBuildingAccesses,                 }|#1` ``.
- `buildings/{buildingId}/pincodes/{pincodeId}`: Deletes pincodes from the building-wide pincode list `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|_deleteAccessSideEffects|pincodeId,buildingId|#1` ``.

---

#### building_user

- **Firestore Path**: `/buildings/{buildingId}/users/{userId}` (Confirmed, `` `call_expression|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|OSKBuildingUserController.default._get|get|\`/buildings/\${buildingId}/users\`,userId|#1` ``)
  - **Operations**: Read (get, getAll, listDocuments), Write (save, update, delete, deleteAll)

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### API Contracts
The following HTTPS callable functions are exposed by this capability:

#### `assigningBuildingToProperty`
- **Request Schema**: `OSKPropertyAssigningBuildingRequestData`
  - `buildingData`: `Partial<OSKBuilding>`
  - `buildingId`: `string`
  - `newPropertyId`: `string`
  - `oldPropertyId`: `string | undefined` (optional)
  - `organizationId`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `createOrganizationBuilding`
- **Request Schema**: `OSKBuildingCreateRequest`
  - `imageFilename`: `string | undefined` (optional)
  - `name`: `string | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `streetAddress`: `OSKStreetAddress`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `deleteBuildingImage`
- **Request Schema**: `deleteBuildingImageRequest`
  - `buildingId`: `string`
  - `filename`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `getAllBuildings`
- **Request Schema**: `OSKBuildingGetAllRequestData`
  - `organizationId`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `getBuildingById`
- **Request Schema**: `OSKBuildingGetRequest`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Schema**: `OSKBuildingDetailsResponseData`
  - `building`: `OSKBuildingDocument`
  - `doorsCount`: `number`
  - `unitsCount`: `number`

#### `getBuildingsByPropertyId`
- **Request Schema**: `OSKBuildingGetAllByPropertyRequest`
  - `accessControlDeviceType`: `OSKAccessControlDeviceType | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `updateBuilding`
- **Request Schema**: `OSKBuildingUpdateRequest`
  - `buildingId`: `string`
  - `data`: `Partial<OSKBuilding>`
  - `organizationId`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

### Firestore Triggers
- **getFirestoreTriggers**: Registers Firestore triggers for building doors. (**Confirmed** - `` `call_expression|building|functions/src/modules/building/index.ts|buildingDoorTriggers.getFirestoreTriggers|getFirestoreTriggers|functionBuilder|#1` ``)

#### building_accesses

- **API Contracts**: No `api_contract` facts are present in this capability's pack.
- **Firestore Triggers**: No Firestore triggers are defined in this capability's pack.

**Confidence: Confirmed**

---

#### building_activity

### API Contracts (Callable Functions)

#### `getActivityById`
- **Request Type**: `OSKGetBuildingActivityByIdRequest`
  - `activityId`: `string`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `OSKBuildingActivityDocument` (Inferred)
- **Citations**: `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getActivityById|#1` ``

#### `getAllBuildingActivities`
- **Request Type**: `OSKGetAllBuildingActivitiesRequest`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `OSKBuildingActivityDocument[]` (Inferred)
- **Citations**: `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getAllBuildingActivities|#1` ``

#### `deleteBuildingActivityById`
- **Request Type**: `OSKDeleteBuildingActivityByIdRequest`
  - `activityId`: `string`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `void` (Inferred)
- **Citations**: `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteBuildingActivityById|#1` ``

#### `deleteAllBuildingActivities`
- **Request Type**: `OSKDeleteAllBuildingActivitiesRequest`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `void` (Inferred)
- **Citations**: `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteAllBuildingActivities|#1` ``

### Firestore Triggers
- None evidenced in this capability's pack.

---

#### building_door

### API Request/Response Schemas
- **deleteBuildingDoor** (Callable) [Confirmed] (`` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|deleteBuildingDoor|#1` ``)
  - **Request Type**: `OSKBuildingDoorDeleteRequest`
    - `adminsOrganizationId`: `string | undefined` (optional)
    - `buildingId`: `string`
    - `doorId`: `string`
- **organizationUserCreateBuildingDoor** (Callable) [Confirmed] (`` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserCreateBuildingDoor|#1` ``)
  - **Request Type**: `OSKBuildingDoorCreateRequest`
    - `buildingId`: `string`
    - `isForAllResidents`: `boolean`
    - `name`: `string`
    - `organizationId`: `string`
    - `streetAddress`: `OSKStreetAddress`
- **organizationUserUpdateBuildingDoor** (Callable) [Confirmed] (`` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserUpdateBuildingDoor|#1` ``)
  - **Request Type**: `OSKBuildingDoorUpdateRequest`
    - `buildingId`: `string`
    - `data`: `Partial<Pick<OSKBuildingDoor, "name" | "streetAddress">>`
    - `doorId`: `string`
    - `organizationId`: `string`

### Firestore Triggers
- **onDocumentCreated** [Confirmed] (`` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentCreated|#1` ``)
  - **Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`
- **onDocumentDeleted** [Confirmed] (`` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentDeleted|#1` ``)
  - **Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`

#### building_intercom

### Callable Functions

#### `deleteIntercomDisplayName`
- **Request Type**: `OSKBuildingIntercomEntryDeleteRequest` [Confirmed]
  - `buildingId`: `string`
  - `entryId`: `string`
  - `organizationId`: `string`
- **Response Type**: Not listed in resolved schemas [Unknown].
- **Citations**: (`` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|deleteIntercomDisplayName|#1` ``).

#### `onUpdateBuildingIntercomsTransferList`
- **Request Type**: `OSKIntercomCallTransferListRequest` [Confirmed]
  - `buildingId`: `string`
  - `callTransferList`: `OSKUserIntercomCallTransferListItem[]` (imported from `user_intercoms`)
  - `unitId`: `string`
  - `userId`: `string`
- **Response Type**: Not listed in resolved schemas [Unknown].
- **Citations**: (`` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|onUpdateBuildingIntercomsTransferList|#1` ``).

#### `updateIntercomDisplayName`
- **Request Type**: `OSKBuildingIntercomDisplayNameRequest` [Confirmed]
  - `buildingId`: `string`
  - `newDisplayName`: `string`
  - `unitId`: `string`
- **Response Type**: Not listed in resolved schemas [Unknown].
- **Citations**: (`` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|updateIntercomDisplayName|#1` ``).

### Firestore Triggers
- None evidenced in this capability pack [Confirmed].

---

#### building_pincode

No API contracts or Firestore triggers are evidenced within this capability's pack.

---

#### building_pincode_trash

No API contracts (`api_contract` facts) or Firestore triggers are directly evidenced in this capability's pack [Confirmed].

---

#### building_settings

### API Contracts

The capability exposes five HTTPS callable Cloud Functions:

#### `createBuildingSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|createBuildingSettings|#1` ``
- **Request Schema**: `OSKBuildingSettingsCreateRequest`
  - `buildingId`: `string`
  - `buildingSettingsInputParams`: `OSKBuildingSettingsInputParams`
- **Response Schema**: `Promise<void>` (Inferred)

#### `deleteBuildingSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|deleteBuildingSettings|#1` ``
- **Request Schema**: `OSKBuildingDeleteOrResetSettingsRequest`
  - `buildingId`: `string`
  - `settingsId`: `string`
- **Response Schema**: `Promise<void>` (Inferred)

#### `getResidentSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|getResidentSettings|#1` ``
- **Request Schema**: `OSKBuildingGetSettingsRequest`
  - `buildingId`: `string`
  - `settingsId`: `string`
- **Response Schema**: `Promise<OSKBuildingSettingsDocument>` (Inferred)

#### `resetBuildingSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|resetBuildingSettings|#1` ``
- **Request Schema**: `OSKBuildingDeleteOrResetSettingsRequest`
  - `buildingId`: `string`
  - `settingsId`: `string`
- **Response Schema**: `Promise<void>` (Inferred)

#### `updateBuildingSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|updateBuildingSettings|#1` ``
- **Request Schema**: `OSKBuildingUpdateSettingsRequest`
  - `buildingId`: `string`
  - `update`: `Partial<OSKBuildingSettingsInputParams>`
- **Response Schema**: `Promise<void>` (Inferred)

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

#### building_unit

### API Contracts (Callable Functions)
The following callable functions are registered as entry points for this capability `` `functions/src/modules/building/modules/building_unit/index.ts` (lines 67-77) ``:

#### `deleteBuildingUnit`
- **Request Type**: `OSKBuildingUnitDeleteRequest`
  - `adminsOrganizationId`: `string | undefined` (optional)
  - `buildingId`: `string`
  - `unitId`: `string`
- **Response Type**: `void` (evidenced by handler resolution)

#### `organizationUserCreateBuildingUnit`
- **Request Type**: `OSKBuildingUnitCreateRequest`
  - `buildingId`: `string`
  - `capacity`: `string`
  - `floor`: `string`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress` (imported from `core` module)
  - `unitNumber`: `string`
- **Response Type**: `void` (evidenced by handler resolution)

#### `organizationUserUpdateBuildingUnit`
- **Request Type**: `OSKBuildingUnitUpdateRequest`
  - `buildingId`: `string`
  - `data`: `{ name: string; floor: string; unitNumber: string; streetAddress?: OSKStreetAddress; }`
  - `organizationId`: `string`
  - `unitId`: `string`
- **Response Type**: `void` (evidenced by handler resolution)

#### `organizationUserGetAllBuildingUnits`
- **Request Type**: `OSKBuildingUnitGetRequest` (Inferred from service method signature)
- **Response Type**: `OSKBuildingUnit[]` (Inferred from service method signature)

#### `organizationUserGetBuildingUnitById`
- **Request Type**: `OSKBuildingUnitGetRequest` (Inferred from service method signature)
- **Response Type**: `OSKBuildingUnit` (Inferred from service method signature)

### Firestore Triggers
No Firestore triggers are registered directly within this capability's entry point `` `functions/src/modules/building/modules/building_unit/index.ts` ``. [Confirmed]

#### building_unit_nonAppUser

The following callable API contracts are exposed by this capability `` `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts` (lines 48-60) ``:
- `createNonAppUser`
- `createNonAppUserAccess`
- `createNonAppUserWithAccess`
- `deleteNonAppUser`
- `getAllNonAppUsers`
- `getNonAppUser`
- `updateNonAppUser`
- `updateNonAppUserAccessDoors`

### Resolved API Request/Response Schemas
- **createNonAppUserAccess** (Request: `OSKCreateNonAppUserAccessRequest`)
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `endDate`: `Date`
  - `nonAppUserId`: `string`
  - `startDate`: `Date`
  - `unitId`: `string`
- **createNonAppUserWithAccess** (Request: `OSKCreateNonAppUserWithAccessRequest`, Response: `OSKCreateNonAppUserwithAccessResponse`)
  - Request:
    - `doorIds`: `string[] | undefined` (optional)
  - Response:
    - `accessId`: `string`
    - `fullName`: `string`
    - `nonAppUserId`: `string`
    - `pincode`: `string`
- **deleteNonAppUser** (Request: `OSKDeleteNonAppUserRequest`)
  - `buildingId`: `string`
  - `nonAppUserId`: `string`
  - `unitId`: `string`
- **getAllNonAppUsers** (Request: `OSKGetAllNonAppUsersRequest`)
  - `buildingId`: `string`
  - `unitId`: `string`
- **getNonAppUser** (Request: `OSKGetNonAppUserRequest`)
  - `buildingId`: `string`
  - `nonAppUserId`: `string`
  - `unitId`: `string`
- **updateNonAppUser** (Request: `OSKUpdateNonAppUserRequest`)
  - `buildingId`: `string`
  - `dataToUpdate`: `UpdateData<OSKDocument<T>>`
  - `nonAppUserId`: `string`
  - `unitId`: `string`
- **updateNonAppUserAccessDoors** (Request: `OSKUpdateNonAppUserAccessDoorsRequest`)
  - `accessId`: `string`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `nonAppUserId`: `string`
  - `unitId`: `string`

---

#### building_user

### API Contracts
- **`createBuildingUser` (Callable Function)**: (Confirmed, `` `api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1` ``)
  - **Request Type**: `OSKBuildingUserCreateRequest`
  - **Response Type**: Unknown (Not explicitly detailed in the schema map)

```typescript
functions/src/modules/building/modules/building_user/index.ts :: createBuildingUser :: requestType :: OSKBuildingUserCreateRequest
	accessRights	import("functions/src/modules/core/modules/access/models/access_right.model").OSKAccessRightWithTimestamp[]
	buildingId	string
	doors	import("functions/src/modules/core/models/shared/door_info.model").OSKDoorInfo[]
	firstName	string
	lastName	string
	organizationId	string
	userId	string
	userType	import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationUser | import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationGuestUser
```

### Firestore Triggers
- **`onDocumentDeleted`**: Triggered on document deletion of a building user. (Inferred, `` `service_method|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKBuildingUserService|onDocumentDeleted|#1` ``)

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section highlights cross-cutting security patterns, asymmetries, and RBAC alignment risks across the module's submodules.*

#### Mental Enforcement Tally & Security Asymmetry
An active comparison of security enforcement across the 11 submodules reveals a significant architectural asymmetry (**Inferred**):

1. **Explicit RBAC Enforcement Group**:
   - `_module_root`, `building_door`, `building_settings`, `building_unit`, and `building_user` explicitly check RBAC permission strings (e.g., `v1.org.buildings.edit`, `v1.org.settings.create`, `v1.admin.building.register`) within their service or controller logic (**Confirmed**).
2. **Implicit/Bypassed Security Group**:
   - `building_accesses`, `building_pincode`, `building_pincode_trash`, and `building_unit_nonAppUser` perform highly sensitive operations (creating, updating, and deleting physical door access credentials and PIN codes) but **do not enforce any explicit RBAC permission strings** in their service or controller code (**Confirmed**).
   - Instead, these submodules rely on the administrative privilege of GCP Cloud Functions (bypassing client-side Firestore rules) and generic decorator-level checks like `@OSKUserSecurityChecks({ checkUserIdMatch: false })` (**Confirmed**). This represents a major security asymmetry where the creation of a physical PIN code is less explicitly guarded in code than editing a building's name.

#### Unattributed Security-Relevant Signals
- **`building_unit` App Check Enforcement**: `OSKBuildingUnitService` raises a `Failed-precondition` error ("deleteBuildingUnit() must be called from an App Check verified app.") if App Check validation fails (**Confirmed**). However, the underlying deletion logic does not explicitly check an RBAC string for the deletion itself, relying entirely on App Check and implicit caller validation (**Inferred**).

#### RBAC Schema Mismatches
- **Undefined Permission**: `building_door` (`deleteBuildingDoor`) explicitly references and checks the permission string `v1.org.buildings.createManager` (**Confirmed**). This permission string **does not exist** in the authoritative `rbac-roles.json` document (**Confirmed**).
- **Conceptual Permission Mismatch**: `building_user` (`createBuildingUser`) checks `v1.admin.building.register` and `v1.org.buildings.create` (**Confirmed**). These permissions are defined in `rbac-roles.json` as allowing the registration or creation of a *building*, but they are being enforced here to control the association of a *user* to an existing building, which is conceptually mismatched (**Inferred**).

**Per-capability evidence:**

#### _module_root

The capability references and enforces the following permission strings:
- `v1.org.buildings.create`: Required to create a new building. (**Confirmed** - `` `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.buildings.create|#1` ``)
- `v1.org.buildings.edit`: Required to edit building information. (**Confirmed** - `` `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.buildings.edit|#1` ``)
- `v1.org.buildings.view`: Required to view building details. (**Confirmed** - `` `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.buildings.view|#1` ``)
- `v1.org.settings.create`: Referenced during building-to-property assignment checks. (**Confirmed** - `` `permission_candidate|building|functions/src/modules/building/services/building.service.ts|v1.org.settings.create|#1` ``)

### Security Decorators & App Check
- **OSKUserSecurityChecks**: Applied to service methods to enforce authentication and parameter validation. (**Confirmed** - `` `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKUserSecurityChecks|createOrganizationBuilding|{ checkUserIdMatch: false }|#1` ``)
- **App Check**: Enforced on all callable triggers unless running in the Firebase Emulator. (**Confirmed** - `` `call_expression|building|functions/src/modules/building/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``)

#### building_accesses

- **Firestore Security Rules**:
  - In `firestore.rules.txt`, there is no explicit sub-match rule defined for `/buildings/{buildingId}/accesses/{userId}`.
  - However, because this capability runs within GCP Cloud Functions (evidenced by the use of `firebase-admin/firestore` `` `imports_dependency|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|firebase-admin/firestore|#1` ``), it operates with administrative privileges, bypassing client-side Firestore security rules.
- **RBAC Permissions**:
  - No explicit RBAC permission strings (e.g., `v1.admin.user.accesses.create`) are directly referenced in this capability's code facts.

**Confidence: Inferred**

---

#### building_activity

- **`OSKUserSecurityChecks`**: Applied to all service methods with `{ checkUserIdMatch: false }` [Confirmed] `` `call_expression|building|functions/src/modules/building/modules/building_activity/services/building_activities.service.ts|OSKUserSecurityChecks|getActivityById|{ checkUserIdMatch: false }|#1` ``. This indicates that while the user must be authenticated, the system does not restrict the action to a specific matching `userId` at this decorator level (relying instead on broader building/door access checks or administrative roles).
- **No Explicit RBAC Strings**: There are no explicit references to RBAC permission strings (e.g., `v1.admin.building.view`) within the codebase of this capability. Security is enforced via parameter validation and the global Firestore rules which allow read/write access to `/buildings/{buildingId}` and its subcollections for any authenticated user (`isValidUser()`) [Confirmed] `governance/reference-docs/firestore.rules.txt`.

---

#### building_door

- **v1.org.buildings.edit**: Required to create or update building doors [Confirmed] (`` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.edit|#1` ``). Matches the RBAC roles document.
- **v1.org.buildings.view**: Required to retrieve building door details [Confirmed] (`` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.view|#1` ``). Matches the RBAC roles document.
- **v1.org.buildings.createManager**: Referenced in `deleteBuildingDoor` [Confirmed] (`` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.createManager|#1` ``). **Mismatch**: This permission string is not defined in the `rbac-roles.json` document.

#### building_intercom

### Permissions Referenced
- **`v1.admin.accessControlDevice.edit`**: Checked during intercom display name deletion to verify administrative authority [Confirmed] (`` `permission_candidate|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|v1.admin.accessControlDevice.edit|#1` ``).
  - *RBAC Cross-Check*: Matches the RBAC roles document exactly ("v1.admin - Allows to edit an existing access control device") [Confirmed].

### Security Checks
- **`OSKUserSecurityChecks`**: Decorator applied to callable endpoints to enforce user-level security boundaries [Confirmed] (`` `call_expression|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKUserSecurityChecks|onUpdateBuildingIntercomsTransferList|{ checkUserIdMatch: false }|#1` ``).
- **`OSKSecurityChecks.checkParameters`**: Validates incoming request parameters against expected types [Confirmed] (`` `call_expression|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKSecurityChecks.checkParameters|onUpdateBuildingIntercomsTransferList|[             { name: 'context', value: context, type: 'object' },             { name: 'userId', value: request.userId, type: 'string' },             { name: 'unitId', value: request.unitId, type: 'string' },             { name: 'buildingId', value: request.buildingId, type: 'string' },             { name: 'callTransferList', value: request.callTransferList, type: 'array' },         ]|#1` ``).

---

#### building_pincode

- No explicit permission strings are referenced in the capability's code evidence.
- **Firestore Security Rules Analysis**: In `firestore.rules.txt`, there are no explicit rules matching the `/buildings/{buildingId}/pincodes` subcollection. Since the default rule is `allow read, write: if false;` for `{document=**}`, direct client-side access to this subcollection is blocked [Inferred].
- **Administrative Access**: Because `OSKBuildingPincodeController` extends `OSKDocumentController` (which runs on the backend via Cloud Functions), it utilizes the Firebase Admin SDK to bypass client-side security rules [Inferred] (citing `` `source_class|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController` ``).

---

#### building_pincode_trash

- No explicit permission strings are directly referenced in this capability's evidence pack [Confirmed].
- Security and access control are inferred to be delegated to the base `OSKDocumentController` and the safe access methods (`getSafe`, `getAllSafe`) implemented in the controller [Inferred; `` `functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts` (lines 28-35, 42-51) ``].

---

#### building_settings

The capability references and enforces the following permission strings:

- **`v1.org.settings.create`**: Required to initialize building settings `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.create|#1` ``. [Confirmed]
- **`v1.org.settings.view`**: Required to retrieve building settings `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.view|#1` ``. [Confirmed]
- **`v1.org.settings.edit`**: Required to update building settings `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.edit|#1` ``. [Confirmed]
- **`v1.org.settings.delete`**: Required to delete or reset building settings `` `permission_candidate|building|functions/src/modules/building/modules/building_settings/services/building_settings.service.ts|v1.org.settings.delete|#1` ``. [Confirmed]

### RBAC Cross-Check
All four permission strings match the supplied RBAC roles document exactly:
- `v1.org.settings.create` -> "Allows to create a new management rule"
- `v1.org.settings.view` -> "Allows to view the details of a management rule"
- `v1.org.settings.edit` -> "Allows to edit an existing management rule"
- `v1.org.settings.delete` -> "Allows to delete a management rule"

#### building_unit

The capability references and enforces the following permission strings:

- **`v1.org.buildings.create`**: Required to create building units or unit doors `` `permission_candidate|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|v1.org.buildings.create|#1` ``, `` `permission_candidate|building|functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts|v1.org.buildings.create|#1` ``. Matches the RBAC role "Allows to create a new building". [Confirmed]
- **`v1.org.buildings.edit`**: Required to update building units `` `permission_candidate|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|v1.org.buildings.edit|#1` ``. Matches the RBAC role "Allows to edit a building's information". [Confirmed]
- **`v1.org.buildings.view`**: Required to view building units `` `permission_candidate|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|v1.org.buildings.view|#1` ``. Matches the RBAC role "Allows to view the details of a building". [Confirmed]

### Security Enforcement
- **App Check**: All critical service methods enforce Firebase App Check verification to prevent unauthorized API abuse `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|OSKBuildingUnitService.logger.logError|deleteBuildingUnit|'Failed-precondition: deleteBuildingUnit() must be called from an App Check verified app.'|#1` ``. [Confirmed]

#### building_unit_nonAppUser

- The service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKUserSecurityChecks|createNonAppUser|{ checkUserIdMatch: false }|#1` ``. This indicates that the user executing the callable function does not need to match the non-app user's ID (since non-app users do not have accounts/IDs to authenticate with).
- The actual authorization checks (e.g., verifying if the caller is a ResidentAdmin of the unit or a Property Manager with `v1.org.residents.create` or `v1.org.residents.edit` permissions) are likely handled inside the decorator or within the service methods, but specific RBAC permission strings are not explicitly referenced in the provided evidence pack.
- The Firestore security rules enforce that only valid authenticated users can read or write to `/buildings/{buildingId}/units/{unitId}/residents` (which maps to non-app users or inhabitants) `` `firestore.rules.txt` (lines 535-540) [Confirmed]``.

---

#### building_user

- **Permission Checks**:
  - `v1.admin.building.register` (Confirmed, `` `permission_candidate|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|v1.admin.building.register|#1` ``)
  - `v1.org.buildings.create` (Confirmed, `` `permission_candidate|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|v1.org.buildings.create|#1` ``)
- **RBAC Alignment**:
  - `v1.admin.building.register` is defined in the RBAC roles document as "v1.admin - Allows to register a new building".
  - `v1.org.buildings.create` is defined in the RBAC roles document as "Allows to create a new building".
  - *Note*: The permissions checked (`v1.admin.building.register` and `v1.org.buildings.create`) are related to building registration/creation, which is slightly mismatched conceptually with *creating a user inside a building*, but this is what the implementation enforces. (Confirmed)

### 10. Cross-Module Relationships

*Note: This section details genuine, AST-proven external module dependencies in both directions.*

#### Outbound Dependencies (This module imports from/calls into):
- **`core`** (**Confirmed**): Inherits generic CRUD and image-handling capabilities by extending `OSKDocumentController` and `OSKDocumentAndMessageController` (**Confirmed**). Utilizes `OSKLoggingService` for error logging and `OSKSecretService` for managing private cryptographic keys (**Confirmed**).
- **`organization`** (**Confirmed**): Calls `OSKOrganizationUserController.get` to resolve administrative user roles and `OSKOrganizationResidentsController` to query resident profiles (**Confirmed**).
- **`settings`** (**Confirmed**): Calls `OSKConsolidatedRolesController.checkUserPermissions` and `checkUserPermissionsSafe` to validate RBAC permissions (**Confirmed**).
- **`user`** (**Confirmed**): Calls `OSKUserIntercomService` to synchronize intercom entries (`createAndUpdateUsersIntercomEntry`, `updateAllUserIntercomEntry`, `cleanUpUserIntercomsAfterInhabitantDeletion`) and `OSKUserSettingsBuildingController` to manage user-scoped building settings (**Confirmed**).
- **`access_control_device`** (**Confirmed**): Calls `OSKAccessControlDeviceController` (`get`, `assignBuildingDoor`, `unassignBuildingDoor`) and `OSKAccessControlDeviceConfigController` (`save`, `deleteAll`) to provision and configure physical hardware assigned to doors (**Confirmed**).

#### Inbound Dependencies (Other modules import from/call into this module):
- **`access_control_device`** (**Confirmed**): Calls `OSKBuildingAccessesController.get` and `OSKBuildingController.getSafe` to enrich raw edge events with building and door context (**Confirmed**).
- **`admin`** (**Confirmed**): Calls building controllers (`OSKBuildingController`, `OSKBuildingSettingsController`, `OSKBuildingIntercomController`, `OSKBuildingUnitController`, `OSKBuildingPincodeController`) to perform administrative maintenance and database overrides (**Confirmed**).
- **`call`** (**Confirmed**): Calls `OSKBuildingDoorController.get` and `OSKBuildingIntercomCallTransferListController.get` to resolve physical door relays and call-routing rules during active intercom calls (**Confirmed**).
- **`core`** (**Confirmed**): Calls `OSKBuildingAccessesController` and `OSKNonAppUserPincodeController` to publish access updates, and routes raw hardware events to `OSKBuildingActivitiesService` and `OSKNonAppUserActivityService` (**Confirmed**).
- **`organization`** (**Confirmed**): Calls `OSKBuildingUnitInvitationController`, `OSKBuildingUnitInhabitantService`, and `OSKBuildingUnitNonAppUserController` to manage resident onboarding, invitations, and offboarding (**Confirmed**).
- **`supplier`** (**Confirmed**): Calls `OSKBuildingController` and `OSKBuildingAccessesController` to manage time-bound PIN and door access for third-party contractors (**Confirmed**).
- **`unit_management`** (**Confirmed**): Calls unit-scoped controllers (`OSKBuildingUnitInhabitantController`, `OSKBuildingUnitPermanentGuestController`, `OSKBuildingUnitNonAppUserController`) to allow ResidentAdmins to manage their "Mon Foyer" residential groups (**Confirmed**).
- **`user`** (**Confirmed**): Calls `OSKBuildingAccessesController` and `OSKBuildingUnitInhabitantController` to resolve and update user-scoped accesses and inhabitant profiles (**Confirmed**).

### 11. External Hooks

#### _module_root

- **Google Cloud Storage**: Interacts with Cloud Storage buckets to upload and delete building images. (**Confirmed** - `` `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._uploadImage|uploadImage|bucket,imagePath,contentType,'imageFilename'|#1` ``)
- **Environment Variables**:
  - `OSK_FIREBASE_EMULATOR`: Used to conditionally bypass App Check enforcement during local development or testing. (**Confirmed** - `` `call_expression|building|functions/src/modules/building/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``)

#### building_accesses

- **Pub/Sub Integration**:
  - The Architecture Document states: *"Every grant or revocation synchronizes to physical hardware asynchronously via Pub/Sub — the application publishes intended state rather than talking to devices directly..."*
  - While this capability's direct code facts do not show Pub/Sub publishing calls, it is highly likely that the service methods (`createOrUpdateBuildingAccess`) are called by or interact with the central Access Orchestration Service which handles the Pub/Sub dispatch.

**Confidence: Inferred**

---

#### building_activity

- None evidenced in this capability's pack.

---

#### building_door

### Confirmed Integrations
- **Node.js crypto Library**: Used for generating elliptic curve key pairs (`prime256v1`) and exporting them to PEM and JWK formats [Confirmed] (`` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|crypto.generateKeyPairSync|generateKeys|'ec',{             namedCurve: 'prime256v1',         }|#1` ``).

### Architectural Candidates
- None evidenced in this capability's pack.

#### building_intercom

### Pub/Sub Integrations
- **`process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`**: Environment variable defining the target Pub/Sub topic for physical intercom entry updates [Confirmed] (`` `external_hook|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}|#1` ``).
- **`OSKIntercomMessagePublisherService`**: Publishes structured delta messages (`OSKBuildingIntercomPubsubMessage`) to synchronize physical hardware with cloud state [Confirmed] (`` `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts|OSKIntercomMessagePublisherService|publishMessageIntercomUpdate|#1` ``).

### Environment Variables
- **`OSK_FIREBASE_EMULATOR`**: Used to conditionally bypass App Check enforcement during local development or testing [Confirmed] (`` `call_expression|building|functions/src/modules/building/modules/building_intercom/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

---

#### building_pincode

No external hooks, Pub/Sub topics, or external integrations are evidenced within this capability's pack.

---

#### building_pincode_trash

No external hooks, Pub/Sub topics, or environment variables are directly evidenced within this capability's pack [Confirmed].

---

#### building_settings

No external hooks, Pub/Sub topics, environment variables, or external storage paths are directly evidenced within this capability's pack. [Confirmed]

#### building_unit

- **Email Dispatch**: The `deleteBuildingUnit` service method logs an informational message indicating that a "unit removed" email is sent to the user `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit.service.ts|OSKBuildingUnitService.logger.logInfo|deleteBuildingUnit|`Sending user with id: ${user.userId} a unit removed email.`,{ userId: user.userId, userEmail: user.email }|#1` ``. This indicates a candidate integration with an external email delivery system. [Inferred]
- No direct Pub/Sub publishers, environment variables, or storage paths are explicitly evidenced in this capability pack. [Confirmed]

#### building_unit_nonAppUser

- **Pub/Sub Integration**: When access is updated or deleted, the capability publishes messages to all Access Control Devices (ACDs) using `OSKAccessMessagePublisherService.publishMessageToAllACDs` `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|updateNonAppUserAccessDoors|...` ``. This is a confirmed asynchronous integration that pushes state changes down to physical hardware modems.

---

#### building_user

- **App Check**: Enforced on the callable function `createBuildingUser` via `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR` (Confirmed, `` `call_expression|building|functions/src/modules/building/modules/building_user/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

### 12. Architectural Observations

- **The Paired Document Pattern (Dual-Writes)**: The module heavily relies on denormalized dual-writes to maintain high availability for edge devices (**Inferred**). For example, when a non-app user's access is updated, `building_unit_nonAppUser` writes to the unit-scoped `nonAppUsers` subcollection and immediately propagates the change to the building-wide `/buildings/{buildingId}/accesses` ledger and `/buildings/{buildingId}/pincodes` registry (**Confirmed**). This ensures that edge devices (which poll building-level collections) receive the updates asynchronously without querying nested unit structures (**Inferred**).
- **Bypassed Security Layering**: By routing all sensitive credential operations (PIN generation, access ledgers) through backend Cloud Functions that extend `OSKDocumentController`, the platform completely bypasses client-side Firestore Security Rules for these collections (**Inferred**). This places the entire burden of security enforcement on application-level decorators (like `@OSKUserSecurityChecks`), making the absence of explicit RBAC checks in those submodules a critical architectural characteristic (**Inferred**).
- **High Internal Coupling**: The tight coupling between `building_unit`, `building_door`, `building_intercom`, and `building_settings` reflects the nested physical reality of the domain (Buildings contain Doors and Units; Units contain Inhabitants; Intercoms route to Units) (**Inferred**). However, this results in cascading side effects, such as door deletions automatically triggering access revocations across multiple submodules (**Confirmed**).

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Critical RBAC Mismatch**: The permission string `v1.org.buildings.createManager` is actively checked in `building_door` during door deletion but is completely missing from the platform's RBAC roles schema (`rbac-roles.json`) (**Confirmed**). This could lead to authorization failures or unintended access blocks in production (**Inferred**).
- **Access Credential Security Gap**: Highly sensitive submodules managing physical access credentials (`building_pincode`, `building_accesses`, `building_unit_nonAppUser`) lack explicit RBAC permission string checks in their service/controller code (**Confirmed**). If the `@OSKUserSecurityChecks` decorator does not internally enforce strict role validation, these endpoints could be vulnerable to privilege escalation (**Inferred**).
- **Conceptual Permission Overload**: `building_user` uses building-creation permissions (`v1.admin.building.register` and `v1.org.buildings.create`) to guard user-to-building associations (**Confirmed**). This conceptual overload makes it difficult to grant a user the ability to manage building occupants without also granting them the ability to register new buildings (**Inferred**).
- **Firestore Rules Silent Block**: There are no explicit rules defined in `firestore.rules.txt` for `/buildings/{buildingId}/pincodes`, `/buildings/{buildingId}/accesses`, or `/buildings/{buildingId}/units/{unitId}/nonAppUsers` (**Confirmed**). While this safely blocks direct client-side access via the default `allow read, write: if false;` rule, it forces all client interactions to route through backend Cloud Functions, where security rules are bypassed entirely (**Inferred**).

**Per-capability open questions:**

#### _module_root

- Does `deleteBuilding` require a specific RBAC permission? The service method `deleteBuilding` enforces authentication and App Check but does not explicitly check a permission string in the provided evidence. (**Inferred**)
- What is the exact structure of `buildingInputParams` used in `assigningBuildingToProperty`? It is typed as `Partial<OSKBuilding>`, but the exact fields required by the property's nested `buildings` array are not fully detailed in this capability's models. (**Inferred**)

#### building_accesses

- **Client-Side Access Restrictions**: Since there are no explicit rules in `firestore.rules.txt` for the `/buildings/{buildingId}/accesses` subcollection, is client-side direct read/write access completely blocked by the default rule (`allow read, write: if false;`), meaning all access must go through Cloud Functions?
- **Orchestration of Dual-Writes**: Does `OSKBuildingAccessService` automatically trigger the corresponding write to `/users/{userId}/accesses`, or is that dual-write coordinated by a higher-level orchestration service?
- **Implicit RBAC Checks**: Does the base class `OSKDocumentController` perform any implicit RBAC permission checks when methods like `create` or `deletePerUser` are invoked?

**Confidence: Confirmed**

#### building_activity

- **Exact Firestore Collection Path**: The exact string template for the collection path returned by `OSKBuildingActivitiesController.getCollectionPath(buildingId, doorId)` is not explicitly defined in the evidence pack, though it is inferred to be `buildings/{buildingId}/doors/{doorId}/activities` or `buildings/{buildingId}/doors/{doorId}/logs`.
- **Enrichment Details**: The exact properties added during the enrichment phase are managed by the `access_control_device` module's enrichment service and are not visible within this capability's evidence.

#### building_door

- Why is the permission string `v1.org.buildings.createManager` checked during the `deleteBuildingDoor` operation, and why is it missing from the `rbac-roles.json` document? [Unknown]
- Are there any other submodules or capabilities that depend on `building_door`? (Inbound coupling is not visible in this capability's evidence pack). [Unknown]

#### building_intercom

- What are the exact response schemas for the callable functions `deleteIntercomDisplayName`, `onUpdateBuildingIntercomsTransferList`, and `updateIntercomDisplayName`? The evidence pack does not contain `model_property` facts mapping their return types [Unknown].
- Are there any Firestore triggers directly defined within this capability submodule? The evidence pack contains no `firestore_trigger` facts, suggesting they are either absent or defined elsewhere [Unknown].

#### building_pincode

### Edge Synchronization Orchestration
The architecture document states: *"Once created, the cloud binds the alphanumeric string to a specific user entity and pushes the payload down through the GCP Pub/Sub and MongoDB pipeline to the designated building's ACDs."* However, there is no direct evidence of Pub/Sub publishing or MongoDB dual-write within the `building_pincode` submodule itself. This orchestration likely happens in a separate access-provisioning orchestration layer or via Firestore triggers in another capability/module.

### Client-Side Access
As analyzed in Section 7, there are no explicit rules for the `/buildings/{buildingId}/pincodes` subcollection in `firestore.rules.txt`. It remains an open question whether any client-side read access is intended, or if all PIN code retrievals must route through the backend Cloud Functions.

#### building_pincode_trash

- **Exact Collection Path**: What is the exact string returned by `getCollectionPath`? (e.g., is it `/buildings/{buildingId}/pincodes_trash` or `/pincodes_trash`?)
- **Trash Statuses**: What are the valid string/enum values for `OSKPincodeTrashStatus`?
- **Purge Mechanism**: Is there an asynchronous cron job or Firestore TTL policy that automatically deletes documents once they pass their `expirationDate`?

#### building_settings

- **Static Document ID**: `OSKBuildingSettingsController` references `OSKBuildingSettingsController.default.DOCUMENT_ID` when setting and updating settings `` `call_expression|building|functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts|OSKBuildingSettingsController.default._set|set|collectionPath,OSKBuildingSettingsController.default.DOCUMENT_ID,document|#1` ``. The literal value of this static identifier is not defined in the evidence pack, though it is inferred to be a static string (e.g., `"settings"` or `"default"`) to ensure there is only one settings document per building. [Unknown]

#### building_unit

- **Email Dispatch Mechanism**: How is the "unit removed" email actually dispatched? Is it handled synchronously within `deleteBuildingUnit` or via a Firestore trigger/PubSub event in another capability?
- **Cascading Deletions**: When a building unit is deleted, does the system automatically clean up all associated subcollections (such as `doors`, `inhabitants`, `permanentGuests`, and `invitations`)? The `OSKBuildingUnitController` contains a `deleteCollection` helper `` `controller_method|building|functions/src/modules/building/modules/building_unit/controllers/building_unit|deleteCollection|#1` ``, but the exact orchestration of cascading deletions is not fully detailed in the evidence.
- **Invitation Path Resolution**: What is the exact Firestore path for inhabitant invitations? The controller uses `getCollectionPath` but the exact string is not hardcoded in the visible call expressions.

#### building_unit_nonAppUser

- How does the `@OSKUserSecurityChecks` decorator resolve the caller's authority (e.g., verifying if they are a ResidentAdmin of the specific `unitId` or a Property Manager)? The implementation of this decorator is outside the module boundary.
- Are non-app users strictly limited to permanent access, or does the system support scheduled/temporary access for them? The request model `OSKCreateNonAppUserAccessRequest` contains `startDate` and `endDate`, but the internal method `_createNonAppUserAccess` hardcodes `[{ validity: 'permanent', isValidOnce: false }]` in some flows `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKBuildingUnitNonAppUserService._createNonAppUserAccess|createNonAppUserAccess|...` ``.

#### building_user

- **Trigger Definition**: What is the exact trigger definition for `onDocumentDeleted`? The evidence shows the service method but not the Firestore trigger registration itself. (Unknown)
- **Response Type**: What is the exact response type of the `createBuildingUser` callable function? (Unknown)

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.