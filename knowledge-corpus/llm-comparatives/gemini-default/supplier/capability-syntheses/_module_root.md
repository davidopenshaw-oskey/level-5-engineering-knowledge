## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.528Z
- **repoName**: firebase-oskey-dev
- **targetModule**: supplier
- **capability**: _module_root
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `_module_root` capability of the `supplier` module provides the core administrative management of third-party service providers (Suppliers) within an organization. It exposes secure, permission-guarded callable APIs to create, retrieve, update, and delete supplier profiles, while orchestrating cascading cleanup of related supplier staff members and their associated credentials. (Confirmed, `functions/src/modules/supplier/index.ts` (lines 33-233))

---

## 2. Primary Responsibilities

### Supplier Profile Lifecycle Management
- **Create Supplier**: Provisions a new supplier profile document with metadata including name, SIRET, contact details, and organizational anchors. (Confirmed, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|createSupplier|#1` ``)
- **Retrieve Supplier**: Fetches a single supplier profile by ID or queries all suppliers associated with a specific organization. (Confirmed, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|getSupplier|#1` ``, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|getAllSuppliers|#1` ``)
- **Update Supplier**: Modifies existing supplier profile fields. (Confirmed, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|updateSupplier|#1` ``)
- **Delete Supplier**: Removes a supplier profile from the system. (Confirmed, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|deleteSupplier|#1` ``)

### Security & Permission Enforcement
- Validates that the calling user has the appropriate organization-level RBAC permissions (`v1.org.suppliers.create`, `v1.org.suppliers.view`, `v1.org.suppliers.edit`, `v1.org.suppliers.delete`) before executing any supplier operations. (Confirmed, `functions/src/modules/supplier/services/supplier.service.ts` (lines 55-210))
- Enforces parameter validation and context checks on incoming payloads. (Confirmed, `` `call_expression|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSecurityChecks.checkParameters|createSupplier|[             { name: 'context', value: context, type: 'object' },             { name: 'name', value: request.name, type: 'string' },             { name: 'siret', value: request.siret, type: 'string' },             { name: 'phone', value: request.phone, type: 'object', isOptional: true },             { name: 'email', value: request.email, type: 'string' },             { name: 'organizationId', value: request.organizationId, type: 'string' },             { name: 'entityId', value: request.entityId, type: 'string' },         ]|#1` ``)

### Cascading Deletion Orchestration
- When a supplier is deleted, the capability queries all associated supplier staff members and triggers their deletion along with their related data (such as PIN codes and accesses) to prevent orphaned credentials. (Confirmed, `` `call_expression|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierStaffService._deleteStaffMemberAndRelatedData|deleteSupplier|supplierId,staff.id|#1` ``)

---

## 3. Public Interfaces (Controllers & Entry Points)

### Controllers
- **`OSKSupplierController`** (extends `OSKDocumentController`): Manages direct Firestore document operations for the `/suppliers` collection, wrapping standard CRUD queries. (Confirmed, `` `source_class|supplier|functions/src/modules/supplier/controllers/supplier.controller.ts|OSKSupplierController` ``)

### Services
- **`OSKSupplierService`**: Orchestrates the business logic, permission checks, parameter validation, logging, and cascading submodule deletions. (Confirmed, `` `source_class|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierService` ``)

### Entry Points
- **`getCallableFunctionTriggers`**: Exports the HTTPS callable Cloud Functions that serve as the API gateway for client applications. (Confirmed, `` `function_declaration|supplier|functions/src/modules/supplier/index.ts|getCallableFunctionTriggers|#1` ``)

---

## 4. API Contracts & Firestore Triggers

### API Contracts

#### `createSupplier`
- **Type**: Callable HTTPS Function
- **Request Schema**: `OSKSupplier`
  ```typescript
  address?: import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress
  email?: string
  entityId: string
  name: string
  notes?: string
  organizationId: string
  phone?: import("functions/src/modules/core/models/shared/phone_number.model").OSKPhoneNumber
  siret?: string
  supplierId?: string
  type?: string
  ```
- **Response Schema**: `Promise<void>` (Confirmed, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|createSupplier|#1` ``)

#### `getSupplier`
- **Type**: Callable HTTPS Function
- **Request Schema**: `OSKGetSupplierRequest`
  ```typescript
  organizationId: string
  supplierId: string
  ```
- **Response Schema**: `Promise<OSKSupplierDocument>` (Confirmed, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|getSupplier|#1` ``)

#### `getAllSuppliers`
- **Type**: Callable HTTPS Function
- **Request Schema**: `OSKGetAllSuppliersRequest`
  ```typescript
  organizationId: string
  ```
- **Response Schema**: `Promise<OSKSupplierDocument[]>` (Confirmed, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|getAllSuppliers|#1` ``)

#### `updateSupplier`
- **Type**: Callable HTTPS Function
- **Request Schema**: `OSKUpdateSupplierRequest`
  ```typescript
  dataToUpdate: UpdateData<import("functions/src/modules/core/models/documents/document.model").OSKDocument<T>>
  organizationId: string
  supplierId: string
  ```
- **Response Schema**: `Promise<void>` (Confirmed, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|updateSupplier|#1` ``)

#### `deleteSupplier`
- **Type**: Callable HTTPS Function
- **Request Schema**: `OSKDeleteSupplierRequest`
  ```typescript
  organizationId: string
  supplierId: string
  ```
- **Response Schema**: `Promise<void>` (Confirmed, `` `api_contract|supplier|functions/src/modules/supplier/index.ts|deleteSupplier|#1` ``)

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. (Confirmed)

---

## 5. Data Ownership

### Firestore Collections
- **`/suppliers/{supplierId}`**: This capability owns the write and read paths for the `/suppliers` collection. (Confirmed, `` `controller_method|supplier|functions/src/modules/supplier/controllers/supplier.controller.ts|OSKSupplierController|getCollectionPath|#1` ``)
  - **Operation Detection Scope**: Document-level CRUD operations (`_set`, `_get`, `_update`, `_delete`, `_query`) are executed via the inherited `OSKDocumentController`. (Confirmed, `functions/src/modules/supplier/controllers/supplier.controller.ts` (lines 22-55))

---

## 6. Outbound Coupling

### Cross-Module Coupling
- **`core`**:
  - Imports `OSKDocumentController` and core types from `@oskey/core` and `@oskey/core/controllers/document`. (Confirmed, `` `imports_dependency|supplier|functions/src/modules/supplier/controllers/supplier.controller.ts|@oskey/core/controllers/document|#1` ``)
  - Imports `OSKLoggingService` from `@oskey/core/logger`. (Confirmed, `` `imports_dependency|supplier|functions/src/modules/supplier/services/supplier.service.ts|@oskey/core/logger|#1` ``)
- **`organization`**:
  - Imports `OSKOrganizationController` from `@oskey/organization`. (Confirmed, `` `imports_dependency|supplier|functions/src/modules/supplier/services/supplier.service.ts|@oskey/organization|#1` ``)
  - Imports `OSKEntityController` from `@oskey/organization/entity`. (Confirmed, `` `imports_dependency|supplier|functions/src/modules/supplier/services/supplier.service.ts|@oskey/organization/entity|#1` ``)
  - Imports `OSKOrganizationUserController` from `@oskey/organization/user`. (Confirmed, `` `imports_dependency|supplier|functions/src/modules/supplier/services/supplier.service.ts|@oskey/organization/user|#1` ``)
- **`settings`**:
  - Imports `OSKConsolidatedRolesController` from `@oskey/settings/role` to perform RBAC validation. (Confirmed, `` `imports_dependency|supplier|functions/src/modules/supplier/services/supplier.service.ts|@oskey/settings/role|#1` ``)

### Intra-Module Cross-Submodule Coupling
- **`supplierStaff`**:
  - Imports `./modules/supplierStaff` to invoke staff cleanup routines during supplier deletion. (Confirmed, `` `imports_dependency|supplier|functions/src/modules/supplier/index.ts|./modules/supplierStaff|#1` ``, `` `imports_dependency|supplier|functions/src/modules/supplier/services/supplier.service.ts|../modules/supplierStaff|#1` ``)

---

## 7. Permissions & Security

### Enforced Permissions
The capability checks the following permissions against the user's consolidated roles:
- **`v1.org.suppliers.create`**: Required to create a supplier. (Confirmed, `` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.create|#1` ``)
- **`v1.org.suppliers.view`**: Required to retrieve a supplier or list all suppliers. (Confirmed, `` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.view|#1` ``, `` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.view|#2` ``)
- **`v1.org.suppliers.edit`**: Required to update a supplier. (Confirmed, `` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.edit|#1` ``)
- **`v1.org.suppliers.delete`**: Required to delete a supplier. (Confirmed, `` `permission_candidate|supplier|functions/src/modules/supplier/services/supplier.service.ts|v1.org.suppliers.delete|#1` ``)

### RBAC Alignment Check
All candidate permissions match the official RBAC roles document exactly:
- `v1.org.suppliers.create` -> "Allows to create a new service provider profile" (Match)
- `v1.org.suppliers.delete` -> "Allows to delete a service provider" (Match)
- `v1.org.suppliers.edit` -> "Allows to edit a service provider's profile" (Match)
- `v1.org.suppliers.view` -> "Allows to view the details of a service provider" (Match)

*Note*: While the RBAC roles document lists `v1.org.suppliers.list` ("Allows to view the list of service providers"), the `getAllSuppliers` service method checks `v1.org.suppliers.view` instead. (Inferred, `functions/src/modules/supplier/services/supplier.service.ts` (line 134))

---

## 8. External Hooks
No external hooks (such as Pub/Sub topics, external HTTP integrations, or Cloud Storage paths) are directly evidenced within this capability's pack. (Confirmed)

---

## 9. Open Questions
- **Permission Discrepancy**: Why does `getAllSuppliers` check `v1.org.suppliers.view` instead of the more specific `v1.org.suppliers.list` permission defined in the RBAC roles document?
- **Asynchronous Synchronization**: The architecture overview mentions that supplier updates are synchronized to hardware via Pub/Sub. However, no Pub/Sub publishing logic is present in this capability pack. Is that synchronization handled by Firestore triggers in another module/submodule, or is it missing from the current implementation?