# Module Engineering Profile: building

## 0. Generation Metadata

- **Run ID**: 20260724_101041-1aa319b1
- **Generated At**: 2026-07-24T10:10:48.112Z

---

## 0. Generation Metadata

- **Run ID**: 20260724_143235-1aa319b1
- **Generated At**: 2026-07-24T14:32:41.923Z

---

## 1. Executive Summary

### Interpretation
The building module is the Oskey backend module responsible for the Building scope: the physical structure beneath a Property and above Units. Evidence shows it owns the primary `/buildings` document model and coordinates building-scoped derivatives for doors, unit containment, access ledger entries, intercom directory data, settings, pincodes, non-app user activity, and building-user associations.

### Evidence Used
- Controller: `OSKBuildingController` methods `get`, `getSafe`, `update`, `save`, `delete`, `queryAllBuildings`, `uploadImage`, `deleteImage`, and `getBuildingsQueryFilters` in `output/knowledge-pipeline/modules/building/building-controllers.json`.
- Controller: `OSKBuildingAccessesController`, `OSKBuildingDoorController`, `OSKBuildingIntercomController`, `OSKBuildingSettingsController`, `OSKBuildingUnitController`, and `OSKBuildingPincodeController` in `output/knowledge-pipeline/modules/building/building-controllers.json`.
- Service: `OSKBuildingAccessService.createOrUpdateBuildingAccess`, `OSKBuildingAccessService.createOrUpdateBuildingAccessForStaffOrNonAppUser`, `OSKBuildingDoorService.organizationUserGetAllBuildingDoors`, `OSKBuildingDoorService.organizationUserCreateBuildingDoor`, `OSKBuildingDoorService.organizationUserUpdateBuildingDoor`, `OSKBuildingDoorService.deleteBuildingDoor`, `OSKBuildingSettingsService.createBuildingSettings`, `OSKBuildingSettingsService.getResidentSettings`, `OSKBuildingSettingsService.updateBuildingSettings`, `OSKBuildingSettingsService.deleteBuildingSettings`, `OSKBuildingIntercomService.createIntercomEntry`, `OSKBuildingIntercomService.addInhabitantInAllIntercoms`, `OSKBuildingIntercomService.updateIntercomDisplayName`, `OSKBuildingPincodeService.createPincodeInhabitantDocument`, `OSKBuildingPincodeService.createPincodeGuestDocument`, `OSKBuildingPincodeService.createPincodePermanentGuestDocument`, `OSKBuildingPincodeService.createPincodeAnonymousDocument`, `OSKBuildingPincodeService.createPincodeSupplierDocument`, `OSKBuildingUnitService.organizationUserGetAllBuildingUnits`, `OSKBuildingUnitService.organizationUserCreateBuildingUnit`, and `OSKBuildingUnitService.deleteBuildingUnit` in `output/knowledge-pipeline/modules/building/building-services.json`.
- Firestore Path: `/buildings` and `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` in `output/knowledge-pipeline/modules/building/building-evidence.json`.
- Firestore rules: `canEditBuilding(buildingId)` and `canViewBuilding(buildingId)` in `ai-runtime/contracts/docs/firestore.rules.txt`.
- RBAC roles: `v1.org.buildings.view`, `v1.org.buildings.edit`, `v1.org.buildings.createManager`, `v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete`, and `v1.admin.accessControlDevice.edit` in `output/knowledge-pipeline/modules/building/building-evidence.json` and `ai-runtime/contracts/docs/rbac-roles.json`.

### Confidence
High

---

## 2. Architectural Position

- Parent scope: Building scope under Property and Organization.
- Owned concepts: Building document, building doors, building units, building settings, building access ledger entries, intercom directory entries, call transfer lists, pincodes, inhabitants, non-app users, and building-user associations.
- Provided capabilities: building lifecycle administration, door lifecycle administration, unit lifecycle administration, building-scoped access aggregation, intercom directory maintenance, settings governance, pincode persistence, non-app user activity persistence, and building-user management.
- Downstream consumers or candidate consumers: mobile and web building management UIs, access control hardware sync consumers, intercom publish/subscribe consumers, user settings denormalization flows, and organization/property administration views.
- Confidence: High

### Interpretation
The module is a backend aggregate around the Building entity. It provides the operational surface for building-level configuration, nested subcollection management, and building-scoped access and security state. It is not purely a CRUD boundary: it is also the coordinator of building-level settings fan-out, access ledger writes, intercom publication, and unit containment logic.

### Evidence Used
- Firestore Path: `/buildings` in `output/knowledge-pipeline/modules/building/building-evidence.json`.
- Firestore Path: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` in `output/knowledge-pipeline/modules/building/building-evidence.json`.
- Service: `OSKBuildingDoorService` and `OSKBuildingIntercomService` in `output/knowledge-pipeline/modules/building/building-services.json`.
- Service: `OSKBuildingSettingsService` and `OSKBuildingUnitService` in `output/knowledge-pipeline/modules/building/building-services.json`.
- Controller: `OSKBuildingController` and submodule controllers in `output/knowledge-pipeline/modules/building/building-controllers.json`.
- Rules: `canEditBuilding(buildingId)` and `canViewBuilding(buildingId)` in `ai-runtime/contracts/docs/firestore.rules.txt`.

### Confidence
High

---

## 3. Primary Responsibilities

- Capability: Building lifecycle management.
  - Implemented by: Controller `OSKBuildingController`, Service `OSKBuildingService`.
  - Representative Service Method: `createOrganizationBuilding`, `updateBuilding`, `deleteBuilding`, `getBuildingById`, `getBuildingsByPropertyId`.
  - Evidence: `OSKBuildingController` methods `get`, `getSafe`, `save`, `update`, `delete`, `queryAllBuildings`; `OSKBuildingService` service class in `output/knowledge-pipeline/modules/building/building-services.json`.
  - Confidence: High

- Capability: Building door lifecycle and access-point administration.
  - Implemented by: Controller `OSKBuildingDoorController`, Service `OSKBuildingDoorService`.
  - Representative Service Method: `organizationUserGetAllBuildingDoors`, `organizationUserCreateBuildingDoor`, `organizationUserUpdateBuildingDoor`, `deleteBuildingDoor`.
  - Evidence: `OSKBuildingDoorService` methods in `output/knowledge-pipeline/modules/building/building-services.json`; permission evidence `v1.org.buildings.view`, `v1.org.buildings.edit`, `v1.org.buildings.createManager` in `output/knowledge-pipeline/modules/building/building-evidence.json`.
  - Confidence: High

- Capability: Unit lifecycle and building-unit containment.
  - Implemented by: Controller `OSKBuildingUnitController`, Service `OSKBuildingUnitService`.
  - Representative Service Method: `organizationUserGetAllBuildingUnits`, `organizationUserCreateBuildingUnit`, `deleteBuildingUnit`.
  - Evidence: `OSKBuildingUnitService` methods in `output/knowledge-pipeline/modules/building/building-services.json`; architecture schema for `/buildings/{buildingId}/units` and `/buildings/{buildingId}/units/{unitId}/inhabitants` in `ai-runtime/contracts/docs/firestore-schema.md`.
  - Confidence: High

- Capability: Building-scoped access aggregation.
  - Implemented by: Controller `OSKBuildingAccessesController`, Service `OSKBuildingAccessService`.
  - Representative Service Method: `createOrUpdateBuildingAccess`, `createOrUpdateBuildingAccessForStaffOrNonAppUser`.
  - Evidence: `OSKBuildingAccessService` methods in `output/knowledge-pipeline/modules/building/building-services.json`; service input types referencing `OSKUserDocument` and `OSKAccess`.
  - Confidence: High

- Capability: Building settings and resident/invitation governance.
  - Implemented by: Controller `OSKBuildingSettingsController`, Service `OSKBuildingSettingsService`.
  - Representative Service Method: `createBuildingSettings`, `getResidentSettings`, `updateBuildingSettings`, `deleteBuildingSettings`.
  - Evidence: `OSKBuildingSettingsService` methods in `output/knowledge-pipeline/modules/building/building-services.json`; permission evidence `v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete` in `output/knowledge-pipeline/modules/building/building-evidence.json`; schema and architecture fan-out description in `ai-runtime/contracts/docs/Oskey Backend Services & Data Architecture.md`.
  - Confidence: High

- Capability: Intercom directory and call transfer support.
  - Implemented by: Controller `OSKBuildingIntercomController`, `OSKBuildingIntercomCallTransferListController`; Service `OSKBuildingIntercomService`, `OSKBuildingIntercomCallTransferListService`, `OSKIntercomMessagePublisherService`.
  - Representative Service Method: `createIntercomEntry`, `addInhabitantInAllIntercoms`, `updateIntercomDisplayName`.
  - Evidence: `OSKBuildingIntercomService` methods in `output/knowledge-pipeline/modules/building/building-services.json`; firestorerelated path evidence and architecture material referencing intercom state.
  - Confidence: Medium-High

- Capability: Building pincode persistence.
  - Implemented by: Controller `OSKBuildingPincodeController`, `OSKBuildingPincodeTrashController`; Service `OSKBuildingPincodeService`.
  - Representative Service Method: `createPincodeInhabitantDocument`, `createPincodeGuestDocument`, `createPincodePermanentGuestDocument`, `createPincodeAnonymousDocument`, `createPincodeSupplierDocument`.
  - Evidence: `OSKBuildingPincodeService` methods in `output/knowledge-pipeline/modules/building/building-services.json`; path evidence from `ai-runtime/contracts/docs/firestore-schema.md`.
  - Confidence: Medium-High

- Capability: Building activity persistence.
  - Implemented by: Controller `OSKBuildingActivitiesController`, Service `OSKBuildingActivitiesService`.
  - Representative Service Method: `ActivityReceivedForBuilding`.
  - Evidence: `OSKBuildingActivitiesService` methods in `output/knowledge-pipeline/modules/building/building-services.json`; architecture evidence from `ai-runtime/contracts/docs/Oskey Backend Services & Data Architecture.md` describing activity and door events.
  - Confidence: Medium

### Interpretation
The building module implements both core building persistence and a set of building-scoped subdomains. Its services and controllers show a pattern of separating physical access, unit membership, settings, intercom and pincode concerns while keeping them anchored to the `/buildings` root.

### Evidence Used
- `output/knowledge-pipeline/modules/building/building-controllers.json`
- `output/knowledge-pipeline/modules/building/building-services.json`
- `output/knowledge-pipeline/modules/building/building-evidence.json`
- `output/knowledge-pipeline/modules/building/building-manifest.json`
- `ai-runtime/contracts/docs/Oskey Backend Services & Data Architecture.md`

### Confidence
High

---

## 4. Public Interfaces

### Interpretation
The module exposes an API surface built around callable triggers and Firestore persistence controllers. The public surface is organized by the root building controller plus targeted building submodule controllers for access, doors, intercoms, settings, units, pincodes, and activity.

### Evidence Used
- Controller methods in `output/knowledge-pipeline/modules/building/building-controllers.json` for `OSKBuildingController`, `OSKBuildingAccessesController`, `OSKBuildingDoorController`, `OSKBuildingIntercomController`, `OSKBuildingSettingsController`, `OSKBuildingUnitController`, `OSKBuildingPincodeController`, `OSKBuildingActivitiesController`.
- Service methods in `output/knowledge-pipeline/modules/building/building-services.json`: `createOrUpdateBuildingAccess`, `organizationUserGetAllBuildingDoors`, `createIntercomEntry`, `updateBuildingSettings`, `organizationUserCreateBuildingUnit`, `createPincodeInhabitantDocument`.
- Exported triggers from `functions/src/modules/building/index.ts` in `output/knowledge-pipeline/modules/building/building-evidence-graph.json`.

### Confidence
High

---

## 5. Internal Structure

### Interpretation
The building module is internally decomposed into a root building layer and specialized submodules. Submodules are implemented as separate controller/service pairs, quickly indicating modular separation of responsibility within the same module.

### Evidence Used
- Manifest summary: 89 files, 42 classes, 275 methods, 20 services, 22 controllers in `output/knowledge-pipeline/modules/building/building-manifest.json`.
- Service submodule list in `output/knowledge-pipeline/modules/building/building-services.json`.
- Controller submodule list in `output/knowledge-pipeline/modules/building/building-controllers.json`.

### Confidence
High

---

## 6. Firestore & Data Ownership

### Interpretation
The module owns the root `/buildings` collection and directly manages nested building scoping for doors, access control devices, units, settings, intercoms, pincodes and possibly activity.

### Evidence Used
- Firestore Path: `/buildings` in `output/knowledge-pipeline/modules/building/building-evidence.json`.
- Firestore Path: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` in `output/knowledge-pipeline/modules/building/building-evidence.json`.
- Schema: `/buildings/{buildingId}/settings`, `/buildings/{buildingId}/units`, `/buildings/{buildingId}/units/{unitId}/inhabitants` in `ai-runtime/contracts/docs/firestore-schema.md`.
- Architecture: settings fan-out to `/users/{userId}/buildingSettings/{buildingId}` in `ai-runtime/contracts/docs/Oskey Backend Services & Data Architecture.md`.

### Confidence
Moderate-High

---

## 7. API Endpoints

This section is detailed in the companion `api-reference/building-api-reference.md` document.

---

## 8. API Endpoints

This section is detailed in the companion `api-reference/building-api-reference.md` document.

---

## 9. Firestore Triggers

### Interpretation
The module includes document triggers for building door access control device records. These runtime hooks are likely responsible for synchronizing door-device assignment state and cleaning up or reacting to access control device lifecycle changes under a building.

### Evidence Used
- Firestore Trigger: `onCreate` in `output/knowledge-pipeline/modules/building/building-firestore-triggers.json`.
- Path or Path Variable: `buildingDoorAccessControlDevicePath` in `output/knowledge-pipeline/modules/building/building-firestore-triggers.json`.
- Handler: `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated` in `output/knowledge-pipeline/modules/building/building-firestore-triggers.json`.
- Firestore Trigger: `onDelete` in `output/knowledge-pipeline/modules/building/building-firestore-triggers.json`.
- Handler: `OSKBuildingDoorAccessControlDeviceService.onDocumentDeleted` in `output/knowledge-pipeline/modules/building/building-firestore-triggers.json`.
- Source File: `functions/src/modules/building/modules/building_door/index.ts` in `output/knowledge-pipeline/modules/building/building-firestore-triggers.json`.

### Confidence
Moderate-High

---

## 10. Permissions & Security

### Interpretation
The module uses organization-scoped building permissions for view/edit operations and settings permissions for configuration changes. Firestore rules explicitly gate building read and write access by `v1.org.buildings.view` and `v1.org.buildings.edit`.

### Evidence Used
- Permission evidence in `output/knowledge-pipeline/modules/building/building-evidence.json`: `v1.org.buildings.view`, `v1.org.buildings.edit`, `v1.org.buildings.createManager`, `v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete`, `v1.admin.accessControlDevice.edit`.
- RBAC definitions in `ai-runtime/contracts/docs/rbac-roles.json` for `v1.org.buildings.admin`, `v1.org.settings.admin`, and `v1.admin.accessControlDevice.admin`.
- Firestore rules in `ai-runtime/contracts/docs/firestore.rules.txt` for `canEditBuilding(buildingId)` and `canViewBuilding(buildingId)`.

### Confidence
High

---

## 10. Cross-Module Relationships

### Interpretation
The building module directly depends on shared settings and role abstractions, and it connects to user/access domains through its building access service.

### Evidence Used
- Import evidence: `@oskey/building/settings` and `@oskey/settings/role` from `output/knowledge-pipeline/modules/building/building-evidence.json`.
- Service type evidence: `OSKBuildingAccessService` parameter types `OSKUserDocument` and `OSKAccess` in `output/knowledge-pipeline/modules/building/building-services.json`.
- Service type evidence: `OSKBuildingActivitiesService` uses `EnrichedActivityData` from `access_control_device` enrichment in `output/knowledge-pipeline/modules/building/building-services.json`.

### Confidence
Moderate

---

## 11. External Hooks

### Interpretation
The evidence indicates candidate external boundaries around device assignments and intercom publication but does not fully prove a complete external integration interface.

### Evidence Used
- Firestore Path: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` in `output/knowledge-pipeline/modules/building/building-evidence.json`.
- Service method: `OSKBuildingIntercomService.createIntercomEntry` in `output/knowledge-pipeline/modules/building/building-services.json`.
- Architecture grounding: hardware and intercom synchronization discussion in `ai-runtime/contracts/docs/Oskey Backend Services & Data Architecture.md`.

### Confidence
Low-Moderate

---

## 12. Architectural Observations

### Interpretation
The building module uses a layered controller/service pattern and explicit submodule decomposition. It reflects a design where building scope is the anchor for both structural entities and operational subdomains, rather than a flat collection of unrelated endpoints.

### Evidence Used
- Manifest: 20 services and 22 controllers in `output/knowledge-pipeline/modules/building/building-manifest.json`.
- Controller/service evidence in `output/knowledge-pipeline/modules/building/building-controllers.json` and `output/knowledge-pipeline/modules/building/building-services.json`.
- Firestore schema and rules in `ai-runtime/contracts/docs/firestore-schema.md` and `ai-runtime/contracts/docs/firestore.rules.txt`.

### Confidence
High

---

## 13. Risks & Open Questions

### Interpretation
This profile is aligned to Pass 1 evidence. The main uncertainties are the exact external hook semantics, the current boundary of activity persistence, and the relationship between `v1.org.buildings.createManager` and standard RBAC roles.

### Evidence Used
- Permission evidence: `v1.org.buildings.createManager` appears in `output/knowledge-pipeline/modules/building/building-evidence.json` but is not declared in `ai-runtime/contracts/docs/rbac-roles.json`.
- Firestore rules: `canEditBuilding(buildingId)` and `canViewBuilding(buildingId)` in `ai-runtime/contracts/docs/firestore.rules.txt`.
- Architecture: building settings fan-out behavior in `ai-runtime/contracts/docs/Oskey Backend Services & Data Architecture.md`.
- External hook: device assignment path evidence plus intercom service methods.

### Confidence
High

---

## 14. Evidence References

- `ai-runtime/contracts/module-engineering-profile/contract.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `ai-runtime/contracts/docs/Oskey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/rbac-roles.json`
- `output/knowledge-pipeline/modules/building/building-manifest.json`
- `output/knowledge-pipeline/modules/building/building-services.json`
- `output/knowledge-pipeline/modules/building/building-controllers.json`
- `output/knowledge-pipeline/modules/building/building-evidence.json`
- `output/knowledge-pipeline/modules/building/building-evidence-graph.json`
