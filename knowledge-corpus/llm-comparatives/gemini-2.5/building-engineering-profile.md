# Module Engineering Profile: `building`

## 0. Generation Metadata
- **runId**: `20260801_173721-1aa319b1`
- **generatedAt**: `2026-08-02T06:25:39.122Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `building`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-2.5-pro`

## 1. Executive Summary
The `building` module is a core domain module responsible for managing the digital representation of physical buildings and their internal structure. **Confirmed**. It provides the foundational services for the lifecycle management of buildings, doors, and residential/commercial units. The module serves as the primary administrative entry point for configuring these entities via the Property Manager Portal (PGO). It orchestrates the creation of access rights, manages intercom directories, defines building-specific operational settings, and handles the association of physical Access Control Devices (ACDs) with their logical counterparts (doors). It is a central hub in the system, with extensive fan-out logic to ensure data consistency across related modules like `user` and `organization`, and it synchronizes state with physical hardware via Pub/Sub messaging. **Confirmed**.

## 2. Architectural Position
The `building` module sits at the heart of the Oskey domain model, directly below the `organization` and `property` scopes in the platform's hierarchy. **Confirmed**. It acts as the primary anchor for all physical field hardware, with the `access_control_device` module depending on it for contextual assignment (linking a device to a door). It is a foundational provider of data and services consumed by administrative workflows in the `organization` module and residential management workflows in the `unit_management` and `user` modules. The `building` module encapsulates the business logic for a building's structure (units, doors), its operational rules (settings), its access control configuration (PIN codes, intercoms), and its population (inhabitants, non-app users). It relies heavily on the `core` module for foundational services like access orchestration (`OSKAccessService`) and logging. **Confirmed**.

## 3. Primary Responsibilities
The `building` module's responsibilities are partitioned across its submodules (capabilities).

#### Capability: `_module_root`
- **Manage Building Lifecycle**: Provides callable functions to create, read, update, and delete `Building` entities in the `/buildings` collection. **Confirmed**.
- **Orchestrate Data Propagation**: On building updates, it fans out changes (e.g., `buildingName`) to associated units and user access documents to maintain data consistency. **Confirmed**.
- **Manage Building-Property Relationships**: Handles the assignment and un-assignment of buildings to properties. **Confirmed**.
- **Enforce Permissions**: Gates all administrative actions with `v1.org.buildings.*` RBAC permissions. **Confirmed**.

#### Capability: `building_accesses`
- **Maintain Building-Centric Access Ledger**: Manages a denormalized ledger at `/buildings/{buildingId}/accesses/{userId}` that aggregates all of a user's access rights within that building. **Confirmed**.
- **Create-or-Append Access Grants**: Provides internal services to create a new user access document or append a new access grant to an existing one. **Confirmed**.

#### Capability: `building_activity`
- **Log Building-Level Events**: Receives and stores enriched activity events (e.g., from physical devices) in the `/buildings/{bId}/doors/{dId}/activities` collection. **Confirmed**.
- **Provide Activity History**: Exposes callable functions for administrators to retrieve and delete activity logs for a specific door. **Confirmed**.

#### Capability: `building_door`
- **Manage Door Lifecycle**: Provides callable functions for administrators to create, update, retrieve, and delete door entities within a building. **Confirmed**.
- **Orchestrate ACD-to-Door Assignment**: Manages the critical workflow of assigning an Access Control Device to a door, which includes generating cryptographic keys, creating a device configuration, and creating an intercom entry. **Confirmed**.
- **Cascade Door Changes**: Propagates door information updates to user access documents and revokes access grants when a door is deleted. **Confirmed**.

#### Capability: `building_intercom`
- **Manage Intercom Digital Directories**: Creates and maintains the list of units and inhabitants displayed on a physical intercom's screen, stored in `/buildings/{bId}/intercoms`. **Confirmed**.
- **Manage Call Routing**: Manages the ordered call transfer lists (`/buildings/{bId}/callTransferList`) that define the sequence of users to call for a unit. **Confirmed**.
- **Synchronize with Hardware**: Publishes changes to intercom directories to a Pub/Sub topic to update physical devices. **Confirmed**.

#### Capability: `building_pincode`
- **Manage Building-Scoped PIN Codes**: Creates and manages PIN code documents in `/buildings/{bId}/pincodes`, using the PIN itself as the document ID for fast lookups. **Confirmed**.
- **Differentiate PIN Types**: Provides distinct creation methods for different user types (Inhabitant, Guest, Supplier, etc.). **Confirmed**.

#### Capability: `building_pincode_trash`
- **Provide Soft-Delete Mechanism for PINs**: Defines the data model and controller for a `pincodesTrash` collection, intended to log deleted PINs for auditing and to prevent immediate reuse. **Confirmed**. (Note: This capability is documented as not fully implemented).

#### Capability: `building_settings`
- **Manage Building-Specific Rules**: Provides callable functions to manage a building's operational settings (e.g., allowed access methods, invitation policies) stored in `/buildings/{bId}/settings`. **Confirmed**.
- **Cascade Settings Changes**: Fans out updates from the master building settings document to all corresponding user-specific settings documents (`/users/{userId}/buildingSettings/{bId}`). **Confirmed**.

#### Capability: `building_unit`
- **Manage Unit Lifecycle**: Provides callable functions to create, update, retrieve, and delete units within a building. **Confirmed**.
- **Manage Unit Inhabitants**: Orchestrates adding and removing inhabitants from a unit, which triggers the provisioning or revocation of access rights and updates to intercoms. **Confirmed**.
- **Manage Unit-Specific Doors**: Manages doors that are exclusive to a single unit, including auto-provisioning access for all unit inhabitants upon creation. **Confirmed**.

#### Capability: `building_unit_nonAppUser`
- **Manage PIN-Only Users**: Manages the full lifecycle of "Non-App Users" within a unit, who are granted access via PIN code only. **Confirmed**.
- **Orchestrate Non-App User Access**: Provides transactional functions to create a non-app user, provision their access, and generate a PIN code in a single operation. **Confirmed**.
- **Log Non-App User Activity**: Handles and stores activity events generated by non-app users. **Confirmed**.

#### Capability: `building_user`
- **Manage User-Building Association**: Creates a user record within a building's scope (`/buildings/{bId}/users/{userId}`) and orchestrates the creation of their initial access rights for that building. **Confirmed**.
- **Orchestrate Data Cleanup**: A Firestore trigger on the deletion of a building-user record cleans up related access documents. **Confirmed**.

## 4. Public Interfaces
The `building` module exposes its functionality primarily through HTTPS Callable Functions and is orchestrated internally by Firestore Triggers.

#### Callable Functions
- **`_module_root`**:
    - `getAllBuildings`, `getBuildingById`, `createOrganizationBuilding`, `updateBuilding`, `deleteBuildingImage`, `assigningBuildingToProperty`, `getBuildingsByPropertyId`
- **`building_activity`**:
    - `getActivityById`, `getAllBuildingActivities`, `deleteBuildingActivityById`, `deleteAllBuildingActivities`
- **`building_door`**:
    - `organizationUserCreateBuildingDoor`, `organizationUserUpdateBuildingDoor`, `organizationUserGetAllBuildingDoors`, `organizationUserGetBuildingDoorById`, `deleteBuildingDoor`
- **`building_intercom`**:
    - `onUpdateBuildingIntercomsTransferList`, `updateIntercomDisplayName`, `deleteIntercomDisplayName`
- **`building_settings`**:
    - `createBuildingSettings`, `getResidentSettings`, `updateBuildingSettings`, `deleteBuildingSettings`, `resetBuildingSettings`
- **`building_unit`**:
    - `organizationUserCreateBuildingUnit`, `organizationUserUpdateBuildingUnit`, `organizationUserGetAllBuildingUnits`, `organizationUserGetBuildingUnitById`, `deleteBuildingUnit`
- **`building_unit_nonAppUser`**:
    - `createNonAppUser`, `getNonAppUser`, `getAllNonAppUsers`, `updateNonAppUser`, `deleteNonAppUser`, `createNonAppUserAccess`, `createNonAppUserWithAccess`, `updateNonAppUserAccessDoors`
- **`building_user`**:
    - `createBuildingUser`

#### Firestore Triggers
- **`building_door`**:
    - `onDocumentCreated` on `/buildings/{bId}/doors/{dId}/accessControlDevices/{devId}`: Triggers the full workflow for assigning an ACD to a door.
    - `onDocumentDeleted` on `/buildings/{bId}/doors/{dId}/accessControlDevices/{devId}`: Triggers the cleanup workflow for un-assigning an ACD.
- **`building_user`**:
    - `onDocumentDeleted` on `/buildings/{bId}/users/{userId}`: Triggers the cleanup of the user's access records for that building.

## 5. Internal Structure
The `building` module is composed of multiple submodules, each with its own services and controllers that encapsulate a specific domain capability.

- **`OSKBuildingService` (`_module_root`)**: Orchestrates the building lifecycle and its relationships with properties and organizations.
- **`OSKBuildingDoorService` (`building_door`)**: Manages door lifecycle and orchestrates ACD assignment.
- **`OSKBuildingUnitService` (`building_unit`)**: Manages unit lifecycle.
- **`OSKBuildingUnitInhabitantService` (`building_unit`)**: Manages the inhabitants within a unit, acting as a key orchestrator for access provisioning by calling `OSKAccessService`.
- **`OSKBuildingIntercomService` (`building_intercom`)**: Manages the digital directory and call lists, publishing changes to Pub/Sub.
- **`OSKBuildingSettingsService` (`building_settings`)**: Manages building-specific configuration and fans out changes to user-level settings.
- **`OSKBuildingUnitNonAppUserService` (`building_unit_nonAppUser`)**: Manages the complete lifecycle for PIN-only users within a unit.
- **`OSKBuildingPincodeService` (`building_pincode`)**: A focused service for creating building-scoped PIN code documents.
- **`OSKBuildingAccessService` (`building_accesses`)**: Manages the building-centric access ledger.
- **`OSKBuildingActivitiesService` (`building_activity`)**: Manages the storage and retrieval of building-level activity logs.
- **`OSKBuildingUserService` (`building_user`)**: Manages the direct association of a user with a building.

**Intra-Module Coupling**: The submodules are highly interconnected. For example, `building_door`'s trigger calls `OSKBuildingIntercomService` (`building_intercom`). `building_unit`'s inhabitant service calls `OSKBuildingIntercomService` and reads from `OSKBuildingSettingsController` (`building_settings`). This tight coupling is necessary for the complex orchestration workflows the module is responsible for. **Confirmed**.

## 6. Firestore & Data Ownership
The `building` module is the authoritative owner of the `/buildings` root collection and all its subcollections.

- **`/buildings`**: Primary building documents. **Confirmed** (Owner: `_module_root`)
- **`/buildings/{id}/accesses`**: Building-centric access ledger. **Confirmed** (Owner: `building_accesses`)
- **`/buildings/{id}/callTransferList`**: Intercom call routing rules. **Confirmed** (Owner: `building_intercom`)
- **`/buildings/{id}/doors`**: Door documents. **Confirmed** (Owner: `building_door`)
- **`/buildings/{id}/doors/{id}/accessControlDevices`**: Link between a door and a physical device. **Confirmed** (Owner: `building_door`)
- **`/buildings/{id}/doors/{id}/accessControlDevices/{id}/keys`**: Cryptographic keys for an ACD-door pair. **Confirmed** (Owner: `building_door`)
- **`/buildings/{id}/doors/{id}/activities`**: Activity logs for a specific door. **Confirmed** (Owner: `building_activity`)
- **`/buildings/{id}/intercoms`**: Digital directory for physical intercoms. **Confirmed** (Owner: `building_intercom`)
- **`/buildings/{id}/pincodes`**: Fast-lookup index for all PINs in a building. **Confirmed** (Owner: `building_pincode`)
- **`/buildings/{id}/pincodesTrash`**: Soft-delete log for PINs. **Confirmed** (Owner: `building_pincode_trash`, noted as unimplemented)
- **`/buildings/{id}/settings`**: Master operational rules for a building. **Confirmed** (Owner: `building_settings`)
- **`/buildings/{id}/units`**: Unit documents. **Confirmed** (Owner: `building_unit`)
- **`/buildings/{id}/units/{id}/doors`**: Doors exclusive to a single unit. **Confirmed** (Owner: `building_unit`)
- **`/buildings/{id}/units/{id}/inhabitants`**: Inhabitant records for a unit. **Confirmed** (Owner: `building_unit`)
- **`/buildings/{id}/units/{id}/permanentGuests`**: Records for long-term guests. **Confirmed** (Owner: `building_unit`)
- **`/buildings/{id}/units/{id}/invitations`**: Invitations for a unit. **Confirmed** (Owner: `building_unit`)
- **`/buildings/{id}/units/{id}/nonAppUsers`**: Records for PIN-only users. **Confirmed** (Owner: `building_unit_nonAppUser`)
- **`/buildings/{id}/units/{id}/nonAppUsers/{id}/accesses`**: Access ledger for non-app users. **Confirmed** (Owner: `building_unit_nonAppUser`)
- **`/buildings/{id}/units/{id}/nonAppUsers/{id}/pincodes`**: PINs for non-app users. **Confirmed** (Owner: `building_unit_nonAppUser`)
- **`/buildings/{id}/units/{id}/nonAppUsers/{id}/activities`**: Raw activity logs for non-app users. **Confirmed** (Owner: `building_unit_nonAppUser`)
- **`/buildings/{id}/units/{id}/nonAppUsers/{id}/activityAggregates`**: Aggregated activity for non-app users. **Confirmed** (Owner: `building_unit_nonAppUser`)
- **`/buildings/{id}/users`**: Building-scoped user association records. **Confirmed** (Owner: `building_user`)

## 7. API Endpoints
This module exposes its public API via HTTPS Callable Functions. The following is a consolidated list.

- **`createOrganizationBuilding`**: Creates a new building.
    - Request: `{ organizationId: string, propertyId: string, name: string, streetAddress: OSKStreetAddress, imageFilename?: string }`
    - Response: `OSKBuildingDocument`
- **`updateBuilding`**: Updates an existing building.
    - Request: `{ buildingId: string, organizationId: string, data: { name?: string, streetAddress?: OSKStreetAddress, imageFilename?: string } }`
    - Response: `OSKBuildingDocument`
- **`organizationUserCreateBuildingDoor`**: Creates a new door.
    - Request: `{ buildingId: string, organizationId: string, name: string, streetAddress: OSKStreetAddress, isForAllResidents: boolean }`
    - Response: `OSKBuildingDoorDocument`
- **`organizationUserCreateBuildingUnit`**: Creates a new unit.
    - Request: `{ organizationId: string, buildingId: string, name: string, floor: string, unitNumber: string, streetAddress: OSKStreetAddress, capacity: number }`
    - Response: `OSKBuildingUnitDocument`
- **`createBuildingUser`**: Associates a user with a building and provisions access.
    - Request: `{ organizationId: string, buildingId: string, userId: string, firstName: string, lastName: string, accessRights: OSKAccessRights[], doors: OSKBuildingDoorDocument[], userType: OSKAccessType }`
    - Response: `OSKBuildingUser`
- **`createNonAppUserWithAccess`**: Creates a PIN-only user and their access in one transaction.
    - Request: `{ buildingId: string, unitId: string, fullName: string, inviterId: string, doorIds: string[] }`
    - Response: `{ nonAppUserId: string, accessId: string, pincode: string, fullName: string }`

*(Note: This is a representative subset. A full list is available in the API Reference document.)*

## 8. Firestore Triggers
- **`onDocumentCreated` on `/buildings/{bId}/doors/{dId}/accessControlDevices/{devId}`**: Orchestrates the assignment of a new ACD to a door, triggering key generation, device configuration, and intercom entry creation. **Confirmed**.
- **`onDocumentDeleted` on `/buildings/{bId}/doors/{dId}/accessControlDevices/{devId}`**: Orchestrates the un-assignment of an ACD from a door, triggering the deletion of keys, configurations, and other associated data. **Confirmed**.
- **`onDocumentDeleted` on `/buildings/{bId}/users/{userId}`**: Triggers the cleanup of the user's access records for that building from both building-centric and user-centric ledgers. **Confirmed**.

## 9. Permissions & Security
The `building` module enforces security through a combination of RBAC checks in its service layer and broad rules at the Firestore level.

- **RBAC Permissions**: The module's administrative callable functions are gated by specific permission strings, checked via `OSKConsolidatedRolesController`. Key permissions include:
    - `v1.org.buildings.create`
    - `v1.org.buildings.edit`
    - `v1.org.buildings.view`
    - `v1.org.buildings.delete`
    - `v1.org.settings.create`
    - `v1.org.settings.edit`
    - `v1.org.settings.view`
    - `v1.org.settings.delete`
    - `v1.admin.accessControlDevice.edit`
    - `v1.org.buildings.createManager` (Note: This permission is used in code but not defined in `rbac-roles.json`. See Risks section.)
    **Confirmed**.
- **Firestore Rules**: The `firestore.rules.txt` file grants broad read/write access to the `/buildings/{buildingId}` path and its subcollections with `allow read, write: if isValidUser();`. This means security is primarily enforced in the Cloud Function layer, not at the database level for granular operations. **Confirmed**.
- **Security Decorators**: All callable functions use the `@OSKUserSecurityChecks` decorator, which enforces user authentication and App Check verification. **Confirmed**.
- **Business Logic Checks**: Some services enforce permissions based on user roles within a unit (e.g., only a `tenant` or `owner` can delete a non-app user). **Confirmed**.

## 10. Cross-Module Relationships
The `building` module is a central, highly connected component of the backend.

#### Outbound Dependencies (Building depends on...)
- **`core`**: This is the most significant dependency. `building` relies on `core` for foundational controllers (`OSKDocumentController`), the primary access orchestration service (`OSKAccessService`), PIN code generation (`OSKPincodeService`), logging (`OSKLoggingService`), and publishing messages to hardware (`OSKAccessMessagePublisherService`). **Confirmed**.
- **`organization`**: `building` depends on `organization` to validate administrative permissions. It frequently calls services like `OSKOrganizationUserController` to fetch the calling user's roles within an organization before proceeding with an action. **Confirmed**.
- **`user`**: `building` depends on `user` to fetch user data and to update denormalized, user-centric views of data, such as `/users/{id}/accesses` and `/users/{id}/intercoms`. This is critical for keeping the mobile app's data consistent. **Confirmed**.
- **`settings`**: `building` depends on `settings` for the RBAC infrastructure, specifically `OSKConsolidatedRolesController`, to perform permission checks. **Confirmed**.
- **`access_control_device`**: `building` depends on `access_control_device` to update device documents (e.g., assigning a door) and to create device configurations. It also consumes enriched activity data from this module. **Confirmed**.

#### Inbound Dependencies (...depends on Building)
- **`organization`**: **Inferred**. The `organization` module needs to read building data to provide administrative views in the PGO (e.g., listing all buildings in an organization). The `_module_root` capability provides `getAllBuildings` for this purpose.
- **`user`**: **Inferred**. The `user` module's services (e.g., for displaying access rights in the mobile app) consume the denormalized data that the `building` module fans out to `/users/{userId}` subcollections.
- **`access_control_device`**: **Inferred**. The `access_control_device` module is contextually dependent on `building` to know where a device is physically located and what its purpose is (i.e., which door it controls).
- **`call`**: **Inferred**. The `call` module, which handles intercom calls, must read the call transfer lists from `/buildings/{id}/callTransferList` to know who to route a call to.

## 11. External Hooks
- **Pub/Sub**: The `building` module publishes messages to synchronize state with physical hardware. **Confirmed**.
    - **Topic**: `process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`
    - **Publisher**: `OSKBuildingIntercomService` publishes `Create`, `Update`, and `Delete` messages when the intercom directory changes.
- **Cloud Tasks**: The `building` module uses Cloud Tasks for scheduled operations. **Inferred** from architectural documents, though not directly evidenced in the provided capability outputs.
- **Vertex AI (Gemini)**: The `intercom_communication` service (part of `organization` but related to building intercoms) calls the Gemini API for text translation and reformulation. **Confirmed** from `organization` module documentation.

## 12. Architectural Observations
- **Orchestration and Fan-Out**: The module is characterized by complex orchestration services that trigger wide-reaching fan-out operations. For example, updating a building's name (`_module_root`) cascades to units and user access documents. Adding an inhabitant (`building_unit`) triggers access provisioning (`core`), intercom updates (`building_intercom`), and user settings creation (`user`). This pattern prioritizes read performance by denormalizing data but increases write complexity. **Confirmed**.
- **Event-Driven Architecture**: The use of Firestore triggers is central to the module's design, particularly for managing the tight coupling between logical entities (doors) and physical ones (ACDs). The `onDocumentCreated` trigger in `building_door` is a prime example of an event-driven workflow that orchestrates a multi-step, multi-service process. **Confirmed**.
- **Separation of Concerns via Submodules**: The module is well-structured into submodules, each handling a distinct aspect of the "building" domain (doors, units, settings, etc.). This modularity helps manage the high complexity of the domain. **Confirmed**.
- **Dual-Write for Read Optimization**: The system frequently employs a dual-write pattern. For example, the `building_unit_nonAppUser` capability writes activity events to both a raw, immutable log (`/activities`) and a pre-aggregated, time-windowed summary (`/activityAggregates`) to optimize UI loading times. **Confirmed**.
- **Incomplete or Evolving Features**: The presence of an unimplemented `building_pincode_trash` capability and commented-out code in the `deleteBuildingUnit` service suggests the module is still evolving, with some features planned or partially disabled. **Confirmed**.

## 13. Risks & Open Questions
- **Permission Mismatch**: The `building_door` service checks for the permission `v1.org.buildings.createManager` when deleting a door. This permission is not defined in the `rbac-roles.json` document, which could lead to unexpected `permission-denied` errors or a security vulnerability if the check fails open. **Confirmed**.
- **Contradictory Documentation vs. Implementation**: The architectural documentation states that the `/buildings/{id}/units/{id}/doors` collection is a "future-proof concept only" and "not implemented". However, the `building_unit` capability's code fully implements the creation of these doors and the provisioning of access for them. This indicates a significant documentation gap or a feature that was implemented ahead of schedule without updating architectural records. **Confirmed**.
- **Incomplete Deletion Logic**: The `deleteBuildingUnit` function in the `building_unit` capability has commented-out code (`// remove accesses`), suggesting that the logic to fully revoke access for all inhabitants when a unit is deleted may be incomplete. This poses a security risk of orphaned access rights. **Confirmed**.
- **Overly Broad Firestore Rules**: The security rules for the entire `/buildings` collection and its subcollections are `allow read, write: if isValidUser();`. This is extremely permissive and delegates all granular security enforcement to the Cloud Function layer. A client-side bug or misconfiguration could potentially allow an authenticated user to bypass business logic and write directly to sensitive collections like `/pincodes` or `/settings`. **Confirmed**.
- **Unexposed Deletion/Upload APIs**: The `_module_root` capability contains internal service methods for `deleteBuilding` and `uploadImage`, but these are not exposed as public callable functions. It is unclear how these critical administrative operations are intended to be triggered by a PGO user. **Confirmed**.
- **Scalability of Lookups**: The `building_unit_nonAppUser` capability's activity logging service needs to perform a broad query to find a `unitId` from a `nonAppUserId`, which could be inefficient at scale. **Confirmed**.

## 14. Evidence References
Specific file and line number citations were not present in the provided capability-level synthesis documents. The claims in this profile are based on the service names, method names, Firestore paths, and permission strings reported as **Confirmed** or **Inferred** in those source documents. For example, a claim about the `createOrganizationBuilding` function is based on the analysis of that function provided in the `_module_root` capability output. All claims are traceable back to a specific capability output provided in the prompt.