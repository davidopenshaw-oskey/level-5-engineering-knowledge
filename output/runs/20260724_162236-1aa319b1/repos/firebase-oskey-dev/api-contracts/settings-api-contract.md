<!-- © Oskey SAS. All rights reserved. -->

# Module API Contract Specification: settings

*© Oskey SAS. All rights reserved.*

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Domain Module** | `settings` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_162236-1aa319b1` |
| **Exported Callables** | 7 |
| **Type Aliases / Enums** | 17 |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Status** | Completed & Grounded |

---

## 1. Executive API Summary

This document contains the verified API contracts, exported Cloud Function callables, request/response models, and data types for the `settings` domain module.

---

## 2. HTTPS Callable Functions (7 Endpoints)

### `onCreateSettingsCalled`

- **Request Type**: `{ dummy: string }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/settings/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `dummy` | `string` | No |

### `onCreateCompositeRolesCalled`

- **Request Type**: `{ dummy: string }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/settings/modules/role/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `dummy` | `string` | No |

### `getAllRoles`

- **Request Type**: `Record<string, never>`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/settings/modules/role/index.ts` (Line undefined)

### `getAllCompositeRoles`

- **Request Type**: `Record<string, never>`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/settings/modules/role/index.ts` (Line undefined)

### `getOrganizationCompositeRoles`

- **Request Type**: `Record<string, never>`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/settings/modules/role/index.ts` (Line undefined)

### `onCreateBuildingRequestWorkflowsCalled`

- **Request Type**: `{ dummy: string }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/settings/modules/workflow/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `dummy` | `string` | No |

### `onCreateOrganizationRequestWorkflowsCalled`

- **Request Type**: `{ dummy: string }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/settings/modules/workflow/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `dummy` | `string` | No |

---

## 3. Data Models & Type Definitions (17 Types)

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKSetting` | `{     viewRole: string;     createRole: string;     editRole: string;     deleteRole: string;     adminCompositeRole:...` | `functions/src/modules/settings/models/documents/setting_document.model.ts` |
| `OSKSettingDocument` | `OSKDocument<OSKSetting>` | `functions/src/modules/settings/models/documents/setting_document.model.ts` |
| `OSKAppStoreSettings` | `{     stores:          {             activationCode: string,             appDownloadUrl: string,             storeNam...` | `functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts` |
| `OSKAppStoreInfo` | `{     appleStoreName: string,     appleStoreUrl: string,     googleStoreName: string,     googleStoreUrl: string, }` | `functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts` |
| `OSKAppStoreActivationRequest` | `{     activationCode: string, }` | `functions/src/modules/settings/modules/appstore/models/functions/app_store_settings_request.model.ts` |
| `OSKAppStoreActivationResponse` | `{     isRecordFound: boolean,     activationCode?: string,     appStoreDocument?: OSKAppStoreSettings }` | `functions/src/modules/settings/modules/appstore/models/functions/app_store_settings_request.model.ts` |
| `OSKCompositeRole` | `OSKRole & {     compositeRoles: Record<string, OSKCompositeRole>;     roles: Record<string, OSKRole>; }` | `functions/src/modules/settings/modules/role/models/documents/composite_role_document.model.ts` |
| `OSKCompositeRoleDocument` | `OSKCompositeRole & {     creationDate: Timestamp; }` | `functions/src/modules/settings/modules/role/models/documents/composite_role_document.model.ts` |
| `OSKRole` | `{     title: Record<string, string>;     description: Record<string, string>;     parentCompositeRoles: string[]; }` | `functions/src/modules/settings/modules/role/models/documents/role_document.model.ts` |
| `OSKRoleDocument` | `OSKRole & { creationDate: Timestamp; modificationDate: Timestamp }` | `functions/src/modules/settings/modules/role/models/documents/role_document.model.ts` |
| `OSKRoleAssigner` | `{     userId: string;     firstName: string;     lastName: string; }` | `functions/src/modules/settings/modules/role/models/shared/assigned_role.model.ts` |
| `OSKAssignedRole` | `{     roleId: string;     assignedOn: Timestamp;     assignedBy: OSKRoleAssigner; }` | `functions/src/modules/settings/modules/role/models/shared/assigned_role.model.ts` |
| `OSKGeneratedRoles` | `{     assignedRoles: OSKAssignedRole[];     roles: string[]; }` | `functions/src/modules/settings/modules/role/models/shared/generated_roles.model.ts` |
| `OSKBuildingRequestWorkflow` | `{     isoCountryCode: string;     approvingOrganizationId: string; }` | `functions/src/modules/settings/modules/workflow/models/documents/building_request_workflow_document.model.ts` |
| `OSKBuildingRequestWorkflowDocument` | `OSKDocument<OSKBuildingRequestWorkflow>` | `functions/src/modules/settings/modules/workflow/models/documents/building_request_workflow_document.model.ts` |
| `OSKOrganizationRequestWorkflow` | `{     isoCountryCode: string;     approvingOrganizationId: string; }` | `functions/src/modules/settings/modules/workflow/models/documents/organization_request_workflow_document.model.ts` |
| `OSKOrganizationRequestWorkflowDocument` | `OSKDocument<OSKOrganizationRequestWorkflow>` | `functions/src/modules/settings/modules/workflow/models/documents/organization_request_workflow_document.model.ts` |
