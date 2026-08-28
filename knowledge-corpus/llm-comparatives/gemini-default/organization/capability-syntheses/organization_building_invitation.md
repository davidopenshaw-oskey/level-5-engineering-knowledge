## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.480Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_building_invitation
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `organization_building_invitation` capability manages the lifecycle of building inhabitant invitations initiated by organization administrators or property managers. It provides interfaces to create, query, cancel, and accept invitations, bridging administrative controls in the `organization` module with the underlying unit and inhabitant structures in the `building` module. (Confirmed)

---

## 2. Primary Responsibilities
This capability provides the following distinct responsibilities:

- **Inhabitant Invitation Creation**: Orchestrates the creation of building inhabitant invitations. It verifies administrative permissions, retrieves building unit details, resolves authorized doors, generates a unique invitation ID, and persists the invitation. (Confirmed) `` `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 41-174) ``
- **Inhabitant Invitation Cancellation**: Allows administrators to cancel pending invitations, deleting them from the building unit's records. (Confirmed) `` `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 176-224) ``
- **Inhabitant Invitation Querying**: Provides querying capabilities over sent or rejected invitations based on filters such as building, unit, or inhabitant type. (Confirmed) `` `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 226-293) ``
- **Inhabitant Invitation Acceptance**: Processes the acceptance of an invitation by a user. It validates permissions, retrieves the user's profile, registers them as an inhabitant of the target building unit, and deletes the processed invitation. (Confirmed) `` `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 295-397) ``

---

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes its functionality through Firebase HTTPS Callable functions and a service class:

### Entry Points (Callable Functions)
- **`createBuildingInhabitantInvitation`**: Entry point for creating invitations. (Confirmed) `` `api_contract|organization|functions/src/modules/organization/modules/organization_building_invitation/index.ts|createBuildingInhabitantInvitation|#1` ``
- **`queryBuildingInhabitantInvitation`**: Entry point for querying invitations. (Confirmed) `` `api_contract|organization|functions/src/modules/organization/modules/organization_building_invitation/index.ts|queryBuildingInhabitantInvitation|#1` ``
- **`acceptBuildingInhabitantInvitation`**: Entry point for accepting invitations. (Confirmed) `` `api_contract|organization|functions/src/modules/organization/modules/organization_building_invitation/index.ts|acceptBuildingInhabitantInvitation|#1` ``

### Exported Services
- **`OSKOrganizationBuildingInvitationService`**: The core service class containing the business logic for managing invitations. (Confirmed) `` `source_class|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKOrganizationBuildingInvitationService` ``

---

## 4. API Contracts & Firestore Triggers

### API Contracts
The following callable API contracts are exposed by this capability:

#### 1. `acceptBuildingInhabitantInvitation`
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationAcceptRequest`
  - `adminsOrganizationId`: `string`
  - `invitationId`: `string`
  - `userId`: `string`

#### 2. `createBuildingInhabitantInvitation`
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationCreateRequest`
  - `adminsOrganizationId`: `string`
  - `buildingId`: `string`
  - `buildingUnitInhabitantType`: `OSKBuildingUnitInhabitantType` (imported from `building_unit` submodule)
  - `doorIds` (optional): `string[]`
  - `email` (optional): `string`
  - `firstName`: `string`
  - `internationalPhoneNumber`: `string`
  - `inviterId`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `postalAddress` (optional): `OSKStreetAddress` (imported from `core` module)
  - `unitId`: `string`
  - `userId` (optional): `string`

#### 3. `queryBuildingInhabitantInvitation`
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationQueryRequest`
  - `adminsOrganizationId`: `string`
  - `collectionName`: `"invitationsSent" | "invitationsRejected"`
  - `queryField`: `"buildingId" | "unitId" | "invitationId" | "buildingUnitInhabitantType"`
  - `queryValue`: `string | { type: string; isResident?: boolean; }`

---

## 5. Data Ownership
This capability does not directly own or write to its own dedicated Firestore collections. Instead, it acts as an orchestrator that delegates data persistence and modification to other modules:

- **Delegated Writes**:
  - Writes and deletes building unit invitations via `OSKBuildingUnitInvitationController` (owned by the `building` module). (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKBuildingUnitInvitationController.default.create|createBuildingInhabitantInvitation|request.buildingId,request.unitId,invitationId,invitation|#1` ``
  - Adds inhabitants to building units via `OSKBuildingUnitInhabitantService` (owned by the `building` module). (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKBuildingUnitInhabitantService.addInhabitant|acceptBuildingInhabitantInvitation|buildingUnitInhabitant|#1` ``

---

## 6. Outbound Coupling

This capability exhibits outbound coupling to several external modules and sibling submodules:

### Cross-Module Coupling
- **`building` Module (`building_unit` submodule)**:
  - Imports models and controllers to manage unit invitations and inhabitants. (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|@oskey/building/unit|#1` ``
  - Calls `OSKBuildingUnitController.default.get`, `OSKBuildingUnitInvitationController.default.create`, `OSKBuildingUnitInvitationController.default.deleteInvitation`, `OSKBuildingUnitInvitationController.default.generateInvitationId`, `OSKBuildingUnitInvitationController.default.queryInvitations`, and `OSKBuildingUnitInhabitantService.addInhabitant`. (Confirmed)
- **`building` Module (`building_door` submodule)**:
  - Imports door models and controllers to resolve authorized doors. (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|@oskey/building/door|#1` ``
  - Calls `OSKBuildingDoorController.default.getSafe`. (Confirmed)
- **`core` Module (`access` submodule)**:
  - Imports access utility services. (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|@oskey/core/access|#1` ``
  - Calls `OSKAccessUtilsService.getBuildingAuthorizedDoors`. (Confirmed)
- **`settings` Module (`role` submodule)**:
  - Imports role settings to validate user permissions. (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|@oskey/settings/role|#1` ``
  - Calls `OSKConsolidatedRolesController.default.checkUserPermissions`. (Confirmed)
- **`user` Module**:
  - Imports user controllers to fetch user profiles. (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|@oskey/user|#1` ``
  - Calls `OSKUserController.default.get`. (Confirmed)

### Intra-Module Coupling (Sibling Submodules)
- **`organization_user` Submodule**:
  - Imports the organization user controller to fetch the administrator's organization-scoped profile. (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|../../organization_user/controllers/organization_user.controller|#1` ``
  - Calls `OSKOrganizationUserController.default.get`. (Confirmed)

---

## 7. Permissions & Security

### Enforced Permissions
The capability checks the following permission string to authorize administrative actions:
- **`v1.org.buildings.create`**: Checked before creating, querying, canceling, or accepting building inhabitant invitations. (Confirmed) `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|v1.org.buildings.create|#1` ``

### RBAC Cross-Check & Mismatch Analysis
- According to the `rbac-roles.json` reference document, the permission `v1.org.buildings.create` is described as **"Allows to create a new building"**.
- **Mismatch Identified**: Using `v1.org.buildings.create` to authorize *inhabitant invitations* is a semantic mismatch. A more appropriate permission from the RBAC roles document would be `v1.org.residents.create` (**"Allows to create a new resident profile"**). (Inferred)

---

## 8. External Hooks
No external hooks (such as Pub/Sub topics, external HTTP integrations, or cloud storage paths) are directly evidenced within this capability's pack. All operations are synchronous internal service calls or Firebase callable functions. (Confirmed)

---

## 9. Open Questions

- **Permission Mismatch**: Why is `v1.org.buildings.create` (building creation) used to authorize inhabitant invitation workflows instead of `v1.org.residents.create`?
- **Notification Dispatch**: The Oskey Architecture document states that creating an invitation automatically triggers an automated email invitation. However, there is no evidence of notification or email dispatch logic within this capability's service. Is the notification triggered asynchronously via a Firestore trigger in another module (e.g., on the creation of the invitation document in the `building` module)?
- **Onboarding State Transition**: How does the "Onboarding Inhabitant" state transition to "Active" upon acceptance? The service calls `OSKBuildingUnitInhabitantService.addInhabitant`, but the exact mapping of the Auth0 identity linking flow is not visible in this capability's evidence.