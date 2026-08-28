### 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.392Z
- **repoName**: firebase-oskey-dev
- **targetModule**: apps
- **capability**: notification
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

### 1. Capability Summary
The `notification` capability provides a unified, multi-channel notification orchestration engine that dispatches push notifications (APNS, FCM), emails, and SMS messages to users based on localized templates, while automatically managing device token lifecycles and self-healing stale registrations upon delivery failures. [Confirmed] `` `source_class|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKNotificationService` ``

---

### 2. Primary Responsibilities
- **Multi-Channel Notification Dispatching**: Orchestrates the routing of standard and special (VoIP/call-related) notifications across APNS, FCM, Email, and SMS channels based on user preferences, language, and device token availability. [Confirmed] `` `service_method|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKNotificationService|send|#1` `` and `` `service_method|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKNotificationService|sendSpecial|#1` ``.
- **Apple Push Notification service (APNS) Integration**: Configures and transmits alert and VoIP push notifications to iOS and watchOS devices using the `@parse/node-apn` library, utilizing environment-specific API keys retrieved from secret storage. [Confirmed] `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (lines 36-118) ``.
- **Firebase Cloud Messaging (FCM) Integration**: Transmits push notifications to Android devices using the `firebase-admin/messaging` SDK. [Confirmed] `` `functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts` (lines 20-35) ``.
- **Email Notification Delegation**: Hands off email dispatching to the sibling `mail` submodule when email notification channels are triggered. [Confirmed] `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKEmailService.default.send|_handleEmailNotifications|emailOptions|#1` ``.
- **SMS Notification Delegation**: Hands off SMS dispatching to the sibling `sms` submodule when SMS notification channels are triggered. [Confirmed] `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKSmsService.default.sendSms|_handleSmsNotifications|{                     language: options.language,                     template: {                         id: 'externalSMSUserInvitationReceived',                         params: { ...commonParams, ...options.data },                     },                 }|#1` ``.
- **Self-Healing Token Management**: Automatically prunes and deletes invalid or expired APNS and FCM device tokens from the user's profile database when the respective gateway returns a delivery failure. [Confirmed] `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKUserNotificationTokenController.default.delete|_send|userId,token.tokenId|#1` `` and `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|OSKUserNotificationTokenController.default.delete|_send|_userId,_tokenId|#1` ``.
- **Template Interpolation**: Dynamically replaces placeholder variables (e.g., `${variable}`) within localized notification titles and bodies with runtime context parameters. [Confirmed] `` `service_method|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKNotificationService|_interpolate|#1` ``.

---

### 3. Public Interfaces (Controllers & Entry Points)
The capability exposes the following service entry points:
- **`OSKNotificationService`** (`functions/src/modules/apps/modules/notification/services/notification.service.ts`): The primary orchestrator service exposing `send` and `sendSpecial` methods to dispatch notifications across all channels.
- **`OSKAPNSService`** (`functions/src/modules/apps/modules/notification/services/apns.service.ts`): Exposes the `send` method to transmit push payloads specifically to Apple devices.
- **`OSKFirebaseCloudMessagingService`** (`functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts`): Exposes the `send` method to transmit push payloads specifically to Android devices.

---

### 4. API Contracts & Firestore Triggers
No API contracts or Firestore triggers are directly defined in this capability's evidence pack.

---

### 5. Data Ownership
While this capability does not directly own or write to primary Firestore collections, it performs targeted deletions on the following subcollection path to clean up stale device tokens:
- **`/users/{userId}/notificationTokens/{tokenId}`** (Operation: Delete)
  - Triggered upon APNS delivery failure: `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKUserNotificationTokenController.default.delete|_send|userId,token.tokenId|#1` ``
  - Triggered upon FCM delivery failure: `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|OSKUserNotificationTokenController.default.delete|_send|_userId,_tokenId|#1` ``

---

### 6. Outbound Coupling
The `notification` capability exhibits the following outbound dependencies:

#### Cross-Module Coupling
- **`core` module**:
  - Imports `@oskey/core` to access secret management services: `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKSecretService.getSecret|_send|OSKApiName.APNSProductionAPIKey|#1` ``.
  - Imports `@oskey/core/logger` to log debug, info, warning, and error diagnostics: `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|@oskey/core/logger|#1` ``.
- **`user` module** (specifically the `user_notification` submodule):
  - Imports `@oskey/user/notification` to query and delete user notification tokens: `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|@oskey/user/notification|#1` ``.
- **`call` module**:
  - Imports `src/modules/call/models/shared/ice_servers.model` to type-check call-related notification options: `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/models/notification_options.model.ts|src/modules/call/models/shared/ice_servers.model|#1` ``.

#### Intra-Module Coupling (Sibling Submodules)
- **`mail` submodule**:
  - Imports `@oskey/apps/mail` to delegate email notifications: `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|@oskey/apps/mail|#1` ``.
- **`sms` submodule**:
  - Imports `@oskey/apps/sms` to delegate SMS notifications: `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|@oskey/apps/sms|#1` ``.

---

### 7. Permissions & Security
No explicit RBAC permission strings are referenced or checked within this capability's evidence pack. Security is implicitly maintained by delegating token deletions to the `OSKUserNotificationTokenController` under the user's authenticated context.

---

### 8. External Hooks
The capability integrates with the following external systems and boundaries:
- **Apple Push Notification service (APNS) Gateway**: Integrates with Apple's push servers via `@parse/node-apn` to deliver alert and VoIP notifications. `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|@parse/node-apn|#1` ``.
- **Firebase Cloud Messaging (FCM) Gateway**: Integrates with Google's FCM servers via `firebase-admin/messaging` to deliver push notifications to Android devices. `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|firebase-admin/messaging|#1` ``.
- **GCP Secret Manager**: Retrieves APNS production and development API keys dynamically via `OSKSecretService`. `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKSecretService.getSecret|_send|OSKApiName.APNSProductionAPIKey|#1` ``.

---

### 9. Open Questions
- **APNS Key Format**: How are the APNS credentials structured and stored in GCP Secret Manager (e.g., are they `.p8` private key files encoded in base64)?
- **Retry Policies**: Is there an offline queueing or retry mechanism for notifications when external gateways (APNS/FCM) are temporarily unreachable, or does it fail immediately and prune the token?
- **Template Management**: Are the localized notification templates defined statically in code (`notification_metadata.data.ts`), or can they be dynamically updated via Firestore?