## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.390Z
- **repoName**: firebase-oskey-dev
- **targetModule**: apps
- **capability**: mail
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `mail` capability within the `apps` module provides transactional email dispatching, template rendering, and logging services. It utilizes `nodemailer` to establish SMTP connections, supports localized email templates for various user workflows (such as invitations, OTPs, and onboarding), enforces domain-level filtering for non-production environments, and persists detailed email logs to Firestore. [Confirmed]

## 2. Primary Responsibilities

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

## 3. Public Interfaces (Controllers & Entry Points)

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

## 4. API Contracts & Firestore Triggers
No direct HTTP/REST API endpoints (`api_contract` facts) or Firestore triggers are defined within this capability's pack.

### Resolved API Request/Response Schemas
No `api_contract` requestType/responseType resolved to any `model_property` facts in this evidence scope.

## 5. Data Ownership

### Firestore Collections
- **`/EmailLogs`**
  - **Path**: `/EmailLogs/{id}`
  - **Operations**: Read, Write, Delete `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (lines 19-49) ``.
  - **Confidence**: Confirmed. The `OSKEmailLogController` is explicitly bound to this collection path and performs standard document operations `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (line 36) ``.

## 6. Outbound Coupling

### Intra-module Coupling
There is no outbound coupling to sibling submodules within the `apps` module. [Confirmed]

### Cross-module Coupling
- **`core` Module**:
  - Imports `OSKDocumentController` from `@oskey/core/controllers/document` to serve as the base class for `OSKEmailLogController` `` `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` (line 6) ``. [Confirmed]
  - Imports `OSKLoggingService` from `@oskey/core/logger` for system logging `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 7) ``. [Confirmed]
  - Imports `OSKSecretService` and core types from `@oskey/core` to retrieve SMTP credentials `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 6) ``. [Confirmed]

### Third-Party / External Coupling
- **`nodemailer`**: Used for SMTP transport creation and email dispatching `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 10) ``. [Confirmed]
- **`nodemailer/lib/smtp-transport`**: Used for SMTP transport type definitions `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 11) ``. [Confirmed]
- **`firebase-admin/firestore`**: Used for Firestore database types and operations `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 8) ``. [Confirmed]
- **`firebase-functions/v1/https`**: Used for HTTPS function types `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 9) ``. [Confirmed]

## 7. Permissions & Security
- No explicit RBAC permission strings are referenced or checked within the `mail` capability's code files. [Confirmed]
- **Firestore Rules Cross-Check**:
  - According to `firestore.rules.txt` (lines 531-534), read and write access to `/settings/{docId}` is allowed if `isValidUser()`. However, the `/EmailLogs` collection does not have an explicit rule block in the provided `firestore.rules.txt`. It falls back to the default rule `allow read, write: if false;` (lines 523-525) unless handled by administrative privileges or another rule not captured in this pack. [Inferred]

## 8. External Hooks

### Confirmed Integrations
- **SMTP Server / Mailtrap**: Integrates with an external SMTP server to dispatch transactional emails. The SMTP password is dynamically fetched using `OSKSecretService.getSecret(OSKApiName.MailtrapPassApiKey)` `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 63, 69) ``. [Confirmed]

### Environment Variables
- **`OSK_ALLOWED_EMAIL_DOMAINS`**: (Inferred from `allowedDomainsEnv` variable) Used to restrict email dispatch to specific domains in non-production environments `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (lines 34-52) ``. [Confirmed]

## 9. Open Questions
- **Exact Environment Variable Name**: The code references `allowedDomainsEnv` but does not explicitly show the exact `process.env` key name (e.g., `OSK_ALLOWED_EMAIL_DOMAINS` is highly likely but technically inferred). [Inferred]
- **Firestore Rules for `/EmailLogs`**: The provided `firestore.rules.txt` does not contain an explicit match block for `/EmailLogs`. How are client-side or server-side permissions for this collection governed? [Unknown]
- **SMTP Host and User Configuration**: The SMTP host and user are loaded dynamically in `OSKEmailService.send` `` `functions/src/modules/apps/modules/mail/services/email.service.ts` (line 69) ``, but their exact configuration source (e.g., environment variables or database settings) is not evidenced in this pack. [Unknown]