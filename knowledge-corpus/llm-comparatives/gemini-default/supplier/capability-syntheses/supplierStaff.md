# Capability Synthesis — supplierStaff

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.529Z
- **repoName**: firebase-oskey-dev
- **targetModule**: supplier
- **capability**: supplierStaff
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `supplierStaff` capability manages the lifecycle, access permissions, alphanumeric PIN codes, and activity logs of third-party supplier staff members (such as contractors, cleaners, and maintenance engineers) who require time-bound, auditable access to buildings and doors [Confirmed]. It coordinates with core access services to provision offline keypad credentials and publishes state changes asynchronously to edge Access Control Devices (ACDs) [Confirmed].

## 2. Primary Responsibilities

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

## 3. Public Interfaces (Controllers & Entry Points)

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

## 4. API Contracts & Firestore Triggers

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

## 5. Data Ownership

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

## 6. Outbound Coupling

The `supplierStaff` capability depends on the following external modules and submodules:

### Cross-Module Coupling

#### `building` Module
- **Submodule `building_door`**: Used to retrieve door documents and validate door IDs [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (line 8) imports `@oskey/building/door`.
- **Submodule `building_accesses`**: Used to manage and clean up building-level accesses [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (line 7) imports `@oskey/building/accesses`.
- **Root/General**: Used to retrieve building details [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (line 6) imports `@oskey/building`.

#### `core` Module
- **Submodule `access`**: Used to generate access IDs, create access records, and publish messages to edge devices [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (line 10) imports `@oskey/core/access`.
- **Root/General**: Used for base controllers, logging, and document models [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_access.service.ts` (line 7) imports `@oskey/core`.

#### `organization` Module
- **Submodule `organization_user`**: Used to retrieve organization user profiles and validate administrative contexts [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_access.service.ts` (line 9) imports `@oskey/organization/user`.
- **Root/General**: Used to retrieve organization details [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity_aggregates.service.ts` (line 7) imports `@oskey/organization`.

#### `settings` Module
- **Submodule `role`**: Used to check consolidated user permissions [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_access.service.ts` (line 10) imports `@oskey/settings/role`.

#### `user` Module
- **Submodule `user_access`**: Used to reference user access types [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_access.service.ts` (line 11) imports `@oskey/user/access`.

#### `access_control_device` Module
- **Root/General**: Used to enrich raw hardware events with supplier staff context [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity.service.ts` (line 17) imports `../../../../access_control_device/services/access_control_device_activity_enrichment.service`.

### Intra-Module Coupling (Sibling Submodules)
- **`supplier` (Root)**: Used to retrieve supplier details and map staff members across all suppliers [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff_activity.service.ts` (line 22) imports `../../../services/supplier.service`.

## 7. Permissions & Security

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

## 8. External Hooks

- **Pub/Sub Integration**: The capability integrates with the asynchronous data pipeline via `OSKAccessMessagePublisherService.publishMessageToAllACDs` [Confirmed]. When access is created, updated, or deleted, a message is published to synchronize the offline keypad cache on edge devices [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` (lines 534, 728).
- **Emulator Guardrail**: Checks the environment variable `process.env.OSK_FIREBASE_EMULATOR` to conditionally enforce App Check on callable triggers [Confirmed].
  - **Evidence**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (line 50).

## 9. Open Questions

- **Permission Naming Discrepancy**: Why does the capability use `v1.org.suppliers.view` for listing all staff members and pincodes instead of `v1.org.suppliers.list`? [Inferred]
- **PIN Code Rate-Limiting**: Are there any rate-limiting or security policies on PIN code generation for supplier staff to prevent brute-force attacks on the offline keypads? [Inferred]