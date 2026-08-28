## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.466Z
- **repoName**: firebase-oskey-dev
- **targetModule**: core
- **capability**: storage
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `storage` capability inside the `core` module manages delegated file uploads by generating short-lived Google Cloud Storage (GCS) signed URLs for clients, and processes finalized storage objects via Cloud Storage triggers to validate content types and execute post-upload triggers. [Confirmed]

## 2. Primary Responsibilities
- **Delegated File Upload Signed URL Generation**: Generates secure, short-lived GCS signed URLs allowing clients to upload files directly to Google Cloud Storage, offloading bandwidth from the application compute layer. [Confirmed] (citing `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|generateUploadSignedUrlCallable|#1`)
- **File Format and Content Type Validation**: Restricts uploads to allowed image formats (`image/png`, `image/jpeg`, `image/gif`) and validates file extensions. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|['image/png', 'image/jpeg', 'image/gif'].includes|generateUploadSignedUrlCallable|request.contentType|#1` and `controller_method|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController|contentType|#1`)
- **Storage Object Finalization Processing**: Listens to GCS object finalization events to update file metadata (such as content type) and execute registered post-upload triggers. [Confirmed] (citing `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|onFinalize|#1` and `controller_method|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController|processFile|#1`)
- **Trigger Execution**: Executes registered triggers matching the uploaded file name pattern once the file is finalized in GCS. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|registeredTrigger.exec|processFile|object.bucket,object.name,contentType|#1`)
- **Security and Permission Enforcement**: Enforces user authentication and checks for organization-level edit permissions (`v1.org.edit`) before generating signed upload URLs. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|generateUploadSignedUrlCallable|orgUser.roles,[                         'v1.org.edit',                     ]|#1`)

## 3. Public Interfaces (Controllers & Entry Points)
- **`OSKStorageController`**: Manages GCS object triggers, content type resolution, and post-upload trigger execution. [Confirmed] (citing `functions/src/modules/core/modules/storage/controllers/storage.controller.ts` (lines 15-57))
- **`OSKStorageService`**: Exposes the callable function for generating signed URLs and handles GCS finalization events. [Confirmed] (citing `functions/src/modules/core/modules/storage/services/storage.service.ts` (lines 22-133))
- **`getCallableFunctionTriggers`**: Entry point that exports the callable Cloud Function `generateUploadSignedUrlCallable` with App Check enforcement. [Confirmed] (citing `functions/src/modules/core/modules/storage/index.ts` (lines 13-18))

## 4. API Contracts & Firestore Triggers
### API Contracts
- **`generateUploadSignedUrlCallable`**: Callable Cloud Function. [Confirmed] (citing `api_contract|core|functions/src/modules/core/modules/storage/index.ts|generateUploadSignedUrlCallable|#1`)

#### Request Schema: `GenerateUploadUrlRequest`
- `buildingId`: `string | undefined` (optional)
- `contentType`: `string`
- `organizationId`: `string | undefined` (optional)
- `propertyId`: `string | undefined` (optional)
- `uploadType`: `UploadType` (imported from `storage_document.model`)
- `userId`: `string | undefined` (optional)

#### Response Schema: `GenerateUploadUrlResponse`
- `filePath`: `string`
- `uploadUrl`: `string`

### Cloud Storage Triggers
- **`onFinalize`**: Triggered when a file upload is completed in GCS, invoking `OSKStorageController.processFile`. [Confirmed] (citing `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|onFinalize|#1`)

## 5. Data Ownership
- **Firestore Paths**: This capability does not directly own or write to any Firestore collections based on the provided evidence. [Confirmed]
- **Firestore Reads**: It reads organization user roles from `/organizations/{id}/users/{userId}` via the organization user controller to perform permission checks. [Inferred] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKOrganizationUserController.default.get|generateUploadSignedUrlCallable|request.organizationId,adminUserId|#1`)

## 6. Outbound Coupling
### Cross-Module Coupling
- **`organization` module**: Imports `@oskey/organization/user` to retrieve organization user details and roles. [Confirmed] (citing `functions/src/modules/core/modules/storage/services/storage.service.ts` (line 6))
- **`settings` module**: Imports `@oskey/settings/role` to validate consolidated user permissions. [Confirmed] (citing `functions/src/modules/core/modules/storage/services/storage.service.ts` (line 7))

### Intra-Module Coupling (Sibling Submodules)
- **`core` logging**: Imports `@oskey/core/logger` and `../../../services/logging.service` to log errors. [Confirmed] (citing `functions/src/modules/core/modules/storage/services/storage.service.ts` (line 5) and `functions/src/modules/core/modules/storage/controllers/storage.controller.ts` (line 10))
- **`decorators/securityChecks`**: Imports `../../../../../decorators/securityChecks` to apply security decorators. [Confirmed] (citing `functions/src/modules/core/modules/storage/services/storage.service.ts` (line 15))
- **`utils`**: Imports `@oskey/utils/errors_helper` and `@oskey/utils/https-response` for standard error and response handling. [Confirmed] (citing `functions/src/modules/core/modules/storage/services/storage.service.ts` (lines 8-9))

## 7. Permissions & Security
- **Permission Strings**:
  - `v1.org.edit`: Checked during signed URL generation to ensure the user has permission to edit organization assets. [Confirmed] (citing `permission_candidate|core|functions/src/modules/core/modules/storage/services/storage.service.ts|v1.org.edit|#1`)
- **RBAC Cross-Check**: The permission `v1.org.edit` is defined in the RBAC roles document as "Allows to edit organization information", which matches its usage here for authorizing file uploads. [Confirmed]
- **Security Decorators**: `OSKUserSecurityChecks` is applied to `generateUploadSignedUrlCallable` with `{ checkUserIdMatch: false }` to enforce basic authentication checks. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKUserSecurityChecks|generateUploadSignedUrlCallable|{ checkUserIdMatch: false }|#1`)

## 8. External Hooks
- **Google Cloud Storage (GCS) Integration**: Confirmed integration. Uses `firebase-admin` storage bucket to generate signed URLs and set metadata. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|bucket.file(filePath).getSignedUrl|generateUploadSignedUrlCallable|options|#1` and `call_expression|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|storage().bucket(object.bucket).file(object.name).setMetadata|processFile|{ contentType: contentType }|#1`)
- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally bypass App Check enforcement during local emulation. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`)

## 9. Open Questions
- **Registered Triggers**: What specific post-upload triggers are registered in `OSKStorageController` and how are they populated? [Unknown]
- **Supported File Types**: Are there other upload types or file formats supported by this capability besides standard images (`image/png`, `image/jpeg`, `image/gif`)? [Unknown]