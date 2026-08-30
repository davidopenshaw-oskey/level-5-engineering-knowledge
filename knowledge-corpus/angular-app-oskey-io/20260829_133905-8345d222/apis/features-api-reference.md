### 0. Generation Metadata

- runId: 20260829_133905-8345d222
- generatedAt: 2026-08-29T13:57:21.880Z
- repoName: angular-app-oskey-io
- targetModule: features
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### authentication

### Backend Calls (Firebase Callable Functions)
- **core-exchangeAuth0Token**: Exchanges Auth0 ID token for Firebase custom token. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|core-exchangeAuth0Token|#1` ``
- **core-getCountriesNoAuth**: Fetches country list without requiring authentication. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|core-getCountriesNoAuth|#1` ``
- **core-getMfaPhoneNumber**: Retrieves MFA phone number for a user. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|core-getMfaPhoneNumber|#1` ``
- **organization-processPMPInvitation**: Processes a Property Management Portal invitation. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|organization-processPMPInvitation|#1` ``
- **organization-queryPMPInvitations**: Queries pending PMP invitations. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|organization-queryPMPInvitations|#1` ``
- **user-updateUserProfileAndPhoneNumber**: Updates user profile and phone number. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|user-updateUserProfileAndPhoneNumber|#1` ``

### Routes
- **Path `""` (root)**: Lazy-loads `OSKSignInComponent` from `./features/sign-in/sign-in.component`. [Confirmed] `` `angular_route|features|hosting/web-app/src/app/features/authentication/auth.routes.ts||#1` ``
- **Path `"actionCode"`**: Lazy-loads `OSKAuthActionComponent` from `./features/auth-action/auth-action.component`. [Confirmed] `` `angular_route|features|hosting/web-app/src/app/features/authentication/auth.routes.ts|actionCode|#1` ``
- **Path `"verifyEmail"`**: Lazy-loads `OSKVerifyEmailComponent` from `./features/sign-in/components/verify-email/verify-email.component`. [Confirmed] `` `angular_route|features|hosting/web-app/src/app/features/authentication/auth.routes.ts|verifyEmail|#1` ``
- **Path `"verifyCode"`**: Lazy-loads `OSKSecondFactorAuthentificationComponent` from `./features/sign-in/components/second-factor-authentification/second-factor-authentification.component`. [Confirmed] `` `angular_route|features|hosting/web-app/src/app/features/authentication/auth.routes.ts|verifyCode|#1` ``

---

#### home

- **Backend Calls**: None evidenced [Confirmed].
- **Routes**: No routing definitions (`angular_route` facts) are present in this capability's evidence pack [Confirmed].

---

#### portals

- **Backend Calls**: No direct Firebase Callable function calls (`firebase_callable_call`) are defined within this capability. (Confirmed)
- **Routes**: No direct Angular route definitions (`angular_route`) are declared within this capability's pack. (Confirmed)

---

#### portals_organization

### Backend Calls
- No direct Firebase callable functions or backend API calls are evidenced in this capability. (Confirmed)

### Routes
The capability defines three main routes within `organization.routes.ts` `` `hosting/web-app/src/app/features/portals/organization/organization.routes.ts` (lines 17-32) ``:
- **`entities`**: Lazy-loads child routes from `./features/entities/entities.routes` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|entities|#1` ``.
- **`notifications`**: Lazy-loads `OSKNotificationsComponent` from `./features/notifications/notifications.component` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|notifications|#1` ``.
- **`settings`**: Lazy-loads `OSKSettingsComponent` from `./features/settings/settings.component` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|settings|#1` ``.

---

#### portals_organization_entities

### Backend Calls
The following are local, unverified claims about backend integrations made by `OSKOrganizationEntitiesService` via `OSKFirebaseHttpsService` [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts` ``):
- **`organization-createEntity`**: Creates a new entity [Confirmed] (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|organization-createEntity|#1` ``).
- **`organization-deleteEntity`**: Deletes an entity by ID [Confirmed] (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|organization-deleteEntity|#1` ``).
- **`organization-getAllEntities`**: Retrieves all entities for an organization [Confirmed] (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|organization-getAllEntities|#1` ``).
- **`organization-getEntityById`**: Retrieves a single entity by ID [Confirmed] (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|organization-getEntityById|#1` ``).
- **`organization-updateEntity`**: Updates an existing entity's properties [Confirmed] (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|organization-updateEntity|#1` ``).

### Routes
The routing configuration is defined in `entities.routes.ts` [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/entities.routes.ts` ``):
- **Path `""`**: Lazy-loads `OSKEntitiesDashboardComponent` [Confirmed] (`` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/entities.routes.ts||#1` ``).
- **Path `":entityId"`**: Lazy-loads child routes from `./features/entity/entity.routes` [Confirmed] (`` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/entities.routes.ts|:entityId|#1` ``).

---

#### portals_organization_entities_entity

- **Backend Calls**:
  - `organization-getEntityDashboardStatics`: Called by `OSKEntityService.getEntityDashboardStatics` to fetch raw dashboard counts. This is a local claim about the backend integration. (Inferred, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|organization-getEntityDashboardStatics|#1` ``)
- **Routes**:
  - `entity.routes.ts` defines the following route structure under an entity boundary:
    - `""` (empty path): Lazy-loads `OSKEntityDashboardComponent`. (Confirmed, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts||#1` ``)
    - `"properties"`: Lazy-loads child routes from `./features/properties/properties.routes`. (Confirmed, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|properties|#1` ``)
    - `"suppliers"`: Lazy-loads child routes from `./features/suppliers/suppliers.routes`, guarded by `user-role.guard`. (Confirmed, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|suppliers|#1` ``)
    - `"users"`: Lazy-loads child routes from `../entity/features/properties/features/users/organization-users.routes`, guarded by `user-role.guard`. (Confirmed, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|users|#1` ``)
    - `"message-center"`: Lazy-loads child routes from `./features/message-center/message-center.routes`, guarded by `user-role.guard`. (Confirmed, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|message-center|#1` ``)

#### portals_organization_entities_entity_message-center

### Backend Calls (Local Claims)
The service `OSKMessageCenterServiceService` makes the following Firebase HTTPS Callable function calls:
- **`building-getBuildingsByPropertyId`**: Fetches buildings for a property. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|building-getBuildingsByPropertyId|#1` ``
- **`organization-createIntercomCommunication`**: Creates a new intercom communication. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-createIntercomCommunication|#1` ``
- **`organization-deleteIntercomCommunication`**: Deletes an intercom communication. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-deleteIntercomCommunication|#1` ``
- **`organization-getAllIntercomCommunicationsByEntityId`**: Fetches communications by entity ID. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getAllIntercomCommunicationsByEntityId|#1` ``
- **`organization-getAllIntercomCommunicationsByPropertyId`**: Fetches communications by property ID. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getAllIntercomCommunicationsByPropertyId|#1` ``
- **`organization-getAllIntercomCommunicationService`**: Fetches intercom communications for a building. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getAllIntercomCommunicationService|#1` ``
- **`organization-getAllProperties`**: Fetches properties for an organization entity. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getAllProperties|#1` ``
- **`organization-getIntercomCommunicationById`**: Fetches a specific communication by ID. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getIntercomCommunicationById|#1` ``
- **`organization-reformulateCommunicationWithGemini`**: Uses Gemini AI to reformulate communication text. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-reformulateCommunicationWithGemini|#1` ``
- **`organization-updateIntercomCommunication`**: Updates an existing communication. **(Confirmed)** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-updateIntercomCommunication|#1` ``

### Routes
The routes are defined in `message-center.routes.ts`:
- **`""` (Empty Path)**: Lazy-loads `OSKMessageCenterListComponent`. **(Confirmed)** `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/message-center.routes.ts||#1` ``
- **`"details/:messageId"`**: Lazy-loads `OSKMessageCenterDetailsComponent`. **(Confirmed)** `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/message-center.routes.ts|details/:messageId|#1` ``

---

#### portals_organization_entities_entity_properties

### Backend Calls

The following callable functions are invoked locally via `OSKOrganizationPropertyService` using `OSKFirebaseHttpsService`:

- **`organization-getAllProperties`**: Fetches all properties for an organization and entity. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|organization-getAllProperties|#1` ``
- **`organization-createProperty`**: Creates a new property. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|organization-createProperty|#1` ``
- **`organization-getPropertyById`**: Retrieves a specific property by ID. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|organization-getPropertyById|#1` ``
- **`organization-updateProperty`**: Updates an existing property. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|organization-updateProperty|#1` ``
- **`organization-deleteProperty`**: Deletes a property. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|organization-deleteProperty|#1` ``
- **`organization-getPropertyDashboardStatics`**: Fetches dashboard statistics for a property. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|organization-getPropertyDashboardStatics|#1` ``
- **`organization-assigningBuildingToProperty`**: Assigns a building to a property. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|organization-assigningBuildingToProperty|#1` ``

### Routes

The routes are defined in `properties.routes.ts` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts` ``:

- **`""` (empty path)**: Loads `OSKOrganizationPropertiesListComponent` [Confirmed] (line 20)
- **`create`**: Loads `OSKOrganizationPropertiesCreateComponent` [Confirmed] (line 28)
- **`:propertyId/edit`**: Loads `OSKOrganizationPropertiesEditComponent` [Confirmed] (line 35)
- **`:propertyId/property-dashboard`**: Loads `OSKPropertyDashboardComponent` [Confirmed] (line 42)
- **`:propertyId/buildings`**: Lazy-loads child routes from `./features/buildings/organization-buildings.routes` [Confirmed] (line 51)
- **`:propertyId/inhabitants`**: Lazy-loads child routes from `./features/inhabitants/organization-inhabitants.routes` [Confirmed] (line 56)
- **`:propertyId/generalRules`**: Lazy-loads child routes from `./features/general-rules/organization-general-rules.routes` [Confirmed] (line 65)
- **`:propertyId/suppliers`**: Lazy-loads child routes from `../suppliers/suppliers.routes` [Confirmed] (line 74)
- **`:propertyId/message-center`**: Lazy-loads child routes from `../message-center/message-center.routes` [Confirmed] (line 82)
- **`:propertyId/users`**: Lazy-loads child routes from `./features/users/organization-users.routes` [Confirmed] (line 90)

---

#### portals_organization_entities_entity_properties_buildings

### Backend Calls (Firebase Callable Functions)

These local claims represent calls made to Firebase HTTPS functions via `OSKFirebaseHttpsService`:

- **`building-organizationUserCreateBuildingDoor`**: Called by `OSKAddOrganizationBuildingDoorService` to create a new door. (File: `add-organization-building-door.service.ts`, line 35).
- **`building-organizationUserGetBuildingDoorById`**: Called by `OSKAddOrganizationBuildingDoorService` to retrieve a door's details. (File: `add-organization-building-door.service.ts`, line 55).
- **`building-organizationUserUpdateBuildingDoor`**: Called by `OSKAddOrganizationBuildingDoorService` to update an existing door. (File: `add-organization-building-door.service.ts`, line 44).
- **`core-getCountries`**: Called by multiple services to fetch the list of countries. (File: `add-organization-building-door.service.ts` line 29, `add-organization-building-unt.service.ts` line 29, `add-organization-building.service.ts` line 32).
- **`building-organizationUserCreateBuildingUnit`**: Called by `OSKAddOrganizationBuildingUntService` to create a unit. (File: `add-organization-building-unt.service.ts`, line 35).
- **`building-organizationUserGetBuildingUnitById`**: Called by `OSKAddOrganizationBuildingUntService` to retrieve unit details. (File: `add-organization-building-unt.service.ts`, line 55).
- **`building-organizationUserUpdateBuildingUnit`**: Called by `OSKAddOrganizationBuildingUntService` to update a unit. (File: `add-organization-building-unt.service.ts`, line 44).
- **`building-createBuilding`**: Called by `OSKAddOrganizationBuildingService` to create a building. (File: `add-organization-building.service.ts`, line 38).
- **`building-updateBuilding`**: Called by `OSKAddOrganizationBuildingService` to update a building. (File: `add-organization-building.service.ts`, line 47).
- **`organization-getOrganizationBuildingById`**: Called by `OSKAddOrganizationBuildingService` to retrieve building details. (File: `add-organization-building.service.ts`, line 57).
- **`building-getBuildingById`**: Called by `OSKOrganizationBuildingDetailsService` to fetch building details. (File: `organization-building-details.service.ts`, line 30).
- **`building-organizationUserGetAllBuildingDoors`**: Called by `OSKOrganizationBuildingDoorsListService` to fetch doors. (File: `organization-building-doors-list.service.ts`, line 30).
- **`building-organizationUserGetAllBuildingUnits`**: Called by `OSKOrganizationBuildingUnitsListService` to fetch units. (File: `organization-building-units-list.service.ts`, line 30).
- **`building-getBuildingsByPropertyId`**: Called by `OSKOrganizationBuildingsListService` to fetch buildings. (File: `organization-buildings-list.service.ts`, line 33).

### Routes

The routes are defined in `organization-buildings.routes.ts` (File: `organization-buildings.routes.ts`):

- **`""`** (Empty path): Lazy-loads `OSKOrganizationBuildingsListComponent`. (Line 18).
- **`"add"`**: Lazy-loads `OSKAddOrganizationBuildingComponent`. (Line 26).
- **`":buildingId"`**: Lazy-loads `OSKOrganizationBuildingDetailsComponent`. (Line 34).
- **`":buildingId/edit"`**: Lazy-loads `OSKAddOrganizationBuildingComponent`. (Line 42).
- **`":buildingId/units"`**: Lazy-loads `OSKOrganizationBuildingUnitsListComponent`. (Line 50).
- **`":buildingId/units/add"`**: Lazy-loads `OSKAddOrganizationBuildingUnitComponent`. (Line 57).
- **`":buildingId/units/:unitId/edit"`**: Lazy-loads `OSKAddOrganizationBuildingUnitComponent`. (Line 65).
- **`":buildingId/doors"`**: Lazy-loads `OSKOrganizationBuildingDoorsListComponent`. (Line 73).
- **`":buildingId/doors/add"`**: Lazy-loads `OSKAddOrganizationBuildingDoorComponent`. (Line 80).
- **`":buildingId/doors/:doorId/edit"`**: Lazy-loads `OSKAddOrganizationBuildingDoorComponent`. (Line 88).

---

#### portals_organization_entities_entity_properties_general-rules

- **Backend Calls**:
  - `building-getBuildingSettings`: Local claim of calling a Firebase HTTPS callable function to retrieve settings for a specific building `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|building-getBuildingSettings|#1` ``.
  - `building-updateBuildingSettings`: Local claim of calling a Firebase HTTPS callable function to save updated settings `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|building-updateBuildingSettings|#1` ``.
- **Routes**:
  - A route is defined in `organization-general-rules.routes.ts` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/organization-general-rules.routes.ts||#1` ``.
  - It lazy-loads `OSKListSettingsComponent` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/organization-general-rules.routes.ts|import('./features/list-settings/list-settings.component').then|anon|(c) => c.OSKListSettingsComponent|#1` ``.

#### portals_organization_entities_entity_properties_inhabitants

### Backend Calls (Local, Unverified Claims)
The service `OSKOrganizationInhabitantService` invokes the following Firebase HTTPS callable functions:
- **`core-getCountries`**: Retrieves the list of supported countries `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|core-getCountries|#1` ``.
- **`organization-getallResidentsByPropertyId`**: Fetches all residents for a given property `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-getallResidentsByPropertyId|#1` ``.
- **`organization-getOrganizationResidentDetails`**: Fetches detailed information for a specific resident `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-getOrganizationResidentDetails|#1` ``.
- **`organization-createOrganizationResident`**: Registers a new resident `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-createOrganizationResident|#1` ``.
- **`organization-updateOrganizationResident`**: Updates an existing resident's profile `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-updateOrganizationResident|#1` ``.
- **`organization-deleteResident`**: Deletes a resident record `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-deleteResident|#1` ``.
- **`organization-sendOnboardingActivationCodeEmail`**: Sends an onboarding email containing the activation code `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-sendOnboardingActivationCodeEmail|#1` ``.

### Routes
The capability defines the following routes in `organization-inhabitants.routes.ts`:
- **`inhabitant-list`**: Lazy-loads `OSKOrganizationInhabitantsListComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/organization-inhabitants.routes.ts|inhabitant-list|#1` ``.
- **`details/:residentId`**: Lazy-loads `OSKOrganizationInhabitantDetailsComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/organization-inhabitants.routes.ts|details/:residentId|#1` ``.

---

#### portals_organization_entities_entity_properties_users

### Backend Calls (Firebase Callable Functions)
The following local claims are made about backend integrations via `OSKFirebaseHttpsService` [Confirmed]:
- **`organization-createPMPUserWithInvitation`**: Called to create a user and send an invitation [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|organization-createPMPUserWithInvitation|#1` ``].
- **`organization-getOrganizationUserRoles`**: Retrieves roles assigned to a user [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|organization-getOrganizationUserRoles|#1` ``].
- **`organization-inviteUser`**: Sends a standard user invitation [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|organization-inviteUser|#1` ``].
- **`settings-getAllRoles`**: Retrieves all system roles [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|settings-getAllRoles|#1` ``].
- **`settings-getOrganizationCompositeRoles`**: Retrieves organization-specific composite roles [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|settings-getOrganizationCompositeRoles|#1` ``].
- **`organization-getOrganizationInviteeByEmail`**: Retrieves invitation details by email [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/services/organization-user-details/organization-user-details.service.ts|organization-getOrganizationInviteeByEmail|#1` ``].
- **`organization-getOrganizationUserById`**: Retrieves user details by ID [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/services/organization-user-details/organization-user-details.service.ts|organization-getOrganizationUserById|#1` ``].
- **`organization-updateOrganizationUserRoles`**: Updates roles for an existing user [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/services/organization-user-details/organization-user-details.service.ts|organization-updateOrganizationUserRoles|#1` ``].
- **`organization-cancelUserInvitation`**: Cancels a pending invitation [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service.ts|organization-cancelUserInvitation|#1` ``].
- **`organization-deleteOrganizationUser`**: Deletes a user from the organization [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service.ts|organization-deleteOrganizationUser|#1` ``].
- **`organization-getAllOrganizationUsersAndInvitees`**: Retrieves the combined list of active users and pending invitees [Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service.ts|organization-getAllOrganizationUsersAndInvitees|#1` ``].

### Routes
Defined in `organization-users.routes.ts` [Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts` ``]:
- **`""`**: Lazy-loads `OSKOrganizationUsersListComponent` [Confirmed, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts||#1` ``].
- **`"invite"`**: Lazy-loads `OSKInviteOrganizationUserComponent` [Confirmed, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts|invite|#1` ``].
  - **Guards**: Protected by `userRoleGuard` with role requirement `v1.org.user.admin` [Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts` (lines 27-28) ``].
- **`":userId"`**: Lazy-loads `OSKOrganizationUserDetailsComponent` [Confirmed, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts|:userId|#1` ``].
- **`"invitations/:userEmail"`**: Lazy-loads `OSKOrganizationUserDetailsComponent` [Confirmed, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts|invitations/:userEmail|#1` ``].

---

#### portals_organization_entities_entity_suppliers

### Backend Calls

The capability interacts with the backend via the following Firebase HTTPS Callable functions (local claims, unverified integrations):

- **`supplier-getAllSuppliers`**: Retrieves all suppliers for an organization. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getAllSuppliers|#1` ``.
- **`supplier-getSupplier`**: Retrieves a specific supplier's profile. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getSupplier|#1` ``.
- **`supplier-getById`**: Alternative endpoint to fetch a supplier by ID. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getById|#1` ``.
- **`supplier-createSupplier`**: Onboards a new supplier. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-createSupplier|#1` ``.
- **`supplier-updateSupplier`**: Updates supplier profile details. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-updateSupplier|#1` ``.
- **`supplier-deleteSupplier`**: Deletes a supplier. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-deleteSupplier|#1` ``.
- **`supplier-getAllSupplierStaff`**: Retrieves all staff members for a supplier. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getAllSupplierStaff|#1` ``.
- **`supplier-getStaffMember`**: Retrieves details of a specific staff member. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getStaffMember|#1` ``.
- **`supplier-addSupplierStaff`**: Adds a new staff member to a supplier. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-addSupplierStaff|#1` ``.
- **`supplier-updateSupplierStaff`**: Updates a staff member's details. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-updateSupplierStaff|#1` ``.
- **`supplier-deleteSupplierStaff`**: Deletes a staff member. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-deleteSupplierStaff|#1` ``.
- **`supplier-createSupplierStaffAccess`**: Grants door access to selected staff members. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-createSupplierStaffAccess|#1` ``.
- **`supplier-deleteSupplierStaffAccess`**: Revokes door access for a staff member. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-deleteSupplierStaffAccess|#1` ``.
- **`organization-getBuildingsByEntityId`**: Retrieves buildings associated with an entity. **Confirmed** `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|organization-getBuildingsByEntityId|#1` ``.

### Routes

The capability defines the following routing structure:

- **`` (empty path)**: Lazy-loads `OSKSuppliersListComponent`. **Confirmed** `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/suppliers.routes.ts||#1` ``.
- **`:id/details`**: Lazy-loads `OSKSuppliersDetailsComponent`. **Confirmed** `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/suppliers.routes.ts|:id/details|#1` ``.

---

#### portals_organization_onboarding-cards

### Backend Calls (Local, Unverified Claims)

The service `OSKOnboardingCardsService` invokes the following Firebase HTTPS callable functions:

- **`core-getCountries`**: Fetches the list of supported countries `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|core-getCountries|#1` ``.
- **`organization-getAllOrganizationBuildingsForOnboardingCards`**: Retrieves buildings associated with the organization for onboarding purposes `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-getAllOrganizationBuildingsForOnboardingCards|#1` ``.
- **`organization-createOnboardingDocuments`**: Submits a payload to batch-create onboarding documents `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-createOnboardingDocuments|#1` ``.
- **`organization-getAllOnboardingDocuments`**: Retrieves all onboarding documents for a given organization ID `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-getAllOnboardingDocuments|#1` ``.
- **`organization-getOnboardingDocumentById`**: Fetches a specific onboarding document by its ID `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-getOnboardingDocumentById|#1` ``.
- **`organization-updateOnboardingDocument`**: Updates an existing onboarding document `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-updateOnboardingDocument|#1` ``.
- **`organization-verifyActivationCodeByOrganizationAdmin`**: Verifies an activation code on behalf of an organization administrator `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-verifyActivationCodeByOrganizationAdmin|#1` ``.

### Routes

The routes are defined in `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts||#1` ``:

- **`""` (Default)**: Lazy-loads `OSKOnboardingCardsListComponent` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts|import|anon|'./features/onboarding-cards-list/onboarding-cards-list.component'|#1` ``.
- **`"add"`**: Lazy-loads `OSKAddOnboardingCardsComponent` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts|import|anon|'./features/add-onboarding-cards/add-onboarding-cards.component'|#1` ``.
- **`"create"`**: Lazy-loads `OSKCreateOnboardingCardsComponent` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts|import|anon|'./features/create-onboarding-cards/create-onboarding-cards.component'|#1` ``.
- **`"edit/:onboardingId"`**: Lazy-loads `OSKEditOnboardingCardComponent` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts|import|anon|'./features/edit-onboarding-card/edit-onboarding-card.component'|#1` ``.

---

#### portals_user

#### Backend Calls
- **`core-getCountries`** [Inferred]: Local claim of calling a Firebase HTTPS callable function to fetch countries `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|core-getCountries|#1` ``.
- **`user-updateUserProfileAndPhoneNumber`** [Inferred]: Local claim of calling a Firebase HTTPS callable function to update profile and phone number `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|user-updateUserProfileAndPhoneNumber|#1` ``.

#### Routes
All routes are defined in `hosting/web-app/src/app/features/portals/user/user.routes.ts`:
- **`account`** [Confirmed]: Lazy-loads `OSKAccountComponent` from `./account/account.component` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/user.routes.ts|account|#1` ``.
- **`organizations`** [Confirmed]: Lazy-loads child routes from `./organizations/organizations.routes` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/user.routes.ts|organizations|#1` ``.
- **`invitations`** [Confirmed]: Lazy-loads child routes from `./invitations/invitations.routes` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/user.routes.ts|invitations|#1` ``.
- **`notifications`** [Confirmed]: Lazy-loads `OSKNotificationsComponent` from `./notifications/notifications.component` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/user.routes.ts|notifications|#1` ``.
- **`settings`** [Confirmed]: Lazy-loads `OSKSettingsComponent` from `./settings/settings.component` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/user.routes.ts|settings|#1` ``.

---

#### portals_user_invitations

#### Backend Calls (Local Claims)
The service `OSKSendUserInvitationService` interacts with the backend using the `OSKFirebaseHttpsService` wrapper [Confirmed, `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|inject|anon|OSKFirebaseHttpsService|#1`]:
- **`user-getCurrentUserUnits`**: Called to retrieve the units associated with the current user [Confirmed, `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|user-getCurrentUserUnits|#1`].
  - *Payload*: `{ userId: string }` [Confirmed, `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|this.firebaseHttps.call|getUserUnits|'user-getCurrentUserUnits',{ userId: userId }|#1`].
- **`user-createUserInvitation`**: Called to submit the completed invitation request [Confirmed, `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|user-createUserInvitation|#1`].
  - *Payload*: `OSKCreateUserInvitationRequestData` [Confirmed, `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|this.firebaseHttps.call|sendInvitation|'user-createUserInvitation',invitationRequestData|#1`].

#### Routes
- **`send`**: A route defined in `invitations.routes.ts` [Confirmed, `angular_route|features|hosting/web-app/src/app/features/portals/user/invitations/invitations.routes.ts|send|#1`].
  - *Path*: `send`
  - *Lazy-loaded Component*: `OSKSendUserInvitationComponent` [Confirmed, `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/invitations.routes.ts|import('./send-user-invitation/send-user-invitation.component').then|anon|(c) => c.OSKSendUserInvitationComponent|#1`].
  - *Guards*: None explicitly declared on this specific route definition [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/invitations.routes.ts` (line 4)].

---

#### portals_user_organizations

### Backend Calls
The following are local claims about backend integrations made by `OSKOrganizationInvitationsService` using `OSKFirebaseHttpsService`: [Confirmed]
- **`user-getCurrentUserOrganizationInvitations`**: Fetches the current user's invitations. [Confirmed] (via `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|user-getCurrentUserOrganizationInvitations|#1` ``)
- **`user-userAcceptsOrganizationInvite`**: Accepts an invitation. [Confirmed] (via `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|user-userAcceptsOrganizationInvite|#1` ``)
  - **Payload**: `{ userId, organizationId, isApproved: true }` (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|this.firebaseHttps.call|acceptInvitation|'user-userAcceptsOrganizationInvite',data|#1` ``)
- **`user-userRejectsOrganizationInvite`**: Rejects an invitation. [Confirmed] (via `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|user-userRejectsOrganizationInvite|#1` ``)
  - **Payload**: `{ userId, organizationId, isApproved: true }` (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|this.firebaseHttps.call|rejectInvitation|'user-userRejectsOrganizationInvite',data|#1` ``)

### Routes
The capability defines routes under `hosting/web-app/src/app/features/portals/user/organizations/organizations.routes.ts`: [Confirmed]
- **`pending`**: Lazy-loads the pending organizations routes file `./pending-organizations/pending-organizations.routes`. [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/user/organizations/organizations.routes.ts|pending|#1` ``)
- **`invitations`**: Lazy-loads the component `OSKOrganizationInvitationsComponent` from `./organization-invitations/organization-invitations.component`. [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/user/organizations/organizations.routes.ts|invitations|#1` ``)

#### portals_user_organizations_pending-organizations

### Backend Calls
The services in this capability make the following local claims about calling Firebase HTTPS callable functions [Confirmed]:
- **`core-getCountries`**: Called by `OSKAddOrganizationService.getCountries()` to fetch the list of available countries `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts|core-getCountries|#1` ``.
- **`organization-createPendingOrganization`**: Called by `OSKAddOrganizationService.addPendingOrganization(data)` to submit a new pending organization registration request `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts|organization-createPendingOrganization|#1` ``.
- **`organization-getCurrentUserPendingOrganizations`**: Called by `OSKUserPendingOrganizationsService.getCurrentUserPendingOrganizations()` to retrieve the pending organizations list for the current user `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/services/pending-organizations/pending-organizations.service.ts|organization-getCurrentUserPendingOrganizations|#1` ``.

### Routes
Routes are defined in `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations.routes.ts` `` `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations.routes.ts` (line 1) ``:
- **Path `""` (Root)**: Lazy-loads `OSKUserPendingOrganizationsComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations.routes.ts||#1` ``.
- **Path `"add"`**: Lazy-loads `OSKAddOrganizationComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations.routes.ts|add|#1` ``.

---