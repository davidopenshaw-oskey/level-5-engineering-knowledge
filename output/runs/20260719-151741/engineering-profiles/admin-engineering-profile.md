# Module Engineering Profile: admin

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.296Z

---

## 1. Executive Summary

The `admin` module is the administrative and maintenance surface for Oskey backend operations. It exposes callable Cloud Functions used by the PGO/internal administration experience to inspect and mutate buildings, organizations, users, user access, devices, invitations, resident records, settings, intercom data, pincodes, and operational repair state.

This module does not appear to own a single isolated `admin` Firestore collection. Instead, it acts as a privileged orchestration layer over canonical platform collections such as `/buildings`, `/organizations`, `/users`, `/settings`, and their user/building subcollections. The evidence shows 46 files, 17 services, 8 controllers, 117 methods, 663 calls, 64 permission hints, 30 external-hook hints, and no Firestore triggers.

The module has two distinct personalities:

- PGO/admin query and mutation APIs for buildings, organizations, users, access, devices, and invitations.
- Maintenance/backfill callable functions that repair, denormalize, recreate, or synchronize existing production data.

Because the module can delete user data, remove access records, refresh pincodes, recreate access documents, and bulk-update intercom/settings/resident structures, its operational blast radius is high.

## 2. Architectural Position

The architecture documents describe Oskey as a Firebase-centered system where Cloud Functions act as the API gateway for mobile applications and the Angular PGO portal, with Firestore as the primary operational database. Within that architecture, the `admin` module sits on the privileged backend side of the PGO/internal operations boundary.

The module aligns with these documented platform roles:

- PGO is the administrative web application used by property managers and admin teams to configure buildings, provision devices, and manage resident lifecycle workflows.
- Organizations are top-level corporate/property entities provisioned by Oskey operations staff.
- Firestore stores the definitive records for user accounts, unit configuration, lease/access timelines, building configuration, and operational rules.

`admin` is therefore not a domain silo like a single feature module. It is a cross-cutting administrative facade over the platform model. Its callable functions reach into building, organization, user, access, intercom, pincode, settings, resident, and invitation domains.

The module is composed through top-level callable trigger registration:

- `getAdminUsersCallableFunctionTriggers(functionBuilder)`
- `getAdminBuildingsCallableFunctionTriggers(functionBuilder)`
- `getAdminOrganizationCallableFunctionTriggers(functionBuilder)`
- `maintenanceCallableFunctions.getCallableFunctionTriggers(functionBuilder)`

Each submodule wraps its callable registrations with App Check enforcement logic that is disabled in emulator mode via `OSK_FIREBASE_EMULATOR`.

## 3. Primary Responsibilities

The evidence supports these primary responsibilities.

### Building Administration

`admin_buildings` exposes administrative building/unit lookup behavior:

- List all buildings with unit data.
- Provide controller access to the `/buildings` collection.
- Return building/unit data through `OSKAdminBuildingService.getAllBuildingsWithUnits`.

The service evidence contains `OSKAdminBuildingService` with `getAllBuildingsWithUnits`, and controller evidence contains `OSKAdminBuildingController.getAll` and `OSKAdminBuildingUnitController.getAll`.

### Organization Administration

`admin_organization` exposes organization listing and detail access:

- List all organizations.
- Fetch organization details by id.
- Use RBAC-style permissions for organization view/register/edit/delete/validate operations.
- Provide controller access to the `/organizations` collection.

The service evidence contains `OSKOragnizationListService.getAllOrganizations` and `getOrganizationDetailsById`. The controller evidence contains `OSKOragnizationListController.getAll` and `getById`.

### User Administration

`admin_users` exposes global user administration:

- List all users.
- Fetch a user by id.
- Delete user data.
- Administer inhabitant-to-unit membership.
- Add and remove inhabitant access to units.
- List and delete user devices.
- List and delete user invitations.
- Create user invitation access.
- List and delete user access records.

The service evidence includes:

- `OSKAdminUserService`
- `OSKAdminInhabitantUserService`
- `OSKAdminUserAccessService`
- `OSKAdminUserDeviceService`
- `OSKAdminUserInvitationService`

The controller evidence includes corresponding controllers for users, inhabitant users, access, devices, and invitations.

### Access Ledger Repair And Synchronization

`admin_maintenance` contains access maintenance routines that affect denormalized access state across user/building ledgers and external access documents:

- Recreate access records.
- Remove non-existing user access from buildings.
- Synchronize building access records with user access records.
- Fix missing main access fields.
- Recreate tokens for building users.
- Recreate access documents in MongoDB by building.
- Filter valid access-control-device access entries.
- Validate access dates.
- Check user and building main access state.

This responsibility is concentrated in `OSKDbAccessService`.

### Intercom Maintenance

`admin_maintenance` also manages intercom denormalization and cleanup:

- Delete user intercom records.
- Delete building intercom records.
- Delete call transfer lists.
- Create building intercom base records.
- Create and fill intercoms by users/buildings.
- Update access-control-device model values.
- Add unit number fields to intercom entries.

This responsibility is implemented by `OSKDbIntercomService` and `OSKDbIntercomUnitNumberService`.

### Resident, Settings, Property, Pincode, And Prompt Maintenance

Additional maintenance services perform broad data creation or migration tasks:

- Create residents from organization onboarding cards.
- Update resident records with unit information.
- Create resident settings for buildings.
- Add intercom display name and unit number fields.
- Create user settings and unit settings.
- Sync Firebase Auth display names into user settings.
- Delete obsolete intercom display name fields.
- Link buildings to properties.
- Refresh pincodes.
- Execute pincode refresh worker behavior.
- Create organization prompt templates.

These responsibilities are implemented by `OSKDbResidentsService`, `OSKDbBuildingSettingsService`, `OSKDbUserSettingsService`, `OSKDbPropertiesService`, `OSKDbPincodesService`, `OSKPincodeRefreshWorkerService`, and `OSKDbOrganizationPromptService`.

## 4. Public Interfaces

The module exposes callable Cloud Function interfaces rather than Firestore triggers.

### Admin Building Callables

- `OSKAdminBuildingService.getAllBuildingsWithUnits`

### Admin Organization Callables

- `OSKOragnizationListService.getAllOrganizations`
- `OSKOragnizationListService.getOrganizationDetailsById`

### Admin User Callables

- `OSKAdminUserService.getAllUsers`
- `OSKAdminUserService.getUserById`
- `OSKAdminUserService.deleteUserData`
- `OSKAdminInhabitantUserService.giveInhabitantAccessToUnitInhabitant`
- `OSKAdminInhabitantUserService.getInhabitantUserUnits`
- `OSKAdminInhabitantUserService.removeInhabitantFromUnit`
- `OSKAdminInhabitantUserService.addInhabitantToUnit`
- `OSKAdminUserDeviceService.getAllUserDevices`
- `OSKAdminUserDeviceService.removeUserDevices`
- `OSKAdminUserDeviceService.removeAllUserDevices`
- `OSKAdminUserInvitationService.getAllUserInvitations`
- `OSKAdminUserInvitationService.removeAllUserInvitations`
- `OSKAdminUserInvitationService.removeUserInvitations`
- `OSKAdminUserInvitationService.createUserInvitationAccess`
- `OSKAdminUserAccessService.getAllUserAccesses`
- `OSKAdminUserAccessService.getUserAccessById`
- `OSKAdminUserAccessService.removeUserAccesses`
- `OSKAdminUserAccessService.removeAllUserAccesses`
- `OSKAdminUserAccessService.removeUserAccessAccesses`

### Admin Maintenance Callables

The maintenance public surface is large and operationally sensitive. Representative callable entry points include:

- Intercom cleanup and rebuild functions from `OSKDbIntercomService`.
- Resident creation and resident unit-info updates from `OSKDbResidentsService`.
- Building/user settings creation and migration functions.
- Access ledger synchronization and repair functions from `OSKDbAccessService`.
- Pincode refresh functions from `OSKDbPincodesService` and `OSKPincodeRefreshWorkerService`.
- Organization prompt creation from `OSKDbOrganizationPromptService`.

All admin callable groups are registered through Firebase Functions builders and use App Check enforcement outside emulator mode.

## 5. Internal Structure

The module is internally split into four submodule areas.

### `admin_buildings`

Contains building-facing admin controllers and services:

- `OSKAdminBuildingController`
- `OSKAdminBuildingUnitController`
- `OSKAdminBuildingService`

This area provides read-oriented building/unit administration.

### `admin_organization`

Contains organization list/detail administration:

- `OSKOragnizationListController`
- `OSKOragnizationListService`

The class name appears as `Oragnization` in the evidence, which should be treated as an implementation spelling artifact, not a domain concept.

### `admin_users`

Contains global user, inhabitant, access, device, and invitation administration:

- `OSKAdminUserController`
- `OSKAdminInhabitantUserController`
- `OSKAdminUserAccessController`
- `OSKAdminUserDeviceController`
- `OSKAdminUserInvitationController`
- `OSKAdminUserService`
- `OSKAdminInhabitantUserService`
- `OSKAdminUserAccessService`
- `OSKAdminUserDeviceService`
- `OSKAdminUserInvitationService`

This area is the most direct PGO/user administration layer.

### `admin_maintenance`

Contains migration, repair, backfill, and operational maintenance services:

- `OSKDbAccessService`
- `OSKDbBuildingSettingsService`
- `OSKDbIntercomService`
- `OSKDbIntercomUnitNumberService`
- `OSKDbOrganizationPromptService`
- `OSKDbPincodesService`
- `OSKPincodeRefreshWorkerService`
- `OSKDbPropertiesService`
- `OSKDbResidentsService`
- `OSKDbUserSettingsService`

This area is not ordinary CRUD. It contains wide-scope operations that reshape or repair existing production data.

## 6. Firestore & Data Ownership

The module has literal Firestore path evidence for:

- `/buildings`
- `/organizations`
- `/users`

The wider collection usage is inferred from AST-backed service/controller responsibilities and the Firestore architecture/schema documents. The module works across these documented data areas:

- `/buildings`
- `/buildings/{buildingId}/accesses`
- `/buildings/{buildingId}/intercoms`
- `/buildings/{buildingId}/pincodes`
- `/buildings/{buildingId}/settings`
- `/buildings/{buildingId}/units`
- `/buildings/{buildingId}/callTransferList`
- `/organizations`
- `/organizations/{organizationId}/residents`
- `/organizations/{organizationId}/onboardingInhabitants`
- `/users`
- `/users/{userId}/accesses`
- `/users/{userId}/devices`
- `/users/{userId}/invitations`
- `/users/{userId}/intercoms`
- `/users/{userId}/pincodes`
- `/users/{userId}/settings`
- `/settings`

`admin` should be treated as a privileged mutator of these records, not their sole owner. The stronger owners are the platform domains represented by buildings, organizations, users, access, intercoms, pincodes, settings, and resident lifecycle modules.

Important data patterns:

- Access data is denormalized across user and building ledgers.
- Pincode state is paired across user and building contexts.
- Intercom data is denormalized across user/building contexts and call-transfer-list structures.
- Maintenance functions can repair or recreate derived data after schema changes or historical inconsistency.

Extractor caveat: some Firestore evidence entries containing package-style strings such as `@oskey/settings/role` and `@oskey/building/settings` appear to be import/config false positives, not Firestore collection paths.

## 7. API Endpoints

This section is detailed in the companion `api-reference/admin-api-reference.md` document.

---

## 8. Firestore Triggers

The admin module has no Firestore triggers in the provided trigger evidence.

`admin-firestore-triggers.json` is an empty array, and the manifest reports:

- `firestoreTriggers`: `0`

All public execution paths identified in the evidence are callable functions, not document create/update/delete triggers.

This is architecturally significant: admin behavior appears to be explicit/operator initiated, rather than automatically reacting to Firestore writes.

## 9. Permissions & Security

The evidence shows extensive permission checking and permission-denied handling.

Observed permission hints include:

- `v1.admin`
- `v1.admin.org.view`
- `v1.admin.org.register`
- `v1.admin.org.edit`
- `v1.admin.org.delete`
- `v1.admin.org.validate`
- `v1.admin.user.view`
- `v1.admin.user.edit`
- `v1.admin.user.delete`
- `v1.admin.user.devices.view`
- `v1.admin.user.devices.edit`
- `v1.admin.user.devices.delete`
- `v1.admin.user.invitations.view`
- `v1.admin.user.invitations.delete`
- `v1.admin.user.accesses.view`
- `v1.admin.user.accesses.create`
- `v1.admin.user.accesses.delete`

The RBAC reference includes `v1.admin` and nested admin permissions, but the contract context states that `v1.admin` roles are work in progress and not currently implemented, while `v1.org.admin` roles are production. Therefore the profile should not overstate production enforcement. The code evidence shows admin permission checks are present; the runtime production status of those checks requires confirmation against the current deployed authorization configuration.

Security controls evidenced by the module:

- Callable groups use `runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`.
- Services emit `permission-denied` conditions where authorization checks fail.
- Admin operations are segmented by permission namespace for users, user devices, user invitations, user accesses, organizations, and broad admin access.

Security-sensitive operations include:

- Deleting user data.
- Removing all devices for a user.
- Removing all invitations for a user.
- Removing all access records for a user.
- Creating user invitation access.
- Recreating or synchronizing access ledgers.
- Refreshing pincodes.
- Updating intercom and access-control-device derived state.

## 10. Cross-Module Relationships

The `admin` module has broad cross-module reach.

### Building Domain

It reads building records and units, mutates building access ledgers, builds intercom base records, links buildings to properties, and updates building settings.

### User Domain

It reads users, deletes user data, mutates user access records, removes devices, removes invitations, creates invitation access, creates user settings, syncs display names, and mutates user intercom records.

### Organization Domain

It lists organizations, fetches organization details, processes onboarding cards, creates residents, updates resident unit metadata, and creates organization prompt data.

### Access Domain

It synchronizes and repairs access state across user and building stores, recreates tokens, and recreates access documents in MongoDB by building.

### Intercom And Call Domain

It deletes and rebuilds user/building intercom records and call transfer lists, and updates access-control-device model data used by intercom/access workflows.

### Settings Domain

It creates and migrates building settings, resident settings, user settings, and unit settings. Evidence also shows imports from user settings services/controllers.

### Prompt/AI Configuration Domain

`OSKDbOrganizationPromptService` imports organization prompt template controller/document classes, indicating maintenance creation of prompt data from shared prompt configuration structures.

## 11. External Hooks

External and environment-sensitive hooks identified in evidence include:

- `OSK_FIREBASE_EMULATOR`
- `GCLOUD_PROJECT`
- `LOCATION_ID`
- MongoDB access document recreation behavior
- Firebase App Check enforcement through callable `runWith` configuration
- Firebase Auth display name synchronization

`OSK_FIREBASE_EMULATOR` controls whether App Check is enforced for the callable functions, allowing local/emulator execution without the same App Check requirement.

`GCLOUD_PROJECT` and `LOCATION_ID` appear in pincode maintenance evidence, suggesting that pincode refresh work depends on Google Cloud project/location context.

The access maintenance functions include behavior named `recreateAccessDocumentInMongoDbByBuilding`, which means this module is not limited to Firestore. It can also repair or regenerate external MongoDB access-control documents.

## 12. Architectural Observations

`admin` is a high-privilege orchestration module rather than a conventional bounded domain module.

The cleanest architectural boundary is by operator intent:

- Admin-facing PGO operations for humans inspecting and changing data.
- Maintenance-facing operations for migrations, denormalization repair, and bulk data correction.

The module’s lack of Firestore triggers is a positive containment signal. Dangerous operations appear to require explicit callable invocation rather than automatic reaction to document writes.

The module also exposes some architectural tension:

- It centralizes necessary operational repair tools.
- It reaches across many domain-owned collections.
- It contains bulk destructive operations.
- It depends on WIP admin RBAC namespaces according to the contract caveat.

That combination makes the module valuable but risky. It should be operated with strict access control, auditability, and environment separation.

## 13. Risks & Open Questions

Key risks:

- Broad blast radius: maintenance services can change or delete data across users, buildings, organizations, access ledgers, settings, intercoms, invitations, devices, and pincodes.
- RBAC maturity: `v1.admin` permissions are present in evidence and RBAC data, but the contract states that `v1.admin` roles are WIP and not currently implemented.
- Destructive operations: user deletion, device deletion, invitation deletion, and access deletion require careful production safeguards.
- Denormalization drift: the need for synchronization and repair services implies historical or ongoing risk of divergence between user-side and building-side access/intercom/pincode records.
- External consistency: MongoDB access document recreation means Firestore state and external access-control state can diverge.
- Emulator behavior: App Check is bypassed under `OSK_FIREBASE_EMULATOR`; deployment and CI workflows must avoid accidentally weakening production enforcement.
- Extractor noise: some evidence entries that look like Firestore paths are package/import strings and should not be treated as data paths.

Open questions:

- Which admin callables are deployed to production versus reserved for one-off/emergency operations?
- Are maintenance callables protected by additional operational controls beyond App Check and permission checks?
- Is there an audit trail for each destructive or bulk maintenance operation?
- Are `v1.admin.*` permissions currently mapped to production roles, or are these callables gated through another authorization mechanism?
- Are MongoDB access document recreation routines idempotent and reconciled after failure?
- Are pincode refresh routines queued, rate-limited, or otherwise protected from broad accidental execution?

## 14. Evidence References

Primary module artefacts:

- `output/knowledge-pipeline/modules/admin/admin-manifest.json`
- `output/knowledge-pipeline/modules/admin/admin-services.json`
- `output/knowledge-pipeline/modules/admin/admin-controllers.json`
- `output/knowledge-pipeline/modules/admin/admin-evidence.json`
- `output/knowledge-pipeline/modules/admin/admin-evidence-graph.json`
- `output/knowledge-pipeline/modules/admin/admin-firestore-triggers.json`

Contract and profile rules:

- `ai-runtime/contracts/module-engineering-profile/contract.md`
- `ai-runtime/contracts/module-engineering-profile/work-order.md`
- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `ai-runtime/contracts/module-engineering-profile/module-engineering-profile-reference-v1.md.md`

Architecture and Firestore references:

- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/firestore.indexes.json`
- `ai-runtime/contracts/docs/rbac-roles.json`

Evidence highlights:

- Manifest summary: 46 files, 17 services, 8 controllers, 117 methods, 663 calls, 15 Firestore hints, 64 permission hints, 30 external hooks, 0 Firestore triggers.
- Literal Firestore path evidence: `/buildings`, `/organizations`, `/users`.
- Firestore trigger evidence: empty trigger list.
- Permission evidence: `v1.admin.*` permission namespaces and `permission-denied` paths across admin building, organization, user, user access, device, invitation, and maintenance utilities.
- Callable evidence: admin building, organization, user, and maintenance callable registration groups composed from the admin index.
