### 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.434Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: building_user
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

### 1. Capability Summary
The `building_user` capability manages the association of users with specific buildings (referred to as building users) within the platform [Confirmed]. It provides administrative interfaces and services to create, retrieve, update, and delete building user records, while orchestrating their physical access rights and cleaning up associated access configurations upon deletion [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1`, `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 290-301)).

---

### 2. Primary Responsibilities
This capability provides the following distinct responsibilities:

*   **Creation of Building Users**: Orchestrates the creation of a building user association [Confirmed]. The service validates the caller's authentication and permissions, retrieves the target user and building, provisions access rights via the core access service, and saves the building user record [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 26-120)).
*   **CRUD Operations on Building User Documents**: Exposes standard document-level operations (get, save, update, delete, list) targeting the Firestore path `/buildings/{buildingId}/users/{userId}` [Confirmed] (`functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts` (lines 11-44)).
*   **Automated Access Cleanup on Deletion**: Listens to building user document deletions via a Firestore trigger and automatically cleans up associated building accesses and user accesses [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 290-301)).

---

### 3. Public Interfaces (Controllers & Entry Points)
This capability exposes the following public entry points and services:

*   **`OSKBuildingUserController`**: A document controller extending `OSKDocumentController` that manages Firestore operations for building user documents under the path `/buildings/${buildingId}/users` [Confirmed] (`functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts` (lines 11-44)).
*   **`OSKBuildingUserService`**: A service class containing the core business logic for creating building users and handling document deletion triggers [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 23-301)).
*   **`createBuildingUser` (Callable HTTPS Trigger)**: The primary external entry point for creating a building user association [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1`).

---

### 4. API Contracts & Firestore Triggers

#### Callable API Contracts
*   **`createBuildingUser`** [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1`)
    *   **Request Schema**: `OSKBuildingUserCreateRequest`
        *   `accessRights`: `import("functions/src/modules/core/modules/access/models/access_right.model").OSKAccessRightWithTimestamp[]`
        *   `buildingId`: `string`
        *   `doors`: `import("functions/src/modules/core/models/shared/door_info.model").OSKDoorInfo[]`
        *   `firstName`: `string`
        *   `lastName`: `string`
        *   `organizationId`: `string`
        *   `userId`: `string`
        *   `userType`: `import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationUser | import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationGuestUser`
    *   **Response Schema**: No matching `model_property` facts were found in this pack for the response type of this endpoint [Unknown].

#### Firestore Triggers
*   **`onDocumentDeleted`**: Triggered when a document in the `/buildings/{buildingId}/users/{userId}` collection is deleted [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 290-301)).

---

### 5. Data Ownership

#### Firestore Paths
This capability owns and performs operations on the following Firestore path:
*   **`/buildings/{buildingId}/users/{userId}`** [Confirmed]
    *   *Operations*: Read, Write, Delete [Confirmed] (`call_expression|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|OSKBuildingUserController.default._get|get|`/buildings/${buildingId}/users`,userId|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|OSKBuildingUserController.default._set|save|`/buildings/${buildingId}/users`,userId,data|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|OSKBuildingUserController.default._delete|delete|`/buildings/${buildingId}/users`,userId|#1`).

#### Document Schemas
*   **`OSKBuildingUser` / `OSKBuildingUserDocument`** [Confirmed] (`type_alias|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|#1`, `type_alias|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUserDocument|#1`)
    *   `userId`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|userId|#1`)
    *   `buildingId`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|buildingId|#1`)
    *   `firstName`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|firstName|#1`)
    *   `lastName`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|lastName|#1`)
    *   `profileImageFilename`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|profileImageFilename|#1`)
    *   `organizationId`: `string` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|organizationId|#1`)
    *   `accessRights`: `OSKAccessRightWithTimestamp[]` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|accessRights|#1`)
    *   `authorizedDoors`: `OSKDoorInfo[]` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|authorizedDoors|#1`)
    *   `userType`: `OSKUserAccessType` [Confirmed] (`model_property|building|functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts|OSKBuildingUser|userType|#1`)

---

### 6. Outbound Coupling

#### Intra-Module Coupling (Sibling Submodules)
*   **`building_accesses`**: Depends on `@oskey/building/accesses` to delete building-level accesses when a building user is deleted [Confirmed] (`imports_dependency|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|@oskey/building/accesses|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKBuildingAccessesController.default.deletePerUser|onDocumentDeleted|buildingId,buildingUser.userId|#1`).
*   **`building` (Root)**: Depends on `@oskey/building` to retrieve building details during user creation [Confirmed] (`imports_dependency|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|@oskey/building|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKBuildingController.default.get|createBuildingUser|request.buildingId|#1`).

#### Cross-Module Coupling
*   **`core`**:
    *   Depends on `@oskey/core/controllers/document` to inherit base document controller capabilities [Confirmed] (`imports_dependency|building|functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts|@oskey/core/controllers/document|#1`).
    *   Depends on `@oskey/core/access` to provision physical access rights [Confirmed] (`imports_dependency|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|@oskey/core/access|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKAccessService.createAccess|createBuildingUser|...|#1`).
    *   Depends on `@oskey/core/logger` for system error logging [Confirmed] (`imports_dependency|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|@oskey/core/logger|#1`).
*   **`organization`**:
    *   Depends on `@oskey/organization/user` to fetch organization user details and verify roles [Confirmed] (`imports_dependency|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|@oskey/organization/user|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKOrganizationUserController.default.get|createBuildingUser|adminsOrganizationId,adminsUserId|#1`).
*   **`settings`**:
    *   Depends on `@oskey/settings/role` to perform permission checks against consolidated roles [Confirmed] (`imports_dependency|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|@oskey/settings/role|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|createBuildingUser|organizationUser.roles,rolesToCheck|#1`).
*   **`user`**:
    *   Depends on `@oskey/user` to retrieve user profiles [Confirmed] (`imports_dependency|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|@oskey/user|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKUserController.default.get|createBuildingUser|request.userId|#1`).
    *   Depends on `@oskey/user/access` to delete all user-level accesses upon building user deletion [Confirmed] (`imports_dependency|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|@oskey/user/access|#1`, `call_expression|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKUserAccessesController.default.deleteAllUserAccesses|onDocumentDeleted|buildingUser.userId|#1`).

---

### 7. Permissions & Security

#### Permission Strings
The following permission strings are referenced by this capability's business logic:
*   **`v1.org.buildings.create`** [Confirmed] (`permission_candidate|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|v1.org.buildings.create|#1`)
*   **`v1.admin.building.register`** [Confirmed] (`permission_candidate|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|v1.admin.building.register|#1`)

#### RBAC Cross-Check
*   `v1.org.buildings.create` is defined in `rbac-roles.json` as "Allows to create a new building".
*   `v1.admin.building.register` is defined in `rbac-roles.json` as "v1.admin - Allows to register a new building".
*   *Note*: These permissions are checked during the creation of a building user association [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (line 49)). This represents a broad administrative permission check (building creation/registration) rather than a specific building-user assignment permission.

#### Firestore Security Rules
The security rules defined in `firestore.rules.txt` govern access to the `/buildings/{buildingId}/users/{userId}` collection:
*   **Read**: Allowed if the user is signed in and their email is verified [Confirmed] (`firestore.rules.txt` (lines 443-444)).
*   **Write**: Allowed if the user is signed in, their email is verified, and the target user document exists in the `/users` collection [Confirmed] (`firestore.rules.txt` (lines 443-445)).

---

### 8. External Hooks
No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or Cloud Storage paths) are directly evidenced within this capability's own pack [Confirmed].

---

### 9. Open Questions
*   **Permission Mismatch**: Why does `createBuildingUser` check for building creation permissions (`v1.org.buildings.create` or `v1.admin.building.register`) instead of a more granular user-management or building-user assignment permission? [Inferred]
*   **Response Schema**: What is the exact response structure returned by the `createBuildingUser` callable function, as no model properties for its response type were defined in this pack? [Unknown]