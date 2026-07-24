# INV-001 — Internal Working Paper

**Version:** 0.2 (Draft)

**Classification:** Internal Engineering Knowledge

---

## 1. Corpus Validation

Confirmed. Based on the provided documentation, I have identified and reviewed exactly 12 engineering modules.

---

## 2. Engineering Module Inventory

-   **Module:** `access_control_device`
    -   **Purpose:** Manages the backend document model and persistence for physical Access Control Devices (ACDs).
    -   **Responsibilities:** Manages core device records, device configuration, public key material, runtime state, command history, and system logs.
    -   **Primary Ownership:** Authoritative owner of `/accessControlDevices` and its subcollections (`/configs`, `/publicKeys`).
    -   **Dependencies:** Building and Door modules for device assignment.
    -   **Consumers:** Hardware synchronization workflows, access orchestration services (`core`), and administrative UIs (`admin`).
    -   **Confidence:** High.

-   **Module:** `admin`
    -   **Purpose:** Provides a privileged, cross-cutting administrative and maintenance API surface for backend operations.
    -   **Responsibilities:** Acts as an orchestration layer over canonical platform collections to inspect and mutate buildings, organizations, users, access, and operational state. Contains data repair and synchronization logic.
    -   **Primary Ownership:** Does not own a primary collection. Acts as a privileged mutator of `/buildings`, `/organizations`, `/users`, `/settings`, and their subcollections.
    -   **Dependencies:** Nearly all other domain modules (`building`, `organization`, `user`, `core`, `tasks`, etc.).
    -   **Consumers:** Internal PGO (Property Manager Portal) and operational staff.
    -   **Confidence:** High.

-   **Module:** `apps`
    -   **Purpose:** A shared application-communications module for sending user-facing notifications.
    -   **Responsibilities:** Provides services for email, SMS, and push notification dispatch, as well as QR code generation.
    -   **Primary Ownership:** Owns `/EmailLogs`. Inferred ownership of SMS logs.
    -   **Dependencies:** `user` (for notification tokens), `call` (for ICE server data in notifications), and external providers (Twilio, APNS, FCM).
    -   **Consumers:** Any backend module that needs to send user-facing communications.
    -   **Confidence:** High.

-   **Module:** `building`
    -   **Purpose:** Owns the `Building` scope, which represents a physical structure in the platform hierarchy.
    -   **Responsibilities:** Manages the core `/buildings` documents and coordinates building-scoped subdomains like doors, units, intercoms, settings, and pincodes.
    -   **Primary Ownership:** Authoritative owner of `/buildings` and its subcollections (`/doors`, `/units`, `/settings`, `/intercoms`, `/pincodes`, etc.).
    -   **Dependencies:** `organization` (for hierarchy), `access_control_device` (for door assignment), `user` (for access ledgers).
    -   **Consumers:** `admin`, `core` (access orchestration), `call`, and `unit_management` modules.
    -   **Confidence:** High.

-   **Module:** `call`
    -   **Purpose:** Manages real-time call sessions initiated from Intercom devices.
    -   **Responsibilities:** Orchestrates the `/calls` state machine, handles call creation and state updates, notifies recipients, and archives completed calls to user history.
    -   **Primary Ownership:** Authoritative owner of the operational `/calls` collection. Writes denormalized history to `/users/{id}/calls`.
    -   **Dependencies:** `building` (for call transfer lists), `user` (for recipient notifications), `access_control_device` (for initiating caller), `apps` (for push notifications).
    -   **Consumers:** Intercom devices, resident mobile applications.
    -   **Confidence:** High.

-   **Module:** `core`
    -   **Purpose:** Provides shared backend infrastructure and central orchestration services.
    -   **Responsibilities:** Offers generic Firestore controllers, Pub/Sub publishing, secret management, Auth0 integration, and, most critically, the central `access` orchestration service that manages the lifecycle of all access grants.
    -   **Primary Ownership:** Does not own a primary domain collection. Orchestrates writes across `/users/{id}/accesses`, `/buildings/{id}/accesses`, and various pincode collections.
    -   **Dependencies:** `user`, `building`, `supplier`, `access_control_device`.
    -   **Consumers:** All modules that grant or revoke physical access (`unit_management`, `supplier`, `admin`).
    -   **Confidence:** High.

-   **Module:** `organization`
    -   **Purpose:** Manages the top-level customer tenancy model.
    -   **Responsibilities:** Owns the `/organizations` collection and its associated subdomains, including entities, properties, residents, organization users, and invitation workflows.
    -   **Primary Ownership:** Authoritative owner of `/organizations` and its subcollections (`/buildings`, `/residents`, `/users`, `/properties`, etc.).
    -   **Dependencies:** `user` (for user and invitation management).
    -   **Consumers:** `admin` module, PGO administrative UIs.
    -   **Confidence:** High.

-   **Module:** `settings`
    -   **Purpose:** Manages the platform's configuration and Role-Based Access Control (RBAC) catalog.
    -   **Responsibilities:** Manages role definitions, composite roles, consolidated permission checks, and request workflow configurations.
    -   **Primary Ownership:** Authoritative owner of the `/settings` collection and its subcollections (`/roles`, `/compositeRoles`, `/workflows`).
    -   **Dependencies:** None directly evidenced, but provides foundational data for other modules.
    -   **Consumers:** All modules that perform permission checks, particularly `admin`, `organization`, and `supplier`.
    -   **Confidence:** High.

-   **Module:** `supplier`
    -   **Purpose:** Manages third-party service providers and their staff.
    -   **Responsibilities:** Manages supplier company records, staff member records, and orchestrates their building access, pincodes, and activity logging.
    -   **Primary Ownership:** Authoritative owner of `/suppliers` and its subcollections (`/staffMembers`, `/accesses`, `/pincodes`, `/activities`).
    -   **Dependencies:** `core` (for access provisioning/revocation), `organization` (for scoping), `building` (for door validation).
    -   **Consumers:** PGO administrative UIs, `admin` module.
    -   **Confidence:** High.

-   **Module:** `tasks`
    -   **Purpose:** A small infrastructure module for scheduling and handling asynchronous backend work.
    -   **Responsibilities:** Exposes an HTTP task handler and a scheduler service backed by Google Cloud Tasks to route deferred work to the appropriate domain service.
    -   **Primary Ownership:** None.
    -   **Dependencies:** `admin` (for pincode refresh worker), `organization` (for intercom communication service).
    -   **Consumers:** Any module needing to schedule deferred work.
    -   **Confidence:** High.

-   **Module:** `unit_management`
    -   **Purpose:** Orchestrates the management of people (inhabitants, guests) and invitations within a specific Building Unit.
    -   **Responsibilities:** Handles unit invitation creation/consumption, inhabitant/guest management, and the cleanup of associated access, pincodes, and intercom entries.
    -   **Primary Ownership:** Owns `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations`. Reads/writes to many other collections via delegation.
    -   **Dependencies:** `building` (unit inhabitants/guests), `user` (invitations, profile lookups), `core` (access/pincode revocation), `organization` (intercom).
    -   **Consumers:** Resident-facing mobile applications.
    -   **Confidence:** High.

-   **Module:** `user`
    -   **Purpose:** Manages user identity, profiles, and all user-scoped data and relationships.
    -   **Responsibilities:** Manages user profiles, devices, notification settings, invitations, organization memberships, user-scoped settings, pincodes, and access records.
    -   **Primary Ownership:** Authoritative owner of `/users` and its subcollections (`/devices`, `/notifications`, `/invitations`, `/settings`, etc.).
    -   **Dependencies:** `organization` (for membership), `building` (for settings), `core` (for access).
    -   **Consumers:** Nearly all other modules, as user identity is central to the platform.
    -   **Confidence:** High.

---

## 3. Emerging Architecture

The provided corpus describes a sophisticated, multi-tenant, cloud-native physical access control platform. The system is architected around a clear hierarchical data model (`Organization` > `Entity` > `Property` > `Building` > `Unit`) that mirrors real-world real estate structures.

**Confirmed:** The platform's backend is composed of modular, domain-oriented services running as Cloud Functions. These modules manage distinct business concepts. For example, the `organization`, `building`, and `user` modules own their respective data domains. Physical hardware (`access_control_device`) is treated as a distinct domain, managed and provisioned by the backend.

**Confirmed:** A central theme is the separation of authoritative data from derived, read-optimized projections. Core data like user profiles (`/users`) or building structures (`/buildings`) are the source of truth. This data is then fanned-out or denormalized into other collections to support specific use cases, such as user-centric call history (`/users/{id}/calls`) or building-centric access ledgers (`/buildings/{id}/accesses`).

**Inferred:** The system operates on an event-driven or orchestrated basis rather than through direct, monolithic calls. Changes in one module (e.g., deleting a `supplier` staff member) trigger a cascade of operations across other modules (`core` access service, pincode services, `building` access ledger) to ensure system-wide consistency and security. This is most evident in the `core` access service and the various deletion workflows.

**Confirmed:** The platform has a clear separation between administrative/management functions (handled by the `admin` and `organization` modules for the PGO portal) and runtime operational functions (like `call` for intercom sessions or `unit_management` for resident-facing actions).

### Architectural Layers

The modules form several distinct architectural layers:

-   **Core Infrastructure Layer (Confirmed):** Provides foundational, cross-cutting capabilities.
    -   `core`: Offers generic Firestore controllers, Pub/Sub abstractions, and secret management.
    -   `apps`: Centralizes all outbound user communication (email, SMS, push).
    -   `tasks`: Provides an asynchronous task execution framework.

-   **Identity & Configuration Layer (Confirmed):** Manages identity, permissions, and platform configuration.
    -   `user`: The anchor for user identity, profiles, and user-scoped data.
    -   `settings`: The catalog for RBAC roles and platform-wide configuration.
    -   `core` (Auth0 submodule): Manages integration with the external identity provider.

-   **Domain & Data Ownership Layer (Confirmed):** The authoritative sources for the primary business entities.
    -   `organization`: Owns the top-level customer tenancy model.
    -   `building`: Owns the physical building and its structural sub-entities (doors, units).
    -   `supplier`: Owns the data model for third-party service providers.
    -   `access_control_device`: Owns the data model for physical hardware.

-   **Orchestration & Workflow Layer (Confirmed):** Coordinates complex, multi-step business processes across different domains.
    -   `core` (access submodule): The most critical orchestrator, managing the entire lifecycle of access grants which touches `user`, `building`, `supplier`, and hardware sync via Pub/Sub.
    -   `unit_management`: Orchestrates adding/removing people from a unit, which involves `user`, `core` (access), pincode services, and `organization` (intercom) modules.
    -   `call`: Orchestrates the state machine of a real-time communication session.

-   **Privileged Administration Layer (Confirmed):**
    -   `admin`: A high-privilege, cross-cutting module that performs wide-scope administrative and data maintenance tasks, callable only by trusted operators.

### Orchestration Points

-   **`core` (OSKAccessService) (Confirmed):** The most significant orchestration point. The `createAccess` and `deleteAccessById` methods are complex workflows that fan out changes to user-centric access ledgers (`/users/{id}/accesses`), building-centric ledgers (`/buildings/{id}/accesses`), pincode collections, and ultimately publish messages via Pub/Sub to synchronize physical hardware.

-   **`unit_management` (Confirmed):** Services like `removeInhabitantFromUnit` orchestrate a cascade of cleanup operations, involving calls to `OSKAccessService` to delete access, pincode services to delete pincodes, and intercom services to remove the user from the directory.

-   **`admin` (Confirmed):** Maintenance services within this module are powerful orchestrators designed for bulk repair, synchronization, and data back-filling across the entire platform.

-   **`call` (Confirmed):** Orchestrates the lifecycle of a call session. Upon termination, it fans out denormalized call history records to the `user` module's subcollections.

### Data Ownership

-   **Authoritative Sources (Confirmed):**
    -   `/users`: The `user` module owns the canonical user profile.
    -   `/organizations`: The `organization` module owns the top-level customer entity.
    -   `/buildings`: The `building` module owns the canonical representation of a physical building.
    -   `/suppliers`: The `supplier` module owns the canonical supplier company records.
    -   `/accessControlDevices`: The `access_control_device` module owns the canonical hardware records.
    -   `/settings`: The `settings` module owns the RBAC and platform configuration.

-   **Derived Projections & Read Models (Confirmed):**
    -   `/users/{id}/accesses` & `/buildings/{id}/accesses`: Denormalized ledgers of access grants, orchestrated by `core`.
    -   `/users/{id}/calls`: User-centric, denormalized call history, fanned out from the operational `/calls` collection.
    -   Activity Aggregates (e.g., `/users/{id}/activityAggregates`): Rolling, time-windowed summaries of activity events for efficient UI reads.

-   **External Projections (Inferred):**
    -   The architecture documents state that MongoDB acts as a "decoupled database layer engineered specifically for consumption by physical field hardware." This implies that data from Firestore (like pincodes and access lists) is projected into MongoDB for ACDs to consume, likely triggered by Pub/Sub messages from the `core` module.

---

## 4. Emerging System Model

The twelve modules cluster into several high-level conceptual systems:

-   **Identity & Access Management:** Comprises the `user`, `core` (Auth0 and access submodules), and `settings` modules. This system is responsible for who a user is, what they are allowed to do (RBAC), and orchestrating the provisioning of their physical access credentials.

-   **Physical & Logical Asset Management:** Comprises the `organization`, `building`, and `unit_management` modules. This system models the real-world hierarchy from the top-level business (`organization`) down to the physical building (`building`) and the logical spaces within it (`unit_management`).

-   **Hardware & Edge Integration:** Comprises the `access_control_device`, `call`, and `tasks` modules. This system manages the representation of physical hardware (`access_control_device`), handles real-time interactions from that hardware (`call`), and schedules asynchronous work related to it (`tasks`).

-   **Third-Party & Administrative Services:** Comprises the `supplier`, `admin`, and `apps` modules. This system manages external entities (`supplier`), provides privileged operational tools (`admin`), and centralizes outbound communications (`apps`).

---

## 5. Architectural Decisions Observed

-   **Authoritative Source with Denormalized Projections (Confirmed):** The platform maintains a single source of truth for core entities (e.g., `/users`, `/buildings`) and fans out denormalized, read-optimized copies to support specific query patterns (e.g., `/users/{id}/accesses`, `/users/{id}/calls`). This is a deliberate trade-off to improve read performance at the cost of increased write complexity and the need for synchronization logic.

-   **Orchestration Service Pattern (Confirmed):** Complex, multi-step business processes that span multiple domains are managed by dedicated orchestration services (e.g., `OSKAccessService` in `core`, services in `unit_management`). This centralizes critical business logic, making it more manageable, secure, and auditable than if the logic were scattered across multiple modules.

-   **Event-Driven Hardware Synchronization (Inferred/Evidenced):** The core backend is decoupled from physical hardware. It publishes "intent" messages (e.g., "grant access") to Pub/Sub topics. A separate, un-evidenced infrastructure layer is responsible for consuming these messages and updating the hardware-facing database (MongoDB). This makes the core platform resilient to hardware connectivity issues.

-   **Hierarchical Scoping (Confirmed):** The data model strictly follows the `Organization` > `Entity` > `Property` > `Building` > `Unit` hierarchy. This is fundamental to data isolation, tenancy, and the application of scoped policies and permissions.

-   **Configuration as Data (Confirmed):** The `settings` module treats platform configuration, especially the RBAC catalog (roles, composite roles), as data stored in Firestore. This allows for dynamic updates to permissions and workflows without requiring code deployments.

-   **Separation of Administrative and Operational Planes (Confirmed):** The system provides two distinct functional planes: a privileged administrative plane (`admin` module) for managing the platform's structure and tenancy, and an operational plane (`call`, `unit_management`) for handling real-time user and device interactions.

---

## 6. Assumptions

-   **ID:** A-01
    -   **Description:** It is assumed that the Pub/Sub messages published by `OSKAccessMessagePublisherService` are the primary trigger for synchronizing access credentials and pincodes from Firestore to the hardware-facing MongoDB projection.
    -   **Supporting Evidence:** The `core` module's access service is the only component shown to publish these specific messages upon access changes. The `OSkey Backend Services & Data Architecture.md` document describes MongoDB as the hardware projection store and Pub/Sub as the synchronization backbone.
    -   **Confidence:** High.

-   **ID:** A-02
    -   **Description:** It is assumed that the `PubSubMessageProcessor` in the `core` module is the main entry point for ingesting activity events originating from physical hardware.
    -   **Supporting Evidence:** The processor service is shown to call the various `ActivityReceivedFor...` handlers in the `user`, `supplier`, and `building` modules. The `OSkey Backend Services & Data Architecture.md` describes a reverse data flow for activity events from the edge.
    -   **Confidence:** High.

-   **ID:** A-03
    -   **Description:** It is assumed that a shared middleware layer or decorator pattern, not captured in the individual module profiles, is responsible for authenticating and performing initial authorization checks on incoming callable/HTTP function requests.
    -   **Supporting Evidence:** The presence of granular RBAC checks within services implies an authenticated user context is already established. The `core` module's `OSKAuth0Service` confirms the use of Auth0 for identity, but the link to the callable function entry point is missing.
    -   **Confidence:** Medium.

---

## 7. Knowledge Gaps

-   **Authentication & Authorization (Partially Evidenced/Unclear):** While RBAC permission strings (`v1.org.*`) are checked in many services, the mechanism for authenticating the initial callable/HTTP requests is not detailed in the module evidence. The updated context confirms user authentication is delegated to Auth0, with an MFA flow, and the `core` module's `OSKAuth0Service` handles token exchange. However, the enforcement mechanism for callable functions (e.g., a shared middleware decorator) is still not explicitly detailed.

-   **Hardware Synchronization (Inferred):** The modules clearly publish messages to Pub/Sub topics (e.g., `OSK_PUBSUB_TOPIC_ACD_ACCESSES`). However, the consumer of these messages—the service that updates MongoDB and the mechanism by which the ACDs poll or receive these updates—is not described within the provided corpus.

-   **Real-Time Communication Layer (Placeholder):** The `call` module profile and architecture documents explicitly label the SIP/WebRTC signaling and media gateway as an "architectural placeholder." The evidence confirms HTTP orchestration and the presence of `iceServers` data, but not the complete media stack.

-   **Path Naming Conflicts (Confirmed):**
    -   The `unit_management` module's controller uses `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations`, while the backend architecture document refers to it as `/pendingInvitations`.
    -   The `settings` module evidence shows path shape differences for roles and workflows between what controllers use (`/settings/roles/compositeRoles`) and what the schema documents (`/settings/{id}/compositeRoles`).

-   **Activity Ingestion (Inferred):** The `supplier` and `user` modules have services to handle incoming activity events (`ActivityReceivedFor...`), but the trigger for these handlers (e.g., a Pub/Sub subscription or an HTTP endpoint) is not defined within their respective module evidence. The `core` module's `PubSubMessageProcessor` appears to be the likely entry point, but this is an inferred connection.

---

## 8. Readiness Assessment

**Ready.**

The Engineering Corpus is sufficiently detailed and consistent to proceed with Investigation 2: module relationship extraction and architecture synthesis.

The provided module profiles offer a strong, evidence-based foundation for understanding the purpose and internal structure of each component. The identified gaps and unclear areas are not blockers; rather, they are key findings from Phase 1 that should become primary targets for clarification during Phase 2. The act of mapping the relationships will help formalize the inferred connections and highlight the precise boundaries where more detail is needed (e.g., the exact contract of the Pub/Sub messages for hardware sync).

Before beginning detailed relationship mapping, it would be beneficial to clarify:
1.  The primary authorization mechanism for callable/HTTP functions. Is there a shared middleware or decorator pattern that is not captured in the individual module evidence?
2.  The definitive Firestore collection paths where AST evidence and schema documents conflict.