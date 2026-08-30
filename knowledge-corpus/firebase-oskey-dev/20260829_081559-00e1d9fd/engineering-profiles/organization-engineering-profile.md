### 0. Generation Metadata

- **runId**: `20260829_081559-00e1d9fd`
- **generatedAt**: `2026-08-29T13:35:17.919Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `organization`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `organization` module serves as the foundational administrative control plane of the Oskey Access Platform. It is responsible for the lifecycle management of top-level Organizations, legal Entities, and Properties, as well as the administrative users (Property Managers) operating within the Property Manager Portal (PGO) [Confirmed]. The module orchestrates complex, multi-step workflows including resident onboarding, administrative user invitations, and scheduled intercom communication broadcasts across physical Access Control Devices (ACDs) [Confirmed].

### 2. Architectural Position

The `organization` module sits at the apex of the platform's logical and administrative hierarchy [Confirmed]. It governs the top three scopes of the Oskey domain model: Organization, Entity, and Property [Confirmed]. 
- **Parent Scope**: Global platform administration (delegated from Oskey Administrators) [Confirmed].
- **Owned Concepts**: Organizations, Entities, Properties, Organization Users, Onboarding Inhabitants, Intercom Communications, and Organization Prompt Templates [Confirmed].
- **Provided Capabilities**: Administrative CRUD operations for tenant structures, PGO user provisioning, resident onboarding orchestration, and intercom message broadcasting [Confirmed].

### 3. Primary Responsibilities

#### _module_root

- **Create Organization**: Orchestrates the creation of a new organization document in Firestore, validates that the caller has the required administrative permissions (`v1.admin.org.register` and `v1.admin.org.validate`), and automatically provisions a default base entity (`entityP`) for the new organization. [Confirmed]
  - *Citations*: `` `api_contract|organization|functions/src/modules/organization/index.ts|createAnOrganization|#1` ``, `` `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|createAnOrganization|#1` ``.
- **Update Organization**: Allows authorized administrators (possessing `v1.admin.org.edit` or `v1.org.edit` permissions) to update existing organization details. [Confirmed]
  - *Citations*: `` `api_contract|organization|functions/src/modules/organization/index.ts|updateAnOrganization|#1` ``, `` `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|updateAnOrganization|#1` ``.
- **Retrieve All Organizations**: Retrieves a list of all organizations for users with global administrative permissions (`v1.admin.org.view` or `v1.admin.org.admin`). [Confirmed]
  - *Citations*: `` `api_contract|organization|functions/src/modules/organization/index.ts|getAllOrganizations|#1` ``, `` `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|getAllOrganizations|#1` ``.
- **Delete Organization Logo**: Deletes an organization's logo file from Cloud Storage and updates the organization's Firestore document to remove the logo reference. [Confirmed]
  - *Citations*: `` `api_contract|organization|functions/src/modules/organization/index.ts|deleteOrganizationLogo|#1` ``, `` `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|deleteOrganizationLogo|#1` ``.
- **Upload Image**: Handles updating the organization document with the uploaded image path in Cloud Storage. [Confirmed]
  - *Citations*: `` `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|uploadimage|#1` ``.
- **Submodule Trigger Orchestration**: Exposes a central entry point (`getCallableFunctionTriggers`) that aggregates and registers all callable Cloud Function triggers for the organization module's submodules. [Confirmed]
  - *Citations*: `` `function_declaration|organization|functions/src/modules/organization/index.ts|getCallableFunctionTriggers|#1` ``.

#### organization_building

The capability provides the following distinct responsibilities:

- **Organization-Building Association Management (CRUD)**: Provides standard document controller operations to save, update, retrieve, and delete organization-building mapping documents within Firestore [Confirmed: `functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts` (lines 16-48)].
- **Organization Building Retrieval**: Fetches all buildings associated with a specific organization and enriches them with master building details [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getAllOrganizationBuildings|#1`].
- **Onboarding Card Data Aggregation**: Queries and aggregates buildings, sorted units (ordered numerically by floor and then alphanumerically by unit number), and doors for a specific property to facilitate resident onboarding [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getAllOrganizationBuildingsForOnboardingCards|#1`].
- **Scoped Building Querying**: Retrieves a single organization-building association by its unique identifier after validating the caller's permissions [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getOrganizationBuildingById|#1`].

---

#### organization_building_invitation

This capability provides the following core features:

- **Create Building Inhabitant Invitation**: Validates the calling administrator's permissions, retrieves the target building unit, resolves authorized doors, generates a unique invitation ID, and writes the invitation document to the database `` `service_method|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKOrganizationBuildingInvitationService|createBuildingInhabitantInvitation|#1` ``. [Confirmed]
- **Cancel Building Inhabitant Invitation**: Allows authorized administrators to revoke and delete a pending building inhabitant invitation before it is accepted `` `service_method|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKOrganizationBuildingInvitationService|cancelBuildingInhabitantInvitation|#1` ``. [Confirmed]
- **Query Building Inhabitant Invitations**: Enables administrators to search and filter sent or rejected invitations based on fields such as `buildingId`, `unitId`, `invitationId`, or `buildingUnitInhabitantType` `` `service_method|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKOrganizationBuildingInvitationService|queryBuildingInhabitantInvitation|#1` ``. [Confirmed]
- **Accept Building Inhabitant Invitation**: Validates a pending invitation, registers the user as an active inhabitant of the building unit, provisions their door access rights, and cleans up the pending invitation document `` `service_method|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKOrganizationBuildingInvitationService|acceptBuildingInhabitantInvitation|#1` ``. [Confirmed]

#### organization_entity

The `organization_entity` capability is responsible for the following features:

- **Entity Lifecycle Management**: Creating, updating, and deleting entity documents within the Firestore database. Creating an entity initializes its properties, timestamps, and parent-child associations, while deleting an entity cleans up its references across properties and parent entities. [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|createEntity|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|updateEntity|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|deleteEntity|#1` ``)
- **Hierarchical Entity Assignment**: Assigning a sub-entity to a new parent entity, which involves updating the parent-child pointers (`parentEntityId` and `subEntityIds`) and re-associating the sub-entity with the correct organization. [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|assignSubEntityToParent|#1` ``)
- **Entity Querying**: Retrieving all entities belonging to an organization or fetching a specific entity by its unique identifier. [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getAllEntities|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getEntityById|#1` ``)
- **Dashboard Statistics Aggregation**: Compiling high-level metrics for an entity, including counts of residents (onboarded vs. not onboarded), administrators, devices, properties, and buildings. [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getEntityDashboardStatics|#1` ``)
- **Building Association Retrieval**: Querying and filtering the list of buildings that belong to a specific entity. [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getBuildingsByEntityId|#1` ``)

---

#### organization_inhabitant

- **Querying all inhabitants belonging to an organization**: The capability retrieves all buildings assigned to an organization and queries the `inhabitants` collection group filtered by those buildings [Confirmed] (cite `` `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantsForOrganization|#1` ``).
- **Mapping raw inhabitant data to enriched profiles**: Aggregates user profile details, active pincodes, building information, and unit information into a consolidated inhabitant document [Confirmed] (cite `` `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|mapInhabitantData|#1` ``).
- **Retrieving detailed inhabitant profiles by ID**: Fetches and enriches a single inhabitant's details by their user ID [Confirmed] (cite `` `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantDetailsById|#1` ``).
- **Enforcing organization-scoped RBAC permissions**: Verifies that the calling user has `v1.org.view` permissions within the organization before returning any inhabitant data [Confirmed] (cite `` `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|getAllOrganizationInhabitants|organizationUser.roles,rolesToCheck|#1` ``).

#### organization_intercom_ communication

- **Create Intercom Communications**: Creates a communication message targeting specific buildings and doors, scheduling it for immediate or future activation, and distributing it via intercom screens and/or push notifications to residents. [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|createIntercomCommunication|#1`]
- **Scheduled Activation/Deactivation**: Leverages Cloud Tasks (`activateIntercomCommunicationTask` and `deactivateIntercomCommunicationTask`) to transition communication states (scheduled -> active -> expired) and update device configurations or trigger resident notifications. [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 546-671)]
- **Preemption Logic**: Automatically expires currently active messages on physical displays when a new immediate message is activated. [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 210-235)]
- **Gemini-powered Translation & Reformulation**: Translates communication titles and descriptions into supported languages using Gemini (`gemini-2.5-flash` or `gemini-3.5-flash` as configured) and reformulates text based on prompt templates. [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|reformulateCommunicationWithGemini|#1`, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1530-1661)]
- **State Management & Archiving**: Manages hot storage for active/scheduled/recent expired messages and evicts older expired messages to a cold storage archive sub-collection. [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 127-449)]
- **Resident Push Notifications**: Resolves resident language preferences and sends push notifications in batches to onboarded app users in targeted buildings. [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 454-540)]

---

#### organization_onboarding_inhabitant

This capability is responsible for the following core features and workflows:

- **Onboarding Document Creation (`createOnboardingDocuments`)**: Generates temporary onboarding cards containing activation codes, SMS OTPs, and QR codes, and calculates their respective expiration dates [Confirmed, `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|createOnboardingDocuments|#1` ``].
- **Onboarding Document Retrieval & Querying**: Supports finding onboarding documents by unit ID, retrieving them by ID, or listing all onboarding documents for an organization [Confirmed, `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|findOnboardingDocument|#1` ``, `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|getOnboardingDocumentById|#1` ``, `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|getAllOnboardingDocuments|#1` ``].
- **Onboarding Document Updates**: Allows updating existing onboarding cards with modified fields [Confirmed, `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|updateOnboardingDocument|#1` ``].
- **Activation Code Verification (`verifyActivationCode`)**: Validates the activation code submitted by a user, matches their verified email/phone, provisions permanent access rights via the core access service, registers them as an active inhabitant in the building unit, updates their resident profile status to onboarded, dispatches a notification email, and deletes the temporary onboarding document [Confirmed, `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|verifyActivationCode|#1` ``].
- **Admin-Led Verification (`verifyActivationCodeByOrganizationAdmin`)**: Allows an authorized organization administrator to manually verify an activation code and complete the onboarding process on behalf of a user [Confirmed, `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|verifyActivationCodeByOrganizationAdmin|#1` ``].
- **Activation Email Dispatch**: Sends onboarding activation emails containing the unique activation code to the resident [Confirmed, `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|sendOnboardingActivationCodeEmailCallable|#1` ``].
- **SMS OTP Management**: Generates and resets SMS OTP codes for phone verification during the onboarding flow [Confirmed, `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|resetSmsCode|#1` ``].
- **App Store Tester Onboarding Bypass**: Provides a specialized onboarding path for App Store testers using predefined tester activation codes [Confirmed, `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|handleAppStoreTesterOnboarding|#1` ``].
- **Onboarding Notification Dispatch**: Automatically notifies property managers and administrators via email when a new inhabitant successfully completes onboarding [Confirmed, `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|_sendOnboardingNotificationEmail|#1` ``].

#### organization_pending

### Pending Organization Request Creation
- Allows authenticated users to submit a request to register a new organization, capturing details such as organization name, tax number, street address, and the requesting user's ID [Confirmed: `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|createPendingOrganization|#1`].
- Automatically generates a unique document ID and saves the pending organization request with a default status of `'pending'` and a creation timestamp [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingController.default.generateDocId|createPendingOrganization||#1`, `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|Timestamp.now|createPendingOrganization||#1`].

### Retrieval of Pending Requests
- Allows administrators to retrieve all pending organization requests [Confirmed: `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|getAllPendingOrganizations|#1`].
- Allows users to retrieve their own pending organization requests [Confirmed: `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|getCurrentUserPendingOrganizations|#1`].
- Allows administrators to retrieve a specific pending organization request by its ID, returning the request details along with the associated user's profile [Confirmed: `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|getPendingOrganizationById|#1`].

### Approval and Provisioning Workflow
- Allows authorized administrators to approve a pending organization request [Confirmed: `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|approvePendingOrganizationRequest|#1`].
- Upon approval, the system:
  1. Updates the pending request status to `'approved'` [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingController.default.update|approvePendingOrganizationRequest|requestData.pendingOrganizationId,{             status: 'approved',         }|#1`].
  2. Generates a new organization document ID [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationController.default.generateDocId|approvePendingOrganizationRequest||#1`].
  3. Provisions the actual organization in the system [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationService.createAnOrganization|approvePendingOrganizationRequest|organizationDocument,context|#1`].
  4. Invites the requesting user to the newly created organization with administrative roles (specifically filtering roles starting with `'v1.org'`) [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|(await OSKCompositeRoleController.default.listDocuments())             .map((r) => r.id)             .filter|approvePendingOrganizationRequest|(r) => r.startsWith('v1.org')|#1`, `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationUserInvitationService.inviteUserWithInvitation|approvePendingOrganizationRequest|userInvitation,context,adminsOrganizationId|#1`].

### Rejection Workflow
- Allows authorized administrators to reject a pending organization request, updating its status to `'rejected'` [Confirmed: `api_contract|organization|functions/src/modules/organization/modules/organization_pending/index.ts|rejectPendingOrganizationRequest|#1`, `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingController.default.update|rejectPendingOrganizationRequest|requestData.pendingOrganizationId,{             status: 'rejected',         }|#1`].

---

#### organization_prompt_templates

This capability provides the following distinct responsibilities:

- **Retrieve All Prompt Templates**: Retrieves all prompt templates configured for a specific organization from Firestore [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 26-38) ``.
- **Retrieve a Single Prompt Template**: Fetches a specific prompt template by its unique name within an organization [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 40-59) ``.
- **Create a Prompt Template**: Provisions a new prompt template for an organization, automatically appending creation and modification timestamps [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 61-83) ``.
- **Update a Prompt Template**: Modifies the template text of an existing prompt template and updates its modification timestamp [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 85-108) ``.
- **Delete a Prompt Template**: Permanently removes a prompt template from an organization's configuration [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 110-122) ``.
- **Input Parameter Validation**: Enforces strict parameter type and presence checks across all operations using a centralized security utility [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 31, 45, 66, 90, 115) ``.
- **User Security Enforcement**: Applies user-level security checks to verify the caller's context before executing operations [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 26, 40, 61, 85, 110) ``.

---

#### organization_property

The `organization_property` capability is responsible for the following distinct features:

*   **Property CRUD Operations**:
    *   **Create Property**: Validates input parameters, generates a unique property ID, saves the property document, updates associated buildings to link them to the new property, and appends the property ID to the parent entity's `propertiesIds` array [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 105-175)].
    *   **Read Property**: Retrieves a single property by ID or lists all properties filtered by organization and entity [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 39-104)].
    *   **Update Property**: Updates property metadata and validates associated building structures [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 177-242)].
    *   **Delete Property**: Deletes the property document and unlinks the property ID from all associated buildings [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 254-294)].
*   **Entity Assignment**: Moves a property from an old entity to a new entity, updating the `propertiesIds` arrays on both entity documents and modifying the property's `entityId` [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 295-361)].
*   **Property Image Management**: Handles delegated image uploads and deletions for properties, updating the property document's `propertyImage` field and interacting with Google Cloud Storage [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 363-421)].
*   **Dashboard Statistics Aggregation**:
    *   Aggregates the total count of buildings assigned to a property [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 441-448)].
    *   Aggregates the count of organization admins [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 469-472)].
    *   Aggregates resident onboarding statistics (onboarded vs. not onboarded) across all buildings belonging to the property [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 474-503)].
    *   Aggregates the total count of Access Control Devices (ACDs) installed across all doors of all buildings belonging to the property [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 505-521)].

---

#### organization_residents

### Resident Creation (App User)
Provisions a new resident profile intended to use the mobile application. This process generates a unique activation code, calculates its expiration, generates a corresponding onboarding QR code, and creates an `onboardingInhabitant` document in the `/organizations/{id}/onboardingInhabitants` collection, alongside a placeholder resident document in `/organizations/{id}/residents` `` `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|createResidents|#1` ``. It also validates the requested access rights and converts them to Firestore timestamps `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 604-802). [Confirmed]

### Resident Creation (Non-App User)
Provisions a resident who does not use the mobile application (PIN-only access). This process generates a unique document ID for the non-app user, validates access rights, creates a non-app user record in the building unit subcollection `/buildings/{id}/units/{id}/nonAppUsers`, and issues a static PIN code. It also publishes access messages to the physical hardware (ACDs) via Pub/Sub `` `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|createResidents|#1` ``. (Citations: `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` lines 804-936). [Confirmed]

### Bulk Resident Creation
Supports batch processing of resident creation payloads (both App and Non-App users) up to a maximum batch size defined by the `MAX_BATCH_SIZE` environment variable `` `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|bulkCreateResidents|#1` ``. It processes creations concurrently using `Promise.allSettled` and aggregates success/failure results `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 1113-1232). [Confirmed]

### Resident Deletion & Cascading Cleanup
Handles the deletion of a resident profile and executes a comprehensive cascading cleanup of all associated access mechanisms `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 158-222). [Confirmed] Depending on the resident type, this includes:
- Deleting the resident document from `/organizations/{id}/residents` `` `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsController.default.delete|_deleteResidentFromOrganization|request|#1` ``.
- Deleting associated onboarding records from `/organizations/{id}/onboardingInhabitants` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 500-517).
- Revoking and deleting PIN codes from `/users/{id}/pincodes` and `/buildings/{id}/pincodes`, and publishing deletion commands to physical ACDs `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 224-276, 278-328).
- Removing the resident from the building unit's inhabitant list `/buildings/{id}/units/{id}/inhabitants` and deleting their intercom directory entry `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 224-276, 334-399).
- Cleaning up dependent non-app users, permanent guests, and pending unit invitations originally invited by the deleted resident `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 401-445, 447-485, 487-498).
- If the deleted resident was the last main resident (owner/tenant) in the unit, the system deletes all remaining inhabitants and the unit document itself `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 376-397).

### Resident Updates
Updates a resident's first name, last name, and inhabitant type. It synchronizes these changes to the corresponding building unit inhabitant document and onboarding inhabitant document if the resident is not yet onboarded `` `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|updateResident|#1` ``. (Citations: `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` lines 938-1026). [Confirmed]

### Resident Queries
Retrieves resident lists and details filtered by organization or property ID, transforming internal database representations into standardized response formats `` `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|getAllResidents|#1` ``. (Citations: `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` lines 77-119, 121-156, 1028-1093). [Confirmed]

#### organization_user

### Managing Organization User Roles
The capability allows authorized administrators to update and regenerate consolidated roles for organization users based on assigned roles and organization-level roles [Confirmed]. This is handled by the `updateOrganizationUserRoles` service method, which calls `generateOrganizationUserRoles` on the consolidated roles controller and updates both the organization user document and the user's global organization mapping `` `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUserRoles|#1` `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 41-128).

### Updating Organization User Profiles
Administrators can modify user details such as first name, last name, email, and roles [Confirmed]. The `updateOrganizationUser` service method validates the request, updates the user's profile in the user collection, regenerates organization-level roles, and updates the user's organization mapping `` `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUser|#1` `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 130-205).

### Deleting Organization Users
The capability supports removing users from an organization [Confirmed]. The `deleteOrganizationUser` service method deletes the user document from the organization's user subcollection and removes the organization mapping from the user's global profile `` `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|deleteOrganizationUser|#1` `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 207-255).

### Retrieving Organization Users and Invitees
The capability provides a unified view of all active organization users and pending invitees [Confirmed]. The `getAllOrganizationUsersAndInvitees` service method queries both active users and pending invitations, mapping them to a unified schema with a status of either `'active'` or `'invited'` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getAllOrganizationUsersAndInvitees|#1` `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 257-311).

### Retrieving Individual User and Invitee Details
The capability allows fetching details of a specific organization user by ID or a pending invitee by email [Confirmed]. These operations verify that the requesting administrator has the appropriate permissions before returning the data `` `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getOrganizationUserById|#1` `` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getOrganizationInviteeByEmail|#1` `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 337-378, 380-426).

### Retrieving Organization User Roles
Administrators can fetch the roles assigned to a specific organization user [Confirmed]. This is handled by the `getOrganizationUserRoles` service method, which retrieves the user's roles and cross-checks them against the organization's defined roles `` `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getOrganizationUserRoles|#1` `` `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 428-458).

---

#### organization_user_access

The capability is centered around a single service class, `OSKOrganizationUserAccessService` `` `source_class|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKOrganizationUserAccessService` ``, which exposes the following responsibilities:

- **Organization User Access Setup**: Orchestrates the initialization and configuration of user access within an organization via the `setupOrganizationUserAccess` method `` `service_method|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKOrganizationUserAccessService|setupOrganizationUserAccess|#1` ``. [Confirmed]
- **Access ID Generation**: Generates unique access identifiers by delegating to the core access utility service `OSKAccessUtilsService.generateAccessId` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKAccessUtilsService.generateAccessId|setupOrganizationUserAccess||#1` ``. [Confirmed]
- **Inviter Identity Resolution**: Resolves the display name of the user who initiated or authorized the access request using `OSKAccessUtilsService.getAccessInviterName` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKAccessUtilsService.getAccessInviterName|setupOrganizationUserAccess|inviterId|#1` ``. [Confirmed]
- **Timestamping Access Events**: Captures the exact time of access setup using Firestore's `Timestamp.now` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|Timestamp.now|setupOrganizationUserAccess||#1` ``. [Confirmed]

---

#### organization_user_invitation

The capability is structured around several core responsibilities:

1. **Inviting Users to Organizations**: 
   - Supports inviting standard organization users and PMP users. It validates parameters, checks the sender's permissions, and writes invitation documents to Firestore.
   - Evidenced by `inviteUserWithInvitation` `` `service_method|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKOrganizationUserInvitationService|inviteUserWithInvitation|#1` `` and `invitePMPUserWithInvitation` `` `service_method|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKOrganizationUserInvitationService|invitePMPUserWithInvitation|#1` ``. [Confirmed]

2. **Creating PMP User Invitations with Email Dispatch**:
   - Creates or updates PMP user invitations, checks if the email already exists in Auth0, and dispatches invitation emails via `OSKEmailService` using the `pmpUserInvitation` template.
   - Evidenced by `createPMPUserWithInvitation` `` `service_method|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKOrganizationUserInvitationService|createPMPUserWithInvitation|#1` ``. [Confirmed]

3. **Processing (Accepting) Invitations**:
   - Validates a pending invitation, checks for expiration, generates consolidated organization user roles, creates the organization user document, creates the user-organization link, and deletes the pending invitation.
   - Evidenced by `processPMPInvitation` `` `service_method|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKOrganizationUserInvitationService|processPMPInvitation|#1` ``. [Confirmed]

4. **Canceling Invitations**:
   - Deletes active invitation documents, creates a cancelled invitation record under `/organizations/{organizationId}/userInvitationsCancelled`, and removes the pending invitation from the user's collection.
   - Evidenced by `cancelUsersInvitation` `` `service_method|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKOrganizationUserInvitationService|cancelUsersInvitation|#1` ``. [Confirmed]

5. **Querying Pending Invitations**:
   - Queries collection groups for pending invitations associated with a user's verified email or phone number.
   - Evidenced by `queryPMPInvitations` `` `service_method|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKOrganizationUserInvitationService|queryPMPInvitations|#1` ``. [Confirmed]

### 4. Public Interfaces

#### _module_root

- **`OSKOrganizationController`** (extends `OSKDocumentController`): The primary controller managing direct Firestore operations (get, getAll, save, update) and Cloud Storage interactions (uploadImage, deleteImage) for the `organizations` collection. [Confirmed]
  - *Citations*: `` `source_class|organization|functions/src/modules/organization/controllers/organization.controller.ts|OSKOrganizationController` ``.
- **`OSKOrganizationService`**: The core service class containing the business logic, permission validation, and transactional flows for organization administration. [Confirmed]
  - *Citations*: `` `source_class|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService` ``.
- **`OSKOrganizationUserUtils`**: A utility class providing helper methods like `getOrganizationUser` to fetch organization user details and validate authentication. [Confirmed]
  - *Citations*: `` `source_class|organization|functions/src/modules/organization/utils/get_organization_user.util.ts|OSKOrganizationUserUtils` ``.

#### organization_building

The capability exposes the following public entry points and controllers:

- **`OSKOrganizationBuildingController`**: Extends `OSKDocumentController` to handle direct Firestore document operations (`save`, `update`, `getAll`, `get`, `delete`) on the organization-building collection [Confirmed: `source_class|organization|functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts|OSKOrganizationBuildingController`].
- **`OSKOrganizationBuildingService`**: Orchestrates high-level business logic, permission checks, and cross-module data aggregation [Confirmed: `source_class|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService`].
- **Callable Cloud Functions**: Exposes three HTTPS callable triggers as entry points [Confirmed: `functions/src/modules/organization/modules/organization_building/index.ts` (lines 39-51)]:
  - `getAllOrganizationBuildings`
  - `getAllOrganizationBuildingsForOnboardingCards`
  - `getOrganizationBuildingById`

---

#### organization_building_invitation

This capability exposes its functionality through the following entry points:

### Callable Cloud Functions
Exposed in `functions/src/modules/organization/modules/organization_building_invitation/index.ts` (lines 40-47):
- `createBuildingInhabitantInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_building_invitation/index.ts|createBuildingInhabitantInvitation|#1` ``
- `queryBuildingInhabitantInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_building_invitation/index.ts|queryBuildingInhabitantInvitation|#1` ``
- `acceptBuildingInhabitantInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_building_invitation/index.ts|acceptBuildingInhabitantInvitation|#1` ``

### Service Classes
- `OSKOrganizationBuildingInvitationService` `` `source_class|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKOrganizationBuildingInvitationService` ``: The core orchestrator containing the business logic for managing invitations.

#### organization_entity

This capability exposes its functionality through the following controllers and entry points:

- **`OSKEntityController`**: Extends `OSKDocumentController` to handle direct Firestore document operations (get, getAll, save, update, delete, generateDocId) on the entities collection. [Confirmed] (`` `source_class|organization|functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts|OSKEntityController` ``)
- **`OSKEntityService`**: The core service class containing the business logic, parameter validation, and permission checks for all entity-related operations. [Confirmed] (`` `source_class|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService` ``)
- **`getCallableFunctionTriggers`**: The entry point function in `index.ts` that registers and exports the HTTPS callable Cloud Functions for external client consumption. [Confirmed] (`` `function_declaration|organization|functions/src/modules/organization/modules/organization_entity/index.ts|getCallableFunctionTriggers|#1` ``)

---

#### organization_inhabitant

- **`OSKOrganizationInhabitantController`** (class): Exposes the `queryInhabitants` method which queries the `inhabitants` collection group [Confirmed] (cite `` `source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts|OSKOrganizationInhabitantController` ``).
- **`OSKOrganizationInhabitantService`** (class): Implements the core business logic for retrieving, mapping, and authorizing inhabitant data [Confirmed] (cite `` `source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService` ``).
- **`getOrganizationInhabitantCallableFunctionTriggers`** (function): Registers the Firebase HTTPS callable functions [Confirmed] (cite `` `function_declaration|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getOrganizationInhabitantCallableFunctionTriggers|#1` ``).

#### organization_intercom_ communication

- **`OSKIntercomBuildingStateController`** (extends `OSKDocumentController`): Manages the Firestore state documents for building intercom communications (hot storage). [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/controllers/organization_intercom_building_state.controller.ts`]
- **`OSKIntercomCommunicationArchiveController`** (extends `OSKDocumentController`): Manages the cold storage archive for evicted/expired intercom communications. [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/controllers/organization_intercom_communication_archive.controller.ts`]
- **`OSKIntercomCommunicationService`**: Core business logic service orchestrating creation, deletion, translation, and scheduled task execution. [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts`]
- **`getCallableFunctionTriggers`**: Entry point exporting the Firebase HTTPS callable functions. [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts`]

---

#### organization_onboarding_inhabitant

This capability exposes the following controllers, services, and entry points:

### Controllers
- **`OSKOrganizationOnboardingInhabitantController`**: Extends the core `OSKDocumentController` to manage Firestore operations on the `/organizations/{organizationId}/onboardingInhabitants` collection [Confirmed, `` `source_class|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts|OSKOrganizationOnboardingInhabitantController` ``].
  - Methods: `getCollectionPath`, `generateDocId`, `get`, `getAll`, `queryOnboardingDocuments`, `queryOrCollection`, `create`, `update`, `delete` [Confirmed, `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts` (lines 18-78) ``].

### Services
- **`OSKOrganizationOnboardingInhabitantService`**: The primary service orchestrating onboarding business logic, code generation, verification, and downstream provisioning [Confirmed, `` `source_class|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService` ``].
- **`OSKOrganizationOnboardingMailService`**: A specialized service for sending onboarding activation emails [Confirmed, `` `source_class|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts|OSKOrganizationOnboardingMailService` ``].

### Entry Points
- **`getCallableFunctionTriggers`**: Exposes the callable Cloud Functions that serve as the API gateway for client applications [Confirmed, `` `function_declaration|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|getCallableFunctionTriggers|#1` ``].

#### organization_pending

### Controllers
- **`OSKOrganizationPendingController`** [Confirmed: `source_class|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController`]:
  - Extends `OSKDocumentController` [Confirmed: `source_class|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController`].
  - Manages Firestore persistence for the `'organizationsPending'` collection [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController.default._generateDocId|generateDocId|'organizationsPending'|#1`].
  - Exposes methods: `generateDocId`, `getAll`, `getAllByUserId`, `getById`, `save`, and `update` [Confirmed: `controller_method|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController|generateDocId|#1` (and subsequent controller methods)].

### Services
- **`OSKOrganizationPendingService`** [Confirmed: `source_class|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService`]:
  - Implements the core business logic, validation, and orchestration for pending organization requests [Confirmed: `functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts` (lines 32-416)].

### Entry Points (Callable Cloud Functions)
The capability exposes the following callable HTTPS triggers [Confirmed: `functions/src/modules/organization/modules/organization_pending/index.ts` (lines 21-35)]:
- `createPendingOrganization`
- `getCurrentUserPendingOrganizations`
- `getAllPendingOrganizations`
- `getPendingOrganizationById`
- `rejectPendingOrganizationRequest`
- `approvePendingOrganizationRequest`

---

#### organization_prompt_templates

This capability exposes its functionality through the following public entry points:

- **`OSKOrganizationPromptTemplateController`**: A document controller extending `OSKDocumentController` that abstracts direct Firestore operations (get, query, set, update, delete) for the prompt templates subcollection [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts` (lines 9-53) ``.
- **`OSKOrganizationPromptTemplateService`**: The core service layer orchestrating business logic, validation, and security checks for prompt template management [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 23-123) ``.
- **Callable Cloud Functions**: Exposes five HTTPS callable endpoints (`create`, `delete`, `get`, `getAll`, `update`) initialized via `getCallableFunctionTriggers` [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (lines 35-44) ``.

---

#### organization_property

This capability exposes the following public entry points and services:

*   **Controllers**:
    *   `OSKPropertyController` (extends `OSKDocumentController` from `@oskey/core/controllers/document`): Manages direct Firestore document interactions for the `properties` collection [Confirmed, `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 9-67)].
*   **Services**:
    *   `OSKPropertyService`: Contains the core business logic, permission checks, and orchestration for properties [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 35-521)].
*   **Entry Points**:
    *   `getCallableFunctionTriggers`: Exposes the HTTPS callable Cloud Functions to the Firebase environment [Confirmed, `functions/src/modules/organization/modules/organization_property/index.ts` (lines 46-58)].

---

#### organization_residents

### Controllers
- **`OSKOrganizationResidentsController`**: Extends `OSKDocumentController`. Exposes standard document operations (`get`, `getAll`, `save`, `delete`, `update`) mapped to the `/organizations/{organizationId}/residents` collection path `` `source_class|organization|functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts|OSKOrganizationResidentsController` ``. [Confirmed]

### Services
- **`OSKOrganizationResidentsService`**: The core business logic service orchestrating resident workflows, bulk operations, and cascading cleanups `` `source_class|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService` ``. [Confirmed]

### Entry Points
- **`getCallableResidentsFunctionTriggers`**: Entry point function exporting callable Firebase Cloud Functions for external consumption `` `function_declaration|organization|functions/src/modules/organization/modules/organization_residents/index.ts|getCallableResidentsFunctionTriggers|#1` ``. [Confirmed]

#### organization_user

### OSKOrganizationUserController
This controller class extends `OSKDocumentController` and handles direct database operations (CRUD and queries) on the `/organizations/{organizationId}/users` collection [Confirmed] `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts` (lines 11-71).
- **Methods**:
  - `getAll(organizationId)`: Queries all users in the organization.
  - `get(organizationId, userId)`: Retrieves a specific user document.
  - `getSafe(organizationId, userId)`: Safely retrieves a user document.
  - `save(organizationId, email, data)`: Saves a user document.
  - `update(organizationId, userId, data)`: Updates a user document.
  - `delete(organizationId, email)`: Deletes a user document.
  - `getOrganizationUserAdmins(organizationId, queryFilters)`: Filters users with the `v1.org.admin` role.
  - `getOrganizationAdmins(organizationId)`: Filters users with either `v1.org.admin` or `v1.admin` roles.
  - `getByEmail(organizationId, email)`: Retrieves a user document by email.

### OSKOrganizationUserService
This service class orchestrates business logic, permission checks, and coordinates with other submodules/modules for organization user operations [Confirmed] `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 38-458).
- **Methods**:
  - `updateOrganizationUserRoles`
  - `updateOrganizationUser`
  - `deleteOrganizationUser`
  - `getAllOrganizationUsersAndInvitees`
  - `getOrganizationUserById`
  - `getOrganizationInviteeByEmail`
  - `getOrganizationUserRoles`
  - `getAllOrganizationUser`

---

#### organization_user_access

This capability does not expose any direct HTTP controllers or Firestore triggers within its own submodule. Instead, it exposes a service entry point intended for internal module consumption:

- **`OSKOrganizationUserAccessService`**: Exported from the submodule's entry file `` `exported_symbol|organization|functions/src/modules/organization/modules/organization_user_access/index.ts|./services/organization_user_access.service|#1` ``. This service provides the programmatic interface `setupOrganizationUserAccess` to other submodules or modules requiring organization-scoped user access setup. [Confirmed]

---

#### organization_user_invitation

This capability exposes its functionality through the following controllers and entry points:

- **`OSKOrganizationPMPUserInvitationController`**: Exposes collection group querying for PMP user invitations.
  - Path: `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_pmp_user_invitation.controller.ts` `` `source_class|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_pmp_user_invitation.controller.ts|OSKOrganizationPMPUserInvitationController|#1` ``. [Confirmed]
- **`OSKOrganizationUserInvitationPendingController`**: Manages pending user invitation documents.
  - Path: `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation_pending.controller.ts` `` `source_class|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation_pending.controller.ts|OSKOrganizationUserInvitationPendingController|#1` ``. [Confirmed]
- **`OSKOrganizationUserInvitationController`**: Manages active, rejected, and cancelled organization user invitation documents.
  - Path: `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts` `` `source_class|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController|#1` ``. [Confirmed]
- **`OSKOrganizationUserInvitationService`**: Orchestrates the business logic for invitations.
  - Path: `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` `` `source_class|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKOrganizationUserInvitationService|#1` ``. [Confirmed]
- **Callable Function Triggers**: Exposes the API endpoints to the Firebase client SDKs.
  - Path: `functions/src/modules/organization/modules/organization_user_invitation/index.ts` `` `function_declaration|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|getCallableFunctionTriggers|#1` ``. [Confirmed]

### 5. Internal Structure

#### Intra-Module Coupling Analysis
The `organization` module exhibits a highly modularized internal structure consisting of 13 submodules [Confirmed]. The submodule coupling graph reveals a clear hub-and-spoke architecture centered around identity and access management:

- **`organization_user` as the Central Hub**: This submodule acts as the primary identity resolution engine within the module. It is imported and called by **10 sibling submodules** (`organization_building`, `organization_building_invitation`, `organization_entity`, `organization_inhabitant`, `organization_intercom_ communication`, `organization_onboarding_inhabitant`, `organization_pending`, `organization_property`, `organization_residents`, and `organization_user_invitation`) [Confirmed]. It is also called by **5 external modules** (`admin`, `building`, `core`, `supplier`, and `user`) [Confirmed].
- **`organization_residents` as a Secondary Hub**: This submodule manages resident profiles and coordinates with `organization_onboarding_inhabitant` and `organization_property` to handle cascading deletions and profile updates [Confirmed].
- **`_module_root` as the Orchestrator**: The root submodule maintains outbound coupling to almost all submodules to register callable triggers and expose top-level controllers [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

#### Cross-Cutting Ownership Conclusion
The `organization` module acts as the primary system of record for the platform's administrative hierarchy [Confirmed]. Based on the resolved call edges and data ownership hints, the true ownership of shared collections is distributed as follows:

- **`/organizations/{id}`**: Authoritatively owned by `_module_root` via `OSKOrganizationController` [Inferred].
- **`/organizations/{id}/users`**: Authoritatively owned by `organization_user` via `OSKOrganizationUserController` [Inferred]. This is the most heavily queried subcollection, serving as the definitive source of PGO user roles and consolidated permissions for both internal submodules and external modules [Confirmed].
- **`/organizations/{id}/residents`**: Authoritatively owned by `organization_residents` via `OSKOrganizationResidentsController` [Inferred].
- **`/organizations/{id}/onboardingInhabitants`**: Authoritatively owned by `organization_onboarding_inhabitant` via `OSKOrganizationOnboardingInhabitantController` [Inferred].
- **`/entities/{id}`**: Authoritatively owned by `organization_entity` via `OSKEntityController` [Inferred].
- **`/properties/{id}`**: Authoritatively owned by `organization_property` via `OSKPropertyController` [Inferred].
- **`/organizations/{id}/promptTemplates`**: Authoritatively owned by `organization_prompt_templates` via `OSKOrganizationPromptTemplateController` [Inferred].
- **`/organizations/{id}/buildings`**: Authoritatively owned by `organization_building` via `OSKOrganizationBuildingController` [Inferred].
- **`/organizations/{id}/userInvitations`**: Authoritatively owned by `organization_user_invitation` via `OSKOrganizationUserInvitationController` [Inferred].

**Per-capability evidence:**

#### _module_root

- **Firestore Path**: `/organizations/{id}` [Confirmed]
  - **Description**: This capability owns the root `/organizations` collection. It performs read, write, and update operations on organization documents.
  - **Fields**:
    - `isoCountryCode`: *string*
    - `taxNumber`: *string*
    - `tenant`: *string*
    - `streetAddress`: *map* (houseNumber, streetName, postalCode, city, country, isoCountryCode, coordinate)
    - `creationDate`: *timestamp*
    - `name`: *string*
    - `userRoles`: *array*
    - `entityP`: *string*
    - `organizationLogo`: *string* (optional)
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/controllers/organization.controller.ts|OSKOrganizationController.default._generateDocId|generateDocId|'organizations'|#1` ``.

#### organization_building

#### Firestore Collections Scoped to this Capability
The capability owns and performs read/write operations on the following Firestore path:
- `/organizations/{organizationId}/buildings/{buildingId}` [Confirmed: `functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts` (lines 17-44)]
  - **Operation Scope**: Read/Write (CRUD via `OSKOrganizationBuildingController`).

#### Firestore Collections Read by this Capability
The capability reads from the following Firestore paths owned by other modules:
- `/buildings/{buildingId}` [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKBuildingController.default.queryAllBuildings|getAllOrganizationBuildings|queryFilter|#1`]
  - **Operation Scope**: Read-only (queried via `OSKBuildingController`).
- `/buildings/{buildingId}/units/{unitId}` [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKBuildingUnitController.default.getAll|getAllOrganizationBuildingsForOnboardingCards|b.id|#1`]
  - **Operation Scope**: Read-only (queried via `OSKBuildingUnitController`).
- `/buildings/{buildingId}/doors/{doorId}` [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKBuildingDoorController.default.getAll|getAllOrganizationBuildingsForOnboardingCards|b.id|#1`]
  - **Operation Scope**: Read-only (queried via `OSKBuildingDoorController`).

---

#### organization_building_invitation

### Firestore Paths Touched
Based on the controllers invoked by this capability, the following Firestore paths are modified or queried:

- `/buildings/{buildingId}/units/{unitId}/inhabitants`
  - **Operation**: Write (Create) `` `call_expression|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKBuildingUnitInhabitantService.addInhabitant|acceptBuildingInhabitantInvitation|buildingUnitInhabitant|#1` ``
  - **Scope**: Confirmed
- `/buildings/{buildingId}/units/{unitId}/invitationsSent`
  - **Operation**: Write (Create, Delete), Read (Query) `` `call_expression|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKBuildingUnitInvitationController.default.create|createBuildingInhabitantInvitation|request.buildingId,request.unitId,invitationId,invitation|#1` ``, `` `call_expression|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKBuildingUnitInvitationController.default.deleteInvitation|acceptBuildingInhabitantInvitation|invitation.buildingId,invitation.unitId,invitation.invitationId|#1` ``, `` `call_expression|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKBuildingUnitInvitationController.default.queryInvitations|acceptBuildingInhabitantInvitation|'invitationsSent',invitationsQueryFilter|#1` ``
  - **Scope**: Inferred (via `OSKBuildingUnitInvitationController`)

#### organization_entity

### Firestore Collections
This capability owns and performs direct write operations on the following Firestore paths:

- **`/entities/{id}`**: The primary collection storing administrative entity documents. Operations include document creation, updates, and deletion. [Confirmed] (`` `controller_method|organization|functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts|OSKEntityController|getCollectionPath|#1` ``)
  - *Operation Detection Scope*: Direct write (`_set`, `_update`, `_delete`) via `OSKEntityController`. [Confirmed] (`` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts|OSKEntityController.default._set|save|OSKEntityController.collection,entityId,data|#1` ``, `` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts|OSKEntityController.default._update|update|OSKEntityController.collection,entityId,data|#1` ``, `` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts|OSKEntityController.default._delete|delete|OSKEntityController.collection,entityId|#1` ``)

### Shared Firestore Collections (Write Access)
This capability performs write operations on documents owned by other capabilities or modules:

- **`/organizations/{id}`**: Updated during sub-entity assignment to modify the `entityP` field. [Confirmed] (`` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKOrganizationController.default.update|assignSubEntityToParent|oldOrganizationId,{             entityP: newParentEntityId,         }|#1` ``)
- **`/properties/{id}`**: Updated during entity deletion to clear the associated `entityId` field. [Confirmed] (`` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityController.default.update|deleteEntity|propertiesId,{ entityId: '' }|#1` ``)

---

#### organization_inhabitant

- **`inhabitants`** (Collection Group): Queried to retrieve inhabitant documents across buildings [Confirmed] (cite `` `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts|OSKOrganizationInhabitantController.default._queryCollectionGroup|queryInhabitants|collectionName,queryFilters|#1` ``).
- **`/users/{id}`** (Firestore Path): Read to fetch the core user profile [Confirmed] (cite `` `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKUserController.default.get|mapInhabitantData|inhabitantData.userId|#1` ``).
- **`/users/{id}/pincodes`** (Firestore Path): Read to fetch active pincodes for the inhabitant [Confirmed] (cite `` `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKUserPincodeController.default.getAll|mapInhabitantData|inhabitantData.userId|#1` ``).
- **`/organizations/{id}/buildings`** (Firestore Path): Read to fetch buildings assigned to the organization [Confirmed] (cite `` `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationBuildingController.default.getAll|getInhabitantsForOrganization|organizationId|#1` ``).
- **`/buildings/{id}/units`** (Firestore Path): Read to fetch unit details for the inhabitant [Confirmed] (cite `` `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKBuildingUnitController.default.get|mapInhabitantData|inhabitantData.buildingId,inhabitantData.unitId|#1` ``).
- **`/organizations/{id}/users`** (Firestore Path): Read to fetch the organization user details for authorization [Confirmed] (cite `` `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationUserController.default.get|getAllOrganizationInhabitants|organizationId,userId|#1` ``).

#### organization_intercom_ communication

#### Firestore Paths Touched
The following paths are dynamically constructed and touched by this capability:

- `/organizations/{organizationId}/buildings/{buildingId}/intercomBuildingState/{type}` (where `type` is `'push'` or `'intercom'`)
  - **Touch Type**: Write/Read (Transaction-based updates)
  - **Operation Detection Scope**: Undetermined (may be indirect)
  - **Confidence**: Inferred [Based on `OSKIntercomBuildingStateController.default.getStateCollectionPath` and `db.collection(stateCollectionPath).doc('default')` calls, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 150, 339, 1773)]

- `/organizations/{organizationId}/buildings/{buildingId}/intercomBuildingState/{type}_archive/{communicationId}` (where `type` is `'push'` or `'intercom'`)
  - **Touch Type**: Write/Read (Transaction-based archiving)
  - **Operation Detection Scope**: Undetermined (may be indirect)
  - **Confidence**: Inferred [Based on `OSKIntercomCommunicationArchiveController.default.getCollectionPath` and `archiveCollectionRef.doc(msg.communicationId)` calls, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 144, 291, 432, 1768)]

---

#### organization_onboarding_inhabitant

### Firestore Collections & Paths
This capability directly manages and performs read/write/delete operations on the following Firestore paths:

- **`/organizations/{organizationId}/onboardingInhabitants/{onboardingId}`**: Owned and managed entirely by this capability to store temporary onboarding state [Confirmed, `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts` (lines 18-26) ``].
  - Operations: Create, Read, Update, Delete.

### Downstream Data Modifications
This capability performs write or update operations on the following collections owned by other capabilities/modules:

- **`/organizations/{organizationId}/residents/{residentId}`**: Updates the resident profile to mark them as onboarded and links their permanent user ID and PIN codes [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationResidentsController.default.update|onboardInhabitant|onboardingCard.organizationId,onboardingCard.onboardingId,{                 isOnboarded: true,                 pinCodes: pincodeDoc,                 userId: userId,             }|#1` ``].
  - Operations: Update.
- **`/buildings/{buildingId}/units/{unitId}/inhabitants/{inhabitantId}`**: Adds the newly onboarded user as an active inhabitant of the unit [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKBuildingUnitInhabitantService.addInhabitant|onboardInhabitant|inhabitant,onboardingCard.accessRights|#1` ``].
  - Operations: Create.

### Read-Only Access
This capability reads data from the following paths for validation and enrichment:
- `/users/{userId}` [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKUserController.default.get|verifyActivationCode|userId!|#1` ``]
- `/buildings/{buildingId}` [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKBuildingController.default.get|verifyActivationCode|onboardingCard.buildingId|#1` ``]
- `/buildings/{buildingId}/doors/{doorId}` [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKBuildingDoorController.default.getSafe|onboardInhabitant|onboardingCard.buildingId,door.doorId|#1` ``]
- `/buildings/{buildingId}/units/{unitId}` [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKBuildingUnitController.default.get|verifyActivationCode|onboardingCard.buildingId,onboardingCard.unitId|#1` ``]

#### organization_pending

### Firestore Collections
- **`organizationsPending`** [Inferred: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController.default._generateDocId|generateDocId|'organizationsPending'|#1`]:
  - This capability owns and performs write operations (create, update) on the `'organizationsPending'` collection [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController.default._set|save|OSKOrganizationPendingController.collection,pendingOrganizationId,data|#1`, `call_expression|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController.default._update|update|OSKOrganizationPendingController.collection,pendingOrganizationId,data|#1`].
  - *Note*: This collection is not explicitly documented in the provided `firestore-schema.md` but is verified through implementation code.

---

#### organization_prompt_templates

### Firestore Paths
This capability owns and manages documents within the following Firestore path:

- **`/organizations/{organizationId}/promptTemplates/{promptName}`** [Confirmed]
  - **Fields**:
    - `promptName`: *string*
    - `modificationDate`: *timestamp*
    - `creationDate`: *timestamp*
    - `promptTemplate`: *string*
    - `organizationId`: *string*
  - **Operations**:
    - **Read**: Performed via `_get` and `_query` in the controller [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts` (lines 18-28) ``.
    - **Write**: Performed via `_set`, `_update`, and `_delete` in the controller [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts` (lines 29-52) ``.

---

#### organization_property

### Firestore Collections & Paths
This capability owns and performs write operations on the following Firestore paths:

*   `/properties/{propertyId}`: Owned entirely by this capability. `OSKPropertyController` manages CRUD operations on this collection [Confirmed, `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 13-63)].

This capability also performs write operations on documents owned by other capabilities/modules:
*   `/entities/{entityId}`: Modifies the `propertiesIds` array field during property creation and entity reassignment [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 166, 350, 354)].
*   `/buildings/{buildingId}`: Modifies the `propertyId` field on building documents when properties are created or deleted [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 171, 289)].

### Read-Only Access
This capability reads from the following paths for validation and statistics aggregation:
*   `/organizations/{organizationId}/users/{userId}`: Reads user roles for permission validation [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 128, 195, 268, 314)].
*   `/organizations/{organizationId}/residents`: Reads resident onboarding status [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 485-492)].
*   `/buildings/{buildingId}/doors/{doorId}`: Reads door configurations [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 511-512)].
*   `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`: Reads assigned ACDs [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 513-516)].

---

#### organization_residents

### Firestore Collections & Paths

| Path | Operations | Scope / Context |
| :--- | :--- | :--- |
| `/organizations/{organizationId}/residents/{residentId}` | Read, Write, Delete | Primary resident document managed by `OSKOrganizationResidentsController` |
| `/organizations/{organizationId}/onboardingInhabitants/{onboardingId}` | Read, Write, Delete | Onboarding records managed via `OSKOrganizationOnboardingInhabitantController` |
| `/buildings/{buildingId}/units/{unitId}/inhabitants/{userId}` | Read, Write, Delete | Building unit inhabitant records managed via `OSKBuildingUnitInhabitantController` |
| `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}` | Read, Delete | Non-app user records managed via `OSKBuildingUnitNonAppUserController` |
| `/buildings/{buildingId}/units/{unitId}/permanentGuests/{guestUserId}` | Read, Delete | Permanent guest records managed via `OSKBuildingUnitPermanentGuestController` |
| `/buildings/{buildingId}/pincodes/{pincodeId}` | Delete | Building-level PIN codes deleted via `OSKPincodeService` |
| `/users/{userId}/pincodes/{pincodeId}` | Delete | User-level PIN codes deleted via `OSKUserPincodeController` |
| `/users/{userId}/accesses/{accessId}` | Read, Delete | User accesses managed via `OSKUserAccessesController` |
| `/buildings/{buildingId}/accesses/{accessId}` | Delete | Building accesses managed via `OSKBuildingAccessesController` |
| `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/accesses/{accessId}` | Read, Delete | Non-app user accesses managed via `OSKNonAppUserAccessController` |
| `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes/{pincodeId}` | Read, Delete | Non-app user PIN codes managed via `OSKNonAppUserPincodeController` |
| `/buildings/{buildingId}/doors/{doorId}` | Read | Door configuration lookup via `OSKBuildingDoorController` |
| `/buildings/{buildingId}/units/{unitId}` | Delete | Unit document deleted via `OSKBuildingUnitController` when last resident is removed |

#### organization_user

### Firestore Collections

#### `/organizations/{organizationId}/users/{userId}`
- **Description**: Stores the organization-specific user profile, including assigned roles and consolidated permissions [Confirmed] `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts`.
- **Operations**:
  - **Read**: `_get`, `_query` [Confirmed] `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts` (lines 19, 23, 66).
  - **Write**: `_set`, `_update`, `_delete` [Confirmed] `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts` (lines 35, 39, 43).

---

#### organization_user_access

While this capability imports `firebase-admin/firestore` `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|firebase-admin/firestore|#1` `` and utilizes Firestore `Timestamp` objects `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|Timestamp.now|setupOrganizationUserAccess||#1` ``, there is no direct evidence of specific Firestore collection paths being read from or written to within the provided evidence pack. [Unknown]

---

#### organization_user_invitation

This capability owns and performs read/write operations on the following Firestore paths:

- **`/organizations/{organizationId}/userInvitations/{email}`**
  - Operations: Read, Write, Delete
  - Evidenced by: `OSKOrganizationUserInvitationController` methods `save` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._set|save|\`/organizations/\${organizationId}/userInvitations\`,email,data|#1` `` and `deleteOrganizationUserInvitation` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._delete|deleteOrganizationUserInvitation|\`/organizations/\${organizationId}/userInvitations\`,email|#1` ``. [Confirmed]

- **`/organizations/{organizationId}/userInvitationsCancelled/{email}`**
  - Operations: Write
  - Evidenced by: `OSKOrganizationUserInvitationController.saveOrganizationUserInvitationCancelled` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._set|saveOrganizationUserInvitationCancelled|\`/organizations/\${organizationId}/userInvitationsCancelled\`,email,data|#1` ``. [Confirmed]

- **`/organizations/{organizationId}/userInvitationsRejected/{email}`**
  - Operations: Write
  - Evidenced by: `OSKOrganizationUserInvitationController.moveOrganizationUserInvitation` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._set|moveOrganizationUserInvitation|\`/organizations/\${organizationId}/userInvitationsRejected\`,email,data|#1` ``. [Confirmed]

- **`/users/{userId}/organizationInvitations/{organizationId}`**
  - Operations: Read, Write
  - Evidenced by: `OSKOrganizationUserInvitationPendingController.save` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation_pending.controller.ts|OSKOrganizationUserInvitationPendingController.default._set|save|\`/users/\${userId}/organizationInvitations/\`,organizationId,data|#1` `` and `OSKOrganizationUserInvitationController.getUsersOrganization` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts|OSKOrganizationUserInvitationController.default._get|getUsersOrganization|\`/users/\${userId}/organizationInvitations/\`,organizationId|#1` ``. [Confirmed]

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable Functions
- **`createAnOrganization`**
  - **Request Schema**: `OSKOrganizationCreateRequest`
    - `adminsOrganizationId`: `string`
    - `id`: `string`
    - `isoCountryCode`: `string`
    - `name`: `string`
    - `organizationLogo`: `string | undefined` (optional)
    - `streetAddress`: `OSKStreetAddress`
    - `taxNumber`: `string`
    - `tenant`: `string`
    - `userRoles`: `string[]`
- **`updateAnOrganization`**
  - **Request Schema**: `OSKOrganizationUpdateRequest`
    - `adminsOrganizationId`: `string`
    - `id`: `string`
    - `isoCountryCode`: `string`
    - `name`: `string`
    - `organizationLogo`: `string | undefined` (optional)
    - `streetAddress`: `OSKStreetAddress`
    - `taxNumber`: `string`
    - `tenant`: `string`
    - `userRoles`: `string[]`
- **`getAllOrganizations`**
  - **Request Schema**: `OSKGetAllOrganizationsRequestDocument`
    - `adminsOrganizationId`: `string`
- **`deleteOrganizationLogo`**
  - **Request Schema**: `deleteOrganizationLogoRequest`
    - `organizationId`: `string`
    - `filename`: `string`

### Firestore Triggers
No direct Firestore triggers (e.g., `onWrite`, `onUpdate`) are registered within this capability's root file, although it orchestrates the registration of triggers owned by its submodules. [Confirmed]

#### organization_building

#### Callable APIs
The following callable APIs are exposed by this capability:

##### `getAllOrganizationBuildings`
- **Request Schema**: `OSKGetAllOrganizationBuildingsRequestData`
  - `organizationId`: `string`
- **Response Schema**: No matching `model_property` facts matched within this pack for a dedicated response type; returns an array of enriched organization-building objects.

##### `getAllOrganizationBuildingsForOnboardingCards`
- **Request Schema**: `OSKGetAllOrganizationBuildingsByPropertyRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema**: `OSKBuildingForOnboardingCards`
  - `doors`: `OSKBuildingForOnboardinCardDoor[]`
  - `units`: `OSKBuildingForOnboardingCardUnit[]`

##### `getOrganizationBuildingById`
- **Request Schema**: `OSKGetORganizationBuildingByIdRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Schema**: No matching `model_property` facts matched within this pack for a dedicated response type.

#### Firestore Triggers
No Firestore triggers are owned or declared by this capability [Confirmed: `functions/src/modules/organization/modules/organization_building/index.ts` (lines 39-51)].

---

#### organization_building_invitation

### Resolved API Request/Response Schemas

#### `acceptBuildingInhabitantInvitation`
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationAcceptRequest`
  - `adminsOrganizationId`: `string`
  - `invitationId`: `string`
  - `userId`: `string`

#### `createBuildingInhabitantInvitation`
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationCreateRequest`
  - `adminsOrganizationId`: `string`
  - `buildingId`: `string`
  - `buildingUnitInhabitantType`: `OSKBuildingUnitInhabitantType` (imported from `@oskey/building/unit`)
  - `doorIds` (optional): `string[] | undefined`
  - `email` (optional): `string | undefined`
  - `firstName`: `string`
  - `internationalPhoneNumber`: `string`
  - `inviterId`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `postalAddress` (optional): `OSKStreetAddress | undefined` (imported from `@oskey/core`)
  - `unitId`: `string`
  - `userId` (optional): `string | undefined`

#### `queryBuildingInhabitantInvitation`
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationQueryRequest`
  - `adminsOrganizationId`: `string`
  - `collectionName`: `"invitationsSent" | "invitationsRejected"`
  - `queryField`: `"buildingId" | "unitId" | "invitationId" | "buildingUnitInhabitantType"`
  - `queryValue`: `string | { type: string; isResident?: boolean | undefined; }`

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

#### organization_entity

### Callable APIs
The following HTTPS callable functions are exposed by this capability:

#### `assignSubEntityToParent`
- **Request Type**: `OSKAssignSubEntityToParentRequestData`
  - `newOrganizationId`: `string`
  - `newParentEntityId`: `string`
  - `oldOrganizationId`: `string`
  - `oldParentEntityId`: `string`
  - `subEntityId`: `string`
- **Response Type**: `Promise<void>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 228-278)

#### `createEntity`
- **Request Type**: `OSKSubEntityRequestData` [Inferred] (Note: Resolved API Request/Response Schemas do not explicitly list `createEntity` request type, but `OSKSubEntityRequestData` contains fields like `organizationAdminId`, `organizationId`, `parentEntityId`, `propertiesIds`, `entityName`, `entityType` matching creation needs).
- **Response Type**: `Promise<{ entityId: string }>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 84-132)

#### `deleteEntity`
- **Request Type**: `OSKDeleteEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 184-227)

#### `getAllEntities`
- **Request Type**: `OSKGetAllEntityRequestData`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKEntity[]>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 30-49)

#### `getBuildingsByEntityId`
- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKBuilding[]>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 343-382)

#### `getEntityById`
- **Request Type**: `OSKGetEntityByIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKEntity>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 50-83)

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
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 279-342)

#### `updateEntity`
- **Request Type**: `OSKUpdateEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
  - `update`: `Partial<OSKSubEntityRequestData>`
- **Response Type**: `Promise<void>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 134-183)

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

---

#### organization_inhabitant

#### Callable APIs
- **`getAllOrganizationInhabitants`** (cite `` `api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getAllOrganizationInhabitants|#1` ``)
  - **Request Type**: `OSKPmpResidentsRequestData`
    - `organizationId`: `string`
  - **Response Type**: `OSKPmpResidentsDocumentResponse`
    - `count`: `number`
    - `inhabitants`: `import("functions/src/modules/organization/modules/organization_inhabitant/models/documents/organization_inhabitant_document.model").OSKPmpResidentsDocument[]`
- **`getInhabitantDetailsById`** (cite `` `api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getInhabitantDetailsById|#1` ``)
  - **Request Type**: `OSKPmpResidentsDetailsRequestData`
    - `organizationId`: `string`
    - `userId`: `string`
  - **Response Type**: No explicit schema matched in the schemas section, but it returns mapped inhabitant details [Confirmed].

#### Firestore Triggers
- None evidenced [Confirmed].

#### organization_intercom_ communication

#### API Contracts
The following HTTPS callable functions are exposed by this capability:

##### `createIntercomCommunication`
- **Request Type**: `OSKCreateIntercomCommunicationRequestData`
  - `homeInfo`: `{ title: string; description: string; }`
  - `organizationId`: `string`
  - `priority`: `OSKCommunicationPriority`
  - `schedule`: `{ startDate: Date; endDate?: Date; }`
  - `sendToChannels`: `("intercom" | "residents")[]`
  - `targets`: `{ buildingId: string; buildingName: string; doorIds: string[]; }[]`
- **Response Type**: `OSKCreateIntercomCommunicationResponseData`
  - `communicationId`: `string`
  - `results`: `OSKCreateIntercomCommunicationResult[]`

##### `deleteIntercomCommunication`
- **Request Type**: `OSKDeleteIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `void`

##### `getAllIntercomCommunicationService`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `getAllIntercomCommunicationsByEntityId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByEntityIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `getAllIntercomCommunicationsByPropertyId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByPropertyIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `getArchivedIntercomCommunications`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `getIntercomCommunicationById`
- **Request Type**: `OSKGetIntercomCommunicationByIdRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `reformulateCommunicationWithGemini`
- **Request Type**: `OSKReformulateCommunicationRequestData`
  - `description`: `string`
  - `organizationId`: `string`
  - `title`: `string`
- **Response Type**: `OSKReformulateCommunicationResponseData`
  - `reformulatedDescription`: `string`
  - `reformulatedTitle`: `string`

#### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

---

#### organization_onboarding_inhabitant

### Callable Functions
The following callable functions are exposed by this capability:

#### `createOnboardingDocuments`
- **Request Type**: `OSKOrganizationOnboardingInhabitantCreateLinkRequest`
  - `onboardingCards`: `OSKInhabitantOnboardingCardRequest`
  - `organizationId`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

#### `findOnboardingDocument`
- **Request Type**: `OSKOrganizationOnboardingFindDocumentRequest`
  - `organizationId`: `string`
  - `unitId`: `string`
- **Response Type**: `OSKOrganizationOnboardingInhabitant`
  - `accessRights`: `OSKAccessRightWithTimestamp[]`
  - `accessType`: `OSKUserAccessType`
  - `activationCode`: `string`
  - `buildingId`: `string`
  - `contactDetails`: `OSKEmailAndPhoneGuaranteed`
  - `contactIdentifiers`: `string[]`
  - `creationDate`: `Timestamp`
  - `doors`: `OSKDoorOnboarding[]`
  - `emailVerified`: `boolean` (optional)
  - `expiryDateActivationCode`: `Timestamp`
  - `expiryDateSms`: `Timestamp`
  - `firstName`: `string`
  - `identityVerified`: `boolean` (optional)
  - `inhabitantType`: `OSKBuildingUnitInhabitantType` (optional)
  - `inviterId`: `string`
  - `isOnboarded`: `boolean`
  - `isUpdated`: `boolean`
  - `lastName`: `string`
  - `linksUrl`: `object`
  - `onboardingId`: `string`
  - `onboardingQRCode`: `string`
  - `organizationId`: `string`
  - `phoneVerified`: `boolean` (optional)
  - `smsOtp`: `number`
  - `unitId`: `string`
  - `updatedFields`: `OSKOrganizationOnboardingInhabitantUpdate`

#### `getOnboardingDocumentById`
- **Request Type**: `OSKOrganizationOnboardingGetDocumentByIdRequestData`
  - `onboardingId`: `string`
  - `organizationId`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

#### `sendOnboardingActivationCodeEmailCallable`
- **Request Type**: `ResendActivationCodeRequest`
  - `language`: `OSKSupportedLanguageEnum`
  - `organizationId`: `string`
  - `residentId`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

#### `verifyActivationCode`
- **Request Type**: `OSKOrganizationOnboardingVerifyActivationCode`
  - `activationCode`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

#### `verifyActivationCodeByOrganizationAdmin`
- **Request Type**: `OSKOrganizationOnboardingVerifyActivationCodeByOrgAdminRequestData`
  - `activationCode`: `string`
  - `adminOrganizationId`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

### Firestore Triggers
No Firestore triggers are defined or owned by this capability [Confirmed].

#### organization_pending

### API Contracts

#### `createPendingOrganization`
- **Request Type**: `OSKOrganizationPending`
  - `name`: `string`
  - `status`: `"rejected" | "approved" | "pending"`
  - `streetAddress`: `OSKStreetAddress`
  - `taxNumber`: `string`
  - `userId`: `string`
- **Response Type**: `void` (Inferred)

#### `getCurrentUserPendingOrganizations`
- **Request Type**: `void` (Inferred)
- **Response Type**: `OSKOrganizationPendingDocument[]` (Inferred)

#### `getAllPendingOrganizations`
- **Request Type**: `OSKGetAllOrganizationsPendingRequestDocument`
  - `adminsOrganizationId`: `string`
- **Response Type**: `OSKOrganizationPendingDocument[]` (Inferred)

#### `getPendingOrganizationById`
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Type**: `OSKGetOrganizationsPendingByIdResponseDocument`
  - `user`: `OSKUserDocument | undefined`

#### `rejectPendingOrganizationRequest`
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Type**: `void` (Inferred)

#### `approvePendingOrganizationRequest`
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Type**: `void` (Inferred)

### Firestore Triggers
- No Firestore triggers are owned or declared by this capability [Confirmed: `functions/src/modules/organization/modules/organization_pending/index.ts` (lines 21-35)].

---

#### organization_prompt_templates

### Callable Cloud Functions
The following callable APIs are exposed by this capability:

#### `create`
- **Request Schema**: `OSKCreateOrganizationPromptTemplateRequest` [Confirmed]
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response**: Returns the created prompt template document or success status [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|create|#1` ``.

#### `delete`
- **Request Schema**: `OSKDeleteOrganizationPromptTemplateRequest` [Confirmed]
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response**: Returns a success status upon deletion [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|delete|#1` ``.

#### `get`
- **Request Schema**: `OSKGetOrganizationPromptTemplateRequest` [Confirmed]
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response**: Returns the requested `OSKOrganizationPromptTemplate` document [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|get|#1` ``.

#### `getAll`
- **Request Schema**: `OSKGetAllOrganizationPromptTemplatesRequest` [Confirmed]
  - `organizationId`: `string`
- **Response**: Returns an array of `OSKOrganizationPromptTemplate` documents [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|getAll|#1` ``.

#### `update`
- **Request Schema**: `OSKUpdateOrganizationPromptTemplateRequest` [Confirmed]
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response**: Returns the updated prompt template document [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|update|#1` ``.

No Firestore triggers are owned or declared by this capability [Confirmed].

---

#### organization_property

### Callable Cloud Functions
The following HTTPS callable functions are exposed by this capability:

#### `assigningPropertyToEntity`
*   **Request Schema**: `OSKEntityAssigningPropertyRequestData`
    *   `newEntityId`: `string`
    *   `oldEntityId`: `string`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `createProperty`
*   **Request Schema**: `OSKCreatePropertyRequestData`
    *   `buildings`: `import("functions/src/modules/building/models/documents/building_document.model").OSKBuilding[]`
    *   `entityId`: `string`
    *   `managementType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyManagementEnum`
    *   `organizationId`: `string`
    *   `propertyImage`: `string | undefined` (optional)
    *   `propertyName`: `string`
    *   `propertyType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyTypeEnum`
    *   `streetAddress`: `import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `deleteProperty`
*   **Request Schema**: `OSKGetPropertyByIdRequestData`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `deletePropertyImage`
*   **Request Schema**: `OSKDeletePropertyImageRequest`
    *   `filename`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `getAllProperties`
*   **Request Schema**: `OSKGetAllPropertiesRequestData`
    *   `entityId`: `string`
    *   `organizationId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `getPropertyById`
*   **Request Schema**: `OSKGetPropertyByIdRequestData`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `getPropertyDashboardStatics`
*   **Request Schema**: `OSKGetPropertyDashboardStaticsRequestData`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `OSKGetPropertyDashboardStaticsResponseData`
    *   `adminsCount`: `number`
    *   `buildingsCount`: `number`
    *   `devicesCount`: `number`
    *   `residentsCount`: `{ onboarded: number; notOnboarded: number; }`

#### `updateProperty`
*   **Request Schema**: `OSKUpdatePropertyRequestData`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
    *   `update`: `Partial<import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKProperty>`
*   **Response Schema**: `void` (or standard HTTPS response)

---

#### organization_residents

### Callable APIs

#### `deleteResident`
- **Request Type**: `OSKResidentsDocumentDeleteRequest`
  - `organizationId`: `string`
  - `residentId`: `string`
- **Response Type**: `void` (Implicit)

#### `getAllResidents`
- **Request Type**: `OSKGetAllOrganizationResidentsRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKResidentsDocumentResponse`
  - `count`: `number`
  - `residents`: `OSKOrganizationResidentResponseDocument[]`

#### `getResidentDetails`
- **Request Type**: `OSKGetOrganizationResidentDetailsRequestData`
  - `organizationId`: `string`
  - `residentId`: `string`
- **Response Type**: `OSKOrganizationResidentResponseDocument` (Implicit)

#### `getallResidentsByPropertyIdCallable`
- **Request Type**: `OSKGetAllResidentByPropertyIdRequest`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKResidentsDocumentResponse`
  - `count`: `number`
  - `residents`: `OSKOrganizationResidentResponseDocument[]`

#### `updateResident`
- **Request Type**: `OSKUpdateOrganizationResidentRequest`
  - `firstName`: `string`
  - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
  - `lastName`: `string`
  - `organizationId`: `string`
  - `residentId`: `string`
- **Response Type**: `void` (Implicit)

#### `createResidents`
- **Request Type**: No matching `model_property` facts found in this pack.
- **Response Type**: No matching `model_property` facts found in this pack.

#### `bulkCreateResidents`
- **Request Type**: No matching `model_property` facts found in this pack.
- **Response Type**: No matching `model_property` facts found in this pack.

### Firestore Triggers
No Firestore triggers are defined or owned by this capability pack. [Confirmed]

#### organization_user

### Callable Functions

#### deleteOrganizationUser
- **Request Type**: `OSKOrganizationUserDeleteRequest`
  - `organizationId`: `string`
  - `userId`: `string`
- **Response Type**: `void` (No response schema matched in this pack)

#### getAllOrganizationUsersAndInvitees
- **Request Type**: `OSKGetAllOrganizationUsersAndInviteesRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKGetAllOrganizationUsersAndInviteesResponseData`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `status`: `"active" | "invited"`
  - `userId`: `string`

#### updateOrganizationUser
- **Request Type**: `OSKOrganizationUserUpdateRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: `void` (No response schema matched in this pack)

#### updateOrganizationUserRoles
- **Request Type**: `OSKOrganizationUserUpdateRolesRequest`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: `void` (No response schema matched in this pack)

#### getOrganizationUserById
- **Request Type**: `OSKOrganizationUserByIdRequest` (No `model_property` facts matched within this pack)
- **Response Type**: `OSKOrganizationUser` (No `model_property` facts matched within this pack)

#### getOrganizationInviteeByEmail
- **Request Type**: `OSKOrganizationInviteeByEmailRequest` (No `model_property` facts matched within this pack)
- **Response Type**: `OSKOrganizationUserInvitation` (No `model_property` facts matched within this pack)

#### getOrganizationUserRoles
- **Request Type**: `OSKOrganizationUserRolesRequest` (No `model_property` facts matched within this pack)
- **Response Type**: `OSKOrganizationUserRolesResponse` (No `model_property` facts matched within this pack)

### Firestore Triggers
No Firestore triggers are defined within this capability's pack [Confirmed].

---

#### organization_user_access

No API contracts (`api_contract` facts) or Firestore triggers are owned or declared by this capability. [Confirmed]

---

#### organization_user_invitation

### Callable Functions
The following callable functions are registered by this capability:

#### `cancelUsersInvitation`
- **Request Schema**: `OSKOrganizationUserInvitationCancelRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.cancelUsersInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|cancelUsersInvitation|#1` ``. [Confirmed]

#### `createPMPUserWithInvitation`
- **Request Schema**: `OSKOrganizationCreatePMPUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `originalEmail`: `string | undefined` (optional)
  - `phoneNumber`: `OSKPhoneNumber` (imported from `core`)
  - `roles`: `string[]`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.createPMPUserWithInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|createPMPUserWithInvitation|#1` ``. [Confirmed]

#### `invitePMPUserWithInvitation`
- **Request Schema**: `OSKOrganizationPMPUserInvitationRequest`
  - `adminOrganizationId`: `string`
  - `adminOrganizationName`: `string`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `organizationName`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.invitePMPUserWithInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|invitePMPUserWithInvitation|#1` ``. [Confirmed]

#### `inviteUserWithInvitation`
- **Request Schema**: `OSKOrganizationUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.inviteUserWithInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|inviteUserWithInvitation|#1` ``. [Confirmed]

#### `processPMPInvitation`
- **Request Schema**: `OSKOrganizationProcessPMPInvitationRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.processPMPInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|processPMPInvitation|#1` ``. [Confirmed]

#### `queryPMPInvitations`
- **Request Schema**: No `model_property` facts matched within this pack to resolve a request schema.
- **Response**: `Promise<any[]>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.queryPMPInvitations` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|queryPMPInvitations|#1` ``. [Confirmed]

### Firestore Triggers
No Firestore triggers are declared or owned by this capability. [Confirmed]

### 9. Permissions & Security

**Cross-cutting risk callouts:**

#### Cross-Cutting Enforcement Tally & Security Risks
An active comparison of the permission extracts across all 14 capabilities reveals several critical security asymmetries, semantic mismatches, and implementation gaps:

1.  **Prompt Templates Lack RBAC Enforcement**: The `organization_prompt_templates` submodule represents a major security asymmetry. While other administrative submodules strictly enforce granular RBAC permissions, `organization_prompt_templates` **enforces no specific RBAC role checks** in its service or controller [Confirmed]. Any authenticated user passing basic `OSKUserSecurityChecks` can perform CRUD operations on prompt templates [Inferred].
2.  **Semantic Permission Overloading**: Both `organization_building_invitation` and `organization_onboarding_inhabitant` enforce the permission string `v1.org.buildings.create` ("Allows to create a new building") to authorize the management of inhabitant invitations and onboarding documents [Confirmed]. This is a significant semantic mismatch and over-privilege risk, as building-creation privileges are overloaded to manage resident-level onboarding [Inferred].
3.  **Write Permission Gaps**: The `organization_building` submodule explicitly checks `v1.org.buildings.view` and `v1.org.residents.view` for read operations at the service layer, but **lacks explicit service-level RBAC checks on write operations** (`save`, `update`, `delete`), relying entirely on Firestore security rules [Inferred].
4.  **Deletion Permission Mismatch**: The `deleteOrganizationUser` method in `organization_user` checks for the `v1.org.user.edit` permission [Confirmed]. However, the RBAC roles document defines a specific, more restrictive `v1.org.user.delete` permission ("Allows to delete an Oskey Property Management Portal user") which is bypassed here [Inferred].
5.  **Composite Roles Referenced as Permissions**: The `_module_root` service references `v1.admin.building.admin` and `v1.admin.org.admin` as raw permission strings in code [Confirmed]. However, these are defined as composite roles in the Firestore schema and settings documents, rather than raw permission strings in the RBAC roles document [Inferred].
6.  **Firestore Rules Gap**: The `firestore.rules.txt` file **lacks an explicit match rule** for the `/organizations/{organizationId}/promptTemplates` subcollection [Inferred]. This creates a potential security rule gap where access to prompt templates might be blocked or fall back to overly permissive organizational rules [Inferred].

#### Unattributed Security-Relevant Signals
- `organization_inhabitant` raises **1** `permission-denied` error when role checks fail, but the exact mapping of the response schema is unattributed in the API schemas [Inferred].
- `organization_pending` raises **1** `Unauthenticated` error explicitly in `approvePendingOrganizationRequest` when authentication is missing [Confirmed].

**Per-capability evidence:**

#### _module_root

The following permission strings are referenced and checked by this capability:
- `v1.admin.org.register` (Checked during organization creation) [Confirmed]
- `v1.admin.org.validate` (Checked during organization creation) [Confirmed]
- `v1.admin.org.edit` (Checked during organization update) [Confirmed]
- `v1.org.edit` (Checked during organization update) [Confirmed]
- `v1.admin.org.view` (Checked during retrieval of all organizations) [Confirmed]
- `v1.admin.org.admin` (Checked during retrieval of all organizations) [Confirmed]
- `v1.admin.building.register` (Referenced in service) [Confirmed]
- `v1.admin.org.delete` (Referenced in service) [Confirmed]
- `v1.admin.building.admin` (Referenced in service) [Confirmed]

### RBAC Cross-Check & Mismatches
- `v1.admin.building.admin` and `v1.admin.org.admin` are referenced as permission candidates in `organization.service.ts` (lines 110 and 105), but they are defined as **composite roles** in the Firestore schema and settings documents, rather than raw permission strings in the RBAC roles document. [Inferred]

#### organization_building

#### Permissions Referenced
The capability references and enforces the following permission strings:

- **`v1.org.buildings.view`**: Enforced when retrieving all organization buildings or a specific organization building by ID [Confirmed: `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.buildings.view|#1`].
  - *Cross-Check*: Matches `v1.org.buildings.view` in the RBAC roles document ("Allows to view the details of a building").
- **`v1.org.residents.view`**: Enforced when retrieving organization buildings for onboarding cards [Confirmed: `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.residents.view|#1`].
  - *Cross-Check*: Matches `v1.org.residents.view` in the RBAC roles document ("Allows to view the details of a resident").

#### Firestore Security Rules
The security rules defined in `firestore.rules.txt` govern access to the scoped collections:
- `/organizations/{organizationId}/buildings/{buildingId}` allows read/write access to any valid signed-in user [Confirmed: `firestore.rules.txt` (lines 539-542)].
- Sub-collections under `/organizations/{organizationId}/buildings/{buildingId}/units/{unitId}` enforce more granular checks, such as `canViewOrganizationBuilding` or `canEditOrganizationBuilding` [Confirmed: `firestore.rules.txt` (lines 558-575)].

---

#### organization_building_invitation

The capability enforces role-based access control (RBAC) checks using `OSKConsolidatedRolesController` `` `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 62, 197, 247, 328)``.

### Permission Mismatch / Over-Privilege Detection
The service checks for the permission string `v1.org.buildings.create` across all operations (create, cancel, query, and accept invitations) `` `functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts` (lines 60, 195, 245, 326)``. 

According to the `rbac-roles.json` reference document:
- `v1.org.buildings.create` is defined as: *"Allows to create a new building"*.

**Analysis**: Checking a "create building" permission to manage unit inhabitant invitations is a significant mismatch. The system defines more granular permissions such as `v1.org.residents.create` (*"Allows to create a new resident profile"*) and `v1.org.buildings.edit` (*"Allows to edit a building's information"*), which would be more appropriate for managing inhabitant invitations. This represents a potential over-privilege or misconfigured permission check in the implementation. [Confirmed]

#### organization_entity

### Enforced Permissions
The capability enforces the following permission strings during execution:

- **`v1.org.entity.create`**: Required to create a new entity or assign a sub-entity to a parent. [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.create|#1` ``, `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.create|#2` ``)
- **`v1.org.entity.delete`**: Required to delete an existing entity. [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.delete|#1` ``)
- **`v1.org.entity.edit`**: Required to update an entity's details. [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.edit|#1` ``)
- **`v1.org.entity.view`**: Required to view details of a specific entity. [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.view|#1` ``)

### RBAC Cross-Check
All referenced permission strings (`v1.org.entity.create`, `v1.org.entity.delete`, `v1.org.entity.edit`, `v1.org.entity.view`) perfectly match the definitions provided in the RBAC roles document. [Confirmed]

---

#### organization_inhabitant

- **`v1.org.view`**: Referenced to verify that the calling user has permission to view organization-level data [Confirmed] (cite `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|v1.org.view|#1` ``).
  - **Cross-check**: This matches the RBAC roles document, which defines `v1.org.view` as "Allows to view organization information" [Confirmed].
- **`permission-denied`**: Thrown if the user lacks the required role [Confirmed] (cite `` `permission_error|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|permission-denied|#1` ``).

#### organization_intercom_ communication

The capability enforces the following permission checks via `OSKConsolidatedRolesController.default.checkUserPermissions`:

- **`v1.org.communications.create`**: Required to create communications or reformulate them. [Confirmed, `permission_candidate|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|v1.org.communications.create|#1`]
- **`v1.org.communications.delete`**: Required to delete communications. [Confirmed, `permission_candidate|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|v1.org.communications.delete|#1`]
- **`v1.org.communications.list`**: Required to list communications by building, property, or entity. [Confirmed, `permission_candidate|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|v1.org.communications.list|#1`]
- **`v1.org.communications.view`**: Required to view a single communication by ID. [Confirmed, `permission_candidate|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|v1.org.communications.view|#1`]

#### RBAC Cross-Check
All referenced permission strings match the supplied RBAC roles document exactly:
- `v1.org.communications.create` -> "Allows to create a new communication"
- `v1.org.communications.delete` -> "Allows to delete a communication"
- `v1.org.communications.list` -> "Allows to view the list of communications"
- `v1.org.communications.view` -> "Allows to view the details of a communication"

---

#### organization_onboarding_inhabitant

### Permission Strings Referenced
The following permissions are checked during execution:

- **`v1.org.buildings.create`**: Checked across multiple onboarding management functions (`createOnboardingDocuments`, `findOnboardingDocument`, `updateOnboardingDocument`, `getAllOnboardingDocuments`, `verifyActivationCodeByOrganizationAdmin`) [Confirmed, `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|v1.org.buildings.create|#1` ``].
  - *RBAC Cross-Check Mismatch*: The RBAC roles document defines `v1.org.buildings.create` as "Allows to create a new building". However, this capability uses it to authorize the creation and management of *inhabitant onboarding documents*. This is a semantic mismatch where a building-creation permission is overloaded for resident onboarding administration.
- **`v1.org.residents.onboardingNotification`**: Used to filter organization users who should receive email notifications when a resident completes onboarding [Confirmed, `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|v1.org.residents.onboardingNotification|#1` ``].
  - *RBAC Cross-Check*: Matches the RBAC document definition ("Activates email notifications for new resident registrations").
- **`v1.org.residents.create`**: Checked when manually resending onboarding activation emails [Confirmed, `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_onboarding_mail.service.ts|v1.org.residents.create|#1` ``].
  - *RBAC Cross-Check*: Matches the RBAC document definition ("Allows to create a new resident profile").

#### organization_pending

### Enforced Permissions
The capability references and enforces the following permission strings:
- **`v1.admin.org.validate`**:
  - Enforced on administrative actions: retrieving all pending requests, retrieving a request by ID, rejecting a request, and approving a request [Confirmed: `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.admin.org.validate|#1` (and subsequent candidates)].
  - *Cross-Check*: Matches the RBAC roles document exactly ("v1.admin - Allows to validate a new organization").
- **`v1.org.user.create`**:
  - Referenced during the approval flow when creating/inviting the organization administrator [Confirmed: `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.org.user.create|#1`].
  - *Cross-Check*: Matches the RBAC roles document exactly ("Allows to add a new user to the Oskey Property Management Portal").
- **`v1.org`**:
  - Used as a prefix filter to extract organization-specific roles to assign to the newly approved organization's administrator [Confirmed: `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.org|#1`].

### Security Guardrails
- **App Check Verification**: All entry points enforce App Check verification in non-emulator environments [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`].
- **Authentication Checks**: All service methods verify that the calling user is authenticated before executing business logic [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService.logger.logError|approvePendingOrganizationRequest|'Unauthenticated: You must be authenticated to use acceptPendingOrganizationRequest()'|#1` (and similar checks in other service methods)].

---

#### organization_prompt_templates

### Security Checks
- **User Authentication**: All service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 26, 40, 61, 85, 110) ``. This ensures that the caller is a valid, authenticated user, but does not restrict the operation to a specific user ID matching the resource.
- **Parameter Validation**: Every service method invokes `OSKSecurityChecks.checkParameters` to validate the structure and types of incoming request payloads [Confirmed] `` `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 31, 45, 66, 90, 115) ``.

### Security & Rules Mismatches
- **Firestore Rules Gap**: The provided Firestore rules file (`firestore.rules.txt`) does not contain an explicit match rule for the `/organizations/{organizationId}/promptTemplates` subcollection [Inferred]. While `/organizations/{organizationId}` allows read/write access to any valid signed-in user, subcollections do not automatically inherit these permissions unless explicitly matched or recursively allowed. This represents a potential security rule gap where access to prompt templates might be blocked by default in the Firestore emulator or production environment.
- **Lack of RBAC Enforcement**: Although the system defines granular RBAC permissions (such as `v1.org.settings.edit` or `v1.org.settings.view` in `rbac-roles.json`), no specific RBAC role checks are explicitly enforced in the service methods or controller for this capability [Confirmed]. The endpoints are accessible to any authenticated user who passes the basic `OSKUserSecurityChecks` [Inferred].

---

#### organization_property

### Enforced Permission Strings
The following permission strings are checked within `OSKPropertyService` using `OSKConsolidatedRolesController`:

*   `v1.org.property.view`: Required to view properties and retrieve dashboard statistics [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 87, 422)].
    *   *RBAC Match*: Yes, matches "Allows to view the details of a property".
*   `v1.org.property.create`: Required to create a new property [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 133, 319)].
    *   *RBAC Match*: Yes, matches "Allows to create a new property".
*   `v1.org.property.edit`: Required to update properties, assign properties to entities, and manage property images [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 200, 273, 387)].
    *   *RBAC Match*: Yes, matches "Allows to edit a property's information".
*   `v1.org.entity.create`: Checked during property-to-entity reassignment [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 319)].
    *   *RBAC Match*: Yes, matches "Allows to create a new entity".

### Security Decorators & Parameter Checks
*   Uses the `OSKUserSecurityChecks({ checkUserIdMatch: false })` decorator on all service methods to enforce that the caller is a valid authenticated user [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 39, 68, 105, 177, 254, 295, 387, 422)].
*   Uses `OSKSecurityChecks.checkParameters` to validate the presence and types of request parameters [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 44, 73, 110, 182, 259, 300, 392, 427)].

---

#### organization_residents

### Permission Strings Referenced
The following permission strings are checked within the service layer using `OSKConsolidatedRolesController.default.checkUserPermissions` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 101, 143, 184, 572, 958, 1050, 1152):

- **`v1.org.residents.create`**: Checked during resident creation and bulk creation. Matches description: *"Allows to create a new resident profile"*. [Confirmed]
- **`v1.org.residents.delete`**: Checked during resident deletion. Matches description: *"Allows to delete a resident"*. [Confirmed]
- **`v1.org.residents.edit`**: Checked during resident updates. Matches description: *"Allows to edit a resident's profile"*. [Confirmed]
- **`v1.org.residents.list`**: Checked when listing residents. Matches description: *"Allows to view the list of residents"*. [Confirmed]
- **`v1.org.residents.view`**: Checked when retrieving resident details. Matches description: *"Allows to view the details of a resident"*. [Confirmed]

All referenced permission strings match the RBAC roles document exactly.

#### organization_user

### Referenced Permissions

The following permission strings are checked during service execution to enforce Role-Based Access Control (RBAC) [Confirmed]:

- `v1.org.user.view`: Checked when listing users, retrieving a user by ID, or fetching an invitee by email `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 294, 364, 407, 444).
  - *RBAC Match*: "Allows to view the details of an Oskey Property Management Portal user" (Matches).
- `v1.org.user.edit`: Checked when updating user roles, updating profiles, or deleting users `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 75, 238, 301).
  - *RBAC Match*: "Allows to edit a user's information on the Oskey Property Management Portal" (Matches).
- `v1.org.user.create`: Checked when listing users and invitees `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (line 298).
  - *RBAC Match*: "Allows to add a new user to the Oskey Property Management Portal" (Matches).
- `v1.org.admin`: Used to identify organization administrators `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts` (lines 55, 60).
  - *RBAC Match*: Not explicitly listed in the permissions table, but defined in the Architecture document as the mandatory top-level organization role.
- `v1.admin`: Used to identify global system administrators `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts` (line 60).
  - *RBAC Match*: Matches the global administrator role prefix.

---

#### organization_user_access

No specific permission strings are referenced or checked within the code evidence of this capability. [Unknown]

*Note: According to the system's Firestore rules, access to organization users and invitations is restricted to authenticated users, but these rules are enforced at the database boundary rather than within this capability's service code.*

---

#### organization_user_invitation

### Enforced Permissions
This capability references and enforces the following permission strings:

- **`v1.admin.org.validate`**:
  - Checked during invitation creation and processing to verify if the sender has administrative validation rights.
  - Evidenced by `permission_candidate` facts `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|v1.admin.org.validate|#1` ``. [Confirmed]
- **`v1.org.user.create`**:
  - Checked when creating or sending invitations to ensure the sender is authorized to add users to the organization.
  - Evidenced by `permission_candidate` facts `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|v1.org.user.create|#1` ``. [Confirmed]
- **`v1.org.user.delete`**:
  - Checked when canceling invitations to ensure the sender is authorized to delete or cancel user records.
  - Evidenced by `permission_candidate` facts `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|v1.org.user.delete|#1` ``. [Confirmed]

### Security Mechanisms
- **`OSKUserSecurityChecks`**: Decorator applied to service methods to enforce user authentication and context validation (e.g., `{ checkUserIdMatch: false }`) `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKUserSecurityChecks|cancelUsersInvitation|{ checkUserIdMatch: false }|#1` ``. [Confirmed]
- **`OSKSecurityChecks.checkParameters`**: Validates incoming request parameters for type correctness and presence `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKSecurityChecks.checkParameters|cancelUsersInvitation|...|#1` ``. [Confirmed]
- **`OSKConsolidatedRolesController.default.checkUserPermissions`**: Performs programmatic RBAC checks against the sender's consolidated roles `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|cancelUsersInvitation|...|#1` ``. [Confirmed]

### 10. Cross-Module Relationships

Based on the deterministic Cross-Module Dependency Graph and method-level call resolution, the `organization` module maintains the following confirmed relationships:

#### Outbound Dependencies (organization -> X)
-   **`access_control_device`**: Calls `OSKAccessControlDeviceConfigController.getMostRecent` and `OSKAccessControlDeviceConfigController.save` to manage and synchronize intercom configurations [Confirmed].
-   **`apps`**: Calls `OSKEmailService.send` to dispatch onboarding and invitation emails, and `OSKQRcodeService.generateQR` to generate resident onboarding QR codes [Confirmed].
-   **`building`**: Highly coupled. Calls:
    -   `OSKBuildingDoorController.getSafe`, `OSKBuildingDoorController.getAll`, and `OSKBuildingDoorController.get` to resolve physical door access [Confirmed].
    -   `OSKBuildingUnitController.get`, `OSKBuildingUnitController.getAll`, and `OSKBuildingUnitController.deleteCollection` to manage unit associations [Confirmed].
    -   `OSKBuildingUnitInhabitantService.addInhabitant` and `OSKBuildingUnitInhabitantService.removeInhabitant` to provision and deprovision physical access [Confirmed].
    -   `OSKBuildingUnitInvitationController` methods (`create`, `deleteInvitation`, `generateInvitationId`, `queryInvitations`) to manage resident invitations [Confirmed].
    -   `OSKBuildingController` methods (`get`, `getBuildingsQueryFilters`, `queryAllBuildings`, `update`) to manage building metadata [Confirmed].
    -   `OSKBuildingUnitNonAppUserController` and `OSKBuildingUnitNonAppUserService` methods to manage non-app resident credentials [Confirmed].
    -   `OSKBuildingAccessesController.deletePerUser` to revoke building-level access [Confirmed].
    -   `OSKBuildingIntercomService` methods to manage intercom directory entries [Confirmed].
-   **`core`**: Calls:
    -   `OSKDocumentController` CRUD and image upload/deletion methods to manage persistence and GCS storage [Confirmed].
    -   `OSKAccessUtilsService` and `OSKAccessService` to validate and create physical access rights [Confirmed].
    -   `OSKLoggingService` for system logging [Confirmed].
    -   `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash` to manage credential lifecycles [Confirmed].
    -   `OSKAuth0Service.emailExistsInAuth0` to validate user identities [Confirmed].
-   **`settings`**: Calls `OSKConsolidatedRolesController.checkUserPermissions` and `OSKConsolidatedRolesController.generateOrganizationUserRoles` to enforce and provision RBAC roles [Confirmed].
-   **`tasks`**: Calls `OSKTaskSchedulerService.scheduleTask` and `OSKTaskSchedulerService.cancelTask` to manage scheduled intercom communication states [Confirmed].
-   **`unit_management`**: Calls `OSKUnitManagementPendingInvitationsController.delete` to clean up pending unit invitations [Confirmed].
-   **`user`**: Calls:
    -   `OSKUserController` methods to resolve global user profiles [Confirmed].
    -   `OSKUserPincodeController` methods to manage user-scoped PIN credentials [Confirmed].
    -   `OSKUserNotificationService.create` to dispatch push notifications [Confirmed].
    -   `OSKUserAccessesController.deleteAllAccessesPerBuilding` to revoke user access [Confirmed].
    -   `OSKUserOrganizationController` and `OSKUserOrganizationInvitationPendingController` methods to synchronize user-to-organization mappings [Confirmed].

#### Inbound Dependencies (X -> organization)
-   **`access_control_device`**: Calls `OSKOrganizationController.get` to resolve organization metadata during public key registration [Confirmed].
-   **`admin`**: Calls organization, resident, property, and onboarding controllers to perform global maintenance, database migrations, and administrative overrides [Confirmed].
-   **`building`**: Calls `OSKOrganizationUserController.get` to validate building settings, and `OSKOrganizationResidentsController` to resolve intercom directory listings [Confirmed].
-   **`core`**: Calls `OSKOrganizationUserAccessService.setupOrganizationUserAccess` and `OSKOrganizationUserController.get` to bootstrap user access profiles [Confirmed].
-   **`supplier`**: Calls `OSKOrganizationUserController.get`, `OSKOrganizationController.get`, and `OSKEntityController.get` to validate supplier staff access permissions [Confirmed].
-   **`tasks`**: Calls `OSKIntercomCommunicationService.executeScheduledActivation` and `OSKIntercomCommunicationService.executeScheduledDeactivation` to execute scheduled intercom broadcasts [Confirmed].
-   **`user`**: Calls organization, resident, and onboarding controllers to process user invitations, accept organization memberships, and clean up resident profiles during account deletion [Confirmed].

### 11. External Hooks

#### _module_root

- **Google Cloud Storage**: Interacts with Cloud Storage buckets to upload and delete organization logo images. [Confirmed]
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/controllers/organization.controller.ts|OSKOrganizationController.default._uploadImage|uploadImage|bucket,imagePath,contentType,'organizationLogo'|#1` ``.
- **Firebase App Check**: Conditionally enforces App Check based on the presence of the `OSK_FIREBASE_EMULATOR` environment variable. [Confirmed]
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.

#### organization_building

No external hooks, Pub/Sub topics, external storage paths, or environment variables are directly evidenced within this capability's pack [Confirmed].

---

#### organization_building_invitation

No external hooks, Pub/Sub topics, or external storage integrations are directly evidenced within this capability's pack. [Confirmed]

#### organization_entity

No external hooks, Pub/Sub topics, or storage paths are directly referenced or managed by this capability. [Confirmed]

---

#### organization_inhabitant

- No external hooks (Pub/Sub topics, external HTTP paths, environment variables, storage paths) are evidenced within this capability's pack [Confirmed].

#### organization_intercom_ communication

#### Vertex AI / Gemini Integration
- **Generative Model**: Uses `@google-cloud/vertexai` to initialize `vertexAI.getGenerativeModel` with model `gemini-2.5-flash` (or `gemini-3.5-flash` as configured) to perform batch translations and reformulations. [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 61, 1575, 1637)]

#### Cloud Tasks Integration
- **Task Scheduling**: Schedules tasks of type `activateIntercomCommunicationTask` and `deactivateIntercomCommunicationTask` via `OSKTaskSchedulerService`. [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1160, 1196, 1240, 1323)]

---

#### organization_onboarding_inhabitant

This capability integrates with or exposes the following external boundaries:

- **App Store Testing Integration**: Integrates with App Store testing configurations via `OSKAppStoreSettingsService` to allow automated or manual testing bypasses using predefined activation codes [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKAppStoreSettingsService.validateInternally|handleAppStoreTesterOnboarding|activationCode|#1` ``].
- **Email Delivery**: Integrates with the external mail delivery system via `OSKEmailService` to dispatch `onboardingActivationCode` and `userOnboardedNotification` templates [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts|OSKEmailService.default.send|sendOnboardingActivationCodeEmail|...|#1` ``].
- **QR Code Generation**: Integrates with `OSKQRcodeService` to generate QR codes containing activation links [Confirmed, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKQRcodeService.generateQR|createOnboardingDocuments|generatedCodes.activationCode|#1` ``].
- **SMS OTP Delivery (Candidate)**: Contains commented-out code referencing `sendVerificationSms` in `resetSmsCode`, indicating a planned or partially implemented integration with an SMS gateway [Inferred, `` `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|findingOnboardingCards.forEach|resetSmsCode|...|#1` `` (lines 1388-1405)].

#### organization_pending

- **App Check**: Integrates with Firebase App Check to secure callable functions [Confirmed: `call_expression|organization|functions/src/modules/organization/modules/organization_pending/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`].
- No other external integrations (e.g., Pub/Sub, Storage, external HTTP APIs) are directly evidenced within this capability's pack.

---

#### organization_prompt_templates

No external hooks, Pub/Sub topics, external HTTP paths, environment variables, or storage paths are evidenced within this capability's pack [Confirmed].

---

#### organization_property

### Delegated File Uploads
This capability implements the delegated file upload pattern for property images:
*   `uploadImage` and `deletePropertyImage` delegate the actual file byte transfers to Google Cloud Storage (GCS) [Confirmed, `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 42-45, 64-66)].
*   The controller calls `_uploadImage` and `_deleteImage` (inherited from `OSKDocumentController`), which generate signed URLs or directly manipulate GCS buckets using the `'propertyImage'` bucket configuration [Confirmed, `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 43, 65)].

---

#### organization_residents

### Asynchronous IoT Integrations
- **`OSKAccessMessagePublisherService.publishMessageToAllACDs`**: This service is called during resident deletion (both App and Non-App users) to publish access deletion messages asynchronously to physical hardware (ACDs) via Pub/Sub, decoupling the business logic from hardware availability `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 252, 309). [Confirmed]

### Environment Variables
- **`process.env.OSK_FIREBASE_EMULATOR`**: Used to conditionally enforce App Check on callable function triggers `functions/src/modules/organization/modules/organization_residents/index.ts` (line 22). [Confirmed]
- **`process.env.MAX_BATCH_SIZE`**: Used to parse the maximum batch size allowed for bulk resident creation `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (line 1137). [Confirmed]

#### organization_user

No external hooks (such as Pub/Sub topics, external HTTP integrations, environment variables, or storage paths) are evidenced within this capability's pack [Confirmed].

---

#### organization_user_access

No external hooks, Pub/Sub topics, environment variables, or external storage paths are evidenced within this capability's pack. [Confirmed]

---

#### organization_user_invitation

### Integrations
- **Auth0**:
  - Integrates with Auth0 via `OSKAuth0Service.emailExistsInAuth0` to check if an invited email address is already registered in the external identity provider `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKAuth0Service.emailExistsInAuth0|createPMPUserWithInvitation|email|#1` ``. [Confirmed]
- **Email Dispatch**:
  - Integrates with `OSKEmailService` to send transactional invitation emails using the template `pmpUserInvitation` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKEmailService.default.send|createPMPUserWithInvitation|...|#1` ``. [Confirmed]

### Environment Variables
- **`process.env.OSK_FIREBASE_EMULATOR`**: Used to conditionally bypass App Check enforcement during local development/emulation `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``. [Confirmed]
- **`process.env.PMP_PORTAL_URL`**: Used to construct the portal URL injected into the invitation email template `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKEmailService.default.send|createPMPUserWithInvitation|...|#1` ``. [Confirmed]

### 12. Architectural Observations

-   **Centralized Identity Resolution**: The module acts as the administrative gatekeeper of the platform. The extreme centralization of calls around `OSKOrganizationUserController` demonstrates that user identity and role resolution are strictly decoupled from the physical hardware and building layers, enforcing a clean separation of concerns [Inferred].
-   **Event-Driven Cascading Side Effects**: The module relies heavily on cascading side effects rather than isolated CRUD. For example, deleting a resident profile (`organization_residents`) triggers a complex orchestration of calls to delete unit inhabitants, revoke GCS-stored onboarding cards, delete user-level and building-level PIN codes, and publish asynchronous deprovisioning messages to physical ACDs [Confirmed].
-   **Asynchronous State Projection**: The module does not communicate directly with edge hardware. Instead, it modifies administrative state in Firestore (e.g., `intercomBuildingState` or `pincodes`) and relies on downstream projection databases (MongoDB) and Pub/Sub to synchronize state to physical devices asynchronously [Inferred].

### 13. Risks & Open Questions

**Cross-cutting risks:**

-   **Risk: Prompt Templates Security Vulnerability**: The complete lack of RBAC checks in `organization_prompt_templates` allows any authenticated user to modify prompt templates, which could lead to unauthorized prompt injection or system behavior modification [Inferred].
-   **Risk: Missing Firestore Rules for Prompt Templates**: The absence of an explicit match rule for `/organizations/{organizationId}/promptTemplates` in `firestore.rules.txt` represents a potential security gap or deployment blocker [Inferred].
-   **Risk: Semantic Permission Overloading**: Using `v1.org.buildings.create` (create building) to authorize resident onboarding and invitation management violates the Principle of Least Privilege and introduces over-privilege risks [Inferred].
-   **Risk: Write Permission Enforcement Gap**: The lack of explicit service-level RBAC checks on write operations in `organization_building` introduces a risk of unauthorized modifications if Firestore rules are misconfigured [Inferred].
-   **Risk: Out-of-Sync Global User Mappings**: The lack of Firestore triggers on `/organizations/{organizationId}/users` means that direct database deletions or modifications will leave the global user-to-organization mappings in `/users/{userId}/organizations/{organizationId}` out of sync [Inferred].
-   **Open Question: SMS OTP Bypass**: The SMS verification logic in `organization_onboarding_inhabitant` contains a TODO ("Waiting for API Key"). Is SMS OTP verification currently bypassed or disabled in production, or is it delegated entirely to Auth0? [Inferred]
-   **Open Question: Building Counter Synchronization**: The `OSKOrganizationBuilding` model contains fields like `numberOfDevices`, `numberOfResidents`, and `numberOfUnits`. There is no evidence showing how these counters are updated or synchronized when resources are modified [Inferred].

**Per-capability open questions:**

#### _module_root

- Why is `v1.admin.building.admin` referenced as a permission candidate in `organization.service.ts` when it is defined as a composite role in the Firestore schema rather than a raw permission string in the RBAC roles document?
- What is the exact trigger mechanism for `onDocumentCreated` in `OSKOrganizationService`? There is no `firestore_trigger` fact in this pack, suggesting it might be called programmatically or registered elsewhere.

#### organization_building

- **Write Permission Enforcement**: While read operations explicitly check `v1.org.buildings.view` and `v1.org.residents.view` at the service layer, it is unclear from the evidence pack whether write operations (`save`, `update`, `delete`) on the `OSKOrganizationBuildingController` enforce specific RBAC permissions at the service level, or if they rely solely on Firestore security rules.
- **Data Synchronization**: The `OSKOrganizationBuilding` model contains fields like `numberOfDevices`, `numberOfResidents`, and `numberOfUnits` [Confirmed: `model_property|organization|functions/src/modules/organization/modules/organization_building/models/documents/organization_building_document_model.ts|OSKOrganizationBuilding|numberOfDevices|#1`]. There is no evidence in this pack showing how these counters are updated or synchronized when devices, residents, or units are added/removed.

#### organization_building_invitation

- **Permission Check Intent**: Why is `v1.org.buildings.create` (create building) used to authorize inhabitant invitation operations instead of a resident-specific permission like `v1.org.residents.create`? Is this a legacy implementation detail or a security oversight?
- **Notification Dispatching**: Does `OSKBuildingUnitInvitationController.default.create` trigger any asynchronous email or SMS notifications to the invitee? The evidence pack shows the invitation document being created, but does not show any direct notification dispatching logic within this submodule.
- **App Check Enforcement**: The callable functions are configured with `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR` `` `functions/src/modules/organization/modules/organization_building_invitation/index.ts` (line 41) ``. How does the system handle non-app users who might need to interact with invitations if App Check is strictly enforced on these endpoints?

#### organization_entity

- **Missing Permission Check on `getAllEntities`**: Why does the `getAllEntities` service method lack an explicit permission candidate check in the evidence pack, whereas other methods like `getEntityById` explicitly enforce `v1.org.entity.view`? [Inferred]
- **Shared Controller Usage for Properties**: In `deleteEntity`, `OSKEntityController.default.update` is called with `propertiesId` and `{ entityId: '' }`. Is `OSKEntityController` being used to update documents in a properties collection, or is there a shared controller/collection structure? [Inferred]
- **Purpose of `entityP` on Organization**: The `assignSubEntityToParent` method updates the organization document via `OSKOrganizationController.default.update(oldOrganizationId, { entityP: newParentEntityId })`. What is the purpose of the `entityP` field on the organization document, and why is it updated with a parent entity ID? [Inferred]

#### organization_inhabitant

- **Response Schema for `getInhabitantDetailsById`**: The exact response schema for `getInhabitantDetailsById` is not explicitly defined in the resolved API schemas section, though it is inferred to return mapped inhabitant details [Inferred].
- **Write Operations**: Are there any write operations (e.g., creating or updating inhabitants) managed by this submodule, or is it strictly a read/query capability? The evidence only shows query and map operations [Inferred].

#### organization_intercom_ communication

- **Firestore Schema Mapping**: The exact structure of the dynamically generated Firestore collection paths for `intercomBuildingState` and its archive is not explicitly defined in the provided Firestore schema document, though constructed programmatically in the controllers. [Inferred]
- **Translation Engine Fallback**: Whether the translation engine fallback to Google Translate v2 is actually implemented or if it strictly uses Gemini (since the model property `translationEngine` allows `"google-translate-v2" | "gemini-2.5-flash"`, but only Gemini calls are evidenced in this pack). [Inferred]

#### organization_onboarding_inhabitant

- **Permission Overloading**: Why is `v1.org.buildings.create` (defined as "Allows to create a new building") used to authorize inhabitant onboarding document management instead of a resident-specific permission like `v1.org.residents.create` or `v1.org.residents.edit`?
- **SMS OTP Status**: The SMS verification logic in `resetSmsCode` is commented out with a TODO note "Waiting for API Key". Is SMS OTP verification currently bypassed or disabled in production, or is it handled by an external identity provider (e.g., Auth0) instead of this backend service?
- **Cascading Deletions**: When an onboarding document is deleted upon successful verification, are there any background cleanup tasks or Firestore triggers that handle cascading updates, or is the deletion entirely synchronous within the `verifyActivationCode` execution?

#### organization_pending

| Question | Impact |
| :--- | :--- |
| The `'organizationsPending'` collection is utilized by the controller but is missing from the `firestore-schema.md` document. Is this collection omitted from the schema generator, or is it dynamically created? | Minor documentation discrepancy; does not affect runtime execution. |
| Are there any automated email or SMS notifications dispatched to the user when their organization request is approved or rejected? | The current submodule does not show direct notification dispatch logic, suggesting it might be handled asynchronously or in another submodule. |

#### organization_prompt_templates

- **RBAC Role Enforcement**: Are there plans to restrict prompt template management to specific administrative roles (e.g., `v1.org.settings.edit` or `v1.org.settings.create`)? Currently, any authenticated user can invoke these endpoints as long as they provide a valid organization ID.
- **Firestore Rules Definition**: Is the `/organizations/{organizationId}/promptTemplates` subcollection intended to be governed by a nested rule in `firestore.rules.txt` that is currently missing, or is it intentionally left to fall back to a broader organizational rule?
- **Prompt Template Usage**: What downstream capabilities or modules consume these prompt templates once they are saved? The current evidence pack only covers the CRUD lifecycle of the templates.

#### organization_property

*   *GCS Bucket Configuration*: The exact resolution mechanism for the GCS bucket name used for `'propertyImage'` is handled by the base `OSKDocumentController` and is not explicitly defined within this capability's pack.
*   *Entity Creation Permission in Property Assignment*: It is unclear why `v1.org.entity.create` is checked during `assigningPropertyToEntity` [Confirmed, `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (line 319)] since the method only reassigns an existing property between existing entities rather than creating a new entity.

#### organization_residents

- Are there any other triggers or side effects of resident creation/deletion that are handled in other modules (such as Auth0 user deletion or creation)? [Unknown]
- What is the exact Pub/Sub topic used by `OSKAccessMessagePublisherService.publishMessageToAllACDs`? [Unknown]
- How is the `MAX_BATCH_SIZE` environment variable configured in production, and what is its default value if undefined? [Unknown]

#### organization_user

- **Permission Mismatch in Deletion**: The `deleteOrganizationUser` service method checks for the `v1.org.user.edit` permission `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (line 238). However, the RBAC roles document defines a specific `v1.org.user.delete` permission ("Allows to delete an Oskey Property Management Portal user"). It is unclear why the deletion flow does not enforce the more specific deletion permission.
- **Lack of Firestore Triggers**: There are no Firestore triggers defined in this submodule. If an organization user document is deleted or modified directly in Firestore (bypassing the Cloud Functions), the user's global mapping in `/users/{userId}/organizations/{organizationId}` will become out of sync. It is unclear if this synchronization is handled elsewhere or represents a potential consistency risk.

#### organization_user_access

- **Data Persistence**: What specific Firestore collections (e.g., `/organizations/{id}/users` or `/users/{id}/accesses`) are modified or queried during the execution of `setupOrganizationUserAccess`? The current evidence pack lacks direct query or write facts. [Unknown]
- **Invocation Context**: Which controller, trigger, or external service invokes `OSKOrganizationUserAccessService.setupOrganizationUserAccess`? [Unknown]
- **User Submodule Dependency**: What specific symbols or classes are imported from `@oskey/user/access` and how are they utilized within the access setup flow? [Unknown]

#### organization_user_invitation

- **Auth0 User Provisioning**: It is unclear from the evidence whether this capability automatically provisions a placeholder user in Auth0 if the email does not exist, or if it relies entirely on the user registering manually via the link sent in the email. [Inferred]
- **`queryPMPInvitations` Schema**: No `model_property` facts matched within this pack to resolve the request/response schemas for `queryPMPInvitations`. [Unknown]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.