# apps Engineering Module Profile

## 1. Executive Summary

### Interpretation

The `apps` module is a shared application-communications module for the Oskey Cloud Functions backend. Evidence indicates that it provides email delivery, SMS delivery, push notification dispatch, special call-related notification dispatch, QR code generation, and persistence for at least email delivery logs.

Within the Oskey platform architecture, this module sits in the client-facing backend layer rather than in a physical-building ownership scope. It supports user-facing workflows initiated elsewhere by producing communication side effects through external providers such as SMTP/Mailtrap, APNS, Firebase Cloud Messaging, Twilio, and QR code generation. The evidence does not show this module owning access-control, organization, entity, property, building, unit, or hardware state.

### Evidence Used

- Architecture: GCP Cloud Functions are the primary API gateway and compute layer for mobile applications and the PGO portal.
- Service: `OSKEmailService`, `functions/src/modules/apps/modules/mail/services/email.service.ts`
- Service: `OSKSmsService`, `functions/src/modules/apps/modules/sms/services/sms.service.ts`
- Service: `OSKNotificationService`, `functions/src/modules/apps/modules/notification/services/notification.service.ts`
- Service: `OSKAPNSService`, `functions/src/modules/apps/modules/notification/services/apns.service.ts`
- Service: `OSKFirebaseCloudMessagingService`, `functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts`
- Service: `OSKQRcodeService`, `functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts`
- Controller: `OSKEmailLogController`, `functions/src/modules/apps/modules/mail/controllers/email.controller.ts`
- Firestore Path: `/EmailLogs`, `email.controller.ts`, lines 13 and 36
- Manifest: `apps-manifest.json` reports 34 files, 6 services, 2 controllers, 0 Firestore triggers, and 0 permission hints.

### Confidence

High for module responsibilities and communication role. Medium for broader architectural position because module consumers are not fully enumerated in the supplied evidence.

---

## 2. Architectural Position

- Parent scope: Shared backend application services under `functions/src/modules/apps`.
- Owned concepts: email options/templates/log records, SMS options/templates/log model/controller, notification metadata/options/types, APNS/FCM token dispatch handling, QR code generation.
- Provided capabilities: email send/log, SMS send/log, push notification dispatch, special call/VoIP-style notification dispatch, QR code data URL generation.
- Downstream consumers or candidate consumers: mobile apps and PGO workflows are candidate consumers through Cloud Functions; APNS, FCM, SMTP/Mailtrap, Twilio, and QR code generation are confirmed external/provider boundaries from AST evidence.
- Confidence: Medium-high.

### Interpretation

The module is positioned as a reusable communications and utility layer. It does not appear to enforce domain RBAC itself and does not expose Firestore document triggers. Other modules likely call its exported services to notify users during onboarding, invitations, organization invitations, unit invitations, user OTP flows, or intercom/call-related events, but those initiating workflows are outside the supplied `apps` module evidence.

Architecture grounding places Cloud Functions as the backend layer for mobile apps and PGO. The `apps` module implements cross-cutting communication services inside that backend layer.

### Evidence Used

- Architecture: Cloud Functions are modularized into domain modules and serve mobile applications and PGO.
- Exported Symbol: `OSKEmailService`, `functions/src/modules/apps/modules/mail/index.ts`
- Exported Symbol: `OSKSmsService`, `functions/src/modules/apps/modules/sms/index.ts`
- Exported Symbol: `OSKNotificationService`, `functions/src/modules/apps/modules/notification/index.ts`
- Exported Symbol: `OSKQRcodeService`, `functions/src/modules/apps/modules/qr_code/index.ts`
- Cross-module dependency: `notification_options.model.ts` imports `OSKICEServers` from `src/modules/call/models/shared/ice_servers.model`.
- Import evidence: `OSKNotificationService` imports `@oskey/apps/mail`, `@oskey/apps/sms`, `@oskey/user/notification`, `@parse/node-apn`, and `firebase-admin/messaging`.

### Confidence

Medium-high.

---

## 3. Primary Responsibilities

- Capability: Send and log email messages.
- Implemented by:
  * Controller: `OSKEmailLogController`
  * Service: `OSKEmailService`
  * Representative Service Method: `send(options: OSKEmailOptions)`, `logMailMessage(emailResponse, message)`
- Evidence:
  * Firestore Path: `/EmailLogs`
  * Call: `createTransport(...)`, `email.service.ts`, line 69
  * Call: `transport.sendMail(message)`, `email.service.ts`, line 134
  * Call: `OSKEmailLogController.default.save(emailDocId, logMessage)`, `email.service.ts`, line 188
  * Schema: `/EmailLogs` contains sender, recipients, text, html, creationDate, messageId, envelope, accepted, rejected, pending, and response fields.
- Confidence: High.

- Capability: Send and log SMS messages.
- Implemented by:
  * Controller: `OSKSMSLogController`
  * Service: `OSKSmsService`
  * Representative Service Method: `sendSms(options: OSKSMSOptions)`, `logSms(options, messageText, response)`
- Evidence:
  * Call: `OSKSecretService.getSecret(OSKApiName.TwilioAccountSID)`, `sms.service.ts`, line 66
  * Call: `OSKSecretService.getSecret(OSKApiName.TwilioAuthToken)`, `sms.service.ts`, line 67
  * Call: `OSKSecretService.getSecret(OSKApiName.TwilioMessagingServiceSID)`, `sms.service.ts`, line 68
  * Call: `twilio(accountSid, authToken)`, `sms.service.ts`, line 88
  * Call: `client.messages.create(...)`, `sms.service.ts`, line 94
  * Call: `OSKSMSLogController.default.save(smsDocId, smsLogRecord)`, `sms.service.ts`, line 56
- Confidence: High for SMS dispatch and log-controller use; medium for persistence path because no SMS Firestore path hint was captured.

- Capability: Dispatch push notifications across APNS and Firebase Cloud Messaging.
- Implemented by:
  * Controller: none in this module; token persistence is delegated to user notification controllers.
  * Service: `OSKNotificationService`, `OSKAPNSService`, `OSKFirebaseCloudMessagingService`
  * Representative Service Method: `send(userId, notificationId, options)`, `_handlePushNotifications(...)`, `_sendApns(...)`, `_sendFcm(...)`
- Evidence:
  * Call: `OSKUserNotificationTokenController.default.getAll(userId)`, `notification.service.ts`, line 75
  * Call: `OSKAPNSService.default.send(userId, apnsTokens, notification)`, `notification.service.ts`, line 157
  * Call: `OSKFirebaseCloudMessagingService.default.send(userId, fcmToken.tokenId, message)`, `notification.service.ts`, line 200
  * Call: `apn.send(notification, tokens.map(...))`, `apns.service.ts`, line 67
  * Call: `messaging().send(message)`, `firebase_cloud_messaging.service.ts`, line 22
- Confidence: High.

- Capability: Dispatch email and SMS notifications from notification metadata.
- Implemented by:
  * Controller: `OSKEmailLogController` and `OSKSMSLogController` indirectly through service calls.
  * Service: `OSKNotificationService`
  * Representative Service Method: `_handleEmailNotifications(...)`, `_handleSmsNotifications(...)`
- Evidence:
  * Call: `OSKEmailService.default.send(emailOptions)`, `notification.service.ts`, line 256
  * Call: `OSKSmsService.default.sendSms(...)` with `externalSMSUserInvitationReceived`, `notification.service.ts`, line 276
  * Call: `OSKSmsService.default.sendSms(...)` with `externalSMSUnitInvitationReceived`, `notification.service.ts`, line 285
  * Exported Symbol: `notificationMetadata`, `notification/data/notification_metadata.data.ts`
- Confidence: High.

- Capability: Generate QR code data URLs.
- Implemented by:
  * Controller: none evidenced.
  * Service: `OSKQRcodeService`
  * Representative Service Method: `generateQR(activationCode)`
- Evidence:
  * Call: `QRCode.toDataURL(activationCode)`, `qr.code.service.ts`, line 9
  * Service Method: `OSKQRcodeService.generateQR`
- Confidence: High.

### Interpretation

The module centralizes outbound application communication and supporting presentation utilities. It composes template metadata, recipient/channel settings, delivery-provider calls, and delivery logging. It is not evidenced as a domain lifecycle module.

### Evidence Used

- Service Methods: `OSKEmailService.send`, `OSKEmailService.logMailMessage`, `OSKSmsService.sendSms`, `OSKSmsService.logSms`, `OSKNotificationService.send`, `OSKNotificationService.sendSpecial`, `OSKQRcodeService.generateQR`
- Controllers: `OSKEmailLogController`, `OSKSMSLogController`
- External calls: `transport.sendMail`, `client.messages.create`, `apn.send`, `messaging().send`, `QRCode.toDataURL`

### Confidence

High.

---

## 4. Public Interfaces

### Interpretation

The public module interface is service-oriented. The module exports communication services and option/model types through submodule index files. The controller interfaces are Firestore document-controller abstractions for delivery logs, with standard `generateDocId`, `getAll`, `get`, `update`, `save`, `delete`, and `listDocuments` methods.

No callable Cloud Function entry points or HTTP endpoints are evidenced inside this module. The evidence instead indicates that other backend modules import and call these services.

### Evidence Used

- Exported Symbol: `OSKEmailService`, `OSKEmailOptions`, `OSKEmailTemplate`, `OSKEmailTemplateId`
- Exported Symbol: `OSKSmsService`, `OSKSMSSendOptions`
- Exported Symbol: `OSKNotificationService`, `OSKNotificationOptions`, `OSKSpecialNotificationOptions`, `OSKNotificationType`, `OSKSpecialNotificationType`, `OSKAllNotificationType`
- Exported Symbol: `OSKQRcodeService`
- Controller Method: `OSKEmailLogController.generateDocId`, `getAll`, `get`, `update`, `queryAllSmsDocs`, `save`, `delete`, `listDocuments`
- Controller Method: `OSKSMSLogController.generateDocId`, `getAll`, `get`, `update`, `queryAllSmsDocs`, `save`, `delete`, `listDocuments`
- Service Method: `OSKNotificationService.sendSpecial(userId, notificationId, options)`

### Confidence

High.

---

## 5. Internal Structure

### Interpretation

The module is decomposed into four submodules:

- `mail`: email models, templates, email delivery service, and email log controller.
- `sms`: SMS models, SMS templates, SMS delivery service, and SMS log controller.
- `notification`: notification metadata, notification option/type models, orchestration service, APNS service, and FCM service.
- `qr_code`: QR code generation service.

The notification submodule orchestrates channel-specific services rather than sending all channels directly. Push token lookup and token cleanup are delegated to `@oskey/user/notification` controllers. Email and SMS delivery are delegated to the module's own mail and SMS services.

### Evidence Used

- Source File: `functions/src/modules/apps/modules/mail/services/email.service.ts`
- Source File: `functions/src/modules/apps/modules/mail/templates/index.ts`
- Source File: `functions/src/modules/apps/modules/sms/services/sms.service.ts`
- Source File: `functions/src/modules/apps/modules/sms/templates/index.ts`
- Source File: `functions/src/modules/apps/modules/notification/services/notification.service.ts`
- Source File: `functions/src/modules/apps/modules/notification/services/apns.service.ts`
- Source File: `functions/src/modules/apps/modules/notification/services/firebase_cloud_messaging.service.ts`
- Source File: `functions/src/modules/apps/modules/qr_code/services/qr.code.service.ts`
- Call: `OSKNotificationService.default._sendApns(...)`, line 108
- Call: `OSKNotificationService.default._sendFcm(...)`, line 112
- Call: `OSKEmailService.default.send(emailOptions)`, line 256
- Call: `OSKSmsService.default.sendSms(...)`, lines 276 and 285

### Confidence

High.

---

## 6. Firestore & Data Ownership

### Interpretation

Primary confirmed persistence is email delivery logging under `/EmailLogs`. The `OSKEmailLogController` is a Firestore document controller for that collection, and the schema confirms the collection fields.

SMS logging is implementation-evidenced by `OSKSMSLogController` and by `OSKSmsService.logSms` calling `OSKSMSLogController.default.save(...)`. However, the supplied Firestore path evidence does not include the SMS log collection path, and the generated Firestore schema excerpt/search did not identify a confirmed SMS log collection path. This should be treated as an implementation-backed but path-unconfirmed persistence area.

Notification token persistence is not owned by this module. The notification services read and delete user notification tokens through `OSKUserNotificationTokenController`, which belongs to `@oskey/user/notification`. Firestore schema and rules confirm user notification collections under `/users/{id}/notifications` and `/users/{id}/notificationTokens`, but the AST evidence shows this module consuming those controllers rather than owning the collections.

No building, unit, access, pincode, organization, property, or hardware persistence ownership is evidenced for this module.

### Evidence Used

- Firestore Path: `/EmailLogs`, `email.controller.ts`, lines 13 and 36
- Schema: `/EmailLogs` fields include `emailDocId`, `sender`, `recipients`, `text`, `html`, `creationDate`, `messageId`, `envelope`, `accepted`, `rejected`, `pending`, and `response`.
- Controller: `OSKEmailLogController extends OSKDocumentController<OSKEmailLog>`
- Controller Method: `OSKEmailLogController.save(emailDocId, data)`
- Call: `OSKEmailLogController.default.save(emailDocId, logMessage)`, `email.service.ts`, line 188
- Controller: `OSKSMSLogController extends OSKDocumentController<OSKSMSLog>`
- Call: `OSKSMSLogController.default.save(smsDocId, smsLogRecord)`, `sms.service.ts`, line 56
- Schema: `/users/{id}/notifications`
- Schema: `/users/{id}/notificationTokens`
- Rules: `/users/notifications` and `/users/notificationTokens` rule blocks exist in `firestore.rules.txt`.
- Call: `OSKUserNotificationTokenController.default.getAll(userId)`, `notification.service.ts`, line 75
- Call: `OSKUserNotificationTokenController.default.delete(...)`, `apns.service.ts`, line 86 and `firebase_cloud_messaging.service.ts`, line 31

### Confidence

High for `/EmailLogs`; medium for SMS log persistence; high that user notification token persistence is consumed rather than owned.

---

## 7. Firestore Triggers

### Interpretation

No Firestore document triggers are supplied for the `apps` module. The trigger artefact is empty, and the module manifest reports `firestoreTriggers: 0`.

Therefore, the module's runtime behaviour appears to be service-call driven rather than document-trigger driven in the supplied evidence.

### Evidence Used

- Firestore Trigger Artefact: `apps-firestore-triggers.json` is an empty array.
- Manifest: `apps-manifest.json` summary reports `firestoreTriggers: 0`.
- Evidence Graph: input summary reports `firestoreTriggers: 0`.

### Confidence

High.

---

## 8. Permissions & Security

### Interpretation

No module-specific permission strings are captured in the `apps` AST-derived evidence. The module does not appear to implement RBAC checks directly. Security-relevant boundaries are instead provider credentials, environment-gated behaviour, notification-token ownership delegated to the user notification module, and Firestore rules for user notification collections.

Email delivery includes an allowed-domain environment variable and SMTP credential retrieval. SMS delivery retrieves Twilio credentials through the secret service. APNS delivery retrieves APNS secrets and uses Apple team/bundle environment configuration. Push notification token reads/deletes are delegated to `@oskey/user/notification`.

The RBAC reference includes `v1.org.residents.onboardingNotification` for receiving resident onboarding email notifications, but no AST evidence in this module confirms direct permission enforcement for that role. Per the contract note, `v1.org.admin` roles are production-relevant; `v1.admin` roles are work in progress and should not be treated as implemented here without AST proof.

### Evidence Used

- Permission Evidence: `apps-evidence.json` contains an empty `permissionEvidence` array.
- Manifest: `permissionHints: 0`.
- Environment Variable: `OSK_ALLOWED_EMAIL_DOMAINS`, `email.service.ts`, line 32
- Environment Variable: `OSK_MAILTRAP_SMTP_HOST`, `email.service.ts`, line 61
- Environment Variable: `OSK_MAILTRAP_SMTP_USERNAME`, `email.service.ts`, line 62
- Call: `OSKSecretService.getSecret(OSKApiName.MailtrapPassApiKey)`, `email.service.ts`, line 63
- Call: `OSKSecretService.getSecret(OSKApiName.TwilioAccountSID)`, `sms.service.ts`, line 66
- Call: `OSKSecretService.getSecret(OSKApiName.TwilioAuthToken)`, `sms.service.ts`, line 67
- Call: `OSKSecretService.getSecret(OSKApiName.TwilioMessagingServiceSID)`, `sms.service.ts`, line 68
- Call: `OSKSecretService.getSecret(OSKApiName.APNSProductionAPIKey)`, `apns.service.ts`, line 46
- Call: `OSKSecretService.getSecret(OSKApiName.APNSDevelopmentAPIKey)`, `apns.service.ts`, line 47
- RBAC: `v1.org.residents.onboardingNotification` is defined as receiving resident notifications.
- Rules: `/users/{userId}/notifications` and `/users/{userId}/notificationTokens` are present in Firestore rules.

### Confidence

Medium-high. High for absence of permission evidence in this module; medium for role relevance because RBAC is not linked by module AST evidence.

---

## 9. Cross-Module Relationships

### Interpretation

The strongest confirmed cross-module relationship is from `apps/notification` to user notification token storage through `@oskey/user/notification`. The module reads notification tokens and removes invalid tokens after provider failures. It also imports call-related ICE server options, indicating a relationship between special notifications and call/intercom signalling data, but the supplied evidence does not describe the complete call workflow.

The notification submodule also uses sibling `apps` submodules: mail and SMS. This is internal to the `apps` module but cross-submodule in structure.

### Evidence Used

- Import: `notification.service.ts` imports `@oskey/user/notification`.
- Call: `OSKUserNotificationTokenController.default.getAll(userId)`, `notification.service.ts`, line 75
- Call: `OSKUserNotificationTokenController.default.delete(userId, token.tokenId)`, `apns.service.ts`, line 86
- Call: `OSKUserNotificationTokenController.default.delete(_userId, _tokenId)`, `firebase_cloud_messaging.service.ts`, line 31
- Cross-module dependency: `notification_options.model.ts` imports `OSKICEServers` from `src/modules/call/models/shared/ice_servers.model`.
- Internal submodule call: `OSKEmailService.default.send(emailOptions)`, `notification.service.ts`, line 256
- Internal submodule call: `OSKSmsService.default.sendSms(...)`, `notification.service.ts`, lines 276 and 285

### Confidence

High for user notification token relationship; medium for call relationship because only the model dependency is evidenced.

---

## 10. External Hooks

### Interpretation

Confirmed external/provider boundaries include SMTP/Mailtrap via Nodemailer, Twilio SMS, Apple Push Notification service through `@parse/node-apn`, Firebase Cloud Messaging through `firebase-admin/messaging`, QR code generation through `qrcode`, and secret/environment configuration.

Architecture grounding identifies mobile applications and PGO as clients of the Cloud Functions backend. For this module, they should be treated as candidate consumers because no callable entry points or direct frontend interactions are evidenced in the supplied artefacts.

### Evidence Used

- External Hook: `OSK_MAILTRAP_SMTP_HOST`, `OSK_MAILTRAP_SMTP_USERNAME`, `OSK_NO_REPLY_EMAIL`, `OSK_EMAIL_SUBJECT_PREFIX`
- Call: `createTransport(...)`, `email.service.ts`, line 69
- Call: `transport.sendMail(message)`, `email.service.ts`, line 134
- External Hook: Twilio secrets through `OSKApiName.TwilioAccountSID`, `TwilioAuthToken`, `TwilioMessagingServiceSID`
- Call: `twilio(accountSid, authToken)`, `sms.service.ts`, line 88
- Call: `client.messages.create(...)`, `sms.service.ts`, line 94
- External Hook: `OSK_APNS_API_KEY_ID`, `OSK_APPLE_TEAM_ID`, `OSK_IOS_APP_BUNDLE_ID`
- Call: `apn.send(...)`, `apns.service.ts`, line 67
- Call: `messaging().send(message)`, `firebase_cloud_messaging.service.ts`, line 22
- Call: `QRCode.toDataURL(activationCode)`, `qr.code.service.ts`, line 9
- Architecture: Mobile apps and PGO consume backend Cloud Functions.

### Confidence

High for provider integrations. Medium for client consumers because initiating entry points are outside module evidence.

---

## 11. Architectural Observations

### Interpretation

Evidence indicates a layered communication design:

- Controllers encapsulate Firestore log persistence for email and SMS records.
- Services encapsulate provider-specific delivery behaviour.
- `OSKNotificationService` orchestrates channel-specific delivery rather than embedding all provider calls directly.
- Provider configuration is externalized through environment variables and secret service lookups.
- Push notification token lifecycle handling is delegated to the user notification module, which keeps token ownership outside `apps`.
- The module uses template registries for email and SMS messages, supporting reusable notification content without hard-coding every message in dispatch services.

The module does not evidence denormalisation, fan-out to hardware, Pub/Sub, Cloud Run, MongoDB, or Firestore trigger behaviour. Any relationship to intercom/call behaviour should remain a candidate until later synthesis because the supplied evidence only shows call-related option-model import and special notification dispatch.

### Evidence Used

- Controller: `OSKEmailLogController extends OSKDocumentController<OSKEmailLog>`
- Controller: `OSKSMSLogController extends OSKDocumentController<OSKSMSLog>`
- Service: `OSKNotificationService`
- Service: `OSKAPNSService`
- Service: `OSKFirebaseCloudMessagingService`
- Service: `OSKEmailService`
- Service: `OSKSmsService`
- Exported Symbol: `emailTemplates`
- Exported Symbol: `smsTemplates`
- Exported Symbol: `notificationMetadata`
- Call: `OSKNotificationService.default._sendApns(...)`
- Call: `OSKNotificationService.default._sendFcm(...)`
- Call: `OSKNotificationService.default._handleEmailNotifications(...)`
- Call: `OSKNotificationService.default._handleSmsNotifications(...)`
- Manifest: `firestoreTriggers: 0`
- Permission Evidence: none supplied.

### Confidence

High.

---

## 12. Risks & Open Questions

### Interpretation

- The SMS log Firestore collection path is not captured in the supplied Firestore evidence, even though `OSKSMSLogController` and `OSKSmsService.logSms` indicate persistence.
- No Firestore rules specifically for `/EmailLogs` were identified in the supplied rules excerpt/search, so the direct security boundary for email logs requires confirmation.
- The module has no permission evidence; any upstream authorization for sending notifications must be verified in calling modules.
- `OSKEmailLogController.queryAllSmsDocs` appears to be a naming inconsistency because it is on the email log controller and queries `/EmailLogs`.
- The notification model imports `OSKICEServers` from the call module, but the evidence does not confirm the complete call/intercom notification workflow.
- The module deletes invalid notification tokens through `OSKUserNotificationTokenController`, but the exact criteria from APNS/FCM responses are only partially visible from call evidence and require source-level or richer AST evidence for full behaviour.
- Architecture documents mention hardware and access-control pipelines, but no supplied `apps` evidence links this module to hardware fan-out, Pub/Sub, Cloud Run, or MongoDB.

### Evidence Used

- Controller: `OSKSMSLogController`
- Call: `OSKSMSLogController.default.save(smsDocId, smsLogRecord)`, `sms.service.ts`, line 56
- Firestore Path Evidence: only `/EmailLogs` captured for `apps`
- Controller Method: `OSKEmailLogController.queryAllSmsDocs`
- Cross-module dependency: `notification_options.model.ts` imports `OSKICEServers`
- Call: `OSKUserNotificationTokenController.default.delete(...)`
- Manifest: `permissionHints: 0`, `firestoreTriggers: 0`

### Confidence

High.

---

## 13. Evidence References

- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/firestore.indexes.json`
- `ai-runtime/contracts/docs/rbac-roles.json`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/work-order.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `output/knowledge-pipeline/modules/apps/apps-manifest.json`
- `output/knowledge-pipeline/modules/apps/apps-files.json`
- `output/knowledge-pipeline/modules/apps/apps-services.json`
- `output/knowledge-pipeline/modules/apps/apps-controllers.json`
- `output/knowledge-pipeline/modules/apps/apps-evidence.json`
- `output/knowledge-pipeline/modules/apps/apps-evidence-graph.json`
- `output/knowledge-pipeline/modules/apps/apps-firestore-triggers.json`
