## 0. Generation Metadata
- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-03T14:33:56.553Z
- repoName: firebase-oskey-dev
- targetModule: user
- capability: _module_root
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash

## 1. Capability Summary
The `_module_root` capability of the `user` module serves as the core orchestrator for user profile management, identity lifecycle synchronization, and contact detail verification. It manages the creation of user documents, coordinates secure email and phone number updates (integrating with Auth0 and Twilio), and executes comprehensive deletion cascades to clean up user data across the platform. [Confirmed]

## 2. Primary Responsibilities

### User Account Creation & Onboarding
- **Auth Triggered Creation**: When a user registers via Firebase Auth, the `onAccountCreated` trigger is executed, which creates the canonical user document in Firestore `/users/{userId}` `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountCreated|#1` ``.
- **Profile Parsing & Defaults**: The onboarding flow parses display names from social providers (e.g., Apple, Google, Microsoft) and initializes default user settings and notification preferences `` `functions/src/modules/user/services/user.service.ts` (lines 444-536) ``. [Confirmed]

### User Profile & Document Lifecycle
- **Firestore Triggers**: Listens to document creation and updates on `/users/{userId}` `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentCreated|#1` ``.
- **Public Profile Cascade**: When a user's public profile (first name or last name) is updated, the system cascades these changes to update Firebase Auth display names, building accesses, building users, organization users, and unit inhabitants `` `functions/src/modules/user/services/user.service.ts` (lines 538-629) ``. [Confirmed]

### Phone Number Verification & Updates
- **Twilio Verify Integration**: Initiates phone number changes by sending a verification SMS via Twilio Verify `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|initiatePhoneNumberChange|#1` ``.
- **Verification & Completion**: Verifies the OTP code and completes the change by updating the phone number in Auth0 and Firestore `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|verifyAndCompletePhoneNumberChange|#1` ``. [Confirmed]

### Email Verification & Updates
- **OTP Generation**: Initiates email changes by generating a secure 6-digit verification code, saving it to a temporary document, and sending an email to the new address `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|initiateEmailChange|#1` ``.
- **Verification & Completion**: Verifies the code, updates the email in Auth0, updates Firebase Auth, and updates the Firestore user document `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|verifyAndCompleteEmailChange|#1` ``. [Confirmed]

### Account Deletion Cascade
- **Deletion Request**: Allows users to request account deletion, which sets a future `accountDeletionDate` (typically 30 days out) on their document `` `controller_method|user|functions/src/modules/user/controllers/user.controller.ts|OSKUserController|setAccountDeletionDate|#1` ``.
- **Scheduled Cleanup**: A daily cron job triggers `onDeleteAccount` to clean up expired accounts `` `call_expression|user|functions/src/modules/user/index.ts|OSKUserService.onDeleteAccount|getScheduledFunctionTriggers||#1` ``.
- **Cascade Execution**: When a user is deleted from Firebase Auth, the `onAccountDeleted` trigger executes a comprehensive cascade: deleting Auth0 profiles, cleaning up Google Cloud Storage folders, deleting sub-collections (devices, invitations, calls, settings, activities, accesses, pincodes, intercoms), and removing the user from building/unit inhabitants `` `functions/src/modules/user/services/user.service.ts` (lines 1336-1443) ``. [Confirmed]

### Inhabitant Type Resolution
- **Type Lookup**: Resolves the specific inhabitant type of a user within a building and unit context `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|getInhabitantType|#1` ``. [Confirmed]

### User Lookup
- **Email/Phone Query**: Allows looking up user IDs by email or phone number, checking for duplicates across the platform `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|getUserIdsByEmailOrPhone|#1` ``. [Confirmed]

### Unread Notification Count
- **Transactional Updates**: Increments and decrements the unread notification count on the user document using Firestore transactions `` `controller_method|user|functions/src/modules/user/controllers/user.controller.ts|OSKUserController|incrementUnreadNotificationCount|#1` ``. [Confirmed]

## 3. Public Interfaces (Controllers & Entry Points)
The capability exposes the following controllers and services:

- **`OSKUserController`** (`functions/src/modules/user/controllers/user.controller.ts`): Extends `OSKDocumentController` to manage core CRUD operations, unread notification counts, and profile image uploads for the `/users` collection `` `source_class|user|functions/src/modules/user/controllers/user.controller.ts|OSKUserController` ``.
- **`OSKEmailChangeController`** (`functions/src/modules/user/controllers/chnageEmail.controller.ts`): Extends `OSKDocumentController` to manage temporary email change verification documents `` `source_class|user|functions/src/modules/user/controllers/chnageEmail.controller.ts|OSKEmailChangeController` ``.
- **`OSKUserService`** (`functions/src/modules/user/services/user.service.ts`): The primary service orchestrating business logic for user profiles, contact changes, and deletion cascades `` `source_class|user|functions/src/modules/user/services/user.service.ts|OSKUserService` ``.

## 4. API Contracts & Firestore Triggers

### Callable Functions
The following callable functions are registered by this capability:

- **`deleteUserProfileImage`**
  - Request: `deleteUserProfileImageRequest`
    - `filename`: `string`
    - `userId`: `string`
  - Response: `void`
- **`getCurrentUserUnits`**
  - Request: `void`
  - Response: `OSKGetUserUnitsResponseData`
    - `buildingId`: `string`
    - `buildingName`: `string`
    - `units`: `OSKUserBuildingWithUnitsUnit[]`
- **`getInhabitantType`**
  - Request: `OSKGetInhabitantTypeRequest`
    - `buildingId`: `string`
    - `unitId`: `string`
    - `userId`: `string`
  - Response: `OSKGetInhabitantTypeResponse`
    - `inhabitantType`: `OSKBuildingUnitInhabitantType`
- **`getUserIdsByEmailOrPhone`**
  - Request: `OSKGetUsersByEmailOrPhoneNumberRequestData`
    - `email`: `string` (optional)
    - `phoneNumber`: `OSKPhoneNumber` (optional)
    - `userId`: `string`
  - Response: `OSKGetUsersByEmailOrPhoneNumberResponseData`
    - `duplicateFinds`: `object[]` (optional)
    - `email`: `string`
    - `phoneNumber`: `OSKPhoneNumber` (optional)
    - `userIdFound`: `string`
- **`initiateEmailChange`**
  - Request: `OSKUserInitiateEmailChangeRequest`
    - `newEmail`: `string`
  - Response: `void`
- **`initiatePhoneNumberChange`**
  - Request: `OSKUserInitiatePhoneChangeRequest`
    - `newPhoneNumber`: `string`
  - Response: `void`
- **`onUpdatePhoneNumberCalled`**
  - Request: `OSKPhoneNumber`
  - Response: `void`
- **`onUpdatePublicProfileCalled`**
  - Request: `OSKUserUpdatesPublicProfileRequest`
    - `firstName`: `string`
    - `lastName`: `string`
    - `userId`: `string`
  - Response: `void`
- **`onUpdateUserOnboardingStatusCalled`**
  - Request: `OSKUserUpdatesOnboardingStatusRequest`
    - `apiVersion`: `string`
    - `newUserOnboarding`: `object`
    - `userId`: `string`
  - Response: `void`
- **`onUpdateUserProfileAndPhoneNumberCalled`**
  - Request: `OSKUpdateUserProfileAndPhoneNumberRequestData`
    - `phoneNumber`: `OSKPhoneNumber` (optional)
    - `publicProfile`: `OSKUserUpdatesPublicProfileRequest`
  - Response: `void`
- **`onUpdateUserSettingsLanguageCalled`**
  - Request: `OSKUserUpdatesLanguageRequest`
    - `language`: `string`
    - `userId`: `string`
  - Response: `void`
- **`requestMyAccountDeletion`**
  - Request: `void`
  - Response: `void`
- **`verifyAndCompleteEmailChange`**
  - Request: `OSKUserVerifyAndCompleteEmailChangeRequest`
    - `code`: `string`
  - Response: `void`
- **`verifyAndCompletePhoneNumberChange`**
  - Request: `OSKUserVerifyAndCompletePhoneNumberChangeRequest`
    - `code`: `string`
    - `phoneNumber`: `OSKPhoneNumber`
  - Response: `void`

### Firestore Triggers
- **`onDocumentCreated`**: Listens to `/users/{userId}` document creation `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentCreated|#1` ``.
- **`onDocumentUpdated`**: Listens to `/users/{userId}` document updates `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentUpdated|#1` ``.

### Auth Triggers
- **`onAccountCreated`**: Triggered when a Firebase Auth user is created `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountCreated|#1` ``.
- **`onAccountDeleted`**: Triggered when a Firebase Auth user is deleted `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountDeleted|#1` ``.

### Scheduled Triggers
- **`onDeleteAccount`**: Runs daily at midnight (`'00 00 * * *'`) to delete accounts marked for deletion `` `call_expression|user|functions/src/modules/user/index.ts|OSKUserService.onDeleteAccount|getScheduledFunctionTriggers||#1` ``.

## 5. Data Ownership
This capability owns and modifies the following Firestore paths:

- **`/users/{userId}`** (Touch Type: Write/Update) `` `firestore_path_touched|user|functions/src/modules/user/index.ts|/users/{userId}|#1` ``.
- **`users`** (Collection Group, Touch Type: Get/Delete) `` `firestore_path_touched|user|functions/src/modules/user/services/user.service.ts|users|#1` ``.
- **`changeEmail`** (Inferred collection path managed by `OSKEmailChangeController` for temporary email change verification documents).

## 6. Outbound Coupling

### Cross-Module Coupling
The `_module_root` capability depends on the following external modules:

- **`core`**:
  - Imports `@oskey/core`, `@oskey/core/controllers/document`, `@oskey/core/access`, and `@oskey/core/logger` `` `imports_dependency|user|functions/src/modules/user/controllers/chnageEmail.controller.ts|@oskey/core|#1` ``.
- **`building`**:
  - Imports `@oskey/building`, `@oskey/building/accesses`, `@oskey/building/unit`, and `@oskey/building/user` `` `imports_dependency|user|functions/src/modules/user/services/user.service.ts|@oskey/building|#1` ``.
- **`organization`**:
  - Imports `@oskey/organization/residents` and `@oskey/organization/user` `` `imports_dependency|user|functions/src/modules/user/services/user.service.ts|@oskey/organization/residents|#1` ``.
- **`apps`**:
  - Imports `@oskey/apps/mail` and `@oskey/apps/notification` `` `imports_dependency|user|functions/src/modules/user/services/user.service.ts|@oskey/apps/mail|#1` ``.

### Intra-Module Coupling (Submodules)
The capability depends on the following sibling submodules within the `user` module:

- **`user_device`**: Imports `@oskey/user/device` `` `imports_dependency|user|functions/src/modules/user/index.ts|@oskey/user/device|#1` ``.
- **`user_notification`**: Imports `@oskey/user/notification` `` `imports_dependency|user|functions/src/modules/user/index.ts|@oskey/user/notification|#1` ``.
- **`user_organization`**: Imports `@oskey/user/organization` `` `imports_dependency|user|functions/src/modules/user/index.ts|@oskey/user/organization|#1` ``.
- **`user_pincode`**: Imports `@oskey/user/pincode` `` `imports_dependency|user|functions/src/modules/user/index.ts|@oskey/user/pincode|#1` ``.
- **`user_invitation`**: Imports `@oskey/user/invitation` and `../user/modules/user_invitation` `` `imports_dependency|user|functions/src/modules/user/index.ts|../user/modules/user_invitation|#1` ``.
- **`user_call`**: Imports `@oskey/user/call` `` `imports_dependency|user|functions/src/modules/user/services/user.service.ts|@oskey/user/call|#1` ``.
- **`user_access`**: Imports `@oskey/user/access` `` `imports_dependency|user|functions/src/modules/user/services/user.service.ts|@oskey/user/access|#1` ``.
- **`user_activity`**: Imports `../modules/user_activity` `` `imports_dependency|user|functions/src/modules/user/services/user.service.ts|../modules/user_activity|#1` ``.
- **`user_settings`**: Imports `./modules/user_settings` `` `imports_dependency|user|functions/src/modules/user/index.ts|./modules/user_settings|#1` ``.

## 7. Permissions & Security
- **`OSKUserSecurityChecks` Decorator**: Applied to callable endpoints to enforce that the calling user matches the target user ID or possesses administrative permissions `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKUserSecurityChecks|onUpdatePublicProfileCalled||#1` ``.
- **`OSKSecurityChecks.checkParameters`**: Validates input parameters for type safety and presence `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKSecurityChecks.checkParameters|onUpdatePublicProfileCalled|[             { name: 'context', value: context, type: 'object' },             { name: 'userId', value: request.userId, type: 'string' },             { name: 'firstName', value: request.firstName, type: 'string' },             { name: 'lastName', value: request.lastName, type: 'string' },         ]|#1` ``.
- **Permission Errors**: Throws `permission-denied` errors if security checks fail (e.g., if a user attempts to query units or look up users other than themselves) `` `permission_error|user|functions/src/modules/user/services/user.service.ts|permission-denied|#1` ``.

## 8. External Hooks

### Confirmed Integrations
- **Twilio Verify API**: Used via HTTP POST requests to send and verify SMS verification codes for phone number changes `` `call_expression|user|functions/src/modules/user/services/user.service.ts|axios.post|_sendVerificationSms|url,params.toString(),{ headers }|#1` ``.
- **Auth0 API**: Integrated via `OSKAuth0Service` to delete users, update emails, update phone numbers, and fetch users by email or phone number `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKAuth0Service.deleteAuth0User|onAccountDeleted|email|#1` ``.
- **Google Cloud Storage**: Deletes user-specific files under `users/${userId}/` during account deletion cascades `` `call_expression|user|functions/src/modules/user/controllers/user.controller.ts|storage()                 .bucket()                 .deleteFiles|delete|{ prefix: `users/${userId}/` }|#1` ``.

## 9. Open Questions
- **Email Change Collection Path**: The exact collection path for `OSKEmailChangeController` is not explicitly listed in the `firestore_path_touched` facts, though it is inferred to be `changeEmail` or similar based on the model name `changeEmail.model.ts`. [Inferred]
- **Twilio API Endpoints**: The exact structure of the Twilio API endpoints is encapsulated in `_sendVerificationSms` and `_verifySmsCode` but is not fully detailed in the facts. [Inferred]