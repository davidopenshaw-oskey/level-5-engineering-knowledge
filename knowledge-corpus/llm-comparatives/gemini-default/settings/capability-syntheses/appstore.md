## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.519Z
- **repoName**: firebase-oskey-dev
- **targetModule**: settings
- **capability**: appstore
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `appstore` capability manages configuration settings related to mobile application stores (Apple App Store and Google Play Store) within the `settings` module. It is responsible for retrieving store URLs and names, and validating client-provided app store activation codes to ensure requests originate from verified application instances. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 26-43, 76-99) ``).

---

## 2. Primary Responsibilities
- **App Store Activation Code Validation**: Validates client-provided activation codes against stored app store settings. It enforces that the request is initiated from an App Check verified application, validates parameters, and searches the stored settings document for a matching activation code. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 26-43, 45-74) ``).
- **App Store Information Retrieval**: Fetches the app store settings document (specifically the document with ID `'appstore'` under the `/settings` collection) and parses the store details to extract Apple and Google store names and URLs. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 76-99) ``).
- **App Store Settings Document Management**: Exposes standard document controller operations to get, save, and delete app store settings documents. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts` (lines 9-27) ``).

---

## 3. Public Interfaces (Controllers & Entry Points)
### Controllers
- **`OSKAppStoreSettingsController`**: Extends `OSKDocumentController` to expose CRUD-like endpoints for managing app store settings documents under the `/settings` collection. [Confirmed] (`` `source_class|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController` ``).
  - `get(documentId)`: Retrieves a settings document. [Confirmed] (`` `controller_method|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController|get|#1` ``).
  - `save(documentId, data)`: Saves or updates a settings document. [Confirmed] (`` `controller_method|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController|save|#1` ``).
  - `delete(documentId)`: Deletes a settings document. [Confirmed] (`` `controller_method|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|OSKAppStoreSettingsController|delete|#1` ``).

### Services
- **`OSKAppStoreSettingsService`**: Provides the core business logic for validating activation codes and formatting store information. [Confirmed] (`` `source_class|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService` ``).
  - `validateAppStoreActivationCode(request)`: Validates the activation code after performing App Check and parameter checks. [Confirmed] (`` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|validateAppStoreActivationCode|#1` ``).
  - `validateInternally(activationCode)`: Internal helper that queries the `'appstore'` settings document to find a matching activation code. [Confirmed] (`` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|validateInternally|#1` ``).
  - `getAppstoreInformation()`: Retrieves and parses the Apple and Google store details. [Confirmed] (`` `service_method|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService|getAppstoreInformation|#1` ``).

---

## 4. API Contracts & Firestore Triggers
*No direct `api_contract` facts or Firestore triggers are defined in this capability's evidence pack.*

### Data Models & Schemas
The following internal data models are defined for requests, responses, and documents:
- **`OSKAppStoreActivationRequest`**: `{ activationCode: string }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/functions/app_store_settings_request.model.ts|OSKAppStoreActivationRequest|#1` ``).
- **`OSKAppStoreActivationResponse`**: `{ isRecordFound: boolean, activationCode: string, appStoreDocument: OSKAppStoreSettings }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/functions/app_store_settings_request.model.ts|OSKAppStoreActivationResponse|#1` ``).
- **`OSKAppStoreSettings`**: `{ stores: OSKAppStoreInfo[], activationCodes: string[], creationDate: Timestamp }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreSettings|#1` ``).
- **`OSKAppStoreInfo`**: `{ appleStoreName: string, appleStoreUrl: string, googleStoreName: string, googleStoreUrl: string }` [Confirmed] (`` `type_alias|settings|functions/src/modules/settings/modules/appstore/models/documents/app_store_settings_document.model.ts|OSKAppStoreInfo|#1` ``).

---

## 5. Data Ownership
### Firestore Paths
- **`/settings/{documentId}`**: Read, written, and deleted via the document controller. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts` (lines 18, 22, 26) ``).
- **`/settings/appstore`**: Specifically read by the service to validate activation codes and retrieve store information. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 57, 77) ``).

---

## 6. Outbound Coupling
### Intra-Module Coupling (within `settings` module)
- **Models**: Imports document and request models from sibling directories. [Confirmed] (`` `imports_dependency|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|../models/documents/app_store_settings_document.model|#1` ``, `` `imports_dependency|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|../models/functions/app_store_settings_request.model|#1` ``).
- **Controllers**: The service references the controller to invoke its `get` method. [Confirmed] (`` `imports_dependency|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|../controllers/app_store_settings.controller|#1` ``).

### Cross-Module Coupling (to other modules)
- **`core` module**:
  - Imports `OSKDocumentController` from `@oskey/core/controllers/document`. [Confirmed] (`` `imports_dependency|settings|functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts|@oskey/core/controllers/document|#1` ``).
  - Imports `OSKLoggingService` from `@oskey/core/logger`. [Confirmed] (`` `imports_dependency|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|@oskey/core/logger|#1` ``).

### External & Utility Coupling
- **`@oskey/utils/https-response`**: Used for formatting HTTPS responses. [Confirmed] (`` `imports_dependency|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|@oskey/utils/https-response|#1` ``).
- **`@oskey/utils/security_check`**: Used for parameter validation via `OSKSecurityChecks`. [Confirmed] (`` `imports_dependency|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|@oskey/utils/security_check|#1` ``).

---

## 7. Permissions & Security
- **App Check Verification**: The `validateAppStoreActivationCode` method enforces that the caller is verified by Firebase App Check. If verification fails, it logs a `'failed-precondition: The function must be called from an App Check verified app.'` error. [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKAppStoreSettingsService.logger.logError|validateAppStoreActivationCode|'failed-precondition: The function must be called from an App Check verified app.'|#1` ``).
- **Parameter Validation**: Validates that the `activationCode` parameter is a string. [Confirmed] (`` `call_expression|settings|functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts|OSKSecurityChecks.checkParameters|validateAppStoreActivationCode|[{ name: 'activationCode', value: request.activationCode, type: 'string' }]|#1` ``).
- **Firestore Security Rules**: Access to `/settings/{docId}` is governed by the `isValidUser()` rule, which requires the user to be signed in and have a verified email. [Confirmed] (`firestore.rules.txt` (lines 405-408)).

---

## 8. External Hooks
- **Firebase App Check**: Integrates with Firebase App Check to verify client app integrity. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (line 31) ``).
- **Apple App Store & Google Play Store**: Serves as the configuration source for external store URLs and names. [Confirmed] (`` `functions/src/modules/settings/modules/appstore/services/app_store_settings.service.ts` (lines 88-95) ``).

---

## 9. Open Questions
- **RBAC Roles**: It is unclear if specific administrative RBAC roles (e.g., `v1.admin.settings.role.edit`) are required to write to `/settings/appstore` via the `OSKAppStoreSettingsController`, or if it relies solely on the default Firestore rules for the `/settings` collection.
- **Activation Code Generation**: The evidence pack covers validation and retrieval of activation codes, but the mechanism for generating and registering new activation codes is not documented in this capability's scope.