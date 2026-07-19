# INV-002 Architectural Topology Discovery

---

## Metadata

| | |
| :--- | :--- |
| **Investigation** | INV-002 |
| **Version** | 3.0 |
| **Repository** | Oskey Cloud Functions Backend |
| **Evidence Version** | 0.2 |
| **Generated Date** | 2026-07-19 |
| **Previous Investigation** | INV-001 |
| **Classification** | Engineering Knowledge Corpus Artefact |
| **Overall Confidence** | High |
| **Status** | Completed |

---

## 1. Repository Architectural Identity

The Oskey Cloud Functions backend repository implements a modular, event-driven backend for a physical access control system. Its primary engineering purpose is to serve as the authoritative source for business logic, data ownership, and orchestration for the Oskey platform, separating these concerns from the physical hardware layer.

The most architecturally significant responsibilities are:
*   **Access Orchestration**: Coordinated by the `core` module, this is the central capability for provisioning, revoking, and updating physical access credentials, including the complex lifecycle of associated pincodes.
*   **Identity Management**: Anchored by the `user` module, which serves as the source of truth for user profiles, devices, and user-scoped data.
*   **Hierarchical Asset Management**: Managed by the `organization` and `building` modules, which model the real-world tenancy structure from customer organizations down to individual buildings and units.
*   **Privileged Administration**: Provided by the `admin` module, which offers a secure, cross-cutting API for data maintenance and repair operations.

The dominant integration boundaries are:
*   **Client-Facing APIs**: A set of HTTPS Callable Functions exposed by modules like `unit_management`, `admin`, `supplier`, and `organization` for consumption by the PGO portal and mobile applications.
*   **Hardware Integration via Pub/Sub**: An event-driven boundary where the `core` module publishes "access intent" messages to Google Pub/Sub topics. This decouples the backend from the hardware-facing IoT layer, which consumes these messages to synchronize physical devices.
*   **External Service Integrations**: Interfaces with external providers like Auth0 for identity, Twilio/APNS/FCM for notifications (via the `apps` module), and Google Cloud Tasks for asynchronous work (via the `tasks` module).

The main architectural characteristics are the "Authoritative Source with Projections" pattern, where canonical data is stored in modules like `user` and `building` and then denormalized into read-optimized ledgers, and the use of dedicated orchestration services (`core`, `unit_management`) to manage complex, multi-step business processes.

---

## 2. Module Responsibility Catalogue

### `access_control_device`
*   **Primary Responsibilities**: Manages the backend document model and persistence for physical Access Control Devices (ACDs).
*   **Specific Capabilities**: ACD lifecycle persistence, device configuration management, public key management, runtime state capture, command history, and system log persistence.
*   **Significant Operations**: `onDocumentCreated`, `onDocumentDeleted`, `onDocumentUpdated` triggers for device and configuration lifecycle.
*   **Authoritative Ownership**: `/accessControlDevices` and its subcollections (`/configs`, `/publicKeys`).
*   **Lifecycle Responsibilities**: Manages the creation, deletion, and configuration updates of device documents via Firestore triggers.
*   **Events Published**: None directly. Its data changes are consumed by other modules.
*   **Events Consumed**: Device assignment events (inferred from its relationship with the `building` module).
*   **Consumers**: Hardware sync workflows, `core` (access orchestration), `admin`, `building`.
*   **Producers**: PGO/Admins (via administrative UIs).
*   **Architectural Significance**: Acts as the authoritative source for the digital representation of physical hardware in the cloud.
*   **Confidence**: High.

### `admin`
*   **Primary Responsibilities**: Provides a privileged, cross-cutting administrative and maintenance API for backend operations.
*   **Specific Capabilities**: Data inspection and mutation across buildings, organizations, and users; data repair and synchronization logic (e.g., for access ledgers, intercoms); and pincode refresh workflows.
*   **Significant Operations**: A large suite of callable functions for user deletion, access recreation, pincode refresh, and bulk data back-filling.
*   **Authoritative Ownership**: None. It is a privileged orchestrator and mutator of collections owned by other modules.
*   **Lifecycle Responsibilities**: Orchestrates bulk data lifecycle operations, such as migrations and repairs.
*   **Events Published**: None.
*   **Events Consumed**: None directly; it is invoked via explicit callable functions.
*   **Consumers**: Internal PGO Portal, Human Operators.
*   **Producers**: N/A (Orchestrator).
*   **Architectural Significance**: A high-privilege orchestration hub with a wide operational blast radius, essential for platform maintenance but also a significant security boundary.
*   **Confidence**: High.

### `apps`
*   **Primary Responsibilities**: A shared application-communications module for sending user-facing notifications.
*   **Specific Capabilities**: Email delivery (via SMTP), SMS delivery (via Twilio), push notification dispatch (via APNS/FCM), and QR code generation.
*   **Significant Operations**: `send` (for email), `sendSms`, `send` (for push notifications).
*   **Authoritative Ownership**: `/EmailLogs`. Inferred ownership of SMS logs.
*   **Lifecycle Responsibilities**: Manages the lifecycle of outbound communications and their logs.
*   **Events Published**: Publishes notifications to external provider APIs.
*   **Events Consumed**: None. It is a utility service called by other modules.
*   **Consumers**: Any backend module that needs to send user-facing communications (e.g., `call`, `user`, `organization`).
*   **Producers**: N/A (Utility).
*   **Architectural Significance**: Centralizes all outbound communication logic, providing a single, consistent interface and abstracting away provider-specific details.
*   **Confidence**: High.

### `building`
*   **Primary Responsibilities**: Owns the `Building` scope, representing a physical structure in the platform hierarchy.
*   **Specific Capabilities**: Manages the core `/buildings` documents and coordinates building-scoped subdomains like doors, units, intercoms, settings, and pincodes.
*   **Significant Operations**: `createOrganizationBuilding`, `updateBuilding`, `deleteBuilding`, `organizationUserCreateBuildingDoor`.
*   **Authoritative Ownership**: `/buildings` and its subcollections (`/doors`, `/units`, `/settings`, `/intercoms`, `/pincodes`, `/pincode_trash`).
*   **Lifecycle Responsibilities**: Manages the lifecycle of buildings and their structural sub-entities.
*   **Events Published**: Publishes intercom directory changes to Pub/Sub.
*   **Events Consumed**: Consumes device assignment events via Firestore triggers on `/doors/{doorId}/accessControlDevices`.
*   **Consumers**: `admin`, `core` (access orchestration), `call`, `unit_management`.
*   **Producers**: PGO/Admins.
*   **Architectural Significance**: The authoritative source for physical asset data, providing the structural context for access control and tenancy.
*   **Confidence**: High.

### `call`
*   **Primary Responsibilities**: Manages real-time call sessions initiated from Intercom devices.
*   **Specific Capabilities**: Orchestrates the `/calls` state machine, handles call creation and state updates, notifies recipients, and archives completed calls to user history.
*   **Significant Operations**: HTTP `POST /calls`, `PATCH /calls/:callId`.
*   **Authoritative Ownership**: The operational `/calls` collection.
*   **Lifecycle Responsibilities**: Manages the short-lived state of an active call session from creation to termination.
*   **Events Published**: Fans out historical call data to the `user` module upon completion.
*   **Events Consumed**: Consumes call initiation requests from Intercom devices via an HTTP endpoint.
*   **Consumers**: Intercom Devices, Resident Mobile Apps.
*   **Producers**: Intercom Devices.
*   **Architectural Significance**: Forms the boundary for real-time communications, orchestrating a state machine and fanning out historical data to other systems.
*   **Confidence**: High.

### `core`
*   **Primary Responsibilities**: Provides shared backend infrastructure and the central orchestration service for physical access grants and pincode lifecycle management.
*   **Specific Capabilities**: Generic Firestore controllers, Pub/Sub publishing, secret management, Auth0 integration, the `access` orchestration service, and the `pincode` generation and lifecycle service.
*   **Significant Operations**: `createAccess`, `deleteAccessById`, `generatePincode`, `deleteBuildingPincodeAndMoveToTrash`, `publishMessageToAllACDs`, `exchangeAuth0Token`.
*   **Authoritative Ownership**: None. It orchestrates writes across collections owned by `user`, `building`, and `supplier`, including their respective `pincodes` subcollections.
*   **Lifecycle Responsibilities**: Manages the entire lifecycle of an access grant and its associated pincode, from provisioning to revocation and hardware synchronization.
*   **Events Published**: Publishes "access intent" messages to the `OSK_PUBSUB_TOPIC_ACD_ACCESSES` topic.
*   **Events Consumed**: Consumes device activity events from Pub/Sub via its `PubSubMessageProcessor`.
*   **Consumers**: All modules that grant or revoke physical access (`unit_management`, `supplier`, `admin`).
*   **Producers**: N/A (Orchestrator/Infrastructure).
*   **Architectural Significance**: The most critical hub in the architecture, acting as both a shared infrastructure layer and the central orchestrator for the platform's primary business functions (access control and pincode management).
*   **Confidence**: High.

### `organization`
*   **Primary Responsibilities**: Manages the top-level customer tenancy model.
*   **Specific Capabilities**: Owns the `/organizations` collection and its subdomains, including entities, properties, residents, organization users, and invitation workflows.
*   **Significant Operations**: `createAnOrganization`, `updateAnOrganization`, `inviteUserWithInvitation`.
*   **Authoritative Ownership**: `/organizations` and its subcollections.
*   **Lifecycle Responsibilities**: Manages the lifecycle of customer tenants and their associated administrative users and assets.
*   **Events Published**: None directly.
*   **Events Consumed**: None directly.
*   **Consumers**: `admin` module, PGO administrative UIs.
*   **Producers**: Oskey Staff (for initial creation).
*   **Architectural Significance**: The root of the platform's multi-tenant data hierarchy.
*   **Confidence**: High.

### `settings`
*   **Primary Responsibilities**: Manages the platform's configuration and Role-Based Access Control (RBAC) catalog.
*   **Specific Capabilities**: Manages role definitions, composite roles, and consolidated permission checks.
*   **Significant Operations**: `onDocumentCreated`, `onDocumentUpdated` triggers for role hierarchy maintenance; `checkUserPermissions` helper.
*   **Authoritative Ownership**: The `/settings` collection and its subcollections.
*   **Lifecycle Responsibilities**: Manages the lifecycle of RBAC roles and platform configuration via callable functions and Firestore triggers.
*   **Events Published**: None.
*   **Events Consumed**: Consumes its own document changes via Firestore triggers to maintain consistency.
*   **Consumers**: All modules that perform permission checks (`admin`, `organization`, `supplier`, `core`).
*   **Producers**: PGO/Admins.
*   **Architectural Significance**: Provides the foundational data for the platform's security and authorization model.
*   **Confidence**: High.

### `supplier`
*   **Primary Responsibilities**: Manages third-party service providers and their staff.
*   **Specific Capabilities**: Manages supplier company records, staff records, and orchestrates their building access, pincodes, and activity logging.
*   **Significant Operations**: `createSupplier`, `createStaffMember`, `createSupplierStaffAccess`, `deleteSupplier`.
*   **Authoritative Ownership**: `/suppliers` and its subcollections.
*   **Lifecycle Responsibilities**: Manages the lifecycle of suppliers and their staff, including the cascading deletion of access rights.
*   **Events Published**: None directly; calls `core` to publish access changes.
*   **Events Consumed**: Consumes activity events via its `ActivityReceivedForSupplierStaff` handler.
*   **Consumers**: PGO administrative UIs, `admin` module.
*   **Producers**: PGO/Admins.
*   **Architectural Significance**: A domain-specific administrative and access-control module for a key external persona.
*   **Confidence**: High.

### `tasks`
*   **Primary Responsibilities**: A small infrastructure module for scheduling and handling asynchronous backend work.
*   **Specific Capabilities**: Exposes an HTTP task handler and a scheduler service backed by Google Cloud Tasks.
*   **Significant Operations**: `scheduleTask`, `cancelTask`, `handleTask`.
*   **Authoritative Ownership**: None.
*   **Lifecycle Responsibilities**: Manages the lifecycle of a scheduled task.
*   **Events Published**: Publishes tasks to the Google Cloud Tasks service.
*   **Events Consumed**: Consumes task execution requests from Google Cloud Tasks via an HTTP endpoint.
*   **Consumers**: Any module needing to schedule deferred work (`admin`, `organization`).
*   **Producers**: N/A (Utility).
*   **Architectural Significance**: Provides a generic mechanism for decoupling long-running or future work from synchronous requests.
*   **Confidence**: High.

### `unit_management`
*   **Primary Responsibilities**: Orchestrates the management of people (inhabitants, guests) and invitations within a specific Building Unit.
*   **Specific Capabilities**: Handles unit invitation creation/consumption, inhabitant/guest management, and the cleanup of associated access, pincodes, and intercom entries.
*   **Significant Operations**: `createUnitInvitation`, `removeInhabitantFromUnit`, `removePendingInvitation`.
*   **Authoritative Ownership**: `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations`.
*   **Lifecycle Responsibilities**: Manages the lifecycle of people within a unit, orchestrating calls to other services.
*   **Events Published**: None directly; calls `core` to publish access changes.
*   **Events Consumed**: None directly; invoked via callable functions.
*   **Consumers**: Resident-facing Mobile Apps.
*   **Producers**: Residents.
*   **Architectural Significance**: A resident-facing orchestration layer that translates user actions into coordinated backend operations across multiple domains.
*   **Confidence**: High.

### `user`
*   **Primary Responsibilities**: Manages user identity, profiles, and all user-scoped data and relationships.
*   **Specific Capabilities**: Manages user profiles, devices, notification settings, invitations, organization memberships, user-scoped settings, pincodes, and access records.
*   **Significant Operations**: `onAccountCreated`, `onAccountDeleted` Auth triggers; `onDocumentCreated`, `onDocumentUpdated` Firestore triggers for profile changes.
*   **Authoritative Ownership**: `/users` and its subcollections.
*   **Lifecycle Responsibilities**: Manages the entire user account lifecycle, from creation via Auth0 to a full, cascading deletion of all associated data.
*   **Events Published**: None directly.
*   **Events Consumed**: Firebase Auth triggers (`onCreate`, `onDelete`) and its own document changes via Firestore triggers.
*   **Consumers**: Nearly all other modules, as user identity is central to the platform.
*   **Producers**: Users (via mobile apps), PGO/Admins, Auth0.
*   **Architectural Significance**: The central identity hub of the platform. Its availability and data integrity are critical for almost all other system functions.
*   **Confidence**: High.

---

## 3. Architecturally Significant Capabilities

### Physical Access Provisioning & Revocation
*   **Description**: The end-to-end process of granting or revoking a user's ability to open a physical door using any credential (PIN, SecureBLE).
*   **Coordinating or Owning Module**: `core` (specifically the `access` submodule).
*   **Participating Modules**: `unit_management`, `supplier`, `admin` (as initiators); `user`, `building` (as data sources/targets); `core` (as orchestrator).
*   **Significant Operations**: `OSKAccessService.createAccess`, `OSKAccessService.deleteAccessById`.
*   **Data Involved**: `/users/{id}/accesses`, `/buildings/{id}/accesses`, `/users/{id}/pincodes`, `/buildings/{id}/pincodes`, `/users/{id}/devices/{id}/accessControlDeviceTokens`.
*   **Events or Messages Involved**: Publishes "access intent" messages (Insert, Update, Delete) to the `OSK_PUBSUB_TOPIC_ACD_ACCESSES` Pub/Sub topic.
*   **External Boundaries**: Pub/Sub topic for the hardware sync layer (IoT backend/MongoDB).
*   **Evidence**: `core` engineering profile, `OSkey Backend Services & Data Architecture.md`.
*   **Confidence**: High.

### Pincode Generation and Lifecycle Management
*   **Description**: The cross-cutting technical capability for generating a unique, non-colliding pincode, associating it with a user and an access grant, writing it to performance-optimized data stores, and securely revoking it upon access termination.
*   **Coordinating or Owning Module**: `core` (specifically `OSKPincodeService` and `OSKPincodeGenerationService`).
*   **Participating Modules**: `core` (orchestrator), `user`, `building`, `supplier` (as data targets for pincode documents), `admin` (for refresh tasks).
*   **Significant Operations**: `OSKAccessService.createAccess` -> `OSKPincodeService.addPincodeDocumentsToAccess` -> `OSKPincodeGenerationService.generatePincode`. Also `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash`.
*   **Data Involved**: Implements a "Paired Document Pattern" with writes to user-centric collections (e.g., `/users/{id}/pincodes`, `/suppliers/.../pincodes`) and a building-centric collection (`/buildings/{id}/pincodes`). It also reads from and writes to `/buildings/{id}/pincode_trash` for collision avoidance and auditing.
*   **Events or Messages Involved**: Pincode data is included in the payload for the `OSK_PUBSUB_TOPIC_ACD_ACCESSES` Pub/Sub topic. The `admin` module's `OSKPincodeRefreshWorkerService` uses the `tasks` module for scheduling.
*   **External Boundaries**: The pincode is consumed by ACD Hardware via the hardware projection store (inferred to be MongoDB).
*   **Evidence**: `core` and `admin` engineering profiles, `OSkey Backend Services & Data Architecture.md`.
*   **Confidence**: High.

### User Identity & Profile Management
*   **Description**: The management of a user's lifecycle, from creation and authentication via an external provider to profile updates and complete data deletion.
*   **Coordinating or Owning Module**: `user`.
*   **Participating Modules**: `core` (for Auth0 integration), `admin` (for privileged operations).
*   **Significant Operations**: `OSKUserService.onAccountCreated` (Auth trigger), `OSKUserService.onAccountDeleted` (Auth trigger), `OSKUserService._cascadePublicProfileChange` (Firestore trigger), `OSKAuth0Service.exchangeAuth0Token`.
*   **Data Involved**: `/users` collection and its subcollections, Firebase Authentication user records.
*   **Events or Messages Involved**: Consumes Firebase Auth `onCreate` and `onDelete` events.
*   **External Boundaries**: Auth0 for identity provision, Google Cloud Storage for profile images.
*   **Evidence**: `user` and `core` engineering profiles, `Oskey Personas and Authority models.md`.
*   **Confidence**: High.

### Real-time Intercom Calling
*   **Description**: The orchestration of a real-time call session initiated from a physical Intercom device to a resident's mobile application.
*   **Coordinating or Owning Module**: `call`.
*   **Participating Modules**: `building` (source for call transfer lists), `user` (recipient data), `apps` (for sending push notifications).
*   **Significant Operations**: HTTP `POST /calls` to initiate, `PATCH /calls/:callId` to update state.
*   **Data Involved**: `/calls` (for active session state), `/buildings/{id}/callTransferList` (for routing rules), `/users/{id}/calls` (for denormalized history).
*   **Events or Messages Involved**: Dispatches `userCallReceived` push notifications via the `apps` module.
*   **External Boundaries**: HTTP endpoints for Intercom devices, external push notification providers (APNS/FCM).
*   **Evidence**: `call` and `apps` engineering profiles, `OSkey Architecture.md`.
*   **Confidence**: High.

### Role-Based Access Control (RBAC)
*   **Description**: The definition and evaluation of permissions that govern what actions a user can perform within the system.
*   **Coordinating or Owning Module**: `settings`.
*   **Participating Modules**: All modules with protected endpoints, especially `admin`, `organization`, `supplier`, and `core` (for storage uploads).
*   **Significant Operations**: `OSKConsolidatedRolesController.checkUserPermissions`, `OSKCompositeRoleService.onDocumentUpdated` trigger for hierarchy maintenance.
*   **Data Involved**: `/settings/roles/roles`, `/settings/roles/compositeRoles`.
*   **Events or Messages Involved**: Consumes its own document changes via Firestore triggers to maintain the role hierarchy.
*   **External Boundaries**: Callable Functions that perform permission checks before execution.
*   **Evidence**: `settings` engineering profile, permission checks across many other module profiles.
*   **Confidence**: High.

---

## 4. Internal Architectural Topology

The internal topology is defined by recurring patterns of ownership, dependency, and orchestration.

*   **Ownership Topology**:
    *   Authoritative data ownership is clearly delineated. `user` owns `/users`, `building` owns `/buildings`, `organization` owns `/organizations`, `supplier` owns `/suppliers`, and `access_control_device` owns `/accessControlDevices`. These modules are the single source of truth for their respective domains.

*   **Dependency Topology**:
    *   **Identity Dependency**: Nearly all modules have a strong dependency on the `user` module to provide the identity context for their operations. This makes `user` a central dependency hub.
    *   **Infrastructure Dependency**: Most domain modules (`building`, `supplier`, `unit_management`, etc.) depend on `core` for its generic persistence controllers (`OSKDocumentController`) and, critically, for access orchestration via `OSKAccessService`.
    *   **Configuration Dependency**: Modules with protected endpoints depend on `settings` for RBAC role definitions and permission checks (e.g., `OSKConsolidatedRolesController.checkUserPermissions`).
    *   **Utility Dependency**: Modules that send notifications depend on `apps`, and those that require deferred execution depend on `tasks`.

*   **Orchestration Topology**:
    *   **`core` (`OSKAccessService`)**: The primary orchestration hub for physical access. It is called by `unit_management`, `supplier`, and `admin` to provision or revoke credentials. It coordinates writes across `user`, `building`, and `supplier` data stores.
    *   **`unit_management`**: An orchestration layer for resident-facing actions. It coordinates `core` (for access), `building` (for intercom entries), and `user` (for invitations) to manage the lifecycle of people within a unit.
    *   **`admin`**: A high-privilege orchestration module for data maintenance and repair, with dependencies on nearly all other domain modules.

*   **Data & Event Topology**:
    *   **Authoritative Source with Projections**: The architecture consistently uses an "Authoritative Source" pattern. Core modules own the canonical data, and orchestrators create denormalized, read-optimized projections (e.g., `core` creates access ledgers in `/users/{id}/accesses` and `/buildings/{id}/accesses`).
    *   **Paired Document Pattern for Pincodes**: The `core` module's pincode service implements a "Paired Document" pattern, writing pincodes to both user-centric collections (for app display) and a building-centric collection keyed by the pincode itself (for fast hardware validation).
    *   **Event-Driven Publication**: The `core` module publishes "intent" messages to Google Pub/Sub when access rights change. This decouples the core business logic from the hardware state.
    *   **Event-Driven Consumption**: The `core` module's `PubSubMessageProcessor` acts as the ingress for events from the edge, routing them to activity handlers in the `user`, `supplier`, and `building` modules. Firestore Triggers are used within `settings` and `user` to react to data changes and maintain consistency.

---

## 5. Capability Collaboration Map

### Access Grant Orchestration
*   **Capability Name**: Provisioning a new physical access grant.
*   **Coordinating Module**: `core` (`OSKAccessService`).
*   **Participating Modules & Responsibilities**:
    *   **Initiator** (e.g., `unit_management`, `supplier`): Calls `OSKAccessService.createAccess` with the required user, building, and door information.
    *   **`core`**:
        *   Orchestrates the entire workflow.
        *   Calls `OSKPincodeService` to generate a unique pincode, check for collisions against active and trashed pincodes, and write the new pincode to both user- and building-centric collections.
        *   Calls `OSKUserAccessService` and `OSKBuildingAccessService` to write denormalized access ledger entries to `/users/{id}/accesses` and `/buildings/{id}/accesses`.
        *   Calls `OSKUserDeviceService` to create SecureBLE tokens.
        *   Calls `OSKAccessMessagePublisherService` to publish the final "access intent" message (including the pincode) to Pub/Sub.
    *   **`user`**: Provides the user's profile and is the target for writing user-centric access and pincode documents.
    *   **`building`**: Provides building/door validation and is the target for writing building-centric access and pincode documents.
*   **Evidence**: `core`, `user`, `building` engineering profiles; `OSkey Backend Services & Data Architecture.md`.
*   **Confidence**: High.

### User Profile Update Cascade
*   **Capability Name**: Propagating a user's name change throughout the system.
*   **Coordinating Module**: `user` (`OSKUserService`).
*   **Participating Modules & Responsibilities**:
    *   **`user`**: The `onDocumentUpdated` Firestore trigger on `/users/{userId}` detects a change in `publicProfile`. It calls the `_cascadePublicProfileChange` helper.
    *   **`core`**: The cascade calls `OSKAccessUpdateService.updateAccessesUserInfo` to begin the access-related fan-out.
    *   **`organization`**: The cascade updates the denormalized user name in `/organizations/{orgId}/users/{userId}`.
    *   **`building`**: The cascade updates the denormalized user name in `/buildings/{bId}/accesses/{userId}` and `/buildings/{bId}/units/{uId}/inhabitants/{userId}`.
*   **Evidence**: `user` engineering profile, `OSkey Backend Services & Data Architecture.md`.
*   **Confidence**: High.

---

## 6. External Architectural Topology

| Module | Public Capability | Interface Type | Specific Interface / Event | External Consumer / Producer |
| :--- | :--- | :--- | :--- | :--- |
| **`access_control_device`** | Device Lifecycle | Firestore Trigger | `onCreate`, `onDelete` on `/accessControlDevices` | Internal Modules |
| **`admin`** | Privileged Operations | HTTPS Callable | e.g., `deleteUserData`, `recreateAccessDocumentInMongoDbByBuilding` | PGO Portal, Human Operators |
| **`apps`** | Notifications | External API | Twilio, APNS, FCM, SMTP | External Notification Services |
| **`building`** | Door-Device Assignment | Firestore Trigger | `onCreate` on `/doors/{dId}/accessControlDevices` | Internal Modules |
| | Intercom Directory Sync | Pub/Sub Topic | `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` | IoT Backend / Hardware |
| **`call`** | Call Session Management | HTTP Function | `POST /calls`, `PATCH /calls/:callId` | Intercom Devices (ACDs) |
| **`core`** | Access Synchronization | Pub/Sub Topic | `OSK_PUBSUB_TOPIC_ACD_ACCESSES` | IoT Backend / Hardware |
| | Authentication | HTTPS Callable | `exchangeAuth0Token` | Mobile Apps, PGO Portal |
| | File Upload | HTTPS Callable | `generateUploadSignedUrl` | Mobile Apps, PGO Portal |
| | File Finalization | Storage Trigger | `onFinalize` on Cloud Storage bucket | Google Cloud Storage |
| | Device Activity Ingestion | HTTP Function | `processPubSubMessage` (via Pub/Sub push) | IoT Backend / Pub/Sub |
| **`organization`** | Tenant/User Management | HTTPS Callable | e.g., `createAnOrganization`, `inviteUserWithInvitation` | PGO Portal |
| **`settings`** | RBAC Hierarchy | Firestore Trigger | `onUpdate` on `/compositeRoles` | Internal Modules |
| **`tasks`** | Asynchronous Work | HTTP Function | Task handler endpoint | Google Cloud Tasks |
| **`unit_management`** | Inhabitant/Guest Management | HTTPS Callable | e.g., `createUnitInvitation`, `removeInhabitantFromUnit` | Resident-facing Mobile Apps |
| **`user`** | Account Lifecycle | Auth Trigger | `onCreate`, `onDelete` | Firebase Authentication |
| | Profile/Device Updates | Firestore Trigger | `onUpdate` on `/users`, `/devices` | Internal Modules |

---

## 7. Capability and Responsibility Ownership Matrix

| Business Capability | Primary Owner / Coordinator | Supporting Modules | Data Ownership | Event/Integration Ownership | External Consumers | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User Identity & Profile Management** | `user` | `core` (Auth0) | `/users` and subcollections | Auth Triggers, Auth0 API | Mobile Apps, PGO Portal, Auth0 | High |
| **Physical Access Provisioning & Revocation** | `core` | `user`, `building`, `supplier` | Orchestrates writes to `accesses` collections | Pub/Sub Topic `OSK_PUBSUB_TOPIC_ACD_ACCESSES` | PGO Portal, Mobile Apps | High |
| **Pincode Lifecycle Management** | `core` | `user`, `building`, `supplier`, `admin` | Orchestrates writes to `pincodes` and `pincode_trash` collections | Part of `OSK_PUBSUB_TOPIC_ACD_ACCESSES` payload; `tasks` for refresh | ACD Hardware | High |
| **Hardware State Synchronization** | (Inferred) External IoT Layer | `core`, `access_control_device` | MongoDB (inferred) | Consumes Pub/Sub topics | ACD Hardware | Medium |
| **Real-time Intercom Calling** | `call` | `building`, `user`, `apps` | `/calls` | HTTP endpoint for ACDs, Push Notifications | Intercom Devices, Mobile Apps | High |
| **Tenant & Property Hierarchy Management** | `organization` | `building` | `/organizations`, `/properties`, `/entities` | HTTPS Callables | PGO Portal | High |
| **Role-Based Access Control (RBAC)** | `settings` | `core` | `/settings` and subcollections | Firestore Triggers for consistency | All modules, PGO Portal | High |
| **Resident-led Unit & Guest Management** | `unit_management` | `user`, `core`, `building` | `/pendingUnitInvitations` | HTTPS Callables | Mobile Apps | High |
| **Asynchronous & Scheduled Tasks** | `tasks` | `admin`, `organization` | None | HTTP endpoint for Cloud Tasks | Google Cloud Tasks | High |
| **Privileged Administrative Operations** | `admin` | All other modules | None (privileged mutator) | HTTPS Callables | PGO Portal, Human Operators | High |

---

## 8. Architectural Systems

1.  **Identity & Access Management System**
    *   **Purpose**: To manage who a user is, what they are allowed to do, and to orchestrate the provisioning of their physical access credentials, including pincodes and mobile keys.
    *   **Participating Modules**: `user`, `core` (specifically its Auth0, access, and pincode submodules), `settings`.
    *   **Boundaries**: This system is the authority on identity and permissions. It interfaces with the external Auth0 identity provider and publishes access "intent" events to the Hardware & Edge Integration system.

2.  **Physical & Logical Asset Management System**
    *   **Purpose**: To model the real-world hierarchy of the managed properties, from the top-level customer organization down to the individual units within a building.
    *   **Participating Modules**: `organization`, `building`, `unit_management`.
    *   **Boundaries**: This system owns the structural data of the platform. It provides the context required by the Identity & Access system to make authorization decisions. It is primarily driven by administrative users via the PGO portal.

3.  **Hardware & Edge Integration System**
    *   **Purpose**: To manage the backend representation of physical hardware, handle real-time interactions from that hardware, and schedule related asynchronous work.
    *   **Participating Modules**: `access_control_device`, `call`, `tasks`, and the inferred external IoT/MongoDB layer.
    *   **Boundaries**: This system forms the boundary between the core cloud platform and the physical world. It consumes events from Pub/Sub to update hardware state and ingests activity events from hardware to be processed by the core platform.

4.  **Administrative & Communications System**
    *   **Purpose**: To provide tools for managing external entities (like suppliers), privileged operational tools for platform maintenance, and centralized outbound communications.
    *   **Participating Modules**: `supplier`, `admin`, `apps`.
    *   **Boundaries**: This system provides cross-cutting administrative and utility functions. The `admin` module has high-privilege access across all other systems, while the `apps` module serves as a centralized exit point for all user-facing notifications.

---

## 9. Architectural Topology Findings

*   **Architectural Hubs Identified**:
    *   **`core` is a critical Orchestration and Infrastructure Hub**. Its `OSKAccessService` and `OSKPincodeService` capabilities centralize the business-critical logic for access control, and its generic controllers provide foundational persistence abstractions, making it the most highly connected module.
    *   **`user` is the central Identity Hub**. Nearly every other module depends on it for user context, making its data model (`/users`) and availability crucial to the entire platform.
    *   **`admin` is a Privileged Orchestration Hub**. Its function is to perform wide-ranging maintenance and repair, giving it broad, high-privilege coupling to most other modules for administrative purposes.

*   **Key Coupling and Decoupling Patterns**:
    *   **Intentional Tight Coupling for Security**: There is tight, deliberate coupling between `core` (access), `user`, and `building` to ensure the transactional integrity of access control. Deletion of a user or building correctly cascades to revoke physical access. This is a strength for a security-focused platform.
    *   **Decoupling via Pub/Sub**: The architecture clearly decouples the core business logic from the state of physical hardware using Google Pub/Sub. The `core` module's `OSKAccessMessagePublisherService` publishes "access intent" messages without needing to know if the target hardware is online, making the system resilient.

*   **Boundary Responsibilities**:
    *   The boundary between the core application and the hardware-facing infrastructure is well-defined. The `core` module's `OSKAccessMessagePublisherService` is the single exit point for hardware state changes.
    *   The boundary between administrative (PGO) and resident (mobile app) functions is clearly separated into different modules (`admin`/`organization` vs. `unit_management`/`call`).

---

## 10. Cross-Repository Readiness

**Assessment: Moderately Ready.**

The repository is well-structured internally, but its external integration contracts are not fully defined in the provided evidence, posing a challenge for reliable cross-repository knowledge composition.

*   **Strengths**:
    *   The modular design, with clear data ownership (`user`, `building`, etc.), provides a strong foundation for composition.
    *   The use of central orchestration services (`core`, `unit_management`) makes complex workflows easier to trace and understand.
    *   The use of Pub/Sub for hardware integration provides a clear, asynchronous boundary.

*   **Gaps Preventing Full Readiness**:
    *   **Undefined Pub/Sub Contracts**: The most significant gap is the lack of a defined schema for the Pub/Sub messages published by the `core` module. To compose this repository's knowledge with an IoT/hardware repository, the exact contract of these messages is essential.
    *   **Implicit API Authorization**: The mechanism for authenticating and applying RBAC to incoming callable/HTTP functions is not explicitly documented. Without understanding this shared security pattern, it's difficult to reason about the security of a composed system.
    *   **Data Model Inconsistencies**: Minor but important conflicts in Firestore path names between documents (e.g., `pendingUnitInvitations` vs. `pendingInvitations`) create ambiguity that would need to be resolved for reliable data mapping.

---

## 11. Knowledge Gaps and Evidence Improvements

*   **Improvement ID**: KI-001
    *   **Title**: Define and Document Pub/Sub Message Contracts
    *   **Missing Knowledge**: The precise JSON schema for messages published to `OSK_PUBSUB_TOPIC_ACD_ACCESSES` and `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`.
    *   **Why It Matters**: This is the primary integration point with the hardware-facing backend. Without a contract, cross-repository composition is unreliable.
    *   **Current Evidence**: `core` and `building` engineering profiles confirm the existence of the publisher services and topic names.
    *   **Required Evidence**: A JSON Schema or TypeScript interface definition for each message payload.
    *   **Expected Corpus Benefit**: Enables reliable knowledge composition with the IoT/hardware repository and allows for precise impact analysis of changes to the access model.
    *   **Priority**: **High**.

*   **Improvement ID**: KI-002
    *   **Title**: Document the API Gateway Authorization Pattern
    *   **Missing Knowledge**: The shared mechanism (e.g., a middleware decorator) for authenticating and applying RBAC to incoming callable/HTTP functions.
    *   **Why It Matters**: A clear understanding of the security posture is critical for any further analysis or composition.
    *   **Current Evidence**: "Knowledge Gaps" section of the INV-001 Internal Working Paper; presence of `OSKUserSecurityChecks` and permission strings in services.
    *   **Required Evidence**: A document or code comment explaining the shared authorization pattern and how it's applied to function entry points.
    *   **Expected Corpus Benefit**: Provides a clear, auditable understanding of the platform's security model.
    *   **Priority**: **High**.

*   **Improvement ID**: KI-003
    *   **Title**: Reconcile Firestore Path Naming Conflicts
    *   **Missing Knowledge**: A canonical source of truth for collection paths where engineering profiles and architecture documents conflict.
    *   **Why It Matters**: Ambiguity in the data model leads to errors in both human and AI-driven analysis.
    *   **Current Evidence**: `unit_management` profile (`/pendingUnitInvitations`) vs. `OSkey Backend Services & Data Architecture.md` (`/pendingInvitations`). `settings` profile showing multiple path shapes for roles/workflows.
    *   **Required Evidence**: An updated `firestore-schema.md` that is validated against the implementation and serves as the single source of truth.
    *   **Expected Corpus Benefit**: Creates an unambiguous data model, improving the reliability of all future knowledge synthesis.
    *   **Priority**: **Medium**.

---

## 12. Investigation Conclusions

*   **Key Architectural Discoveries**: The repository's architecture is mature and well-patterned, featuring clear separation of concerns through modularity, orchestration hubs (`core`, `admin`, `user`), and event-driven decoupling from hardware via Pub/Sub.
*   **Most Significant Capabilities**: The most critical capabilities are the `core` module's access and pincode orchestration, which guarantees transactional integrity for physical access, and the `user` module's role as the central identity anchor.
*   **Strongest Evidence**: The internal data models, service responsibilities, and orchestration flows within and between modules are strongly supported by the engineering profiles and cross-module call evidence.
*   **Remaining Uncertainty**: The primary uncertainties lie at the repository's external boundaries: the precise data contracts for Pub/Sub messages sent to the hardware layer and the exact implementation of the authorization layer for incoming API requests.
*   **Cross-Repository Readiness**: The repository is ready for further internal analysis and dependency mapping. However, it is not fully ready for reliable cross-repository composition until the external contracts (Pub/Sub, API Auth) are explicitly defined and documented.
*   **Limits of Investigation**: This investigation successfully mapped the internal topology but could not fully define the external contracts due to missing evidence. It describes engineering collaborations but does not attempt to map complete end-to-end business workflows, which would require further investigation.

---

## 13. Candidate Future Investigation Themes

*   **External Interface Contract Discovery**: A focused investigation to define the precise JSON schemas for all Pub/Sub messages and document the shared API authorization pattern. This directly addresses the main gaps identified and is the highest priority for enabling cross-repository composition.
*   **Data Lifecycle Discovery**: An investigation to trace a key data entity, such as an "Access Grant," through its entire lifecycle, from an initial API call in `unit_management`, through orchestration in `core` (including pincode generation), to the final Pub/Sub message publication. This would provide a concrete, end-to-end view of a critical workflow.
*   **Authority Topology Discovery**: A deep-dive investigation into the `settings` module and the `checkUserPermissions` calls across the repository to create a definitive map of how RBAC is enforced, which roles grant which permissions, and how authority is delegated.

```
