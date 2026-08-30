### 0. Generation Metadata

- runId: 20260829_133905-8345d222
- generatedAt: 2026-08-29T13:57:44.714Z
- repoName: angular-app-oskey-io
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- moduleCount: 3
- note: sections 2, 4, and 5 below are assembled deterministically from Phase 1 artifacts, not LLM-generated.

### 1. Executive Summary

The `angular-app-oskey-io` repository is an Angular-based web application designed to serve as a comprehensive organization, property, and user management platform [Confirmed]. The application is structured into three distinct modules: `core` (foundational infrastructure), `components` (shared presentation and global utilities), and `features` (business domain logic and user-facing portals) [Confirmed]. 

The platform integrates deeply with Firebase services—including authentication, HTTPS callable functions, and App Check security—and utilizes Angular Signals for reactive state management [Confirmed, per `core`'s and `features`' Executive Summaries]. Its primary business domain spans multi-level administrative dashboards, property and physical asset management (including buildings, units, and electronic door access), supplier management, intercom communications, and user onboarding workflows [Confirmed, per `features`' Executive Summary]. Security is governed via a client-side role-based access control (RBAC) model that dynamically gates navigation menus and route access [Confirmed, per `features`' Executive Summary].

### 2. Module Inventory

- **components** — 3 capability pack(s)
- **core** — 10 capability pack(s)
- **features** — 18 capability pack(s)

### 3. Major Subsystems

Given the repository's streamlined structure of three modules, the application is organized into three vertical layers rather than broad horizontal groupings [Confirmed]:

*   **Foundational Infrastructure Subsystem (`core`):** Positioned at the lowest layer of the application's hierarchy, this subsystem owns the global application lifecycle, Firebase SDK configurations, global error interception, active locale/translation state, and core domain models (such as users, organizations, and physical assets) [Confirmed, per `core`'s Architectural Position].
*   **Shared Presentation & Utility Subsystem (`components`):** Occupying a mid-level position, this subsystem provides reusable, application-wide layout elements (such as the global navigation header and footer) and regulatory compliance utilities (such as cookie consent management) [Confirmed, per `components`' Architectural Position].
*   **Business Logic & Feature Portals Subsystem (`features`):** Positioned at the top layer, this subsystem encapsulates all user-facing portals, authentication and onboarding workflows, and complex business domain logic (including organization, property, and supplier management dashboards) [Confirmed, per `features`' Architectural Position].

### 4. Module Dependency Overview

- `features` → `core`: 264 confirmed call edge(s)
- `components` → `features`: 1 confirmed call edge(s)

### 5. RBAC Requirements Catalog

- `v1.org.admin` (candidate, 9 check-site(s), referenced by: core, features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.org.user.admin` (candidate, 7 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.org.client` (candidate, 5 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.org.communications.admin` (candidate, 4 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.org.suppliers.admin` (candidate, 4 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.admin` (candidate, 3 check-site(s), referenced by: core, features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.org.buildings.admin` (candidate, 3 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.org.residents.admin` (candidate, 3 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.org.entity.admin` (candidate, 2 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.org.property.admin` (candidate, 2 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.org.settings.admin` (candidate, 2 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.admin.org.admin` (candidate, 1 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.admin.user.accesses.admin` (candidate, 1 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.admin.user.admin` (candidate, 1 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.admin.user.devices.admin` (candidate, 1 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*
- `v1.admin.user.invitations.admin` (candidate, 1 check-site(s), referenced by: features) — *not verifiable -- no rbac-roles.json configured for this repo*

### 6. Cross-Cutting Patterns

#### Role-Based Access Control (RBAC) Patterns
An analysis of the RBAC Requirements Catalog reveals a structured naming convention, primarily utilizing the `v1.org.*` and `v1.admin.*` namespaces [Confirmed]. However, the enforcement and distribution of these checks are highly centralized:
*   **Cross-Module Permissions:** Only two permission strings are checked across multiple modules: `v1.org.admin` (9 check-sites) and `v1.admin` (3 check-sites) are referenced by both `core` and `features` [Confirmed].
*   **Feature-Isolated Permissions:** The remaining 14 candidate permissions (such as `v1.org.user.admin`, `v1.org.client`, and various sub-administrative roles like `v1.org.buildings.admin` and `v1.org.suppliers.admin`) are exclusively referenced within the `features` module [Confirmed].
*   **Verification Gap:** There is currently no authoritative `rbac-roles.json` configuration file in this repository [Confirmed]. Consequently, these candidate permission strings cannot be verified against a central schema, and they are evaluated as plain strings within guards and components [Inferred, per `core`'s Cross-Cutting Risks].

#### Module Dependency and Coupling Patterns
The deterministic Module Dependency Overview highlights a highly asymmetrical dependency structure:
*   **Primary Downward Flow:** The `features` module heavily consumes the `core` module, with 264 confirmed call edges, establishing `core` as the primary foundational layer [Confirmed].
*   **Horizontal and Upward Coupling:** The `components` module has 1 confirmed call edge to `features` [Confirmed], which represents a tight coupling where `components` directly imports and invokes the `OSKAuthService` from `features` to handle user sign-out actions [Confirmed, per `components`' Architectural Position].
*   **Architectural Inversions:** Despite `core` being positioned as the lowest-level infrastructure layer, it exhibits an architectural inversion by importing menu constants, utility functions, and types from the higher-level `features` module (specifically `features/portals/sidemenu`) [Confirmed, per `core`'s Architectural Position]. This creates a bidirectional dependency loop between `core` and `features` [Confirmed].

### 7. Repo-Wide Risks

*   **Systemic Architectural Circularity:** A major structural risk is the presence of bidirectional dependency loops across all three modules. `core` depends on `features` via `features/portals/sidemenu` [Confirmed, per `core`'s Architectural Position], while `features` depends on `core` [Confirmed]. Similarly, `components` depends on `features` for authentication [Confirmed, per `components`' Architectural Position], while `features` consumes `components` for its global header layout [Confirmed, per `components`' Architectural Position]. This tight coupling violates strict layering principles, making it difficult to compile, test, or lazy-load any of these modules in isolation [Inferred, per `components`' and `core`'s Cross-Cutting Risks].
*   **Decentralized and Unvalidated Security Schema:** Because there is no authoritative role-definitions document configured for the repository [Confirmed], permission strings are evaluated as plain, hardcoded strings across guards and components [Inferred, per `core`'s Cross-Cutting Risks]. This lack of a centralized, backend-synchronized contract introduces a high risk of silent authorization failures or security bypasses if role names drift [Inferred]. This is compounded by the fact that highly sensitive routes in `features` (such as supplier pincode management and resident profiles) lack local route-level guards [Inferred, per `features`' Cross-Cutting Risks].
*   **State Desynchronization and Code Duplication:** Shared concepts are managed in a fragmented manner across module boundaries. For example, the `OSKHeaderComponent` in `components` manages user account selection signals locally, risking state desynchronization if other modules need to react to account switches [Inferred, per `components`' Cross-Cutting Risks]. Additionally, duplicate service definitions exist within `features` (specifically two identical `OSKOrganizationEntitiesService` classes in different paths), which risks divergence and runtime bugs during future refactoring [Inferred, per `features`' Cross-Cutting Risks].
*   **Incomplete and Hardcoded Administrative Access Controls:** There are multiple indicators of incomplete or bypassed administrative security controls. `core` contains a hardcoded developer bypass array of emails (`emailsToShowSendInvitationsTo`) and commented-out admin portal logic (`isOskeyAdmin`) [Inferred, per `core`'s Cross-Cutting Risks]. Simultaneously, `features` utilizes an `AdminGuard` for building routes without explicit permission mapping [Inferred, per `features`' Cross-Cutting Risks]. Together, these patterns represent dead or ambiguous authorization code that could lead to privilege escalation or accidental exposure of administrative capabilities [Inferred].