### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T17:00:11.129Z
- repoName: firebase-oskey-dev
- targetModule: supplier
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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