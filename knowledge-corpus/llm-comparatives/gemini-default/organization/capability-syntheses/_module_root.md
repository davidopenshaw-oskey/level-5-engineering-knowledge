# Capability Synthesis — _module_root

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.477Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: _module_root
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `_module_root` capability of the `organization` module serves as the foundational orchestrator and entry point for all organization-related operations. It manages the lifecycle of organizations—including creation, updates, retrieval, and logo asset management—while aggregating and exposing callable Cloud Function triggers from its various submodules (`functions/src/modules/organization/index.ts` (lines 89-109)). [Confirmed]

## 2. Primary Responsibilities
- **Organization Creation**: Provisions new organizations by validating administrative permissions, generating unique document IDs, persisting organization metadata, and automatically saving a default base entity associated with the organization (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|createAnOrganization|#1`, `call_expression|organization|functions/src/modules/organization/services/organization.service.ts|OSKEntityController.default.save|createAnOrganization|entityP,baseEntity|#1`). [Confirmed]
- **Organization Updates**: Modifies existing organization metadata (such as name, tax number, country code, and address) after verifying that the requesting user holds the necessary administrative or organizational edit permissions (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|updateAnOrganization|#1`). [Confirmed]
- **Organization Retrieval**: Allows authorized administrators to retrieve a list of all organizations or fetch a specific organization by its unique identifier or name (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|getAllOrganizations|#1`, `call_expression|organization|functions/src/modules/organization/controllers/organization.controller.ts|OSKOrganizationController.default._query|getOrganizationByName|OSKOrganizationController.collection,queryFilter|#1`). [Confirmed]
- **Logo Asset Management**: Handles uploading and deleting organization logo images within Google Cloud Storage, updating the corresponding Firestore document reference accordingly (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|uploadimage|#1`, `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|deleteOrganizationLogo|#1`). [Confirmed]
- **Submodule Trigger Aggregation**: Collects and exports callable Cloud Function triggers from all nested submodules (such as `organization_building`, `organization_user`, `organization_property`, etc.) to expose them under a unified interface (`functions/src/modules/organization/index.ts` (lines 89-109)). [Confirmed]

## 3. Public Interfaces (Controllers & Entry Points)
- **Callable Cloud Functions Entry Point** (`functions/src/modules/organization/index.ts`): Exposes the primary callable triggers `createAnOrganization`, `updateAnOrganization`, `getAllOrganizations`, and `deleteOrganizationLogo` to clients (`functions/src/modules/organization/index.ts` (lines 89-109)).
- **OSKOrganizationController** (`functions/src/modules/organization/controllers/organization.controller.ts`): Extends the core `OSKDocumentController` to provide low-level database operations (get, getAll, save, update, uploadImage, deleteImage) specifically mapped to the `organizations` collection.
- **OSKOrganizationService** (`functions/src/modules/organization/services/organization.service.ts`): The primary service class orchestrating business logic, permission checks, and transactional flows for organization operations.
- **OSKOrganizationUserUtils** (`functions/src/modules/organization/utils/get_organization_user.util.ts`): A utility class providing helper methods to retrieve and validate organization user details.

## 4. API Contracts & Firestore Triggers

### Callable APIs
The following callable APIs are exposed by this capability:

- **createAnOrganization** (`api_contract|organization|functions/src/modules/organization/index.ts|createAnOrganization|#1`)
  - **Request Schema**: `OSKOrganizationCreateRequest`
    - `adminsOrganizationId`: `string`
    - `id`: `string`
    - `isoCountryCode`: `string`
    - `name`: `string`
    - `organizationLogo`: `string | undefined` (optional)
    - `streetAddress`: `OSKStreetAddress`
    - `taxNumber`: `string`
    - `tenant`: `string`
    - `userRoles`: `string[]`
- **getAllOrganizations** (`api_contract|organization|functions/src/modules/organization/index.ts|getAllOrganizations|#1`)
  - **Request Schema**: `OSKGetAllOrganizationsRequestDocument`
    - `adminsOrganizationId`: `string`
- **updateAnOrganization** (`api_contract|organization|functions/src/modules/organization/index.ts|updateAnOrganization|#1`)
  - **Request Schema**: `OSKOrganizationUpdateRequest`
    - `adminsOrganizationId`: `string`
    - `id`: `string`
    - `isoCountryCode`: `string`
    - `name`: `string`
    - `organizationLogo`: `string | undefined` (optional)
    - `streetAddress`: `OSKStreetAddress`
    - `taxNumber`: `string`
    - `tenant`: `string`
    - `userRoles`: `string[]`
- **deleteOrganizationLogo** (`api_contract|organization|functions/src/modules/organization/index.ts|deleteOrganizationLogo|#1`)
  - *Note*: No matching `model_property` facts were resolved within this pack to construct a detailed schema for `deleteOrganizationLogoRequest`.

### Firestore Triggers
- **onDocumentCreated** (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|onDocumentCreated|#1`): A service method exists to handle document creation events, but it is not registered as an active Firestore trigger in the module's entry point (`functions/src/modules/organization/index.ts`). [Inferred]

## 5. Data Ownership
- **Collection**: `/organizations`
  - **Description**: Authoritative collection containing organization profiles, metadata, and configuration settings.
  - **Operations**: Read, Write, Update, Delete (`functions/src/modules/organization/controllers/organization.controller.ts` (lines 20-67)). [Confirmed]
- **Collection**: `/entities`
  - **Description**: Touched during organization creation to provision a default base entity.
  - **Operations**: Write (`call_expression|organization|functions/src/modules/organization/services/organization.service.ts|OSKEntityController.default.save|createAnOrganization|entityP,baseEntity|#1`). [Confirmed]

## 6. Outbound Coupling

### Cross-Module Coupling
- **core**: Depends on core document controllers, logging services, and street address models.
  - *Evidence*:
    - `imports_dependency|organization|functions/src/modules/organization/controllers/organization.controller.ts|@oskey/core/controllers/document|#1`
    - `imports_dependency|organization|functions/src/modules/organization/services/organization.service.ts|@oskey/core|#1`
    - `imports_dependency|organization|functions/src/modules/organization/services/organization.service.ts|@oskey/core/logger|#1`
- **settings**: Couples with the settings module to perform consolidated role and permission checks.
  - *Evidence*:
    - `imports_dependency|organization|functions/src/modules/organization/services/organization.service.ts|@oskey/settings/role|#1`
- **user**: Retrieves user profiles during organization user validation.
  - *Evidence*:
    - `imports_dependency|organization|functions/src/modules/organization/services/organization.service.ts|@oskey/user|#1`

### Intra-Module Cross-Submodule Coupling
This capability imports and orchestrates multiple sibling submodules of the `organization` module:
- **organization_building**: `../modules/organization_building/index`
- **organization_building_invitation**: `@oskey/organization/building/invitation`
- **organization_entity**: `@oskey/organization/entity`
- **organization_inhabitant**: `@oskey/organization/inhabitant`
- **organization_intercom_communication**: `../modules/organization_intercom_ communication/index`
- **organization_onboarding_inhabitant**: `../modules/organization_onboarding_inhabitant/index`
- **organization_pending**: `@oskey/organization/pending`
- **organization_prompt_templates**: `../modules/organization_prompt_templates`
- **organization_property**: `@oskey/organization/property`
- **organization_residents**: `@oskey/organization/residents`
- **organization_user**: `@oskey/organization/user`
- **organization_user_invitation**: `@oskey/organization/user/invitation`

## 7. Permissions & Security
The following permission strings are explicitly referenced and checked by this capability:
- `v1.admin.org.register` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.register|#1`): Checked during organization creation. Matches the RBAC roles document.
- `v1.admin.org.validate` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.validate|#1`): Checked during organization creation. Matches the RBAC roles document.
- `v1.admin.org.edit` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.edit|#1`): Checked during organization updates. Matches the RBAC roles document.
- `v1.org.edit` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.org.edit|#1`): Checked during organization updates. Matches the RBAC roles document.
- `v1.admin.org.view` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.view|#1`): Checked during organization retrieval. Matches the RBAC roles document.
- `v1.admin.org.delete` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.delete|#1`): Referenced as a candidate permission. Matches the RBAC roles document.
- `v1.admin.building.register` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.building.register|#1`): Referenced as a candidate permission. Matches the RBAC roles document.

### Security Mismatches
- `v1.admin.org.admin` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.admin|#1`): Checked during organization retrieval. **Mismatch**: This permission string is not present in the canonical RBAC roles document.
- `v1.admin.building.admin` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.building.admin|#1`): Referenced as a candidate permission. **Mismatch**: This permission string is not present in the canonical RBAC roles document.

## 8. External Hooks
- **Google Cloud Storage Integration**: Integrates with Cloud Storage to upload and delete organization logo assets under the `'organizationLogo'` folder prefix (`call_expression|organization|functions/src/modules/organization/controllers/organization.controller.ts|OSKOrganizationController.default._uploadImage|uploadImage|bucket,imagePath,contentType,'organizationLogo'|#1`). [Confirmed]
- **Firebase App Check**: Enforces App Check verification on all callable function triggers unless running in a local emulator environment (`call_expression|organization|functions/src/modules/organization/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`). [Confirmed]

## 9. Open Questions
- Why is `onDocumentCreated` defined in `OSKOrganizationService` (`functions/src/modules/organization/services/organization.service.ts` (line 38)) but not registered as an active Firestore trigger in the module's entry point (`functions/src/modules/organization/index.ts`)? Is this dead code or handled by another capability?
- Are `v1.admin.org.admin` and `v1.admin.building.admin` legacy permissions, or are they newly introduced roles that are missing from the canonical RBAC roles document?
- The `deleteOrganizationLogo` callable function's request schema is not resolved in the provided API schemas list. What are the exact properties of `deleteOrganizationLogoRequest`?