### 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.424Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: building_unit
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

### 1. Capability Summary
The `building_unit` capability manages the lifecycle, configuration, and sub-resources of individual building units (such as apartments or offices) within the Oskey platform, orchestrating associated doors, inhabitants, invitations, and permanent guests `` `functions/src/modules/building/modules/building_unit/index.ts` (lines 20-62) ``. It acts as a bridge between physical building structures and residential occupancy models, ensuring that changes to unit occupancy automatically synchronize access permissions and intercom directories `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (lines 31-162) ``.

*Confidence Tag: Confirmed*

---

### 2. Primary Responsibilities
- **Building Unit Lifecycle Management**: Handles the creation, retrieval, updating, and deletion of building units (`OSKBuildingUnit`) by authorized organization users `` `functions/src/modules/building/modules/building_unit/services/building_unit.service.ts` (lines 44-383) ``.
- **Inhabitant Management & Access Provisioning**: Manages the addition and removal of inhabitants (`OSKBuildingUnitInhabitant`) within a unit `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (lines 31-191) ``. Adding an inhabitant automatically provisions permanent access credentials via `OSKAccessService` `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKAccessService.createAccess|addInhabitant|inhabitant.userId,inhabitant.buildingId,accessOptions|#1` `` and synchronizes the resident to building intercom directories via `OSKBuildingIntercomService` `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingIntercomService.addInhabitantInAllIntercoms|addInhabitant|inhabitant.buildingId,inhabitant.unitId,inhabitant.userId,inhabitant.inhabitantType,inhabitant.doors|#1` ``.
- **Unit Door Management**: Assigns specific doors to units (`OSKBuildingUnitDoor`) `` `functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts` (lines 27-97) ``. When a door is assigned to a unit, the system automatically creates access permissions for all current inhabitants of that unit `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts|OSKAccessService.createAccess|createBuildingUnitDoor|inhabitant.userId,inhabitant.buildingId,{                                 type: OSKUserAccessType.InhabitantUser,                                 unitId: request.unitId,                                 accessRights: [{ validity: 'permanent', isValidOnce: false }],                                 doors: [buildingUnitDoor],                             }|#1` ``.
- **Permanent Guest Management**: Manages long-term, scheduled visitors (`OSKBuildingUnitPermanentGuest`) associated with a unit `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_permanent_guest.controller.ts` (lines 6-105) ``.
- **Invitation Management**: Manages inhabitant invitations (`OSKBuildingUnitInhabitantInvitation`) for onboarding new residents `` `functions/src/modules/building/modules/building_unit/controllers/building_unit_invitation.controller.ts` (lines 11-65) ``.
- **User Settings Initialization**: Automatically initializes user building settings and unit settings when a new inhabitant is added to a unit `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKUserSettingsBuildingController.default.set|addInhabitant|inhabitant.userId,userSettingsDocument|#1` `` and `` `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKUserSettingsUnitService.createUserSettingsUnitFromInhabitant|addInhabitant|inhabitant.userId,inhabitant.buildingId,inhabitant.unitId,inhabitant.inhabitantType|#1` ``.

*Confidence Tag: Confirmed*

---

### 3. Public Interfaces (Controllers & Entry Points)
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

### 4. API Contracts & Firestore Triggers

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

### 5. Data Ownership

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

### 6. Outbound Coupling

#### Cross-Module Coupling
This capability depends on the following external modules:
- **`core`**:
  - Imports base document controller: `@oskey/core/controllers/document` `` `functions/src/modules/building/modules/building_unit/controllers/building_unit.controller.ts` (line 7) ``.
  - Imports core types and models: `@oskey/core` `` `functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts` (line 6) ``.
  - Imports logging services: `@oskey/core/logger` `` `functions/src/modules/building/modules/building_unit/services/building_unit.service.ts` (line 31) ``.
  - Imports access models: `@oskey/core/access` `` `functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts` (line 16) ``.
- **`organization`**:
  - Imports organization user controllers and utilities: `@oskey/organization/user` `` `functions/src/modules/building/modules/building_unit/services/building_unit.service.ts` (line 20) ``.
  - Imports organization models: `@oskey/organization` `` `functions/src/modules/building/modules/building_unit/services/building_unit.service.ts` (line 32) ``.
- **`settings`**:
  - Imports RBAC role controllers: `@oskey/settings/role` `` `functions/src/modules/building/modules/building_unit/services/building_unit.service.ts` (line 21) ``.
- **`user`**:
  - Imports user access services: `@oskey/user/access` `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (line 13) ``.
  - Imports user controllers: `@oskey/user` `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (line 12) ``.
  - Imports user building settings services: `../../../../user/modules/user_settings/services/user_building_settings.service` `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (line 15) ``.
  - Imports user unit settings services: `../../../../user/modules/user_settings/services/user_unit_settings.service` `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (line 16) ``.

#### Intra-Module Cross-Submodule Coupling
This capability depends on sibling submodules within the `building` module:
- **`building_door`**:
  - Imports door models: `@oskey/building/door` `` `functions/src/modules/building/modules/building_unit/models/documents/building_unit_door_document.model.ts` (line 6) ``.
- **`building_intercom`**:
  - Imports intercom services: `@oskey/building/intercom` `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (line 6) ``.
- **`building_settings`**:
  - Imports building settings models: `@oskey/building/settings` `` `functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts` (line 7) ``.
- **`building_unit_nonAppUser`**:
  - Imports non-app user triggers: `./modules/building_unit_nonAppUser/index` `` `functions/src/modules/building/modules/building_unit/index.ts` (line 8) ``.

*Confidence Tag: Confirmed*

---

### 7. Permissions & Security

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

### 8. External Hooks
No external hooks (such as Pub/Sub publish calls, HTTP client paths, environment variables, or storage paths) are directly evidenced within this capability's pack.

*Confidence Tag: Confirmed*

---

### 9. Open Questions
- **Permission Granularity**: Why is the high-level `v1.org.buildings.create` permission used for deleting a building unit and creating a unit door, rather than a unit-specific permission or `v1.org.buildings.edit`?
- **Invitation Resolution**: While the `OSKBuildingUnitInvitationController` exists to manage invitations, the service-level logic for resolving or accepting invitations is not evidenced in this pack. Where is the invitation acceptance flow handled?

*Confidence Tag: Confirmed*