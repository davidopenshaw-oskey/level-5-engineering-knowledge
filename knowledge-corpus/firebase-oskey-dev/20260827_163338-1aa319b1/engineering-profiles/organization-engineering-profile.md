### 0. Generation Metadata

- **runId**: `20260827_163338-1aa319b1`
- **generatedAt**: `2026-08-27T17:06:20.858Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `organization`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

- **Explicit RBAC Enforcement**: Enforced consistently across `_module_root`, `organization_building`, `organization_entity`, `organization_inhabitant`, `organization_intercom_ communication`, `organization_pending`, `organization_property`, `organization_residents`, `organization_user`, and `organization_user_invitation` [Confirmed].
- **Missing RBAC Enforcement**: 
  - **`organization_prompt_templates`**: Performs administrative CRUD operations on prompt templates but enforces **zero** explicit RBAC permission checks in its service layer [Confirmed]. It relies solely on the `@OSKUserSecurityChecks({ checkUserIdMatch: false })` decorator, which only validates that a user is authenticated, potentially allowing any non-admin organization user to modify prompt templates [Inferred].
  - **`organization_user_access`**: Orchestrates user access setup but contains no evidenced RBAC checks in its service layer [Confirmed].

### 2. Architectural Position

- **`v1.admin.org.admin` and `v1.admin.building.admin`**: These two permission strings are explicitly referenced in the code of `_module_root` (specifically within `OSKOrganizationService` candidates) but are **completely absent** from the `rbac-roles.json` schema [Confirmed].
- **Over-scoped Building Creation Permission**: 
  - **`organization_building_invitation`** raises authorization checks against `v1.org.buildings.create` (described in RBAC as "Allows to create a new building") to authorize creating, canceling, querying, and accepting *inhabitant invitations* [Confirmed].
  - **`organization_onboarding_inhabitant`** also raises authorization checks against `v1.org.buildings.create` to authorize *inhabitant onboarding operations* (creating, viewing, and updating onboarding cards) [Confirmed].
  - *Risk*: This is a severe functional mismatch. Users granted the ability to create buildings are implicitly granted full control over resident onboarding and invitations, while resident administrators lacking building-creation rights may be blocked from onboarding workflows [Inferred].
- **User Deletion Permission Bypass**:
  - **`organization_user`** checks the `v1.org.user.edit` permission (described as "Allows to edit a user's information") to authorize user deletion (`deleteOrganizationUser`) instead of enforcing `v1.org.user.delete` [Confirmed]. This allows any user with edit rights to permanently delete PGO users [Inferred].

### 3. Primary Responsibilities

#### _module_root

The capability is responsible for the following core administrative features:
- **Create an Organization (`createAnOrganization`)**: Validates that the caller has the required administrative permissions (`v1.admin.org.register` and `v1.admin.org.validate`), generates timestamps, saves the organization document, and initializes a base entity associated with the organization [Confirmed: `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|createAnOrganization|#1`].
- **Update an Organization (`updateAnOrganization`)**: Validates that the caller has the required permissions (`v1.admin.org.edit` or `v1.org.edit`), updates the organization document, and updates the modification timestamp [Confirmed: `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|updateAnOrganization|#1`].
- **Get All Organizations (`getAllOrganizations`)**: Retrieves a list of all organizations, restricted to authorized administrators with `v1.admin.org.register` or `v1.admin.org.validate` permissions [Confirmed: `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|getAllOrganizations|#1`].
- **Delete Organization Logo (`deleteOrganizationLogo`)**: Deletes the organization's logo image from Google Cloud Storage and updates the organization document to remove the logo reference [Confirmed: `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|deleteOrganizationLogo|#1`].
- **Upload Organization Logo (`uploadimage`)**: Handles uploading a logo image to Google Cloud Storage and updates the organization document with the logo path [Confirmed: `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|uploadimage|#1`].
- **Retrieve Organization User Context (`getOrganizationUser`)**: Utility to fetch and validate an organization user, their associated user document, and their organization document [Confirmed: `class_method|organization|functions/src/modules/organization/utils/get_organization_user.util.ts|OSKOrganizationUserUtils|getOrganizationUser|#1`].

---

#### organization_building

- **Retrieve All Buildings for an Organization**: Fetches the list of buildings associated with a specific organization and merges them with master building data [Confirmed, `` `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getAllOrganizationBuildings|#1` ``].
- **Compile Building Structures for Onboarding**: Queries buildings by property and compiles their units (sorted numerically by floor and unit number) and doors to facilitate the generation of onboarding cards [Confirmed, `` `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getAllOrganizationBuildingsForOnboardingCards|#1` ``].
- **Retrieve Single Organization Building by ID**: Fetches detailed metadata for a specific building within an organization [Confirmed, `` `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getOrganizationBuildingById|#1` ``].
- **Manage Organization Building Documents**: Provides standard CRUD-like operations (`save`, `update`, `get`, `getAll`, `delete`) on the `/organizations/{organizationId}/buildings` Firestore subcollection [Confirmed, `` `functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts` (lines 16-48) ``].

#### organization_building_invitation

The capability provides the following distinct responsibilities:

- **Create Building Inhabitant Invitations**: Validates administrator permissions, verifies the target building and unit exist, resolves authorized doors, generates a unique invitation ID, and registers the invitation. (Confirmed, `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 41-174)).
- **Cancel Building Inhabitant Invitations**: Validates administrator permissions and deletes the pending invitation from the system. (Confirmed, `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 176-224)).
- **Query Building Inhabitant Invitations**: Validates administrator permissions and retrieves lists of sent or rejected invitations filtered by specific fields (e.g., building ID, unit ID). (Confirmed, `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 226-293)).
- **Accept Building Inhabitant Invitations**: Validates administrator permissions, retrieves the target user, queries the pending invitation, provisions the user as an inhabitant in the building unit, and deletes the consumed invitation. (Confirmed, `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 295-397)).

#### organization_entity

The `organization_entity` capability is responsible for the lifecycle and relational hierarchy of organizational entities:

- **Entity Creation (`createEntity`)**: Provisions a new sub-entity under a parent entity or organization, initializing its metadata and appending its ID to the parent's `subEntityIds` array via `FieldValue.arrayUnion` `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|createEntity|#1` ``.
- **Entity Deletion (`deleteEntity`)**: Deletes an entity document, removes its reference from the parent's `subEntityIds` array via `FieldValue.arrayRemove`, and disassociates any linked properties by clearing their `entityId` field `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|deleteEntity|#1` ``.
- **Entity Updates (`updateEntity`)**: Modifies existing entity configurations and metadata `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|updateEntity|#1` ``.
- **Entity Retrieval (`getEntityById` & `getAllEntities`)**: Retrieves a single entity by ID or lists all entities belonging to a specific organization `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getEntityById|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getAllEntities|#1` ``.
- **Parent-Child Reassignment (`assignSubEntityToParent`)**: Updates parent-child entity relationships and handles organization-level re-assignment, including updating the organization's root entity pointer (`entityP`) `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|assignSubEntityToParent|#1` ``.
- **Dashboard Statistics Aggregation (`getEntityDashboardStatics`)**: Aggregates operational metrics for an entity, including counts for residents (onboarded vs. not onboarded), admins, devices, properties, and buildings `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getEntityDashboardStatics|#1` ``.
- **Building Association (`getBuildingsByEntityId`)**: Resolves and retrieves all buildings mapped to a specific entity `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getBuildingsByEntityId|#1` ``.

**Confidence**: Confirmed (fully backed by service method declarations and implementation details).

---

#### organization_inhabitant

- **Querying Organization Inhabitants**: Retrieves all buildings associated with an organization and queries the `inhabitants` collection group to compile a list of inhabitants. (**Confirmed** — `functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (lines 28-54))
- **Retrieving Inhabitant Details**: Fetches a specific inhabitant's details by their user ID, verifying their existence and mapping their associated data. (**Confirmed** — `functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (lines 177-201))
- **Data Mapping and Enrichment**: Enriches raw inhabitant documents (`OSKPmpResidentsDocument`) with user profile details (email, phone), active pincodes, building information, and unit information. (**Confirmed** — `functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (lines 56-109))
- **Permission Enforcement**: Restricts access to inhabitant data by verifying that the calling user has the `v1.org.view` permission. (**Confirmed** — `` `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|getAllOrganizationInhabitants|organizationUser.roles,rolesToCheck|#1` ``)

---

#### organization_intercom_ communication

This capability is responsible for the following core engineering workflows:

### Communication Creation & Orchestration
- **Validation and Permission Checks**: Validates incoming payloads and verifies that the requesting user has the required administrative permissions (`v1.org.communications.create`) within the target organization `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 958-985) ``.
- **AI-Powered Translation**: Automatically translates communication titles and descriptions from a source language (e.g., French) into all supported languages using Vertex AI (Gemini) and organization-specific prompt templates `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1464-1528) ``.
- **Target Resolution**: Resolves targeted buildings and doors, ensuring that valid Access Control Devices (ACDs) exist for each targeted door before proceeding `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1009-1051) ``.
- **Scheduling & Cloud Tasks**: Schedules future activation and deactivation events by registering Cloud Tasks (`activateIntercomCommunicationTask` and `deactivateIntercomCommunicationTask`) `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1154-1240) ``.
- **Immediate Execution**: If the communication schedule starts immediately, it bypasses scheduling and directly updates the targeted ACD configurations and/or triggers resident push notifications `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1323-1373) ``.

### State Management & Archiving (Hot/Cold Storage)
- **Hot Storage Limits**: Enforces a strict limit on the number of scheduled messages (`MAX_SCHEDULED_MESSAGES`) and expired messages (`MAX_EXPIRED_MESSAGES`) kept in the active state document `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 249-268) ``.
- **Preemption**: Supports preempting currently active messages on physical displays when a new immediate message is published, marking the old messages as expired and canceling their pending deactivation tasks `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 210-235) ``.
- **Cold Storage Eviction**: Transactionally evicts older expired messages exceeding the hot storage limit, moving them to a dedicated archive sub-collection `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 288-295) ``.

### Scheduled Task Execution
- **Scheduled Activation**: Triggered by Cloud Tasks to atomically transition a communication's status from `scheduled` to `active`, update targeted physical device configurations, and dispatch push notifications to residents `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 546-613) ``.
- **Scheduled Deactivation**: Triggered by Cloud Tasks to transition a communication's status from `active` to `expired` and remove the message from targeted physical device configurations `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 622-663) ``.

### Communication Deletion
- **Atomic Removal**: Transactionally removes active or scheduled communications from hot or cold storage, cancels any associated pending Cloud Tasks, and clears the message from targeted physical device configurations `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1666-1751) ``.

### Resident Push Notifications
- **Targeted Batching**: Queries active, onboarded app-user residents within targeted buildings and dispatches localized push notifications in batches `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 454-535) ``.

### AI Reformulation
- **Gemini Optimization**: Exposes an endpoint to reformulate and optimize communication titles and descriptions using Gemini and organization-specific prompt templates `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1604-1664) ``.

#### organization_onboarding_inhabitant

### Onboarding Document Creation
- Generates onboarding cards/documents for inhabitants under `/organizations/{id}/onboardingInhabitants` `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 575-719) ``.
- Generates secure 8-character alphanumeric activation codes and numeric SMS OTPs `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 339-360) ``.
- Calculates expiration timestamps for activation codes (defaulting to 30 days) and SMS OTPs (defaulting to 15 minutes) `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 362-373) ``.
- Generates a QR code containing the activation code for mobile app scanning `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 653) ``.

### Activation Code Verification & Inhabitant Onboarding
- **Inhabitant Self-Verification**: Verifies the activation code submitted by an inhabitant, matches their identity (email and phone number), provisions physical access rights via the access service, adds them to the building unit directory, and marks their resident profile as onboarded `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 720-835) ``.
- **Admin-Led Verification**: Allows an organization administrator to manually verify an activation code and onboard an inhabitant `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 922-1052) ``.
- **App Store Tester Onboarding**: Bypasses standard SMS/email verification for designated App Store review accounts using pre-configured tester activation codes `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 837-920) ``.

### Onboarding Notifications & Communications
- Sends onboarding activation emails containing the activation code to the resident `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts` (lines 22-39) ``.
- Dispatches notification emails to Property Manager Portal (PMP) users with the `v1.org.residents.onboardingNotification` permission when a resident successfully completes onboarding `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1431-1493) ``.

#### organization_pending

- **Create Pending Organization**: Allows authenticated users to submit a request to create a new organization, saving the request with a status of "pending" along with details such as name, tax number, street address, and the requesting user's ID [Confirmed] (via `` `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|createPendingOrganization|#1` `` and `functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts` lines 35-89).
- **Retrieve Pending Organizations**:
  - **All Pending Requests**: Allows administrators with validation permissions to retrieve all pending organization requests [Confirmed] (via `` `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|getAllPendingOrganizations|#1` `` and `functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts` lines 107-159).
  - **Current User's Requests**: Allows users to retrieve pending organization requests they have personally submitted [Confirmed] (via `` `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|getCurrentUserPendingOrganizations|#1` `` and `functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts` lines 91-105).
  - **By ID**: Allows authorized administrators to retrieve a specific pending organization request by its ID [Confirmed] (via `` `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|getPendingOrganizationById|#1` `` and `functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts` lines 161-237).
- **Approve Pending Organization Request**: Validates the request, updates its status to "approved", creates the actual organization document, and invites the requesting user as an organization user with administrative roles [Confirmed] (via `` `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|approvePendingOrganizationRequest|#1` `` and `functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts` lines 311-416).
- **Reject Pending Organization Request**: Updates the status of the pending organization request to "rejected" [Confirmed] (via `` `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|rejectPendingOrganizationRequest|#1` `` and `functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts` lines 239-309).

#### organization_prompt_templates

- **Template Retrieval**: Fetching a single prompt template by name (via `get`) or listing all templates for an organization (via `getAll`) `` `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|get|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|getAll|#1` ``. [Confirmed]
- **Template Creation and Storage**: Creating a new prompt template with `promptName` and `promptTemplate` content, automatically appending `creationDate` and `modificationDate` timestamps using `Timestamp.now()` `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 77-78) ``. [Confirmed]
- **Template Modification**: Updating an existing template's content and updating its `modificationDate` timestamp `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (line 99) ``. [Confirmed]
- **Template Deletion**: Removing a prompt template document from Firestore `` `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|delete|#1` ``. [Confirmed]
- **Parameter Validation**: Validating incoming request parameters (such as verifying `context` is an object, and `organizationId`, `promptName`, and `promptTemplate` are strings) before executing database operations `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 66-70) ``. [Confirmed]
- **Security Enforcement**: Applying user security checks to verify the caller's session without strictly requiring a matching user ID `` `call_expression|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKUserSecurityChecks|create|{ checkUserIdMatch: false }|#1` ``. [Confirmed]

---

#### organization_property

- **Property Lifecycle Management**: Supports creating, retrieving, updating, and deleting properties within an organization's scope `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 39-294) ``.
- **Entity Assignment**: Handles assigning properties to specific administrative Entities (Syndics) and moving them between entities, updating both the property document and the respective entity documents `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 295-361) ``.
- **Property Image Management**: Manages uploading and deleting property images, delegating the physical storage operations to Google Cloud Storage via the core document controller `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 363-421) ``.
- **Dashboard Statistics Aggregation**: Aggregates metrics for a property, including total buildings, total organization admins, device counts across all doors, and resident onboarding statistics (onboarded vs. not onboarded) `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 422-467) ``.
- **Validation and Security**: Enforces RBAC permissions and parameter validation before executing operations `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 105-110, 133-134) ``.

#### organization_residents

This capability provides the following distinct responsibilities:

- **Bulk Resident Creation**: Supports batch processing of residents, routing each payload to either App User or Non-App User creation logic based on the `isAppUser` flag, with batch size limited by the `MAX_BATCH_SIZE` environment variable (`` `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|bulkCreateResidents|#1` ``). [Confirmed]
- **App User Resident Creation**: Generates onboarding activation codes, calculates expiration, generates QR codes, creates onboarding inhabitant documents in `/organizations/{id}/onboardingInhabitants`, and saves resident documents in `/organizations/{id}/residents` (`` `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|createAppUserResident|#1` ``). [Confirmed]
- **Non-App User Resident Creation**: Provisions PIN-only residents, creates non-app user documents in `/buildings/{id}/units/{id}/nonAppUsers` (via `nonAppUserController.create`), validates and converts access rights, and saves resident documents in `/organizations/{id}/residents` (`` `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|createNonAppUserResident|#1` ``). [Confirmed]
- **Resident Deletion & Cleanup**: Orchestrates the deletion of a resident. If they are an App User, it deletes their accesses, pincodes, and intercom entries, and cleans up invited non-app users, permanent guests, and pending unit invitations (`` `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|deleteResident|#1` ``). If they are the last main resident (owner/tenant) in a unit, it deletes all inhabitants and the unit itself (`` `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService.logger.logInfo|checkInhabitantTypeAndDeleteAllInhabitantresident|Last main resident...|#1` ``). [Confirmed]
- **Resident Retrieval**: Supports retrieving all residents for an organization (`getAllResidents`) or filtered by property ID (`getAllResidentsByPropertyId`) (`` `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|getAllResidents|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|getAllResidentsByPropertyId|#1` ``). [Confirmed]
- **Resident Updates**: Updates resident details in `/organizations/{id}/residents` and synchronizes changes to the unit inhabitant document in `/buildings/{id}/units/{id}/inhabitants` and onboarding documents (`` `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|updateResident|#1` ``). [Confirmed]

#### organization_user

- **Managing Organization User Roles**: Updates the roles assigned to an organization user, generating consolidated roles and updating both the organization-scoped user record and the global user-organization mapping `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 41-128) `` [Confirmed].
- **Updating Organization User Profiles**: Modifies the first name, last name, and email of an organization user, validating the request against the user's global profile and updating the organization-scoped user record `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 130-205) `` [Confirmed].
- **Deleting Organization Users**: Removes an organization user from the organization's scoped users collection and deletes the corresponding user-organization mapping, preventing the user from accessing the organization's resources `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 207-255) `` [Confirmed].
- **Listing and Retrieving Users and Invitees**: Retrieves a combined list of active organization users and pending invitees (with their respective "active" or "invited" status) to populate the PGO directory `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 257-311) `` [Confirmed].
- **Querying Administrative Users**: Filters and retrieves organization users who hold administrative roles (such as `v1.org.admin` or `v1.admin`) `` `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts` (lines 46-62) `` [Confirmed].

#### organization_user_access

### Setup Organization User Access [Confirmed]
- Orchestrates the setup of user access within an organization via the `setupOrganizationUserAccess` method on `OSKOrganizationUserAccessService` `` `service_method|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKOrganizationUserAccessService|setupOrganizationUserAccess|#1` ``.
- Generates a unique access identifier using the core access utility service `OSKAccessUtilsService.generateAccessId` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKAccessUtilsService.generateAccessId|setupOrganizationUserAccess||#1` ``.
- Resolves the name of the inviter associated with the access setup using `OSKAccessUtilsService.getAccessInviterName` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKAccessUtilsService.getAccessInviterName|setupOrganizationUserAccess|inviterId|#1` ``.
- Captures the current timestamp for the access setup using Firestore's `Timestamp.now` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|Timestamp.now|setupOrganizationUserAccess||#1` ``.

---

#### organization_user_invitation

- **Inviting Users**: Supports inviting standard users and PMP users to an organization (**Confirmed**; `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|inviteUserWithInvitation|#1` ``, `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|invitePMPUserWithInvitation|#1` ``).
- **Creating PMP Users with Invitation**: Allows administrative creation of PMP users alongside an invitation workflow (**Confirmed**; `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|createPMPUserWithInvitation|#1` ``).
- **Cancelling Invitations**: Provides mechanisms to cancel outstanding invitations, moving them to a cancelled state (**Confirmed**; `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|cancelUsersInvitation|#1` ``).
- **Processing Invitations**: Handles the acceptance and processing of invitations, generating consolidated roles and linking the user to the organization (**Confirmed**; `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|processPMPInvitation|#1` ``).
- **Querying Invitations**: Allows querying pending invitations for a specific user based on their email or phone number (**Confirmed**; `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|queryPMPInvitations|#1` ``).
- **Email Notifications**: Dispatches invitation emails using the `pmpUserInvitation` template via `OSKEmailService` (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 543-558) ``).
- **Access Provisioning**: Automatically provisions building and door access for invited users upon invitation creation using `OSKAccessService` (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 226-238) ``).

---

### 4. Public Interfaces

#### _module_root

This capability exposes the following public entry points and controllers:
- **`OSKOrganizationController`** (`functions/src/modules/organization/controllers/organization.controller.ts`): Extends `OSKDocumentController` and provides CRUD-like document operations and image upload/deletion utilities for organizations [Confirmed: `source_class|organization|functions/src/modules/organization/controllers/organization.controller.ts|OSKOrganizationController`].
- **`OSKOrganizationService`** (`functions/src/modules/organization/services/organization.service.ts`): Orchestrates business logic, permission checks, and database updates for organization-level operations [Confirmed: `source_class|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService`].
- **`OSKOrganizationUserUtils`** (`functions/src/modules/organization/utils/get_organization_user.util.ts`): Utility class providing helper methods to retrieve and validate organization users [Confirmed: `source_class|organization|functions/src/modules/organization/utils/get_organization_user.util.ts|OSKOrganizationUserUtils`].

---

#### organization_building

- **OSKOrganizationBuildingController**: Extends `OSKDocumentController` to handle direct Firestore document operations on the `/organizations/{organizationId}/buildings` path [Confirmed, `` `source_class|organization|functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts|OSKOrganizationBuildingController|#1` ``].
- **OSKOrganizationBuildingService**: Orchestrates business logic, permission checks, and cross-module data aggregation [Confirmed, `` `source_class|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|#1` ``].
- **Callable Cloud Functions**: Exposes entry points for client applications to interact with the service [Confirmed, `` `functions/src/modules/organization/modules/organization_building/index.ts` (lines 39-51) ``]:
  - `getAllOrganizationBuildings` [Confirmed, `` `api_contract|organization|functions/src/modules/organization/modules/organization_building/index.ts|getAllOrganizationBuildings|#1` ``]
  - `getAllOrganizationBuildingsForOnboardingCards` [Confirmed, `` `api_contract|organization|functions/src/modules/organization/modules/organization_building/index.ts|getAllOrganizationBuildingsForOnboardingCards|#1` ``]
  - `getOrganizationBuildingById` [Confirmed, `` `api_contract|organization|functions/src/modules/organization/modules/organization_building/index.ts|getOrganizationBuildingById|#1` ``]

#### organization_building_invitation

The capability exposes its functionality through the following entry points:

### Callable Cloud Functions
Exposed in `functions/src/modules/organization/modules/organization_building_invitation/index.ts` (lines 40-47):
- `createBuildingInhabitantInvitation`: Entry point for creating invitations.
- `queryBuildingInhabitantInvitation`: Entry point for querying invitations.
- `acceptBuildingInhabitantInvitation`: Entry point for accepting invitations.

### Services
- `OSKOrganizationBuildingInvitationService`: The core service class orchestrating the business logic for invitations. (Confirmed, `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (line 38)).

#### organization_entity

This capability exposes its functionality through the following controllers and entry points:

- **`OSKEntityController`** `` `source_class|organization|functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts|OSKEntityController` ``:
  - Extends `OSKDocumentController` to provide standardized Firestore document operations (`get`, `getAll`, `save`, `update`, `delete`, `generateDocId`) for entity documents.
  - Defines the collection path as `/entities` `` `controller_method|organization|functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts|OSKEntityController|getCollectionPath|#1` ``.
- **`OSKEntityService`** `` `source_class|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService` ``:
  - The core service orchestrating business logic, parameter validation, permission enforcement, and cross-submodule coordination.
- **`getCallableFunctionTriggers`** `` `function_declaration|organization|functions/src/modules/organization/modules/organization_entity/index.ts|getCallableFunctionTriggers|#1` ``:
  - The entry point exporting the Firebase HTTPS Callable triggers to the Firebase runtime, enforcing App Check unless running in an emulator environment.

---

#### organization_inhabitant

- **Controllers**:
  - `OSKOrganizationInhabitantController` (extends `OSKDocumentController`): Exposes the `queryInhabitants` method to query the Firestore collection group. (**Confirmed** — `` `source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts|OSKOrganizationInhabitantController` ``)
- **Services**:
  - `OSKOrganizationInhabitantService`: Exposes core business logic methods including `getInhabitantsForOrganization`, `mapInhabitantData`, `addUserEmailAndPhone`, `getAllOrganizationInhabitants`, `getInhabitantDetailsByUserId`, and `getInhabitantDetailsById`. (**Confirmed** — `` `source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService` ``)
- **Entry Points (Callable Functions)**:
  - `getAllOrganizationInhabitants`: Callable function trigger to retrieve all inhabitants of an organization. (**Confirmed** — `` `api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getAllOrganizationInhabitants|#1` ``)
  - `getInhabitantDetailsById`: Callable function trigger to retrieve detailed information for a specific inhabitant. (**Confirmed** — `` `api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getInhabitantDetailsById|#1` ``)

---

#### organization_intercom_ communication

This capability exposes the following internal controllers and service entry points:

### Controllers
- **`OSKIntercomBuildingStateController`** (extends `OSKDocumentController`): Manages the hot storage state document (`default`) containing active, scheduled, and recently expired communications for a specific building `` `functions/src/modules/organization/modules/organization_intercom_ communication/controllers/organization_intercom_building_state.controller.ts` (lines 13-76) ``.
- **`OSKIntercomCommunicationArchiveController`** (extends `OSKDocumentController`): Manages the cold storage archive sub-collection containing evicted expired communications `` `functions/src/modules/organization/modules/organization_intercom_ communication/controllers/organization_intercom_communication_archive.controller.ts` (lines 14-64) ``.

### Services
- **`OSKIntercomCommunicationService`**: The primary service orchestrator containing the business logic for creating, deleting, translating, and executing scheduled communications `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 65-1811) ``.

### Entry Points
- **`getCallableFunctionTriggers`**: The module entry point exporting the Firebase callable HTTPS triggers to the Firebase runtime `` `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts` (lines 51-75) ``.

#### organization_onboarding_inhabitant

### Controllers
- **`OSKOrganizationOnboardingInhabitantController`** (extends `OSKDocumentController`): Exposes standard document operations (get, getAll, create, update, delete, query) for onboarding inhabitant documents under the organization scope `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts` (lines 15-78) ``.

### Services
- **`OSKOrganizationOnboardingInhabitantService`**: The primary orchestrator of onboarding business logic, including code generation, verification, and resident provisioning `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 67-1493) ``.
- **`OSKOrganizationOnboardingMailService`**: Handles the dispatch of onboarding-related emails `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts` (lines 19-109) ``.

#### organization_pending

- **OSKOrganizationPendingController** (extends `OSKDocumentController`): Handles direct Firestore document operations for the `organizationsPending` collection, exposing methods such as `generateDocId`, `getAll`, `getAllByUserId`, `getById`, `save`, and `update` [Confirmed] (via `functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts` lines 10-49).
- **OSKOrganizationPendingService**: Orchestrates the business logic for pending organizations, including permission checks, validation, and integration with other services [Confirmed] (via `functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts` lines 32-416).
- **getCallableFunctionTriggers**: The entry point exporting the Firebase Callable Cloud Functions to the Firebase runtime [Confirmed] (via `functions/src/modules/organization/modules/organization_pending/index.ts` lines 21-35).

#### organization_prompt_templates

- **Controllers**:
  - `OSKOrganizationPromptTemplateController` (extends `OSKDocumentController`) `` `source_class|organization|functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts|OSKOrganizationPromptTemplateController` ``. This controller manages the Firestore document operations for prompt templates.
- **Services**:
  - `OSKOrganizationPromptTemplateService` `` `source_class|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService` ``. This service acts as the primary orchestrator for validating parameters, applying security decorators, and invoking the controller.
- **Entry Points**:
  - Callable Cloud Functions exported via `getCallableFunctionTriggers` in `` `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (lines 35-44) ``:
    - `create`
    - `delete`
    - `get`
    - `getAll`
    - `update`

---

#### organization_property

- **OSKPropertyController**: Extends `OSKDocumentController` and provides low-level Firestore document operations (get, save, update, delete, query, array manipulation, and image upload/deletion) for the `/properties` collection `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 9-67) ``.
- **OSKPropertyService**: The primary service class orchestrating business logic, security checks, and cross-module coordination for property operations `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 35-522) ``.
- **getCallableFunctionTriggers**: Exposes the HTTPS callable Cloud Functions that serve as the API entry points for client applications `` `functions/src/modules/organization/modules/organization_property/index.ts` (lines 46-58) ``.

#### organization_residents

This capability exposes the following public entry points:

- **`OSKOrganizationResidentsController`**: Extends `OSKDocumentController` to expose CRUD operations for organization residents (`` `source_class|organization|functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts|OSKOrganizationResidentsController` ``).
- **`getCallableResidentsFunctionTriggers`**: Entry point exporting Firebase Callable HTTPS triggers (`` `function_declaration|organization|functions/src/modules/organization/modules/organization_residents/index.ts|getCallableResidentsFunctionTriggers|#1` ``).
- **`OSKOrganizationResidentsService`**: Core service orchestrating business logic (`` `source_class|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService` ``).

#### organization_user

- **OSKOrganizationUserController**: A document controller extending `OSKDocumentController` that handles direct Firestore operations on the `/organizations/{organizationId}/users` collection `` `source_class|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController` `` [Confirmed].
- **OSKOrganizationUserService**: A service class containing the core business logic for managing organization users, validating permissions, and orchestrating updates across the `organization` and `user` modules `` `source_class|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService` `` [Confirmed].
- **Callable Cloud Functions**: Exposes entry points for client applications (PGO) to trigger organization user management workflows `` `function_declaration|organization|functions/src/modules/organization/modules/organization_user/index.ts|getCallableFunctionTriggers|#1` `` [Confirmed].

#### organization_user_access

### Services
- **`OSKOrganizationUserAccessService`** `` `source_class|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKOrganizationUserAccessService` ``: The primary service class containing the business logic for setting up organization user access. It is exported as a public entry point for this capability in `functions/src/modules/organization/modules/organization_user_access/index.ts` `` `exported_symbol|organization|functions/src/modules/organization/modules/organization_user_access/index.ts|./services/organization_user_access.service|#1` ``.

---

#### organization_user_invitation

The capability exposes the following controllers and services:

### Controllers
- **`OSKOrganizationPMPUserInvitationController`** (extends `OSKDocumentController`): Manages querying collection groups for PMP user invitations (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_pmp_user_invitation.controller.ts` (lines 10-25) ``).
- **`OSKOrganizationUserInvitationPendingController`** (extends `OSKDocumentController`): Manages pending user invitations under the user's scope (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation_pending.controller.ts` (lines 11-24) ``).
- **`OSKOrganizationUserInvitationController`** (extends `OSKDocumentController`): Manages the persistence of invitations, cancellations, and rejections under the organization's scope (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts` (lines 15-107) ``).

### Services
- **`OSKOrganizationUserInvitationService`**: The primary orchestrator containing the business logic for creating, processing, querying, and cancelling invitations (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 44-738) ``).

---

### 5. Internal Structure

The `organization` module is highly modularized, consisting of 13 submodules coordinated by the `_module_root` entry point [Confirmed]. The internal coupling graph reveals a highly centralized architecture [Confirmed]:

- **Centralized User Context**: The `organization_user` submodule acts as the primary internal dependency, imported by 10 sibling submodules (`organization_building`, `organization_building_invitation`, `organization_entity`, `organization_inhabitant`, `organization_intercom_ communication`, `organization_onboarding_inhabitant`, `organization_pending`, `organization_property`, `organization_residents`, and `organization_user_invitation`) [Confirmed]. This coupling is driven by the need to resolve administrative user roles and permissions across all organizational workflows [Confirmed].
- **Resident and Onboarding Coordination**: The `organization_residents` submodule is tightly coupled with `organization_onboarding_inhabitant` to manage the transition of inhabitants from invited placeholders to active residents [Confirmed]. It also couples with `organization_property` to aggregate property-level resident statistics [Confirmed].
- **Communication and Templates**: The `organization_intercom_ communication` submodule depends on `organization_prompt_templates` to retrieve AI translation and reformulation templates, and on `organization_residents` to resolve target notification recipients [Confirmed].
- **Invitation and Pending Flows**: The `organization_pending` submodule couples with `organization_user_invitation` to automatically invite the requesting user as an organization administrator upon pending request approval [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

Based on the deterministic call edges and data ownership signals, the true ownership of the module's shared and primary collections is resolved as follows:

- **`/organizations/{id}`**: Owned directly by `_module_root` via `OSKOrganizationController` [Confirmed]. This is the authoritative store for organization-level metadata [Confirmed].
- **`/organizations/{organizationId}/users/{userId}`**: Owned by `organization_user` via `OSKOrganizationUserController` [Inferred]. This controller is the primary authority for administrative user profiles, called by 10 internal submodules and 5 external modules [Confirmed].
- **`/organizations/{organizationId}/residents/{residentId}`**: Owned by `organization_residents` via `OSKOrganizationResidentsController` [Inferred]. It serves as the canonical registry of resident profiles, called by 3 internal submodules and 3 external modules [Confirmed].
- **`/properties/{propertyId}`**: Owned by `organization_property` via `OSKPropertyController` [Inferred]. It manages property-level metadata and building associations, called by 2 internal submodules and 2 external modules [Confirmed].
- **`/entities/{entityId}`**: Owned by `organization_entity` via `OSKEntityController` [Inferred]. It manages the legal syndic subdivisions, called by `organization_property` and the external `supplier` module [Confirmed].
- **`/organizations/{organizationId}/onboardingInhabitants/{onboardingId}`**: Owned by `organization_onboarding_inhabitant` via `OSKOrganizationOnboardingInhabitantController` [Inferred]. It stores the temporary onboarding cards and activation states [Confirmed].
- **`/organizations/{organizationId}/promptTemplates/{promptName}`**: Owned by `organization_prompt_templates` via `OSKOrganizationPromptTemplateController` [Inferred]. It manages organization-scoped prompt templates [Confirmed].
- **`/organizations/{organizationId}/userInvitations/{email}`**: Owned by `organization_user_invitation` via `OSKOrganizationUserInvitationController` [Inferred]. It manages pending PGO administrative invitations [Confirmed].
- **`organizationsPending`**: Owned by `organization_pending` [Inferred]. It manages the pre-provisioning state of new organization requests [Confirmed].

**Per-capability evidence:**

#### _module_root

### Firestore Paths
This capability directly reads and writes to the following Firestore collections:
- **`/organizations/{id}`**: Owned and managed via `OSKOrganizationController` targeting the `'organizations'` collection [Confirmed: `functions/src/modules/organization/controllers/organization.controller.ts` (lines 20-26)]. Operations include read (`_get`, `_query`) and write (`_set`, `_update`) [Confirmed: `functions/src/modules/organization/controllers/organization.controller.ts` (lines 28-61)].
- **`/organizations/{organizationId}/users/{userId}`**: Read via `OSKOrganizationUserController` in `getOrganizationUser` [Confirmed: `functions/src/modules/organization/utils/get_organization_user.util.ts` (lines 37-38)].
- **`/users/{userId}`**: Read via `OSKUserController` in `getOrganizationUser` [Confirmed: `functions/src/modules/organization/utils/get_organization_user.util.ts` (lines 25-26)].
- **`/entities/{entityId}`**: Written to (saved) during organization creation via `OSKEntityController.default.save` [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 174)].

---

#### organization_building

### Firestore Paths
- **`/organizations/{organizationId}/buildings/{buildingId}`** [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts|OSKOrganizationBuildingController.default._set|save|`/organizations/${organizationId}/buildings`,buildingId,data|#1` ``]
  - **Operations**: Read, Write (Create, Update, Delete)
  - **Data Model**: `OSKOrganizationBuilding` [Confirmed, `` `type_alias|organization|functions/src/modules/organization/modules/organization_building/models/documents/organization_building_document_model.ts|OSKOrganizationBuilding|#1` ``]
    - `organizationId`: `string`
    - `buildingId`: `string`
    - `buildingName`: `string`
    - `buildingData`: `OSKBuilding` (imported from `@oskey/building`)
    - `numberOfDevices`: `number`
    - `numberOfResidents`: `number`
    - `numberOfUnits`: `number`

#### organization_building_invitation

This capability does not directly own or write to any Firestore collections. Instead, it acts as an orchestration layer that delegates data persistence to other submodules and modules:
- Delegates invitation creation, deletion, and querying to `OSKBuildingUnitInvitationController` (which manages `/buildings/{id}/units/{id}/invitationsSent` or similar collections). (Confirmed, `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 102, 150, 204, 258, 343, 384)).
- Delegates inhabitant provisioning to `OSKBuildingUnitInhabitantService` (which manages `/buildings/{id}/units/{id}/inhabitants`). (Confirmed, `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (line 382)).

#### organization_entity

### Firestore Paths
This capability directly owns and modifies documents within the following Firestore paths:

- **`/entities/{entityId}`** (represented as `/entities` in the schema map):
  - **Operations**: Read, Write, Update, Delete.
  - **Fields**: `organizationId`, `entityId`, `entityName`, `entityType`, `parentEntityId`, `propertiesIds`, `subEntityIds` `` `functions/src/modules/organization/modules/organization_entity/models/documents/entity_document_model.ts` ``.
- **`/organizations/{organizationId}`**:
  - **Operations**: Update (specifically updates the root entity pointer `entityP` during reassignment) `` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKOrganizationController.default.update|assignSubEntityToParent|oldOrganizationId,{             entityP: newParentEntityId,         }|#1` ``.
- **`/properties/{propertyId}`**:
  - **Operations**: Update (clears `entityId` when an entity is deleted) `` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityController.default.update|deleteEntity|propertiesId,{ entityId: '' }|#1` ``.

---

#### organization_inhabitant

- **Firestore Paths**:
  - `inhabitants` (Collection Group): Queried to retrieve inhabitant documents. (**Confirmed** — `` `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts|OSKOrganizationInhabitantController.default._queryCollectionGroup|queryInhabitants|collectionName,queryFilters|#1` ``)
  - *Note*: According to the Firestore schema, the full path is `/buildings/{id}/units/{id}/inhabitants`.
- **Operation Detection Scope**: Read-only query (`_queryCollectionGroup`). No write operations (create, update, delete) are evidenced within this capability pack. (**Confirmed**)

---

#### organization_intercom_ communication

This capability transactionally reads and writes to the following Firestore collections [Confirmed]:

| Path / Pattern | Operation | Scope / Touch Type | Evidence |
| --- | --- | --- | --- |
| Dynamic State Path (Hot Storage) | Read / Write | `db.collection(stateCollectionPath).doc('default')` | `` `firestore_path_touched|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|default|#1` `` |
| Dynamic State Path (Hot Storage) | Read / Write | `db.collection(stateCollectionPath).doc('default')` | `` `firestore_path_touched|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|default|#2` `` |
| Dynamic State Path (Hot Storage) | Read / Write | `db.collection(stateCollectionPath).doc('default')` | `` `firestore_path_touched|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|default|#3` `` |
| Dynamic Archive Path (Cold Storage) | Read / Write | `archiveCollectionRef.doc(msg.communicationId)` | `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 291, 432, 1796) |

### Indirect Data Access (Read-Only)
This capability reads from the following collections owned by other capabilities/modules to resolve business context:
- `/organizations/{organizationId}` (via `OSKOrganizationController`)
- `/organizations/{organizationId}/users/{userId}` (via `OSKOrganizationUserController`)
- `/organizations/{organizationId}/promptTemplates/{templateId}` (via `OSKOrganizationPromptTemplateController`)
- `/organizations/{organizationId}/residents` (via `OSKOrganizationResidentsController`)
- `/buildings/{buildingId}` (via `OSKBuildingController`)
- `/buildings/{buildingId}/doors/{doorId}` (via `OSKBuildingDoorController`)
- `/accessControlDevices/{deviceId}/configs` (via `OSKAccessControlDeviceConfigController`)

#### organization_onboarding_inhabitant

### Firestore Paths
This capability reads, writes, and queries documents within the following Firestore paths:

- **`/organizations/{organizationId}/onboardingInhabitants`** [Confirmed]
  - *Operations*: Create, Read, Update, Delete `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts` (lines 18-78) ``.
  - *Description*: Stores the canonical onboarding cards containing activation codes, SMS OTPs, and verification states.
- **`/organizations/{organizationId}/onboardingCards`** [Inferred]
  - *Operations*: Read, Write (via Firestore Security Rules) `` `firestore.rules.txt` ``.
  - *Note*: There is a naming discrepancy between the Firestore rules (which reference `/onboardingCards`) and the actual database schema/controller queries (which reference `/onboardingInhabitants`).

#### organization_pending

- **Firestore Collection**: `organizationsPending`
  - **Operations**: Read, Write, Query, Update [Confirmed] (via `functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts` lines 14-49).
  - **Description**: Stores the pending organization requests containing the name, status, street address, tax number, and requesting user's ID [Confirmed] (via `functions/src/modules/organization/modules/organization_pending/models/documents/organization_pending_document.model.ts` lines 8-16).

#### organization_prompt_templates

- **Firestore Paths**:
  - `/organizations/{organizationId}/promptTemplates/{promptName}`: This capability owns and manages documents within this path.
    - **Fields**: `promptName` (string), `modificationDate` (timestamp), `creationDate` (timestamp), `promptTemplate` (string), `organizationId` (string) (as evidenced in `firestore-schema.md` and `` `functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts` ``).
    - **Operations**: Read (Get, Query/GetAll), Write (Create/Set, Update, Delete) `` `functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts` (lines 18-52) ``. [Confirmed]

---

#### organization_property

- **`/properties`**: This capability owns the `/properties` collection, which stores property metadata, address, management type, property type, and associated building IDs `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (line 13) ``.
- **`/buildings/{id}`**: This capability performs updates on the `/buildings` collection to link or unlink buildings to/from properties when properties are created, updated, or deleted `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 171, 289) ``.
- **`/entities`**: This capability updates the `propertiesIds` array on entity documents when properties are assigned or reassigned `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 350, 354) ``.

#### organization_residents

This capability owns and directly modifies the following Firestore paths:

- **`/organizations/{organizationId}/residents/{residentId}`**: Read, written, and deleted (via `OSKOrganizationResidentsController` and `OSKOrganizationResidentsService`). [Confirmed]
- **`/organizations/{organizationId}/onboardingInhabitants/{onboardingId}`**: Created, updated, and deleted (via `OSKOrganizationOnboardingInhabitantController`). [Confirmed]
- **`/buildings/{buildingId}/units/{unitId}/inhabitants/{userId}`**: Read, updated, and deleted (via `OSKBuildingUnitInhabitantController` and `OSKBuildingUnitInhabitantService`). [Confirmed]
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}`**: Created, read, and deleted (via `OSKBuildingUnitNonAppUserController`). [Confirmed]
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/accesses/{accessId}`**: Read and deleted (via `OSKNonAppUserAccessController`). [Confirmed]
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes/{pincodeId}`**: Read and deleted (via `OSKNonAppUserPincodeController`). [Confirmed]
- **`/buildings/{buildingId}/units/{unitId}/permanentGuests/{guestUserId}`**: Read and deleted (via `OSKBuildingUnitPermanentGuestController`). [Confirmed]
- **`/buildings/{buildingId}/pincodes/{pincodeId}`**: Deleted (via `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash`). [Confirmed]
- **`/users/{userId}/pincodes/{pincodeId}`**: Deleted (via `OSKUserPincodeController.default.delete`). [Confirmed]
- **`/users/{userId}/accesses/{accessId}`**: Read and deleted (via `OSKUserAccessesController`). [Confirmed]
- **`/buildings/{buildingId}/accesses/{accessId}`**: Deleted (via `OSKBuildingAccessesController.default.deletePerUser`). [Confirmed]
- **`/buildings/{buildingId}/intercoms/{intercomId}`**: Intercom entries deleted (via `OSKBuildingIntercomService.deleteIntercomEntryUser` and `deleteIntercomEntry`). [Confirmed]

#### organization_user

- **`/organizations/{organizationId}/users/{userId}`**: This capability owns the documents in this path, representing the organization-scoped user profiles and their assigned roles. It performs read, write, and delete operations on this collection `` `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts` (lines 18-44) `` [Confirmed].
- **`/organizations/{organizationId}/userInvitations/{email}`**: Reads pending invitations to merge invitees into the organization user list `` `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserInvitationController.getAll|getAllOrganizationUser|organizationId|#1` `` [Confirmed].
- **`/users/{userId}/organizations/{organizationId}`**: Updates or deletes the user's global organization membership and roles mapping `` `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKUserOrganizationController.default.update|updateOrganizationUser|...|#1` `` [Confirmed].

#### organization_user_access

### Firestore Paths [Inferred]
While this capability imports `firebase-admin/firestore` `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|firebase-admin/firestore|#1` `` and utilizes Firestore `Timestamp` objects `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|Timestamp.now|setupOrganizationUserAccess||#1` ``, there are no direct Firestore read or write operations explicitly detailed in the capability's evidence pack. 

Based on the system architecture and the service's responsibility to set up user access, it is highly likely that this capability interacts with user-scoped or building-scoped accesses (e.g., `/users/{id}/accesses` or `/buildings/{id}/accesses`), but this cannot be confirmed from the current evidence pack.

---

#### organization_user_invitation

This capability owns and performs read/write operations on the following Firestore paths:

### `/users/{userId}/organizationInvitations/{organizationId}`
- **Operations**: Read, Write (**Confirmed**; `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation_pending.controller.ts|OSKOrganizationUserInvitationPendingController.default._set|save|\`/users/\${userId}/organizationInvitations/\`,organizationId,data|#1` ``, `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._get|getUsersOrganization|\`/users/\${userId}/organizationInvitations/\`,organizationId|#1` ``).
- **Description**: Stores pending organization invitations scoped to a specific user.

### `/organizations/{organizationId}/userInvitations/{email}`
- **Operations**: Read, Write, Delete (**Confirmed**; `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._set|save|\`/organizations/\${organizationId}/userInvitations\`,email,data|#1` ``, `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._delete|deleteOrganizationUserInvitation|\`/organizations/\${organizationId}/userInvitations\`,email|#1` ``).
- **Description**: Stores active user invitations scoped to an organization.

### `/organizations/{organizationId}/userInvitationsRejected/{email}`
- **Operations**: Write (**Confirmed**; `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._set|moveOrganizationUserInvitation|\`/organizations/\${organizationId}/userInvitationsRejected\`,email,data|#1` ``).
- **Description**: Stores rejected invitations.

### `/organizations/{organizationId}/userInvitationsCancelled/{email}`
- **Operations**: Write (**Confirmed**; `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._set|saveOrganizationUserInvitationCancelled|\`/organizations/\${organizationId}/userInvitationsCancelled\`,email,data|#1` ``).
- **Description**: Stores cancelled invitations.

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### API Contracts (Callable Functions)
The following callable functions are registered as entry points [Confirmed: `functions/src/modules/organization/index.ts` (lines 89-109)]:
- **`createAnOrganization`** [Confirmed: `` `api_contract|organization|functions/src/modules/organization/index.ts|createAnOrganization|#1` ``]
- **`updateAnOrganization`** [Confirmed: `` `api_contract|organization|functions/src/modules/organization/index.ts|updateAnOrganization|#1` ``]
- **`getAllOrganizations`** [Confirmed: `` `api_contract|organization|functions/src/modules/organization/index.ts|getAllOrganizations|#1` ``]
- **`deleteOrganizationLogo`** [Confirmed: `` `api_contract|organization|functions/src/modules/organization/index.ts|deleteOrganizationLogo|#1` ``]

### Request/Response Schemas
The request schemas for the resolved callable functions are defined as follows:

#### `createAnOrganization`
- **Request Type**: `OSKOrganizationCreateRequest` [Confirmed]
  - `adminsOrganizationId`: `string`
  - `id`: `string`
  - `isoCountryCode`: `string`
  - `name`: `string`
  - `organizationLogo`: `string | undefined` (optional)
  - `streetAddress`: `OSKStreetAddress`
  - `taxNumber`: `string`
  - `tenant`: `string`
  - `userRoles`: `string[]`

#### `updateAnOrganization`
- **Request Type**: `OSKOrganizationUpdateRequest` [Confirmed]
  - `adminsOrganizationId`: `string`
  - `id`: `string`
  - `isoCountryCode`: `string`
  - `name`: `string`
  - `organizationLogo`: `string | undefined` (optional)
  - `streetAddress`: `OSKStreetAddress`
  - `taxNumber`: `string`
  - `tenant`: `string`
  - `userRoles`: `string[]`

#### `getAllOrganizations`
- **Request Type**: `OSKGetAllOrganizationsRequestDocument` [Confirmed]
  - `adminsOrganizationId`: `string`

#### `deleteOrganizationLogo`
No `model_property` facts matched within this pack for this endpoint's request/response schemas [Confirmed].

### Firestore Triggers
No Firestore triggers are registered directly within this capability's root file [Confirmed: `functions/src/modules/organization/index.ts` (lines 89-109)].

---

#### organization_building

### Callable API Contracts

#### `getAllOrganizationBuildings`
- **Request Schema**: `OSKGetAllOrganizationBuildingsRequestData`
  - `organizationId`: `string`
- **Response Schema**: Returns an array of organization buildings merged with master building data.

#### `getAllOrganizationBuildingsForOnboardingCards`
- **Request Schema**: `OSKGetAllOrganizationBuildingsByPropertyRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema**: `OSKBuildingForOnboardingCards`
  - `buildingId`: `string`
  - `buildingName`: `string`
  - `units`: `OSKBuildingForOnboardingCardUnit[]`
    - `unitId`: `string`
    - `unitNumber`: `string`
    - `name`: `string`
    - `floor`: `string`
  - `doors`: `OSKBuildingForOnboardinCardDoor[]`
    - `doorId`: `string`
    - `name`: `string`

#### `getOrganizationBuildingById`
- **Request Schema**: `OSKGetORganizationBuildingByIdRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Schema**: Returns the requested organization building document.

### Firestore Triggers
None evidenced in this capability's pack.

#### organization_building_invitation

### Resolved API Request/Response Schemas

#### acceptBuildingInhabitantInvitation
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationAcceptRequest`
  - `adminsOrganizationId`: `string`
  - `invitationId`: `string`
  - `userId`: `string`

#### createBuildingInhabitantInvitation
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationCreateRequest`
  - `adminsOrganizationId`: `string`
  - `buildingId`: `string`
  - `buildingUnitInhabitantType`: `OSKBuildingUnitInhabitantType` (imported from `@oskey/building/unit`)
  - `doorIds`: `string[] | undefined` (optional)
  - `email`: `string | undefined` (optional)
  - `firstName`: `string`
  - `internationalPhoneNumber`: `string`
  - `inviterId`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `postalAddress`: `OSKStreetAddress | undefined` (optional, imported from `@oskey/core`)
  - `unitId`: `string`
  - `userId`: `string | undefined` (optional)

#### queryBuildingInhabitantInvitation
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationQueryRequest`
  - `adminsOrganizationId`: `string`
  - `collectionName`: `"invitationsSent" | "invitationsRejected"`
  - `queryField`: `"buildingId" | "unitId" | "invitationId" | "buildingUnitInhabitantType"`
  - `queryValue`: `string | { type: string; isResident?: boolean | undefined; }`

#### organization_entity

### Resolved API Request/Response Schemas

#### `assignSubEntityToParent`
- **Request Type**: `OSKAssignSubEntityToParentRequestData`
  - `newOrganizationId`: `string`
  - `newParentEntityId`: `string`
  - `oldOrganizationId`: `string`
  - `oldParentEntityId`: `string`
  - `subEntityId`: `string`
- **Response Type**: `Promise<void>` (Inferred from service signature)

#### `deleteEntity`
- **Request Type**: `OSKDeleteEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` (Inferred from service signature)

#### `getAllEntities`
- **Request Type**: `OSKGetAllEntityRequestData`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKEntity[]>` (Inferred from service signature)

#### `getBuildingsByEntityId`
- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKBuilding[]>` (Inferred from service signature)

#### `getEntityById`
- **Request Type**: `OSKGetEntityByIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKEntity>` (Inferred from service signature)

#### `getEntityDashboardStatics`
- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKGetEntityDashboardStaticsResponseData`
  - `adminsCount`: `number`
  - `buildingsCount`: `number`
  - `devicesCount`: `number`
  - `propertiesCount`: `number`
  - `residentsCount`: `{ onboarded: number; notOnboarded: number; }`

#### `updateEntity`
- **Request Type**: `OSKUpdateEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
  - `update`: `Partial<OSKSubEntityRequestData>`
- **Response Type**: `Promise<void>` (Inferred from service signature)

---

#### organization_inhabitant

- **Callable API Contracts**:
  - `getAllOrganizationInhabitants`:
    - **Request Type**: `OSKPmpResidentsRequestData` (organizationId: string)
    - **Response Type**: `OSKPmpResidentsDocumentResponse` (count: number, inhabitants: OSKPmpResidentsDocument[])
  - `getInhabitantDetailsById`:
    - **Request Type**: `OSKPmpResidentsDetailsRequestData` (organizationId: string, userId: string)
    - **Response Type**: No matching response schema was resolved in the provided metadata.
- **Firestore Triggers**: None evidenced in this capability pack. (**Confirmed**)

---

#### organization_intercom_ communication

This capability exposes 8 Firebase Callable HTTPS APIs [Confirmed]. No Firestore triggers are owned by this capability [Confirmed].

### Resolved API Request/Response Schemas

#### `createIntercomCommunication`
- **Request Type**: `OSKCreateIntercomCommunicationRequestData`
  - `homeInfo`: `{ title: string; description: string; }`
  - `organizationId`: `string`
  - `priority`: `OSKCommunicationPriority` (e.g., `'low' | 'medium' | 'high'`)
  - `schedule`: `{ startDate: Date; endDate?: Date; }`
  - `sendToChannels`: `('intercom' | 'residents')[]`
  - `targets`: `{ buildingId: string; buildingName: string; doorIds: string[]; }[]`
- **Response Type**: `OSKCreateIntercomCommunicationResponseData`
  - `communicationId`: `string`
  - `results`: `OSKCreateIntercomCommunicationResult[]`
    - `buildingId`: `string`
    - `status`: `'fulfilled' | 'rejected'`
    - `reason`: `string` (optional)

#### `deleteIntercomCommunication`
- **Request Type**: `OSKDeleteIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `void` (Resolved handler returns success status)

#### `getAllIntercomCommunicationService`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage[]`

#### `getAllIntercomCommunicationsByEntityId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByEntityIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage[]`

#### `getAllIntercomCommunicationsByPropertyId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByPropertyIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage[]`

#### `getArchivedIntercomCommunications`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage[]`

#### `getIntercomCommunicationById`
- **Request Type**: `OSKGetIntercomCommunicationByIdRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

#### `reformulateCommunicationWithGemini`
- **Request Type**: `OSKReformulateCommunicationRequestData`
  - `description`: `string`
  - `organizationId`: `string`
  - `title`: `string`
- **Response Type**: `OSKReformulateCommunicationResponseData`
  - `reformulatedDescription`: `string`
  - `reformulatedTitle`: `string`

#### organization_onboarding_inhabitant

### API Contracts (Callable Cloud Functions)
The following callable functions are exposed by this capability `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (lines 39-57) ``:

- **`createOnboardingDocuments`**
  - **Request Schema**: `OSKOrganizationOnboardingInhabitantCreateLinkRequest`
    - `onboardingCards`: `OSKInhabitantOnboardingCardRequest`
    - `organizationId`: `string`
- **`findOnboardingDocument`**
  - **Request Schema**: `OSKOrganizationOnboardingFindDocumentRequest`
    - `organizationId`: `string`
    - `unitId`: `string`
  - **Response Schema**: `OSKOrganizationOnboardingInhabitant`
- **`getOnboardingDocumentById`**
  - **Request Schema**: `OSKOrganizationOnboardingGetDocumentByIdRequestData`
    - `onboardingId`: `string`
    - `organizationId`: `string`
- **`sendOnboardingActivationCodeEmailCallable`**
  - **Request Schema**: `ResendActivationCodeRequest`
    - `language`: `OSKSupportedLanguageEnum`
    - `organizationId`: `string`
    - `residentId`: `string`
- **`verifyActivationCode`**
  - **Request Schema**: `OSKOrganizationOnboardingVerifyActivationCode`
    - `activationCode`: `string`
- **`verifyActivationCodeByOrganizationAdmin`**
  - **Request Schema**: `OSKOrganizationOnboardingVerifyActivationCodeByOrgAdminRequestData`
    - `activationCode`: `string`
    - `adminOrganizationId`: `string`

### Firestore Triggers
No Firestore triggers are defined or owned by this capability [Confirmed].

#### organization_pending

### Callable Functions
The following callable functions are exposed by this capability:

#### `approvePendingOrganizationRequest`
- **Request Schema**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Schema**: `void` (updates status to "approved" and provisions organization)

#### `createPendingOrganization`
- **Request Schema**: `OSKOrganizationPending`
  - `name`: `string`
  - `status`: `"rejected" | "approved" | "pending"`
  - `streetAddress`: `OSKStreetAddress`
  - `taxNumber`: `string`
  - `userId`: `string`
- **Response Schema**: `void` (saves pending organization request)

#### `getAllPendingOrganizations`
- **Request Schema**: `OSKGetAllOrganizationsPendingRequestDocument`
  - `adminsOrganizationId`: `string`
- **Response Schema**: `OSKOrganizationPendingDocument[]`

#### `getCurrentUserPendingOrganizations`
- **Request Schema**: No matching `model_property` facts found in this pack.
- **Response Schema**: `OSKOrganizationPendingDocument[]`

#### `getPendingOrganizationById`
- **Request Schema**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Schema**: `OSKGetOrganizationsPendingByIdResponseDocument`
  - `user`: `OSKUserDocument | undefined`

#### `rejectPendingOrganizationRequest`
- **Request Schema**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Schema**: `void` (updates status to "rejected")

#### organization_prompt_templates

- **API Contracts**:
  - `create` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|create|#1` ``
  - `delete` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|delete|#1` ``
  - `get` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|get|#1` ``
  - `getAll` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|getAll|#1` ``
  - `update` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|update|#1` ``

- **Resolved API Request/Response Schemas**:
```
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: create :: requestType :: OSKCreateOrganizationPromptTemplateRequest
	organizationId	string
	promptName	string
	promptTemplate	string
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: delete :: requestType :: OSKDeleteOrganizationPromptTemplateRequest
	organizationId	string
	promptName	string
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: get :: requestType :: OSKGetOrganizationPromptTemplateRequest
	organizationId	string
	promptName	string
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: getAll :: requestType :: OSKGetAllOrganizationPromptTemplatesRequest
	organizationId	string
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: update :: requestType :: OSKUpdateOrganizationPromptTemplateRequest
	organizationId	string
	promptName	string
	promptTemplate	string
```

- **Firestore Triggers**:
  - No Firestore triggers are owned or declared by this capability. [Confirmed]

---

#### organization_property

### Resolved API Request/Response Schemas

#### `assigningPropertyToEntity`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|assigningPropertyToEntity|#1` ``
- **Request Schema (`OSKEntityAssigningPropertyRequestData`)**:
  - `newEntityId`: `string`
  - `oldEntityId`: `string`
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `createProperty`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|createProperty|#1` ``
- **Request Schema (`OSKCreatePropertyRequestData`)**:
  - `buildings`: `import("functions/src/modules/building/models/documents/building_document.model").OSKBuilding[]`
  - `entityId`: `string`
  - `managementType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyManagementEnum`
  - `organizationId`: `string`
  - `propertyImage`: `string | undefined` (optional)
  - `propertyName`: `string`
  - `propertyType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyTypeEnum`
  - `streetAddress`: `import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress`

#### `deleteProperty`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|deleteProperty|#1` ``
- **Request Schema (`OSKGetPropertyByIdRequestData`)**:
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `deletePropertyImage`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|deletePropertyImage|#1` ``
- **Request Schema (`OSKDeletePropertyImageRequest`)**:
  - `filename`: `string`
  - `propertyId`: `string`

#### `getAllProperties`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|getAllProperties|#1` ``
- **Request Schema (`OSKGetAllPropertiesRequestData`)**:
  - `entityId`: `string`
  - `organizationId`: `string`

#### `getPropertyById`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|getPropertyById|#1` ``
- **Request Schema (`OSKGetPropertyByIdRequestData`)**:
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `getPropertyDashboardStatics`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|getPropertyDashboardStatics|#1` ``
- **Request Schema (`OSKGetPropertyDashboardStaticsRequestData`)**:
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema (`OSKGetPropertyDashboardStaticsResponseData`)**:
  - `adminsCount`: `number`
  - `buildingsCount`: `number`
  - `devicesCount`: `number`
  - `residentsCount`: `{ onboarded: number; notOnboarded: number; }`

#### `updateProperty`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|updateProperty|#1` ``
- **Request Schema (`OSKUpdatePropertyRequestData`)**:
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `update`: `Partial<import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKProperty>`

#### organization_residents

### Callable Functions
- **`bulkCreateResidents`** (Callable)
- **`createResidents`** (Callable)
- **`deleteResident`** (Callable)
- **`getAllResidents`** (Callable)
- **`getallResidentsByPropertyIdCallable`** (Callable)
- **`getResidentDetails`** (Callable)
- **`updateResident`** (Callable)

### Resolved API Request/Response Schemas

#### `deleteResident`
- **Request Type**: `OSKResidentsDocumentDeleteRequest`
  - `organizationId`: `string`
  - `residentId`: `string`

#### `getAllResidents`
- **Request Type**: `OSKGetAllOrganizationResidentsRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKResidentsDocumentResponse`
  - `count`: `number`
  - `residents`: `import("functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model").OSKOrganizationResidentResponseDocument[]`

#### `getResidentDetails`
- **Request Type**: `OSKGetOrganizationResidentDetailsRequestData`
  - `organizationId`: `string`
  - `residentId`: `string`
- *Note: No `model_property` facts matched within this pack to resolve the response schema.*

#### `getallResidentsByPropertyIdCallable`
- **Request Type**: `OSKGetAllResidentByPropertyIdRequest`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKResidentsDocumentResponse`
  - `count`: `number`
  - `residents`: `import("functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model").OSKOrganizationResidentResponseDocument[]`

#### `updateResident`
- **Request Type**: `OSKUpdateOrganizationResidentRequest`
  - `firstName`: `string`
  - `inhabitantType`: `import("functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model").OSKBuildingUnitInhabitantType | undefined` (optional)
  - `lastName`: `string`
  - `organizationId`: `string`
  - `residentId`: `string`
- *Note: No `model_property` facts matched within this pack to resolve the response schema.*

#### `createResidents` / `bulkCreateResidents`
- *Note: No `model_property` facts matched within this pack to resolve the request or response schemas for these endpoints.*

#### organization_user

No Firestore triggers are registered in this capability's pack [Confirmed].

### Resolved API Request/Response Schemas

#### `deleteOrganizationUser` (Callable)
- **Request Type**: `OSKOrganizationUserDeleteRequest`
  - `organizationId`: `string`
  - `userId`: `string`

#### `getAllOrganizationUsersAndInvitees` (Callable)
- **Request Type**: `OSKGetAllOrganizationUsersAndInviteesRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKGetAllOrganizationUsersAndInviteesResponseData`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `status`: `"active" | "invited"`
  - `userId`: `string`

#### `updateOrganizationUser` (Callable)
- **Request Type**: `OSKOrganizationUserUpdateRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`

#### `updateOrganizationUserRoles` (Callable)
- **Request Type**: `OSKOrganizationUserUpdateRolesRequest`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`

#### organization_user_access

No API contracts (`api_contract` facts) or Firestore triggers are directly owned or declared by this capability.

---

#### organization_user_invitation

### Callable Functions
The following callable functions are exposed by this capability (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (lines 51-61) ``):

#### `cancelUsersInvitation`
- **Request Type**: `OSKOrganizationUserInvitationCancelRequest`
  - `email`: `string`
  - `organizationId`: `string`

#### `createPMPUserWithInvitation`
- **Request Type**: `OSKOrganizationCreatePMPUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `originalEmail`: `string | undefined` (optional)
  - `phoneNumber`: `OSKPhoneNumber`
  - `roles`: `string[]`

#### `invitePMPUserWithInvitation`
- **Request Type**: `OSKOrganizationPMPUserInvitationRequest`
  - `adminOrganizationId`: `string`
  - `adminOrganizationName`: `string`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `organizationName`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`

#### `inviteUserWithInvitation`
- **Request Type**: `OSKOrganizationUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`

#### `processPMPInvitation`
- **Request Type**: `OSKOrganizationProcessPMPInvitationRequest`
  - `email`: `string`
  - `organizationId`: `string`

#### `queryPMPInvitations`
- **Request Type**: No explicit request schema matched within this pack (**Confirmed**).

### Firestore Triggers
- No Firestore triggers are owned or evidenced within this capability pack (**Confirmed**).

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

A cross-capability analysis of the security implementations reveals several critical security anomalies, permission mismatches, and asymmetric enforcement patterns across the module:

**Per-capability evidence:**

#### _module_root

### Referenced Permissions
The following permission strings are referenced in security checks within this capability:
- **`v1.admin.org.register`**: Checked during organization creation [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (lines 107, 145)].
- **`v1.admin.org.validate`**: Checked during organization creation [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 145)].
- **`v1.admin.org.edit`**: Checked during organization updates [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (lines 108, 219)].
- **`v1.org.edit`**: Checked during organization updates [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 219)].
- **`v1.admin.org.view`**: Referenced in permission candidates [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 106)].
- **`v1.admin.org.delete`**: Referenced in permission candidates [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 109)].
- **`v1.admin.org.admin`**: Referenced in permission candidates [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 105)].
- **`v1.admin.building.admin`**: Referenced in permission candidates [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 110)].
- **`v1.admin.building.register`**: Referenced in permission candidates [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 111)].

### RBAC Cross-Check & Mismatches
- **`v1.admin.org.register`**, **`v1.admin.org.validate`**, **`v1.admin.org.edit`**, **`v1.org.edit`**, **`v1.admin.org.view`**, **`v1.admin.org.delete`**, and **`v1.admin.building.register`** are present and match exactly in the RBAC roles document [Confirmed].
- **`v1.admin.org.admin`** and **`v1.admin.building.admin`** are referenced in code but are **not** present in the RBAC roles document [Inferred].

---

#### organization_building

### Permission Checks
The service layer enforces the following permissions using the `OSKConsolidatedRolesController` [Confirmed]:
- **`v1.org.buildings.view`**: Required to list organization buildings and retrieve a single building by ID [Confirmed, `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.buildings.view|#1` ``, `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.buildings.view|#2` ``].
  - *Cross-check*: Matches the description in the RBAC roles document ("Allows to view the details of a building").
- **`v1.org.residents.view`**: Required to fetch organization buildings for onboarding cards [Confirmed, `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.residents.view|#1` ``].
  - *Cross-check*: Matches the description in the RBAC roles document ("Allows to view the details of a resident").

### Firestore Rules
The security rules for `/organizations/{organizationId}/buildings/{buildingId}` allow read and write access if the user is signed in and has a verified email (`isValidUser()`) [Confirmed, `firestore.rules.txt` (lines 531-533)].

#### organization_building_invitation

The capability references the following permission string for authorization checks:
- `v1.org.buildings.create` (Confirmed, `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 60, 195, 245, 326)).

### RBAC Cross-Check & Mismatch Analysis
- According to `rbac-roles.json`, the permission `v1.org.buildings.create` is described as: *"Allows to create a new building"*.
- **Mismatch**: The capability uses `v1.org.buildings.create` to authorize building *inhabitant invitations* (creating, canceling, querying, and accepting invitations). This is a functional mismatch, as creating an inhabitant invitation should logically map to resident-related permissions such as `v1.org.residents.create` (*"Allows to create a new resident profile"*) or `v1.org.residents.edit` rather than building creation.

#### organization_entity

### Enforced Permissions
The capability enforces the following permission strings, which are checked against the user's consolidated roles:

- **`v1.org.entity.create`**: Required to create a new entity `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.create|#1` ``.
- **`v1.org.entity.view`**: Required to view details of a specific entity `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.view|#1` ``.
- **`v1.org.entity.edit`**: Required to update entity configurations `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.edit|#1` ``.
- **`v1.org.entity.delete`**: Required to delete an entity `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.delete|#1` ``.

### RBAC Cross-Check
Cross-referencing the referenced permissions against the `rbac-roles.json` document:
- `v1.org.entity.create` -> **Match**: "Allows to create a new entity"
- `v1.org.entity.view` -> **Match**: "Allows to view the details of an entity"
- `v1.org.entity.edit` -> **Match**: "Allows to edit an entity's information"
- `v1.org.entity.delete` -> **Match**: "Allows to delete an entity"

### Security Decorators
Methods in `OSKEntityService` are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` to validate the caller's authentication context without strictly requiring the target resource ID to match the caller's user ID `` `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` (lines 30, 50, 84, 134, 184, 228, 279, 343) ``.

---

#### organization_inhabitant

- **Permission Strings**:
  - `v1.org.view`: Checked during the execution of both `getAllOrganizationInhabitants` and `getInhabitantDetailsById`. (**Confirmed** — `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|v1.org.view|#1` ``)
- **RBAC Cross-Check**:
  - The permission `v1.org.view` is defined in the RBAC roles document as "Allows to view organization information". This matches the capability's read-only administrative access. (**Confirmed**)
- **Security Enforcement**:
  - If the user lacks `v1.org.view`, a `permission-denied` error is thrown. (**Confirmed** — `` `permission_error|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|permission-denied|#1` ``)

---

#### organization_intercom_ communication

This capability enforces the following permission strings via programmatic checks `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 94-121) ``:

- **`v1.org.communications.create`**: Required to create intercom communications and reformulate text with Gemini `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 985, 1622) ``.
- **`v1.org.communications.delete`**: Required to delete intercom communications `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 1686) ``.
- **`v1.org.communications.list`**: Required to list active or archived communications `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 691, 745, 894, 925) ``.
- **`v1.org.communications.view`**: Required to view details of a specific communication `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 797) ``.

### RBAC Cross-Check
All permission strings referenced in the code map exactly to the platform's RBAC roles document [Confirmed]:
- `v1.org.communications.create` -> "Allows to create a new communication"
- `v1.org.communications.delete` -> "Allows to delete a communication"
- `v1.org.communications.list` -> "Allows to view the list of communications"
- `v1.org.communications.view` -> "Allows to view the details of a communication"

#### organization_onboarding_inhabitant

### Permission Checks
The capability references and enforces the following permission strings:

- **`v1.org.buildings.create`** `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 90, 179, 254, 317, 617, 964) ``
  - *RBAC Description*: "Allows to create a new building"
  - *Mismatch*: This permission is checked across multiple onboarding inhabitant operations (e.g., `createOnboardingDocuments`, `getOnboardingDocumentById`, `updateOnboardingDocument`). This is a highly likely implementation mismatch, as building creation permissions should not govern resident onboarding.
- **`v1.org.residents.create`** `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts` (line 61) ``
  - *RBAC Description*: "Allows to create a new resident profile"
  - *Status*: Matches. Checked when resending onboarding activation emails.
- **`v1.org.residents.onboardingNotification`** `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 1439) ``
  - *RBAC Description*: "Activates email notifications for new resident registrations."
  - *Status*: Matches. Used to identify PMP users who should receive onboarding completion notifications.

#### organization_pending

- **`v1.admin.org.validate`**: Required to view all pending organizations, view a specific pending organization, approve a request, or reject a request [Confirmed] (via `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.admin.org.validate|#1` ``).
  - *Cross-check*: This matches the RBAC roles document exactly: `"v1.admin.org.validate" - "v1.admin - Allows to validate a new organization"`.
- **`v1.org`**: Used as a prefix filter (`r.startsWith('v1.org')`) to gather all organization-level roles to assign to the new organization's administrator upon approval [Confirmed] (via `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.org|#1` ``).
- **`v1.org.user.create`**: Used during the approval process to invite the requesting user as an organization user [Confirmed] (via `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.org.user.create|#1` ``).
  - *Cross-check*: This matches the RBAC roles document exactly: `"v1.org.user.create" - "Allows to add a new user to the Oskey Property Management Portal"`.

#### organization_prompt_templates

- **Security Decorators**:
  - All service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 26, 40, 61, 85, 110) ``. This ensures that a valid, authenticated user session is present, but does not enforce that the user's ID matches a specific resource ID. [Confirmed]
- **RBAC Roles**:
  - No explicit RBAC permission strings (e.g., `v1.org.settings.edit` or `v1.org.settings.view`) are referenced or checked in the code of this capability. [Confirmed]
- **Firestore Rules Mismatch**:
  - Cross-checking against `firestore.rules.txt` reveals that there is no explicit rule matching `/organizations/{organizationId}/promptTemplates/{document=**}`.
  - While `/organizations/{organizationId}` allows read/write access to valid users (`allow write: if isValidUser(); allow read: if isValidUser();`), subcollections in Firestore rules do not inherit access unless a recursive wildcard is used (which is not present for the organization root) or they are explicitly matched.
  - This suggests that direct client-side SDK access to the `promptTemplates` subcollection is blocked by default, and all operations must be routed through the secure callable Cloud Functions provided by this capability. [Inferred]

---

#### organization_property

The capability enforces the following permission checks against the user's consolidated roles:
- **`v1.org.property.view`**: Required to view property details or dashboard statistics `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_property/services/property.service.ts|v1.org.property.view|#1` ``.
- **`v1.org.property.create`**: Required to create a property or assign a property to an entity `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_property/services/property.service.ts|v1.org.property.create|#1` ``.
- **`v1.org.property.edit`**: Required to update or delete a property `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_property/services/property.service.ts|v1.org.property.edit|#1` ``.
- **`v1.org.entity.create`**: Referenced as a candidate permission check in `assigningPropertyToEntity` `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_property/services/property.service.ts|v1.org.entity.create|#1` ``.

### RBAC Cross-Check
- `v1.org.property.view`, `v1.org.property.create`, `v1.org.property.edit`, and `v1.org.entity.create` all match valid permission strings defined in the RBAC roles document [Confirmed].

#### organization_residents

This capability references and enforces the following permission strings:

- **`v1.org.residents.create`**: Checked during bulk and individual resident creation (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|v1.org.residents.create|#1` ``).
- **`v1.org.residents.delete`**: Checked during resident deletion (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|v1.org.residents.delete|#1` ``).
- **`v1.org.residents.edit`**: Checked during resident updates (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|v1.org.residents.edit|#1` ``).
- **`v1.org.residents.list`**: Checked during resident list retrieval (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|v1.org.residents.list|#1` ``).
- **`v1.org.residents.view`**: Checked during resident details retrieval (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|v1.org.residents.view|#1` ``).

### Security Checks
- Parameter validation is performed via `OSKSecurityChecks.checkParameters` (lines 165, 1033, 940).
- User authentication and context matching are enforced via the `@OSKUserSecurityChecks` decorator (lines 1113, 526, 1028, 938).

#### organization_user

### Permissions Referenced
- `v1.org.user.create`: Checked when listing all users and invitees `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.create|#1` `` [Confirmed].
- `v1.org.user.edit`: Checked when updating organization users `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.edit|#1` `` [Confirmed].
- `v1.org.user.view`: Checked when retrieving organization users by ID or email `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.view|#1` `` [Confirmed].
- `v1.org.admin` and `v1.admin`: Used to identify administrative users within the organization `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|v1.org.admin|#1` `` [Confirmed].

### RBAC Cross-Check
- All referenced permissions (`v1.org.user.create`, `v1.org.user.edit`, `v1.org.user.view`) perfectly match the definitions in the supplied RBAC roles document [Confirmed].
- **Mismatch/Anomaly**: The `deleteOrganizationUser` service method checks for the `v1.org.user.edit` permission `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.edit|#2` `` instead of `v1.org.user.delete` (which is defined in the RBAC roles document as "Allows to delete an Oskey Property Management Portal user") [Inferred].

#### organization_user_access

No specific permission strings or RBAC roles are referenced in the provided evidence for this capability.

---

#### organization_user_invitation

The following permission strings are referenced and checked by this capability (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` ``):
- **`v1.admin.org.validate`**: Checked during cancellation and PMP user invitation workflows (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 166, 304) ``).
- **`v1.org.user.create`**: Checked during user invitation, PMP user invitation, and PMP user creation workflows (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 166, 304, 437) ``).
- **`v1.org.user.delete`**: Checked during cancellation workflows (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (line 59) ``).

### RBAC Cross-Check
All referenced permissions match the definitions in the RBAC roles document exactly (**Confirmed**):
- `v1.admin.org.validate` maps to "v1.admin - Allows to validate a new organization".
- `v1.org.user.create` maps to "Allows to add a new user to the Oskey Property Management Portal".
- `v1.org.user.delete` maps to "Allows to delete an Oskey Property Management Portal user".

---

### 10. Cross-Module Relationships

The `organization` module maintains extensive, bi-directional relationships with almost all other modules in the repository [Confirmed].

```
                     ┌──────────────────────────┐
                     │       organization       │
                     └─────────────┬────────────┘
            ┌──────────────────────┼──────────────────────┐
            ▼                      ▼                      ▼
     ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
     │     core     │       │   building   │       │     user     │
     └──────────────┘       └──────────────┘       └──────────────┘
```

#### Outbound Relationships (This module depends on and calls X)
- **`core` (Confirmed)**: Heavily relies on `core` for generic document persistence (`OSKDocumentController`), logging (`OSKLoggingService`), and access control utilities (`OSKAccessService`, `OSKAccessUtilsService`, `OSKPincodeService`).
- **`building` (Confirmed)**: Calls into `building` to resolve building metadata (`OSKBuildingController`), manage doors (`OSKBuildingDoorController`), manage units (`OSKBuildingUnitController`), and provision/deprovision inhabitants and non-app users (`OSKBuildingUnitInhabitantService`, `OSKBuildingUnitNonAppUserService`, `OSKBuildingIntercomService`).
- **`user` (Confirmed)**: Calls into `user` to retrieve user profiles (`OSKUserController`), manage user-scoped pincodes (`OSKUserPincodeController`), dispatch notifications (`OSKUserNotificationService`), and manage global user-organization memberships (`OSKUserOrganizationController`).
- **`settings` (Confirmed)**: Calls `OSKConsolidatedRolesController` to validate user permissions and generate organization-scoped user roles. Calls `OSKAppStoreSettingsService` to validate app store configurations.
- **`tasks` (Confirmed)**: Calls `OSKTaskSchedulerService` to schedule and cancel Cloud Tasks for intercom communication activations and deactivations.
- **`apps` (Confirmed)**: Calls `OSKEmailService` to dispatch onboarding and invitation emails, and `OSKQRcodeService` to generate onboarding QR codes.
- **`unit_management` (Confirmed)**: Calls `OSKUnitManagementPendingInvitationsController` to delete pending invitations when a resident is removed.
- **`access_control_device` (Confirmed)**: Calls `OSKAccessControlDeviceConfigController` to retrieve and save device configurations when updating intercom communication states.

#### Inbound Relationships (Other modules depend on and call this module)
- **`admin` (Confirmed)**: Calls `OSKOrganizationController` to list and retrieve organizations, `OSKPropertyController` to manage properties, `OSKOrganizationOnboardingInhabitantController` to query onboarding documents, and `OSKOrganizationResidentsController` to manage resident profiles.
- **`building` (Confirmed)**: Calls `OSKOrganizationUserController` to validate administrative user contexts, `OSKOrganizationResidentsController` to resolve intercom directory contacts, and `OSKPropertyController` to link/unlink buildings to properties.
- **`user` (Confirmed)**: Calls `OSKOrganizationOnboardingInhabitantController` to delete onboarding cards upon completion, `OSKOrganizationResidentsController` to resolve resident profiles for PIN generation, and `OSKOrganizationUserInvitationController` to accept or reject PGO invitations.
- **`supplier` (Confirmed)**: Calls `OSKOrganizationUserController` and `OSKOrganizationController` to validate supplier staff access contexts against organization boundaries.
- **`access_control_device` (Confirmed)**: Calls `OSKOrganizationController` to validate organization contexts during public key registration.
- **`tasks` (Confirmed)**: Calls `OSKIntercomCommunicationService` to execute scheduled activations and deactivations of intercom broadcasts.
- **`core` (Confirmed)**: Calls `OSKOrganizationUserAccessService` to initialize organization-scoped user access parameters.

### 11. External Hooks

#### _module_root

### Google Cloud Storage Integration
This capability interacts with Google Cloud Storage for logo image management:
- **`uploadImage`**: Uploads organization logo images to a specified bucket [Confirmed: `functions/src/modules/organization/controllers/organization.controller.ts` (line 62)].
- **`deleteImage`**: Deletes organization logo images from a specified bucket [Confirmed: `functions/src/modules/organization/controllers/organization.controller.ts` (line 65)].
- **`OSKOrganizationService.uploadimage`**: Calls `OSKOrganizationController.default.uploadImage` with a `bucket` parameter [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 265)].
- **`OSKOrganizationService.deleteOrganizationLogo`**: Calls `OSKOrganizationController.default.deleteImage` with a `filePath` and `filename` [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 316)].

---

#### organization_building

No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or storage paths) are evidenced in this capability's pack.

#### organization_building_invitation

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced within this capability's pack.

#### organization_entity

This capability does not register or consume any external hooks, Pub/Sub topics, environment variables, or external storage paths within its own submodule boundaries.

---

#### organization_inhabitant

- No external hooks, Pub/Sub topics, environment variables, or storage paths are evidenced within this capability's pack. (**Confirmed**)

---

#### organization_intercom_ communication

This capability integrates with the following external systems and services [Confirmed]:

### Vertex AI (Gemini)
- **Model**: `gemini-2.5-flash` `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 61) ``.
- **Usage**: Calls `generativeModel.generateContent` to perform batch translation of communication text into target languages and to reformulate/optimize titles and descriptions `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1575, 1637) ``.

### Google Cloud Tasks
- **Usage**: Integrates with `OSKTaskSchedulerService` to schedule future activation (`activateIntercomCommunicationTask`) and deactivation (`deactivateIntercomCommunicationTask`) tasks, and to cancel them when communications are preempted or deleted `` `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1160, 1196, 1305, 1712) ``.

#### organization_onboarding_inhabitant

- **Email Integration**: Integrates with an external email delivery service via `OSKEmailService` to send activation codes and onboarding notifications `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts` (line 24) ``.
- **SMS Integration (Candidate)**: Contains commented-out code and architectural placeholders for sending verification SMS OTPs:
  - `// OSKOrganizationOnboardingInhabitantService.sendVerificationSms(smsPayload);` `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 1404) ``.
  - Comment: `// TODO Waiting for API Key` `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 1403) ``.

#### organization_pending

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced within this capability's pack [Confirmed].

#### organization_prompt_templates

- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally disable App Check enforcement when running in a local emulator environment `` `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (line 36) ``. [Confirmed]
- No other external hooks, Pub/Sub topics, or external storage paths are evidenced in this capability's pack. [Confirmed]

---

#### organization_property

- **Google Cloud Storage (GCS)**: The capability interacts with GCS via `OSKDocumentController`'s `_uploadImage` and `_deleteImage` methods to store and delete property images `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 42-44, 64-66) ``.

#### organization_residents

This capability interacts with the following external boundaries:

- **Asynchronous IoT/Hardware Synchronization**: Calls `OSKAccessMessagePublisherService.publishMessageToAllACDs` to publish access deletion messages to GCP Pub/Sub, which asynchronously synchronizes state changes to physical Access Control Devices (ACDs) (`` `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|deleteAppUserResident|userId,accessBuildingId...|#1` ``). [Confirmed]
- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally enforce App Check (`` `call_expression|organization|functions/src/modules/organization/modules/organization_residents/index.ts|functionBuilder.runWith|getCallableResidentsFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``). [Confirmed]
  - `process.env.MAX_BATCH_SIZE`: Controls the maximum batch size allowed for bulk resident creation (`` `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|parseInt|bulkCreateResidents|process.env.MAX_BATCH_SIZE,10|#1` ``). [Confirmed]

#### organization_user

No external hooks, Pub/Sub topics, environment variables, or storage paths are directly evidenced within this capability's pack [Confirmed].

#### organization_user_access

No external hooks (such as Pub/Sub topics, external HTTP endpoints, or cloud storage paths) are evidenced within this capability's pack.

---

#### organization_user_invitation

### Integrations
- **Auth0 Integration**: Uses `OSKAuth0Service.emailExistsInAuth0` to check if the invited email already exists in Auth0 (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (line 540) ``).
- **Firebase Admin Auth**: Uses `firebase-admin/auth` (`getAuth().getUser`) to query user details (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (line 576) ``).

### Environment Variables
- **`PMP_PORTAL_URL`**: Used to construct the portal URL in the invitation email (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (line 553) ``).
- **`OSK_FIREBASE_EMULATOR`**: Used to conditionally enforce App Check (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (line 52) ``).

---

### 12. Architectural Observations

- **High Structural Modularity with High Coupling**: While the module is cleanly split into domain-specific submodules, the high degree of coupling around `organization_user` and `organization_residents` indicates that organizational user context and resident profiles are highly cross-cutting concerns [Confirmed].
- **Heavy Delegation (Bridge Pattern)**: Submodules like `organization_building_invitation` and `organization_residents` own very little direct persistence logic [Confirmed]. Instead, they act as orchestration bridges, validating administrative permissions at the organization level and delegating the actual database writes to the `building` and `user` modules [Confirmed].
- **Denormalization and Counter Sync Risk**: `organization_building` maintains denormalized counters (`numberOfDevices`, `numberOfResidents`, `numberOfUnits`) within the `OSKOrganizationBuilding` document [Confirmed]. There is no evidence of Firestore triggers or background sync tasks within this module to guarantee the eventual consistency of these counters when entities are modified in other modules [Inferred].
- **AI-Powered Orchestration**: The `organization_intercom_ communication` submodule demonstrates advanced orchestration, combining Firestore transactional writes, Gemini-powered translation/reformulation, and Cloud Tasks scheduling to manage physical hardware displays [Confirmed].

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Missing RBAC Checks in Prompt Templates**: Why are there no explicit RBAC role checks (such as `v1.org.settings.edit` or `v1.org.settings.view`) enforced in the service layer of `organization_prompt_templates`? Currently, any authenticated user can call these functions, posing a risk of unauthorized template modifications [Inferred].
- **Unmapped RBAC Permissions**: The permissions `v1.admin.org.admin` and `v1.admin.building.admin` are referenced in the code but do not exist in the RBAC roles document [Confirmed].
- **Over-scoped Building Creation Permission**: Why is `v1.org.buildings.create` (building creation) used to authorize inhabitant invitations and onboarding card workflows instead of resident-specific permissions like `v1.org.residents.create`? [Confirmed].
- **User Deletion Permission Bypass**: Why does `deleteOrganizationUser` check for `v1.org.user.edit` instead of `v1.org.user.delete`? [Confirmed].
- **Onboarding Collection Path Discrepancy**: Why do the Firestore security rules define access under `/organizations/{id}/onboardingCards/{id}` while the schema map and controller queries target `/organizations/{id}/onboardingInhabitants/{id}`? This discrepancy could lead to permission-denied errors or bypasses [Inferred].
- **Omission of `organizationsPending` from Schema**: The Firestore schema map (`firestore-schema.md`) does not list the `organizationsPending` collection, despite its active use in the `organization_pending` controller and service [Confirmed].
- **Denormalized Counters Synchronization**: How are the denormalized counters (`numberOfDevices`, `numberOfResidents`, `numberOfUnits`) in `OSKOrganizationBuilding` kept in sync when units, residents, or devices are modified in external modules? [Inferred].
- **Disabled SMS Verification**: Is SMS verification currently disabled or non-functional in production due to the commented-out `sendVerificationSms` call and the missing API key in `organization_onboarding_inhabitant`? [Confirmed].
- **Firestore Rules for Prompt Templates**: Is the omission of explicit Firestore rules for the `promptTemplates` subcollection intentional to force all client interactions through Cloud Functions, or is it an oversight? [Inferred].

**Per-capability open questions:**

#### _module_root

- **Cloud Storage Bucket Configuration**: The exact bucket name used for organization logos is not statically defined in this pack; it is passed dynamically as a parameter `bucket` to `uploadimage` and `deleteOrganizationLogo` [Inferred].
- **Trigger Mechanism for `onDocumentCreated`**: The `OSKOrganizationService` defines an `onDocumentCreated` method [Confirmed: `functions/src/modules/organization/services/organization.service.ts` (line 38)], but there is no corresponding Firestore trigger registration for it in the root index file [Confirmed: `functions/src/modules/organization/index.ts` (lines 89-109)]. It is unclear what triggers this method.

#### organization_building

- **Denormalized Counters Synchronization**: The `OSKOrganizationBuilding` document model contains denormalized counters such as `numberOfDevices`, `numberOfResidents`, and `numberOfUnits` [Confirmed, `` `model_property|organization|functions/src/modules/organization/modules/organization_building/models/documents/organization_building_document_model.ts|OSKOrganizationBuilding|numberOfUnits|#1` ``]. It is unclear from the evidence pack how these counters are kept in sync when units, residents, or devices are added or removed, as no Firestore triggers or background sync tasks are defined within this capability.

#### organization_building_invitation

- **Permission Mismatch**: Why is `v1.org.buildings.create` (building creation) used to authorize inhabitant invitation workflows instead of resident-specific permissions like `v1.org.residents.create`?
- **Direct Database Access**: Does this capability ever write directly to Firestore, or does it strictly delegate all database reads and writes to sibling controllers and services?

#### organization_entity

- **Property Disassociation Mechanism**: During `deleteEntity`, the service calls `OSKEntityController.default.update` on `propertiesId` with `{ entityId: '' }` `` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityController.default.update|deleteEntity|propertiesId,{ entityId: '' }|#1` ``. It is unclear if `OSKEntityController` is being reused to update property documents, or if this is a resolved call expression mapping to a shared document controller.
- **`getAllEntities` Authorization**: Unlike other service methods, `getAllEntities` does not perform an explicit `checkUserPermissions` call for a specific `v1.org.entity.*` permission in the provided evidence, relying instead on the `OSKOrganizationUserController.default.get` call and the `@OSKUserSecurityChecks` decorator. It is unknown if list-level authorization is handled implicitly.

#### organization_inhabitant

- **Response Schema of `getInhabitantDetailsById`**: The metadata does not resolve its response type to a specific model schema. (**Unknown**)
- **Write Operations**: Are there any write operations (create, update, delete) for inhabitants managed under this capability, or is it strictly read-only? The evidence only shows query and retrieval methods (`getAllOrganizationInhabitants`, `getInhabitantDetailsById`). (**Unknown**)

#### organization_intercom_ communication

- **Exact Firestore Collection Paths**: The exact literal paths for the hot storage state document and cold storage archive sub-collection are resolved dynamically via `OSKIntercomBuildingStateController.getStateCollectionPath` and `OSKIntercomCommunicationArchiveController.getCollectionPath`. The exact string templates are not fully exposed in the compact facts, though they are transactionally nested under the organization/building hierarchy.
- **Cloud Task Handlers**: The execution of `activateIntercomCommunicationTask` and `deactivateIntercomCommunicationTask` is scheduled by this capability, but the actual task handlers are implemented elsewhere (likely in the `tasks` module).

#### organization_onboarding_inhabitant

- **Permission Mismatch**: Why is `v1.org.buildings.create` used to authorize inhabitant onboarding operations? This appears to be an overly permissive or misconfigured permission check in the codebase.
- **Collection Path Discrepancy**: Why do the Firestore rules define access under `/organizations/{id}/onboardingCards/{id}` while the schema map and controller queries target `/organizations/{id}/onboardingInhabitants/{id}`?
- **SMS Verification Status**: Is SMS verification currently disabled or non-functional in production due to the commented-out `sendVerificationSms` call and the missing API key?

#### organization_pending

- **Omission from Schema Map**: The Firestore schema map (`firestore-schema.md`) does not list the `organizationsPending` collection, even though the controller and service code clearly target it. Is this collection defined dynamically or was it omitted from the schema generation? [Inferred]
- **Initial Request Trigger**: How is the initial request for a pending organization triggered on the client side? Is it open to any authenticated user, or are there pre-onboarding checks? [Inferred]

#### organization_prompt_templates

- **RBAC Authorization**: Why are there no explicit RBAC role checks (such as `v1.org.settings.edit` or `v1.org.settings.view`) enforced in the service layer for managing prompt templates? Currently, any authenticated user (`OSKUserSecurityChecks` with `checkUserIdMatch: false`) can call these functions, which might allow non-admin organization users to modify prompt templates.
- **Firestore Rules Intent**: Is the omission of explicit Firestore rules for the `promptTemplates` subcollection intentional to force all client interactions through the Cloud Functions, or is it an oversight in the security rules?

#### organization_property

- **`v1.org.entity.create` Permission Check**: It is unclear why `assigningPropertyToEntity` checks the `v1.org.entity.create` permission in addition to `v1.org.property.create` `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (line 319) ``. This might be a broader administrative check or a potential permission over-scoping.
- **Firestore Triggers**: There are no Firestore triggers evidenced in this submodule's pack. It is unknown if other submodules listen to changes on `/properties` documents to trigger downstream synchronization.

#### organization_residents

- **Auth0 Integration**: While this capability sets up the onboarding card that enables Auth0 identity linking, the exact mechanism of Auth0 identity resolution is handled in other modules and is not directly evidenced here.
- **Bulk Creation Payload**: The exact structure of `OSKBulkCreateResidentResult` is not fully detailed in the model properties, though its usage is clear.

#### organization_user

- Why does `deleteOrganizationUser` check for `v1.org.user.edit` instead of `v1.org.user.delete`? Is this a temporary fallback or an intentional design choice?
- Are there any audit logs or events emitted (e.g., via Pub/Sub) when an organization user is deleted or has their roles modified?

#### organization_user_access

- **Firestore Operations**: What specific Firestore collections and documents are read from or written to during the execution of `setupOrganizationUserAccess`?
- **Authorization**: Are there specific RBAC permissions (e.g., `v1.admin.user.accesses.create`) enforced at the entry point of `setupOrganizationUserAccess`?

#### organization_user_invitation

- **`queryPMPInvitations` Request Schema**: Why does `queryPMPInvitations` not have an explicit request schema in the resolved schemas? (**Inferred**: It likely takes a generic or empty request payload, or its properties weren't mapped to a specific model class in the facts).
- **Firestore Triggers**: Are there any background Firestore triggers associated with this capability that are not captured in this submodule? (**Confirmed**: None are evidenced in this pack).

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.