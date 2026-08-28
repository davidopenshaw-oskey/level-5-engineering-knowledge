### 0. Generation Metadata

- **runId**: `20260827_163338-1aa319b1`
- **generatedAt**: `2026-08-27T16:45:04.539Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `supplier`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `supplier` module manages the lifecycle, credentials, time-bound physical access permissions, and activity logs of third-party Suppliers (such as maintenance companies, cleaners, and HVAC engineers) and their Staff Members within the Oskey platform. It serves as an administrative domain that bridges property management operations (via the PGO portal) with physical access execution, translating administrative access grants into offline PIN credentials and tracking contractor entry events. **Confirmed**.

### 2. Architectural Position

The `supplier` module is an administrative and operational domain module. It sits below the `organization` and `building` scopes, as suppliers are registered under specific organizations/entities, and their staff are granted time-bound access to specific buildings and doors. It relies on the `core` module for base document persistence and IoT access orchestration, and the `building` module for physical door and access state. It provides the administrative interfaces to manage third-party actors who do not use the mobile application but require secure, auditable, and temporary physical access. **Confirmed**.

### 3. Primary Responsibilities

#### _module_root

- **Supplier Creation**: Validates input parameters, verifies the existence of the parent organization and entity, checks user permissions, generates a unique document ID, and writes the supplier profile to Firestore. [Confirmed] (`` `service_method|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierService|createSupplier|#1` ``, `` `call_expression|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierController.default.create|createSupplier|supplierId,supplierDocument|#1` ``).
- **Supplier Retrieval**: Safely retrieves a single supplier profile by ID or queries all suppliers belonging to a specific organization, ensuring the requesting user has appropriate visibility permissions. [Confirmed] (`` `service_method|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierService|getSupplier|#1` ``, `` `service_method|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierService|getAllSuppliers|#1` ``).
- **Supplier Modification**: Updates mutable fields of a supplier document (such as address, phone, email, or notes) after validating permissions. [Confirmed] (`` `service_method|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierService|updateSupplier|#1` ``, `` `call_expression|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierController.default.update|updateSupplier|request.supplierId,dataToUpdate|#1` ``).
- **Supplier Deletion**: Deletes a supplier profile from Firestore and cascades the deletion to all associated supplier staff members, cleaning up their related credentials, pincodes, and accesses. [Confirmed] (`` `service_method|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierService|deleteSupplier|#1` ``, `` `call_expression|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierStaffService._deleteStaffMemberAndRelatedData|deleteSupplier|supplierId,staff.id|#1` ``).

---

#### supplierStaff

- **Supplier Staff Lifecycle Management**: Handles creating, retrieving, updating, and deleting staff member profiles under a specific supplier. [Confirmed] (Citations: `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKSupplierStaffService|createStaffMember|#1` ``, `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKSupplierStaffService|updateStaffMember|#1` ``, `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKSupplierStaffService|deleteStaffMember|#1` ``)
- **Time-Bound Access Provisioning**: Grants and modifies scheduled access to specific buildings and doors for supplier staff. [Confirmed] (Citations: `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKSupplierStaffService|createSupplierStaffAccess|#1` ``, `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKSupplierStaffService|updateSupplierStaffAccessDoors|#1` ``)
- **Offline Pincode Generation**: Generates and manages alphanumeric PIN codes associated with staff accesses for offline edge validation on Access Control Devices (ACDs). [Confirmed] (Citations: `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_pincode.service.ts|OSKSupplierStaffPincodeService|createPincodeDocument|#1` ``, `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKSupplierStaffService|getAllStaffMemberPincodes|#1` ``)
- **Activity Logging & Aggregation**: Records door access events triggered by supplier staff and maintains a 30-day rolling aggregate of their activities. [Confirmed] (Citations: `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity.service.ts|OSKSupplierStaffActivityService|ActivityReceivedForSupplierStaff|#1` ``, `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity_aggregates.service.ts|OSKSupplierStaffActivityAggregatesService|ActivityReceivedForSupplierStaff|#1` ``)
- **Hardware Synchronization**: Decouples access state changes by publishing updates asynchronously to physical ACDs via Pub/Sub. [Confirmed] (Citations: `` `call_expression|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|_deleteAccessSideEffects|staffId,buildingId,{                 operation: OSKAccessMessageOperation.Delete,                 accessId: access.accessId,                 creationDate: access.creationDate,             },access.authorizedDoors|#1` ``)

### 4. Public Interfaces

#### _module_root

- **`OSKSupplierController`**: Extends `OSKDocumentController` to manage direct Firestore operations on the `/suppliers` collection. [Confirmed] (`` `source_class|supplier|functions/src/modules/supplier/controllers/supplier.controller.ts|OSKSupplierController` ``, `` `functions/src/modules/supplier/controllers/supplier.controller.ts` (lines 11-56) ``).
- **`OSKSupplierService`**: Orchestrates business logic, parameter validation, permission checks, and logging for all supplier-related operations. [Confirmed] (`` `source_class|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierService` ``, `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 30-245) ``).
- **`getCallableFunctionTriggers`**: The module's root entry point that registers and exports HTTPS callable Cloud Functions for client consumption. [Confirmed] (`` `function_declaration|supplier|functions/src/modules/supplier/index.ts|getCallableFunctionTriggers|#1` ``, `` `functions/src/modules/supplier/index.ts` (lines 40-50) ``).

---

#### supplierStaff

- **OSKSupplierStaffController**: Document controller managing the `/suppliers/{supplierId}/staffMembers` collection. [Confirmed] (Citation: `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff.controller.ts|OSKSupplierStaffController` ``)
- **OSKSupplierStaffAccessController**: Document controller managing the `/suppliers/{supplierId}/staffMembers/{staffId}/accesses` collection. [Confirmed] (Citation: `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_access.controller.ts|OSKSupplierStaffAccessController` ``)
- **OSKSupplierStaffPincodeController**: Document controller managing the `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes` collection. [Confirmed] (Citation: `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_pincode.controller.ts|OSKSupplierStaffPincodeController` ``)
- **OSKSupplierStaffActivitiesController**: Document and message controller managing the `/suppliers/{supplierId}/staffMembers/{staffId}/activities` collection. [Confirmed] (Citation: `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity.controller.ts|OSKSupplierStaffActivitiesController` ``)
- **OSKSupplierStaffActivityAggregatesController**: Document controller managing the `/suppliers/{supplierId}/staffMembers/{staffId}/activityAggregates` collection. [Confirmed] (Citation: `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity_aggregates.controller.ts|OSKSupplierStaffActivityAggregatesController` ``)
- **getCallableFunctionTriggers**: Exposes the callable Cloud Functions for external clients. [Confirmed] (Citation: `` `function_declaration|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|getCallableFunctionTriggers|#1` ``)

### 5. Internal Structure

*Note: This section contains the intra-module coupling analysis only.*

The module exhibits a tight, bidirectional coupling between its two submodules, `_module_root` and `supplierStaff`. This circular dependency is a key structural characteristic of the module:

- **`_module_root` to `supplierStaff` Coupling**: `_module_root` depends on `supplierStaff` to coordinate cascading deletions of staff members when a parent supplier is deleted. This is evidenced by `supplier.service.ts` importing and calling `OSKSupplierStaffController` and `OSKSupplierStaffService`. **Confirmed**.
- **`supplierStaff` to `_module_root` Coupling**: `supplierStaff` depends on `_module_root` to validate parent supplier contexts during staff lifecycle and activity operations. This is evidenced by `supplier_staff_activity_aggregates.service.ts`, `supplier_staff_activity.service.ts`, and `supplier_staff.service.ts` importing `OSKSupplierService`, `OSKSupplierController`, and `OSKSupplierStaffPincodeController`. **Confirmed**.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains the cross-cutting data ownership conclusion only.*

The `supplier` module is the primary owner of the `/suppliers` collection tree, including all nested subcollections:
- `/suppliers/{supplierId}`
- `/suppliers/{supplierId}/staffMembers`
- `/suppliers/{supplierId}/staffMembers/{staffId}/accesses`
- `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes`
- `/suppliers/{supplierId}/staffMembers/{staffId}/activities`
- `/suppliers/{supplierId}/staffMembers/{staffId}/activityAggregates`

**Confirmed** (evidenced by full CRUD operations originating from this module's controllers).

However, the `supplierStaff` submodule also performs direct read and write operations on `/buildings/{buildingId}/accesses`. The primary owner of the `/buildings/**` path is the `building` module (**Inferred** from the path structure and domain hierarchy). The `supplier` module acts as a secondary writer to this shared path to register staff-specific access permissions within the building's ledger. **Inferred**.

Data Ownership Hints indicate that the `core` module frequently calls into this module's controllers (e.g., `OSKSupplierController`, `OSKSupplierStaffController`, `OSKSupplierStaffAccessService`) rather than accessing the `/suppliers` collections directly. This confirms that while `core` orchestrates global access workflows, it respects the `supplier` module's strict ownership of its data. **Confirmed**.

**Per-capability evidence:**

#### _module_root

### Firestore Paths
This capability owns and performs read/write operations on the following Firestore collection:

- **`/suppliers/{supplierId}`**
  - **Operation Scope**: Full CRUD (Create, Read, Update, Delete) [Confirmed] (`` `functions/src/modules/supplier/controllers/supplier.controller.ts` (lines 19-56) ``).
  - **Fields**:
    - `supplierId`: `string`
    - `name`: `string`
    - `siret`: `string` (optional)
    - `type`: `string` (optional)
    - `email`: `string` (optional)
    - `address`: `OSKStreetAddress` (optional)
    - `notes`: `string` (optional)
    - `organizationId`: `string`
    - `entityId`: `string`
    - `phone`: `OSKPhoneNumber` (optional)
    - `creationDate`: `Timestamp`

---

#### supplierStaff

### Firestore Paths Touch Map
The capability owns and manages the following Firestore paths:

| Path | Operations | Detection Scope | Citation |
|---|---|---|---|
| `/suppliers/{supplierId}/staffMembers` | Read, Write | Submodule | `` `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff.controller.ts` (lines 19-21) `` |
| `/suppliers/{supplierId}/staffMembers/{staffId}/accesses` | Read, Write | Submodule | `` `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_access.controller.ts` (lines 13-15) `` |
| `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes` | Read, Write | Submodule | `` `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_pincode.controller.ts` (lines 16-18) `` |
| `/suppliers/{supplierId}/staffMembers/{staffId}/activities` | Read, Write | Submodule | `` `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity.controller.ts` (lines 13-15) `` |
| `/suppliers/{supplierId}/staffMembers/{staffId}/activityAggregates` | Read, Write | Submodule | `` `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity_aggregates.controller.ts` (lines 17-19) `` |
| `/buildings/{buildingId}/accesses` | Read, Write | Submodule | `` `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (lines 521-527, 707-713) `` |

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable Cloud Functions
The following callable functions are exposed by this capability:

#### `createSupplier`
- **Request Type**: `OSKSupplier`
  - `address`: `OSKStreetAddress` (optional)
  - `email`: `string` (optional)
  - `entityId`: `string`
  - `name`: `string`
  - `notes`: `string` (optional)
  - `organizationId`: `string`
  - `phone`: `OSKPhoneNumber` (optional)
  - `siret`: `string` (optional)
  - `supplierId`: `string` (optional)
  - `type`: `string` (optional)
- **Response Type**: `Promise<HttpsResponse>` [Confirmed] (`` `api_contract|supplier|functions/src/modules/supplier/index.ts|createSupplier|#1` ``).

#### `getSupplier`
- **Request Type**: `OSKGetSupplierRequest`
  - `organizationId`: `string`
  - `supplierId`: `string`
- **Response Type**: `Promise<HttpsResponse>` [Confirmed] (`` `api_contract|supplier|functions/src/modules/supplier/index.ts|getSupplier|#1` ``).

#### `getAllSuppliers`
- **Request Type**: `OSKGetAllSuppliersRequest`
  - `organizationId`: `string`
- **Response Type**: `Promise<HttpsResponse>` [Confirmed] (`` `api_contract|supplier|functions/src/modules/supplier/index.ts|getAllSuppliers|#1` ``).

#### `updateSupplier`
- **Request Type**: `OSKUpdateSupplierRequest`
  - `organizationId`: `string`
  - `supplierId`: `string`
  - `dataToUpdate`: `UpdateData<OSKSupplier>`
- **Response Type**: `Promise<HttpsResponse>` [Confirmed] (`` `api_contract|supplier|functions/src/modules/supplier/index.ts|updateSupplier|#1` ``).

#### `deleteSupplier`
- **Request Type**: `OSKDeleteSupplierRequest`
  - `organizationId`: `string`
  - `supplierId`: `string`
- **Response Type**: `Promise<HttpsResponse>` [Confirmed] (`` `api_contract|supplier|functions/src/modules/supplier/index.ts|deleteSupplier|#1` ``).

*Note: No Firestore triggers are directly owned by this capability's root files.* [Confirmed] (`` `functions/src/modules/supplier/index.ts` (lines 40-50) ``).

---

#### supplierStaff

### Callable Functions
The following callable functions are exposed by this capability:

#### `createStaffMember`
- **Request Type**: `OSKSupplierStaff`
  ```typescript
  {
    email?: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    phone?: OSKPhoneNumber;
    staffId?: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<void>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|createStaffMember|#1` ``

#### `createSupplierStaffAccess`
- **Request Type**: `OSKCreateSupplierStaffAccessRequest`
  ```typescript
  {
    endDate: Date;
    organizationId: string;
    staffId: string;
    startDate: Date;
    supplierId: string;
    targets: { buildingId: string; doorIds?: string[]; }[];
  }
  ```
- **Response Type**: `Promise<void>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|createSupplierStaffAccess|#1` ``

#### `createSupplierStaffWithAccess`
- **Request Type**: `OSKCreateSupplierStaffWithAccessRequest`
  ```typescript
  {
    endDate: Date;
    startDate: Date;
    targets: { buildingId: string; doorIds?: string[]; }[];
  }
  ```
- **Response Type**: `OSKCreateSupplierStaffWithAccessResponse`
  ```typescript
  {
    accessInfos: { buildingId: string; accessId: string; pincode: string | null; }[];
    staffId: string;
  }
  ```
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|createSupplierStaffWithAccess|#1` ``

#### `deleteStaffMember`
- **Request Type**: `OSKDeleteSupplierStaffRequest`
  ```typescript
  {
    organizationId: string;
    staffId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<void>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|deleteStaffMember|#1` ``

#### `deleteSupplierStaffAccess`
- **Request Type**: `OSKDeleteSupplierStaffAccessRequest`
  ```typescript
  {
    accessId: string;
    buildingId: string;
    organizationId: string;
    staffId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<void>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|deleteSupplierStaffAccess|#1` ``

#### `getAllAccessesForAllBuildings`
- **Request Type**: `OSKGettAllSupplierStaffAccessesInfosRequest`
  ```typescript
  {
    organizationId: string;
    staffId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<OSKGetAllSupplierStaffAccessesInfosResponse>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|getAllAccessesForAllBuildings|#1` ``

#### `getAllStaffMemberPincodes`
- **Request Type**: `OSKGetAllSupplierStaffPincodesRequest`
  ```typescript
  {
    organizationId: string;
    staffId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<void>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|getAllStaffMemberPincodes|#1` ``

#### `getAllStaffMembers`
- **Request Type**: `OSKGetAllSupplierStaffRequest`
  ```typescript
  {
    organizationId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<void>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|getAllStaffMembers|#1` ``

#### `getStaffMember`
- **Request Type**: `OSKGetSupplierStaffRequest`
  ```typescript
  {
    organizationId: string;
    staffId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<void>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|getStaffMember|#1` ``

#### `updateStaffMember`
- **Request Type**: `OSKUpdateSupplierStaffRequest`
  ```typescript
  {
    dataToUpdate: UpdateData<OSKDocument<OSKSupplierStaff>>;
    organizationId: string;
    staffId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<void>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|updateStaffMember|#1` ``

#### `updateSupplierStaffAccessDoors`
- **Request Type**: `OSKUpdateSupplierStaffAccessDoorsRequest`
  ```typescript
  {
    buildingId: string;
    doorIds?: string[];
    organizationId: string;
    staffId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<void>` (Implicit)
- **Citation**: `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|updateSupplierStaffAccessDoors|#1` ``

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains cross-cutting security and risk callouts only.*

### Enforcement Symmetry Tally
Both the `_module_root` and `supplierStaff` capabilities consistently enforce the same set of RBAC permissions for their respective administrative operations:
- `v1.org.suppliers.create` (Supplier and Staff creation)
- `v1.org.suppliers.view` (Supplier and Staff viewing/listing)
- `v1.org.suppliers.edit` (Supplier and Staff modification)
- `v1.org.suppliers.delete` (Supplier and Staff deletion)

Both capabilities consistently decorate their service methods with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` to ensure the requesting user is authenticated, while bypassing direct user-ID-to-document matching since suppliers are administrative entities rather than standard residential users. **Confirmed**.

### Security Rules Mismatch
There is a critical structural mismatch between the backend implementation and the database security rules:
- **No Firestore Rules**: The `firestore.rules.txt` file contains **no rules** for the `/suppliers` collection or any of its subcollections.
- **Enforced Backend-Only Pattern**: Because of this omission, direct client-side access to `/suppliers/**` is completely blocked by the default catch-all rule (`match /{document=**} { allow read, write: if false; }`). All operations on these collections must be mediated strictly through backend Cloud Functions. While this enforces a secure "backend-only" access pattern, it represents a structural risk if client-side SDKs ever expect direct read access to supplier profiles or staff activities. **Confirmed**.

**Per-capability evidence:**

#### _module_root

This capability enforces Role-Based Access Control (RBAC) by checking the requesting user's consolidated roles against specific permission strings:

- **`v1.org.suppliers.create`**: Required to create a new supplier profile. [Confirmed] (`` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.create|#1` ``).
- **`v1.org.suppliers.view`**: Required to retrieve a single supplier or list all suppliers. [Confirmed] (`` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.view|#1` ``, `` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.view|#2` ``).
- **`v1.org.suppliers.edit`**: Required to update an existing supplier profile. [Confirmed] (`` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.edit|#1` ``).
- **`v1.org.suppliers.delete`**: Required to delete a supplier profile. [Confirmed] (`` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.delete|#1` ``).

### Security Decorators
All service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` to ensure the user is authenticated, while bypassing direct user-ID-to-document matching since suppliers are administrative entities. [Confirmed] (`` `call_expression|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKUserSecurityChecks|createSupplier|{ checkUserIdMatch: false }|#1` ``).

### Alignment with RBAC Roles Document
All permission strings checked by this capability align exactly with the definitions in the `rbac-roles.json` reference document. [Confirmed].

---

#### supplierStaff

### RBAC Permissions Check
The capability references the following permission strings, which have been cross-checked against the RBAC roles document:

- `v1.org.suppliers.create`: Used to authorize creating a new supplier staff member. [Confirmed] (Citation: `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.create|#1` ``)
- `v1.org.suppliers.delete`: Used to authorize deleting a supplier staff member. [Confirmed] (Citation: `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.delete|#1` ``)
- `v1.org.suppliers.edit`: Used to authorize updating staff details, creating accesses, and updating door permissions. [Confirmed] (Citation: `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.edit|#1` ``)
- `v1.org.suppliers.view`: Used to authorize viewing staff profiles, accesses, pincodes, and activities. [Confirmed] (Citation: `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.view|#1` ``)

### Security Rules Mismatch
- **Critical Finding**: The `firestore.rules.txt` file does **not** contain any rules for the `/suppliers` collection or its subcollections. Consequently, direct client-side access to `/suppliers/**` is blocked by the default catch-all rule (`match /{document=**} { allow read, write: if false; }`). All operations on these collections must be mediated strictly through backend Cloud Functions. [Confirmed]

### 10. Cross-Module Relationships

#### Outbound Dependencies
- **`access_control_device`**: The `supplierStaff` submodule depends on this module to import activity enrichment types (`ActivityUserType`, `EnrichedActivityData`) used when processing contractor entry events. **Confirmed**.
- **`building`**: The `supplierStaff` submodule depends on this module to retrieve building and door details, and to manage building-level accesses. It calls `OSKBuildingController.getSafe`, `OSKBuildingController.get`, `OSKBuildingDoorController.get`, `OSKBuildingDoorController.getAll`, and `OSKBuildingAccessesController` methods. **Confirmed**.
- **`core`**: The module depends heavily on `core` for base document controller CRUD operations (`OSKDocumentController`, `OSKDocumentAndMessageController`), logging (`OSKLoggingService`), access ID generation (`OSKAccessUtilsService`), and publishing access messages to physical hardware (`OSKAccessMessagePublisherService`, `OSKPincodeService`, `OSKAccessService`). **Confirmed**.
- **`organization`**: The module depends on this module to retrieve organization, entity, and organization user details to validate administrative contexts. It calls `OSKOrganizationUserController.get`, `OSKOrganizationController.get`, and `OSKEntityController.get`. **Confirmed**.
- **`settings`**: The module depends on this module to check consolidated user permissions against RBAC roles. It calls `OSKConsolidatedRolesController.checkUserPermissions`. **Confirmed**.
- **`user`**: The `supplierStaff` submodule depends on this module to define and manage user access types and authorized doors, importing `OSKAccessBase` and `OSKUserAccessType`. **Confirmed**.

#### Inbound Dependencies
- **`core`**: The `core` module depends on the `supplier` module to orchestrate pincode generation, access setup, and activity ingestion. It calls `OSKSupplierStaffPincodeController.getByAccessId`, `OSKSupplierStaffPincodeService.createPincodeDocument`, `OSKSupplierController.getSafe`, `OSKSupplierStaffAccessService` methods, `OSKSupplierStaffController.getSafe`, `OSKSupplierStaffActivityAggregatesService.ActivityReceivedForSupplierStaff`, and `OSKSupplierStaffActivityService.ActivityReceivedForSupplierStaff`. **Confirmed**.
- **`user`**: The `user` module imports `OSKSupplierStaffAccess` from this module for user access document modeling. **Confirmed**.

### 11. External Hooks

#### _module_root

No external hooks (such as Pub/Sub publishers, external HTTP client calls, or Cloud Storage paths) are directly evidenced within this capability's root files. [Confirmed].

---

#### supplierStaff

- **ACD Synchronization (Pub/Sub)**: State changes in accesses (creates, updates, deletes) trigger calls to `OSKAccessMessagePublisherService.publishMessageToAllACDs`, which publishes messages asynchronously to physical edge hardware (Intercom/Digicom) via Pub/Sub. [Confirmed] (Citation: `` `call_expression|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|updateSupplierStaffAccessDoors|staffId,buildingId,{                 operation: OSKAccessMessageOperation.Update,                 accessId: accessToUpdate.accessId,                 accessRights: accessToUpdate.accessRights,                 creationDate: accessToUpdate.creationDate,                 isMainAccess: accessToUpdate.isMainAccess,             },newAuthorizedDoors,{ category: 'supplierStaff', supplierId: supplierId }|#1` ``)
- **Offline Keypad Entry**: Alphanumeric PIN codes generated by this capability are synchronized to physical ACDs, allowing offline validation at the door barrier. [Confirmed] (Citation: `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_pincode.service.ts|OSKSupplierStaffPincodeService|createPincodeDocument|#1` ``)

### 12. Architectural Observations

- **Circular Submodule Coupling**: The bidirectional import relationship between `_module_root` and `supplierStaff` indicates that these submodules are highly cohesive but structurally coupled. Changes to the lifecycle of a Supplier directly impact Staff management, and vice versa, suggesting they function as a single domain unit despite the directory split. **Confirmed**.
- **Orchestration Delegation**: The module does not directly generate PIN codes or communicate with physical edge devices. Instead, it manages the administrative state of the supplier and delegates the actual credential generation and IoT delta synchronization to `core`'s orchestration services (`OSKAccessService`, `OSKPincodeService`, `OSKAccessMessagePublisherService`). **Confirmed**.
- **Strict Backend Mediation**: The complete absence of `/suppliers` rules in `firestore.rules.txt` indicates a strict architectural decision to prevent any direct client-side Firestore queries, routing all supplier-related operations through backend Cloud Functions. **Inferred**.

### 13. Risks & Open Questions

**Cross-cutting risks:**

#### Cross-Cutting Risks
- **Circular Submodule Dependency**: The bidirectional import relationship between `_module_root` and `supplierStaff` submodules violates strict layering principles and could lead to runtime initialization issues or maintenance friction. **Confirmed**.
- **Firestore Rules Gap**: The complete lack of security rules for `/suppliers/**` in `firestore.rules.txt` blocks all direct client-side reads. If the mobile app or PGO portal attempts to query these collections directly (rather than via Cloud Functions), those requests will fail. **Confirmed**.
- **Shared Collection Write Risk**: The `supplierStaff` capability directly modifies `/buildings/{buildingId}/accesses`. Writing to a collection owned by another module (`building`) without going through that module's controller interface bypasses potential validation logic and couples the two modules tightly at the database layer. **Inferred**.
- **Validation of Complex Nested Objects**: It is unclear if deep schema validation is performed at the application layer for nested objects like `address` (`OSKStreetAddress`) and `phone` (`OSKPhoneNumber`) during creation, or if the system relies entirely on Firestore rules (which are currently absent for this collection). **Inferred**.

**Per-capability open questions:**

#### _module_root

- **Validation of Nested Objects**: How are nested objects like `address` (`OSKStreetAddress`) and `phone` (`OSKPhoneNumber`) validated during creation? The `OSKSecurityChecks.checkParameters` utility validates their types as `'object'`, but it is unclear if deep schema validation is performed at the application layer or if it relies entirely on Firestore rules. [Inferred] (`` `call_expression|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSecurityChecks.checkParameters|createSupplier|[...]|#1` ``).
- **Submodule Interactions**: Are there other submodules besides `supplierStaff` that interact with the root `supplier` module, or is `supplierStaff` the sole dependent submodule? [Inferred] (`` `imports_dependency|supplier|functions/src/modules/supplier/index.ts|./modules/supplierStaff|#1` ``).

#### supplierStaff

- **Trigger Vector for Activity Ingestion**: How is `ActivityReceivedForSupplierStaff` triggered? Is it called directly from a Firestore trigger in the `access_control_device` module, or does it subscribe to a Pub/Sub topic? [Unknown]
- **Missing Firestore Rules**: Is the absence of `/suppliers` rules in `firestore.rules.txt` intentional to enforce a strict Cloud-Functions-only access pattern, or is it a gap in the security rules? [Unknown]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.