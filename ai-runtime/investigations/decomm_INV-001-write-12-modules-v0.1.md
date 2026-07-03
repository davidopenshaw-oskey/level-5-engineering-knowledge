INV-001 — Gemini Corpus Understanding
1. Corpus Inventory
Based on the provided documentation, I have identified and reviewed exactly 12 engineering modules.

Module: access_control_device

Primary Responsibility: Manages the backend document model and persistence for physical Access Control Devices (ACDs), including device records, configuration, public key material, and logs.
Primary Firestore Areas: /accessControlDevices and its subcollections (/configs, /publicKeys).
Main Dependencies: Building and Door modules for device assignment.
Main Consumers: Hardware synchronization workflows, access orchestration services (core), and administrative UIs (admin).
Confidence: High.
Module: admin

Primary Responsibility: Provides a privileged, cross-cutting administrative and maintenance API surface for backend operations, acting as an orchestration layer over canonical data collections.
Primary Firestore Areas: Reads/writes across many collections, including /buildings, /organizations, and /users. It does not own a primary collection itself.
Main Dependencies: Nearly all other domain modules (building, organization, user, core, tasks, etc.) to perform its administrative functions.
Main Consumers: Internal PGO (Property-Graph-Oskey) administration portal and operational staff.
Confidence: High.
Module: apps

Primary Responsibility: A shared application-communications module providing services for email, SMS, push notifications, and QR code generation.
Primary Firestore Areas: /EmailLogs. Inferred ownership of SMS logs.
Main Dependencies: user (for notification tokens), call (for ICE server data in notifications), and external providers (Twilio, APNS, FCM).
Main Consumers: Other backend modules that need to send user-facing communications.
Confidence: High.
Module: building

Primary Responsibility: Owns the Building scope, managing the core /buildings documents and coordinating building-scoped subdomains like doors, units, intercoms, settings, and pincodes.
Primary Firestore Areas: /buildings and its subcollections (/doors, /units, /settings, /intercoms, /pincodes, etc.).
Main Dependencies: organization (for hierarchy), access_control_device (for door assignment), user (for access ledgers).
Main Consumers: admin, core (access orchestration), call, and unit_management modules.
Confidence: High.
Module: call

Primary Responsibility: Manages the HTTP-facing, real-time call sessions initiated from Intercom devices, orchestrating the /calls state machine.
Primary Firestore Areas: /calls (primary ownership), reads /buildings/{buildingId}/callTransferList, writes to /users/{id}/calls.
Main Dependencies: building (for call transfer lists), user (for recipient notifications), access_control_device (for initiating caller), apps (for push notifications).
Main Consumers: Intercom devices, resident mobile applications.
Confidence: High.
Module: core

Primary Responsibility: Provides shared backend infrastructure, including generic Firestore controllers, Pub/Sub publishing, and, most critically, the central access orchestration service that manages access grants, updates, and revocations across the platform.
Primary Firestore Areas: Does not own a primary domain collection but orchestrates writes across /users/{id}/accesses, /buildings/{id}/accesses, and various pincode collections.
Main Dependencies: user, building, supplier, access_control_device modules to perform its orchestration.
Main Consumers: All modules that need to grant or revoke physical access, such as unit_management, supplier, and admin.
Confidence: High.
Module: organization

Primary Responsibility: Manages the top-level /organizations collection and its associated subdomains, including residents, organization users, properties, and invitation workflows.
Primary Firestore Areas: /organizations and its subcollections (/buildings, /residents, /users, /properties).
Main Dependencies: user (for user and invitation management).
Main Consumers: admin module, PGO administrative UIs.
Confidence: High.
Module: settings

Primary Responsibility: Manages the platform's configuration and Role-Based Access Control (RBAC) catalog, including roles, composite roles, and workflow settings.
Primary Firestore Areas: /settings and its subcollections (/roles, /compositeRoles, /workflows).
Main Dependencies: None directly evidenced, but it provides foundational data for other modules.
Main Consumers: All modules that perform permission checks, particularly admin, organization, and supplier.
Confidence: High.
Module: supplier

Primary Responsibility: Manages third-party service providers and their staff, including their access to buildings.
Primary Firestore Areas: /suppliers and its subcollections (/staffMembers, /accesses, /pincodes, /activities).
Main Dependencies: core (for access provisioning/revocation), organization (for scoping), building (for door validation).
Main Consumers: PGO administrative UIs, admin module.
Confidence: High.
Module: tasks

Primary Responsibility: A small infrastructure module for scheduling and handling asynchronous backend work via Google Cloud Tasks.
Primary Firestore Areas: None.
Main Dependencies: admin (for pincode refresh worker), organization (for intercom communication service).
Main Consumers: Any module needing to schedule deferred work.
Confidence: High.
Module: unit_management

Primary Responsibility: Orchestrates the management of people (inhabitants, guests) and invitations within a specific Building Unit.
Primary Firestore Areas: /buildings/{buildingId}/units/{unitId}/pendingUnitInvitations. It reads/writes to many other collections via delegation.
Main Dependencies: building (unit inhabitants/guests), user (invitations, profile lookups), core (access/pincode revocation), organization (intercom).
Main Consumers: Resident-facing mobile applications.
Confidence: High.
Module: user

Primary Responsibility: Manages user identity, profiles, devices, notification settings, invitations, and user-scoped access/pincode/activity records.
Primary Firestore Areas: /users and its subcollections (/devices, /notifications, /invitations, /settings, etc.).
Main Dependencies: organization (for membership), building (for settings), core (for access).
Main Consumers: Nearly all other modules, as user identity is central to the platform.
Confidence: High.
2. First-Pass System Understanding
The provided corpus describes a sophisticated, multi-tenant, cloud-native physical access control platform. The system is architected around a clear hierarchical data model (Organization > Entity > Property > Building > Unit) that mirrors real-world real estate structures.

Confirmed: The platform's backend is composed of modular, domain-oriented services running as Cloud Functions. These modules manage distinct business concepts. For example, the organization, building, and user modules own their respective data domains. Physical hardware (access_control_device) is treated as a distinct domain, managed and provisioned by the backend.

Confirmed: A central theme is the separation of authoritative data from derived, read-optimized projections. Core data like user profiles (/users) or building structures (/buildings) are the source of truth. This data is then fanned-out or denormalized into other collections to support specific use cases, such as user-centric call history (/users/{id}/calls) or building-centric access ledgers (/buildings/{id}/accesses).

Inferred: The system appears to operate on an event-driven or orchestrated basis rather than through direct, monolithic calls. Changes in one module (e.g., deleting a supplier staff member) trigger a cascade of operations across other modules (core access service, pincode services, building access ledger) to ensure system-wide consistency and security. This is most evident in the core access service and the various deletion workflows.

Confirmed: The platform has a clear separation between administrative/management functions (handled by the admin and organization modules, likely for the PGO portal) and runtime operational functions (like call for intercom sessions or unit_management for resident-facing actions).

3. Apparent Architectural Layers
The modules form several distinct architectural layers:

Core Infrastructure Layer (Confirmed): This layer provides foundational, cross-cutting capabilities.

core: Offers generic Firestore controllers, Pub/Sub abstractions, and secret management.
apps: Centralizes all outbound user communication (email, SMS, push).
tasks: Provides an asynchronous task execution framework.
Identity & Configuration Layer (Confirmed): This layer manages identity, permissions, and platform configuration.

user: The anchor for user identity, profiles, and user-scoped data.
settings: The catalog for RBAC roles and platform-wide configuration.
core (Auth0 submodule): Manages integration with the external identity provider.
Domain & Data Ownership Layer (Confirmed): These modules are the authoritative sources for the primary business entities.

organization: Owns the top-level customer tenancy model.
building: Owns the physical building and its structural sub-entities (doors, units).
supplier: Owns the data model for third-party service providers.
access_control_device: Owns the data model for physical hardware.
Orchestration & Workflow Layer (Confirmed): This layer contains modules that coordinate complex, multi-step business processes across different domains.

core (access submodule): The most critical orchestrator, managing the entire lifecycle of access grants which touches user, building, supplier, and hardware sync via Pub/Sub.
unit_management: Orchestrates adding/removing people from a unit, which involves user, core (access), pincode services, and organization (intercom) modules.
call: Orchestrates the state machine of a real-time communication session.
Privileged Administration Layer (Confirmed):

admin: A high-privilege, cross-cutting module that performs wide-scope administrative and data maintenance tasks, callable only by trusted operators.
4. Apparent Orchestration Points
Several modules act as central orchestration points, coordinating actions across multiple downstream services and data collections.

core (OSKAccessService) (Confirmed): This is the most significant orchestration point. The createAccess and deleteAccessById methods are not simple CRUD operations. They are complex workflows that fan out changes to user-centric access ledgers (/users/{id}/accesses), building-centric ledgers (/buildings/{id}/accesses), pincode collections, and ultimately publish messages via Pub/Sub to synchronize physical hardware. This service is the single point of entry for provisioning or revoking access.

unit_management (Confirmed): The services in this module, such as removeInhabitantFromUnit, orchestrate a cascade of cleanup operations. Removing an inhabitant involves calls to OSKAccessService to delete access, pincode services to delete pincodes, and OSKBuildingIntercomService to remove the user from the intercom directory.

admin (Confirmed): The maintenance services within this module (e.g., OSKDbAccessService, OSKDbIntercomService) are powerful orchestrators designed for bulk repair, synchronization, and data back-filling across the entire platform.

call (Confirmed): This module orchestrates the lifecycle of a call session. Upon call termination, it fans out denormalized call history records to the user module's subcollections (/users/{id}/calls and activity aggregates).

5. Apparent Data Ownership
The data architecture appears to follow a "source of truth with denormalized projections" model.

Authoritative Sources (Confirmed):

/users: The user module owns the canonical user profile.
/organizations: The organization module owns the top-level customer entity.
/buildings: The building module owns the canonical representation of a physical building.
/suppliers: The supplier module owns the canonical supplier company records.
/accessControlDevices: The access_control_device module owns the canonical hardware records.
/settings: The settings module owns the RBAC and platform configuration.
Derived Projections & Read Models (Confirmed):

/users/{id}/accesses and /buildings/{id}/accesses: These are denormalized ledgers of access grants, orchestrated by the core module but owned for read purposes by the user and building scopes, respectively.
/users/{id}/calls: This is a user-centric, denormalized call history, fanned out from the operational /calls collection owned by the call module.
Activity Aggregates (e.g., /users/{id}/activityAggregates): These are rolling, time-windowed summaries of activity events, designed for efficient UI reads, existing alongside the raw, immutable activity logs.
/organizations/{id}/buildings: This appears to be a denormalized index to allow efficient querying of buildings within an organization, as evidenced by the organization module profile.
External Projections (Inferred):

The architecture documents state that MongoDB acts as a "decoupled database layer engineered specifically for consumption by physical field hardware." This implies that data from Firestore (like pincodes and access lists from the core module's orchestration) is projected into MongoDB for the ACDs to consume. The Pub/Sub messages from OSKAccessMessagePublisherService are the likely trigger for this projection.
6. Immediate Gaps or Unclear Areas
Authentication & Authorization (Partially Evidenced/Unclear): While RBAC permission strings (v1.org.*) are checked in many services, the mechanism for authenticating the initial callable/HTTP requests is not detailed in the module evidence. Firestore rules are present for some collections but appear incomplete or overly broad for others (e.g., /settings/{docId}), suggesting authorization may be heavily concentrated in the backend services. The status of v1.admin.* roles is explicitly marked as "work in progress."

Hardware Synchronization (Inferred): The modules clearly publish messages to Pub/Sub topics (e.g., OSK_PUBSUB_TOPIC_ACD_ACCESSES). However, the consumer of these messages—the service that updates MongoDB and the mechanism by which the ACDs poll or receive these updates—is not described within the provided corpus.

Real-Time Communication Layer (Placeholder): The call module profile and architecture documents explicitly label the SIP/WebRTC signaling and media gateway as an "architectural placeholder." The evidence confirms HTTP orchestration and the presence of iceServers data, but not the complete media stack.

Path Naming Conflicts (Confirmed):

The unit_management module's controller uses /buildings/{buildingId}/units/{unitId}/pendingUnitInvitations, while the backend architecture document refers to it as /pendingInvitations.
The settings module evidence shows path shape differences for roles and workflows between what controllers use (/settings/roles/compositeRoles) and what the schema documents (/settings/{id}/compositeRoles).
Activity Ingestion (Inferred): The supplier and user modules have services to handle incoming activity events (ActivityReceivedFor...), but the trigger for these handlers (e.g., a Pub/Sub subscription or an HTTP endpoint) is not defined within their respective module evidence. The core module's PubSubMessageProcessor appears to be the likely entry point, but this is an inferred connection.

7. Readiness for Investigation 2
Ready.

The Engineering Corpus is sufficiently detailed and consistent to proceed with Investigation 2: module relationship extraction and architecture synthesis.

The provided module profiles offer a strong, evidence-based foundation for understanding the purpose and internal structure of each component. The identified gaps and unclear areas are not blockers; rather, they are key findings from Phase 1 that should become primary targets for clarification during Phase 2. The act of mapping the relationships will help formalize the inferred connections and highlight the precise boundaries where more detail is needed (e.g., the exact contract of the Pub/Sub messages for hardware sync).

Before beginning detailed relationship mapping, it would be beneficial to clarify:

The primary authentication and authorization mechanism for callable/HTTP functions. Is there a shared middleware or decorator pattern that is not captured in the individual module evidence?
The definitive Firestore collection paths where AST evidence and schema documents conflict.
8. Evidence and Confidence
This analysis is based entirely on the 17 supplied context files, including the 12 engineering module profiles, architecture documents, and charters. No external information was used.

My confidence in this first-pass understanding is High. The corpus is rich with implementation evidence, and the module profiles are consistent in their structure and level of detail, allowing for effective synthesis. The distinction between confirmed evidence, inferred behavior, and open questions is clear throughout the source material, which allows me to maintain that separation in this analysis.