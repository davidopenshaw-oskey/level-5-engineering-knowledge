# API Reference: supplier

## 0. Generation Metadata

- **Run ID**: 20260724_091153-1aa319b1
- **Generated At**: 2026-07-24T10:08:08.848Z

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
