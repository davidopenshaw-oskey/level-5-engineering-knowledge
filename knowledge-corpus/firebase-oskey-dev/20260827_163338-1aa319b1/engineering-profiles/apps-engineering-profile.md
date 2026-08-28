### 0. Generation Metadata

- runId: `20260827_163338-1aa319b1`
- generatedAt: `2026-08-27T16:39:13.811Z`
- repoName: `firebase-oskey-dev`
- targetModule: `apps`
- llmConfigKey: `gemini-default`
- llmProvider: `gemini`
- llmModel: `gemini-3.5-flash`

### 1. Executive Summary

The `apps` module serves as the centralized utility and communication hub for the Oskey platform [Confirmed]. It encapsulates all external integration logic for dispatching transactional communications and generating utility assets, specifically providing template-driven email dispatch via Nodemailer/SMTP, multi-channel notification routing (APNs, FCM, Email, SMS), Twilio-powered SMS dispatch, and QR code generation [Confirmed]. By isolating these infrastructure-heavy integrations, the module prevents external SDK dependencies from leaking into core business domains [Inferred].

### 2. Architectural Position

The `apps` module sits as a low-level infrastructure and shared utility layer within the platform [Confirmed]. It is positioned directly above the `core` module (from which it inherits base document controller and logging capabilities) and below the primary business modules such as `user` and `organization` [Confirmed]. 
- **Owned Concepts**: Transactional communication logs (`/EmailLogs` and `/SMSLogs`), multi-channel notification routing rules, and QR code generation utilities [Confirmed].
- **Provided Capabilities**: `mail`, `notification`, `qr_code`, and `sms` [Confirmed].

### 3. Primary Responsibilities

#### mail

### Email Dispatching via SMTP [Confirmed]
- Establishes an SMTP transport connection using Nodemailer to send formatted emails `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 21-144).
- Dynamically retrieves SMTP credentials (such as the Mailtrap API key) from the secret manager using `OSKSecretService.getSecret` `` `call_expression|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|OSKSecretService.getSecret|send|OSKApiName.MailtrapPassApiKey|#1` ``.

### Template Management & Rendering [Confirmed]
- Manages and renders localized HTML and text email templates `functions/src/modules/apps/modules/mail/templates/index.ts`.
- Supports a variety of transactional templates, including:
  - Onboarding Activation Codes (`OSKOnboardingActivationCodeTemplate`) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_options.model.ts|OSKOnboardingActivationCodeTemplate|id|#1` ``.
  - Organization Invitations (`OSKOrganizationInvitationTemplate`) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_options.model.ts|OSKOrganizationInvitationTemplate|id|#1` ``.
  - Property Manager Portal (PGO) User Invitations (`OSKPMPUserInvitationTemplate`) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_options.model.ts|OSKPMPUserInvitationTemplate|id|#1` ``.
  - External Unit Invitations (`OSKExternalUnitInvitationTemplate`) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_options.model.ts|OSKExternalUnitInvitationTemplate|id|#1` ``.
  - External User Invitations (`OSKExternalUserInvitationTemplate`) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_options.model.ts|OSKExternalUserInvitationTemplate|id|#1` ``.
  - User Onboarded Notifications (`OSKUserOnboardedNotificationTemplate`) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_options.model.ts|OSKUserOnboardedNotificationTemplate|id|#1` ``.
  - User OTP Codes (`OSKUserOtpCodeEmailTemplate`) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_options.model.ts|OSKUserOtpCodeEmailTemplate|id|#1` ``.

### Email Transaction Logging [Confirmed]
- Records detailed logs of sent emails, including sender, recipients, text, HTML, and SMTP response metadata (accepted, rejected, pending, envelope, messageId) to Firestore `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 146-189).
- Saves logs using `OSKEmailLogController.default.save` `` `call_expression|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|OSKEmailLogController.default.save|logMailMessage|emailDocId,logMessage|#1` ``.

### Recipient Validation & Domain Filtering [Confirmed]
- Validates that recipient email addresses are well-formed (containing `@`) before attempting delivery to prevent SMTP errors `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 40-44).
- Filters recipient domains against an environment-configured allowlist (`allowedDomainsEnv`) to silently bypass email delivery in non-production environments `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 34-52).

---

#### notification

- **Multi-channel Notification Routing**: Orchestrates dispatching across Push (APNs/FCM), Email, and SMS channels depending on the notification type and metadata configurations. `` `functions/src/modules/apps/modules/notification/services/notification.service.ts` (lines 28-62) `` [Confirmed]
- **Apple Push Notification service (APNs) Delivery**: Manages APNs payload construction, environment-specific API key retrieval (development vs production), and token-based dispatching using `@parse/node-apn`. `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (lines 36-118) `` [Confirmed]
- **Firebase Cloud Messaging (FCM) Delivery**: Handles FCM message generation and dispatching to Android devices using `firebase-admin/messaging`. `` `functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts` (lines 20-35) `` [Confirmed]
- **Email and SMS Delegation**: Delegates email delivery to `OSKEmailService` and SMS delivery to `OSKSmsService` based on template configurations. `` `functions/src/modules/apps/modules/notification/services/notification.service.ts` (lines 204-294) `` [Confirmed]
- **Dynamic Payload Interpolation**: Performs string interpolation on notification templates (e.g., replacing `${recipientName}`) to customize message bodies and titles dynamically. `` `functions/src/modules/apps/modules/notification/services/notification.service.ts` (lines 296-302) `` [Confirmed]
- **Stale Token Pruning**: Automatically triggers deletion of invalid or failed notification tokens by calling `OSKUserNotificationTokenController.delete` when push services report delivery failures. `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKUserNotificationTokenController.default.delete|_send|userId,token.tokenId|#1` ``, `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|OSKUserNotificationTokenController.default.delete|_send|_userId,_tokenId|#1` `` [Confirmed]
- **Special/VoIP Notification Dispatching**: Supports sending high-priority or VoIP notifications (e.g., for user calls) using specialized APNs and FCM configurations. `` `functions/src/modules/apps/modules/notification/services/notification.service.ts` (lines 304-375) `` [Confirmed]

---

#### qr_code

- **QR Code Generation**: Generates a QR code represented as a Data URL from an activation code or string using the external `qrcode` library inside the `OSKQRcodeService.generateQR` method `` `service_method|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|OSKQRcodeService|generateQR|#1` `` and `` `call_expression|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|QRCode.toDataURL|generateQR|activationCode|#1` ``. [Confirmed]
- **Error Handling and Logging**: Catches errors during the generation process, serializes them, and logs them using the core logging service `` `call_expression|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|OSKQRcodeService.logger.logError|generateQR|`Error while generating QR code: ${JSON.stringify(error)}`,{ error }|#1` ``. [Confirmed]

#### sms

#### SMS Dispatch via Twilio [Confirmed]
The capability initializes a Twilio client using credentials retrieved from secrets and dispatches SMS messages to specified recipients.
- **Citations**: 
  - `functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 59-118)
  - `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|twilio|sendSms|accountSid,authToken|#1` ``
  - `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|client.messages.create|sendSms|{                 body: messageText,                 to: options.template.params.recipientPhone,                 messagingServiceSid: messagingServiceSid,             }|#1` ``

#### Template-based Message Rendering [Confirmed]
Supports rendering SMS messages using predefined templates (e.g., external unit invitations, external user invitations) with dynamic parameter replacement (such as `${inviterName}`).
- **Citations**: 
  - `functions/src/modules/apps/modules/sms/templates/index.ts` (lines 1-7)
  - `` `functions/src/modules/apps/modules/sms/models/sms_options.model.ts` (lines 8-28) ``
  - `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|messageText.replace|sendSms|'${inviterName}',options.template.params.inviterName|#1` ``

#### SMS Transaction Logging [Confirmed]
Logs SMS delivery status, recipients, text, and server success/failure responses to Firestore.
- **Citations**: 
  - `functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (lines 11-49)
  - `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|OSKSmsService.default.logSms|sendSms|options,messageText,message|#1` ``

---

### 4. Public Interfaces

#### mail

### Controllers [Confirmed]
- **`OSKEmailLogController`** (`functions/src/modules/apps/modules/mail/controllers/email.controller.ts`): Extends `OSKDocumentController` to manage the lifecycle of email log documents in Firestore. It exposes standard document operations:
  - `generateDocId` `` `controller_method|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|OSKEmailLogController|generateDocId|#1` ``
  - `get` `` `controller_method|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|OSKEmailLogController|get|#1` ``
  - `getAll` `` `controller_method|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|OSKEmailLogController|getAll|#1` ``
  - `save` `` `controller_method|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|OSKEmailLogController|save|#1` ``
  - `update` `` `controller_method|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|OSKEmailLogController|update|#1` ``
  - `delete` `` `controller_method|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|OSKEmailLogController|delete|#1` ``
  - `listDocuments` `` `controller_method|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|OSKEmailLogController|listDocuments|#1` ``
  - `queryAllSmsDocs` `` `controller_method|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|OSKEmailLogController|queryAllSmsDocs|#1` ``

### Services [Confirmed]
- **`OSKEmailService`** (`functions/src/modules/apps/modules/mail/services/email.service.ts`): The primary service interface for sending emails and logging transactions.
  - `send(options: OSKEmailOptions)`: Handles template resolution, domain filtering, SMTP transport creation, and dispatching `` `service_method|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|OSKEmailService|send|#1` ``.
  - `logMailMessage(emailResponse: SentMessageInfo, message: SendMailOptions)`: Persists transaction metadata to Firestore `` `service_method|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|OSKEmailService|logMailMessage|#1` ``.

---

#### notification

- **`OSKNotificationService`**: The primary entry point for sending standard and special notifications. Exposes `send` and `sendSpecial` methods. `` `functions/src/modules/apps/modules/notification/services/notification.service.ts` (lines 23-375) `` [Confirmed]
- **`OSKAPNSService`**: Internal service for APNs push delivery. Exposes `send` and `_send`. `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (lines 11-118) `` [Confirmed]
- **`OSKFirebaseCloudMessagingService`**: Internal service for FCM push delivery. Exposes `send` and `_send`. `` `functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts` (lines 11-35) `` [Confirmed]

---

#### qr_code

- **OSKQRcodeService**: A service class defined in `functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts` `` `source_class|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|OSKQRcodeService` `` and exported via the submodule index file `` `exported_symbol|apps|functions/src/modules/apps/modules/qr_code/index.ts|./services/qr.code.service|#1` ``. It exposes the public method `generateQR` `` `service_method|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|OSKQRcodeService|generateQR|#1` ``. [Confirmed]

#### sms

#### `OSKSMSLogController` [Confirmed]
An exported controller extending `OSKDocumentController` that manages Firestore operations (CRUD and queries) for SMS logs.
- **Citations**: 
  - `` `source_class|apps|functions/src/modules/apps/modules/sms/controllers/sms.controller.ts|OSKSMSLogController` ``

#### `OSKSmsService` [Confirmed]
An exported service that orchestrates SMS template rendering, Twilio client dispatch, and logging.
- **Citations**: 
  - `` `source_class|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|OSKSmsService` ``

---

### 5. Internal Structure

**Intra-Module Coupling Note**:
The submodules within `apps` exhibit a clear hierarchical routing structure [Confirmed]. The `notification` submodule acts as an internal orchestrator and possesses outbound dependencies on both `mail` (importing `OSKEmailTemplateId`, `OSKEmailOptions`, and `OSKEmailService`) and `sms` (importing `OSKSMSTemplateId` and `OSKSmsService`) to execute multi-channel dispatch [Confirmed]. Conversely, the `mail` and `sms` submodules operate as independent leaf nodes with no outbound intra-module dependencies [Confirmed]. The `qr_code` submodule is entirely decoupled internally, maintaining zero relationships with sibling submodules [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

**Ownership Conclusion**:
The `apps` module is the sole authoritative owner of the `/EmailLogs` and `/SMSLogs` collections, which it uses to persist transaction histories for auditability [Confirmed]. It does not directly own any user-facing collections [Confirmed]. While the `notification` submodule performs write operations (deletions) against `/users/{id}/notificationTokens`, it does so by calling the `OSKUserNotificationTokenController` owned by the `user` module, meaning it acts as a consumer rather than the owner of user token data [Inferred]. Based on data ownership signals, services like `OSKEmailService`, `OSKNotificationService`, and `OSKQRcodeService` are heavily consumed by external business modules (`organization` and `user`), confirming that `apps` acts as a pure service provider that abstracts data persistence and external APIs for the rest of the application [Inferred].

**Per-capability evidence:**

#### mail

### Firestore Collections [Confirmed]
- **`/EmailLogs`**: This capability owns and writes to the `/EmailLogs` collection to store email transaction history.
  - **Query Scope**: Scoped to `/EmailLogs` `` `call_expression|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|this._query|queryAllSmsDocs|'/EmailLogs',queryFilters|#1` ``.
  - **Schema Fields**:
    - `emailDocId` (string) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailHeaderLog|emailDocId|#1` ``
    - `sender` (string) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailHeaderLog|sender|#1` ``
    - `recipients` (array) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailHeaderLog|recipients|#1` ``
    - `text` (string) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailHeaderLog|text|#1` ``
    - `html` (string) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailHeaderLog|html|#1` ``
    - `creationDate` (timestamp) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailHeaderLog|creationDate|#1` ``
    - `error` (any) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailHeaderLog|error|#1` ``
    - `info` (any) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailHeaderLog|info|#1` ``
    - `accepted` (array) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailResponseLog|accepted|#1` ``
    - `rejected` (array) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailResponseLog|rejected|#1` ``
    - `pending` (array) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailResponseLog|pending|#1` ``
    - `envelope` (any) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailResponseLog|envelope|#1` ``
    - `messageId` (string) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailResponseLog|messageId|#1` ``
    - `response` (string) `` `model_property|apps|functions/src/modules/apps/modules/mail/models/email_log_document.ts|OSKEmailResponseLog|response|#1` ``

---

#### notification

- No direct Firestore writes or reads are performed via direct Firestore SDK calls within this capability's files. However, it interacts with user notification tokens by calling `OSKUserNotificationTokenController` to retrieve and delete tokens. [Confirmed]
- The underlying Firestore paths managed by the referenced controller are `/users/{id}/notificationTokens` (based on log messages and controller imports). `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|this.logger.logWarning|_send|`Delete notification token /users/${userId}/notificationTokens/${token.tokenId}`|#1` `` [Inferred]

---

#### qr_code

- This capability does not directly read, write, or own any Firestore collections or documents. [Confirmed]

#### sms

#### Firestore Path: `/SMSLogs` [Confirmed]
- **Operation Detection Scope**: Document Controller Query / Save
- **Citations**: 
  - `` `call_expression|apps|functions/src/modules/apps/modules/sms/controllers/sms.controller.ts|this._query|queryAllSmsDocs|'/SMSLogs',queryFilters|#1` ``
- **Fields**:
  - `smsDocId`: *string*
  - `sender`: *string*
  - `recipients`: *array*
  - `text`: *string*
  - `creationDate`: *timestamp*
  - `status`: *string*
  - `serverSuccess`: *any*
  - `serverFailure`: *any*
  - **Citations**: `` `type_alias|apps|functions/src/modules/apps/modules/sms/models/sms_log_document.ts|OSKSMSLog|#1` ``

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### mail

*No API contracts (`api_contract` facts) or Firestore triggers are owned or declared by this capability.*

---

#### notification

- No API contracts (`api_contract` facts) or Firestore triggers are owned directly by this capability. [Confirmed]
- No resolved API request/response schemas are present in this evidence scope. [Confirmed]

---

#### qr_code

- No API contracts or Firestore triggers are directly owned or exposed by this capability. [Confirmed]

#### sms

No direct API contracts (`api_contract` facts) or Firestore triggers are defined in this capability's evidence pack.

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

**Cross-Cutting Security Callouts**:
- **Zero Internal RBAC Enforcement**: A review of all submodules (`mail`, `notification`, `qr_code`, `sms`) reveals that no explicit RBAC permission strings (e.g., `v1.admin...` or `v1.org...`) are checked or referenced within this module's codebase [Confirmed]. Security is entirely delegated to the calling modules/controllers that invoke these utility services [Inferred].
- **Server-Side Isolation of Logs**: Neither `/EmailLogs` nor `/SMSLogs` are matched in `firestore.rules.txt` [Confirmed]. They fall back to the default catch-all rule (`allow read, write: if false`), ensuring they are strictly server-side collections accessible only via the Firebase Admin SDK [Inferred].
- **Unattributed Security-Relevant Writes**: The `notification` submodule invokes `OSKUserNotificationTokenController.delete` to prune invalid or expired tokens from `/users/{id}/notificationTokens` when APNs or FCM returns delivery failures [Confirmed]. This write operation modifies user-scoped data but is triggered automatically by external API responses without an active user session or explicit RBAC check [Inferred].

**Per-capability evidence:**

#### mail

- **RBAC Permissions**: No specific RBAC permission strings are referenced or checked within this capability's code.
- **Firestore Security Rules**: The `/EmailLogs` collection is not explicitly matched in `firestore.rules.txt`. Consequently, it falls back to the default catch-all rule:
  ```javascript
  match /{document=**} {
    allow read, write: if false;
  }
  ```
  This indicates that `/EmailLogs` is strictly a server-side collection, accessible only via the Firebase Admin SDK used by Cloud Functions, and cannot be read or written directly by client applications [Confirmed].

---

#### notification

- No explicit permission strings (e.g., `v1.admin...` or `v1.org...`) are referenced or checked within the evidence pack for this capability. [Confirmed]
- Security is implicitly handled by the calling modules/controllers that invoke `OSKNotificationService`. [Inferred]

---

#### qr_code

- No specific RBAC permissions or security rules are referenced or enforced within this capability's codebase. [Confirmed]

#### sms

No permission strings are referenced in this capability's evidence. [Confirmed]

---

### 10. Cross-Module Relationships

The `apps` module maintains the following verified relationships with other modules in the repository:

#### Outbound Dependencies (apps -> X)
- **`core`** [Confirmed]:
  - Inherits base document persistence and querying capabilities by importing `OSKDocumentController`, `OSKDocumentList`, `OSKDocumentUpdate`, and `OSKQueryFilter` in the `mail` and `sms` controllers.
  - Utilizes platform-wide logging by calling `OSKLoggingService` methods (`logError`, `logInfo`, `logWarning`, `logDebug`) across all submodules.
  - Retrieves external API credentials (SMTP, Twilio, APNs) by calling `OSKSecretService.getSecret`.
- **`user`** [Confirmed]:
  - Manages push notification targets by importing `OSKUserNotificationTokenController` and calling its `getAll` and `delete` methods within the `notification` submodule.
- **`call`** [Confirmed]:
  - Imports `OSKICEServers` from `src/modules/call/models/shared/ice_servers.model` to support notification payload metadata.

#### Inbound Dependencies (X -> apps)
- **`organization`** [Confirmed]:
  - Consumes `OSKEmailService.send` to dispatch onboarding emails and user invitations.
  - Consumes `OSKQRcodeService.generateQR` to generate activation QR codes for onboarding inhabitants.
  - Imports `OSKNotificationOptions` for intercom communication alerts.
- **`user`** [Confirmed]:
  - Consumes `OSKNotificationService.send` and `sendSpecial` to dispatch user-centric alerts (e.g., invitation received).
  - Consumes `OSKEmailService.send` to dispatch transactional user emails.
  - Imports `OSKNotificationType` and `OSKNotificationOptions` to manage user notification settings.

### 11. External Hooks

#### mail

### Confirmed Integrations [Confirmed]
- **SMTP Server (Mailtrap / Production SMTP)**: Integrates with an external SMTP server. The password/API key is securely fetched from GCP Secret Manager using `OSKApiName.MailtrapPassApiKey` `` `call_expression|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|OSKSecretService.getSecret|send|OSKApiName.MailtrapPassApiKey|#1` ``.

### Environment Variables [Confirmed]
- **`OSK_ALLOWED_EMAIL_DOMAINS`**: An environment variable (referenced in code as `allowedDomainsEnv`) containing a comma-separated list of domains allowed to receive emails in non-production environments `` `call_expression|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|OSKEmailService.default.logger.logInfo|send|`Email sending silently bypassed for ${recipientEmail}. Domain not in OSK_ALLOWED_EMAIL_DOMAINS.`,{ recipientEmail, allowedDomains }|#1` ``.

---

#### notification

- **APNs Integration**: Integrates with Apple Push Notification service (APNs) via the `@parse/node-apn` library. `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (line 9) `` [Confirmed]
- **FCM Integration**: Integrates with Google Firebase Cloud Messaging (FCM) via `firebase-admin/messaging`. `` `functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts` (line 9) `` [Confirmed]
- **Environment Variables / Secrets**:
  - Retrieves APNs API keys from `OSKSecretService` using `OSKApiName.APNSDevelopmentAPIKey` and `OSKApiName.APNSProductionAPIKey`. `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKSecretService.getSecret|_send|OSKApiName.APNSDevelopmentAPIKey|#1` `` [Confirmed]
  - References environment variables `OSK_APNS_API_KEY_ID` and `OSK_APPLE_TEAM_ID` for APNs configuration. `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|this.logger.logError|_send|'[APNSService] Cannot send notification due to missing configuration.',{...}|#1` `` [Confirmed]

---

#### qr_code

- **Third-Party Library Integration**: Integrates with the external `qrcode` library to generate Data URLs via `QRCode.toDataURL` `` `call_expression|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|QRCode.toDataURL|generateQR|activationCode|#1` ``. [Confirmed]

#### sms

#### Confirmed Integrations [Confirmed]
- **Twilio SMS API**: External SMS gateway used to send messages.
  - **Citations**: `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|client.messages.create|sendSms|{                 body: messageText,                 to: options.template.params.recipientPhone,                 messagingServiceSid: messagingServiceSid,             }|#1` ``
- **GCP Secret Manager**: Accessed via `OSKSecretService` to fetch Twilio credentials (`TwilioAccountSID`, `TwilioAuthToken`, `TwilioMessagingServiceSID`).
  - **Citations**: `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|OSKSecretService.getSecret|sendSms|OSKApiName.TwilioAccountSID|#1` ``

---

### 12. Architectural Observations

- **Strict Infrastructure Isolation**: The module successfully isolates third-party SDKs (Nodemailer, Twilio, APNs, FCM) and their corresponding error-handling and configuration complexities from the rest of the application [Inferred].
- **Bidirectional Cross-Module Coupling**: There is a tight, bidirectional architectural coupling between the `apps` and `user` modules [Confirmed]. While `user` depends on `apps` for dispatching notifications, `apps` simultaneously depends on `user` to fetch and delete notification tokens via `OSKUserNotificationTokenController` [Confirmed]. This violates clean layering principles [Inferred].
- **Asymmetrical Logging Persistence**: While email and SMS dispatches are logged to dedicated Firestore collections (`/EmailLogs` and `/SMSLogs`) [Confirmed], push notifications dispatched via APNs and FCM do not write to a corresponding `/NotificationLogs` collection, relying instead on standard application logging [Inferred].

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Layering Violation (Circular Dependency Risk)**: The bidirectional dependency between `apps/notification` and `user/user_notification` (where `apps` imports `OSKUserNotificationTokenController` and `user` imports `OSKNotificationService`) presents a circular dependency risk that could complicate compilation, testing, and modular isolation [Confirmed].
- **Unmapped `/SMSLogs` Collection**: The `sms` submodule actively queries and writes to the `/SMSLogs` collection [Confirmed], but this collection is completely absent from the `firestore-schema.md` grounding document, indicating a schema staging mismatch or undocumented collection [Confirmed].
- **Unprotected Log Controllers**: The controllers `email.controller.ts` and `sms.controller.ts` inherit from `OSKDocumentController` and expose query/write methods [Confirmed]. Because the `apps` module contains no RBAC checks, if these controllers are exposed as public HTTP/Callable functions without routing through a secure gateway, they represent a significant data exposure risk [Inferred].
- **Unbounded Log Growth**: There is no evidence of a TTL (Time-To-Live) policy or background pruning task for the `/EmailLogs` and `/SMSLogs` collections, which could lead to unbounded database growth and increased storage costs over time [Inferred].

**Per-capability open questions:**

#### mail

- What is the exact environment variable key name used to populate `allowedDomainsEnv`? (The log message references `OSK_ALLOWED_EMAIL_DOMAINS`, but the exact variable binding is not shown in the facts).
- Are there any background cleanup tasks or TTL policies configured for the `/EmailLogs` collection to prevent unbounded database growth?

#### notification

- How are the APNs and FCM configurations initialized? The code references `apn.Provider` or similar implicitly via `apn.send` but the provider setup details are not fully detailed in the call expressions. [Unknown]
- Are there any retry mechanisms for transient network failures when communicating with APNs or FCM, or are all failures treated as token invalidations? [Unknown]

#### qr_code

- **Caller Context**: Which modules or services invoke `OSKQRcodeService.generateQR` to generate QR codes? (The architectural documents suggest a connection to `onboardingQRCode` in the `/organizations/{id}/onboardingInhabitants` collection, but the exact calling orchestration is not visible in this capability's evidence pack). [Inferred]

#### sms

- The Firestore schema document lists `/EmailLogs` but does not explicitly list `/SMSLogs`, even though the code queries `'/SMSLogs'`. Is `/SMSLogs` a separate collection, or is it dynamically created?
- Are there any retry mechanisms or queueing systems (like Pub/Sub) for SMS delivery failures, or does it fail synchronously and just log the error?

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.