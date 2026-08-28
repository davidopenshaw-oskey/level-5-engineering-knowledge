### 0. Generation Metadata

- **runId**: `20260803_143350-1aa319b1`
- **generatedAt**: `2026-08-11T17:28:03.486Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `organization`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `organization` module serves as the foundational administrative, corporate, and security sandbox layer of the Oskey platform `[Confirmed]`. It manages the multi-tenant hierarchical lifecycle of organizations, entities (Syndics/regional co-ownerships), properties, and buildings, while orchestrating administrative user provisioning, resident onboarding, and intercom communication dispatch `[Confirmed]`. By acting as the master system of record for administrative boundaries, it guarantees strict data isolation between sibling entities and manages the transition of inhabitants from administrative placeholders to active, cryptographically verified mobile app users `[Confirmed]`.

### 2. Architectural Position

The `organization` module sits at the absolute apex of the Oskey platform's logical hierarchy `[Confirmed]`. It owns the top-level concepts of Organizations, Entities, Properties, and Organization-scoped Users and Residents `[Confirmed]`. It provides the administrative sandbox boundaries that prevent data, audit logs, and hardware configurations from leaking between sibling tenants `[Confirmed]`. 

Architecturally, it acts as a high-level orchestrator that coordinates with the `building`, `user`, `settings`, and `apps` modules `[Confirmed]`. It does not directly manage physical hardware or low-level door relays; instead, it provisions the logical structures (such as buildings, units, and inhabitants) and delegates physical access execution, credential generation, and hardware synchronization to the `building` and `access_control_device` modules `[Confirmed]`.

### 3. Primary Responsibilities

#### _module_root

- **Organization Creation**: Provisions new organizations by validating administrative permissions, generating unique document IDs, persisting organization metadata, and automatically saving a default base entity associated with the organization (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|createAnOrganization|#1`, `call_expression|organization|functions/src/modules/organization/services/organization.service.ts|OSKEntityController.default.save|createAnOrganization|entityP,baseEntity|#1`). [Confirmed]
- **Organization Updates**: Modifies existing organization metadata (such as name, tax number, country code, and address) after verifying that the requesting user holds the necessary administrative or organizational edit permissions (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|updateAnOrganization|#1`). [Confirmed]
- **Organization Retrieval**: Allows authorized administrators to retrieve a list of all organizations or fetch a specific organization by its unique identifier or name (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|getAllOrganizations|#1`, `call_expression|organization|functions/src/modules/organization/controllers/organization.controller.ts|OSKOrganizationController.default._query|getOrganizationByName|OSKOrganizationController.collection,queryFilter|#1`). [Confirmed]
- **Logo Asset Management**: Handles uploading and deleting organization logo images within Google Cloud Storage, updating the corresponding Firestore document reference accordingly (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|uploadimage|#1`, `service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|deleteOrganizationLogo|#1`). [Confirmed]
- **Submodule Trigger Aggregation**: Collects and exports callable Cloud Function triggers from all nested submodules (such as `organization_building`, `organization_user`, `organization_property`, etc.) to expose them under a unified interface (`functions/src/modules/organization/index.ts` (lines 89-109)). [Confirmed]

#### organization_building

- **Managing Organization-to-Building Associations**: Persists and maintains documents under the `/organizations/{organizationId}/buildings` path via standard document controller operations (`save`, `update`, `delete`) `` `functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts` (lines 16-48) ``.
- **Retrieving Organization Buildings**: Queries all buildings associated with a specific organization, resolving and merging master building data with organization-scoped metadata `` `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getAllOrganizationBuildings|#1` ``.
- **Retrieving Building Structures for Onboarding**: Fetches units and doors of buildings under a specific property to populate onboarding cards, sorting units by floor and unit number `` `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getAllOrganizationBuildingsForOnboardingCards|#1` ``.
- **Retrieving Single Organization Building**: Retrieves a single organization-building association by its ID `` `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getOrganizationBuildingById|#1` ``.

---

#### organization_building_invitation

- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationCreateRequest`
  - `adminsOrganizationId`: `string`
  - `buildingId`: `string`
  - `buildingUnitInhabitantType`: `OSKBuildingUnitInhabitantType` (imported from `building_unit` submodule)
  - `doorIds` (optional): `string[]`
  - `email` (optional): `string`
  - `firstName`: `string`
  - `internationalPhoneNumber`: `string`
  - `inviterId`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `postalAddress` (optional): `OSKStreetAddress` (imported from `core` module)
  - `unitId`: `string`
  - `userId` (optional): `string`

#### organization_entity

The `organization_entity` capability is responsible for the following distinct features:

- **Entity CRUD Management**: Provides standard administrative operations to create, read, update, and delete entities within the Firestore database [Confirmed].
  - *Creation*: Generates a unique document ID and saves a new entity document, optionally linking it to a parent entity [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|createEntity|#1` ``).
  - *Retrieval*: Fetches a single entity by ID or lists all entities belonging to an organization [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getEntityById|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getAllEntities|#1` ``).
  - *Modification*: Updates entity details such as name or type [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|updateEntity|#1` ``).
  - *Deletion*: Removes an entity, cleans up its association from any assigned properties, and removes it from its parent entity's sub-entity list [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|deleteEntity|#1` ``).
- **Sub-Entity Hierarchical Assignment**: Supports assigning a sub-entity to a parent entity, updating parent-child relationships, and re-associating the sub-entity with a new organization if necessary [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|assignSubEntityToParent|#1` ``).
- **Dashboard Statistics Aggregation**: Aggregates operational metrics for an entity's dashboard, including counts of properties, buildings, active devices, administrators, and resident onboarding states [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getEntityDashboardStatics|#1` ``).
- **Entity Building Queries**: Retrieves all buildings associated with a specific entity by applying query filters [Confirmed] (`` `service_method|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityService|getBuildingsByEntityId|#1` ``).
- **Security & Parameter Validation**: Enforces parameter type safety and checks user permissions before executing any service logic [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` (lines 89-110) ``).

---

#### organization_inhabitant

- **Retrieve All Organization Inhabitants**: Queries and lists all inhabitants across all buildings belonging to a specific organization [Confirmed] (`service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantsForOrganization|#1`).
- **Retrieve Detailed Inhabitant Information**: Fetches a single inhabitant's detailed profile by their user ID and organization ID [Confirmed] (`service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantDetailsByUserId|#1`).
- **Map and Enrich Inhabitant Data**: Aggregates and maps raw inhabitant records with associated user profiles, active pincodes, building names, and unit names [Confirmed] (`service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|mapInhabitantData|#1`).
- **Enforce Organization-Level Access Control**: Validates that the requesting administrative user has the appropriate permissions (`v1.org.view`) to access organization inhabitant data [Confirmed] (`call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|getAllOrganizationInhabitants|organizationUser.roles,rolesToCheck|#1`).

---

#### organization_intercom_ communication

### Create Intercom Communication
- Orchestrates the creation of a communication message targeting specific buildings and doors [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|createIntercomCommunication|#1`].
- Translates the communication title and description into supported languages using Gemini/Vertex AI [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1464-1528)].
- Schedules activation and deactivation tasks via Cloud Tasks [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1160-1240)].
- Updates the physical device configurations immediately if the communication is set to activate instantly [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1346-1359)].

### Delete Intercom Communication
- Removes a communication from the active state document or the archive sub-collection [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|deleteIntercomCommunication|#1`].
- Cancels any scheduled activation or deactivation Cloud Tasks associated with the deleted communication [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1712-1714)].
- Updates the physical device configurations to remove the message from the home screen [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1719-1741)].

### Retrieve Communications
- Retrieves active, scheduled, or archived communications filtered by building, property, or entity [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationService|#1`, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationsByPropertyId|#1`, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationsByEntityId|#1`].

### AI-Powered Reformulation
- Uses Gemini to reformulate communication titles and descriptions to improve clarity or tone [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|reformulateCommunicationWithGemini|#1`].

### State Management (Hot/Cold Storage)
- Manages active and scheduled messages in a "hot" state document (`default` document in the resolved state collection path) [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 150, 339)].
- Evicts older expired messages to a "cold" archive sub-collection once limits are exceeded (e.g., maximum of 5 expired messages in hot storage) [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 257-292)].

### Resident Notification
- Batches and dispatches push notifications to onboarded app-user residents of a building when a communication is activated [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 454-540)].

#### organization_onboarding_inhabitant

*   **Onboarding Document Creation**: Generates onboarding documents (onboarding cards) for inhabitants, including generating unique 8-character activation codes, SMS OTPs, and QR codes, and calculating expiration dates. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|createOnboardingDocuments|#1` ``
*   **Activation Code Verification (User)**: Allows an inhabitant to verify their activation code, matching their email/phone with the onboarding card, and triggers the onboarding orchestration flow. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|verifyActivationCode|#1` ``
*   **Activation Code Verification (Admin)**: Allows an organization admin to verify an activation code on behalf of an inhabitant, matching the invitee user and triggering the onboarding orchestration flow. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|verifyActivationCodeByOrganizationAdmin|#1` ``
*   **Inhabitant Onboarding Orchestration**: Coordinates the final onboarding steps: creating building accesses, adding the inhabitant to the building unit, updating the resident document status to `isOnboarded: true` with the assigned PIN codes and user ID, and sending notification emails to property managers. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|onboardInhabitant|#1` ``
*   **Onboarding Document Management**: Supports querying, retrieving, and updating onboarding documents within an organization. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|findOnboardingDocument|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|getAllOnboardingDocuments|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|updateOnboardingDocument|#1` ``
*   **Activation Email Dispatch**: Sends onboarding activation code emails to residents. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts|OSKOrganizationOnboardingMailService|sendOnboardingActivationCodeEmail|#1` ``
*   **App Store Tester Onboarding**: Special handling for App Store testers using predefined activation codes to bypass standard onboarding checks and assign them to a test building/unit. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|handleAppStoreTesterOnboarding|#1` ``
*   **SMS Code Reset**: Resets the SMS OTP code for an onboarding card. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|resetSmsCode|#1` ``

#### organization_pending

- **Pending Organization Creation**: Allows authenticated users to submit a request to register a new organization, which is stored with a status of `'pending'` (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|createPendingOrganization|#1` ``.
- **Request Retrieval**: 
  - Allows users to retrieve their own pending organization requests (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|getCurrentUserPendingOrganizations|#1` ``.
  - Allows platform administrators to retrieve all pending organization requests (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|getAllPendingOrganizations|#1` `` or fetch a specific request by its ID (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|getPendingOrganizationById|#1` ``.
- **Request Rejection**: Allows platform administrators to reject a pending organization request, updating its status to `'rejected'` (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|rejectPendingOrganizationRequest|#1` ``.
- **Request Approval & Provisioning**: Allows platform administrators to approve a pending organization request (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|approvePendingOrganizationRequest|#1` ``. This workflow:
  - Updates the request status to `'approved'` (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingController.default.update|approvePendingOrganizationRequest|requestData.pendingOrganizationId,{             status: 'approved',         }|#1` ``.
  - Provisions a new organization document in the system (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationService.createAnOrganization|approvePendingOrganizationRequest|organizationDocument,context|#1` ``.
  - Automatically invites the requesting user to the newly created organization as an administrator, granting them all roles starting with `'v1.org'` (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationUserInvitationService.inviteUserWithInvitation|approvePendingOrganizationRequest|userInvitation,context,adminsOrganizationId|#1` ``.

#### organization_prompt_templates

This capability is responsible for the following distinct features:
- **Prompt Template Creation**: Allows authorized users to create new prompt templates for an organization, recording creation and modification timestamps [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|create|#1`].
- **Prompt Template Retrieval**: Supports fetching a single prompt template by name or listing all prompt templates registered under a specific organization [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|get|#1`, `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|getAll|#1`].
- **Prompt Template Updates**: Allows updating the template text of an existing prompt, updating the modification timestamp [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|update|#1`].
- **Prompt Template Deletion**: Supports deleting a prompt template from an organization's collection [Confirmed: `service_method|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService|delete|#1`].
- **Input Parameter Validation**: Enforces strict parameter validation on all incoming requests (e.g., verifying that `organizationId`, `promptName`, and `promptTemplate` are provided with correct types) [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 66-74, 90-95, 115-119)].

---

#### organization_property

The capability has the following distinct responsibilities:

### Property Lifecycle Management (CRUD)
- **Create Property**: Provisions a new property document in Firestore, generates a unique property ID, associates it with a parent Entity, and updates any pre-assigned buildings with the new property ID reference. [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|createProperty|#1` ``, `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 105-175) ``
- **Read Property**: Retrieves a single property by ID or lists all properties filtered by `organizationId` and `entityId`. [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|getPropertyById|#1` ``, `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|getAllProperties|#1` ``
- **Update Property**: Modifies property metadata (such as name, address, property type, or management type) and validates associated building structures. [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|updateProperty|#1` ``
- **Delete Property**: Removes the property document from Firestore and disassociates any linked buildings by clearing their `propertyId` field. [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|deleteProperty|#1` ``, `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 254-294) ``

### Entity Assignment
- **Assign Property to Entity**: Re-associates a property with a different parent Entity. This operation executes a transactional update that removes the property ID from the old Entity's `propertiesIds` array, appends it to the new Entity's `propertiesIds` array, and updates the `entityId` field on the property document itself. [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|assigningPropertyToEntity|#1` ``, `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 295-361) ``

### Property Image Management
- **Upload Image**: Generates a delegated upload path and updates the property document's `propertyImage` field with the uploaded filename. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 42-44) ``, `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 363-386) ``
- **Delete Image**: Deletes the physical image file from Cloud Storage and removes the `propertyImage` field reference from the property document using `FieldValue.delete`. [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|deletePropertyImage|#1` ``, `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 387-421) ``

### Dashboard Statistics Aggregation
- **Get Property Dashboard Statistics**: Compiles a real-time administrative overview of a property, aggregating the total number of buildings, total organization admins, total physical access control devices across all doors, and a breakdown of onboarded vs. non-onboarded residents. [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|getPropertyDashboardStatics|#1` ``, `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 422-521) ``

#### organization_residents

The `organization_residents` capability is responsible for the following distinct features:

- **App User Resident Onboarding**: Generates onboarding cards, activation codes, and QR codes for residents who will use the mobile app. It creates documents in `/organizations/{id}/onboardingInhabitants` and `/organizations/{id}/residents` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 604-802) ``. [Confirmed]
- **Non-App User Resident Provisioning**: Directly provisions physical access and pincodes for residents who do not use the app, writing to `/buildings/{id}/units/{id}/nonAppUsers` and `/buildings/{id}/pincodes` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 804-936) ``. [Confirmed]
- **Cascading Deletion**: When a resident is deleted, it cleans up associated building accesses, unit inhabitants, intercom entries, pincodes, invited Non-App Users, invited Permanent Guests, and pending unit invitations `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 224-276, 278-328, 334-399, 401-445, 447-485, 487-498) ``. [Confirmed]
- **Bulk Creation**: Supports batch processing of resident creation requests up to a maximum batch size `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 1113-1232) ``. [Confirmed]
- **Resident Retrieval**: Retrieves all residents for an organization or filtered by property ID, returning formatted response documents `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 77-119, 1070-1093) ``. [Confirmed]
- **Resident Updates**: Updates resident details (first name, last name, inhabitant type) and synchronizes these changes to the underlying building unit inhabitants and onboarding documents `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 938-1026) ``. [Confirmed]

---

#### organization_user

### Managing Organization User Roles
The capability allows authorized administrators to update the roles assigned to a specific organization user. It utilizes a consolidated roles controller to generate and validate the user's permissions and updates the corresponding user-organization mapping. **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUserRoles|#1`.

### Updating Organization User Profiles
Administrators can update an organization user's profile details, including their first name, last name, email, and roles. This operation synchronizes the updated roles with the user's global organization mapping. **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUser|#1`.

### Deleting Organization Users
The capability supports removing a user from an organization. This operation deletes the user's record from the organization's scoped user collection and removes the corresponding organization reference from the user's global profile. **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|deleteOrganizationUser|#1`.

### Querying and Listing Organization Users and Invitees
The capability provides interfaces to retrieve all active organization users and pending invitees for a given organization, as well as fetching specific users by ID or email. **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getAllOrganizationUsersAndInvitees|#1`.

---

#### organization_user_access

The capability is centered around the `OSKOrganizationUserAccessService` class `` `source_class|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKOrganizationUserAccessService` `` and provides the following specific responsibilities:

- **Setting Up Organization User Access**: Orchestrates the setup process for organization user access via the `setupOrganizationUserAccess` method `` `service_method|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKOrganizationUserAccessService|setupOrganizationUserAccess|#1` ``. [Confirmed]
- **Access ID Generation**: Generates unique access identifiers by calling `OSKAccessUtilsService.generateAccessId` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKAccessUtilsService.generateAccessId|setupOrganizationUserAccess||#1` ``. [Confirmed]
- **Inviter Name Resolution**: Retrieves the display name of the user who initiated or authorized the access invitation using `OSKAccessUtilsService.getAccessInviterName` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|OSKAccessUtilsService.getAccessInviterName|setupOrganizationUserAccess|inviterId|#1` ``. [Confirmed]
- **Timestamping**: Records the current system time for the access setup transaction using `Timestamp.now` `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|Timestamp.now|setupOrganizationUserAccess||#1` ``. [Confirmed]

---

#### organization_user_invitation

### Inviting Users to an Organization
- **Standard User Invitation**: Handles inviting a standard user to an organization by validating parameters, checking permissions, and saving the invitation document [Confirmed]. This is managed by `inviteUserWithInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 117-256).
- **PMP User Invitation**: Handles inviting a Property Management Portal (PMP) user to an organization [Confirmed]. This is managed by `invitePMPUserWithInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 258-394).
- **Creating PMP User with Invitation**: Creates or updates a PMP user invitation, checks if the email already exists in Auth0, and triggers an invitation email if the user does not exist [Confirmed]. This is managed by `createPMPUserWithInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 396-570).

### Processing Invitations
- **Process PMP Invitation**: Processes a pending PMP invitation when a user accepts it [Confirmed]. It fetches the invitation and organization details, generates the consolidated organization user roles, saves the user-organization mapping, and deletes the pending invitation [Confirmed]. This is managed by `processPMPInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 620-737).

### Cancelling Invitations
- **Cancel User Invitation**: Cancels a pending invitation, moving it to a cancelled collection, deleting the pending record, and logging the cancellation [Confirmed]. This is managed by `cancelUsersInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 47-115).

### Querying Invitations
- **Query PMP Invitations**: Queries pending invitations for a user based on their email or phone number [Confirmed]. This is managed by `queryPMPInvitations` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 572-618).

### 4. Public Interfaces

#### _module_root

- **Callable Cloud Functions Entry Point** (`functions/src/modules/organization/index.ts`): Exposes the primary callable triggers `createAnOrganization`, `updateAnOrganization`, `getAllOrganizations`, and `deleteOrganizationLogo` to clients (`functions/src/modules/organization/index.ts` (lines 89-109)).
- **OSKOrganizationController** (`functions/src/modules/organization/controllers/organization.controller.ts`): Extends the core `OSKDocumentController` to provide low-level database operations (get, getAll, save, update, uploadImage, deleteImage) specifically mapped to the `organizations` collection.
- **OSKOrganizationService** (`functions/src/modules/organization/services/organization.service.ts`): The primary service class orchestrating business logic, permission checks, and transactional flows for organization operations.
- **OSKOrganizationUserUtils** (`functions/src/modules/organization/utils/get_organization_user.util.ts`): A utility class providing helper methods to retrieve and validate organization user details.

#### organization_building

- **OSKOrganizationBuildingController**: Extends `OSKDocumentController` to expose standard CRUD endpoints for organization-building documents `` `source_class|organization|functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts|OSKOrganizationBuildingController` ``.
- **Callable Cloud Functions**: Exposes three public entry points for client applications `` `function_declaration|organization|functions/src/modules/organization/modules/organization_building/index.ts|getCallableFunctionTriggers|#1` ``:
  - `getAllOrganizationBuildings`
  - `getAllOrganizationBuildingsForOnboardingCards`
  - `getOrganizationBuildingById`

---

#### organization_building_invitation

- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationQueryRequest`
  - `adminsOrganizationId`: `string`
  - `collectionName`: `"invitationsSent" | "invitationsRejected"`
  - `queryField`: `"buildingId" | "unitId" | "invitationId" | "buildingUnitInhabitantType"`
  - `queryValue`: `string | { type: string; isResident?: boolean; }`

---

#### organization_entity

This capability exposes its functionality through the following public entry points:

- **Callable Cloud Functions**: Exposed via `getCallableFunctionTriggers` in the submodule index [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 27-39) ``).
- **OSKEntityController**: A document controller extending `OSKDocumentController` that directly interfaces with the Firestore `/entities` collection [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts` (lines 10-39) ``).
- **OSKEntityService**: The core service class containing the business logic for entity operations, decorated with `OSKUserSecurityChecks` [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` (lines 27-382) ``).

---

#### organization_inhabitant

- **`OSKOrganizationInhabitantController`**: Extends `OSKDocumentController` to provide collection-group querying capabilities for inhabitant documents [Confirmed] (`source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts|OSKOrganizationInhabitantController`).
- **`OSKOrganizationInhabitantService`**: The primary service class containing the business logic for retrieving, mapping, and authorizing access to inhabitant records [Confirmed] (`source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService`).
- **Callable Cloud Functions**: Exposes entry points for client applications to invoke administrative queries [Confirmed] (`function_declaration|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getOrganizationInhabitantCallableFunctionTriggers|#1`):
  - `getAllOrganizationInhabitants`
  - `getInhabitantDetailsById`

---

#### organization_intercom_ communication

### Controllers
- **`OSKIntercomBuildingStateController`**: Manages the retrieval, saving, and updating of the "hot" state documents containing active and scheduled communications [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/controllers/organization_intercom_building_state.controller.ts`].
- **`OSKIntercomCommunicationArchiveController`**: Manages the retrieval and storage of archived (evicted) communications [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/controllers/organization_intercom_communication_archive.controller.ts`].

### Entry Points (Callable Cloud Functions)
- **`createIntercomCommunication`**: Creates and schedules a new communication [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|createIntercomCommunication|#1`].
- **`deleteIntercomCommunication`**: Deletes an existing communication [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|deleteIntercomCommunication|#1`].
- **`getAllIntercomCommunicationService`**: Retrieves all active and scheduled communications for a building [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationService|#1`].
- **`getArchivedIntercomCommunications`**: Retrieves archived communications for a building [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getArchivedIntercomCommunications|#1`].
- **`getIntercomCommunicationById`**: Retrieves a specific communication by ID [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getIntercomCommunicationById|#1`].
- **`getAllIntercomCommunicationsByPropertyId`**: Retrieves communications across all buildings in a property [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationsByPropertyId|#1`].
- **`getAllIntercomCommunicationsByEntityId`**: Retrieves communications across all properties and buildings in an entity [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationsByEntityId|#1`].
- **`reformulateCommunicationWithGemini`**: Reformulates communication content using AI [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|reformulateCommunicationWithGemini|#1`].

#### organization_onboarding_inhabitant

*   **OSKOrganizationOnboardingInhabitantController** (extends `OSKDocumentController`): Manages Firestore operations for onboarding documents under `/organizations/{organizationId}/onboardingInhabitants`. [Confirmed] `` `source_class|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts|OSKOrganizationOnboardingInhabitantController` ``
*   **Callable Cloud Functions** (exported in `index.ts`):
    *   `createOnboardingDocuments` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|createOnboardingDocuments|#1` ``
    *   `findOnboardingDocument` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|findOnboardingDocument|#1` ``
    *   `getAllOnboardingDocuments` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|getAllOnboardingDocuments|#1` ``
    *   `getOnboardingDocumentById` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|getOnboardingDocumentById|#1` ``
    *   `sendOnboardingActivationCodeEmailCallable` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|sendOnboardingActivationCodeEmailCallable|#1` ``
    *   `updateOnboardingDocument` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|updateOnboardingDocument|#1` ``
    *   `verifyActivationCode` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|verifyActivationCode|#1` ``
    *   `verifyActivationCodeByOrganizationAdmin` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|verifyActivationCodeByOrganizationAdmin|#1` ``

#### organization_pending

- **OSKOrganizationPendingController** (Confirmed) `` `source_class|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController` ``: Extends `OSKDocumentController` to manage direct Firestore operations on the `organizationsPending` collection. It exposes methods such as `generateDocId`, `getAll`, `getAllByUserId`, `getById`, `save`, and `update` (Confirmed) `` `functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts` (lines 14-49) ``.
- **OSKOrganizationPendingService** (Confirmed) `` `source_class|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService` ``: The primary service class containing the business logic for validating, creating, retrieving, approving, and rejecting pending organization requests.

#### organization_prompt_templates

This capability exposes its functionality through the following public entry points:
- **`OSKOrganizationPromptTemplateController`**: A document controller class extending `OSKDocumentController` that abstracts direct Firestore operations for the prompt templates collection [Confirmed: `source_class|organization|functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts|OSKOrganizationPromptTemplateController`].
- **`OSKOrganizationPromptTemplateService`**: The core service class containing the business logic and security decorators for managing prompt templates [Confirmed: `source_class|organization|functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts|OSKOrganizationPromptTemplateService`].
- **`getCallableFunctionTriggers`**: The entry point function that registers the HTTPS callable Cloud Functions for external client consumption [Confirmed: `function_declaration|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|getCallableFunctionTriggers|#1`].

---

#### organization_property

The capability exposes the following public entry points and controllers:

### Controllers
- **`OSKPropertyController`** (extends `OSKDocumentController`): Manages direct Firestore document interactions for the `/properties` collection, including low-level CRUD, array manipulation (`removeBuildingFromProperty`), and Cloud Storage image delegation. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 9-66) ``

### Services & Entry Points
- **`OSKPropertyService`**: The core orchestrator containing business logic, parameter validation, RBAC checks, and multi-document coordination for all property-related operations. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 35-521) ``
- **`getCallableFunctionTriggers`**: The module entry point that registers and exports the HTTPS callable Cloud Functions to the Firebase runtime. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/index.ts` (lines 46-58) ``

#### organization_residents

This capability exposes the following public entry points:

- **OSKOrganizationResidentsController**: Extends `OSKDocumentController` to provide standard document operations for organization residents `` `functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts` (lines 17-71) ``. [Confirmed]
- **OSKOrganizationResidentsService**: The primary service class coordinating business logic for resident management `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 74-1232) ``. [Confirmed]
- **Callable Cloud Functions**: Exposes the following callable entry points in `` `functions/src/modules/organization/modules/organization_residents/index.ts` (lines 21-32) ``:
  - `bulkCreateResidents`
  - `createResidents`
  - `deleteResident`
  - `getAllResidents`
  - `getallResidentsByPropertyIdCallable`
  - `getResidentDetails`
  - `updateResident`

---

#### organization_user

### Controllers

#### `OSKOrganizationUserController`
Exposes low-level document operations for managing organization users in Firestore. It extends `OSKDocumentController` and provides methods for querying, saving, updating, and deleting organization user documents. **Confirmed** `source_class|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController`.
- **File**: `functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts` (lines 11-71)
- **Exposed Methods**:
  - `getAll(organizationId)`: Queries all users under `/organizations/{organizationId}/users`. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getAll|#1`.
  - `get(organizationId, userId)`: Fetches a specific user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|get|#1`.
  - `getSafe(organizationId, userId)`: Safely fetches a user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getSafe|#1`.
  - `save(organizationId, email, data)`: Saves a user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|save|#1`.
  - `update(organizationId, userId, data)`: Updates a user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|update|#1`.
  - `delete(organizationId, email)`: Deletes a user document. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|delete|#1`.
  - `getOrganizationUserAdmins(organizationId, queryFilters)`: Filters users with the `v1.org.admin` role. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getOrganizationUserAdmins|#1`.
  - `getOrganizationAdmins(organizationId)`: Filters users with `v1.org.admin` or `v1.admin` roles. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getOrganizationAdmins|#1`.
  - `getByEmail(organizationId, email)`: Fetches a user document by email. **Confirmed** `controller_method|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController|getByEmail|#1`.

### Services

#### `OSKOrganizationUserService`
Orchestrates business logic, permission validation, and cross-module synchronization for organization users. **Confirmed** `source_class|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService`.
- **File**: `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` (lines 38-459)
- **Exposed Methods**:
  - `updateOrganizationUserRoles`: Updates roles and synchronizes them to the user's global organization mapping. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|updateOrganizationUserRoles|#1`.
  - `updateOrganizationUser`: Updates user profile details and roles. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|updateOrganizationUser|#1`.
  - `deleteOrganizationUser`: Deletes the user from the organization and removes the organization reference from the user's profile. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|deleteOrganizationUser|#1`.
  - `getAllOrganizationUsersAndInvitees`: Retrieves a combined list of active organization users and pending invitees. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getAllOrganizationUsersAndInvitees|#1`.
  - `getAllOrganizationUser`: Helper method to fetch and format active organization users. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getAllOrganizationUser|#1`.
  - `getOrganizationUserById`: Retrieves a specific organization user by ID. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getOrganizationUserById|#1`.
  - `getOrganizationInviteeByEmail`: Retrieves a pending invitee by email. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getOrganizationInviteeByEmail|#1`.
  - `getOrganizationUserRoles`: Retrieves the roles assigned to a specific organization user. **Confirmed** `service_method|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationUserService|getOrganizationUserRoles|#1`.

### Entry Points

The capability exposes several HTTPS Callable Cloud Functions as entry points:
- `updateOrganizationUserRoles` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUserRoles|#1`
- `updateOrganizationUser` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|updateOrganizationUser|#1`
- `deleteOrganizationUser` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|deleteOrganizationUser|#1`
- `getAllOrganizationUsersAndInvitees` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getAllOrganizationUsersAndInvitees|#1`
- `getOrganizationUserById` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getOrganizationUserById|#1`
- `getOrganizationInviteeByEmail` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getOrganizationInviteeByEmail|#1`
- `getOrganizationUserRoles` **Confirmed** `api_contract|organization|functions/src/modules/organization/modules/organization_user/index.ts|getOrganizationUserRoles|#1`

---

#### organization_user_access

This capability exposes its service layer as its primary entry point:

- **OSKOrganizationUserAccessService**: Exported from the submodule's entry file `` `exported_symbol|organization|functions/src/modules/organization/modules/organization_user_access/index.ts|./services/organization_user_access.service|#1` `` to allow other submodules or modules to invoke organization user access setup workflows. [Confirmed]

---

#### organization_user_invitation

This capability exposes the following controllers and services as public entry points:

### Controllers
- **`OSKOrganizationPMPUserInvitationController`** (extends `OSKDocumentController`): Exposes methods to query collection groups for PMP user invitations [Confirmed].
  - *File*: `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_pmp_user_invitation.controller.ts` (lines 10-24)
- **`OSKOrganizationUserInvitationPendingController`** (extends `OSKDocumentController`): Exposes methods to save pending user invitations [Confirmed].
  - *File*: `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation_pending.controller.ts` (lines 11-23)
- **`OSKOrganizationUserInvitationController`** (extends `OSKDocumentController`): Exposes methods to save, delete, update, and move user invitations [Confirmed].
  - *File*: `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts` (lines 15-106)

### Services
- **`OSKOrganizationUserInvitationService`**: The core service orchestrating the business logic for invitations [Confirmed].
  - *File*: `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 44-737)

### 5. Internal Structure

The `organization` module exhibits a highly centralized internal topology where `organization_user` and `organization_residents` act as the primary internal dependency hubs `[Confirmed]`.

- **Master Entry Point**: The `_module_root` submodule acts as the primary gateway, importing and exposing callable Cloud Functions from 12 distinct submodules `[Confirmed]`.
- **Administrative User Hub**: The `organization_user` submodule is imported and called by 11 sibling submodules (`organization_building`, `organization_building_invitation`, `organization_entity`, `organization_inhabitant`, `organization_intercom_ communication`, `organization_onboarding_inhabitant`, `organization_pending`, `organization_property`, `organization_residents`, `organization_user_invitation`, and `_module_root`) to resolve administrative user profiles, validate roles, and map users to organizations `[Confirmed]`.
- **Resident Lifecycle Coordination**: The `organization_residents` submodule maintains bidirectional coupling with `organization_onboarding_inhabitant` to manage onboarding links, bulk resident creation, and cascading deletions across buildings, units, accesses, pincodes, and intercom directories `[Confirmed]`.
- **Hierarchical Asset Mapping**: The `organization_property` and `organization_entity` submodules are tightly coupled; `organization_property` calls `organization_entity` to update property-to-entity assignments, while `organization_entity` calls `organization_property` to clear entity IDs on property documents when an entity is deleted `[Confirmed]`.
- **Communication Orchestration**: The `organization_intercom_ communication` submodule depends on `organization_prompt_templates` to retrieve AI prompt templates, `organization_property` to resolve properties, and `organization_residents` to manage resident documents `[Confirmed]`.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

The `organization` module acts as the authoritative system of record for the platform's administrative hierarchy `[Inferred]`. Based on deterministic call-edge signals, the module maintains primary ownership over the following collections:

- **`/organizations`**: Authoritatively owned by `_module_root` via `OSKOrganizationController` `[Inferred]`.
- **`/entities`**: Authoritatively owned by `organization_entity` via `OSKEntityController` `[Inferred]`.
- **`/properties`**: Authoritatively owned by `organization_property` via `OSKPropertyController` `[Inferred]`.
- **`/organizations/{id}/users`**: Authoritatively owned by `organization_user` via `OSKOrganizationUserController` `[Inferred]`.
- **`/organizations/{id}/residents`**: Authoritatively owned by `organization_residents` via `OSKOrganizationResidentsController` `[Inferred]`.

While external modules (such as `building`, `user`, `supplier`, and `admin`) frequently read and write to these collections to resolve permissions, link physical hardware, or map user profiles, they do so by calling the controllers and services defined within the `organization` module rather than executing direct, un-orchestrated database writes `[Inferred]`. This preserves the integrity of the administrative sandbox boundaries `[Inferred]`.

**Per-capability evidence:**

#### _module_root

- **Collection**: `/organizations`
  - **Description**: Authoritative collection containing organization profiles, metadata, and configuration settings.
  - **Operations**: Read, Write, Update, Delete (`functions/src/modules/organization/controllers/organization.controller.ts` (lines 20-67)). [Confirmed]
- **Collection**: `/entities`
  - **Description**: Touched during organization creation to provision a default base entity.
  - **Operations**: Write (`call_expression|organization|functions/src/modules/organization/services/organization.service.ts|OSKEntityController.default.save|createAnOrganization|entityP,baseEntity|#1`). [Confirmed]

#### organization_building

- **Firestore Path**: `/organizations/{organizationId}/buildings/{buildingId}`
  - **Operations**: Create/Write (`_set`), Update (`_update`), Read (`_get`, `_query`), Delete (`_delete`) `` `functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts` (lines 16-48) ``.
  - **Confidence**: Confirmed.
  - **Operation Detection Scope**: Controller-level document operations.

---

#### organization_building_invitation

This capability does not directly own or write to its own dedicated Firestore collections. Instead, it acts as an orchestrator that delegates data persistence and modification to other modules:

- **Delegated Writes**:
  - Writes and deletes building unit invitations via `OSKBuildingUnitInvitationController` (owned by the `building` module). (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKBuildingUnitInvitationController.default.create|createBuildingInhabitantInvitation|request.buildingId,request.unitId,invitationId,invitation|#1` ``
  - Adds inhabitants to building units via `OSKBuildingUnitInhabitantService` (owned by the `building` module). (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|OSKBuildingUnitInhabitantService.addInhabitant|acceptBuildingInhabitantInvitation|buildingUnitInhabitant|#1` ``

---

#### organization_entity

### Firestore Collections & Paths
This capability reads and writes to the following Firestore paths:

- **`/entities/{entityId}`** [Confirmed]
  - *Operations*: Read, Write, Delete [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts` (lines 13-39) ``).
  - *Detection Scope*: Scoped to `OSKEntityController` which manages the `/entities` collection [Confirmed].
- **`/organizations/{organizationId}`** [Confirmed]
  - *Operations*: Update (specifically updating the `entityP` field during sub-entity parent re-assignment) [Confirmed] (`` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKOrganizationController.default.update|assignSubEntityToParent|oldOrganizationId,{             entityP: newParentEntityId,         }|#1` ``).
- **`/properties/{propertyId}`** [Confirmed]
  - *Operations*: Update (clearing the `entityId` field on properties when an entity is deleted) [Confirmed] (`` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKEntityController.default.update|deleteEntity|propertiesId,{ entityId: '' }|#1` ``).
- **`/organizations/{organizationId}/users/{userId}`** [Confirmed]
  - *Operations*: Read (fetching organization user roles for permission validation) [Confirmed] (`` `call_expression|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|OSKOrganizationUserController.default.get|getEntityById|organizationId,userId!|#1` ``).

---

#### organization_inhabitant

#### Firestore Paths
This capability performs read-only queries against the following Firestore collection group [Confirmed]:
- **Collection Group**: `inhabitants` (resolves to `/buildings/{id}/units/{id}/inhabitants` in the global schema) [Confirmed] (`call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts|OSKOrganizationInhabitantController.default._queryCollectionGroup|queryInhabitants|collectionName,queryFilters|#1`).

*Note: No write operations (create, update, delete) are evidenced within this capability's pack.*

---

#### organization_intercom_ communication

### Firestore Paths Touched
- **`/accessControlDevices/{id}/configs`**: Updated indirectly via `OSKAccessControlDeviceConfigController` to save the communication message on the device's home screen configuration [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1440-1461)].
- **State Collection Paths**: Resolved dynamically via `OSKIntercomBuildingStateController.getStateCollectionPath(organizationId, buildingId, type)` (where `type` is `'intercom'` or `'push'`). These documents store the active/scheduled messages array [Confirmed, `firestore_path_touched|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|default|#1`].
- **Archive Collection Paths**: Resolved dynamically via `OSKIntercomCommunicationArchiveController.getCollectionPath(organizationId, buildingId, type)`. These documents store evicted expired messages [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1768-1800)].

#### organization_onboarding_inhabitant

This capability owns and performs write operations on the following Firestore collection paths:
*   `/organizations/{organizationId}/onboardingInhabitants/{onboardingId}`: Read, Write, Delete. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts` (lines 18-78) ``

This capability reads or updates data in the following external Firestore collection paths:
*   `/organizations/{organizationId}/residents/{residentId}`: Read, Write. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1144-1150) ``, `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts` (lines 75-80) ``
*   `/users/{userId}`: Read. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 730-732) ``
*   `/buildings/{buildingId}/doors/{doorId}`: Read. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1093-1095) ``
*   `/buildings/{buildingId}/units/{unitId}`: Read. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 787-789) ``
*   `/users/{userId}/pincodes/{pincodeId}`: Read. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1133-1135) ``

#### organization_pending

- **Firestore Collection**: `/organizationsPending` (Inferred) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController.default._generateDocId|generateDocId|'organizationsPending'|#1` ``.
  - This capability owns the documents representing pending organization requests, which contain details such as the requesting user's ID, organization name, tax number, street address, and approval status (Confirmed) `` `type_alias|organization|functions/src/modules/organization/modules/organization_pending/models/documents/organization_pending_document.model.ts|OSKOrganizationPending|#1` ``.

#### organization_prompt_templates

### Firestore Paths
This capability owns and manages documents within the following Firestore path:
- `/organizations/{organizationId}/promptTemplates/{promptName}` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/controllers/oraganization_prompt_templates.controller.ts` (lines 15-17)]

### Schema Fields
Based on the Firestore schema documentation and model definitions, the documents in this collection contain:
- `organizationId`: `string` [Confirmed: `model_property|organization|functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts|OSKOrganizationPromptTemplate|organizationId|#1`]
- `promptName`: `string` [Confirmed: `model_property|organization|functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts|OSKOrganizationPromptTemplate|promptName|#1`]
- `promptTemplate`: `string` [Confirmed: `model_property|organization|functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts|OSKOrganizationPromptTemplate|promptTemplate|#1`]
- `creationDate`: `timestamp` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 77-78)]
- `modificationDate`: `timestamp` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (line 99)]

---

#### organization_property

### Firestore Collections
This capability owns and is the primary writer for the following Firestore collection:

- **`/properties`** (represented by `OSKPropertyController.collection`):
  - **Fields**: `organizationId` (string), `entityId` (string), `propertyId` (string), `propertyName` (string), `streetAddress` (object), `managementType` (string), `propertyType` (string), `propertyImage` (string/optional), `buildings` (array), `creationDate` (timestamp), `modificationDate` (timestamp). [Confirmed] `` `functions/src/modules/organization/modules/organization_property/models/documents/property_document.ts` (lines 38-47) ``
  - **Operations**: Read, Write, Delete. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 21-63) ``

### Shared Data Modifications
This capability performs writes/updates on collections owned by other capabilities:
- **`/buildings/{id}`**: Updates the `propertyId` field when creating, updating, or deleting a property. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 171, 289) ``
- **`/entities/{id}`**: Updates the `propertiesIds` array (using `FieldValue.arrayUnion` and `FieldValue.arrayRemove`) when creating or re-assigning properties. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 166, 350, 354) ``

#### organization_residents

This capability directly reads, writes, or deletes data in the following Firestore paths:

- `/organizations/{organizationId}/residents/{residentId}` [Confirmed]
  - *Operation Scope*: Read, Write, Delete via `OSKOrganizationResidentsController` `` `functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts` ``.
- `/organizations/{organizationId}/onboardingInhabitants/{onboardingId}` [Confirmed]
  - *Operation Scope*: Read, Write, Delete via `OSKOrganizationOnboardingInhabitantController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/inhabitants/{userId}` [Confirmed]
  - *Operation Scope*: Read, Write, Delete via `OSKBuildingUnitInhabitantController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}` [Confirmed]
  - *Operation Scope*: Write, Delete via `OSKBuildingUnitNonAppUserController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/accesses/{accessId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKNonAppUserAccessController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes/{pincodeId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKNonAppUserPincodeController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/units/{unitId}/permanentGuests/{guestUserId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKBuildingUnitPermanentGuestController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/buildings/{buildingId}/pincodes/{pincodeId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKPincodeService` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/users/{userId}/pincodes/{pincodeId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKUserPincodeController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.
- `/users/{userId}/accesses/{accessId}` [Confirmed]
  - *Operation Scope*: Delete via `OSKUserAccessesController` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` ``.

---

#### organization_user

### Firestore Paths

#### `/organizations/{organizationId}/users/{userId}`
- **Operations**: Read, Write (Set, Update, Delete)
- **Description**: Stores the organization-scoped user document containing profile details and assigned roles.
- **Confidence**: **Confirmed**
- **Citations**:
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController.default._query|getAll|`/organizations/${organizationId}/users`|#1`
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController.default._set|save|`/organizations/${organizationId}/users`,email,data|#1`
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController.default._update|update|`/organizations/${organizationId}/users`,userId,data|#1`
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|OSKOrganizationUserController.default._delete|delete|`/organizations/${organizationId}/users`,email|#1`

#### `/organizations/{organizationId}`
- **Operations**: Read
- **Description**: Read to retrieve organization details, specifically the valid `userRoles` configured for the organization.
- **Confidence**: **Confirmed**
- **Citations**:
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKOrganizationController.default.get|updateOrganizationUser|request.organizationId|#1`

#### `/users/{userId}`
- **Operations**: Read
- **Description**: Read to retrieve the user's global profile details (e.g., first name, last name).
- **Confidence**: **Confirmed**
- **Citations**:
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKUserController.default.get|updateOrganizationUser|requestUserId|#1`

#### `/users/{userId}/organizations/{organizationId}`
- **Operations**: Write (Update, Delete)
- **Description**: Updates or deletes the user's global mapping to the organization and their assigned roles.
- **Confidence**: **Confirmed**
- **Citations**:
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKUserOrganizationController.default.update|updateOrganizationUser|request.userId,request.organizationId,{                 userRoles: assignedRoles.map((r) => r.roleId),             }|#1`
  - `call_expression|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|OSKUserOrganizationController.default.delete|deleteOrganizationUser|userId,organizationId|#1`

---

#### organization_user_access

- **Firestore Paths**: No direct Firestore read or write operations are explicitly evidenced in this capability's pack. However, the service imports `firebase-admin/firestore` `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|firebase-admin/firestore|#1` `` and utilizes Firestore `Timestamp` objects `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_access/services/organization_user_access.service.ts|Timestamp.now|setupOrganizationUserAccess||#1` ``. It is inferred that actual database persistence is delegated to the imported core and user access services. [Inferred]

---

#### organization_user_invitation

This capability reads and writes to the following Firestore paths [Confirmed]:

| Firestore Path | Operations | Scope / Context |
| :--- | :--- | :--- |
| `/organizations/${organizationId}/userInvitations` | Read, Write, Delete | Standard user invitations [Confirmed] |
| `/organizations/${organizationId}/userInvitationsCancelled` | Write | Cancelled user invitations [Confirmed] |
| `/organizations/${organizationId}/userInvitationsRejected` | Write | Rejected user invitations [Confirmed] |
| `/users/${userId}/organizationInvitations/` | Read, Write | Pending user invitations mapped to a user [Confirmed] |

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable APIs
The following callable APIs are exposed by this capability:

- **createAnOrganization** (`api_contract|organization|functions/src/modules/organization/index.ts|createAnOrganization|#1`)
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
- **getAllOrganizations** (`api_contract|organization|functions/src/modules/organization/index.ts|getAllOrganizations|#1`)
  - **Request Schema**: `OSKGetAllOrganizationsRequestDocument`
    - `adminsOrganizationId`: `string`
- **updateAnOrganization** (`api_contract|organization|functions/src/modules/organization/index.ts|updateAnOrganization|#1`)
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
- **deleteOrganizationLogo** (`api_contract|organization|functions/src/modules/organization/index.ts|deleteOrganizationLogo|#1`)
  - *Note*: No matching `model_property` facts were resolved within this pack to construct a detailed schema for `deleteOrganizationLogoRequest`.

### Firestore Triggers
- **onDocumentCreated** (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|onDocumentCreated|#1`): A service method exists to handle document creation events, but it is not registered as an active Firestore trigger in the module's entry point (`functions/src/modules/organization/index.ts`). [Inferred]

#### organization_building

No Firestore triggers are owned by this capability. The following are the resolved API contracts for the callable functions:

#### `getAllOrganizationBuildings`
- **Request Type**: `OSKGetAllOrganizationBuildingsRequestData`
- **Request Schema**:
  - `organizationId`: `string`

#### `getAllOrganizationBuildingsForOnboardingCards`
- **Request Type**: `OSKGetAllOrganizationBuildingsByPropertyRequestData`
- **Request Schema**:
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKBuildingForOnboardingCards`
- **Response Schema**:
  - `doors`: `OSKBuildingForOnboardinCardDoor[]`
  - `units`: `OSKBuildingForOnboardingCardUnit[]`

#### `getOrganizationBuildingById`
- **Request Type**: `OSKGetORganizationBuildingByIdRequestData`
- **Request Schema**:
  - `buildingId`: `string`
  - `organizationId`: `string`

---

#### organization_building_invitation

### API Contracts
The following callable API contracts are exposed by this capability:

#### organization_entity

### Callable Cloud Functions
The following HTTPS callable functions are exposed by this capability [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 30-37) ``):

#### `assignSubEntityToParent`
- **Request Type**: `OSKAssignSubEntityToParentRequestData`
  - `newOrganizationId`: `string`
  - `newParentEntityId`: `string`
  - `oldOrganizationId`: `string`
  - `oldParentEntityId`: `string`
  - `subEntityId`: `string`
- **Response Type**: `void` (Implicit)

#### `createEntity`
- **Request Type**: `OSKSubEntityRequestData`
  - `entityName`: `string`
  - `entityType`: `OSKEntityType`
  - `organizationAdminId`: `string`
  - `organizationId`: `string`
  - `parentEntityId`: `string`
  - `propertiesIds`: `string[]`
- **Response Type**: `void` (Implicit)

#### `deleteEntity`
- **Request Type**: `OSKDeleteEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `void` (Implicit)

#### `getAllEntities`
- **Request Type**: `OSKGetAllEntityRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKEntity[]` (Implicit)

#### `getBuildingsByEntityId`
- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKBuilding[]` (Implicit)

#### `getEntityById`
- **Request Type**: `OSKGetEntityByIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKEntity` (Implicit)

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
- **Response Type**: `void` (Implicit)

### Firestore Triggers
- No Firestore triggers are owned or declared by this capability [Confirmed].

---

#### organization_inhabitant

#### Callable Functions
- **`getAllOrganizationInhabitants`** [Confirmed] (`api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getAllOrganizationInhabitants|#1`)
  - **Request Type**: `OSKPmpResidentsRequestData`
    - `organizationId`: `string`
  - **Response Type**: `OSKPmpResidentsDocumentResponse`
    - `count`: `number`
    - `inhabitants`: `OSKPmpResidentsDocument[]`

- **`getInhabitantDetailsById`** [Confirmed] (`api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getInhabitantDetailsById|#1`)
  - **Request Type**: `OSKPmpResidentsDetailsRequestData`
    - `organizationId`: `string`
    - `userId`: `string`
  - **Response Type**: No matching `model_property` facts or resolved response schema provided in the evidence pack.

---

#### organization_intercom_ communication

### API Contracts

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
    - `reason`: `string | undefined`

#### `deleteIntercomCommunication`
- **Request Type**: `OSKDeleteIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `void` (Implicit)

#### `getAllIntercomCommunicationService`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`
  - `activationTaskId`: `string | undefined`
  - `buildingId`: `string`
  - `buildingName`: `string`
  - `communicationId`: `string`
  - `createdByUserId`: `string | undefined`
  - `creationDate`: `Timestamp`
  - `deactivationTaskId`: `string | undefined`
  - `doorInfos`: `OSKDoorInfo[]`
  - `homeInfos`: `OSKLocalizedInfoBlock[]`
  - `modificationDate`: `Timestamp`
  - `organizationId`: `string`
  - `priority`: `OSKCommunicationPriority`
  - `schedule`: `OSKCommunicationSchedule`
  - `status`: `OSKIntercomCommunicationStatus`
  - `translationEngine`: `'google-translate-v2' | 'gemini-2.5-flash'`
  - `type`: `'intercom' | 'push' | undefined`

#### `getAllIntercomCommunicationsByEntityId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByEntityIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage` (Array)

#### `getAllIntercomCommunicationsByPropertyId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByPropertyIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage` (Array)

#### `getArchivedIntercomCommunications`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage` (Array)

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

### Firestore Triggers
No Firestore triggers are defined within this capability's evidence pack.

#### organization_onboarding_inhabitant

No Firestore triggers are owned by this capability. [Confirmed]

### Resolved API Request/Response Schemas

#### `createOnboardingDocuments`
*   **Request Type**: `OSKOrganizationOnboardingInhabitantCreateLinkRequest`
    *   `onboardingCards`: `OSKInhabitantOnboardingCardRequest`
    *   `organizationId`: `string`

#### `findOnboardingDocument`
*   **Request Type**: `OSKOrganizationOnboardingFindDocumentRequest`
    *   `organizationId`: `string`
    *   `unitId`: `string`
*   **Response Type**: `OSKOrganizationOnboardingInhabitant`
    *   `accessRights`: `OSKAccessRightWithTimestamp[]`
    *   `accessType`: `OSKUserAccessType`
    *   `activationCode`: `string`
    *   `buildingId`: `string`
    *   `contactDetails`: `OSKEmailAndPhoneGuaranteed`
    *   `contactIdentifiers`: `string[]`
    *   `creationDate`: `Timestamp`
    *   `doors`: `OSKDoorOnboarding[]`
    *   `emailVerified`: `boolean | undefined` (optional)
    *   `expiryDateActivationCode`: `Timestamp`
    *   `expiryDateSms`: `Timestamp`
    *   `firstName`: `string`
    *   `identityVerified`: `boolean | undefined` (optional)
    *   `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
    *   `inviterId`: `string`
    *   `isOnboarded`: `boolean`
    *   `isUpdated`: `boolean`
    *   `lastName`: `string`
    *   `linksUrl`: `object`
    *   `onboardingId`: `string`
    *   `onboardingQRCode`: `string`
    *   `organizationId`: `string`
    *   `phoneVerified`: `boolean | undefined` (optional)
    *   `smsOtp`: `number`
    *   `unitId`: `string`
    *   `updatedFields`: `OSKOrganizationOnboardingInhabitantUpdate`

#### `getOnboardingDocumentById`
*   **Request Type**: `OSKOrganizationOnboardingGetDocumentByIdRequestData`
    *   `onboardingId`: `string`
    *   `organizationId`: `string`

#### `sendOnboardingActivationCodeEmailCallable`
*   **Request Type**: `ResendActivationCodeRequest`
    *   `language`: `OSKSupportedLanguageEnum`
    *   `organizationId`: `string`
    *   `residentId`: `string`

#### `verifyActivationCode`
*   **Request Type**: `OSKOrganizationOnboardingVerifyActivationCode`
    *   `activationCode`: `string`

#### `verifyActivationCodeByOrganizationAdmin`
*   **Request Type**: `OSKOrganizationOnboardingVerifyActivationCodeByOrgAdminRequestData`
    *   `activationCode`: `string`
    *   `adminOrganizationId`: `string`

#### organization_pending

### Callable Functions
The capability exposes the following Firebase HTTPS Callable Functions (Confirmed) `` `functions/src/modules/organization/modules/organization_pending/index.ts` (lines 21-35) ``:
- `approvePendingOrganizationRequest`
- `createPendingOrganization`
- `getAllPendingOrganizations`
- `getCurrentUserPendingOrganizations`
- `getPendingOrganizationById`
- `rejectPendingOrganizationRequest`

### Resolved API Request/Response Schemas

#### approvePendingOrganizationRequest
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`

#### createPendingOrganization
- **Request Type**: `OSKOrganizationPending`
  - `name`: `string`
  - `status`: `"rejected" | "approved" | "pending"`
  - `streetAddress`: `import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress`
  - `taxNumber`: `string`
  - `userId`: `string`

#### getAllPendingOrganizations
- **Request Type**: `OSKGetAllOrganizationsPendingRequestDocument`
  - `adminsOrganizationId`: `string`

#### getCurrentUserPendingOrganizations
- *Note: No `model_property` facts matched within this pack for this endpoint's request/response types.*

#### getPendingOrganizationById
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Type**: `OSKGetOrganizationsPendingByIdResponseDocument`
  - `user`: `import("functions/src/modules/user/models/documents/user_document.model").OSKUserDocument | undefined`

#### rejectPendingOrganizationRequest
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`

#### organization_prompt_templates

### Callable Cloud Functions
The capability exposes five HTTPS callable functions [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (lines 38-42)]:
- `create`
- `delete`
- `get`
- `getAll`
- `update`

### Resolved API Request/Response Schemas

#### `create`
- **Request Type**: `OSKCreateOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns a success status or the created template document].

#### `delete`
- **Request Type**: `OSKDeleteOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns a success confirmation].

#### `get`
- **Request Type**: `OSKGetOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns `OSKOrganizationPromptTemplate` or null].

#### `getAll`
- **Request Type**: `OSKGetAllOrganizationPromptTemplatesRequest`
  - `organizationId`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns an array of `OSKOrganizationPromptTemplate` documents].

#### `update`
- **Request Type**: `OSKUpdateOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns a success status or the updated template document].

---

#### organization_property

### API Contracts (Callable Cloud Functions)
The following HTTPS callable functions are exposed by this capability:

#### `assigningPropertyToEntity`
- **Request Schema**: `OSKEntityAssigningPropertyRequestData`
  - `newEntityId`: `string`
  - `oldEntityId`: `string`
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `createProperty`
- **Request Schema**: `OSKCreatePropertyRequestData`
  - `buildings`: `import("functions/src/modules/building/models/documents/building_document.model").OSKBuilding[]`
  - `entityId`: `string`
  - `managementType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyManagementEnum`
  - `organizationId`: `string`
  - `propertyImage`: `string | undefined` (optional)
  - `propertyName`: `string`
  - `propertyType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyTypeEnum`
  - `streetAddress`: `import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress`

#### `deleteProperty`
- **Request Schema**: `OSKGetPropertyByIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `deletePropertyImage`
- **Request Schema**: `OSKDeletePropertyImageRequest`
  - `filename`: `string`
  - `propertyId`: `string`

#### `getAllProperties`
- **Request Schema**: `OSKGetAllPropertiesRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`

#### `getPropertyById`
- **Request Schema**: `OSKGetPropertyByIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `getPropertyDashboardStatics`
- **Request Schema**: `OSKGetPropertyDashboardStaticsRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema**: `OSKGetPropertyDashboardStaticsResponseData`
  - `adminsCount`: `number`
  - `buildingsCount`: `number`
  - `devicesCount`: `number`
  - `residentsCount`: `{ onboarded: number; notOnboarded: number; }`

#### `updateProperty`
- **Request Schema**: `OSKUpdatePropertyRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `update`: `Partial<import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKProperty>`

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

#### organization_residents

### Callable Functions & Request/Response Schemas

- **deleteResident**
  - **Request Type**: `OSKResidentsDocumentDeleteRequest`
    - `organizationId`: `string`
    - `residentId`: `string`
  - **Response Type**: `void` (Implicit)

- **getAllResidents**
  - **Request Type**: `OSKGetAllOrganizationResidentsRequestData`
    - `organizationId`: `string`
  - **Response Type**: `OSKResidentsDocumentResponse`
    - `count`: `number`
    - `residents`: `OSKOrganizationResidentResponseDocument[]`

- **getResidentDetails**
  - **Request Type**: `OSKGetOrganizationResidentDetailsRequestData`
    - `organizationId`: `string`
    - `residentId`: `string`
  - **Response Type**: `OSKOrganizationResidentResponseDocument` (Implicit)

- **getallResidentsByPropertyIdCallable**
  - **Request Type**: `OSKGetAllResidentByPropertyIdRequest`
    - `organizationId`: `string`
    - `propertyId`: `string`
  - **Response Type**: `OSKResidentsDocumentResponse`
    - `count`: `number`
    - `residents`: `OSKOrganizationResidentResponseDocument[]`

- **updateResident**
  - **Request Type**: `OSKUpdateOrganizationResidentRequest`
    - `firstName`: `string`
    - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
    - `lastName`: `string`
    - `organizationId`: `string`
    - `residentId`: `string`
  - **Response Type**: `void` (Implicit)

*Note: For `bulkCreateResidents` and `createResidents`, no `model_property` facts matched within this pack to resolve their exact schemas.*

---

#### organization_user

### API Contracts (Callable Cloud Functions)

#### `deleteOrganizationUser`
- **Request Type**: `OSKOrganizationUserDeleteRequest`
  - `organizationId`: `string`
  - `userId`: `string`
- **Response Type**: Not specified (void/empty response)

#### `getAllOrganizationUsersAndInvitees`
- **Request Type**: `OSKGetAllOrganizationUsersAndInviteesRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKGetAllOrganizationUsersAndInviteesResponseData`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `status`: `"active" | "invited"`
  - `userId`: `string`

#### `updateOrganizationUser`
- **Request Type**: `OSKOrganizationUserUpdateRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: Not specified

#### `updateOrganizationUserRoles`
- **Request Type**: `OSKOrganizationUserUpdateRolesRequest`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: Not specified

*Note: The endpoints `getOrganizationUserById`, `getOrganizationInviteeByEmail`, and `getOrganizationUserRoles` do not have matching model property definitions in this capability pack, so their detailed schemas are omitted.*

### Firestore Triggers
No Firestore triggers are owned or declared by this capability. **Confirmed** (absence of evidence).

---

#### organization_user_access

- No external HTTP API contracts (`api_contract` facts) or Firestore database triggers are directly owned or declared within this capability's evidence pack. [Confirmed]

---

#### organization_user_invitation

### Callable Functions
The capability exposes the following Firebase Callable Functions [Confirmed]:

#### `cancelUsersInvitation`
- **Request Type**: `OSKOrganizationUserInvitationCancelRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` [Inferred]

#### `createPMPUserWithInvitation`
- **Request Type**: `OSKOrganizationCreatePMPUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `originalEmail`: `string | undefined` (optional)
  - `phoneNumber`: `OSKPhoneNumber`
  - `roles`: `string[]`
- **Response Type**: `Promise<void>` [Inferred]

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
- **Response Type**: `Promise<void>` [Inferred]

#### `inviteUserWithInvitation`
- **Request Type**: `OSKOrganizationUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`
- **Response Type**: `Promise<void>` [Inferred]

#### `processPMPInvitation`
- **Request Type**: `OSKOrganizationProcessPMPInvitationRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` [Inferred]

#### `queryPMPInvitations`
- **Request Type**: `void` [Inferred]
- **Response Type**: `Promise<OSKOrganizationPMPUserInvitation[]>` [Inferred]

### Firestore Triggers
No Firestore triggers are defined or owned by this capability [Confirmed].

### 9. Permissions & Security

**Cross-cutting risk callouts:**

An active comparison of security enforcement across the 14 capabilities reveals significant asymmetries and structural risks in how authorization is applied `[Confirmed]`.

#### Mental Enforcement Tally
- **Strictly Enforced Capabilities**: Submodules managing core administrative assets (`organization_entity`, `organization_property`, `organization_residents`, `organization_user`, and `organization_user_invitation`) strictly enforce granular, role-based access control (RBAC) checks (e.g., `v1.org.entity.create`, `v1.org.property.edit`, `v1.org.residents.delete`) via the `OSKConsolidatedRolesController` `[Confirmed]`.
- **Permissive/Unenforced Capabilities**: 
  - **`organization_prompt_templates`**: Performs sensitive write operations (creating, updating, and deleting system prompt templates) but enforces **zero** RBAC permission checks `[Confirmed]`. It relies solely on basic authentication (`@OSKUserSecurityChecks({ checkUserIdMatch: false })`), allowing any logged-in user to potentially modify an organization's prompt templates `[Confirmed]`.
  - **`organization_user_access`**: Performs sensitive access setup but lacks explicit RBAC checks in its local service layer, relying entirely on caller-level middleware to enforce security boundaries `[Inferred]`.

#### Unattributed Security-Relevant Signals
- **Database-Level RBAC Bypass**: The Firestore security rules for `/organizations/{organizationId}/users/{userId}` are highly permissive, defined as `allow read, write: if isValidUser();` `[Confirmed]`. This represents a significant security-relevant signal: direct client-side database reads and writes are permitted for any authenticated user, completely bypassing the granular RBAC checks (such as `v1.org.user.edit` or `v1.org.user.view`) which are enforced *only* at the application layer (Cloud Functions) `[Confirmed]`.

#### RBAC Cross-Check & Mismatch Analysis
- **Missing Roles in Schema**: The permission strings `v1.admin.org.admin` and `v1.admin.building.admin` are actively checked during organization and building retrieval in `_module_root` and `organization_user` `[Confirmed]`. However, **neither string exists** in the canonical `rbac-roles.json` schema, representing a critical mismatch that could lead to authorization failures or unmapped administrative roles `[Confirmed]`.
- **Overloaded Building Creation Permission**: The permission `v1.org.buildings.create` (defined in the schema as *"Allows to create a new building"*) is heavily overloaded in `organization_building_invitation` and `organization_onboarding_inhabitant` to authorize inhabitant invitations, onboarding cards, and activation code verifications `[Confirmed]`. This is a semantic mismatch; these operations should be governed by resident-specific permissions like `v1.org.residents.create` `[Confirmed]`.
- **Over-Permissive Entity Check**: The `organization_property` submodule checks `v1.org.entity.create` (creating a brand new entity) during property-to-entity assignment `[Confirmed]`. This is an overly permissive check for a simple re-association operation that should only require edit permissions on the existing property and entity `[Confirmed]`.

**Per-capability evidence:**

#### _module_root

The following permission strings are explicitly referenced and checked by this capability:
- `v1.admin.org.register` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.register|#1`): Checked during organization creation. Matches the RBAC roles document.
- `v1.admin.org.validate` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.validate|#1`): Checked during organization creation. Matches the RBAC roles document.
- `v1.admin.org.edit` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.edit|#1`): Checked during organization updates. Matches the RBAC roles document.
- `v1.org.edit` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.org.edit|#1`): Checked during organization updates. Matches the RBAC roles document.
- `v1.admin.org.view` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.view|#1`): Checked during organization retrieval. Matches the RBAC roles document.
- `v1.admin.org.delete` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.delete|#1`): Referenced as a candidate permission. Matches the RBAC roles document.
- `v1.admin.building.register` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.building.register|#1`): Referenced as a candidate permission. Matches the RBAC roles document.

### Security Mismatches
- `v1.admin.org.admin` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.org.admin|#1`): Checked during organization retrieval. **Mismatch**: This permission string is not present in the canonical RBAC roles document.
- `v1.admin.building.admin` (`permission_candidate|organization|functions/src/modules/organization/services/organization.service.ts|v1.admin.building.admin|#1`): Referenced as a candidate permission. **Mismatch**: This permission string is not present in the canonical RBAC roles document.

#### organization_building

- **`v1.org.buildings.view`**: Required to retrieve organization buildings and single organization building details `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.buildings.view|#1` ``.
  - *Cross-check*: Present in RBAC roles document ("Allows to view the details of a building"). Matches implementation.
- **`v1.org.residents.view`**: Required to retrieve organization buildings for onboarding cards `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.residents.view|#1` ``.
  - *Cross-check*: Present in RBAC roles document ("Allows to view the details of a resident"). Matches implementation.
- **Firestore Security Rules**:
  - The rules file defines read and write permissions for `/organizations/{organizationId}/buildings/{buildingId}` as `allow read, write: if isValidUser();` `firestore.rules.txt` (lines 533-534). This matches the controller implementation which relies on authentication.

---

#### organization_building_invitation

### Enforced Permissions
The capability checks the following permission string to authorize administrative actions:
- **`v1.org.buildings.create`**: Checked before creating, querying, canceling, or accepting building inhabitant invitations. (Confirmed) `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_building_invitation/services/organization_building_invitation.service.ts|v1.org.buildings.create|#1` ``

### RBAC Cross-Check & Mismatch Analysis
- According to the `rbac-roles.json` reference document, the permission `v1.org.buildings.create` is described as **"Allows to create a new building"**.
- **Mismatch Identified**: Using `v1.org.buildings.create` to authorize *inhabitant invitations* is a semantic mismatch. A more appropriate permission from the RBAC roles document would be `v1.org.residents.create` (**"Allows to create a new resident profile"**). (Inferred)

---

#### organization_entity

### Enforced Permissions
The capability checks the following permission strings via `OSKConsolidatedRolesController.checkUserPermissions` [Confirmed]:

- **`v1.org.entity.view`**: Required to view entity details, list entities, or fetch dashboard statistics [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.view|#1` ``).
- **`v1.org.entity.create`**: Required to create a new entity or assign a sub-entity to a parent [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.create|#1` ``, `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.create|#2` ``).
- **`v1.org.entity.edit`**: Required to update an existing entity [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.edit|#1` ``).
- **`v1.org.entity.delete`**: Required to delete an entity [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.delete|#1` ``).

### RBAC Alignment
All candidate permissions (`v1.org.entity.view`, `v1.org.entity.create`, `v1.org.entity.edit`, `v1.org.entity.delete`) align exactly with the definitions provided in the RBAC roles document [Confirmed].

---

#### organization_inhabitant

- **Required Permission**: `v1.org.view` [Confirmed] (`permission_candidate|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|v1.org.view|#1`).
- **RBAC Cross-Check**: The permission `v1.org.view` is defined in the RBAC roles document as "Allows to view organization information". This matches the implementation, which restricts the retrieval of organization-wide inhabitant lists and details to users holding this administrative role [Confirmed].

---

#### organization_intercom_ communication

### Permission Strings Referenced
- **`v1.org.communications.create`**: Required to create a new communication or reformulate content [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 985, 1622)].
- **`v1.org.communications.delete`**: Required to delete an existing communication [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 1686)].
- **`v1.org.communications.list`**: Required to list active, scheduled, or archived communications [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 691, 745, 894, 925)].
- **`v1.org.communications.view`**: Required to view details of a specific communication [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 797)].

### RBAC Alignment
All referenced permission strings match the supplied RBAC roles document exactly.

#### organization_onboarding_inhabitant

This capability references and enforces the following permission strings:
*   `v1.org.buildings.create`: Checked in `createOnboardingDocuments` (line 617), `findOnboardingDocument` (line 92), `getAllOnboardingDocuments` (line 318), `getOnboardingDocumentById` (line 180), `updateOnboardingDocument` (line 255), and `verifyActivationCodeByOrganizationAdmin` (line 964). [Confirmed]
    *   *Cross-check Mismatch*: The RBAC roles document defines `v1.org.buildings.create` as "Allows to create a new building". However, this capability uses it to authorize administrative operations on onboarding documents (e.g., creating, updating, and retrieving onboarding cards, and verifying activation codes by an admin). This is a significant mismatch where a building creation permission is overloaded for resident onboarding administration. [Confirmed]
*   `v1.org.residents.onboardingNotification`: Checked in `_sendOnboardingNotificationEmail` (line 1439) to identify which PMP users should receive emails when a resident completes onboarding. [Confirmed]
    *   *Cross-check*: Matches the RBAC roles document ("Activates email notifications for new resident registrations."). [Confirmed]
*   `v1.org.residents.create`: Checked in `sendOnboardingActivationCodeEmailCallable` (line 61) to authorize resending activation emails. [Confirmed]
    *   *Cross-check*: Matches the RBAC roles document ("Allows to create a new resident profile."). [Confirmed]

#### organization_pending

The capability references and enforces the following permission strings:
- `v1.admin.org.validate` (Confirmed) `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.admin.org.validate|#1` ``: Required to list, view, reject, or approve pending organization requests. This matches the RBAC roles document description: *"v1.admin - Allows to validate a new organization"*.
- `v1.org.user.create` (Confirmed) `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.org.user.create|#1` ``: Referenced during the approval flow when inviting the requesting user to the newly created organization. This matches the RBAC roles document description: *"Allows to add a new user to the Oskey Property Management Portal"*.
- `v1.org` (Confirmed) `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.org|#1` ``: Used as a prefix filter to gather all organization-level roles to assign to the newly created organization's administrator.

#### organization_prompt_templates

### Security Decorators & Parameter Checks
- All service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 26, 40, 61, 85, 110)]. This ensures that the caller is a valid, signed-in user, but does not require their user ID to match a specific resource ID.
- Parameter validation is performed via `OSKSecurityChecks.checkParameters` to ensure that required fields (such as `context`, `organizationId`, and `promptName`) are present and of the correct type before executing business logic [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/services/organization_prompt_templates.service.ts` (lines 31-34, 45-49, 66-72, 90-95, 115-119)].

### Firestore Rules Interaction
- In `firestore.rules.txt`, there is no explicit rule matching `/organizations/{organizationId}/promptTemplates/{document=**}`.
- Because these operations are executed via backend Cloud Functions (which run with administrative privileges), they bypass Firestore security rules [Inferred]. Security is instead enforced at the application layer via the `@OSKUserSecurityChecks` decorator and parameter validation.

---

#### organization_property

### Enforced Permissions
The capability checks the following permission strings against the user's consolidated roles:
- **`v1.org.property.view`**: Required to view property details and retrieve dashboard statistics. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (line 87) ``
- **`v1.org.property.create`**: Required to create a new property. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (line 133) ``
- **`v1.org.property.edit`**: Required to update property details, delete properties, assign properties to entities, and manage property images. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 200, 273, 319) ``
- **`v1.org.entity.create`**: Checked during property-to-entity assignment alongside property edit permissions. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (line 319) ``

### RBAC Alignment
All referenced permissions align exactly with the platform's RBAC roles document:
- `v1.org.property.view` maps to *"Allows to view the details of a property"*.
- `v1.org.property.create` maps to *"Allows to create a new property"*.
- `v1.org.property.edit` maps to *"Allows to edit a property's information"*.
- `v1.org.entity.create` maps to *"Allows to create a new entity"*.

### Security Decorators
All service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` to enforce authentication and session validity without requiring a specific user ID match. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 39, 68, 105, 177, 254, 295, 387, 422) ``

#### organization_residents

The following permission strings are checked by this capability via `OSKConsolidatedRolesController.default.checkUserPermissions`:

- `v1.org.residents.create` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 572, 1152) `` [Confirmed]
- `v1.org.residents.delete` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (line 184) `` [Confirmed]
- `v1.org.residents.edit` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (line 958) `` [Confirmed]
- `v1.org.residents.list` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 101, 1050) `` [Confirmed]
- `v1.org.residents.view` `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (line 143) `` [Confirmed]

### RBAC Cross-Check
All permission strings match the supplied RBAC roles document exactly:
- `v1.org.residents.create` -> "Allows to create a new resident profile"
- `v1.org.residents.delete` -> "Allows to delete a resident"
- `v1.org.residents.edit` -> "Allows to edit a resident's profile"
- `v1.org.residents.list` -> "Allows to view the list of residents"
- `v1.org.residents.view` -> "Allows to view the details of a resident"

---

#### organization_user

### Permission Strings Referenced

#### `v1.org.user.create`
- **Usage**: Checked when listing organization users and invitees.
- **Cross-Check**: Matches `v1.org.user.create` in the RBAC roles document ("Allows to add a new user to the Oskey Property Management Portal").
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.create|#1`

#### `v1.org.user.edit`
- **Usage**: Checked when updating organization users or their roles.
- **Cross-Check**: Matches `v1.org.user.edit` in the RBAC roles document ("Allows to edit a user's information on the Oskey Property Management Portal").
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.edit|#1`

#### `v1.org.user.view`
- **Usage**: Checked when viewing organization users or invitees.
- **Cross-Check**: Matches `v1.org.user.view` in the RBAC roles document ("Allows to view the details of an Oskey Property Management Portal user").
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts|v1.org.user.view|#1`

#### `v1.org.admin` (Role)
- **Usage**: Checked to identify organization administrators.
- **Cross-Check**: This is a high-level role rather than a granular permission string, which is why it is not listed in the `rbac-roles.json` permission list but is documented in the Architecture/Personas documents.
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|v1.org.admin|#1`

#### `v1.admin` (Role)
- **Usage**: Checked to identify platform-level administrators.
- **Cross-Check**: This is a high-level role rather than a granular permission string.
- **Citation**: `permission_candidate|organization|functions/src/modules/organization/modules/organization_user/controllers/organization_user.controller.ts|v1.admin|#1`

### Firestore Security Rules

The Firestore rules for the `/organizations/{organizationId}/users/{userId}` subcollection are defined as:
```javascript
match /organizations/{organizationId} {
  // ...
  match /users/{userId} {
    allow write: if isValidUser();
    allow read: if isValidUser();
  }
}
```
- **Analysis**: The Firestore rules allow any authenticated user (`isValidUser()`) to read and write to the organization users collection. This indicates that granular RBAC enforcement (such as checking `v1.org.user.edit` or `v1.org.user.view`) is delegated entirely to the application layer (Cloud Functions) via the `OSKConsolidatedRolesController` rather than being enforced at the database rules layer.
- **Citation**: `firestore.rules.txt` (lines 518-521).

---

#### organization_user_access

- No explicit permission strings or RBAC role checks are directly referenced in the evidence pack for this capability. [Confirmed]

---

#### organization_user_invitation

The capability references and enforces the following permission strings [Confirmed]:

- **`v1.admin.org.validate`**: Used to validate organization-level operations [Confirmed]. Matches the RBAC roles document ("v1.admin - Allows to validate a new organization") [Confirmed].
  - *Citations*: `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|v1.admin.org.validate|#1` ``
- **`v1.org.user.create`**: Used to authorize the creation of organization users and invitations [Confirmed]. Matches the RBAC roles document ("Allows to add a new user to the Oskey Property Management Portal") [Confirmed].
  - *Citations*: `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|v1.org.user.create|#1` ``
- **`v1.org.user.delete`**: Used to authorize the deletion or cancellation of organization users and invitations [Confirmed]. Matches the RBAC roles document ("Allows to delete an Oskey Property Management Portal user") [Confirmed].
  - *Citations*: `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|v1.org.user.delete|#1` ``

### 10. Cross-Module Relationships

The `organization` module maintains extensive, bi-directional relationships with other modules in the repository, as verified by deterministic AST import resolution `[Confirmed]`.

#### Outbound Relationships (This module depends on)
- **`access_control_device`**: Imports `OSKAccessControlDeviceConfigController` to update intercom home screen configurations with active organization communications `[Confirmed]`.
- **`apps`**: Imports `OSKNotificationOptions` (notification), `OSKEmailService` (mail), and `OSKQRcodeService` (qrcode) to dispatch emails and generate QR codes for resident onboarding `[Confirmed]`.
- **`building`**: Tightly coupled. Imports door, unit, inhabitant, and invitation controllers to manage physical building structures, assign inhabitants to units, and create building-level invitations `[Confirmed]`.
- **`core`**: Foundational dependency. Imports document controllers, logging services, access services, and address models to handle database persistence and logging `[Confirmed]`.
- **`settings`**: Imports `OSKConsolidatedRolesController` and `OSKCompositeRoleController` to validate RBAC permissions and list roles `[Confirmed]`.
- **`tasks`**: Imports `OSKIntercomCommunicationTaskPayload` and `OSKTaskSchedulerService` to schedule and cancel intercom communication activation/deactivation tasks `[Confirmed]`.
- **`unit_management`**: Imports `OSKUnitManagementPendingInvitationsController` to delete pending invitations during resident deletion `[Confirmed]`.
- **`user`**: Imports user controllers, pincode controllers, and organization mapping controllers to manage user profiles, pincodes, notifications, and organization memberships `[Confirmed]`.

#### Inbound Relationships (Other modules depend on this)
- **`access_control_device`**: Imports `OSKIntercomCommunicationConfig` and `OSKOrganizationController` to resolve public keys and intercom configurations `[Confirmed]`.
- **`admin`**: Imports organization, property, resident, and onboarding controllers for administrative maintenance, listing, and prompt template management `[Confirmed]`.
- **`building`**: Imports organization user controllers, resident documents, and property controllers to resolve building settings, intercom inhabitants, and property mappings `[Confirmed]`.
- **`core`**: Imports `OSKOrganizationUserAccessService` and `OSKOrganizationUserController` to set up user access and resolve storage paths `[Confirmed]`.
- **`supplier`**: Imports `OSKOrganizationUserController` and `OSKOrganizationController` to resolve supplier staff accesses and activities `[Confirmed]`.
- **`tasks`**: Imports `OSKIntercomCommunicationService` to execute scheduled intercom activations/deactivations `[Confirmed]`.
- **`user`**: Imports organization residents, onboarding, and user controllers to manage user invitations, settings, and resident deletions `[Confirmed]`.

### 11. External Hooks

#### _module_root

- **Google Cloud Storage Integration**: Integrates with Cloud Storage to upload and delete organization logo assets under the `'organizationLogo'` folder prefix (`call_expression|organization|functions/src/modules/organization/controllers/organization.controller.ts|OSKOrganizationController.default._uploadImage|uploadImage|bucket,imagePath,contentType,'organizationLogo'|#1`). [Confirmed]
- **Firebase App Check**: Enforces App Check verification on all callable function triggers unless running in a local emulator environment (`call_expression|organization|functions/src/modules/organization/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`). [Confirmed]

#### organization_building

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced within this capability's pack.

---

#### organization_building_invitation

No external hooks (such as Pub/Sub topics, external HTTP integrations, or cloud storage paths) are directly evidenced within this capability's pack. All operations are synchronous internal service calls or Firebase callable functions. (Confirmed)

---

#### organization_entity

- No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or cloud storage paths) are directly evidenced within this capability's pack [Confirmed].

---

#### organization_inhabitant

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or Cloud Storage paths) are evidenced within this capability's pack.

---

#### organization_intercom_ communication

### Generative AI Integration (Vertex AI / Gemini)
- Integrates with `@google-cloud/vertexai` to access generative models [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 6)].
- Uses `gemini-2.5-flash` to execute batch translations and content reformulation [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 61)].

### Cloud Tasks Integration
- Schedules asynchronous execution of `activateIntercomCommunicationTask` and `deactivateIntercomCommunicationTask` via `OSKTaskSchedulerService` [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1160, 1196)].

#### organization_onboarding_inhabitant

### Confirmed Integrations
*   **Email Integration**: Integrates with `OSKEmailService` (from `@oskey/apps/mail`) to send onboarding activation emails (`onboardingActivationCode` template) and onboarding completion notifications (`userOnboardedNotification` template). [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts` (lines 24-35) ``, `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1473-1486) ``
*   **QR Code Generation**: Integrates with `OSKQRcodeService` (from `@oskey/apps/qrcode`) to generate onboarding QR codes from activation codes. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 653-654) ``

### Architectural Candidates
*   **SMS Integration**: There is commented-out code referencing `OSKOrganizationOnboardingInhabitantService.sendVerificationSms` with a TODO "Waiting for API Key" for sending SMS OTPs. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1395-1407) ``

#### organization_pending

- **App Check Enforcement**: Enforces Firebase App Check verification on all callable function triggers unless running in the Firebase Emulator environment (Inferred) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.

#### organization_prompt_templates

- **HTTPS Callable Functions**: The capability registers five callable Cloud Functions (`create`, `delete`, `get`, `getAll`, `update`) using `firebase-functions/v1` [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (lines 35-44)]. These serve as the external API boundary for client applications (such as the Property Manager Portal).
- No Pub/Sub topics, external HTTP integrations, environment variables, or storage paths are evidenced within this capability's pack.

---

#### organization_property

### Cloud Storage Integration
- **Delegated Uploads**: The capability utilizes the delegated-upload pattern by calling `_uploadImage` and `_deleteImage` on `OSKDocumentController`. It interacts with Google Cloud Storage buckets to store and delete property images. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 42-44, 64-66) ``

### Environment Variables
- **`OSK_FIREBASE_EMULATOR`**: Checked during function initialization to conditionally enforce App Check validation. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/index.ts` (line 47) ``

#### organization_residents

### Pub/Sub Integrations
- **ACD Access Synchronization**: Publishes access deletion messages to all Access Control Devices (ACDs) via `OSKAccessMessagePublisherService.publishMessageToAllACDs` when a resident is deleted `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (lines 252, 309) ``. [Confirmed]

### Environment Variables
- `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally enforce App Check `` `functions/src/modules/organization/modules/organization_residents/index.ts` (line 22) ``. [Confirmed]
- `process.env.MAX_BATCH_SIZE`: Used to limit the batch size for bulk resident creation `` `functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts` (line 1137) ``. [Confirmed]

---

#### organization_user

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced in this capability's pack. **Confirmed** (absence of evidence).

---

#### organization_user_access

- No external hooks, Pub/Sub topics, environment variables, or cloud storage paths are evidenced within this capability's pack. [Confirmed]

---

#### organization_user_invitation

This capability interacts with the following external boundaries and candidate integrations [Confirmed]:

### Environment Variables
- **`process.env.OSK_FIREBASE_EMULATOR`**: Used to conditionally enforce App Check depending on whether the emulator is running [Confirmed].
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``
- **`process.env.PMP_PORTAL_URL`**: Used to construct the portal URL sent in invitation emails [Confirmed].
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKEmailService.default.send|createPMPUserWithInvitation|{                     language: sender.settings.global.language,                     template: {                         id: 'pmpUserInvitation',                         params: {                             recipientName: \`\${request.firstName} \${request.lastName}\`,                             recipientEmail: email,                             inviterName: \`\${sender.publicProfile.firstName} \${sender.publicProfile.lastName}\`,                             organizationName: senderOrganization.name \|\| '',                             portalUrl: process.env.PMP_PORTAL_URL \|\| 'https://oskey.io',                         },                     },                 }|#1` ``

### External Services
- **Auth0 Integration**: Integrates with Auth0 via `OSKAuth0Service` to check if an email already exists in the identity provider [Confirmed].
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKAuth0Service.emailExistsInAuth0|createPMPUserWithInvitation|email|#1` ``
- **Email Dispatch**: Integrates with `OSKEmailService` to send out invitation emails using the `pmpUserInvitation` template [Confirmed].
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKEmailService.default.send|createPMPUserWithInvitation|{                     language: sender.settings.global.language,                     template: {                         id: 'pmpUserInvitation',                         params: {                             recipientName: \`\${request.firstName} \${request.lastName}\`,                             recipientEmail: email,                             inviterName: \`\${sender.publicProfile.firstName} \${sender.publicProfile.lastName}\`,                             organizationName: senderOrganization.name \|\| '',                             portalUrl: process.env.PMP_PORTAL_URL \|\| 'https://oskey.io',                         },                     },                 }|#1` ``

### 12. Architectural Observations

- **Strict Multi-Tenant Isolation**: The module successfully enforces the "Entity Scope" as a strict administrative sandbox `[Inferred]`. By routing all queries through scoped controllers, it guarantees that data from one regional co-ownership (Syndic) never leaks into another `[Inferred]`.
- **Permissive Database Layering**: A key architectural characteristic is the reliance on application-level security `[Confirmed]`. Because Firestore security rules are highly permissive for organization users, the entire burden of enforcing granular RBAC boundaries is shifted to the Cloud Functions layer `[Confirmed]`.
- **Heavy Orchestration Responsibility**: Submodules like `organization_onboarding_inhabitant` and `organization_residents` act as heavy orchestrators, executing cascading writes and deletions across multiple external modules (`building`, `user`, `unit_management`, `core`) to maintain referential integrity across the platform `[Confirmed]`.
- **AI-Driven Content Reformulation**: The `organization_intercom_ communication` submodule integrates directly with Gemini/Vertex AI to reformulate and translate intercom messages, demonstrating an architectural pattern of encapsulating AI operations within specific communication services `[Confirmed]`.

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Prompt Template Authorization Bypass**: Why does `organization_prompt_templates` lack any RBAC permission checks? Any authenticated user can perform CRUD operations on system prompt templates, representing a significant security risk `[Confirmed]`.
- **Permissive Firestore Rules**: The Firestore rules for `/organizations/{organizationId}/users/{userId}` allow any authenticated user to read and write to the collection `[Confirmed]`. If a user bypasses the Cloud Functions and writes directly to the database, there is a risk of unauthorized role modification `[Confirmed]`.
- **RBAC Schema Mismatches**: The permission strings `v1.admin.org.admin` and `v1.admin.building.admin` are checked in the code but are completely missing from the canonical `rbac-roles.json` schema `[Confirmed]`.
- **Overloaded Building Creation Permission**: Why is `v1.org.buildings.create` (building creation) used to authorize resident onboarding and invitation workflows instead of a resident-specific permission like `v1.org.residents.create`? `[Confirmed]`
- **Unregistered Firestore Trigger**: `onDocumentCreated` is defined in `OSKOrganizationService` but is not registered as an active Firestore trigger in the module's entry point, suggesting potentially dead or incomplete event-driven logic `[Confirmed]`.
- **Commented-Out SMS Verification**: The SMS verification flow in `organization_onboarding_inhabitant` contains commented-out code indicating it may be blocked pending API key configuration, leaving the status of SMS OTP verification in production unknown `[Inferred]`.

**Per-capability open questions:**

#### _module_root

- Why is `onDocumentCreated` defined in `OSKOrganizationService` (`functions/src/modules/organization/services/organization.service.ts` (line 38)) but not registered as an active Firestore trigger in the module's entry point (`functions/src/modules/organization/index.ts`)? Is this dead code or handled by another capability?
- Are `v1.admin.org.admin` and `v1.admin.building.admin` legacy permissions, or are they newly introduced roles that are missing from the canonical RBAC roles document?
- The `deleteOrganizationLogo` callable function's request schema is not resolved in the provided API schemas list. What are the exact properties of `deleteOrganizationLogoRequest`?

#### organization_building

- **Write Operations Exposure**: The controller `OSKOrganizationBuildingController` inherits from `OSKDocumentController` and exposes `save`, `update`, and `delete` methods `` `functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts` (lines 16-48) ``, but there are no corresponding callable API contracts or services for creating, updating, or deleting organization buildings in this pack. Are these operations performed internally by other modules, or are they exposed via REST endpoints not captured in the `api_contract` facts?
- **Self-Import / Circular Dependency**: The import `@oskey/organization/building` in `organization_building.controller.ts` resolves to the `organization_building` submodule itself `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts|@oskey/organization/building|#1` ``. It is unclear if this is a self-import or a circular reference.

#### organization_building_invitation

- **Permission Mismatch**: Why is `v1.org.buildings.create` (building creation) used to authorize inhabitant invitation workflows instead of `v1.org.residents.create`?
- **Notification Dispatch**: The Oskey Architecture document states that creating an invitation automatically triggers an automated email invitation. However, there is no evidence of notification or email dispatch logic within this capability's service. Is the notification triggered asynchronously via a Firestore trigger in another module (e.g., on the creation of the invitation document in the `building` module)?
- **Onboarding State Transition**: How does the "Onboarding Inhabitant" state transition to "Active" upon acceptance? The service calls `OSKBuildingUnitInhabitantService.addInhabitant`, but the exact mapping of the Auth0 identity linking flow is not visible in this capability's evidence.

#### organization_entity

- **Inbound Coupling**: Which other modules or submodules invoke the callable functions or import `OSKEntityService`? (This is not visible from the outbound-only dependency facts in this pack) [Inferred].
- **`v1.org.entity.list` Permission**: The RBAC roles document defines a `v1.org.entity.list` permission ("Allows to view the list of entities"), but the `getAllEntities` service method checks for `v1.org.entity.view` instead [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.view|#1` ``). It is unclear if `v1.org.entity.list` is used elsewhere in the system or if it has been consolidated into `v1.org.entity.view` [Inferred].

#### organization_inhabitant

- **Response Schema for `getInhabitantDetailsById`**: The exact response schema for `getInhabitantDetailsById` is not defined in the resolved API schemas. It is inferred to return a mapped inhabitant document, but this is not explicitly confirmed by the model properties.
- **Write Operations**: This capability pack contains only read-only operations. It is unclear if inhabitant creation, modification, or deletion is handled by a different submodule (e.g., `unit_management` or `building`) or if those operations are missing from the current implementation scope.

#### organization_intercom_ communication

- **Exact Firestore Paths**: The exact Firestore collection paths resolved by `OSKIntercomBuildingStateController.getStateCollectionPath` and `OSKIntercomCommunicationArchiveController.getCollectionPath` are not explicitly defined in the evidence pack (they are dynamically generated using `organizationId`, `buildingId`, and `type`).
- **Cloud Task Handlers**: The actual execution logic for `activateIntercomCommunicationTask` and `deactivateIntercomCommunicationTask` is not present in this capability's evidence pack (it is likely owned by the `tasks` module).

#### organization_onboarding_inhabitant

*   Why is `v1.org.buildings.create` (building creation permission) used to authorize resident onboarding document management and admin activation code verification instead of a resident-specific permission like `v1.org.residents.edit` or `v1.org.residents.create`? [Inferred]
*   Is the SMS verification flow fully functional, or is it blocked pending the API key as indicated by the commented-out code in `resetSmsCode`? [Inferred]

#### organization_pending

- **Firestore Schema Mapping**: The `/organizationsPending` collection is not explicitly documented in the provided `firestore-schema.md` map, although it is clearly targeted by `OSKOrganizationPendingController` (Inferred).
- **Street Address Structure**: The exact structure of the `OSKStreetAddress` type is imported from `core` but its fields are not fully detailed in this capability's pack (Inferred).

#### organization_prompt_templates

- **RBAC Role Enforcement**: The service methods use `@OSKUserSecurityChecks({ checkUserIdMatch: false })` to verify that a user is logged in, but the evidence does not show any explicit checks against specific RBAC roles (e.g., `v1.org.settings.edit` or `v1.admin.org.edit`). It is unknown whether any authenticated user can modify an organization's prompt templates, or if there is an implicit organization membership check performed within the core security decorators that is not visible in this pack.
- **Prompt Template Usage**: The business purpose of these prompt templates (e.g., whether they are used for AI-generated communications, automated notifications, or another feature) is not documented in the evidence pack.
- **Response Schemas**: The exact TypeScript types returned by the callable functions are not explicitly defined in the model file or the resolved API schemas.

#### organization_property

- **`v1.org.entity.create` Check**: Why does `assigningPropertyToEntity` check `v1.org.entity.create` in its `rolesToCheck` array? Re-associating an existing property to an existing entity would typically only require edit permissions on both entities/properties, rather than the ability to create a brand new entity. [Inferred]
- **Storage Bucket Resolution**: The exact name of the Cloud Storage bucket used for property images is not statically defined in this submodule's facts; it is passed dynamically to the controller's `uploadImage` method. [Inferred]

#### organization_residents

- **Email Dispatch**: The architecture document states that creating a resident profile triggers an automated email invitation with download links and activation codes. However, the code in this capability only shows QR code generation and onboarding document creation. It is unclear if the email dispatch is handled asynchronously via a Firestore trigger in another submodule or if it is an unevidenced workflow in this pack. [Inferred]
- **Bulk Creation Schema**: Why do `bulkCreateResidents` and `createResidents` lack resolved request/response schemas in the metadata? It is likely because their payloads are arrays or dynamic structures not fully mapped to a single type alias in the `model_property` facts of this pack. [Inferred]

#### organization_user

- **Firestore Rules Permissiveness**: Why are the Firestore security rules for `/organizations/{organizationId}/users/{userId}` so permissive (`allow read, write: if isValidUser()`) compared to the strict application-level RBAC checks? Is there a risk of direct client-side modification if a user bypasses the Cloud Functions?
- **Auth0 Synchronization**: When an organization user is deleted via `deleteOrganizationUser`, does this trigger any cleanup in the Auth0 identity provider, or is the user's Auth0 account left intact? The current evidence only shows Firestore document deletions.
- **Event Publishing**: Are there any background events published (e.g., via Pub/Sub) when an organization user's roles are updated, to notify other modules or invalidate caches? The current evidence only shows direct database writes.

#### organization_user_access

- **Database Persistence**: Which specific Firestore collections (e.g., `/users/{id}/accesses` or `/buildings/{id}/accesses`) are ultimately updated when `setupOrganizationUserAccess` is executed? Since the database writes are likely encapsulated inside `@oskey/core/access` or `@oskey/user/access`, the exact target collections are not visible in this capability's local evidence. [Unknown]
- **Authorization Boundaries**: Does `setupOrganizationUserAccess` perform any internal permission checks, or does it rely entirely on caller-level middleware to enforce RBAC roles (such as `v1.admin.user.accesses.create`)? [Unknown]

#### organization_user_invitation

- **Auth0 Syncing**: It is unclear from the evidence how Auth0 user creation is synchronized back to the Firestore `/users` collection when a user accepts an invitation, as this capability only checks for email existence and deletes the pending invitation document [Unknown].
- **Email Templates**: The exact layout and configuration of the `pmpUserInvitation` email template are managed externally and not detailed in this capability's pack [Unknown].

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.