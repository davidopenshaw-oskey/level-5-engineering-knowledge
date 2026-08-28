# Capability Synthesis — user_settings

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.580Z
- **repoName**: firebase-oskey-dev
- **targetModule**: user
- **capability**: user_settings
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `user_settings` capability manages user-specific configuration preferences and access rules at both the building and unit levels within the `user` module (`Confirmed`). It allows users and authorized administrators to define, retrieve, update, and delete settings such as permitted access methods (e.g., Bluetooth, PIN code), invitation permissions, and display preferences scoped to specific buildings and units (`Confirmed`).

---

## 2. Primary Responsibilities

### User Building Settings Management
- **Creation**: Provisions a new user building settings document containing default or customized parameters for a user within a specific building `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|createUserSettingsBuilding|#1` ``.
- **Retrieval**: Fetches a single user building settings document by building ID `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|getUserSettingsBuilding|#1` `` or queries all building settings associated with a specific user `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|getAllUserSettingsBuilding|#1` ``.
- **Modification**: Updates specific fields of a user's building settings document based on a partial input payload `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|updateUserSettingsBuilding|#1` ``.
- **Deletion**: Removes building-level settings documents for a user `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|deleteUserSettingsBuilding|#1` ``.

### User Unit Settings Management
- **Creation**: Provisions unit-level settings for a user within a specific building unit `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|createUserSettingUnit|#1` ``.
- **Automatic Provisioning**: Automatically generates user unit settings when an inhabitant is created, mapping settings based on the inhabitant's type (e.g., Resident, Tenant) `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|createUserSettingsUnitFromInhabitant|#1` ``.
- **Retrieval**: Fetches unit settings for a specific user, building, and unit `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|getUserSettingUnit|#1` `` or lists all unit settings for a user within a building `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|getAllUserSettingsUnit|#1` ``.
- **Modification**: Updates unit-level settings for a user `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|updateUserSettingUnit|#1` ``.
- **Deletion**: Removes unit-level settings documents `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|deleteUserSettingUnit|#1` ``.

### Security and Permission Enforcement
- Validates that the executing user has the necessary administrative permissions (e.g., `v1.org.settings.create`, `v1.org.settings.edit`, `v1.org.settings.view`, `v1.org.settings.delete`) before performing operations on behalf of another user `` `functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts` (lines 30-61) ``.
- Enforces user identity matching using security decorators to ensure standard users can only access or modify their own settings `` `call_expression|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSecurityChecks|createUserSettingsBuilding|{ checkUserIdMatch: false }|#1` ``.

---

## 3. Public Interfaces (Controllers & Entry Points)

This capability exposes the following controllers and services:

### Controllers
- **`OSKUserSettingsBuildingController`**: Extends `OSKDocumentController` to handle Firestore document operations for building-level settings `` `source_class|user|functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts|OSKUserSettingsBuildingController` ``.
- **`OSKUserSettingsUnitController`**: Extends `OSKDocumentController` to handle Firestore document operations for unit-level settings `` `source_class|user|functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts|OSKUserSettingsUnitController` ``.

### Services
- **`OSKUserSettingsBuildingService`**: Orchestrates business logic, parameter validation, and permission checks for building settings `` `source_class|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService` ``.
- **`OSKUserSettingsUnitService`**: Orchestrates business logic, parameter validation, and permission checks for unit settings `` `source_class|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService` ``.

---

## 4. API Contracts & Firestore Triggers

### Callable Cloud Functions
The capability registers the following HTTPS callable triggers in `functions/src/modules/user/modules/user_settings/index.ts`:
- `createUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|createUserSettingsBuilding|#1` ``
- `deleteUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|deleteUserSettingsBuilding|#1` ``
- `getAllUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|getAllUserSettingsBuilding|#1` ``
- `getUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|getUserSettingsBuilding|#1` ``
- `updateUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|updateUserSettingsBuilding|#1` ``

### Resolved API Request/Response Schemas

#### `createUserSettingsBuilding`
- **Request Type**: `OSKUserCreateSettingsBuildingRequest`
  - `buildingId`: `string`
  - `buildingSettingsInputParams`: `OSKBuildingSettingsInputParams` (imported from `@oskey/building/settings`)
  - `userId`: `string`

#### `deleteUserSettingsBuilding`
- **Request Type**: `OSKUserDeleteSettingsBuildingRequest`
  - `buildingId`: `string`
  - `userId`: `string`

#### `getAllUserSettingsBuilding`
- **Request Type**: `OSKUserGetAllSettingsBuildingRequest`
  - `userId`: `string`

#### `getUserSettingsBuilding`
- **Request Type**: `OSKUserGetSettingsBuildingRequest`
  - `buildingId`: `string`
  - `userId`: `string`

#### `updateUserSettingsBuilding`
- **Request Type**: `OSKUserUpdateSettingsBuildingRequest`
  - `buildingId`: `string`
  - `update`: `Partial<OSKBuildingSettingsInputParams>` (imported from `@oskey/building/settings`)
  - `userId`: `string`

---

## 5. Data Ownership

### Firestore Collections Scoped to this Capability
The capability performs read, write, update, and delete operations on the following subcollections nested under the `/users` root collection:

- **`/users/{userId}/buildingSettings/{buildingId}`**
  - *Description*: Stores building-level access settings for a user.
  - *Controller*: `OSKUserSettingsBuildingController` `` `functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts` (lines 18-26) ``.
  - *Operations*: `get`, `set`, `update`, `delete`, `query` `` `functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts` (lines 28-85) ``.

- **`/users/{userId}/buildingSettings/{buildingId}/unitSettings/{unitId}`**
  - *Description*: Stores unit-level access settings for a user.
  - *Controller*: `OSKUserSettingsUnitController` `` `functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts` (lines 18-27) ``.
  - *Operations*: `get`, `set`, `update`, `delete`, `query` `` `functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts` (lines 29-85) ``.

---

## 6. Outbound Coupling

### Cross-Module Coupling
The capability imports and interacts with the following external modules:

- **`core`**:
  - Imports `OSKDocumentController` to inherit standard document CRUD operations `` `imports_dependency|user|functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts|@oskey/core/controllers/document|#1` ``.
- **`building`**:
  - Imports `OSKBuildingController` to retrieve building details and verify building existence `` `imports_dependency|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|@oskey/building|#1` ``.
  - Imports `OSKBuildingSettingsInputParams` from the `building_settings` submodule to define building settings schemas `` `imports_dependency|user|functions/src/modules/user/modules/user_settings/models/documents/user_building_settings.model.ts|@oskey/building/settings|#1` ``.
  - Imports `OSKBuildingUnitController` from the `building_unit` submodule to verify unit existence `` `imports_dependency|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|@oskey/building/unit|#1` ``.
- **`organization`**:
  - Imports `OSKOrganizationUserController` from the `organization_user` submodule to retrieve organization user roles for permission checks `` `imports_dependency|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|@oskey/organization/user|#1` ``.
- **`settings`**:
  - Imports `OSKConsolidatedRolesController` from the `role` submodule to evaluate user permissions against required RBAC roles `` `imports_dependency|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|@oskey/settings/role|#1` ``.

### Intra-Module Coupling (Sibling Submodules)
- **`user` (root)**:
  - Imports `OSKUserController` to fetch user profiles and verify user existence `` `imports_dependency|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|@oskey/user|#1` ``.

---

## 7. Permissions & Security

### Required Permissions
The capability explicitly checks the following permission strings when executing administrative actions:
- **`v1.org.settings.create`**: Required to create user building or unit settings `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.create|#1` ``.
- **`v1.org.settings.view`**: Required to view user building or unit settings `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.view|#1` ``.
- **`v1.org.settings.edit`**: Required to update user building or unit settings `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.edit|#1` ``.
- **`v1.org.settings.delete`**: Required to delete user building or unit settings `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.delete|#1` ``.

### RBAC Cross-Check
All checked permissions (`v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete`) match the authoritative RBAC roles document exactly (`Confirmed`). 

The codebase also references `v1.org.admin` as a candidate permission/role check `` `permission_candidate|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|v1.org.admin|#1` ``. In the RBAC roles document, `v1.org.admin` is not listed as a standalone permission string, but the system context architecture document defines it as a high-level administrative role (`Confirmed`).

---

## 8. External Hooks
No external hooks, Pub/Sub topics, external HTTP paths, or storage paths are registered or utilized directly within this capability's pack (`Confirmed`).

---

## 9. Open Questions

- **Unit Settings Callables**: The entry point `functions/src/modules/user/modules/user_settings/index.ts` only registers callable functions for building settings (`createUserSettingsBuilding`, `updateUserSettingsBuilding`, etc.). It does not register callables for unit settings. Are unit settings managed exclusively via internal service-to-service calls (such as during inhabitant onboarding), or are they exposed through a different module's entry point?
- **Role vs. Permission Check**: The service checks for `v1.org.admin` `` `permission_candidate|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|v1.org.admin|#1` ``. Since this is a role rather than a permission string, does the consolidated roles controller handle role-to-permission mapping dynamically, or is this a hardcoded bypass for organization admins?