### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-28T07:48:50.794Z
- repoName: firebase-oskey-dev
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- moduleCount: 12
- note: sections 2, 4, and 5 below are assembled deterministically from Phase 1 artifacts, not LLM-generated.

### 1. Executive Summary

The `firebase-oskey-dev` repository contains the backend cloud ecosystem for the **Oskey Secure Building Access Platform** [Confirmed]. The platform provides secure, frictionless access control for multi-tenant residential and commercial buildings, primarily serving the France, EU, and EMEA markets [Confirmed, per *Oskey Architecture.md*]. It bridges physical edge hardware—specifically Android-based Intercoms and Linux/Zephyr RTOS-based Digicoms—with cloud-native software, including native iOS/Android mobile applications and an Angular-based Property Manager Portal (PGO) [Confirmed, per *Oskey Architecture.md*].

The backend architecture is built on Google Cloud Platform (GCP) serverless infrastructure, utilizing Node.js-based GCP Cloud Functions as the API gateway and GCP Cloud Run for data ingestion and hardware synchronization [Confirmed, per *Oskey Architecture.md*]. The platform employs a decoupled, hybrid-database architecture [Confirmed, per *Oskey Architecture.md*]:
1. **Google Firestore** serves as the authoritative system of record for business entities, user accounts, unit configurations, lease timelines, and active security rules [Confirmed, per *Oskey Architecture.md*].
2. **MongoDB** acts as a denormalized projection database optimized for low-latency edge device polling and activity log ingestion [Confirmed, per *Oskey Architecture.md*].

The repository is structured into 12 distinct modules that manage administrative, residential, hardware, and core utility domains [Confirmed]. Access orchestration is decoupled from business logic via an asynchronous, event-driven Pub/Sub pipeline, ensuring that physical access state changes (such as alphanumeric PIN generation and SecureBLE token issuance) synchronize to edge hardware asynchronously [Confirmed, per *Oskey Architecture.md*].

---

### 2. Module Inventory

- **access_control_device** — 1 capability pack(s)
- **admin** — 5 capability pack(s)
- **apps** — 4 capability pack(s)
- **building** — 11 capability pack(s)
- **call** — 1 capability pack(s)
- **core** — 6 capability pack(s)
- **organization** — 14 capability pack(s)
- **settings** — 4 capability pack(s)
- **supplier** — 2 capability pack(s)
- **tasks** — 1 capability pack(s)
- **unit_management** — 1 capability pack(s)
- **user** — 11 capability pack(s)

### 3. Major Subsystems

Based on the *Module Dependency Overview* and individual module extracts, the 12 modules of the repository are grouped into four primary subsystems:

#### A. Core Infrastructure & Utilities
* **Modules**: `core`, `apps`, `tasks`, `settings` [Confirmed].
* **Rationale**: This subsystem provides the foundational layers of the platform. `core` acts as the absolute base, providing structured logging, secret management, Firestore document abstractions, and the central access orchestration engine [Confirmed, per `core`'s Executive Summary]. `apps` isolates external transactional communication integrations (SMTP, Twilio SMS, APNs/FCM push notifications) [Confirmed, per `apps`'s Executive Summary]. `tasks` handles asynchronous scheduling via Google Cloud Tasks [Confirmed, per `tasks`'s Executive Summary], and `settings` manages global configurations and Role-Based Access Control (RBAC) resolution [Confirmed, per `settings`'s Executive Summary].
* **Dependency Profile**: This is the most heavily depended-upon subsystem in the repository. `core` alone receives over 1,300 inbound call edges from other modules, including `organization` (396), `user` (330), `building` (253), and `admin` (194) [Confirmed].

#### B. Physical & Hardware Integration
* **Modules**: `access_control_device`, `call` [Confirmed].
* **Rationale**: This subsystem manages the physical edge footprint of the platform. `access_control_device` handles the lifecycle, configurations, cryptographic public keys, and operational states of physical Access Control Devices (ACDs) [Confirmed, per `access_control_device`'s Executive Summary]. `call` manages the real-time WebRTC/SIP call sessions initiated by visitors at physical intercoms to residents' mobile devices [Confirmed, per `call`'s Executive Summary].
* **Dependency Profile**: These modules bridge the physical-to-cloud boundary. `access_control_device` relies heavily on `core` (60 edges) and interacts with `building` (3 edges) [Confirmed]. `call` consumes `core` (21 edges) and `user` (6 edges) to route notifications [Confirmed].

#### C. Administrative & Operational Management
* **Modules**: `admin`, `organization`, `supplier` [Confirmed].
* **Rationale**: This subsystem governs the high-level administrative hierarchies and third-party operational workflows. `organization` manages the top-level Organization, Entity, and Property scopes, serving as the administrative sandbox for property managers [Confirmed, per `organization`'s Executive Summary and *Oskey Architecture.md*]. `supplier` manages the lifecycle and time-bound physical access of third-party contractors [Confirmed, per `supplier`'s Executive Summary]. `admin` provides platform-wide administrative overrides and database maintenance utilities for Oskey SAS operators [Confirmed, per `admin`'s Executive Summary].
* **Dependency Profile**: `organization` is a major orchestrator, calling `core` (396 edges), `building` (73 edges), `settings` (58 edges), and `user` (50 edges) [Confirmed]. `admin` similarly drives operations across `core` (194 edges), `building` (51 edges), and `user` (35 edges) [Confirmed].

#### D. Residential & Occupancy Domain
* **Modules**: `building`, `unit_management`, `user` [Confirmed].
* **Rationale**: This subsystem manages the core residential data model and user-centric states. `building` manages the physical structures, individual units, doors, and intercom directories [Confirmed, per `building`'s Executive Summary]. `user` serves as the identity and profile hub, managing user devices, SecureBLE tokens, and personal settings [Confirmed, per `user`'s Executive Summary]. `unit_management` implements the "Mon Foyer" (My Home) resident-facing self-governance workflows, allowing inhabitants to manage co-inhabitants and guests [Confirmed, per `unit_management`'s Executive Summary].
* **Dependency Profile**: These modules are tightly coupled. `building` and `user` exhibit a perfectly symmetric bidirectional relationship with 34 call edges in each direction [Confirmed]. `unit_management` drives unit-level operations by calling `core` (58 edges), `building` (32 edges), and `user` (19 edges) [Confirmed].

---

### 4. Module Dependency Overview

- `organization` → `core`: 396 confirmed call edge(s)
- `user` → `core`: 330 confirmed call edge(s)
- `building` → `core`: 253 confirmed call edge(s)
- `admin` → `core`: 194 confirmed call edge(s)
- `organization` → `building`: 73 confirmed call edge(s)
- `apps` → `core`: 62 confirmed call edge(s)
- `supplier` → `core`: 61 confirmed call edge(s)
- `access_control_device` → `core`: 60 confirmed call edge(s)
- `organization` → `settings`: 58 confirmed call edge(s)
- `unit_management` → `core`: 58 confirmed call edge(s)
- `admin` → `building`: 51 confirmed call edge(s)
- `organization` → `user`: 50 confirmed call edge(s)
- `core` → `building`: 47 confirmed call edge(s)
- `core` → `user`: 47 confirmed call edge(s)
- `settings` → `core`: 37 confirmed call edge(s)
- `admin` → `user`: 35 confirmed call edge(s)
- `building` → `user`: 34 confirmed call edge(s)
- `user` → `building`: 34 confirmed call edge(s)
- `supplier` → `organization`: 33 confirmed call edge(s)
- `unit_management` → `building`: 32 confirmed call edge(s)
- `building` → `organization`: 26 confirmed call edge(s)
- `admin` → `settings`: 23 confirmed call edge(s)
- `user` → `organization`: 22 confirmed call edge(s)
- `call` → `core`: 21 confirmed call edge(s)
- `building` → `settings`: 20 confirmed call edge(s)
- `unit_management` → `user`: 19 confirmed call edge(s)
- `supplier` → `settings`: 17 confirmed call edge(s)
- `admin` → `organization`: 15 confirmed call edge(s)
- `tasks` → `core`: 14 confirmed call edge(s)
- `organization` → `tasks`: 10 confirmed call edge(s)
- `supplier` → `building`: 10 confirmed call edge(s)
- `user` → `settings`: 9 confirmed call edge(s)
- `core` → `supplier`: 8 confirmed call edge(s)
- `user` → `apps`: 7 confirmed call edge(s)
- `call` → `user`: 6 confirmed call edge(s)
- `organization` → `access_control_device`: 6 confirmed call edge(s)
- `building` → `access_control_device`: 5 confirmed call edge(s)
- `organization` → `apps`: 5 confirmed call edge(s)
- `apps` → `user`: 4 confirmed call edge(s)
- `core` → `access_control_device`: 4 confirmed call edge(s)
- `access_control_device` → `building`: 3 confirmed call edge(s)
- `call` → `access_control_device`: 3 confirmed call edge(s)
- `call` → `building`: 3 confirmed call edge(s)
- `core` → `settings`: 3 confirmed call edge(s)
- `user` → `unit_management`: 3 confirmed call edge(s)
- `admin` → `access_control_device`: 2 confirmed call edge(s)
- `core` → `organization`: 2 confirmed call edge(s)
- `tasks` → `organization`: 2 confirmed call edge(s)
- `access_control_device` → `user`: 1 confirmed call edge(s)
- `access_control_device` → `organization`: 1 confirmed call edge(s)
- `admin` → `tasks`: 1 confirmed call edge(s)
- `organization` → `unit_management`: 1 confirmed call edge(s)
- `tasks` → `admin`: 1 confirmed call edge(s)

### 5. RBAC Requirements Catalog

- `v1.org.buildings.create` (candidate, 16 check-site(s), referenced by: building, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.org.validate` (candidate, 11 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.org.suppliers.view` (candidate, 11 check-site(s), referenced by: settings, supplier) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.delete` (candidate, 9 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.create` (candidate, 7 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.buildings.edit` (candidate, 7 check-site(s), referenced by: building, settings) — **exists** in rbac-roles.json
- `v1.org.buildings.view` (candidate, 7 check-site(s), referenced by: building, organization, settings) — **exists** in rbac-roles.json
- `v1.org.user.create` (candidate, 7 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.org.edit` (candidate, 6 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.org.register` (candidate, 6 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.user.devices.delete` (candidate, 6 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.communications.list` (candidate, 6 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.edit` (candidate, 6 check-site(s), referenced by: core, organization, settings) — **exists** in rbac-roles.json
- `v1.org.settings.create` (confirmed, 6 check-site(s), referenced by: building, settings, user) — **exists** in rbac-roles.json
- `v1.org.settings.delete` (confirmed, 6 check-site(s), referenced by: building, settings, user) — **exists** in rbac-roles.json
- `v1.org.settings.view` (confirmed, 6 check-site(s), referenced by: building, settings, user) — **exists** in rbac-roles.json
- `v1.org.suppliers.edit` (candidate, 6 check-site(s), referenced by: settings, supplier) — **exists** in rbac-roles.json
- `v1.org.user.view` (candidate, 6 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin` (candidate, 5 check-site(s), referenced by: admin, organization, settings) — **MISSING from rbac-roles.json**
- `v1.admin.org.delete` (candidate, 5 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.org.view` (candidate, 5 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.user.edit` (candidate, 5 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.admin` (candidate, 5 check-site(s), referenced by: organization, settings, user) — **MISSING from rbac-roles.json**
- `v1.org.entity.create` (candidate, 5 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.create` (candidate, 5 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.onboardingNotification` (candidate, 5 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.settings.edit` (confirmed, 5 check-site(s), referenced by: building, settings, user) — **exists** in rbac-roles.json
- `v1.org.user.edit` (candidate, 5 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.building.register` (candidate, 4 check-site(s), referenced by: building, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.view` (candidate, 4 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.delete` (candidate, 4 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.invitations.delete` (candidate, 4 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.view` (candidate, 4 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.communications.create` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.property.create` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.property.edit` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.view` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.suppliers.create` (candidate, 4 check-site(s), referenced by: settings, supplier) — **exists** in rbac-roles.json
- `v1.org.suppliers.delete` (candidate, 4 check-site(s), referenced by: settings, supplier) — **exists** in rbac-roles.json
- `v1.org.view` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.edit` (candidate, 3 check-site(s), referenced by: building, settings) — **exists** in rbac-roles.json
- `v1.admin.building.admin` (candidate, 3 check-site(s), referenced by: organization, settings) — **MISSING from rbac-roles.json**
- `v1.admin.org.admin` (candidate, 3 check-site(s), referenced by: organization, settings) — **MISSING from rbac-roles.json**
- `v1.admin.user.devices.edit` (candidate, 3 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.devices.view` (candidate, 3 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.invitations.view` (candidate, 3 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.communications.delete` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.communications.view` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.entity.delete` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.entity.edit` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.entity.view` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.property.view` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.delete` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.edit` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.list` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.accessControlDevice.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.register` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.view` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.edit` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.validate` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.view` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.settings.role.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.settings.role.create` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.role.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.role.edit` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.role.view` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.settings.workflow.create` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.edit` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.view` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.user.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.user.devices.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.user.invitations.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.buildings.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.buildings.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.communications.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.communications.edit` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.entity.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.property.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.property.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.residents.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.settings.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.suppliers.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.user.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.user.delete` (candidate, 2 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.org.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.role.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.devices.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.invitations.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org` (candidate, 1 check-site(s), referenced by: organization) — **MISSING from rbac-roles.json**
- `v1.org.buildings.createManager` (candidate, 1 check-site(s), referenced by: building) — **MISSING from rbac-roles.json**
- `v1.org.buildings.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.entity.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.property.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.settings.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.suppliers.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.user.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json

### 6. Cross-Cutting Patterns

#### RBAC Requirements Catalog Analysis
An analysis of the *RBAC Requirements Catalog* and the authoritative `rbac-roles.json` reveals several cross-cutting patterns and discrepancies:

* **Highly Referenced vs. Isolated Permissions**: 
  * `v1.org.buildings.create` is the most heavily referenced permission string in the codebase, with 16 check-sites spanning the `building`, `organization`, and `settings` modules [Confirmed].
  * `v1.admin.org.validate` is the most heavily referenced administrative permission, with 11 check-sites across `admin`, `organization`, and `settings` [Confirmed].
  * Conversely, granular permissions like `v1.admin.accessControlDevice.list` and `v1.admin.building.list` are highly isolated, with only 1 check-site each, restricted to the `settings` module [Confirmed].
* **Systemic Missing Role Definitions**: There is a major, systemic discrepancy between the permission strings checked in the codebase and those defined in the authoritative `rbac-roles.json` schema. Specifically, **22 permission strings** referenced in the code are completely missing from the authoritative roles definition [Confirmed]. 
  * These missing strings are almost exclusively coarse-grained administrative roles ending in `.admin` (e.g., `v1.admin`, `v1.org.admin`, `v1.admin.building.admin`, `v1.admin.org.admin`, `v1.admin.accessControlDevice.admin`, `v1.admin.settings.admin`, `v1.admin.settings.role.admin`, `v1.admin.settings.workflow.admin`, `v1.admin.user.accesses.admin`, `v1.admin.user.admin`, `v1.admin.user.devices.admin`, `v1.admin.user.invitations.admin`, `v1.org.buildings.admin`, `v1.org.communications.admin`, `v1.org.entity.admin`, `v1.org.property.admin`, `v1.org.residents.admin`, `v1.org.settings.admin`, `v1.org.suppliers.admin`, `v1.org.user.admin`) [Confirmed].
  * This indicates that the codebase relies on a pattern of checking broad administrative roles that have not been formally registered in the platform's RBAC schema [Inferred].
* **Naming Conventions**: Naming conventions are highly consistent for standard operational permissions, following the `v1.{scope}.{entity}.{action}` pattern (e.g., `v1.org.residents.create`) [Confirmed]. However, the missing administrative roles break this convention by omitting the action parameter (e.g., `v1.org.user.admin` instead of `v1.org.user.edit` or `v1.org.user.delete`) [Confirmed].

#### Module Dependency Overview Analysis
The *Module Dependency Overview* reveals clear structural patterns regarding coupling, core infrastructure, and isolation:

* **Core Infrastructure Anchors**: The `core` module is the absolute structural anchor of the repository, receiving 1,384 inbound call edges from all other 11 modules [Confirmed]. This confirms its role as the shared foundation for logging, document controllers, and access orchestration [Inferred].
* **Tight Bidirectional Coupling**:
  * **`building` <-> `user`**: This pair exhibits a perfectly balanced, tight bidirectional coupling with exactly 34 call edges in each direction [Confirmed]. This reflects the constant need to resolve user identities to physical building/unit scopes and vice versa [Inferred].
  * **`core` <-> `building` & `core` <-> `user`**: `core` has significant outbound edges to `building` (47 edges) and `user` (47 edges), despite being the foundational layer [Confirmed]. This bidirectional coupling indicates that the central access orchestration services in `core` must call back into the domain-specific modules to execute business logic [Inferred].
  * **`tasks` <-> `organization` & `tasks` <-> `admin`**: `tasks` exhibits bidirectional coupling with `organization` (`tasks` -> `organization`: 2, `organization` -> `tasks`: 10) and `admin` (`tasks` -> `admin`: 1, `admin` -> `tasks`: 1) [Confirmed].
* **Structural Isolation**:
  * **`call`**: The `call` module is highly isolated. It has zero inbound call edges from any other module in the dependency overview, and only 27 outbound edges (`call` -> `core`: 21, `call` -> `user`: 6) [Confirmed]. This indicates that call session management operates as a self-contained, reactive consumer of edge signals [Inferred].
  * **`tasks`**: The `tasks` module is also structurally isolated, with only 17 total outbound edges and 11 inbound edges [Confirmed].

---

### 7. Repo-Wide Risks

#### A. Systemic RBAC Schema Drift and Missing Admin Roles
* **Source Modules**: `admin`, `organization`, `settings`, `user` [Confirmed].
* **Risk Analysis**: The *RBAC Requirements Catalog* reveals that 22 distinct permission strings checked in code are completely missing from `rbac-roles.json` [Confirmed]. This includes critical roles like `v1.admin` (checked in `admin` and `organization`) and `v1.org.admin` (checked in `user` and `organization`) [Confirmed]. Because the `settings` module's role resolution engine relies on these definitions to map composite roles to flat permission lists [Confirmed, per `settings`'s Architectural Position], this schema drift could cause the system to silently fail to authorize legitimate administrators, or conversely, fail to restrict access if fallback logic is insecure [Inferred].

#### B. Circular Module Coupling and Layering Violations
* **Source Modules**: `core`, `apps`, `building`, `user`, `tasks`, `supplier` [Confirmed].
* **Risk Analysis**: The dependency overview reveals extensive circular dependencies across the repository. `core` (the lowest-level module) calls back into `building` (47 edges) and `user` (47 edges) [Confirmed]. Furthermore, `apps` exhibits a circular dependency with `user` (specifically between `apps/notification` and `user/user_notification`) [Confirmed, per `apps`'s Cross-Cutting Risks], and `tasks` has bidirectional coupling with `admin` and `organization` [Confirmed, per `tasks`'s Cross-Cutting Risks]. These circularities violate strict architectural layering, making the codebase highly fragile, complicating local testing, and risking runtime initialization or compilation failures [Inferred].

#### C. Over-scoped and Overloaded Permissions
* **Source Modules**: `building`, `organization` [Confirmed].
* **Risk Analysis**: There is a pattern of overloading highly privileged building-creation permissions to authorize standard resident operations. Specifically, `organization` uses `v1.org.buildings.create` (intended for registering new buildings) to authorize resident onboarding and invitation workflows [Confirmed, per `organization`'s Architectural Position]. Similarly, `building` uses `v1.org.buildings.create` and `v1.admin.building.register` to guard standard user-to-building associations [Confirmed, per `building`'s Cross-Cutting Risks]. This prevents property managers from delegating resident onboarding or occupant management to local staff without also granting them the ability to create or register entire buildings, violating the principle of least privilege [Inferred].

#### D. Silent Database-Level Security Rule Gaps (Lack of Defense-in-Depth)
* **Source Modules**: `access_control_device`, `building`, `settings`, `supplier` [Confirmed].
* **Risk Analysis**: A comparison of Firestore security rules and module configurations reveals a systemic lack of database-level validation:
  * `access_control_device` security rules allow any authenticated user (`isValidUser()`) to read and write to `/accessControlDevices` and all nested subcollections, lacking tenant or building isolation [Confirmed, per `access_control_device`'s Cross-Cutting Risks].
  * `building` has no explicit rules defined in `firestore.rules.txt` for `/buildings/{buildingId}/pincodes`, `/buildings/{buildingId}/accesses`, or `/buildings/{buildingId}/units/{unitId}/nonAppUsers` [Confirmed, per `building`'s Cross-Cutting Risks].
  * `supplier` has a complete lack of security rules for `/suppliers/**` [Confirmed, per `supplier`'s Cross-Cutting Risks].
  * `settings` allows any authenticated user write access to `/settings/{docId}` [Confirmed, per `settings`'s Cross-Cutting Risks].
  * This represents a severe lack of defense-in-depth. If application-layer controller guards (such as `@OSKUserSecurityChecks`) are bypassed, misconfigured, or contain bugs, any authenticated user could theoretically read or modify sensitive access credentials, device configurations, and supplier logs [Inferred].

#### E. Imperative Cascade Deletions vs. Transactional Integrity
* **Source Modules**: `unit_management`, `user` [Confirmed].
* **Risk Analysis**: When a user account is deleted or an inhabitant is removed, the cleanup of associated pincodes, accesses, and intercom entries across `core`, `building`, and `user` is executed imperatively in service code rather than via transactional database triggers [Confirmed, per `unit_management`'s and `user`'s Cross-Cutting Risks]. If a network partition, database timeout, or function execution limit occurs mid-deletion, the system will be left in an inconsistent state. This could leave orphaned physical access credentials (PINs or BLE tokens) active on edge hardware, presenting a direct physical security vulnerability [Inferred].