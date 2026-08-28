## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.460Z
- **repoName**: firebase-oskey-dev
- **targetModule**: core
- **capability**: auth0
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `auth0` capability provides integration with Auth0 for identity verification, token exchange, multi-factor authentication (MFA) management, and email ownership verification via OTP [Confirmed]. It acts as the bridge between Auth0's external identity provider and Firebase Authentication, enabling secure user onboarding and credential synchronization [Confirmed].

## 2. Primary Responsibilities
- **Token Exchange & Identity Linking**: Decodes and cryptographically verifies Auth0 ID tokens using JWKS, then resolves the identity against Firebase Auth [Confirmed] (lines 111-226). If a user with the matching email exists, it links the Auth0 `sub` to the Firebase UID; otherwise, it provisions a new Firebase user and returns a custom Firebase token [Confirmed] (lines 150-201).
- **MFA Management**: Allows enabling and disabling MFA factors (specifically SMS) for users in Auth0, and deleting existing SMS authenticators [Confirmed] (lines 517-606, 799-855).
- **Email Ownership Verification (OTP)**: Triggers passwordless email OTP dispatches via Auth0 and verifies the codes to confirm email ownership [Confirmed] (lines 357-462).
- **Phone Number Synchronization**: Retrieves confirmed MFA phone numbers from Auth0 and synchronizes them to the user's profile and metadata [Confirmed] (lines 608-642).
- **Auth0 User Management**: Supports deleting users from Auth0 and checking if an email already exists in Auth0 [Confirmed] (lines 463-490, 765-797).
- **Service Initialization**: Dynamically retrieves Auth0 credentials (domain, client ID, client secret, management domain) from `OSKSecretService` and initializes the `JwksClient` [Confirmed] (lines 52-86).

## 3. Public Interfaces (Controllers & Entry Points)
- **OSKAuth0Service** (Class): The primary service containing the business logic for Auth0 integration [Confirmed] `` `source_class|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service` ``.
- **getCallableFunctionTriggers** (Function): The entry point exposing the callable Cloud Functions for the capability [Confirmed] `` `function_declaration|core|functions/src/modules/core/modules/auth0/index.ts|getCallableFunctionTriggers|#1` ``.

## 4. API Contracts & Firestore Triggers

### Callable Functions
The following callable functions are exposed by this capability [Confirmed] `` `functions/src/modules/core/modules/auth0/index.ts` (lines 22-35)``:

#### `disableMfa`
- **Request Schema**: `OSKAuth0DisableMfaRequest`
  - `userId`: `string`

#### `enableMfa`
- **Request Schema**: `OSKAuth0EnableMfaRequest`
  - `userId`: `string`

#### `exchangeAuth0Token`
- **Request Schema**: `OSKAuth0TokenRequest`
  - `token`: `string`
- **Response Schema**: `OSKAuth0ExchangeTokenResponse`
  - `firebaseToken`: `string`
  - `newUser`: `boolean`
  - `userId`: `string | undefined` (optional)

#### `getMfaPhoneNumber`
- **Request Schema**: `OSKAuth0GetMFAPhoneNumberRequest`
  - `userId`: `string`
- **Response Schema**: `OSKAuth0GetMFAPhoneNumberResponse`
  - `phoneNumber`: `string`

#### `getUserPhoneNumber`
- **Request Schema**: `OSKAuth0GetUserPhoneNumberRequest`
  - `userId`: `string`
- **Response Schema**: `OSKAuth0GetUserPhoneNumberResponse`
  - `phoneNumber`: `string | null`

#### `sendOTPEmail`
- **Request Schema**: `OSKAuth0SendOTPCodeRequest`
  - `email`: `string`

#### `syncMfaPhoneNumberToProfile`
- **Request Schema**: `OSKAuth0SyncMfaPhoneNumberRequest`
  - `userId`: `string`

#### `verifyOwnershipOTP`
- **Request Schema**: `OSKAuth0VerifyOwnershipOTPRequest`
  - `code`: `string`
  - `email`: `string`
- **Response Schema**: `OSKAuth0VerifyOwnershipOTPResponse`
  - `verified`: `boolean`

### Firestore Triggers
No Firestore triggers are owned or defined by this capability [Confirmed].

## 5. Data Ownership
This capability does not directly write to or own any Firestore collections based on the provided evidence pack [Confirmed]. It interacts with user profiles via the `OSKUserController` dependency [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 154, 176)``.

## 6. Outbound Coupling

### Cross-Module Coupling
- **user** module: Imports `@oskey/user` to use `OSKUserController` for updating user fields during token exchange [Confirmed] `` `imports_dependency|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|@oskey/user|#1` ``.

### Intra-Module Coupling (Sibling Submodules)
- **core** root/logger: Imports `@oskey/core/logger` for logging [Confirmed] `` `imports_dependency|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|@oskey/core/logger|#1` ``.
- **core** root/secrets: Imports `@oskey/core` to use `OSKSecretService` and `OSKApiName` for retrieving Auth0 credentials [Confirmed] `` `imports_dependency|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|@oskey/core|#1` ``.

### External/Utility Coupling
- `../../../../../decorators/securityChecks` (for `OSKUserSecurityChecks`) [Confirmed] `` `imports_dependency|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|../../../../../decorators/securityChecks|#1` ``.
- `@oskey/utils/errors_helper` [Confirmed] `` `imports_dependency|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|@oskey/utils/errors_helper|#1` ``.
- `@oskey/utils/https-response` [Confirmed] `` `imports_dependency|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|@oskey/utils/https-response|#1` ``.
- `@oskey/utils/security_check` [Confirmed] `` `imports_dependency|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|@oskey/utils/security_check|#1` ``.

## 7. Permissions & Security
- The callable functions `enableMfa` and `disableMfa` are decorated with `OSKUserSecurityChecks` to enforce user-level security constraints [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 517, 555)``.
- Parameter validation is enforced using `OSKSecurityChecks.checkParameters` across multiple methods [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 114, 267, 403, 522, 560, 611)``.
- Email format validation is enforced using `OSKSecurityChecks.validateEmailFormat` [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 358, 402)``.
- No explicit RBAC permission strings from the `rbac-roles.json` document are referenced in this capability's evidence [Confirmed].

## 8. External Hooks

### Confirmed Integrations
- **Auth0 Management API**: Interacted with via HTTP requests using `axios` to perform administrative tasks such as deleting users, managing authenticators, updating metadata, and retrieving user details [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 239, 276, 322, 419, 473, 498, 576, 588, 647, 662, 678, 709, 748, 775, 810, 820, 839)``.
- **Auth0 Authentication API**: Interacted with for token verification and passwordless OTP dispatches [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 127, 373)``.
- **JWKS Endpoint**: Fetches cryptographic keys from `https://${OSKAuth0Service.AUTH0_DOMAIN}/.well-known/jwks.json` to verify JWT signatures [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 54, 96)``.
- **GCP Secret Manager**: Fetches secrets via `OSKSecretService` for `Auth0Domain`, `Auth0ManagementDomain`, `Auth0M2MClientId`, and `Auth0M2MClientSecret` [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 55-60)``.

## 9. Open Questions
- Are there any other MFA factors planned or supported besides SMS (e.g., TOTP, Push)? The current implementation explicitly filters for `sms` type authenticators [Inferred] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 331, 814)``.