# API Reference: supplier

## 0. Generation Metadata

- **Run ID**: 20260724_143235-1aa319b1
- **Generated At**: 2026-07-24T14:32:41.971Z

---

## 1. Callable Functions

### Interpretation

The `supplier` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `createSupplier` | `OSKCreateSupplierRequest` | ```json
{
  "supplierId": "string | undefined",
  "name": "string",
  "address": "OSKStreetAddress | undefined",
  "type": "string | undefined",
  "siret": "string | undefined",
  "phone": "OSKPhoneNumber | undefined",
  "email": "string | undefined",
  "notes": "string | undefined",
  "entityId": "string",
  "organizationId": "string"
}
``` |
| `getSupplier` | `OSKGetSupplierRequest` | ```json
{
  "supplierId": "string",
  "organizationId": "string"
}
``` |
| `getAllSuppliers` | `OSKGetAllSuppliersRequest` | ```json
{
  "organizationId": "string"
}
``` |
| `updateSupplier` | `OSKUpdateSupplierRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string",
  "dataToUpdate": "UpdateData<OSKDocument<T>>"
}
``` |
| `deleteSupplier` | `OSKDeleteSupplierRequest` | ```json
{
  "supplierId": "string",
  "organizationId": "string"
}
``` |
| `createStaffMember` | `OSKAddSupplierStaffRequest` | ```json
{
  "staffId": "string | undefined",
  "organizationId": "string",
  "supplierId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string | undefined",
  "phone": "OSKPhoneNumber | undefined"
}
``` |
| `getStaffMember` | `OSKGetSupplierStaffRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string",
  "staffId": "string"
}
``` |
| `getAllStaffMembers` | `OSKGetAllSupplierStaffRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string"
}
``` |
| `updateStaffMember` | `OSKUpdateSupplierStaffRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string",
  "staffId": "string",
  "dataToUpdate": "UpdateData<OSKDocument<T>>"
}
``` |
| `deleteStaffMember` | `OSKDeleteSupplierStaffRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string",
  "staffId": "string"
}
``` |
| `createSupplierStaffAccess` | `OSKCreateSupplierStaffAccessRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string",
  "staffId": "string",
  "startDate": "Date",
  "endDate": "Date",
  "targets": "{ buildingId: string; doorIds?: string[] | undefined; }[]"
}
``` |
| `deleteSupplierStaffAccess` | `OSKDeleteSupplierStaffAccessRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string",
  "staffId": "string",
  "buildingId": "string",
  "accessId": "string"
}
``` |
| `getAllStaffMemberPincodes` | `OSKGetAllSupplierStaffPincodesRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string",
  "staffId": "string"
}
``` |
| `createSupplierStaffWithAccess` | `OSKCreateSupplierStaffWithAccessRequest` | ```json
{
  "staffId": "string | undefined",
  "organizationId": "string",
  "supplierId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string | undefined",
  "phone": "OSKPhoneNumber | undefined",
  "startDate": "Date",
  "endDate": "Date",
  "targets": "{ buildingId: string; doorIds?: string[] | undefined; }[]"
}
``` |
| `updateSupplierStaffAccessDoors` | `OSKUpdateSupplierStaffAccessDoorsRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string",
  "staffId": "string",
  "buildingId": "string",
  "doorIds": "string[] | undefined"
}
``` |
| `getAllAccessesForAllBuildings` | `OSKGettAllSupplierStaffAccessesInfosRequest` | ```json
{
  "organizationId": "string",
  "supplierId": "string",
  "staffId": "string"
}
``` |

### Evidence Used

- API Contract: The `supplier-evidence-graph.json` file contains 16 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/supplier/index.ts` registers these handlers.

### Confidence

High.

---

## 2. Domain Types & Enums

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
