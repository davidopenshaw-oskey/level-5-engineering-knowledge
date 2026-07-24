# API Reference: settings

## 0. Generation Metadata

- **Run ID**: 20260724_101041-1aa319b1
- **Generated At**: 2026-07-24T10:10:48.166Z

---

## 1. Callable Functions

### Interpretation

The `settings` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `onCreateSettingsCalled` | `{ dummy: string }` | ```json
{
  "dummy": "string"
}
``` |
| `onCreateCompositeRolesCalled` | `{ dummy: string }` | ```json
{
  "dummy": "string"
}
``` |
| `getAllRoles` | `Record<string, never>` | ```json
{}
``` |
| `getAllCompositeRoles` | `Record<string, never>` | ```json
{}
``` |
| `getOrganizationCompositeRoles` | `Record<string, never>` | ```json
{}
``` |
| `onCreateBuildingRequestWorkflowsCalled` | `{ dummy: string }` | ```json
{
  "dummy": "string"
}
``` |
| `onCreateOrganizationRequestWorkflowsCalled` | `{ dummy: string }` | ```json
{
  "dummy": "string"
}
``` |

### Evidence Used

- API Contract: The `settings-evidence-graph.json` file contains 7 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/settings/index.ts` registers these handlers.

### Confidence

High.

---

## 2. Domain Types & Enums

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
