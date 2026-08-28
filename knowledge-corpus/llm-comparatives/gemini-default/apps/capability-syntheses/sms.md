# Capability Synthesis — SMS Capability (apps Module)

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.394Z
- **repoName**: firebase-oskey-dev
- **targetModule**: apps
- **capability**: sms
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `sms` capability within the `apps` module provides transactional SMS dispatching, templating, and logging functionality for the Oskey platform. It primarily orchestrates the delivery of external invitations (such as unit and user invitations) via the Twilio API, localizes message content, and maintains an audit trail of sent messages in Firestore. (**Confirmed**; `functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 18-118))

---

## 2. Primary Responsibilities
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

## 3. Public Interfaces (Controllers & Entry Points)
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

## 4. API Contracts & Firestore Triggers
- **API Contracts**: No direct external HTTP API contracts (`api_contract` facts) are registered within this capability's pack.
- **Firestore Triggers**: No Firestore triggers are owned or declared by this capability.

---

## 5. Data Ownership

### Firestore Collections (**Confirmed**)
The capability reads and writes documents within the following Firestore path:

- **Path**: `/SMSLogs/{smsDocId}`
  - **Operation Scope**: Read, Write, Query, Delete (`functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (lines 19-49))
  - **Description**: Stores transaction logs for all dispatched SMS messages. Each document conforms to the `OSKSMSLog` type alias (`functions/src/modules/apps/modules/sms/models/sms_log_document.ts` (lines 8-25)).
  - **Detection Method**: Explicitly queried via `this._query('/SMSLogs', queryFilters)` in `OSKSMSLogController.queryAllSmsDocs` (`functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (line 36)).

---

## 6. Outbound Coupling

### Cross-Module Coupling (**Confirmed**)
The `sms` capability depends on the following external modules:

- **`core` Module**:
  - Imports `OSKDocumentController` from `@oskey/core/controllers/document` to serve as the base class for `OSKSMSLogController` (`functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (line 6)).
  - Imports `OSKLoggingService` (via `@oskey/core/logger`) to log operational info and errors (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 7)).
  - Imports `OSKSecretService` (via `@oskey/core`) to securely fetch Twilio API credentials (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 6)).
  - Imports general core types and models from `@oskey/core` (`functions/src/modules/apps/modules/sms/templates/sms_template.model.ts` (line 6)).

### Intra-Module Coupling (**Confirmed**)
The capability relies on internal relative imports within the `sms` submodule:
- `OSKSMSLogController` imports `OSKSMSLog` from `../models/sms_log_document` (`functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (line 9)).
- `OSKSmsService` imports `OSKSMSLogController` (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 13)), `OSKSMSLog` (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 14)), `OSKSMSOptions` (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 15)), and templates (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 16)).

---

## 7. Permissions & Security
- **RBAC Permissions**: No explicit RBAC permission strings (e.g., `v1.admin...`) are referenced directly in the `sms` capability's code.
- **Firestore Rules Mismatch**: The `firestore.rules.txt` file does not contain any explicit rules for the `/SMSLogs` collection. It only defines rules for `/EmailLogs` and falls back to a default deny rule (`allow read, write: if false;`) for unspecified collections (`firestore.rules.txt` (lines 538-540)). This implies that `/SMSLogs` is inaccessible to client-side SDKs and can only be manipulated by backend services operating with administrative privileges. (**Inferred**)

---

## 8. External Hooks

### Confirmed Integrations (**Confirmed**)
- **Twilio SMS API**:
  - Integrated via the official `twilio` npm package (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 9)).
  - Invokes `client.messages.create` to dispatch SMS payloads (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (line 94)).
- **GCP Secret Manager**:
  - Accessed via `OSKSecretService.getSecret` to retrieve sensitive Twilio credentials (`functions/src/modules/apps/modules/sms/services/sms.service.ts` (lines 66-68)).

---

## 9. Open Questions
- **Schema Discrepancy**: The `firestore-schema.md` document lists `/EmailLogs` but does not document `/SMSLogs`. However, the codebase explicitly references and queries `/SMSLogs` (`functions/src/modules/apps/modules/sms/controllers/sms.controller.ts` (line 36)). Is `/SMSLogs` a newly introduced collection that was omitted from the schema generation?
- **Firestore Rules**: Since `/SMSLogs` has no explicit rules in `firestore.rules.txt`, is there any future requirement for Property Managers or Admins to view SMS logs directly from the PGO portal, which would necessitate adding read rules?