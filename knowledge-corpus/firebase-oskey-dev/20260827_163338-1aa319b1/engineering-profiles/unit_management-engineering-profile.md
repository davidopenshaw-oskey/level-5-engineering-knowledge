### 0. Generation Metadata

- **runId**: `20260827_163338-1aa319b1`
- **generatedAt**: `2026-08-27T16:41:42.791Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `unit_management`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `unit_management` module provides the resident-facing administrative controls required to manage a residential unit's occupants, permanent guests, and pending invitations. It implements the "Mon Foyer" (My Home) workflows, empowering ResidentAdmins (Owners and Tenants) to self-govern their units. The module coordinates the invitation of new inhabitants, role updates, unit directory retrieval, and the secure revocation of access—including the downstream cleanup of pincodes, accesses, and intercom entries across the platform. **Confirmed**.

### 2. Architectural Position

Within the Oskey Access Platform, `unit_management` sits as a resident-facing orchestration layer positioned between the identity-focused `user` module, the physical-hardware-focused `building` module, and the authorization-focused `core` module. **Confirmed**.
- **Parent Scope**: Unit Scope (the individual apartment or commercial space). **Confirmed**.
- **Owned Concepts**: Unit-level pending invitations (`pendingUnitInvitations`). **Confirmed**.
- **Provided Capabilities**: Resident-driven unit administration, co-inhabitant management, permanent guest scheduling, and invitation lifecycle management. **Confirmed**.

### 3. Primary Responsibilities

#### _module_root

This capability is responsible for the following distinct features:

- **Unit Invitation Creation**: Validates and creates invitations for new unit inhabitants or permanent guests, registering pending invitations and delegating external invitation creation to the user invitation system. **Confirmed** `api_contract|unit_management|functions/src/modules/unit_management/index.ts|createUnitInvitation|#1`.
- **Unit Directory Retrieval**: Aggregates and returns a comprehensive list of all active inhabitants, permanent guests, non-app users, and pending invitations associated with a specific building unit. **Confirmed** `api_contract|unit_management|functions/src/modules/unit_management/index.ts|getAllUnitInhabitantsAndGuests|#1`.
- **Inhabitant Role Modification**: Allows authorized unit managers (Owners or Tenants) to update the inhabitant type or resident rights of another occupant within the same unit. **Confirmed** `api_contract|unit_management|functions/src/modules/unit_management/index.ts|updateInhabitant|#1`.
- **Inhabitant Revocation & Cleanup**: Removes an inhabitant from a unit and orchestrates the deletion of their associated building and user pincodes, physical access permissions, and intercom directory entries. **Confirmed** `api_contract|unit_management|functions/src/modules/unit_management/index.ts|removeInhabitantFromUnit|#1`.
- **Permanent Guest Revocation**: Removes a permanent guest from a unit and orchestrates the deletion of their associated building pincodes, user pincodes, and physical access permissions. **Confirmed** `api_contract|unit_management|functions/src/modules/unit_management/index.ts|removePermanentGuest|#1`.
- **Pending Invitation Revocation**: Cancels a pending unit invitation, consuming the invitee from the unit's pending list and deleting the associated external user invitation document. **Confirmed** `api_contract|unit_management|functions/src/modules/unit_management/index.ts|removePendingInvitation|#1`.
- **Pending Invitation State Management**: Provides low-level CRUD operations on the unit's pending invitations subcollection. **Confirmed** `source_class|unit_management|functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts|OSKUnitManagementPendingInvitationsController`.

---

### 4. Public Interfaces

#### _module_root

This capability exposes the following public entry points and service interfaces:

- **OSKUnitManagementPendingInvitationsController** (extends `OSKDocumentController`): Manages the persistence and state of pending unit invitations within the `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations` subcollection. **Confirmed** `source_class|unit_management|functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts|OSKUnitManagementPendingInvitationsController`.
- **OSKUnitManagementInhabitantService**: The primary domain service orchestrating unit inhabitant retrieval, updates, and removals. **Confirmed** `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUnitManagementInhabitantService`.
- **OSKUnitManagementCreationInvitationService**: Handles the business logic for creating unit invitations and managing pending invitation records. **Confirmed** `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts|OSKUnitManagementCreationInvitationService`.
- **OSKUnitManagementCreationOskeyUserInvitationService**: Manages the acceptance and processing of invitations for existing Oskey users, including adding them as inhabitants or permanent guests. **Confirmed** `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation_oskeyuser.service.ts|OSKUnitManagementCreationOskeyUserInvitationService`.
- **OSKUnitManagementInvitationService**: Retrieves pending unit invitations for a specific user. **Confirmed** `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_invitation.service.ts|OSKUnitManagementInvitationService`.
- **OSKUnitManagementPermanentGuestService**: Manages the retrieval, update, and removal of permanent guests. **Confirmed** `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts|OSKUnitManagementPermanentGuestService`.

---

### 5. Internal Structure

- **Intra-Module Coupling Note**: The deterministic intra-module coupling graph indicates that `unit_management` contains no internal submodules (`submoduleCount: 0`). All capabilities, services, and controllers are organized directly under the module root (`_module_root`). Consequently, there is no internal cross-submodule coupling to report. **Confirmed**.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

- **Data Ownership Conclusion**: The `unit_management` module is the authoritative owner of the unit-level pending invitation state, specifically managing documents under the `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations/{userId}` path. **Confirmed**. However, it does not own the primary resident or permanent guest collections (which are owned by the `building` module). Instead, `unit_management` acts as an orchestrator that performs indirect modifications (deletions and updates) on other modules' collections—including `/users/{userId}/pincodes`, `/buildings/{buildingId}/pincodes`, `/buildings/{buildingId}/units/{unitId}/inhabitants`, `/buildings/{buildingId}/units/{unitId}/permanentGuests`, `/buildings/{buildingId}/intercoms`, and `/users/{userId}/accesses`—to ensure platform-wide consistency during resident onboarding and offboarding. **Inferred**.

**Per-capability evidence:**

#### _module_root

### Firestore Paths
This capability directly owns and manages documents within the following Firestore path:

- **`/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations/{userId}`**
  - **Operations**: Read, Write, Delete.
  - **Detection Scope**: Scoped to the `OSKUnitManagementPendingInvitationsController` which performs `_get`, `_create`, `_set`, `_update`, `_delete`, and `_query` operations. **Confirmed** `functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts` (lines 16-87).

### Indirect Data Modifications
This capability performs indirect modifications (deletions and updates) on other modules' collections via their respective controllers and services:
- **`/users/{userId}/pincodes/{pincodeId}`** and **`/buildings/{buildingId}/pincodes/{pincodeId}`**: Deleted during inhabitant and permanent guest removal. **Confirmed** `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (lines 254-264) and `functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts` (lines 215-234).
- **`/buildings/{buildingId}/units/{unitId}/inhabitants/{userId}`**: Deleted during inhabitant removal. **Confirmed** `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (line 271).
- **`/buildings/{buildingId}/units/{unitId}/permanentGuests/{userId}`**: Deleted during permanent guest removal. **Confirmed** `functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts` (line 241).
- **`/buildings/{buildingId}/intercoms/{intercomId}`**: Intercom entries are updated/cleaned up during inhabitant removal. **Confirmed** `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (line 281).
- **`/users/{userId}/accesses/{accessId}`**: Deleted during inhabitant and permanent guest removal. **Confirmed** `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (line 244) and `functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts` (line 214).

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable Cloud Functions
The following callable APIs are exposed by this capability:

- **`createUnitInvitation`**: Creates a new unit invitation.
- **`getAllUnitInhabitantsAndGuests`**: Retrieves all inhabitants, permanent guests, non-app users, and pending invitations for a unit.
- **`getPermanentGuest`**: Retrieves details of a specific permanent guest.
- **`getSingleUnitInhabitant`**: Retrieves details of a specific unit inhabitant.
- **`getUnitInvitationsByUserId`**: Retrieves unit invitations for a user.
- **`getUnitPerson`**: Retrieves details of a specific unit person (inhabitant, permanent guest, non-app user, or pending invitee).
- **`removeInhabitantFromUnit`**: Removes an inhabitant from a unit.
- **`removePendingInvitation`**: Cancels a pending unit invitation.
- **`removePermanentGuest`**: Removes a permanent guest from a unit.
- **`updateInhabitant`**: Updates an inhabitant's role or rights.

### Resolved API Request/Response Schemas

#### `createUnitInvitation`
- **Request Type (`OSKUnitInvitation`)**:
  ```typescript
  {
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
  }
  ```
- **Response Type (`OSKUnitInvitationCreationResponse`)**:
  ```typescript
  {
    accessId?: string | null;
    recordKey?: string;
    status?: string;
  }
  ```

#### `getAllUnitInhabitantsAndGuests`
- **Request Type (`OSKUnitManagementGetUnitInhabitantsRequest`)**:
  ```typescript
  {
    buildingId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type (`OSKInhabitantsAndGuestsListResponse`)**:
  ```typescript
  {
    firstName: string;
    inhabitantsAndPermGuests: OSKInhabitantsAndGuestsList[];
    inhabitantType: OSKBuildingUnitInhabitantType;
    lastName: string;
    nonAppUsers: OSKNonAppUsersList[];
    pendingInvites: OSKPendingInvitesList[];
    userAccessType: OSKUserAccessType.InhabitantUser;
    userId: string;
  }
  ```

#### `getPermanentGuest`
- **Request Type (`OSKUnitManagementGetPermanentGuestRequest`)**:
  ```typescript
  {
    buildingId: string;
    permanentGuestUserId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type (`OSKUnitManagementGetPermanentGuestResponse`)**:
  ```typescript
  {
    email: string;
    firstName: string;
    inviterId: string;
    lastName: string;
    phoneNumber: OSKPhoneNumber;
    pincodes: OSKUserPincodeDocument[];
    userAccessType: OSKUserAccessType.InhabitantPermanentGuestUser;
    userId: string;
  }
  ```

#### `getSingleUnitInhabitant`
- **Request Type (`OSKUnitManagementGetSingleUnitInhabitantRequest`)**:
  ```typescript
  {
    buildingId: string;
    inhabitantUserId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type (`OSKSingleUnitInhabitantResponse`)**:
  ```typescript
  {
    email: string;
    firstName: string;
    inhabitantType: OSKBuildingUnitInhabitantType;
    inviterId: string;
    lastName: string;
    phoneNumber: OSKPhoneNumber;
    pincodes: OSKUserPincodeDocument[];
    userAccessType: OSKUserAccessType.InhabitantUser;
    userId: string;
  }
  ```

#### `getUnitInvitationsByUserId`
- **Request Type (`OSKUnitInvitationsGetByUserIdRequest`)**:
  ```typescript
  {
    buildingId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type (`OSKUnitInvitation`)**:
  *(Same as `createUnitInvitation` request type)*

#### `getUnitPerson`
- **Request Type (`OSKUnitManagementPeopleRequest`)**:
  ```typescript
  {
    buildingId: string;
    callType: OSKUnitRequestType;
    emailOrPhone?: string;
    targetUserId?: string;
    unitId: string;
    userId: string;
    value?: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

#### `removeInhabitantFromUnit`
- **Request Type (`OSKUnitManagementRemoveInhabitantRequest`)**:
  ```typescript
  {
    buildingId: string;
    inhabitantToRemoveId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

#### `removePendingInvitation`
- **Request Type (`OSKUnitManagementRemovePendingInvitationRequest`)**:
  ```typescript
  {
    buildingId: string;
    emailOrPhone: "email" | "phone";
    inviterId: string;
    unitId: string;
    userId: string;
    value: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

#### `removePermanentGuest`
- **Request Type (`OSKUnitManagementRemovePermanentGuestRequest`)**:
  ```typescript
  {
    buildingId: string;
    permanentGuestUserId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

#### `updateInhabitant`
- **Request Type (`OSKUnitManagementChangeInhabitantRequest`)**:
  ```typescript
  {
    buildingId: string;
    inhabitantToChangeUserId: string;
    newInhabitantType?: OSKBuildingUnitInhabitantType;
    residentRights?: OSKResidentRights;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

### Firestore Triggers
No Firestore triggers are owned or defined by this capability. **Confirmed** based on the absence of `firestore_trigger` facts in the evidence pack.

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

- **Cross-Cutting Security Callouts**: 
  - **Enforcement Mechanism**: Security is enforced at the resident and unit level using the `OSKUserSecurityChecks` decorator rather than administrative RBAC permission strings. This decorator validates that the calling user is authenticated and authorized to manage the specified unit. **Confirmed**.
  - **Residential Authority Chain**: The module strictly enforces the *Standard Residential Authority Chain* by verifying that only active `owner` or `tenant` ResidentAdmins can modify co-occupants, invite permanent guests, or revoke unit-level access. **Confirmed**.
  - **Mental Enforcement Tally**: All primary service methods within this module enforce unit-level security checks. No administrative RBAC permissions (e.g., `v1.admin.*` or `v1.org.*`) are referenced in the code, which is appropriate for a resident-facing self-service module. **Confirmed**.
  - **Unattributed Security Signals**: The `OSKUserSecurityChecks` decorator is imported from `../../../decorators/securityChecks`. The exact internal resolution logic of this decorator is not defined within this module, representing a delegated security boundary. **Confirmed**.

**Per-capability evidence:**

#### _module_root

### Security Enforcement
This capability enforces security at the resident and unit level rather than relying on administrative RBAC permission strings:

- **`OSKUserSecurityChecks` Decorator**: Applied to all primary service methods to verify that the calling user is authenticated and authorized to manage the specified unit. **Confirmed** `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (line 32).
- **Resident Role Verification**:
  - In `updateInhabitant`, the system explicitly checks that the caller is an `owner` or `tenant` before allowing modifications to other occupants. **Confirmed** `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (lines 109-110).
  - In `removeInhabitantFromUnit`, `removePendingInvitation`, and `removePermanentGuest`, the system performs permission checks to ensure the caller has the authority to delete the target occupant or invitation. **Confirmed** `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (line 237, line 367) and `functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts` (line 208).

### RBAC Cross-Check
No administrative RBAC permission strings (e.g., `v1.admin.*` or `v1.org.*`) are referenced in this capability's code. This is **Confirmed** and aligned with the *Standard Residential Authority Chain* defined in the "Oskey Personas and Authority models" document, where ResidentAdmins self-govern their "Mon Foyer" (My Home) unit settings.

---

### 10. Cross-Module Relationships

Based on the deterministic Cross-Module Dependency Graph and resolved method-level call edges, the following relationships are established:

- **Outbound Dependencies (Confirmed)**:
  - **`building`**: Imports types (`OSKUserDoor`, `OSKBuildingUnitInhabitantType`, `OSKResidentRights`) and calls methods on `OSKBuildingController` (get), `OSKBuildingIntercomService` (deleteIntercomEntryUser), `OSKBuildingUnitInhabitantController` (delete, get, getUnitInhabitants, update, getSafe), `OSKBuildingUnitNonAppUserController` (get, getAll), `OSKBuildingUnitPermanentGuestController` (getUnitPermanentGuests, create, get, update, delete, getSafe), `OSKNonAppUserPincodeController` (getAll), and `OSKBuildingUnitController` (get).
  - **`core`**: Imports types (`OSKAccessMethod`, `OSKAccessRightWithDates`) and calls methods on `OSKDocumentController` (CRUD and query operations), `OSKAccessService` (deleteAccessById, createAccess, updateAccess), `OSKPincodeService` (deleteBuildingPincodeAndMoveToTrash), `OSKLoggingService` (logError, logInfo, logWarning), and `OSKAccessUtilsDatesService` (convertAccessRightToFirebaseTimestamp).
  - **`user`**: Imports types (`OSKUserAccessType`, `OSKInvitee`) and calls methods on `OSKUserController` (get, getByEmail, getSafe, queryOrCollection), `OSKUserInvitationExternalUserController` (delete, get), `OSKUserPincodeController` (delete, getByAccessId, getSpecificPincodesByQuery), `OSKUserInvitationExternalUnitService` (createExternalUnitInvitation), and `OSKUserAccessesController` (getPerBuilding).

- **Inbound Dependencies (Confirmed)**:
  - **`organization`**: The `organization_residents` service calls `OSKUnitManagementPendingInvitationsController.delete` to clean up pending invitations when a resident is administratively removed.
  - **`user`**: The `user_invitation` service calls `OSKUnitManagementCreationInvitationService.consumeUnitInvitationInvitee` and `OSKUnitManagementCreationOskeyUserInvitationService.createPermanentGuest` during the invitation acceptance and onboarding flows.

### 11. External Hooks

#### _module_root

No external hooks, Pub/Sub topics, environment variables, or external storage paths are directly defined or referenced within this capability's evidence pack. **Confirmed** based on the absence of such facts in the evidence pack.

---

### 12. Architectural Observations

- **Orchestration Service Pattern**: `unit_management` functions primarily as an Orchestration Service. It owns minimal persistent data of its own (only pending invitations) but coordinates complex, multi-module transactional workflows. For example, removing an inhabitant requires orchestrating calls to `core` (access deletion), `building` (inhabitant and intercom removal), and `user` (pincode deletion). **Confirmed**.
- **Decoupled Invitation Consumption**: The module integrates cleanly with the `user` module's invitation flow. By exposing consumption callbacks (`consumeUnitInvitationInvitee`), it allows the platform to transition a user from a pending invitation state to an active unit inhabitant without tightly coupling the user registration logic to unit-specific business rules. **Confirmed**.
- **Asymmetric Coupling**: The module exhibits high outbound coupling to `building`, `user`, and `core`, reflecting its role as a coordinator of physical and logical access. Conversely, inbound coupling is low and restricted to lifecycle events (onboarding and administrative cleanup). **Confirmed**.

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Cascade Deletion Integrity**: The cleanup of pincodes, accesses, and intercom entries across `core`, `building`, and `user` modules is performed imperatively in service code rather than via transactional database triggers. If a failure occurs mid-execution, it could leave orphaned access credentials or stale intercom entries, posing a potential physical security risk. **Inferred**.
- **Delegated Security Resolution**: The module relies entirely on the `OSKUserSecurityChecks` decorator to prevent unauthorized users from managing unit occupants. If this decorator fails to properly validate the relationship between the authenticated user (`request.auth.uid`) and the target `unitId`, unauthorized users could potentially evict residents or grant access. The internal enforcement logic of this decorator remains an open question. **Inferred**.
- **Asynchronous Notification Disconnect**: While the architecture documentation states that creating an invitation triggers automated email/SMS notifications, the code in `unit_management` only writes database records and calls `OSKUserInvitationExternalUnitService`. The actual dispatch mechanism (e.g., whether it relies on Firestore triggers in the `user` module) is unconfirmed within this module's boundaries. **Inferred**.
- **Response Schema for `getUnitPerson`**: The exact response schema for the `getUnitPerson` callable function is unknown, as no matching `model_property` facts resolved for its response type in the evidence pack. **Unknown**.

**Per-capability open questions:**

#### _module_root

- **Security Decorator Implementation**: How does the `OSKUserSecurityChecks` decorator (imported from `../../../decorators/securityChecks`) internally resolve and validate unit-level permissions against the authenticated user's context?
- **Notification Dispatch**: The architecture documentation states that creating an invitation triggers automated email invitations. However, the code in this capability only shows the creation of database records and calls to `OSKUserInvitationExternalUnitService`. Is the actual dispatch of emails/SMS handled asynchronously via Firestore triggers in the `user_invitation` module, or is it missing from this capability's execution path?
- **Response Schema for `getUnitPerson`**: What is the exact response schema for the `getUnitPerson` callable function, as no matching `model_property` facts resolved for its response type in the evidence pack?

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.