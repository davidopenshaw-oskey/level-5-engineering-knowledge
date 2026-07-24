<!-- © Oskey SAS. All rights reserved. -->

# Module API Reference: apps

*© Oskey SAS. All rights reserved.*

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Module** | `apps` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_152118-1aa319b1` |
| **Exported Callables** | 0 |
| **Type Aliases / Enums** | 45 |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Status** | Completed & Grounded |

---

## 1. Executive API Summary

This document contains the verified API contracts, exported Cloud Function callables, request/response models, and data types for the `apps` module.

---

## 2. HTTPS Callable Functions (0 Endpoints)

No exported HTTPS Callable functions recorded for this module.
---

## 3. Data Models & Type Definitions (45 Types)

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKEmailHeaderLog` | `{     emailDocId: string;     sender: string;     recipients: string[]; // in OSKPhoneNumber.internationalPhoneNumber...` | `functions/src/modules/apps/modules/mail/models/email_log_document.ts` |
| `OSKEmailResponseLog` | `{     error?: string;     messageId?: string;     envelope?: string;     accepted?: string;     rejected?: string;   ...` | `functions/src/modules/apps/modules/mail/models/email_log_document.ts` |
| `OSKEmailLog` | `OSKEmailHeaderLog & OSKEmailResponseLog` | `functions/src/modules/apps/modules/mail/models/email_log_document.ts` |
| `OSKOrganizationInvitationTemplate` | `{     id: 'organizationInvitationReceived';     params: {         recipientName: string;         recipientEmail: stri...` | `functions/src/modules/apps/modules/mail/models/email_options.model.ts` |
| `OSKExternalUserInvitationTemplate` | `{     id: 'externalUserInvitationReceived';     params: {         recipientName: string;         recipientEmail: stri...` | `functions/src/modules/apps/modules/mail/models/email_options.model.ts` |
| `OSKExternalUnitInvitationTemplate` | `{     id: 'externalUnitInvitationReceived';     params: {         recipientName: string;         recipientEmail: stri...` | `functions/src/modules/apps/modules/mail/models/email_options.model.ts` |
| `OSKOnboardingActivationCodeTemplate` | `{     id: 'onboardingActivationCode';     params: {         recipientName: string;         recipientEmail: string;   ...` | `functions/src/modules/apps/modules/mail/models/email_options.model.ts` |
| `OSKUserOtpCodeEmailTemplate` | `{     id: 'userOtpCodeEmail';     params: {         recipientEmail: string;         code: string;     }; }` | `functions/src/modules/apps/modules/mail/models/email_options.model.ts` |
| `OSKPMPUserInvitationTemplate` | `{     id: 'pmpUserInvitation';     params: {         recipientName: string;         recipientEmail: string;         i...` | `functions/src/modules/apps/modules/mail/models/email_options.model.ts` |
| `OSKUserOnboardedNotificationTemplate` | `{     id: 'userOnboardedNotification';     params: {         recipientEmail: string;         userName: string;       ...` | `functions/src/modules/apps/modules/mail/models/email_options.model.ts` |
| `OSKEmailOptions` | `{     language: OSKSupportedLanguage;     template:         \| OSKOrganizationInvitationTemplate         \| OSKExtern...` | `functions/src/modules/apps/modules/mail/models/email_options.model.ts` |
| `OSKEmailTemplateId` | `\| 'organizationInvitationReceived'     \| 'externalUserInvitationReceived'     \| 'externalUnitInvitationReceived'  ...` | `functions/src/modules/apps/modules/mail/models/email_template.model.ts` |
| `OSKEmailTemplateOptions` | `{     subject: string;     text: string;     html: string; }` | `functions/src/modules/apps/modules/mail/models/email_template.model.ts` |
| `OSKEmailTemplate` | `{ id: OSKEmailTemplateId } & Record<OSKSupportedLanguage, OSKEmailTemplateOptions>` | `functions/src/modules/apps/modules/mail/models/email_template.model.ts` |
| `OSKAppleNotificationVoIPMetadata` | `{     pushType: 'voip';     priority: 10;     topic: string; }` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `OSKAppleNotificationAlertMetadata` | `{     pushType: 'alert';     alert: {         [key in OSKSupportedLanguage]: {             title: string;            ...` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `OSKEmailNotificationMetadata` | `{     templateId: OSKEmailTemplateId; }` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `OSKSmsNotificationMetadata` | `{     templateId: OSKSMSTemplateId; }` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `OSKNotificationMetadataOption` | `{     apns?: { expiration?: number } & OSKAppleNotificationAlertMetadata;     fcm?: {         android?: AndroidConfig...` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `OSKSpecialNotificationMetadataOption` | `{     apns?: { expiration?: number } & OSKAppleNotificationVoIPMetadata;     fcm?: {         android?: AndroidConfig;...` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `OSKNotificationMetadata` | `{     notifications: {         [key in OSKNotificationType]: OSKNotificationMetadataOption;     };     specialNotific...` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `FullNotificationOptions` | `OSKNotificationOptions & {     recipientName: string;     recipientEmail?: string;     recipientPhone?: string;     b...` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `ApnsToken` | `{ tokenId: string; token: string; environment: 'development' \| 'production' }` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `FcmToken` | `{ tokenId: string; token: string }` | `functions/src/modules/apps/modules/notification/models/notification_metadata.model.ts` |
| `OSKNotificationUserCallReceivedOptions` | `{     type: 'userCallReceived';     data: {         callId: string;         callerId: string;         callerType: 'ac...` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `OSKNotificationOrganizationInvitationReceivedOptions` | `{     type: 'organizationInvitationReceived';     data: {         inviterName: string;         organizationName: stri...` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `OSKNotificationExternalUserInvitationReceivedOptions` | `{     type: 'externalUserInvitationReceived';     data: {         inviterName: string;         appStoreAppleName: str...` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `OSKNotificationExternalUnitInvitationReceivedOptions` | `{     type: 'externalUnitInvitationReceived';     data: {         inviterName: string;         appStoreAppleName: str...` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `OSKNotificationExternalSMSUserInvitationReceivedOptions` | `{     type: 'externalSMSUserInvitationReceived';     data: {         inviterName: string;     }; }` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `OSKNotificationExternalSMSUnitInvitationReceivedOptions` | `{     type: 'externalSMSUnitInvitationReceived';     data: {         inviterName: string;     }; }` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `inviteeOnboardedNotificationOptions` | `{     type: 'inviteeOnboardedNotification';     data: {         inviterName: string;         buildingName: string;   ...` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `OSKNotificationResidentsReceivedOptions` | `{     type: 'residentsNotificationReceived';     data: {         title: string;         description: string;         ...` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `OSKNotificationOptions` | `{     language: OSKSupportedLanguage;     collapsId?: string; } & (     \| OSKNotificationOrganizationInvitationRecei...` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `OSKSpecialNotificationOptions` | `{     language: OSKSupportedLanguage;     collapsId?: string; } & OSKNotificationUserCallReceivedOptions` | `functions/src/modules/apps/modules/notification/models/notification_options.model.ts` |
| `OSKSpecialNotificationType` | `'userCallReceived'` | `functions/src/modules/apps/modules/notification/models/notification_type.model.ts` |
| `OSKNotificationType` | `\| 'organizationInvitationReceived'     \| 'externalUserInvitationReceived'     \| 'externalUnitInvitationReceived'  ...` | `functions/src/modules/apps/modules/notification/models/notification_type.model.ts` |
| `OSKAllNotificationType` | `OSKNotificationType \| OSKSpecialNotificationType` | `functions/src/modules/apps/modules/notification/models/notification_type.model.ts` |
| `OSKSMSLog` | `{     smsDocId: string;     sender: string;     recipients: [         {             first_name: string;             l...` | `functions/src/modules/apps/modules/sms/models/sms_log_document.ts` |
| `OSKSMSExternalUnitInvitationTemplate` | `{     id: 'externalSMSUnitInvitationReceived';     params: {         recipientPhone: string;         recipientName: s...` | `functions/src/modules/apps/modules/sms/models/sms_options.model.ts` |
| `OSKSMSExternalUserInvitationTemplate` | `{     id: 'externalSMSUserInvitationReceived';     params: {         recipientPhone: string;         recipientName: s...` | `functions/src/modules/apps/modules/sms/models/sms_options.model.ts` |
| `OSKSMSOptions` | `{     language: OSKSupportedLanguage;     template: OSKSMSExternalUnitInvitationTemplate \| OSKSMSExternalUserInvitat...` | `functions/src/modules/apps/modules/sms/models/sms_options.model.ts` |
| `OSKSMSSendOptions` | `{     from: string;     to: {         first_name:string;         last_name:string;         phone_number:string // in ...` | `functions/src/modules/apps/modules/sms/models/sms_options.ts` |
| `OSKSMSTemplateId` | `'externalSMSUserInvitationReceived' \| 'externalSMSUnitInvitationReceived'` | `functions/src/modules/apps/modules/sms/templates/sms_template.model.ts` |
| `OSKSMSTemplateOptions` | `{     text: string; }` | `functions/src/modules/apps/modules/sms/templates/sms_template.model.ts` |
| `OSKSMSTemplate` | `{ id: OSKSMSTemplateId } & Record<OSKSupportedLanguage, OSKSMSTemplateOptions>` | `functions/src/modules/apps/modules/sms/templates/sms_template.model.ts` |
