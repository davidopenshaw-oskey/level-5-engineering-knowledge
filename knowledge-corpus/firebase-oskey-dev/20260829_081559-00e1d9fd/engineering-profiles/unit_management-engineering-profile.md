### 0. Generation Metadata

- **runId**: `20260829_081559-00e1d9fd`
- **generatedAt**: `2026-08-29T13:37:19.298Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `unit_management`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `unit_management` module provides the core business logic, orchestration services, and API endpoints required to manage residential unit-level relationships within the Oskey platform (**Confirmed**). It acts as the primary administrative and residential gateway for managing unit inhabitants, permanent guests, and pending invitations (**Confirmed**). By coordinating actions across user profiles and physical building structures, the module ensures that residential access rights are provisioned, updated, and revoked securely according to the platform's relationship models (**Confirmed**).

### 2. Architectural Position

The `unit_management` module occupies a critical middle-tier orchestration position within the Oskey platform, bridging the logical identity domain (managed by the `user` module) with the physical real estate hierarchy (managed by the `building` module) (**Inferred**). 
- **Parent Scope**: It operates at the Building and Unit level of the core domain hierarchy (**Inferred**).
- **Owned Concepts**: It directly owns the lifecycle and persistence of pending unit invitations (**Confirmed**).
- **Provided Capabilities**: It provides the transactional logic required to invite co-inhabitants, register permanent guests, update resident roles, and securely offboard users from a physical unit (**Confirmed**).

### 3. Primary Responsibilities

#### _module_root

#### Unit Invitation Creation
- Orchestrates the creation of unit invitations for new inhabitants or guests, validating the inviter's identity and permissions before writing pending invitations or creating external unit invitations `` `service_method|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts|OSKUnitManagementCreationInvitationService|createUnitInvitation|#1` `` (**Confirmed**).
- Resolves whether an invited contact already exists as an Oskey user by checking their email or phone number, allowing automated matching `` `service_method|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts|OSKUnitManagementCreationInvitationService|findUserByInvite|#1` `` (**Confirmed**).
- Automatically provisions access and adds inhabitants to the building unit if the user already exists `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation_oskeyuser.service.ts|OSKBuildingUnitInhabitantService.addInhabitant|processInvitee|buildingUnitDoc,accessRights|#1` `` (**Confirmed**).

#### Inhabitant & Guest Retrieval
- Retrieves a comprehensive list of all unit inhabitants, permanent guests, non-app users, and pending invites for a given building and unit `` `service_method|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUnitManagementInhabitantService|getAllUnitInhabitantsAndGuests|#1` `` (**Confirmed**).
- Fetches detailed profile, access, and pincode data for a single unit inhabitant `` `service_method|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUnitManagementInhabitantService|getSingleUnitInhabitant|#1` `` (**Confirmed**).
- Resolves individual unit persons by their specific request type (e.g., inhabitant user, permanent guest, non-app user, or pending invitation) to return unified profile and pincode details `` `service_method|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUnitManagementInhabitantService|getUnitPerson|#1` `` (**Confirmed**).

#### Inhabitant Modification & Removal
- Allows authorized unit administrators (owners or tenants) to update inhabitant types and resident rights within a unit `` `service_method|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUnitManagementInhabitantService|updateInhabitant|#1` `` (**Confirmed**).
- Handles the complete offboarding and deletion of an inhabitant from a unit, which includes deleting their building unit inhabitant document, removing their intercom directory entry, deleting their associated access permissions, and moving their active pincodes to the trash `` `functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts` (lines 240-288) `` (**Confirmed**).

#### Permanent Guest Management
- Manages the lifecycle of permanent guests, including retrieving their profile and pincode details `` `service_method|unit_management|functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts|OSKUnitManagementPermanentGuestService|getPermanentGuest|#1` `` (**Confirmed**).
- Updates permanent guest access validity dates and synchronizes these changes with the core access service `` `functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts` (lines 120-156) `` (**Confirmed**).
- Removes permanent guests, cleaning up their permanent guest document, associated access permissions, and active pincodes `` `functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts` (lines 210-248) `` (**Confirmed**).

#### Pending Invitation Management
- Manages pending unit invitations via a dedicated document controller, allowing creation, deletion, updates, and queries on pending invitees `` `source_class|unit_management|functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts|OSKUnitManagementPendingInvitationsController` `` (**Confirmed**).
- Supports consuming or removing pending invitations when an invitee is offboarded or manually cancelled `` `service_method|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUnitManagementInhabitantService|removePendingInvitation|#1` `` (**Confirmed**).

---

### 4. Public Interfaces

#### _module_root

#### Controllers
- **`OSKUnitManagementPendingInvitationsController`** `` `source_class|unit_management|functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts|OSKUnitManagementPendingInvitationsController` `` (**Confirmed**):
  - Extends `OSKDocumentController` to manage documents in the `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations` collection.
  - Exposes methods: `get`, `getAll`, `create`, `save`, `update`, `delete`, `deleteAll`, `queryPendingInvitations`, `listDocuments`, `getUnitPendingInvitations`, and `consumeInvitee`.

#### Exported Services
- **`OSKUnitManagementInhabitantService`** `` `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUnitManagementInhabitantService` `` (**Confirmed**):
  - Primary service orchestrating inhabitant retrieval, updates, offboarding, and pending invitation removal.
- **`OSKUnitManagementCreationInvitationService`** `` `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts|OSKUnitManagementCreationInvitationService` `` (**Confirmed**):
  - Handles the business logic for creating unit invitations and managing pending invitation documents.
- **`OSKUnitManagementCreationOskeyUserInvitationService`** `` `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation_oskeyuser.service.ts|OSKUnitManagementCreationOskeyUserInvitationService` `` (**Confirmed**):
  - Specialized service that processes invitations for existing Oskey users, automatically adding them as inhabitants or permanent guests.
- **`OSKUnitManagementInvitationService`** `` `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_invitation.service.ts|OSKUnitManagementInvitationService` `` (**Confirmed**):
  - Retrieves unit invitations associated with a user.
- **`OSKUnitManagementPermanentGuestService`** `` `source_class|unit_management|functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts|OSKUnitManagementPermanentGuestService` `` (**Confirmed**):
  - Manages permanent guest retrieval, updates, and offboarding.

---

### 5. Internal Structure

The deterministic Intra-Module Coupling Graph confirms that the `unit_management` module contains no internal submodules (`"submoduleCount": 0`) (**Confirmed**). All capabilities, services, and controllers are organized directly under the module root (`_module_root`) (**Confirmed**). Consequently, there is no internal cross-submodule coupling to report (**Confirmed**).

### 6. Firestore & Data Ownership

**Ownership conclusion:**

Based on the provided data ownership extracts and deterministic call graphs, the module's data ownership boundaries are resolved as follows:
- **Definitive Ownership**: The `unit_management` module is the sole owner of the **`/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations`** subcollection (**Confirmed**). This collection is managed directly by the `OSKUnitManagementPendingInvitationsController` (**Confirmed**). Although the external `organization` module calls this controller's `delete` method during resident cleanup workflows, the controller and schema definitions reside entirely within `unit_management` (**Confirmed**).
- **Orchestrated Access (Non-Owned)**: For all other touched collections—including `/buildings/.../inhabitants`, `/buildings/.../permanentGuests`, `/buildings/.../nonAppUsers`, `/users`, `/users/.../pincodes`, and `/users/.../accesses`—the module acts strictly as an orchestrator (**Inferred**). It modifies these paths indirectly by calling dedicated controllers owned by the `building`, `user`, and `core` modules, preserving strict boundary isolation (**Confirmed**).

**Per-capability evidence:**

#### _module_root

#### Firestore Collections Managed Directly
- **`/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations`** (**Confirmed**):
  - This capability has full write, update, delete, and query ownership of documents in this subcollection via the `OSKUnitManagementPendingInvitationsController` `` `functions/src/modules/unit_management/controllers/unit_pending_invitations.controller.ts` (lines 16-87) ``.

#### Firestore Collections Accessed/Modified Indirectly
This capability interacts with several other collections owned by other modules via their respective controllers or services:
- **`/users`** (**Confirmed**):
  - Queried to find existing users by email or phone number `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts|OSKUserController.default.queryOrCollection|findUserByInvite|'/users',queryFilter|#1` ``.
- **`/buildings/{buildingId}/units/{unitId}/inhabitants`** (**Confirmed**):
  - Read, updated, and deleted via `OSKBuildingUnitInhabitantController` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKBuildingUnitInhabitantController.default.get|removeInhabitantFromUnit|request.buildingId,request.unitId,request.inhabitantToRemoveId|#1` ``.
- **`/buildings/{buildingId}/units/{unitId}/permanentGuests`** (**Confirmed**):
  - Read, created, updated, and deleted via `OSKBuildingUnitPermanentGuestController` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation_oskeyuser.service.ts|OSKBuildingUnitPermanentGuestController.default.create|createPermanentGuest|reqParams.buildingId,reqParams.unitId,userDoc.userId,{ ...permanentGuestDocument, ...permanentGuestDocumentPartial }|#1` ``.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers`** (**Confirmed**):
  - Read via `OSKBuildingUnitNonAppUserController` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKBuildingUnitNonAppUserController.default.getAll|getAllUnitInhabitantsAndGuests|request.buildingId,request.unitId|#1` ``.
- **`/users/{userId}/pincodes`** and **`/suppliers/{id}/staffMembers/{id}/pincodes`** (**Confirmed**):
  - Read and deleted via `OSKUserPincodeController` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUserPincodeController.default.delete|removeInhabitantFromUnit|pincodeDoc.pincode,request.inhabitantToRemoveId|#1` ``.
- **`/users/{userId}/accesses`** (**Confirmed**):
  - Created, updated, and deleted via `OSKAccessService` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts|OSKAccessService.deleteAccessById|removePermanentGuest|permanentGuest.userId,request.buildingId,permanentGuest.accessId|#1` ``.

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

#### Callable Cloud Functions
The capability exposes ten callable Cloud Functions as entry points for unit management operations `` `functions/src/modules/unit_management/index.ts` (lines 50-64) `` (**Confirmed**):

##### `createUnitInvitation`
- **Request Type**: `OSKUnitInvitation`
- **Response Type**: `OSKUnitInvitationCreationResponse`

##### `getAllUnitInhabitantsAndGuests`
- **Request Type**: `OSKUnitManagementGetUnitInhabitantsRequest`
- **Response Type**: `OSKInhabitantsAndGuestsListResponse`

##### `getPermanentGuest`
- **Request Type**: `OSKUnitManagementGetPermanentGuestRequest`
- **Response Type**: `OSKUnitManagementGetPermanentGuestResponse`

##### `getSingleUnitInhabitant`
- **Request Type**: `OSKUnitManagementGetSingleUnitInhabitantRequest`
- **Response Type**: `OSKSingleUnitInhabitantResponse`

##### `getUnitInvitationsByUserId`
- **Request Type**: `OSKUnitInvitationsGetByUserIdRequest`
- **Response Type**: `OSKUnitInvitation`

##### `getUnitPerson`
- **Request Type**: `OSKUnitManagementPeopleRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

##### `removeInhabitantFromUnit`
- **Request Type**: `OSKUnitManagementRemoveInhabitantRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

##### `removePendingInvitation`
- **Request Type**: `OSKUnitManagementRemovePendingInvitationRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

##### `removePermanentGuest`
- **Request Type**: `OSKUnitManagementRemovePermanentGuestRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

##### `updateInhabitant`
- **Request Type**: `OSKUnitManagementChangeInhabitantRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

#### Firestore Triggers
- No Firestore triggers are owned or defined by this capability's pack (**Confirmed**).

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

A cross-capability analysis of the `unit_management` module reveals a distinct security model characterized by application-layer authority delegation:
- **Enforcement Tally**: 
  - All primary service methods are decorated with `OSKUserSecurityChecks` to enforce active session authentication (**Confirmed**).
  - The `createUnitInvitation` method explicitly bypasses strict user ID matching (`{ checkUserIdMatch: false }`) to allow ResidentAdmins to invite external users who do not yet possess an Oskey system ID (**Confirmed**).
  - Administrative operations within the unit (removing inhabitants, removing permanent guests, and canceling pending invitations) are restricted via hardcoded application-layer checks ensuring the requesting user's `inhabitantType` is either `'owner'` or `'tenant'` (**Confirmed**).
- **Cross-Cutting Risk Callouts**:
  - **Asymmetric Authorization**: There is a structural asymmetry between administrative actions (which are governed by global RBAC permission strings like `v1.org.residents.edit` in the `organization` module) and residential self-management actions (which are governed by hardcoded string checks like `['owner', 'tenant'].includes(...)` in the application layer) (**Inferred**). This dual-path authorization model increases the risk of permission bypass if the application-layer checks are modified or bypassed (**Inferred**).
  - **User ID Match Bypass Risk**: Bypassing the user ID match check in `createUnitInvitation` represents a elevated risk surface (**Inferred**). If the incoming request parameters (such as the target `unitId` or `buildingId`) are not strictly validated against the authenticated user's actual residency claims, an authenticated user could potentially generate unauthorized invitations to units they do not occupy (**Inferred**).

**Per-capability evidence:**

#### _module_root

#### Security Decorators
- Service methods are protected by the `OSKUserSecurityChecks` decorator, which enforces authentication and basic user validation `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKUserSecurityChecks|getAllUnitInhabitantsAndGuests||#1` `` (**Confirmed**).
- The `createUnitInvitation` service method bypasses the strict user ID match check using `{ checkUserIdMatch: false }` `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_invitation_creation.service.ts|OSKUserSecurityChecks|createUnitInvitation|{ checkUserIdMatch: false }|#1` `` (**Confirmed**).

#### Application-Layer Role Checks
- Rather than referencing global RBAC permission strings (e.g., `v1.org.residents.edit`), this capability enforces a strict **Delegated Authority Principle** at the application layer (**Confirmed**):
  - Only inhabitants with an `inhabitantType` of `'owner'` or `'tenant'` (which maps to the `ResidentAdmin` status) are authorized to remove other inhabitants `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|['owner', 'tenant'].includes|removeInhabitantFromUnit|requestingInhabitant.inhabitantType|#1` `` (**Confirmed**).
  - Only `'owner'` or `'tenant'` inhabitants can remove pending unit invitations `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|['owner', 'tenant'].includes|removePendingInvitation|requestingInhabitant.inhabitantType|#1` `` (**Confirmed**).
  - Only `'owner'` or `'tenant'` inhabitants can remove permanent guests `` `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts|['owner', 'tenant'].includes|removePermanentGuest|inhabitantDocument!.inhabitantType|#1` `` (**Confirmed**).
  - If a user with insufficient privileges (e.g., a standard `resident` or `guest`) attempts these actions, a `permission-denied` error is thrown `` `permission_error|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|permission-denied|#1` `` (**Confirmed**).

---

### 10. Cross-Module Relationships

The deterministic Cross-Module Dependency Graph and resolved method-level call edges establish the following relationships:

#### Outbound Dependencies
The `unit_management` module depends on the following sibling modules to execute its workflows:
- **`building`** (**Confirmed**): Imports door and inhabitant types (`OSKUserDoor`, `OSKBuildingUnitInhabitantType`, `OSKResidentRights`). Calls methods to retrieve building details (`OSKBuildingController.get`), manage intercom directory listings (`OSKBuildingIntercomService.deleteIntercomEntryUser`), and perform CRUD operations on unit inhabitants, non-app users, and permanent guests (`OSKBuildingUnitInhabitantController`, `OSKBuildingUnitNonAppUserController`, `OSKBuildingUnitPermanentGuestController`, `OSKBuildingUnitController`).
- **`core`** (**Confirmed**): Imports core document and access types (`OSKDocument`, `OSKAccessMethod`, `OSKAccessRightWithDates`). Calls the generic `OSKDocumentController` to manage pending invitation documents, utilizes `OSKAccessService` and `OSKAccessUtilsDatesService` to provision physical access rights, calls `OSKPincodeService` to delete building-level PIN codes, and uses `OSKLoggingService` for system diagnostics.
- **`user`** (**Confirmed**): Imports user access and invitation models (`OSKUserAccessType`, `OSKInvitee`). Calls `OSKUserController` to resolve user profiles, manages external user invitations via `OSKUserInvitationExternalUserController` and `OSKUserInvitationExternalUnitService`, and manages user-specific PIN codes and accesses via `OSKUserPincodeController` and `OSKUserAccessesController`.

#### Inbound Dependencies
The following sibling modules depend on `unit_management` to complete their workflows:
- **`organization`** (**Confirmed**): The `organization_resident.service.ts` imports and calls `OSKUnitManagementPendingInvitationsController.delete` to clean up outstanding unit invitations when a resident profile is administratively deleted or modified via the Property Manager Portal (PGO).
- **`user`** (**Confirmed**): Imports `OSKUnitInvitation` and `OSKUnitInvitationInvitees` to support external user invitation models. During the mobile onboarding and invitation acceptance flows, the `user` module calls `OSKUnitManagementCreationInvitationService.consumeUnitInvitationInvitee` and `OSKUnitManagementCreationOskeyUserInvitationService.createPermanentGuest` to transition pending invitations into active inhabitant and guest relationships.

### 11. External Hooks

#### _module_root

- No external hooks, Pub/Sub topics, environment variables, or storage paths are directly evidenced within this capability's pack (**Confirmed**).

---

### 12. Architectural Observations

- **Pure Orchestration Layer**: The `unit_management` module exhibits a classic Orchestration Service pattern (**Inferred**). It owns almost no primary data of its own (except for pending invitations) and instead coordinates complex, multi-module transactions (**Inferred**). For example, offboarding an inhabitant requires coordinated calls to `building` (to delete unit inhabitant records and intercom entries), `user` (to delete user-scoped PIN codes), and `core` (to revoke physical access permissions and move PINs to trash) (**Confirmed**).
- **Strict Boundary Respect**: Despite touching multiple domain entities, the module respects domain boundaries by routing all modifications through the public controllers of the target modules (e.g., `OSKBuildingUnitInhabitantController.update`) rather than executing direct Firestore writes to foreign collections (**Confirmed**).
- **Application-Layer Policy Enforcement**: The module acts as the primary enforcer of the platform's *Delegated Authority Principle* for residential users, programmatically ensuring that standard residents or guests cannot alter the composition of the household ("Mon Foyer") (**Confirmed**).

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **RBAC vs. Application-Layer Policy Mismatch**: The module's reliance on hardcoded string checks (`['owner', 'tenant']`) to authorize critical access-revocation and invitation actions bypasses the platform's central RBAC schema (**Confirmed**). This creates a risk of policy drift where administrative roles defined in `rbac-roles.json` cannot easily audit or restrict residential self-management capabilities (**Inferred**).
- **Lack of Direct Notification Evidence**: While `createUnitInvitation` successfully writes a pending invitation document, there is no evidence of direct notification dispatch (SMS or Email) within this module's code (**Confirmed**). This implies a critical, unverified dependency on downstream Firestore triggers or Pub/Sub handlers in other modules to actually deliver the invitation to the user (**Inferred**).
- **Auth0 Identity Reconciliation**: It is unclear how the platform securely reconciles and links Auth0 identity mappings when an external user accepts a pending invitation, as the matching logic spans the boundary between `user` and `unit_management` and is not fully documented in the local implementation context (**Inferred**).

**Per-capability open questions:**

#### _module_root

- **Auth0 Integration**: How does the platform reconcile Auth0 identity mappings when a user accepts a pending invitation? The code in this capability checks for existing users via email/phone, but the actual Auth0 linking logic is not visible in this pack (**Inferred**).
- **Notification Dispatch**: When `createUnitInvitation` successfully writes a pending invitation, does it trigger an external notification (SMS/Email) directly, or is that delegated to a Firestore trigger in another module? No notification dispatch logic is evidenced in this capability's pack (**Inferred**).

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.