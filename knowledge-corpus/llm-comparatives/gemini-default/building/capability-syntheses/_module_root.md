# Capability Synthesis — _module_root

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.406Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: _module_root
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `_module_root` capability of the `building` module provides the foundational business logic, controllers, and entry points for managing physical building entities within the Oskey platform [Confirmed]. It orchestrates building creation, updates, property assignments, and image management, while delegating specialized sub-domain operations (doors, units, settings, intercoms, activities, users) to its respective submodules [Confirmed].

---

## 2. Primary Responsibilities

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

## 3. Public Interfaces (Controllers & Entry Points)

### Controllers
- **`OSKBuildingController`** (defined in `functions/src/modules/building/controllers/building.controller.ts` (lines 12-73)): Extends `OSKDocumentController` to provide standardized Firestore CRUD operations, image uploads, and query filtering for the `/buildings` collection [Confirmed].

### Entry Points
- **`OSKBuildingService`** (defined in `functions/src/modules/building/services/building.service.ts` (lines 47-601)): The primary service class containing business logic, authorization checks, and coordination with other modules/submodules [Confirmed].
- **`getCallableFunctionTriggers`** (defined in `functions/src/modules/building/index.ts` (lines 45-62)): Exposes all callable Cloud Functions for the building module [Confirmed].
- **`getFirestoreTriggers`** (defined in `functions/src/modules/building/index.ts` (lines 39-43)): Exposes Firestore triggers, delegating to submodules [Confirmed].

---

## 4. API Contracts & Firestore Triggers

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

## 5. Data Ownership

### Firestore Paths

#### `/buildings/{id}`
- **Operations**: Read, Write, Delete [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._get|get|OSKBuildingController.collection,buildingId|#1`, `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._set|save|OSKBuildingController.collection,buildingId,data|#1`, `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._delete|delete|OSKBuildingController.collection,buildingId|#1`).
- **Description**: Represents the authoritative building document containing name, organizationId, propertyId, streetAddress, and imageFilename [Confirmed].

#### `/buildings/{id}/settings`
- **Operations**: Set, Delete [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingSettingsController.default.set|createOrganizationBuilding|defaultSettings|#1`, `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingSettingsController.default.delete|deleteBuilding|settingsId,request.buildingId|#1`).
- **Description**: Managed during building creation and deletion to provision default settings or clean up settings documents [Confirmed].

---

## 6. Outbound Coupling

### Intra-Module Submodule Coupling
- **`@oskey/building/door`**: Used to fetch doors associated with a building (`OSKBuildingDoorController.default.getAll`, `OSKBuildingDoorController.default.listDocuments`) [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingDoorController.default.getAll|deleteBuilding|request.buildingId|#1`, `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingDoorController.default.listDocuments|getBuildingById|requestData.buildingId|#1`).
- **`@oskey/building/settings`**: Used to manage building settings (`OSKBuildingSettingsController.default.set`, `OSKBuildingSettingsController.default.delete`) [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingSettingsController.default.set|createOrganizationBuilding|defaultSettings|#1`, `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingSettingsController.default.delete|deleteBuilding|settingsId,request.buildingId|#1`).
- **`@oskey/building/unit`**: Used to fetch and update units associated with a building (`OSKBuildingUnitController.default.getAll`, `OSKBuildingUnitController.default.listDocuments`, `OSKBuildingUnitController.default.update`) [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingUnitController.default.getAll|deleteBuilding|request.buildingId|#1`, `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingUnitController.default.listDocuments|getBuildingById|requestData.buildingId|#1`, `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKBuildingUnitController.default.update|updateBuilding|buildingId,buildingUnitDoc.id,unit|#1`).
- **`@oskey/building/intercom`**, **`@oskey/building/user`**, **`./modules/building_activity`**: Coupled via trigger registration in `index.ts` [Confirmed] (Citations: `functions/src/modules/building/index.ts` (lines 55-60)).

### Cross-Module Coupling
- **`@oskey/core`**: Standard document controller (`OSKDocumentController`), logging (`OSKLoggingService`), and core types [Confirmed] (Citations: `functions/src/modules/building/controllers/building.controller.ts` (lines 6-8), `functions/src/modules/building/services/building.service.ts` (lines 23-25)).
- **`@oskey/core/access`**: Used to update user accesses when building info changes (`OSKAccessUpdateService.updateUserAccessesBuildingInfo`) [Confirmed] (Citation: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKAccessUpdateService.updateUserAccessesBuildingInfo|updateBuilding|request.buildingId,buildingInfo|#1`).
- **`@oskey/organization/building`**: Used to save/update organization-building mappings (`OSKOrganizationBuildingController.default.save`, `OSKOrganizationBuildingController.default.update`) [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKOrganizationBuildingController.default.save|createOrganizationBuilding|organizationId,buildingId,organizationBuilding|#1`, `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKOrganizationBuildingController.default.update|updateBuilding|request.organizationId,request.buildingId|#1`).
- **`@oskey/organization/property`**: Used to manage property-building relationships (`OSKPropertyController.default.get`, `OSKPropertyController.default.update`, `OSKPropertyController.default.removeBuildingFromProperty`) [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKPropertyController.default.get|assigningBuildingToProperty|newPropertyId|#1`, `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKPropertyController.default.update|assigningBuildingToProperty|newPropertyId|#1`, `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKPropertyController.default.removeBuildingFromProperty|assigningBuildingToProperty|oldProperty.propertyId!,'buildings','buildingId',buildingId|#1`).
- **`@oskey/organization/user`**: Used to fetch organization users for permission checks (`OSKOrganizationUserController.default.get`) [Confirmed] (Citation: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKOrganizationUserController.default.get|createOrganizationBuilding|organizationId,userId|#1`).
- **`@oskey/settings/role`**: Used to check user permissions (`OSKConsolidatedRolesController.default.checkUserPermissions`) [Confirmed] (Citation: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|createOrganizationBuilding|organizationUser.roles,['v1.org.buildings.create']|#1`).
- **`@oskey/user`**: Used to fetch user profiles (`OSKUserController.default.get`) [Confirmed] (Citation: `call_expression|building|functions/src/modules/building/services/building.service.ts|OSKUserController.default.get|getAllBuildings|userId|#1`).
- **`@oskey/user/access`**: Used for user access management [Confirmed] (Citation: `functions/src/modules/building/services/building.service.ts` (line 28)).
- **`../../../access_control_device/models/documents/access_control_device_document.model`**: Used for referencing ACD types [Confirmed] (Citation: `functions/src/modules/building/models/functions/building_request.model.ts` (line 7)).

---

## 7. Permissions & Security

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

## 8. External Hooks

### Google Cloud Storage
- **Image Uploads & Deletions**: The capability performs image uploads (`_uploadImage`) and deletions (`_deleteImage`) which interact with Google Cloud Storage buckets [Confirmed] (Citations: `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._uploadImage|uploadImage|bucket,imagePath,contentType,'imageFilename'|#1`, `call_expression|building|functions/src/modules/building/controllers/building.controller.ts|OSKBuildingController.default._deleteImage|deleteImage|filePath,imagePath|#1`).

---

## 9. Open Questions

- **Permission Mismatch**: Why does `assigningBuildingToProperty` check for `v1.org.settings.create` instead of a building-specific or property-specific edit permission? [Inferred]
- **Direct Firestore Triggers**: Are there any direct Firestore triggers defined for the `/buildings` collection itself, or are all triggers delegated to submodules (like `building_door`)? [Inferred]