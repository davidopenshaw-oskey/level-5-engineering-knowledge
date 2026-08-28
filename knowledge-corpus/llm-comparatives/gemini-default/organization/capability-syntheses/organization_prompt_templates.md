## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.502Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_prompt_templates
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `organization_prompt_templates` capability provides administrative management (CRUD operations) of AI or system prompt templates scoped to specific organizations within the Oskey platform [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (lines 35-44)]. These templates are stored and managed in Firestore under organization-specific subcollections [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts` (lines 15-17)].

---

## 2. Primary Responsibilities
This capability is responsible for the following distinct features:
- **Prompt Template Creation**: Allows authorized users to create new prompt templates for an organization, recording creation and modification timestamps [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|create|#1`].
- **Prompt Template Retrieval**: Supports fetching a single prompt template by name or listing all prompt templates registered under a specific organization [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|get|#1`, `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|getAll|#1`].
- **Prompt Template Updates**: Allows updating the template text of an existing prompt, updating the modification timestamp [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|update|#1`].
- **Prompt Template Deletion**: Supports deleting a prompt template from an organization's collection [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|delete|#1`].
- **Input Parameter Validation**: Enforces strict parameter validation on all incoming requests (e.g., verifying that `organizationId`, `promptName`, and `promptTemplate` are provided with correct types) [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 66-74, 90-95, 115-119)].

---

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes its functionality through the following public entry points:
- **`OSKOrganizationPromptTemplateController`**: A document controller class extending `OSKDocumentController` that abstracts direct Firestore operations for the prompt templates collection [Confirmed: `source_class|organization|functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts|OSKOrganizationPromptTemplateController`].
- **`OSKOrganizationPromptTemplateService`**: The core service class containing the business logic and security decorators for managing prompt templates [Confirmed: `source_class|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService`].
- **`getCallableFunctionTriggers`**: The entry point function that registers the HTTPS callable Cloud Functions for external client consumption [Confirmed: `function_declaration|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|getCallableFunctionTriggers|#1`].

---

## 4. API Contracts & Firestore Triggers

### Callable Cloud Functions
The capability exposes five HTTPS callable functions [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (lines 38-42)]:
- `create`
- `delete`
- `get`
- `getAll`
- `update`

### Resolved API Request/Response Schemas

#### `create`
- **Request Type**: `OSKCreateOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns a success status or the created template document].

#### `delete`
- **Request Type**: `OSKDeleteOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns a success confirmation].

#### `get`
- **Request Type**: `OSKGetOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns `OSKOrganizationPromptTemplate` or null].

#### `getAll`
- **Request Type**: `OSKGetAllOrganizationPromptTemplatesRequest`
  - `organizationId`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns an array of `OSKOrganizationPromptTemplate` documents].

#### `update`
- **Request Type**: `OSKUpdateOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns a success status or the updated template document].

---

## 5. Data Ownership

### Firestore Paths
This capability owns and manages documents within the following Firestore path:
- `/organizations/{organizationId}/promptTemplates/{promptName}` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts` (lines 15-17)]

### Schema Fields
Based on the Firestore schema documentation and model definitions, the documents in this collection contain:
- `organizationId`: `string` [Confirmed: `model_property|organization|functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts|OSKOrganizationPromptTemplate|organizationId|#1`]
- `promptName`: `string` [Confirmed: `model_property|organization|functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts|OSKOrganizationPromptTemplate|promptName|#1`]
- `promptTemplate`: `string` [Confirmed: `model_property|organization|functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts|OSKOrganizationPromptTemplate|promptTemplate|#1`]
- `creationDate`: `timestamp` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 77-78)]
- `modificationDate`: `timestamp` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (line 99)]

---

## 6. Outbound Coupling

### Cross-Module Coupling
This capability depends on the following external modules:
- **`core`**:
  - Imports `OSKDocumentController` to handle base Firestore document operations [Confirmed: `imports_dependency|organization|functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts|@oskey/core/controllers/document|#1`].
  - Imports general core utilities [Confirmed: `imports_dependency|organization|functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts|@oskey/core|#1`].
- **`decorators`**:
  - Imports `securityChecks` (specifically `@OSKUserSecurityChecks`) to enforce user authentication on service methods [Confirmed: `imports_dependency|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|../../../../../decorators/securityChecks|#1`].
- **`utils`**:
  - Imports `@oskey/utils/errors_helper` for error handling [Confirmed: `imports_dependency|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|@oskey/utils/errors_helper|#1`].
  - Imports `@oskey/utils/https-response` for standardizing API responses [Confirmed: `imports_dependency|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|@oskey/utils/https-response|#1`].
  - Imports `@oskey/utils/security_check` (specifically `OSKSecurityChecks`) to validate request parameters [Confirmed: `imports_dependency|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|@oskey/utils/security_check|#1`].

### Intra-Module Coupling
- This capability does not exhibit outbound coupling to other submodules of the `organization` module based on the provided evidence pack.

---

## 7. Permissions & Security

### Security Decorators & Parameter Checks
- All service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 26, 40, 61, 85, 110)]. This ensures that the caller is a valid, signed-in user, but does not require their user ID to match a specific resource ID.
- Parameter validation is performed via `OSKSecurityChecks.checkParameters` to ensure that required fields (such as `context`, `organizationId`, and `promptName`) are present and of the correct type before executing business logic [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 31-34, 45-49, 66-72, 90-95, 115-119)].

### Firestore Rules Interaction
- In `firestore.rules.txt`, there is no explicit rule matching `/organizations/{organizationId}/promptTemplates/{document=**}`.
- Because these operations are executed via backend Cloud Functions (which run with administrative privileges), they bypass Firestore security rules [Inferred]. Security is instead enforced at the application layer via the `@OSKUserSecurityChecks` decorator and parameter validation.

---

## 8. External Hooks
- **HTTPS Callable Functions**: The capability registers five callable Cloud Functions (`create`, `delete`, `get`, `getAll`, `update`) using `firebase-functions/v1` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (lines 35-44)]. These serve as the external API boundary for client applications (such as the Property Manager Portal).
- No Pub/Sub topics, external HTTP integrations, environment variables, or storage paths are evidenced within this capability's pack.

---

## 9. Open Questions
- **RBAC Role Enforcement**: The service methods use `@OSKUserSecurityChecks({ checkUserIdMatch: false })` to verify that a user is logged in, but the evidence does not show any explicit checks against specific RBAC roles (e.g., `v1.org.settings.edit` or `v1.admin.org.edit`). It is unknown whether any authenticated user can modify an organization's prompt templates, or if there is an implicit organization membership check performed within the core security decorators that is not visible in this pack.
- **Prompt Template Usage**: The business purpose of these prompt templates (e.g., whether they are used for AI-generated communications, automated notifications, or another feature) is not documented in the evidence pack.
- **Response Schemas**: The exact TypeScript types returned by the callable functions are not explicitly defined in the model file or the resolved API schemas.