### 0. Generation Metadata

- runId: 20260828_150039-8345d222
- generatedAt: 2026-08-29T07:12:24.073Z
- repoName: angular-app-oskey-io
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- moduleCount: 3
- note: sections 2, 4, and 5 below are assembled deterministically from Phase 1 artifacts, not LLM-generated.

### 1. Executive Summary

The `angular-app-oskey-io` repository is an Angular-based web application designed to serve as a comprehensive property management, physical access control, and resident portal platform [Confirmed]. The repository is structured into three primary modules: `core`, `components`, and `features` [Confirmed]. 

Together, these modules orchestrate a system that manages foundational infrastructure (Firebase authentication, dynamic localization, global error handling, and route-level security) [Confirmed, per `core`'s Executive Summary], shared presentational layout elements (global navigation headers, footers, and cookie consent management) [Confirmed, per `components`' Executive Summary], and complex business domains [Confirmed, per `features`' Executive Summary]. The core business capabilities focus on a hierarchical portal ecosystem spanning organizations, properties, buildings, units, and physical doors, alongside workflows for resident onboarding, third-party supplier access scheduling (including pincode generation), and centralized resident-intercom communications [Confirmed, per `features`' Executive Summary].

### 2. Module Inventory

- **components** — 3 capability pack(s)
- **core** — 10 capability pack(s)
- **features** — 18 capability pack(s)

### 3. Major Subsystems

Given the streamlined architecture of this repository, the three modules do not form complex, multi-module clusters; instead, they map directly to three distinct, non-overlapping architectural layers [Confirmed]:

1. **Foundational Infrastructure Layer (`core`)**: This subsystem acts as the primary engine of the application [Confirmed, per `core`'s Architectural Position]. It owns global cross-cutting concerns, including Firebase initialization, user session state computation, dynamic translation, global error interception, and route-level security guards [Confirmed, per `core`'s Architectural Position].
2. **Shared Presentation Layer (`components`)**: This subsystem provides presentational and layout elements that are independent of specific business workflows [Confirmed, per `components`' Executive Summary]. It owns the global header navigation, footer layout, and browser-level cookie consent state [Confirmed, per `components`' Architectural Position].
3. **Business Feature & Domain Orchestration Layer (`features`)**: This subsystem is the primary functional engine of the application [Confirmed, per `features`' Executive Summary]. It orchestrates all user-facing business domains, including authentication sessions, physical building topologies, resident/supplier registries, and physical access control schedules [Confirmed, per `features`' Architectural Position].

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

#### RBAC Requirements Pattern Analysis
An analysis of the deterministic RBAC Requirements Catalog reveals several key patterns across the repository:
- **Cross-Module vs. Isolated Permissions**: Out of 16 extracted candidate permission strings, only two are shared across module boundaries: `v1.org.admin` (9 check-sites) and `v1.admin` (3 check-sites) are referenced by both `core` and `features` [Confirmed]. The remaining 14 permissions (e.g., `v1.org.user.admin`, `v1.org.client`, `v1.org.buildings.admin`) are strictly isolated within the `features` module [Confirmed].
- **Naming Conventions**: There is a highly consistent hierarchical naming convention. Permissions are prefixed with either `v1.org.*` (10 permissions, such as `v1.org.suppliers.admin` and `v1.org.residents.admin`) or `v1.admin.*` (5 permissions, such as `v1.admin.user.devices.admin`) [Confirmed]. This suggests a structured approach to domain-driven access control [Inferred].
- **Verification Status**: Because there is no authoritative role-definitions document (`rbac-roles.json`) configured for this repository, none of these candidate permissions can be verified against a central schema [Confirmed].

#### Module Dependency and Coupling Patterns
The Module Dependency Overview and module profiles reveal significant structural patterns:
- **Heavy Downstream Dependency**: The `features` module depends heavily on the `core` module, with 264 confirmed outbound call edges [Confirmed]. This aligns with `core`'s role as the foundational infrastructure layer [Confirmed, per `core`'s Architectural Position].
- **Architectural Inversion (Upward Coupling)**: A critical architectural violation exists where the `core` module imports types and constants from the `features` module (specifically `features/portals/sidemenu`), creating an upward dependency that violates strict layer isolation [Confirmed, per `core`'s Architectural Position].
- **Bidirectional Cross-Module Coupling**: There is a tight, circular dependency loop between `components` and `features`. The `components` module has 1 confirmed call edge to `features` [Confirmed], which occurs because `OSKHeaderComponent` imports and calls `OSKAuthService` from `features` [Confirmed, per `components`' Cross-Cutting Risks]. Conversely, `features` imports and renders `OSKHeaderComponent` from `components` [Confirmed, per `components`' Cross-Cutting Risks].

### 7. Repo-Wide Risks

#### Systemic Circular and Bidirectional Dependencies
The repository suffers from a recurring pattern of circular and bidirectional dependencies across multiple boundaries, which poses a high risk of circular dependency errors during builds, testing, or refactoring [Inferred]:
- **Core-to-Feature Circle**: The upward dependency from `core` to `features/portals/sidemenu` means that any refactoring or removal of the sidemenu feature will break the core user session initialization [Inferred, per `core`'s Cross-Cutting Risks].
- **Component-to-Feature Circle**: The bidirectional coupling between `components` (via `OSKHeaderComponent`) and `features` (via `OSKAuthService` and `home.component.ts`) creates a tight loop across the presentation and feature layers [Inferred, per `components`' Cross-Cutting Risks].
- **Intra-Feature Circle**: Within the `features` module, the `authentication` submodule imports types from `portals_organization_entities_entity_properties_users`, while `portals` (which imports from `authentication`) is imported by `users`, creating complex internal bidirectional chains [Inferred, per `features`' Cross-Cutting Risks].

#### Inconsistent and Bypassed Security Controls
There is a systemic risk concerning how security and access controls are enforced across the repository:
- **Unguarded Sensitive Routes**: Highly sensitive submodules within `features`—specifically `inhabitants` (resident records), `suppliers` (physical access and pincodes), and `onboarding-cards` (activation codes)—lack local route guards (`canActivate`) in their routing files [Inferred, per `features`' Cross-Cutting Risks]. If parent-level guards are misconfigured, these endpoints could be exposed [Inferred].
- **Hardcoded Security Bypass**: The `core` module gates the `/invitations/send` route using a hardcoded email array (`emailsToShowSendInvitationsTo`) in `current-user.token.ts` [Confirmed, per `core`'s Cross-Cutting Risks]. This bypasses standard RBAC controls, creating maintenance overhead and security risks if developer emails are modified or leaked [Confirmed, per `core`'s Cross-Cutting Risks].
- **Unverified Client-Side Restrictions**: Email domain restrictions defined in `account-create-restrictions.constant.ts` within `core` may only be enforced on the client side, posing a bypass risk if they are not mirrored by Firestore security rules or backend validations [Inferred, per `core`'s Cross-Cutting Risks].

#### Code Quality and Maintenance Risks
- **Duplicate Service Declarations**: There are two identical declarations of `OSKOrganizationEntitiesService` in different paths within the `features` module, risking split-brain state or maintenance overhead [Confirmed, per `features`' Cross-Cutting Risks].
- **Dormant and Ambiguous Logic**: Commented-out `v1.admin` checks and Admin portal account generation in `current-user.token.ts` leave the status of global admin portal access ambiguous [Inferred, per `core`'s Cross-Cutting Risks]. Similarly, the `OSKHeaderComponent` exposes an `accounts` signal with no clear evidence of how it is populated, leaving data-binding flows partially opaque [Inferred, per `components`' Cross-Cutting Risks].