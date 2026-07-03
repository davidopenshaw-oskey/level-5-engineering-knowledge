# Building Module Engineering Profile

## 1. Executive Summary

### Interpretation
Evidence indicates that the building module is a building-scoped backend domain module in the Oskey platform. It implements building-level persistence and operational logic for buildings, doors, access-control-related structures, intercom entries, settings, and unit/user relationships within a building context.

### Evidence Used
- Controller: OSKBuildingController exposes CRUD-style building methods including get, getSafe, update, save, delete, queryAllBuildings, and listDocuments.
- Service Method: OSKBuildingAccessService.createOrUpdateBuildingAccess and OSKBuildingAccessService.createOrUpdateBuildingAccessForStaffOrNonAppUser.
- Service Method: OSKBuildingDoorService.organizationUserGetAllBuildingDoors and OSKBuildingDoorService.deleteBuildingDoor.
- Service Method: OSKBuildingIntercomService.createIntercomEntry and OSKBuildingIntercomService.deleteIntercomEntry.
- Service Method: OSKBuildingSettingsService.createBuildingSettings, updateBuildingSettings, and deleteBuildingSettings.
- Architecture: [ai-runtime/contracts/docs/Oskey Architecture.md](ai-runtime/contracts/docs/Oskey%20Architecture.md) defines the building scope as the primary physical anchor for access-control devices and active door mechanisms.

### Confidence
High

---

## 2. Architectural Position

- Parent scope: Building scope within the Oskey hierarchy beneath entity, property, and organization.
- Owned concepts: Building documents, doors, access-control-device associations, intercom entries, settings, unit relationships, and building-user relationships.
- Provided capabilities: Building lifecycle management, door and access administration, intercom management, settings management, and unit/user association logic.
- Downstream consumers or candidate consumers: Property-management-facing services, building administration workflows, and candidate intercom or access-control-device consumers.
- Confidence: High

### Interpretation
The module sits at the building layer of the platform architecture and owns the operational concerns that are physically anchored to a building rather than to an organization or a single unit.

### Evidence Used
- Architecture: [ai-runtime/contracts/docs/Oskey Architecture.md](ai-runtime/contracts/docs/Oskey%20Architecture.md) states that buildings are the primary physical anchor for ACDs and active door-locking mechanisms.
- Firestore Path: [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json) records /buildings and /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}.
- Service: OSKBuildingDoorService and OSKBuildingIntercomService are scoped to building-level door and intercom operations.

### Confidence
High

---

## 3. Primary Responsibilities

- Capability: Building document lifecycle management.
  - Implemented by: Controller OSKBuildingController.
  - Representative Service Method: None; this is handled directly by the controller layer in the supplied evidence.
  - Evidence: Controller Method: get, getSafe, update, save, delete, queryAllBuildings, listDocuments, uploadImage, deleteImage, and getBuildingsQueryFilters in [output/knowledge-pipeline/modules/building/building-controllers.json](output/knowledge-pipeline/modules/building/building-controllers.json).
  - Confidence: High

- Capability: Building-level door and access administration.
  - Implemented by: Controller OSKBuildingDoorController and Service OSKBuildingDoorService.
  - Representative Service Method: organizationUserGetAllBuildingDoors, organizationUserCreateBuildingDoor, organizationUserUpdateBuildingDoor, deleteBuildingDoor.
  - Evidence: [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json) and [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json).
  - Confidence: High

- Capability: Intercom and inhabitant entry management.
  - Implemented by: Controller OSKBuildingIntercomController and Service OSKBuildingIntercomService.
  - Representative Service Method: createIntercomEntry, deleteIntercomEntry, createIntercomDisplayName, updateIntercomDisplayName.
  - Evidence: [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json) and [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json).
  - Confidence: High

- Capability: Building-specific settings management.
  - Implemented by: Controller OSKBuildingSettingsController and Service OSKBuildingSettingsService.
  - Representative Service Method: createBuildingSettings, getResidentSettings, updateBuildingSettings, deleteBuildingSettings, resetBuildingSettings.
  - Evidence: [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json) and [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json).
  - Confidence: High

- Capability: Unit and building-user association management.
  - Implemented by: Controller OSKBuildingUnitController and Service OSKBuildingUnitService plus OSKBuildingUserService.
  - Representative Service Method: organizationUserCreateBuildingUnit, organizationUserUpdateBuildingUnit, organizationUserGetAllBuildingUnits, deleteBuildingUnit, createBuildingUser.
  - Evidence: [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json) and [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json).
  - Confidence: High

### Interpretation
The evidence supports a broad set of building-domain responsibilities, with distinct controllers and services for doors, intercom, settings, units, and users rather than a single generic building service.

### Evidence Used
- Controller inventory from [output/knowledge-pipeline/modules/building/building-controllers.json](output/knowledge-pipeline/modules/building/building-controllers.json).
- Service inventory from [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json).
- Firestore path hints from [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json).

### Confidence
High

---

## 4. Public Interfaces

### Interpretation
The module exposes both document-oriented and request-oriented interfaces through a controller layer and a service layer. The top-level building controller provides core building CRUD operations, while submodule controllers and services expose building-specific capabilities.

### Evidence Used
- Controller: OSKBuildingController exposes get, getSafe, update, save, delete, queryAllBuildings, listDocuments, uploadImage, deleteImage, and getBuildingsQueryFilters.
- Controller: OSKBuildingDoorController, OSKBuildingIntercomController, OSKBuildingSettingsController, and OSKBuildingUnitController are present in [output/knowledge-pipeline/modules/building/building-controllers.json](output/knowledge-pipeline/modules/building/building-controllers.json).
- Service Method: OSKBuildingAccessService.createOrUpdateBuildingAccess, OSKBuildingDoorService.organizationUserGetAllBuildingDoors, OSKBuildingIntercomService.createIntercomEntry, OSKBuildingSettingsService.createBuildingSettings, and OSKBuildingUserService.createBuildingUser.

### Confidence
High

---

## 5. Internal Structure

### Interpretation
The module is internally decomposed into multiple submodules, which suggests a domain-oriented separation of concerns rather than a single monolithic implementation. The structure separates building document handling from access, activity, door, intercom, settings, unit, and user concerns.

### Evidence Used
- Service submodules: building_accesses, building_activity, building_door, building_intercom, building_pincode, building_pincode_trash, building_settings, building_unit, and building_user in [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json).
- Corresponding controller submodules in [output/knowledge-pipeline/modules/building/building-controllers.json](output/knowledge-pipeline/modules/building/building-controllers.json).
- Manifest summary: [output/knowledge-pipeline/modules/building/building-manifest.json](output/knowledge-pipeline/modules/building/building-manifest.json) reports 20 services and 22 controllers for the module.

### Confidence
High

---

## 6. Firestore & Data Ownership

### Interpretation
Evidence indicates that the module uses Firestore for primary building-scoped persistence around building documents and nested building structures. The supplied evidence confirms building-level paths for buildings, doors, and settings, and it suggests additional building-scoped data relationships around access and intercom behavior, but full ownership of those broader structures is not established here.

### Evidence Used
- Primary persistence: Controller methods save, update, delete, and get on OSKBuildingController imply building document persistence.
- Confirmed Firestore Path: /buildings in [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json).
- Confirmed Firestore Path: /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId} in [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json).
- Confirmed nested structures: [ai-runtime/contracts/docs/firestore-schema.md](ai-runtime/contracts/docs/firestore-schema.md) includes /buildings/{id}/doors and /buildings/{id}/settings.
- Candidate denormalised structures or fan-out targets: The building access and intercom services suggest additional building-scoped data relationships, but the supplied evidence does not confirm specific denormalised collections or fan-out targets beyond the module’s own building-scoped paths.

### Confidence
Moderate

---

## 7. Permissions & Security

### Interpretation
The module contains explicit permission-aware logic for building administration and building settings. Evidence shows checks for organization building view/edit permissions, settings create/view permissions, and at least one access-control-device-related permission. The broader RBAC enforcement model is not fully visible in the supplied evidence.

### Evidence Used
- Permission: v1.org.buildings.view and v1.org.buildings.edit are recorded in [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json) for building door operations.
- Permission: v1.org.buildings.createManager is recorded for building door administration.
- Permission: v1.org.settings.create and v1.org.settings.view are recorded for building settings operations.
- Permission: v1.admin.accessControlDevice.edit is recorded for building intercom behavior.
- Security context: [ai-runtime/contracts/docs/firestore.rules.txt](ai-runtime/contracts/docs/firestore.rules.txt) defines building-scoped access helpers such as canEditBuilding and canViewBuilding.
- RBAC reference: [ai-runtime/contracts/docs/rbac-roles.json](ai-runtime/contracts/docs/rbac-roles.json) defines the organization-level role vocabulary used by the module.

### Confidence
High for the specific permissions; Moderate for the complete end-to-end RBAC enforcement model.

---

## 8. Cross-Module Relationships

### Interpretation
The module has direct evidence of relationships with the user domain, the access-control-device domain, and shared settings/role infrastructure. These relationships are evidenced through service parameters, imported types, and permission dependencies rather than through a full workflow synthesis.

### Evidence Used
- Service: OSKBuildingAccessService accepts OSKUserDocument and OSKAccess types from the user domain.
- Service: OSKBuildingActivitiesService consumes EnrichedActivityData from the access-control-device activity enrichment service.
- Shared infrastructure references: @oskey/building/settings and @oskey/settings/role are present in [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json).

### Confidence
Moderate

---

## 9. External Hooks

### Interpretation
The provided evidence does not confirm a production external integration endpoint. It does, however, surface candidate boundaries around intercom messaging and access-control-device activity handling.

### Evidence Used
- Confirmed integration: None identified in the supplied evidence.
- Candidate boundary: OSKBuildingIntercomService is associated with intercom-specific behavior and entry management.
- Candidate boundary: OSKBuildingActivitiesService consumes access-control-device activity enrichment data.
- Evidence artefact: [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json).

### Confidence
Low to Moderate

---

## 10. Architectural Observations

### Interpretation
The module demonstrates a layered and submodule-based design with strong separation of concerns. It is operationally focused and close to the physical building context described in the architecture grounding.

### Evidence Used
- Controller/service split visible in OSKBuildingController and the service classes listed in [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json).
- Submodule decomposition visible in the building_accesses, building_door, building_intercom, building_settings, building_unit, and building_user services.
- Architecture grounding in [ai-runtime/contracts/docs/Oskey Architecture.md](ai-runtime/contracts/docs/Oskey%20Architecture.md) reinforces the building-level physical scope.

### Confidence
High

---

## 11. Risks & Open Questions

### Interpretation
The supplied evidence is sufficient to describe the module’s structure and major responsibilities, but several details remain unconfirmed. These include the full route surface, the complete Firestore collection inventory, the detailed semantics of individual methods, and the precise nature of the candidate external boundaries.

### Evidence Used
- The manifest confirms the module is large, but the supplied summaries do not expose every route, method body, or collection path.
- The evidence bundle contains permission strings and path hints, but not full end-to-end request flows.

### Confidence
High

---

## 12. Evidence References

- [output/knowledge-pipeline/modules/building/building-manifest.json](output/knowledge-pipeline/modules/building/building-manifest.json)
- [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json)
- [output/knowledge-pipeline/modules/building/building-controllers.json](output/knowledge-pipeline/modules/building/building-controllers.json)
- [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json)
- [output/knowledge-pipeline/modules/building/building-evidence-graph.json](output/knowledge-pipeline/modules/building/building-evidence-graph.json)
- [ai-runtime/contracts/docs/Oskey Architecture.md](ai-runtime/contracts/docs/Oskey%20Architecture.md)
- [ai-runtime/contracts/docs/firestore-schema.md](ai-runtime/contracts/docs/firestore-schema.md)
- [ai-runtime/contracts/docs/firestore.rules.txt](ai-runtime/contracts/docs/firestore.rules.txt)
- [ai-runtime/contracts/docs/rbac-roles.json](ai-runtime/contracts/docs/rbac-roles.json)
