### 0. Generation Metadata

- runId: 20260828_150039-8345d222
- generatedAt: 2026-08-29T06:00:21.054Z
- repoName: angular-app-oskey-io
- targetModule: features
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### authentication

### Backend Calls (Firebase Callable Functions)

*Note: These are local, unverified claims about the backend functions called by this capability.*

- **core-exchangeAuth0Token**: Exchanges an Auth0 ID token for a Firebase custom token. (Cite: `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|core-exchangeAuth0Token|#1` ``)
- **core-getCountriesNoAuth**: Retrieves a list of countries without requiring authentication. (Cite: `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|core-getCountriesNoAuth|#1` ``)
- **core-getMfaPhoneNumber**: Retrieves the MFA phone number associated with a user ID. (Cite: `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|core-getMfaPhoneNumber|#1` ``)
- **organization-processPMPInvitation**: Processes a pending Partner Management Portal invitation. (Cite: `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|organization-processPMPInvitation|#1` ``)
- **organization-queryPMPInvitations**: Queries pending PMP invitations for the user. (Cite: `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|organization-queryPMPInvitations|#1` ``)
- **user-updateUserProfileAndPhoneNumber**: Updates the user's public profile and phone number. (Cite: `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|user-updateUserProfileAndPhoneNumber|#1` ``)

### Routes

Defined in `hosting/web-app/src/app/features/authentication/auth.routes.ts`:

- **`''` (empty path)**: Lazy-loads `OSKSignInComponent`. (Cite: `` `angular_route|features|hosting/web-app/src/app/features/authentication/auth.routes.ts||#1` ``)
- **`'actionCode'`**: Lazy-loads `OSKAuthActionComponent`. (Cite: `` `angular_route|features|hosting/web-app/src/app/features/authentication/auth.routes.ts|actionCode|#1` ``)
- **`'verifyEmail'`**: Lazy-loads `OSKVerifyEmailComponent`. (Cite: `` `angular_route|features|hosting/web-app/src/app/features/authentication/auth.routes.ts|verifyEmail|#1` ``)
- **`'verifyCode'`**: Lazy-loads `OSKSecondFactorAuthentificationComponent`. (Cite: `` `angular_route|features|hosting/web-app/src/app/features/authentication/auth.routes.ts|verifyCode|#1` ``)

---

#### home

- **Backend Calls**: None evidenced. (Unknown)
- **Routes**: No routing definitions are directly evidenced within this capability pack. (Unknown)

---

#### portals

- **Backend Calls**: No direct `firebase_callable_call` facts are evidenced within this capability pack.
- **Routes**: No direct `angular_route` definitions are owned by this capability pack. It integrates with routing dynamically by subscribing to `Router` events to parse active entity and property IDs. `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts` (lines 109-112) ``

---

#### portals_organization

#### Backend Calls
No Firebase callable functions or backend API calls are evidenced in this capability pack. [Confirmed]

#### Routes
The capability defines the following routes in `hosting/web-app/src/app/features/portals/organization/organization.routes.ts` (line 14):
- **`entities`**: Lazy-loads child routes from `./features/entities/entities.routes` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|entities|#1` ``.
- **`notifications`**: Lazy-loads `OSKNotificationsComponent` from `./features/notifications/notifications.component` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|notifications|#1` ``.
- **`settings`**: Lazy-loads `OSKSettingsComponent` from `./features/settings/settings.component` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|settings|#1` ``.

---

#### portals_organization_entities

### Backend Calls (Local Claims)

The `OSKOrganizationEntitiesService` invokes the following Firebase HTTPS callable functions:

- **`organization-createEntity`**: Dispatched to create a new entity `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|organization-createEntity|#1` ``.
- **`organization-getEntityById`**: Dispatched to fetch a specific entity by its ID `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|organization-getEntityById|#1` ``.
- **`organization-getAllEntities`**: Dispatched to fetch all entities associated with an organization `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|organization-getAllEntities|#1` ``.
- **`organization-updateEntity`**: Dispatched to update an existing entity's properties `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|organization-updateEntity|#1` ``.
- **`organization-deleteEntity`**: Dispatched to delete an entity `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|organization-deleteEntity|#1` ``.

### Routes

The routing configuration is defined in `hosting/web-app/src/app/features/portals/organization/features/entities/entities.routes.ts`:

- **Path `""` (Dashboard)**: Lazy-loads the `OSKEntitiesDashboardComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/entities.routes.ts||#1` ``.
- **Path `":entityId"` (Entity Details)**: Lazy-loads child routes from `./features/entity/entity.routes` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/entities.routes.ts|:entityId|#1` ``.

---

#### portals_organization_entities_entity

- **Backend Calls**:
  - **`organization-getEntityDashboardStatics`**: A local, unverified claim representing a Firebase HTTPS Callable function call. It is invoked with parameters `{ organizationId, entityId }` to retrieve dashboard statistics. [Confirmed] (via `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|organization-getEntityDashboardStatics|#1` `` and `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|this.firebaseHttps.call|getEntityDashboardStatics|'organization-getEntityDashboardStatics',{ organizationId, entityId }|#1` ``)

- **Routes**:
  The route configuration file `entity.routes.ts` defines the following paths:
  - **`""` (Root)**: Lazy-loads the `OSKEntityDashboardComponent`. [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts||#1` `` and `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|import('./features/entity-dashboard/entity-dashboard.component').then|anon|(c) => c.OSKEntityDashboardComponent|#1` ``)
  - **`"properties"`**: Lazy-loads the properties submodule routes from `./features/properties/properties.routes`. [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|properties|#1` `` and `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|import('./features/properties/properties.routes').then|anon|(r) => r.routes|#1` ``)
  - **`"suppliers"`**: Lazy-loads the suppliers submodule routes from `./features/suppliers/suppliers.routes`. It is protected by `userRoleGuard` requiring the permission `v1.org.suppliers.admin`. [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|suppliers|#1` ``, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|import('./features/suppliers/suppliers.routes').then|anon|(r) => r.routes|#1` ``, and `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|v1.org.suppliers.admin|#1` ``)
  - **`"users"`**: Lazy-loads the organization users routes from `../entity/features/properties/features/users/organization-users.routes`. It is protected by `userRoleGuard` requiring the permission `v1.org.user.admin`. [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|users|#1` ``, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|import('../entity/features/properties/features/users/organization-users.routes').then|anon|(r) => r.routes|#1` ``, and `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|v1.org.user.admin|#1` ``)
  - **`"message-center"`**: Lazy-loads the message center routes from `./features/message-center/message-center.routes`. It is protected by `userRoleGuard` requiring the permission `v1.org.communications.admin`. [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|message-center|#1` ``, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|import('./features/message-center/message-center.routes').then|anon|(r) => r.routes|#1` ``, and `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|v1.org.communications.admin|#1` ``)

---

#### portals_organization_entities_entity_message-center

### Backend Calls (Firebase Callable Functions)

The service `OSKMessageCenterServiceService` makes the following local claims about backend integrations:

- **`building-getBuildingsByPropertyId`**: Fetches buildings associated with a property. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|building-getBuildingsByPropertyId|#1` ``
- **`organization-createIntercomCommunication`**: Creates a new intercom communication. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-createIntercomCommunication|#1` ``
- **`organization-deleteIntercomCommunication`**: Deletes an existing communication. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-deleteIntercomCommunication|#1` ``
- **`organization-getAllIntercomCommunicationsByEntityId`**: Retrieves all communications for an entity. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getAllIntercomCommunicationsByEntityId|#1` ``
- **`organization-getAllIntercomCommunicationsByPropertyId`**: Retrieves all communications for a property. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getAllIntercomCommunicationsByPropertyId|#1` ``
- **`organization-getAllIntercomCommunicationService`**: Retrieves all communications for a building. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getAllIntercomCommunicationService|#1` ``
- **`organization-getAllProperties`**: Retrieves properties associated with an entity. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getAllProperties|#1` ``
- **`organization-getIntercomCommunicationById`**: Retrieves details of a specific communication. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-getIntercomCommunicationById|#1` ``
- **`organization-reformulateCommunicationWithGemini`**: Reformulates message content using Gemini AI. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-reformulateCommunicationWithGemini|#1` ``
- **`organization-updateIntercomCommunication`**: Updates an existing communication. `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|organization-updateIntercomCommunication|#1` ``

### Routes

The routing configuration is defined in `message-center.routes.ts`:

- **Path: `""`**  
  Lazy-loads `OSKMessageCenterListComponent`. (Confirmed) `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/message-center.routes.ts||#1` ``
- **Path: `"details/:messageId"`**  
  Lazy-loads `OSKMessageCenterDetailsComponent`. (Confirmed) `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/message-center.routes.ts|details/:messageId|#1` ``

---

#### portals_organization_entities_entity_properties

### Backend Calls (Firebase Callable Functions)
The service `OSKOrganizationPropertyService` invokes the following backend functions via `OSKFirebaseHttpsService`: [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts` ``
- **`organization-getAllProperties`**: Fetches all properties for a given organization and entity.
- **`organization-createProperty`**: Creates a new property.
- **`organization-getPropertyById`**: Retrieves a specific property's details.
- **`organization-updateProperty`**: Updates an existing property.
- **`organization-deleteProperty`**: Deletes a property.
- **`organization-getPropertyDashboardStatics`**: Retrieves dashboard statistics for a property.
- **`organization-assigningBuildingToProperty`**: Assigns a building to a property.

### Routes
The routes are defined in `properties.routes.ts`: [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts` ``

| Path | Lazy-Loaded Component / Child Routes | Guards |
| :--- | :--- | :--- |
| `""` | `OSKOrganizationPropertiesListComponent` | None |
| `"create"` | `OSKOrganizationPropertiesCreateComponent` | None |
| `":propertyId/edit"` | `OSKOrganizationPropertiesEditComponent` | None |
| `":propertyId/property-dashboard"` | `OSKPropertyDashboardComponent` | None |
| `":propertyId/buildings"` | `./features/buildings/organization-buildings.routes` | `UserRoleGuard` |
| `":propertyId/inhabitants"` | `./features/inhabitants/organization-inhabitants.routes` | `UserRoleGuard` |
| `":propertyId/generalRules"` | `./features/general-rules/organization-general-rules.routes` | `UserRoleGuard` |
| `":propertyId/suppliers"` | `../suppliers/suppliers.routes` | `UserRoleGuard` |
| `":propertyId/message-center"` | `../message-center/message-center.routes` | `UserRoleGuard` |
| `":propertyId/users"` | `./features/users/organization-users.routes` | `UserRoleGuard` |

---

#### portals_organization_entities_entity_properties_buildings

### Backend Calls
The services in this capability make the following HTTPS callable function requests to the Firebase backend. These are local, unverified claims made by the frontend code:

- **`core-getCountries`**: Fetches a list of supported countries. Called by `OSKAddOrganizationBuildingDoorService`, `OSKAddOrganizationBuildingUntService`, and `OSKAddOrganizationBuildingService`. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts|core-getCountries|#1` ``).
- **`building-organizationUserCreateBuildingDoor`**: Creates a new door for a building. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts|building-organizationUserCreateBuildingDoor|#1` ``).
- **`building-organizationUserGetBuildingDoorById`**: Retrieves details of a specific building door. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts|building-organizationUserGetBuildingDoorById|#1` ``).
- **`building-organizationUserUpdateBuildingDoor`**: Updates an existing building door. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts|building-organizationUserUpdateBuildingDoor|#1` ``).
- **`building-organizationUserCreateBuildingUnit`**: Creates a new unit for a building. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/services/add-organization-building-unt/add-organization-building-unt.service.ts|building-organizationUserCreateBuildingUnit|#1` ``).
- **`building-organizationUserGetBuildingUnitById`**: Retrieves details of a specific building unit. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/services/add-organization-building-unt/add-organization-building-unt.service.ts|building-organizationUserGetBuildingUnitById|#1` ``).
- **`building-organizationUserUpdateBuildingUnit`**: Updates an existing building unit. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/services/add-organization-building-unt/add-organization-building-unt.service.ts|building-organizationUserUpdateBuildingUnit|#1` ``).
- **`building-createBuilding`**: Creates a new building. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/services/add-organization-building/add-organization-building.service.ts|building-createBuilding|#1` ``).
- **`building-updateBuilding`**: Updates an existing building. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/services/add-organization-building/add-organization-building.service.ts|building-updateBuilding|#1` ``).
- **`organization-getOrganizationBuildingById`**: Retrieves a building by its ID. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/services/add-organization-building/add-organization-building.service.ts|organization-getOrganizationBuildingById|#1` ``).
- **`building-getBuildingById`**: Retrieves detailed building metrics (including unit and door counts). (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/services/organization-building-details/organization-building-details.service.ts|building-getBuildingById|#1` ``).
- **`building-organizationUserGetAllBuildingDoors`**: Retrieves all doors for a building. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/services/organization-building-doors-list/organization-building-doors-list.service.ts|building-organizationUserGetAllBuildingDoors|#1` ``).
- **`building-organizationUserGetAllBuildingUnits`**: Retrieves all units for a building. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/services/organization-building-units-list/organization-building-units-list.service.ts|building-organizationUserGetAllBuildingUnits|#1` ``).
- **`building-getBuildingsByPropertyId`**: Retrieves all buildings associated with a property. (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/services/organization-buildings-list/organization-buildings-list.service.ts|building-getBuildingsByPropertyId|#1` ``).

### Routes
The routing configuration is defined in `organization-buildings.routes.ts` (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings.routes.ts` ``):

| Path | Lazy-Loaded Component | Guards |
|---|---|---|
| `""` | `OSKOrganizationBuildingsListComponent` | None |
| `"add"` | `OSKAddOrganizationBuildingComponent` | `AdminGuard` |
| `":buildingId"` | `OSKOrganizationBuildingDetailsComponent` | None |
| `":buildingId/edit"` | `OSKAddOrganizationBuildingComponent` | `AdminGuard` |
| `":buildingId/units"` | `OSKOrganizationBuildingUnitsListComponent` | None |
| `":buildingId/units/add"` | `OSKAddOrganizationBuildingUnitComponent` | `AdminGuard` |
| `":buildingId/units/:unitId/edit"` | `OSKAddOrganizationBuildingUnitComponent` | `AdminGuard` |
| `":buildingId/doors"` | `OSKOrganizationBuildingDoorsListComponent` | None |
| `":buildingId/doors/add"` | `OSKAddOrganizationBuildingDoorComponent` | `AdminGuard` |
| `":buildingId/doors/:doorId/edit"` | `OSKAddOrganizationBuildingDoorComponent` | `AdminGuard` |

---

#### portals_organization_entities_entity_properties_general-rules

### Backend Calls
- **`building-getBuildingSettings`**: Fetches building settings by ID. [Confirmed] (via `OSKBuildingSettingsService.getBuildingSettingsById` `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|building-getBuildingSettings|#1` ``)
- **`building-updateBuildingSettings`**: Updates building settings. [Confirmed] (via `OSKBuildingSettingsService.updateBuildingSettings` `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|building-updateBuildingSettings|#1` ``)

### Routes
- **`organization-general-rules.routes.ts`**: Defines a lazy-loaded route mapping to `OSKListSettingsComponent`. [Confirmed] `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/organization-general-rules.routes.ts||#1` ``

---

#### portals_organization_entities_entity_properties_inhabitants

### Backend Calls (Local, Unverified Claims)
The service `OSKOrganizationInhabitantService` invokes the following Firebase HTTPS callable functions (**Confirmed** [`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService` ``]):
- **`core-getCountries`**: Retrieves a list of supported countries (**Confirmed** [`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|core-getCountries|#1` ``]).
- **`organization-createOrganizationResident`**: Submits a payload to create a new resident (**Confirmed** [`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-createOrganizationResident|#1` ``]).
- **`organization-deleteResident`**: Deletes a resident record by organization and resident IDs (**Confirmed** [`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-deleteResident|#1` ``]).
- **`organization-getallResidentsByPropertyId`**: Fetches all residents associated with a property ID (**Confirmed** [`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-getallResidentsByPropertyId|#1` ``]).
- **`organization-getOrganizationResidentDetails`**: Fetches detailed profile information for a resident (**Confirmed** [`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-getOrganizationResidentDetails|#1` ``]).
- **`organization-sendOnboardingActivationCodeEmail`**: Sends an onboarding email containing an activation code (**Confirmed** [`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-sendOnboardingActivationCodeEmail|#1` ``]).
- **`organization-updateOrganizationResident`**: Updates an existing resident's profile (**Confirmed** [`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-updateOrganizationResident|#1` ``]).

### Routes
The capability defines the following routes in `organization-inhabitants.routes.ts` (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/organization-inhabitants.routes.ts` (lines 17-24) ``]):
- **`inhabitant-list`**: Lazy-loads `OSKOrganizationInhabitantsListComponent` (**Confirmed** [`` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/organization-inhabitants.routes.ts|inhabitant-list|#1` ``]).
- **`details/:residentId`**: Lazy-loads `OSKOrganizationInhabitantDetailsComponent` (**Confirmed** [`` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/organization-inhabitants.routes.ts|details/:residentId|#1` ``]).

---

#### portals_organization_entities_entity_properties_users

### Backend Calls (Local, Unverified Claims)
The services in this capability invoke the following Firebase HTTPS callable functions:
- **`organization-createPMPUserWithInvitation`**: Creates a new user invitation. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|organization-createPMPUserWithInvitation|#1` ``).
- **`organization-getOrganizationUserRoles`**: Retrieves roles assigned to a user. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|organization-getOrganizationUserRoles|#1` ``).
- **`organization-inviteUser`**: Invites a user to the organization. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|organization-inviteUser|#1` ``).
- **`settings-getAllRoles`**: Fetches all system roles. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|settings-getAllRoles|#1` ``).
- **`settings-getOrganizationCompositeRoles`**: Fetches composite organization roles. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|settings-getOrganizationCompositeRoles|#1` ``).
- **`organization-getOrganizationInviteeByEmail`**: Fetches details of a pending invitee by email. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/services/organization-user-details/organization-user-details.service.ts|organization-getOrganizationInviteeByEmail|#1` ``).
- **`organization-getOrganizationUserById`**: Fetches an active user's details by ID. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/services/organization-user-details/organization-user-details.service.ts|organization-getOrganizationUserById|#1` ``).
- **`organization-updateOrganizationUserRoles`**: Updates roles for an active user. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/services/organization-user-details/organization-user-details.service.ts|organization-updateOrganizationUserRoles|#1` ``).
- **`organization-cancelUserInvitation`**: Cancels a pending invitation. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service.ts|organization-cancelUserInvitation|#1` ``).
- **`organization-deleteOrganizationUser`**: Deletes an active organization user. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service.ts|organization-deleteOrganizationUser|#1` ``).
- **`organization-getAllOrganizationUsersAndInvitees`**: Fetches the combined list of active users and pending invitees. **Confirmed** (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service.ts|organization-getAllOrganizationUsersAndInvitees|#1` ``).

### Routes
Defined in `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts`:
- **`""`**: Lazy-loads `OSKOrganizationUsersListComponent`. **Confirmed** (`` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts||#1` ``).
- **`"invite"`**: Lazy-loads `OSKInviteOrganizationUserComponent`. **Confirmed** (`` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts|invite|#1` ``).
- **`":userId"`**: Lazy-loads `OSKOrganizationUserDetailsComponent`. **Confirmed** (`` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts|:userId|#1` ``).
- **`"invitations/:userEmail"`**: Lazy-loads `OSKOrganizationUserDetailsComponent`. **Confirmed** (`` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts|invitations/:userEmail|#1` ``).

---

#### portals_organization_entities_entity_suppliers

### Backend Calls (Firebase Callable Functions)
The following backend integrations are claimed locally by `OSKSuppliersService` (Confirmed, `firebase_callable_call` facts):
- **`organization-getBuildingsByEntityId`**: Retrieves buildings associated with a specific entity ID (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|organization-getBuildingsByEntityId|#1` ``).
- **`supplier-getAllSuppliers`**: Fetches all suppliers for an organization (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getAllSuppliers|#1` ``).
- **`supplier-getSupplier`**: Retrieves a single supplier's details (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getSupplier|#1` ``).
- **`supplier-getById`**: Alternative endpoint to fetch a supplier by ID (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getById|#1` ``).
- **`supplier-createSupplier`**: Registers a new supplier (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-createSupplier|#1` ``).
- **`supplier-updateSupplier`**: Updates supplier details (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-updateSupplier|#1` ``).
- **`supplier-deleteSupplier`**: Deletes a supplier (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-deleteSupplier|#1` ``).
- **`supplier-getAllSupplierStaff`**: Fetches all staff members for a supplier (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getAllSupplierStaff|#1` ``).
- **`supplier-getStaffMember`**: Retrieves details of a specific staff member (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-getStaffMember|#1` ``).
- **`supplier-addSupplierStaff`**: Adds a new staff member to a supplier (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-addSupplierStaff|#1` ``).
- **`supplier-updateSupplierStaff`**: Updates a staff member's details (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-updateSupplierStaff|#1` ``).
- **`supplier-deleteSupplierStaff`**: Deletes a staff member (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-deleteSupplierStaff|#1` ``).
- **`supplier-createSupplierStaffAccess`**: Provisions door access for supplier staff (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-createSupplierStaffAccess|#1` ``).
- **`supplier-deleteSupplierStaffAccess`**: Revokes door access for supplier staff (Confirmed, `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|supplier-deleteSupplierStaffAccess|#1` ``).

### Routes
The capability defines the following routing structure in `suppliers.routes.ts` (Confirmed, `angular_route` facts):
- **`` (Empty Path)**: Lazy-loads `OSKSuppliersListComponent` (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/suppliers.routes.ts` (line 19) ``).
- **`:id/details`**: Lazy-loads `OSKSuppliersDetailsComponent` (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/suppliers.routes.ts` (line 27) ``).

---

#### portals_organization_onboarding-cards

### Backend Calls (Firebase Callable Functions)

The service `OSKOnboardingCardsService` makes the following local, unverified claims about backend integrations via `OSKFirebaseHttpsService` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|OSKOnboardingCardsService` ``:

- **`core-getCountries`**: Retrieves list of countries `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|core-getCountries|#1` ``.
- **`organization-getAllOrganizationBuildingsForOnboardingCards`**: Retrieves buildings for onboarding cards `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-getAllOrganizationBuildingsForOnboardingCards|#1` ``.
- **`organization-createOnboardingDocuments`**: Submits a batch of onboarding documents `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-createOnboardingDocuments|#1` ``.
- **`organization-updateOnboardingDocument`**: Updates a specific onboarding document `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-updateOnboardingDocument|#1` ``.
- **`organization-getAllOnboardingDocuments`**: Retrieves all onboarding documents for an organization `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-getAllOnboardingDocuments|#1` ``.
- **`organization-getOnboardingDocumentById`**: Retrieves a specific onboarding document by ID `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-getOnboardingDocumentById|#1` ``.
- **`organization-verifyActivationCodeByOrganizationAdmin`**: Verifies an activation code `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|organization-verifyActivationCodeByOrganizationAdmin|#1` ``.

### Routes

The routes are defined in `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts` `` `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts` ``:

- **Path: `''`**
  - Lazy-loads `OSKOnboardingCardsListComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts||#1` ``.
- **Path: `'add'`**
  - Lazy-loads `OSKAddOnboardingCardsComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts|add|#1` ``.
- **Path: `'create'`**
  - Lazy-loads `OSKCreateOnboardingCardsComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts|create|#1` ``.
- **Path: `'edit/:onboardingId'`**
  - Lazy-loads `OSKEditOnboardingCardComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts|edit/:onboardingId|#1` ``.

---

#### portals_user

### Backend Calls (Local Claims)
The capability communicates with the backend via HTTPS callable functions:
- **`core-getCountries`**: Called to retrieve the list of supported countries `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|core-getCountries|#1` ``.
- **`user-updateUserProfileAndPhoneNumber`**: Called to update the user's profile information and phone number `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|user-updateUserProfileAndPhoneNumber|#1` ``.

### Routes
The routes are defined in `user.routes.ts` `` `hosting/web-app/src/app/features/portals/user/user.routes.ts` ``:
- **`account`**: Lazy-loads `OSKAccountComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/user.routes.ts|account|#1` ``.
- **`invitations`**: Lazy-loads child routes from `./invitations/invitations.routes` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/user.routes.ts|invitations|#1` ``.
- **`notifications`**: Lazy-loads `OSKNotificationsComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/user.routes.ts|notifications|#1` ``.
- **`organizations`**: Lazy-loads child routes from `./organizations/organizations.routes` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/user.routes.ts|organizations|#1` ``.
- **`settings`**: Lazy-loads `OSKSettingsComponent` `` `angular_route|features|hosting/web-app/src/app/features/portals/user/settings/settings.component.ts|OSKSettingsComponent` ``.

---

#### portals_user_invitations

### Backend Calls
The capability makes local, unverified claims to call the following Firebase HTTPS callable functions:
- **`user-getCurrentUserUnits`**: Called with payload `{ userId: userId }` to fetch the current user's buildings and units [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|this.firebaseHttps.call|getUserUnits|'user-getCurrentUserUnits',{ userId: userId }|#1` ``).
- **`user-createUserInvitation`**: Called with payload `invitationRequestData` to submit the invitation [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|this.firebaseHttps.call|sendInvitation|'user-createUserInvitation',invitationRequestData|#1` ``).

### Routes
- **Path**: `send` [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/user/invitations/invitations.routes.ts|send|#1` ``)
  - **Lazy-loaded Component**: `OSKSendUserInvitationComponent` [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/invitations.routes.ts|import('./send-user-invitation/send-user-invitation.component').then|anon|(c) => c.OSKSendUserInvitationComponent|#1` ``)
  - **Guards**: None evidenced directly on this route [Confirmed] (via `` `hosting/web-app/src/app/features/portals/user/invitations/invitations.routes.ts` ``).

---

#### portals_user_organizations

#### Backend Calls
The `OSKOrganizationInvitationsService` makes the following HTTPS callable function calls (local, unverified claims):
- **user-getCurrentUserOrganizationInvitations**: Fetches the current user's organization invitations. [Confirmed] (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|user-getCurrentUserOrganizationInvitations|#1` ``)
- **user-userAcceptsOrganizationInvite**: Accepts an invitation using the payload containing `userId`, `organizationId`, and `isApproved`. [Confirmed] (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|user-userAcceptsOrganizationInvite|#1` ``)
- **user-userRejectsOrganizationInvite**: Rejects an invitation using the payload containing `userId`, `organizationId`, and `isApproved`. [Confirmed] (`` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|user-userRejectsOrganizationInvite|#1` ``)

#### Routes
The capability defines the following routes in `organizations.routes.ts`:
- **pending**: Lazily loads child routes from `./pending-organizations/pending-organizations.routes`. [Confirmed] (`` `angular_route|features|hosting/web-app/src/app/features/portals/user/organizations/organizations.routes.ts|pending|#1` ``)
- **invitations**: Lazily loads the `OSKOrganizationInvitationsComponent`. [Confirmed] (`` `angular_route|features|hosting/web-app/src/app/features/portals/user/organizations/organizations.routes.ts|invitations|#1` ``)

---

#### portals_user_organizations_pending-organizations

### Backend Calls (Local Claims)
This capability interacts with the backend using HTTPS callable functions via `OSKFirebaseHttpsService`:
- **`core-getCountries`**: Fetches the list of supported countries [Confirmed] (via `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts|core-getCountries|#1` ``).
- **`organization-createPendingOrganization`**: Submits a new pending organization payload [Confirmed] (via `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts|organization-createPendingOrganization|#1` ``).
- **`organization-getCurrentUserPendingOrganizations`**: Retrieves pending organizations for the currently authenticated user [Confirmed] (via `` `firebase_callable_call|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/services/pending-organizations/pending-organizations.service.ts|organization-getCurrentUserPendingOrganizations|#1` ``).

### Routes
The routing configuration is defined in `pending-organizations.routes.ts` `` `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations.routes.ts` ``:
- **`""` (Empty Path)**: Lazy-loads `OSKUserPendingOrganizationsComponent` [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations.routes.ts||#1` ``).
- **`"add"`**: Lazy-loads `OSKAddOrganizationComponent` [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations.routes.ts|add|#1` ``).

---