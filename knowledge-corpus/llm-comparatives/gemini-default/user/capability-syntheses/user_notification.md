## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.576Z
- **repoName**: firebase-oskey-dev
- **targetModule**: user
- **capability**: user_notification
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `user_notification` capability manages user-specific notification preferences, registers and deletes Firebase Cloud Messaging (FCM) device tokens, and handles the lifecycle of user notification documents. It also coordinates with the user's unread notification count and delegates actual message delivery to the platform's notification application layer. [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onInsertOrUpdateNotificationToken|#1` ``, `` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onDeleteNotificationToken|#1` ``).

## 2. Primary Responsibilities

### Notification Token Management
- **Token Registration & Updates**: Inserts or updates FCM registration tokens for users under `/users/{userId}/notificationTokens/{tokenId}` [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onInsertOrUpdateNotificationToken|#1` ``).
- **FCM Token Uniqueness**: Ensures that Android FCM tokens are unique across the user's registered tokens by querying existing tokens and deleting duplicates before saving a new one [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|notificationTokenList.map|onInsertOrUpdateNotificationToken|async (notificationToken) => { ... }|#1` ``).
- **Token Deletion**: Deletes registered notification tokens when a user logs out or prunes a device [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onDeleteNotificationToken|#1` ``).

### Notification Document Lifecycle & State
- **Notification Creation**: Saves notification documents to Firestore under `/users/{userId}/notifications/{notificationId}` [Confirmed] (`` `firestore_path_touched|user|functions/src/modules/user/modules/user_notification/index.ts|/users/{userId}/notifications/{notificationId}|#1` ``).
- **Unread Count Synchronization**: Listens to Firestore document updates and deletions on `/users/{userId}/notifications/{notificationId}` to dynamically increment or decrement the user's `unreadNotificationCount` [Confirmed] (`` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentUpdated|#1` ``, `` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentDeleted|#1` ``).

### Test Notifications
- **Triggering Test Notifications**: Provides a callable endpoint to trigger a test notification for a specific user to verify push notification delivery [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onTestNotification|#1` ``).

## 3. Public Interfaces (Controllers & Entry Points)

### Controllers
- **`OSKUserNotificationTokenController`**: Extends `OSKDocumentController` to manage CRUD operations on the `/users/{userId}/notificationTokens` collection [Confirmed] (`` `functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts` (lines 16-50) ``).
- **`OSKUserNotificationController`**: Extends `OSKDocumentController` to manage CRUD operations on the `/users/{userId}/notifications` collection [Confirmed] (`` `functions/src/modules/user/modules/user_notification/controllers/user_notification.controller.ts` (lines 13-48) ``).

### Services & Entry Points
- **`OSKUserNotificationTokenService`**: Exposes the callable Cloud Functions `onInsertOrUpdateNotificationToken` and `onDeleteNotificationToken` [Confirmed] (`` `functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts` (lines 15-187) ``).
- **`OSKUserNotificationService`**: Orchestrates notification creation, triggers the external notification dispatch service, and handles Firestore triggers [Confirmed] (`` `functions/src/modules/user/modules/user_notification/services/user_notification.service.ts` (lines 21-183) ``).
- **`OSKUserNotificationTestService`**: Exposes the callable Cloud Function `onTestNotification` [Confirmed] (`` `functions/src/modules/user/modules/user_notification/services/user_notification_test.service.ts` (lines 16-71) ``).

## 4. API Contracts & Firestore Triggers

### API Contracts (Callable Cloud Functions)

#### `onInsertOrUpdateNotificationToken`
- **Request Type**: `OSKUserNotificationToken`
  - `tokenId`: `string`
  - `userId`: `string`
- **Response Type**: `void` (Implicit)

#### `onDeleteNotificationToken`
- **Request Type**: `OSKUserNotificationTokenDeleteRequest`
  - `tokenId`: `string`
  - `userId`: `string`
- **Response Type**: `void` (Implicit)

#### `onTestNotification`
- **Request Type**: Not listed in resolved schemas (no `model_property` facts matched within this pack).
- **Response Type**: Not listed.

### Firestore Triggers

#### `onDocumentUpdated`
- **Path**: `/users/{userId}/notifications/{notificationId}`
- **Behavior**: Triggered when a notification document is updated. If the notification is marked as read, it decrements the user's `unreadNotificationCount`. If marked as unread, it increments the count [Confirmed] (`` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentUpdated|#1` ``).

#### `onDocumentDeleted`
- **Path**: `/users/{userId}/notifications/{notificationId}`
- **Behavior**: Triggered when a notification document is deleted. Decrements the user's `unreadNotificationCount` if the deleted notification was unread [Confirmed] (`` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentDeleted|#1` ``).

## 5. Data Ownership

### Firestore Paths Touched
- `/users/{userId}/notifications/{notificationId}` [Confirmed] (`` `firestore_path_touched|user|functions/src/modules/user/modules/user_notification/index.ts|/users/{userId}/notifications/{notificationId}|#1` ``)
- `/users/{userId}/notificationTokens/{tokenId}` [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts|OSKUserNotificationTokenController.default._set|save|\`/users/\${userId}/notificationTokens\`,tokenId,data|#1` ``)

## 6. Outbound Coupling

### Cross-Module Coupling
- **`apps` Module (`notification` submodule)**:
  - Imports `@oskey/apps/notification` to access `OSKNotificationService` for dispatching push notifications [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|@oskey/apps/notification|#1` ``).
- **`core` Module**:
  - Imports `@oskey/core/controllers/document` to extend `OSKDocumentController` [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts|@oskey/core/controllers/document|#1` ``).
  - Imports `@oskey/core/logger` to log errors and operational info [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|@oskey/core/logger|#1` ``).

### Intra-Module Coupling (Sibling Submodules)
- **`user` Module Root**:
  - Imports `@oskey/user` to interact with `OSKUserController` for retrieving user profiles and updating unread notification counts [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|@oskey/user|#1` ``).

## 7. Permissions & Security

### App Check Verification
- Callable functions enforce App Check verification unless running in the local Firebase Emulator environment [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_notification/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

### Caller Authorization
- The capability verifies that the caller is authenticated and that the `userId` in the request matches the authenticated user's UID (preventing users from registering or deleting tokens for other accounts) [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService.logger.logError|onDeleteNotificationToken|'Permission-denied: You are not authorized to delete user registration token!',{ request, context }|#1` ``).

### RBAC Alignment
- No specific RBAC permission strings (e.g., `v1.admin...`) are referenced in this capability's evidence pack. Security is enforced via user-to-user context matching (`context.auth.uid === request.userId`).

## 8. External Hooks
- **Environment Variables**:
  - `OSK_FIREBASE_EMULATOR`: Used to conditionally bypass App Check verification during local development [Confirmed] (`` `functions/src/modules/user/modules/user_notification/index.ts` (line 62) ``).

## 9. Open Questions
- **FCM Token Pruning**: It is unclear if there is an automated background process to prune stale or expired FCM tokens from `/users/{userId}/notificationTokens` other than manual deletion on logout. [Inferred]
- **Notification Delivery Channels**: The exact delivery channels (APNS, FCM, SMS, Email) are abstracted behind `@oskey/apps/notification`, leaving the specific transport details unknown within this capability's scope. [Confirmed]