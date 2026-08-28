## 0. Generation Metadata

- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.510Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_user
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary

The `organization_user` capability manages administrative users (Organization Users) within the Property Manager Portal (PGO) ecosystem. It provides functionality to create, update, list, and delete organization users, manage their assigned roles, and query pending invitees associated with an organization. **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUser|#1`.

---

## 2. Primary Responsibilities

### Managing Organization User Roles
The capability allows authorized administrators to update the roles assigned to a specific organization user. It utilizes a consolidated roles controller to generate and validate the user's permissions and updates the corresponding user-organization mapping. **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUserRoles|#1`.

### Updating Organization User Profiles
Administrators can update an organization user's profile details, including their first name, last name, email, and roles. This operation synchronizes the updated roles with the user's global organization mapping. **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUser|#1`.

### Deleting Organization Users
The capability supports removing a user from an organization. This operation deletes the user's record from the organization's scoped user collection and removes the corresponding organization reference from the user's global profile. **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|deleteOrganizationUser|#1`.

### Querying and Listing Organization Users and Invitees
The capability provides interfaces to retrieve all active organization users and pending invitees for a given organization, as well as fetching specific users by ID or email. **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getAllOrganizationUsersAndInvitees|#1`.

---

## 3. Public Interfaces (Controllers & Entry Points)

### Controllers

#### `OSKOrganizationUserController`
Exposes low-level document operations for managing organization users in Firestore. It extends `OSKDocumentController` and provides methods for querying, saving, updating, and deleting organization user documents. **Confirmed** `source_class|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController`.
- **File**: `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts` (lines 11-71)
- **Exposed Methods**:
  - `getAll(organizationId)`: Queries all users under `/organizations/{organizationId}/users`. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getAll|#1`.
  - `get(organizationId, userId)`: Fetches a specific user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|get|#1`.
  - `getSafe(organizationId, userId)`: Safely fetches a user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getSafe|#1`.
  - `save(organizationId, email, data)`: Saves a user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|save|#1`.
  - `update(organizationId, userId, data)`: Updates a user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|update|#1`.
  - `delete(organizationId, email)`: Deletes a user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|delete|#1`.
  - `getOrganizationUserAdmins(organizationId, queryFilters)`: Filters users with the `v1.org.admin` role. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getOrganizationUserAdmins|#1`.
  - `getOrganizationAdmins(organizationId)`: Filters users with `v1.org.admin` or `v1.admin` roles. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getOrganizationAdmins|#1`.
  - `getByEmail(organizationId, email)`: Fetches a user document by email. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getByEmail|#1`.

### Services

#### `OSKOrganizationUserService`
Orchestrates business logic, permission validation, and cross-module synchronization for organization users. **Confirmed** `source_class|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService`.
- **File**: `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 38-459)
- **Exposed Methods**:
  - `updateOrganizationUserRoles`: Updates roles and synchronizes them to the user's global organization mapping. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|updateOrganizationUserRoles|#1`.
  - `updateOrganizationUser`: Updates user profile details and roles. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|updateOrganizationUser|#1`.
  - `deleteOrganizationUser`: Deletes the user from the organization and removes the organization reference from the user's profile. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|deleteOrganizationUser|#1`.
  - `getAllOrganizationUsersAndInvitees`: Retrieves a combined list of active organization users and pending invitees. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getAllOrganizationUsersAndInvitees|#1`.
  - `getAllOrganizationUser`: Helper method to fetch and format active organization users. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getAllOrganizationUser|#1`.
  - `getOrganizationUserById`: Retrieves a specific organization user by ID. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getOrganizationUserById|#1`.
  - `getOrganizationInviteeByEmail`: Retrieves a pending invitee by email. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getOrganizationInviteeByEmail|#1`.
  - `getOrganizationUserRoles`: Retrieves the roles assigned to a specific organization user. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getOrganizationUserRoles|#1`.

### Entry Points

The capability exposes several HTTPS Callable Cloud Functions as entry points:
- `updateOrganizationUserRoles` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUserRoles|#1`
- `updateOrganizationUser` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUser|#1`
- `deleteOrganizationUser` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|deleteOrganizationUser|#1`
- `getAllOrganizationUsersAndInvitees` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getAllOrganizationUsersAndInvitees|#1`
- `getOrganizationUserById` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getOrganizationUserById|#1`
- `getOrganizationInviteeByEmail` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getOrganizationInviteeByEmail|#1`
- `getOrganizationUserRoles` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getOrganizationUserRoles|#1`

---

## 4. API Contracts & Firestore Triggers

### API Contracts (Callable Cloud Functions)

#### `deleteOrganizationUser`
- **Request Type**: `OSKOrganizationUserDeleteRequest`
  - `organizationId`: `string`
  - `userId`: `string`
- **Response Type**: Not specified (void/empty response)

#### `getAllOrganizationUsersAndInvitees`
- **Request Type**: `OSKGetAllOrganizationUsersAndInviteesRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKGetAllOrganizationUsersAndInviteesResponseData`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `status`: `"active" | "invited"`
  - `userId`: `string`

#### `updateOrganizationUser`
- **Request Type**: `OSKOrganizationUserUpdateRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: Not specified

#### `updateOrganizationUserRoles`
- **Request Type**: `OSKOrganizationUserUpdateRolesRequest`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: Not specified

*Note: The endpoints `getOrganizationUserById`, `getOrganizationInviteeByEmail`, and `getOrganizationUserRoles` do not have matching model property definitions in this capability pack, so their detailed schemas are omitted.*

### Firestore Triggers
No Firestore triggers are owned or declared by this capability. **Confirmed** (absence of evidence).

---

## 5. Data Ownership

### Firestore Paths

#### `/organizations/{organizationId}/users/{userId}`
- **Operations**: Read, Write (Set, Update, Delete)
- **Description**: Stores the organization-scoped user document containing profile details and assigned roles.
- **Confidence**: **Confirmed**
- **Citations**:
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController.default._query|getAll|`/organizations/${organizationId}/users`|#1`
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController.default._set|save|`/organizations/${organizationId}/users`,email,data|#1`
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController.default._update|update|`/organizations/${organizationId}/users`,userId,data|#1`
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController.default._delete|delete|`/organizations/${organizationId}/users`,email|#1`

#### `/organizations/{organizationId}`
- **Operations**: Read
- **Description**: Read to retrieve organization details, specifically the valid `userRoles` configured for the organization.
- **Confidence**: **Confirmed**
- **Citations**:
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationController.default.get|updateOrganizationUser|request.organizationId|#1`

#### `/users/{userId}`
- **Operations**: Read
- **Description**: Read to retrieve the user's global profile details (e.g., first name, last name).
- **Confidence**: **Confirmed**
- **Citations**:
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKUserController.default.get|updateOrganizationUser|requestUserId|#1`

#### `/users/{userId}/organizations/{organizationId}`
- **Operations**: Write (Update, Delete)
- **Description**: Updates or deletes the user's global mapping to the organization and their assigned roles.
- **Confidence**: **Confirmed**
- **Citations**:
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKUserOrganizationController.default.update|updateOrganizationUser|request.userId,request.organizationId,{                 userRoles: assignedRoles.map((r) => r.roleId),             }|#1`
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKUserOrganizationController.default.delete|deleteOrganizationUser|userId,organizationId|#1`

---

## 6. Outbound Coupling

### Cross-Module Coupling

#### `core`
- **Dependency**: Inherits base controller functionality (`OSKDocumentController`) and utilizes the logging service.
- **Evidence**:
  - `imports_dependency|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|@oskey/core/controllers/document|#1`
  - `imports_dependency|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|@oskey/core/logger|#1`

#### `settings`
- **Dependency**: Imports `@oskey/settings/role` to check consolidated user permissions.
- **Evidence**:
  - `imports_dependency|organization|functions/src/modules/organization/modules/organization_user/models/documents/organization_user_document.model.ts|@oskey/settings/role|#1`
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|deleteOrganizationUser|adminUser.roles,rolesToCheck|#1`

#### `user`
- **Dependency**: Imports `@oskey/user` and `@oskey/user/organization` to fetch global user profiles and update user-organization mappings.
- **Evidence**:
  - `imports_dependency|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|@oskey/user/organization|#1`
  - `imports_dependency|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|@oskey/user|#1`

### Intra-Module Coupling (Cross-Submodule)

#### `organization_user_invitation`
- **Dependency**: Imports `../../organization_user_invitation` to query pending invitees when listing all organization users.
- **Evidence**:
  - `imports_dependency|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|../../organization_user_invitation|#1`

#### `organization` (root/other submodules)
- **Dependency**: Imports `@oskey/organization` to fetch organization configuration details.
- **Evidence**:
  - `imports_dependency|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|@oskey/organization|#1`

---

## 7. Permissions & Security

### Permission Strings Referenced

#### `v1.org.user.create`
- **Usage**: Checked when listing organization users and invitees.
- **Cross-Check**: Matches `v1.org.user.create` in the RBAC roles document ("Allows to add a new user to the Oskey Property Management Portal").
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.create|#1`

#### `v1.org.user.edit`
- **Usage**: Checked when updating organization users or their roles.
- **Cross-Check**: Matches `v1.org.user.edit` in the RBAC roles document ("Allows to edit a user's information on the Oskey Property Management Portal").
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.edit|#1`

#### `v1.org.user.view`
- **Usage**: Checked when viewing organization users or invitees.
- **Cross-Check**: Matches `v1.org.user.view` in the RBAC roles document ("Allows to view the details of an Oskey Property Management Portal user").
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.view|#1`

#### `v1.org.admin` (Role)
- **Usage**: Checked to identify organization administrators.
- **Cross-Check**: This is a high-level role rather than a granular permission string, which is why it is not listed in the `rbac-roles.json` permission list but is documented in the Architecture/Personas documents.
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|v1.org.admin|#1`

#### `v1.admin` (Role)
- **Usage**: Checked to identify platform-level administrators.
- **Cross-Check**: This is a high-level role rather than a granular permission string.
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|v1.admin|#1`

### Firestore Security Rules

The Firestore rules for the `/organizations/{organizationId}/users/{userId}` subcollection are defined as:
```javascript
match /organizations/{organizationId} {
  // ...
  match /users/{userId} {
    allow write: if isValidUser();
    allow read: if isValidUser();
  }
}
```
- **Analysis**: The Firestore rules allow any authenticated user (`isValidUser()`) to read and write to the organization users collection. This indicates that granular RBAC enforcement (such as checking `v1.org.user.edit` or `v1.org.user.view`) is delegated entirely to the application layer (Cloud Functions) via the `OSKConsolidatedRolesController` rather than being enforced at the database rules layer.
- **Citation**: `firestore.rules.txt` (lines 518-521).

---

## 8. External Hooks

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced in this capability's pack. **Confirmed** (absence of evidence).

---

## 9. Open Questions

- **Firestore Rules Permissiveness**: Why are the Firestore security rules for `/organizations/{organizationId}/users/{userId}` so permissive (`allow read, write: if isValidUser()`) compared to the strict application-level RBAC checks? Is there a risk of direct client-side modification if a user bypasses the Cloud Functions?
- **Auth0 Synchronization**: When an organization user is deleted via `deleteOrganizationUser`, does this trigger any cleanup in the Auth0 identity provider, or is the user's Auth0 account left intact? The current evidence only shows Firestore document deletions.
- **Event Publishing**: Are there any background events published (e.g., via Pub/Sub) when an organization user's roles are updated, to notify other modules or invalidate caches? The current evidence only shows direct database writes.