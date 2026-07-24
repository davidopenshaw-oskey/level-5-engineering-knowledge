<!-- © Oskey SAS. All rights reserved. -->

# Module Domain Profile: unit_management

*© Oskey SAS. All rights reserved.*

## Metadata

| Property | Value |
| :--- | :--- |
| **Domain Module** | `unit_management` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_153335-1aa319b1` |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Overall Confidence** | High |
| **Status** | Completed & Grounded |

---

## 1. Executive Summary

### Interpretation

Evidence indicates that `unit_management` is the callable-service module for managing people and invitation state within a Building Unit. It does not own the structural unit document itself; instead, it orchestrates unit-level inhabitants, pending unit invitations, permanent guests, and the related cleanup of access, pincodes, intercom entries, and external invitation records.

The module sits at the boundary between the resident-facing "Mon Foyer" style unit-management experience and lower-level building, user, invitation, access, pincode, and intercom controllers. Architecture grounding defines Unit as a logical administrative container under a Building, not a physical hardware anchor. The AST evidence matches that boundary: all confirmed unit-scoped writes use building and unit identifiers, while hardware-facing effects are delegated to other modules.

### Evidence Used

- Architecture: `Oskey Architecture.md` defines the hierarchy Organization > Entity > Property > Building > Unit, and states that Unit is a logical administrative container for resident directories and lease durations.
- Architecture: `Oskey Architecture.md` describes ResidentAdmin/UnitAdmin-style management of co-inhabitants and guests within a unit.
- Service: `OSKUnitManagementInhabitantService` implements `updateInhabitant`, `removeInhabitantFromUnit`, `removePendingInvitation`, `getAllUnitInhabitantsAndGuests`, `getSingleUnitInhabitant`, `fetchInhabitantData`, `getUnitPerson`, and `populateResponseObject`.
- Service: `OSKUnitManagementCreationInvitationService` implements `createUnitInvitation`, `updateOrCreatePendingUnitInvitation`, `consumeUnitInvitationInvitee`, `findUserByInvite`, and `getContactKeyForInvite`.
- Service: `OSKUnitManagementCreationOskeyUserInvitationService` implements `processInvitee`, `createPermanentGuest`, and `makeBuildingUnitDoc`.
- Service: `OSKUnitManagementPermanentGuestService` implements `updatePermanentGuest`, `removePermanentGuest`, `getPermanentGuest`, and `fetchPermanentGuestData`.
- Controller: `OSKUnitManagementPendingInvitationsController` reads and writes `/buildings/${buildingId}/units/${unitId}/pendingUnitInvitations`.
- Module manifest: `unit_management` contains 13 files, 5 services, 1 controller, 216 call expressions, 4 permission-denied hints, and 0 Firestore triggers.

### Confidence

High for callable module responsibilities and confirmed persistence paths. Medium for broader product-facing interpretation, because the module evidence is AST-derived and does not include caller UI definitions.

---

## 2. Architectural Position

Include:

- Parent scope: Building Unit within a Building.
- Owned concepts: Pending unit invitation aggregate documents and unit-management orchestration services.
- Provided capabilities: Unit invitation creation and consumption, inhabitant update/removal, pending invitation removal, permanent guest update/removal/detail retrieval, consolidated unit people views.
- Downstream consumers or candidate consumers: Mobile app resident/unit-management surfaces and possibly management surfaces that need unit people and invitation state. These are candidate consumers only; the module evidence confirms callable functions, not specific clients.
- Confidence: High for parent scope and capabilities; medium for consumers.

### Interpretation

The module is architecturally positioned below Building and above lower-level persistence controllers. It uses Building Unit controllers to manipulate inhabitant and permanent guest data, User controllers to resolve profile/contact identity, Access/Pincode services to revoke or update credentials, and Intercom services to clean directory state after inhabitant removal.

It should be interpreted as an orchestration layer rather than the owner of all data it touches. The module directly owns one confirmed controller surface for pending unit invitations. Other data writes are delegated to controllers and services owned by building, user, access, pincode, and intercom modules.

### Evidence Used

- Architecture: Unit is an individual apartment, office lot, commercial studio, or residential space within a Building.
- Architecture: Physical ACDs are never assigned or mapped directly at Unit level; they look up to Building level.
- Callable entry point: `functions/src/modules/unit_management/index.ts` exposes `createUnitInvitation`, `removeInhabitantFromUnit`, `removePendingInvitation`, `updateInhabitant`, `removePermanentGuest`, `getPermanentGuest`, `getAllUnitInhabitantsAndGuests`, `getSingleUnitInhabitant`, `getUnitInvitationsByUserId`, and `getUnitPerson` via `https.onCall`.
- Firestore path: `OSKUnitManagementPendingInvitationsController` uses `/buildings/${buildingId}/units/${unitId}/pendingUnitInvitations`.
- Cross-module dependency: `unit_management_inhabitant.service.ts` imports `OSKBuildingUnitNonAppUserController` and `OSKNonAppUserPincodeController` from the building unit non-app-user module.
- Cross-module dependency: `unit_management_inhabitant.service.ts` imports `OSKUserInvitationExternalUserController` from the user invitation module.
- Cross-module dependency: `unit_management_permanent_guest.service.ts` imports user access document models.

### Confidence

High.

---

## 3. Primary Responsibilities

- Capability: Create and route unit invitations.
- Implemented by:
 * Controller: `OSKUnitManagementPendingInvitationsController`
 * Service: `OSKUnitManagementCreationInvitationService`
 * Representative Service Method: `createUnitInvitation`
- Evidence: `createUnitInvitation` looks up users by email, phone, or user ID through `OSKUserController`; routes existing users through `OSKUnitManagementCreationOskeyUserInvitationService.processInvitee`; routes non-existing users through `OSKUserInvitationExternalUnitService.createExternalUnitInvitation`; and upserts `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations/{inviterId}`.
- Confidence: High.

- Capability: Consume and remove pending unit invitees.
- Implemented by:
 * Controller: `OSKUnitManagementPendingInvitationsController`
 * Service: `OSKUnitManagementCreationInvitationService` and `OSKUnitManagementInhabitantService`
 * Representative Service Method: `consumeUnitInvitationInvitee`, `removePendingInvitation`
- Evidence: `consumeUnitInvitationInvitee` calls `OSKUnitManagementPendingInvitationsController.default.consumeInvitee`; `removePendingInvitation` reads the pending invitation, checks the requesting inhabitant, removes a matching invitee, and deletes the related external user invitation when present.
- Confidence: High.

- Capability: Update or remove unit inhabitants.
- Implemented by:
 * Controller: Delegated to `OSKBuildingUnitInhabitantController`
 * Service: `OSKUnitManagementInhabitantService`
 * Representative Service Method: `updateInhabitant`, `removeInhabitantFromUnit`
- Evidence: `updateInhabitant` calls `OSKBuildingUnitInhabitantController.default.update`; `removeInhabitantFromUnit` deletes access through `OSKAccessService.deleteAccessById`, removes building/user pincodes, deletes the inhabitant document, and calls `OSKBuildingIntercomService.deleteIntercomEntryUser`.
- Confidence: High.

- Capability: Retrieve consolidated unit people state.
- Implemented by:
 * Controller: Delegated to building unit inhabitant, permanent guest, pending invitation, and non-app-user controllers.
 * Service: `OSKUnitManagementInhabitantService`
 * Representative Service Method: `getAllUnitInhabitantsAndGuests`
- Evidence: The service reads `OSKBuildingUnitInhabitantController.default.getUnitInhabitants`, `OSKBuildingUnitPermanentGuestController.default.getUnitPermanentGuests`, `OSKUnitManagementPendingInvitationsController.default.getAll`, and `OSKBuildingUnitNonAppUserController.default.getAll`.
- Confidence: High.

- Capability: Manage permanent guest access lifecycle.
- Implemented by:
 * Controller: Delegated to `OSKBuildingUnitPermanentGuestController`
 * Service: `OSKUnitManagementPermanentGuestService` and `OSKUnitManagementCreationOskeyUserInvitationService`
 * Representative Service Method: `createPermanentGuest`, `updatePermanentGuest`, `removePermanentGuest`, `getPermanentGuest`
- Evidence: `createPermanentGuest` creates access with `OSKAccessService.createAccess` and writes via `OSKBuildingUnitPermanentGuestController`; `updatePermanentGuest` calls `OSKAccessService.updateAccess`; `removePermanentGuest` deletes access, pincodes, and the permanent guest document.
- Confidence: High.

### Interpretation

The module's responsibilities are centered on unit people-management workflows. It does not implement structural unit lifecycle operations such as creating or deleting `/buildings/{buildingId}/units/{unitId}` documents; those are grounded in the building unit module.

### Evidence Used

- Service Method: `OSKUnitManagementCreationInvitationService.createUnitInvitation`
- Service Method: `OSKUnitManagementCreationInvitationService.updateOrCreatePendingUnitInvitation`
- Service Method: `OSKUnitManagementCreationInvitationService.consumeUnitInvitationInvitee`
- Service Method: `OSKUnitManagementInhabitantService.updateInhabitant`
- Service Method: `OSKUnitManagementInhabitantService.removeInhabitantFromUnit`
- Service Method: `OSKUnitManagementInhabitantService.getAllUnitInhabitantsAndGuests`
- Service Method: `OSKUnitManagementPermanentGuestService.updatePermanentGuest`
- Service Method: `OSKUnitManagementPermanentGuestService.removePermanentGuest`
- Firestore Path: `/buildings/${buildingId}/units/${unitId}/pendingUnitInvitations`
- Architecture: Unit is a logical administrative container under Building.

### Confidence

High.

---

## 4. Public Interfaces

### Interpretation

The module exposes callable Cloud Functions from `functions/src/modules/unit_management/index.ts`. These callables provide the public runtime surface for unit invitation creation, inhabitant management, permanent guest management, and unit people retrieval. App Check enforcement is enabled through `functionBuilder.runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`, making emulator mode a special case.

The only module-local controller identified in evidence is `OSKUnitManagementPendingInvitationsController`, which provides CRUD/query helpers over the pending unit invitation subcollection.

### Evidence Used

- Callable: `createUnitInvitation` maps to `OSKUnitManagementCreationInvitationService.createUnitInvitation`.
- Callable: `removeInhabitantFromUnit` maps to `OSKUnitManagementInhabitantService.removeInhabitantFromUnit`.
- Callable: `removePendingInvitation` maps to `OSKUnitManagementInhabitantService.removePendingInvitation`.
- Callable: `updateInhabitant` maps to `OSKUnitManagementInhabitantService.updateInhabitant`.
- Callable: `removePermanentGuest` maps to `OSKUnitManagementPermanentGuestService.removePermanentGuest`.
- Callable: `getPermanentGuest` maps to `OSKUnitManagementPermanentGuestService.getPermanentGuest`.
- Callable: `getAllUnitInhabitantsAndGuests` maps to `OSKUnitManagementInhabitantService.getAllUnitInhabitantsAndGuests`.
- Callable: `getSingleUnitInhabitant` maps to `OSKUnitManagementInhabitantService.getSingleUnitInhabitant`.
- Callable: `getUnitInvitationsByUserId` maps to `OSKUnitManagementInvitationService.getUnitInvitationsByUserId`.
- Callable: `getUnitPerson` maps to `OSKUnitManagementInhabitantService.getUnitPerson`.
- Controller Method: `OSKUnitManagementPendingInvitationsController.get`, `getAll`, `create`, `save`, `update`, `delete`, `deleteAll`, `queryPendingInvitations`, `listDocuments`, `getUnitPendingInvitations`, `consumeInvitee`.
- External Hook: `OSK_FIREBASE_EMULATOR` controls App Check enforcement in module index evidence.

### Confidence

High.

---

## 5. Internal Structure

### Interpretation

The module is internally organized as one persistence controller plus five service classes:

- `OSKUnitManagementPendingInvitationsController` encapsulates reads, writes, deletes, list/query operations, collection-group queries, and array removal for pending unit invitation documents.
- `OSKUnitManagementCreationInvitationService` handles invitation creation decisions, contact normalization/lookup, pending invitation upsert, and invitee consumption.
- `OSKUnitManagementCreationOskeyUserInvitationService` handles existing-user invitation acceptance paths, including inhabitant creation and permanent guest creation.
- `OSKUnitManagementInvitationService` reads pending invitations for a user in a unit.
- `OSKUnitManagementInhabitantService` manages existing inhabitants and consolidated unit people views.
- `OSKUnitManagementPermanentGuestService` manages permanent guest updates, removal, and detail reads.

The split suggests a clear distinction between invitation creation, invitation read/query, inhabitant operations, permanent guest operations, and low-level pending invitation persistence.

### Evidence Used

- Controller: `OSKUnitManagementPendingInvitationsController` has 12 detected methods.
- Service: `OSKUnitManagementInhabitantService` has 8 detected methods.
- Service: `OSKUnitManagementInvitationService` has 1 detected method.
- Service: `OSKUnitManagementCreationInvitationService` has 5 detected methods.
- Service: `OSKUnitManagementCreationOskeyUserInvitationService` has 3 detected methods.
- Service: `OSKUnitManagementPermanentGuestService` has 4 detected methods.
- Manifest: 13 files, 5 services, 1 controller, 216 call expressions.

### Confidence

High.

---

## 6. Firestore & Data Ownership

### Interpretation

Confirmed primary module-local persistence is the pending unit invitation subcollection:

- `/buildings/{buildingId}/units/{unitId}/pendingUnitInvitations/{inviterId}`

The module also reads and writes data through controllers owned by other modules:

- `/buildings/{buildingId}/units/{unitId}/inhabitants/{userId}` through `OSKBuildingUnitInhabitantController`.
- `/buildings/{buildingId}/units/{unitId}/permanentGuests/{userId}` through `OSKBuildingUnitPermanentGuestController`.
- `/users` through `OSKUserController` lookup/query methods.
- User/building pincode and access documents through `OSKUserPincodeController`, `OSKPincodeService`, and `OSKAccessService`.
- External invitation records through `OSKUserInvitationExternalUnitService` and `OSKUserInvitationExternalUserController`.

Firestore schema confirms `/buildings/{id}/units/{id}/inhabitants` and `/buildings/{id}/units` as documented collections. The backend architecture document describes pending invitation and permanent guest unit subcollections, but it names the pending invitation path as `/pendingInvitations/{inviterId}` while AST evidence uses `/pendingUnitInvitations`. The AST path should be treated as authoritative for this module, and the naming mismatch should remain an open evidence conflict.

Candidate read optimization is supported by Firestore indexes over collection groups such as `inhabitants`, `onboardingInhabitants`, and invitation-related collections. The module evidence confirms some unit-scoped queries, but it does not itself prove every indexed collection is used by this module.

### Evidence Used

- Firestore Path: `OSKUnitManagementPendingInvitationsController.default._get` uses `/buildings/${buildingId}/units/${unitId}/pendingUnitInvitations`.
- Firestore Path: `OSKUnitManagementPendingInvitationsController.default._create`, `_set`, `_update`, `_delete`, `_deleteAll`, `_listDocuments`, and `_query` use `/buildings/${buildingId}/units/${unitId}/pendingUnitInvitations`.
- Firestore Path: `OSKUnitManagementPendingInvitationsController.default._queryCollectionGroup` accepts `collectionName` and `queryFilters`.
- Service Method: `OSKUnitManagementCreationInvitationService.updateOrCreatePendingUnitInvitation` calls pending invitation `get`, `update`, and `create`.
- Service Method: `OSKUnitManagementCreationInvitationService.consumeUnitInvitationInvitee` calls pending invitation `consumeInvitee`.
- Service Method: `OSKUnitManagementInhabitantService.removePendingInvitation` calls pending invitation `get` and `consumeInvitee`.
- Service Method: `OSKUnitManagementInhabitantService.removeInhabitantFromUnit` calls `OSKBuildingUnitInhabitantController.default.delete`.
- Service Method: `OSKUnitManagementPermanentGuestService.removePermanentGuest` calls `OSKBuildingUnitPermanentGuestController.default.delete`.
- Schema: `firestore-schema.md` documents `/buildings/{id}/units/{id}/inhabitants` with fields including `userId`, `inhabitantAccessId`, `unitId`, `buildingId`, `inviterId`, `doors`, and `inhabitantType`.
- Schema: `firestore-schema.md` documents `/buildings/{id}/units` with unit fields such as `name`, `buildingName`, `creationDate`, and `streetAddress`.
- Schema: `firestore-schema.md` documents `/organizations/{id}/onboardingInhabitants` with `organizationId`, `buildingId`, `unitId`, contact details, `doors`, and `creationDate`.
- Index: `firestore.indexes.json` includes collection-group indexes for `inhabitants`, `invitationsSent`, `onboardingInhabitants`, `userInvitations`, and `externalUserInvitations`.
- Architecture/Data: `OSkey Backend Services & Data Architecture.md` describes `/buildings/{buildingId}/units/{unitId}/pendingInvitations/{inviterId}` and `/buildings/{buildingId}/units/{unitId}/permanentGuests/{userId}`.

### Confidence

High for pending unit invitation persistence and delegated inhabitant/permanent guest operations. Medium for data ownership beyond pending invitations because most writes are delegated through other modules.

---

## 7. API Endpoints

This section is detailed in the companion `api-contracts/unit_management-api-contract.md` document.

---

## 8. API Endpoints

This section is detailed in the companion `api-reference/unit_management-api-reference.md` document.

---

## 9. Firestore Triggers

### Interpretation

No Firestore document triggers are supplied for `unit_management`. The module evidence indicates callable HTTPS functions and controller/service orchestration, not document-triggered side effects owned by this module.

### Evidence Used

- Firestore Trigger Evidence: `unit_management-firestore-triggers.json` is an empty array.
- Manifest Summary: `firestoreTriggers` count is `0`.
- Callable Evidence: `functions/src/modules/unit_management/index.ts` exposes `https.onCall` handlers rather than Firestore trigger handlers.

### Confidence

High.

---

## 10. Permissions & Security

### Interpretation

The module enforces a mix of callable boundary checks and domain-level permission checks. App Check enforcement is configured at the callable function builder except in emulator mode. Several services validate the authenticated user against the request user ID and emit `permission-denied` when inhabitant/permanent guest management rules fail.

Within service logic, owner/tenant checks appear in removal and pending invitation paths. Permanent guest logic additionally references resident-rights style conditions in service evidence, but the exact complete authorization matrix is not fully reconstructable from the supplied AST facts alone.

Firestore rules ground unit structural reads and writes in building-level permissions: `canViewBuilding(buildingId)` requires `v1.org.buildings.view`, and `canEditBuilding(buildingId)` requires `v1.org.buildings.edit`. However, those rules cover documented `/buildings/{buildingId}/units` nested owners/residents paths and should not be assumed to fully describe callable service authorization for every `unit_management` operation.

### Evidence Used

- External Hook/Security: `functionBuilder.runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`.
- Permission Evidence: `unit_management_inhabitant.service.ts` has `permission-denied` at lines 222, 231, and 337.
- Permission Evidence: `unit_management_permanent_guest.service.ts` has `permission-denied` at line 203.
- Service Method: `removeInhabitantFromUnit` checks requester inhabitant data and uses `['owner', 'tenant'].includes(requestingInhabitant.inhabitantType)`.
- Service Method: `removePendingInvitation` reads the requester via `OSKBuildingUnitInhabitantController.default.get` before consuming an invitee.
- Service Method: `removePermanentGuest` uses `OSKBuildingUnitInhabitantController.default.getSafe` and checks `['owner', 'tenant'].includes(inhabitantDocument!.inhabitantType)`.
- Firestore Rules: `canEditBuilding(buildingId)` checks `v1.org.buildings.edit`.
- Firestore Rules: `canViewBuilding(buildingId)` checks `v1.org.buildings.view`.
- Firestore Rules: `/buildings/{buildingId}/units/{unitId}` read/create/update/delete are gated by `canViewBuilding` and `canEditBuilding`.
- RBAC: `rbac-roles.json` includes production `v1.org.buildings.view`, `v1.org.buildings.edit`, and resident permissions such as `v1.org.residents.view`, `v1.org.residents.create`, `v1.org.residents.edit`, and `v1.org.residents.delete`.

### Confidence

Medium-high. Confirmed checks exist, but complete authorization behaviour requires service source or richer AST facts.

---

## 11. Cross-Module Relationships

### Interpretation

The module is deliberately coupled to several adjacent modules because unit people management requires coordinated changes across identity, invitation state, access grants, pincodes, intercom directories, and building unit records. The strongest confirmed relationships are with building unit controllers, user controllers, access services, pincode services, and user invitation controllers.

These relationships should be read as direct module dependencies, not as a full platform workflow synthesis.

### Evidence Used

- Building Unit: `OSKBuildingUnitInhabitantController.default.get`, `update`, `delete`, and `getUnitInhabitants`.
- Building Unit: `OSKBuildingUnitPermanentGuestController.default.get`, `getSafe`, `create`, `update`, `delete`, and `getUnitPermanentGuests`.
- Building Unit: `OSKBuildingUnitController.default.get` is called by `makeBuildingUnitDoc`.
- Building Unit Non-App User: `OSKBuildingUnitNonAppUserController.default.getAll` and `get` are used by inhabitant/person retrieval.
- User: `OSKUserController.default.get`, `getSafe`, `getByEmail`, and `queryOrCollection('/users', queryFilter)`.
- User Invitation: `OSKUserInvitationExternalUnitService.createExternalUnitInvitation`.
- User Invitation: `OSKUserInvitationExternalUserController.default.get` and `delete`.
- Access: `OSKAccessService.createAccess`, `updateAccess`, and `deleteAccessById`.
- Pincode: `OSKUserPincodeController.default.getByAccessId`, `getSpecificPincodesByQuery`, and `delete`.
- Pincode: `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash`.
- Intercom: `OSKBuildingIntercomService.deleteIntercomEntryUser`.

### Confidence

High.

---

## 12. External Hooks

### Interpretation

Confirmed external hook evidence is limited to callable HTTPS functions and emulator-dependent App Check enforcement. `/users` appears as an HTTP/client path candidate in the evidence because `OSKUserController.default.queryOrCollection` is called with `'/users'`; this should be treated as a Firestore/query boundary rather than a confirmed external HTTP service.

Hardware sync, mobile applications, ACDs, and intercom runtime consumers are architecture-grounded candidate boundaries only. The module calls access, pincode, and intercom services that may themselves publish or sync changes, but `unit_management` trigger evidence does not directly prove those downstream effects.

### Evidence Used

- External Hook: `OSK_FIREBASE_EMULATOR` appears in module index, invitation service, and permanent guest service evidence.
- Callable Boundary: `https.onCall` exports 10 callable functions from module index evidence.
- External Hook Candidate: `/users` is recorded as an `http_or_client_path_candidate` in `unit_management_invitation_creation.service.ts` line 44.
- Architecture Candidate: Oskey mobile app supports residents inviting co-inhabitants and guests.
- Architecture Candidate: Firestore serves mobile apps and the PGO through Cloud Functions and direct snapshots.
- Cross-Module Candidate: Calls to `OSKAccessService`, `OSKPincodeService`, and `OSKBuildingIntercomService` may produce downstream hardware-facing side effects in their owning modules, but those side effects are not owned by `unit_management` evidence.

### Confidence

High for callable/App Check hooks. Medium-low for downstream hardware or notification implications.

---

## 13. Architectural Observations

### Interpretation

The module uses an orchestration-service pattern. It coordinates multiple lower-level domain controllers rather than owning every persistence model it touches. This aligns with the Unit scope described in architecture grounding: a unit is a logical administrative container, while physical access and hardware concerns remain anchored at Building and delegated access/intercom services.

The pending invitation model is an aggregation pattern: invitees are stored under a document keyed by inviter ID, and invitee consumption removes array elements rather than always deleting one document per invitee. This is directly supported by controller evidence using `_removeFromArrayFieldByPredicate`.

Permanent guest handling is tightly coupled to access lifecycle. The permanent guest record appears to carry unit context while access validity and revocation are handled by `OSKAccessService` and pincode cleanup services.

The module also implements defensive cleanup behaviour. Removing an inhabitant or permanent guest does not only delete the unit-scoped person document; it also revokes access, deletes associated pincodes, and removes intercom directory state where evidenced.

### Evidence Used

- Architecture: Unit is a logical administrative container and not the location for direct ACD assignment.
- Controller Method: `OSKUnitManagementPendingInvitationsController.consumeInvitee` calls `_removeFromArrayFieldByPredicate`.
- Service Method: `OSKUnitManagementCreationInvitationService.updateOrCreatePendingUnitInvitation` updates an existing pending invitation document or creates one.
- Service Method: `OSKUnitManagementCreationOskeyUserInvitationService.createPermanentGuest` calls `OSKAccessService.createAccess` and writes permanent guest data.
- Service Method: `OSKUnitManagementPermanentGuestService.updatePermanentGuest` calls `OSKAccessService.updateAccess`.
- Service Method: `OSKUnitManagementPermanentGuestService.removePermanentGuest` calls `OSKAccessService.deleteAccessById`, pincode deletion, and permanent guest deletion.
- Service Method: `OSKUnitManagementInhabitantService.removeInhabitantFromUnit` calls access deletion, pincode deletion, inhabitant deletion, and `OSKBuildingIntercomService.deleteIntercomEntryUser`.

### Confidence

High.

---

## 14. Risks & Open Questions

### Interpretation

- Path naming conflict: AST evidence writes `/pendingUnitInvitations`, while the backend data architecture document describes `/pendingInvitations`. This requires confirmation before downstream schema synthesis.
- Firestore schema coverage appears incomplete for module-local pending unit invitations and permanent guests. The schema file documents `inhabitants` and `units`, but the confirmed pending unit invitation path is not visible in the extracted schema evidence.
- The module has no Firestore triggers, so any asynchronous fan-out or hardware sync must be attributed to called modules, not to this module.
- The callable authorization model is only partially visible through call expressions and permission-denied hints. Full security behaviour requires richer evidence for request validation branches and role/right checks.
- Some rules references cover owners/residents nested collections, while module evidence uses `inhabitants`, `permanentGuests`, `nonAppUsers`, and `pendingUnitInvitations`. The relationship between those naming schemes needs reconciliation.
- `/users` is flagged as an external hook candidate by the evidence extractor, but the call expression shows use of `OSKUserController.default.queryOrCollection('/users', queryFilter)`. Treat it as a Firestore/user-controller dependency unless further evidence proves an external HTTP boundary.

### Evidence Used

- Firestore Path Conflict: AST controller path `/buildings/${buildingId}/units/${unitId}/pendingUnitInvitations`.
- Data Architecture Conflict: `OSkey Backend Services & Data Architecture.md` section `/buildings/{buildingId}/units/{unitId}/pendingInvitations/{inviterId}`.
- Firestore Trigger Evidence: `unit_management-firestore-triggers.json` is empty.
- Permission Evidence: `permission-denied` hints appear, but no complete permission matrix is present in the module artefacts.
- Firestore Rules: `/buildings/{buildingId}/units/{unitId}` includes `owners` and `residents` nested matches, while module evidence references `inhabitants`, `permanentGuests`, `nonAppUsers`, and `pendingUnitInvitations`.
- External Hook Evidence: `/users` is classified as `http_or_client_path_candidate`, while call evidence shows `OSKUserController.default.queryOrCollection('/users', queryFilter)`.

### Confidence

High.

---

## 15. Evidence References

- `ai-runtime/contracts/module-engineering-profile/contract.md`
- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/module-engineering-profile/work-order.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/firestore.indexes.json`
- `ai-runtime/contracts/docs/rbac-roles.json`
- `output/knowledge-pipeline/modules/unit_management/unit_management-manifest.json`
- `output/knowledge-pipeline/modules/unit_management/unit_management-services.json`
- `output/knowledge-pipeline/modules/unit_management/unit_management-controllers.json`
- `output/knowledge-pipeline/modules/unit_management/unit_management-evidence.json`
- `output/knowledge-pipeline/modules/unit_management/unit_management-evidence-graph.json`
- `output/knowledge-pipeline/modules/unit_management/unit_management-firestore-triggers.json`
