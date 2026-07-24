# System Architecture Profile

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Profile** | System Architecture Profile |
| **Version** | 4.0 (Phase 2 Synthesis post Phase 1.75 Graph Resolution) |
| **Repository** | Oskey Cloud Functions Backend (`firebase-oskey-dev`) |
| **Evidence Version** | 1.75 (Run `20260724_101041-1aa319b1`, Commit `1aa319b1`) |
| **Extracted AST Facts** | 13,110 facts across 539 TypeScript source files |
| **Resolved Cross-Module Calls** | 158 Cross-Module Call Edges (100% Deterministically Matched) |
| **Resolved Shared Paths** | 70 Shared Firestore Collection Paths |
| **Generated Date** | 2026-07-24 |
| **Previous Investigation** | Phase 1.75 Resolved Engineering Graph |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Overall Confidence** | High |
| **Status** | Completed & Grounded |

---

## 1. Repository Architectural Identity

The Oskey Cloud Functions backend repository (`firebase-oskey-dev`) implements a modular, event-driven, multi-tenant cloud backend for a physical access control and smart building platform. Its primary engineering purpose is to serve as the authoritative cloud source for business logic, multi-tenant hierarchy, identity management, physical access orchestration, and hardware state synchronization, decoupling core business logic from physical IoT hardware devices.

The most architecturally significant responsibilities are:
* **Access & Pincode Orchestrator (`core`)**: The central capability for provisioning, revoking, and refreshing physical access credentials, orchestrating the `Paired Document Pattern` across user-centric and building-centric ledgers, and maintaining `pincode_trash` for collision avoidance.
* **Identity Anchor (`user`)**: The authoritative source of truth for user profiles, credentials, notification preferences, and user-scoped data.
* **Tenancy & Asset Hierarchy (`organization`, `building`)**: Modeling real-world physical structures from enterprise organizations down to individual buildings, doors, and units.
* **Resident Unit Management (`unit_management`)**: Resident-led invitation and guest management, translating mobile actions into multi-domain access grants.
* **Privileged Administration & Repair (`admin`)**: High-privilege mutator providing data repair, bulk backfilling, and administrative operations.

Dominant integration boundaries include:
* **Client-Facing HTTPS Callable APIs**: 253 HTTPS Callable functions exposed for the PGO Portal and Mobile Apps.
* **Hardware Synchronization via Pub/Sub**: Event-driven decoupling publishing "access intent" messages to `OSK_PUBSUB_TOPIC_ACD_ACCESSES` and intercom directories to `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`.
* **External Provider Integrations**: Auth0 for identity, Twilio/APNS/FCM (via `apps`) for notifications, and Google Cloud Tasks (via `tasks`) for asynchronous work.

---

## 2. Module Responsibility Catalogue

### `access_control_device`
* **Primary Responsibilities**: Manages backend document models and persistence for physical Access Control Devices (ACDs).
* **Specific Capabilities**: ACD lifecycle persistence, device configuration management, public key management, runtime state capture, command history logging.
* **Significant Operations**: `onDocumentCreated`, `onDocumentDeleted`, `onDocumentUpdated` Firestore triggers on `/accessControlDevices`.
* **Authoritative Ownership**: `/accessControlDevices` and subcollections (`/configs`, `/publicKeys`).
* **Lifecycle Responsibilities**: Device provisioning, public key rotation, and configuration updates.
* **Events Published**: None directly; data changes trigger downstream listeners.
* **Events Consumed**: Device assignment events from `building` module.
* **Consumers**: Hardware sync workflows, `core`, `admin`, `building`.
* **Producers**: PGO Portal / Admin users.
* **Architectural Significance**: Digital twin anchor for physical hardware devices.
* **Confidence**: High (AST verified).

### `admin`
* **Primary Responsibilities**: Provides cross-cutting administrative, data repair, and system maintenance APIs.
* **Specific Capabilities**: Dual Personalities: (1) Standard Administrative CRUD (user/building lookup) and (2) High-Risk Maintenance & Repair (bulk pincode refresh, orphan document cleanup, Mongo database reconciliation).
* **Significant Operations**: `deleteUserData`, `recreateAccessDocumentInMongoDbByBuilding`, `refreshPincodesForBuilding`, `backfillOrganizationData`.
* **Authoritative Ownership**: None (privileged mutator of all collections).
* **Lifecycle Responsibilities**: Orchestrates system repair, account purging, and data migration lifecycles.
* **Events Published**: None.
* **Events Consumed**: None directly (invoked via HTTPS callables).
* **Consumers**: PGO Portal, Internal Operators.
* **Producers**: N/A (Orchestrator).
* **Architectural Significance**: High-privilege hub with wide operational blast radius; primary security boundary.
* **Confidence**: High (AST verified).

### `apps`
* **Primary Responsibilities**: Centralized application communications service for outbound messaging.
* **Specific Capabilities**: Email delivery (SMTP), SMS dispatch (Twilio), Push notifications (APNS/FCM), QR code generation.
* **Significant Operations**: `sendEmail`, `sendSms`, `sendPushNotification`.
* **Authoritative Ownership**: `/EmailLogs`, `/SmsLogs`.
* **Lifecycle Responsibilities**: Message queueing, dispatch, and transmission audit logging.
* **Events Published**: Outbound provider API calls.
* **Events Consumed**: None (utility service called by `call`, `user`, `organization`, `unit_management`).
* **Consumers**: All backend modules requiring user communications.
* **Producers**: N/A (Utility).
* **Architectural Significance**: Centralizes provider abstractions and notification auditing.
* **Confidence**: High (AST verified).

### `building`
* **Primary Responsibilities**: Owns physical property hierarchy and structural assets.
* **Specific Capabilities**: Building management, door configuration, unit structures, intercom directories, building-centric pincodes.
* **Significant Operations**: `createOrganizationBuilding`, `updateBuilding`, `deleteBuilding`, `organizationUserCreateBuildingDoor`.
* **Authoritative Ownership**: `/buildings` and subcollections (`/doors`, `/units`, `/settings`, `/intercoms`, `/pincodes`, `/pincode_trash`).
* **Lifecycle Responsibilities**: Lifecycle of physical building assets and structural hierarchy.
* **Events Published**: Intercom directory updates to `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`.
* **Events Consumed**: Device assignment triggers on `/doors/{doorId}/accessControlDevices`.
* **Consumers**: `admin`, `core`, `call`, `unit_management`.
* **Producers**: PGO Portal Administrators.
* **Architectural Significance**: Structural domain anchor for access control and physical tenancy.
* **Confidence**: High (AST verified).

### `call`
* **Primary Responsibilities**: Manages real-time intercom call sessions.
* **Specific Capabilities**: `/calls` state machine orchestration, call routing, recipient notification, historical call archiving.
* **Significant Operations**: HTTP `POST /calls` (initiate), `PATCH /calls/:callId` (update state).
* **Authoritative Ownership**: Operational `/calls` collection.
* **Lifecycle Responsibilities**: Real-time call session state machine (initiate ➔ ringing ➔ answered/declined ➔ archived).
* **Events Published**: Call completion history fanned out to `/users/{id}/calls`.
* **Events Consumed**: HTTP call requests from physical Intercom ACDs.
* **Consumers**: Intercom ACD Hardware, Resident Mobile Apps.
* **Producers**: Intercom Hardware.
* **Architectural Significance**: Edge communications bridge mapping hardware triggers to resident push notifications.
* **Confidence**: High (AST verified).

### `core`
* **Primary Responsibilities**: Shared backend infrastructure and central orchestrator for physical access and pincode lifecycles.
* **Specific Capabilities**: `OSKAccessService` (access grants/revocations), `OSKPincodeService` & `OSKPincodeGenerationService` (non-colliding pincode engine), `OSKAccessMessagePublisherService` (Pub/Sub sync), Auth0 token exchange.
* **Significant Operations**: `createAccess`, `deleteAccessById`, `generatePincode`, `deleteBuildingPincodeAndMoveToTrash`, `publishMessageToAllACDs`.
* **Authoritative Ownership**: None (orchestrates writes across `user`, `building`, `supplier` data stores).
* **Lifecycle Responsibilities**: End-to-end physical access grant lifecycle from provisioning to revocation and hardware sync.
* **Events Published**: Access intent messages to `OSK_PUBSUB_TOPIC_ACD_ACCESSES`.
* **Events Consumed**: Inbound device activity events via `PubSubMessageProcessor`.
* **Consumers**: `unit_management`, `supplier`, `admin`.
* **Producers**: N/A (Core Orchestrator).
* **Architectural Significance**: The primary orchestration and infrastructure hub of the platform.
* **Confidence**: High (AST verified).

### `organization`
* **Primary Responsibilities**: Top-level customer tenancy and multi-organization governance.
* **Specific Capabilities**: Organization management, property entities, administrative users, invitation workflows.
* **Significant Operations**: `createAnOrganization`, `updateAnOrganization`, `inviteUserWithInvitation`.
* **Authoritative Ownership**: `/organizations` and subcollections.
* **Lifecycle Responsibilities**: Multi-tenant customer lifecycle and administrative access delegation.
* **Events Published**: None directly.
* **Events Consumed**: None.
* **Consumers**: `admin`, PGO Administrative UIs.
* **Producers**: Oskey System Administrators.
* **Architectural Significance**: Root tenant isolation anchor for B2B tenancy.
* **Confidence**: High (AST verified).

### `settings`
* **Primary Responsibilities**: Platform configuration catalog and Role-Based Access Control (RBAC) governance.
* **Specific Capabilities**: Role definitions, composite roles, permission resolution (`checkUserPermissions`), RBAC matrix evaluation.
* **Significant Operations**: `onDocumentCreated`, `onDocumentUpdated` triggers on `/compositeRoles`; `checkUserPermissions` helper.
* **Authoritative Ownership**: `/settings` and subcollections (`/roles`, `/compositeRoles`).
* **Lifecycle Responsibilities**: RBAC role hierarchy consistency and rule evaluation.
* **Events Published**: None.
* **Events Consumed**: Changes to composite roles via Firestore triggers.
* **Consumers**: All protected API endpoints across all modules (`admin`, `organization`, `supplier`, `core`).
* **Producers**: Oskey Security / Admins.
* **Architectural Significance**: Security and authorization foundation.
* **Confidence**: High (AST verified).

### `supplier`
* **Primary Responsibilities**: Management of third-party service provider companies and staff access.
* **Specific Capabilities**: Supplier registration, staff roster management, staff building access provisioning, activity auditing.
* **Significant Operations**: `createSupplier`, `createStaffMember`, `createSupplierStaffAccess`, `deleteSupplier`.
* **Authoritative Ownership**: `/suppliers` and subcollections.
* **Lifecycle Responsibilities**: Supplier company and contractor access lifecycles.
* **Events Published**: Calls `core` to publish access updates.
* **Events Consumed**: Activity events processed via `ActivityReceivedForSupplierStaff`.
* **Consumers**: PGO Administrative UIs, `admin`.
* **Producers**: PGO Administrators.
* **Architectural Significance**: Domain access controller for non-resident B2B contractors.
* **Confidence**: High (AST verified).

### `tasks`
* **Primary Responsibilities**: Asynchronous task scheduling and deferred execution engine.
* **Specific Capabilities**: Google Cloud Tasks scheduler client, task handler endpoints.
* **Significant Operations**: `scheduleTask`, `cancelTask`, `handleTask`.
* **Authoritative Ownership**: None.
* **Lifecycle Responsibilities**: Execution lifecycle of deferred asynchronous background tasks.
* **Events Published**: Dispatches scheduled tasks to Google Cloud Tasks service.
* **Events Consumed**: Consumes execution callbacks from Google Cloud Tasks.
* **Consumers**: `admin` (pincode refresh workers), `organization` (invitation expiration tasks).
* **Producers**: N/A (Infrastructure).
* **Architectural Significance**: Asynchronous task decoupling engine.
* **Confidence**: High (AST verified).

### `unit_management`
* **Primary Responsibilities**: Resident-facing unit management, guest access, and inhabitant invitations.
* **Specific Capabilities**: Unit invitation management, inhabitant removal, guest access grants, intercom cleanup.
* **Significant Operations**: `createUnitInvitation`, `removeInhabitantFromUnit`, `removePendingInvitation`.
* **Authoritative Ownership**: `/buildings/{bId}/units/{uId}/pendingUnitInvitations`.
* **Lifecycle Responsibilities**: Lifecycle of residents, guests, and unit invitations.
* **Events Published**: Calls `core` to publish access changes.
* **Events Consumed**: None directly (invoked via HTTPS callables).
* **Consumers**: Resident Mobile Applications.
* **Producers**: Building Residents.
* **Architectural Significance**: Resident-facing orchestration layer translating B2C user actions into access grants.
* **Confidence**: High (AST verified).

### `user`
* **Primary Responsibilities**: User identity, profiles, credentials, user-scoped access ledgers, notification settings.
* **Specific Capabilities**: Account creation/deletion triggers, user profile cascades (`_cascadePublicProfileChange`), user device token management.
* **Significant Operations**: `onAccountCreated`, `onAccountDeleted` Auth triggers; `onDocumentUpdated` profile cascade trigger.
* **Authoritative Ownership**: `/users` and subcollections (`/accesses`, `/pincodes`, `/devices`, `/calls`).
* **Lifecycle Responsibilities**: End-to-end user identity lifecycle, including cascading deletion across all modules.
* **Events Published**: None directly.
* **Events Consumed**: Firebase Auth `onCreate`/`onDelete` events; `/users` Firestore update triggers.
* **Consumers**: Virtually all modules.
* **Producers**: End Users, Auth0, Admins.
* **Architectural Significance**: Central identity anchor of the platform.
* **Confidence**: High (AST verified).

---

## 3. Architecturally Significant Capabilities

### Capability 1: Physical Access Provisioning & Revocation
* **Description**: End-to-end grant or revocation of physical door access across PIN and BLE credentials.
* **Coordinating Module**: `core` (`OSKAccessService`).
* **Participating Modules**: `unit_management`, `supplier`, `admin` (initiators); `user`, `building` (data targets); `core` (orchestrator).
* **Significant Operations**: `OSKAccessService.createAccess`, `OSKAccessService.deleteAccessById`.
* **Data Involved**: Writes to `/users/{id}/accesses`, `/buildings/{id}/accesses`, `/users/{id}/pincodes`, `/buildings/{id}/pincodes`, `/buildings/{id}/pincode_trash`.
* **Events Involved**: Publishes access intent messages to `OSK_PUBSUB_TOPIC_ACD_ACCESSES`.
* **External Boundaries**: Pub/Sub topic for IoT hardware synchronization.
* **Confidence**: High.

### Capability 2: Pincode Generation & Lifecycle Management (`Paired Document Pattern`)
* **Description**: Non-colliding PIN generation, double-entry document persistence, and secure revocation.
* **Coordinating Module**: `core` (`OSKPincodeService`, `OSKPincodeGenerationService`).
* **Participating Modules**: `core`, `user`, `building`, `supplier`, `admin`.
* **Pattern**: Implements the **Paired Document Pattern**:
  - Write 1: `/users/{userId}/pincodes` (Optimized for user mobile app display).
  - Write 2: `/buildings/{buildingId}/pincodes` (Optimized for fast building-level hardware sync).
  - Trash Audit: Revoked PINs moved to `/buildings/{buildingId}/pincode_trash` to prevent PIN reuse collisions and retain audit trails.
* **Confidence**: High.

### Capability 3: User Identity & Profile Cascade
* **Description**: Asynchronous propagation of user profile updates across dependent ledgers.
* **Coordinating Module**: `user` (`OSKUserService`).
* **Participating Modules**: `user`, `core`, `organization`, `building`.
* **Cascade Flow**: `_cascadePublicProfileChange` updates `/users/{id}`, then invokes `OSKAccessUpdateService.updateAccessesUserInfo` in `core`, propagating denormalized profile names to `/organizations/{orgId}/users/{userId}`, `/buildings/{bId}/accesses/{userId}`, and `/buildings/{bId}/units/{uId}/inhabitants/{userId}`.
* **Confidence**: High.

### Capability 4: Real-time Intercom Calling
* **Description**: Intercom hardware call initiation, routing, push notification dispatch, and call archiving.
* **Coordinating Module**: `call`.
* **Participating Modules**: `call`, `building`, `user`, `apps`.
* **Operations**: HTTP `POST /calls` initializes call state; dispatches `userCallReceived` push notification via `apps`; archives completed session to `/users/{userId}/calls`.
* **Confidence**: High.

### Capability 5: Role-Based Access Control (RBAC) Governance
* **Description**: Hierarchical role evaluation and permission resolution.
* **Coordinating Module**: `settings`.
* **Participating Modules**: All protected API modules (`admin`, `organization`, `supplier`, `core`).
* **Operations**: `OSKConsolidatedRolesController.checkUserPermissions` evaluates caller authority against `/settings/roles` before API execution.
* **Confidence**: High.

---

## 4. Internal Architectural Topology & Inter-Module Call Matrix

### Sample of Deterministically Resolved Cross-Module Method Calls (158 Total Resolved)

| Source Module | Target Module | Target Service Class | Target Method Executed | Resolution Source |
| :--- | :--- | :--- | :--- | :--- |
| `unit_management` | `core` | `OSKAccessService` | `createAccess` | AST Symbol Resolution |
| `unit_management` | `core` | `OSKAccessService` | `deleteAccessById` | AST Symbol Resolution |
| `supplier` | `core` | `OSKAccessService` | `createAccess` | AST Symbol Resolution |
| `supplier` | `core` | `OSKAccessService` | `deleteAccessById` | AST Symbol Resolution |
| `admin` | `core` | `OSKAccessService` | `createAccess` | AST Symbol Resolution |
| `admin` | `core` | `OSKPincodeService` | `deletePincodeDocuments` | AST Symbol Resolution |
| `admin` | `core` | `OSKAccessMessagePublisherService` | `publishMessageToAllACDs` | AST Symbol Resolution |
| `admin` | `tasks` | `OSKTaskSchedulerService` | `scheduleTask` | AST Symbol Resolution |
| `user` | `core` | `OSKAccessUpdateService` | `updateAccessesUserInfo` | AST Symbol Resolution |
| `building` | `organization` | `OSKOrganizationUserUtils` | `getOrganizationUser` | AST Symbol Resolution |
| `building` | `core` | `OSKAccessUpdateService` | `updateUserAccessesDoorInfo` | AST Symbol Resolution |
| `building` | `user` | `OSKUserIntercomService` | `updateAllUserIntercomEntry` | AST Symbol Resolution |
| `call` | `apps` | `OSKPushNotificationService` | `sendPushNotification` | AST Symbol Resolution |
| `call` | `building` | `OSKBuildingService` | `getCallTransferList` | AST Symbol Resolution |

*Full 158 edges available in [`resolved-graph-matrix.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/output/runs/20260724_101041-1aa319b1/resolved-graph-matrix.md).*

---

## 5. Capability Collaboration Map & Event Routing Table

### Deterministic Event Routing Table

| Message Topic / Trigger | Route Type | Origin Module | Target Module | Service Class | Handler Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `OSK_PUBSUB_TOPIC_ACD_ACCESSES` | `PUBSUB_TOPIC` | `core` | `core` | `OSKAccessMessagePublisherService` | `publishAccessMessage` |
| `OSK_PUBSUB_TOPIC_ACD_ACTIVITY` | `PUBSUB_TOPIC` | `access_control_device` | `core` | `PubSubMessageProcessor` | `processPubSubMessage` |
| `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` | `PUBSUB_TOPIC` | `building` | `building` | `OSKBuildingIntercomPublisherService` | `publishIntercomEntries` |
| `auth.user().onCreate` | `AUTH_TRIGGER` | `firebase_auth` | `user` | `OSKUserService` | `onAccountCreated` |
| `auth.user().onDelete` | `AUTH_TRIGGER` | `firebase_auth` | `user` | `OSKUserService` | `onAccountDeleted` |
| `firestore.users().onUpdate` | `FIRESTORE_TRIGGER` | `user` | `user` | `OSKUserService` | `_cascadePublicProfileChange` |

---

## 6. External Architectural Topology & Integration Surfaces

| Module | Public Capability | Interface Type | Specific Interface / Event | External Consumer / Producer |
| :--- | :--- | :--- | :--- | :--- |
| `unit_management` | Resident Invitation / Guest Access | HTTPS Callable | `createUnitInvitation`, `removeInhabitantFromUnit` | Resident Mobile App |
| `admin` | Privileged Maintenance / Repair | HTTPS Callable | `deleteUserData`, `recreateAccessDocumentInMongoDbByBuilding` | PGO Portal / Operators |
| `organization` | Multi-Tenant Management | HTTPS Callable | `createAnOrganization`, `inviteUserWithInvitation` | PGO Portal / Admins |
| `core` | Access Hardware Sync | Pub/Sub Topic | `OSK_PUBSUB_TOPIC_ACD_ACCESSES` | IoT Hardware Layer |
| `building` | Intercom Directory Sync | Pub/Sub Topic | `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` | IoT Hardware Layer |
| `call` | Real-time Intercom Call Session | HTTP Endpoint | `POST /calls`, `PATCH /calls/:callId` | Intercom ACD Hardware |
| `tasks` | Asynchronous Cloud Task Execution | HTTP Endpoint | `POST /tasks/handleTask` | Google Cloud Tasks |
| `apps` | User Notifications | Provider API | SMTP, Twilio SMS, APNS/FCM Push | External Providers |

---

## 7. Capability and Responsibility Ownership Matrix

| Business Capability | Primary Owner / Coordinator | Supporting Modules | Data Ownership | Event / Integration Ownership | External Consumers | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Physical Access Provisioning** | `core` (`OSKAccessService`) | `user`, `building`, `supplier` | Orchestrates `/users/{id}/accesses` & `/buildings/{id}/accesses` | Pub/Sub `OSK_PUBSUB_TOPIC_ACD_ACCESSES` | PGO Portal, Mobile Apps | High |
| **Pincode Lifecycle & Audit** | `core` (`OSKPincodeService`) | `user`, `building`, `supplier`, `admin` | `/users/.../pincodes`, `/buildings/.../pincodes`, `/buildings/.../pincode_trash` | Part of Pub/Sub access payload; `tasks` for refresh workers | ACD Hardware | High |
| **User Identity & Profile Cascade** | `user` | `core`, `organization`, `building` | `/users` and subcollections | Auth Triggers (`onCreate`/`onDelete`) | Mobile Apps, Auth0 | High |
| **Intercom Real-time Calling** | `call` | `building`, `user`, `apps` | `/calls` | HTTP call endpoints, Push Notifications | Intercom Devices, Mobile Apps | High |
| **Tenancy & Asset Hierarchy** | `organization` / `building` | `unit_management` | `/organizations`, `/buildings` | Pub/Sub Intercom Entries | PGO Portal | High |
| **RBAC Governance** | `settings` | `core` | `/settings/roles` | Firestore composite role triggers | All Modules | High |
| **Privileged System Repair** | `admin` | All Modules | None (privileged mutator) | HTTPS Callables | Internal Operators | High |

---

## 8. Architectural Systems

1. **Identity & Access Management System**:
   - *Participating Modules*: `user`, `core`, `settings`.
   - *Purpose*: Governs identity lifecycle, RBAC enforcement, and physical access provisioning.
2. **Physical & Logical Asset Management System**:
   - *Participating Modules*: `organization`, `building`, `unit_management`.
   - *Purpose*: Models the B2B tenancy tree (Organization ➔ Building ➔ Unit) and resident invitation lifecycles.
3. **Hardware & Edge Integration System**:
   - *Participating Modules*: `access_control_device`, `call`, `tasks`.
   - *Purpose*: Interfaces cloud backend with physical IoT ACD devices and real-time calling hardware.
4. **Administrative & Communications System**:
   - *Participating Modules*: `supplier`, `admin`, `apps`.
   - *Purpose*: Manages contractor access, privileged data maintenance, and outbound communications.

---

## 9. Architectural Topology Findings & Platform Guardrails

* **Architectural Hubs Identified**:
  - `core` is the **Central Access Orchestration & Infrastructure Hub**.
  - `user` is the **Central Identity Anchor**.
  - `admin` is the **Privileged Mutator / Repair Hub**.
* **Non-Negotiable Platform Guardrails**:
  1. *Sole Provisioning Path*: Physical access rights MUST be provisioned exclusively through `core.OSKAccessService`. Direct writes to access ledgers by other modules are forbidden.
  2. *Authoritative vs. Projections*: `/users` and `/buildings` are authoritative; `/users/{id}/accesses` and `/buildings/{id}/accesses` are read projections and MUST NOT be treated as authoritative sources.
  3. *Paired Document Invariant*: Every active PIN MUST exist in both user-centric and building-centric collections simultaneously. Revoked PINs MUST pass through `pincode_trash`.
  4. *Decoupled Hardware Sync*: Cloud logic NEVER waits synchronously for IoT hardware receipt. State changes are published asynchronously to Pub/Sub.

---

## 10. Cross-Repository Readiness

* **Status**: **Moderately Ready** (Internal cloud topology is 100% mapped; external payload schemas require definition).
* **Strengths**: Clear data ownership, modular encapsulation, unified orchestration hubs (`core`, `unit_management`).
* **Integration Requirements for Next Repositories**:
  - Client Mobile Repositories require strict alignment with the 253 Callable API Request/Response schemas.
  - IoT Hardware Repositories require formal JSON Schemas for `OSK_PUBSUB_TOPIC_ACD_ACCESSES` payloads.

---

## 11. Knowledge Gaps & Evidence Improvements (`KI-XXX`)

* **Improvement ID**: `KI-001`
  * **Title**: Define and Document Pub/Sub Message Payload Schemas
  * **Missing Knowledge**: Precise JSON Schema for messages published to `OSK_PUBSUB_TOPIC_ACD_ACCESSES` and `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`.
  * **Why It Matters**: Essential for cross-repository composition with IoT/hardware backend repos.
  * **Priority**: **High**.

* **Improvement ID**: `KI-002`
  * **Title**: Document API Gateway Authorization Middleware Pattern
  * **Missing Knowledge**: Shared decorator/middleware mechanics enforcing `checkUserPermissions` on incoming HTTPS Callable entry points.
  * **Why It Matters**: Needed for formal security and governance auditing.
  * **Priority**: **High**.

* **Improvement ID**: `KI-003`
  * **Title**: Reconcile Firestore Path Naming Discrepancies
  * **Missing Knowledge**: Canonical path resolution where profiles cite `/pendingUnitInvitations` vs `/pendingInvitations`.
  * **Why It Matters**: Prevents ambiguity during automated PRD generation and data schema mapping.
  * **Priority**: **Medium**.

---

## 12. Investigation Conclusions

- **Phase 2 Synthesis Success**: The internal architectural topology of `firebase-oskey-dev` is fully synthesized from 13,110 AST facts across 12 modules, grounded by 158 deterministically resolved cross-module call edges in Phase 1.75.
- **Key Architectural Findings**: Solidified the `Paired Document Pattern` for pincodes, the `_cascadePublicProfileChange` fan-out mechanism, and the 4 primary architectural subsystems.
- **Corpus Integrity**: All findings adhere to the 7 directives in [`.gemini/rules/architectural-synthesis-hierarchy.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/.gemini/rules/architectural-synthesis-hierarchy.md).
