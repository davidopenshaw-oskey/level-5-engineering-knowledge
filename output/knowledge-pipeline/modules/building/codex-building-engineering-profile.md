# Module Engineering Profile: building

## 1. Executive Summary

### Interpretation

The building module is the OSkey backend module for the Building scope: the physical structure below a Property and above Units. Evidence indicates that it owns the primary `/buildings` document model and a broad set of building-scoped subcollections for doors, units, intercom directories, building settings, building-level access ledgers, pincodes, non-app users and activity records.

Architecture grounding places Building as the primary physical anchor for Access Control Devices (ACDs), active door-locking mechanisms and shared infrastructure such as lobby doors and service entrances. The current implementation reflects that role by combining structural administration services, Firestore controllers, denormalized access ledgers, intercom publication hooks and ACD assignment triggers.

### Evidence Used

- Architecture: Building is a distinct physical structure within a Property and is the primary physical anchor for ACDs and active door-locking mechanisms; source `Oskey Architecture.md`.
- Architecture: Unit is a logical administrative container within a Building; physical ACDs are not assigned directly to Unit scope and look up to Building scope; source `Oskey Architecture.md`.
- Manifest: `building-manifest.json` reports 89 files, 42 classes, 275 methods, 20 services, 22 controllers, 17 Firestore hints, 47 permission hints and 24 external hooks.
- Firestore Path: `/buildings`, confirmed in `building-evidence.json` from `OSKBuildingController` and in `firestore-schema.md`.
- Controller: `OSKBuildingController`.
- Service: `OSKBuildingService`.
- Firestore Paths: `/buildings/{id}/doors`, `/buildings/{id}/units`, `/buildings/{id}/accesses`, `/buildings/{id}/intercoms`, `/buildings/{id}/callTransferList`, `/buildings/{id}/pincodes`, `/buildings/{id}/settings`.

### Confidence

High for module purpose, Firestore anchoring and service/controller structure. Medium for broader hardware synchronization because some external paths are candidate hooks or architecture-grounded rather than fully proven by the building AST evidence alone.

---

## 2. Architectural Position

Include:

- Parent scope: Property, with Organization also present on building documents through `organizationId`.
- Owned concepts: Building document, building doors, building units, building users, building settings, building access ledger, building pincodes, building intercom directory entries, call transfer lists, building activities and non-app users under building/unit scope.
- Provided capabilities: Building lifecycle administration, door lifecycle administration, unit lifecycle administration, default/resident settings, building-scoped access aggregation, building-scoped PIN records, intercom directory maintenance, non-app user access support, activity persistence and image upload/delete support.
- Downstream consumers or candidate consumers: PGO callable functions, mobile user settings/access views, ACD/intercom hardware sync consumers, Pub/Sub intercom entry consumers, user module denormalized settings/intercom/access documents, organization/property listing views.
- Confidence: High for Firestore and service/module position; medium for downstream consumers where evidence is a candidate hook.

### Interpretation

The module sits in the GCP Cloud Functions backend layer. Architecture grounding says backend modules mirror Firestore collection layout and Firebase Security Rules. The building module matches this pattern: controllers encapsulate Firestore collection paths and services expose callable or trigger-oriented operations around those controllers.

The module is not only a CRUD boundary for `/buildings`. It is a building-scope aggregate module that coordinates subdomains directly nested under a building. That includes physical access points (`doors`), logical space containers (`units`), device-facing views (`intercoms`, `pincodes`, `accesses`) and policy state (`settings`).

### Evidence Used

- Architecture: GCP Cloud Functions are modularized by domain modules such as `/buildings`, and code modularization mirrors Firestore collection layout and Security Rules.
- Schema: `/buildings` contains `buildingId`, `propertyId`, `organizationId`, `name`, `streetAddress.*`, `creationDate` and `imageFilename`.
- Schema: `/buildings/{id}/doors` contains `buildingId`, `doorId`, `name`, `isForAllResidents`, `streetAddress.*` and `creationDate`.
- Schema: `/buildings/{id}/units` contains `unitId`, `buildingId`, `buildingName`, `unitNumber`, `floor`, `streetAddress.*`, `creationDate` and `modificationDate`.
- Schema: `/buildings/{id}/settings` contains resident and invitation settings including `accessMethods.value.bluetooth`, `accessMethods.value.pinCode`, `accessMethods.value.faceRec`, `accessMethods.value.NFC`.
- Controller: `OSKBuildingController`.
- Controller: `OSKBuildingDoorController`.
- Controller: `OSKBuildingUnitController`.
- Controller: `OSKBuildingSettingsController`.
- Controller: `OSKBuildingIntercomController`.
- Controller: `OSKBuildingAccessesController`.
- Controller: `OSKBuildingPincodeController`.
- Evidence artefact: `building-evidence-graph.json` counts 181 controller methods, 94 service methods and 3 direct Firestore path facts.

### Confidence

High.

---

## 3. Primary Responsibilities

- Capability: Building lifecycle and listing
- Implemented by:
 * Controller: `OSKBuildingController`
 * Service: `OSKBuildingService`
 * Representative Service Method: `createOrganizationBuilding`, `updateBuilding`, `deleteBuilding`, `getBuildingById`, `getBuildingsByPropertyId`
- Evidence:
- Service Method: `OSKBuildingService.createOrganizationBuilding`
- Service Method: `OSKBuildingService.updateBuilding`
- Service Method: `OSKBuildingService.deleteBuilding`
- Controller Method: `OSKBuildingController.save`
- Controller Method: `OSKBuildingController.update`
- Controller Method: `OSKBuildingController.delete`
- Permission: `v1.org.buildings.view`, `v1.org.buildings.create`, `v1.org.buildings.edit`
- Firestore Path: `/buildings`
- Confidence: High

- Capability: Door lifecycle and access-point administration
- Implemented by:
 * Controller: `OSKBuildingDoorController`
 * Service: `OSKBuildingDoorService`
 * Representative Service Method: `organizationUserCreateBuildingDoor`, `organizationUserUpdateBuildingDoor`, `deleteBuildingDoor`
- Evidence:
- Service Method: `OSKBuildingDoorService.organizationUserGetAllBuildingDoors`
- Service Method: `OSKBuildingDoorService.organizationUserCreateBuildingDoor`
- Service Method: `OSKBuildingDoorService.organizationUserUpdateBuildingDoor`
- Service Method: `OSKBuildingDoorService.deleteBuildingDoor`
- Controller Method: `OSKBuildingDoorController.save`
- Controller Method: `OSKBuildingDoorController.update`
- Controller Method: `OSKBuildingDoorController.delete`
- Firestore Path: `/buildings/{id}/doors`
- Permission: `v1.org.buildings.view`, `v1.org.buildings.edit`
- Confidence: High

- Capability: Unit lifecycle and unit-to-building containment
- Implemented by:
 * Controller: `OSKBuildingUnitController`
 * Service: `OSKBuildingUnitService`
 * Representative Service Method: `organizationUserCreateBuildingUnit`, `organizationUserUpdateBuildingUnit`, `deleteBuildingUnit`
- Evidence:
- Service Method: `OSKBuildingUnitService.organizationUserGetAllBuildingUnits`
- Service Method: `OSKBuildingUnitService.organizationUserCreateBuildingUnit`
- Service Method: `OSKBuildingUnitService.organizationUserUpdateBuildingUnit`
- Service Method: `OSKBuildingUnitService.deleteBuildingUnit`
- Controller Method: `OSKBuildingUnitController.create`
- Controller Method: `OSKBuildingUnitController.update`
- Controller Method: `OSKBuildingUnitController.delete`
- Firestore Path: `/buildings/{id}/units`
- Permission: `v1.org.buildings.view`, `v1.org.buildings.edit`, `v1.org.buildings.create`
- Confidence: High

- Capability: Building-scoped access aggregation
- Implemented by:
 * Controller: `OSKBuildingAccessesController`
 * Service: `OSKBuildingAccessService`
 * Representative Service Method: `createOrUpdateBuildingAccess`, `createOrUpdateBuildingAccessForStaffOrNonAppUser`
- Evidence:
- Service Method: `OSKBuildingAccessService.createOrUpdateBuildingAccess`
- Service Method: `OSKBuildingAccessService.createOrUpdateBuildingAccessForStaffOrNonAppUser`
- Controller Method: `OSKBuildingAccessesController.get`
- Controller Method: `OSKBuildingAccessesController.update`
- Controller Method: `OSKBuildingAccessesController.save`
- Call Expression: `FieldValue.arrayUnion(newAccess)` in `building_access.service.ts`.
- Firestore Path: `/buildings/{id}/accesses`
- Confidence: High

- Capability: Building settings and resident/invitation rules
- Implemented by:
 * Controller: `OSKBuildingSettingsController`
 * Service: `OSKBuildingSettingsService`
 * Representative Service Method: `createBuildingSettings`, `getResidentSettings`, `updateBuildingSettings`, `resetBuildingSettings`
- Evidence:
- Service Method: `OSKBuildingSettingsService.createBuildingSettings`
- Service Method: `OSKBuildingSettingsService.getResidentSettings`
- Service Method: `OSKBuildingSettingsService.updateBuildingSettings`
- Controller Method: `OSKBuildingSettingsController.set`
- Controller Method: `OSKBuildingSettingsController.getResidentSettings`
- Controller Method: `OSKBuildingSettingsController.updateBuildingSettings`
- Firestore Path: `/buildings/{id}/settings`
- Permission: `v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete`
- Confidence: High

- Capability: Building intercom directory and call transfer list support
- Implemented by:
 * Controller: `OSKBuildingIntercomController`, `OSKBuildingIntercomCallTransferListController`
 * Service: `OSKBuildingIntercomService`, `OSKBuildingIntercomCallTransferListService`, `OSKIntercomMessagePublisherService`
 * Representative Service Method: `createIntercomEntry`, `addInhabitantInAllIntercoms`, `updateIntercomDisplayName`, `deleteIntercomEntry`, `onUpdateBuildingIntercomsTransferList`
- Evidence:
- Service Method: `OSKBuildingIntercomService.createIntercomEntry`
- Service Method: `OSKBuildingIntercomService.addInhabitantInAllIntercoms`
- Service Method: `OSKBuildingIntercomService.updateIntercomDisplayName`
- Service Method: `OSKBuildingIntercomCallTransferListService.createCallTransferList`
- Service Method: `OSKIntercomMessagePublisherService.publishMessageIntercomCreate`
- Call Expression: `OSKBuildingIntercomController.default.publishMessage`
- Firestore Path: `/buildings/{id}/intercoms`
- Firestore Path: `/buildings/{id}/callTransferList`
- External Hook: environment variable `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`
- Confidence: Medium-high

- Capability: Building pincode persistence
- Implemented by:
 * Controller: `OSKBuildingPincodeController`, `OSKBuildingPincodeTrashController`
 * Service: `OSKBuildingPincodeService`
 * Representative Service Method: `createPincodeInhabitantDocument`, `createPincodeGuestDocument`, `createPincodePermanentGuestDocument`, `createPincodeAnonymousDocument`, `createPincodeSupplierDocument`
- Evidence:
- Service Method: `OSKBuildingPincodeService.createPincodeInhabitantDocument`
- Service Method: `OSKBuildingPincodeService.createPincodeGuestDocument`
- Service Method: `OSKBuildingPincodeService.createPincodeSupplierDocument`
- Controller Method: `OSKBuildingPincodeController.set`
- Controller Method: `OSKBuildingPincodeController.getByAccessId`
- Firestore Path: `/buildings/{id}/pincodes`
- Architecture: PIN codes are used by ACDs for offline keypad validation.
- Confidence: Medium-high

- Capability: Building and non-app user activity persistence
- Implemented by:
 * Controller: `OSKBuildingActivitiesController`, `OSKNonAppUserActivitiesController`, `OSKNonAppUserActivityAggregatesController`
 * Service: `OSKBuildingActivitiesService`, `OSKNonAppUserActivityService`, `OSKNonAppUserActivityAggregatesService`
 * Representative Service Method: `ActivityReceivedForBuilding`, `ActivityReceivedForNonAppUser`
- Evidence:
- Service Method: `OSKBuildingActivitiesService.ActivityReceivedForBuilding`
- Service Method: `OSKNonAppUserActivityService.ActivityReceivedForNonAppUser`
- Controller Method: `OSKBuildingActivitiesController.save`
- Architecture: Hardware write path sends door events to the backend and enriched activity is visible in Firestore.
- Backend architecture document: enriched activity is always written to `/buildings/{buildingId}/activities`.
- Confidence: Medium because `/buildings/{buildingId}/activities` is described in grounding material but not listed in the provided schema excerpt as a confirmed collection path.

### Interpretation

Confirmed evidence shows the module implementing building structure, building substructure, settings, access aggregation, intercom data and several device-adjacent persistence surfaces. Architecture-grounded interpretation is that these responsibilities serve the Building scope as the operational boundary where physical access infrastructure is assembled for both management interfaces and hardware-facing synchronization.

### Evidence Used

- Service: `OSKBuildingService`
- Service: `OSKBuildingDoorService`
- Service: `OSKBuildingUnitService`
- Service: `OSKBuildingAccessService`
- Service: `OSKBuildingSettingsService`
- Service: `OSKBuildingIntercomService`
- Service: `OSKBuildingIntercomCallTransferListService`
- Service: `OSKBuildingPincodeService`
- Controller: `OSKBuildingController`
- Controller: `OSKBuildingDoorController`
- Controller: `OSKBuildingUnitController`
- Controller: `OSKBuildingAccessesController`
- Controller: `OSKBuildingSettingsController`
- Controller: `OSKBuildingIntercomController`
- Controller: `OSKBuildingPincodeController`
- Firestore Path: `/buildings`
- Firestore Path: `/buildings/{id}/doors`
- Firestore Path: `/buildings/{id}/units`
- Firestore Path: `/buildings/{id}/accesses`
- Firestore Path: `/buildings/{id}/settings`
- Firestore Path: `/buildings/{id}/intercoms`
- Firestore Path: `/buildings/{id}/callTransferList`
- Firestore Path: `/buildings/{id}/pincodes`

### Confidence

High for core responsibilities; medium-high for external sync and activity behavior.

---

## 4. Public Interfaces

### Interpretation

The module exposes a large public surface through exported controllers, services, request/response models and trigger factories. The public interface appears to be organized around callable function triggers and Firestore triggers, with services performing parameter validation, user/security checks and orchestration, while controllers provide persistence primitives.

Primary service entry points include:

- `OSKBuildingService`: building listing, retrieval, creation, update, delete, property assignment, image upload/delete and property-scoped listing.
- `OSKBuildingDoorService`: organization-user door listing, retrieval, creation, update and deletion.
- `OSKBuildingUnitService`: organization-user unit listing, retrieval, creation, update and deletion.
- `OSKBuildingSettingsService`: building settings creation, retrieval, update, delete and reset.
- `OSKBuildingIntercomService`: intercom entry creation, inhabitant addition/removal/update and display-name management.
- `OSKBuildingIntercomCallTransferListService`: call transfer list creation, update and append behavior.
- `OSKBuildingAccessService`: create-or-update building access ledger entries for users, staff or non-app users.
- `OSKBuildingPincodeService`: pincode document creation for inhabitant, guest, permanent guest, anonymous and supplier access types.
- `OSKBuildingUnitNonAppUserService`: non-app user lifecycle and non-app user access lifecycle.

### Evidence Used

- Exported Symbol: `getFirestoreTriggers` from `functions/src/modules/building/index.ts`.
- Exported Symbol: `getCallableFunctionTriggers` from `functions/src/modules/building/index.ts`.
- Exported Symbol: `OSKBuildingController`.
- Exported Symbol: `OSKBuildingService`.
- Service Method: `OSKBuildingService.getAllBuildings`
- Service Method: `OSKBuildingService.createOrganizationBuilding`
- Service Method: `OSKBuildingService.updateBuilding`
- Service Method: `OSKBuildingService.deleteBuilding`
- Service Method: `OSKBuildingDoorService.organizationUserCreateBuildingDoor`
- Service Method: `OSKBuildingUnitService.organizationUserCreateBuildingUnit`
- Service Method: `OSKBuildingSettingsService.updateBuildingSettings`
- Service Method: `OSKBuildingIntercomService.createIntercomEntry`
- Service Method: `OSKBuildingUnitNonAppUserService.createNonAppUserWithAccess`
- External Hook: storage path candidate `^buildings/[a-zA-Z0-9-]*/public/images/[a-zA-Z0-9-]*.(png|jpg|jpeg)$`.
- External Hook: HTTP/client path candidate `/buildings`.

### Confidence

High for exported service/controller names and method surfaces. Medium for exact callable names because the supplied evidence confirms service methods and trigger factories, not full deployed Cloud Function endpoint names.

---

## 5. Internal Structure

### Interpretation

The module is internally decomposed into a root building service/controller plus submodules aligned to nested building concepts. Controllers are thin Firestore access layers; services perform application behavior, permission checks and cross-module calls.

The root layer owns `/buildings`, image operations and building-level orchestration. The door layer manages `/buildings/{buildingId}/doors` and ACD assignment triggers. The unit layer owns `/buildings/{buildingId}/units` and contains sub-support for inhabitants, invitations, non-app users, permanent guests and unit doors. Separate access, pincode, settings, intercom and activity submodules provide specialized persistence and orchestration around the building aggregate.

### Evidence Used

- Manifest: 20 services and 22 controllers in the module.
- Controller: `OSKBuildingController` has public methods `getAll`, `get`, `getSafe`, `update`, `queryAllBuildings`, `save`, `delete`, `listDocuments`, `uploadImage`, `deleteImage`, `getBuildingsQueryFilters`.
- Controller: `OSKBuildingDoorController` has public methods `get`, `getSafe`, `getAll`, `getAllSafe`, `getForAllResidents`, `save`, `update`, `delete`, `deleteAll`, `listDocuments`.
- Controller: `OSKBuildingUnitController` has public methods `get`, `getSafe`, `getAll`, `create`, `save`, `update`, `delete`, `deleteAll`, `deleteCollection`, `listDocuments`.
- Controller: `OSKBuildingAccessesController` has public methods `get`, `getSafe`, `getAll`, `getAllSafe`, `save`, `create`, `update`, `deletePerUser`, `deleteAll`, `listDocuments`.
- Controller: `OSKBuildingIntercomController` has public methods `create`, `get`, `getSafe`, `getAllIntercomByBuilding`, `update`, `delete`, `publishMessage`.
- Controller: `OSKBuildingSettingsController` has public methods `set`, `get`, `getResidentSettings`, `getResidentSettingsSafe`, `updateBuildingSettings`, `delete`.
- Service: `OSKBuildingUnitNonAppUserService` includes lifecycle methods and access side-effect methods including `createNonAppUserAccess`, `updateNonAppUserAccessDoors`, `deleteNonAppUserAccess`, `_deleteAccessSideEffects`.
- Cross-module Dependency: `OSKBuildingUnitInhabitantService` imports `OSKUserSettingsBuildingService`.
- Cross-module Dependency: `OSKBuildingUnitInhabitantService` imports `OSKUserSettingsUnitService`.

### Confidence

High.

---

## 6. Firestore & Data Ownership

### Interpretation

Primary persistence is the `/buildings` collection and its confirmed nested building-scoped collections. Evidence supports the building module as owner or direct writer for several building-scoped paths. Some denormalized structures are also present and should be treated as candidate or confirmed fan-out depending on the source.

Primary persistence:

- `/buildings`
- `/buildings/{id}/doors`
- `/buildings/{id}/units`
- `/buildings/{id}/settings`

Confirmed collection paths:

- `/buildings`
- `/buildings/{id}/doors`
- `/buildings/{id}/settings`
- `/buildings/{id}/accesses`
- `/buildings/{id}/callTransferList`
- `/buildings/{id}/intercoms`
- `/buildings/{id}/pincodes`
- `/buildings/{id}/units`
- `/buildings/{id}/units/{id}/inhabitants`

Confirmed nested structures:

- Doors are nested under buildings and contain `isForAllResidents`.
- Units are nested under buildings and carry denormalized `buildingName` and `streetAddress`.
- Inhabitants are nested under units and include `doors`, `inhabitantType`, user identity fields and building/unit identifiers.
- Building access documents aggregate an `accesses` array by user under a building.
- Intercom documents aggregate `intercomEntries` by ACD under a building.
- Call transfer list documents contain a `callTransferList` array.
- Building pincode documents contain `doors`, `pincode`, `userId`, `type`, `unitId`, `buildingId` and `accessId`.

Candidate or confirmed denormalized structures:

- Confirmed by architecture grounding: building access ledgers are paired with `/users/{userId}/accesses/{buildingId}`.
- Confirmed by backend architecture grounding: building creation fans out lightweight building data to `/organizations/{organizationId}/buildings` and the parent property document.
- Confirmed by AST call evidence: building access appends new access entries with `FieldValue.arrayUnion(newAccess)` in `/buildings/{buildingId}/accesses/{userId}`.
- Confirmed by AST call evidence: door updates call `OSKAccessUpdateService.updateUserAccessesDoorInfo`; door deletion calls `OSKAccessUpdateService.removeDoorFromUserAccesses`.
- Candidate from architecture grounding: building pincode records pair with user or supplier pincode documents and hardware-facing read paths.

Candidate fan-out targets:

- `/users/{userId}/accesses/{buildingId}`
- `/organizations/{organizationId}/buildings`
- `/properties/{propertyId}` building arrays
- `/users/{userId}/buildingSettings/{buildingId}`
- `/users/{userId}/buildingSettings/{buildingId}/unitSettings/{unitId}`
- `/users/{userId}/intercoms/{accessControlDeviceId}`
- `/accessControlDevices/{id}/configs`
- Pub/Sub topic represented by `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`

### Evidence Used

- Schema: `/buildings` fields include `buildingId`, `propertyId`, `organizationId`, `name`, `streetAddress.*`, `creationDate`, `imageFilename`.
- Schema: `/buildings/{id}/doors` fields include `buildingId`, `doorId`, `name`, `isForAllResidents`, `streetAddress.*`, `creationDate`.
- Schema: `/buildings/{id}/settings` fields include `buildingId.value`, `accessMethods.value.bluetooth`, `accessMethods.value.pinCode`, `accessMethods.value.faceRec`, `accessMethods.value.NFC`.
- Schema: `/buildings/{id}/accesses` fields include `buildingId`, `userId`, `userLastName`, `userFirstName`, `accesses`.
- Schema: `/buildings/{id}/intercoms` fields include `accessControlDeviceId`, `buildingId`, `doorId`, `ACDName`, `doorName`, `intercomEntries`.
- Schema: `/buildings/{id}/callTransferList` fields include `buildingId`, `intercomId`, `unitId`, `callTransferList`.
- Schema: `/buildings/{id}/pincodes` fields include `doors`, `pincode`, `userId`, `type`, `unitId`, `buildingId`, `accessId`.
- Schema: `/buildings/{id}/units` fields include `unitId`, `buildingId`, `buildingName`, `unitNumber`, `floor`, `streetAddress.*`.
- Schema: `/buildings/{id}/units/{id}/inhabitants` fields include `userId`, `inhabitantAccessId`, `firstName`, `lastName`, `doors`, `inhabitantType`.
- Call Expression: `OSKBuildingAccessesController.default.get(buildingId, userId)`.
- Call Expression: `OSKBuildingAccessesController.default.update(buildingId, userId, { accesses: FieldValue.arrayUnion(newAccess) })`.
- Call Expression: `OSKBuildingAccessesController.default.save(buildingId, userId, newBuildingAccess)`.
- Call Expression: `OSKAccessUpdateService.updateUserAccessesDoorInfo(oldBuildingDoor, doorInfo)`.
- Call Expression: `OSKAccessUpdateService.removeDoorFromUserAccesses(request.doorId, request.buildingId)`.
- Firestore Rules: `/buildings/{buildingId}` allows read/write when `isValidUser()`.
- Firestore Rules: `/buildings/{buildingId}/units/{unitId}` uses `canViewBuilding(buildingId)` and `canEditBuilding(buildingId)`.

### Confidence

High for confirmed schema paths. Medium for candidate fan-out targets where grounding documents describe the behavior but AST evidence is partial in the supplied module artifacts.

---

## 7. Permissions & Security

### Interpretation

Security is enforced in two layers: Firestore rules and service-level role checks. The service layer uses organization user lookup and consolidated role checks for organization-level building operations. Firestore rules include broader direct access rules for `/buildings` and more constrained unit read/write checks using `canViewBuilding`, `canEditBuilding`, `canViewOrganizationBuilding` and `canEditOrganizationBuilding`.

The building module checks production `v1.org.*` permissions for building and settings operations. It also contains references to `v1.admin.*` permissions; contract guidance says `v1.admin` roles are work in progress and not currently implemented, so those should be treated as implementation evidence but not as production RBAC behavior.

One conflict is visible: AST evidence references `v1.org.buildings.createManager` in `OSKBuildingDoorService.deleteBuildingDoor`, but the supplied RBAC role reference lists `v1.org.buildings.list`, `view`, `create`, `edit` and `delete`, not `createManager`.

### Evidence Used

- Permission: `v1.org.buildings.view` in `building.service.ts` and `building_door.service.ts`.
- Permission: `v1.org.buildings.create` in `building.service.ts`, `building_unit.service.ts`, `building_unit_door.service.ts`, `building_user.service.ts`.
- Permission: `v1.org.buildings.edit` in `building.service.ts`, `building_door.service.ts`, `building_unit.service.ts`.
- Permission: `v1.org.buildings.createManager` in `building_door.service.ts`.
- Permission: `v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete` in `building_settings.service.ts`.
- Permission: `v1.admin.accessControlDevice.edit` in `building_intercom_inhabitant.service.ts`.
- Permission: `v1.admin.building.register` in `building_user.service.ts`.
- RBAC: `v1.org.buildings.admin` contains `v1.org.buildings.list`, `v1.org.buildings.view`, `v1.org.buildings.create`, `v1.org.buildings.edit`, `v1.org.buildings.delete`.
- RBAC: `v1.org.settings.admin` contains `v1.org.settings.list`, `v1.org.settings.view`, `v1.org.settings.create`, `v1.org.settings.edit`, `v1.org.settings.delete`.
- Firestore Rules: `canEditBuilding(buildingId)` checks `v1.org.buildings.edit`.
- Firestore Rules: `canViewBuilding(buildingId)` checks `v1.org.buildings.view`.
- Firestore Rules: `canEditOrganizationBuilding(organizationId, buildingId)` checks `v1.org.buildings.edit`.
- Firestore Rules: `canViewOrganizationBuilding(organizationId, buildingId)` checks `v1.org.buildings.view`.
- Call Expression: `OSKConsolidatedRolesController.default.checkUserPermissions`.
- Call Expression: `OSKOrganizationUserUtils.getOrganizationUser`.
- Call Expression: `OSKOrganizationUserController.default.get`.

### Confidence

High for listed permission evidence. Medium for complete enforcement semantics because some Firestore rules allow broad `isValidUser()` access on root building and door paths, while service methods enforce more specific permissions.

---

## 8. Cross-Module Relationships

### Interpretation

The module is strongly connected to access, user, organization, property, settings, ACD and intercom behavior. Direct evidence supports imports and calls into user settings, organization users, consolidated roles, access update services and ACD configuration/intercom publication paths. These are relationships, not full workflow descriptions.

### Evidence Used

- Cross-module Dependency: `OSKBuildingUnitInhabitantService` imports `OSKUserSettingsBuildingService` from the user module.
- Cross-module Dependency: `OSKBuildingUnitInhabitantService` imports `OSKUserSettingsUnitService` from the user module.
- Cross-module Dependency: `OSKBuildingService` imports `OSKBuildingUnitController`.
- Cross-module Dependency: `OSKBuildingService` imports `getBuildingSettingsDefaultDocumentData`.
- Call Expression: `OSKAccessUpdateService.updateUserAccessesDoorInfo`.
- Call Expression: `OSKAccessUpdateService.removeDoorFromUserAccesses`.
- Call Expression: `OSKOrganizationUserUtils.getOrganizationUser`.
- Call Expression: `OSKOrganizationUserController.default.get`.
- Call Expression: `OSKConsolidatedRolesController.default.checkUserPermissions`.
- Backend architecture: building creation fans out to `/organizations/{organizationId}/buildings` and `/properties/{propertyId}`.
- Backend architecture: access orchestration writes building-centric access documents at `/buildings/{buildingId}/accesses/{userId}`.
- Backend architecture: intercom updates denormalize to `/users/{userId}/intercoms`.
- Backend architecture: building settings denormalize to `/users/{userId}/buildingSettings/{buildingId}`.

### Confidence

Medium-high. Direct import/call evidence is high confidence; broader fan-out relationships are medium where they are grounded in architecture documents rather than fully proven by the supplied AST evidence.

---

## 9. External Hooks

### Interpretation

Confirmed external or boundary-facing hooks include storage path handling for building images, emulator environment switches, an HTTP/client path candidate for `/buildings`, a device assignment trigger path, and a Pub/Sub topic environment variable for ACD intercom entries. The architecture documents also describe ACD hardware sync, Pub/Sub, Cloud Run and MongoDB as part of the wider platform. For this module profile, those broader integrations should remain candidate external boundaries unless tied to a concrete module hook.

### Evidence Used

- External Hook: HTTP/client path candidate `/buildings` in `building.controller.ts`.
- External Hook: storage path candidate `^buildings/[a-zA-Z0-9-]*/public/images/[a-zA-Z0-9-]*.(png|jpg|jpeg)$` in `building/index.ts`.
- External Hook: HTTP/client path candidate `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` in `building_door/index.ts`.
- External Hook: environment variable `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` in `building_intercom.controller.ts`.
- External Hook: environment variable `OSK_FIREBASE_EMULATOR` in building root, activity, door, intercom, settings, unit, non-app user and building user index/service files.
- Controller Method: `OSKBuildingIntercomController.publishMessage`.
- Service Method: `OSKIntercomMessagePublisherService.publishMessageIntercomCreate`.
- Service Method: `OSKIntercomMessagePublisherService.publishMessageIntercomUpdate`.
- Service Method: `OSKIntercomMessagePublisherService.publishMessageIntercomDelete`.
- Architecture: ACDs are building-level hardware and synchronize with cloud state through server-side pipelines.
- Architecture: Pub/Sub and Cloud Run are used in the broader hardware synchronization pipeline.

### Confidence

Medium. The named environment variables and path candidates are confirmed by evidence. The complete hardware sync topology is architecture-grounded but not fully evidenced inside this module alone.

---

## 10. Architectural Observations

### Interpretation

The module follows an aggregate-root pattern around Building scope. Firestore controllers centralize persistence paths and services coordinate security checks, validation, denormalization and downstream updates. Evidence indicates deliberate NoSQL denormalization: building-level access ledgers aggregate user access entries; pincode documents are optimized for building/device validation; intercom entries aggregate directory state by ACD; user settings and intercom views are fed from building-scope changes.

Separation of concerns is visible between controllers and services. Coupling is also visible: building services call user, organization, settings, access update and ACD/intercom infrastructure. That coupling appears intentional because Building is the physical anchor for access-control state, but it means the module participates in several cross-module consistency paths.

The access ledger uses an append-style aggregation model with `FieldValue.arrayUnion(newAccess)`. This supports the architecture description of denormalized access ledgers, but it also raises open questions about array growth, mutation granularity and conflict handling that are not answered by the supplied evidence.

### Evidence Used

- Architecture: Firestore maintains user accounts, unit structural configurations, lease timelines and active security rules.
- Architecture: Building scope is the primary physical anchor for ACDs and active door-locking mechanisms.
- Controller: `OSKBuildingController`
- Controller: `OSKBuildingDoorController`
- Controller: `OSKBuildingUnitController`
- Controller: `OSKBuildingAccessesController`
- Service: `OSKBuildingService`
- Service: `OSKBuildingDoorService`
- Service: `OSKBuildingUnitService`
- Service: `OSKBuildingAccessService`
- Call Expression: `OSKBuildingAccessesController.default.update(... FieldValue.arrayUnion(newAccess) ...)`.
- Call Expression: `OSKBuildingDoorController.default.update(request.buildingId, request.doorId, dataToUpdate)`.
- Call Expression: `OSKAccessUpdateService.updateUserAccessesDoorInfo(oldBuildingDoor, doorInfo)`.
- Call Expression: `OSKBuildingIntercomController.default.publishMessage(intercomDoc.accessControlDeviceId, payload)`.
- Firestore Path: `/buildings/{id}/accesses`
- Firestore Path: `/buildings/{id}/pincodes`
- Firestore Path: `/buildings/{id}/intercoms`
- Firestore Path: `/buildings/{id}/settings`

### Confidence

Medium-high.

---

## 11. Risks & Open Questions

### Interpretation

Several uncertainties should be preserved for later pipeline passes:

- Permission conflict: `v1.org.buildings.createManager` appears in AST permission evidence but is not present in the supplied RBAC role reference.
- Firestore rule breadth: root `/buildings` and `/buildings/{buildingId}/doors` rules allow read/write for `isValidUser()`, while services enforce more specific organization roles. Requires confirmation of intended client access pattern.
- Activity persistence: backend architecture says enriched activity is written to `/buildings/{buildingId}/activities`; module evidence includes building activity controllers/services, but the supplied schema excerpts do not list `/buildings/{id}/activities`.
- ACD config writes: backend architecture describes fan-out to `/accessControlDevices/{id}/configs`; building module evidence confirms device assignment and intercom publication hooks, but complete downstream config update behavior should be confirmed from ACD module evidence.
- Non-app user storage paths are represented by controllers and services, but the supplied schema excerpt does not clearly list all non-app user collection paths under buildings/units.
- Building ownership boundary between `/buildings`, `/organizations/{organizationId}/buildings` and `/properties/{propertyId}` should remain as denormalized relationship evidence rather than assumed sole ownership.
- The module has large public surface area: 20 services and 22 controllers. No quality conclusion should be drawn without source-level review, which is out of scope for this task.

### Evidence Used

- Permission: `v1.org.buildings.createManager` in `building_door.service.ts`.
- RBAC: `v1.org.buildings.admin` lists `list`, `view`, `create`, `edit`, `delete`, but not `createManager`.
- Firestore Rules: `/buildings/{buildingId}` allows read/write if `isValidUser()`.
- Firestore Rules: `/buildings/{buildingId}/doors/{doorId}` allows read/write if `isValidUser()`.
- Firestore Rules: `/buildings/{buildingId}/units/{unitId}` uses `canViewBuilding` and `canEditBuilding`.
- Service: `OSKBuildingActivitiesService.ActivityReceivedForBuilding`.
- Controller: `OSKBuildingActivitiesController.save`.
- Backend architecture: enriched activity is always written to `/buildings/{buildingId}/activities`.
- External Hook: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`.
- External Hook: `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`.
- Manifest: 20 services, 22 controllers, 275 methods.

### Confidence

High for the existence of these open questions. Low for any answer to them within Pass 1 scope.

---

## 12. Evidence References

- `ai-runtime/contracts/module-engineering-profile/contract.md`
- `ai-runtime/contracts/module-engineering-profile/work-order.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/firestore.indexes.json`
- `ai-runtime/contracts/docs/rbac-roles.json`
- `output/knowledge-pipeline/modules/building/building-manifest.json`
- `output/knowledge-pipeline/modules/building/building-evidence.json`
- `output/knowledge-pipeline/modules/building/building-evidence-graph.json`
- `output/knowledge-pipeline/modules/building/building-controllers.json`
- `output/knowledge-pipeline/modules/building/building-services.json`
- Architecture: Building is the physical anchor for ACDs and active door-locking mechanisms.
- Architecture: Units are logical administrative containers inside Buildings.
- Architecture: GCP Cloud Functions modules mirror Firestore collection layout and Firebase Security Rules.
- Schema: `/buildings`
- Schema: `/buildings/{id}/doors`
- Schema: `/buildings/{id}/settings`
- Schema: `/buildings/{id}/accesses`
- Schema: `/buildings/{id}/callTransferList`
- Schema: `/buildings/{id}/intercoms`
- Schema: `/buildings/{id}/pincodes`
- Schema: `/buildings/{id}/units`
- Schema: `/buildings/{id}/units/{id}/inhabitants`
- Firestore Rules: `/buildings/{buildingId}`
- Firestore Rules: `/buildings/{buildingId}/doors/{doorId}`
- Firestore Rules: `/buildings/{buildingId}/units/{unitId}`
- Firestore Rules: `/organizations/{organizationId}/buildings/{buildingId}`
- RBAC: `v1.org.buildings.admin`
- RBAC: `v1.org.settings.admin`
- Controller: `OSKBuildingController`
- Controller: `OSKBuildingDoorController`
- Controller: `OSKBuildingDoorAccessControlDeviceController`
- Controller: `OSKBuildingDoorAccessControlDeviceKeysController`
- Controller: `OSKBuildingUnitController`
- Controller: `OSKBuildingUnitDoorController`
- Controller: `OSKBuildingUnitInhabitantController`
- Controller: `OSKBuildingUnitInvitationController`
- Controller: `OSKBuildingUnitPermanentGuestController`
- Controller: `OSKBuildingUnitNonAppUserController`
- Controller: `OSKBuildingAccessesController`
- Controller: `OSKBuildingActivitiesController`
- Controller: `OSKBuildingSettingsController`
- Controller: `OSKBuildingIntercomController`
- Controller: `OSKBuildingIntercomCallTransferListController`
- Controller: `OSKBuildingPincodeController`
- Controller: `OSKBuildingPincodeTrashController`
- Controller: `OSKBuildingUserController`
- Controller: `OSKNonAppUserAccessController`
- Controller: `OSKNonAppUserActivitiesController`
- Controller: `OSKNonAppUserActivityAggregatesController`
- Controller: `OSKNonAppUserPincodeController`
- Service: `OSKBuildingService`
- Service: `OSKBuildingDoorService`
- Service: `OSKBuildingDoorAccessControlDeviceService`
- Service: `OSKBuildingUnitService`
- Service: `OSKBuildingUnitDoorService`
- Service: `OSKBuildingUnitInhabitantService`
- Service: `OSKBuildingUnitNonAppUserService`
- Service: `OSKBuildingAccessService`
- Service: `OSKBuildingActivitiesService`
- Service: `OSKBuildingSettingsService`
- Service: `OSKBuildingIntercomService`
- Service: `OSKBuildingIntercomCallTransferListService`
- Service: `OSKIntercomMessagePublisherService`
- Service: `OSKBuildingPincodeService`
- Service: `OSKNonAppUserAccessService`
- Service: `OSKNonAppUserActivityService`
- Service: `OSKNonAppUserActivityAggregatesService`
- Service: `OSKNonAppUserPincodeService`
- Service: `OSKBuildingUserService`
- Permission: `v1.org.buildings.list`
- Permission: `v1.org.buildings.view`
- Permission: `v1.org.buildings.create`
- Permission: `v1.org.buildings.edit`
- Permission: `v1.org.buildings.delete`
- Permission: `v1.org.buildings.createManager`
- Permission: `v1.org.settings.view`
- Permission: `v1.org.settings.create`
- Permission: `v1.org.settings.edit`
- Permission: `v1.org.settings.delete`
- Permission: `v1.admin.accessControlDevice.edit`
- Permission: `v1.admin.building.register`
- External Hook: `/buildings`
- External Hook: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`
- External Hook: `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`
- External Hook: `OSK_FIREBASE_EMULATOR`
- External Hook: `^buildings/[a-zA-Z0-9-]*/public/images/[a-zA-Z0-9-]*.(png|jpg|jpeg)$`
