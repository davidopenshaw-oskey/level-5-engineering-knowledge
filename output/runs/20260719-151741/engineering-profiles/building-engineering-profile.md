# Module Engineering Profile: building

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.340Z

---

## 1. Executive Summary

### Interpretation

The `building` module is a large, foundational domain module within the Oskey backend. It is the system of record for the physical `Building` entity and its hierarchical children, including doors, units, intercoms, and building-specific settings. The module is responsible for the entire lifecycle of these entities, from creation and configuration by Property Managers in the PGO to their eventual deletion.

Evidence indicates that this module orchestrates complex, multi-step workflows that involve significant data replication (fan-out) to maintain consistency across the Firestore database. For example, updating a building's name triggers a cascade of updates to all its associated units and user access records. The module also exposes a rich set of callable functions for the PGO administrative portal and integrates with other core modules like `organization`, `user`, and `access` to enforce the platform's hierarchical data model and security rules.

### Evidence Used

-   Architecture: The `building` module aligns with the Building Scope defined in `Oskey Architecture.md`, which describes it as the primary physical anchor for all hardware.
-   Firestore Schema: The module owns the root `/buildings` collection and numerous sub-collections such as `/doors`, `/units`, `/intercoms`, and `/settings`, as detailed in `firestore-schema.md` and `OSkey Backend Services & Data Architecture.md`.
-   Service: The module contains a large number of services (e.g., `OSKBuildingService`, `OSKBuildingDoorService`, `OSKBuildingUnitService`) that manage the lifecycle of these entities.
-   Controller: A corresponding set of controllers (e.g., `OSKBuildingController`, `OSKBuildingDoorController`) provides the data access layer for these services.
-   API Contract: The module exposes numerous callable functions (e.g., `createOrganizationBuilding`, `updateBuilding`) for consumption by the PGO.
-   Call Expression: Service methods like `OSKBuildingService.updateBuilding` contain logic to call other services (`OSKAccessUpdateService`, `OSKBuildingUnitController`) to propagate data changes.

### Confidence

High.

---

## 2. Architectural Position

### Interpretation

The `building` module is a core domain module that sits centrally within the Oskey backend architecture. It directly models the physical real estate assets as described in the `Oskey Architecture.md` document, serving as the anchor for all hardware and resident data. Its position is foundational; many other platform capabilities, such as access control, user invitations, and activity logging, are dependent on the data managed by this module. It enforces the hierarchical structure of the system, ensuring that entities like Doors and Units are always contained within a parent Building.

-   **Parent scope**: Physical Asset and Real Estate Management.
-   **Owned concepts**: The module owns the concepts of a Building, Door, Unit, and the configurations that bind them together, such as intercom directories, building-level access rules, and operational settings.
-   **Provided capabilities**: It provides capabilities to create, read, update, and delete buildings and their sub-entities; manage inhabitant relationships within units; configure intercoms; and define building-wide policies.
-   **Downstream consumers or candidate consumers**: The `access` module consumes building data to provision access. The `user` module consumes building data for denormalization into user-centric views. The `node-iot-api-oskey-io` repository is a key downstream consumer via Pub/Sub messages for hardware synchronization.

### Evidence Used

-   Architecture: `Oskey Architecture.md` defines the Building as a distinct physical structure and the primary anchor for all field hardware.
-   Architecture: `OSkey Backend Services & Data Architecture.md` describes the `/buildings` collection as the authoritative source for physical buildings.
-   Cross-Module Relationships: The `building` module's services call services from the `access`, `user`, and `organization` modules, indicating its central orchestration role.
-   External Hooks: The module publishes messages to Pub/Sub topics (e.g., `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`) that are consumed by the hardware synchronization layer (`node-iot-api-oskey-io`).

### Confidence

High.

---

## 3. Primary Responsibilities

### Interpretation

The `building` module is a large and complex domain module with a wide range of responsibilities. It acts as the aggregate root for all physical aspects of a property below the "Property" level. Its services are highly interconnected and perform significant orchestration, ensuring that a single logical action (like adding a resident) results in a consistent state across multiple Firestore collections and, eventually, on physical hardware.

-   **Capability**: Manage the lifecycle of Building entities.
    -   **Implemented by**:
        -   Controller: `OSKBuildingController`
        -   Service: `OSKBuildingService`
        -   Representative Service Method: `createOrganizationBuilding`, `updateBuilding`, `deleteBuilding`
    -   **Evidence**: Service methods in `OSKBuildingService` handle creation, updates (including image uploads), and deletion, with permission checks (`v1.org.buildings.create`, `v1.org.buildings.edit`). Deletion logic includes pre-conditions, such as checking for existing doors and units.
    -   **Confidence**: High.

-   **Capability**: Manage the lifecycle of Door entities within a Building.
    -   **Implemented by**:
        -   Controller: `OSKBuildingDoorController`
        -   Service: `OSKBuildingDoorService`
        -   Representative Service Method: `organizationUserCreateBuildingDoor`, `organizationUserUpdateBuildingDoor`, `deleteBuildingDoor`
    -   **Evidence**: The `OSKBuildingDoorService` provides methods for CRUD operations on doors, scoped to a specific building. Deletion is conditional on the door not having an assigned Access Control Device.
    -   **Confidence**: High.

-   **Capability**: Manage the lifecycle of Unit entities within a Building.
    -   **Implemented by**:
        -   Controller: `OSKBuildingUnitController`
        -   Service: `OSKBuildingUnitService`
        -   Representative Service Method: `organizationUserCreateBuildingUnit`, `organizationUserUpdateBuildingUnit`, `deleteBuildingUnit`
    -   **Evidence**: The `OSKBuildingUnitService` manages units, including validation that prevents deletion if inhabitants are present.
    -   **Confidence**: High.

-   **Capability**: Manage Inhabitant and Guest relationships within a Unit.
    -   **Implemented by**:
        -   Controller: `OSKBuildingUnitInhabitantController`, `OSKBuildingUnitPermanentGuestController`
        -   Service: `OSKUnitManagementInhabitantService`, `OSKUnitManagementPermanentGuestService`
        -   Representative Service Method: `addInhabitant`, `removeInhabitantFromUnit`, `createPermanentGuest`
    -   **Evidence**: Services within the `unit_management` submodule handle adding, removing, and managing different types of inhabitants (tenants, residents, guests), enforcing the authority model described in `Oskey Personas and Authority models.md`.
    -   **Confidence**: High.

-   **Capability**: Manage Building-level settings and policies.
    -   **Implemented by**:
        -   Controller: `OSKBuildingSettingsController`
        -   Service: `OSKBuildingSettingsService`
        -   Representative Service Method: `createBuildingSettings`, `updateBuildingSettings`
    -   **Evidence**: The `OSKBuildingSettingsService` manages a comprehensive settings document for each building, controlling features like access methods and invitation permissions. Updates are fanned-out to user-specific settings documents.
    -   **Confidence**: High.

-   **Capability**: Manage Intercom directories and call routing.
    -   **Implemented by**:
        -   Controller: `OSKBuildingIntercomController`, `OSKBuildingIntercomCallTransferListController`
        -   Service: `OSKBuildingIntercomService`, `OSKBuildingIntercomCallTransferListService`
        -   Representative Service Method: `addInhabitantInAllIntercoms`, `onUpdateBuildingIntercomsTransferList`
    -   **Evidence**: These services manage the `/buildings/{id}/intercoms` and `/buildings/{id}/callTransferList` collections, which define the content of the physical intercom's directory and the call order for each unit.
    -   **Confidence**: High.

-   **Capability**: Orchestrate data fan-out to maintain consistency.
    -   **Implemented by**:
        -   Controller: N/A (Cross-cutting concern)
        -   Service: Multiple services, including `OSKBuildingService` and `OSKAccessUpdateService`.
        -   Representative Service Method: `OSKBuildingService.onDocumentUpdated` -> `_cascadePublicProfileChange`
    -   **Evidence**: The `onDocumentUpdated` trigger on the `/buildings` collection initiates a cascade of updates to related documents (units, user accesses) to propagate changes like a new building name. This is a clear implementation of the fan-out pattern described in `OSkey Backend Services & Data Architecture.md`.
    -   **Confidence**: High.

### Evidence Used
-   Evidence artefact: `building-evidence-graph.json`
-   Architecture document: `Oskey Architecture.md`
-   Architecture document: `OSkey Backend Services & Data Architecture.md`
-   Architecture document: `Oskey Personas and Authority models.md`

### Confidence

High.

---

## 4. Public Interfaces

### Interpretation

The `building` module exposes a comprehensive set of services and controllers for internal use by other backend modules. Its primary public-facing interface is a large suite of HTTPS callable functions, clearly intended for the PGO (Property Manager Portal). These functions provide the administrative capabilities needed to manage the entire lifecycle of buildings, doors, units, inhabitants, and their associated settings. The module also defines two Firestore triggers that react to changes in building and device data, orchestrating data fan-out to maintain system-wide consistency.

### Evidence Used

-   Exported Symbol: `getCallableFunctionTriggers` in `functions/src/modules/building/index.ts` exports a large number of `https.onCall` handlers.
-   Exported Symbol: `getFirestoreTriggers` in `functions/src/modules/building/index.ts` exports Firestore trigger handlers.
-   API Contract: The evidence graph contains 38 `api_contract` facts, detailing the request/response schemas for the callable functions.
-   Exported Symbol: Numerous services (`OSKBuildingService`, `OSKBuildingDoorService`, etc.) and controllers (`OSKBuildingController`, etc.) are exported from the module's various `index.ts` files for use by other backend modules.

### Confidence

High.

---

## 5. Internal Structure

### Interpretation

The `building` module is internally decomposed into several submodules, each responsible for a specific sub-domain of the building concept. This modular structure promotes a clear separation of concerns.

-   **`building` (root):** Manages the core `Building` entity itself.
-   **`building_accesses`:** Manages the denormalized, building-centric ledger of who has access to what.
-   **`building_activity`:** Manages the aggregation and logging of activity events that occur within a building.
-   **`building_door`:** Manages doors and their association with Access Control Devices. This submodule contains a critical Firestore trigger that orchestrates device configuration and intercom setup when a device is assigned to a door.
-   **`building_intercoms`:** Manages the digital directories and call routing lists for intercom devices.
-   **`building_pincode`:** Manages the building-centric fast-lookup index for all valid PIN codes.
-   **`building_settings`:** Manages configurable policies and rules for a building.
-   **`building_unit`:** Manages the units within a building.
-   **`unit_management`:** A significant submodule that handles the complex logic of managing inhabitants, guests, and invitations within a unit, enforcing the platform's authority model.

Each submodule typically contains its own services for business logic and controllers for data access, following a consistent architectural pattern.

### Evidence Used

-   Source File: The directory structure shown in the `source_file` facts in `building-evidence-graph.json` clearly delineates the submodules (e.g., `functions/src/modules/building/modules/building_door/`).
-   Service: The presence of specialized services like `OSKBuildingDoorService` and `OSKBuildingUnitService` confirms the domain decomposition.
-   Controller: The presence of corresponding controllers like `OSKBuildingDoorController` and `OSKBuildingUnitController` confirms the layered structure within each submodule.
-   Firestore Trigger: The `onDocumentCreated` trigger in the `building_door` submodule demonstrates its responsibility for orchestrating device setup.

### Confidence

High.

---

## 6. Firestore & Data Ownership

### Interpretation

The `building` module is the definitive owner of the `/buildings` root collection and all its nested sub-collections. This represents a significant portion of the platform's core business data.

-   **Primary Ownership**: The module has direct, primary ownership of the `/buildings` collection, where each document is an aggregate root for a physical building.

-   **Owned Sub-Collections**: Evidence confirms ownership and management of the following nested collections:
    -   `/buildings/{id}/accesses`: A denormalized ledger of user access grants for the building.
    -   `/buildings/{id}/activities`: A log of access events within the building.
    -   `/buildings/{id}/callTransferList`: Call routing rules for intercoms.
    -   `/buildings/{id}/doors`: The doors within the building.
    -   `/buildings/{id}/doors/{id}/accessControlDevices`: The link between a door and a physical device.
    -   `/buildings/{id}/intercoms`: Digital directories for intercoms.
    -   `/buildings/{id}/pincodes`: A fast-lookup index of all valid PINs in the building.
    -   `/buildings/{id}/pincodesTrash`: An audit trail for deleted PINs.
    -   `/buildings/{id}/settings`: Building-specific operational rules.
    -   `/buildings/{id}/units`: The residential or commercial units in the building.
    -   `/buildings/{id}/units/{id}/inhabitants`: The official residents of a unit.
    -   `/buildings/{id}/units/{id}/permanentGuests`: Long-term, trusted guests of a unit.
    -   `/buildings/{id}/units/{id}/pendingInvitations`: Staged invitations for a unit.

-   **Data Replication**: The module is a major orchestrator of data fan-out. It writes denormalized data to collections owned by other modules, such as `/users/{id}/accesses` and `/organizations/{id}/buildings`, to optimize for client-side reads and maintain data consistency, as described in `OSkey Backend Services & Data Architecture.md`.

### Evidence Used

-   Firestore Schema: `firestore-schema.md` lists the fields for `/buildings` and its many sub-collections.
-   Architecture: `OSkey Backend Services & Data Architecture.md` explicitly states that Firestore is the authoritative source for `buildings` and `units`.
-   Controller Method: Controller methods like `OSKBuildingController.getCollectionPath` return `'/buildings'`. Methods in submodule controllers (e.g., `OSKBuildingDoorController`) construct paths like `buildings/${buildingId}/doors`.
-   Call Expression: Services within the `building` module are seen calling controllers for other modules (e.g., `OSKUserAccessService`, `OSKOrganizationBuildingController`), confirming its role in writing denormalized data.

### Confidence

High.

---

## 7. API Endpoints

This section is detailed in the companion `apis/building-api-reference.md` document.

---

## 8. Firestore Triggers

### Interpretation

The `building` module defines two critical Firestore triggers that are central to its role in data orchestration and fan-out. These triggers ensure that changes in one part of the system are automatically and consistently propagated to dependent entities.

-   The trigger on the creation of a device-door link (`/buildings/{bId}/doors/{dId}/accessControlDevices/{id}`) is a key orchestration point. It initiates the setup of the physical device by creating its configuration and adding it to the building's intercom directory. This decouples the device setup from the initial administrative action.
-   The trigger on the update of a building document (`/buildings/{buildingId}`) ensures data consistency. It cascades changes to the building's name and address down to all related entities, preventing stale data from appearing in user-facing applications.

### Triggers

| Trigger Type | Firestore Path | Handler | Likely Side Effect(s) | Confidence |
| :--- | :--- | :--- | :--- | :--- |
| `onDocumentCreated` | `buildings/{bId}/doors/{dId}/accessControlDevices/{id}` | `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated` | Creates a new intercom entry via `OSKBuildingIntercomService.createIntercomEntry` and saves a new device configuration via `OSKAccessControlDeviceConfigController.default.save`. | High |
| `onDocumentUpdated` | `buildings/{buildingId}` | `OSKBuildingService.onDocumentUpdated` | Cascades `name` and `streetAddress` changes to related `units`, `user accesses`, and `building accesses` collections via `_cascadePublicProfileChange`. | High |

### Evidence Used
-   Firestore Trigger: `onDocumentCreated` fact with handler `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated` in `building-evidence-graph.json`.
-   Firestore Trigger: `onDocumentUpdated` fact with handler `OSKBuildingService.onDocumentUpdated` in `building-evidence-graph.json`.
-   Call Expression: Call expressions within the handlers confirm the side effects, such as `OSKBuildingIntercomService.createIntercomEntry` and `OSKAccessUpdateService.updateUserAccessesBuildingInfo`.

### Confidence

High.

---

## 9. Permissions & Security

### Interpretation

Security is a primary concern for the `building` module, enforced at multiple layers. All callable functions are protected by App Check and user authentication. Business logic within the services is heavily gated by fine-grained, role-based access control (RBAC) permissions. For example, creating a building requires the `v1.org.buildings.create` permission, while editing requires `v1.org.buildings.edit`. This ensures that only authorized administrators can perform structural changes. The Firestore security rules further enforce these boundaries at the database level, using functions like `canEditBuilding` and `canViewBuilding` to protect collections from unauthorized access.

### Evidence Used

-   Permission Required: The evidence graph contains 47 `permission_required` facts, showing extensive use of permission strings like `v1.org.buildings.create`, `v1.org.buildings.edit`, `v1.org.units.create`, etc., within service methods.
-   RBAC: The `rbac-roles.json` document defines the composite roles that grant these permissions.
-   Firestore Rules: `firestore.rules.txt` defines security functions like `canEditBuilding(buildingId)` and `canViewBuilding(buildingId)` which check a user's roles before allowing access to the `/buildings/{buildingId}/units` collection.
-   Call Expression: Services consistently call `OSKConsolidatedRolesController.default.checkUserPermissions` before executing sensitive logic.

### Confidence

High.

---

## 10. Cross-Module Relationships

### Interpretation

The `building` module is highly interconnected, acting as a central hub that orchestrates actions across several other core modules.

-   **`organization`**: The `building` module has a strong dependency on the `organization` module to manage the hierarchical relationship where buildings belong to properties and entities. It calls services like `OSKOrganizationBuildingController` and `OSKPropertyController` to update these parent documents when a building is created or moved.
-   **`user`**: There is a tight, bidirectional relationship with the `user` module. The `building` module reads user data (e.g., `OSKUserDocument`) to denormalize user names into its own records (like access ledgers). Conversely, it writes denormalized building information into user-specific collections like `/users/{id}/accesses`.
-   **`access`**: The `building` module delegates the core logic of provisioning and revoking access to the `access` module. Services like `OSKUnitManagementInhabitantService` call `OSKAccessService.createAccess` and `OSKAccessService.deleteAccessById` to grant or remove a user's credentials.
-   **`core`**: The module depends on `core` for base classes (e.g., `OSKBaseService`, `OSKDocumentController`) and common models.
-   **`tasks`**: The `intercoms` submodule uses the `OSKTaskSchedulerService` from the `tasks` module to schedule the future activation and deactivation of intercom messages.

### Evidence Used

-   Imports Dependency: The evidence graph shows imports from `../user`, `../organization`, `../core`, and `../access_control_device`.
-   Call Expression: Numerous calls are made to services and controllers from other modules, such as `OSKAccessService.createAccess`, `OSKOrganizationBuildingController.default.save`, `OSKUserIntercomService.updateAllUserIntercomEntry`, and `OSKTaskSchedulerService.scheduleTask`.

### Confidence

High.

---

## 11. External Hooks

### Interpretation

The `building` module integrates with several external systems and GCP services to fulfill its responsibilities.

-   **Google Cloud Storage**: The module directly interacts with Cloud Storage to manage images for buildings and properties. The `OSKBuildingService` contains logic to upload and delete images from specific bucket paths (e.g., `buildings/{buildingId}/public/images/{filename}`).
-   **Google Cloud Pub/Sub**: The module is a significant publisher of events. The `OSKIntercomMessagePublisherService` publishes messages to a Pub/Sub topic defined by the `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` environment variable. This is the primary mechanism for synchronizing intercom directory changes with the downstream hardware layer (`node-iot-api-oskey-io`).
-   **Google Cloud Tasks**: The `OSKIntercomCommunicationService` uses the `tasks` module to schedule future work, which relies on Cloud Tasks for execution.
-   **Firebase Emulator**: The code contains checks for the `OSK_FIREBASE_EMULATOR` environment variable to alter its behavior during local development, particularly for generating Cloud Storage URLs.

### Evidence Used

-   Storage Path: The evidence graph identifies the storage path `^buildings/[a-zA-Z0-9-]*/public/images/[a-zA-Z0-9-]*.(png|jpg|jpeg)$`.
-   Call Expression: `OSKBuildingController.default._uploadImage` and `_deleteImage` methods are called by the `OSKBuildingService`.
-   Environment Variable: The evidence graph lists `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` and `OSK_FIREBASE_EMULATOR` as used environment variables.
-   Call Expression: `OSKIntercomMessagePublisherService.publishMessage` is called from multiple services within the `building_intercoms` submodule.
-   Call Expression: `OSKTaskSchedulerService.scheduleTask` is called by `OSKIntercomCommunicationService`.

### Confidence

High.

---

## 12. Architectural Observations

### Interpretation

The `building` module exhibits several key architectural patterns that are crucial to the platform's design.

-   **Aggregate Root**: The `Building` entity acts as an aggregate root. All operations on its child entities (Doors, Units) are managed through the `building` module's services, and lifecycle rules (e.g., preventing deletion of a building with active units) are enforced here, ensuring the consistency of the aggregate.

-   **Data Denormalization and Fan-Out**: The module is a primary source of data fan-out. It intentionally duplicates data, such as building names and user names, into various read-optimized documents (e.g., `/users/{id}/accesses`, `/buildings/{id}/accesses`). This is consistent with the "Denormalization for Read-Optimization" principle outlined in `OSkey Backend Services & Data Architecture.md`.

-   **Orchestration Service Pattern**: Many services within this module act as orchestrators. They don't just perform a single action but coordinate a sequence of operations across multiple controllers and other services to complete a business workflow. For example, `OSKBuildingService.deleteBuilding` orchestrates checks for dependencies before proceeding with the deletion.

-   **Event-Driven Architecture**: The use of Firestore triggers (e.g., `onDocumentUpdated`) and Pub/Sub publishing demonstrates an event-driven approach. Changes to core data trigger asynchronous side effects, decoupling complex workflows from the initial user-facing request.

### Evidence Used

-   Architecture: The concept of aggregate roots and denormalization is described in `OSkey Backend Services & Data Architecture.md`.
-   Service Method: The implementation of `deleteBuilding` in `OSKBuildingService` shows pre-condition checks against child collections (`doors`, `units`).
-   Firestore Trigger: The `onDocumentUpdated` trigger in `OSKBuildingService` explicitly calls a `_cascadePublicProfileChange` method to fan-out data.
-   Call Expression: Services frequently call multiple other services in sequence to complete a single logical operation.

### Confidence

High.

---

## 13. Risks & Open Questions

### Interpretation

-   **Incomplete Features**: The architecture document for `pincodesTrash` states it is not fully implemented. The evidence confirms this, as the `OSKBuildingPincodeTrashService` is an empty class. The purpose and final implementation of this soft-delete mechanism remain an open question.
-   **Schema Discrepancy**: The `building_unit_door` submodule and its corresponding Firestore path (`/buildings/{bId}/units/{uId}/doors`) are present in the code but are not documented in the `firestore-schema.md` file. This indicates a potential gap between the implementation and the documented schema. The architecture docs also state this is a future concept.
-   **External Dependencies**: The module's correctness relies on downstream consumers, particularly the `node-iot-api-oskey-io` repository that consumes Pub/Sub messages. The exact contract and behavior of this consumer are not defined within the `cloud-oskey-io` repository's evidence, representing an external dependency risk.
-   **Inefficient Data Lookups**: The activity services (`OSKSupplierStaffActivityService`) use a `getSupplierStaffFromAllSuppliers` method that appears to scan the entire `/suppliers` collection to enrich a single event. This presents a significant performance and scalability risk as the number of suppliers grows.

### Evidence Used

-   Architecture Document: `OSkey Backend Services & Data Architecture.md` notes that the `pincodesTrash` module is not fully implemented.
-   Service: `OSKBuildingPincodeTrashService` is an empty class in the evidence graph.
-   Service: `OSKBuildingUnitDoorService` exists and operates on a path not present in `firestore-schema.md`.
-   Call Expression: `OSKSupplierStaffActivityService` calls `OSKSupplierService.getSupplierStaffFromAllSuppliers`.

### Confidence

High.

---

## 14. Evidence References

-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/output/runs/20260719-151741/knowledge-pipeline/modules/building/building-evidence-graph.json`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/docs/Oskey Architecture.md`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/docs/firestore-schema.md`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/docs/firestore.rules.txt`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/docs/rbac-roles.json`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/docs/Oskey Personas and Authority models.md`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/module-engineering-profile/cross-repository-architecture.md`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/module-engineering-profile/work-order.md`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/module-engineering-profile/rules.md`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/module-engineering-profile/persona.md`
-   `/Users/davidopenshaw/Documents/clients/oskey/documentation/level-5_engineering_knowledge/ai-runtime/contracts/module-engineering-profile/output-schema.md`
