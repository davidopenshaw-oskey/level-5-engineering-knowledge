### 0. Generation Metadata

- **runId**: `20260803_143350-1aa319b1`
- **generatedAt**: `2026-08-11T16:59:40.470Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `supplier`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `supplier` module manages the lifecycle, access permissions, offline credentials (alphanumeric PINs), and entry activity logs of third-party service providers (Suppliers) and their staff members (such as contractors, cleaners, and maintenance engineers) who require time-bound, auditable access to buildings and doors (**Confirmed**). It acts as the administrative and operational control center for external personnel, coordinating with core access services to provision credentials and propagate state changes to edge Access Control Devices (ACDs) (**Confirmed**).

### 2. Architectural Position

The `supplier` module sits alongside other core domain modules (such as `building`, `organization`, and `user`) within the platform's backend architecture (**Confirmed**). 
- **Parent Scope**: It operates under the Organization scope, isolating supplier data per tenant (**Confirmed**).
- **Owned Concepts**: It is the sole authority for Supplier profiles (`/suppliers`), Supplier Staff profiles (`/suppliers/{id}/staffMembers`), and their associated accesses, PIN codes, and activity logs (**Confirmed**).
- **Provided Capabilities**: It provides administrative CRUD interfaces to the Property Manager Portal (PGO) for managing third-party entities, while exposing operational hooks to the `core` module for credential generation and hardware activity ingestion (**Confirmed**).

### 3. Primary Responsibilities

#### _module_root

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

#### supplierStaff

### Supplier Staff Lifecycle Management
- Handles the creation, retrieval, updating, and deletion of supplier staff member profiles under a specific supplier and organization scope [Confirmed].
- **Evidence**: `OSKSupplierStaffController` (`functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff.controller.ts`, lines 11-68) and `OSKSupplierStaffService` (`functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts`, lines 51-255).

### Access Provisioning & Door Authorization
- Sets up and updates time-bound access rights for specific buildings and doors, ensuring that supplier staff only receive access within their scheduled work windows [Confirmed].
- **Evidence**: `OSKSupplierStaffAccessService.createOrUpdateSupplierStaffAccess` (`functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_access.service.ts`, lines 49-114) and `OSKSupplierStaffService.createSupplierStaffAccess` (`functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts`, lines 257-370).

### PIN Code Management
- Generates, retrieves, and deletes alphanumeric PIN codes associated with supplier staff accesses to allow offline keypad entry [Confirmed].
- **Evidence**: `OSKSupplierStaffPincodeController` (`functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_pincode.controller.ts`, lines 13-48) and `OSKSupplierStaffPincodeService` (`functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_pincode.service.ts`, lines 11-24).

### Activity Logging & Aggregation
- Records individual door entry events triggered by supplier staff and aggregates them per building over a rolling 30-day window [Confirmed].
- **Evidence**: `OSKSupplierStaffActivityService` (`functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity.service.ts`, lines 30-167) and `OSKSupplierStaffActivityAggregatesService` (`functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity_aggregates.service.ts`, lines 29-160).

### Asynchronous Hardware Synchronization
- Publishes access state changes (creation, updates, deletions) to edge Access Control Devices (ACDs) via Pub/Sub, decoupling business logic from hardware availability [Confirmed].
- **Evidence**: `OSKAccessMessagePublisherService.publishMessageToAllACDs` calls inside `_deleteAccessSideEffects` and `updateSupplierStaffAccessDoors` (`functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts`, lines 534, 728).

### 4. Public Interfaces

#### _module_root

### Controllers
- **`OSKSupplierController`** (extends `OSKDocumentController`): Manages direct Firestore document operations for the `/suppliers` collection, wrapping standard CRUD queries. (Confirmed, `` `source_class|supplier|functions/src/modules/supplier/controllers/supplier.controller.ts|OSKSupplierController` ``)

### Services
- **`OSKSupplierService`**: Orchestrates the business logic, permission checks, parameter validation, logging, and cascading submodule deletions. (Confirmed, `` `source_class|supplier|functions/src/modules/supplier/services/supplier.service.ts|OSKSupplierService` ``)

### Entry Points
- **`getCallableFunctionTriggers`**: Exports the HTTPS callable Cloud Functions that serve as the API gateway for client applications. (Confirmed, `` `function_declaration|supplier|functions/src/modules/supplier/index.ts|getCallableFunctionTriggers|#1` ``)

---

#### supplierStaff

The capability exposes the following controllers and services as public entry points:

### Controllers
- **`OSKSupplierStaffController`**: Extends `OSKDocumentController` to manage CRUD operations on the supplier staff documents [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff.controller.ts` (lines 11-68)
- **`OSKSupplierStaffAccessController`**: Extends `OSKDocumentController` to manage CRUD operations on supplier staff access documents [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_access.controller.ts` (lines 10-61)
- **`OSKSupplierStaffPincodeController`**: Extends `OSKDocumentController` to manage CRUD operations on supplier staff PIN codes [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_pincode.controller.ts` (lines 13-48)
- **`OSKSupplierStaffActivitiesController`**: Extends `OSKDocumentAndMessageController` to manage individual activity logs [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity.controller.ts` (lines 10-53)
- **`OSKSupplierStaffActivityAggregatesController`**: Extends `OSKDocumentController` to manage aggregated activity logs [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity_aggregates.controller.ts` (lines 14-61)

### Services
- **`OSKSupplierStaffService`**: Orchestrates high-level business logic for staff and access management [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (lines 48-772)
- **`OSKSupplierStaffAccessService`**: Orchestrates access retrieval and validation [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_access.service.ts` (lines 28-181)
- **`OSKSupplierStaffActivityService`**: Handles individual activity ingestion and queries [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity.service.ts` (lines 30-167)
- **`OSKSupplierStaffActivityAggregatesService`**: Handles activity aggregation and queries [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity_aggregates.service.ts` (lines 29-160)
- **`OSKSupplierStaffPincodeService`**: Handles PIN code document creation [Confirmed].
  - **File**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_pincode.service.ts` (lines 11-24)

### 5. Internal Structure

The `supplier` module exhibits a tight, bidirectional internal coupling between its root capability (`_module_root`) and its `supplierStaff` submodule (**Confirmed**).

- **Root to Submodule Coupling**: The `_module_root` capability depends on `supplierStaff` to execute cascading cleanups of staff members and credentials when a parent supplier profile is deleted (**Confirmed**). This is evidenced by `functions/src/modules/supplier/services/supplier.service.ts` importing `OSKSupplierStaffController` and `OSKSupplierStaffService` from the `supplierStaff` submodule.
- **Submodule to Root Coupling**: The `supplierStaff` submodule depends on `_module_root` to validate the existence and context of parent suppliers (**Confirmed**). This is evidenced by `supplier_staff_activity_aggregates.service.ts` and `supplier_staff_activity.service.ts` importing `OSKSupplierService` from the root services directory, and `supplier_staff.service.ts` importing `OSKSupplierController` from `@oskey/supplier`.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

Based on the strict hierarchical nesting of the Firestore schema and the AST call graph, the `supplier` module is the primary owner of the `/suppliers` collection and all of its nested subcollections (**Inferred**).

While the `core` module acts as an orchestrator and frequently calls into this module (e.g., executing `OSKSupplierController.getSafe`, `OSKSupplierStaffAccessService.setupSupplierStaffAccess`, and `OSKSupplierStaffActivityService.ActivityReceivedForSupplierStaff`), it does so strictly as a consumer (**Confirmed**). No other module in the repository performs direct writes or claims primary ownership over the `/suppliers` path or its subcollections (`staffMembers`, `accesses`, `pincodes`, `activities`, and `activityAggregates`) (**Inferred**).

**Per-capability evidence:**

#### _module_root

### Firestore Collections
- **`/suppliers/{supplierId}`**: This capability owns the write and read paths for the `/suppliers` collection. (Confirmed, `` `controller_method|supplier|functions/src/modules/supplier/controllers/supplier.controller.ts|OSKSupplierController|getCollectionPath|#1` ``)
  - **Operation Detection Scope**: Document-level CRUD operations (`_set`, `_get`, `_update`, `_delete`, `_query`) are executed via the inherited `OSKDocumentController`. (Confirmed, `functions/src/modules/supplier/controllers/supplier.controller.ts` (lines 22-55))

---

#### supplierStaff

This capability owns and manages documents within the following Firestore collection paths:

### `/suppliers/{supplierId}/staffMembers/{staffId}`
- **Description**: Stores the profile information of a supplier staff member [Confirmed].
- **Operation Scope**: Read, Write, Delete.
- **Evidence**: `OSKSupplierStaffController` (`functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff.controller.ts`, lines 19-20).

### `/suppliers/{supplierId}/staffMembers/{staffId}/accesses/{buildingId}`
- **Description**: Stores time-bound door access rights assigned to a staff member for a specific building [Confirmed].
- **Operation Scope**: Read, Write, Delete.
- **Evidence**: `OSKSupplierStaffAccessController` (`functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_access.controller.ts`, lines 13-14).

### `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes/{pincodeId}`
- **Description**: Stores the generated PIN codes associated with a staff member's access [Confirmed].
- **Operation Scope**: Read, Write, Delete.
- **Evidence**: `OSKSupplierStaffPincodeController` (`functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_pincode.controller.ts`, lines 16-17).

### `/suppliers/{supplierId}/staffMembers/{staffId}/activities/{activityId}`
- **Description**: Stores individual door entry activity logs for a staff member [Confirmed].
- **Operation Scope**: Read, Write, Delete.
- **Evidence**: `OSKSupplierStaffActivitiesController` (`functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity.controller.ts`, lines 13-14).

### `/suppliers/{supplierId}/staffMembers/{staffId}/activityAggregates/{buildingId}`
- **Description**: Stores aggregated activity logs for a staff member per building [Confirmed].
- **Operation Scope**: Read, Write, Delete.
- **Evidence**: `OSKSupplierStaffActivityAggregatesController` (`functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_activity_aggregates.controller.ts`, lines 17-18).

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

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

#### supplierStaff

The following callable functions are exported in `functions/src/modules/supplier/modules/supplierStaff/index.ts` (lines 49-64):

### `createStaffMember`
- **Request Type**: `OSKSupplierStaff`
  ```typescript
  email?: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  phone?: OSKPhoneNumber;
  staffId?: string;
  supplierId: string;
  ```

### `createSupplierStaffAccess`
- **Request Type**: `OSKCreateSupplierStaffAccessRequest`
  ```typescript
  endDate: Date;
  organizationId: string;
  staffId: string;
  startDate: Date;
  supplierId: string;
  targets: { buildingId: string; doorIds?: string[]; }[];
  ```

### `createSupplierStaffWithAccess`
- **Request Type**: `OSKCreateSupplierStaffWithAccessRequest`
  ```typescript
  endDate: Date;
  startDate: Date;
  targets: { buildingId: string; doorIds?: string[]; }[];
  ```
- **Response Type**: `OSKCreateSupplierStaffWithAccessResponse`
  ```typescript
  accessInfos: { buildingId: string; accessId: string; pincode: string | null; }[];
  staffId: string;
  ```

### `deleteStaffMember`
- **Request Type**: `OSKDeleteSupplierStaffRequest`
  ```typescript
  organizationId: string;
  staffId: string;
  supplierId: string;
  ```

### `deleteSupplierStaffAccess`
- **Request Type**: `OSKDeleteSupplierStaffAccessRequest`
  ```typescript
  accessId: string;
  buildingId: string;
  organizationId: string;
  staffId: string;
  supplierId: string;
  ```

### `getAllAccessesForAllBuildings`
- **Request Type**: `OSKGettAllSupplierStaffAccessesInfosRequest`
  ```typescript
  organizationId: string;
  staffId: string;
  supplierId: string;
  ```

### `getAllStaffMemberPincodes`
- **Request Type**: `OSKGetAllSupplierStaffPincodesRequest`
  ```typescript
  organizationId: string;
  staffId: string;
  supplierId: string;
  ```

### `getAllStaffMembers`
- **Request Type**: `OSKGetAllSupplierStaffRequest`
  ```typescript
  organizationId: string;
  supplierId: string;
  ```

### `getStaffMember`
- **Request Type**: `OSKGetSupplierStaffRequest`
  ```typescript
  organizationId: string;
  staffId: string;
  supplierId: string;
  ```

### `updateStaffMember`
- **Request Type**: `OSKUpdateSupplierStaffRequest`
  ```typescript
  dataToUpdate: UpdateData<OSKDocument<T>>;
  organizationId: string;
  staffId: string;
  supplierId: string;
  ```

### `updateSupplierStaffAccessDoors`
- **Request Type**: `OSKUpdateSupplierStaffAccessDoorsRequest`
  ```typescript
  buildingId: string;
  doorIds?: string[];
  organizationId: string;
  staffId: string;
  supplierId: string;
  ```

### 9. Permissions & Security

**Cross-cutting risk callouts:**

A cross-capability comparison reveals a consistent enforcement pattern using the `v1.org.suppliers.*` permission family, but highlights a significant architectural dilution of the principle of least privilege (**Inferred**).

- **The "View" vs. "List" Dilution**: The official RBAC roles document explicitly defines the `v1.org.suppliers.list` permission ("Allows to view the list of service providers") (**Confirmed**). However, a mental enforcement tally shows that *neither* capability uses this permission. Instead, both `_module_root` (in `getAllSuppliers`) and `supplierStaff` (for listing staff members and pincodes) fall back to checking `v1.org.suppliers.view` (**Confirmed**). This means any user with basic "view details" privileges can inherently list all suppliers and staff members, rendering the more granular `list` permission dead code (**Inferred**).
- **System-to-System Trust Boundaries**: The activity ingestion entry points (`ActivityReceivedForSupplierStaff` in both the activity and activity aggregates services) are called by `core` via Pub/Sub receivers and do not enforce user-level RBAC permissions (**Confirmed**). This represents a necessary boundary where standard user RBAC is bypassed in favor of system-level trust (**Inferred**).

**Per-capability evidence:**

#### _module_root

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

#### supplierStaff

The capability references the following permission strings to enforce Role-Based Access Control (RBAC):

- **`v1.org.suppliers.create`**: Required to create a new supplier staff member [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (line 73).
- **`v1.org.suppliers.view`**: Required to view supplier staff profiles, accesses, PIN codes, and activity logs [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (lines 119, 150, 759).
- **`v1.org.suppliers.edit`**: Required to update staff profiles, create accesses, and delete accesses [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (lines 198, 288, 635).
- **`v1.org.suppliers.delete`**: Required to delete a supplier staff member [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (line 243).

### RBAC Cross-Check
All referenced permissions match the definitions in the supplied RBAC roles document exactly [Confirmed].

### 10. Cross-Module Relationships

The `supplier` module has a well-defined set of outbound and inbound relationships with other modules in the repository, established entirely via AST import resolution and method-level call edges (**Confirmed**).

#### Outbound Relationships (This module depends on)
- **`core`**: Heavily utilized (31 touchpoints) for base document controller operations (`OSKDocumentController`, `OSKDocumentAndMessageController`), logging (`OSKLoggingService`), and core access/pincode orchestration (`OSKAccessUtilsService`, `OSKAccessMessagePublisherService`, `OSKAccessService`, `OSKPincodeService`) (**Confirmed**).
- **`building`**: Accessed to resolve building documents (`OSKBuildingController`, `OSKBuildingDocument`), manage building-level accesses (`OSKBuildingAccessesController`), and resolve door configurations (`OSKBuildingDoorController`) (**Confirmed**).
- **`organization`**: Accessed to resolve organization users and entities (`OSKOrganizationUserController`, `OSKOrganizationController`, `OSKEntityController`) (**Confirmed**).
- **`settings`**: Accessed to check consolidated user roles (`OSKConsolidatedRolesController`) (**Confirmed**).
- **`user`**: Accessed to handle user access types and authorized doors (`OSKAccessBase`, `OSKUserAccessType`, `OSKRequestSupplierStaffAccessOptions`, `OSKUserAuthorizedDoor`) (**Confirmed**).
- **`access_control_device`**: Accessed to enrich activity data (`ActivityUserType`, `EnrichedActivityData`) (**Confirmed**).

#### Inbound Relationships (Other modules depend on this module)
- **`core`**: Calls into `supplier` to publish PIN messages to ACDs (`OSKSupplierStaffPincodeController.getByAccessId`), create PIN documents (`OSKSupplierStaffPincodeService.createPincodeDocument`), resolve supplier/staff profiles (`OSKSupplierController.getSafe`, `OSKSupplierStaffController.getSafe`), setup staff accesses (`OSKSupplierStaffAccessService.createOrUpdateSupplierStaffAccess`, `OSKSupplierStaffAccessService.setupSupplierStaffAccess`), and route incoming hardware activities (`OSKSupplierStaffActivityAggregatesService.ActivityReceivedForSupplierStaff`, `OSKSupplierStaffActivityService.ActivityReceivedForSupplierStaff`) (**Confirmed**).
- **`user`**: Imports `OSKSupplierStaffAccess` in `user_accesses_document.model.ts` to define nested user access structures (**Confirmed**).

### 11. External Hooks

#### _module_root

No external hooks (such as Pub/Sub topics, external HTTP integrations, or Cloud Storage paths) are directly evidenced within this capability's pack. (Confirmed)

---

#### supplierStaff

- **Pub/Sub Integration**: The capability integrates with the asynchronous data pipeline via `OSKAccessMessagePublisherService.publishMessageToAllACDs` [Confirmed]. When access is created, updated, or deleted, a message is published to synchronize the offline keypad cache on edge devices [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (lines 534, 728).
- **Emulator Guardrail**: Checks the environment variable `process.env.OSK_FIREBASE_EMULATOR` to conditionally enforce App Check on callable triggers [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (line 50).

### 12. Architectural Observations

- **Orchestration Decoupling**: The module relies entirely on the `core` module's access orchestration layer (`OSKAccessService`, `OSKPincodeService`) to provision physical access (**Confirmed**). Rather than writing directly to hardware or managing low-level PIN generation, `supplierStaff` delegates these tasks to `core` and listens for activity events routed back from `core`'s Pub/Sub receivers (**Confirmed**). This decouples the business logic of supplier management from the IoT/hardware synchronization mechanics (**Inferred**).
- **Parallel Activity Logging**: The module implements a dual-write logging pattern for entry events (**Confirmed**). Incoming hardware activities are processed by both `OSKSupplierStaffActivityService` (for individual audit logs) and `OSKSupplierStaffActivityAggregatesService` (for per-building aggregated statistics), optimizing both detailed forensic audits and high-level dashboard queries (**Inferred**).
- **Tight Bidirectional Submodule Coupling**: The circular dependency between `_module_root` and `supplierStaff` (evidenced by the intra-module coupling graph) indicates that the two submodules are highly cohesive but structurally inseparable, requiring coordinated deployments for any major changes (**Inferred**).

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **RBAC Mismatch and Permission Dilution**: Why does the codebase completely bypass the `v1.org.suppliers.list` permission defined in the RBAC roles document in favor of `v1.org.suppliers.view`? This dilution of the least privilege principle allows any user with "view" access to list all suppliers and staff members (**Inferred**).
- **Circular Submodule Dependency**: The bidirectional coupling between `_module_root` and `supplierStaff` increases the risk of side effects during refactoring, as changes to root supplier services can easily break staff-level operations and vice versa (**Inferred**).
- **Unprotected Pub/Sub Ingress**: The activity ingestion endpoints (`ActivityReceivedForSupplierStaff`) lack user-level RBAC checks because they are designed for Pub/Sub push execution (**Confirmed**). If the Pub/Sub ingress is compromised or misconfigured, unauthorized activity logs could be injected directly into the supplier staff activity collections without passing through standard security guards (**Inferred**).
- **PIN Code Rate-Limiting**: Are there any rate-limiting or security policies on PIN code generation for supplier staff to prevent brute-force attacks on the offline keypads? (**Inferred**)

**Per-capability open questions:**

#### _module_root

- **Permission Discrepancy**: Why does `getAllSuppliers` check `v1.org.suppliers.view` instead of the more specific `v1.org.suppliers.list` permission defined in the RBAC roles document?
- **Asynchronous Synchronization**: The architecture overview mentions that supplier updates are synchronized to hardware via Pub/Sub. However, no Pub/Sub publishing logic is present in this capability pack. Is that synchronization handled by Firestore triggers in another module/submodule, or is it missing from the current implementation?

#### supplierStaff

- **Permission Naming Discrepancy**: Why does the capability use `v1.org.suppliers.view` for listing all staff members and pincodes instead of `v1.org.suppliers.list`? [Inferred]
- **PIN Code Rate-Limiting**: Are there any rate-limiting or security policies on PIN code generation for supplier staff to prevent brute-force attacks on the offline keypads? [Inferred]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.