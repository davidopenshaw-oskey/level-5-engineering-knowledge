## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.383Z
- **repoName**: firebase-oskey-dev
- **targetModule**: admin
- **capability**: admin_users
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `admin_users` capability provides administrative tools to manage platform users, their accesses, devices, invitations, and inhabitant statuses within units and buildings. It acts as an admin-level orchestration layer, validating permissions against organization roles and calling core, user, and building services to execute modifications. [Confirmed]

## 2. Primary Responsibilities
- **User Data Management**: Retrieves all users, gets user details by ID (including counts of devices, accesses, and invitations), and deletes user data (accesses, devices, and invitations) `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|deleteUserData|#1` ``. [Confirmed]
- **Inhabitant Management**: Adds inhabitants to units, removes inhabitants from units, retrieves inhabitant user units, and grants inhabitant access to unit inhabitants `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|addInhabitantToUnit|#1` ``. [Confirmed]
- **User Access Management**: Retrieves all user accesses, gets user access by ID, removes user accesses, removes all user accesses, and removes specific accesses from a user access document `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserAccesses|#1` ``. [Confirmed]
- **User Device Management**: Retrieves all user devices, removes user devices, and removes all user devices `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserDevices|#1` ``. [Confirmed]
- **User Invitation Management**: Retrieves all user invitations, removes user invitations, removes all user invitations, and creates user invitation access `` `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|getAllUserInvitations|#1` ``. [Confirmed]
- **Permission Verification**: Validates that the calling administrator has the required RBAC permissions (e.g., `v1.admin.user.view`, `v1.admin.user.edit`, `v1.admin.user.delete`, `v1.admin.user.accesses.create`, etc.) within their organization before executing any operations `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (lines 46-47) ``. [Confirmed]

## 3. Public Interfaces (Controllers & Entry Points)
### Controllers
- **`OSKAdminInhabitantUserController`**: Manages inhabitant-to-unit mappings and queries collection groups for inhabitant units `` `functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts` (lines 9-43) ``. [Confirmed]
- **`OSKAdminUserAccessController`**: Handles administrative queries and operations on user accesses `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts` (lines 9-22) ``. [Confirmed]
- **`OSKAdminUserDeviceController`**: Handles administrative deletions and queries on user devices `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts` (lines 9-26) ``. [Confirmed]
- **`OSKAdminUserInvitationController`**: Manages administrative queries, updates, and deletions on user invitations `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 9-85) ``. [Confirmed]
- **`OSKAdminUserController`**: Handles administrative queries for users `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts` (lines 9-23) ``. [Confirmed]

### Services
- **`OSKAdminInhabitantUserService`**: Orchestrates adding/removing inhabitants and granting inhabitant access `` `functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts` (lines 38-358) ``. [Confirmed]
- **`OSKAdminUserAccessService`**: Orchestrates administrative user access queries and deletions `` `functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts` (lines 24-223) ``. [Confirmed]
- **`OSKAdminUserDeviceService`**: Orchestrates administrative user device queries and deletions `` `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` (lines 21-136) ``. [Confirmed]
- **`OSKAdminUserInvitationService`**: Orchestrates administrative user invitation queries, deletions, and access creation `` `functions/src/modules/admin/modules/admin_users/services/admin_user_invitation.service.ts` (lines 29-321) ``. [Confirmed]
- **`OSKAdminUserService`**: Orchestrates administrative user queries and user data deletion `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (lines 30-148) ``. [Confirmed]

### Entry Points
- **`getAdminUsersCallableFunctionTriggers`**: Exposes all administrative user-related callable functions to Firebase Functions `` `functions/src/modules/admin/modules/admin_users/index.ts` (lines 32-67) ``. [Confirmed]

## 4. API Contracts & Firestore Triggers
### Callable Functions
- **`addInhabitantToUnit`**
  - Request Type: `OSKAddInhabitantFromUnitRequestData`
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
    - `unitId`: `string`
  - Response Type: `OSKAddInhabitantFromUnitResponseData`
    - `accessId`: `string | undefined` (optional)
    - `inhabitantId`: `string`
- **`createUserInvitationAccess`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`deleteUserData`**
  - Request Type: `OSKDeleteUserDataRequestData`
    - `accesses`: `boolean`
    - `devices`: `boolean`
    - `invitations`: `boolean`
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUserAccesses`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUserDevices`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUserInvitations`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUsers`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getInhabitantUserUnits`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getUserAccessById`**
  - Request Type: `OSKGetUserAccessByIdRequestData`
    - `userAccessId`: `string`
  - Response Type: No `model_property` facts matched within this pack.
- **`getUserById`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: `OSKGetUserByIdResponseData`
    - `devicesCount`: `number`
    - `inhabitantIn`: `{ buildingsCount: number; unitsCount: number; }`
    - `invitationsCount`: `number`
    - `userAccessesCount`: `number`
- **`giveInhabitantAccessToUnitInhabitant`**
  - Request Type: `OSKGiveInhabitantAccessRequestData`
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `unitId`: `string`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeAllUserAccesses`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`removeAllUserDevices`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`removeAllUserInvitations`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`removeInhabitantFromUnit`**
  - Request Type: `OSKRemoveInhabitantFromUnitRequestData`
    - `buildingId`: `string`
    - `unitId`: `string`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserAccessAccesses`**
  - Request Type: `OSKRemoveUserAccessAccessesRequestData`
    - `accessIds`: `string[]`
    - `userAccess`: `OSKUserAccesses`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserAccesses`**
  - Request Type: `OSKRemoveUserAccessesRequestData`
    - `userAccesses`: `OSKUserAccesses[]`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserDevices`**
  - Request Type: `OSKRemoveUserDevicesRequestData`
    - `deviceIds`: `string[]`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserInvitations`**
  - Request Type: `OSKRemoveUserInvitationsRequestData`
    - `invitations`: `OSKUserInvitationToRemove[]`
  - Response Type: No `model_property` facts matched within this pack.

### Firestore Triggers
No Firestore triggers are evidenced within this capability's pack. [Confirmed]

## 5. Data Ownership
This capability performs read, write, and delete operations on the following Firestore paths:
- **`/users/{userId}/accesses`**: Read/Write via `OSKAdminUserAccessController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts` (lines 16-22) ``. [Confirmed]
- **`/users/{userId}/devices`**: Read/Write/Delete via `OSKAdminUserDeviceController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts` (lines 16-26) ``. [Confirmed]
- **`/users/{userId}/invitations`**: Read/Delete via `OSKAdminUserInvitationController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 18-38) ``. [Confirmed]
- **`/users/{userId}/sentInvitations`**: Write/Delete via `OSKAdminUserInvitationController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 71-85) ``. [Confirmed]
- **`/buildings/{buildingId}/units/{unitId}/inhabitants`**: Read/Write via `OSKAdminInhabitantUserController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts` (lines 16-43) ``. [Confirmed]
- **`/buildings/{buildingId}/units/{unitId}/invitations`**: Read/Write/Delete via `OSKAdminUserInvitationController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts` (lines 40-69) ``. [Confirmed]
- **`/users`**: Read via `OSKAdminUserController` `` `functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts` (lines 17-23) ``. [Confirmed]
- **`/organizations/{organizationId}/users/{userId}`**: Read via `OSKOrganizationUserController` in `getAdminOrganizationUser` utility `` `functions/src/modules/admin/modules/admin_users/utils/get_admin_organization_user.util.ts` (lines 38-39) ``. [Confirmed]
- **`/organizations/{organizationId}`**: Read via `OSKOrganizationController` in `getAdminOrganizationUser` utility `` `functions/src/modules/admin/modules/admin_users/utils/get_admin_organization_user.util.ts` (lines 29-30) ``. [Confirmed]

## 6. Outbound Coupling
### Cross-Module Coupling
- **`building` module**:
  - `@oskey/building/unit`: Imported by `admin_inhabitant_user.controller.ts` (line 6) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_inhabitant_user.controller.ts|@oskey/building/unit|#1` ``. [Confirmed]
  - `@oskey/building/door`: Imported by `admin_inhabitant_user.service.ts` (line 7) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|@oskey/building/door|#1` ``. [Confirmed]
  - `@oskey/building`: Imported by `admin_inhabitant_user.service.ts` (line 6) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|@oskey/building|#1` ``. [Confirmed]
- **`core` module**:
  - `@oskey/core`: Imported by `admin_user_access.controller.ts` (line 6) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts|@oskey/core|#1` ``. [Confirmed]
  - `@oskey/core/access`: Imported by `admin_inhabitant_user.service.ts` (line 17) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|@oskey/core/access|#1` ``. [Confirmed]
  - `@oskey/core/logger`: Imported by `admin_inhabitant_user.service.ts` (line 18) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|@oskey/core/logger|#1` ``. [Confirmed]
- **`user` module**:
  - `@oskey/user/access`: Imported by `admin_user_access.controller.ts` (line 7) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts|@oskey/user/access|#1` ``. [Confirmed]
  - `@oskey/user/device`: Imported by `admin_user_device.controller.ts` (line 7) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_device.controller.ts|@oskey/user/device|#1` ``. [Confirmed]
  - `@oskey/user/invitation`: Imported by `admin_user_invitation.controller.ts` (line 7) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_invitation.controller.ts|@oskey/user/invitation|#1` ``. [Confirmed]
  - `@oskey/user`: Imported by `admin_user.controller.ts` (line 7) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts|@oskey/user|#1` ``. [Confirmed]
- **`organization` module**:
  - `@oskey/organization/user`: Imported by `admin_inhabitant_user.service.ts` (line 19) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|@oskey/organization/user|#1` ``. [Confirmed]
  - `@oskey/organization`: Imported by `get_admin_organization_user.util.ts` (line 2) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/utils/get_admin_organization_user.util.ts|@oskey/organization|#1` ``. [Confirmed]
- **`settings` module**:
  - `@oskey/settings/role`: Imported by `admin_inhabitant_user.service.ts` (line 20) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|@oskey/settings/role|#1` ``. [Confirmed]

### Intra-Module Coupling
- `@oskey/admin`: Imported by `admin_inhabitant_user.requests.model.ts` (line 6) `` `imports_dependency|admin|functions/src/modules/admin/modules/admin_users/models/functions/admin_inhabitant_user.requests.model.ts|@oskey/admin|#1` ``. [Confirmed]

## 7. Permissions & Security
The following permission strings are referenced and checked by this capability's services:
- `v1.admin.user.accesses.create` `` `functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts` (line 65) ``
- `v1.admin.user.accesses.delete` `` `functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts` (line 164) ``
- `v1.admin.user.accesses.view` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts` (line 41) ``
- `v1.admin.user.devices.delete` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` (line 41) ``
- `v1.admin.user.devices.edit` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` (line 40) ``
- `v1.admin.user.devices.view` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` (line 39) ``
- `v1.admin.user.invitations.delete` `` `functions/src/modules/admin/modules/admin_users/services/admin_user_invitation.service.ts` (line 46) ``
- `v1.admin.user.invitations.view` `` `functions/src/modules/admin/modules/admin_user_invitation.service.ts` (line 46) ``
- `v1.admin.user.delete` `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (line 46) ``
- `v1.admin.user.edit` `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (line 46) ``
- `v1.admin.user.view` `` `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` (line 46) ``

### Cross-Check Against RBAC Roles Document
All referenced permission strings match the definitions in `rbac-roles.json` exactly. [Confirmed]

## 8. External Hooks
No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or Cloud Storage paths) are directly evidenced within this capability's pack. [Confirmed]

## 9. Open Questions
- **Unresolved Request/Response Schemas**: The exact structures of request/response payloads for `createUserInvitationAccess`, `getAllUserAccesses`, `getAllUserDevices`, `getAllUserInvitations`, `getAllUsers`, `getInhabitantUserUnits`, `removeAllUserAccesses`, `removeAllUserDevices`, and `removeAllUserInvitations` are not fully resolved in the provided evidence pack due to missing `model_property` facts. [Inferred]
- **Auth0 Synchronization**: It is unclear from the evidence pack whether deleting user data via `deleteUserData` also triggers a deletion or suspension of the user's Auth0 identity, or if that is handled asynchronously by another module. [Inferred]