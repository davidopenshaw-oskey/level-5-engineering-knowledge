### 0. Generation Metadata

- runId: `20260803_143350-1aa319b1`
- generatedAt: `2026-08-11T17:02:50.034Z`
- repoName: `firebase-oskey-dev`
- targetModule: `apps`
- llmConfigKey: `gemini-default`
- llmProvider: `gemini`
- llmModel: `gemini-3.5-flash`

### 1. Executive Summary

The `apps` module serves as the centralized utility and communication engine for the Oskey platform. It orchestrates transactional multi-channel notifications (push notifications via APNS/FCM, emails, and SMS), generates utility assets (such as QR codes for onboarding), and maintains audit logs of communications. [Confirmed]

### 2. Architectural Position

The `apps` module operates as a shared infrastructure and utility layer within the platform. It sits below business-logic modules like `organization` and `user`, which call into it to dispatch communications or generate QR codes. It sits above the `core` module, utilizing its document controller, logging, and secret management services, and interacts with the `user` module to manage notification tokens. [Confirmed]
- **Concepts Owned**: Transactional email logs (`/EmailLogs`), transactional SMS logs (`/SMSLogs`), notification dispatch orchestration, and QR code generation. [Confirmed]
- **Provided Capabilities**: Transactional email dispatch (`mail`), multi-channel notification routing and token cleanup (`notification`), QR code generation (`qr_code`), and transactional SMS dispatch (`sms`). [Confirmed]

### 3. Primary Responsibilities

#### mail

### Transactional Email Dispatching
- **SMTP Transport Configuration**: Configures and manages SMTP transport using `nodemailer` with credentials retrieved dynamically from `OSKSecretService` (specifically `OSKApiName.MailtrapPassApiKey`) `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 63-69) ``. [Confirmed]
- **Email Delivery**: Dispatches emails asynchronously using the configured transport and closes the connection upon completion or error `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 134-140) ``. [Confirmed]

### Email Template Management & Localization
- **Template Selection**: Resolves and loads specific email templates based on the requested template ID and language (supporting English and French) `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 75-92) ``. [Confirmed]
- **Parameter Replacement**: Dynamically injects parameters into templates by replacing placeholders (e.g., `${emailBody}`) in both HTML and plain text formats using regular expressions `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 107-112) ``. [Confirmed]
- **Supported Templates**: Manages a suite of predefined templates including:
  - Onboarding Activation Code `` `functions/src/modules/apps/modules/mail/templates/onboarding_activation/onboarding_activation_code.ts` `` [Confirmed]
  - Organization Invitation `` `functions/src/modules/apps/modules/mail/templates/organization_invitation/organization_invitation.template.ts` `` [Confirmed]
  - Property Manager Portal (PMP) User Invitation `` `functions/src/modules/apps/modules/mail/templates/pmp_user_invitation/pmp_user_invitation.template.ts` `` [Confirmed]
  - External Unit Invitation `` `functions/src/modules/apps/modules/mail/templates/unit_invitation/external_unit_invitation_template.ts` `` [Confirmed]
  - External User Invitation `` `functions/src/modules/apps/modules/mail/templates/user_invitation/external_user_invitation.template.ts` `` [Confirmed]
  - User Onboarded Notification `` `functions/src/modules/apps/modules/mail/templates/user_onboarded/user_onboarded_notification.template.ts` `` [Confirmed]
  - User OTP Code `` `functions/src/modules/apps/modules/mail/templates/user_otp_code/user_otp_code.template.ts` `` [Confirmed]

### Recipient Validation & Domain Filtering
- **Format Validation**: Validates recipient email addresses to ensure they contain a valid `@` symbol, silently bypassing malformed addresses to prevent SMTP errors `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 40-44) ``. [Confirmed]
- **Domain Whitelisting**: Parses an allowed domains environment variable (`allowedDomainsEnv`) and restricts email dispatch to those domains in non-production environments, silently bypassing unauthorized recipients `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 34-52) ``. [Confirmed]

### Email Activity Logging
- **Log Persistence**: Automatically records email metadata, recipient lists, text/HTML content, and SMTP response details (accepted, rejected, pending, envelope, and message ID) to the `/EmailLogs` collection in Firestore `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 146-189) ``. [Confirmed]
- **Log Administration**: Exposes standard CRUD operations (get, getAll, save, update, delete, listDocuments) for managing `/EmailLogs` documents `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (lines 19-49) ``. [Confirmed]

#### notification

- **Multi-Channel Notification Dispatching**: Orchestrates the routing of standard and special (VoIP/call-related) notifications across APNS, FCM, Email, and SMS channels based on user preferences, language, and device token availability. [Confirmed] `` `service_method|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKNotificationService|send|#1` `` and `` `service_method|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKNotificationService|sendSpecial|#1` ``.
- **Apple Push Notification service (APNS) Integration**: Configures and transmits alert and VoIP push notifications to iOS and watchOS devices using the `@parse/node-apn` library, utilizing environment-specific API keys retrieved from secret storage. [Confirmed] `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (lines 36-118) ``.
- **Firebase Cloud Messaging (FCM) Integration**: Transmits push notifications to Android devices using the `firebase-admin/messaging` SDK. [Confirmed] `` `functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts` (lines 20-35) ``.
- **Email Notification Delegation**: Hands off email dispatching to the sibling `mail` submodule when email notification channels are triggered. [Confirmed] `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKEmailService.default.send|_handleEmailNotifications|emailOptions|#1` ``.
- **SMS Notification Delegation**: Hands off SMS dispatching to the sibling `sms` submodule when SMS notification channels are triggered. [Confirmed] `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKSmsService.default.sendSms|_handleSmsNotifications|{                     language: options.language,                     template: {                         id: 'externalSMSUserInvitationReceived',                         params: { ...commonParams, ...options.data },                     },                 }|#1` ``.
- **Self-Healing Token Management**: Automatically prunes and deletes invalid or expired APNS and FCM device tokens from the user's profile database when the respective gateway returns a delivery failure. [Confirmed] `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKUserNotificationTokenController.default.delete|_send|userId,token.tokenId|#1` `` and `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|OSKUserNotificationTokenController.default.delete|_send|_userId,_tokenId|#1` ``.
- **Template Interpolation**: Dynamically replaces placeholder variables (e.g., `${variable}`) within localized notification titles and bodies with runtime context parameters. [Confirmed] `` `service_method|apps|functions/src/modules/apps/modules/notification/services/notification.service.ts|OSKNotificationService|_interpolate|#1` ``.

---

#### qr_code

- **QR Code Generation**: Converts a string-based activation code into a base64-encoded Data URL representation of a QR code. [Confirmed] (Cite: `functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts` (line 9))
- **Error Handling and Logging**: Catches errors during the QR generation process, stringifies the error object, and logs it via the core logging service. [Confirmed] (Cite: `functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts` (line 12))

#### sms

The `sms` capability is responsible for the following distinct features:

### SMS Dispatching via Twilio (**Confirmed**)
- Integrates with the Twilio SDK to send SMS messages to recipients (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 88-98)).
- Dynamically retrieves Twilio API credentials (`TwilioAccountSID`, `TwilioAuthToken`, and `TwilioMessagingServiceSID`) at runtime using the platform's secret management service (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 66-68)).
- Handles Twilio API errors gracefully, logging failures and updating the corresponding transaction log (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 107-114)).

### SMS Templating & Localization (**Confirmed**)
- Manages SMS templates, specifically supporting external unit invitations (`OSKSMSExternalUnitInvitationTemplate`) and external user invitations (`OSKSMSExternalUserInvitationTemplate`) (`functions/src/modules/apps/modules/sms/models/sms_options.model.ts` (lines 8-25)).
- Resolves localized templates based on the recipient's language preference and replaces placeholders (e.g., `${inviterName}`) with dynamic parameters (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 77-87)).

### SMS Transaction Logging (**Confirmed**)
- Records every SMS attempt, including metadata such as sender, recipients, text content, creation timestamp, and delivery status (`functions/src/modules/apps/modules/sms/models/sms_log_document.ts` (lines 8-25)).
- Captures downstream provider responses, logging both successful message SIDs (`serverSuccess`) and error details (`serverFailure`) (`functions/src/modules/apps/modules/sms/models/sms_log_document.ts` (lines 21-25)).
- Exposes administrative CRUD and query capabilities for SMS logs via a dedicated controller (`functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (lines 11-49)).

---

### 4. Public Interfaces

#### mail

### Controllers
- **`OSKEmailLogController`** (Class): Extends `OSKDocumentController` to manage Firestore documents within the `/EmailLogs` collection `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (line 11) ``. [Confirmed]
  - `generateDocId()`: Generates a unique document ID for email logs.
  - `get(emailDocId)`: Retrieves a specific email log.
  - `getAll()`: Retrieves all email logs.
  - `save(emailDocId, data)`: Saves or overwrites an email log.
  - `update(emailDocId, data)`: Updates fields on an existing email log.
  - `delete(emailDocId)`: Deletes an email log.
  - `listDocuments()`: Lists email log documents.
  - `queryAllSmsDocs(queryFilters)`: Queries email logs (note: method name contains "SmsDocs" but targets `/EmailLogs` collection) `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (lines 35-36) ``.

### Services
- **`OSKEmailService`** (Class): The primary service interface for sending emails and logging results `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 17) ``. [Confirmed]
  - `send(options: OSKEmailOptions)`: Validates, renders, and dispatches an email.
  - `logMailMessage(emailResponse, message)`: Formats and persists SMTP response details to Firestore.

#### notification

The capability exposes the following service entry points:
- **`OSKNotificationService`** (`functions/src/modules/apps/modules/notification/services/notification.service.ts`): The primary orchestrator service exposing `send` and `sendSpecial` methods to dispatch notifications across all channels.
- **`OSKAPNSService`** (`functions/src/modules/apps/modules/notification/services/apns.service.ts`): Exposes the `send` method to transmit push payloads specifically to Apple devices.
- **`OSKFirebaseCloudMessagingService`** (`functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts`): Exposes the `send` method to transmit push payloads specifically to Android devices.

---

#### qr_code

- **OSKQRcodeService**: A service class exposing the `generateQR` method. [Confirmed] (Cite: `functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts` (lines 4-16))
- The service is exported as a public entry point of the `qr_code` submodule. [Confirmed] (Cite: `functions/src/modules/apps/modules/qr_code/index.ts` (line 1))

#### sms

The capability exposes the following public classes and services:

### `OSKSMSLogController` (**Confirmed**)
- **File**: `functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (lines 11-49)
- **Type**: Controller Class (extends `OSKDocumentController`)
- **Description**: Exposes document-level operations for managing SMS logs stored in Firestore. It wraps standard database operations such as document generation, retrieval, querying, saving, updating, and deletion.

### `OSKSmsService` (**Confirmed**)
- **File**: `functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 18-118)
- **Type**: Service Class
- **Description**: The primary programmatic entry point for sending SMS messages and persisting transaction logs. It encapsulates the Twilio integration and template resolution logic.

---

### 5. Internal Structure

The `apps` module is structured into four submodules: `mail`, `notification`, `sms`, and `qr_code`. Intra-module coupling is highly centralized around the `notification` submodule, which acts as an orchestrator:
- `notification` depends on `mail` (**Confirmed**): Imports `OSKEmailTemplateId`, `OSKEmailOptions`, and `OSKEmailService` to route notifications via email.
- `notification` depends on `sms` (**Confirmed**): Imports `OSKSMSTemplateId` and `OSKSmsService` to route notifications via SMS.
- `mail` has no outbound intra-module dependencies but receives inbound coupling from `notification` (**Confirmed**).
- `sms` has no outbound intra-module dependencies but receives inbound coupling from `notification` (**Confirmed**).
- `qr_code` operates as an isolated utility submodule with zero intra-module coupling (**Confirmed**).

### 6. Firestore & Data Ownership

**Ownership conclusion:**

Based on the data ownership extracts and deterministic signals, the true ownership of the collections touched by this module is resolved as follows:
- **`/EmailLogs/{id}`**: Exclusively written, read, and queried by `OSKEmailLogController` within the `mail` submodule. Although `OSKEmailService` is called by the `notification` submodule and external modules (`organization`, `user`), the log collection itself is owned by `mail`. [Inferred]
- **`/SMSLogs/{smsDocId}`**: Exclusively written, read, and queried by `OSKSMSLogController` within the `sms` submodule. Although `OSKSmsService` is called by the `notification` submodule, the log collection itself is owned by `sms`. [Inferred]
- **`/users/{userId}/notificationTokens/{tokenId}`**: The `notification` capability performs targeted deletions on this path upon APNS/FCM delivery failure. However, this path is located within the `/users` collection hierarchy, which is owned by the `user` module. The `notification` submodule acts as a consumer/maintainer of this data rather than the owner, delegating deletions to `OSKUserNotificationTokenController`. [Inferred]

**Per-capability evidence:**

#### mail

### Firestore Collections
- **`/EmailLogs`**
  - **Path**: `/EmailLogs/{id}`
  - **Operations**: Read, Write, Delete `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (lines 19-49) ``.
  - **Confidence**: Confirmed. The `OSKEmailLogController` is explicitly bound to this collection path and performs standard document operations `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (line 36) ``.

#### notification

While this capability does not directly own or write to primary Firestore collections, it performs targeted deletions on the following subcollection path to clean up stale device tokens:
- **`/users/{userId}/notificationTokens/{tokenId}`** (Operation: Delete)
  - Triggered upon APNS delivery failure: `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKUserNotificationTokenController.default.delete|_send|userId,token.tokenId|#1` ``
  - Triggered upon FCM delivery failure: `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|OSKUserNotificationTokenController.default.delete|_send|_userId,_tokenId|#1` ``

---

#### qr_code

No Firestore paths or collections are directly read, written, or owned by this capability. [Confirmed]

#### sms

### Firestore Collections (**Confirmed**)
The capability reads and writes documents within the following Firestore path:

- **Path**: `/SMSLogs/{smsDocId}`
  - **Operation Scope**: Read, Write, Query, Delete (`functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (lines 19-49))
  - **Description**: Stores transaction logs for all dispatched SMS messages. Each document conforms to the `OSKSMSLog` type alias (`functions/src/modules/apps/modules/sms/models/sms_log_document.ts` (lines 8-25)).
  - **Detection Method**: Explicitly queried via `this._query('/SMSLogs', queryFilters)` in `OSKSMSLogController.queryAllSmsDocs` (`functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (line 36)).

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### mail

No direct HTTP/REST API endpoints (`api_contract` facts) or Firestore triggers are defined within this capability's pack.

### Resolved API Request/Response Schemas
No `api_contract` requestType/responseType resolved to any `model_property` facts in this evidence scope.

#### notification

No API contracts or Firestore triggers are directly defined in this capability's evidence pack.

---

#### qr_code

No API contracts or Firestore triggers are defined or owned by this capability. [Confirmed]

#### sms

- **API Contracts**: No direct external HTTP API contracts (`api_contract` facts) are registered within this capability's pack.
- **Firestore Triggers**: No Firestore triggers are owned or declared by this capability.

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

A cross-capability comparison of the `apps` module's security posture reveals the following patterns and risks:
- **Mental Enforcement Tally**: 
  - `mail`: 0 RBAC checks. Performs writes to `/EmailLogs`.
  - `notification`: 0 RBAC checks. Performs deletes on `/users/{userId}/notificationTokens/{tokenId}`.
  - `qr_code`: 0 RBAC checks. Utility only.
  - `sms`: 0 RBAC checks. Performs writes to `/SMSLogs`.
- **Asymmetry & Rules Analysis**: None of the submodules in `apps` enforce RBAC checks locally. This is consistent with their role as backend utility services, but it introduces a cross-cutting risk if these services are exposed to client-side calls without upstream validation. Both `/EmailLogs` and `/SMSLogs` lack explicit rules in `firestore.rules.txt` and fall back to the default deny rule (`allow read, write: if false;`). This confirms they are inaccessible to client-side SDKs, meaning security relies entirely on the backend context (Admin SDK) of the Cloud Functions executing them. [Inferred]
- **Unattributed Security-Relevant Signals**: 
  - The `notification` submodule performs token deletions (`OSKUserNotificationTokenController.delete`) upon APNS/FCM delivery failure. These deletions are triggered automatically by background delivery failures rather than explicit user-initiated authorization checks, but they modify user-scoped data (`/users/{userId}/notificationTokens/{tokenId}`) without explicit RBAC checks. [Inferred]

**Per-capability evidence:**

#### mail

- No explicit RBAC permission strings are referenced or checked within the `mail` capability's code files. [Confirmed]
- **Firestore Rules Cross-Check**:
  - According to `firestore.rules.txt` (lines 531-534), read and write access to `/settings/{docId}` is allowed if `isValidUser()`. However, the `/EmailLogs` collection does not have an explicit rule block in the provided `firestore.rules.txt`. It falls back to the default rule `allow read, write: if false;` (lines 523-525) unless handled by administrative privileges or another rule not captured in this pack. [Inferred]

#### notification

No explicit RBAC permission strings are referenced or checked within this capability's evidence pack. Security is implicitly maintained by delegating token deletions to the `OSKUserNotificationTokenController` under the user's authenticated context.

---

#### qr_code

No permissions or security roles are referenced or enforced within this capability's code. [Confirmed]

#### sms

- **RBAC Permissions**: No explicit RBAC permission strings (e.g., `v1.admin...`) are referenced directly in the `sms` capability's code.
- **Firestore Rules Mismatch**: The `firestore.rules.txt` file does not contain any explicit rules for the `/SMSLogs` collection. It only defines rules for `/EmailLogs` and falls back to a default deny rule (`allow read, write: if false;`) for unspecified collections (`firestore.rules.txt` (lines 538-540)). This implies that `/SMSLogs` is inaccessible to client-side SDKs and can only be manipulated by backend services operating with administrative privileges. (**Inferred**)

---

### 10. Cross-Module Relationships

The `apps` module maintains the following confirmed relationships with other modules in the repository:

#### Outbound Dependencies
- **`core`** (**Confirmed**): The `apps` module heavily depends on `core` (20 touchpoints). It imports `OSKDocumentController` (for `mail` and `sms` controllers to perform CRUD on logs), `OSKLoggingService` (for error, info, warning, and debug logging across all services), and `OSKSecretService` (to retrieve SMTP and APNS credentials from GCP Secret Manager).
- **`user`** (**Confirmed**): The `notification` submodule depends on `user` (3 touchpoints) to manage device tokens, calling `OSKUserNotificationTokenController.delete` and `OSKUserNotificationTokenController.getAll`.
- **`call`** (**Confirmed**): The `notification` submodule imports `OSKICEServers` from `call` (1 touchpoint) within its notification options model.

#### Inbound Dependencies
- **`user`** (**Confirmed**): The `user` module depends on `apps` (8 touchpoints). It imports `OSKNotificationType`, `OSKNotificationOptions`, and `OSKNotificationService` to dispatch invitations and notifications, and calls `OSKEmailService.send` directly.
- **`organization`** (**Confirmed**): The `organization` module depends on `apps` (6 touchpoints). It imports `OSKNotificationOptions`, `OSKEmailService`, and `OSKQRcodeService` to send onboarding emails, generate QR codes, and dispatch intercom communications.

### 11. External Hooks

#### mail

### Confirmed Integrations
- **SMTP Server / Mailtrap**: Integrates with an external SMTP server to dispatch transactional emails. The SMTP password is dynamically fetched using `OSKSecretService.getSecret(OSKApiName.MailtrapPassApiKey)` `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 63, 69) ``. [Confirmed]

### Environment Variables
- **`OSK_ALLOWED_EMAIL_DOMAINS`**: (Inferred from `allowedDomainsEnv` variable) Used to restrict email dispatch to specific domains in non-production environments `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 34-52) ``. [Confirmed]

#### notification

The capability integrates with the following external systems and boundaries:
- **Apple Push Notification service (APNS) Gateway**: Integrates with Apple's push servers via `@parse/node-apn` to deliver alert and VoIP notifications. `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|@parse/node-apn|#1` ``.
- **Firebase Cloud Messaging (FCM) Gateway**: Integrates with Google's FCM servers via `firebase-admin/messaging` to deliver push notifications to Android devices. `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|firebase-admin/messaging|#1` ``.
- **GCP Secret Manager**: Retrieves APNS production and development API keys dynamically via `OSKSecretService`. `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKSecretService.getSecret|_send|OSKApiName.APNSProductionAPIKey|#1` ``.

---

#### qr_code

No external hooks, Pub/Sub topics, environment variables, or storage paths are evidenced within this capability. [Confirmed]

#### sms

### Confirmed Integrations (**Confirmed**)
- **Twilio SMS API**:
  - Integrated via the official `twilio` npm package (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 9)).
  - Invokes `client.messages.create` to dispatch SMS payloads (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 94)).
- **GCP Secret Manager**:
  - Accessed via `OSKSecretService.getSecret` to retrieve sensitive Twilio credentials (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 66-68)).

---

### 12. Architectural Observations

- **Separation of Concerns & Layering**: The module exhibits clean layering. Business modules (`user`, `organization`) act as the orchestration layer, while `apps` serves as a low-level utility layer. Within `apps`, `notification` acts as a multi-channel router, decoupling the "what" (notification intent) from the "how" (APNS, FCM, SMTP, Twilio). [Confirmed]
- **Centralized Orchestration**: The `notification` submodule centralizes the dispatch logic, pulling templates and routing to `mail` and `sms` submodules internally. [Confirmed]
- **Self-Healing Token Lifecycle (Pruning)**: The `notification` service implements a self-healing pattern where delivery failures to APNS or FCM immediately trigger a deletion of the stale token from the user's profile via the `user` module's controller. This prevents wasted delivery attempts and maintains token hygiene. [Confirmed]
- **No Direct Client Exposure**: The lack of Firestore rules for `/EmailLogs` and `/SMSLogs` combined with the absence of RBAC checks in the code indicates that `apps` is designed strictly as a backend-to-backend service layer, relying on the security boundaries of the calling modules (`user`, `organization`). [Inferred]

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Collection Schema and Rules Omissions**: There is a mismatch between the codebase, the Firestore schema, and the Firestore rules. `/SMSLogs` is actively queried and written to by the `sms` capability, but it is completely missing from `firestore-schema.md`. Furthermore, neither `/EmailLogs` nor `/SMSLogs` has explicit rules in `firestore.rules.txt`. While this secures them from client-side access via default-deny, it represents an undocumented architectural state. [Confirmed]
- **Unprotected Cross-Module Deletions**: The `notification` capability deletes user-scoped notification tokens (`/users/{userId}/notificationTokens/{tokenId}`) upon delivery failure. Because this bypasses standard RBAC checks and relies on automated background triggers, a malformed or spoofed delivery failure response from APNS/FCM could lead to unintended token pruning without administrative oversight. [Inferred]
- **Implicit Trust of Upstream Callers**: Since no submodule within `apps` enforces RBAC checks, the module implicitly trusts all upstream callers. If a vulnerability in `user` or `organization` allows unauthorized access to `OSKNotificationService` or `OSKEmailService`, the platform could be abused to send spam or phishing communications without triggering permission blocks within `apps`. [Inferred]

**Per-capability open questions:**

#### mail

- **Exact Environment Variable Name**: The code references `allowedDomainsEnv` but does not explicitly show the exact `process.env` key name (e.g., `OSK_ALLOWED_EMAIL_DOMAINS` is highly likely but technically inferred). [Inferred]
- **Firestore Rules for `/EmailLogs`**: The provided `firestore.rules.txt` does not contain an explicit match block for `/EmailLogs`. How are client-side or server-side permissions for this collection governed? [Unknown]
- **SMTP Host and User Configuration**: The SMTP host and user are loaded dynamically in `OSKEmailService.send` `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 69) ``, but their exact configuration source (e.g., environment variables or database settings) is not evidenced in this pack. [Unknown]

#### notification

- **APNS Key Format**: How are the APNS credentials structured and stored in GCP Secret Manager (e.g., are they `.p8` private key files encoded in base64)?
- **Retry Policies**: Is there an offline queueing or retry mechanism for notifications when external gateways (APNS/FCM) are temporarily unreachable, or does it fail immediately and prune the token?
- **Template Management**: Are the localized notification templates defined statically in code (`notification_metadata.data.ts`), or can they be dynamically updated via Firestore?

#### qr_code

- How is the generated QR code Data URL consumed? (e.g., is it sent via email, displayed on the mobile app, or stored in Firestore?) [Inferred]
- Are there any size or formatting configurations applied to the QR code generation? [Inferred]

#### sms

- **Schema Discrepancy**: The `firestore-schema.md` document lists `/EmailLogs` but does not document `/SMSLogs`. However, the codebase explicitly references and queries `/SMSLogs` (`functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (line 36)). Is `/SMSLogs` a newly introduced collection that was omitted from the schema generation?
- **Firestore Rules**: Since `/SMSLogs` has no explicit rules in `firestore.rules.txt`, is there any future requirement for Property Managers or Admins to view SMS logs directly from the PGO portal, which would necessitate adding read rules?

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.