### 0. Generation Metadata

- **runId**: `20260829_081559-00e1d9fd`
- **generatedAt**: `2026-08-29T13:36:33.932Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `supplier`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `supplier` module manages the lifecycle, access configurations, offline alphanumeric PIN credentials, and access activity logs of third-party service providers (Suppliers) and their personnel (Supplier Staff) who require time-bound, auditable access to building doors managed by the platform. **Confirmed**. It enforces strict organization-level and entity-level security boundaries via server-side Role-Based Access Control (RBAC) and propagates access state changes asynchronously to edge Access Control Devices (ACDs). **Confirmed**.

### 2. Architectural Position

The `supplier` module sits under the organization scope, managing third-party operational actors (Suppliers and Supplier Staff) who do not participate in the standard residential occupancy models. **Confirmed**. It bridges administrative configurations defined in the Property Manager Portal (PGO) with physical access execution by interfacing with the `core` module's access orchestration layer and building-scoped access lists. **Confirmed**. It provides capabilities for supplier profile management, staff onboarding, time-bound access provisioning, PIN generation, and activity log aggregation. **Confirmed**.

### 3. Primary Responsibilities

#### _module_root

### Supplier Profile Creation
- Validates input parameters (such as name, email, siret, and organization/entity IDs) using a security utility `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 35-43) ``. [Confirmed]
- Verifies that the target organization and entity exist and are valid `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 45-49, 64-68) ``. [Confirmed]
- Enforces the `v1.org.suppliers.create` permission for the calling user `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 55-61) ``. [Confirmed]
- Generates a unique supplier ID and writes the new supplier document to Firestore with a creation timestamp `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 69-77) ``. [Confirmed]

### Supplier Profile Retrieval
- Supports retrieving a single supplier profile by its ID (`getSupplier`) `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 82-115) ``. [Confirmed]
- Supports querying all supplier profiles belonging to a specific organization (`getAllSuppliers`) `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 116-146) ``. [Confirmed]
- Enforces the `v1.org.suppliers.view` permission for both single and bulk retrieval operations `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 101-107, 134-140) ``. [Confirmed]

### Supplier Profile Modification
- Allows updating specific fields of an existing supplier profile (`updateSupplier`) `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 148-188) ``. [Confirmed]
- Enforces the `v1.org.suppliers.edit` permission for the calling user `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 168-174) ``. [Confirmed]
- Updates the modification timestamp and logs the update operation `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 181-187) ``. [Confirmed]

### Supplier Profile Deletion & Cascading Cleanup
- Deletes a supplier profile from Firestore (`deleteSupplier`) `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 190-233) ``. [Confirmed]
- Enforces the `v1.org.suppliers.delete` permission for the calling user `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 209-215) ``. [Confirmed]
- Queries all associated staff members of the deleted supplier and cascades deletion to their profiles, pincodes, and accesses via the `supplierStaff` submodule `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 222-228) ``. [Confirmed]

---

#### supplierStaff

- **Staff Member Lifecycle Management**: Provides administrative interfaces to create, retrieve, update, and delete Supplier Staff profiles under a specific Supplier organization `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|createStaffMember|#1` `` [Confirmed].
- **Access Provisioning & Door Authorization**: Grants and revokes time-bound access permissions for staff members to specific buildings and doors `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|createSupplierStaffAccess|#1` `` [Confirmed]. It allows updating the authorized doors for an existing access record `` `api_contract|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|updateSupplierStaffAccessDoors|#1` `` [Confirmed].
- **PIN Code Generation & Management**: Generates offline alphanumeric PIN codes associated with granted accesses, saves them to the database, and handles cleanup (moving to trash and notifying hardware) when access is deleted `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_pincode.service.ts|OSKSupplierStaffPincodeService|createPincodeDocument|#1` `` [Confirmed].
- **Activity Logging & Aggregation**: Ingests raw door unlock events triggered by Supplier Staff, enriches them with business context, and aggregates them into a rolling 30-day window per building `` `service_method|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity_aggregates.service.ts|OSKSupplierStaffActivityAggregatesService|ActivityReceivedForSupplierStaff|#1` `` [Confirmed]. It automatically prunes activities older than 30 days during aggregation `` `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity_aggregates.service.ts` (lines 86-91) `` [Confirmed].

### 4. Public Interfaces

#### _module_root

### Controllers
- **`OSKSupplierController`**: Extends `OSKDocumentController` to handle direct Firestore operations (get, set, update, delete, query) on the `/suppliers` collection. `` `functions/src/modules/supplier/controllers/supplier.controller.ts` (lines 11-56) ``. [Confirmed]

### Services
- **`OSKSupplierService`**: Orchestrates business logic, parameter validation, permission checks, and coordinates cascading deletion with the `supplierStaff` submodule. `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 30-244) ``. [Confirmed]

### Entry Points
- **`getCallableFunctionTriggers`**: Exposes the module's capabilities as Firebase HTTPS Callable Functions. `` `functions/src/modules/supplier/index.ts` (lines 40-50) ``. [Confirmed]

---

#### supplierStaff

This capability exposes the following controllers and services as internal and external entry points:

### Document Controllers (Firestore Direct Access)
- **`OSKSupplierStaffController`**: Manages the persistence of Supplier Staff documents under `/suppliers/{supplierId}/staffMembers` `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff.controller.ts|OSKSupplierStaffController` `` [Confirmed].
- **`OSKSupplierStaffAccessController`**: Manages the persistence of time-bound access records under `/suppliers/{supplierId}/staffMembers/{staffId}/accesses` `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_access.controller.ts|OSKSupplierStaffAccessController` `` [Confirmed].
- **`OSKSupplierStaffPincodeController`**: Manages the persistence of generated PIN codes under `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes` `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_pincode.controller.ts|OSKSupplierStaffPincodeController` `` [Confirmed].
- **`OSKSupplierStaffActivitiesController`**: Manages raw activity logs under `/suppliers/{supplierId}/staffMembers/{staffId}/activities` `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity.controller.ts|OSKSupplierStaffActivitiesController` `` [Confirmed].
- **`OSKSupplierStaffActivityAggregatesController`**: Manages aggregated activity logs under `/suppliers/{supplierId}/staffMembers/{staffId}/activityAggregates` `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity_aggregates.controller.ts|OSKSupplierStaffActivityAggregatesController` `` [Confirmed].

### Orchestration Services
- **`OSKSupplierStaffService`**: Orchestrates staff creation, updates, deletion, and access provisioning `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKSupplierStaffService` `` [Confirmed].
- **`OSKSupplierStaffAccessService`**: Orchestrates retrieval of accesses and pincodes across buildings `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_access.service.ts|OSKSupplierStaffAccessService` `` [Confirmed].
- **`OSKSupplierStaffPincodeService`**: Orchestrates PIN code document creation `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_pincode.service.ts|OSKSupplierStaffPincodeService` `` [Confirmed].
- **`OSKSupplierStaffActivityService`**: Orchestrates raw activity ingestion and retrieval `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity.service.ts|OSKSupplierStaffActivityService` `` [Confirmed].
- **`OSKSupplierStaffActivityAggregatesService`**: Orchestrates activity aggregation and building-scoped activity queries `` `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity_aggregates.service.ts|OSKSupplierStaffActivityAggregatesService` `` [Confirmed].

### 5. Internal Structure

*Note: This section contains only the cross-submodule coupling analysis.*

The `supplier` module exhibits tight, bidirectional coupling between its two submodules, `_module_root` and `supplierStaff`:
- **`_module_root` to `supplierStaff`**: The root module depends on the staff submodule to coordinate staff-level operations, evidenced by `functions/src/modules/supplier/index.ts` and `supplier.service.ts` importing `OSKSupplierStaffController` and `OSKSupplierStaffService`. **Confirmed**.
- **`supplierStaff` to `_module_root`**: The staff submodule depends on the root module to resolve parent supplier contexts, evidenced by `supplier_staff_activity_aggregates.service.ts` and `supplier_staff_activity.service.ts` importing `OSKSupplierService`, and `supplier_staff.service.ts` importing `OSKSupplierController` and `OSKSupplierStaffPincodeController`. **Confirmed**.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains only the data ownership conclusions.*

The `supplier` module is the definitive owner of the `/suppliers` collection and all of its nested subcollections:
- `/suppliers` (Supplier profiles) **Confirmed**.
- `/suppliers/{supplierId}/staffMembers` (Staff profiles) **Confirmed**.
- `/suppliers/{supplierId}/staffMembers/{staffId}/accesses` (Time-bound access configurations) **Confirmed**.
- `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes` (Generated alphanumeric PINs) **Confirmed**.
- `/suppliers/{supplierId}/staffMembers/{staffId}/activities` (Raw access activity logs) **Confirmed**.
- `/suppliers/{supplierId}/staffMembers/{staffId}/activityAggregates` (Aggregated activity logs) **Confirmed**.

This ownership is **Confirmed** by the fact that all controllers managing these paths are defined within this module, and external modules (specifically `core`) only interact with these paths by calling into this module's services/controllers (e.g., `OSKSupplierStaffPincodeService`, `OSKSupplierStaffAccessService`).

The module also performs write operations on external collections `/buildings/{buildingId}/accesses` and `/buildings/{buildingId}/pincodes` to register/remove staff access and delete building-scoped PINs. These external modifications are side effects of access lifecycle changes orchestrated by the `supplierStaff` submodule. **Confirmed**.

**Per-capability evidence:**

#### _module_root

### Firestore Collections
- **`/suppliers`**: This capability owns and manages documents within the `/suppliers` collection.
  - **Read Operations**: `get` and `query` are executed via `OSKSupplierController` `` `functions/src/modules/supplier/controllers/supplier.controller.ts` (lines 26-28, 53-55) ``. [Confirmed]
  - **Write Operations**: `create` (`_set`), `update` (`_update`), and `delete` (`_delete`) are executed via `OSKSupplierController` `` `functions/src/modules/supplier/controllers/supplier.controller.ts` (lines 38-48) ``. [Confirmed]

---

#### supplierStaff

This capability owns and manages documents within the following Firestore collection paths:

### Owned Collections
- `/suppliers/{supplierId}/staffMembers`
  - **Description**: Stores the primary profile of a Supplier Staff member.
  - **Operations**: Create, Read, Update, Delete `` `controller_method|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff.controller.ts|OSKSupplierStaffController|getCollectionPath|#1` `` [Confirmed].
- `/suppliers/{supplierId}/staffMembers/{staffId}/accesses`
  - **Description**: Stores time-bound access configurations granted to the staff member.
  - **Operations**: Create, Read, Update, Delete `` `controller_method|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_access.controller.ts|OSKSupplierStaffAccessController|getCollectionPath|#1` `` [Confirmed].
- `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes`
  - **Description**: Stores the generated alphanumeric PIN codes associated with the staff member's accesses.
  - **Operations**: Create, Read, Delete `` `controller_method|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_pincode.controller.ts|OSKSupplierStaffPincodeController|getCollectionPath|#1` `` [Confirmed].
- `/suppliers/{supplierId}/staffMembers/{staffId}/activities`
  - **Description**: Stores raw access activity logs generated by the staff member.
  - **Operations**: Create, Read, Delete `` `controller_method|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity.controller.ts|OSKSupplierStaffActivitiesController|getCollectionPath|#1` `` [Confirmed].
- `/suppliers/{supplierId}/staffMembers/{staffId}/activityAggregates`
  - **Description**: Stores aggregated activity logs (e.g., rolling 30-day window) per building.
  - **Operations**: Create, Read, Update, Delete `` `controller_method|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity_aggregates.controller.ts|OSKSupplierStaffActivityAggregatesController|getCollectionPath|#1` `` [Confirmed].

### Accessed/Modified External Collections
- `/buildings/{buildingId}/accesses`
  - **Description**: Modifies building-scoped access lists to register or remove the Supplier Staff member's access.
  - **Operations**: Read, Update, Delete `` `call_expression|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKBuildingAccessesController.default.get|updateSupplierStaffAccessDoors|#1` `` [Confirmed].
- `/buildings/{buildingId}/pincodes`
  - **Description**: Deletes building-scoped PIN codes when access is revoked.
  - **Operations**: Delete `` `call_expression|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|_deleteAccessSideEffects|#1` `` [Confirmed].

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable Functions
The following callable functions are exposed by this capability `` `functions/src/modules/supplier/index.ts` (lines 44-48) ``:
- `createSupplier` [Confirmed]
- `getSupplier` [Confirmed]
- `getAllSuppliers` [Confirmed]
- `updateSupplier` [Confirmed]
- `deleteSupplier` [Confirmed]

### Resolved API Request/Response Schemas

#### `createSupplier`
- **Request Type**: `OSKSupplier`
```typescript
address	import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress | undefined	(optional)
email	string | undefined	(optional)
entityId	string
name	string
notes	string | undefined	(optional)
organizationId	string
phone	import("functions/src/modules/core/models/shared/phone_number.model").OSKPhoneNumber | undefined	(optional)
siret	string | undefined	(optional)
supplierId	string | undefined	(optional)
type	string | undefined	(optional)
```

#### `getSupplier`
- **Request Type**: `OSKGetSupplierRequest`
```typescript
organizationId	string
supplierId	string
organizationId	string
supplierId	string
```

#### `getAllSuppliers`
- **Request Type**: `OSKGetAllSuppliersRequest`
```typescript
organizationId	string
organizationId	string
```

#### `updateSupplier`
- **Request Type**: `OSKUpdateSupplierRequest`
```typescript
dataToUpdate	UpdateData<import("functions/src/modules/core/models/documents/document.model").OSKDocument<T>>
organizationId	string
supplierId	string
dataToUpdate	UpdateData<import("functions/src/modules/core/models/documents/document.model").OSKDocument<T>>
organizationId	string
supplierId	string
```

#### `deleteSupplier`
- **Request Type**: `OSKDeleteSupplierRequest`
```typescript
organizationId	string
supplierId	string
organizationId	string
supplierId	string
```

---

#### supplierStaff

The capability exposes 11 callable Cloud Functions registered via `getCallableFunctionTriggers` `` `function_declaration|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|getCallableFunctionTriggers|#1` ``. No Firestore triggers are owned by this capability [Confirmed].

### Resolved API Request/Response Schemas

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

#### `getAllStaffMemberPincodes`
- **Request Type**: `OSKGetAllSupplierStaffPincodesRequest`
  ```typescript
  {
    organizationId: string;
    staffId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<OSKSupplierStaffPincode[]>` (Implicit)

#### `getAllStaffMembers`
- **Request Type**: `OSKGetAllSupplierStaffRequest`
  ```typescript
  {
    organizationId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<OSKSupplierStaff[]>` (Implicit)

#### `getStaffMember`
- **Request Type**: `OSKGetSupplierStaffRequest`
  ```typescript
  {
    organizationId: string;
    staffId: string;
    supplierId: string;
  }
  ```
- **Response Type**: `Promise<OSKSupplierStaff>` (Implicit)

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

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains only cross-cutting risk callouts and RBAC alignment analysis.*

- **Mental Enforcement Tally**: Both `_module_root` and `supplierStaff` consistently enforce RBAC checks across all sensitive operations. There is no security asymmetry between the submodules; all reads, writes, deletes, and access provisioning operations require valid permission checks (`v1.org.suppliers.create`, `v1.org.suppliers.view`, `v1.org.suppliers.edit`, `v1.org.suppliers.delete`). **Confirmed**.
- **RBAC Mismatch**: The RBAC roles document defines the permission `v1.org.suppliers.list` ("Allows to view the list of service providers"). However, the implementation of `getAllSuppliers` in `_module_root` checks `v1.org.suppliers.view` instead of `v1.org.suppliers.list`. This represents an architectural mismatch where the list-specific permission is bypassed in favor of the view permission, leaving `v1.org.suppliers.list` unused in the codebase. **Confirmed**.
- **Firestore Rules Omission**: There are no explicit rules defined for `/suppliers` or its subcollections in `firestore.rules.txt`. Direct client-side reads and writes are blocked by the catch-all rule, enforcing a strict server-only execution pattern where all operations must go through callable Cloud Functions that programmatically enforce RBAC checks. **Confirmed**.

**Per-capability evidence:**

#### _module_root

### Enforced Permissions
The following permission strings are validated against the user's consolidated roles:
- **`v1.org.suppliers.create`**: Required to create a supplier profile `` `functions/src/modules/supplier/services/supplier.service.ts` (line 55) ``. [Confirmed]
- **`v1.org.suppliers.view`**: Required to view a single supplier or list all suppliers `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 101, 134) ``. [Confirmed]
- **`v1.org.suppliers.edit`**: Required to update a supplier profile `` `functions/src/modules/supplier/services/supplier.service.ts` (line 168) ``. [Confirmed]
- **`v1.org.suppliers.delete`**: Required to delete a supplier profile `` `functions/src/modules/supplier/services/supplier.service.ts` (line 209) ``. [Confirmed]

### Security Decorators
- All service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` to enforce authentication and basic security checks without requiring the target user ID to match the caller's UID `` `functions/src/modules/supplier/services/supplier.service.ts` (lines 33, 82, 116, 148, 190) ``. [Confirmed]

### RBAC Alignment & Mismatches
- The RBAC roles document lists a permission `v1.org.suppliers.list` ("Allows to view the list of service providers"). However, the implementation of `getAllSuppliers` checks `v1.org.suppliers.view` instead of `v1.org.suppliers.list` `` `functions/src/modules/supplier/services/supplier.service.ts` (line 134) ``. This represents a minor architectural mismatch where the list-specific permission is bypassed in favor of the view permission. [Confirmed]

---

#### supplierStaff

The capability enforces Role-Based Access Control (RBAC) by checking the calling user's consolidated roles against specific permission strings:

- **`v1.org.suppliers.create`**: Checked when creating a new Supplier Staff member `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.create|#1` `` [Confirmed].
- **`v1.org.suppliers.delete`**: Checked when deleting a Supplier Staff member `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.delete|#1` `` [Confirmed].
- **`v1.org.suppliers.edit`**: Checked when updating staff profiles `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.edit|#1` ``, creating staff access `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.edit|#2` ``, or deleting staff access `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.edit|#3` `` [Confirmed].
- **`v1.org.suppliers.view`**: Checked when retrieving staff profiles `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.view|#1` ``, listing staff members `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.view|#2` ``, viewing PIN codes `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|v1.org.suppliers.view|#3` ``, listing accesses `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_access.service.ts|v1.org.suppliers.view|#1` ``, or viewing activity logs `` `permission_candidate|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity.service.ts|v1.org.suppliers.view|#1` `` [Confirmed].

### RBAC Cross-Check
All permission strings checked in the code map exactly to the definitions in the `rbac-roles.json` grounding document [Confirmed].

### Firestore Rules Analysis
There are **no** explicit rules defined for the `/suppliers` collection or its subcollections in `firestore.rules.txt` [Confirmed]. Consequently, direct client-side reads and writes to these collections are blocked by the catch-all rule:
```javascript
match /{document=**} {
  allow read, write: if false;
}
```
This is a secure-by-design choice: all operations on Supplier Staff data must go through the serverless callable Cloud Functions, which programmatically enforce RBAC checks before executing database operations [Confirmed].

### 10. Cross-Module Relationships

The `supplier` module interacts with other modules in the repository through the following confirmed relationships:

#### Outbound Dependencies
- **`core`**: The module heavily relies on `core` for document persistence (`OSKDocumentController`, `OSKDocumentAndMessageController`), access orchestration (`OSKAccessService.createAccess`, `OSKAccessUtilsService`), logging (`OSKLoggingService`), and hardware synchronization (`OSKAccessMessagePublisherService.publishMessageToAllACDs`, `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash`). **Confirmed**.
- **`building`**: Relies on `building` to retrieve building details (`OSKBuildingController`), manage building-scoped accesses (`OSKBuildingAccessesController`), and resolve doors/devices (`OSKBuildingDoorController`). **Confirmed**.
- **`organization`**: Relies on `organization` to retrieve organization user profiles (`OSKOrganizationUserController`), organization details (`OSKOrganizationController`), and entity scopes (`OSKEntityController`). **Confirmed**.
- **`settings`**: Relies on `settings` to validate user permissions and roles (`OSKConsolidatedRolesController`). **Confirmed**.
- **`user`**: Imports types and models from `user` (`@oskey/user/access`) to define access options and authorized doors. **Confirmed**.
- **`access_control_device`**: Imports activity enrichment types (`ActivityUserType`, `EnrichedActivityData`) for logging. **Confirmed**.

#### Inbound Dependencies
- **`core`**: Calls into `supplier` to manage supplier staff PINs (`OSKSupplierStaffPincodeService.createPincodeDocument`, `OSKSupplierStaffPincodeController.getByAccessId`), setup/update staff access (`OSKSupplierStaffAccessService`), retrieve supplier/staff details (`OSKSupplierController.getSafe`, `OSKSupplierStaffController.getSafe`), and route incoming hardware events to staff activity logs (`OSKSupplierStaffActivityService`, `OSKSupplierStaffActivityAggregatesService`). **Confirmed**.
- **`user`**: Imports `OSKSupplierStaffAccess` type definitions. **Confirmed**.

### 11. External Hooks

#### _module_root

No external hooks (such as Pub/Sub topics, external HTTP webhooks, or Cloud Storage paths) are directly evidenced within this capability's pack. All interactions are handled synchronously via Cloud Functions and direct Firestore operations. [Confirmed]

---

#### supplierStaff

- **Asynchronous IoT Synchronization**: When access is updated or deleted, the capability publishes state updates to edge Access Control Devices (ACDs) asynchronously via `OSKAccessMessagePublisherService.publishMessageToAllACDs` `` `call_expression|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|_deleteAccessSideEffects|#1` `` [Confirmed].
- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally bypass App Check enforcement during local development or emulation `` `call_expression|supplier|functions/src/modules/supplier/modules/supplierStaff/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|#1` `` [Confirmed].

### 12. Architectural Observations

- **Separation of Concerns**: The module cleanly separates the high-level business entity of a "Supplier" (`_module_root`) from the operational, physical access-executing entity of "Supplier Staff" (`supplierStaff`). **Confirmed**.
- **Server-Only Execution Pattern**: By omitting `/suppliers` from `firestore.rules.txt`, the platform enforces that all supplier-related operations must go through server-side Cloud Functions. This ensures that RBAC checks cannot be bypassed by client-side SDK calls, maintaining a strong security boundary. **Confirmed**.
- **Event-Driven IoT Integration**: When supplier staff access is modified or revoked, the module does not communicate with hardware directly. Instead, it calls `OSKAccessMessagePublisherService.publishMessageToAllACDs` to publish the intended state asynchronously, decoupling business logic from edge device availability. **Confirmed**.
- **Dual-Write Access Ledger**: The module updates both the supplier-scoped accesses (`/suppliers/.../accesses`) and the building-scoped accesses (`/buildings/.../accesses`), maintaining a denormalized view optimized for both supplier-centric and building-centric queries. **Confirmed**.

### 13. Risks & Open Questions

**Cross-cutting risks:**

*Note: This section contains only cross-cutting risks and open questions.*

- **Unused RBAC Permission**: The permission `v1.org.suppliers.list` is defined in the RBAC roles document but is completely bypassed in the code (which uses `v1.org.suppliers.view` for listing suppliers). This creates a discrepancy between documented security roles and actual enforcement. **Confirmed**.
- **Manual PIN Distribution Risk**: Supplier Staff are Non-App Users (PIN-only) and do not use the mobile application. The codebase contains no automated mechanism (SMS/Email) to distribute generated PIN codes to staff members, implying a reliance on manual, out-of-band distribution by Property Managers or Supplier Admins, which introduces operational security risks. **Inferred**.
- **Firestore Rules Intentionality**: The complete omission of `/suppliers` from `firestore.rules.txt` blocks all client-side SDK access. While secure, it is unclear if this is a permanent architectural decision or an omission that might cause issues if client-side reads are required for PGO portal optimization in the future. **Inferred**.

**Per-capability open questions:**

#### _module_root

### Firestore Security Rules Mismatch
- The `firestore.rules.txt` file does not contain any match block or rules defined for the `/suppliers` collection. By default, the rules fall back to `allow read, write: if false;` `` `firestore.rules.txt` (lines 411-413) ``. This implies that clients cannot access the `/suppliers` collection directly via the Firestore Client SDK, and all operations must be performed through the Admin SDK within the Cloud Functions. Is this strict server-only access pattern intentional? [Inferred]

### Unused RBAC Permission
- Why is the `v1.org.suppliers.list` permission defined in the RBAC roles document but not utilized in the `getAllSuppliers` service method? [Inferred]

#### supplierStaff

- **PIN Code Communication**: Since Supplier Staff are Non-App Users (PIN-only) and do not install the Oskey mobile application, how are generated PIN codes securely communicated to them? The codebase does not show any automated SMS or email dispatch for Supplier Staff PINs, suggesting they must be manually extracted and shared by the Property Manager or Supplier Admin [Inferred].
- **Firestore Rules Omission**: Is the omission of `/suppliers` from `firestore.rules.txt` a permanent architectural decision to enforce 100% server-side execution, or is client-side read access planned for future PGO portal optimization? [Unknown].

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.