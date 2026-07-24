# Module Engineering Profile: user

## 0. Generation Metadata

- **Repo**: `firebase-oskey-dev`
- **Run ID**: `20260724_145948-1aa319b1`
- **Generated At**: `2026-07-24T14:59:50.680Z`

---

## 1. Executive Summary

### Interpretation

The `user` module is the Oskey backend module responsible for user identity, profile persistence, user lifecycle events, device registration, notification subscriptions, invitations, organization membership, settings, pincodes, and user-scoped access relationships.

Evidence shows the module is implemented as a large backend domain with a core top-level `OSKUserController`/`OSKUserService` pair plus a network of submodules for `user_device`, `user_notification`, `user_invitation`, `user_settings`, `user_access`, `user_activity`, `user_organization`, and `user_pincode`.

The module appears to anchor the `/users` document domain and a set of nested user-scoped subcollections such as device records, notification metadata, organization and invitation records, and settings documents.

### Evidence Used

- Manifest: `output/knowledge-pipeline/modules/user/user-manifest.json` reports 115 files, 47 classes, 275 methods, 25 services, 22 controllers, 18 firestore hints, 24 permission hints, 27 external hooks, and 9 firestore triggers.
- Controllers: `OSKUserController`, `OSKUserDeviceController`, `OSKUserNotificationController`, `OSKUserSettingsBuildingController`, `OSKUserSettingsUnitController`, `OSKUserInvitationController`, `OSKUserOrganizationController`, `OSKUserPincodeController` from `output/knowledge-pipeline/modules/user/user-controllers.json`.
- Services: `OSKUserService`, `OSKUserDeviceService`, `OSKUserNotificationService`, `OSKUserSettingsBuildingService`, `OSKUserSettingsUnitService`, `OSKUserInvitation*` services from `output/knowledge-pipeline/modules/user/user-services.json`.
- Firestore triggers: `auth.user().onCreate`, `auth.user().onDelete`, `db.document(userPass).onCreate`, `db.document(userPass).onUpdate`, `db.document(userDevicePath).onCreate`, `db.document(userDevicePath).onUpdate`, `db.document(userDevicePath).onDelete`, `functionBuilder.firestore.document(userNotificationPath).onUpdate`, `functionBuilder.firestore.document(userNotificationPath).onDelete` from `output/knowledge-pipeline/modules/user/user-firestore-triggers.json`.
- External hook and path evidence: `/users`, `/users/{userId}`, `/users/{userId}/devices/{deviceId}`, `/users/{userId}/notifications/{notificationId}`, `/users/{userId}/notificationTokens`, `/users/{userId}/organizations`, `/users/{userId}/invitations`, `/users/{userId}/sentInvitations`, and `/users/${userId}/buildings/${buildingId}/units` from `output/knowledge-pipeline/modules/user/user-evidence.json`.

### Confidence

High for user profile lifecycle, device registration, notification subscription, invitation, settings, and organization membership responsibilities. Medium for the exact nested Firestore collection boundaries because the evidence supplies path candidates and inferred submodule paths rather than direct schema declarations.

---

## 2. Architectural Position

Include:

- Parent scope: User identity and tenant-scoped user management within Oskey.
- Owned concepts: User profiles, authentication lifecycle events, user devices, notification tokens, user invitations, organization invitations/requests, user settings, pincode-related records, and user activity aggregates.
- Provided capabilities: User document persistence, account lifecycle triggers, device lifecycle handling, notification subscription management, user settings administration, invitation lifecycle, organization membership orchestration, and user-scoped access metadata.
- Downstream consumers or candidate consumers: mobile clients and PGO web clients consuming `/users` APIs, backend access control services, notification dispatch services, device synchronization services, organization and building management modules, and user activity analytics.
- Confidence: Medium-High.

### Interpretation

The `user` module sits in the Oskey Cloud Functions backend layer as the primary owner of user-facing persistence and user lifecycle behaviour. It is responsible for the identity-to-device and identity-to-organization relationships that support access control, notifications, and customer administration.

The evidence suggests the module is architected as a central user domain with submodules for specialized user-scoped concerns rather than a single monolithic service.

### Evidence Used

- Manifest summary for the overall module scale and submodule footprint: `user-manifest.json`.
- Controller decomposition across `user_device`, `user_notification`, `user_invitation`, `user_settings`, `user_organization`, `user_access`, `user_activity`, and `user_pincode`: `user-controllers.json`.
- Service decomposition with dedicated specialized services: `user-services.json`.
- External hook path candidates for `/users`, `/users/{userId}`, and nested user subcollections: `user-evidence.json`.

### Confidence

Medium-High.

---

## 3. Primary Responsibilities

### Responsibility 1

- Capability: Persist and manage user profile documents and top-level user account operations.
- Implemented by:
  * Controller: `OSKUserController` (`functions/src/modules/user/controllers/user.controller.ts`).
  * Service: `OSKUserService` (`functions/src/modules/user/services/user.service.ts`).
  * Representative Service Method: `OSKUserController.save` / `OSKUserController.update` and `OSKUserService.onDocumentCreated`.
- Evidence:
  * Controller: `OSKUserController` methods include `get`, `getSafe`, `getAll`, `save`, `update` from `user-controllers.json`.
  * Trigger: `db.document(userPass).onCreate(OSKUserService.onDocumentCreated)` and `db.document(userPass).onUpdate(OSKUserService.onDocumentUpdated)` from `user-firestore-triggers.json`.
  * Path candidate: `/users` and `/users/{userId}` from `user-evidence.json` external hooks.
- Confidence: High.

### Responsibility 2

- Capability: Handle user authentication lifecycle and account provisioning / deletion.
- Implemented by:
  * Service: `OSKUserService`.
  * Representative Service Method: `OSKUserService.onAccountCreated`, `OSKUserService.onAccountDeleted`.
- Evidence:
  * Trigger: `auth.user().onCreate(OSKUserService.onAccountCreated)` and `auth.user().onDelete(OSKUserService.onAccountDeleted)` from `user-firestore-triggers.json`.
  * Controller/service pairing: top-level `OSKUserController` and `OSKUserService` from controllers/services manifests.
- Confidence: High.

### Responsibility 3

- Capability: Manage user device registration, update, and deletion for user-scoped hardware or device metadata.
- Implemented by:
  * Controller: `OSKUserDeviceController` (`functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts`).
  * Service: `OSKUserDeviceService` (`functions/src/modules/user/modules/user_device/services/user_device.service.ts`).
  * Representative Service Method: `OSKUserDeviceService.onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`.
- Evidence:
  * Controller and service exist in `user-controllers.json` and `user-services.json`.
  * Triggers: `db.document(userDevicePath).onCreate`, `db.document(userDevicePath).onUpdate`, `db.document(userDevicePath).onDelete` from `user-firestore-triggers.json`.
  * Path candidates: `/users/{userId}/devices/{deviceId}` and `/users/${userId}/devices` from `user-evidence.json`.
- Confidence: High.

### Responsibility 4

- Capability: Manage user notification metadata and subscription lifecycle.
- Implemented by:
  * Controller: `OSKUserNotificationController`, `OSKUserNotificationTokenController`.
  * Service: `OSKUserNotificationService`, `OSKUserNotificationTokenService`.
  * Representative Service Method: `OSKUserNotificationService.onDocumentUpdated`, `OSKUserNotificationService.onDocumentDeleted`.
- Evidence:
  * Controllers and services in `user-controllers.json` and `user-services.json`.
  * Triggers: `functionBuilder.firestore.document(userNotificationPath).onUpdate(OSKUserNotificationService.onDocumentUpdated)` and `.onDelete(OSKUserNotificationService.onDocumentDeleted)` from `user-firestore-triggers.json`.
  * Path candidates: `/users/{userId}/notifications/{notificationId}`, `/users/{userId}/notificationTokens` from `user-evidence.json`.
- Confidence: High.

### Responsibility 5

- Capability: Manage user invitation workflows and organization invitation/request records.
- Implemented by:
  * Controllers: `OSKUserInvitationController`, `OSKUserInvitationBuildingController`, `OSKUserInvitationExternalUserController`, `OSKUserSentInvitationController`.
  * Services: `OSKUserInvitationAcceptedService`, `OSKUserInvitationCancelledService`, `OSKUserInvitationCommonService`, `OSKUserInvitationCreationService`, `OSKUserInvitationDeleteService`, `OSKUserInvitationEditService`, `OSKUserInvitationExternalUnitService`, `OSKUserInvitationExternalUserService`, `OSKUserInvitationNotificationService`, `OSKUserInvitationRejectedService`.
- Evidence:
  * Controller and service lists from the user module manifests.
  * Path candidates: `/users/{userId}/invitations`, `/users/{userId}/sentInvitations` from `user-evidence.json`.
- Confidence: Medium.

### Responsibility 6

- Capability: Manage user settings at building and unit scope.
- Implemented by:
  * Controllers: `OSKUserSettingsBuildingController`, `OSKUserSettingsUnitController`.
  * Services: `OSKUserSettingsBuildingService`, `OSKUserSettingsUnitService`.
  * Representative Service Method: permission checks such as `v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete`.
- Evidence:
  * Permissions from `user-evidence.json` in settings services.
  * Controllers and services from `user-controllers.json` and `user-services.json`.
  * Path candidates: `/users/${userId}/buildings/${buildingId}/units` from `user-evidence.json`.
- Confidence: Medium.

---

## 4. Public Interfaces

### Interpretation

The module exposes public interfaces through a suite of controllers and service APIs that reflect user profile management, user device management, notification subscriptions, invitation management, organization membership, pincode management, and user setting administration.

### Evidence Used

- Controller evidence: `OSKUserController`, `OSKUserDeviceController`, `OSKUserNotificationController`, `OSKUserSettingsBuildingController`, `OSKUserSettingsUnitController`, `OSKUserInvitationController`, `OSKUserOrganizationController`, `OSKUserPincodeController`, `OSKUserDeviceAccessControlDeviceTokenController` from `user-controllers.json`.
- Service evidence: `OSKUserService`, `OSKUserDeviceService`, `OSKUserNotificationService`, `OSKUserSettingsBuildingService`, `OSKUserSettingsUnitService`, `OSKUserInvitation*` services from `user-services.json`.
- External hook evidence: `http_or_client_path_candidate` values for `/users`, `/users/{userId}`, `/users/{userId}/devices/{deviceId}`, `/users/{userId}/notifications/{notificationId}` from `user-evidence.json`.

### Confidence

Medium.

---

## 5. Internal Structure

### Interpretation

The `user` module is internally structured as a core user domain plus multiple submodules, each with dedicated controllers and services for a bounded user concern.

- Core layer: `OSKUserController` / `OSKUserService`.
- Submodules:
  * `user_device`: device records and lifecycle triggers.
  * `user_notification`: notification records and token management.
  * `user_invitation`: invitation creation, cancellation, acceptance, rejection, and external user handling.
  * `user_settings`: building-level and unit-level user settings.
  * `user_access`: user access relationships.
  * `user_activity`: aggregated user activity.
  * `user_organization`: organization membership and invitation flows.
  * `user_pincode`: user pincode management.

### Evidence Used

- Manifest summary with 25 services and 22 controllers from `user-manifest.json`.
- Controller list showing multiple nested submodule controllers from `user-controllers.json`.
- Service list showing dedicated submodule services from `user-services.json`.
- Trigger evidence linking submodules to document lifecycle events from `user-firestore-triggers.json`.

### Confidence

Medium-High.

---

## 6. Firestore & Data Ownership

### Interpretation

The module owns the primary user persistence layer and a set of nested user-scoped subcollections for device records, notifications, organization data, invitations, settings, and pincode metadata.

### Evidence Used

- Path candidates from `user-evidence.json`: `/users`, `/users/{userId}`, `/users/{userId}/devices/{deviceId}`, `/users/{userId}/notifications/{notificationId}`, `/users/{userId}/notificationTokens`, `/users/{userId}/organizations`, `/users/{userId}/organizationInvitations`, `/users/{userId}/organizationRequests`, `/users/{userId}/invitations`, `/users/{userId}/sentInvitations`, `/users/${userId}/buildings/${buildingId}/units`.
- External hook evidence: HTTP path candidates and storage path candidate for profile images in `user-evidence.json`.
- Trigger evidence: `db.document(userPass)` and `db.document(userDevicePath)` imply document-level listeners on user profile and device documents.

### Confirmed / Likely Owned Paths

- Primary persistence: `/users` and `/users/{userId}`.
- Nested user-scoped structures: `/users/{userId}/devices/{deviceId}`, `/users/{userId}/notifications/{notificationId}`, `/users/{userId}/notificationTokens`, `/users/{userId}/invitations`, `/users/{userId}/sentInvitations`, `/users/{userId}/organizations`, `/users/{userId}/organizationInvitations`, `/users/{userId}/organizationRequests`.

### Firestore Triggers

- Firestore Trigger: `onCreate`
  * Path or Path Variable: `userPass` (candidate for `/users/{userId}`)
  * Handler: `OSKUserService.onDocumentCreated`
  * Source File: `functions/src/modules/user/index.ts`
  * Evidence: `user-firestore-triggers.json` rawText `db.document(userPass).onCreate(OSKUserService.onDocumentCreated)`
  * Confidence: High.

- Firestore Trigger: `onUpdate`
  * Path or Path Variable: `userPass`
  * Handler: `OSKUserService.onDocumentUpdated`
  * Source File: `functions/src/modules/user/index.ts`
  * Evidence: `user-firestore-triggers.json` rawText `db.document(userPass).onUpdate(OSKUserService.onDocumentUpdated)`
  * Confidence: High.

- Firestore Trigger: `onCreate`
  * Path or Path Variable: `userDevicePath` (candidate for `/users/{userId}/devices/{deviceId}`)
  * Handler: `OSKUserDeviceService.onDocumentCreated`
  * Source File: `functions/src/modules/user/modules/user_device/index.ts`
  * Evidence: `user-firestore-triggers.json` rawText `db.document(userDevicePath).onCreate(OSKUserDeviceService.onDocumentCreated)`
  * Confidence: High.

- Firestore Trigger: `onUpdate`
  * Path or Path Variable: `userDevicePath`
  * Handler: `OSKUserDeviceService.onDocumentUpdated`
  * Source File: `functions/src/modules/user/modules/user_device/index.ts`
  * Evidence: `user-firestore-triggers.json` rawText `db.document(userDevicePath).onUpdate(OSKUserDeviceService.onDocumentUpdated)`
  * Confidence: High.

- Firestore Trigger: `onDelete`
  * Path or Path Variable: `userDevicePath`
  * Handler: `OSKUserDeviceService.onDocumentDeleted`
  * Source File: `functions/src/modules/user/modules/user_device/index.ts`
  * Evidence: `user-firestore-triggers.json`
  * Confidence: High.

- Firestore Trigger: `onUpdate`
  * Path or Path Variable: `userNotificationPath` (candidate for `/users/{userId}/notifications/{notificationId}`)
  * Handler: `OSKUserNotificationService.onDocumentUpdated`
  * Source File: `functions/src/modules/user/modules/user_notification/index.ts`
  * Evidence: `user-firestore-triggers.json`
  * Confidence: High.

- Firestore Trigger: `onDelete`
  * Path or Path Variable: `userNotificationPath`
  * Handler: `OSKUserNotificationService.onDocumentDeleted`
  * Source File: `functions/src/modules/user/modules/user_notification/index.ts`
  * Evidence: `user-firestore-triggers.json`
  * Confidence: High.

---

## 7. API Endpoints

This section is detailed in the companion `api-reference/user-api-reference.md` document.

---

## 8. API Endpoints

This section is detailed in the companion `api-reference/user-api-reference.md` document.

---

## 9. API Endpoints

This section is detailed in the companion `api-reference/user-api-reference.md` document.

---

## 10. Permissions & Security

### Interpretation

The module enforces organization and settings-related permissions in the user settings submodule and uses generic `permission-denied` guards in device, notification token, and core user services.

### Evidence Used

- `v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete`, and `v1.org.admin` in `functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts` and `user_unit_settings.service.ts` from `user-evidence.json`.
- `permission-denied` strings in `functions/src/modules/user/modules/user_device/services/user_device.service.ts`, `functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts`, and `functions/src/modules/user/services/user.service.ts` from `user-evidence.json`.

### Confidence

Medium.

---

## 11. Cross-Module Relationships

### Interpretation

The `user` module is directly connected to organization and building scope through user settings, invitations, and organization membership records. It also connects to access control hardware via device token and user device management submodules.

### Evidence Used

- Path candidates: `/users/${userId}/buildings/${buildingId}/units` from `user-evidence.json`.
- Controller evidence: `OSKUserOrganizationController` and invitation controllers from `user-controllers.json`.
- Controller evidence: `OSKUserDeviceAccessControlDeviceTokenController` and `OSKUserDeviceController` from `user-controllers.json`.

### Confidence

Medium.

---

## 12. External Hooks

### Interpretation

The module exposes candidate external API or client paths for user resources, and it includes storage path candidates for user profile images.

### Evidence Used

- HTTP/client path candidates from `user-evidence.json`: `/users`, `/users/{userId}`, `/users/{userId}/devices/{deviceId}`, `/users/{userId}/notifications/{notificationId}`.
- Storage path candidate from `user-evidence.json`: `^users/[a-zA-Z0-9._|-]+/public/profileImages/[a-zA-Z0-9-]+\.(png|jpg|jpeg)$`.
- Environment variable candidate: `OSK_FIREBASE_EMULATOR` in several user module files.

### Confidence

Medium.

---

## 13. Architectural Observations

### Interpretation

The `user` module is a large, modular backend domain with explicit separation between core user profile management and specialized subdomains. It uses Firestore-triggered services for document lifecycle reactions and appears to ground most functionality in user-scoped persistence.

### Evidence Used

- Manifest scale and submodule counts from `user-manifest.json`.
- Controller/service decomposition from `user-controllers.json` and `user-services.json`.
- Trigger evidence that partitions core user lifecycle, device lifecycle, and notification lifecycle into separate service handlers.
- External hook evidence for user API and storage path candidates.

### Confidence

Medium-High.

---

## 14. Risks & Open Questions

### Interpretation

The current evidence provides strong module structure but leaves some data model details and exact collection path definitions as candidate constructs.

### Evidence Used

- The module evidence JSON contains path candidates rather than explicit firestore schema path declarations for the user domain.

### Open Questions

- What is the exact Firestore path represented by `userPass` in the user triggers? Is it `/users/{userId}` or a different user-pass collection anchor?
- Are `/users/{userId}/devices`, `/users/{userId}/notifications`, and `/users/{userId}/notificationTokens` confirmed persisted collections, or are they derived from request path and service logic only?
- How does the `OSKUserDeviceAccessControlDeviceTokenController` relate to the `access_control_device` module and device synchronization flows?
- What RBAC rules precisely govern the `v1.org.settings.*` permissions observed in the user settings services?

### Confidence

Medium.

---

## 15. Evidence References

- `output/knowledge-pipeline/modules/user/user-manifest.json`
- `output/knowledge-pipeline/modules/user/user-controllers.json`
- `output/knowledge-pipeline/modules/user/user-services.json`
- `output/knowledge-pipeline/modules/user/user-evidence.json`
- `output/knowledge-pipeline/modules/user/user-evidence-graph.json`
- `output/knowledge-pipeline/modules/user/user-firestore-triggers.json`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/work-order.md`
- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
