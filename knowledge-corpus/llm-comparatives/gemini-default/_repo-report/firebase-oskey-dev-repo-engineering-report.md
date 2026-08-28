### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T17:44:47.037Z
- repoName: firebase-oskey-dev
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- moduleCount: 12
- note: sections 2, 4, and 5 below are assembled deterministically from Phase 1 artifacts, not LLM-generated.

### 1. Executive Summary

The `firebase-oskey-dev` repository contains the backend cloud platform for the Oskey Secure Building Access Platform [Confirmed]. The platform provides secure, frictionless, and multi-tenant access control for residential and commercial buildings, primarily serving the European and EMEA markets [Confirmed]. It acts as the central administrative and orchestration hub that bridges physical edge hardware—such as Android-based Intercoms and Zephyr RTOS-based Digicoms—with client-facing applications, including native iOS/Android mobile apps and the Angular-based Property Manager Portal (PGO) [Confirmed].

The repository is structured as a modular Node.js application deployed on Google Cloud Platform (GCP) serverless infrastructure [Confirmed]. It utilizes GCP Cloud Functions as its primary API gateway and computing layer, with GCP Cloud Run hosting middleware that isolates client-facing databases from edge-polling databases [Confirmed]. The platform employs a hybrid-database architecture: Google Firestore serves as the authoritative system of record for client and management states, while MongoDB acts as a denormalized projection database optimized for low-latency edge device synchronization and event ingestion [Confirmed]. Real-time data propagation and asynchronous hardware synchronization are driven by a robust GCP Pub/Sub event backbone [Confirmed].

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

Based on the architectural positions of the individual modules and the repository's dependency graph, the 12 modules are grouped into four major subsystems:

#### A. Administrative & Multi-Tenant Governance Subsystem
* **Modules**: `organization`, `admin`, `settings`
* **Rationale**: This subsystem manages the top-level corporate and real estate hierarchy (Organizations, Entities, Properties, and Buildings) and enforces strict multi-tenant data isolation [Confirmed]. 
  * `organization` acts as the master system of record for administrative boundaries and tenant sandboxing [Confirmed].
  * `admin` provides high-level orchestration for cross-domain administrative tasks and platform-wide maintenance/migrations [Confirmed].
  * `settings` serves as the global authorization engine, defining and consolidating the platform's Role-Based Access Control (RBAC) roles and composite permission hierarchies [Confirmed].

#### B. Physical Infrastructure & Hardware Orchestration Subsystem
* **Modules**: `building`, `access_control_device`, `call`
* **Rationale**: This subsystem maps logical business structures to physical real estate assets and manages the lifecycle, configuration, and real-time communication of physical edge hardware [Confirmed].
  * `building` manages physical buildings, doors, units, intercom configurations, and edge activity log ingestion [Confirmed].
  * `access_control_device` handles the lifecycle, configuration, and cryptographic public key provisioning of physical Intercoms and Digicoms [Confirmed].
  * `call` orchestrates the end-to-end WebRTC/SIP signaling and call-forwarding routing that connects physical intercoms at building entrances to residents' mobile applications [Confirmed].

#### C. User Identity, Household, & Access Lifecycle Subsystem
* **Modules**: `user`, `unit_management`, `supplier`
* **Rationale**: This subsystem manages user profiles, registered mobile/wearable devices, household boundaries, and third-party service providers [Confirmed].
  * `user` acts as the authoritative system of record for user profiles, device tokens, and communication channels, bridging external Auth0 identities with internal access scopes [Confirmed].
  * `unit_management` orchestrates the logical relationships of the "Mon Foyer" (household) boundary, managing the onboarding and offboarding of residents, co-inhabitants, and permanent guests [Confirmed].
  * `supplier` manages the lifecycle, access permissions, and offline credentials (alphanumeric PINs) of third-party contractors and maintenance personnel [Confirmed].

#### D. Shared Platform Infrastructure & Utilities Subsystem
* **Modules**: `core`, `apps`, `tasks`
* **Rationale**: This subsystem provides foundational, stateless utilities and shared infrastructure services utilized across all other subsystems [Confirmed].
  * `core` provides centralized Firestore document controllers, structured logging, secret management, and the platform's central access-provisioning orchestration engine [Confirmed].
  * `apps` orchestrates transactional multi-channel notifications (push, email, SMS), generates utility assets (QR codes), and maintains communication audit logs [Confirmed].
  * `tasks` leverages Google Cloud Tasks to schedule, execute, and cancel asynchronous background operations (such as pincode refreshes) [Confirmed].

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

#### A. RBAC Requirements Catalog Analysis
Comparing the code-level permission checks against the authoritative `rbac-roles.json` schema reveals significant patterns and structural discrepancies:

* **High-Frequency vs. Low-Frequency Permissions**:
  * The most heavily referenced permission string in the repository is `v1.org.buildings.create` (16 check-sites across `building`, `organization`, and `settings`), indicating that building creation is a highly guarded administrative boundary [Confirmed].
  * Other highly referenced permissions include `v1.admin.org.validate` (11 check-sites across `admin`, `organization`, and `settings`) and `v1.org.suppliers.view` (11 check-sites across `settings` and `supplier`) [Confirmed].
  * Conversely, granular settings and workflow permissions (e.g., `v1.admin.settings.role.list`) are referenced at only a single check-site, isolated entirely within the `settings` module [Confirmed].

* **Systemic Missing Permissions (Code vs. Schema Mismatch)**:
  There is a widespread pattern of high-level composite roles and administrative permissions being checked in the codebase but completely missing from the authoritative `rbac-roles.json` schema. These include:
  * **Global Admin Roles**: `v1.admin` (5 check-sites across `admin`, `organization`, `settings`) and `v1.org.admin` (5 check-sites across `organization`, `settings`, `user`) [Confirmed].
  * **Scoped Admin Roles**: `v1.admin.org.admin` (3 check-sites), `v1.admin.building.admin` (3 check-sites), and `v1.admin.accessControlDevice.admin` (2 check-sites) [Confirmed].
  * **Subsystem Admin Roles**: `v1.admin.settings.admin` (2 check-sites), `v1.admin.settings.role.admin` (2 check-sites), `v1.admin.settings.workflow.admin` (2 check-sites), `v1.admin.user.admin` (2 check-sites), `v1.admin.user.accesses.admin` (2 check-sites), `v1.admin.user.devices.admin` (2 check-sites), and `v1.admin.user.invitations.admin` (2 check-sites) [Confirmed].
  * **Tenant-Level Admin Roles**: `v1.org.buildings.admin` (2 check-sites), `v1.org.communications.admin` (2 check-sites), `v1.org.entity.admin` (2 check-sites), `v1.org.property.admin` (2 check-sites), `v1.org.residents.admin` (2 check-sites), `v1.org.settings.admin` (2 check-sites), `v1.org.suppliers.admin` (2 check-sites), and `v1.org.user.admin` (2 check-sites) [Confirmed].
  * **Specific Missing Permissions**: `v1.org` (1 check-site) and `v1.org.buildings.createManager` (1 check-site) [Confirmed].

* **Naming and Structural Inconsistencies**:
  * The codebase frequently evaluates high-level composite *roles* (e.g., `v1.org.admin` or `v1.admin.org.admin`) as if they were leaf *permission strings* [Confirmed]. This represents a structural mismatch between the RBAC evaluation engine in the code and the hierarchical role definitions defined in the system architecture [Inferred].

#### B. Module Dependency Overview Analysis
Analyzing the confirmed cross-module call edges reveals clear architectural hierarchies, tight coupling loops, and isolated components:

* **The Core Infrastructure Hub**:
  * The `core` module is the absolute center of gravity of the repository, with **1,422 total inbound call edges** from 11 other modules [Confirmed]. The heaviest consumers of `core` are `organization` (396 edges), `user` (330 edges), `building` (253 edges), and `admin` (194 edges) [Confirmed]. This confirms that `core` acts as the foundational utility and access orchestration layer for the entire platform.

* **Tight Bidirectional Coupling Loops**:
  * **User & Building**: `user` and `building` exhibit perfectly symmetric bidirectional coupling, with **34 call edges in each direction** (`user` → `building` and `building` → `user`) [Confirmed]. This reflects the tight logical link between user profiles and physical building/unit access rights.
  * **Core & Domain Modules**: `core` exhibits bidirectional coupling with both `building` (`core` → `building`: 47 edges; `building` → `core`: 253 edges) and `user` (`core` → `user`: 47 edges; `user` → `core`: 330 edges) [Confirmed]. This indicates that while domain modules rely on `core` for foundational services, `core`'s access orchestration engine must call back into domain modules to resolve user and building states.
  * **Tasks & Organization**: `tasks` and `organization` are bidirectionally coupled (`tasks` → `organization`: 2 edges; `organization` → `tasks`: 10 edges) [Confirmed].

* **Structural Isolation**:
  * The `call` module is structurally isolated, receiving **zero inbound call edges** from any other module in the repository [Confirmed]. It only makes outbound calls to `core` (21 edges), `user` (6 edges), `access_control_device` (3 edges), and `building` (3 edges) [Confirmed]. This indicates that call signaling is a self-contained, edge-triggered workflow.
  * The `tasks` module is also highly isolated, receiving inbound edges only from `organization` (10 edges) and `admin` (1 edge), and making outbound calls to `core` (14 edges), `organization` (2 edges), and `admin` (1 edge) [Confirmed].

---

### 7. Repo-Wide Risks

#### Risk 1: Systemic RBAC Definition Gap and Broken Access Control
* **Pattern**: Across almost every module in the repository, the application code enforces checks on high-level composite roles (e.g., `v1.admin`, `v1.org.admin`, and various `*.admin` sub-roles) that are completely absent from the authoritative `rbac-roles.json` schema [Confirmed].
* **Impact**: If roles are provisioned or validated in production solely based on the JSON schema, these code-level checks will fail, resulting in broken access control, administrative lockouts, or unvalidated operations [Inferred]. Conversely, if the system defaults to allowing unmapped permissions, it could lead to unauthorized privilege escalation [Inferred].

#### Risk 2: Asymmetric Security Enforcement and Database-Bypass Vulnerabilities
* **Pattern**: There is a severe inconsistency between strict application-layer RBAC enforcement in some modules and complete reliance on database-level rules or implicit trust in others.
  * **Implicit Trust**: The `apps` module enforces zero RBAC checks, implicitly trusting all upstream callers to authorize notification, email, and SMS dispatches [Inferred]. Similarly, the `call` module has no RBAC checks on call creation, relying entirely on the physical ACD's integrity [Inferred].
  * **Permissive Firestore Rules**: The Firestore rules for `/settings/{docId}` allow any authenticated user to read and write directly (`allow read, write: if isValidUser();`) [Confirmed]. Similarly, `/organizations/{organizationId}/users/{userId}` allows any authenticated user to read and write directly [Confirmed].
  * **Missing Subcollection Rules**: There are no explicit match rules in `firestore.rules.txt` for critical subcollections like `/buildings/{id}/accesses`, `/buildings/{id}/pincodes`, and `/buildings/{id}/units/{id}/nonAppUsers` [Confirmed]. While this safely blocks client-side SDK access, it forces complete reliance on backend Cloud Functions using the Admin SDK [Inferred]. However, several of these backend submodules (such as `building_accesses` and `building_unit_nonAppUser`) reference zero explicit permission strings in their service layers [Confirmed].
* **Impact**: An attacker who bypasses the Cloud Function API gateway and interacts with the Firestore client SDK directly can read or modify system-wide settings, roles, and organization-user mappings [Inferred]. Furthermore, if a Cloud Function in a module like `building` or `unit_management` is exposed without proper wrapper guards, the lack of explicit RBAC checks in the service layer allows unauthorized users to manipulate physical access ledgers and PIN codes [Inferred].

#### Risk 3: High Inbound Coupling and Single Point of Failure (SPOF) on `core`
* **Pattern**: The `core` module is heavily imported by 11 out of 12 modules, with over 1,400 confirmed inbound call edges in total [Confirmed].
* **Impact**: Any breaking change, performance degradation, or security vulnerability in `core`'s foundational services (such as `OSKDocumentController`, `OSKLoggingService`, or `OSKAccessService`) will immediately cascade across the entire platform [Confirmed]. This could halt both administrative workflows in the PGO portal and physical door-unlocking synchronization on edge hardware [Inferred].

#### Risk 4: Circular Module Dependencies and Architectural Rigidity
* **Pattern**: Tight bidirectional coupling exists between several key modules:
  * `user` ↔ `building` (34 edges each way) [Confirmed].
  * `tasks` ↔ `organization` (`tasks` → `organization`: 2 edges; `organization` → `tasks`: 10 edges) [Confirmed].
  * `supplier` exhibits circular submodule dependencies between `_module_root` and `supplierStaff` [Inferred].
* **Impact**: This bidirectional coupling violates clean architectural layering, making local testing, isolation, and independent deployment of these modules highly complex and prone to regression cycles [Inferred].