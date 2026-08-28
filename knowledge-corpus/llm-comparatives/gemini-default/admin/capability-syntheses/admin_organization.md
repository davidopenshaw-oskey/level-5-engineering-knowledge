# Capability Synthesis: admin_organization

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.382Z
- **repoName**: firebase-oskey-dev
- **targetModule**: admin
- **capability**: admin_organization
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `admin_organization` capability provides administrative endpoints to list all organizations and retrieve detailed information for a specific organization. This capability is restricted to high-level administrators (such as Oskey Administrators) and enforces strict Role-Based Access Control (RBAC) checks before returning data. [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAllOrganizations|#1` ``, `` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getOrganizationDetailsById|#1` ``).

---

## 2. Primary Responsibilities

### Retrieve All Organizations
The capability exposes a service method to query and return a list of all organizations registered in the system. [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getAllOrganizations|#1` ``). This operation:
- Validates that the requesting user exists in the system. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKUserController.default.get|getAllOrganizations|userId|#1` ``).
- Resolves the user's organization-level roles. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOrganizationUserController.default.get|getAllOrganizations|adminsOskeyId,userId|#1` ``).
- Enforces that the user possesses the required administrative permissions (specifically `v1.admin.org.view`, `v1.admin.org.register`, `v1.admin.org.edit`, `v1.admin.org.delete`, or `v1.admin.org.validate`). [Confirmed] (`` `functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts` (lines 50-55) ``).
- Queries the underlying Firestore collection using the document controller. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._query|getAll|OSKOragnizationListController.collection|#1` ``).

### Retrieve Organization Details by ID
The capability allows administrators to fetch the detailed configuration of a specific organization by its unique identifier. [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getOrganizationDetailsById|#1` ``). This operation:
- Verifies the requesting user's identity and retrieves their profile. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKUserController.default.get|getOrganizationDetailsById|userId|#1` ``).
- Fetches the user's organization-specific roles. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOrganizationUserController.default.get|getOrganizationDetailsById|adminsOrganizationId,userId|#1` ``).
- Performs RBAC validation to ensure the user is authorized to view, register, edit, delete, or validate organizations. [Confirmed] (`` `functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts` (lines 98-103) ``).
- Retrieves the specific organization document from Firestore. [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._get|getById|OSKOragnizationListController.collection,OrganizationId|#1` ``).

---

## 3. Public Interfaces (Controllers & Entry Points)

### Controllers
- **`OSKOragnizationListController`**: Extends the core `OSKDocumentController` to handle direct Firestore document operations (`_get` and `_query`) on the organization collection. [Confirmed] (`` `source_class|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController` ``).
  - `getAll()`: Queries all organization documents. [Confirmed] (`` `controller_method|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController|getAll|#1` ``).
  - `getById(OrganizationId: string)`: Retrieves a single organization document by ID. [Confirmed] (`` `controller_method|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController|getById|#1` ``).

### Services
- **`OSKOragnizationListService`**: Orchestrates the business logic, user verification, permission checks, and calls the controller to fetch data. [Confirmed] (`` `source_class|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService` ``).
  - `getAllOrganizations(request)`: Validates permissions and returns all organizations. [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getAllOrganizations|#1` ``).
  - `getOrganizationDetailsById(request)`: Validates permissions and returns a specific organization's details. [Confirmed] (`` `service_method|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService|getOrganizationDetailsById|#1` ``).

### Entry Points
- **`getAdminOrganizationCallableFunctionTriggers`**: Exposes the HTTPS callable Cloud Functions to the platform. [Confirmed] (`` `function_declaration|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAdminOrganizationCallableFunctionTriggers|#1` ``).

---

## 4. API Contracts & Firestore Triggers

### API Contracts
The capability exposes two HTTPS callable functions:

#### `getAllOrganizations`
- **Type**: Callable Function [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAllOrganizations|#1` ``)
- **Request Schema**: `OSKGetAllOrganizationsListRequestDocument`
  - `adminsOskeyId`: `string`
- **Response Schema**: `OSKOrganizationList[]` (Inferred based on service orchestration returning a list of organizations).

#### `getOrganizationDetailsById`
- **Type**: Callable Function [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getOrganizationDetailsById|#1` ``)
- **Request Schema**: `OSKGetOrganizationsDetailsByIdRequestDocument`
  - `adminsOskeyId`: `string`
  - `OrganizationId`: `string`
- **Response Schema**: `OSKOrganizationList`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress` (imported from core)
  - `taxNumber`: `string`
  - `userId`: `string`

---

## 5. Data Ownership

### Firestore Paths
This capability reads from the following Firestore collection:
- `/organizations` (via `OSKOragnizationListController.collection` mapping to the `OSKOrganizationListDocument` model). [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController.default._query|getAll|OSKOragnizationListController.collection|#1` ``, `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|../models/documents/organization_listdocument.model|#1` ``).

*Note: Based on the evidence pack, this capability only performs read operations (`_get` and `_query`) on the `/organizations` collection. No write operations (create, update, delete) are evidenced within this submodule.* [Confirmed] (`` `functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts` (lines 17-27) ``).

---

## 6. Outbound Coupling

### Cross-Module Coupling
This capability depends on several other modules in the repository:
- **`core`**:
  - Imports `@oskey/core` and `@oskey/core/controllers/document` to extend `OSKDocumentController` and utilize core models. [Confirmed] (`` `imports_dependency|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|@oskey/core/controllers/document|#1` ``, `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|@oskey/core|#1` ``).
- **`organization`** (specifically the `organization_user` submodule):
  - Imports `@oskey/organization/user` to fetch organization-scoped user roles via `OSKOrganizationUserController`. [Confirmed] (`` `imports_dependency|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|@oskey/organization/user|#1` ``).
- **`settings`** (specifically the `role` submodule):
  - Imports `@oskey/settings/role` to check consolidated user permissions via `OSKConsolidatedRolesController`. [Confirmed] (`` `imports_dependency|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|@oskey/settings/role|#1` ``).
- **`user`**:
  - Imports `@oskey/user` to retrieve user profiles via `OSKUserController`. [Confirmed] (`` `imports_dependency|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|@oskey/user|#1` ``).

### Sibling Submodule Coupling
- No outbound coupling to other submodules of the `admin` module is evidenced.

---

## 7. Permissions & Security

### Enforced Permissions
The capability checks the requesting user's roles against a set of candidate administrative permissions. If the user possesses *any* of the following permissions, access is granted:
- `v1.admin.org.view` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.view|#1` ``)
- `v1.admin.org.register` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.register|#1` ``)
- `v1.admin.org.edit` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.edit|#1` ``)
- `v1.admin.org.delete` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.delete|#1` ``)
- `v1.admin.org.validate` [Confirmed] (`` `permission_candidate|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|v1.admin.org.validate|#1` ``)

### RBAC Cross-Check
All five permissions checked by the service match the authoritative `rbac-roles.json` definitions exactly:
- `v1.admin.org.view`: "v1.admin - Allows to view the details of an organization" (Match)
- `v1.admin.org.register`: "v1.admin - Allows to register a new organization" (Match)
- `v1.admin.org.edit`: "v1.admin - Allows to edit an existing organization" (Match)
- `v1.admin.org.delete`: "v1.admin - Allows to delete an organization" (Match)
- `v1.admin.org.validate`: "v1.admin - Allows to validate a new organization" (Match)

### Security Violations & Error Handling
If the user does not possess any of the required permissions, the service throws an HTTPS `permission-denied` error. [Confirmed] (`` `permission_error|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|permission-denied|#1` ``).

---

## 8. External Hooks

### HTTPS Callable Functions
The capability registers two external entry points via Firebase Functions:
- `getAllOrganizations` [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/index.ts|https.onCall|OSKOragnizationListService.getAllOrganizations|#1` ``).
- `getOrganizationDetailsById` [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/index.ts|https.onCall|OSKOragnizationListService.getOrganizationDetailsById|#1` ``).

### App Check Enforcement
The callable functions are configured with App Check enforcement enabled in non-emulator environments:
- `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR` [Confirmed] (`` `call_expression|admin|functions/src/modules/admin/modules/admin_organization/index.ts|functionBuilder.runWith|getAdminOrganizationCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

---

## 9. Open Questions

- **Write Operations**: The service checks permissions for editing, deleting, registering, and validating organizations (`v1.admin.org.edit`, `v1.admin.org.delete`, `v1.admin.org.register`, `v1.admin.org.validate`), but the submodule only implements read-only operations (`getAllOrganizations` and `getOrganizationDetailsById`). Are the corresponding write operations implemented in a different submodule of `admin` or a different module entirely? [Unknown]
- **Typo in Class Names**: The classes `OSKOragnizationListController` and `OSKOragnizationListService` contain a typo ("Oragnization" instead of "Organization"). This is confirmed in the codebase but noted here to prevent manual refactoring mismatches. [Confirmed] (`` `source_class|admin|functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts|OSKOragnizationListController` ``, `` `source_class|admin|functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts|OSKOragnizationListService` ``).