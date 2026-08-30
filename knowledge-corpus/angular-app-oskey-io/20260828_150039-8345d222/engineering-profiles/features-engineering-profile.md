### 0. Generation Metadata

- **runId**: `20260828_150039-8345d222`
- **generatedAt**: `2026-08-29T05:59:25.662Z`
- **repoName**: `angular-app-oskey-io`
- **targetModule**: `features`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `features` module serves as the primary functional engine of the application, containing all user-facing business capabilities. It encapsulates user authentication, landing pages, and a highly structured portal ecosystem. This ecosystem is organized hierarchically to manage organizations, sub-entities, properties, buildings, units, and doors. Additionally, the module handles domain-specific workflows including resident (inhabitant) management, third-party supplier coordination (with physical access scheduling and pincode generation), intercom/resident communications via a centralized message center, and user onboarding card lifecycles. **[Confirmed]**

### 2. Architectural Position

The `features` module occupies a central, high-level position in the application architecture, orchestrating the core business domains and user interfaces. **[Confirmed]**

- **Parent Scope**: Root application feature layer. **[Inferred]**
- **Owned Concepts**: User authentication sessions, organization/entity/property hierarchies, physical building topologies (buildings, units, doors), resident and supplier registries, physical access control schedules, and targeted communication dispatches. **[Confirmed]**
- **Downstream Dependencies**: It relies heavily on the `core` module for low-level infrastructure services (Firebase authentication, HTTPS communication, translation, and global error handling) and the `components` module for shared presentation elements. **[Confirmed]**
- **Upstream Consumers**: The `components` module consumes authentication state and actions (such as sign-out) exposed by this module. **[Confirmed]**

### 3. Primary Responsibilities

#### authentication

- **Multi-Method Sign-In & Sign-Up**: Supports Auth0 redirect, email/password, and passwordless email link sign-in/sign-up flows. (Cites: `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` line 24, `hosting/web-app/src/app/features/authentication/features/sign-in/components/select-sign-in-method/select-sign-in-method.component.ts` line 21) [Confirmed]
- **Auth0-to-Firebase Token Exchange**: Intercepts Auth0 ID token claims and exchanges them for Firebase custom tokens via a cloud function to sign users into Firebase. (Cites: `hosting/web-app/src/app/features/authentication/services/auth.service.ts` lines 64-216) [Confirmed]
- **Onboarding & Profile Creation**: Handles the creation of user profiles in Firestore, updates public profiles, and processes pending PMP (Partner Management Portal) invitations upon registration. (Cites: `hosting/web-app/src/app/features/authentication/services/auth.service.ts` lines 100-171) [Confirmed]
- **Password Reset & Verification**: Manages password reset email dispatch, reset code verification, and password updates. (Cites: `hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts` lines 118-126, `hosting/web-app/src/app/features/authentication/services/auth.service.ts` lines 244-250) [Confirmed]
- **Multi-Factor Authentication (MFA)**: Supports second-factor authentication code submission and MFA phone number retrieval. (Cites: `hosting/web-app/src/app/features/authentication/features/sign-in/components/second-factor-authentification/second-factor-authentification.component.ts` line 9, `hosting/web-app/src/app/features/authentication/services/auth.service.ts` lines 320-325) [Confirmed]

---

#### home

- **Render the Home View**: Exposes the main landing interface via `OSKHomeComponent` `` `angular_component|features|hosting/web-app/src/app/features/home/home.component.ts|OSKHomeComponent` ``. (Confirmed)
- **Compose Global Layout Elements**: Integrates the global header component (`osk-header`) directly into its template structure `` `angular_template_composition|features|hosting/web-app/src/app/features/home/home.component.html|OSKHomeComponent|osk-header|#1` ``. (Confirmed)
- **Support Localization**: Utilizes translation capabilities via `OSKTranslatePipe` to render localized text within the home view `` `call_expression|features|hosting/web-app/src/app/features/home/home.component.ts|Component|anon|{   selector: 'osk-home',   standalone: true,   imports: [NgOptimizedImage, OSKTranslatePipe, OSKHeaderComponent],   templateUrl: './home.component.html',   styleUrl: './home.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``. (Confirmed)

---

#### portals

- **Portal Shell Layout**: Provides the main structural container (`OSKPortalComponent`) that coordinates the side menu and the primary router outlet for child portal views. *(Confirmed)* `` `angular_component|features|hosting/web-app/src/app/features/portals/portal.component.ts|OSKPortalComponent` ``
- **Dynamic Stack-Based Navigation**: Manages a hierarchical, stack-based side menu system (`OSKSidemenuService` and `OSKSidemenuComponent`) that supports pushing, popping, and replacing menus as the user navigates through different contexts. *(Confirmed)* `` `angular_injectable|features|hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts|OSKSidemenuService` ``
- **Role-Based Menu Filtering**: Dynamically filters and constructs navigation menus for administrators and organization users based on specific permission roles (e.g., `v1.admin`, `v1.org.admin`). *(Confirmed)* `` `hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts` (lines 50-66) ``
- **Responsive Navigation Control**: Monitors viewport changes using a breakpoint observer to automatically collapse the side menu on mobile screens. *(Confirmed)* `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts` (lines 118-120) ``
- **Shared Presentation & Interaction**: Exposes reusable UI elements, including a standard card container (`OSKCardComponent`) and an asynchronous confirmation dialog (`OSKConfirmDialogComponent`) with built-in loading states. *(Confirmed)* `` `angular_component|features|hosting/web-app/src/app/features/portals/shared/components/card/card.component.ts|OSKCardComponent` ``

---

#### portals_organization

- **Organization Portal Routing**: Defines the routing structure for organization-level features, lazy-loading sub-routes for entities, notifications, and settings. [Confirmed] (via `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|entities|#1` ``, `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|notifications|#1` ``, and `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|settings|#1` ``).
- **Notification Management UI**: Renders the organization notifications interface using Angular Material cards. [Confirmed] (via `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|OSKNotificationsComponent` ``).
- **Settings Management UI**: Renders the organization settings interface using Angular Material cards. [Confirmed] (via `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|OSKSettingsComponent` ``).
- **Organization Context Types**: Defines TypeScript type aliases to enforce organization, entity, and property ID structures across the portal. [Confirmed] (via `` `type_alias|features|hosting/web-app/src/app/features/portals/organization/types/with-organization-id.type.ts|OSKWithOrganizationId|#1` ``, `` `type_alias|features|hosting/web-app/src/app/features/portals/organization/types/with-organization-id.type.ts|OSKWithOrganizationIdAndEntityId|#1` ``, and `` `type_alias|features|hosting/web-app/src/app/features/portals/organization/types/with-organization-id.type.ts|OSKWithOrganizationIdAndPropertyId|#1` ``).

---

#### portals_organization_entities

- **Sub-Entity Listing & Filtering**: Displays a list of organization sub-entities on a dashboard, filtering the retrieved entities to only show those matching `OSKEntityType.subEntity` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (lines 106-107) ``. (Confirmed)
- **Entity Creation**: Provides a reactive form (`newEntityForm`) to create new organization entities, dispatching the payload to the backend via `OSKOrganizationEntitiesService.createEntity` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (lines 114-130) ``. (Confirmed)
- **Inline Entity Editing**: Allows inline editing of existing entity names using `editEntityForm` and dispatches updates via `OSKOrganizationEntitiesService.updateEntity` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (lines 167-175) ``. (Confirmed)
- **Entity Deletion**: Facilitates entity deletion by launching a confirmation dialog (`OSKConfirmDialogComponent`) and calling `OSKOrganizationEntitiesService.deleteEntity` upon confirmation `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (lines 201-219) ``. (Confirmed)
- **Reactive UI State Management**: Manages local UI states (such as loading, form visibility, and active editing states) using Angular Signals `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (lines 67-73) ``. (Confirmed)
- **Role-Based Initialization**: Tailors dashboard initialization by checking if the current user's active account contains the `'v1.org.client'` role `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (lines 87-88) ``. (Confirmed)

---

#### portals_organization_entities_entity

- **Entity Dashboard Presentation**: Renders the main dashboard for a specific organization entity, displaying key metrics and lists of associated properties. [Confirmed] (via `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent` ``)
- **Entity Statistics Retrieval**: Fetches and manages dashboard statistics (such as device, resident, building, and admin counts) for a given organization and entity. [Confirmed] (via `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|OSKEntityService|getEntityDashboardStatics|#1` ``)
- **Entity-Level Feature Routing**: Defines and secures sub-routes for properties, suppliers, users, and message centers under a specific entity. [Confirmed] (via `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts`)

---

#### portals_organization_entities_entity_message-center

- **Communication Listing & Filtering**: Displays a paginated, sortable list of communications with filters for channel type, status, and search text. (Confirmed) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|OSKMessageCenterListComponent` ``
- **Multi-Step Communication Creation**: Guides users through a structured workflow to create messages, select channels (intercom/app), schedule start/end dates and times, select target doors, and review a recap before saving. (Confirmed) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|OSKMessageCenterCreateComponent` ``
- **Conflict Detection & Resolution**: Identifies active communications scheduled on the same target doors and prompts the user to confirm replacing them. (Confirmed) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.ts|OSKReplaceCommunicationConfirmDialogComponent` ``
- **Detailed Communication Inspection**: Displays comprehensive metadata, schedule details, and target door lists for a selected communication. (Confirmed) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-details/message-center-details.component.ts|OSKMessageCenterDetailsComponent` ``
- **AI-Assisted Message Reformulation**: Integrates with Gemini backend services to reformulate message titles and descriptions. (Inferred) `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|OSKMessageCenterServiceService|reformulateCommunication|#1` ``

---

#### portals_organization_entities_entity_properties

### Property Listing & Filtering
- Displays a tabular list of all properties associated with a specific organization entity. [Confirmed] `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|OSKOrganizationPropertiesListComponent` ``
- Supports real-time client-side filtering of properties by name or other text attributes. [Confirmed] `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|OSKOrganizationPropertiesListComponent|applyFilter|#1` ``

### Property Creation
- Provides a form to create new properties, capturing details such as property name, management type, property type, and street address. [Confirmed] `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|OSKOrganizationPropertiesCreateComponent|submit|#1` ``
- Allows assigning pre-existing organization buildings to the property during creation. [Confirmed] `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|selectedBuildings.map|submit|(b) => ({       buildingId: b.buildingId,       name: b.name,       organizationId: b.organizationId     })|#1` ``

### Property Editing & Deletion
- Enables editing of property details, including updating address information and modifying building assignments. [Confirmed] `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent|submit|#1` ``
- Supports property deletion, prompted by a confirmation dialog. [Confirmed] `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|OSKOrganizationPropertiesListComponent|openDeleteConfirmDialog|#1` ``

### Property Dashboard & Analytics
- Displays a dashboard containing statistics such as counts of residents, buildings, devices, and admins. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent|propertyDashboardStatics` ``
- Renders a doughnut chart visualizing the ratio of onboarded vs. non-onboarded residents. [Confirmed] `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent|updatedoughnutChart|#1` ``
- Lists active users and invitees associated with the property. [Confirmed] `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|this.usersListService.getAllOrganizationUsersAndInvitees(this.organizationId).then|ngOnInit|(res) => {         this.users.set(res.data);         this.dataSource.data = res.data?.filter((doc) => doc.status === 'active') || [];       }|#1` ``

---

#### portals_organization_entities_entity_properties_buildings

Every distinct responsibility provided by this capability is listed below:

- **Building Lifecycle Management**: Supports listing buildings under a property, viewing building details, and adding or updating building records. (**Confirmed**; `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts|OSKOrganizationBuildingsListComponent` ``, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts|OSKAddOrganizationBuildingComponent` ``).
- **Building Unit Management**: Supports listing, adding, and updating individual units associated with a specific building. (**Confirmed**; `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/organization-building-units-list.component.ts|OSKOrganizationBuildingUnitsListComponent` ``, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts|OSKAddOrganizationBuildingUnitComponent` ``).
- **Building Door Management**: Supports listing, adding, and updating doors associated with a specific building. (**Confirmed**; `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.ts|OSKOrganizationBuildingDoorsListComponent` ``, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|OSKAddOrganizationBuildingDoorComponent` ``).
- **Address and Country Selection**: Provides country selection lists and address form patching during building, unit, or door creation and editing. (**Confirmed**; `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts|OSKAddOrganizationBuildingComponent|countryChanged|#1` ``).
- **Role-Based Client Access**: Restricts or adapts UI elements based on whether the current user possesses specific client roles. (**Confirmed**; `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts|v1.org.client|#1` ``).

---

#### portals_organization_entities_entity_properties_general-rules

- **Building Selection and Listing**: Fetches and lists all buildings associated with a specific property and organization to allow contextual settings management. [Confirmed] (via `buildingsService.getAllBuildings` in `OSKListSettingsComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent` ``)
- **Settings Retrieval**: Retrieves general rules and settings for a selected building, including access methods, PIN code types, and invitation permissions. [Confirmed] (via `OSKBuildingSettingsService.getBuildingSettingsById` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|OSKBuildingSettingsService` ``)
- **Settings Modification**: Allows administrators to toggle boolean settings such as resident additions, co-resident additions, intercom display names, quickcodes, and invitation permissions. [Confirmed] (via `OSKListSettingsComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent` ``)
- **Settings Persistence**: Saves updated building settings back to the backend after confirmation via a dialog. [Confirmed] (via `OSKBuildingSettingsService.updateBuildingSettings` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|OSKBuildingSettingsService` ``)

---

#### portals_organization_entities_entity_properties_inhabitants

### Inhabitant Listing & Filtering
- Displays a paginated, sortable table of inhabitants belonging to a specific property (**Confirmed** [`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent|loadInhabitants|#1` ``]).
- Supports client-side filtering by search text (matching email, first name, last name, building name, or unit number), onboarding status, and inhabitant type (e.g., owner or tenant) (**Confirmed** [`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent|applyAllFilters|#1` ``]).

### Inhabitant Creation Wizard
- Provides a multi-step dialog wizard (`OSKCreateOrganizationInhabitantComponent`) to register new inhabitants (**Confirmed** [`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent|openCreateUser|#1` ``]).
- Validates user input including email format, phone numbers (using `libphonenumber-js`), and access date/time ranges (**Confirmed** [`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent|createPhoneNumberValidator|#1` ``], [`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent|dateValidator|#1` ``]).

### Inhabitant Details & Profile Management
- Displays detailed profile information for a selected resident, including contact details, associated building/unit, and access credentials (such as PIN codes and Sesame integrations) (**Confirmed** [`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|loadResidentDetails|#1` ``]).
- Allows updating resident details and handles form state tracking to enable or disable the save action (**Confirmed** [`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|isSaveButtonEnabled|#1` ``]).

### Onboarding Activation
- Triggers onboarding activation emails containing activation codes to residents (**Confirmed** [`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|sendActivationCode|#1` ``]).

### Inhabitant Deletion
- Supports deleting inhabitant records from the organization, prompted by a confirmation dialog (**Confirmed** [`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|deleteResident|#1` ``]).

---

#### portals_organization_entities_entity_properties_users

### User and Invitee Listing
- Displays a filterable and paginated list of all active organization users and pending invitees associated with the current organization context. **Confirmed** (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent` ``).
- Supports filtering the list by user details and handles loading states reactively. **Confirmed** (`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent|applyFilter|#1` ``).

### User Invitation
- Provides a dedicated form to invite new users by specifying their first name, last name, email, phone number (with country-specific validation), and assigning organization roles. **Confirmed** (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent` ``).
- Validates email domains and phone numbers using external utility libraries. **Confirmed** (`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|createPhoneNumberValidator|#1` ``).

### User Profile & Role Management
- Allows administrators to view detailed profiles of existing users or pending invitations. **Confirmed** (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent` ``).
- Enables updating assigned roles for both active users and pending invitations. **Confirmed** (`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|save|#1` ``).

### User Deletion & Invitation Cancellation
- Provides confirmation dialogs to safely delete active organization users or cancel pending invitations. **Confirmed** (`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent|removeUser|#1` ``).

---

#### portals_organization_entities_entity_suppliers

### Supplier Directory & Filtering
- **Supplier Listing**: Displays a paginated, filterable table of all suppliers associated with an organization's entity, including their assigned buildings and staff counts (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|OSKSuppliersListComponent` ``).
- **Custom Search Filtering**: Implements a custom filter predicate that searches across supplier names, notes, and staff member details (names, emails, phones) (Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|OSKSuppliersListComponent|createFilter|#1` ``).

### Supplier Creation Wizard
- **Step-by-Step Onboarding**: Provides a multi-step stepper dialog (`OSKSuppliersCreationComponent`) to collect supplier details (SIRET, address, contact info) and optionally add initial staff members in a single workflow (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|OSKSuppliersCreationComponent` ``).
- **Phone Validation**: Integrates `libphonenumber-js` to dynamically validate and format international phone numbers based on a selected country (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|parsePhoneNumber|createPhoneNumberValidator|phoneNumber,countryCode|#1` ``).

### Supplier Detail & Staff Management
- **Tabbed Detail View**: Organizes supplier details, staff management, and access rights into separate tabs (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|selectedTabIndex` ``).
- **Staff Roster Management**: Supports adding, updating, and deleting staff members, with form validation ensuring at least one name and one contact method (email or phone) are provided (Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|atLeastOneContactValidator|#1` ``).
- **Pincode Security**: Displays generated access pincodes with a secure toggle mechanism that automatically hides the pincode after 7 seconds using a window timeout (Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|togglePincode|#1` ``).

### Staff Access Control & Scheduling
- **Access Provisioning**: Provides a wizard (`OSKSuppliersStaffAccessComponent`) to grant specific door access to selected staff members over a scheduled period (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts|OSKSuppliersStaffAccessComponent` ``).
- **Conflict Detection & Resolution**: Detects overlapping or conflicting access schedules for staff members and allows administrators to delete conflicting access rights directly from the wizard (Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts|OSKSuppliersStaffAccessComponent|getConflictingAccesses|#1` ``).

---

#### portals_organization_onboarding-cards

### Onboarding Cards Listing
- Displays a filterable, paginated list of onboarding documents for a specific organization using a tabular layout. (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent` ``).
- Supports filtering the list via a search input. (Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent|applyFilter|#1` ``).

### Adding Onboarding Cards
- Supports adding multiple inhabitant onboarding cards simultaneously within an accordion interface. (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|OSKAddOnboardingCardsComponent` ``).
- Validates and formats phone numbers and access times (converting local times to UTC offsets) before submission. (Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|OSKAddOnboardingCardsComponent|createOnboardingCards|#1` ``).

### Editing Onboarding Cards
- Retrieves a specific onboarding card by ID and allows modification of its details, including access rights, validity periods, and associated doors. (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.ts|OSKEditOnboardingCardComponent` ``).

### Creating Onboarding Cards (Dialog)
- Provides a multi-step dialog interface to create onboarding cards, utilizing a stepper with form validation. (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|OSKCreateOnboardingCardsComponent` ``).
- Validates that the entered email address is allowed based on account creation restrictions. (Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|OSKCreateOnboardingCardsComponent|createEmailValidator|#1` ``).

### Verifying Activation Codes
- Allows organization administrators to verify activation codes for onboarding users directly from the list interface. (Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent|onboardUser|#1` ``).

---

#### portals_user

### User Profile & Account Management
- Provides a form for users to view and update their personal details, including first name, last name, and phone number `` `angular_component|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|OSKAccountComponent` ``. **[Confirmed]**
- Formats phone numbers before submission by stripping leading zeros `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|this.accountForm.value.phoneNumber?.startsWith|submit|'0'|#1` ``. **[Confirmed]**
- Reactively updates form fields when the current user's state changes using an Angular effect `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|effect|anon|() => {       const currentUser = this.currentUser();       this.accountForm.controls.email.disable();       this.accountForm.patchValue({         firstName: currentUser.oskUser?.publicProfile.firstName || '',         lastName: currentUser.oskUser?.publicProfile.lastName || '',         phoneNumber: currentUser.oskUser?.phoneNumber?.localPhoneNumber || ''       });       this.accountForm.get('email')?.setValue(currentUser.oskUser?.email || '');     }|#1` ``. **[Confirmed]**

### Country Directory Retrieval & Sorting
- Fetches a list of countries to populate country/dial-code selection dropdowns `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|this.accountService.getCountries|ngOnInit||#1` ``. **[Confirmed]**
- Sorts the retrieved countries based on a predefined European proximity order (e.g., France, Belgium, Luxembourg, Germany, Switzerland, Italy, Monaco, Spain, Andorra, United Kingdom) before falling back to alphabetical sorting `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|res.data.sort|ngOnInit|(a, b) => {         const orderA = proximityOrder[a.isoCountryCode] || Infinity;         const orderB = proximityOrder[b.isoCountryCode] || Infinity;         if (orderA !== Infinity || orderB !== Infinity) {           return orderA - orderB;         }         return a.name.localeCompare(b.name);       }|#1` ``. **[Confirmed]**

### Notifications & Settings Views
- Exposes basic views for user notifications `` `angular_component|features|hosting/web-app/src/app/features/portals/user/notifications/notifications.component.ts|OSKNotificationsComponent` `` and general user settings `` `angular_component|features|hosting/web-app/src/app/features/portals/user/settings/settings.component.ts|OSKSettingsComponent` ``. **[Confirmed]**

---

#### portals_user_invitations

- **Retrieving User-Associated Buildings and Units**: Fetches the list of buildings and units associated with the current user to populate selection forms [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|this.sendInvitationService.getUserUnits|ngOnInit|this.currentUser().oskUser!.userId|#1` ``).
- **Configuring Access Rights**: Allows users to add and configure access rights (such as permanent, one-time, inhabitant, or guest access) with specific date and time validity constraints [Confirmed] (via `` `class_method|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|addAccessRight|#1` `` and `` `class_method|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|sendInvitation|#1` ``).
- **Sending Invitations**: Submits the configured invitation request data to the backend [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|this.sendInvitationService       .sendInvitation|sendInvitation|this.invitationrequestData|#1` ``).

---

#### portals_user_organizations

- **Fetching Organization Invitations**: Retrieves the list of pending organization invitations for the currently authenticated user. [Confirmed] (`` `service_method|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|OSKOrganizationInvitationsService|getCurrentUserOrganizationInvitations|#1` ``)
- **Accepting Invitations**: Submits a request to accept a specific organization invitation and updates the local UI state upon success. [Confirmed] (`` `service_method|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|OSKOrganizationInvitationsService|acceptInvitation|#1` ``)
- **Rejecting Invitations**: Submits a request to reject a specific organization invitation and updates the local UI state upon success. [Confirmed] (`` `service_method|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|OSKOrganizationInvitationsService|rejectInvitation|#1` ``)
- **Routing**: Defines the routing structure for accessing user organization invitations and pending organizations. [Confirmed] (`` `hosting/web-app/src/app/features/portals/user/organizations/organizations.routes.ts` (lines 17-22) ``)

---

#### portals_user_organizations_pending-organizations

- **Listing Pending Organizations**: Retrieves and displays a paginated list of pending organization requests associated with the current user [Confirmed] (via `` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/services/pending-organizations/pending-organizations.service.ts|OSKUserPendingOrganizationsService` ``).
- **Submitting New Organizations**: Provides a form to collect organization details (such as name, tax number, and address) and submit them to create a new pending organization request [Confirmed] (via `` `angular_component|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|OSKAddOrganizationComponent` ``).
- **Country Selection & Address Patching**: Fetches a list of countries, prioritizes "France" by unshifting it to the top of the list, and automatically patches the address form fields when a country is selected [Confirmed] (via `` `class_method|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|OSKAddOrganizationComponent|countryChanged|#1` `` and `` `class_method|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|OSKAddOrganizationComponent|ngOnInit|#1` ``).

---

### 4. Public Interfaces (Components & Services)

#### authentication

### Components

- **OSKAuthActionComponent** (selector: `osk-auth-action`, standalone: true)
  - Handles out-of-band email action codes (e.g., password reset, email verification, sign-in confirmation).
  - Cite: `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts|OSKAuthActionComponent` ``
- **OSKSecondFactorAuthentificationComponent** (selector: `osk-second-factor-authentification`, standalone: true)
  - Handles MFA code submission.
  - Cite: `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/second-factor-authentification/second-factor-authentification.component.ts|OSKSecondFactorAuthentificationComponent` ``
- **OSKSelectSignInMethodComponent** (selector: `osk-select-sign-in-method`, standalone: true)
  - Allows users to choose their preferred sign-in method.
  - Cite: `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/select-sign-in-method/select-sign-in-method.component.ts|OSKSelectSignInMethodComponent` ``
- **OSKSignInWithAuth0Component** (selector: `osk-sign-in-with-auth0`, standalone: true)
  - Triggers Auth0 redirect login.
  - Cite: `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-auth0/sign-in-with-auth0.component.ts|OSKSignInWithAuth0Component` ``
- **OSKSignInWithEmailAndPasswordComponent** (selector: `osk-sign-in-with-email-and-password`, standalone: true)
  - Form-based email and password sign-in/sign-up.
  - Cite: `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-and-password/sign-in-with-email-and-password.component.ts|OSKSignInWithEmailAndPasswordComponent` ``
- **OSKSignInWithEmailLinkComponent** (selector: `osk-sign-in-with-email-link`, standalone: true)
  - Passwordless sign-in via email link.
  - Cite: `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-link/sign-in-with-email-link.component.ts|OSKSignInWithEmailLinkComponent` ``
- **OSKSignUpWithEmailLinkComponent** (selector: `osk-sign-up-with-email-link`, standalone: true)
  - Passwordless sign-up via email link.
  - Cite: `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-up-with-email-link/sign-up-with-email-link.component.ts|OSKSignUpWithEmailLinkComponent` ``
- **OSKVerifyEmailComponent** (selector: `osk-verify-email`, standalone: true)
  - Displays email verification status.
  - Cite: `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/verify-email/verify-email.component.ts|OSKVerifyEmailComponent` ``
- **OSKSignInComponent** (selector: `osk-sign-in`, standalone: true)
  - Orchestrator component displaying the selected sign-in/sign-up sub-component.
  - Cite: `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts|OSKSignInComponent` ``

### Services

- **OSKAuthService** (providedIn: `'root'`)
  - Core authentication service managing Auth0 and Firebase SDK interactions, token exchange, profile updates, and cloud function calls.
  - Cite: `` `angular_injectable|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|OSKAuthService` ``

---

#### home

- **`OSKHomeComponent`**: A standalone component with the selector `osk-home` and `OnPush` change detection strategy `` `call_expression|features|hosting/web-app/src/app/features/home/home.component.ts|Component|anon|{   selector: 'osk-home',   standalone: true,   imports: [NgOptimizedImage, OSKTranslatePipe, OSKHeaderComponent],   templateUrl: './home.component.html',   styleUrl: './home.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``. (Confirmed)

---

#### portals

### Components
- **`OSKPortalComponent`**  
  - **Selector**: `osk-portal`  
  - **File**: `hosting/web-app/src/app/features/portals/portal.component.ts`  
  - **Type**: Standalone Component  
  - **Description**: The main layout shell containing the side menu and the router outlet. `` `angular_component|features|hosting/web-app/src/app/features/portals/portal.component.ts|OSKPortalComponent` ``
- **`OSKSidemenuComponent`**  
  - **Selector**: `osk-sidemenu`  
  - **File**: `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts`  
  - **Type**: Standalone Component  
  - **Description**: The responsive side navigation component that renders dynamic menus, handles route changes, and manages mobile collapsing. `` `angular_component|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|OSKSidemenuComponent` ``
- **`OSKCardComponent`**  
  - **Selector**: `osk-card`  
  - **File**: `hosting/web-app/src/app/features/portals/shared/components/card/card.component.ts`  
  - **Type**: Standalone Component  
  - **Description**: A generic card container component. `` `angular_component|features|hosting/web-app/src/app/features/portals/shared/components/card/card.component.ts|OSKCardComponent` ``
- **`OSKConfirmDialogComponent`**  
  - **Selector**: `osk-confirm-dialog`  
  - **File**: `hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.ts`  
  - **Type**: Standalone Component  
  - **Description**: A dialog overlay used to prompt users for confirmation before executing actions. `` `angular_component|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.ts|OSKConfirmDialogComponent` ``

### Services
- **`OSKSidemenuService`**  
  - **File**: `hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts`  
  - **Scope**: `providedIn: 'root'`  
  - **Description**: Manages the reactive state of the side navigation stack, including pushing, popping, and replacing menus. `` `angular_injectable|features|hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts|OSKSidemenuService` ``

---

#### portals_organization

#### Components
- **`OSKNotificationsComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts` (line 18) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|OSKNotificationsComponent` ``
  - **Selector**: `osk-notifications`
  - **Standalone**: `true`
  - **Imports**: `MatCardModule`, `OSKTranslatePipe` (via `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|Component|anon|{   selector: 'osk-notifications',   standalone: true,   imports: [MatCardModule, OSKTranslatePipe],   templateUrl: './notifications.component.html',   styleUrl: './notifications.component.scss' }|#1` ``)
- **`OSKSettingsComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts` (line 5) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|OSKSettingsComponent` ``
  - **Selector**: `osk-settings`
  - **Standalone**: `true`
  - **Imports**: `MatCardModule`, `OSKTranslatePipe` (via `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|Component|anon|{   selector: 'osk-settings',   standalone: true,   imports: [MatCardModule, OSKTranslatePipe],   templateUrl: './settings.component.html',   styleUrl: './settings.component.scss' }|#1` ``)

#### Services
No injectable services are evidenced in this capability pack. [Confirmed]

---

#### portals_organization_entities

### Components

- **`OSKEntitiesDashboardComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent` ``
  - **Selector**: `osk-entities-dashboard` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (line 34) ``
  - **Type**: Standalone Component `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (line 34) ``
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts`

### Services

- **`OSKOrganizationEntitiesService`** `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|OSKOrganizationEntitiesService` ``
  - **Scope**: `providedIn: 'root'` `` `hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts` (line 7) ``
  - **Files**: 
    - `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts`
    - `hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts`
  - **Methods**:
    - `createEntity(entity: OSKCreateEntity)` `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|OSKOrganizationEntitiesService|createEntity|#1` ``
    - `getEntityById(organizationId: string, entityId: string)` `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|OSKOrganizationEntitiesService|getEntityById|#1` ``
    - `getAllEntities(organizationId: string, entityId: string)` `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|OSKOrganizationEntitiesService|getAllEntities|#1` ``
    - `updateEntity(organizationId: string, entityId: string, update: Partial<OSKEntity>)` `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|OSKOrganizationEntitiesService|updateEntity|#1` ``
    - `deleteEntity(organizationId: string, entityId: string)` `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|OSKOrganizationEntitiesService|deleteEntity|#1` ``

---

#### portals_organization_entities_entity

- **`OSKEntityDashboardComponent`**: A standalone component that serves as the main dashboard view for an entity. [Confirmed] (via `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent` ``)
  - **Selector**: `osk-entity-dashboard` [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|Component|anon|{   selector: 'osk-entity-dashboard',...` ``)
- **`OSKEntityService`**: An injectable service provided in the application root, responsible for fetching entity-specific dashboard statistics. [Confirmed] (via `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|OSKEntityService` ``)
  - **Scope**: `providedIn: 'root'` [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``)

---

#### portals_organization_entities_entity_message-center

### Components

- **`OSKMessageCenterListComponent`** (Selector: `osk-communication-list`)  
  Exposes the main dashboard for viewing and managing communications. (Confirmed) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|OSKMessageCenterListComponent` ``
- **`OSKMessageCenterCreateComponent`** (Selector: `osk-message-center-create`)  
  Exposes the multi-step creation dialog. (Confirmed) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|OSKMessageCenterCreateComponent` ``
- **`OSKMessageCenterDetailsComponent`** (Selector: `osk-message-center-details`)  
  Exposes the detailed view panel. (Confirmed) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-details/message-center-details.component.ts|OSKMessageCenterDetailsComponent` ``
- **`OSKReplaceCommunicationConfirmDialogComponent`** (Selector: `osk-replace-communication-confirm-dialog`)  
  Exposes the conflict resolution dialog. (Confirmed) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.ts|OSKReplaceCommunicationConfirmDialogComponent` ``
- **`OSKSavingCommunicationDialogComponent`** (Selector: `osk-saving-communication-dialog`)  
  Exposes a modal progress dialog shown while saving communications. (Confirmed) `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/saving-communication-dialog/saving-communication-dialog.component.ts|OSKSavingCommunicationDialogComponent` ``

### Services

- **`OSKMessageCenterServiceService`** (Scope: `providedIn: 'root'`)  
  Provides the data access layer, wrapping Firebase HTTPS callable functions to manage communications, properties, and buildings. (Confirmed) `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|OSKMessageCenterServiceService` ``

---

#### portals_organization_entities_entity_properties

### Components
- **`OSKOrganizationPropertiesListComponent`** [Confirmed] `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|OSKOrganizationPropertiesListComponent` ``
  - **Selector**: `osk-organization-properties-list`
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts`
- **`OSKOrganizationPropertiesCreateComponent`** [Confirmed] `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|OSKOrganizationPropertiesCreateComponent` ``
  - **Selector**: `osk-organization-properties-create`
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts`
- **`OSKOrganizationPropertiesEditComponent`** [Confirmed] `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent` ``
  - **Selector**: `osk-organization-properties-edit`
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts`
- **`OSKPropertyDashboardComponent`** [Confirmed] `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent` ``
  - **Selector**: `osk-property-dashboard`
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts`

### Services
- **`OSKOrganizationPropertyService`** [Confirmed] `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|OSKOrganizationPropertyService` ``
  - **Scope**: `'root'`
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts`
  - **Methods**:
    - `getAllProperties(organizationId: string, entityId: string)`
    - `createProperty(property: OSKCreateProperty)`
    - `getPropertyById(organizationId: string, propertyId: string)`
    - `updateProperty(organizationId: string, propertyId: string, update: Partial<OSKProperty>)`
    - `deleteProperty(organizationId: string, propertyId: string)`
    - `getPropertyDashboardStatics(organizationId: string, propertyId: string)`
    - `assignBuildingToProperty(organizationId: string, oldPropertyId: string, newPropertyId: string, buildingId: string, buildingData: any)`

---

#### portals_organization_entities_entity_properties_buildings

### Components
This capability exposes the following Angular components:

1. **`OSKAddOrganizationBuildingDoorComponent`**
   - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts` (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|OSKAddOrganizationBuildingDoorComponent` ``)
   - **Selector**: `osk-add-organization-building-door`
   - **Change Detection**: `ChangeDetectionStrategy.OnPush`

2. **`OSKAddOrganizationBuildingUnitComponent`**
   - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts` (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts|OSKAddOrganizationBuildingUnitComponent` ``)
   - **Selector**: `osk-add-organization-building-unit`
   - **Change Detection**: `ChangeDetectionStrategy.OnPush`

3. **`OSKAddOrganizationBuildingComponent`**
   - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts` (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts|OSKAddOrganizationBuildingComponent` ``)
   - **Selector**: `osk-add-organization-building`
   - **Change Detection**: `ChangeDetectionStrategy.OnPush`

4. **`OSKOrganizationBuildingDetailsComponent`**
   - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/organization-building-details.component.ts` (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/organization-building-details.component.ts|OSKOrganizationBuildingDetailsComponent` ``)
   - **Selector**: `osk-organization-building-details`
   - **Change Detection**: `ChangeDetectionStrategy.OnPush`

5. **`OSKOrganizationBuildingDoorsListComponent`**
   - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.ts` (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.ts|OSKOrganizationBuildingDoorsListComponent` ``)
   - **Selector**: `osk-organization-building-doors-list`
   - **Change Detection**: `ChangeDetectionStrategy.OnPush`

6. **`OSKOrganizationBuildingUnitsListComponent`**
   - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/organization-building-units-list.component.ts` (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/organization-building-units-list.component.ts|OSKOrganizationBuildingUnitsListComponent` ``)
   - **Selector**: `osk-organization-building-units-list`
   - **Change Detection**: `ChangeDetectionStrategy.OnPush`

7. **`OSKOrganizationBuildingsListComponent`**
   - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts` (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts|OSKOrganizationBuildingsListComponent` ``)
   - **Selector**: `osk-organization-buildings-list`
   - **Change Detection**: `ChangeDetectionStrategy.OnPush`

### Services
This capability exposes the following injectable services, all scoped to the root injector (`providedIn: 'root'`):

1. **`OSKAddOrganizationBuildingDoorService`** (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts|OSKAddOrganizationBuildingDoorService` ``)
2. **`OSKAddOrganizationBuildingUntService`** (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/services/add-organization-building-unt/add-organization-building-unt.service.ts|OSKAddOrganizationBuildingUntService` ``)
3. **`OSKAddOrganizationBuildingService`** (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/services/add-organization-building/add-organization-building.service.ts|OSKAddOrganizationBuildingService` ``)
4. **`OSKOrganizationBuildingDetailsService`** (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/services/organization-building-details/organization-building-details.service.ts|OSKOrganizationBuildingDetailsService` ``)
5. **`OSKOrganizationBuildingDoorsListService`** (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/services/organization-building-doors-list/organization-building-doors-list.service.ts|OSKOrganizationBuildingDoorsListService` ``)
6. **`OSKOrganizationBuildingUnitsListService`** (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/services/organization-building-units-list/organization-building-units-list.service.ts|OSKOrganizationBuildingUnitsListService` ``)
7. **`OSKOrganizationBuildingsListService`** (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/services/organization-buildings-list/organization-buildings-list.service.ts|OSKOrganizationBuildingsListService` ``)

---

#### portals_organization_entities_entity_properties_general-rules

### Components
- **`OSKListSettingsComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent` ``
  - **Selector**: `osk-list-settings`
  - **Standalone**: `true`

### Services
- **`OSKBuildingSettingsService`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|OSKBuildingSettingsService` ``
  - **Scope**: Provided in `'root'`

---

#### portals_organization_entities_entity_properties_inhabitants

### Components
- **`OSKCreateOrganizationInhabitantComponent`** (**Confirmed** [`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent` ``])
  - *Selector*: `osk-create-organization-inhabitant`
  - *Type*: Standalone Component
- **`OSKOrganizationInhabitantDetailsComponent`** (**Confirmed** [`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent` ``])
  - *Selector*: `osk-organization-inhabitant-details`
  - *Type*: Standalone Component
- **`OSKOrganizationInhabitantsListComponent`** (**Confirmed** [`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent` ``])
  - *Selector*: `osk-organization-inhabitants-list`
  - *Type*: Standalone Component

### Services
- **`OSKOrganizationInhabitantService`** (**Confirmed** [`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService` ``])
  - *Scope*: Provided in `'root'`
  - *Exposed Methods*:
    - `getAllInhabitantDocuments(organizationId: string, propertyId: string)`
    - `getCountries()`
    - `getInhabitantDetailsById(organizationId: string, residentId: string)`
    - `createResident(onboardingCardDTO: any)`
    - `deleteResident(organizationId: string, residentId: string)`
    - `updateResident(residentDTO: any)`
    - `sendActivationCode(organizationId: string, residentId: string, language: string)`

---

#### portals_organization_entities_entity_properties_users

### Components
- **`OSKInviteOrganizationUserComponent`**  
  - **Selector**: `osk-invite-user`  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts` (line 59)  
  - **Description**: Form component for inviting new organization users and assigning roles.
- **`OSKOrganizationUserDetailsComponent`**  
  - **Selector**: `osk-organization-user-details`  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts` (line 59)  
  - **Description**: Detail and edit view for managing an individual user's roles or invitation status.
- **`OSKOrganizationUsersListComponent`**  
  - **Selector**: `osk-organization-users-list`  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts` (line 45)  
  - **Description**: Table component displaying organization users and pending invitations.

### Services (Injectables)
- **`OSKInviteOrganizationUserService`**  
  - **Scope**: `providedIn: 'root'`  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts` (line 25)  
  - **Description**: Handles backend communication for fetching roles and creating user invitations.
- **`OSKOrganizationUserDetailsService`**  
  - **Scope**: `providedIn: 'root'`  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/services/organization-user-details/organization-user-details.service.ts` (line 22)  
  - **Description**: Manages fetching individual user details, invitee details, and updating user roles.
- **`OSKOrganizationUsersListService`**  
  - **Scope**: `providedIn: 'root'`  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service.ts` (line 21)  
  - **Description**: Handles fetching the list of organization users and invitees, deleting users, and canceling invitations.

---

#### portals_organization_entities_entity_suppliers

### Components
- **`OSKSuppliersListComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts`
  - **Selector**: `osk-suppliers-list` (Inferred, standard naming convention)
  - **Inputs**: `entityId` (Required) (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|Input|anon|{ required: true }|#1` ``)
- **`OSKSuppliersDetailsComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts`
  - **Selector**: `osk-suppliers-details`
  - **Inputs**: `organizationId`, `entityId`, `propertyId`, `id` (Inferred from route parameters mapped to component inputs or snapshot) (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|Input|anon||#1` ``).
- **`OSKSuppliersCreationComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts`
  - **Selector**: `osk-suppliers-creation`
- **`OSKSuppliersStaffAccessComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts`
  - **Selector**: `osk-suppliers-staff-access`

### Injectables
- **`OSKSuppliersService`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts`
  - **Scope**: `providedIn: 'root'` (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``)
- **`OSKCustomDateAdapter`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/custom-date-adapter.ts`
  - **Scope**: Provided locally in `OSKSuppliersStaffAccessComponent` to handle French locale date formatting (`DD/MM/YYYY`) (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts|OSKSuppliersStaffAccessComponent` ``).

---

#### portals_organization_onboarding-cards

### Components

- **`OSKOnboardingCardFormComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|OSKOnboardingCardFormComponent` ``
  - **Selector**: `osk-onboarding-card-form`
  - **Inputs**:
    - `onboardingCard` (Required)
    - `organizationId` (Required)
    - `countries` (Required)
    - `buildings` (Required)
    - `buildingsObject` (Required)

- **`OSKAddOnboardingCardsComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|OSKAddOnboardingCardsComponent` ``
  - **Selector**: `osk-add-onboarding-cards`
  - **Inputs**:
    - `organizationId` (Inferred from route parameter binding)

- **`OSKCreateOnboardingCardsComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|OSKCreateOnboardingCardsComponent` ``
  - **Selector**: `osk-create-onboarding-cards`
  - **Inputs**:
    - `organizationId` (Required)
    - `countries` (Required)
    - `buildings` (Required)

- **`OSKEditOnboardingCardComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.ts|OSKEditOnboardingCardComponent` ``
  - **Selector**: `osk-edit-onboarding-card`
  - **Inputs**:
    - `organizationId` (Required)
    - `onboardingId` (Required)

- **`OSKOnboardingCardsListComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent` ``
  - **Selector**: `osk-onboarding-cards-list`
  - **Inputs**:
    - `organizationId` (Required)

### Services

- **`OSKOnboardingCardsService`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|OSKOnboardingCardsService` ``
  - **Scope**: `'root'`
  - **Methods**:
    - `getCountries()`: Returns a promise of countries.
    - `getBuildings(data: { organizationId: string; propertyId: string })`: Returns a promise of buildings.
    - `createOnboardingDocuments(data: OSKInhabitantsOnboardingData)`: Submits new onboarding documents.
    - `updateOnboardingDocument(data: OSKInhabitantOnboardingCard)`: Updates an existing onboarding document.
    - `getAllOnboardingDocuments(organizationId: string)`: Retrieves all onboarding documents for an organization.
    - `getOnboardingDocumentById(organizationId: string, onboardingId: string)`: Retrieves a specific onboarding document.
    - `verifyActivationCode(organizationId: string, activationCode: string)`: Verifies an activation code.

---

#### portals_user

### Components
- **`OSKAccountComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|OSKAccountComponent` ``
  - **Selector**: `osk-profile` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|Component|anon|{   standalone: true,   imports: [     MatCardModule,     ReactiveFormsModule,     MatFormFieldModule,     OSKTranslatePipe,     MatInputModule,     MatButtonModule,     MatSelectModule,     FormsModule,     MatProgressSpinnerModule,     MatCardModule   ],   selector: 'osk-profile',   templateUrl: './account.component.html',   styleUrl: './account.component.scss' }|#1` ``
  - **Type**: Standalone Component
- **`OSKNotificationsComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/user/notifications/notifications.component.ts|OSKNotificationsComponent` ``
  - **Selector**: `osk-notifications` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/notifications/notifications.component.ts|Component|anon|{   selector: 'osk-notifications',   standalone: true,   imports: [MatCardModule, OSKTranslatePipe],   templateUrl: './notifications.component.html',   styleUrl: './notifications.component.scss' }|#1` ``
  - **Type**: Standalone Component
- **`OSKSettingsComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/user/settings/settings.component.ts|OSKSettingsComponent` ``
  - **Selector**: `osk-settings` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/settings/settings.component.ts|Component|anon|{   selector: 'osk-settings',   standalone: true,   imports: [MatCardModule, OSKTranslatePipe],   templateUrl: './settings.component.html',   styleUrl: './settings.component.scss' }|#1` ``
  - **Type**: Standalone Component

### Services
- **`OSKAccountService`** `` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|OSKAccountService` ``
  - **Scope**: `providedIn: 'root'` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``
  - **Methods**:
    - `getCountries()`: Fetches country list `` `service_method|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|OSKAccountService|getCountries|#1` ``
    - `updateUserProfileAndPhoneNumber(dto)`: Updates user profile and phone number `` `service_method|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|OSKAccountService|updateUserProfileAndPhoneNumber|#1` ``

---

#### portals_user_invitations

### Components
- **`OSKSendUserInvitationComponent`** [Confirmed] (via `` `angular_component|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent` ``)
  - **Selector**: `osk-send-user-invitation` [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|Component|anon|{   standalone: true,   imports: [     MatCardModule,     MatFormFieldModule,     FormsModule,     OSKTranslatePipe,     MatSelectModule,     MatIconModule,     NgxMatTimepickerModule,     MatDatepickerModule,     MatButtonModule,     MatInputModule,     MatProgressSpinnerModule   ],   providers: [provideNativeDateAdapter()],   selector: 'osk-send-user-invitation',   templateUrl: './send-user-invitation.component.html',   styleUrl: './send-user-invitation.component.scss' }|#1` ``)

### Services
- **`OSKSendUserInvitationService`** [Confirmed] (via `` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|OSKSendUserInvitationService` ``)
  - **Scope**: `providedIn: 'root'` [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``)
  - **Methods**:
    - `getUserUnits(userId: string)`: Retrieves units for the specified user ID [Confirmed] (via `` `service_method|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|OSKSendUserInvitationService|getUserUnits|#1` ``).
    - `sendInvitation(invitationRequestData: OSKCreateUserInvitationRequestData)`: Submits the invitation request [Confirmed] (via `` `service_method|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|OSKSendUserInvitationService|sendInvitation|#1` ``).

---

#### portals_user_organizations

- **OSKOrganizationInvitationsComponent**: A standalone component with selector `osk-organization-invitations` that renders the user's pending organization invitations. [Confirmed] (`` `angular_component|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|OSKOrganizationInvitationsComponent` ``)
- **OSKOrganizationInvitationsService**: A service provided in the application root that handles communication with the backend for fetching, accepting, and rejecting invitations. [Confirmed] (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|OSKOrganizationInvitationsService` ``)

---

#### portals_user_organizations_pending-organizations

### Components
- **`OSKAddOrganizationComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts`
  - **Selector**: `osk-add-organization`
  - **Type**: Standalone Component
  - **Reference**: `` `angular_component|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|OSKAddOrganizationComponent` ``
- **`OSKUserPendingOrganizationsComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts`
  - **Selector**: `osk-pending-organizations`
  - **Type**: Standalone Component
  - **Reference**: `` `angular_component|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts|OSKUserPendingOrganizationsComponent` ``

### Services (Injectables)
- **`OSKAddOrganizationService`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts`
  - **Scope**: `providedIn: 'root'`
  - **Reference**: `` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts|OSKAddOrganizationService` ``
- **`OSKUserPendingOrganizationsService`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/services/pending-organizations/pending-organizations.service.ts`
  - **Scope**: `providedIn: 'root'`
  - **Reference**: `` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/services/pending-organizations/pending-organizations.service.ts|OSKUserPendingOrganizationsService` ``

---

### 5. UI Composition

#### authentication

- **OSKSignInComponent** acts as a container that dynamically renders sub-components based on the selected sign-in method (Cite: `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` line 24). It imports:
  - `OSKSelectSignInMethodComponent`
  - `OSKSignInWithEmailAndPasswordComponent`
  - `OSKSignUpWithEmailLinkComponent`
  - `OSKSignInWithEmailLinkComponent`
  - `OSKSignInWithAuth0Component`
- **OSKSelectSignInMethodComponent** emits the chosen method via an `@Output` binding `selectSignInMethod` when a button is clicked (Cite: `` `angular_template_binding|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/select-sign-in-method/select-sign-in-method.component.html|OSKSelectSignInMethodComponent|click|#1` ``).
- **OSKSignInWithEmailAndPasswordComponent** binds a `formGroup` to a form and handles `submit` outputs (Cite: `` `angular_template_binding|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-and-password/sign-in-with-email-and-password.component.html|OSKSignInWithEmailAndPasswordComponent|formGroup|#1` ``). It uses Angular Material components like `mat-card`, `mat-card-content`, `mat-form-field`, `mat-label`, and `mat-error` (Cite: `hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-and-password/sign-in-with-email-and-password.component.html` lines 23-101).
- **OSKAuthActionComponent** renders password reset or profile creation forms inside `mat-card` and `mat-card-content` containers, displaying a `mat-spinner` during loading states (Cite: `hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.html` lines 18-114).
- **OSKSecondFactorAuthentificationComponent** renders a form with a single input for the MFA code inside a `mat-card` (Cite: `hosting/web-app/src/app/features/authentication/features/sign-in/components/second-factor-authentification/second-factor-authentification.component.html` lines 23-38).
- **OSKVerifyEmailComponent** renders a simple card content layout with a resend button (Cite: `hosting/web-app/src/app/features/authentication/features/sign-in/components/verify-email/verify-email.component.html` lines 23-26).

---

#### home

- **`OSKHomeComponent` Template**:
  - Composes the `<osk-header>` component at line 17 of its template file `` `angular_template_composition|features|hosting/web-app/src/app/features/home/home.component.html|OSKHomeComponent|osk-header|#1` ``. (Confirmed)
  - Imports and utilizes `NgOptimizedImage` for optimized image rendering and `OSKTranslatePipe` for text translation within the template `` `call_expression|features|hosting/web-app/src/app/features/home/home.component.ts|Component|anon|{   selector: 'osk-home',   standalone: true,   imports: [NgOptimizedImage, OSKTranslatePipe, OSKHeaderComponent],   templateUrl: './home.component.html',   styleUrl: './home.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``. (Confirmed)

---

#### portals

### `OSKPortalComponent`
- **Composition**: Composes `OSKSidemenuComponent` and `RouterOutlet` in its template. `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/portal.component.html|OSKPortalComponent|router-outlet|#1` ``

### `OSKSidemenuComponent`
- **Composition**: Composes Angular Material elements including `mat-nav-list`, `mat-icon`, `mat-card`, `mat-menu`, `mat-accordion`, and `mat-expansion-panel`. `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html` (lines 32-121) ``
- **Bindings**:
  - Binds `sidenav-collapsed` input to control layout state. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|sidenav-collapsed|#1` ``
  - Binds multiple `routerLink` and `routerLinkActiveOptions` directives to navigate between portal sections. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|routerLink|#1` ``
  - Binds `matMenuTriggerFor` to trigger context menus. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|matMenuTriggerFor|#1` ``
  - Binds custom animations like `fadeInOut` and icon configurations. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|fadeInOut|#1` ``

### `OSKConfirmDialogComponent`
- **Composition**: Composes `mat-dialog-content`, `mat-dialog-actions`, and `mat-spinner`. `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.html|OSKConfirmDialogComponent|mat-dialog-content|#1` ``
- **Bindings**:
  - Binds `click` events to cancel and confirm handlers. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.html|OSKConfirmDialogComponent|click|#1` ``
  - Binds the `disabled` property of action buttons to the loading/confirming state. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.html|OSKConfirmDialogComponent|disabled|#1` ``

### `OSKCardComponent`
- **Bindings**:
  - Binds `ngClass` to apply conditional styling to the card wrapper. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/shared/components/card/card.component.html|OSKCardComponent|ngClass|#1` ``

---

#### portals_organization

- **`OSKNotificationsComponent`** renders:
  - `<mat-card>` as a structural container `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.html|OSKNotificationsComponent|mat-card|#1` ``.
  - `<mat-card-content>` to hold the notification content `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.html|OSKNotificationsComponent|mat-card-content|#1` ``.
- **`OSKSettingsComponent`** renders:
  - `<mat-card>` as a structural container `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.html|OSKSettingsComponent|mat-card|#1` ``.
  - `<mat-card-content>` to hold the settings content `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.html|OSKSettingsComponent|mat-card-content|#1` ``.

---

#### portals_organization_entities

The `OSKEntitiesDashboardComponent` template (`entities-dashboard.component.html`) composes several Angular Material components and binds local component state to them:

- **Structural Layout**: Uses `mat-card` elements to structure the dashboard layout, including the main list and form containers `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|mat-card|#1` ``.
- **Form Bindings**:
  - The entity creation form binds `[formGroup]="newEntityForm"` and triggers `(ngSubmit)="createEntity()"` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|formGroup|#1` ``.
  - The entity editing form binds `[formGroup]="editEntityForm"` and triggers `(ngSubmit)="updateEntity()"` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|formGroup|#2` ``.
  - Form fields use `mat-form-field`, `mat-label`, and `mat-error` to capture and validate input `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|mat-form-field|#1` ``.
- **State-Driven Visibility & Disabling**:
  - A `mat-card` container binds `[form-visible]="showCreateEntityForm()"` to toggle the creation form's visibility `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|form-visible|#1` ``.
  - Buttons bind `[disabled]` to reactive states like `creatingEntity()` or `updatingEntity()` to prevent double submissions `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|disabled|#1` ``.
- **User Interactions**:
  - Click handlers trigger state changes, such as toggling form visibility or initiating edits `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|click|#1` ``.
  - Individual entity cards bind `[routerLink]` to navigate to specific entity details `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|routerLink|#1` ``.
- **Feedback & Indicators**:
  - Displays `mat-spinner` components when loading entities or submitting forms `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|mat-spinner|#1` ``.
  - Uses `matTooltip` to display contextual help or actions `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|matTooltip|#1` ``.

---

#### portals_organization_entities_entity

The `OSKEntityDashboardComponent` template composes several Angular Material elements and structural containers to present entity data:
- **Layout & Structure**: Uses `mat-card` and `mat-card-content` to structure the dashboard layout. [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|mat-card|#1` `` and `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|mat-card-content|#1` ``)
- **Loading Indicators**: Renders a `mat-spinner` during data loading states. [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|mat-spinner|#1` ``)
- **Data Pagination**: Composes a `mat-paginator` to handle pagination for lists displayed on the dashboard. [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|mat-paginator|#1` ``)
- **Conditional Rendering**: Utilizes multiple `ng-container` blocks to conditionally display statistics and lists. [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|ng-container|#1` ``)

**Template Bindings**:
- **Data Source**: Binds property lists to a table using `table.input(dataSource)`. [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|dataSource|#1` ``)
- **Pagination Controls**: Binds `pageSize` and `pageSizeOptions` to the `mat-paginator`. [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|pageSize|#1` `` and `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|pageSizeOptions|#1` ``)
- **Navigation Links**: Binds `routerLink` to buttons and table rows to navigate to sub-features. [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|routerLink|#1` `` and `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|routerLink|#3` ``)
- **Visual Assets**: Binds `mask-image` on a `div` and `src` on an `img` to display entity-related imagery. [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|mask-image|#1` `` and `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|src|#1` ``)

---

#### portals_organization_entities_entity_message-center

### `OSKMessageCenterListComponent`
Renders a card-based layout containing a filter toolbar and a data table. (Confirmed) `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html` ``
- **Child Components**: Uses `mat-card`, `mat-card-content`, `mat-table`, `mat-paginator`, `mat-spinner`, and `mat-icon`. `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html` ``
- **Bindings**:
  - Binds `dataSource` to the table. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html|OSKMessageCenterListComponent|dataSource|#1` ``
  - Binds `pageSize` and `pageSizeOptions` to `mat-paginator`. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html|OSKMessageCenterListComponent|pageSize|#1` ``
  - Binds `change` on the channel filter dropdown. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html|OSKMessageCenterListComponent|change|#1` ``
  - Binds `keyup` on the search input. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html|OSKMessageCenterListComponent|keyup|#1` ``
  - Binds `click` on table rows to open details. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html|OSKMessageCenterListComponent|click|#3` ``

### `OSKMessageCenterCreateComponent`
Renders a multi-step stepper interface. (Confirmed) `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.html` ``
- **Child Components**: Uses `mat-stepper`, `mat-step`, `mat-checkbox`, `mat-datepicker`, `mat-datepicker-toggle`, `mat-expansion-panel`, `mat-selection-list`, and `mat-list-option`. `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.html` ``
- **Bindings**:
  - Binds `formGroup` to separate forms for content, scheduling, and target selection. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.html|OSKMessageCenterCreateComponent|formGroup|#1` ``
  - Binds `selectionChange` on the stepper to trigger step-specific logic. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.html|OSKMessageCenterCreateComponent|selectionChange|#1` ``
  - Binds `selectionChange` on the target door selection list. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.html|OSKMessageCenterCreateComponent|selectionChange|#2` ``

### `OSKReplaceCommunicationConfirmDialogComponent`
Renders a confirmation dialog displaying conflicting doors grouped by building. (Confirmed) `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.html` ``
- **Child Components**: Uses `mat-dialog-content`, `mat-dialog-actions`, and `mat-icon`. `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.html` ``
- **Bindings**:
  - Binds `innerHTML` to display formatted conflict messages. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.html|OSKReplaceCommunicationConfirmDialogComponent|innerHTML|#1` ``
  - Binds `click` on confirm and cancel buttons. `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.html|OSKReplaceCommunicationConfirmDialogComponent|click|#1` ``

---

#### portals_organization_entities_entity_properties

### `OSKOrganizationPropertiesListComponent`
- **Template Composition**: Composes a Material Card (`mat-card`) containing a search input field, a data table (`table` with `dataSource`), and a paginator (`mat-paginator`). [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.html` ``
- **Bindings**:
  - `table.input(dataSource)` bound to `dataSource` [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.html|OSKOrganizationPropertiesListComponent|dataSource|#1` ``
  - `input.output(input)` bound to `applyFilter($event)` [Inferred] `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.html|OSKOrganizationPropertiesListComponent|input|#1` ``
  - `button.output(click)` bound to `openDeleteConfirmDialog(...)` [Inferred] `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.html|OSKOrganizationPropertiesListComponent|click|#1` ``

### `OSKOrganizationPropertiesCreateComponent` & `OSKOrganizationPropertiesEditComponent`
- **Template Composition**: Composes a form inside a `mat-card` containing input fields for property details, dropdowns (`mat-select`) for management type, property type, and country selection, and a multi-select checkbox list for assigning buildings. [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.html` ``
- **Bindings**:
  - `form.input(formGroup)` bound to `propertyForm` [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.html|OSKOrganizationPropertiesCreateComponent|formGroup|#1` ``
  - `form.output(ngSubmit)` bound to `submit()` [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.html|OSKOrganizationPropertiesCreateComponent|ngSubmit|#1` ``
  - `mat-select.input(ngModel)` bound to `selectedCountry` with `ngModelChange` and `valueChange` handlers to update the form's address country details. [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.html|OSKOrganizationPropertiesCreateComponent|ngModel|#1` ``

### `OSKPropertyDashboardComponent`
- **Template Composition**: Composes a dashboard layout with multiple metric cards, an HTML5 `canvas` element for rendering charts, and a Material table listing active users. [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.html` ``
- **Bindings**:
  - `canvas.input(datasets)`, `canvas.input(labels)`, `canvas.input(options)`, `canvas.input(legend)`, and `canvas.input(type)` bound to chart configuration properties (e.g., `doughnutChartDatasets`, `doughnutChartLabels`, `doughnutChartOptions`). [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.html|OSKPropertyDashboardComponent|datasets|#1` ``
  - `table.input(dataSource)` bound to `dataSource` (active users list). [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.html|OSKPropertyDashboardComponent|dataSource|#1` ``

---

#### portals_organization_entities_entity_properties_buildings

The components in this capability compose standard Angular Material elements and bindings to construct their user interfaces:

- **Form Components (`OSKAddOrganizationBuildingDoorComponent`, `OSKAddOrganizationBuildingUnitComponent`, `OSKAddOrganizationBuildingComponent`)**:
  - Compose `mat-card`, `mat-card-content`, `mat-form-field`, `mat-label`, `mat-select`, `mat-option`, and `mat-spinner` elements. (`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.html|OSKAddOrganizationBuildingDoorComponent|mat-card|#1` ``).
  - Bindings include `formGroup` on the form element, `formControlName` on input elements, `ngModel` and `ngModelChange` on country selectors, and `disabled` states tied to loading/saving signals. (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.html|OSKAddOrganizationBuildingDoorComponent|formGroup|#1` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.html|OSKAddOrganizationBuildingDoorComponent|disabled|#2` ``).
- **List Components (`OSKOrganizationBuildingDoorsListComponent`, `OSKOrganizationBuildingUnitsListComponent`, `OSKOrganizationBuildingsListComponent`)**:
  - Compose `mat-card`, `mat-card-content`, `mat-table` (with `ng-container` column definitions), `mat-paginator`, `mat-icon`, and `mat-spinner` for loading states. (`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.html|OSKOrganizationBuildingDoorsListComponent|mat-table|#1` `` is implied by `dataSource` binding, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.html|OSKOrganizationBuildingDoorsListComponent|mat-paginator|#1` ``).
  - Bindings include `dataSource` on the table, `keyup` or `input` events on filter inputs, and `click` handlers on action buttons. (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.html|OSKOrganizationBuildingDoorsListComponent|dataSource|#1` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.html|OSKOrganizationBuildingDoorsListComponent|keyup|#1` ``).
- **Detail Component (`OSKOrganizationBuildingDetailsComponent`)**:
  - Composes multiple `mat-card` elements, `mat-card-header`, `mat-card-title`, `mat-card-content`, `mat-card-footer`, and `mat-spinner`. (`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/organization-building-details.component.html|OSKOrganizationBuildingDetailsComponent|mat-card|#1` ``).
  - Bindings include `routerLink` on navigation buttons to redirect users to units, doors, or edit views. (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/organization-building-details.component.html|OSKOrganizationBuildingDetailsComponent|routerLink|#2` ``).

---

#### portals_organization_entities_entity_properties_general-rules

The `OSKListSettingsComponent` renders a card-based layout (`mat-card`, `mat-card-content`) to display and manage building settings `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html` (lines 16, 98) ``:
- **Building List**: Displays buildings inside an expansion panel (`mat-expansion-panel`, `mat-expansion-panel-header`, `mat-panel-title`) using `mat-list` and `mat-list-item` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html` (lines 38-41, 46, 48) ``.
- **Settings Controls**: Uses `mat-slide-toggle` components to bind boolean settings like `allowQuickcodes`, `allowResidentAddition`, `allowCoResidentAddition`, `allowResidentsToSendInvitations`, `allowPermanentGuestsInvitations`, and `allowIntercomDisplayName` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html` (lines 203, 217, 241, 255, 277) ``.
- **Loading Indicators**: Employs `mat-spinner` to show loading states during settings retrieval (`isLoadingSettings`) and updates (`loadingUpdate`) `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html` (lines 74, 91) ``.

### Bindings
- **`mat-list-item`**: Binds `active` and `click` events to select a building, and displays a `matTooltip` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html` (line 48) ``.
- **`mat-slide-toggle`**: Binds `checked` to the current setting value, `disabled` to computed signals deriving edit permissions, and `change` to trigger setting updates `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html` (lines 203, 217, 241, 255, 277) ``.

---

#### portals_organization_entities_entity_properties_inhabitants

### `OSKCreateOrganizationInhabitantComponent`
- **Template Composition**: Renders a multi-step creation wizard using Angular Material's stepper components (`mat-stepper`, `mat-step`) (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|mat-stepper|#1` ``]).
- **Bindings**:
  - Binds reactive forms using `formGroup` on the step forms (**Confirmed** [`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|formGroup|#1` ``]).
  - Renders unit/door selection lists using `mat-selection-list` and `mat-list-option` (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|mat-selection-list|#1` ``]).
  - Uses `mat-datepicker` and `mat-datepicker-toggle` for scheduling access dates (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|mat-datepicker|#1` ``]).
  - Handles click events on action buttons to navigate steps or submit forms (**Confirmed** [`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|click|#1` ``]).

### `OSKOrganizationInhabitantDetailsComponent`
- **Template Composition**: Renders resident details inside a card layout (`mat-card`, `mat-card-content`, `mat-card-actions`) (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-card|#1` ``]).
- **Bindings**:
  - Organizes information into tabs using `mat-tab-group` and `mat-tab` (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-tab-group|#1` ``]).
  - Uses two-way data binding (`ngModel` and `ngModelChange`) on input fields for editing resident profile details (**Confirmed** [`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|ngModel|#1` ``]).
  - Displays loading states using `mat-spinner` (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-spinner|#1` ``]).

### `OSKOrganizationInhabitantsListComponent`
- **Template Composition**: Renders a list of inhabitants inside a `mat-card` using a data table (`mat-table` or standard `table` with `dataSource`) (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|mat-card|#1` ``], [`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|dataSource|#1` ``]).
- **Bindings**:
  - Integrates pagination using `mat-paginator` (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|mat-paginator|#1` ``]).
  - Binds `routerLink` on table rows to navigate to the details page of a specific resident (**Confirmed** [`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|routerLink|#1` ``]).

---

#### portals_organization_entities_entity_properties_users

### `OSKInviteOrganizationUserComponent`
- **Template Composition**: Composes Angular Material elements such as `mat-card`, `mat-card-content`, `mat-form-field`, `mat-select`, `mat-slide-toggle`, and `mat-spinner` (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html` ``).
- **Bindings**:
  - Binds a `FormGroup` named `userForm` to the form element (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html|OSKInviteOrganizationUserComponent|formGroup|#1` ``).
  - Binds form controls for `firstName`, `lastName`, `email`, `countryList`, and `phoneNumber` (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html|OSKInviteOrganizationUserComponent|formControlName|#1` ``).
  - Slide toggles bind to role selection changes to dynamically toggle roles (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html|OSKInviteOrganizationUserComponent|change|#1` ``).

### `OSKOrganizationUserDetailsComponent`
- **Template Composition**: Composes `mat-card`, `mat-form-field`, `mat-select`, `mat-slide-toggle`, and `mat-spinner` (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.html` ``).
- **Bindings**:
  - Binds `formGroup` to display and modify user details (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.html|OSKOrganizationUserDetailsComponent|formGroup|#1` ``).
  - Binds `change` and `checked` properties on `mat-slide-toggle` to manage role modifications (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.html|OSKOrganizationUserDetailsComponent|change|#1` ``).

### `OSKOrganizationUsersListComponent`
- **Template Composition**: Composes a Material table (`table`), `mat-paginator`, `mat-spinner`, and action buttons (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.html` ``).
- **Bindings**:
  - Binds `dataSource` to the table to render the list of users (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.html|OSKOrganizationUsersListComponent|dataSource|#1` ``).
  - Binds `click` events on table rows to navigate to user details (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.html|OSKOrganizationUsersListComponent|click|#2` ``).
  - Binds `click` events on action buttons to trigger user deletion or invitation cancellation (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.html|OSKOrganizationUsersListComponent|click|#1` ``).

---

#### portals_organization_entities_entity_suppliers

### `OSKSuppliersListComponent`
- **Composition**: Renders a card layout containing a search input field, a table of suppliers, and a paginator.
- **Bindings**:
  - Search input binds to `applyFilter($event)` on `(input)` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.html|OSKSuppliersListComponent|input|#1` ``).
  - Table binds to `dataSource` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.html|OSKSuppliersListComponent|dataSource|#1` ``).
  - "Add Supplier" button triggers `openCreateSupplierDialog()` on `(click)` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.html|OSKSuppliersListComponent|click|#1` ``).
  - Row click triggers `toggleRow(row)` to expand/collapse supplier staff details (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.html|OSKSuppliersListComponent|click|#2` ``).

### `OSKSuppliersDetailsComponent`
- **Composition**: Renders a tab group with three tabs: "Details", "Staff", and "Access".
- **Bindings**:
  - Tab group binds `[selectedIndex]` to `selectedTabIndex` and `(selectedTabChange)` to `handleTabChange($event)` to prompt for unsaved changes before switching tabs (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.html|OSKSuppliersDetailsComponent|selectedIndex|#1` ``).
  - "Delete Supplier" button triggers `deleteSupplier()` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.html|OSKSuppliersDetailsComponent|click|#1` ``).
  - "Add Staff Member" button triggers `addStaffMember()` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.html|OSKSuppliersDetailsComponent|click|#5` ``).
  - "Grant Access" button triggers `openSuppliersStaffAccessDialog()` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.html|OSKSuppliersDetailsComponent|click|#8` ``).
  - Pincode visibility toggle triggers `togglePincode(pincode.id)` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.html|OSKSuppliersDetailsComponent|click|#13` ``).

### `OSKSuppliersCreationComponent`
- **Composition**: Renders a dialog with a `mat-stepper` containing steps for "Supplier Info" and "Staff Members".
- **Bindings**:
  - Form groups bind to `supplierForm` and `staffForm` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.html|OSKSuppliersCreationComponent|formGroup|#1` ``).
  - "Add Staff Member" button triggers `addStaffMember()` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.html|OSKSuppliersCreationComponent|click|#3` ``).
  - "Save" button triggers `saveAll()` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.html|OSKSuppliersCreationComponent|click|#6` ``).

### `OSKSuppliersStaffAccessComponent`
- **Composition**: Renders a multi-step dialog stepper: "Select Staff" -> "Select Doors" -> "Schedule" -> "Priority & Confirm".
- **Bindings**:
  - Staff selection list binds to `selectedStaff` form control (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.html|OSKSuppliersStaffAccessComponent|formGroup|#1` ``).
  - Door selection list binds to `selectedDoors` form control (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.html|OSKSuppliersStaffAccessComponent|formGroup|#2` ``).
  - Datepickers bind to `startDate` and `endDate` form controls (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.html|OSKSuppliersStaffAccessComponent|matDatepicker|#1` ``).
  - Conflict resolution delete button triggers `deleteConflictingAccess(conflict, staff, $event)` (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.html|OSKSuppliersStaffAccessComponent|click|#3` ``).

---

#### portals_organization_onboarding-cards

The components in this capability compose various Angular Material and custom elements to build the onboarding card interfaces:

- **`OSKOnboardingCardFormComponent`**
  - Renders a form inside a `mat-card` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.html|OSKOnboardingCardFormComponent|mat-card|#1` ``.
  - Composes multiple `mat-form-field` elements for inputting first name, last name, email, phone number, and selecting inhabitant types, buildings, units, and doors `` `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.html` (lines 18-162) ``.
  - Integrates `mat-datepicker` and `ngx-mat-timepicker` for configuring access right validity periods `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.html|OSKOnboardingCardFormComponent|mat-datepicker|#1` ``.

- **`OSKAddOnboardingCardsComponent`**
  - Composes a `cdk-accordion` containing `cdk-accordion-item` elements to manage multiple onboarding cards `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.html|OSKAddOnboardingCardsComponent|cdk-accordion|#1` ``.
  - Embeds `osk-onboarding-card-form` inside the accordion items, passing down `buildings`, `buildingsObject`, `countries`, `onboardingCard`, and `organizationId` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.html|OSKAddOnboardingCardsComponent|onboardingCard|#1` ``.

- **`OSKEditOnboardingCardComponent`**
  - Embeds `osk-onboarding-card-form` inside a `mat-card` to edit a single card `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.html|OSKEditOnboardingCardComponent|osk-onboarding-card-form|#1` ``.

- **`OSKCreateOnboardingCardsComponent`**
  - Composes a `mat-stepper` with multiple `mat-step` sections to guide the user through creating onboarding cards `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.html|OSKCreateOnboardingCardsComponent|mat-stepper|#1` ``.

- **`OSKOnboardingCardsListComponent`**
  - Renders a `table` with `dataSource` to list onboarding documents `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.html|OSKOnboardingCardsListComponent|dataSource|#1` ``.
  - Integrates a `mat-paginator` for list pagination `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.html|OSKOnboardingCardsListComponent|mat-paginator|#1` ``.

---

#### portals_user

### `OSKAccountComponent`
Renders a profile management card using Angular Material components `` `hosting/web-app/src/app/features/portals/user/account/account.component.html` ``:
- **Structural Elements**:
  - `mat-card` and `mat-card-content` container `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|mat-card|#1` ``.
  - Form fields (`mat-form-field`) for first name, last name, email, phone number, and country selection `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|mat-form-field|#1` ``.
  - A country dropdown selector (`mat-select` with `mat-option`) `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|mat-select|#1` ``.
  - A loading spinner (`mat-spinner`) displayed during save operations `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|mat-spinner|#1` ``.
- **Bindings**:
  - `formGroup` bound to the component's reactive form `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|formGroup|#1` ``.
  - `formControlName` bindings for input fields: `firstName`, `lastName`, `email`, and `phoneNumber` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|formControlName|#1` ``.
  - Two-way binding (`ngModel` / `ngModelChange`) on `mat-select` for the selected country `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|ngModel|#1` ``.
  - Form `submit` event bound to the component's `submit()` handler `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|submit|#1` ``.
  - Submit button `disabled` state bound to form validity or saving status `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|disabled|#1` ``.

### `OSKNotificationsComponent`
- Renders a simple card layout using `mat-card` and `mat-card-content` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/notifications/notifications.component.html|OSKNotificationsComponent|mat-card|#1` ``.

### `OSKSettingsComponent`
- Renders a simple card layout using `mat-card` and `mat-card-content` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/settings/settings.component.html|OSKSettingsComponent|mat-card|#1` ``.

---

#### portals_user_invitations

The `OSKSendUserInvitationComponent` template is composed of standard Angular Material components and third-party timepicker elements to build the invitation form:
- **Layout & Structure**: Uses `mat-card` and `mat-card-content` to group form sections [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html|OSKSendUserInvitationComponent|mat-card|#1` ``).
- **Form Controls**: Uses `mat-form-field`, `mat-select`, and `mat-option` to allow selection of buildings and units [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html|OSKSendUserInvitationComponent|mat-select|#1` ``).
- **Date & Time Selection**: Integrates `mat-datepicker` and `ngx-mat-timepicker` for configuring the validity window of access rights [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html|OSKSendUserInvitationComponent|mat-datepicker|#1` `` and `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html|OSKSendUserInvitationComponent|ngx-mat-timepicker|#1` ``).
- **Feedback**: Displays a `mat-spinner` during submission [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html|OSKSendUserInvitationComponent|mat-spinner|#1` ``).

### Bindings
- **Two-Way Data Binding**: Uses `ngModel` and `ngModelChange` to bind form inputs (such as selected building, unit, date, and time) to the local component state [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html|OSKSendUserInvitationComponent|ngModel|#1` ``).
- **Event Handlers**: Binds `click` events to trigger actions like adding access rights, removing access rights, and submitting the invitation [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html|OSKSendUserInvitationComponent|click|#1` ``).

---

#### portals_user_organizations

The `OSKOrganizationInvitationsComponent` template utilizes Angular Material components to display and manage invitations:
- **Layout Structure**: Uses `mat-card` and `mat-card-content` to wrap the invitations list. [Confirmed] (`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|mat-card|#1` ``)
- **Data Table**: Displays invitations in a table bound to a `dataSource` property. [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|dataSource|#1` ``)
- **Action Buttons**: Renders buttons for accepting and rejecting invitations, which trigger the `acceptInvitation` and `rejectInvitation` component methods on click. [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|click|#1` `` and `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|click|#2` ``)
- **Button Disabling**: Action buttons are disabled based on the `disableButtons` signal state. [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|disabled|#1` ``)
- **Status Indicators**: Uses `mat-icon` elements with success and danger color inputs to indicate status. [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|color-success|#1` `` and `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|color-danger|#1` ``)
- **Loading Spinners**: Displays `mat-spinner` elements during data loading or action processing. [Confirmed] (`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|mat-spinner|#1` ``)
- **Paging**: Includes a `mat-paginator` bound to `pageSize` and `pageSizeOptions`. [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|pageSize|#1` ``)

---

#### portals_user_organizations_pending-organizations

### `OSKAddOrganizationComponent`
Renders a registration form within a Material Card layout.
- **Structural Elements**: Composed of `mat-card`, `mat-card-content`, `mat-form-field`, `mat-label`, `mat-select`, `mat-option`, `mat-error`, and `mat-spinner` `` `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html` (lines 16-112) ``.
- **Bindings**:
  - The form element binds to `formGroup` and handles the `submit` event `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|formGroup|#1` ``.
  - Form inputs bind to specific controls via `formControlName` (e.g., street address, postal code, city, latitude, longitude) `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|formControlName|#1` ``.
  - The country selector `mat-select` binds to `ngModel` and handles `ngModelChange` and `valueChange` to trigger country updates `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|ngModel|#1` ``.
  - The submit button's `disabled` state is bound to form validity or saving state `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|disabled|#2` ``.

### `OSKUserPendingOrganizationsComponent`
Renders a tabular list of pending organizations.
- **Structural Elements**: Composed of `mat-card`, `mat-card-content`, `mat-paginator`, `mat-spinner`, and multiple `ng-container` elements for table columns `` `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html` (lines 16-79) ``.
- **Bindings**:
  - The `table` element binds its `dataSource` to the component's pending organizations data `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html|OSKUserPendingOrganizationsComponent|dataSource|#1` ``.
  - The `mat-paginator` binds to `pageSize` and `pageSizeOptions` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html|OSKUserPendingOrganizationsComponent|pageSize|#1` ``.

---

### 6. API Contracts & Routes

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

### 7. State Ownership

**Ownership conclusion:**

While individual capabilities manage localized, component-specific reactive state, the module exhibits clear patterns of shared state ownership across submodule boundaries: **[Confirmed]**

- **Cross-Capability State Sharing**:
  - `OSKOnboardingCardsService` (defined in `portals_organization_onboarding-cards`) acts as a shared state manager, called by three distinct submodules: `portals_organization_entities_entity_properties_inhabitants`, `portals_organization_entities_entity_properties_users`, and `portals_organization_entities_entity_suppliers`. This indicates that onboarding card state is a unified concern across the entire property-level administration domain. **[Confirmed]**
  - `OSKAuthService` (defined in `authentication`) maintains the global authentication and loading state, consumed internally by the `portals` submodule and externally by the `components` module to drive shell-level visibility. **[Confirmed]**
  - `OSKOrganizationPropertyService` (defined in `portals_organization_entities_entity_properties`) bridges the navigation shell (`portals`) and the entity dashboard (`portals_organization_entities_entity`), serving as the single source of truth for property metadata during navigation. **[Confirmed]**

**Per-capability evidence:**

#### authentication

### Signals

- **OSKSignInComponent.signInMethod**: Holds the currently selected sign-in method (type: `OSKSignInMethod | null`, default: `null`). (Cite: `` `angular_signal|features|hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts|OSKSignInComponent|signInMethod` ``)
- **OSKSignInWithEmailLinkComponent.currentStep**: Tracks the current step in the email link sign-in flow (type: `OSKEmailLinkSignInSteps`, default: `SignInSteps.SIGN_IN_FORM`). (Cite: `` `angular_signal|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-link/sign-in-with-email-link.component.ts|OSKSignInWithEmailLinkComponent|currentStep` ``)
- **OSKSignUpWithEmailLinkComponent.currentStep**: Tracks the current step in the email link sign-up flow (type: `OSKEmailLinkSignUpSteps`, default: `SignInSteps.SIGN_UP_FORM`). (Cite: `` `angular_signal|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-up-with-email-link/sign-up-with-email-link.component.ts|OSKSignUpWithEmailLinkComponent|currentStep` ``)
- **OSKAuthService.isLoading**: Exposes a read-only or writable signal indicating whether an authentication process is in progress (type: `boolean`, default: `false`). (Cite: `` `angular_signal|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|OSKAuthService|isLoading` ``)

---

#### home

- No local reactive state (such as Angular Signals) is evidenced within this capability pack. (Unknown)

---

#### portals

The capability manages several local reactive states using Angular Signals:

### `OSKSidemenuService`
- **`_sidemenu`**: Private writeable signal holding the current navigation stack state of type `OSKCurrentSidemenus`. `` `angular_signal|features|hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts|OSKSidemenuService|_sidemenu` ``
- **`sidemenu`**: Public read-only computed signal exposing the active navigation stack. `` `angular_signal|features|hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts|OSKSidemenuService|sidemenu` ``

### `OSKSidemenuComponent`
- **`currentProperty`**: Local signal holding the currently active property data or `null`. `` `angular_signal|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|OSKSidemenuComponent|currentProperty` ``
- **`entityProperties`**: Local signal holding an array of properties associated with the active organization/entity, or `undefined`. `` `angular_signal|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|OSKSidemenuComponent|entityProperties` ``

### `OSKConfirmDialogComponent`
- **`confirming`**: Local writeable signal tracking whether the dialog's confirmation action is currently executing (loading state). `` `angular_signal|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.ts|OSKConfirmDialogComponent|confirming` ``

---

#### portals_organization

No local reactive state (such as Angular Signals) is evidenced in this capability's components or services. [Confirmed]

---

#### portals_organization_entities

The `OSKEntitiesDashboardComponent` owns and manages the following local reactive states using Angular Signals:

- **`entities`**: Holds an array of `OSKSubEntity` objects representing the filtered list of sub-entities `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|entities` ``.
- **`loading`**: A boolean signal indicating whether the initial list of entities is being fetched `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|loading` ``.
- **`showCreateEntityForm`**: A boolean signal controlling the visibility of the "Create Entity" form card `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|showCreateEntityForm` ``.
- **`creatingEntity`**: A boolean signal indicating whether a creation request is currently in progress `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|creatingEntity` ``.
- **`updatingEntity`**: A boolean signal indicating whether an update request is currently in progress `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|updatingEntity` ``.
- **`editingEntityId`**: A signal holding the string ID of the entity currently being edited, or `null` if no edit is active `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|editingEntityId` ``.

---

#### portals_organization_entities_entity

`OSKEntityDashboardComponent` manages the following reactive state:
- **`entityDashboardStatics`**: A plain signal that holds the raw dashboard statistics retrieved from the backend. [Confirmed] (via `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent|entityDashboardStatics` ``)
- **`properties`**: A plain signal that holds the list of properties associated with the entity. [Confirmed] (via `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent|properties` ``)
- **`stats`**: A computed signal that derives formatted dashboard metrics (devices, residents, buildings, and admins) from `entityDashboardStatics` for UI rendering. [Confirmed] (via `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent|stats` `` and `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|computed|anon|() => {     const statics = this.entityDashboardStatics();...` ``)

---

#### portals_organization_entities_entity_message-center

This capability manages local reactive state using Angular Signals:

- **`OSKMessageCenterDetailsComponent.communication`**: `WritableSignal<OSKIntercomCommunication | null>`  
  Holds the currently loaded communication details. (Confirmed) `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-details/message-center-details.component.ts|OSKMessageCenterDetailsComponent|communication` ``
- **`OSKMessageCenterDetailsComponent.isLoading`**: `WritableSignal<boolean>`  
  Tracks the loading state of the details view. (Confirmed) `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-details/message-center-details.component.ts|OSKMessageCenterDetailsComponent|isLoading` ``
- **`OSKMessageCenterListComponent.isLoading`**: `WritableSignal<boolean>`  
  Tracks the loading state of the communications list. (Confirmed) `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|OSKMessageCenterListComponent|isLoading` ``
- **`OSKReplaceCommunicationConfirmDialogComponent.confirming`**: `WritableSignal<boolean>`  
  Tracks whether the user is currently confirming the replacement action. (Confirmed) `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.ts|OSKReplaceCommunicationConfirmDialogComponent|confirming` ``

---

#### portals_organization_entities_entity_properties

The components and services hold the following local reactive state via Angular Signals:

### `OSKOrganizationPropertiesCreateComponent`
- **`buildings`**: Signal holding the list of available buildings. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|OSKOrganizationPropertiesCreateComponent|buildings` ``
- **`countries`**: Signal holding the list of countries. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|OSKOrganizationPropertiesCreateComponent|countries` ``
- **`entities`**: Signal holding sub-entities. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|OSKOrganizationPropertiesCreateComponent|entities` ``
- **`saving`**: Signal indicating if the form is currently submitting. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|OSKOrganizationPropertiesCreateComponent|saving` ``
- **`selectedCountry`**: Signal holding the currently selected country object. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|OSKOrganizationPropertiesCreateComponent|selectedCountry` ``

### `OSKOrganizationPropertiesEditComponent`
- **`buildings`**: Signal holding the list of buildings. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent|buildings` ``
- **`countries`**: Signal holding the list of countries. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent|countries` ``
- **`entities`**: Signal holding sub-entities. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent|entities` ``
- **`loading`**: Signal indicating if the property details are loading. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent|loading` ``
- **`saving`**: Signal indicating if updates are being saved. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent|saving` ``
- **`selectedCountry`**: Signal holding the selected country. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent|selectedCountry` ``

### `OSKOrganizationPropertiesListComponent`
- **`properties`**: Signal holding the list of properties. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|OSKOrganizationPropertiesListComponent|properties` ``

### `OSKPropertyDashboardComponent`
- **`buildings`**: Signal holding the list of buildings. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent|buildings` ``
- **`currentProperty`**: Signal holding the active property details. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent|currentProperty` ``
- **`onboardingDocuemnts`**: Signal holding onboarding documents. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent|onboardingDocuemnts` ``
- **`pmpResidentDocuemnts`**: Signal holding resident documents. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent|pmpResidentDocuemnts` ``
- **`propertyDashboardStatics`**: Signal holding dashboard statistics. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent|propertyDashboardStatics` ``
- **`users`**: Signal holding the list of users and invitees. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent|users` ``

---

#### portals_organization_entities_entity_properties_buildings

This capability utilizes Angular Signals to manage local reactive UI state within its components:

- **`OSKAddOrganizationBuildingDoorComponent`**:
  - `countries`: `WritableSignal<Country[]>` (default `[]`) — Stores the list of countries fetched for address selection. (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|OSKAddOrganizationBuildingDoorComponent|countries` ``).
  - `selectedCountry`: `WritableSignal<Country | undefined>` (default `undefined`) — Tracks the currently selected country. (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|OSKAddOrganizationBuildingDoorComponent|selectedCountry` ``).
  - `loading`: `WritableSignal<boolean>` (default `false`) — Tracks component initialization loading state. (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|OSKAddOrganizationBuildingDoorComponent|loading` ``).
  - `saving`: `WritableSignal<boolean>` (default `false`) — Tracks form submission saving state. (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|OSKAddOrganizationBuildingDoorComponent|saving` ``).

- **`OSKAddOrganizationBuildingUnitComponent`**:
  - `countries`: `WritableSignal<Country[]>` (default `[]`) (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts|OSKAddOrganizationBuildingUnitComponent|countries` ``).
  - `selectedCountry`: `WritableSignal<Country | undefined>` (default `undefined`) (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts|OSKAddOrganizationBuildingUnitComponent|selectedCountry` ``).
  - `loading`: `WritableSignal<boolean>` (default `false`) (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts|OSKAddOrganizationBuildingUnitComponent|loading` ``).
  - `saving`: `WritableSignal<boolean>` (default `false`) (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts|OSKAddOrganizationBuildingUnitComponent|saving` ``).

- **`OSKAddOrganizationBuildingComponent`**:
  - `countries`: `WritableSignal<Country[]>` (default `[]`) (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts|OSKAddOrganizationBuildingComponent|countries` ``).
  - `selectedCountry`: `WritableSignal<Country | undefined>` (default `undefined`) (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts|OSKAddOrganizationBuildingComponent|selectedCountry` ``).
  - `loading`: `WritableSignal<boolean>` (default `false`) (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts|OSKAddOrganizationBuildingComponent|loading` ``).
  - `saving`: `WritableSignal<boolean>` (default `false`) (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts|OSKAddOrganizationBuildingComponent|saving` ``).

- **`OSKOrganizationBuildingDetailsComponent`**:
  - `building`: `WritableSignal<OSKBuildingDetails | undefined>` (default `undefined`) — Holds the detailed building metrics. (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/organization-building-details.component.ts|OSKOrganizationBuildingDetailsComponent|building` ``).

- **`OSKOrganizationBuildingDoorsListComponent`**:
  - `doors`: `WritableSignal<BuildingDoor[] | undefined>` (default `undefined`) — Holds the list of doors for the building. (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.ts|OSKOrganizationBuildingDoorsListComponent|doors` ``).

- **`OSKOrganizationBuildingUnitsListComponent`**:
  - `units`: `WritableSignal<BuildingUnit[] | undefined>` (default `undefined`) — Holds the list of units for the building. (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/organization-building-units-list.component.ts|OSKOrganizationBuildingUnitsListComponent|units` ``).

- **`OSKOrganizationBuildingsListComponent`**:
  - `buildings`: `WritableSignal<Building[] | undefined>` (default `undefined`) — Holds the list of buildings for the property. (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts|OSKOrganizationBuildingsListComponent|buildings` ``).

---

#### portals_organization_entities_entity_properties_general-rules

`OSKListSettingsComponent` holds the following reactive state:
- **`buildings`**: Signal holding the list of buildings. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|buildings` ``
- **`selectedBuilding`**: Signal holding the currently selected building. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|selectedBuilding` ``
- **`selectedBuildingSettings`**: Signal holding the fetched settings for the selected building. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|selectedBuildingSettings` ``
- **`tempBuildingSettings`**: Signal holding a mutable copy of the settings during editing. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|tempBuildingSettings` ``
- **`isLoadingSettings`**: Signal tracking the loading state of settings. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isLoadingSettings` ``
- **`loadingUpdate`**: Signal tracking the saving/updating state. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|loadingUpdate` ``
- **`isAllowQuickcodesDisabled`**: Computed signal deriving whether quickcode changes are disabled. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowQuickcodesDisabled` ``
- **`isAllowResidentAdditionDisabled`**: Computed signal deriving whether resident addition changes are disabled. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowResidentAdditionDisabled` ``
- **`isAllowCoResidentAdditionDisabled`**: Computed signal deriving whether co-resident addition changes are disabled. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowCoResidentAdditionDisabled` ``
- **`isAllowResidentsToSendInvitationsDisabled`**: Computed signal deriving whether resident invitation changes are disabled. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowResidentsToSendInvitationsDisabled` ``
- **`isAllowPermanentGuestsInvitationsDisabled`**: Computed signal deriving whether permanent guest invitation changes are disabled. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowPermanentGuestsInvitationsDisabled` ``
- **`isAllowIntercomDisplayNameDisabled`**: Computed signal deriving whether intercom display name changes are disabled. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowIntercomDisplayNameDisabled` ``

---

#### portals_organization_entities_entity_properties_inhabitants

This capability manages local reactive UI state using Angular Signals (**Confirmed**):
- **`OSKOrganizationInhabitantDetailsComponent.pmpResidentDocuemnt`**: Holds the current resident's document state (type: `OSKPmpResidentDocument | undefined`) (**Confirmed** [`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|pmpResidentDocuemnt` ``]).
- **`OSKOrganizationInhabitantsListComponent.pmpResidentDocuemnts`**: Holds the list of resident documents (type: `OSKDocumentListResponse | undefined`) (**Confirmed** [`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent|pmpResidentDocuemnts` ``]).

---

#### portals_organization_entities_entity_properties_users

This capability utilizes Angular Signals to manage local UI and reactive state:

### `OSKInviteOrganizationUserComponent`
- **`adminRole`**: Holds the specific `OSKRole` object representing the administrator role. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|adminRole` ``).
- **`allUserCompositeRoles`**: Holds all available composite roles fetched from the backend. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|allUserCompositeRoles` ``).
- **`allUserRoles`**: Holds the mapped list of roles with modification timestamps. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|allUserRoles` ``).
- **`lang`**: Computed signal deriving the current user's language preference. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|lang` ``).
- **`otherRoles`**: Holds non-admin roles available for assignment. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|otherRoles` ``).
- **`rolesLoading`**: Boolean flag indicating if roles are currently being fetched. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|rolesLoading` ``).
- **`saving`**: Boolean flag indicating if the invitation is currently being submitted. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|saving` ``).
- **`userRoles`**: Holds the list of currently selected role IDs. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|userRoles` ``).

### `OSKOrganizationUserDetailsComponent`
- **`adminRole`**: Computed signal identifying the administrator role from available roles. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|adminRole` ``).
- **`availableRoles`**: Holds the list of roles available for assignment. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|availableRoles` ``).
- **`backLink`**: Computed signal deriving the navigation link to return to the users list. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|backLink` ``).
- **`lang`**: Computed signal deriving the current user's language preference. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|lang` ``).
- **`loading`**: Boolean flag indicating if user details are currently loading. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|loading` ``).
- **`otherRoles`**: Computed signal filtering out admin roles from available roles. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|otherRoles` ``).
- **`saving`**: Boolean flag indicating if role updates are currently being saved. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|saving` ``).

### `OSKOrganizationUsersListComponent`
- **`saving`**: Boolean flag indicating if a deletion or cancellation action is in progress. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent|saving` ``).
- **`users`**: Holds the list of organization users and invitees. **Confirmed** (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent|users` ``).

---

#### portals_organization_entities_entity_suppliers

The capability manages local reactive state using Angular Signals (Confirmed, `angular_signal` facts):

### `OSKSuppliersDetailsComponent`
- **`supplier`**: Holds the current `OSKSupplier` model being viewed/edited (Type: `WritableSignal<OSKSupplier | undefined>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|supplier` ``).
- **`buildings`**: Holds the list of buildings loaded for the current entity (Type: `WritableSignal<OSKBuilding[] | undefined>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|buildings` ``).
- **`selectedTabIndex`**: Tracks the active tab index (Type: `WritableSignal<number>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|selectedTabIndex` ``).
- **`staffSearchTerm`**: Holds the search query for filtering staff members (Type: `WritableSignal<string>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|staffSearchTerm` ``).
- **`revealedPincodes`**: Tracks which pincode IDs are currently visible (Type: `WritableSignal<Set<string>>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|revealedPincodes` ``).
- **`hasAccessChanges`**: Tracks if there are pending access deletions (Type: `WritableSignal<boolean>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|hasAccessChanges` ``).
- **`loading`**: Tracks overall loading state (Type: `WritableSignal<boolean>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|loading` ``).
- **`savingDetails`**: Tracks saving state of the supplier details form (Type: `WritableSignal<boolean>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|savingDetails` ``).
- **`savingStaff`**: Tracks saving state of the staff roster form (Type: `WritableSignal<boolean>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|savingStaff` ``).
- **`savingAccess`**: Tracks saving state of access modifications (Type: `WritableSignal<boolean>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|savingAccess` ``).

### `OSKSuppliersListComponent`
- **`suppliers`**: Holds the list of loaded suppliers with their staff members (Type: `WritableSignal<OSKSupplier[] | undefined>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|OSKSuppliersListComponent|suppliers` ``).
- **`staffLoading`**: Tracks loading state of staff members (Type: `WritableSignal<Record<string, boolean>>`) (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|OSKSuppliersListComponent|staffLoading` ``).

---

#### portals_organization_onboarding-cards

The capability manages local reactive state using Angular Signals within `OSKOnboardingCardsListComponent` `` `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts` ``:

- **`onboardingDocuemnts`** (Signal)
  - **Type**: `OSKInhabitantOnboardingDocument[] | undefined` (Inferred)
  - **Access**: Public (Inferred)
  - **Description**: Holds the list of onboarding documents retrieved from the backend `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent|onboardingDocuemnts` ``.
- **`onboardingActivationCode`** (Signal)
  - **Type**: `string | undefined` (Inferred)
  - **Access**: Public (Inferred)
  - **Description**: Holds the activation code currently being verified `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent|onboardingActivationCode` ``.

---

#### portals_user

This capability does not define local Angular signals directly in its components or services. However, it reactively consumes external user state:
- **`currentUser`**: Consumed in `OSKAccountComponent` via the injected `OSKCurrentUserToken` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|inject|anon|OSKCurrentUserToken|#1` ``.

---

#### portals_user_invitations

`OSKSendUserInvitationComponent` manages the following local reactive state using Angular Signals:
- **`buildingsWithUnits`**: Holds the list of buildings and their nested units retrieved from the backend [Confirmed] (via `` `angular_signal|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|buildingsWithUnits` ``).
- **`unitsToChoose`**: Holds the list of units available for selection, filtered by the currently selected building [Confirmed] (via `` `angular_signal|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|unitsToChoose` ``).
- **`buildingsToChoose`**: Holds a unique set of building IDs extracted from the retrieved units [Confirmed] (via `` `angular_signal|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|buildingsToChoose` ``).

---

#### portals_user_organizations

The `OSKOrganizationInvitationsComponent` manages the following local reactive state:
- **disableButtons**: A writable signal of type `boolean` (initialized to `false`) used to disable action buttons during pending operations. [Confirmed] (`` `angular_signal|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|OSKOrganizationInvitationsComponent|disableButtons` ``)
- **invitations**: A writable signal holding the list of invitations (initialized to `undefined`). [Confirmed] (`` `angular_signal|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|OSKOrganizationInvitationsComponent|invitations` ``)

---

#### portals_user_organizations_pending-organizations

### Reactive UI State
- **`OSKUserPendingOrganizationsComponent.pendingOrganizations`** [Confirmed]
  - **Type**: Signal (initially `undefined`, holds array of pending organizations)
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts`
  - **Reference**: `` `angular_signal|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts|OSKUserPendingOrganizationsComponent|pendingOrganizations` ``

---

### 8. Outbound Coupling

#### authentication

### Import-based Coupling

- **core module**:
  - `@oskey/core/types` (Cite: `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts|@oskey/core/types|#1` ``)
  - `@oskey/translate` (Cite: `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts|@oskey/translate|#1` ``)
  - `@oskey/core` (Cite: `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-and-password/sign-in-with-email-and-password.component.ts|@oskey/core|#1` ``)
  - `@oskey/firebase` (Cite: `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-and-password/sign-in-with-email-and-password.component.ts|@oskey/firebase|#1` ``)
- **features module (other submodules)**:
  - `portals_organization_entities_entity_properties_users` (specifically `organization-user.type` file) (Cite: `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|../../portals/organization/features/entities/features/entity/features/properties/features/users/types/organization-user.type|#1` ``)

### Template-composition Coupling

- **OSKSignInComponent** composes `OSKSelectSignInMethodComponent`, `OSKSignInWithEmailAndPasswordComponent`, `OSKSignUpWithEmailLinkComponent`, `OSKSignInWithEmailLinkComponent`, and `OSKSignInWithAuth0Component` in its template. (Cite: `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` line 24)

---

#### home

#### Import-Based Coupling
- **`core` Module (`translate` submodule)**: Imports `@oskey/translate` to resolve translation utilities like `OSKTranslatePipe` `` `imports_dependency|features|hosting/web-app/src/app/features/home/home.component.ts|@oskey/translate|#1` ``. (Confirmed)
- **`components` Module (`header` submodule)**: Imports `src/app/components/header/header.component` to resolve `OSKHeaderComponent` `` `imports_dependency|features|hosting/web-app/src/app/features/home/home.component.ts|src/app/components/header/header.component|#1` ``. (Confirmed)

#### Template-Composition Coupling
- **`components` Module (`header` submodule)**: Composes the `<osk-header>` selector within the template of `OSKHomeComponent` `` `angular_template_composition|features|hosting/web-app/src/app/features/home/home.component.html|OSKHomeComponent|osk-header|#1` ``. (Confirmed)

---

#### portals

### Import-Based Coupling
- **`core` Module**:
  - Imports core types and tokens (such as `OSKCurrentUserToken`) from `@oskey/core/types` and `@oskey/core`. `` `hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts` (lines 25-26) ``
  - Imports translation utilities from `@oskey/translate`. `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts` (line 33) ``
- **`features` Module**:
  - **`authentication` capability**: Imports `OSKAuthService` to handle user sign-out actions from the side menu. `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts` (line 32) ``
  - **`portals_organization_entities_entity_properties` capability**: Imports `OSKOrganizationPropertyService` to fetch property data dynamically based on route parameters. `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts` (line 41) ``

### Template-Composition Coupling
- **`OSKPortalComponent`** composes **`OSKSidemenuComponent`** in its template. `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/portal.component.html|OSKPortalComponent|router-outlet|#1` ``

---

#### portals_organization

#### Import-Based Coupling
- **`core` module (`translate` submodule)**: Both `OSKNotificationsComponent` and `OSKSettingsComponent` import `@oskey/translate` to resolve translation pipes `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|@oskey/translate|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|@oskey/translate|#1` ``.
- **External Angular Material**: Both components import `@angular/material/card` for UI structure `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|@angular/material/card|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|@angular/material/card|#1` ``.
- **External Angular Router**: The routing configuration imports `@angular/router` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|@angular/router|#1` ``.

#### Template-Composition Coupling
- **Angular Material**: Both `OSKNotificationsComponent` and `OSKSettingsComponent` couple to `<mat-card>` and `<mat-card-content>` in their templates `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.html|OSKNotificationsComponent|mat-card|#1` ``, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.html|OSKSettingsComponent|mat-card|#1` ``.

---

#### portals_organization_entities

### Import-Based Coupling

This capability depends on the following external modules and submodules:

- **`core` Module**:
  - `@oskey/core`: Resolves core tokens and services, such as `OSKCurrentUserToken` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@oskey/core|#1` ``.
  - `@oskey/core/types`: Resolves shared types and enums, such as `OSKEntityType` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@oskey/core/types|#1` ``.
  - `@oskey/translate`: Resolves translation utilities, such as `OSKTranslateService` and `OSKTranslatePipe` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@oskey/translate|#1` ``.
  - `@oskey/firebase`: Resolves Firebase HTTPS communication services, specifically `OSKFirebaseHttpsService` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|@oskey/firebase|#1` ``.
- **`features` Module (Portals Submodule)**:
  - `src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component`: Imports `OSKConfirmDialogComponent` to handle deletion confirmations `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component|#1` ``.

### Template-Composition Coupling

- **`OSKTranslatePipe`**: Used directly within the template of `OSKEntitiesDashboardComponent` to translate UI copy `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (line 34) ``.
- **`OSKConfirmDialogComponent`**: Composed dynamically via `MatDialog.open` to prompt the user before deleting an entity `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (line 202) ``.

---

#### portals_organization_entities_entity

- **Import-Based Coupling**:
  - **`core` Module**:
    - Couples to the `guards` submodule to import `userRoleGuard`. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|src/app/core/guards/user-role/user-role.guard|#1` ``)
    - Couples to the `types` submodule to import shared types. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|@oskey/core/types|#1` ``)
    - Couples to the `translate` submodule to import translation utilities. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|@oskey/translate|#1` ``)
    - Couples to the `firebase` submodule to import `OSKFirebaseHttpsService`. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|@oskey/firebase|#1` ``)
    - Couples to the root `core` module for core utilities. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|@oskey/core|#1` ``)
  - **`portals_organization_entities_entity_properties` Submodule**:
    - Imports `OSKOrganizationPropertyService` and property types to fetch and display entity properties. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|../properties/services/organization-property-service.service|#1` `` and `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|../properties/types/organization-property.typs|#1` ``)
  - **`portals_organization_entities_entity_properties_users` Submodule**:
    - Imports `OSKOrganizationUsersListService` to manage or display users. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|../properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service|#1` ``)

- **Template-Composition Coupling**:
  - No template-composition coupling to custom components from other capabilities is evidenced. The component only composes standard Angular Material elements. [Confirmed]

---

#### portals_organization_entities_entity_message-center

### Import-Based Coupling

This capability depends on other submodules and core modules:

- **`portals_organization_entities_entity_suppliers`**: Imports `OSKCustomDateAdapter` from the suppliers submodule. (Confirmed) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|../../../suppliers/features/suppliers-staff-access/custom-date-adapter|#1` ``
- **`portals_organization_entities_entity_properties`**: Imports property types. (Confirmed) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|../../properties/types/organization-property.typs|#1` ``
- **`portals_organization`**: Imports organization-related types. (Confirmed) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|src/app/features/portals/organization/types/with-organization-id.type|#1` ``
- **`authentication`**: Imports `OSKAuthService` to retrieve user context. (Confirmed) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|src/app/features/authentication/services/auth.service|#1` ``
- **`portals`**: Imports `OSKConfirmDialogComponent` for deletion confirmations. (Confirmed) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component|#1` ``
- **`core`**: Imports core types, Firebase utilities, and translation services. (Confirmed) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|@oskey/core/types|#1` ``

### Template-Composition Coupling

- **`OSKMessageCenterListComponent`** opens **`OSKConfirmDialogComponent`** (from the `portals` submodule) dynamically using `MatDialog`. (Confirmed) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|this.createCommunicationDialogue.open|openDeleteCommunication|OSKConfirmDialogComponent,{       data: {         title: this.translate.instant('portals.organization.communication.delete.title'),         message: this.translate.instant('portals.organization.communication.delete.message')       }     }|#1` ``

---

#### portals_organization_entities_entity_properties

### Import-Based Coupling
This capability imports and depends on the following submodules and modules:

- **`portals_organization_entities`**: Imports `OSKOrganizationEntitiesService` and `OSKEntityType` to fetch sub-entities. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|../../../../../entities-dashboard/services/organization-entities.service|#1` ``
- **`portals_organization_entities_entity_properties_buildings`**: Imports `OSKAddOrganizationBuildingService` and `OSKOrganizationBuildingsListService` to manage building lists and country lists. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|../buildings/add-organization-building/services/add-organization-building/add-organization-building.service|#1` ``
- **`portals_organization_entities_entity_properties_inhabitants`**: Imports `OSKOrganizationInhabitantService` and `OSKInhabitantDocument` for dashboard resident data. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|../inhabitants/services/organization-inhabitant.service|#1` ``
- **`portals_organization_entities_entity_properties_users`**: Imports `OSKOrganizationUsersListService` and user data types. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|../users/features/organization-users-list/services/organization-users-list/organization-users-list.service|#1` ``
- **`portals_organization_onboarding-cards`**: Imports `OSKOnboardingDocument` for onboarding statistics. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|../../../../../../../onboarding-cards/types/onboarding-document.type|#1` ``
- **`core`**: Imports `OSKCurrentUserToken` and `UserRoleGuard`. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|@oskey/core|#1` ``
- **`core/translate`**: Imports `OSKTranslateService` and `OSKTranslatePipe`. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|@oskey/translate|#1` ``
- **`core/firebase`**: Imports `OSKFirebaseHttpsService`. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|@oskey/firebase|#1` ``

### Template-Composition Coupling
- **`OSKConfirmDialogComponent`**: Opened dynamically via `MatDialog` in `OSKOrganizationPropertiesListComponent` to confirm property deletion. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|../../../../../../../../../shared/components/confirm-dialog/confirm-dialog.component|#1` ``

---

#### portals_organization_entities_entity_properties_buildings

### Import-Based Coupling
This capability imports dependencies from the following modules and submodules:

- **`core` Module**:
  - **Guards**: Imports `AdminGuard` to protect creation and editing routes. (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings.routes.ts|src/app/core/guards/admin.guard|#1` ``).
  - **Types**: Imports shared core types (such as `Country`, `Building`, `BuildingDoor`, `BuildingUnit`) from `@oskey/core/types` and `src/app/core/types/building/building.type`. (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|@oskey/core/types|#1` ``).
  - **Translate**: Imports translation utilities from `@oskey/translate`. (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|@oskey/translate|#1` ``).
  - **Firebase**: Imports Firebase HTTPS services from `@oskey/firebase`. (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts|@oskey/firebase|#1` ``).

- **`portals_organization` Capability**:
  - Imports organization-specific types, such as `WithOrganizationId`, from `src/app/features/portals/organization/types/with-organization-id.type`. (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts|src/app/features/portals/organization/types/with-organization-id.type|#1` ``).

### Template-Composition Coupling
No template-composition coupling to custom components outside this capability is evidenced. All composed elements are standard Angular Material components or native HTML elements.

---

#### portals_organization_entities_entity_properties_general-rules

### Import-Based Coupling
- **`portals_organization_entities_entity_properties_buildings`**: Couples via importing `OSKOrganizationBuildingsListService` to load buildings. [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts` (line 21) ``
- **`portals_organization_entities_entity_properties_inhabitants`**: Couples via importing `inhabitant-document.type` inside the types file. [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/types/organization-general-rules.type.ts` (line 14) ``
- **`portals`**: Couples via importing `OSKConfirmDialogComponent` for the confirmation dialog. [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts` (line 35) ``
- **`core`**: Couples via imports of:
  - `@oskey/core/types` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts` (line 22) ``
  - `@oskey/translate` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts` (line 20) ``
  - `@oskey/firebase` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts` (line 14) ``

### Template-Composition Coupling
- **`portals`**: Couples by dynamically opening `OSKConfirmDialogComponent` via `MatDialog` to confirm settings updates. [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts` (line 270) ``

---

#### portals_organization_entities_entity_properties_inhabitants

### Import-Based Coupling
This capability imports dependencies from other submodules and core modules (**Confirmed**):
- **`portals_organization_onboarding-cards`**: Imports `OSKOnboardingCardsService` and types like `OSKOnboardingBuilding` and `OSKOnboardingCard` (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts` (lines 48, 49, 54) ``]).
- **`portals_organization_entities_entity_suppliers`**: Imports `OSKCustomDateAdapter` (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts` (line 71) ``]).
- **`portals_organization_entities_entity_properties_buildings`**: Imports `OSKOrganizationBuildingsListService` (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts` (line 63) ``]).
- **`portals` (shared components)**: Imports `OSKConfirmDialogComponent` (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts` (line 35) ``]).
- **`core`**:
  - Imports `OSKFirebaseHttpsService` from `@oskey/firebase` (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts` (line 15) ``]).
  - Imports `OSKTranslateService` and `OSKTranslatePipe` from `@oskey/translate` (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts` (line 45) ``]).
  - Imports `OSKBooleanPipe` from `src/app/core/translate/pipes/boolean.pipe` (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts` (line 46) ``]).

### Template-Composition Coupling
The components compose their templates using pipes and components from other modules (**Confirmed**):
- **`OSKTranslatePipe`**: Used across all three components' templates to translate UI labels (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|mat-checkbox|#1` ``] *imports list*).
- **`OSKBooleanPipe`**: Used in `OSKCreateOrganizationInhabitantComponent` to format boolean values (**Confirmed** [`` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|mat-checkbox|#1` ``] *imports list*).

---

#### portals_organization_entities_entity_properties_users

### Import-Based Coupling
This capability depends on the following external modules and submodules:
- **`core` Module**:
  - **`core/guards`**: Imports `user-role.guard` to secure routes. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts` (line 15) ``).
  - **`core/injection-tokens`**: Imports `OSKCurrentUserToken` to access current user context. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts` (line 57) ``).
  - **`core/firebase`**: Imports `OSKFirebaseHttpsService` for backend callable functions. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts` (line 16) ``).
  - **`core/translate`**: Imports `OSKTranslateService` and `OSKTranslatePipe` for localization. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts` (line 42) ``).
- **`features` Module**:
  - **`portals_organization_onboarding-cards`**: Imports `OSKOnboardingCardsService` to fetch country lists. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts` (line 54) ``).
  - **`portals_organization`**: Imports shared organization types like `with-organization-id.type`. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts` (line 17) ``).
  - **`portals`**: Imports `OSKConfirmDialogComponent` for deletion confirmation. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts` (line 41) ``).

### Template-Composition Coupling
- **`OSKConfirmDialogComponent`**: Opened dynamically via `MatDialog` inside `OSKOrganizationUsersListComponent` to confirm user deletion or invitation cancellation. **Confirmed** (`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent|removeUser|#1` ``).

---

#### portals_organization_entities_entity_suppliers

### Import-Based Coupling
This capability imports dependencies from other submodules and core modules (Confirmed, `imports_dependency` facts):
- **`portals_organization_onboarding-cards`**: Imports `OSKOnboardingCardsService` to fetch country lists for phone number formatting (Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service|#1` ``).
- **`portals_organization_entities_entity_message-center`**: Imports `OSKMessageCenterServiceService` and `OSKMessageCenterCreateComponent` to fetch properties and buildings for access control configuration (Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts|../../../message-center/services/message-center-service.service|#1` ``).
- **`portals`**: Imports `OSKConfirmDialogComponent` for deletion and unsaved changes confirmation dialogs (Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component|#1` ``).
- **`portals_organization`**: Imports `with-organization-id.type` (Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|src/app/features/portals/organization/types/with-organization-id.type|#1` ``).
- **`core`**:
  - `@oskey/core/types` (Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|@oskey/core/types|#1` ``).
  - `@oskey/translate` (Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|@oskey/translate|#1` ``).
  - `@oskey/firebase` (Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|@oskey/firebase|#1` ``).

### Template-Composition Coupling
The components in this capability compose other components in their templates or open them dynamically via `MatDialog` (Confirmed, `angular_template_composition` and `call_expression` facts):
- **`OSKSuppliersListComponent`** opens **`OSKSuppliersCreationComponent`** in a dialog (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|this.dialog.open|openCreateSupplierDialog|OSKSuppliersCreationComponent,...|#1` ``).
- **`OSKSuppliersDetailsComponent`** opens **`OSKSuppliersStaffAccessComponent`** in a dialog (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|this.dialog.open|openSuppliersStaffAccessDialog|OSKSuppliersStaffAccessComponent,...|#1` ``).
- **`OSKSuppliersDetailsComponent`** and **`OSKSuppliersStaffAccessComponent`** open **`OSKConfirmDialogComponent`** for confirmations (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|this.dialog.open|deleteSupplier|OSKConfirmDialogComponent,...|#1` ``).

---

#### portals_organization_onboarding-cards

This capability couples to other modules and submodules through both TypeScript imports and template composition:

### Import-Based Coupling

- **`core` Module**:
  - **Types**: Imports shared types from `@oskey/core/types` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|@oskey/core/types|#1` ``.
  - **Utilities**: Imports `OSKDateUtils` from `@oskey/core/utils` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|@oskey/core/utils|#1` ``.
  - **Error Handling**: Imports `OSKErrorService` from `@oskey/core` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|@oskey/core|#1` ``.
  - **Firebase**: Imports `OSKFirebaseHttpsService` from `@oskey/firebase` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|@oskey/firebase|#1` `` and `OSKAccountRestrictions` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|@oskey/firebase|#1` ``.
  - **Translation**: Imports `OSKTranslateService` and `OSKTranslatePipe` from `@oskey/translate` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|@oskey/translate|#1` `` and `OSKBooleanPipe` from `src/app/core/translate/pipes/boolean.pipe` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|src/app/core/translate/pipes/boolean.pipe|#1` ``.

### Template-Composition Coupling

- **Internal Submodule Composition**:
  - `OSKAddOnboardingCardsComponent` embeds `OSKOnboardingCardFormComponent` (`osk-onboarding-card-form`) `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.html|OSKAddOnboardingCardsComponent|osk-onboarding-card-form|#1` ``.
  - `OSKEditOnboardingCardComponent` embeds `OSKOnboardingCardFormComponent` (`osk-onboarding-card-form`) `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.html|OSKEditOnboardingCardComponent|osk-onboarding-card-form|#1` ``.
  - `OSKOnboardingCardsListComponent` opens `OSKCreateOnboardingCardsComponent` in a dialog `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|this.createUserDialogue.open|openCreateUser|OSKCreateOnboardingCardsComponent,{       width: '50%',       height: '75%',       panelClass: 'custom-dialog',       data: {         organizationId: this.organizationId       }     }|#1` ``.

---

#### portals_user

### Import-Based Coupling
This capability depends on the following modules and submodules:
- **`core`**:
  - Consumes core types `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|@oskey/core/types|#1` ``.
  - Consumes core tokens/services `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|@oskey/core|#1` `` (such as `OSKCurrentUserToken`).
- **`core/translate`**:
  - Consumes translation utilities `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|@oskey/translate|#1` `` (such as `OSKTranslatePipe` and `OSKTranslateService`).
- **`core/firebase`**:
  - Consumes Firebase HTTPS services `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|@oskey/firebase|#1` `` (such as `OSKFirebaseHttpsService`).

### Template-Composition Coupling
- No template-composition coupling to other custom application modules is evidenced. It only composes standard Angular Material components.

---

#### portals_user_invitations

### Import-Based Coupling
- **`core` Module**:
  - Imports `OSKCurrentUserToken` and `OSKErrorService` [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|@oskey/core|#1` ``).
  - Imports types and classes like `OSKCreateUserInvitationRequestDataClass` [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|@oskey/core/types|#1` ``).
  - Imports `OSKTranslateService` and `OSKTranslatePipe` [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|@oskey/translate|#1` ``).
  - Imports `OSKFirebaseHttpsService` [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|@oskey/firebase|#1` ``).

### Template-Composition Coupling
- No template-composition coupling to other custom application components is evidenced. The component only composes standard Angular Material and third-party timepicker components [Confirmed] (via `` `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html` (lines 16-203) ``).

---

#### portals_user_organizations

#### Import-Based Coupling
This capability depends on the following modules and submodules:
- **core**: Imports general core utilities and services. [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|@oskey/core|#1` ``)
- **core (types)**: Imports shared core types. [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|@oskey/core/types|#1` ``)
- **core (translate)**: Imports translation utilities. [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|@oskey/translate|#1` ``)
- **core (firebase)**: Imports Firebase HTTPS services. [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|@oskey/firebase|#1` ``)

#### Template-Composition Coupling
No template-composition coupling to other custom application components is evidenced. The component only composes standard Angular Material elements. [Confirmed] (`` `hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html` ``)

---

#### portals_user_organizations_pending-organizations

### Import-Based Coupling
This capability depends on the following internal modules:
- **`core` Module**:
  - `@oskey/core/types`: For shared TypeScript types (imported in components and services) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|@oskey/core/types|#1` ``.
  - `@oskey/core`: For core utilities and tokens, such as `OSKCurrentUserToken` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|@oskey/core|#1` ``.
  - `@oskey/translate`: For translation services and pipes (`OSKTranslateService`, `OSKTranslatePipe`) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|@oskey/translate|#1` ``.
  - `@oskey/firebase`: For HTTPS callable services (`OSKFirebaseHttpsService`) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts|@oskey/firebase|#1` ``.

### Template-Composition Coupling
- No custom components from other capabilities or modules are composed within this capability's templates. It relies entirely on standard Angular Material components and native HTML elements.

---

### 9. Internal Structure

The internal structure of the `features` module is composed of 13 submodules. Their internal coupling relationships are defined as follows: **[Confirmed]**

- **`authentication`**
  - **Outbound Coupling**:
    - `portals_organization_entities_entity_properties_users` (1 touchpoint in `auth.service.ts` importing `organization-user.type`)
  - **Inbound Coupling**:
    - `portals` (1 touchpoint in `sidemenu.component.ts` importing `OSKAuthService`)
    - `portals_organization_entities_entity_message-center` (1 touchpoint in `message-center-list.component.ts` importing `OSKAuthService`)

- **`portals`**
  - **Outbound Coupling**:
    - `authentication` (1 touchpoint in `sidemenu.component.ts` importing `OSKAuthService`)
    - `portals_organization_entities_entity_properties` (2 touchpoints in `sidemenu.component.ts` importing `OSKOrganizationPropertyService` and `OSKProperty`)
  - **Inbound Coupling**:
    - `portals_organization_entities` (1 touchpoint in `entities-dashboard.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization_entities_entity_message-center` (1 touchpoint in `message-center-list.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization_entities_entity_properties` (1 touchpoint in `organization-properties-list.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization_entities_entity_properties_general-rules` (1 touchpoint in `list-settings.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization_entities_entity_properties_inhabitants` (1 touchpoint in `organization-inhabitant-details.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization_entities_entity_properties_users` (1 touchpoint in `organization-users-list.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization_entities_entity_suppliers` (2 touchpoints in details and staff-access components importing `OSKConfirmDialogComponent`)

- **`portals_organization`**
  - **Outbound Coupling**: None
  - **Inbound Coupling**:
    - `portals_organization_entities_entity_message-center` (1 touchpoint in `message-center-service.service.ts` importing `OSKWithOrganizationIdAndPropertyId`)
    - `portals_organization_entities_entity_properties_buildings` (7 touchpoints across building, unit, and door services importing `OSKWithOrganizationId`)
    - `portals_organization_entities_entity_properties_users` (3 touchpoints across invite, details, and list services importing `OSKWithOrganizationId`)
    - `portals_organization_entities_entity_suppliers` (1 touchpoint in `suppliers.service.ts` importing `OSKWithOrganizationIdAndEntityId`)

- **`portals_organization_entities`**
  - **Outbound Coupling**:
    - `portals` (1 touchpoint in `entities-dashboard.component.ts` importing `OSKConfirmDialogComponent`)
  - **Inbound Coupling**:
    - `portals_organization_entities_entity_properties` (4 touchpoints in create and edit components importing `OSKOrganizationEntitiesService`, `OSKEntity`, and `OSKEntityType`)

- **`portals_organization_entities_entity`**
  - **Outbound Coupling**:
    - `portals_organization_entities_entity_properties` (3 touchpoints in dashboard and service files importing `OSKOrganizationPropertyService` and `OSKGetEntityDashboardStaticsResponseData`)
    - `portals_organization_entities_entity_properties_users` (1 touchpoint in `entity-dashboard.component.ts` importing `OSKOrganizationUsersListService`)
  - **Inbound Coupling**: None

- **`portals_organization_entities_entity_message-center`**
  - **Outbound Coupling**:
    - `authentication` (1 touchpoint in `message-center-list.component.ts` importing `OSKAuthService`)
    - `portals` (1 touchpoint in `message-center-list.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization` (1 touchpoint in `message-center-service.service.ts` importing `OSKWithOrganizationIdAndPropertyId`)
    - `portals_organization_entities_entity_properties` (1 touchpoint in `message-center-service.service.ts` importing `OSKProperty`)
    - `portals_organization_entities_entity_suppliers` (1 touchpoint in `message-center-create.component.ts` importing `OSKCustomDateAdapter`)
  - **Inbound Coupling**:
    - `portals_organization_entities_entity_suppliers` (3 touchpoints in `suppliers-staff-access.component.ts` importing `OSKMessageCenterCreateComponent`, `OSKMessageCenterServiceService`, and `OSKCommunicationPriority`)

- **`portals_organization_entities_entity_properties`**
  - **Outbound Coupling**:
    - `portals` (1 touchpoint in `organization-properties-list.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization_entities` (4 touchpoints in create and edit components importing `OSKOrganizationEntitiesService` and entity types)
    - `portals_organization_entities_entity_properties_buildings` (5 touchpoints in create and edit components importing `OSKAddOrganizationBuildingService` and `OSKOrganizationBuildingsListService`)
    - `portals_organization_entities_entity_properties_inhabitants` (2 touchpoints in `property-dashboard.component.ts` importing `OSKOrganizationInhabitantService` and `OSKDocumentListResponse`)
    - `portals_organization_entities_entity_properties_users` (2 touchpoints in `property-dashboard.component.ts` importing `OSKOrganizationUsersListService` and `OSKOrganizationUserListData`)
    - `portals_organization_onboarding-cards` (1 touchpoint in `property-dashboard.component.ts` importing `OSKInhabitantOnboardingDocument`)
  - **Inbound Coupling**:
    - `portals` (2 touchpoints in `sidemenu.component.ts` importing `OSKOrganizationPropertyService` and `OSKProperty`)
    - `portals_organization_entities_entity` (3 touchpoints in dashboard and service files importing `OSKOrganizationPropertyService` and dashboard types)
    - `portals_organization_entities_entity_message-center` (1 touchpoint in `message-center-service.service.ts` importing `OSKProperty`)

- **`portals_organization_entities_entity_properties_buildings`**
  - **Outbound Coupling**:
    - `portals_organization` (7 touchpoints across building, unit, and door services importing `OSKWithOrganizationId`)
  - **Inbound Coupling**:
    - `portals_organization_entities_entity_properties` (5 touchpoints in create and edit components importing building services)
    - `portals_organization_entities_entity_properties_general-rules` (1 touchpoint in `list-settings.component.ts` importing `OSKOrganizationBuildingsListService`)
    - `portals_organization_entities_entity_properties_inhabitants` (1 touchpoint in `create-organization-inhabitant.component.ts` importing `OSKOrganizationBuildingsListService`)

- **`portals_organization_entities_entity_properties_general-rules`**
  - **Outbound Coupling**:
    - `portals` (1 touchpoint in `list-settings.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization_entities_entity_properties_buildings` (1 touchpoint in `list-settings.component.ts` importing `OSKOrganizationBuildingsListService`)
    - `portals_organization_entities_entity_properties_inhabitants` (1 touchpoint in `organization-general-rules.type.ts` importing `OSKPincodeType`)
  - **Inbound Coupling**: None

- **`portals_organization_entities_entity_properties_inhabitants`**
  - **Outbound Coupling**:
    - `portals` (1 touchpoint in `organization-inhabitant-details.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization_entities_entity_properties_buildings` (1 touchpoint in `create-organization-inhabitant.component.ts` importing `OSKOrganizationBuildingsListService`)
    - `portals_organization_entities_entity_suppliers` (1 touchpoint in `create-organization-inhabitant.component.ts` importing `OSKCustomDateAdapter`)
    - `portals_organization_onboarding-cards` (5 touchpoints in `create-organization-inhabitant.component.ts` importing `OSKCreateOnboardingCardsComponent`, `OSKOnboardingCardsService`, and onboarding types)
  - **Inbound Coupling**:
    - `portals_organization_entities_entity_properties` (2 touchpoints in `property-dashboard.component.ts` importing inhabitant service and response types)
    - `portals_organization_entities_entity_properties_general-rules` (1 touchpoint in `organization-general-rules.type.ts` importing `OSKPincodeType`)

- **`portals_organization_entities_entity_properties_users`**
  - **Outbound Coupling**:
    - `portals` (1 touchpoint in `organization-users-list.component.ts` importing `OSKConfirmDialogComponent`)
    - `portals_organization` (3 touchpoints across invite, details, and list services importing `OSKWithOrganizationId`)
    - `portals_organization_onboarding-cards` (2 touchpoints in invite and details components importing `OSKOnboardingCardsService`)
  - **Inbound Coupling**:
    - `authentication` (1 touchpoint in `auth.service.ts` importing invitation types)
    - `portals_organization_entities_entity` (1 touchpoint in `entity-dashboard.component.ts` importing `OSKOrganizationUsersListService`)
    - `portals_organization_entities_entity_properties` (2 touchpoints in `property-dashboard.component.ts` importing user list service and data types)

- **`portals_organization_entities_entity_suppliers`**
  - **Outbound Coupling**:
    - `portals` (2 touchpoints in details and staff-access components importing `OSKConfirmDialogComponent`)
    - `portals_organization` (1 touchpoint in `suppliers.service.ts` importing `OSKWithOrganizationIdAndEntityId`)
    - `portals_organization_entities_entity_message-center` (3 touchpoints in `suppliers-staff-access.component.ts` importing message center components, services, and priority models)
    - `portals_organization_onboarding-cards` (2 touchpoints in creation and details components importing `OSKOnboardingCardsService`)
  - **Inbound Coupling**:
    - `portals_organization_entities_entity_message-center` (1 touchpoint in `message-center-create.component.ts` importing `OSKCustomDateAdapter`)
    - `portals_organization_entities_entity_properties_inhabitants` (1 touchpoint in `create-organization-inhabitant.component.ts` importing `OSKCustomDateAdapter`)

- **`portals_organization_onboarding-cards`**
  - **Outbound Coupling**: None
  - **Inbound Coupling**:
    - `portals_organization_entities_entity_properties` (1 touchpoint in `property-dashboard.component.ts` importing `OSKInhabitantOnboardingDocument`)
    - `portals_organization_entities_entity_properties_inhabitants` (5 touchpoints in `create-organization-inhabitant.component.ts` importing onboarding components, services, and types)
    - `portals_organization_entities_entity_properties_users` (2 touchpoints in invite and details components importing `OSKOnboardingCardsService`)
    - `portals_organization_entities_entity_suppliers` (2 touchpoints in creation and details components importing `OSKOnboardingCardsService`)

### 10. Cross-Module Relationships

The `features` module maintains verified dependencies with the other two modules in the repository (`core` and `components`): **[Confirmed]**

- **Outbound Dependencies**:
  - **`components`**: 1 touchpoint. `OSKHomeComponent` imports `OSKHeaderComponent` from `src/app/components/header/header.component`. **[Confirmed]**
  - **`core`**: 228 touchpoints. The module heavily imports shared types (e.g., `OSKCreateUserDTO`, `OSKUser`) and utility pipes (e.g., `OSKTranslatePipe`). **[Confirmed]**
  - **Confirmed Call Edges**:
    - `core -> OSKErrorService.showError`: Called 16 times across feature components (e.g., in sign-in components) to handle and display errors. **[Confirmed]**
    - `core -> OSKFirebaseAuthService`: `OSKAuthService` calls 12 distinct methods (including `confirmSignIn`, `getUserByUid`, `resetPassword`, `sendPasswordResetEmail`, `setDoc`, `signInWithCustomToken`, `signInWithEmailAndPassword`, `signOut`, `signUpWithEmailAndPassword`, `signUpWithEmailLink`, `updateProfile`, and `verifyPasswordResetCode`) to delegate Firebase-specific authentication operations. **[Confirmed]**
    - `core -> OSKFirebaseHttpsService.call`: Called 102 times across feature services to execute backend Firebase Cloud Functions. **[Confirmed]**
    - `core -> OSKTranslateService.instant`: Called 168 times across feature components to resolve localized translation strings synchronously. **[Confirmed]**
    - `core -> OSKTranslateService.getTranslations`: Called 4 times across building, unit, and door creation components to load translation bundles. **[Confirmed]**

- **Inbound Dependencies**:
  - **`components`**: 1 touchpoint. `OSKHeaderComponent` imports `OSKAuthService` from `src/app/features/authentication/services/auth.service`. **[Confirmed]**
  - **`core`**: 3 touchpoints. `current-user.token.ts` and `user.type.ts` import sidemenu constants, utilities, and types (`OSKUserDefaultSidemenu`, `generateUserOrganizationDefaultMenu`, `OSKSideMenu`) from the `portals` submodule. **[Confirmed]**
  - **Confirmed Call Edges**:
    - `components -> OSKAuthService.signOut`: `OSKHeaderComponent` calls this method to trigger the user sign-out sequence. **[Confirmed]**

### 11. Permissions & Security

**Cross-cutting risk callouts:**

The `features` module implements role-based access control (RBAC) to gate navigation, routes, and UI actions. **[Confirmed]**

- **Role-Gating Tally**:
  - **Navigation Menu Gating**: The `portals` submodule filters navigation options dynamically during menu generation. It checks the user's active roles against the following candidate permission strings:
    - *Admin Portal*: `v1.admin`, `v1.admin.org.admin`, `v1.admin.user.admin`, `v1.admin.user.devices.admin`, `v1.admin.user.invitations.admin`, `v1.admin.user.accesses.admin`. **[Confirmed]**
    - *Organization Portal*: `v1.org.admin`, `v1.org.suppliers.admin`, `v1.org.user.admin`, `v1.org.residents.admin`, `v1.org.settings.admin`, `v1.org.communications.admin`. **[Confirmed]**
  - **Route Gating**: Enforced via `user-role.guard` or `AdminGuard` on the following paths:
    - `"suppliers"`: Requires `v1.org.suppliers.admin`. **[Confirmed]**
    - `"users"`: Requires `v1.org.user.admin`. **[Confirmed]**
    - `"message-center"`: Requires `v1.org.communications.admin`. **[Confirmed]**
    - `":propertyId/inhabitants"`: Requires `v1.org.residents.admin`. **[Confirmed]**
    - `":propertyId/generalRules"`: Requires `v1.org.settings.admin`. **[Confirmed]**
    - Building creation/editing routes: Guarded by `AdminGuard`. **[Confirmed]**
  - **UI Action Gating**:
    - `v1.org.client` is checked inline in `OSKEntitiesDashboardComponent`, `OSKOrganizationPropertiesListComponent`, and building list components (`OSKOrganizationBuildingDoorsListComponent`, `OSKOrganizationBuildingUnitsListComponent`, `OSKOrganizationBuildingsListComponent`) to conditionally display administrative controls. **[Confirmed]**
    - `v1.org.user.admin` is checked in `OSKOrganizationUsersListComponent` to enable or disable user deletion and invitation cancellation. **[Confirmed]**

- **Security Asymmetries & Gaps**:
  - **Unguarded Sensitive Routes**:
    - The `portals_organization_entities_entity_properties_inhabitants` submodule defines routes in `organization-inhabitants.routes.ts` with **no local route guards** (`canActivate`) or inline permission checks, despite managing sensitive resident records and sending onboarding activation codes. **[Inferred]**
    - The `portals_organization_entities_entity_suppliers` submodule defines routes in `suppliers.routes.ts` with **no local route guards**, despite managing third-party access and pincode generation. **[Inferred]**
    - The `portals_organization_onboarding-cards` submodule defines routes in `onboarding-cards.routes.ts` with **no local route guards**, despite managing activation codes. **[Inferred]**
    - User-level submodules (`portals_user_invitations`, `portals_user_organizations`, and `portals_user_organizations_pending-organizations`) define routes with **no local route guards** or explicit permission checks. **[Inferred]**
  - **Unattributed Access-Control Signals**:
    - The `AdminGuard` attached to building, unit, and door creation/editing routes in `organization-buildings.routes.ts` does not map to any identifiable permission string in the local capability extract. (Count: 1 guard with unattributed permission string). **[Inferred]**

**Per-capability evidence:**

#### authentication

- No `angular_guard` facts are present in this capability's pack. [Confirmed]
- The capability handles security via Auth0 and Firebase authentication mechanisms. It performs token validation and exchanges Auth0 ID tokens for Firebase custom tokens (Cite: `hosting/web-app/src/app/features/authentication/services/auth.service.ts` lines 64-216).
- No explicit role-membership checks or permission strings are evidenced in this capability's code. [Confirmed]

---

#### home

- No route guards, authorization checks, or permission strings are evidenced within this capability pack. (Unknown)

---

#### portals

While no route guards are defined in this pack, the capability performs extensive client-side role-based filtering to construct the navigation menu. It checks the user's roles against the following candidate permission strings:

### Admin Portal Permissions
- `v1.admin` *(Checked to grant overall admin menu access)* `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin|#2` ``
- `v1.admin.org.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.org.admin|#1` ``
- `v1.admin.user.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.user.admin|#1` ``
- `v1.admin.user.devices.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.user.devices.admin|#1` ``
- `v1.admin.user.invitations.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.user.invitations.admin|#1` ``
- `v1.admin.user.accesses.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.user.accesses.admin|#1` ``

### Organization Portal Permissions
- `v1.org.admin` *(Checked to grant overall organization admin menu access)* `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.admin|#1` ``
- `v1.org.suppliers.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.suppliers.admin|#1` ``
- `v1.org.user.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.user.admin|#1` ``
- `v1.org.residents.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.residents.admin|#1` ``
- `v1.org.settings.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.settings.admin|#1` ``
- `v1.org.communications.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.communications.admin|#1` ``

---

#### portals_organization

No route guards, role-membership checks, or permission strings are evidenced in this capability's routes or components. [Confirmed]

---

#### portals_organization_entities

- **Role Check**: During component initialization (`ngOnInit`), the dashboard checks if the current user's active account roles include `'v1.org.client'` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|v1.org.client|#1` ``.
- **Route Guards**: No route guards are explicitly defined on the routes within `entities.routes.ts` `` `hosting/web-app/src/app/features/portals/organization/features/entities/entities.routes.ts` ``.

---

#### portals_organization_entities_entity

- **Route Protection**:
  - The `userRoleGuard` (imported from `src/app/core/guards/user-role/user-role.guard` [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|src/app/core/guards/user-role/user-role.guard|#1` ``)) is applied to several sub-routes to enforce role-based access control:
    - **`"suppliers"`**: Requires the permission string `v1.org.suppliers.admin`. [Confirmed] (via `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|v1.org.suppliers.admin|#1` ``)
    - **`"users"`**: Requires the permission string `v1.org.user.admin`. [Confirmed] (via `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|v1.org.user.admin|#1` ``)
    - **`"message-center"`**: Requires the permission string `v1.org.communications.admin`. [Confirmed] (via `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts|v1.org.communications.admin|#1` ``)
- **RBAC Verification**: No external RBAC-roles document exists yet to cross-check these permission strings.

---

#### portals_organization_entities_entity_message-center

- **User Context**: The capability injects `OSKAuthService` and `OSKCurrentUserToken` to retrieve the current user's authentication state and token. (Confirmed) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|inject|anon|OSKCurrentUserToken|#1` ``
- **Guards**: No explicit route guards are declared within this capability's route file. (Confirmed) `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/message-center.routes.ts` ``

---

#### portals_organization_entities_entity_properties

### Guards
- **`UserRoleGuard`**: Attached to sub-routes of properties (such as buildings, inhabitants, general rules, suppliers, message center, and users) to restrict access based on roles. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts|src/app/core/guards/user-role/user-role.guard|#1` ``

### Permission Strings
The following permission strings are checked within the code or routes: [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts` ``

- **`v1.org.client`**: Checked in `OSKOrganizationPropertiesListComponent` to verify if the current user has client-level access. [Confirmed] `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|v1.org.client|#1` ``
- **`v1.org.buildings.admin`**: Checked in `OSKPropertyDashboardComponent` to verify building administration privileges. [Confirmed] `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|v1.org.buildings.admin|#1` ``
- **`v1.org.residents.admin`**: Guarded on the `:propertyId/inhabitants` route and checked in the property dashboard. [Confirmed] `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts|v1.org.residents.admin|#1` ``
- **`v1.org.user.admin`**: Guarded on the `:propertyId/users` route and checked in the property dashboard. [Confirmed] `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts|v1.org.user.admin|#1` ``
- **`v1.org.settings.admin`**: Guarded on the `:propertyId/generalRules` route. [Confirmed] `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts|v1.org.settings.admin|#1` ``
- **`v1.org.suppliers.admin`**: Guarded on the `:propertyId/suppliers` route. [Confirmed] `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts|v1.org.suppliers.admin|#1` ``
- **`v1.org.communications.admin`**: Guarded on the `:propertyId/message-center` route. [Confirmed] `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts|v1.org.communications.admin|#1` ``

---

#### portals_organization_entities_entity_properties_buildings

- **Route Protection**: The `AdminGuard` is attached to all creation (`add`) and editing (`edit`) routes for buildings, units, and doors, restricting access to administrative users. (**Confirmed**; `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings.routes.ts|src/app/core/guards/admin.guard|#1` ``).
- **Client Role Verification**: The list components (`OSKOrganizationBuildingDoorsListComponent`, `OSKOrganizationBuildingUnitsListComponent`, and `OSKOrganizationBuildingsListComponent`) check if the current user has the `v1.org.client` role. (**Confirmed**; `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts|v1.org.client|#1` ``).
  - This is verified inline via:
    `this.currentUser().selectedAccount?.roles.some(role => role.includes('v1.org.client'))` (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts|this.currentUser().selectedAccount?.roles.some|ngOnInit|(role) =>       role.includes('v1.org.client')|#1` ``).

---

#### portals_organization_entities_entity_properties_general-rules

- No explicit route guards are attached to the routes defined in this capability. [Confirmed] `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/organization-general-rules.routes.ts||#1` ``
- **Data-Driven UI Permissions**: The component dynamically disables slide toggles based on the `canBeChanged` metadata property of each setting field. [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowQuickcodesDisabled` ``

---

#### portals_organization_entities_entity_properties_inhabitants

- **Guards**: No route guards (such as `canActivate`) are explicitly attached to the routes defined in `organization-inhabitants.routes.ts` within the provided evidence (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/organization-inhabitants.routes.ts` (lines 17-24) ``]).
- **Permission Strings**: No specific permission strings or role-membership checks are evidenced in this capability's pack (**Confirmed**).

---

#### portals_organization_entities_entity_properties_users

- **Guards**: The routes are protected by `user-role.guard`. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts` (line 15) ``).
- **Permission Checks**:
  - Access to the routes requires the **`v1.org.user.admin`** permission string. **Confirmed** (`` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts|v1.org.user.admin|#1` ``).
  - The `OSKOrganizationUsersListComponent` also checks if the current user has the `v1.org.user.admin` role to conditionally enable or disable administrative actions. **Confirmed** (`` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|v1.org.user.admin|#1` ``).
- **Role Exclusions**:
  - The components explicitly filter out certain high-level administrative roles (such as `v1.org.admin`, `v1.org.entity.admin`, `v1.org.property.admin`, and `v1.org.buildings.admin`) from standard role assignment lists to prevent unauthorized privilege escalation. **Confirmed** (`` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|v1.org.entity.admin|#1` ``).

---

#### portals_organization_entities_entity_suppliers

- **Route Guards**: No route guards are explicitly defined on the routes in `suppliers.routes.ts` (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/suppliers.routes.ts` ``).
- **Role-Based Access Control (RBAC)**: There are no explicit role-membership checks or permission strings evidenced in this capability's code pack (Confirmed).

---

#### portals_organization_onboarding-cards

- **Route Guards**: No explicit `canActivate` guards are evidenced on the routes defined in `onboarding-cards.routes.ts` `` `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts` ``.
- **User Context**: `OSKCurrentUserToken` is injected in `OSKOnboardingCardsListComponent` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|inject|anon|OSKCurrentUserToken|#1` `` (line 82), indicating that the list component relies on the current user's authentication context.
- **Account Restrictions**: `OSKAccountRestrictions.isAccountEmailAllowed` is used in `OSKCreateOnboardingCardsComponent` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|OSKAccountRestrictions.isAccountEmailAllowed|createEmailValidator|value|#1` `` (line 180) to enforce email domain or format restrictions during card creation.

---

#### portals_user

- No route guards (`canActivate`) are explicitly attached to the routes defined in `user.routes.ts` within the provided evidence `` `hosting/web-app/src/app/features/portals/user/user.routes.ts` ``. **[Inferred]**
- No explicit permission strings or role-membership checks are evidenced in this capability's code. **[Inferred]**

---

#### portals_user_invitations

- **Guards**: No route guards are directly attached to the `send` route within this capability's routing configuration [Confirmed] (via `` `hosting/web-app/src/app/features/portals/user/invitations/invitations.routes.ts` ``).
- **Role Checks**: No explicit role-membership or permission checks are performed in the component or service code [Confirmed] (via `` `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts` ``).

---

#### portals_user_organizations

No route guards or explicit permission checks are evidenced in this capability's code. [Confirmed] (`` `hosting/web-app/src/app/features/portals/user/organizations/organizations.routes.ts` (lines 14-26) ``)

---

#### portals_user_organizations_pending-organizations

- **Route Protection**: No route guards (such as `canActivate`) are explicitly declared on the routes within this capability's routing file [Confirmed] (via `` `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations.routes.ts` (lines 17-25) ``).
- **User Context Association**: The capability injects `OSKCurrentUserToken` to retrieve the current user's ID (`userId`) and associates it with the pending organization payload upon submission [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|inject|anon|OSKCurrentUserToken|#1` ``).

---

### 12. External Hooks

#### authentication

- **Auth0 SDK**: Injected via `Auth0Service` to manage redirect logins, ID token claims, and user sessions. (Cite: `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|@auth0/auth0-angular|#1` ``)
- **Firebase Auth SDK**: Injected via `@angular/fire/auth` and wrapped in `OSKFirebaseAuthService` to manage custom token sign-ins, email/password authentication, passwordless email links, and profile updates. (Cite: `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|@angular/fire/auth|#1` ``)
- **libphonenumber-js**: Used to parse and validate phone numbers during registration. (Cite: `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|libphonenumber-js|#1` ``)
- **ngx-cookie-service**: Used to retrieve the email address stored in cookies for email link sign-in verification. (Cite: `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/verify-email/verify-email.component.ts|ngx-cookie-service|#1` ``)

---

#### home

- **Angular Core**: Imports `@angular/core` for component definition and lifecycle utilities `` `imports_dependency|features|hosting/web-app/src/app/features/home/home.component.ts|@angular/core|#1` ``. (Confirmed)
- **Angular Common**: Imports `@angular/common` (specifically utilizing `NgOptimizedImage` in the component imports metadata) `` `imports_dependency|features|hosting/web-app/src/app/features/home/home.component.ts|@angular/common|#1` ``. (Confirmed)

---

#### portals

- **Angular CDK Layout**: Uses `BreakpointObserver` to detect mobile viewports (`(max-width: 600px)`) and collapse the navigation drawer. `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts` (lines 86, 118) ``
- **Angular Material**: Relies heavily on Angular Material modules (`MatListModule`, `MatIconModule`, `MatCardModule`, `MatButtonModule`, `MatMenuModule`, `MatExpansionModule`, `MatDialogModule`, `MatProgressSpinnerModule`) for UI rendering. `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts` (lines 17-38) ``
- **Translation Pipe**: Integrates with `@oskey/translate` via `OSKTranslatePipe` to localize menu labels. `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts` (line 33) ``

---

#### portals_organization

- **`@oskey/translate`**: Injected as `OSKTranslatePipe` in component imports to handle localization within the templates `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|@oskey/translate|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|@oskey/translate|#1` ``.
- **`@angular/material/card`**: Used for UI presentation layout.

---

#### portals_organization_entities

- **Angular Material & CDK**: Heavily utilizes Material components for UI rendering (cards, buttons, icons, spinners, dialogs, snackbars, tooltips) and CDK for accessibility (`A11yModule`) `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (lines 13-25) ``.
- **Translation Engine**: Hooks into `@oskey/translate` (wrapping `@ngx-translate` or a similar library) to fetch localized strings dynamically using `this.translate.instant(...)` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` (lines 204-212) ``.

---

#### portals_organization_entities_entity

- **`@oskey/translate`**: The capability integrates with the translation system, utilizing `OSKTranslatePipe` in the component template to localize dashboard labels. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|@oskey/translate|#1` `` and `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|Component|anon|{   selector: 'osk-entity-dashboard',...` ``)
- **Firebase HTTPS Callable Functions**: The capability hooks into Firebase via `OSKFirebaseHttpsService` to invoke backend functions. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|@oskey/firebase|#1` `` and `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|this.firebaseHttps.call|getEntityDashboardStatics|'organization-getEntityDashboardStatics',{ organizationId, entityId }|#1` ``)

---

#### portals_organization_entities_entity_message-center

- **`@ngx-translate` / `@oskey/translate`**: Extensively uses `OSKTranslatePipe` in templates and `OSKTranslateService` in components to handle localization. (Confirmed) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|@oskey/translate|#1` ``
- **Firebase SDK / `@oskey/firebase`**: Interacts with Firebase backend services via `OSKFirebaseHttpsService` to execute HTTPS callable functions. (Confirmed) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|inject|anon|OSKFirebaseHttpsService|#1` ``
- **Angular Material**: Relies heavily on Angular Material modules for UI components, date adapters, and dialog management. (Confirmed) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|@angular/material/stepper|#1` ``

---

#### portals_organization_entities_entity_properties

- **`@angular/material`**: Extensively uses Material components such as `MatCardModule`, `MatTableModule`, `MatPaginatorModule`, `MatProgressSpinnerModule`, `MatButtonModule`, `MatIconModule`, `MatDialogModule`, `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`, `MatChipsModule`, and `MatCheckboxModule`. [Confirmed] `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|Component|anon|{   selector: 'osk-organization-properties-create',   templateUrl: './organization-properties-create.component.html',   styleUrls: ['./organization-properties-create.component.scss'],   standalone: true,   imports: [     CommonModule,     RouterLink,     ReactiveFormsModule,     FormsModule,     MatCardModule,     MatFormFieldModule,     MatInputModule,     MatSelectModule,     MatButtonModule,     MatIconModule,     MatProgressSpinnerModule,     OSKTranslatePipe,     MatChipsModule,     MatCheckboxModule   ] }|#1` ``
- **`chart.js` & `ng2-charts`**: Used in `OSKPropertyDashboardComponent` to render the resident onboarding doughnut chart. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|chart.js|#1` ``
- **`@oskey/translate`**: Injects `OSKTranslateService` and uses `OSKTranslatePipe` for multi-language support. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|@oskey/translate|#1` ``
- **Firebase SDK**: Interacts with Firebase backend functions via `OSKFirebaseHttpsService`. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|@oskey/firebase|#1` ``

---

#### portals_organization_entities_entity_properties_buildings

This capability integrates with the following external SDKs and libraries:

- **Angular Material**: Extensively uses Material UI components (`MatCardModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatProgressSpinnerModule`, `MatIconModule`, `MatSelectModule`, `MatTableModule`, `MatPaginatorModule`, `MatSnackBar`). (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|Component|anon|{   standalone: true,   imports: [     MatCardModule,     MatFormFieldModule,     FormsModule,     MatInputModule,     MatButtonModule,     MatProgressSpinnerModule,     MatIconModule,     ReactiveFormsModule,     RouterLink,     MatSelectModule   ],   selector: 'osk-add-organization-building-door',   templateUrl: './add-organization-building-door.component.html',   styleUrl: './add-organization-building-door.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``).
- **`@oskey/translate`**: Injects `OSKTranslateService` and uses `OSKTranslatePipe` to fetch localized translations for form labels, errors, and table headers. (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|this.translateServiec.getTranslations|anon|{     name: 'portals.organization.buildings.addDoor.name',     streetAddress: { ... } ... }|#1` ``).
- **Firebase HTTPS Service**: Interacts with the backend via `OSKFirebaseHttpsService` to execute HTTPS callable functions. (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts|this.firebaseHttps.call|createDoor|'building-organizationUserCreateBuildingDoor',data|#1` ``).

---

#### portals_organization_entities_entity_properties_general-rules

- **`@ngx-translate`**: Uses `OSKTranslateService` and `OSKTranslatePipe` (via `@oskey/translate`) to translate UI labels, dialog messages, and snackbar notifications. [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts` (line 20) ``
- **`@angular/fire/firestore`**: Imports Firestore types inside the general rules types file. [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/types/organization-general-rules.type.ts` (line 15) ``
- **Angular Material**: Relies heavily on Angular Material components for UI structure and interactions (e.g., `MatCardModule`, `MatDialog`, `MatSnackBar`, `MatSlideToggleModule`). [Confirmed] `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts` (lines 15-19, 23-24, 34, 36-37, 41) ``

---

#### portals_organization_entities_entity_properties_inhabitants

This capability integrates with the following external libraries and SDKs (**Confirmed**):
- **`libphonenumber-js`**: Used in `OSKCreateOrganizationInhabitantComponent` to parse and validate phone numbers based on the selected country code (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts` (line 62) ``]).
- **`@angular/material`**: Extensively utilizes Material Design components for UI layout, form controls, and feedback (e.g., `MatSnackBar`, `MatDialog`, `MatTable`, `MatPaginator`, `MatStepper`) (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts` (lines 35-42) ``]).
- **`@angular/cdk`**: Uses `CdkStepperModule` for custom stepper behaviors (**Confirmed** [`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts` (line 58) ``]).

---

#### portals_organization_entities_entity_properties_users

- **`libphonenumber-js`**: Used for parsing and validating phone numbers based on the selected country code. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts` (line 56) ``).
- **`@angular/fire/firestore`**: Used to instantiate Firestore `Timestamp` objects for role modification tracking. **Confirmed** (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts` (line 51) ``).

---

#### portals_organization_entities_entity_suppliers

This capability integrates with several external SDKs and libraries (Confirmed):
- **`libphonenumber-js`**: Used for parsing, formatting, and validating phone numbers in `OSKSuppliersCreationComponent` and `OSKSuppliersDetailsComponent` (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|parsePhoneNumber|createPhoneNumberValidator|phoneNumber,countryCode|#1` ``).
- **`@ngx-translate` / `@oskey/translate`**: Used for multi-language support via `OSKTranslatePipe` and `OSKTranslateService` (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|this.translate.instant|finish|'portals.organization.suppliers.createSupplier.saveSuccess'|#1` ``).
- **Angular Material**: Heavy usage of Material Design components including `MatStepper`, `MatDatepicker`, `MatTable`, `MatPaginator`, and `MatDialog` (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent` ``).

---

#### portals_organization_onboarding-cards

This capability integrates with several external libraries and SDKs:

- **Angular Material & CDK**:
  - Uses `@angular/cdk/accordion` for accordion layouts `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|@angular/cdk/accordion|#1` ``.
  - Uses various Material components (`MatCardModule`, `MatButtonModule`, `MatIconModule`, `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`, `MatDatepickerModule`, `MatProgressSpinnerModule`, `MatTableModule`, `MatPaginatorModule`, `MatTooltipModule`, `MatStepperModule`, `MatSlideToggleModule`).
- **`ngx-mat-timepicker`**:
  - Used in `OSKOnboardingCardFormComponent` for time selection `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|ngx-mat-timepicker|#1` ``.
- **Translation Engine**:
  - Relies on `@oskey/translate` (`OSKTranslateService` and `OSKTranslatePipe`) for internationalization `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|@oskey/translate|#1` ``.

---

#### portals_user

This capability integrates with the following external SDKs and libraries:
- **Angular Material**: Extensively uses components from `@angular/material` (including `MatCardModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatSelectModule`, `MatProgressSpinnerModule`, and `MatSnackBar`) `` `hosting/web-app/src/app/features/portals/user/account/account.component.ts` (lines 22-32) ``.
- **Angular Forms**: Uses `ReactiveFormsModule` and `FormsModule` for form handling `` `hosting/web-app/src/app/features/portals/user/account/account.component.ts` (lines 15, 34) ``.
- **Translation Engine**: Hooks into translation capabilities via `@oskey/translate` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|@oskey/translate|#1` ``.

---

#### portals_user_invitations

- **`@ngx-translate`**: Utilized via `@oskey/translate` for localizing UI strings, including invitation type labels [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|@oskey/translate|#1` `` and `` `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|this.translate.instant|anon|'portals.organization.onboardingCards.add.permanent'|#1` ``).
- **`ngx-mat-timepicker`**: Used to provide a timepicker interface for configuring access right validity [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|ngx-mat-timepicker|#1` ``).
- **Angular Material SDK**: Extensively uses Angular Material modules for form controls, layout, and icons [Confirmed] (via `` `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts` (lines 18-34) ``).

---

#### portals_user_organizations

This capability integrates with the following external libraries and SDKs:
- **Angular Material**: Extensively uses Material UI components including `MatTableModule`, `MatPaginatorModule`, `MatProgressSpinnerModule`, `MatButtonModule`, `MatCardModule`, `MatIconModule`, `MatTooltipModule`, and `MatSnackBar`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts` (lines 24-35) ``)
- **Translation Pipe & Service**: Uses `@oskey/translate` (wrapping `@ngx-translate` or similar) via `OSKTranslatePipe` and `OSKTranslateService` to translate UI messages such as `'portals.user.organizationInvitations.acceptedMsg'` and `'portals.user.organizationInvitations.rejectedMsg'`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts` (lines 29, 62) ``)

---

#### portals_user_organizations_pending-organizations

- **Angular Material SDK**: Extensively utilizes Material components (`MatTableModule`, `MatPaginatorModule`, `MatCardModule`, `MatProgressSpinnerModule`, `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`, `MatButtonModule`, `MatIconModule`) and `MatSnackBar` for UI presentation and notifications.
- **Translation Hooks**: Uses `@oskey/translate` (which likely wraps `@ngx-translate` or a similar translation library) to fetch localized strings such as `portals.user.addOrganization.organizationAdded` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|this.translateServiec.instant|'portals.user.addOrganization.organizationAdded'|#1` ``.

---

### 13. Architectural Observations

- **Modularization and Nesting**: The module is highly modularized, nesting domain-specific submodules (buildings, inhabitants, users, suppliers, message center) deeply under the property and entity contexts. This mirrors the physical and organizational hierarchy of the business domain. **[Inferred]**
- **High Shared-Component Coupling**: The `portals` submodule houses `OSKConfirmDialogComponent` in a shared directory. Because of this, 7 different submodules maintain inbound coupling to `portals` solely to import this dialog. This creates a high degree of coupling to the shell submodule for basic presentation concerns. **[Inferred]**
- **Centralized Onboarding State**: The `portals_organization_onboarding-cards` submodule acts as a shared utility domain. It has no outbound coupling but receives inbound coupling from 4 sibling submodules (`properties`, `inhabitants`, `users`, `suppliers`), indicating a highly centralized architecture for onboarding card operations. **[Confirmed]**
- **Multi-Tiered RBAC Gating**: Access control is implemented defensively at three distinct layers: client-side navigation menu filtering, route-level guards, and inline template/component checks. However, the lack of local guards on several sensitive submodules indicates that security is heavily reliant on parent-level route protection. **[Inferred]**

### 14. Risks & Open Questions

**Cross-cutting risks:**

- **Security Risk (Route Exposure)**: Highly sensitive submodules—specifically `inhabitants` (resident records), `suppliers` (physical access and pincodes), and `onboarding-cards` (activation codes)—lack local route guards (`canActivate`) in their routing files. If parent-level routes are not properly guarded, these endpoints may be exposed to unauthorized users. **[Inferred]**
- **Architectural Risk (High Coupling to Portals)**: The shared `OSKConfirmDialogComponent` is located inside the `portals` (sidemenu shell) submodule, forcing 7 sibling submodules to depend on `portals`. This violates clean separation of concerns and unidirectional dependency flow. **[Inferred]**
- **Circular/Bidirectional Dependency Risk**: The `authentication` submodule imports types from `portals_organization_entities_entity_properties_users`, while `portals` (which imports from `authentication`) is imported by `users`. This creates complex, bidirectional dependency chains across the module. **[Inferred]**
- **Duplicate Service Declarations**: There are two identical declarations of `OSKOrganizationEntitiesService` in different paths (`.../entities/features/entities-dashboard/services/organization-entities.service.ts` and `.../entities/services/organization-entities.service.ts`), risking split-brain state or maintenance overhead. **[Confirmed]**
- **Typo in Service Name**: `OSKAddOrganizationBuildingUntService` is missing an "i" in "Unit", whereas its corresponding component is named `OSKAddOrganizationBuildingUnitComponent`. **[Confirmed]**
- **Typo in Signal Name**: The signal `onboardingDocuemnts` (used in `OSKOnboardingCardsListComponent` and `OSKPropertyDashboardComponent`) contains a typo (`Docuemnts` instead of `Documents`). **[Confirmed]**

**Per-capability open questions:**

#### authentication

- The exact structure of the Auth0 configuration and how the Auth0 SDK is initialized is not evidenced in this pack. [Unknown]
- Whether any route guards are applied to the authentication routes is not evidenced, as no guards are referenced in `auth.routes.ts`. [Unknown]
- The exact implementation of `OSKFirebaseAuthService` and `OSKFirebaseHttpsService` is external to this capability pack, meaning their internal error handling or configuration details are unverified here. [Unknown]

#### home

- **Routing**: How is `OSKHomeComponent` loaded? Is there a parent routing configuration in the `features` module that references this component, or is it lazy-loaded elsewhere? (Unknown)
- **State and Interaction**: Does the home page handle any user interactions or local state, or is it purely a static landing page layout? (Unknown)

#### portals

- **Menu Configuration Storage**: How are the default sidemenu structures (`defaultSidemenu`) defined and stored on the user's account? The service references `user.selectedAccount?.defaultSidemenu` but the schema of this object is not fully detailed in the local types. `` `hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts` (lines 53-61) ``
- **Portal Route Guarding**: What route guards protect the portal routes themselves? No route definitions or guards are present in this capability pack, suggesting they are defined at a higher module level.

#### portals_organization

- **Entities Sub-route Details**: The exact implementation and child routes of the lazy-loaded `entities` route (`./features/entities/entities.routes`) are not visible in this capability pack. [Inferred]
- **Data Fetching & State**: No services or state management are defined in this pack. It is unknown if `OSKNotificationsComponent` and `OSKSettingsComponent` are purely presentational or if they fetch data using services that are not part of this capability's evidence. [Inferred]

#### portals_organization_entities

- **Duplicate Service Files**: Why are there two identical declarations of `OSKOrganizationEntitiesService` in different paths (`.../entities/features/entities-dashboard/services/organization-entities.service.ts` and `.../entities/services/organization-entities.service.ts`)? Is one of them deprecated or intended to be refactored?
- **Child Route Details**: What specific components and capabilities are loaded under the `:entityId` path in `./features/entity/entity.routes`?
- **Global Route Protection**: Are there higher-level route guards protecting the parent route of `entities.routes.ts`, since no guards are declared locally on these routes?

#### portals_organization_entities_entity

- **Backend Response Schema**: What is the exact data structure returned by the `organization-getEntityDashboardStatics` Firebase callable function? [Unknown]
- **Sub-Route Delegation**: Are the sub-routes (such as `properties`, `suppliers`, `users`, and `message-center`) fully managed by separate capabilities, or does this capability contain additional unevidenced logic for them? [Unknown]

#### portals_organization_entities_entity_message-center

- **Backend Function Verification**: The actual existence and exact parameter schemas of the Firebase callable functions (e.g., `organization-reformulateCommunicationWithGemini`) cannot be verified from this frontend capability pack alone. (Unknown)
- **Role-Based Access Control**: It is unclear if specific organization roles (e.g., Admin, Manager) are required to access the message center, as no route guards are defined in `message-center.routes.ts`. (Unknown)

#### portals_organization_entities_entity_properties

- **Chart Customization**: How is the doughnut chart customized? The code references `ctx.fillText` and `ctx.save` inside `OSKPropertyDashboardComponent`, suggesting custom canvas drawing plugins are registered inline, but the exact implementation details of these plugins are not fully detailed in the compact tables. [Unknown]
- **Document Signals**: How are `onboardingDocuemnts` and `pmpResidentDocuemnts` populated in `OSKPropertyDashboardComponent`? They are declared as signals, but there are no explicit call expressions showing them being set during initialization. [Unknown]
- **Firebase Function Schemas**: What are the exact request and response payloads for the Firebase callable functions? (No direct `api_contract` mappings are available in this scope). [Unknown]

#### portals_organization_entities_entity_properties_buildings

- **Typo in Service Name**: The service `OSKAddOrganizationBuildingUntService` is missing an "i" in "Unit" (named `UntService` instead of `UnitService`), whereas its corresponding component is named `OSKAddOrganizationBuildingUnitComponent`. It is unknown if this naming mismatch causes any developer confusion or if there is a plan to align them. (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/services/add-organization-building-unt/add-organization-building-unt.service.ts|OSKAddOrganizationBuildingUntService` ``).
- **Role Permissions**: It is unknown whether other roles besides `v1.org.client` are checked or if they have different access levels to the building lists, as only `v1.org.client` is explicitly referenced in the list components. (`` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts|v1.org.client|#1` ``).

#### portals_organization_entities_entity_properties_general-rules

- Whether the Firebase callable functions `building-getBuildingSettings` and `building-updateBuildingSettings` are fully implemented and integrated on the backend. [Unknown]
- The exact structure of the parent route and how parameters like `propertyId` are passed down to this capability's route. [Inferred]

#### portals_organization_entities_entity_properties_inhabitants

- **Route Protection**: Are these inhabitant management routes protected by any parent-level guards (e.g., at the organization or entity route level), since no local guards are defined in `organization-inhabitants.routes.ts`? (**Unknown**).
- **Dialog Context**: `OSKCreateOrganizationInhabitantComponent` injects `MatDialogRef<OSKCreateOnboardingCardsComponent>` (**Inferred** [`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|inject|anon|MatDialogRef<OSKCreateOnboardingCardsComponent>|#1` ``]). It is unclear if this is a copy-paste artifact or if there is a direct relationship with the onboarding cards dialog.
- **Custom Date Adapter**: Why is `OSKCustomDateAdapter` imported from the `suppliers` submodule (`../../../../../suppliers/features/suppliers-staff-access/custom-date-adapter`) instead of a shared core location? (**Unknown**).

#### portals_organization_entities_entity_properties_users

- **Verification of Backend Callables**: The existence and exact payload schemas of the Firebase callable functions (e.g., `organization-createPMPUserWithInvitation`) are unverified in this frontend-only context. **Unknown**.
- **Role Hierarchy Enforcement**: It is unclear if the role exclusions (filtering out `v1.org.admin`, etc.) are also enforced on the backend or if they are solely a frontend UI restriction. **Inferred** (frontend-only restriction in the current evidence).
- **Guard Configuration**: The exact configuration parameters passed to `user-role.guard` in the routing file are not fully detailed in the compact tables. **Unknown**.

#### portals_organization_entities_entity_suppliers

- **Route Protection**: Why are the routes in `suppliers.routes.ts` not protected by any `canActivate` guards? Are guards applied at a higher level in the routing hierarchy (e.g., at the entity or organization portal level)? (Inferred).
- **Pincode Generation**: How are pincodes generated and synchronized with physical access control devices? The frontend only triggers `supplier-createSupplierStaffAccess` and displays the resulting pincode, but the backend synchronization mechanism is unknown from this pack. (Unknown).
- **French Locale Hardcoding**: The `OSKCustomDateAdapter` and components hardcode the locale to `fr-FR` (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|Component|anon|{...providers: [provideNativeDateAdapter(), { provide: LOCALE_ID, useValue: 'fr-FR' }]...}|#1` ``). Is this application strictly targeted at French-speaking users, or is there a plan to dynamically resolve the locale? (Inferred).

#### portals_organization_onboarding-cards

- **Route Protection**: Are these routes protected by parent-level guards? No guards are defined directly in `onboarding-cards.routes.ts`, which leaves the routes open unless a parent route handles authorization.
- **Typo in Signal Name**: The signal `onboardingDocuemnts` in `OSKOnboardingCardsListComponent` contains a typo (`Docuemnts` instead of `Documents`). Will this be refactored to match standard naming conventions?
- **User Token Usage**: How is `OSKCurrentUserToken` utilized within `OSKOnboardingCardsListComponent`? The evidence shows it is injected, but no direct method calls on it are captured in the current fact pack.

#### portals_user

- **Route Protection**: Are the routes in `user.routes.ts` protected by parent-level guards (e.g., in a root portal route configuration), or are they completely public?
- **Sub-route Capabilities**: What specific capabilities and routes are defined inside `./invitations/invitations.routes` and `./organizations/organizations.routes`? These are lazy-loaded but their implementations are not part of this capability pack.
- **Notification & Settings Implementations**: The `OSKNotificationsComponent` and `OSKSettingsComponent` templates currently only contain basic card structures. Are there plans to implement actual settings toggles or notification lists within these components?

#### portals_user_invitations

- **Route Protection**: Are there any parent-level route guards (e.g., authentication or portal-access guards) that protect the `send` route, given that none are declared locally? [Unknown]
- **Response Schema**: What is the exact structure of the response returned by the Firebase callable function `user-getCurrentUserUnits`? [Unknown]

#### portals_user_organizations

- **Pending Organizations Submodule**: The contents and routing details of `./pending-organizations/pending-organizations.routes` are not visible in this capability pack. [Inferred]
- **Invitation Type Details**: The exact properties of the `OSKUserOrganizationinvitation` type alias are not fully detailed in the model properties, as only `OSKUserOrganizationInvitationResponseData` properties are explicitly listed. [Inferred]

#### portals_user_organizations_pending-organizations

- Are these routes protected by parent-level guards (e.g., at the `/portals/user` level) since no guards are defined locally in `pending-organizations.routes.ts`?
- What is the exact structure of the `OSKPendingOrganization` type and the country objects returned by `core-getCountries`?
- Is there any client-side validation logic for the tax number or other address fields beyond being "required"?

### 15. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, and 12) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.