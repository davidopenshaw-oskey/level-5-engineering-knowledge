# API Reference: supplier

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.448Z

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
  "address": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/street_address.model\").OSKStreetAddress | undefined",
  "type": "string | undefined",
  "siret": "string | undefined",
  "phone": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/phone_number.model\").OSKPhoneNumber | undefined",
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
  "dataToUpdate": "{ supplierId?: string | FirebaseFirestore.FieldValue | undefined; name?: string | FirebaseFirestore.FieldValue | undefined; address?: FirebaseFirestore.FieldValue | { streetName?: string | FirebaseFirestore.FieldValue | undefined; houseNumber?: string | FirebaseFirestore.FieldValue | undefined; postalCode?: string | FirebaseFirestore.FieldValue | undefined; city?: string | FirebaseFirestore.FieldValue | undefined; country?: string | FirebaseFirestore.FieldValue | undefined; isoCountryCode?: string | FirebaseFirestore.FieldValue | undefined; coordinate?: FirebaseFirestore.FieldValue | { latitude?: number | FirebaseFirestore.FieldValue | undefined; longitude?: number | FirebaseFirestore.FieldValue | undefined; } | undefined; } | undefined; type?: string | FirebaseFirestore.FieldValue | undefined; siret?: string | FirebaseFirestore.FieldValue | undefined; phone?: FirebaseFirestore.FieldValue | { isoCountryCode?: string | FirebaseFirestore.FieldValue | undefined; dialCode?: string | FirebaseFirestore.FieldValue | undefined; localPhoneNumber?: string | FirebaseFirestore.FieldValue | undefined; internationalPhoneNumber?: string | FirebaseFirestore.FieldValue | undefined; } | undefined; email?: string | FirebaseFirestore.FieldValue | undefined; notes?: string | FirebaseFirestore.FieldValue | undefined; entityId?: string | FirebaseFirestore.FieldValue | undefined; organizationId?: string | FirebaseFirestore.FieldValue | undefined; creationDate?: FirebaseFirestore.FieldValue | { readonly seconds?: number | FirebaseFirestore.FieldValue | undefined; readonly nanoseconds?: number | FirebaseFirestore.FieldValue | undefined; toDate?: FirebaseFirestore.FieldValue | {} | undefined; toMillis?: FirebaseFirestore.FieldValue | {} | undefined; isEqual?: FirebaseFirestore.FieldValue | {} | undefined; valueOf?: FirebaseFirestore.FieldValue | {} | undefined; } | undefined; modificationDate?: FirebaseFirestore.FieldValue | { readonly seconds?: number | FirebaseFirestore.FieldValue | undefined; readonly nanoseconds?: number | FirebaseFirestore.FieldValue | undefined; toDate?: FirebaseFirestore.FieldValue | {} | undefined; toMillis?: FirebaseFirestore.FieldValue | {} | undefined; isEqual?: FirebaseFirestore.FieldValue | {} | undefined; valueOf?: FirebaseFirestore.FieldValue | {} | undefined; } | undefined; } & FirebaseFirestore.AddPrefixToKeys<\"phone\", { isoCountryCode?: string | FirebaseFirestore.FieldValue | undefined; dialCode?: string | FirebaseFirestore.FieldValue | undefined; localPhoneNumber?: string | FirebaseFirestore.FieldValue | undefined; internationalPhoneNumber?: string | FirebaseFirestore.FieldValue | undefined; }>"
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
  "firstName": "string | undefined",
  "lastName": "string | undefined",
  "email": "string | undefined",
  "phone": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/phone_number.model\").OSKPhoneNumber | undefined"
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
  "dataToUpdate": "{ staffId?: string | FirebaseFirestore.FieldValue | undefined; organizationId?: string | FirebaseFirestore.FieldValue | undefined; supplierId?: string | FirebaseFirestore.FieldValue | undefined; firstName?: string | FirebaseFirestore.FieldValue | undefined; lastName?: string | FirebaseFirestore.FieldValue | undefined; email?: string | FirebaseFirestore.FieldValue | undefined; phone?: FirebaseFirestore.FieldValue | { isoCountryCode?: string | FirebaseFirestore.FieldValue | undefined; dialCode?: string | FirebaseFirestore.FieldValue | undefined; localPhoneNumber?: string | FirebaseFirestore.FieldValue | undefined; internationalPhoneNumber?: string | FirebaseFirestore.FieldValue | undefined; } | undefined; creationDate?: FirebaseFirestore.FieldValue | { readonly seconds?: number | FirebaseFirestore.FieldValue | undefined; readonly nanoseconds?: number | FirebaseFirestore.FieldValue | undefined; toDate?: FirebaseFirestore.FieldValue | {} | undefined; toMillis?: FirebaseFirestore.FieldValue | {} | undefined; isEqual?: FirebaseFirestore.FieldValue | {} | undefined; valueOf?: FirebaseFirestore.FieldValue | {} | undefined; } | undefined; modificationDate?: FirebaseFirestore.FieldValue | { readonly seconds?: number | FirebaseFirestore.FieldValue | undefined; readonly nanoseconds?: number | FirebaseFirestore.FieldValue | undefined; toDate?: FirebaseFirestore.FieldValue | {} | undefined; toMillis?: FirebaseFirestore.FieldValue | {} | undefined; isEqual?: FirebaseFirestore.FieldValue | {} | undefined; valueOf?: FirebaseFirestore.FieldValue | {} | undefined; } | undefined; } & FirebaseFirestore.AddPrefixToKeys<\"phone\", { isoCountryCode?: string | FirebaseFirestore.FieldValue | undefined; dialCode?: string | FirebaseFirestore.FieldValue | undefined; localPhoneNumber?: string | FirebaseFirestore.FieldValue | undefined; internationalPhoneNumber?: string | FirebaseFirestore.FieldValue | undefined; }>"
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
  "firstName": "string | undefined",
  "lastName": "string | undefined",
  "email": "string | undefined",
  "phone": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/phone_number.model\").OSKPhoneNumber | undefined",
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
