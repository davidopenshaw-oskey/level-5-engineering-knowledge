# Building — Module Engineering Profile

Generated: 2026-06-29

## 1. Module Summary

- Purpose: The `building` module implements server-side controllers and services that model and manage building-scoped resources (buildings, doors, settings, intercoms, pincodes, non-app users) and orchestrate access provisioning and device-related interactions.
- Responsibility: Provide the API surface and business logic to create/read/update/delete building entities, manage door-to-device associations, generate and persist pincodes, and support intercom-related features.

## 2. Primary Responsibilities

- Building lifecycle management: create, list, retrieve, update, delete buildings and images.
- Door and device management: manage doors and access-control-device assignments/configuration.
- Access provisioning and ledgers: orchestrate creation of access grants, pincode generation and denormalised access records.
- Intercom management: intercom structures, call transfer lists, and message publishing candidates.
- Non-app user handling: create/maintain non-app user accounts and their access under unit/building scope.

## 3. Public Interfaces

- Controllers (API surface): `OSKBuildingController` and ~21 submodule controllers (e.g., `building_accesses`, `building_door`, `building_intercom`, `building_pincode`, `building_settings`, `building_unit`). See controller listing in the evidence artifacts.
- Exported services: `OSKBuildingAccessService`, `OSKBuildingDoorService`, `OSKBuildingIntercomService`, `OSKBuildingPincodeService`, `OSKBuildingSettingsService`, `OSKBuildingUnitNonAppUserService`, and others.
- Representative public methods: `getCollectionPath`, `generateDocId`, `getAll`, `get`, `getSafe`, `save`, `update`, `delete`, `uploadImage`, `deleteImage` (documented in controller evidence).

## 4. Internal Structure

- Controllers vs Services: Controllers provide request/entry points; services encapsulate business logic and data orchestration.
- Submodule decomposition: Each concern is split into submodules (e.g., `building_door`, `building_pincode`, `building_intercom`, `building_unit`), each with its own controllers and services.
- Supporting artifacts: module manifest, evidence graph and AST-derived evidence enumerate methods, permission hints and firestore hints.

## 5. Firestore Usage

- Collections referenced (evidence + schema):
  - `/buildings` and subcollections such as `/buildings/{id}/doors`, `/buildings/{id}/settings`.
  - `/accessControlDevices` and its subcollections (`/accessControlDevices/{id}/configs`, `/accessControlDevices/{id}/publicKeys`).
  - Access ledgers and user-scoped collections referenced by services: `/users/{userId}/accesses`, `/buildings/{buildingId}/accesses`, `/users/{userId}/pincodes` (implied by services and backend architecture grounding).
  - Collection-groups in indexes: `inhabitants`, `intercom`, `invitationsSent`, `onboardingInhabitants`, `userInvitations`.
- Likely reads: `get`, `getAll`, `listDocuments` on building documents; service reads to assemble access payloads.
- Likely writes: `save`, `update`, `delete`, pincode generation, and denormalised fan-out writes to user/building access ledgers.
- Uncertain: exact write targets and device sync mechanism (Cloud Tasks, pub/sub, direct device APIs) — requires tracing implementation.

## 6. Permissions

- Permission checks and hints are present across controllers/services (examples: `canEditBuilding`, `isAuthenticatedUser`, RBAC checks referenced in permission facts).
- Firestore rules include building/unit ACL helpers and many omitted guard functions; controllers reference permission hints in evidence.
- Do not infer complete RBAC mappings; evidence shows many permission hints but not a full authoritative mapping.

## 7. Cross-Module Dependencies

- Heavy dependencies on access- and pincode-related submodules (`building_accesses`, `building_pincode`).
- Unit and non-app user flows depend on `building_unit` and `building_unit_nonAppUser` services.
- Intercom flows depend on `building_intercom` message publisher services.

## 8. External Hooks (Candidate Boundaries)

- Physical access-control devices (ACDs) — Intercom and Digicom devices are candidate consumers of device syncs.
- Mobile applications (OSkey iOS/Android) — likely consumers of building access APIs (architecture grounding suggests this relationship).
- Telephony/push/notification systems — intercom call transfer and message publisher services suggest external integrations.
- These remain candidate boundaries until concrete implementation hooks are traced.

## 9. Architectural Observations

- Clear separation of controllers (surface) and services (business logic).
- Denormalisation and fan-out patterns are central to access management (architecture doc and service evidence point to multi-target writes), implying complexity in consistency management.
- The `building` module is broad with many controllers/services — this breadth concentrates responsibilities and increases coupling risk.

## 10. Risks and Open Questions

- Where and how device synchronization to ACDs is implemented (protocols, endpoints, queues) is not fully evidenced.
- Exact fan-out mechanism for denormalised writes (Cloud Tasks vs batched writes vs pub/sub) requires confirmation.
- Complete RBAC permission-to-endpoint mapping is not present in the provided evidence.
- Operational semantics (retries, transactions, partial-failure handling) for multi-document updates are not fully visible.

## 11. Evidence References

- Module manifest and stats: [output/knowledge-pipeline/modules/building/building-manifest.json](output/knowledge-pipeline/modules/building/building-manifest.json)
- Controllers listing: [output/knowledge-pipeline/modules/building/building-controllers.json](output/knowledge-pipeline/modules/building/building-controllers.json)
- Services listing: [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json)
- Evidence graph: [output/knowledge-pipeline/modules/building/building-evidence-graph.json](output/knowledge-pipeline/modules/building/building-evidence-graph.json)
- Raw evidence: [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json)
- Firestore schema: [ai-runtime/contracts/docs/firestore-schema.md](ai-runtime/contracts/docs/firestore-schema.md)
- Firestore rules: [ai-runtime/contracts/docs/firestore.rules.txt](ai-runtime/contracts/docs/firestore.rules.txt)
- Firestore indexes: [ai-runtime/contracts/docs/firestore.indexes.json](ai-runtime/contracts/docs/firestore.indexes.json)
- Architecture grounding: [ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md](ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md)
- Module contract & persona: [ai-runtime/contracts/module-engineering-profile/contract.md](ai-runtime/contracts/module-engineering-profile/contract.md), [ai-runtime/contracts/module-engineering-profile/persona.md](ai-runtime/contracts/module-engineering-profile/persona.md)

---

If you want, I can now (choose):

- trace and list the exact source files and lines that implement the fan-out to access ledgers and device syncs, or
- expand the profile with quoted evidence snippets from the AST-derived artefacts.
# Building Module Engineering Profile

## 1. Module Summary

The building module appears to be a core domain module for managing building records and a wide set of building-related operational concerns. The evidence indicates that it is responsible for building lifecycle management, access-control related operations, intercom and pincode workflows, building settings, and unit-level building relationships. The module is substantial in scope, with 89 files, 20 services, 22 controllers, 42 classes, and 275 methods according to the supplied manifest.

## 2. Primary Responsibilities

The evidence supports the following primary responsibilities:

- Building record management, including create, retrieve, update, delete, query, and image upload/delete operations for building entities.
- Building access and door-related administration, including services and controllers for access records, doors, and access-control devices.
- Intercom and pincode management, including intercom-related services, call-transfer lists, pincode handling, and pincode trash workflows.
- Building settings management, including building-specific configuration and settings-related controllers and services.
- Unit and user-facing building relationships, including unit inhabitants, invitations, permanent guests, non-app-user access workflows, and building user management.

These responsibilities are evidenced by the service and controller inventory, the module substructure, and the presence of related permission and Firestore path hints.

## 3. Public Interfaces

The module exposes its functionality through a layered interface pattern:

- A top-level building controller, evidenced by OSKBuildingController, which appears to expose general building document operations.
- A set of submodule controllers, including controllers for building access, building activity, doors, intercoms, pincode, settings, units, and building users.
- A service layer with a top-level building service and specialized services such as OSKBuildingAccessService, OSKBuildingDoorService, OSKBuildingIntercomService, OSKBuildingPincodeService, OSKBuildingSettingsService, OSKBuildingUnitService, and OSKBuildingUserService.
- Evidence indicates public controller methods for building retrieval, query, update, save, delete, document listing, image upload, image deletion, and query-filter handling.

The supplied evidence does not expose the full REST or callable API surface, but it clearly shows a broad controller and service entry-point model.

## 4. Internal Structure

The internal structure is organized around a top-level building domain with several focused submodules:

- Core building management: the main building controller and service handle general building lifecycle concerns.
- Building access submodule: handles access-focused operations.
- Building activity submodule: appears to separate activity-oriented behavior.
- Building door submodule: manages door and access-control-device-related behavior.
- Building intercom submodule: manages intercom, call-transfer-list, and message-publisher concerns.
- Building pincode submodule and pincode trash submodule: separate pincode-related behavior.
- Building settings submodule: manages settings-related functionality.
- Building unit submodule and its nested non-app-user substructure: covers unit-level and guest/non-app-user concerns.
- Building user submodule: handles building-user relationships.

This structure suggests a strong domain decomposition pattern, with each submodule owning a relatively focused part of the building domain. The evidence also indicates use of a generic document-management style in the controller/service layer, with relationships to shared core document abstractions.

## 5. Firestore Usage

The evidence explicitly surfaces Firestore usage for building data:

- Likely reads: the controller/service evidence indicates document retrieval, document listing, querying, and building lookup operations against building entities.
- Likely writes: the evidence indicates create/update/save/delete operations and image upload/delete behavior.
- Uncertain usage: the supplied summary explicitly shows a path for the building collection and a nested access-control-device path, but the broader set of collection paths is not fully surfaced in the summary bundle.

The most explicit Firestore paths evidenced in the supplied bundle are:

- /buildings
- /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}

This indicates that Firestore is used as the primary persistence layer for building entities and at least one nested access-control-device structure.

## 6. Permissions

The evidence shows a clear set of permission checks associated with building and settings operations. These include:

- Building permissions: v1.org.buildings.view, v1.org.buildings.edit, v1.org.buildings.create, and v1.org.buildings.createManager.
- Settings permissions: v1.org.settings.create, v1.org.settings.view, v1.org.settings.edit, and v1.org.settings.delete.
- Role and settings-based checks: the evidence also references @oskey/building/settings and @oskey/settings/role, indicating that permission enforcement is partly implemented through building-specific and general settings/role infrastructure.

The evidence supports the presence of these permissions but does not provide a full RBAC model or a complete mapping of which roles receive them.

## 7. Cross-Module Dependencies

The explicit cross-module dependency list in the supplied evidence bundle is empty, but the evidence still indicates some meaningful relationships:

- The module appears to depend on shared core document-controller and document-model infrastructure, as shown by controller methods and type references associated with the core document layer.
- The module uses settings and role-related checks that point to shared settings infrastructure.
- Building-related submodules are also structurally related to unit and user concerns within the same larger domain, although these are primarily represented as internal submodules rather than as confirmed external module integrations.

## 8. External Hooks

The supplied evidence bundle does not surface confirmed external hooks. The module appears to be primarily organized around internal service/controller and Firestore-based persistence patterns. Some submodules, especially those involving intercom and message publication, may represent candidate architectural boundaries to external systems, but the evidence is insufficient to confirm them as integrations.

## 9. Architectural Observations

Several architectural observations are supported by the evidence:

- The module is large and functionally broad, with a clear concentration on building-domain operations rather than a single narrow feature.
- The structure shows strong separation of concerns through the use of multiple submodules for access, activity, door, intercom, pincode, settings, unit, and user concerns.
- The module uses a consistent controller-service pattern, which suggests a conventional layered structure for domain behavior.
- The presence of many specialized services and controllers indicates substantial domain complexity and a relatively high surface area for a single module.
- The module appears to rely on generic document-management patterns for core CRUD-style operations, with more specialized behavior layered on top.

## 10. Risks and Open Questions

The evidence is sufficient to describe the module’s structure, but several areas remain uncertain:

- The supplied evidence does not expose the full business workflow behind each submodule.
- Method-level semantics are only partially visible, so the exact behavior of many service methods remains unclear.
- The full set of Firestore collections and nested document structures is not fully surfaced in the supplied summary bundle.
- External integrations are not confirmed by the evidence.
- The complete public API contract, including route-level exposure, is not fully visible from the supplied artefacts.

## 11. Evidence References

The profile above is based on the following evidence artefacts:

- [output/knowledge-pipeline/modules/building/building-manifest.json](output/knowledge-pipeline/modules/building/building-manifest.json)
- [output/knowledge-pipeline/modules/building/building-services.json](output/knowledge-pipeline/modules/building/building-services.json)
- [output/knowledge-pipeline/modules/building/building-controllers.json](output/knowledge-pipeline/modules/building/building-controllers.json)
- [output/knowledge-pipeline/modules/building/building-evidence.json](output/knowledge-pipeline/modules/building/building-evidence.json)
- [output/knowledge-pipeline/modules/building/building-evidence-graph.json](output/knowledge-pipeline/modules/building/building-evidence-graph.json)

Representative classes and services referenced by the evidence include OSKBuildingController, OSKBuildingService, OSKBuildingAccessService, OSKBuildingDoorService, OSKBuildingIntercomService, OSKBuildingPincodeService, OSKBuildingSettingsService, OSKBuildingUnitService, and OSKBuildingUserService.
