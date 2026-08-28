### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T16:45:34.733Z
- repoName: firebase-oskey-dev
- targetModule: supplier
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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