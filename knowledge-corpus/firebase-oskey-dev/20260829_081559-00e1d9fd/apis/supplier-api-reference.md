### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:36:59.718Z
- repoName: firebase-oskey-dev
- targetModule: supplier
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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