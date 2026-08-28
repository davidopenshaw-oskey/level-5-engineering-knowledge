## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.506Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_residents
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `organization_residents` capability manages the lifecycle of residents (both App Users and Non-App Users) at the organization level. It coordinates resident creation (single and bulk), updates, and cascading deletions across buildings, units, accesses, pincodes, and intercom directories. [Confirmed]

---

## 2. Primary Responsibilities
The `organization_residents` capability is responsible for the following distinct features:

- **App User Resident Onboarding**: Generates onboarding cards, activation codes, and QR codes for residents who will use the mobile app. It creates documents in `/organizations/{id}/onboardingInhabitants` and `/organizations/{id}/residents` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 604-802) ``. [Confirmed]
- **Non-App User Resident Provisioning**: Directly provisions physical access and pincodes for residents who do not use the app, writing to `/buildings/{id}/units/{id}/nonAppUsers` and `/buildings/{id}/pincodes` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 804-936) ``. [Confirmed]
- **Cascading Deletion**: When a resident is deleted, it cleans up associated building accesses, unit inhabitants, intercom entries, pincodes, invited Non-App Users, invited Permanent Guests, and pending unit invitations `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 224-276, 278-328, 334-399, 401-445, 447-485, 487-498) ``. [Confirmed]
- **Bulk Creation**: Supports batch processing of resident creation requests up to a maximum batch size `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 1113-1232) ``. [Confirmed]
- **Resident Retrieval**: Retrieves all residents for an organization or filtered by property ID, returning formatted response documents `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 77-119, 1070-1093) ``. [Confirmed]
- **Resident Updates**: Updates resident details (first name, last name, inhabitant type) and synchronizes these changes to the underlying building unit inhabitants and onboarding documents `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 938-1026) ``. [Confirmed]

---

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes the following public entry points:

- **OSKOrganizationResidentsController**: Extends `OSKDocumentController` to provide standard document operations for organization residents `` `functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts` (lines 17-71) ``. [Confirmed]
- **OSKOrganizationResidentsService**: The primary service class coordinating business logic for resident management `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 74-1232) ``. [Confirmed]
- **Callable Cloud Functions**: Exposes the following callable entry points in `` `functions/src/modules/organization/modules/organization_residents/index.ts` (lines 21-32) ``:
  - `bulkCreateResidents`
  - `createResidents`
  - `deleteResident`
  - `getAllResidents`
  - `getallResidentsByPropertyIdCallable`
  - `getResidentDetails`
  - `updateResident`

---

## 4. API Contracts & Firestore Triggers

### Callable Functions & Request/Response Schemas

- **deleteResident**
  - **Request Type**: `OSKResidentsDocumentDeleteRequest`
    - `organizationId`: `string`
    - `residentId`: `string`
  - **Response Type**: `void` (Implicit)

- **getAllResidents**
  - **Request Type**: `OSKGetAllOrganizationResidentsRequestData`
    - `organizationId`: `string`
  - **Response Type**: `OSKResidentsDocumentResponse`
    - `count`: `number`
    - `residents`: `OSKOrganizationResidentResponseDocument[]`

- **getResidentDetails**
  - **Request Type**: `OSKGetOrganizationResidentDetailsRequestData`
    - `organizationId`: `string`
    - `residentId`: `string`
  - **Response Type**: `OSKOrganizationResidentResponseDocument` (Implicit)

- **getallResidentsByPropertyIdCallable**
  - **Request Type**: `OSKGetAllResidentByPropertyIdRequest`
    - `organizationId`: `string`
    - `propertyId`: `string`
  - **Response Type**: `OSKResidentsDocumentResponse`
    - `count`: `number`
    - `residents`: `OSKOrganizationResidentResponseDocument[]`

- **updateResident**
  - **Request Type**: `OSKUpdateOrganizationResidentRequest`
    - `firstName`: `string`
    - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
    - `lastName`: `string`
    - `organizationId`: `string`
    - `residentId`: `string`
  - **Response Type**: `void` (Implicit)

*Note: For `bulkCreateResidents` and `createResidents`, no `model_property` facts matched within this pack to resolve their exact schemas.*

---

## 5. Data Ownership

This capability directly reads, writes, or deletes data in the following Firestore paths:

- `/organizations/{organizationId}/residents/{residentId}` [Confirmed]
  - *Operation Scope*: Read, Write, Delete via `OSKOrganizationResidentsController` `` `functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts` ``.
- `/organizations/{organizationId}/onboardingInhabitants/{onboardingId}` [Confirmed]
  - *Operation Scope*: Read, Write, Delete via `OSKOrganizationOnboardingInhabitantController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/inhabitants/{userId}` [Confirmed]
  - *Operation Scope*: Read, Write, Delete via `OSKBuildingUnitInhabitantController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}` [Confirmed]
  - *Operation Scope*: Write, Delete via `OSKBuildingUnitNonAppUserController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/accesses/{accessId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKNonAppUserAccessController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes/{pincodeId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKNonAppUserPincodeController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/permanentGuests/{guestUserId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKBuildingUnitPermanentGuestController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/pincodes/{pincodeId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKPincodeService` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/users/{userId}/pincodes/{pincodeId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKUserPincodeController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/users/{userId}/accesses/{accessId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKUserAccessesController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.

---

## 6. Outbound Coupling

The `organization_residents` capability depends on the following external modules and submodules:

### Cross-Module Coupling
- **core** (access, logger, pincode):
  - Imports `@oskey/core`, `@oskey/core/access`, `@oskey/core/logger` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- **building** (building, building_unit, building_door, building_intercom, building_accesses, building_unit_nonAppUser):
  - Imports `@oskey/building`, `@oskey/building/unit`, `@oskey/building/door`, `@oskey/building/intercom`, `@oskey/building/accesses`, `@oskey/building/unit/nonAppUsers` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- **user** (user, user_access, user_pincode):
  - Imports `@oskey/user`, `@oskey/user/access`, `@oskey/user/pincode` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- **settings** (role):
  - Imports `@oskey/settings/role` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- **apps** (qr_code):
  - Imports `@oskey/apps/qrcode` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- **tasks** / **unit_management**:
  - Imports `../../../../unit_management/controllers/unit_pending_invitations.controller` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.

### Intra-Module Cross-Submodule Coupling
- **organization_property**:
  - Imports `@oskey/organization/property` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- **organization_user**:
  - Imports `@oskey/organization/user` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- **organization_onboarding_inhabitant**:
  - Imports `../../organization_onboarding_inhabitant` and `../../organization_onboarding_inhabitant/models/shared/organization_onboarding_inhabitant_shared_documents.model` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.

---

## 7. Permissions & Security

The following permission strings are checked by this capability via `OSKConsolidatedRolesController.default.checkUserPermissions`:

- `v1.org.residents.create` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 572, 1152) `` [Confirmed]
- `v1.org.residents.delete` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (line 184) `` [Confirmed]
- `v1.org.residents.edit` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (line 958) `` [Confirmed]
- `v1.org.residents.list` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 101, 1050) `` [Confirmed]
- `v1.org.residents.view` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (line 143) `` [Confirmed]

### RBAC Cross-Check
All permission strings match the supplied RBAC roles document exactly:
- `v1.org.residents.create` -> "Allows to create a new resident profile"
- `v1.org.residents.delete` -> "Allows to delete a resident"
- `v1.org.residents.edit` -> "Allows to edit a resident's profile"
- `v1.org.residents.list` -> "Allows to view the list of residents"
- `v1.org.residents.view` -> "Allows to view the details of a resident"

---

## 8. External Hooks

### Pub/Sub Integrations
- **ACD Access Synchronization**: Publishes access deletion messages to all Access Control Devices (ACDs) via `OSKAccessMessagePublisherService.publishMessageToAllACDs` when a resident is deleted `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 252, 309) ``. [Confirmed]

### Environment Variables
- `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally enforce App Check `` `functions/src/modules/organization/modules/organization_residents/index.ts` (line 22) ``. [Confirmed]
- `process.env.MAX_BATCH_SIZE`: Used to limit the batch size for bulk resident creation `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (line 1137) ``. [Confirmed]

---

## 9. Open Questions

- **Email Dispatch**: The architecture document states that creating a resident profile triggers an automated email invitation with download links and activation codes. However, the code in this capability only shows QR code generation and onboarding document creation. It is unclear if the email dispatch is handled asynchronously via a Firestore trigger in another submodule or if it is an unevidenced workflow in this pack. [Inferred]
- **Bulk Creation Schema**: Why do `bulkCreateResidents` and `createResidents` lack resolved request/response schemas in the metadata? It is likely because their payloads are arrays or dynamic structures not fully mapped to a single type alias in the `model_property` facts of this pack. [Inferred]