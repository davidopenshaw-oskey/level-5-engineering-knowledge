### 0. Generation Metadata

- **runId**: `20260803_143350-1aa319b1`
- **generatedAt**: `2026-08-11T16:54:40.081Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `unit_management`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `unit_management` module manages residential unit-level relationships within the platform. It orchestrates the onboarding, updating, and offboarding of inhabitants (including owners, tenants, and residents) and permanent guests. Additionally, it manages pending unit invitations and access credentials associated with these residential relationships. [Confirmed]

### 2. Architectural Position

The `unit_management` module sits as an orchestration layer between the `user`, `building`, and `core` modules. It manages the logical relationships of the "Mon Foyer" (household) boundary. While it defines the business logic for who belongs to a unit and what rights they inherit, it delegates physical access provisioning (such as PIN codes and BLE tokens) to the `core` module, physical building and unit structural definitions to the `building` module, and user profile management to the `user` module. [Confirmed]

### 3. Primary Responsibilities

#### _module_root

### Unit Invitation Creation and Onboarding [Confirmed]
- Orchestrates the creation of unit invitations for new inhabitants and guests, validating the inviter's authority and generating pending invitation records `` `api_contract|unit_management|functions/src/modules/unit_management/index.ts|createUnitInvitation|#1` ``.
- Manages pending unit invitations under the `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations` collection via a dedicated document controller `` `source_class|unit_management|functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts|OSKUnitManagementPendingInvitationsController` ``.
- Consumes pending invitations when an invitee successfully onboards, updating the pending list and cleaning up external user invitations `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUnitManagementPendingInvitationsController.default.consumeInvitee|removePendingInvitation|request.buildingId,request.unitId,request.inviterId,inviteeToRemove|#1` ``.

### Inhabitant Lifecycle Management [Confirmed]
- Retrieves all active inhabitants, permanent guests, non-app users, and pending invitees for a specific residential unit `` `api_contract|unit_management|functions/src/modules/unit_management/index.ts|getAllUnitInhabitantsAndGuests|#1` ``.
- Fetches detailed profile and credential data for a single unit inhabitant `` `api_contract|unit_management|functions/src/modules/unit_management/index.ts|getSingleUnitInhabitant|#1` ``.
- Updates inhabitant types (e.g., resident, tenant, owner) and resident rights, ensuring that only authorized callers (Owners or Tenants) can modify other inhabitants' profiles `` `api_contract|unit_management|functions/src/modules/unit_management/index.ts|updateInhabitant|#1` ``.
- Removes inhabitants from a unit, which triggers a cascading deletion of their associated accesses, pincodes, and intercom directory entries `` `api_contract|unit_management|functions/src/modules/unit_management/index.ts|removeInhabitantFromUnit|#1` ``.

### Permanent Guest Management [Confirmed]
- Retrieves permanent guest details, including their active pincodes and access schedules `` `api_contract|unit_management|functions/src/modules/unit_management/index.ts|getPermanentGuest|#1` ``.
- Updates permanent guest schedules (validity dates) and access rights, verifying that the caller has the necessary permissions to manage permanent guests `` `service_method|unit_management|functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts|OSKUnitManagementPermanentGuestService|updatePermanentGuest|#1` ``.
- Removes permanent guests from a unit, cascading the deletion of their associated accesses and pincodes `` `api_contract|unit_management|functions/src/modules/unit_management/index.ts|removePermanentGuest|#1` ``.

### Unified Person Lookup [Confirmed]
- Provides a unified lookup interface (`getUnitPerson`) to resolve a unit-associated person (inhabitant, permanent guest, non-app user, or pending invitee) based on their call type and target user ID `` `api_contract|unit_management|functions/src/modules/unit_management/index.ts|getUnitPerson|#1` ``.

### Access and Credential Cleanup [Confirmed]
- Coordinates with core access and pincode services to delete user accesses, building pincodes, and user pincodes when an inhabitant or permanent guest is removed from a unit `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|removeInhabitantFromUnit|pincodeDoc.pincode,request.buildingId|#1` ``.
- Cleans up intercom directory entries associated with removed inhabitants to maintain privacy and directory accuracy `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKBuildingIntercomService.deleteIntercomEntryUser|removeInhabitantFromUnit|request.buildingId,request.unitId,request.inhabitantToRemoveId|#1` ``.

---

### 4. Public Interfaces

#### _module_root

### Controllers [Confirmed]
- **`OSKUnitManagementPendingInvitationsController`** `` `functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts` (lines 9-144) ``: Extends `OSKDocumentController` to manage pending unit invitations under `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations`.

### Services [Confirmed]
- **`OSKUnitManagementInhabitantService`** `` `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (lines 61-815) ``: Handles inhabitant updates, removals, lookups, and pending invitation removals.
- **`OSKUnitManagementCreationInvitationService`** `` `functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts` (lines 28-283) ``: Orchestrates unit invitation creation and pending invitation updates.
- **`OSKUnitManagementCreationOskeyUserInvitationService`** `` `functions/src/modules/unit_management/services/unit_management_invitation_creation_oskeyuser.service.ts` (lines 34-222) ``: Processes invitees who are already registered Oskey users, including creating permanent guest records and adding inhabitants.
- **`OSKUnitManagementInvitationService`** `` `functions/src/modules/unit_management/services/unit_management_invitation.service.ts` (lines 23-102) ``: Retrieves unit invitations by user ID.
- **`OSKUnitManagementPermanentGuestService`** `` `functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts` (lines 38-348) ``: Manages permanent guest lookups, updates, and removals.

---

### 5. Internal Structure

*Note: This section contains only the cross-submodule coupling note derived from AST import resolution.*

The intra-module coupling graph indicates that `unit_management` contains no internal submodules (`submoduleCount: 0`). It operates as a single flat module centered around the `_module_root` capability. [Confirmed]

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains only the cross-cutting ownership and risk judgment conclusion.*

Based on the data ownership extracts and hints, `unit_management` is the primary owner of the `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations` collection path [Confirmed]. It acts as the coordinator for unit-level invitations, which are subsequently consumed or managed by the `user` module (during registration and onboarding) and the `organization` module (during resident management). 

Conversely, `unit_management` does *not* own the `/buildings/{buildingId}/units/{unitId}/inhabitants` or `/buildings/{buildingId}/units/{unitId}/permanentGuests` paths, which are owned and managed by the `building` module, nor does it own `/users/{userId}/pincodes` or `/buildings/{buildingId}/pincodes` (owned by `user` and `core` respectively) [Confirmed]. It accesses these paths indirectly via cross-module controller calls to perform cascading updates and deletions during inhabitant offboarding. [Inferred]

**Per-capability evidence:**

#### _module_root

### Firestore Paths [Confirmed]
The following Firestore paths are managed or modified by this capability:
- `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations` (Write/Delete): Managed directly by `OSKUnitManagementPendingInvitationsController` `` `call_expression|unit_management|functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts|OSKUnitManagementPendingInvitationsController.default._create|create|`/buildings/${buildingId}/units/${unitId}/pendingUnitInvitations`,userId,data|#1` ``.

### Indirectly Accessed Firestore Paths [Confirmed]
The capability interacts with the following paths owned by other capabilities/modules:
- `/buildings/{buildingId}/units/{unitId}/inhabitants` (Read/Delete): Accessed via `OSKBuildingUnitInhabitantController` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKBuildingUnitInhabitantController.default.get|removeInhabitantFromUnit|request.buildingId,request.unitId,request.inhabitantToRemoveId|#1` ``.
- `/buildings/{buildingId}/units/{unitId}/permanentGuests` (Read/Write/Delete): Accessed via `OSKBuildingUnitPermanentGuestController` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts|OSKBuildingUnitPermanentGuestController.default.get|updatePermanentGuest|request.buildingId,request.unitId,request.permanentGuestUserId|#1` ``.
- `/buildings/{buildingId}/units/{unitId}/nonAppUsers` (Read): Accessed via `OSKBuildingUnitNonAppUserController` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKBuildingUnitNonAppUserController.default.getAll|getAllUnitInhabitantsAndGuests|request.buildingId,request.unitId|#1` ``.
- `/users/{userId}` (Read): Accessed via `OSKUserController` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUserController.default.get|fetchInhabitantData|targetUserId|#1` ``.
- `/users/{userId}/pincodes` (Read/Delete): Accessed via `OSKUserPincodeController` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUserPincodeController.default.delete|removeInhabitantFromUnit|pincodeDoc.pincode,request.inhabitantToRemoveId|#1` ``.
- `/buildings/{buildingId}/pincodes` (Delete): Accessed via `OSKPincodeService` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|removeInhabitantFromUnit|pincodeDoc.pincode,request.buildingId|#1` ``.
- `/users/{userId}/accesses` (Read/Delete): Accessed via `OSKAccessService` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKAccessService.deleteAccessById|removeInhabitantFromUnit|request.inhabitantToRemoveId,request.buildingId,inhabitantToRemove.inhabitantAccessId|#1` ``.
- `/buildings/{buildingId}/intercoms` (Delete): Accessed via `OSKBuildingIntercomService` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKBuildingIntercomService.deleteIntercomEntryUser|removeInhabitantFromUnit|request.buildingId,request.unitId,request.inhabitantToRemoveId|#1` ``.

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

The following callable functions are exposed as public entry points by this capability `` `functions/src/modules/unit_management/index.ts` (lines 50-64) ``:

### `createUnitInvitation` [Confirmed]
- **Request Type**: `OSKUnitInvitation`
  ```typescript
  accessMethods?: OSKAccessMethod;
  buildingId: string;
  callForwarding?: string;
  confidentiality?: string;
  doors: OSKUserDoor[];
  firstName: string;
  invitees: OSKUnitInvitationInvitees[];
  inviterId: string;
  lastName: string;
  modificationDate?: any;
  unitId: string;
  ```
- **Response Type**: `OSKUnitInvitationCreationResponse`
  ```typescript
  accessId?: string | null;
  recordKey?: string;
  status?: string;
  ```

### `getAllUnitInhabitantsAndGuests` [Confirmed]
- **Request Type**: `OSKUnitManagementGetUnitInhabitantsRequest`
  ```typescript
  buildingId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: `OSKInhabitantsAndGuestsListResponse`
  ```typescript
  firstName: string;
  inhabitantsAndPermGuests: OSKInhabitantsAndGuestsList[];
  inhabitantType: OSKBuildingUnitInhabitantType;
  lastName: string;
  nonAppUsers: OSKNonAppUsersList[];
  pendingInvites: OSKPendingInvitesList[];
  userAccessType: OSKUserAccessType.InhabitantUser;
  userId: string;
  ```

### `getPermanentGuest` [Confirmed]
- **Request Type**: `OSKUnitManagementGetPermanentGuestRequest`
  ```typescript
  buildingId: string;
  permanentGuestUserId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: `OSKUnitManagementGetPermanentGuestResponse`
  ```typescript
  email: string;
  firstName: string;
  inviterId: string;
  lastName: string;
  phoneNumber: OSKPhoneNumber;
  pincodes: OSKUserPincodeDocument[];
  userAccessType: OSKUserAccessType.InhabitantPermanentGuestUser;
  userId: string;
  ```

### `getSingleUnitInhabitant` [Confirmed]
- **Request Type**: `OSKUnitManagementGetSingleUnitInhabitantRequest`
  ```typescript
  buildingId: string;
  inhabitantUserId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: `OSKSingleUnitInhabitantResponse`
  ```typescript
  email: string;
  firstName: string;
  inhabitantType: OSKBuildingUnitInhabitantType;
  inviterId: string;
  lastName: string;
  phoneNumber: OSKPhoneNumber;
  pincodes: OSKUserPincodeDocument[];
  userAccessType: OSKUserAccessType.InhabitantUser;
  userId: string;
  ```

### `getUnitInvitationsByUserId` [Confirmed]
- **Request Type**: `OSKUnitInvitationsGetByUserIdRequest`
  ```typescript
  buildingId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: `OSKUnitInvitation`
  ```typescript
  accessMethods?: OSKAccessMethod;
  buildingId: string;
  callForwarding?: string;
  confidentiality?: string;
  doors: OSKUserDoor[];
  firstName: string;
  invitees: OSKUnitInvitationInvitees[];
  inviterId: string;
  lastName: string;
  modificationDate?: any;
  unitId: string;
  ```

### `getUnitPerson` [Confirmed]
- **Request Type**: `OSKUnitManagementPeopleRequest`
  ```typescript
  buildingId: string;
  callType: OSKUnitRequestType;
  emailOrPhone?: string;
  targetUserId?: string;
  unitId: string;
  userId: string;
  value?: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

### `removeInhabitantFromUnit` [Confirmed]
- **Request Type**: `OSKUnitManagementRemoveInhabitantRequest`
  ```typescript
  buildingId: string;
  inhabitantToRemoveId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

### `removePendingInvitation` [Confirmed]
- **Request Type**: `OSKUnitManagementRemovePendingInvitationRequest`
  ```typescript
  buildingId: string;
  emailOrPhone: "email" | "phone";
  inviterId: string;
  unitId: string;
  userId: string;
  value: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

### `removePermanentGuest` [Confirmed]
- **Request Type**: `OSKUnitManagementRemovePermanentGuestRequest`
  ```typescript
  buildingId: string;
  permanentGuestUserId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

### `updateInhabitant` [Confirmed]
- **Request Type**: `OSKUnitManagementChangeInhabitantRequest`
  ```typescript
  buildingId: string;
  inhabitantToChangeUserId: string;
  newInhabitantType?: OSKBuildingUnitInhabitantType;
  residentRights?: OSKResidentRights;
  unitId: string;
  userId: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains only the cross-cutting risk callouts.*

#### Mental Enforcement Tally
- **Inhabitant Updates & Removals**: Enforces that only inhabitants with the type `owner` or `tenant` can update or remove other inhabitants' profiles. [Confirmed]
- **Permanent Guest Updates**: Enforces that the caller must be an `owner`, `tenant`, or a `resident` with explicit rights to manage permanent guests (`residentRights.permanentGuests.manageable == true`). [Confirmed]
- **App Check Verification**: Enforced on select endpoints (e.g., `getUnitInvitationsByUserId`). [Confirmed]
- **RBAC Checks**: No global RBAC permission strings (such as `v1.org.residents.edit`) are checked directly within this module. [Confirmed]

#### Cross-Cutting Security Risks
- **Dual-Authorization Model Asymmetry**: The module relies entirely on local database lookups of inhabitant types (`owner`, `tenant`, `resident`) to enforce "Mon Foyer" household boundaries, rather than checking global RBAC permission strings. This creates a dual-authorization model: administrative actions in the Property Manager Portal (PGO) use RBAC (e.g., `v1.org.residents.create`), while mobile/household actions use local inhabitant types. Mismatches or synchronization issues between these two models could lead to privilege escalation or orphaned access. [Inferred]
- **Unattributed Security-Relevant Signals**: `OSKUnitManagementInhabitantService` raises custom business-logic permission errors (e.g., throwing `"Incorrect Caller: Caller must be an Owner or Tenant to change other"`) with no RBAC string behind them. There are zero direct RBAC checks (`v1.admin.*` or `v1.org.*`) evidenced within the `unit_management` module itself, despite performing highly sensitive operations like deleting accesses, deleting pincodes, and removing inhabitants. [Confirmed]
- **Inconsistent App Check Enforcement**: App Check is enforced on some endpoints (e.g., `getUnitInvitationsByUserId` in `OSKUnitManagementInvitationService`), but it is unknown if it is consistently applied across all write/delete endpoints (such as inhabitant removal or pincode deletion). [Unknown]

**Per-capability evidence:**

#### _module_root

### Security Checks & Decorators [Confirmed]
- The capability uses the `OSKUserSecurityChecks` decorator `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUserSecurityChecks|updateInhabitant||#1` `` and `OSKSecurityChecks.checkParameters` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKSecurityChecks.checkParameters|updateInhabitant|[...]|#1` `` to validate context, matching user IDs, and parameter types.

### Caller Role Validation [Confirmed]
- **Inhabitant Updates**: The capability enforces that only inhabitants with the type `owner` or `tenant` can update other inhabitants' profiles. If a lower-level inhabitant (e.g., `resident`) attempts to update another, a permission error is thrown and logged: `"Incorrect Caller: Caller must be an Owner or Tenant to change other"` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUnitManagementInhabitantService.logger.logError|updateInhabitant|'Incorrect Caller: Caller must be an Owner or Tenant to change other',...|#1` ``.
- **Inhabitant Removals**: Similarly, only `owner` or `tenant` inhabitants can remove other inhabitants from a unit `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|['owner', 'tenant'].includes|removeInhabitantFromUnit|requestingInhabitant.inhabitantType|#1` ``.
- **Permanent Guest Updates**: Validates that the caller is an `owner`, `tenant`, or a `resident` with explicit rights to manage permanent guests (`residentRights.permanentGuests.manageable == true`) `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts|invite.invitees.forEach|updateOrCreatePendingUnitInvitation|...|#1` ``.

### App Check Verification [Confirmed]
- Several endpoints enforce Firebase App Check verification. If App Check is missing, they log a precondition failure: `"Failed-precondition: The function must be called from an App Check verified app."` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_invitation.service.ts|OSKUnitManagementInvitationService.logger.logError|getUnitInvitationsByUserId|'Failed-precondition: The function must be called from an App Check verified app.'|#1` ``.

### RBAC Roles Cross-Check [Inferred]
- This capability relies on the caller's unit-level inhabitant type (`owner`, `tenant`, `resident`) retrieved from the building unit's inhabitants collection to enforce "Mon Foyer" household boundaries, rather than checking global RBAC permission strings (such as `v1.org.residents.edit`). This aligns with the "Delegated Authority Principle" described in the authority models document.

---

### 10. Cross-Module Relationships

The `unit_management` module maintains the following confirmed relationships with other modules in the repository:

#### Outbound Relationships (unit_management depends on X)
- **building** [Confirmed]: Imports types from `@oskey/building/door` and `@oskey/building/unit`. It calls the following methods:
  - `OSKBuildingController.get`
  - `OSKBuildingIntercomService.deleteIntercomEntryUser`
  - `OSKBuildingUnitInhabitantController` (`delete`, `get`, `getUnitInhabitants`, `update`, `getSafe`)
  - `OSKBuildingUnitNonAppUserController` (`get`, `getAll`)
  - `OSKBuildingUnitPermanentGuestController` (`getUnitPermanentGuests`, `create`, `get`, `update`, `delete`, `getSafe`)
  - `OSKNonAppUserPincodeController.getAll`
- **core** [Confirmed]: Imports types from `@oskey/core` and `@oskey/core/access`. It calls the following methods:
  - `OSKDocumentController` (`_create`, `_delete`, `_deleteAll`, `_get`, `_listDocuments`, `_query`, `_queryCollectionGroup`, `_removeFromArrayFieldByPredicate`, `_set`, `_update`)
  - `OSKAccessService` (`deleteAccessById`, `createAccess`, `updateAccess`)
  - `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash`
  - `OSKAccessUtilsDatesService.convertAccessRightToFirebaseTimestamp`
  - `OSKLoggingService` (`logError`, `logInfo`, `logWarning`)
- **user** [Confirmed]: Imports types from `@oskey/user/access` and `@oskey/user/invitation`. It calls the following methods:
  - `OSKUserController` (`get`, `getByEmail`, `getSafe`, `queryOrCollection`)
  - `OSKUserInvitationExternalUserController` (`delete`, `get`)
  - `OSKUserPincodeController` (`delete`, `getByAccessId`, `getSpecificPincodesByQuery`)
  - `OSKUserInvitationExternalUnitService.createExternalUnitInvitation`
  - `OSKUserAccessesController.getPerBuilding`

#### Inbound Relationships (X depends on unit_management)
- **organization** [Confirmed]: Imports `OSKUnitManagementPendingInvitationsController` from `unit_management`. `OSKOrganizationResidentService` calls `OSKUnitManagementPendingInvitationsController.delete`.
- **user** [Confirmed]: Imports `OSKUnitInvitation` and `OSKUnitInvitationInvitees` from `@oskey/unit/management`. `OSKUserInvitationExternalUserService` calls `OSKUnitManagementCreationInvitationService.consumeUnitInvitationInvitee` and `OSKUnitManagementCreationOskeyUserInvitationService.createPermanentGuest`.

### 11. External Hooks

#### _module_root

- No direct external hooks (such as Pub/Sub publishers, HTTP client calls, or environment variables) are explicitly evidenced in this capability pack, except for standard Firebase callable functions. [Confirmed]

---

### 12. Architectural Observations

- **Orchestration Service Pattern**: The `unit_management` module acts as a pure logical relationship orchestrator. It does not directly write to core building or user collections; instead, it calls controllers and services in `building`, `user`, and `core` to perform mutations (e.g., deleting pincodes, updating inhabitants, creating accesses). This maintains a clean separation where `unit_management` owns the business logic of "Mon Foyer" (household) relationships, while the target modules own their respective data schemas. [Confirmed]
- **High Coupling**: The module is highly coupled to `building`, `core`, and `user` modules, as evidenced by the high touchpoint counts (17, 18, and 22 respectively) and extensive cross-module call edges. It relies on these modules to execute almost all of its side effects. [Confirmed]
- **Delegated Authority Principle**: The module strictly implements the Delegated Authority Principle. It checks the caller's inhabitant type (`owner`, `tenant`) before allowing modifications or removals of other inhabitants, ensuring lower-level inhabitants cannot perform administrative actions. [Confirmed]

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Absence of RBAC Checks**: There are no RBAC permission checks (e.g., `v1.org.residents.edit`) enforced directly within the `unit_management` module's code. Instead, it relies entirely on local database lookups of inhabitant types (`owner`, `tenant`). If an administrative user (e.g., a Property Manager with `v1.org.residents.edit`) needs to perform these actions, they must route through other modules (like `organization`) which then call into `unit_management` bypass-style, or the system must map their administrative identity to a virtual inhabitant type. This dual-path authorization model is a significant architectural risk. [Inferred]
- **Auth0 Integration**: How is the Auth0 identity linking coordinated when a pending unit invitation is consumed? Is it handled entirely on the client side, or is there a background trigger not captured in this capability pack? [Unknown]
- **Decorator Implementation**: How is `OSKUserSecurityChecks` implemented under the hood? (The decorator is imported from `../../../decorators/securityChecks` which is outside this module's boundary). [Unknown]
- **App Check Consistency**: It is unknown whether App Check verification is consistently enforced across all state-modifying endpoints (such as inhabitant removal or pincode deletion), as it is only explicitly evidenced in `OSKUnitManagementInvitationService` (e.g., `getUnitInvitationsByUserId`). [Unknown]

**Per-capability open questions:**

#### _module_root

- **Auth0 Integration**: How is the Auth0 identity linking coordinated when a pending unit invitation is consumed? Is it handled entirely on the client side, or is there a background trigger not captured in this capability pack? [Unknown]
- **Decorator Implementation**: How is `OSKUserSecurityChecks` implemented under the hood? (The decorator is imported from `../../../decorators/securityChecks` which is outside this module's boundary). [Unknown]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.