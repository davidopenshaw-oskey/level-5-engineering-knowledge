<!-- © Oskey SAS. All rights reserved. -->

# Module API Contract Specification: supplier

*© Oskey SAS. All rights reserved.*

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Domain Module** | `supplier` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_162236-1aa319b1` |
| **Exported Callables** | 16 |
| **Type Aliases / Enums** | 36 |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Status** | Completed & Grounded |

---

## 1. Executive API Summary

This document contains the verified API contracts, exported Cloud Function callables, request/response models, and data types for the `supplier` domain module.

---

## 2. HTTPS Callable Functions (16 Endpoints)

### `createSupplier`

- **Request Type**: `OSKCreateSupplierRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `supplierId` | `string | undefined` | No |
| `name` | `string` | No |
| `address` | `OSKStreetAddress | undefined` | No |
| `type` | `string | undefined` | No |
| `siret` | `string | undefined` | No |
| `phone` | `OSKPhoneNumber | undefined` | No |
| `email` | `string | undefined` | No |
| `notes` | `string | undefined` | No |
| `entityId` | `string` | No |
| `organizationId` | `string` | No |

### `getSupplier`

- **Request Type**: `OSKGetSupplierRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `supplierId` | `string` | No |
| `organizationId` | `string` | No |

### `getAllSuppliers`

- **Request Type**: `OSKGetAllSuppliersRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `updateSupplier`

- **Request Type**: `OSKUpdateSupplierRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `dataToUpdate` | `UpdateData<OSKDocument<T>>` | No |

### `deleteSupplier`

- **Request Type**: `OSKDeleteSupplierRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `supplierId` | `string` | No |
| `organizationId` | `string` | No |

### `createStaffMember`

- **Request Type**: `OSKAddSupplierStaffRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `staffId` | `string | undefined` | No |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `email` | `string | undefined` | No |
| `phone` | `OSKPhoneNumber | undefined` | No |

### `getStaffMember`

- **Request Type**: `OSKGetSupplierStaffRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `staffId` | `string` | No |

### `getAllStaffMembers`

- **Request Type**: `OSKGetAllSupplierStaffRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |

### `updateStaffMember`

- **Request Type**: `OSKUpdateSupplierStaffRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `staffId` | `string` | No |
| `dataToUpdate` | `UpdateData<OSKDocument<T>>` | No |

### `deleteStaffMember`

- **Request Type**: `OSKDeleteSupplierStaffRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `staffId` | `string` | No |

### `createSupplierStaffAccess`

- **Request Type**: `OSKCreateSupplierStaffAccessRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `staffId` | `string` | No |
| `startDate` | `Date` | No |
| `endDate` | `Date` | No |
| `targets` | `{ buildingId: string; doorIds?: string[] | undefined; }[]` | No |

### `deleteSupplierStaffAccess`

- **Request Type**: `OSKDeleteSupplierStaffAccessRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `staffId` | `string` | No |
| `buildingId` | `string` | No |
| `accessId` | `string` | No |

### `getAllStaffMemberPincodes`

- **Request Type**: `OSKGetAllSupplierStaffPincodesRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `staffId` | `string` | No |

### `createSupplierStaffWithAccess`

- **Request Type**: `OSKCreateSupplierStaffWithAccessRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `staffId` | `string | undefined` | No |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `email` | `string | undefined` | No |
| `phone` | `OSKPhoneNumber | undefined` | No |
| `startDate` | `Date` | No |
| `endDate` | `Date` | No |
| `targets` | `{ buildingId: string; doorIds?: string[] | undefined; }[]` | No |

### `updateSupplierStaffAccessDoors`

- **Request Type**: `OSKUpdateSupplierStaffAccessDoorsRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `staffId` | `string` | No |
| `buildingId` | `string` | No |
| `doorIds` | `string[] | undefined` | No |

### `getAllAccessesForAllBuildings`

- **Request Type**: `OSKGettAllSupplierStaffAccessesInfosRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/supplier/modules/supplierStaff/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `supplierId` | `string` | No |
| `staffId` | `string` | No |

---

## 3. Data Models & Type Definitions (36 Types)

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKSupplier` | `{     supplierId?: string;     name: string;     address?: OSKStreetAddress;     type?: string;     siret?: string;  ...` | `functions/src/modules/supplier/models/documents/supplier_document.model.ts` |
| `OSKSupplierDocument` | `OSKDocument<OSKSupplier>` | `functions/src/modules/supplier/models/documents/supplier_document.model.ts` |
| `OSKCreateSupplierRequest` | `OSKSupplier` | `functions/src/modules/supplier/models/functions/supplier_request_document_model.ts` |
| `OSKUpdateSupplierRequest` | `{     organizationId: string;     supplierId: string;     dataToUpdate: OSKDocumentUpdate<OSKSupplierDocument>; }` | `functions/src/modules/supplier/models/functions/supplier_request_document_model.ts` |
| `OSKGetSupplierRequest` | `{ supplierId: string; organizationId: string }` | `functions/src/modules/supplier/models/functions/supplier_request_document_model.ts` |
| `OSKGetAllSuppliersRequest` | `{ organizationId: string }` | `functions/src/modules/supplier/models/functions/supplier_request_document_model.ts` |
| `OSKDeleteSupplierRequest` | `{ supplierId: string; organizationId: string }` | `functions/src/modules/supplier/models/functions/supplier_request_document_model.ts` |
| `OSKCreateSupplierRequest` | `OSKSupplier` | `functions/src/modules/supplier/models/functions/supplier_request_document.model.ts` |
| `OSKUpdateSupplierRequest` | `{     organizationId: string;     supplierId: string;     dataToUpdate: OSKDocumentUpdate<OSKSupplierDocument>; }` | `functions/src/modules/supplier/models/functions/supplier_request_document.model.ts` |
| `OSKGetSupplierRequest` | `{ supplierId: string; organizationId: string }` | `functions/src/modules/supplier/models/functions/supplier_request_document.model.ts` |
| `OSKGetAllSuppliersRequest` | `{ organizationId: string }` | `functions/src/modules/supplier/models/functions/supplier_request_document.model.ts` |
| `OSKDeleteSupplierRequest` | `{ supplierId: string; organizationId: string }` | `functions/src/modules/supplier/models/functions/supplier_request_document.model.ts` |
| `OSKSupplierStaffAccessesDocument` | `OSKDocument<{     staffId: string;     staffFirstName: string;     staffLastName: string;     buildingId: string;    ...` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_access_document.model.ts` |
| `OSKSupplierStaffAccess` | `OSKAccessBase & {     type: OSKUserAccessType.SupplierStaff;     supplierId: string;     supplierName: string; }` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_access.model.ts` |
| `OSKSupplierStaffActivity` | `{     activityId: string;     accessControlDeviceId: string;     acdType: string; // This maps to source (e.g., "inte...` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_activity_documents.model.ts` |
| `OSKSupplierStaffActivityAggregate` | `{     activities: OSKSupplierStaffActivity[]; }` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_activity_documents.model.ts` |
| `OSKSupplierStaffActivityDocument` | `OSKDocument<OSKSupplierStaffActivity>` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_activity_documents.model.ts` |
| `OSKSupplierStaffActivityAggregateDocument` | `OSKDocument<OSKSupplierStaffActivityAggregate>` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_activity_documents.model.ts` |
| `OSKSupplierStaff` | `{     staffId?: string;     organizationId: string;     supplierId: string;     firstName: string;     lastName: stri...` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_document.model.ts` |
| `OSKSupplierStaffDocument` | `OSKDocument<OSKSupplierStaff>` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_document.model.ts` |
| `OSKSupplierStaffPincode` | `{     pincode: string;     buildingId: string;     accessId: string;     type: OSKPincodeType;     creationDate: Time...` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_pincode.model.ts` |
| `OSKSupplierStaffPincodeDocument` | `OSKDocument<OSKSupplierStaffPincode>` | `functions/src/modules/supplier/modules/supplierStaff/models/documents/supplier_staff_pincode.model.ts` |
| `OSKAddSupplierStaffRequest` | `OSKSupplierStaff` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKUpdateSupplierStaffRequest` | `{     organizationId: string;     supplierId: string;     staffId: string;     dataToUpdate: OSKDocumentUpdate<OSKSup...` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKGetSupplierStaffRequest` | `{ organizationId: string; supplierId: string; staffId: string }` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKDeleteSupplierStaffRequest` | `{ organizationId: string; supplierId: string; staffId: string }` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKGetAllSupplierStaffRequest` | `{ organizationId: string; supplierId: string }` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKCreateSupplierStaffAccessRequest` | `{     organizationId: string;     supplierId: string;     staffId: string;     startDate: Date;     endDate: Date;   ...` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKCreateSupplierStaffWithAccessRequest` | `OSKAddSupplierStaffRequest & {     startDate: Date;     endDate: Date;     targets: {         buildingId: string;    ...` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKCreateSupplierStaffWithAccessResponse` | `{     staffId: string;     accessInfos: { buildingId: string; accessId: string; pincode: string \| null }[]; }` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKUpdateSupplierStaffAccessDoorsRequest` | `{     organizationId: string;     supplierId: string;     staffId: string;     buildingId: string;     doorIds?: stri...` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKDeleteSupplierStaffAccessRequest` | `{     organizationId: string;     supplierId: string;     staffId: string;     buildingId: string;     accessId: stri...` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKGetAllSupplierStaffPincodesRequest` | `{     organizationId: string;     supplierId: string;     staffId: string; }` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKCreateSupplierStaffAccessResponse` | `{     accessId: string;     pincodeId: string \| null; }[]` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKGettAllSupplierStaffAccessesInfosRequest` | `{     organizationId: string;     supplierId: string;     staffId: string; }` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
| `OSKGetAllSupplierStaffAccessesInfosResponse` | `{     buildingId: string;     buildingName: string \| undefined;     buildingImageFilename?: string;     buildingStre...` | `functions/src/modules/supplier/modules/supplierStaff/models/functions/supplier_staff_document_request.model.ts` |
