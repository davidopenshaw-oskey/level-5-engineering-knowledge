### 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.464Z
- **repoName**: firebase-oskey-dev
- **targetModule**: core
- **capability**: country
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

### 1. Capability Summary
The `country` capability within the `core` module provides public and authenticated entry points to retrieve country-related data. [Confirmed] It exposes Firebase Callable HTTPS functions that allow client applications to query supported country configurations, enforcing App Check security across both authenticated and unauthenticated contexts. [Confirmed]

---

### 2. Primary Responsibilities
- **Authenticated Country Retrieval**: Exposes an authenticated endpoint `onGetCountries` to retrieve country configurations. [Confirmed] The service validates that the calling user is authenticated, verifies their identity against Firebase Auth, and checks their existence in the database before returning the data. [Confirmed] (`` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountries|#1` ``, `` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|auth().getUser|onGetCountries|userId|#1` ``)
- **Unauthenticated Country Retrieval**: Exposes an unauthenticated endpoint `onGetCountriesNoAuth` to allow client applications to fetch country configurations prior to user login (e.g., during onboarding or registration). [Confirmed] (`` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountriesNoAuth|#1` ``)
- **App Check Enforcement**: Enforces Firebase App Check on both callable endpoints to prevent unauthorized API abuse, bypassing it only when running in a local emulator environment. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``)
- **Error Logging**: Logs structured error messages for unauthenticated access attempts, missing database user profiles, and App Check validation failures. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService.logger.logError|onGetCountries|'Unauthenticated: You must be authenticated to use onGetCountries()'|#1` ``, `` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService.logger.logError|onGetCountries|'Internal: No user in database for onGetCountries()'|#1` ``)

---

### 3. Public Interfaces (Controllers & Entry Points)
The capability exposes the following entry points and service classes:
- **`getCallableFunctionTriggers`**: The main entry point in `functions/src/modules/core/modules/country/index.ts` (lines 9-15) which exports the callable HTTPS triggers. [Confirmed] (`` `function_declaration|core|functions/src/modules/core/modules/country/index.ts|getCallableFunctionTriggers|#1` ``)
- **`OSKCountryService`**: The core service class handling the business logic for country retrieval, located in `functions/src/modules/core/modules/country/services/country.service.ts` (lines 14-57). [Confirmed] (`` `source_class|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService` ``)

---

### 4. API Contracts & Firestore Triggers
This capability exposes two Firebase Callable HTTPS functions:

#### Callable APIs
- **`onGetCountries`**
  - **Handler Location**: `functions/src/modules/core/modules/country/index.ts` (lines 17-43) `` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountries|#1` ``
  - **Service Method**: `OSKCountryService.onGetCountries` `` `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountries|#1` ``
  - **Request/Response Schemas**: No `model_property` facts matched within this pack.
- **`onGetCountriesNoAuth`**
  - **Handler Location**: `functions/src/modules/core/modules/country/index.ts` (lines 45-56) `` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountriesNoAuth|#1` ``
  - **Service Method**: `OSKCountryService.onGetCountriesNoAuth` `` `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountriesNoAuth|#1` ``
  - **Request/Response Schemas**: No `model_property` facts matched within this pack.

---

### 5. Data Ownership
This capability does not directly own or write to any Firestore collections based on the provided evidence. [Confirmed] It queries user data from the `user` module to validate active sessions but does not perform any database mutations. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKUserController.default.get|onGetCountries|userId|#1` ``)

---

### 6. Outbound Coupling
The `country` capability exhibits the following outbound dependencies:

#### Intra-Module Coupling (Sibling Submodules)
- **`core` (Logger / Core Utilities)**: Imports logging and core utilities to handle error reporting and service orchestration. [Confirmed]
  - **File**: `functions/src/modules/core/modules/country/services/country.service.ts` (lines 6-7)
  - **Imports**: `@oskey/core`, `@oskey/core/logger` (`` `imports_dependency|core|functions/src/modules/core/modules/country/services/country.service.ts|@oskey/core|#1` ``, `` `imports_dependency|core|functions/src/modules/core/modules/country/services/country.service.ts|@oskey/core/logger|#1` ``)

#### Cross-Module Coupling
- **`user` Module**: Couples with the `user` module to retrieve user profiles and validate active sessions. [Confirmed]
  - **File**: `functions/src/modules/core/modules/country/services/country.service.ts` (line 8)
  - **Imports**: `@oskey/user` (specifically calling `OSKUserController.default.get`) (`` `imports_dependency|core|functions/src/modules/core/modules/country/services/country.service.ts|@oskey/user|#1` ``, `` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKUserController.default.get|onGetCountries|userId|#1` ``)

#### External & Utility Coupling
- **`@oskey/utils/https-response`**: Used to format standard HTTPS responses. [Confirmed]
  - **File**: `functions/src/modules/core/modules/country/services/country.service.ts` (line 9) (`` `imports_dependency|core|functions/src/modules/core/modules/country/services/country.service.ts|@oskey/utils/https-response|#1` ``)

---

### 7. Permissions & Security
- **App Check Enforcement**: Both callable functions enforce App Check validation via `functionBuilder.runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`. [Confirmed] (`` `functions/src/modules/core/modules/country/index.ts` (lines 9-15) ``)
- **User Authentication**: The `onGetCountries` endpoint requires a valid Firebase Auth context. [Confirmed] If `context.auth` is missing, it throws an unauthenticated error. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService.logger.logError|onGetCountries|'Unauthenticated: You must be authenticated to use onGetCountries()'|#1` ``)
- **User Existence Check**: The `onGetCountries` endpoint verifies that the authenticated user exists in the database using `OSKUserController.default.get(userId)`. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKUserController.default.get|onGetCountries|userId|#1` ``)
- **RBAC Mismatches**: No specific RBAC permission strings (e.g., `v1.org.*` or `v1.admin.*`) are referenced or checked within this capability's evidence. [Confirmed]

---

### 8. External Hooks
- **Environment Variables**:
  - **`OSK_FIREBASE_EMULATOR`**: Checked to conditionally bypass App Check enforcement during local development. [Confirmed] (`` `functions/src/modules/core/modules/country/index.ts` (line 10) ``)

---

### 9. Open Questions
- **Data Source**: Where is the country data actually stored or sourced from? [Inferred] The evidence pack does not show any Firestore reads, local JSON imports, or external HTTP requests containing country lists.
- **Data Schema**: What is the exact structure of the country objects returned by `onGetCountries` and `onGetCountriesNoAuth`? [Inferred] No model properties or TypeScript interfaces defining the country payload are present in the evidence.