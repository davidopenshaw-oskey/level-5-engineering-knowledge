### 0. Generation Metadata

- **runId**: `20260829_081559-00e1d9fd`
- **generatedAt**: `2026-08-29T13:32:37.999Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `apps`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `apps` module serves as the centralized utility, notification, and transactional communications engine for the Oskey platform. It provides unified, multi-channel dispatch capabilities—routing messages across Apple Push Notification service (APNS), Firebase Cloud Messaging (FCM), transactional email, and SMS—based on user preferences and metadata. Additionally, it encapsulates core utility services such as programmatic QR code generation for inhabitant onboarding. By isolating communication protocols and external gateway integrations (Twilio, APNS, FCM, Nodemailer) from core business logic, the module ensures that other platform domains can trigger alerts, emails, and SMS messages through a standardized, decoupled interface. **Confirmed**.

### 2. Architectural Position

The `apps` module sits as a shared application-service and infrastructure layer within the Oskey platform. It is positioned below high-level business-logic modules (such as `organization` and `user`) which consume its services, and above the `core` module, which it relies upon for database persistence, logging, and secret management. **Confirmed**.

- **Parent Scope**: Platform-wide shared utility and communication services. **Inferred**.
- **Owned Concepts**: Transactional communication logs (`/EmailLogs`, `/SMSLogs`), multi-channel notification dispatch routing, localized communication templates, and QR code generation utilities. **Confirmed**.
- **Provided Capabilities**: 
  - Transactional email delivery and logging (`mail`). **Confirmed**.
  - Transactional SMS delivery and logging (`sms`). **Confirmed**.
  - Unified push, email, and SMS notification dispatching (`notification`). **Confirmed**.
  - Programmatic QR code generation (`qr_code`). **Confirmed**.

### 3. Primary Responsibilities

#### mail

- **Email Dispatching & SMTP Integration**: Sends transactional emails using Nodemailer SMTP transport, resolving credentials via `OSKSecretService` (specifically `OSKApiName.MailtrapPassApiKey`) [Confirmed] `` `call_expression|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|OSKSecretService.getSecret|send|OSKApiName.MailtrapPassApiKey|#1` ``.
- **Recipient Validation & Domain Filtering**: Validates recipient email format (checks for `@`) and filters outbound emails against an allowed domains list parsed from environment variables (`allowedDomainsEnv`) to silently bypass non-allowed domains in non-production/restricted environments [Confirmed] `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 34-52) ``.
- **Template Rendering & Localization**: Supports localized email templates (e.g., English, French) and replaces placeholders (e.g., `${emailBody}` or custom template parameters) in both HTML and text formats [Confirmed] `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 75-112) ``.
- **Email Logging**: Persists email metadata, status, and responses (accepted, rejected, pending, envelope, error) to the `/EmailLogs` Firestore collection [Confirmed] `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 146-188) ``.
- **Email Log Management**: Provides CRUD and query capabilities for email logs via `OSKEmailLogController` [Confirmed] `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (lines 11-49) ``.

#### notification

### Multi-Channel Notification Routing
Orchestrates dispatching notifications across push, email, and SMS channels based on metadata configurations and user preferences. `` `functions/src/modules/apps/modules/notification/services/notification.service.ts` (lines 28-62) `` [Confirmed]

### Apple Push Notification service (APNS) Integration
Directly interfaces with APNS using `@parse/node-apn` to send standard and VoIP push notifications to iOS and watchOS devices, using environment-specific API keys (development vs. production) retrieved from a secret manager. `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (lines 36-118) `` [Confirmed]

### Firebase Cloud Messaging (FCM) Integration
Interfaces with Firebase Admin SDK to send push notifications to Android devices. `` `functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts` (lines 20-35) `` [Confirmed]

### Stale Token Pruning
Automatically detects failed push notification deliveries (due to invalid or expired tokens) and triggers deletion of the stale tokens from the user's profile. `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKUserNotificationTokenController.default.delete|_send|userId,token.tokenId|#1` ``, `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|OSKUserNotificationTokenController.default.delete|_send|_userId,_tokenId|#1` `` [Confirmed]

### Template Interpolation
Dynamically replaces placeholders (e.g., `${key}`) in notification titles and bodies with runtime data. `` `functions/src/modules/apps/modules/notification/services/notification.service.ts` (lines 296-302) `` [Confirmed]

### VoIP / Special Call Signaling
Supports low-latency VoIP push notifications specifically mapped for iOS/watchOS VoIP tokens and Android FCM tokens to handle real-time call signaling. `` `functions/src/modules/apps/modules/notification/services/notification.service.ts` (lines 304-375) `` [Confirmed]

---

#### qr_code

- **QR Code Generation**: Converts a string-based activation code into a base64-encoded QR code data URL [Confirmed] (`` `call_expression|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|QRCode.toDataURL|generateQR|activationCode|#1` ``).
- **Error Handling & Logging**: Catches exceptions thrown during the QR code generation process and logs them using the platform's standard logging service [Confirmed] (`` `call_expression|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|OSKQRcodeService.logger.logError|generateQR|`Error while generating QR code: ${JSON.stringify(error)}`,{ error }|#1` ``).

---

#### sms

- **SMS Dispatch via Twilio**: Sends SMS messages using the Twilio client based on structured templates (e.g., `OSKSMSExternalUnitInvitationTemplate`, `OSKSMSExternalUserInvitationTemplate`) `` `functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 59-118) ``. It dynamically retrieves Twilio credentials (`TwilioAccountSID`, `TwilioAuthToken`, `TwilioMessagingServiceSID`) via the core secret service `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|OSKSecretService.getSecret|sendSms|OSKApiName.TwilioAccountSID|#1` ``. [Confirmed]
- **SMS Transaction Logging**: Logs successful and failed SMS delivery attempts to Firestore under the `/SMSLogs` collection `` `call_expression|apps|functions/src/modules/apps/modules/sms/controllers/sms.controller.ts|this._query|queryAllSmsDocs|'/SMSLogs',queryFilters|#1` ``. [Confirmed]
- **Template Parsing**: Manages and parses SMS templates, replacing placeholders such as `${inviterName}` with runtime parameters `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|messageText.replace|sendSms|'${inviterName}',options.template.params.inviterName|#1` ``. [Confirmed]
- **SMS Log Administration**: Exposes administrative CRUD-like operations for SMS logs via a document controller `` `functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (lines 11-49) ``. [Confirmed]

### 4. Public Interfaces

#### mail

- **`OSKEmailLogController`** (Class): Controller managing Firestore operations on the `/EmailLogs` collection, extending `OSKDocumentController` [Confirmed] `` `source_class|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|OSKEmailLogController` ``.
- **`OSKEmailService`** (Class): Service providing the main entry point for sending emails (`send`) and logging them (`logMailMessage`) [Confirmed] `` `source_class|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|OSKEmailService` ``.

#### notification

This capability does not directly expose HTTP controllers. Instead, it exposes internal services used by other modules:

### OSKNotificationService
The primary entry point for sending standard and special (VoIP) notifications. `` `functions/src/modules/apps/modules/notification/services/notification.service.ts` (line 23) `` [Confirmed]

### OSKAPNSService
Internal service for APNS push delivery. `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (line 11) `` [Confirmed]

### OSKFirebaseCloudMessagingService
Internal service for FCM push delivery. `` `functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts` (line 11) `` [Confirmed]

---

#### qr_code

- **OSKQRcodeService**: The primary service class containing the business logic for QR code generation [Confirmed] (`` `source_class|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|OSKQRcodeService` ``).
  - `generateQR(activationCode: string)`: Generates a QR code data URL from the provided activation code [Confirmed] (`` `service_method|apps|functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts|OSKQRcodeService|generateQR|#1` ``).
- **Submodule Entry Point**: The service is exported via the submodule index file, making it available to other parts of the application [Confirmed] (`` `exported_symbol|apps|functions/src/modules/apps/modules/qr_code/index.ts|./services/qr.code.service|#1` ``).

---

#### sms

- **`OSKSMSLogController`** (extends `OSKDocumentController`): Exposes endpoints and methods to manage SMS logs, including `get`, `getAll`, `save`, `update`, `delete`, `listDocuments`, and `queryAllSmsDocs` `` `functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (lines 11-49) ``. [Confirmed]
- **`OSKSmsService`**: Exposes the primary service methods `sendSms` and `logSms` used by other modules to dispatch and record SMS notifications `` `functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 18-118) ``. [Confirmed]

### 5. Internal Structure

*Note: This section contains the intra-module coupling analysis only.*

The `apps` module is composed of four submodules: `mail`, `sms`, `notification`, and `qr_code`. The internal dependency structure is strictly hierarchical, positioning `notification` as an orchestrator over the leaf communication channels:

- **Notification Orchestration**: The `notification` submodule depends directly on both `mail` and `sms` to execute multi-channel dispatching. **Confirmed**.
  - `notification` imports `OSKEmailTemplateId`, `OSKEmailOptions`, and `OSKEmailService` from `@oskey/apps/mail` to handle email-based notifications. **Confirmed**.
  - `notification` imports `OSKSMSTemplateId` and `OSKSmsService` from `@oskey/apps/sms` (via relative paths to the SMS template models) to handle SMS-based notifications. **Confirmed**.
- **Leaf Submodules**: The `mail` and `sms` submodules maintain zero outbound intra-module dependencies, acting as isolated, single-purpose channel processors. **Confirmed**.
- **Utility Isolation**: The `qr_code` submodule operates as a completely decoupled utility, exhibiting zero intra-module coupling with `mail`, `sms`, or `notification`. **Confirmed**.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains the data ownership conclusion only.*

The `apps` module is the authoritative system of record for transactional communication history on the platform. It owns and manages two primary collections:
- **`/EmailLogs`**: Owned exclusively by the `mail` submodule. All reads, writes, queries, and deletions are managed via `OSKEmailLogController`. **Confirmed**.
- **`/SMSLogs`**: Owned exclusively by the `sms` submodule. All transaction tracking is managed via `OSKSMSLogController`. **Confirmed**.

**Ownership Conclusion**: 
While external business modules (such as `organization` and `user`) frequently trigger emails and notifications, they do so strictly by calling the public interfaces of `OSKEmailService` and `OSKNotificationService`. They do not write directly to `/EmailLogs` or `/SMSLogs`. Therefore, database-level ownership of transactional communication logs remains entirely within the `apps` module. **Inferred**. 

Conversely, the `notification` submodule does not own any Firestore collections directly, but it executes targeted deletions on `/users/{userId}/notificationTokens/{tokenId}` via the `user` module's `OSKUserNotificationTokenController` when a delivery failure indicates a token is stale or invalid. **Confirmed**.

**Per-capability evidence:**

#### mail

- **Firestore Collection**: `/EmailLogs` [Confirmed]
  - **Operations**: Read, Write, Query, Delete. [Confirmed]
  - **Evidence**:
    - `this._query` call to `'/EmailLogs'` in `queryAllSmsDocs` [Confirmed] `` `call_expression|apps|functions/src/modules/apps/modules/mail/controllers/email.controller.ts|this._query|queryAllSmsDocs|'/EmailLogs',queryFilters|#1` ``.
    - `OSKEmailLogController` methods map to `OSKDocumentController` operations targeting `OSKEmailLogController.collection` [Confirmed] `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (lines 19-49) ``.
    - Firestore schema document lists `/EmailLogs` with fields: `emailDocId`, `sender`, `recipients`, `text`, `html`, `creationDate`, `messageId`, `envelope`, `accepted`, `rejected`, `pending`, `response`. [Confirmed]

#### notification

This capability does not directly write to or own any Firestore collections. It reads user notification tokens and deletes them upon delivery failure.

### Paths Touched (Indirectly via Controllers)
- `/users/{userId}/notificationTokens/{tokenId}` (Delete operation triggered on delivery failure via `OSKUserNotificationTokenController`). `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|OSKUserNotificationTokenController.default.delete|_send|userId,token.tokenId|#1` ``, `` `call_expression|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|OSKUserNotificationTokenController.default.delete|_send|_userId,_tokenId|#1` `` [Confirmed]

---

#### qr_code

- This capability does not directly read, write, or own any Firestore collections or documents based on the provided evidence [Confirmed].

---

#### sms

- **`/SMSLogs`**: This capability reads and writes to the `/SMSLogs` collection in Firestore to track SMS transaction history `` `call_expression|apps|functions/src/modules/apps/modules/sms/controllers/sms.controller.ts|this._query|queryAllSmsDocs|'/SMSLogs',queryFilters|#1` ``. [Confirmed]
  - *Operation Detection Scope*: Read/Write (via `_get`, `_set`, `_update`, `_delete`, `_query` in `OSKSMSLogController`).

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### mail

- No API contracts (`api_contract` facts) or Firestore triggers are directly owned or defined in this capability's evidence pack. [Confirmed]
- **Resolved API Request/Response Schemas**: No `api_contract` requestType/responseType resolved to any `model_property` facts in this evidence scope. [Confirmed]

#### notification

- No API contracts (`api_contract` facts) or Firestore triggers are owned by this capability. [Confirmed]
- No resolved API request/response schemas are present. [Confirmed]

---

#### qr_code

- No API contracts or Firestore triggers are defined or owned directly within this capability's evidence scope [Confirmed].

---

#### sms

No API contracts or Firestore triggers are evidenced in this capability's pack. [Confirmed]

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains cross-cutting risk callouts only.*

An analysis of the submodules within `apps` reveals a complete absence of internal Role-Based Access Control (RBAC) checks, relying instead on infrastructure-level boundaries and default-deny database rules:

- **Mental Enforcement Tally**:
  - `mail`: 0 RBAC checks enforced. **Confirmed**.
  - `sms`: 0 RBAC checks enforced. **Confirmed**.
  - `notification`: 0 RBAC checks enforced. **Confirmed**.
  - `qr_code`: 0 RBAC checks enforced. **Confirmed**.

- **Cross-Cutting Security Risks**:
  - **Unprotected Controller Endpoints**: The controllers exposing CRUD operations for `/EmailLogs` (`OSKEmailLogController`) and `/SMSLogs` (`OSKSMSLogController`) do not verify any administrative or organizational permissions (e.g., `v1.admin.user.view` or similar) before executing queries or deletions. **Confirmed**.
  - **Implicit Trust of Cross-Module Callers**: The public service methods (`OSKEmailService.send`, `OSKNotificationService.send`) implicitly trust any calling module. There is no rate-limiting, sender verification, or permission validation at the service boundary to prevent a compromised sibling module from sending unauthorized platform-wide emails or SMS messages. **Inferred**.
  - **Cross-Boundary Token Deletion**: The `notification` submodule's ability to directly delete documents in `/users/{userId}/notificationTokens/{tokenId}` upon APNS/FCM delivery failure bypasses standard user-scoped write boundaries. Because this write operation is triggered automatically by external gateway responses, a malformed or spoofed gateway failure could be exploited to prune valid user notification tokens. **Inferred**.

**Per-capability evidence:**

#### mail

- No specific permission strings (e.g., `v1.admin...` or `v1.org...`) are explicitly referenced or checked within the provided `mail` capability evidence. [Confirmed]
- **Firestore Rules Context**: The `firestore.rules.txt` file does not contain a specific match rule for `/EmailLogs`, meaning it falls back to the default rule `allow read, write: if false;` unless handled elsewhere or if `/EmailLogs` is accessed strictly via Admin SDK (which bypasses security rules). [Inferred]

#### notification

- No explicit permission strings are referenced in this capability's evidence. [Confirmed]
- Security is handled at the transport/infrastructure level (APNS/FCM credentials and Auth0/GCP secrets). [Inferred]

---

#### qr_code

- No permission strings or security rules are referenced or enforced within this capability's evidence [Confirmed].

---

#### sms

No explicit RBAC permission strings are referenced in this capability's evidence pack. [Confirmed]

*Cross-check against `firestore.rules.txt`*: The `/SMSLogs` collection is not explicitly defined in `firestore.rules.txt`, meaning it falls under the default deny rule (`allow read, write: if false;`) unless accessed via administrative SDK privileges. [Inferred]

### 10. Cross-Module Relationships

The `apps` module maintains well-defined inbound and outbound boundaries with other modules in the repository:

#### Outbound Dependencies
- **`core`**: **Confirmed**. The `apps` module relies heavily on `core` for base controller architecture, logging, and secret management:
  - Inherits standardized Firestore CRUD operations by extending `OSKDocumentController` in both `OSKEmailLogController` and `OSKSMSLogController`.
  - Utilizes `OSKLoggingService` (`logError`, `logInfo`, `logWarning`, `logDebug`) across all submodules for system diagnostics.
  - Consumes `OSKSecretService.getSecret` to retrieve sensitive API credentials for APNS, FCM, and Twilio.
- **`user`**: **Confirmed**. The `notification` submodule depends on `user` to manage device-level push targets:
  - Calls `OSKUserNotificationTokenController.getAll` to retrieve active device tokens for a given user.
  - Calls `OSKUserNotificationTokenController.delete` to prune dead or invalid tokens from the user's profile.
- **`call`**: **Confirmed**. The `notification` submodule imports `OSKICEServers` from the `call` module to package WebRTC/VoIP signaling metadata within low-latency push payloads.

#### Inbound Dependencies
- **`organization`**: **Confirmed**. Consumes utility and communication services:
  - Calls `OSKEmailService.send` to dispatch onboarding invitations and administrative emails.
  - Calls `OSKQRcodeService.generateQR` to generate physical onboarding QR codes for new inhabitants.
- **`user`**: **Confirmed**. Consumes communication services:
  - Calls `OSKNotificationService.send` and `sendSpecial` to dispatch push, SMS, or email alerts based on user-configured preferences.
  - Calls `OSKEmailService.send` to deliver transactional user emails.

### 11. External Hooks

#### mail

- **Confirmed Integrations**:
  - **SMTP Provider (Mailtrap / External SMTP)**: Integrated via `nodemailer` to send emails [Confirmed] `` `imports_dependency|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|nodemailer|#1` ``.
  - **Secret Manager**: Fetches SMTP credentials (e.g., `MailtrapPassApiKey`) via `OSKSecretService.getSecret` [Confirmed] `` `call_expression|apps|functions/src/modules/apps/modules/mail/services/email.service.ts|OSKSecretService.getSecret|send|OSKApiName.MailtrapPassApiKey|#1` ``.
- **Environment Variables**:
  - `OSK_ALLOWED_EMAIL_DOMAINS` (or similar, parsed as `allowedDomainsEnv` in code) to restrict outbound email domains [Confirmed] `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 34) ``.

#### notification

### Confirmed Integrations
- **Apple Push Notification service (APNS)**: Confirmed external integration via `@parse/node-apn` to send push notifications. `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/apns.service.ts|@parse/node-apn|#1` `` [Confirmed]
- **Firebase Cloud Messaging (FCM)**: Confirmed external integration via `firebase-admin/messaging` to send push notifications. `` `imports_dependency|apps|functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts|firebase-admin/messaging|#1` `` [Confirmed]

### Environment Variables & Secrets
- `OSK_APNS_API_KEY_ID`: APNS API Key ID. `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (line 109) `` [Confirmed]
- `OSK_APPLE_TEAM_ID`: Apple Team ID. `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (line 109) `` [Confirmed]
- `APNSDevelopmentAPIKey` / `APNSProductionAPIKey`: Secrets retrieved via `OSKSecretService`. `` `functions/src/modules/apps/modules/notification/services/apns.service.ts` (lines 46-47) `` [Confirmed]

---

#### qr_code

- No external hooks, Pub/Sub topics, environment variables, or storage paths are evidenced within this capability's pack [Confirmed].

---

#### sms

- **Twilio SMS API**: Integrates with Twilio to send SMS messages `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|client.messages.create|sendSms|{                 body: messageText,                 to: options.template.params.recipientPhone,                 messagingServiceSid: messagingServiceSid,             }|#1` ``. [Confirmed]
- **GCP Secret Manager**: Retrieves Twilio credentials (`TwilioAccountSID`, `TwilioAuthToken`, `TwilioMessagingServiceSID`) dynamically at runtime `` `call_expression|apps|functions/src/modules/apps/modules/sms/services/sms.service.ts|OSKSecretService.getSecret|sendSms|OSKApiName.TwilioAccountSID|#1` ``. [Confirmed]

### 12. Architectural Observations

- **Decoupled Channel Architecture**: The module successfully implements a clean separation of concerns. The orchestrating `notification` submodule is entirely decoupled from the low-level transport mechanics of `mail` and `sms`. This allows the platform to add or modify communication channels (e.g., swapping Twilio for another SMS provider) without impacting the core notification dispatch logic. **Inferred**.
- **Dependency Inversion via Core**: By extending `OSKDocumentController` from the `core` module, the `apps` controllers inherit robust, standardized Firestore query and transaction behaviors. This prevents code duplication and ensures that logging and persistence patterns remain uniform across the codebase. **Inferred**.
- **Asynchronous IoT Decoupling**: In alignment with the platform's edge-activity principles, the `apps` module acts as an asynchronous bridge. Business modules trigger communication intents, and `apps` handles the latency-heavy external API calls (APNS, FCM, Twilio) asynchronously, ensuring that user-facing transactions are not blocked by external network latency. **Inferred**.

### 13. Risks & Open Questions

**Cross-cutting risks:**

*Note: This section contains cross-cutting risks and system-level open questions only.*

- **Missing Schema Definition for `/SMSLogs`**: While `sms.controller.ts` actively queries and writes to the `/SMSLogs` collection (**Confirmed**), this collection is completely absent from the authoritative `firestore-schema.md` (**Confirmed**). This indicates a documentation gap or an out-of-sync schema map.
- **Undefined Security Rules for Communication Logs**: Neither `/EmailLogs` nor `/SMSLogs` has explicit rules defined in `firestore.rules.txt` (**Confirmed**). While they currently fall back to the default-deny rule (`allow read, write: if false;`), any future requirement to expose communication history to Property Managers via the PGO portal will require manual rules updates, posing a risk of accidental data exposure if not scoped strictly. **Inferred**.
- **Aggressive Token Pruning**: When APNS or FCM returns a delivery failure, the `notification` service immediately deletes the corresponding token via `OSKUserNotificationTokenController.delete` (**Confirmed**). If a transient network failure or temporary gateway outage is misinterpreted as a permanent failure, valid user tokens will be aggressively deleted, resulting in silent notification failures until the user re-launches the mobile application. **Inferred**.
- **Lack of Rate-Limiting or Quota Enforcement**: Because the communication services (`OSKEmailService`, `OSKSmsService`) lack internal rate-limiting or caller validation, a bug or compromise in a calling module (e.g., an infinite loop in `organization` onboarding) could result in rapid exhaustion of Twilio or email sending quotas, leading to platform-wide communication blackouts. **Inferred**.

**Per-capability open questions:**

#### mail

- **How is the `/EmailLogs` collection secured?** The `firestore.rules.txt` does not define explicit rules for `/EmailLogs`, suggesting it might only be written to/read from via backend Cloud Functions using the Firebase Admin SDK. [Inferred]
- **What is the exact environment variable name used for `allowedDomainsEnv`?** The evidence shows the variable is split and mapped, but the exact string key (e.g., `process.env.OSK_ALLOWED_EMAIL_DOMAINS`) is not explicitly detailed in the facts. [Inferred]

#### notification

- How are user notification preferences (e.g., opting out of SMS or Email) stored and evaluated before dispatching? The evidence shows `_handleEmailNotifications` and `_handleSmsNotifications` are called, but the exact preference-checking logic is not fully detailed in this submodule's code. [Unknown]
- Are there retry mechanisms for transient network failures when communicating with APNS or FCM, or does any failure immediately result in token deletion? [Unknown]

#### qr_code

- **Consumer of QR Codes**: How is the generated QR code data URL consumed? (e.g., Is it returned directly to a client via an API, embedded in an onboarding email, or saved to a database?) [Unknown]
- **QR Code Configuration**: Are there specific styling, sizing, or error-correction configurations applied to the generated QR codes that are not captured in the basic call expression? [Unknown]

#### sms

- The `/SMSLogs` collection is queried in `sms.controller.ts` but is not defined in the provided `firestore-schema.md` (which only lists `/EmailLogs`). Is `/SMSLogs` a newly introduced collection, or does it map to `/EmailLogs` under some alias? [Inferred]
- There are no explicit security rules for `/SMSLogs` in `firestore.rules.txt`. Is access to `/SMSLogs` restricted entirely to backend/admin service calls? [Inferred]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.