<!-- © Oskey SAS. All rights reserved. -->

# Module Domain Profile: settings

*© Oskey SAS. All rights reserved.*

## Metadata

| Property | Value |
| :--- | :--- |
| **Domain Module** | `settings` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_153335-1aa319b1` |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Overall Confidence** | High |
| **Status** | Completed & Grounded |

---

## 1. Executive Summary

### Interpretation

The `settings` module is the platform configuration and RBAC catalog module for Oskey. Evidence indicates it manages generic settings documents, app-store/onboarding activation configuration, role definitions, composite roles, consolidated permission checks, and request workflow configuration for buildings and organizations.

Unlike several modules that expose only callables, `settings` also owns Firestore document triggers. These triggers react to role, composite-role, building-request-workflow, and organization-request-workflow document changes and route those events into service handlers.

The module is structurally important because it supplies permission metadata and role hierarchy behavior used by administrative and organization-scoped workflows. It also contains app-store activation-code configuration used by onboarding-related behavior.

### Evidence Used

- Manifest: `settings` has 29 files, 13 classes, 61 methods, 6 services, 7 controllers, 26 Firestore hints, 394 permission hints, 7 external hooks, and 10 Firestore triggers.
- Service: `OSKSettingService.onCreateSettingsCalled`.
- Service: `OSKAppStoreSettingsService.validateAppStoreActivationCode`, `validateInternally`, `getAppstoreInformation`.
- Service: `OSKCompositeRoleService.onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`, `onCreateCompositeRolesCalled`, `processRoleHierarchy`, `getAllCompositeRoles`, `getOrganizationCompositeRoles`.
- Service: `OSKRoleService.onDocumentCreated`, `getAllRoles`.
- Service: `OSKBuildingRequestWorkflowService.onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`, `onCreateBuildingRequestWorkflowsCalled`.
- Service: `OSKOrganizationRequestWorkflowService.onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`, `onCreateOrganizationRequestWorkflowsCalled`.
- Firestore path evidence: `/settings`, `/settings/roles/compositeRoles`, `/settings/roles/roles`, `/settings/workflows/buildingRequest`, `/settings/workflows/organizationRequests`.
- Firestore trigger evidence: 10 trigger entries in `settings-firestore-triggers.json`.

### Confidence

High for module purpose, internal structure, Firestore paths, callable entry points, and trigger presence. Medium for exact downstream trigger side effects where service method names indicate intent but evidence does not include full implementation details.

## 2. Architectural Position

### Interpretation

- Parent scope: Backend Cloud Functions module under the Oskey Firebase/GCP backend.
- Owned concepts: platform settings, app-store settings, RBAC role documents, composite-role documents, consolidated role derivation, building request workflow settings, and organization request workflow settings.
- Provided capabilities: settings seeding, role/composite-role seeding and listing, organization composite-role retrieval, role hierarchy maintenance, permission checking helpers, app-store activation-code validation, app-store information retrieval, and workflow seed/maintenance callables.
- Downstream consumers or candidate consumers: PGO/admin surfaces, organization-user authorization flows, onboarding flows that validate app-store activation codes, and backend services that call consolidated permission checks.
- Confidence: High for owned concepts and provided capabilities; medium for downstream consumers because not every consumer is directly evidenced in the settings module artefacts.

The approved architecture grounding describes Cloud Functions as the API gateway for the native mobile applications and Angular PGO portal, with modularized backend code mirroring Firestore collection layout and Firebase Security Rules. The `settings` module fits that pattern as the backend module around `/settings` configuration data.

### Evidence Used

- Architecture: Cloud Functions are the primary API gateway for mobile applications and the Angular PGO portal.
- Architecture: Firestore is the primary database for mobile and PGO management state.
- Architecture: PGO SuperAdmin and Organization User personas rely on granular RBAC permissions.
- Controller: `OSKSettingController.get`, `create`, `delete`.
- Controller: `OSKAppStoreSettingsController.get`, `save`, `delete`.
- Controller: `OSKCompositeRoleController.getAll`, `get`, `save`, `create`, `updateParentCompositeRoles`, `createorUpdateDependantRoles`, `deleteOrUpdateDependantRoles`, `delete`.
- Controller: `OSKConsolidatedRolesController.buildConsolidatedRoles`, `checkUserPermissions`, `checkUserPermissionsSafe`, `generateOrganizationUserRoles`.
- Controller: `OSKRoleController.getAll`, `listDocuments`, `get`, `save`, `create`, `updateParentCompositeRoles`, `delete`.
- Controller: `OSKBuildingRequestWorkflowController.get`, `save`, `create`, `delete`.
- Controller: `OSKOrganizationRequestWorkflowController.get`, `save`, `create`, `delete`.

### Confidence

High.

## 3. Primary Responsibilities

### Interpretation

The module implements six main responsibility areas.

#### Generic Settings Creation

- Capability: Create baseline platform settings documents.
- Implemented by:
  - Controller: `OSKSettingController`
  - Service: `OSKSettingService`
  - Representative Service Method: `onCreateSettingsCalled`
- Evidence: `settings/index.ts` registers `https.onCall(OSKSettingService.onCreateSettingsCalled)`; `OSKSettingController` reads, creates, and deletes documents under `/settings`.
- Confidence: High.

#### App Store Settings And Activation Code Validation

- Capability: Store and read app-store configuration and validate special activation codes.
- Implemented by:
  - Controller: `OSKAppStoreSettingsController`
  - Service: `OSKAppStoreSettingsService`
  - Representative Service Method: `validateAppStoreActivationCode`
- Evidence: `OSKAppStoreSettingsService` exposes `validateAppStoreActivationCode`, `validateInternally`, and `getAppstoreInformation`; app-store controller touches `/settings`; backend architecture describes `/settings/appstore` as a singleton configuration document for store URLs and activation codes.
- Confidence: High for service/controller behavior; medium for singleton detail because it is grounded in architecture documentation rather than AST path evidence for the literal `appstore` id.

#### Composite Role Management

- Capability: Create, update, delete, seed, list, and derive composite roles.
- Implemented by:
  - Controller: `OSKCompositeRoleController`
  - Service: `OSKCompositeRoleService`
  - Representative Service Method: `processRoleHierarchy`
- Evidence: Firestore path `/settings/roles/compositeRoles`; trigger handlers `onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`; callable `onCreateCompositeRolesCalled`; listing methods `getAllCompositeRoles` and `getOrganizationCompositeRoles`.
- Confidence: High.

#### Atomic Role Management

- Capability: Create/list/read/update/delete role documents and expose all roles to callable consumers.
- Implemented by:
  - Controller: `OSKRoleController`
  - Service: `OSKRoleService`
  - Representative Service Method: `getAllRoles`
- Evidence: Firestore path `/settings/roles/roles`; callable `OSKRoleService.getAllRoles`; Firestore create trigger `OSKRoleService.onDocumentCreated`.
- Confidence: High.

#### Consolidated Permission Evaluation

- Capability: Build consolidated roles from assigned/composite roles and check permissions.
- Implemented by:
  - Controller: `OSKConsolidatedRolesController`
  - Service: No dedicated service in the evidence; this is controller-level support logic.
  - Representative Controller Method: `checkUserPermissions`
- Evidence: Methods `buildConsolidatedRoles`, `checkUserPermissions`, `checkUserPermissionsSafe`, and `generateOrganizationUserRoles`; call evidence shows consolidated role construction reads all composite roles through `OSKCompositeRoleController.default.getAll`.
- Confidence: High.

#### Request Workflow Configuration

- Capability: Manage building and organization request workflow settings.
- Implemented by:
  - Controller: `OSKBuildingRequestWorkflowController`
  - Controller: `OSKOrganizationRequestWorkflowController`
  - Service: `OSKBuildingRequestWorkflowService`
  - Service: `OSKOrganizationRequestWorkflowService`
  - Representative Service Methods: `onCreateBuildingRequestWorkflowsCalled`, `onCreateOrganizationRequestWorkflowsCalled`
- Evidence: Firestore paths `/settings/workflows/buildingRequest` and `/settings/workflows/organizationRequests`; Firestore triggers for create/update/delete on workflow path variables; callable seed/create methods for building and organization request workflows.
- Confidence: High.

### Evidence Used

- Service list from `settings-services.json`.
- Controller list from `settings-controllers.json`.
- Callable evidence from `settings-evidence-graph.json`: `https.onCall(OSKSettingService.onCreateSettingsCalled)`, `https.onCall(OSKCompositeRoleService.onCreateCompositeRolesCalled)`, `https.onCall(OSKRoleService.getAllRoles)`, `https.onCall(OSKCompositeRoleService.getAllCompositeRoles)`, `https.onCall(OSKCompositeRoleService.getOrganizationCompositeRoles)`, `https.onCall(OSKBuildingRequestWorkflowService.onCreateBuildingRequestWorkflowsCalled)`, `https.onCall(OSKOrganizationRequestWorkflowService.onCreateOrganizationRequestWorkflowsCalled)`.
- Firestore path evidence from `settings-evidence.json` and `settings-evidence-graph.json`.

### Confidence

High.

## 4. Public Interfaces

### Interpretation

The public backend interface is a combination of callable Cloud Functions and Firestore document triggers.

Callable functions evidenced by the AST graph:

- `OSKSettingService.onCreateSettingsCalled`
- `OSKCompositeRoleService.onCreateCompositeRolesCalled`
- `OSKRoleService.getAllRoles`
- `OSKCompositeRoleService.getAllCompositeRoles`
- `OSKCompositeRoleService.getOrganizationCompositeRoles`
- `OSKBuildingRequestWorkflowService.onCreateBuildingRequestWorkflowsCalled`
- `OSKOrganizationRequestWorkflowService.onCreateOrganizationRequestWorkflowsCalled`

Exported trigger composition functions:

- `getSettingsFirestoreTriggers`
- `getSettingsCallableFunction`
- `getRoleFirestoreTriggers`
- `getRoleCallableFunction`
- `getWorkflowFirestoreTriggers`
- `getWorkflowCallableFunction`

Exported controllers/models from the role and workflow submodules indicate that other backend modules may import settings role/workflow utilities directly.

### Evidence Used

- `settings/index.ts`: `getSettingsFirestoreTriggers` calls `getRoleFirestoreTriggers(functionBuilder)` and `getWorkflowFirestoreTriggers(functionBuilder)`.
- `settings/index.ts`: `getSettingsCallableFunction` registers `OSKSettingService.onCreateSettingsCalled`, then composes role and workflow callables.
- `settings/modules/role/index.ts`: exports `OSKCompositeRoleController`, `OSKConsolidatedRolesController`, `OSKRoleController`, role document/model symbols, `getRoleFirestoreTriggers`, and `getRoleCallableFunction`.
- `settings/modules/workflow/index.ts`: exports building and organization request workflow controllers, documents/models, `getWorkflowFirestoreTriggers`, and `getWorkflowCallableFunction`.
- App Check evidence: callable groups use `functionBuilder.runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`.

### Confidence

High.

## 5. Internal Structure

### Interpretation

The module decomposes into a root settings area and three submodule areas.

Root settings:

- Controller: `OSKSettingController`
- Service: `OSKSettingService`
- Firestore path: `/settings`
- Role: create/read/delete generic settings documents and expose a settings creation callable.

App store settings:

- Controller: `OSKAppStoreSettingsController`
- Service: `OSKAppStoreSettingsService`
- Firestore path: `/settings`
- Role: app-store information and activation-code validation.

Role settings:

- Controllers: `OSKCompositeRoleController`, `OSKRoleController`, `OSKConsolidatedRolesController`
- Services: `OSKCompositeRoleService`, `OSKRoleService`
- Firestore paths: `/settings/roles/compositeRoles`, `/settings/roles/roles`, and trigger path `/settings/roles/compositeRoles/{compositeRoleId}`
- Role: RBAC catalog and role hierarchy maintenance.

Workflow settings:

- Controllers: `OSKBuildingRequestWorkflowController`, `OSKOrganizationRequestWorkflowController`
- Services: `OSKBuildingRequestWorkflowService`, `OSKOrganizationRequestWorkflowService`
- Firestore paths: `/settings/workflows/buildingRequest`, `/settings/workflows/organizationRequests`, and trigger path `/settings/workflows/buildingRequests/{workflowId}`
- Role: request workflow configuration seeding and event handling.

### Evidence Used

- Manifest: 6 services and 7 controllers.
- Controller evidence: `OSKSettingController`, `OSKAppStoreSettingsController`, `OSKCompositeRoleController`, `OSKConsolidatedRolesController`, `OSKRoleController`, `OSKBuildingRequestWorkflowController`, `OSKOrganizationRequestWorkflowController`.
- Service evidence: `OSKSettingService`, `OSKAppStoreSettingsService`, `OSKCompositeRoleService`, `OSKRoleService`, `OSKBuildingRequestWorkflowService`, `OSKOrganizationRequestWorkflowService`.
- Firestore path evidence: `/settings`, `/settings/roles/compositeRoles`, `/settings/roles/roles`, `/settings/workflows/buildingRequest`, `/settings/workflows/organizationRequests`.

### Confidence

High.

## 6. Firestore & Data Ownership

### Interpretation

The module's primary persistence is the `/settings` subtree.

Confirmed AST-derived paths:

- `/settings`
- `/settings/roles/compositeRoles`
- `/settings/roles/compositeRoles/{compositeRoleId}`
- `/settings/roles/roles`
- `/settings/workflows/buildingRequest`
- `/settings/workflows/buildingRequests/{workflowId}`
- `/settings/workflows/organizationRequests`

Schema-grounded paths:

- `/settings/{id}/compositeRoles`
- `/settings/{id}/roles`
- `/settings/{id}/buildingRequest`
- `/settings/{id}/organizationRequests`
- `/settings`

There is a naming mismatch between some AST paths and schema paths:

- AST role paths use `/settings/roles/compositeRoles` and `/settings/roles/roles`; schema lists `/settings/{id}/compositeRoles` and `/settings/{id}/roles`.
- AST workflow controller paths use `/settings/workflows/buildingRequest` and `/settings/workflows/organizationRequests`; schema lists `/settings/{id}/buildingRequest` and `/settings/{id}/organizationRequests`.
- Trigger evidence includes `/settings/workflows/buildingRequests/{workflowId}` with plural `buildingRequests`, while controller evidence includes `/settings/workflows/buildingRequest` with singular `buildingRequest`.

The profile should preserve these as evidence differences rather than silently normalizing them.

Firestore rules include a direct match for `/settings/{docId}` allowing read and write when `isValidUser()` is true. That is broader than the module-level RBAC evidence, which contains settings-specific admin permission strings. This may indicate that backend callables enforce finer-grained permissions, that Firestore direct access is intentionally broad for top-level settings documents, or that rules are incomplete for nested settings structures. The supplied evidence does not resolve this.

### Evidence Used

- Firestore path: `/settings`, touched by `OSKSettingController` lines 20, 25, and 32.
- Firestore path: `/settings`, touched by `OSKAppStoreSettingsController` lines 18, 22, and 26.
- Firestore path: `/settings/roles/compositeRoles`, touched by `OSKCompositeRoleController` line 15.
- Firestore path: `/settings/roles/roles`, touched by `OSKRoleController` lines 19, 23, 26, 30, 35, 43, and 49.
- Firestore path: `/settings/roles/compositeRoles/{compositeRoleId}`, touched by `settings/modules/role/index.ts` line 11.
- Firestore path: `/settings/workflows/buildingRequest`, touched by `OSKBuildingRequestWorkflowController` lines 23, 27, 32, and 39.
- Firestore path: `/settings/workflows/organizationRequests`, touched by `OSKOrganizationRequestWorkflowController` lines 23, 27, 32, and 39.
- Firestore path: `/settings/workflows/buildingRequests/{workflowId}`, touched by `settings/modules/workflow/index.ts` line 11.
- Schema: `firestore-schema.md` lists `/settings/{id}/compositeRoles`, `/settings/{id}/roles`, `/settings/{id}/buildingRequest`, `/settings/{id}/organizationRequests`, and `/settings`.
- Firestore rules: `firestore.rules.txt` has `match /settings/{docId}` with `allow write: if isValidUser(); allow read: if isValidUser();`.

### Confidence

High for confirmed AST paths. Medium for schema alignment because the AST and schema use different path shapes for some settings subcollections.

## 7. API Endpoints

This section is detailed in the companion `api-contracts/settings-api-contract.md` document.

---

## 8. API Endpoints

This section is detailed in the companion `api-reference/settings-api-reference.md` document.

---

## 9. Firestore Triggers

### Interpretation

The settings module exposes 10 Firestore document triggers. These are grouped into role triggers and workflow triggers.

Confirmed role triggers:

- Firestore Trigger: `onCreate`
  - Path or Path Variable: `compositeRolePath`
  - Confirmed path evidence: `/settings/roles/compositeRoles/{compositeRoleId}`
  - Handler: `OSKCompositeRoleService.onDocumentCreated`
  - Source File: `functions/src/modules/settings/modules/role/index.ts`
  - Line: 36
  - Likely architectural role: maintain dependent role/composite-role metadata when a composite role is created.
  - Confidence: High for trigger; medium for side effect.

- Firestore Trigger: `onUpdate`
  - Path or Path Variable: `compositeRolePath`
  - Confirmed path evidence: `/settings/roles/compositeRoles/{compositeRoleId}`
  - Handler: `OSKCompositeRoleService.onDocumentUpdated`
  - Source File: `functions/src/modules/settings/modules/role/index.ts`
  - Line: 39
  - Likely architectural role: maintain role hierarchy and dependent role state when composite roles change.
  - Confidence: High for trigger; medium for side effect.

- Firestore Trigger: `onDelete`
  - Path or Path Variable: `compositeRolePath`
  - Confirmed path evidence: `/settings/roles/compositeRoles/{compositeRoleId}`
  - Handler: `OSKCompositeRoleService.onDocumentDeleted`
  - Source File: `functions/src/modules/settings/modules/role/index.ts`
  - Line: 42
  - Likely architectural role: update or remove dependent role references after composite-role deletion.
  - Confidence: High for trigger; medium for side effect.

- Firestore Trigger: `onCreate`
  - Path or Path Variable: `rolePath`
  - Confirmed concrete controller path: `/settings/roles/roles`
  - Handler: `OSKRoleService.onDocumentCreated`
  - Source File: `functions/src/modules/settings/modules/role/index.ts`
  - Line: 45
  - Likely architectural role: respond to creation of atomic role documents.
  - Confidence: High for trigger; medium for exact path because trigger evidence identifies `rolePath` but the trigger artefact does not resolve it to a literal path.

Confirmed workflow triggers:

- Firestore Trigger: `onCreate`
  - Path or Path Variable: `buildingRequestWorkflowPath`
  - Confirmed path evidence: `/settings/workflows/buildingRequests/{workflowId}`
  - Handler: `OSKBuildingRequestWorkflowService.onDocumentCreated`
  - Source File: `functions/src/modules/settings/modules/workflow/index.ts`
  - Line: 39
  - Confidence: High.

- Firestore Trigger: `onUpdate`
  - Path or Path Variable: `buildingRequestWorkflowPath`
  - Confirmed path evidence: `/settings/workflows/buildingRequests/{workflowId}`
  - Handler: `OSKBuildingRequestWorkflowService.onDocumentUpdated`
  - Source File: `functions/src/modules/settings/modules/workflow/index.ts`
  - Line: 42
  - Confidence: High.

- Firestore Trigger: `onDelete`
  - Path or Path Variable: `buildingRequestWorkflowPath`
  - Confirmed path evidence: `/settings/workflows/buildingRequests/{workflowId}`
  - Handler: `OSKBuildingRequestWorkflowService.onDocumentDeleted`
  - Source File: `functions/src/modules/settings/modules/workflow/index.ts`
  - Line: 45
  - Confidence: High.

- Firestore Trigger: `onCreate`
  - Path or Path Variable: `organizationRequestWorkflowPath`
  - Confirmed concrete controller path: `/settings/workflows/organizationRequests`
  - Handler: `OSKOrganizationRequestWorkflowService.onDocumentCreated`
  - Source File: `functions/src/modules/settings/modules/workflow/index.ts`
  - Line: 48
  - Confidence: High for trigger; medium for exact trigger path because the trigger artefact does not resolve the variable.

- Firestore Trigger: `onUpdate`
  - Path or Path Variable: `organizationRequestWorkflowPath`
  - Confirmed concrete controller path: `/settings/workflows/organizationRequests`
  - Handler: `OSKOrganizationRequestWorkflowService.onDocumentUpdated`
  - Source File: `functions/src/modules/settings/modules/workflow/index.ts`
  - Line: 51
  - Confidence: High for trigger; medium for exact trigger path because the trigger artefact does not resolve the variable.

- Firestore Trigger: `onDelete`
  - Path or Path Variable: `organizationRequestWorkflowPath`
  - Confirmed concrete controller path: `/settings/workflows/organizationRequests`
  - Handler: `OSKOrganizationRequestWorkflowService.onDocumentDeleted`
  - Source File: `functions/src/modules/settings/modules/workflow/index.ts`
  - Line: 54
  - Confidence: High for trigger; medium for exact trigger path because the trigger artefact does not resolve the variable.

### Evidence Used

- Firestore Trigger: `settings-firestore-triggers.json` entries for `onCreate`, `onUpdate`, and `onDelete` on `compositeRolePath`.
- Firestore Trigger: `settings-firestore-triggers.json` entry for `onCreate` on `rolePath`.
- Firestore Trigger: `settings-firestore-triggers.json` entries for `onCreate`, `onUpdate`, and `onDelete` on `buildingRequestWorkflowPath`.
- Firestore Trigger: `settings-firestore-triggers.json` entries for `onCreate`, `onUpdate`, and `onDelete` on `organizationRequestWorkflowPath`.
- Handler methods from `settings-services.json`.
- Path evidence from `settings-evidence-graph.json`.

### Confidence

High for trigger count, trigger type, source files, lines, and handlers. Medium for exact unresolved path variables where only controller paths or separate path constants are available.

## 10. Permissions & Security

### Interpretation

The settings module is tightly related to RBAC data but its own runtime security evidence is mixed.

Permission evidence includes settings-specific admin permissions:

- `v1.admin.settings.admin`
- `v1.admin.settings.role.admin`
- `v1.admin.settings.role.view`
- `v1.admin.settings.role.create`
- `v1.admin.settings.role.edit`
- `v1.admin.settings.role.delete`
- `v1.admin.settings.workflow.admin`
- `v1.admin.settings.workflow.view`
- `v1.admin.settings.workflow.create`
- `v1.admin.settings.workflow.edit`
- `v1.admin.settings.workflow.delete`

The evidence also includes production organization-scoped permission families such as `v1.org.admin`, `v1.org.settings.admin`, `v1.org.settings.list`, `v1.org.settings.view`, `v1.org.settings.create`, `v1.org.settings.edit`, and `v1.org.settings.delete`.

However, the contract states that `v1.admin` roles are work in progress and not currently implemented, while `v1.org.admin` roles are currently in production. Therefore, settings-specific `v1.admin.settings.*` permissions should be treated as catalog/evidence entries, not proof of deployed production enforcement.

Callable functions use App Check enforcement outside emulator mode:

- `functionBuilder.runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`

Firestore rules allow direct `/settings/{docId}` reads and writes for any valid authenticated user. This rule evidence is broader than the RBAC catalog evidence and should be treated as an open security alignment question.

The module also contains `OSKConsolidatedRolesController.checkUserPermissions` and `checkUserPermissionsSafe`, indicating that permission evaluation support exists inside this module.

### Evidence Used

- Permission: `v1.admin.settings.admin`.
- Permission: `v1.admin.settings.role.admin`, `view`, `create`, `edit`, `delete`.
- Permission: `v1.admin.settings.workflow.admin`, `view`, `create`, `edit`, `delete`.
- Permission: `v1.org.settings.admin`, `list`, `view`, `create`, `edit`, `delete`.
- Contract: `v1.admin` roles are WIP and not currently implemented; `v1.org.admin` roles are currently in production.
- Controller: `OSKConsolidatedRolesController.checkUserPermissions`.
- Controller: `OSKConsolidatedRolesController.checkUserPermissionsSafe`.
- External hook/security config: `OSK_FIREBASE_EMULATOR` controls App Check enforcement in callable groups.
- Firestore rules: `/settings/{docId}` allows read and write when `isValidUser()` is true.

### Confidence

High for permission strings and App Check evidence. Medium for runtime authorization behavior because permission catalog evidence and Firestore rules do not fully align.

## 11. Cross-Module Relationships

### Interpretation

The strongest cross-module relationship is that settings provides RBAC and consolidated-role utilities that other modules can use for permission checks and role assignment. This is supported by exported controllers and methods, not by a complete consumer graph in the supplied artefacts.

Confirmed or candidate relationships:

- Admin/PGO modules: settings contains `v1.admin.*` role and composite-role catalog data used by admin-facing permission models.
- Organization modules: settings contains `v1.org.*` production role catalog data and `generateOrganizationUserRoles`.
- Onboarding/user flows: app-store activation-code validation is a candidate dependency for onboarding behavior, supported by backend architecture documentation for `/settings/appstore`.
- Workflow-related modules: building and organization request workflow settings are candidate consumers for building/organization registration or approval flows; exact downstream workflow consumers are not proven in this module evidence.

### Evidence Used

- Exported controller: `OSKConsolidatedRolesController`.
- Controller method: `generateOrganizationUserRoles`.
- Controller method: `checkUserPermissions`.
- RBAC reference: `v1.admin.settings.*` and `v1.org.settings.*`.
- Architecture: PGO SuperAdmin assigns granular RBAC permissions across PGO software modules.
- Architecture: `/settings/appstore` stores activation codes used by onboarding-related logic.
- Service: `OSKAppStoreSettingsService.validateAppStoreActivationCode`.
- Service: `OSKBuildingRequestWorkflowService.onCreateBuildingRequestWorkflowsCalled`.
- Service: `OSKOrganizationRequestWorkflowService.onCreateOrganizationRequestWorkflowsCalled`.

### Confidence

Medium. The module clearly exports shared role utilities and settings data, but exact consumer modules are not fully enumerated by the supplied evidence.

## 12. External Hooks

### Interpretation

The only direct external/environment hook identified in the settings evidence is `OSK_FIREBASE_EMULATOR`.

This environment variable is used to disable App Check enforcement in emulator contexts:

- `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR`

Architecture-grounded candidate external relationships:

- App-store configuration: `/settings/appstore` holds mobile store URLs and activation codes for app-store reviewer or onboarding cases.
- PGO/admin clients: callables and role/workflow settings likely support administrative UI flows.

No direct Pub/Sub, Cloud Tasks, MongoDB, hardware, Auth0, SMS, email, or storage hook is confirmed inside the supplied settings module evidence.

### Evidence Used

- External hook: `OSK_FIREBASE_EMULATOR` appears 7 times in settings evidence.
- Callable registration: `functionBuilder.runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`.
- Architecture: `/settings/appstore` stores global mobile app-store URLs and activation codes.
- Service: `OSKAppStoreSettingsService.getAppstoreInformation`.
- Service: `OSKAppStoreSettingsService.validateInternally`.

### Confidence

High for `OSK_FIREBASE_EMULATOR`. Medium for app-store/onboarding relationship because it is grounded in architecture documentation and service names, not direct downstream consumer evidence in this module.

## 13. Architectural Observations

### Interpretation

The module functions as a platform metadata layer. It stores and maintains the data that describes permissions, composite-role hierarchy, settings, and request workflow options rather than operational business entities like users, buildings, or suppliers.

The role subsystem is event-driven. Composite-role creates, updates, and deletes trigger service handlers, and the service/controller names indicate maintenance of dependent role relationships. This is a reasonable use of Firestore triggers because role hierarchy consistency is a derived-data concern.

The module mixes three access patterns:

- Explicit callable seed/list APIs.
- Direct controller CRUD against `/settings` subtrees.
- Firestore triggers for consistency maintenance.

There is a documented/configured tension between RBAC catalog richness and Firestore rule breadth. The RBAC catalogue includes fine-grained settings roles, while Firestore rules for `/settings/{docId}` allow any valid user to read/write top-level settings documents. This may be intentional for a legacy or backend-mediated model, but it should be carried forward as an open security interpretation issue.

Path naming divergence appears in the evidence. The AST uses concrete paths such as `/settings/roles/compositeRoles`, while the schema uses parameterized forms such as `/settings/{id}/compositeRoles`. The workflow path also differs between singular `buildingRequest` in controller evidence and plural `buildingRequests` in trigger path evidence. These should be treated as evidence differences until reconciled.

### Evidence Used

- Firestore Trigger: composite-role `onCreate`, `onUpdate`, `onDelete`.
- Firestore Trigger: workflow `onCreate`, `onUpdate`, `onDelete`.
- Controller: `OSKCompositeRoleController.createorUpdateDependantRoles`.
- Controller: `OSKCompositeRoleController.deleteOrUpdateDependantRoles`.
- Service: `OSKCompositeRoleService.processRoleHierarchy`.
- Controller: `OSKConsolidatedRolesController.buildConsolidatedRoles`.
- Firestore rules: `/settings/{docId}` read/write for `isValidUser()`.
- RBAC: `v1.admin.settings.*` and `v1.org.settings.*` permission catalog entries.
- Firestore path conflict evidence: AST `/settings/roles/compositeRoles` vs schema `/settings/{id}/compositeRoles`; AST `/settings/workflows/buildingRequest` and `/settings/workflows/buildingRequests/{workflowId}` vs schema `/settings/{id}/buildingRequest`.

### Confidence

High for architectural observations grounded in the evidence. Medium for inferred consistency side effects.

## 14. Risks & Open Questions

### Interpretation

Risks and open questions:

- Firestore rules allow `/settings/{docId}` read/write for any valid user, while the RBAC catalog defines fine-grained settings permissions. Does production rely only on callables for sensitive settings writes, or can clients write these documents directly?
- `v1.admin.settings.*` permissions exist in evidence and RBAC, but the contract says `v1.admin` roles are WIP and not currently implemented. Which settings callables are production-safe today?
- Path shapes differ between AST evidence and schema documentation for role and workflow settings. Which path shape is canonical in deployed Firestore?
- Workflow trigger evidence includes `buildingRequests` plural, while controller evidence includes `buildingRequest` singular. Is this an intentional split between document and collection paths, or drift?
- Trigger artefacts do not resolve `rolePath` and `organizationRequestWorkflowPath` to literal path strings. Exact trigger paths require confirmation from code or improved extraction.
- The module has 394 permission hints, many from RBAC catalog data. Not every permission hint should be interpreted as a runtime authorization check inside settings code.
- App-store activation code behavior is grounded in service names and architecture docs, but consumer workflows are outside this module's supplied evidence.

### Evidence Used

- Firestore rules: `/settings/{docId}` allows read/write for `isValidUser()`.
- Contract: `v1.admin` roles are WIP and not currently implemented.
- RBAC: `v1.admin.settings.*` and `v1.org.settings.*`.
- Firestore paths: `/settings/roles/compositeRoles`, `/settings/roles/roles`, `/settings/workflows/buildingRequest`, `/settings/workflows/buildingRequests/{workflowId}`, `/settings/workflows/organizationRequests`.
- Schema paths: `/settings/{id}/compositeRoles`, `/settings/{id}/roles`, `/settings/{id}/buildingRequest`, `/settings/{id}/organizationRequests`.
- Trigger evidence: unresolved path variables `rolePath` and `organizationRequestWorkflowPath`.
- Manifest: 394 permission hints.

### Confidence

High.

## 15. Evidence References

Significant supporting artefacts referenced during generation:

- `output/knowledge-pipeline/modules/settings/settings-manifest.json`
- `output/knowledge-pipeline/modules/settings/settings-services.json`
- `output/knowledge-pipeline/modules/settings/settings-controllers.json`
- `output/knowledge-pipeline/modules/settings/settings-evidence.json`
- `output/knowledge-pipeline/modules/settings/settings-evidence-graph.json`
- `output/knowledge-pipeline/modules/settings/settings-firestore-triggers.json`
- `ai-runtime/contracts/module-engineering-profile/contract.md`
- `ai-runtime/contracts/module-engineering-profile/work-order.md`
- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/firestore.indexes.json`
- `ai-runtime/contracts/docs/rbac-roles.json`

Concrete evidence highlights:

- Manifest summary: 29 files, 6 services, 7 controllers, 61 methods, 193 calls, 26 Firestore hints, 394 permission hints, 7 external hooks, 10 Firestore triggers.
- Controllers: `OSKSettingController`, `OSKAppStoreSettingsController`, `OSKCompositeRoleController`, `OSKConsolidatedRolesController`, `OSKRoleController`, `OSKBuildingRequestWorkflowController`, `OSKOrganizationRequestWorkflowController`.
- Services: `OSKSettingService`, `OSKAppStoreSettingsService`, `OSKCompositeRoleService`, `OSKRoleService`, `OSKBuildingRequestWorkflowService`, `OSKOrganizationRequestWorkflowService`.
- Firestore paths: `/settings`, `/settings/roles/compositeRoles`, `/settings/roles/roles`, `/settings/workflows/buildingRequest`, `/settings/workflows/organizationRequests`.
- Firestore triggers: composite-role create/update/delete, role create, building-request-workflow create/update/delete, organization-request-workflow create/update/delete.
- Callable interfaces: settings creation, composite-role seeding/listing, role listing, organization composite-role listing, building workflow seeding, organization workflow seeding.
- Security evidence: App Check enforcement outside emulator mode; `OSK_FIREBASE_EMULATOR`; settings RBAC catalog entries; Firestore `/settings/{docId}` valid-user read/write rule.
