## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.520Z
- **repoName**: firebase-oskey-dev
- **targetModule**: settings
- **capability**: role
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `role` capability within the `settings` module manages the definition, hierarchy, and consolidation of user and organizational roles and permissions `functions/src/modules/settings/modules/role/index.ts`. It provides mechanisms to seed, update, and retrieve individual roles and composite roles (hierarchical groupings of roles), and resolves consolidated permission lists to enforce Role-Based Access Control (RBAC) across the platform `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts`. (Confirmed)

## 2. Primary Responsibilities
The `role` capability is responsible for the following core features:

- **Individual Role Management**: Handles CRUD operations for granular system roles stored in Firestore under `/settings/roles/roles` `functions/src/modules/settings/modules/role/controllers/role.controller.model.ts` (lines 18-50). (Confirmed)
- **Composite Role Management**: Manages composite roles (roles that contain other roles or composite roles) stored under `/settings/roles/compositeRoles` `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` (lines 21-49). (Confirmed)
- **Hierarchical Dependency Resolution**: Automatically updates parent-child relationships when composite roles are modified or deleted, ensuring that changes cascade correctly through the role hierarchy `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` (lines 51-143). (Confirmed)
- **Consolidated Role Resolution**: Resolves a flat list of all inherited permissions for a user or organization by recursively traversing the composite role hierarchy `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts` (lines 16-39). (Confirmed)
- **Role Seeding and Synchronization**: Synchronizes statically defined roles in the codebase (e.g., `composite_roles_translated.data.ts`) with the Firestore database, adding new roles and pruning deprecated ones `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (lines 53-102). (Confirmed)
- **Permission Verification**: Provides utility methods to check if a user's resolved roles satisfy a required set of permissions `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts` (lines 48-57). (Confirmed)

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes the following controllers and service entry points:

- **`OSKRoleController`**: Extends `OSKDocumentController` to provide direct database access methods (get, getAll, save, delete, listDocuments) for individual roles `functions/src/modules/settings/modules/role/controllers/role.controller.model.ts` (lines 12-50).
- **`OSKCompositeRoleController`**: Extends `OSKDocumentController` to provide database access and dependency management (createorUpdateDependantRoles, deleteOrUpdateDependantRoles) for composite roles `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` (lines 13-147).
- **`OSKConsolidatedRolesController`**: Orchestrates the resolution of hierarchical roles into flat permission lists and validates user permissions `functions/src/modules/settings/modules/role/controllers/consolidated_roles.controller.model.ts` (lines 13-109).
- **`OSKCompositeRoleService`**: Exposes service-level methods for handling Firestore triggers and callable functions related to composite roles `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (lines 20-165).
- **`OSKRoleService`**: Exposes service-level methods for handling Firestore triggers and callable functions related to individual roles `functions/src/modules/settings/modules/role/services/role.service.ts` (lines 16-51).

## 4. API Contracts & Firestore Triggers

### API Contracts
The following callable Cloud Functions are exposed by this capability:

#### `getAllCompositeRoles`
- **Type**: Callable
- **File**: `functions/src/modules/settings/modules/role/index.ts` (lines 142-151)
- **Request Type**: `void` (Inferred)
- **Response Type**: `OSKCompositeRoleDocument`
  - `creationDate`: `Timestamp`

#### `getAllRoles`
- **Type**: Callable
- **File**: `functions/src/modules/settings/modules/role/index.ts` (lines 43-51)
- **Request Type**: `void` (Inferred)
- **Response Type**: `OSKRoleDocument`
  - `creationDate`: `Timestamp`
  - `modificationDate`: `Timestamp`

#### `getOrganizationCompositeRoles`
- **Type**: Callable
- **File**: `functions/src/modules/settings/modules/role/index.ts` (lines 153-165)
- **Request Type**: `void` (Inferred)
- **Response Type**: `OSKCompositeRoleDocument`
  - `creationDate`: `Timestamp`

#### `onCreateCompositeRolesCalled`
- **Type**: Callable
- **File**: `functions/src/modules/settings/modules/role/index.ts` (lines 53-102)
- **Request Type**: `any` (Inferred)
- **Response Type**: `any` (Inferred)

---

### Firestore Triggers
The capability registers the following Firestore document triggers:

- **`onDocumentCreated`** on `/settings/roles/compositeRoles/{compositeRoleId}`: Calls `OSKCompositeRoleService.onDocumentCreated` `functions/src/modules/settings/modules/role/index.ts` (line 36).
- **`onDocumentUpdated`** on `/settings/roles/compositeRoles/{compositeRoleId}`: Calls `OSKCompositeRoleService.onDocumentUpdated` `functions/src/modules/settings/modules/role/index.ts` (line 39).
- **`onDocumentDeleted`** on `/settings/roles/compositeRoles/{compositeRoleId}`: Calls `OSKCompositeRoleService.onDocumentDeleted` `functions/src/modules/settings/modules/role/index.ts` (line 42).
- **`onDocumentCreated`** on `/settings/roles/roles/{roleId}`: Calls `OSKRoleService.onDocumentCreated` `functions/src/modules/settings/modules/role/index.ts` (line 45).

## 5. Data Ownership
This capability owns and directly modifies the following Firestore paths:

- **`/settings/roles/compositeRoles/{compositeRoleId}`**
  - **Operations**: Read, Write, Delete `functions/src/modules/settings/modules/role/index.ts` (lines 36, 39, 42).
  - **Scope**: Confirmed.
- **`/settings/roles/roles/{roleId}`** (referenced in code as `/setting/roles/roles/{roleId}`)
  - **Operations**: Read, Write, Delete `functions/src/modules/settings/modules/role/index.ts` (line 45).
  - **Scope**: Confirmed.

## 6. Outbound Coupling

### Cross-Module Coupling
This capability depends on the `core` module for base controller functionality:
- **`@oskey/core/controllers/document`**: Imported by `composite_role.contoller.model.ts` `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` (line 9).
- **`@oskey/core`**: Imported by controllers and services to access shared core utilities `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` (line 8), `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (line 10).
- **`../../../../core/controllers/document.controller`**: Imported by `role.controller.model.ts` `functions/src/modules/settings/modules/role/controllers/role.controller.model.ts` (line 9).

### Intra-Module Coupling
There is no evidenced outbound coupling to sibling submodules within the `settings` module.

### External/Utility Coupling
- **`@oskey/utils/errors_helper`**: Used for standardized error handling `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (line 11).
- **`@oskey/utils/https-response`**: Used for formatting API responses `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (line 12).
- **`@oskey/utils/security_check`**: Used for executing user security checks `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (line 13).
- **`../../../../../decorators/securityChecks`**: Custom decorator used to enforce security policies on service methods `functions/src/modules/settings/modules/role/services/role.service.ts` (line 13).

## 7. Permissions & Security
The capability references a comprehensive list of system permissions within its static data files `functions/src/modules/settings/modules/role/data/composite_role.data.ts` and `functions/src/modules/settings/modules/role/data/composite_roles_translated.data.ts`. 

### RBAC Cross-Check
All permission strings defined in the static files match the provided RBAC roles document exactly. Examples include:
- `v1.admin.accessControlDevice.delete` `functions/src/modules/settings/modules/role/data/composite_role.data.ts` (line 332)
- `v1.admin.building.validate` `functions/src/modules/settings/modules/role/data/composite_role.data.ts` (line 274)
- `v1.org.residents.create` `functions/src/modules/settings/modules/role/data/composite_role.data.ts` (line 748)
- `v1.org.suppliers.view` `functions/src/modules/settings/modules/role/data/composite_role.data.ts` (line 853)

Additionally, the service filters out administrative roles when retrieving organization-specific composite roles by checking if the role ID starts with `v1.admin` `functions/src/modules/settings/modules/role/services/composite_role.service.ts` (line 162).

## 8. External Hooks
There are no external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or Cloud Storage paths) evidenced within this capability's pack.

## 9. Open Questions
- **Triggering of `onCreateCompositeRolesCalled`**: It is unclear from the evidence how or when the `onCreateCompositeRolesCalled` callable function is triggered. Is it part of a manual deployment/seeding script, or is it invoked automatically during a CI/CD pipeline?
- **Base Class Implementation**: The exact implementation details of `OSKDocumentController` (imported from `@oskey/core`) are unknown, as they reside outside this capability's evidence pack.