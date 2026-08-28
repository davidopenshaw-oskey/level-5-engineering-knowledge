## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.538Z
- **repoName**: firebase-oskey-dev
- **targetModule**: unit_management
- **capability**: _module_root
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `_module_root` capability of the `unit_management` module manages residential unit-level relationships, including onboarding, updating, and offboarding inhabitants (owners, tenants, residents) and permanent guests, as well as managing pending unit invitations and access credentials. [Confirmed]

---

## 2. Primary Responsibilities

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

## 3. Public Interfaces (Controllers & Entry Points)

### Controllers [Confirmed]
- **`OSKUnitManagementPendingInvitationsController`** `` `functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts` (lines 9-144) ``: Extends `OSKDocumentController` to manage pending unit invitations under `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations`.

### Services [Confirmed]
- **`OSKUnitManagementInhabitantService`** `` `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (lines 61-815) ``: Handles inhabitant updates, removals, lookups, and pending invitation removals.
- **`OSKUnitManagementCreationInvitationService`** `` `functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts` (lines 28-283) ``: Orchestrates unit invitation creation and pending invitation updates.
- **`OSKUnitManagementCreationOskeyUserInvitationService`** `` `functions/src/modules/unit_management/services/unit_management_invitation_creation_oskeyuser.service.ts` (lines 34-222) ``: Processes invitees who are already registered Oskey users, including creating permanent guest records and adding inhabitants.
- **`OSKUnitManagementInvitationService`** `` `functions/src/modules/unit_management/services/unit_management_invitation.service.ts` (lines 23-102) ``: Retrieves unit invitations by user ID.
- **`OSKUnitManagementPermanentGuestService`** `` `functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts` (lines 38-348) ``: Manages permanent guest lookups, updates, and removals.

---

## 4. API Contracts & Firestore Triggers

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

## 5. Data Ownership

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

## 6. Outbound Coupling

### Cross-Module Coupling [Confirmed]
This capability depends on the following external modules:

#### `core` Module
- `@oskey/core` `` `imports_dependency|unit_management|functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts|@oskey/core|#1` ``
- `@oskey/core/access` `` `imports_dependency|unit_management|functions/src/modules/unit_management/models/documents/unit_management_invitation_document.ts|@oskey/core/access|#1` ``
- `@oskey/core/logger` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|@oskey/core/logger|#1` ``
- `../../core/controllers/document.controller` `` `imports_dependency|unit_management|functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts|../../core/controllers/document.controller|#1` ``

#### `building` Module
- `@oskey/building` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|@oskey/building|#1` ``
- `@oskey/building/door` `` `imports_dependency|unit_management|functions/src/modules/unit_management/models/documents/unit_management_invitation_document.ts|@oskey/building/door|#1` ``
- `@oskey/building/unit` `` `imports_dependency|unit_management|functions/src/modules/unit_management/models/documents/unit_management_invitation_document.ts|@oskey/building/unit|#1` ``
- `@oskey/building/intercom` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|@oskey/building/intercom|#1` ``
- `../../building/modules/building_unit/modules/building_unit_nonAppUser` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|../../building/modules/building_unit/modules/building_unit_nonAppUser|#1` ``

#### `user` Module
- `@oskey/user` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|@oskey/user|#1` ``
- `@oskey/user/access` `` `imports_dependency|unit_management|functions/src/modules/unit_management/models/documents/unit_management_invitation_document.ts|@oskey/user/access|#1` ``
- `@oskey/user/invitation` `` `imports_dependency|unit_management|functions/src/modules/unit_management/models/documents/unit_management_invitation_document.ts|@oskey/user/invitation|#1` ``
- `@oskey/user/pincode` `` `imports_dependency|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|@oskey/user/pincode|#1` ``
- `../../user/modules/user_invitation/controllers/user_invitation_external_user.controller` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|../../user/modules/user_invitation/controllers/user_invitation_external_user.controller|#1` ``
- `../../user/modules/user_access/models/documents/user_accesses_document.model` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts|../../user/modules/user_access/models/documents/user_accesses_document.model|#1` ``

### Intra-Module Coupling [Confirmed]
This capability depends on internal files and submodules of the `unit_management` module:
- `./services/unit_management_inhabitant.service` `` `imports_dependency|unit_management|functions/src/modules/unit_management/index.ts|./services/unit_management_inhabitant.service|#1` ``
- `./services/unit_management_invitation_creation.service` `` `imports_dependency|unit_management|functions/src/modules/unit_management/index.ts|./services/unit_management_invitation_creation.service|#1` ``
- `./services/unit_management_invitation.service` `` `imports_dependency|unit_management|functions/src/modules/unit_management/index.ts|./services/unit_management_invitation.service|#1` ``
- `./services/unit_management_permanent_guest.service` `` `imports_dependency|unit_management|functions/src/modules/unit_management/index.ts|./services/unit_management_permanent_guest.service|#1` ``
- `../controllers/unit_pending_invitations.controller` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|../controllers/unit_pending_invitations.controller|#1` ``
- `../models/documents/unit_management_invitation_document` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|../models/documents/unit_management_invitation_document|#1` ``
- `../models/functions/unit_management_inhabitant_request_document` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|../models/functions/unit_management_inhabitant_request_document|#1` ``
- `../models/functions/unit_management_inhabitant_response_document` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|../models/functions/unit_management_inhabitant_response_document|#1` ``
- `../models/functions/unit_management_permanent_guest_request_document` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|../models/functions/unit_management_permanent_guest_request_document|#1` ``
- `./unit_management_permanent_guest.service` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|./unit_management_permanent_guest.service|#1` ``
- `./unit_management_invitation_creation_oskeyuser.service` `` `imports_dependency|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts|./unit_management_invitation_creation_oskeyuser.service|#1` ``

---

## 7. Permissions & Security

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

## 8. External Hooks
- No direct external hooks (such as Pub/Sub publishers, HTTP client calls, or environment variables) are explicitly evidenced in this capability pack, except for standard Firebase callable functions. [Confirmed]

---

## 9. Open Questions
- **Auth0 Integration**: How is the Auth0 identity linking coordinated when a pending unit invitation is consumed? Is it handled entirely on the client side, or is there a background trigger not captured in this capability pack? [Unknown]
- **Decorator Implementation**: How is `OSKUserSecurityChecks` implemented under the hood? (The decorator is imported from `../../../decorators/securityChecks` which is outside this module's boundary). [Unknown]