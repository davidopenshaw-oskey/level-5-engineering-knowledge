<!-- © Oskey SAS. All rights reserved. -->

# Module Domain Profile: supplier

*© Oskey SAS. All rights reserved.*

## Metadata

| Property | Value |
| :--- | :--- |
| **Domain Module** | `supplier` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_162203-1aa319b1` |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Overall Confidence** | High |
| **Status** | Completed & Grounded |

---

## 1. Executive Summary

### Interpretation

Evidence indicates that the `supplier` module manages third-party service providers and their staff within the Oskey platform. It owns supplier root records under `/suppliers`, supplier staff records, staff access summaries, supplier-staff pincodes, and supplier-staff activity views.

The module is security-sensitive because supplier staff receive building access. Its services orchestrate supplier CRUD, staff CRUD, access provisioning and revocation, pincode lifecycle, and supplier activity/audit records. Architecture grounding identifies suppliers as third-party workers, delivery personnel, or maintenance staff, and notes that supplier door-entry logs are visible to property managers in the PGO.

### Evidence Used

- Architecture: `Oskey Architecture.md` identifies Supplier as third-party workers, delivery personnel, or maintenance staff.
- Architecture: `Oskey Architecture.md` states supplier door entry logs are synced into the PGO for property-manager visibility.
- Controller: `OSKSupplierController` owns `/suppliers` access through `get`, `getSafe`, `create`, `update`, `delete`, `getAll`, and `query`.
- Service: `OSKSupplierService` implements `createSupplier`, `getSupplier`, `getAllSuppliers`, `updateSupplier`, `deleteSupplier`, and `getSupplierStaffFromAllSuppliers`.
- Service: `OSKSupplierStaffService` implements staff CRUD, supplier-staff access creation/update/deletion, cascading deletion helpers, and pincode retrieval.
- Service: `OSKSupplierStaffAccessService` implements `setupSupplierStaffAccess`, `createOrUpdateSupplierStaffAccess`, and `getAllAccessesForAllBuildings`.
- Service: `OSKSupplierStaffActivityService` and `OSKSupplierStaffActivityAggregatesService` write/read supplier-staff activity records and aggregates.
- Module manifest: `supplier` contains 24 files, 6 services, 6 controllers, 316 calls, 35 permission hints, and 0 Firestore triggers.

### Confidence

High for module responsibilities and security posture. Medium for activity-pipeline positioning because the module evidence shows handler methods but not the upstream event source.

---

## 2. Architectural Position

Include:

- Parent scope: Organization and Entity hierarchy, with supplier access projected into Buildings.
- Owned concepts: Supplier company records, supplier staff records, supplier-staff building access summaries, supplier-staff pincodes, supplier-staff activities, supplier-staff activity aggregates.
- Provided capabilities: Supplier CRUD, staff CRUD, staff access provisioning/revocation, authorized-door updates, pincode retrieval, activity/audit retrieval, activity aggregate retrieval.
- Downstream consumers or candidate consumers: PGO supplier management screens, access provisioning services, building ACD synchronization, supplier activity dashboards.
- Confidence: High for owned concepts and capabilities; medium for consumers.

### Interpretation

The module is an administrative and access-control bridge. Supplier entities are anchored to an organization/entity context, while supplier staff access is materialized per building. Access creation delegates to the core access module, and access updates/deletions fan out to building access documents, pincode documents, and hardware message publishing.

The supplier module does not own the Building or Door models. It reads building and door data to validate and enrich supplier-staff access rights.

### Evidence Used

- Architecture: Organization is the top-level business entity used by enterprise admins and RBAC.
- Architecture: Supplier personas represent service providers and maintenance/delivery staff.
- Firestore Path: `/suppliers`.
- Schema: `/suppliers` includes `supplierId`, `name`, `siret`, `type`, `email`, and address fields.
- Schema: `/suppliers/{id}/staffMembers` includes `staffId`, `firstName`, `lastName`, `email`, `supplierId`, `organizationId`, phone fields, and `creationDate`.
- Schema: `/suppliers/{id}/staffMembers/{id}/accesses` includes `buildingId`, building denormalized fields, and an `accesses` array.
- Service Call: `OSKSupplierStaffService.createSupplierStaffAccess` calls `OSKAccessService.createAccess` with `type: OSKUserAccessType.SupplierStaff`.
- Service Call: `OSKSupplierStaffService.updateSupplierStaffAccessDoors` updates both supplier-staff access and building access documents, then publishes an update message through `OSKAccessMessagePublisherService.publishMessageToAllACDs`.

### Confidence

High.

---

## 3. Primary Responsibilities

- Capability: Manage supplier company records.
- Implemented by:
 * Controller: `OSKSupplierController`
 * Service: `OSKSupplierService`
 * Representative Service Method: `createSupplier`, `getSupplier`, `getAllSuppliers`, `updateSupplier`, `deleteSupplier`
- Evidence: `OSKSupplierService` validates organization/user context, checks `v1.org.suppliers.*` permissions, creates supplier documents through `OSKSupplierController.default.create`, updates through `OSKSupplierController.default.update`, lists through `OSKSupplierController.default.query`, and deletes through `OSKSupplierController.default.delete`.
- Confidence: High.

- Capability: Manage supplier staff records.
- Implemented by:
 * Controller: `OSKSupplierStaffController`
 * Service: `OSKSupplierStaffService`
 * Representative Service Method: `createStaffMember`, `getStaffMember`, `getAllStaffMembers`, `updateStaffMember`, `deleteStaffMember`
- Evidence: Staff creation uses `OSKSupplierStaffController.default.generateDocId` and `create`; reads use `getSafe` and `getAll`; updates use `update`; deletion calls `_deleteStaffMemberAndRelatedData`.
- Confidence: High.

- Capability: Provision supplier staff building access.
- Implemented by:
 * Controller: `OSKSupplierStaffAccessController`
 * Service: `OSKSupplierStaffService` and `OSKSupplierStaffAccessService`
 * Representative Service Method: `createSupplierStaffAccess`, `createSupplierStaffWithAccess`, `_internalCreateSupplierStaffAccess`, `createOrUpdateSupplierStaffAccess`
- Evidence: Access provisioning validates buildings and door IDs, resolves door documents, calls `OSKAccessService.createAccess`, and stores aggregated building access through `OSKSupplierStaffAccessController`.
- Confidence: High.

- Capability: Update and revoke supplier staff access.
- Implemented by:
 * Controller: `OSKSupplierStaffAccessController`, `OSKSupplierStaffPincodeController`
 * Service: `OSKSupplierStaffService`
 * Representative Service Method: `updateSupplierStaffAccessDoors`, `deleteSupplierStaffAccess`, `_deleteAccessSideEffects`
- Evidence: Door updates modify supplier-staff access, update building access documents, and publish ACD update messages. Access deletion removes supplier-staff access entries, deletes building access when empty, deletes supplier-staff pincode documents, moves building pincodes to trash, and publishes ACD delete messages.
- Confidence: High.

- Capability: Store and retrieve supplier staff pincodes.
- Implemented by:
 * Controller: `OSKSupplierStaffPincodeController`
 * Service: `OSKSupplierStaffPincodeService`, `OSKSupplierStaffService`, `OSKSupplierStaffAccessService`
 * Representative Service Method: `createPincodeDocument`, `getAllStaffMemberPincodes`, `getAllAccessesForAllBuildings`
- Evidence: `OSKSupplierStaffPincodeService.createPincodeDocument` writes pincode documents; access retrieval joins supplier-staff access documents with pincode documents by `accessId`.
- Confidence: High.

- Capability: Record and retrieve supplier staff activities.
- Implemented by:
 * Controller: `OSKSupplierStaffActivitiesController`, `OSKSupplierStaffActivityAggregatesController`
 * Service: `OSKSupplierStaffActivityService`, `OSKSupplierStaffActivityAggregatesService`
 * Representative Service Method: `ActivityReceivedForSupplierStaff`, `getActivityById`, `getAllActivities`, `getActivityByBuildingId`
- Evidence: Activity handlers locate supplier staff via `OSKSupplierService.getSupplierStaffFromAllSuppliers`, write detailed activity documents, and update/save per-building activity aggregate documents with a rolling window.
- Confidence: Medium-high.

### Interpretation

The module is both a CRUD module and an access orchestration module. Simple supplier/staff profile operations are permission-gated administrative CRUD, while access and deletion operations coordinate with core access, building access, pincode, and ACD publishing services.

### Evidence Used

- Service Method: `OSKSupplierService.createSupplier`
- Service Method: `OSKSupplierStaffService.createStaffMember`
- Service Method: `OSKSupplierStaffService.createSupplierStaffAccess`
- Service Method: `OSKSupplierStaffService.createSupplierStaffWithAccess`
- Service Method: `OSKSupplierStaffService.updateSupplierStaffAccessDoors`
- Service Method: `OSKSupplierStaffService.deleteSupplierStaffAccess`
- Service Method: `OSKSupplierStaffService._deleteStaffMemberAndRelatedData`
- Service Method: `OSKSupplierStaffService._deleteAccessSideEffects`
- Service Method: `OSKSupplierStaffAccessService.createOrUpdateSupplierStaffAccess`
- Service Method: `OSKSupplierStaffActivityService.ActivityReceivedForSupplierStaff`
- Service Method: `OSKSupplierStaffActivityAggregatesService.ActivityReceivedForSupplierStaff`
- Permission: `v1.org.suppliers.create`, `v1.org.suppliers.view`, `v1.org.suppliers.edit`, `v1.org.suppliers.delete`

### Confidence

High.

---

## 4. Public Interfaces

### Interpretation

The public runtime interface is a set of callable Cloud Functions. The top-level supplier module exposes supplier CRUD callables and composes the supplierStaff callable trigger set. App Check enforcement is configured through `functionBuilder.runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`.

The supplierStaff submodule exposes staff lifecycle and access-management callables. Activity write handlers are service methods, but no callable entry point for `ActivityReceivedForSupplierStaff` is present in the supplied index evidence.

### Evidence Used

- Callable: `createSupplier` maps to `OSKSupplierService.createSupplier`.
- Callable: `getSupplier` maps to `OSKSupplierService.getSupplier`.
- Callable: `getAllSuppliers` maps to `OSKSupplierService.getAllSuppliers`.
- Callable: `updateSupplier` maps to `OSKSupplierService.updateSupplier`.
- Callable: `deleteSupplier` maps to `OSKSupplierService.deleteSupplier`.
- Callable: top-level index composes `supplierStaffTrigger.getCallableFunctionTriggers(functionBuilder)`.
- Callable: `createStaffMember` maps to `OSKSupplierStaffService.createStaffMember`.
- Callable: `getStaffMember` maps to `OSKSupplierStaffService.getStaffMember`.
- Callable: `getAllStaffMembers` maps to `OSKSupplierStaffService.getAllStaffMembers`.
- Callable: `updateStaffMember` maps to `OSKSupplierStaffService.updateStaffMember`.
- Callable: `deleteStaffMember` maps to `OSKSupplierStaffService.deleteStaffMember`.
- Callable: `createSupplierStaffAccess` maps to `OSKSupplierStaffService.createSupplierStaffAccess`.
- Callable: `deleteSupplierStaffAccess` maps to `OSKSupplierStaffService.deleteSupplierStaffAccess`.
- Callable: `getAllStaffMemberPincodes` maps to `OSKSupplierStaffService.getAllStaffMemberPincodes`.
- Callable: `createSupplierStaffWithAccess` maps to `OSKSupplierStaffService.createSupplierStaffWithAccess`.
- Callable: `updateSupplierStaffAccessDoors` maps to `OSKSupplierStaffService.updateSupplierStaffAccessDoors`.
- Callable: `getAllAccessesForAllBuildings` maps to `OSKSupplierStaffAccessService.getAllAccessesForAllBuildings`.

### Confidence

High.

---

## 5. Internal Structure

### Interpretation

The module is decomposed into a root supplier area and a nested `supplierStaff` submodule.

Root supplier:

- `OSKSupplierController` wraps `/suppliers` persistence.
- `OSKSupplierService` implements supplier CRUD and cross-supplier staff lookup.

Supplier staff:

- `OSKSupplierStaffController` wraps staff member persistence.
- `OSKSupplierStaffAccessController` wraps per-building access aggregate persistence.
- `OSKSupplierStaffPincodeController` wraps supplier-staff pincode persistence.
- `OSKSupplierStaffActivitiesController` wraps detailed supplier-staff activity records.
- `OSKSupplierStaffActivityAggregatesController` wraps per-building recent activity aggregates.
- `OSKSupplierStaffService` orchestrates staff lifecycle, access creation, access update, access deletion, deletion cleanup, and pincode retrieval.
- `OSKSupplierStaffAccessService` performs access document upsert and access list retrieval.
- `OSKSupplierStaffPincodeService` writes pincode documents.
- `OSKSupplierStaffActivityService` writes and reads detailed activity records.
- `OSKSupplierStaffActivityAggregatesService` writes and reads aggregated activity records.

### Evidence Used

- Manifest: 24 files, 12 classes, 77 methods, 6 services, 6 controllers.
- Controller: `OSKSupplierController` has 10 detected methods.
- Controller: `OSKSupplierStaffController` has 9 detected methods.
- Controller: `OSKSupplierStaffAccessController` has 7 detected methods.
- Controller: `OSKSupplierStaffPincodeController` has 5 detected methods.
- Controller: `OSKSupplierStaffActivitiesController` has 8 detected methods.
- Controller: `OSKSupplierStaffActivityAggregatesController` has 8 detected methods.
- Service: `OSKSupplierStaffService` has 15 detected methods.
- Service: `OSKSupplierStaffAccessService` has 3 detected methods.
- Service: `OSKSupplierStaffActivityService` has 3 detected methods.
- Service: `OSKSupplierStaffActivityAggregatesService` has 2 detected methods.
- Service: `OSKSupplierStaffPincodeService` has 1 detected method.
- Service: `OSKSupplierService` has 6 detected methods.

### Confidence

High.

---

## 6. Firestore & Data Ownership

### Interpretation

Confirmed AST persistence begins at `/suppliers`. The schema and matching controller/service evidence indicate the module owns these collections:

- `/suppliers/{supplierId}`
- `/suppliers/{supplierId}/staffMembers/{staffId}`
- `/suppliers/{supplierId}/staffMembers/{staffId}/accesses/{buildingId}`
- `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes/{pincode}`
- `/suppliers/{supplierId}/staffMembers/{staffId}/activities/{activityId}`
- `/suppliers/{supplierId}/staffMembers/{staffId}/activityAggregates/{buildingId}`

The module also reads and writes related building access and pincode structures through other modules. Supplier staff access summaries denormalize building metadata and aggregate access grants in an `accesses` array. Supplier staff pincodes are paired with building-level pincodes. Activity aggregates are a read-optimized rolling view separate from immutable detailed activity records.

### Evidence Used

- Firestore Path: `OSKSupplierController.collection` is `/suppliers`.
- Controller: `OSKSupplierController.default._get`, `_set`, `_update`, `_delete`, and `_query` use `OSKSupplierController.collection`.
- Schema: `/suppliers/{id}/staffMembers/{id}/accesses` includes `staffId`, `staffFirstName`, `staffLastName`, `buildingId`, denormalized building address fields, `accesses`, `creationDate`, and `buildingImageFilename`.
- Schema: `/suppliers/{id}/staffMembers/{id}/activities` includes `activityId`, `accessControlDeviceId`, `acdType`, `organizationId`, `supplierId`, `staffId`, person fields, `activityType`, building/door fields, and `creationDate`.
- Schema: `/suppliers/{id}/staffMembers/{id}/activityAggregates` includes `creationDate`, `modificationDate`, and `activities`.
- Schema: `/suppliers/{id}/staffMembers/{id}/pincodes` includes `pincode`, `buildingId`, `accessId`, `type`, and `creationDate`.
- Schema: `/suppliers/{id}/staffMembers` includes staff identity, supplier, organization, phone, and creation fields.
- Schema: `/suppliers` includes supplier identity, name, `siret`, type, email, and address fields.
- Service Call: `OSKSupplierStaffAccessController.default.save(accessOptions.supplierId, accessOptions.staffId, accessOptions.buildingId, newAccessDoc)`.
- Service Call: `OSKSupplierStaffAccessController.default.update(..., { accesses: FieldValue.arrayUnion(receivedAccess) })`.
- Service Call: `OSKSupplierStaffPincodeController.default.create(supplierId, staffId, pincode, pincodeDoc)`.
- Service Call: `OSKSupplierStaffActivitiesController.default.save(supplierStaff.supplierId, supplierStaff.staffId!, activity.activityId, staffActivityDocument)`.
- Service Call: `OSKSupplierStaffActivityAggregatesController.default.save/updateActivities(..., enrichedData.building.buildingId, ...)`.

### Confidence

High for the supplier-owned hierarchy. Medium for exact controller path construction because nested collection path strings are schema-grounded and inferred from controller method names/arguments rather than emitted as literal Firestore path evidence.

---

## 7. API Endpoints

This section is detailed in the companion `api-contracts/supplier-api-contract.md` document.

---

## 8. API Endpoints

This section is detailed in the companion `api-reference/supplier-api-reference.md` document.

---

## 9. Firestore Triggers

### Interpretation

No Firestore document triggers are supplied for the `supplier` module. Runtime exposure is through callable functions. Activity handler methods exist, but the supplied `supplier-firestore-triggers.json` does not identify a Firestore trigger owned by this module.

### Evidence Used

- Firestore Trigger Evidence: `supplier-firestore-triggers.json` is an empty array.
- Manifest Summary: `firestoreTriggers` count is `0`.
- Public Interface Evidence: supplier and supplierStaff index files expose `https.onCall` functions.

### Confidence

High.

---

## 10. Permissions & Security

### Interpretation

The supplier module is strongly RBAC-gated. Evidence shows repeated organization-user lookup and consolidated-role checks against `v1.org.suppliers.create`, `v1.org.suppliers.view`, `v1.org.suppliers.edit`, and `v1.org.suppliers.delete`. Denials are surfaced as `permission-denied`.

The module also applies callable security checks with `OSKUserSecurityChecks({ checkUserIdMatch: false })`, suggesting organization-level administrative actions are not constrained to a same-user ID match. App Check enforcement is configured except in emulator mode.

### Evidence Used

- Permission: `OSKSupplierService.createSupplier` requires `v1.org.suppliers.create`.
- Permission: `OSKSupplierService.getSupplier` and `getAllSuppliers` require `v1.org.suppliers.view`.
- Permission: `OSKSupplierService.updateSupplier` requires `v1.org.suppliers.edit`.
- Permission: `OSKSupplierService.deleteSupplier` requires `v1.org.suppliers.delete`.
- Permission: `OSKSupplierStaffService.createStaffMember` requires `v1.org.suppliers.create`.
- Permission: `OSKSupplierStaffService.getStaffMember`, `getAllStaffMembers`, and `getAllStaffMemberPincodes` require `v1.org.suppliers.view`.
- Permission: `OSKSupplierStaffService.updateStaffMember`, `createSupplierStaffAccess`, `updateSupplierStaffAccessDoors` require `v1.org.suppliers.edit`.
- Permission: `OSKSupplierStaffService.deleteStaffMember` requires `v1.org.suppliers.delete`.
- Permission: activity read services require `v1.org.suppliers.view`.
- Permission Check: services call `OSKConsolidatedRolesController.default.checkUserPermissions(organizationUser.roles, rolesToCheck)`.
- Security Check: services call `OSKUserSecurityChecks({ checkUserIdMatch: false })`.
- RBAC: `v1.org.suppliers.admin` groups list, view, create, edit, and delete service-provider permissions.
- External Hook/Security: `functionBuilder.runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`.

### Confidence

High.

---

## 11. Cross-Module Relationships

### Interpretation

The module directly integrates with organization/user RBAC modules for authorization, entity/building/door modules for supplier scoping and access validation, access/pincode modules for physical access lifecycle, building access modules for denormalized access documents, hardware message publishing for ACD synchronization, and building activity models/services for supplier staff activity attribution.

These are direct relationships evidenced by imports and call expressions. The broader activity enrichment pipeline is a candidate upstream relationship; its complete trigger path is not supplied in this module evidence.

### Evidence Used

- Organization: `OSKOrganizationController.default.get`.
- Organization User: `OSKOrganizationUserController.default.get`.
- RBAC: `OSKConsolidatedRolesController.default.checkUserPermissions`.
- Entity: `OSKEntityController.default.get` during supplier creation.
- Building: `OSKBuildingController.default.get` and `getSafe`.
- Doors: `_getDoorDocumentsFromIds` resolves door documents for authorized doors.
- Access: `OSKAccessService.createAccess` provisions `OSKUserAccessType.SupplierStaff`.
- Building Access: `OSKBuildingAccessesController.default.get`, `update`, and `deletePerUser`.
- Pincode: `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash`.
- Hardware Sync: `OSKAccessMessagePublisherService.publishMessageToAllACDs` with Update/Delete operations.
- Building Activity: imports `OSKAccessControlDeviceActivityType` and `OSKBuildingActivity`.
- Supplier Staff: root supplier index imports `./modules/supplierStaff`.

### Confidence

High.

---

## 12. External Hooks

### Interpretation

Confirmed external hooks are limited to callable Cloud Functions and emulator-dependent App Check behavior. The hardware synchronization boundary is directly evidenced through calls to `OSKAccessMessagePublisherService.publishMessageToAllACDs`, but the downstream transport and ACD consumers are outside this module.

Activity handling is an architectural candidate external/event boundary: supplier activity services receive enriched activity data, but the supplied module evidence does not include the upstream Firestore trigger or event publisher.

### Evidence Used

- External Hook: `OSK_FIREBASE_EMULATOR` controls App Check enforcement in supplier and supplierStaff index files.
- Callable Boundary: supplier index exposes supplier CRUD through `https.onCall`.
- Callable Boundary: supplierStaff index exposes staff/access functions through `https.onCall`.
- Hardware Sync Boundary: `OSKAccessMessagePublisherService.publishMessageToAllACDs` is called for access door updates and access deletion.
- Architecture: Supplier door entry logs are synced into the PGO for property-manager monitoring.
- Activity Boundary Candidate: `OSKSupplierStaffActivityService.ActivityReceivedForSupplierStaff` accepts activity and enrichedData-style inputs, but no trigger is present in `supplier-firestore-triggers.json`.

### Confidence

High for callable and hardware publisher calls. Medium for the upstream activity boundary.

---

## 13. Architectural Observations

### Interpretation

The module uses a hierarchical data model rooted at `/suppliers`, with all staff-specific operational data below each staff member. This keeps supplier data localized but creates a known lookup concern: activity services locate a staff member by scanning suppliers through `OSKSupplierService.getSupplierStaffFromAllSuppliers`.

Supplier staff access uses an aggregate-per-building pattern. Each access document is keyed by `buildingId` and holds an `accesses` array, reducing document count and supporting per-building access views.

Deletion is orchestrated, not local. Supplier and staff deletion cascade through staff records, access documents, pincode documents, building access documents, and hardware delete publishing. This fits the platform's access-control integrity requirements: supplier staff should not retain physical access after administrative deletion.

Activity storage uses dual representations: immutable detailed activity records and rolling per-building activity aggregates. This supports auditability and UI read performance.

### Evidence Used

- Schema: `/suppliers/{id}/staffMembers/{id}/activities` detailed activity collection.
- Schema: `/suppliers/{id}/staffMembers/{id}/activityAggregates` aggregate collection.
- Service Method: `OSKSupplierService.getSupplierStaffFromAllSuppliers`.
- Service Method: `OSKSupplierStaffAccessService.createOrUpdateSupplierStaffAccess` uses `FieldValue.arrayUnion(receivedAccess)`.
- Service Method: `OSKSupplierStaffService._deleteStaffMemberAndRelatedData`.
- Service Method: `OSKSupplierStaffService._deleteAccessSideEffects`.
- Service Method: `OSKSupplierStaffActivityAggregatesService.ActivityReceivedForSupplierStaff` updates existing activities, filters out older entries, or saves a new aggregate document.
- Data Architecture: supplier staff deletion is described as a cascade through access, pincode, and hardware synchronization.

### Confidence

High.

---

## 14. Risks & Open Questions

### Interpretation

- Nested supplier collection paths are well supported by schema and controller naming, but the AST extractor only surfaced `/suppliers` as a literal Firestore path. Exact path construction should be confirmed before automated path synthesis.
- The extractor classified `@oskey/settings/role` as Firestore evidence in several services. This appears to be a package/config import rather than a Firestore path and should not be treated as persistence evidence.
- `getSupplierStaffFromAllSuppliers` scans suppliers/staff to find staff for activity attribution. The backend data architecture document identifies this as a scalability risk; AST evidence confirms the method is used by activity and aggregate services.
- Activity services appear to be handlers for an upstream enrichment pipeline, but no Firestore trigger or callable entry point for activity ingestion is supplied in the module trigger/index evidence.
- Firestore rules in the supplied snippets do not expose supplier-specific rules. The security model appears callable/RBAC based, but direct client Firestore access assumptions require confirmation.
- Deletion and hardware sync behavior is evidenced by service calls to publisher and pincode/access cleanup, but downstream Pub/Sub/ACD delivery is outside this module's evidence.

### Evidence Used

- Firestore Evidence: only `/suppliers` is emitted as a literal Firestore path by `supplier-evidence.json`.
- Firestore Evidence Caveat: `@oskey/settings/role` appears in `firestoreEvidence` but is not a Firestore collection path.
- Service Method: `OSKSupplierService.getSupplierStaffFromAllSuppliers`.
- Service Call: `OSKSupplierStaffActivityService.ActivityReceivedForSupplierStaff` calls `OSKSupplierService.getSupplierStaffFromAllSuppliers`.
- Service Call: `OSKSupplierStaffActivityAggregatesService.ActivityReceivedForSupplierStaff` calls `OSKSupplierService.getSupplierStaffFromAllSuppliers`.
- Firestore Trigger Evidence: `supplier-firestore-triggers.json` is empty.
- Security Evidence: permissions are enforced through callable service checks using organization users and consolidated roles.
- Hardware Sync Evidence: `OSKAccessMessagePublisherService.publishMessageToAllACDs` calls exist, but publisher internals are not in this module evidence.

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
- `output/knowledge-pipeline/modules/supplier/supplier-manifest.json`
- `output/knowledge-pipeline/modules/supplier/supplier-services.json`
- `output/knowledge-pipeline/modules/supplier/supplier-controllers.json`
- `output/knowledge-pipeline/modules/supplier/supplier-evidence.json`
- `output/knowledge-pipeline/modules/supplier/supplier-evidence-graph.json`
- `output/knowledge-pipeline/modules/supplier/supplier-firestore-triggers.json`
