### 0. Generation Metadata

- runId: 20260829_133905-8345d222
- generatedAt: 2026-08-29T13:56:38.772Z
- repoName: angular-app-oskey-io
- targetModule: features
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash

### 1. Executive Summary

The `features` module serves as the primary functional core of the application, encapsulating all user-facing portals, authentication workflows, and business domain logic. [Confirmed] It is architecturally structured into three primary functional areas: user authentication and onboarding, a comprehensive organization portal (managing entities, properties, buildings, inhabitants, suppliers, onboarding cards, and administrative users), and a user portal (handling personal profiles, invitations, and pending organization registrations). [Confirmed] The module relies heavily on reactive state management via Angular Signals and integrates role-based access control (RBAC) to dynamically gate navigation menus and route access. [Confirmed]

### 2. Architectural Position

The `features` module occupies the central feature-delivery layer of the application. [Confirmed] It sits directly above the `core` module, which provides low-level infrastructure, Firebase SDK integrations, translation services, and global error handling. [Confirmed] It interacts horizontally with the `components` module, which provides shared layout elements such as the application header. [Confirmed] 
- **Owned Concepts**: User Authentication, Organization & Entity Dashboards, Property Management (including buildings, units, doors, inhabitants, and general rules), Supplier Management, Onboarding Cards, and User Portal configurations. [Confirmed]
- **Provided Capabilities**: End-to-end user onboarding, multi-level administrative dashboards, dynamic permission-gated navigation menus, electronic door access (pincode) scheduling, and intercom communication management. [Confirmed]

### 3. Primary Responsibilities

#### authentication

- **Multi-method Sign-In**: Supports Auth0 redirect, Email/Password, and Email Link sign-in/sign-up flows. [Confirmed] `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/select-sign-in-method/select-sign-in-method.component.ts|OSKSelectSignInMethodComponent` ``
- **Auth0-to-Firebase Token Exchange**: Exchanges Auth0 ID tokens for Firebase custom tokens to sign users into Firebase. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|core-exchangeAuth0Token|#1` ``
- **Profile Creation & Onboarding**: Handles user profile creation in Firestore, updates display names, and processes pending PMP invitations during registration. [Confirmed] `` `firebase_callable_call|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|organization-processPMPInvitation|#1` ``
- **Password Reset & Action Codes**: Verifies action codes (e.g., `oobCode`) for password resets and email verification. [Confirmed] `` `class_method|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts|OSKAuthActionComponent|resetPassword|#1` ``
- **MFA Verification**: Supports second-factor authentication code confirmation. [Confirmed] `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/second-factor-authentification/second-factor-authentification.component.ts|OSKSecondFactorAuthentificationComponent` ``

---

#### home

- **Home Page Rendering**: Renders the main landing view using a standalone component with optimized change detection (`OnPush`) [Confirmed] (cite `` `call_expression|features|hosting/web-app/src/app/features/home/home.component.ts|Component|anon|{   selector: 'osk-home',   standalone: true,   imports: [NgOptimizedImage, OSKTranslatePipe, OSKHeaderComponent],   templateUrl: './home.component.html',   styleUrl: './home.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``).
- **Header Integration**: Composes the global header component within the home page layout [Confirmed] (cite `` `angular_template_composition|features|hosting/web-app/src/app/features/home/home.component.html|OSKHomeComponent|osk-header|#1` ``).

---

#### portals

- **Portal Layout Shell**: Hosts the main layout structure of the portal, embedding the sidemenu and providing a router outlet for child views `` `angular_component|features|hosting/web-app/src/app/features/portals/portal.component.ts|OSKPortalComponent` ``. (Confirmed)
- **Dynamic Sidemenu Navigation**: Manages a collapsible, responsive navigation menu that tracks active routes, extracts entity and property IDs from the URL, and dynamically fetches property lists `` `angular_component|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|OSKSidemenuComponent` ``. (Confirmed)
- **Role-Based Menu Generation**: Generates customized navigation structures for administrators and organization users by filtering menu items against specific permission roles (e.g., `v1.admin`, `v1.org.admin`) `` `function_declaration|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|generateOskeyAdminDefaultMenu|#1` ``, `` `function_declaration|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|generateUserOrganizationDefaultMenu|#1` ``. (Confirmed)
- **Shared UI Presentation**: Exposes reusable presentation components, including a styled card container (`OSKCardComponent`) and an asynchronous confirmation dialog (`OSKConfirmDialogComponent`) `` `angular_component|features|hosting/web-app/src/app/features/portals/shared/components/card/card.component.ts|OSKCardComponent` ``, `` `angular_component|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.ts|OSKConfirmDialogComponent` ``. (Confirmed)

---

#### portals_organization

### Organization Portal Routing
- Defines the routing structure for the organization portal, lazy-loading sub-features for entities, notifications, and settings `` `hosting/web-app/src/app/features/portals/organization/organization.routes.ts` (lines 17-32) ``. (Confirmed)

### Notifications View
- Renders the organization-level notifications interface using the `OSKNotificationsComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|OSKNotificationsComponent` ``. (Confirmed)

### Settings View
- Renders the organization-level settings interface using the `OSKSettingsComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|OSKSettingsComponent` ``. (Confirmed)

### Organization Type Definitions
- Declares common TypeScript type aliases to enforce the presence of `organizationId` across various contexts, such as properties and entities `` `hosting/web-app/src/app/features/portals/organization/types/with-organization-id.type.ts` (lines 1-12) ``. (Confirmed)

---

#### portals_organization_entities

- **Fetching and Displaying Organization Sub-Entities**: Retrieves all entities associated with an organization and filters them to display only those of type `subEntity`. [Confirmed] (`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|loadEntities|#1` ``, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|(response.data ?? []).filter|loadEntities|(entity) => entity.entityType === OSKEntityType.subEntity|#1` ``).
- **Creating New Organization Entities**: Provides a form and service integration to create new organization entities. [Confirmed] (`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|createEntity|#1` ``, `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|OSKOrganizationEntitiesService|createEntity|#1` ``).
- **Updating Existing Organization Entities**: Provides inline editing capabilities to update the name of an existing entity. [Confirmed] (`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|updateEntity|#1` ``, `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|OSKOrganizationEntitiesService|updateEntity|#1` ``).
- **Deleting Organization Entities**: Integrates a confirmation dialog to safely delete an entity from the organization. [Confirmed] (`` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|deleteEntity|#1` ``, `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|OSKOrganizationEntitiesService|deleteEntity|#1` ``).
- **Client Role Verification**: Checks the current user's roles to verify client-level access permissions during initialization. [Confirmed] (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|this.currentUser().selectedAccount?.roles.some|ngOnInit|(role) =>       role.includes('v1.org.client')|#1` ``).

---

#### portals_organization_entities_entity

- **Entity Dashboard UI**: Renders a comprehensive dashboard for a selected entity, displaying key metrics and a list of properties. (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent` ``)
- **Entity Routing & Navigation**: Manages the sub-routing structure for entity-specific features, including properties, suppliers, users, and communications. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts` ``)
- **Statistics Retrieval & Derivation**: Fetches raw entity statistics and computes derived counts for UI presentation. (Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent|getEntityDashboardStatics|#1` ``)
- **Property Listing**: Fetches and displays a paginated table of properties belonging to the entity. (Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|this.propertiesService       .getAllProperties|ngOnInit|this.organizationId,this.entityId|#1` ``)

#### portals_organization_entities_entity_message-center

### Listing and Filtering Communications
This capability provides a comprehensive list view of all intercom communications associated with a given property or entity. **(Confirmed)** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|OSKMessageCenterListComponent` ``
- Displays communications in a paginated table with sorting capabilities. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html` (lines 101, 226)
- Allows filtering by communication channel (e.g., 'intercom'), status (e.g., active, scheduled, expired), and text search. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts` (lines 230-295)

### Creating Communications with Conflict Detection
Users can create new intercom communications through a multi-step wizard. **(Confirmed)** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|OSKMessageCenterCreateComponent` ``
- Configures message details (title, body, priority, and channels). **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts` (lines 267-301)
- Selects target buildings and doors. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts` (lines 191-247)
- Schedules start and end dates/times. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts` (lines 325-365)
- Detects scheduling conflicts on selected doors and prompts the user to confirm replacing existing active communications. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts` (lines 438-476, 559-589)

### Viewing Communication Details
Provides a detailed read-only view of a specific communication, including its target doors, schedule, priority, and content. **(Confirmed)** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-details/message-center-details.component.ts|OSKMessageCenterDetailsComponent` ``

### Deleting Communications
Allows authorized users to delete existing intercom communications. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts` (lines 414-438)

---

#### portals_organization_entities_entity_properties

- **Property Listing**: Displays a filterable, paginated table of all properties associated with a specific organization and entity. [Confirmed] (via `OSKOrganizationPropertiesListComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|OSKOrganizationPropertiesListComponent` ``)
- **Property Creation**: Provides a form to create a new property, including details like property name, management type, property type, street address, and building assignments. [Confirmed] (via `OSKOrganizationPropertiesCreateComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|OSKOrganizationPropertiesCreateComponent` ``)
- **Property Editing**: Allows editing of existing property details and updating building assignments. [Confirmed] (via `OSKOrganizationPropertiesEditComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent` ``)
- **Property Dashboard**: Visualizes property-specific statistics (e.g., resident onboarding ratios via doughnut charts, active users, and buildings) and provides navigation to sub-features. [Confirmed] (via `OSKPropertyDashboardComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent` ``)
- **Property Data Management**: Interacts with Firebase backend services to fetch, create, update, and delete property records. [Confirmed] (via `OSKOrganizationPropertyService` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|OSKOrganizationPropertyService` ``)

---

#### portals_organization_entities_entity_properties_buildings

This capability is responsible for the following features:

- **Building Directory & Filtering**: Displays a paginated, filterable list of all buildings associated with a specific property. (**Confirmed**; `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts|OSKOrganizationBuildingsListComponent` ``).
- **Building Creation & Modification**: Provides a reactive form interface to add new buildings or edit existing ones, including address details and localized country dropdowns. (**Confirmed**; `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts|OSKAddOrganizationBuildingComponent` ``).
- **Building Details View**: Displays detailed information about a single building, including unit and door counts. (**Confirmed**; `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/organization-building-details.component.ts|OSKOrganizationBuildingDetailsComponent` ``).
- **Building Unit Management**: Supports listing, adding, and editing individual units within a building, capturing floor, unit number, and address details. (**Confirmed**; `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts|OSKAddOrganizationBuildingUnitComponent` ``).
- **Building Door Management**: Supports listing, adding, and editing doors associated with a building, capturing door names and address details. (**Confirmed**; `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|OSKAddOrganizationBuildingDoorComponent` ``).

---

#### portals_organization_entities_entity_properties_general-rules

- **Building Settings Retrieval**: Fetches building-specific settings (e.g., `residentSettings`) using the `OSKBuildingSettingsService` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|OSKBuildingSettingsService` ``. [Confirmed]
- **Building Settings Modification**: Allows authorized users to toggle and update boolean rules such as `allowResidentAddition`, `allowCoResidentAddition`, `allowQuickcodes`, `allowResidentsToSendInvitations`, `allowPermanentGuestsInvitations`, and `allowIntercomDisplayName` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/types/organization-general-rules.type.ts` (lines 71-76) ``. [Confirmed]
- **Building Selection**: Provides a list of buildings associated with a property, allowing the user to select a building and view its specific rules `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|buildings` ``. [Confirmed]
- **Access Methods and Refresh Frequencies Display**: Resolves and displays human-readable text for access methods (e.g., Bluetooth, NFC, PIN code, Facial Recognition, Sesame) and refresh frequencies `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts` (lines 291-306) ``. [Confirmed]

#### portals_organization_entities_entity_properties_inhabitants

### Inhabitant Listing & Filtering
- Displays a tabular list of all inhabitants associated with a specific property `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent|loadInhabitants|#1` ``. **Confirmed**.
- Supports client-side filtering by search query (matching email, first name, last name, building name, or unit number), onboarding status, and inhabitant type (owner or tenant) `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent|loadInhabitants|#1` ``. **Confirmed**.

### Inhabitant Creation Wizard
- Provides a multi-step stepper interface (`OSKCreateOrganizationInhabitantComponent`) to register new inhabitants `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent` ``. **Confirmed**.
- Collects personal information, validates email formats, and parses/validates phone numbers using international standards `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent|createPhoneNumberValidator|#1` ``. **Confirmed**.
- Configures access schedules (e.g., immediate, permanent, temporary) with custom date/time validation `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent|dateValidator|#1` ``. **Confirmed**.

### Inhabitant Details & Profile Management
- Displays detailed profile information for a selected inhabitant, including their assigned building, unit, PIN codes, and onboarding status `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|loadResidentDetails|#1` ``. **Confirmed**.
- Allows administrators to update inhabitant details and toggle their inhabitant type `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|updateResident|#1` ``. **Confirmed**.

### Onboarding Activation
- Dispatches onboarding activation codes via email to inhabitants to facilitate their registration process `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|sendActivationCode|#1` ``. **Confirmed**.

### Inhabitant Deletion
- Supports removing inhabitants from the property and organization after a confirmation dialog `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|deleteResident|#1` ``. **Confirmed**.

---

#### portals_organization_entities_entity_properties_users

### User and Invitee Listing
- Displays a filterable, paginated list of all organization users and pending invitees associated with the current organization [Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent` ``].
- Supports filtering the list by user details and handles pagination [Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent|applyFilter|#1` ``].
- Allows authorized administrators to cancel pending invitations or delete existing users [Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent|removeUser|#1` ``].

### User Invitation
- Provides a form to invite new users to the organization by specifying their first name, last name, email, phone number, and assigned roles [Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent` ``].
- Validates email addresses against organization restrictions and parses/validates phone numbers using international standards [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKAccountRestrictions.isAccountEmailAllowed|createEmailValidator|value|#1` ``, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|parsePhoneNumber|createPhoneNumberValidator|phoneNumber,countryCode|#1` ``].
- Dynamically loads and filters available composite roles, excluding administrative roles that cannot be assigned by the current user [Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|ngOnInit|#1` ``].

### User Details and Role Management
- Displays detailed information for a selected user or pending invitation [Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent` ``].
- Allows editing and updating the assigned roles for both active users and pending invitations [Confirmed, `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|save|#1` ``].
- Disables editing of personal details (first name, last name, email, phone) for already registered users, permitting only role modifications [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|this.userForm.controls.firstName.disable|getUser||#1` ``].

---

#### portals_organization_entities_entity_suppliers

This capability is responsible for the following distinct features:

- **Supplier Directory Listing**: Displays a filterable list of all suppliers associated with an organization, showing their names, types, assigned buildings, and staff counts. **Confirmed** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|OSKSuppliersListComponent` ``.
- **Supplier Onboarding/Creation**: Provides a multi-step wizard (`OSKSuppliersCreationComponent`) to collect supplier details (name, SIRET, contact info, address), add initial staff members, validate phone numbers, and save the record. **Confirmed** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|OSKSuppliersCreationComponent` ``.
- **Supplier Profile Management**: Allows viewing and editing of supplier details, notes, and addresses within a tabbed interface. **Confirmed** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent` ``.
- **Staff Roster Management**: Supports adding, updating, and deleting individual supplier staff members, including validation of their contact details. **Confirmed** `` `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|saveStaff|#1` ``.
- **Staff Access Scheduling & Pincodes**: Facilitates granting scheduled access to specific doors/buildings for selected staff members, displaying active/expired/upcoming access statuses, revealing/copying secure pincodes, and deleting access rights. **Confirmed** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts|OSKSuppliersStaffAccessComponent` ``.

---

#### portals_organization_onboarding-cards

- **Onboarding Cards Listing**: Displays a filterable, paginated list of onboarding documents for an organization, showing details such as onboarding status, activation codes, and associated doors `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent` ``. **Confirmed**
- **Adding Onboarding Cards**: Provides an interface to batch-add onboarding cards for inhabitants, resolving associated buildings and countries `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|OSKAddOnboardingCardsComponent` ``. **Confirmed**
- **Creating Onboarding Cards**: Facilitates the creation of onboarding cards through a multi-step dialog wizard, validating email formats and configuring access rights `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|OSKCreateOnboardingCardsComponent` ``. **Confirmed**
- **Editing Onboarding Cards**: Allows editing existing onboarding card details, including updating contact details, access rights, and door permissions `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.ts|OSKEditOnboardingCardComponent` ``. **Confirmed**
- **Reusable Onboarding Form**: Exposes a shared form component for capturing onboarding card details, including inhabitant type, access type, and recurrence rules `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|OSKOnboardingCardFormComponent` ``. **Confirmed**
- **Backend Integration**: Interfaces with Firebase HTTPS callable functions to fetch, create, update, and verify onboarding documents and activation codes `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|OSKOnboardingCardsService` ``. **Confirmed**

---

#### portals_user

- **User Account Profile Management**: Allows users to view and update their profile details (first name, last name, phone number, and email) [Confirmed] (evidenced by `` `angular_component|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|OSKAccountComponent` `` and `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|formControlName|#1` ``).
- **Country Selection and Proximity Sorting**: Fetches a list of countries and sorts them based on proximity to European countries (FR, BE, LU, DE, CH, IT, MC, ES, AD, GB) before displaying them to the user [Confirmed] (evidenced by `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|this.accountService.getCountries().then|ngOnInit|#1` ``).
- **User Notifications Display**: Renders user notifications [Confirmed] (evidenced by `` `angular_component|features|hosting/web-app/src/app/features/portals/user/notifications/notifications.component.ts|OSKNotificationsComponent` ``).
- **User Settings Management**: Renders user settings [Confirmed] (evidenced by `` `angular_component|features|hosting/web-app/src/app/features/portals/user/settings/settings.component.ts|OSKSettingsComponent` ``).
- **User Portal Routing**: Manages sub-routes for user-specific features including account, organizations, invitations, notifications, and settings [Confirmed] (evidenced by `` `hosting/web-app/src/app/features/portals/user/user.routes.ts` ``).

---

#### portals_user_invitations

- **Fetching User Buildings and Units**: Retrieves the list of buildings and units associated with the currently logged-in user to populate selection options [Confirmed, `service_method|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|OSKSendUserInvitationService|getUserUnits|#1`].
- **Managing Invitation State**: Handles local UI state for the invitation form, including selected buildings, units, and dynamically added or removed access rights [Confirmed, `class_method|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|buildingChanged|#1`, `class_method|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|addAccessRight|#1`, `class_method|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|removeAccessRight|#1`].
- **Submitting Invitations**: Validates and sends the invitation request payload to the backend via a Firebase HTTPS callable function [Confirmed, `service_method|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|OSKSendUserInvitationService|sendInvitation|#1`].

---

#### portals_user_organizations

- **Fetching Organization Invitations**: Retrieves pending organization invitations for the currently authenticated user. [Confirmed] (via `` `service_method|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|OSKOrganizationInvitationsService|getCurrentUserOrganizationInvitations|#1` ``)
- **Accepting Invitations**: Submits user acceptance for a specific organization invitation and updates the local UI state upon success. [Confirmed] (via `` `class_method|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|OSKOrganizationInvitationsComponent|acceptInvitation|#1` ``)
- **Rejecting Invitations**: Submits user rejection for a specific organization invitation and updates the local UI state upon success. [Confirmed] (via `` `class_method|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|OSKOrganizationInvitationsComponent|rejectInvitation|#1` ``)
- **Routing & Navigation**: Exposes routes for accessing the invitations list and pending organizations. [Confirmed] (via `` `hosting/web-app/src/app/features/portals/user/organizations/organizations.routes.ts` ``)

#### portals_user_organizations_pending-organizations

### Listing Pending Organizations
The capability is responsible for retrieving and displaying a list of pending organization requests associated with the currently logged-in user [Confirmed].
- It uses the `OSKUserPendingOrganizationsComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts|OSKUserPendingOrganizationsComponent` `` to render the list.
- It fetches the pending organizations via the `OSKUserPendingOrganizationsService` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts|this.organizationsService.getCurrentUserPendingOrganizations|ngOnInit||#1` ``.

### Creating Pending Organizations
The capability provides a form interface for users to submit a request to register a new organization [Confirmed].
- It uses the `OSKAddOrganizationComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|OSKAddOrganizationComponent` `` to capture organization details such as name, tax number, and street address.
- It submits the captured data using the `OSKAddOrganizationService` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|this.addOrganizationService       .addPendingOrganization|submit|<OSKPendingOrganization>{         userId: this.currentUser().oskUser!.userId,         ...this.organizationForm.value       }|#1` ``.

### Country Selection and Defaulting
During organization creation, the capability fetches a list of countries to populate a country selection dropdown [Confirmed].
- It retrieves countries using `OSKAddOrganizationService.getCountries()` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|this.addOrganizationService.getCountries|ngOnInit||#1` ``.
- It automatically identifies "France" in the list, moves it to the top of the selection array, and sets it as the default selected country `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|res.data.findIndex|ngOnInit|(c) => c.name === 'France'|#1` ``.

---

### 4. Public Interfaces (Components & Services)

#### authentication

### Components
- **OSKSignInComponent**: Container component for the sign-in flow. [Confirmed]
  - Selector: `osk-sign-in` `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts|OSKSignInComponent` ``
- **OSKAuthActionComponent**: Handles action codes for password reset and profile creation. [Confirmed]
  - Selector: `osk-auth-action` `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts|OSKAuthActionComponent` ``
- **OSKSecondFactorAuthentificationComponent**: Handles 2FA code verification. [Confirmed]
  - Selector: `osk-second-factor-authentification` `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/second-factor-authentification/second-factor-authentification.component.ts|OSKSecondFactorAuthentificationComponent` ``
- **OSKSelectSignInMethodComponent**: Allows users to select their preferred sign-in method. [Confirmed]
  - Selector: `osk-select-sign-in-method` `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/select-sign-in-method/select-sign-in-method.component.ts|OSKSelectSignInMethodComponent` ``
- **OSKSignInWithAuth0Component**: Triggers Auth0 redirect login. [Confirmed]
  - Selector: `osk-sign-in-with-auth0` `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-auth0/sign-in-with-auth0.component.ts|OSKSignInWithAuth0Component` ``
- **OSKSignInWithEmailAndPasswordComponent**: Form for email and password sign-in. [Confirmed]
  - Selector: `osk-sign-in-with-email-and-password` `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-and-password/sign-in-with-email-and-password.component.ts|OSKSignInWithEmailAndPasswordComponent` ``
- **OSKSignInWithEmailLinkComponent**: Form for email link sign-in. [Confirmed]
  - Selector: `osk-sign-in-with-email-link` `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-link/sign-in-with-email-link.component.ts|OSKSignInWithEmailLinkComponent` ``
- **OSKSignUpWithEmailLinkComponent**: Form for email link sign-up. [Confirmed]
  - Selector: `osk-sign-up-with-email-link` `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-up-with-email-link/sign-up-with-email-link.component.ts|OSKSignUpWithEmailLinkComponent` ``
- **OSKVerifyEmailComponent**: Displays email verification status. [Confirmed]
  - Selector: `osk-verify-email` `` `angular_component|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/verify-email/verify-email.component.ts|OSKVerifyEmailComponent` ``

### Services
- **OSKAuthService**: Core authentication service managing Firebase and Auth0 state, token exchanges, and profile updates. [Confirmed]
  - Scope: `providedIn: 'root'` `` `angular_injectable|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|OSKAuthService` ``

---

#### home

- **OSKHomeComponent** [Confirmed] (cite `` `source_class|features|hosting/web-app/src/app/features/home/home.component.ts|OSKHomeComponent` ``):
  - **Selector**: `osk-home` [Confirmed] (cite `` `call_expression|features|hosting/web-app/src/app/features/home/home.component.ts|Component|anon|{   selector: 'osk-home',   standalone: true,   imports: [NgOptimizedImage, OSKTranslatePipe, OSKHeaderComponent],   templateUrl: './home.component.html',   styleUrl: './home.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)
  - **Standalone**: `true` [Confirmed] (cite same `call_expression` fact)
  - **Change Detection**: `ChangeDetectionStrategy.OnPush` [Confirmed] (cite same `call_expression` fact)

No injectable services are exposed by this capability [Confirmed].

---

#### portals

### Components

- **`OSKPortalComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/portal.component.ts|OSKPortalComponent` ``
  - **Selector**: `osk-portal`
  - **Type**: Standalone Component
  - **Template**: Employs `OSKSidemenuComponent` and `RouterOutlet` to form the portal shell.
- **`OSKSidemenuComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|OSKSidemenuComponent` ``
  - **Selector**: `osk-sidemenu`
  - **Type**: Standalone Component
  - **Template**: Renders collapsible, multi-level navigation lists using Angular Material.
- **`OSKCardComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/shared/components/card/card.component.ts|OSKCardComponent` ``
  - **Selector**: `osk-card`
  - **Type**: Standalone Component
  - **Inputs**: Accepts custom styling inputs (e.g., `padding`, `margin`, `border`, `shadow`).
- **`OSKConfirmDialogComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.ts|OSKConfirmDialogComponent` ``
  - **Selector**: `osk-confirm-dialog`
  - **Type**: Standalone Component
  - **Data Injection**: Injects `MAT_DIALOG_DATA` to receive confirmation actions and text.

### Services

- **`OSKSidemenuService`** `` `angular_injectable|features|hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts|OSKSidemenuService` ``
  - **Scope**: `providedIn: 'root'`
  - **Purpose**: Manages the global state of the active sidemenu, supporting operations to push, pop, replace, and transition between menu levels.

---

#### portals_organization

### Components
- **`OSKNotificationsComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|OSKNotificationsComponent` ``
  - **Selector**: `osk-notifications` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|Component|anon|{   selector: 'osk-notifications',   standalone: true,   imports: [MatCardModule, OSKTranslatePipe],   templateUrl: './notifications.component.html',   styleUrl: './notifications.component.scss' }|#1` ``
  - **Standalone**: Yes
  - **Imports**: `MatCardModule`, `OSKTranslatePipe`

- **`OSKSettingsComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|OSKSettingsComponent` ``
  - **Selector**: `osk-settings` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|Component|anon|{   selector: 'osk-settings',   standalone: true,   imports: [MatCardModule, OSKTranslatePipe],   templateUrl: './settings.component.html',   styleUrl: './settings.component.scss' }|#1` ``
  - **Standalone**: Yes
  - **Imports**: `MatCardModule`, `OSKTranslatePipe`

### Services
- No Angular injectables or services are declared within this capability's evidence scope. (Confirmed)

---

#### portals_organization_entities

### Components
- **`OSKEntitiesDashboardComponent`** [Confirmed] (`` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent` ``)
  - **Selector**: `osk-entities-dashboard` (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|Component|anon|{   selector: 'osk-entities-dashboard',... }|#1` ``)
  - **Scope**: Standalone component (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|Component|anon|{... standalone: true,... }|#1` ``)

### Services
- **`OSKOrganizationEntitiesService`** [Confirmed] (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|OSKOrganizationEntitiesService` ``)
  - **Scope**: Provided in `'root'` (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``)
- **`OSKOrganizationEntitiesService`** (Duplicate Definition) [Confirmed] (`` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|OSKOrganizationEntitiesService` ``)
  - **Scope**: Provided in `'root'` (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/services/organization-entities.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``)

---

#### portals_organization_entities_entity

- **Components**:
  - `OSKEntityDashboardComponent` (Selector: `osk-entity-dashboard`): A standalone component that serves as the primary dashboard view for an entity. It displays statistics cards and a property list table. (Confirmed, `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent` ``)
- **Services**:
  - `OSKEntityService` (Scope: `root`): Provides methods to interact with backend endpoints for retrieving entity-specific data. (Confirmed, `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts|OSKEntityService` ``)

#### portals_organization_entities_entity_message-center

### Components
- **`OSKMessageCenterListComponent`**: Renders the main message center list view. Standalone component. Selector: `osk-communication-list`. **(Confirmed)** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|OSKMessageCenterListComponent` ``
- **`OSKMessageCenterCreateComponent`**: Renders the creation dialog wizard. Standalone component. Selector: `osk-message-center-create`. **(Confirmed)** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|OSKMessageCenterCreateComponent` ``
- **`OSKMessageCenterDetailsComponent`**: Renders the communication details dialog. Standalone component. Selector: `osk-message-center-details`. **(Confirmed)** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-details/message-center-details.component.ts|OSKMessageCenterDetailsComponent` ``
- **`OSKReplaceCommunicationConfirmDialogComponent`**: Renders the conflict confirmation dialog. Standalone component. Selector: `osk-replace-communication-confirm-dialog`. **(Confirmed)** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.ts|OSKReplaceCommunicationConfirmDialogComponent` ``
- **`OSKSavingCommunicationDialogComponent`**: Renders a progress dialog while saving. Standalone component. Selector: `osk-saving-communication-dialog`. **(Confirmed)** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/saving-communication-dialog/saving-communication-dialog.component.ts|OSKSavingCommunicationDialogComponent` ``

### Services
- **`OSKMessageCenterServiceService`**: Injected at the root level (`providedIn: 'root'`). Exposes methods to interact with the backend for fetching, creating, updating, and deleting communications, properties, and buildings. **(Confirmed)** `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|OSKMessageCenterServiceService` ``

---

#### portals_organization_entities_entity_properties

### Components

- **`OSKOrganizationPropertiesListComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts`
  - **Selector**: `osk-organization-properties-list`
  - **Class Name**: `OSKOrganizationPropertiesListComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts|OSKOrganizationPropertiesListComponent` ``
- **`OSKOrganizationPropertiesCreateComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts`
  - **Selector**: `osk-organization-properties-create`
  - **Class Name**: `OSKOrganizationPropertiesCreateComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts|OSKOrganizationPropertiesCreateComponent` ``
- **`OSKOrganizationPropertiesEditComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts`
  - **Selector**: `osk-organization-properties-edit`
  - **Class Name**: `OSKOrganizationPropertiesEditComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.ts|OSKOrganizationPropertiesEditComponent` ``
- **`OSKPropertyDashboardComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts`
  - **Selector**: `osk-property-dashboard`
  - **Class Name**: `OSKPropertyDashboardComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts|OSKPropertyDashboardComponent` ``

### Services

- **`OSKOrganizationPropertyService`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts`
  - **Class Name**: `OSKOrganizationPropertyService` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts|OSKOrganizationPropertyService` ``
  - **Scope**: `providedIn: 'root'`

---

#### portals_organization_entities_entity_properties_buildings

### Components

- **`OSKAddOrganizationBuildingDoorComponent`**  
  *Selector*: `osk-add-organization-building-door`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts`  
  *Fact ID*: `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/add-organization-building-door.component.ts|OSKAddOrganizationBuildingDoorComponent` ``  
  *Description*: Handles adding and editing building doors.

- **`OSKAddOrganizationBuildingUnitComponent`**  
  *Selector*: `osk-add-organization-building-unit`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts`  
  *Fact ID*: `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/add-organization-building-unit.component.ts|OSKAddOrganizationBuildingUnitComponent` ``  
  *Description*: Handles adding and editing building units.

- **`OSKAddOrganizationBuildingComponent`**  
  *Selector*: `osk-add-organization-building`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts`  
  *Fact ID*: `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/add-organization-building.component.ts|OSKAddOrganizationBuildingComponent` ``  
  *Description*: Handles adding and editing buildings.

- **`OSKOrganizationBuildingDetailsComponent`**  
  *Selector*: `osk-organization-building-details`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/organization-building-details.component.ts`  
  *Fact ID*: `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/organization-building-details.component.ts|OSKOrganizationBuildingDetailsComponent` ``  
  *Description*: Displays building details.

- **`OSKOrganizationBuildingDoorsListComponent`**  
  *Selector*: `osk-organization-building-doors-list`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.ts`  
  *Fact ID*: `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/organization-building-doors-list.component.ts|OSKOrganizationBuildingDoorsListComponent` ``  
  *Description*: Lists doors associated with a building.

- **`OSKOrganizationBuildingUnitsListComponent`**  
  *Selector*: `osk-organization-building-units-list`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/organization-building-units-list.component.ts`  
  *Fact ID*: `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/organization-building-units-list.component.ts|OSKOrganizationBuildingUnitsListComponent` ``  
  *Description*: Lists units associated with a building.

- **`OSKOrganizationBuildingsListComponent`**  
  *Selector*: `osk-organization-buildings-list`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts`  
  *Fact ID*: `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/organization-buildings-list.component.ts|OSKOrganizationBuildingsListComponent` ``  
  *Description*: Lists buildings associated with a property.

### Services

- **`OSKAddOrganizationBuildingDoorService`**  
  *Scope*: `providedIn: 'root'`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts`  
  *Fact ID*: `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-door/services/add-organization-building-door/add-organization-building-door.service.ts|OSKAddOrganizationBuildingDoorService` ``

- **`OSKAddOrganizationBuildingUntService`**  
  *Scope*: `providedIn: 'root'`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/services/add-organization-building-unt/add-organization-building-unt.service.ts`  
  *Fact ID*: `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building-unit/services/add-organization-building-unt/add-organization-building-unt.service.ts|OSKAddOrganizationBuildingUntService` ``

- **`OSKAddOrganizationBuildingService`**  
  *Scope*: `providedIn: 'root'`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/services/add-organization-building/add-organization-building.service.ts`  
  *Fact ID*: `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/add-organization-building/services/add-organization-building/add-organization-building.service.ts|OSKAddOrganizationBuildingService` ``

- **`OSKOrganizationBuildingDetailsService`**  
  *Scope*: `providedIn: 'root'`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/services/organization-building-details/organization-building-details.service.ts`  
  *Fact ID*: `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/services/organization-building-details/organization-building-details.service.ts|OSKOrganizationBuildingDetailsService` ``

- **`OSKOrganizationBuildingDoorsListService`**  
  *Scope*: `providedIn: 'root'`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/services/organization-building-doors-list/organization-building-doors-list.service.ts`  
  *Fact ID*: `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-doors-list/services/organization-building-doors-list/organization-building-doors-list.service.ts|OSKOrganizationBuildingDoorsListService` ``

- **`OSKOrganizationBuildingUnitsListService`**  
  *Scope*: `providedIn: 'root'`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/services/organization-building-units-list/organization-building-units-list.service.ts`  
  *Fact ID*: `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-units-list/services/organization-building-units-list/organization-building-units-list.service.ts|OSKOrganizationBuildingUnitsListService` ``

- **`OSKOrganizationBuildingsListService`**  
  *Scope*: `providedIn: 'root'`  
  *File*: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/services/organization-buildings-list/organization-buildings-list.service.ts`  
  *Fact ID*: `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-buildings-list/services/organization-buildings-list/organization-buildings-list.service.ts|OSKOrganizationBuildingsListService` ``

---

#### portals_organization_entities_entity_properties_general-rules

- **Components**:
  - `OSKListSettingsComponent` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent` ``
    - Selector: `osk-list-settings` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|Component|anon|{   selector: 'osk-list-settings',   standalone: true,   imports: [     MatCardModule,     OSKTranslatePipe,     MatButtonModule,     MatExpansionModule,     MatListModule,     MatIconModule,     MatProgressSpinnerModule,     MatSlideToggleModule,     CommonModule,     FormsModule,     MatSelectModule,     MatTooltip   ],   templateUrl: './list-settings.component.html',   styleUrl: './list-settings.component.scss' }|#1` ``
    - Inputs: Has a required input parameter (likely `propertyId` or `organizationId`) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|Input|anon|{ required: true }|#1` ``.
- **Services**:
  - `OSKBuildingSettingsService` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|OSKBuildingSettingsService` ``
    - Scope: `providedIn: 'root'` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``
    - Methods:
      - `getBuildingSettingsById(buildingId: string, settingsId: string)`: Fetches building settings `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|OSKBuildingSettingsService|getBuildingSettingsById|#1` ``.
      - `updateBuildingSettings(buildingId: string, payload: OSKBuildingSettingsInputParams)`: Updates building settings `` `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|OSKBuildingSettingsService|updateBuildingSettings|#1` ``.

#### portals_organization_entities_entity_properties_inhabitants

### Components
- **`OSKCreateOrganizationInhabitantComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent` ``
  - **Selector**: `osk-create-organization-inhabitant`
  - **Type**: Standalone Component
  - **Description**: A multi-step dialog wizard used to create a new inhabitant, assign them to buildings/units/doors, and configure their access schedules.
- **`OSKOrganizationInhabitantDetailsComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent` ``
  - **Selector**: `osk-organization-inhabitant-details`
  - **Type**: Standalone Component
  - **Description**: Displays and manages the detailed profile, PIN codes, and onboarding actions for a single inhabitant.
- **`OSKOrganizationInhabitantsListComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent` ``
  - **Selector**: `osk-organization-inhabitants-list`
  - **Type**: Standalone Component
  - **Description**: Displays a filterable list of all inhabitants associated with a property.

### Services
- **`OSKOrganizationInhabitantService`** `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService` ``
  - **Scope**: `providedIn: 'root'`
  - **Description**: Provides methods to interact with the backend for fetching, creating, updating, and deleting inhabitant records, as well as sending activation codes.

---

#### portals_organization_entities_entity_properties_users

### Components
- **`OSKInviteOrganizationUserComponent`**
  - **Selector**: `osk-invite-user` [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|Component|anon|{   standalone: true,   imports: [     MatButtonModule,     MatIconModule,     MatFormFieldModule,     MatInputModule,     OSKTranslatePipe,     RouterLink,     MatCardModule,     FormsModule,     ReactiveFormsModule,     MatButtonToggleModule,     MatProgressSpinnerModule,     MatSlideToggleModule,     MatSelectModule,     MatDividerModule   ],   selector: 'osk-invite-user',   templateUrl: './invite-organization-user.component.html',   styleUrl: './invite-organization-user.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts`
- **`OSKOrganizationUserDetailsComponent`**
  - **Selector**: `osk-organization-user-details` [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|Component|anon|{   standalone: true,   imports: [     MatFormFieldModule,     MatSelectModule,     MatSlideToggleModule,     MatDividerModule,     FormsModule,     ReactiveFormsModule,     OSKTranslatePipe,     MatProgressSpinnerModule,     MatCardModule,     MatButtonModule,     RouterLink,     MatIconModule,     MatChipsModule,     MatInputModule   ],   selector: 'osk-organization-user-details',   templateUrl: './organization-user-details.component.html',   styleUrl: './organization-user-details.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts`
- **`OSKOrganizationUsersListComponent`**
  - **Selector**: `osk-organization-users-list` [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|Component|anon|{   standalone: true,   imports: [     MatCardModule,     MatTableModule,     OSKTranslatePipe,     MatPaginatorModule,     MatProgressSpinnerModule,     RouterLink,     MatFormFieldModule,     MatInputModule,     MatButtonModule,     NgClass,     MatIconModule,     MatDialogModule,     MatSnackBarModule   ],   selector: 'osk-organization-users-list',   templateUrl: './organization-users-list.component.html',   styleUrl: './organization-users-list.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts`

### Services
- **`OSKInviteOrganizationUserService`**
  - **Scope**: `providedIn: 'root'` [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts`
- **`OSKOrganizationUserDetailsService`**
  - **Scope**: `providedIn: 'root'` [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/services/organization-user-details/organization-user-details.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/services/organization-user-details/organization-user-details.service.ts`
- **`OSKOrganizationUsersListService`**
  - **Scope**: `providedIn: 'root'` [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``]
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/services/organization-users-list/organization-users-list.service.ts`

---

#### portals_organization_entities_entity_suppliers

### Components

- **`OSKSuppliersListComponent`**  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts`  
  - **Selector**: `osk-suppliers-list`  
  - **Description**: Renders the main directory of suppliers with search and pagination. **Confirmed** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|OSKSuppliersListComponent` ``.

- **`OSKSuppliersCreationComponent`**  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts`  
  - **Selector**: `osk-suppliers-creation`  
  - **Description**: A dialog-based stepper wizard for onboarding new suppliers and their staff. **Confirmed** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|OSKSuppliersCreationComponent` ``.

- **`OSKSuppliersDetailsComponent`**  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts`  
  - **Selector**: `osk-suppliers-details`  
  - **Description**: Tabbed detail view for managing a single supplier's profile, staff, and access rights. **Confirmed** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent` ``.

- **`OSKSuppliersStaffAccessComponent`**  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts`  
  - **Selector**: `osk-suppliers-staff-access`  
  - **Description**: Dialog component to configure and schedule door access permissions for supplier staff. **Confirmed** `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts|OSKSuppliersStaffAccessComponent` ``.

### Services

- **`OSKSuppliersService`**  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts`  
  - **Scope**: `providedIn: 'root'`  
  - **Description**: Orchestrates all backend communication for suppliers, staff, and access rights. **Confirmed** `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|OSKSuppliersService` ``.

- **`OSKCustomDateAdapter`**  
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/custom-date-adapter.ts`  
  - **Scope**: Scoped locally as a provider in `OSKSuppliersStaffAccessComponent`. **Confirmed** `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts|Component|anon|{   selector: 'osk-suppliers-staff-access', ... }|#1` ``.
  - **Description**: Custom date adapter extending standard Material date handling to parse French locale dates (`DD/MM/YYYY`). **Confirmed** `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/custom-date-adapter.ts|OSKCustomDateAdapter` ``.

---

#### portals_organization_onboarding-cards

### Components

- **`OSKOnboardingCardFormComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|OSKOnboardingCardFormComponent` ``
  - **Selector**: `osk-onboarding-card-form` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|Component|anon|{   standalone: true,   imports: [     MatButtonModule,     MatIconModule,     FormsModule,     MatFormFieldModule,     OSKTranslatePipe,     MatInputModule,     MatSelectModule,     RouterLink,     MatCardModule,     NgxMatTimepickerModule,     MatDatepickerModule   ],   providers: [provideNativeDateAdapter()],   selector: 'osk-onboarding-card-form',   templateUrl: './onboarding-card-form.component.html',   styleUrl: './onboarding-card-form.component.scss' }|#1` ``
  - **Inputs**:
    - `buildings`: `OSKOnboardingBuilding[]` (Required) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|Input|anon|{ required: true }|#1` ``
    - `buildingsObject`: `Record<string, OSKOnboardingBuilding>` (Required) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|Input|anon|{ required: true }|#2` ``
    - `countries`: `OSKCountry[]` (Required) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|Input|anon|{ required: true }|#3` ``
    - `onboardingCard`: `OSKInhabitantOnboardingCard` (Required) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|Input|anon|{ required: true }|#4` ``
    - `organizationId`: `string` (Required) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|Input|anon|{ required: true }|#5` ``

- **`OSKAddOnboardingCardsComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|OSKAddOnboardingCardsComponent` ``
  - **Selector**: `osk-add-onboarding-cards` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|Component|anon|{   standalone: true,   imports: [     MatCardModule,     MatButtonModule,     MatIconModule,     CdkAccordionModule,     OSKTranslatePipe,     RouterLink,     MatProgressSpinnerModule,     OSKOnboardingCardFormComponent   ],   selector: 'osk-add-onboarding-cards',   templateUrl: './add-onboarding-cards.component.html',   styleUrl: './add-onboarding-cards.component.scss' }|#1` ``
  - **Inputs**:
    - `organizationId`: `string` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|Input|anon||#1` ``

- **`OSKCreateOnboardingCardsComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|OSKCreateOnboardingCardsComponent` ``
  - **Selector**: `osk-create-onboarding-cards` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|Component|anon|{   selector: 'osk-create-onboarding-cards',   standalone: true,   imports: [     MatDialogTitle,     MatButtonModule,     MatButtonModule,     MatStepperModule,     FormsModule,     ReactiveFormsModule,     MatFormFieldModule,     MatInputModule,     MatCardModule,     OSKTranslatePipe,     MatSlideToggleModule,     MatSelectModule,     OSKBooleanPipe   ],   templateUrl: './create-onboarding-cards.component.html',   styleUrl: './create-onboarding-cards.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``
  - **Inputs**:
    - `buildings`: `OSKOnboardingBuilding[]` (Required) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|Input|anon|{ required: true }|#1` ``
    - `buildingsObject`: `Record<string, OSKOnboardingBuilding>` (Required) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|Input|anon|{ required: true }|#2` ``
    - `countries`: `OSKCountry[]` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|Input|anon||#1` ``

- **`OSKEditOnboardingCardComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.ts|OSKEditOnboardingCardComponent` ``
  - **Selector**: `osk-edit-onboarding-card` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.ts|Component|anon|{   standalone: true,   imports: [     MatCardModule,     MatButtonModule,     MatIconModule,     RouterLink,     OSKTranslatePipe,     OSKOnboardingCardFormComponent,     MatProgressSpinnerModule   ],   selector: 'osk-edit-onboarding-card',   templateUrl: './edit-onboarding-card.component.html',   styleUrl: './edit-onboarding-card.component.scss' }|#1` ``
  - **Inputs**:
    - `onboardingId`: `string` (Required) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.ts|Input|anon|{ required: true }|#1` ``
    - `organizationId`: `string` (Required) `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.ts|Input|anon|{ required: true }|#2` ``

- **`OSKOnboardingCardsListComponent`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts` `` `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent` ``
  - **Selector**: `osk-onboarding-cards-list` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|Component|anon|{   standalone: true,   imports: [     MatTableModule,     MatPaginatorModule,     RouterLink,     OSKTranslatePipe,     MatProgressSpinnerModule,     MatButtonModule,     MatCardModule,     MatIconModule,     MatTooltipModule,     MatFormFieldModule,     MatInputModule   ],   selector: 'osk-onboarding-cards-list',   templateUrl: './onboarding-cards-list.component.html',   styleUrl: './onboarding-cards-list.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``
  - **Inputs**:
    - `organizationId`: `string` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|Input|anon||#1` ``

### Services

- **`OSKOnboardingCardsService`**
  - **File**: `hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts` `` `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|OSKOnboardingCardsService` ``
  - **Scope**: Provided in `'root'` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``

---

#### portals_user

#### Components
- **`OSKAccountComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/account/account.component.ts` (line 34) (evidenced by `` `angular_component|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|OSKAccountComponent` ``)
  - **Selector**: `osk-profile` (evidenced by `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|Component|anon|{   standalone: true,   imports: [     MatCardModule,     ReactiveFormsModule,     MatFormFieldModule,     OSKTranslatePipe,     MatInputModule,     MatButtonModule,     MatSelectModule,     FormsModule,     MatProgressSpinnerModule,     MatCardModule   ],   selector: 'osk-profile',   templateUrl: './account.component.html',   styleUrl: './account.component.scss' }|#1` ``)
  - **Scope**: Standalone component.
- **`OSKNotificationsComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/notifications/notifications.component.ts` (line 18) (evidenced by `` `angular_component|features|hosting/web-app/src/app/features/portals/user/notifications/notifications.component.ts|OSKNotificationsComponent` ``)
  - **Selector**: `osk-notifications` (evidenced by `` `call_expression|features|hosting/web-app/src/app/features/portals/user/notifications/notifications.component.ts|Component|anon|{   selector: 'osk-notifications',   standalone: true,   imports: [MatCardModule, OSKTranslatePipe],   templateUrl: './notifications.component.html',   styleUrl: './notifications.component.scss' }|#1` ``)
  - **Scope**: Standalone component.
- **`OSKSettingsComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/settings/settings.component.ts` (line 5) (evidenced by `` `angular_component|features|hosting/web-app/src/app/features/portals/user/settings/settings.component.ts|OSKSettingsComponent` ``)
  - **Selector**: `osk-settings` (evidenced by `` `call_expression|features|hosting/web-app/src/app/features/portals/user/settings/settings.component.ts|Component|anon|{   selector: 'osk-settings',   standalone: true,   imports: [MatCardModule, OSKTranslatePipe],   templateUrl: './settings.component.html',   styleUrl: './settings.component.scss' }|#1` ``)
  - **Scope**: Standalone component.

#### Services
- **`OSKAccountService`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts` (line 20) (evidenced by `` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|OSKAccountService` ``)
  - **Scope**: Provided in `'root'` (evidenced by `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``).

---

#### portals_user_invitations

#### Components
- **`OSKSendUserInvitationComponent`** [Confirmed, `angular_component|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent`]
  - **Selector**: `osk-send-user-invitation`
  - **File**: `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts`
  - **Standalone**: True
  - **Providers**: `provideNativeDateAdapter()` [Confirmed, `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|provideNativeDateAdapter|anon||#1`]

#### Services
- **`OSKSendUserInvitationService`** [Confirmed, `angular_injectable|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|OSKSendUserInvitationService`]
  - **File**: `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts`
  - **Scope**: `'root'` [Confirmed, `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|Injectable|anon|{   providedIn: 'root' }|#1`]

---

#### portals_user_organizations

- **`OSKOrganizationInvitationsComponent`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts` (line 38) (via `` `angular_component|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|OSKOrganizationInvitationsComponent` ``)
  - **Selector**: `osk-organization-invitations` (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|Component|anon|{   standalone: true,   imports: [     MatTableModule,     MatPaginatorModule,     OSKTranslatePipe,     MatProgressSpinnerModule,     MatButtonModule,     MatCardModule,     MatIconModule,     MatTooltipModule   ],   selector: 'osk-organization-invitations',   templateUrl: './organization-invitations.component.html',   styleUrl: './organization-invitations.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)
- **`OSKOrganizationInvitationsService`** [Confirmed]
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts` (line 21) (via `` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|OSKOrganizationInvitationsService` ``)
  - **Scope**: `providedIn: 'root'` (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``)

#### portals_user_organizations_pending-organizations

### Components
- **`OSKUserPendingOrganizationsComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts|OSKUserPendingOrganizationsComponent` ``
  - **Selector**: `osk-pending-organizations`
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts`
- **`OSKAddOrganizationComponent`** `` `angular_component|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|OSKAddOrganizationComponent` ``
  - **Selector**: `osk-add-organization`
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts`

### Services
- **`OSKUserPendingOrganizationsService`** `` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/services/pending-organizations/pending-organizations.service.ts|OSKUserPendingOrganizationsService` ``
  - **Scope**: `providedIn: 'root'`
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/services/pending-organizations/pending-organizations.service.ts`
- **`OSKAddOrganizationService`** `` `angular_injectable|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts|OSKAddOrganizationService` ``
  - **Scope**: `providedIn: 'root'`
  - **File**: `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts`

---

### 5. UI Composition

#### authentication

- **OSKSignInComponent**: Composes sub-components dynamically based on the selected sign-in method. [Confirmed] `` `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` (line 24) ``
  - Renders `<osk-select-sign-in-method>` and binds to its `selectSignInMethod` output. [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/select-sign-in-method/select-sign-in-method.component.html|OSKSelectSignInMethodComponent|click|#1` ``
  - Renders `<osk-sign-in-with-email-and-password>`, `<osk-sign-up-with-email-link>`, `<osk-sign-in-with-email-link>`, and `<osk-sign-in-with-auth0>`. [Confirmed] `` `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` (line 24) ``
- **OSKSelectSignInMethodComponent**: Renders buttons for each sign-in method and emits selection events. [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/select-sign-in-method/select-sign-in-method.component.html|OSKSelectSignInMethodComponent|click|#1` ``
- **OSKSignInWithEmailAndPasswordComponent**: Renders a form with inputs for email, password, and optionally first/last name for sign-up, binding to `formGroup` and handling `submit`. [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-and-password/sign-in-with-email-and-password.component.html|OSKSignInWithEmailAndPasswordComponent|formGroup|#1` ``
- **OSKAuthActionComponent**: Renders forms for password reset or profile creation depending on the action code (oobCode) state. [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.html|OSKAuthActionComponent|formGroup|#1` ``
- **OSKSecondFactorAuthentificationComponent**: Renders a form to input a 2FA code. [Confirmed] `` `angular_template_binding|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/second-factor-authentification/second-factor-authentification.component.html|OSKSecondFactorAuthentificationComponent|formGroup|#1` ``
- **OSKVerifyEmailComponent**: Renders a card prompting the user to verify their email. [Confirmed] `` `angular_template_composition|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/verify-email/verify-email.component.html|OSKVerifyEmailComponent|mat-card|#1` ``

---

#### home

- **OSKHomeComponent** renders the following child components and elements in its template:
  - `<osk-header>`: Composed directly within the template [Confirmed] (cite `` `angular_template_composition|features|hosting/web-app/src/app/features/home/home.component.html|OSKHomeComponent|osk-header|#1` ``).
  - It imports and utilizes `NgOptimizedImage` and `OSKTranslatePipe` for rendering optimized images and localized text [Confirmed] (cite `` `call_expression|features|hosting/web-app/src/app/features/home/home.component.ts|Component|anon|{   selector: 'osk-home',   standalone: true,   imports: [NgOptimizedImage, OSKTranslatePipe, OSKHeaderComponent],   templateUrl: './home.component.html',   styleUrl: './home.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``).
  - No specific input or output data bindings are evidenced in the pack [Inferred].

---

#### portals

- **`OSKPortalComponent`** `` `hosting/web-app/src/app/features/portals/portal.component.html` ``
  - Composes the layout by placing the `<osk-sidemenu>` component alongside a `<router-outlet>` to render child portal routes `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/portal.component.html|OSKPortalComponent|router-outlet|#1` ``.
- **`OSKConfirmDialogComponent`** `` `hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.html` ``
  - Composes Material dialog structures (`<mat-dialog-content>`, `<mat-dialog-actions>`) and conditionally displays a `<mat-spinner>` during active confirmation actions `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.html|OSKConfirmDialogComponent|mat-dialog-content|#1` ``, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.html|OSKConfirmDialogComponent|mat-spinner|#1` ``.
  - Binds the cancel button click to `onCancel()` and the confirm button click to `onConfirm()` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.html|OSKConfirmDialogComponent|click|#1` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.html|OSKConfirmDialogComponent|click|#2` ``.
- **`OSKSidemenuComponent`** `` `hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html` ``
  - Composes complex navigation lists using `<mat-nav-list>`, `<mat-accordion>`, `<mat-expansion-panel>`, `<mat-card>`, and `<mat-menu>` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|mat-nav-list|#1` ``, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|mat-accordion|#1` ``.
  - Dynamically binds `routerLink` and `routerLinkActiveOptions` to menu items `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|routerLink|#4` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|routerLinkActiveOptions|#1` ``.
  - Binds click events to trigger menu transitions (`showPreviousMenu()`, `showNextMenu()`) and user sign-out (`signOut()`) `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|click|#2` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.html|OSKSidemenuComponent|click|#3` ``.
- **`OSKCardComponent`** `` `hosting/web-app/src/app/features/portals/shared/components/card/card.component.html` ``
  - A simple wrapper component that applies dynamic CSS classes via `ngClass` based on input properties `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/shared/components/card/card.component.html|OSKCardComponent|ngClass|#1` ``.

---

#### portals_organization

### `OSKNotificationsComponent`
- Renders a Material Design card layout containing notification details `` `hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.html` (lines 16-20) ``.
- **Composition**:
  - `mat-card` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.html|OSKNotificationsComponent|mat-card|#1` ``
  - `mat-card-content` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.html|OSKNotificationsComponent|mat-card-content|#1` ``

### `OSKSettingsComponent`
- Renders a Material Design card layout containing settings details `` `hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.html` (lines 16-20) ``.
- **Composition**:
  - `mat-card` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.html|OSKSettingsComponent|mat-card|#1` ``
  - `mat-card-content` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.html|OSKSettingsComponent|mat-card-content|#1` ``

---

#### portals_organization_entities

### Template Composition
The `OSKEntitiesDashboardComponent` template is composed of several Angular Material and native elements [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html` ``):
- **`mat-card`**, **`mat-card-header`**, **`mat-card-title`**, **`mat-card-content`**, **`mat-card-actions`**: Used to structure the dashboard layout, entity lists, and forms.
- **`mat-form-field`**, **`mat-label`**, **`mat-error`**: Used to build the reactive forms for creating and editing entities.
- **`mat-icon`**: Renders visual indicators for actions (e.g., edit, delete).
- **`mat-spinner`**: Displays loading states during data fetching or submission.

### Template Bindings
- **Inputs**:
  - `[form-visible]`: Binds form visibility state on `mat-card` [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|form-visible|#1` ``).
  - `[formGroup]`: Binds reactive form instances to the creation and editing forms [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|formGroup|#1` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|formGroup|#2` ``).
  - `[routerLink]`: Directs users to specific entity detail views [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|routerLink|#1` ``).
  - `[disabled]`: Disables buttons during loading or invalid form states [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|disabled|#1` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|disabled|#2` ``).
  - `[matTooltip]`: Binds tooltips to action elements [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|matTooltip|#1` ``).
- **Outputs**:
  - `(click)`: Triggers actions such as toggling forms, starting edits, or opening confirmation dialogs [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|click|#1` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|click|#2` ``).
  - `(ngSubmit)`: Handles form submissions for creating and updating entities [Confirmed] (`` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|ngSubmit|#1` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.html|OSKEntitiesDashboardComponent|ngSubmit|#2` ``).

---

#### portals_organization_entities_entity

The `OSKEntityDashboardComponent` template composes several Angular Material and custom elements to construct the dashboard layout:
- **Layout & Structure**: Uses `mat-card` and `mat-card-content` to structure the statistics and property list sections. (Confirmed, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|mat-card|#1` ``)
- **Data Table**: Renders a table with a data source bound to the retrieved properties. (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|dataSource|#1` ``)
- **Pagination**: Integrates `mat-paginator` to handle property list pagination, binding `pageSize` and `pageSizeOptions`. (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|pageSize|#1` ``)
- **Navigation Links**: Binds `routerLink` on buttons and table rows to navigate to specific sub-features or property details. (Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|routerLink|#1` ``)
- **Loading State**: Displays a `mat-spinner` during data loading operations. (Confirmed, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.html|OSKEntityDashboardComponent|mat-spinner|#1` ``)

#### portals_organization_entities_entity_message-center

### `OSKMessageCenterListComponent`
- Composes a Material Card (`mat-card`) containing filtering controls and a Material Table (`mat-table`). **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html` (lines 16, 42, 101)
- Uses `mat-paginator` to handle list pagination. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html` (line 226)
- Displays a loading spinner (`mat-spinner`) when fetching data. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.html` (line 222)

### `OSKMessageCenterCreateComponent`
- Composes a Material Stepper (`mat-stepper`) with four steps:
  1. **Message Content**: Form fields for title, body, and channel checkboxes (`mat-checkbox`). **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.html` (lines 30, 168, 171)
  2. **Targets**: Selection list (`mat-selection-list`) grouped by property and building using expansion panels (`mat-expansion-panel`). **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.html` (lines 191, 401, 409)
  3. **Scheduling**: Datepickers (`mat-datepicker`) and time inputs for scheduling. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.html` (lines 219, 220, 377)
  4. **Recap**: Displays a summary of the communication configuration before saving. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.html` (line 575)

### `OSKReplaceCommunicationConfirmDialogComponent`
- Composes a dialog layout with `mat-dialog-content` and `mat-dialog-actions` to display conflicting doors and buildings, prompting confirmation. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.html` (lines 26, 72)

---

#### portals_organization_entities_entity_properties

- **`OSKOrganizationPropertiesListComponent`**: Renders a `mat-card` containing a search input, a `mat-table` bound to `dataSource`, and a `mat-paginator` with `pageSizeOptions`. It also renders action buttons with `routerLink` for editing or navigating to property dashboards, and a delete button that triggers a confirmation dialog. [Confirmed] (via `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.html` ``)
- **`OSKOrganizationPropertiesCreateComponent`**: Renders a form inside a `mat-card` with input fields for property name, management type, property type, and address details. It uses `mat-select` and `mat-option` for dropdowns, `mat-error` for validation, and a `mat-spinner` when saving. [Confirmed] (via `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.html` ``)
- **`OSKOrganizationPropertiesEditComponent`**: Similar to the create component, it renders a form inside a `mat-card` with pre-populated values, using `mat-select`, `mat-option`, `mat-error`, and `mat-spinner` for both loading and saving states. [Confirmed] (via `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-edit/organization-properties-edit.component.html` ``)
- **`OSKPropertyDashboardComponent`**: Renders a dashboard layout with multiple `mat-card` elements. It features a `canvas` element bound to chart.js properties (`datasets`, `labels`, `legend`, `options`, `plugins`, `type`) to render a doughnut chart of resident onboarding statistics. It also displays a `mat-table` of active users with a `mat-paginator` and a `mat-spinner` for loading states. [Confirmed] (via `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.html` ``)

---

#### portals_organization_entities_entity_properties_buildings

The components in this capability compose various Angular Material elements and custom pipes to construct the user interface:

### Add/Edit Building, Unit, and Door Forms
- **`OSKAddOrganizationBuildingDoorComponent`** renders a card layout (`mat-card`, `mat-card-content`) containing a reactive form (`formGroup`). It binds inputs (`formControlName`) for address details, a country selector (`mat-select` with `ngModel` and `ngModelChange`), and action buttons (`routerLink` for back, and a submit button that triggers `createDoor` or `updateBuilding`). Loading and saving states are represented by `mat-spinner`. (File: `add-organization-building-door.component.html`, lines 16, 17, 40, 54, 115, 124).
- **`OSKAddOrganizationBuildingUnitComponent`** mirrors this structure, rendering a reactive form with fields for unit name, floor, unit number, and street address. It binds a country selector and action buttons, displaying spinners during load/save operations. (File: `add-organization-building-unit.component.html`, lines 16, 17, 40, 76, 137, 146).
- **`OSKAddOrganizationBuildingComponent`** provides the form layout for building creation and modification, binding street address fields and country selection. (File: `add-organization-building.component.html`, lines 16, 17, 38, 52, 113, 122).

### Detail Views
- **`OSKOrganizationBuildingDetailsComponent`** displays building details inside a card structure (`mat-card`, `mat-card-header`, `mat-card-content`, `mat-card-footer`). It binds navigation buttons (`routerLink`) to edit the building, view units, or view doors. It uses `OSKTranslatePipe` for localization. (File: `organization-building-details.component.html`, lines 16, 17, 42, 75, 113).

### List Views
- **`OSKOrganizationBuildingsListComponent`**, **`OSKOrganizationBuildingUnitsListComponent`**, and **`OSKOrganizationBuildingDoorsListComponent`** render tabular directories using `mat-table` (`dataSource` binding) and `mat-paginator` (`pageSize`, `pageSizeOptions` bindings). They feature a search filter input (`keyup` or `input` binding triggering `applyFilter`) and action buttons (`routerLink` or `click` handlers) to add or edit items. (Files: `organization-buildings-list.component.html` line 67, `organization-building-units-list.component.html` line 84, `organization-building-doors-list.component.html` line 84).

---

#### portals_organization_entities_entity_properties_general-rules

- **Template Composition**:
  - `OSKListSettingsComponent` renders a card layout using `mat-card` and `mat-card-content` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html|OSKListSettingsComponent|mat-card|#1` ``.
  - It displays an expandable list of buildings using `mat-expansion-panel`, `mat-expansion-panel-header`, and `mat-panel-title` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html|OSKListSettingsComponent|mat-expansion-panel|#1` ``.
  - Individual buildings are listed using `mat-list` and `mat-list-item` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html|OSKListSettingsComponent|mat-list-item|#1` ``.
  - Settings are toggled using multiple `mat-slide-toggle` elements `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html|OSKListSettingsComponent|mat-slide-toggle|#1` ``.
  - Loading indicators are rendered using `mat-spinner` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html|OSKListSettingsComponent|mat-spinner|#1` ``.
- **Template Bindings**:
  - `mat-list-item` binds `active` to indicate the selected building and handles `click` events to trigger building selection `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html|OSKListSettingsComponent|active|#1` ``.
  - `mat-slide-toggle` elements bind `checked` to the current setting value, `disabled` to computed signals indicating if the setting can be changed, and `change` to handle setting updates `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.html|OSKListSettingsComponent|checked|#1` ``.

#### portals_organization_entities_entity_properties_inhabitants

### `OSKCreateOrganizationInhabitantComponent`
- **Template Composition**: Renders a multi-step wizard using Angular Material Stepper (`mat-stepper`, `mat-step`) `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|mat-stepper|#1` ``.
- **Form Controls**: Uses `mat-form-field`, `mat-select`, `mat-checkbox`, `mat-radio-group`, `mat-radio-button`, and `mat-datepicker` for data entry `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html` (lines 35-802) ``.
- **Bindings**:
  - Binds reactive forms via `formGroup` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|formGroup|#1` ``.
  - Listens to checkbox changes to toggle selections `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|change|#1` ``.
  - Handles click events for navigation and submission `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|click|#1` ``.

### `OSKOrganizationInhabitantDetailsComponent`
- **Template Composition**: Renders a card layout (`mat-card`, `mat-card-content`, `mat-card-actions`) containing tabbed sections (`mat-tab-group`, `mat-tab`) to separate profile details from other configurations `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-card|#1` ``, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-tab-group|#1` ``.
- **Bindings**:
  - Uses two-way data binding (`ngModel` and `ngModelChange`) for editing inhabitant fields `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|ngModel|#1` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|ngModelChange|#1` ``.
  - Binds click handlers to trigger updates, deletion, and activation code dispatch `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|click|#1` ``.

### `OSKOrganizationInhabitantsListComponent`
- **Template Composition**: Renders a card containing a search input, filter dropdowns (`mat-select`), and a data table (`table`) with a paginator (`mat-paginator`) `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html` (lines 16-233) ``.
- **Bindings**:
  - Binds `dataSource` to the table `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|dataSource|#1` ``.
  - Listens to `keyup` on the search input to filter results `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|keyup|#1` ``.
  - Binds `routerLink` to table rows to navigate to an inhabitant's details page `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|routerLink|#1` ``.

---

#### portals_organization_entities_entity_properties_users

### `OSKInviteOrganizationUserComponent`
- Renders inside a Material Card (`mat-card`) with a form layout [Confirmed, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html|OSKInviteOrganizationUserComponent|mat-card|#1` ``].
- **Form Bindings**:
  - Bound to `formGroup` `userForm` [Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html|OSKInviteOrganizationUserComponent|formGroup|#1` ``].
  - Inputs for `firstName`, `lastName`, `email`, `phoneNumber`, and `countryList` (Material Select) [Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html|OSKInviteOrganizationUserComponent|formControlName|#1` ``, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html|OSKInviteOrganizationUserComponent|formControlName|#4` ``].
  - Slide toggles (`mat-slide-toggle`) for role selection, triggering `toggleRoleSelection` on change [Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html|OSKInviteOrganizationUserComponent|change|#1` ``].
- **Feedback**: Displays a progress spinner (`mat-spinner`) during role loading or form submission [Confirmed, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.html|OSKInviteOrganizationUserComponent|mat-spinner|#1` ``].

### `OSKOrganizationUserDetailsComponent`
- Renders a detail view inside a Material Card (`mat-card`) [Confirmed, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.html|OSKOrganizationUserDetailsComponent|mat-card|#1` ``].
- **Form Bindings**:
  - Bound to `formGroup` `userForm` [Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.html|OSKOrganizationUserDetailsComponent|formGroup|#1` ``].
  - Personal details inputs are conditionally disabled based on user registration status [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|this.userForm.controls.firstName.disable|getUser||#1` ``].
  - Slide toggles for role modifications [Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.html|OSKOrganizationUserDetailsComponent|change|#1` ``].
- **Feedback**: Displays a progress spinner (`mat-spinner`) during data retrieval or saving [Confirmed, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.html|OSKOrganizationUserDetailsComponent|mat-spinner|#1` ``].

### `OSKOrganizationUsersListComponent`
- Renders a Material Table (`table[dataSource]`) displaying user list data [Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.html|OSKOrganizationUsersListComponent|dataSource|#1` ``].
- **Interactions**:
  - Row click triggers `openDetails(user)` to navigate to details [Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.html|OSKOrganizationUsersListComponent|click|#2` ``].
  - Action buttons within rows trigger `removeUser(user, $event)` to delete a user or cancel an invitation [Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.html|OSKOrganizationUsersListComponent|click|#1` ``].
  - Includes a search input for filtering and a `mat-paginator` [Confirmed, `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.html|OSKOrganizationUsersListComponent|input|#1` ``, `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.html|OSKOrganizationUsersListComponent|mat-paginator|#1` ``].

---

#### portals_organization_entities_entity_suppliers

The capability utilizes Angular Material components and custom dialogs to compose its user interfaces:

- **`OSKSuppliersListComponent` Template**:
  - Renders a search input field bound to `applyFilter($event)` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.html|OSKSuppliersListComponent|input|#1` ``.
  - Uses `mat-table` bound to `dataSource` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.html|OSKSuppliersListComponent|dataSource|#1` ``.
  - Employs a master-detail layout where clicking a row toggles expansion using a custom `@detailExpand` animation `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.html|OSKSuppliersListComponent|detailExpand|#1` ``.
  - Contains a "Create Supplier" button that triggers `openCreateSupplierDialog()` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.html|OSKSuppliersListComponent|click|#1` ``.

- **`OSKSuppliersCreationComponent` Template**:
  - Uses `mat-stepper` to guide the user through "Supplier Details" and "Staff Members" steps `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.html|OSKSuppliersCreationComponent|stepControl|#1` ``.
  - Binds forms to `supplierForm` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.html|OSKSuppliersCreationComponent|formGroup|#1` `` and `staffForm` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.html|OSKSuppliersCreationComponent|formGroup|#2` ``.
  - Includes country selectors (`mat-select`) bound to `formControlName="countryList"` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.html|OSKSuppliersCreationComponent|formControlName|#1` ``.

- **`OSKSuppliersDetailsComponent` Template**:
  - Uses `mat-tab-group` bound to `selectedIndex` and `selectedTabChange` to switch between "Details", "Staff", and "Access Rights" tabs `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.html|OSKSuppliersDetailsComponent|selectedTabChange|#1` ``.
  - Under the "Access Rights" tab, it renders a `mat-accordion` with expansion panels for each building `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.html|OSKSuppliersDetailsComponent|mat-accordion|#1` ``.
  - Secure pincodes are masked by default and can be toggled via `togglePincode(pincode.id)` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.html|OSKSuppliersDetailsComponent|click|#13` ``.
  - Copying pincodes is handled via `copyPincode(pincode.pincode)` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.html|OSKSuppliersDetailsComponent|click|#14` ``.

- **`OSKSuppliersStaffAccessComponent` Template**:
  - Uses `mat-stepper` to configure access `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.html|OSKSuppliersStaffAccessComponent|mat-stepper|#1` ``.
  - Employs `mat-selection-list` to select staff members `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.html|OSKSuppliersStaffAccessComponent|mat-selection-list|#1` ``.
  - Uses `mat-datepicker` for selecting access validity start and end dates `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.html|OSKSuppliersStaffAccessComponent|mat-datepicker|#1` ``.

---

#### portals_organization_onboarding-cards

The components in this capability compose various Angular Material elements and custom forms to build the onboarding card management interfaces:

- **`OSKAddOnboardingCardsComponent`** renders a list of onboarding card forms inside a CDK Accordion.
  - Composes `<cdk-accordion>` and `<cdk-accordion-item>` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.html|OSKAddOnboardingCardsComponent|cdk-accordion|#1` ``.
  - Embeds the reusable `<osk-onboarding-card-form>` component, binding inputs like `buildings`, `buildingsObject`, `countries`, `onboardingCard`, and `organizationId` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/add-onboarding-cards/add-onboarding-cards.component.html|OSKAddOnboardingCardsComponent|onboardingCard|#1` ``.
  - Displays a `<mat-spinner>` during loading states `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.html|OSKAddOnboardingCardsComponent|mat-spinner|#1` ``.

- **`OSKEditOnboardingCardComponent`** provides a wrapper around the onboarding card form for editing.
  - Embeds `<osk-onboarding-card-form>` with corresponding data bindings `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.html|OSKEditOnboardingCardComponent|osk-onboarding-card-form|#1` ``.
  - Displays `<mat-spinner>` elements during data fetching and saving operations `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.html|OSKEditOnboardingCardComponent|mat-spinner|#1` ``.

- **`OSKCreateOnboardingCardsComponent`** implements a multi-step creation wizard.
  - Composes `<mat-stepper>` and `<mat-step>` to partition the creation process `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.html|OSKCreateOnboardingCardsComponent|mat-stepper|#1` ``.
  - Uses `<mat-form-field>`, `<mat-select>`, and `<mat-slide-toggle>` to capture user details, building/unit selections, and app user status `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.html|OSKCreateOnboardingCardsComponent|mat-slide-toggle|#1` ``.

- **`OSKOnboardingCardsListComponent`** displays a tabular view of onboarding documents.
  - Composes `<table mat-table>` with `<mat-paginator>` to list onboarding documents `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.html|OSKOnboardingCardsListComponent|mat-paginator|#1` ``.
  - Binds the table's `dataSource` input to local document lists `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.html|OSKOnboardingCardsListComponent|dataSource|#1` ``.
  - Uses `<mat-icon>` to display status indicators and action buttons `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.html|OSKOnboardingCardsListComponent|mat-icon|#1` ``.

- **`OSKOnboardingCardFormComponent`** encapsulates the form fields for onboarding card details.
  - Composes `<mat-form-field>`, `<mat-select>`, `<mat-option>`, and `<input>` elements bound to `ngModel` for two-way data binding `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.html|OSKOnboardingCardFormComponent|ngModel|#1` ``.
  - Integrates `<mat-datepicker>` and `<ngx-mat-timepicker>` for date and time selection `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.html|OSKOnboardingCardFormComponent|mat-datepicker|#1` ``.

---

#### portals_user

- **`OSKAccountComponent`** [Confirmed]:
  - Renders a Material Card (`mat-card`, `mat-card-content`) containing a reactive form (`formGroup` bound to `accountForm`) `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|formGroup|#1` ``.
  - Composes Material Form Fields (`mat-form-field`, `mat-label`, `mat-error`) for user inputs: first name, last name, phone number, and email `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|formControlName|#1` ``.
  - Composes a country selector dropdown (`mat-select` with `ngModel` and `ngModelChange` bindings, rendering `mat-option` elements) `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|ngModel|#1` ``.
  - Composes a submit button that triggers the `submit()` method `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|submit|#1` ``.
  - Composes a loading spinner (`mat-spinner`) displayed during save operations `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/account/account.component.html|OSKAccountComponent|mat-spinner|#1` ``.
- **`OSKNotificationsComponent`** [Confirmed]:
  - Renders a Material Card (`mat-card`, `mat-card-content`) `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/notifications/notifications.component.html|OSKNotificationsComponent|mat-card|#1` ``. No other notable composition or bindings are present in the evidence.
- **`OSKSettingsComponent`** [Confirmed]:
  - Renders a Material Card (`mat-card`, `mat-card-content`) `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/settings/settings.component.html|OSKSettingsComponent|mat-card|#1` ``. No other notable composition or bindings are present in the evidence.

---

#### portals_user_invitations

The `OSKSendUserInvitationComponent` template is composed of standard Angular Material elements and a third-party timepicker component to facilitate form entry [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html` (lines 16-203)]:

- **Structural Layout**: Uses `mat-card` and `mat-card-content` to group form sections [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html` (lines 16, 17, 71, 72)].
- **Form Controls**:
  - Text inputs for email and other text fields bound via `ngModel` [Confirmed, `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html|OSKSendUserInvitationComponent|ngModel|#1`].
  - `mat-select` dropdowns for selecting buildings, units, and access right types, bound via `ngModel` and handling change events via `ngModelChange` [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html` (lines 28, 42, 55, 80)].
  - Datepicker inputs (`matDatepicker`) with minimum date restrictions (`min`) [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html` (lines 104, 147)].
  - Timepicker inputs (`ngxMatTimepicker`) with format configurations [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html` (lines 123, 166)].
- **Interactive Actions**:
  - Buttons to add or remove access rights [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html` (lines 89, 188)].
  - A submit button that triggers `sendInvitation()` on click and is disabled when the form is saving [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html` (line 194)].
- **Feedback Indicators**: Displays a `mat-spinner` when the invitation is being processed [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html` (line 203)].

---

#### portals_user_organizations

The `OSKOrganizationInvitationsComponent` renders a card-based layout containing a table of invitations and a paginator. [Confirmed] (via `` `hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html` ``)

### Rendered Elements & Components
- **`mat-card` & `mat-card-content`**: Wraps the invitations table. [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|mat-card|#1` ``)
- **`table`**: Displays the list of invitations bound to `dataSource`. [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|dataSource|#1` ``)
- **`mat-paginator`**: Handles table pagination with inputs `pageSize` and `pageSizeOptions`. [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|pageSize|#1` ``)
- **`mat-spinner`**: Displays loading progress. [Confirmed] (via `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|mat-spinner|#1` ``)
- **`mat-icon`**: Renders status or action icons with color bindings `color-success` and `color-danger`. [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|color-success|#1` ``)

### Data & Event Bindings
- **Action Buttons**:
  - Accept Button: Triggers `acceptInvitation(id)` on `click` (line 33). [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|click|#1` ``). Its `disabled` state is bound to the `disableButtons` signal. [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|disabled|#1` ``)
  - Reject Button: Triggers `rejectInvitation(id)` on `click` (line 46). [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|click|#2` ``). Its `disabled` state is bound to the `disableButtons` signal. [Confirmed] (via `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.html|OSKOrganizationInvitationsComponent|disabled|#2` ``)

#### portals_user_organizations_pending-organizations

### `OSKUserPendingOrganizationsComponent`
Renders a list of pending organizations in a tabular format [Confirmed].
- **Template Composition**:
  - Wraps content in a `mat-card` and `mat-card-content` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html|OSKUserPendingOrganizationsComponent|mat-card|#1` ``.
  - Uses a `mat-spinner` to show loading state `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html|OSKUserPendingOrganizationsComponent|mat-spinner|#1` ``.
  - Utilizes `ng-container` elements to define table columns `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html|OSKUserPendingOrganizationsComponent|ng-container|#1` ``.
  - Integrates a `mat-paginator` for list pagination `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html|OSKUserPendingOrganizationsComponent|mat-paginator|#1` ``.
- **Bindings**:
  - Binds the table's data source to `dataSource` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html|OSKUserPendingOrganizationsComponent|dataSource|#1` ``.
  - Binds `pageSize` and `pageSizeOptions` on the `mat-paginator` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html|OSKUserPendingOrganizationsComponent|pageSize|#1` ``.
  - Applies conditional styling on status spans using `ngClass` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.html|OSKUserPendingOrganizationsComponent|ngClass|#1` ``.

### `OSKAddOrganizationComponent`
Renders a reactive form for submitting a new organization request [Confirmed].
- **Template Composition**:
  - Wraps the form in a `mat-card` and `mat-card-content` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|mat-card|#1` ``.
  - Uses multiple `mat-form-field` elements containing `mat-label` and `mat-error` components for form validation feedback `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|mat-form-field|#1` ``.
  - Employs a `mat-select` dropdown with `mat-option` elements for selecting a country `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|mat-select|#1` ``.
  - Displays a `mat-spinner` during the submission process `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|mat-spinner|#1` ``.
- **Bindings**:
  - Binds the form element to a `formGroup` and listens to the `submit` event `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|formGroup|#1` ``.
  - Binds individual input elements to their respective form controls using `formControlName` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|formControlName|#1` ``.
  - Binds the `mat-select` country dropdown using `ngModel`, `ngModelChange`, `ngModelOptions`, and `valueChange` `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|ngModel|#1` ``.
  - Binds the submit button's `disabled` state `` `angular_template_binding|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.html|OSKAddOrganizationComponent|disabled|#2` ``.

---

### 6. API Contracts & Routes

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

### 7. State Ownership

**Ownership conclusion:**

The `features` module manages local reactive state entirely in memory using Angular Signals, with no shared global state store within the module itself. [Confirmed] State is highly encapsulated within specific services and components to maintain a clean separation of concerns. [Confirmed]

**Cross-Capability State Patterns**:
- **Shared Authentication Context**: `OSKAuthService` (defined in the `authentication` submodule) acts as the single source of truth for authentication status (`isLoading`) and user context. [Confirmed] It is consumed internally by the `portals` submodule and externally by the `components` module to coordinate login states and header displays. [Confirmed]
- **High-Coupling Service Coordination**: `OSKOnboardingCardsService` (defined in `portals_organization_onboarding-cards`) is a highly coupled service. [Confirmed] It is called by three distinct sibling submodules (`portals_organization_entities_entity_properties_inhabitants`, `portals_organization_entities_entity_properties_users`, and `portals_organization_entities_entity_suppliers`) to coordinate onboarding card operations across different administrative workflows. [Confirmed]
- **Property State Coordination**: `OSKOrganizationPropertyService` (defined in `portals_organization_entities_entity_properties`) coordinates property-level state and is consumed by both the navigation shell (`portals`) and the entity-level dashboard (`portals_organization_entities_entity`). [Confirmed]
- **Localized Component State**: All other submodules manage highly localized component-level signals (such as loading flags, form saving states, and local data arrays) without leaking reactive state across capability boundaries. [Confirmed]

**Per-capability evidence:**

#### authentication

- **OSKSignInComponent.signInMethod**: A signal holding the currently selected sign-in method (type: `OSKSignInMethod | null`). [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts|OSKSignInComponent|signInMethod` ``
- **OSKSignInWithEmailLinkComponent.currentStep**: A signal tracking the current step of the email link sign-in flow (type: `OSKEmailLinkSignInSteps`). [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-link/sign-in-with-email-link.component.ts|OSKSignInWithEmailLinkComponent|currentStep` ``
- **OSKSignUpWithEmailLinkComponent.currentStep**: A signal tracking the current step of the email link sign-up flow (type: `OSKEmailLinkSignUpSteps`). [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-up-with-email-link/sign-up-with-email-link.component.ts|OSKSignUpWithEmailLinkComponent|currentStep` ``
- **OSKAuthService.isLoading**: A signal indicating whether an authentication operation is in progress (type: `boolean`). [Confirmed] `` `angular_signal|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|OSKAuthService|isLoading` ``

---

#### home

No local reactive state (such as Angular Signals) is evidenced within this capability [Confirmed].

---

#### portals

The capability manages local reactive state using Angular Signals:

### `OSKSidemenuService`
- **`_sidemenu`** (Private, Writable Signal): Holds the current menu stack and active index of type `OSKCurrentSidemenus` `` `angular_signal|features|hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts|OSKSidemenuService|_sidemenu` ``.
- **`sidemenu`** (Public, Computed Signal): Exposes the read-only state of the active sidemenu structure `` `angular_signal|features|hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts|OSKSidemenuService|sidemenu` ``.

### `OSKSidemenuComponent`
- **`currentProperty`** (Writable Signal): Holds the currently active property object or `null` `` `angular_signal|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|OSKSidemenuComponent|currentProperty` ``.
- **`entityProperties`** (Writable Signal): Holds an array of properties associated with the active entity, or `undefined` `` `angular_signal|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|OSKSidemenuComponent|entityProperties` ``.

### `OSKConfirmDialogComponent`
- **`confirming`** (Writable Signal): Tracks whether the dialog is currently executing its asynchronous confirmation action `` `angular_signal|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.ts|OSKConfirmDialogComponent|confirming` ``.

---

#### portals_organization

- No Angular Signals (`angular_signal` facts) or local reactive state properties are evidenced within this capability. (Confirmed)

---

#### portals_organization_entities

The `OSKEntitiesDashboardComponent` manages local reactive state using Angular Signals [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts` ``):
- **`entities`**: Holds an array of `OSKSubEntity` objects representing the filtered list of sub-entities [Confirmed] (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|entities` ``).
- **`loading`**: Boolean signal indicating if data is currently being fetched [Confirmed] (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|loading` ``).
- **`showCreateEntityForm`**: Boolean signal controlling the visibility of the entity creation form [Confirmed] (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|showCreateEntityForm` ``).
- **`creatingEntity`**: Boolean signal indicating if an entity creation request is in progress [Confirmed] (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|creatingEntity` ``).
- **`updatingEntity`**: Boolean signal indicating if an entity update request is in progress [Confirmed] (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|updatingEntity` ``).
- **`editingEntityId`**: Signal holding the string ID of the entity currently being edited, or `null` [Confirmed] (`` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|OSKEntitiesDashboardComponent|editingEntityId` ``).

---

#### portals_organization_entities_entity

The capability manages local reactive state using Angular Signals within `OSKEntityDashboardComponent`:
- `entityDashboardStatics`: A writable signal holding the raw statistics data retrieved from the backend. (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent|entityDashboardStatics` ``)
- `properties`: A writable signal holding the list of properties associated with the entity. (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent|properties` ``)
- `stats`: A computed signal that derives and formats the statistics (devices, residents, buildings, admins) for display cards, defaulting values to `0` if `entityDashboardStatics` is undefined. (Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts|OSKEntityDashboardComponent|stats` ``)

#### portals_organization_entities_entity_message-center

This capability manages the following local reactive states using Angular Signals:

- **`OSKMessageCenterDetailsComponent.communication`**: Holds the currently loaded communication details.
  - *Type*: `OSKIntercomCommunication | null` (plain signal, default: `null`). **(Confirmed)** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-details/message-center-details.component.ts|OSKMessageCenterDetailsComponent|communication` ``
- **`OSKMessageCenterDetailsComponent.isLoading`**: Tracks the loading state of communication details.
  - *Type*: `boolean` (plain signal, default: `true`). **(Confirmed)** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-details/message-center-details.component.ts|OSKMessageCenterDetailsComponent|isLoading` ``
- **`OSKMessageCenterListComponent.isLoading`**: Tracks the loading state of the communications list.
  - *Type*: `boolean` (plain signal, default: `true`). **(Confirmed)** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|OSKMessageCenterListComponent|isLoading` ``
- **`OSKReplaceCommunicationConfirmDialogComponent.confirming`**: Tracks whether the conflict replacement confirmation is in progress.
  - *Type*: `boolean` (plain signal, default: `false`). **(Confirmed)** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/replace-communication-confirm-dialog/replace-communication-confirm-dialog.component.ts|OSKReplaceCommunicationConfirmDialogComponent|confirming` ``

---

#### portals_organization_entities_entity_properties

### `OSKOrganizationPropertiesCreateComponent` [Confirmed]
- **`buildings`**: Local signal holding the list of buildings available for assignment. (line 88)
- **`countries`**: Local signal holding the list of countries. (line 95)
- **`entities`**: Local signal holding the list of sub-entities. (line 92)
- **`saving`**: Local signal tracking form submission state (boolean). (line 91)
- **`selectedCountry`**: Local signal tracking the currently selected country. (line 96)

### `OSKOrganizationPropertiesEditComponent` [Confirmed]
- **`buildings`**: Local signal holding the list of buildings. (line 93)
- **`countries`**: Local signal holding the list of countries. (line 91)
- **`entities`**: Local signal holding the list of sub-entities. (line 95)
- **`loading`**: Local signal tracking data loading state (boolean). (line 89)
- **`saving`**: Local signal tracking form submission state (boolean). (line 88)
- **`selectedCountry`**: Local signal tracking the currently selected country. (line 92)

### `OSKOrganizationPropertiesListComponent` [Confirmed]
- **`properties`**: Local signal holding the list of properties. (line 73)

### `OSKPropertyDashboardComponent` [Confirmed]
- **`buildings`**: Local signal holding the list of buildings. (line 96)
- **`currentProperty`**: Local signal holding the current property details. (line 104)
- **`onboardingDocuemnts`**: Local signal holding onboarding documents. (line 92)
- **`pmpResidentDocuemnts`**: Local signal holding resident documents. (line 99)
- **`propertyDashboardStatics`**: Local signal holding dashboard statistics. (line 101)
- **`users`**: Local signal holding the list of users. (line 112)

---

#### portals_organization_entities_entity_properties_buildings

This capability manages local reactive state using Angular Signals:

- **`countries`**: Holds the list of available countries. (Type: `WritableSignal<any[]>`, default: `[]`).
  - `OSKAddOrganizationBuildingDoorComponent.countries` (Line 95).
  - `OSKAddOrganizationBuildingUnitComponent.countries` (Line 97).
  - `OSKAddOrganizationBuildingComponent.countries` (Line 97).
- **`selectedCountry`**: Holds the currently selected country object. (Type: `WritableSignal<any | undefined>`, default: `undefined`).
  - `OSKAddOrganizationBuildingDoorComponent.selectedCountry` (Line 96).
  - `OSKAddOrganizationBuildingUnitComponent.selectedCountry` (Line 98).
  - `OSKAddOrganizationBuildingComponent.selectedCountry` (Line 98).
- **`loading`**: Boolean flag indicating if data is being fetched. (Type: `WritableSignal<boolean>`, default: `false`).
  - `OSKAddOrganizationBuildingDoorComponent.loading` (Line 98).
  - `OSKAddOrganizationBuildingUnitComponent.loading` (Line 100).
  - `OSKAddOrganizationBuildingComponent.loading` (Line 100).
- **`saving`**: Boolean flag indicating if form submission is in progress. (Type: `WritableSignal<boolean>`, default: `false`).
  - `OSKAddOrganizationBuildingDoorComponent.saving` (Line 97).
  - `OSKAddOrganizationBuildingUnitComponent.saving` (Line 99).
  - `OSKAddOrganizationBuildingComponent.saving` (Line 99).
- **`building`**: Holds details of the currently viewed building. (Type: `WritableSignal<OSKBuildingDetails | undefined>`, default: `undefined`).
  - `OSKOrganizationBuildingDetailsComponent.building` (Line 55).
- **`doors`**: Holds the list of doors for the building. (Type: `WritableSignal<any[] | undefined>`, default: `undefined`).
  - `OSKOrganizationBuildingDoorsListComponent.doors` (Line 74).
- **`units`**: Holds the list of units for the building. (Type: `WritableSignal<any[] | undefined>`, default: `undefined`).
  - `OSKOrganizationBuildingUnitsListComponent.units` (Line 73).
- **`buildings`**: Holds the list of buildings for the property. (Type: `WritableSignal<any[] | undefined>`, default: `undefined`).
  - `OSKOrganizationBuildingsListComponent.buildings` (Line 76).

---

#### portals_organization_entities_entity_properties_general-rules

- **Local Reactive State (Signals)**:
  - `buildings`: Holds the list of buildings retrieved for the current property `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|buildings` ``.
  - `selectedBuilding`: Holds the currently selected building object `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|selectedBuilding` ``.
  - `selectedBuildingSettings`: Holds the fetched `OSKBuildingSettings` for the selected building `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|selectedBuildingSettings` ``.
  - `tempBuildingSettings`: Holds a mutable copy of the building settings for editing `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|tempBuildingSettings` ``.
  - `isLoadingSettings`: Boolean flag indicating if settings are currently being fetched `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isLoadingSettings` ``.
  - `loadingUpdate`: Boolean flag indicating if settings are currently being saved `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|loadingUpdate` ``.
  - `isAllowResidentsToSendInvitationsDisabled`: Computed signal checking if `allowResidentsToSendInvitations` can be changed `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowResidentsToSendInvitationsDisabled` ``.
  - `isAllowQuickcodesDisabled`: Computed signal checking if `allowQuickcodes` can be changed `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowQuickcodesDisabled` ``.
  - `isAllowResidentAdditionDisabled`: Computed signal checking if `allowResidentAddition` can be changed `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowResidentAdditionDisabled` ``.
  - `isAllowPermanentGuestsInvitationsDisabled`: Computed signal checking if `allowPermanentGuestsInvitations` can be changed `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowPermanentGuestsInvitationsDisabled` ``.
  - `isAllowIntercomDisplayNameDisabled`: Computed signal checking if `allowIntercomDisplayName` can be changed `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowIntercomDisplayNameDisabled` ``.
  - `isAllowCoResidentAdditionDisabled`: Computed signal checking if `allowCoResidentAddition` can be changed `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowCoResidentAdditionDisabled` ``.

#### portals_organization_entities_entity_properties_inhabitants

### Reactive UI State (Signals)
- **`OSKOrganizationInhabitantDetailsComponent.pmpResidentDocuemnt`** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|pmpResidentDocuemnt` ``
  - **Type**: `WritableSignal<OSKPmpResidentDocument | undefined>`
  - **Description**: Holds the reactive state of the currently loaded inhabitant's detailed document.
- **`OSKOrganizationInhabitantsListComponent.pmpResidentDocuemnts`** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent|pmpResidentDocuemnts` ``
  - **Type**: `WritableSignal<OSKDocumentListResponse | undefined>`
  - **Description**: Holds the reactive state of the list of inhabitant documents fetched for the active property.

---

#### portals_organization_entities_entity_properties_users

### `OSKInviteOrganizationUserComponent`
- **`adminRole`**: `WritableSignal<OSKRole | null>` - Holds the administrative role definition [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|adminRole` ``].
- **`allUserCompositeRoles`**: `WritableSignal<OSKCompositeRole[]>` - Holds all retrieved composite roles [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|allUserCompositeRoles` ``].
- **`allUserRoles`**: `WritableSignal<OSKRoleDocument[]>` - Holds all role documents [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|allUserRoles` ``].
- **`lang`**: `Signal<string>` - Computed language code derived from the current user's settings [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|lang` ``].
- **`otherRoles`**: `WritableSignal<OSKCompositeRole[]>` - Holds non-administrative roles available for selection [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|otherRoles` ``].
- **`rolesLoading`**: `WritableSignal<boolean>` - Indicates if roles are currently loading [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|rolesLoading` ``].
- **`saving`**: `WritableSignal<boolean>` - Indicates if the invitation is being processed [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|saving` ``].
- **`userRoles`**: `WritableSignal<string[]>` - Holds currently selected roles [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|OSKInviteOrganizationUserComponent|userRoles` ``].

### `OSKOrganizationUserDetailsComponent`
- **`adminRole`**: `Signal<OSKCompositeRole | undefined>` - Computed administrative role [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|adminRole` ``].
- **`availableRoles`**: `WritableSignal<OSKCompositeRole[]>` - Holds all available roles [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|availableRoles` ``].
- **`backLink`**: `Signal<string[]>` - Computed router link path for navigating back [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|backLink` ``].
- **`lang`**: `Signal<string>` - Computed language code derived from the current user's settings [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|lang` ``].
- **`loading`**: `WritableSignal<boolean>` - Indicates if user details are loading [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|loading` ``].
- **`otherRoles`**: `Signal<OSKCompositeRole[]>` - Computed list of non-administrative roles [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|otherRoles` ``].
- **`saving`**: `WritableSignal<boolean>` - Indicates if changes are being saved [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent|saving` ``].

### `OSKOrganizationUsersListComponent`
- **`saving`**: `WritableSignal<boolean>` - Indicates if a delete/cancel action is in progress [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent|saving` ``].
- **`users`**: `WritableSignal<OSKOrganizationUserListData[] | undefined>` - Holds the list of users and invitees [Confirmed, `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|OSKOrganizationUsersListComponent|users` ``].

---

#### portals_organization_entities_entity_suppliers

The capability manages local reactive state using Angular Signals:

### `OSKSuppliersDetailsComponent` State

- **`supplier`**: Holds the active supplier's profile data. **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|supplier` ``.
- **`buildings`**: Holds the list of buildings associated with the entity. **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|buildings` ``.
- **`revealedPincodes`**: A `Set` of pincode IDs currently unmasked in the UI. **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|revealedPincodes` ``.
- **`selectedTabIndex`**: Tracks the active tab index (0: Details, 1: Staff, 2: Access Rights). **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|selectedTabIndex` ``.
- **`staffSearchTerm`**: Holds the current search query for filtering staff members. **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|staffSearchTerm` ``.
- **`hasAccessChanges`**: Boolean flag indicating if there are unsaved access changes. **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|hasAccessChanges` ``.
- **`loading`**: Boolean flag for overall component loading state. **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|loading` ``.
- **`savingDetails` / `savingStaff` / `savingAccess`**: Boolean flags tracking saving operations for different tabs. **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|OSKSuppliersDetailsComponent|savingDetails` ``.

### `OSKSuppliersListComponent` State

- **`suppliers`**: Holds the list of suppliers retrieved for the organization. **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|OSKSuppliersListComponent|suppliers` ``.
- **`staffLoading`**: Tracks loading states for staff members. **Confirmed** `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|OSKSuppliersListComponent|staffLoading` ``.

---

#### portals_organization_onboarding-cards

The capability manages local reactive state using Angular Signals within its components:

- **`OSKOnboardingCardsListComponent`**
  - `onboardingDocuemnts`: A writable signal holding an array of `OSKInhabitantOnboardingDocument` or `undefined` `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent|onboardingDocuemnts` ``.
  - `onboardingActivationCode`: A writable signal holding the current activation code string being verified, or `undefined` `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|OSKOnboardingCardsListComponent|onboardingActivationCode` ``.

---

#### portals_user

- **Local Reactive State**: No explicit `angular_signal` facts are present in this capability's evidence pack [Confirmed].
- **External Signal Consumption**: The capability reactively consumes an external signal `currentUser` (injected via `OSKCurrentUserToken`) inside `OSKAccountComponent` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|inject|anon|OSKCurrentUserToken|#1` ``.
- **Reactive Effects**: An Angular `effect` is used to reactively patch the local `accountForm` whenever the `currentUser` signal emits a new value [Confirmed] (evidenced by `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|effect|anon|() => {       const currentUser = this.currentUser();       this.accountForm.controls.email.disable();       this.accountForm.patchValue({         firstName: currentUser.oskUser?.publicProfile.firstName || '',         lastName: currentUser.oskUser?.publicProfile.lastName || '',         phoneNumber: currentUser.oskUser?.phoneNumber?.localPhoneNumber || ''       });       this.accountForm.get('email')?.setValue(currentUser.oskUser?.email || '');     }|#1` ``).

---

#### portals_user_invitations

The local reactive state is managed within `OSKSendUserInvitationComponent` using Angular Signals [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts` (lines 69-71)]:

- **`buildingsWithUnits`**: A plain signal holding the list of buildings and their nested units retrieved from the backend [Confirmed, `angular_signal|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|buildingsWithUnits`].
  - *Type*: `OSKUserBuildingWithUnits[]`
- **`unitsToChoose`**: A plain signal holding the filtered list of units available for selection based on the currently selected building [Confirmed, `angular_signal|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|unitsToChoose`].
  - *Type*: `OSKUserBuildingWithUnitsUnit[]`
- **`buildingsToChoose`**: A plain signal holding a unique set of building IDs that the user can select [Confirmed, `angular_signal|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|OSKSendUserInvitationComponent|buildingsToChoose`].
  - *Type*: `Set<string>`

---

#### portals_user_organizations

The local reactive state is managed using Angular Signals inside `OSKOrganizationInvitationsComponent`: [Confirmed]
- **`disableButtons`**: A plain signal of type `boolean` (initialized to `false`), used to disable action buttons during asynchronous operations. [Confirmed] (via `` `angular_signal|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|OSKOrganizationInvitationsComponent|disableButtons` ``)
- **`invitations`**: A plain signal of type `OSKUserOrganizationinvitation[] | undefined` (initialized to `undefined`), holding the list of active invitations. [Confirmed] (via `` `angular_signal|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|OSKOrganizationInvitationsComponent|invitations` ``)

#### portals_user_organizations_pending-organizations

### Local Reactive State
- **`OSKUserPendingOrganizationsComponent.pendingOrganizations`**: An Angular `signal` that holds the list of pending organizations retrieved for the current user `` `angular_signal|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts|OSKUserPendingOrganizationsComponent|pendingOrganizations` ``.

---

### 8. Outbound Coupling

#### authentication

### Import-based Coupling
- **core module**:
  - Imports `@oskey/core` [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-and-password/sign-in-with-email-and-password.component.ts|@oskey/core|#1` ``
  - Imports `@oskey/core/types` [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts|@oskey/core/types|#1` ``
  - Imports `@oskey/translate` [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts|@oskey/translate|#1` ``
  - Imports `@oskey/firebase` [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/sign-in-with-email-and-password/sign-in-with-email-and-password.component.ts|@oskey/firebase|#1` ``
- **features module**:
  - Imports `organization-user.type` from `portals_organization_entities_entity_properties_users` submodule. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|../../portals/organization/features/entities/features/entity/features/properties/features/users/types/organization-user.type|#1` ``

### Template-composition Coupling
- **OSKSignInComponent** composes the following internal submodule components:
  - `OSKSelectSignInMethodComponent` [Confirmed] `` `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` (line 24) ``
  - `OSKSignInWithEmailAndPasswordComponent` [Confirmed] `` `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` (line 24) ``
  - `OSKSignUpWithEmailLinkComponent` [Confirmed] `` `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` (line 24) ``
  - `OSKSignInWithEmailLinkComponent` [Confirmed] `` `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` (line 24) ``
  - `OSKSignInWithAuth0Component` [Confirmed] `` `hosting/web-app/src/app/features/authentication/features/sign-in/sign-in.component.ts` (line 24) ``

---

#### home

This capability couples to other modules and submodules through two distinct mechanisms:

#### Import-Based Coupling
- **`core` module (`translate` submodule)**: Imports `@oskey/translate` to resolve the translation pipe `OSKTranslatePipe` [Confirmed] (cite `` `imports_dependency|features|hosting/web-app/src/app/features/home/home.component.ts|@oskey/translate|#1` ``).
- **`components` module (`header` submodule)**: Imports `src/app/components/header/header.component` to resolve `OSKHeaderComponent` [Confirmed] (cite `` `imports_dependency|features|hosting/web-app/src/app/features/home/home.component.ts|src/app/components/header/header.component|#1` ``).

#### Template-Composition Coupling
- **`components` module (`header` submodule)**: Composes the `<osk-header>` element inside the template of `OSKHomeComponent` [Confirmed] (cite `` `angular_template_composition|features|hosting/web-app/src/app/features/home/home.component.html|OSKHomeComponent|osk-header|#1` ``).

---

#### portals

### Import-Based Coupling

- **`core` Module**:
  - Imports `OSKCurrentUserToken` and core types from `@oskey/core` and `@oskey/core/types` to access user account details and default sidemenu configurations `` `imports_dependency|features|hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts|@oskey/core|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/sidemenu/services/sidemenu/sidemenu.service.ts|@oskey/core/types|#1` ``.
  - Imports `OSKTranslatePipe` from `@oskey/translate` for menu localization `` `imports_dependency|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|@oskey/translate|#1` ``.
- **`features/authentication` Capability**:
  - Imports `OSKAuthService` to handle user sign-out actions from the sidemenu `` `imports_dependency|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|src/app/features/authentication/services/auth.service|#1` ``.
- **`features/portals_organization_entities_entity_properties` Capability**:
  - Imports `OSKOrganizationPropertyService` and `OrganizationProperty` types to fetch and display properties associated with the active organization `` `imports_dependency|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|../organization/features/entities/features/entity/features/properties/services/organization-property-service.service|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|../organization/features/entities/features/entity/features/properties/types/organization-property.typs|#1` ``.

### Template-Composition Coupling

- **`OSKPortalComponent`** embeds **`OSKSidemenuComponent`** within its template `` `imports_dependency|features|hosting/web-app/src/app/features/portals/portal.component.ts|src/app/features/portals/sidemenu/sidemenu.component|#1` ``.

---

#### portals_organization

### Import-Based Coupling
- **`core` module (`translate` submodule)**: Imported via `@oskey/translate` to provide translation capabilities to `OSKNotificationsComponent` and `OSKSettingsComponent` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|@oskey/translate|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.ts|@oskey/translate|#1` ``. (Confirmed)
- **External Libraries**:
  - `@angular/core` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|@angular/core|#1` ``
  - `@angular/material/card` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|@angular/material/card|#1` ``
  - `@angular/router` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|@angular/router|#1` ``

### Template-Composition Coupling
- **`@angular/material/card`**: Both `OSKNotificationsComponent` and `OSKSettingsComponent` compose `mat-card` and `mat-card-content` elements within their templates `` `hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.html` (lines 16-20) ``, `` `hosting/web-app/src/app/features/portals/organization/features/settings/settings.component.html` (lines 16-20) ``. (Confirmed)

---

#### portals_organization_entities

### Import-Based Coupling
- **`core` Module**:
  - Imports token and type definitions from `@oskey/core` and `@oskey/core/types` [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@oskey/core|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@oskey/core/types|#1` ``).
  - Imports translation utilities from `@oskey/translate` [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@oskey/translate|#1` ``).
  - Imports Firebase HTTPS service from `@oskey/firebase` [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/services/organization-entities.service.ts|@oskey/firebase|#1` ``).
- **`features` Module (`portals` submodule)**:
  - Imports `OSKConfirmDialogComponent` from the shared portals components directory [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component|#1` ``).

### Template-Composition Coupling
- **`OSKConfirmDialogComponent`**: Composed dynamically via `MatDialog.open` to handle entity deletion confirmations [Confirmed] (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|this.dialog.open|openDeleteConfirmDialog|OSKConfirmDialogComponent,...|#1` ``).

---

#### portals_organization_entities_entity

This capability couples to other modules and submodules through two distinct mechanisms:

### Import-Based Coupling
- **Core Module**:
  - Imports `user-role.guard` for route protection. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts` (line 17) ``)
  - Imports `@oskey/core` and `@oskey/firebase` for base services and Firebase utilities. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts` (lines 2-3) ``)
  - Imports `@oskey/translate` for translation pipes. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts` (line 30) ``)
- **Submodule `portals_organization_entities_entity_properties`**:
  - Imports `OSKOrganizationPropertyService` and property types. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts` (lines 31, 33) ``)
- **Submodule `portals_organization_entities_entity_properties_users`**:
  - Imports `OSKOrganizationUsersListService` to manage user listings. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts` (line 40) ``)

### Template-Composition Coupling
- **Angular Material**: Composes UI elements using `@angular/material/card`, `@angular/material/paginator`, `@angular/material/progress-spinner`, `@angular/material/table`, `@angular/material/button`, and `@angular/material/icon`. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts` (lines 25-27, 38-39, 42) ``)

#### portals_organization_entities_entity_message-center

### Import-Based Coupling
This capability imports dependencies from other submodules and modules:
- **`portals_organization_entities_entity_suppliers`**: Imports `OSKCustomDateAdapter` from `custom-date-adapter`. **(Confirmed)** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|../../../suppliers/features/suppliers-staff-access/custom-date-adapter|#1` ``
- **`portals_organization_entities_entity_properties`**: Imports types from `organization-property.typs`. **(Confirmed)** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|../../properties/types/organization-property.typs|#1` ``
- **`authentication`**: Imports `OSKAuthService` from `auth.service`. **(Confirmed)** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|src/app/features/authentication/services/auth.service|#1` ``
- **`portals`**: Imports `OSKConfirmDialogComponent` from `confirm-dialog.component`. **(Confirmed)** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts|src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component|#1` ``
- **`portals_organization`**: Imports organization-related types. **(Confirmed)** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|src/app/features/portals/organization/types/with-organization-id.type|#1` ``
- **`core`**: Imports core types, translation services, and Firebase services. **(Confirmed)** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|@oskey/core/types|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts|@oskey/translate|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/services/message-center-service.service.ts|@oskey/firebase|#1` ``

### Template-Composition Coupling
- **`OSKMessageCenterListComponent`** opens **`OSKConfirmDialogComponent`** (from the `portals` shared components) dynamically to confirm communication deletion. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts` (lines 414-415)

---

#### portals_organization_entities_entity_properties

### Import-based Coupling

- **`portals_organization_entities`**: Imports `OSKOrganizationEntitiesService` and `OSKEntityType` / `OSKOrganizationEntity` types. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts` `` lines 44-45)
- **`portals_organization_entities_entity_properties_buildings`**: Imports `OSKAddOrganizationBuildingService` and `OSKOrganizationBuildingsListService`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts` `` lines 42-43)
- **`portals_organization_entities_entity_properties_inhabitants`**: Imports `OSKOrganizationInhabitantService` and `OSKInhabitantDocument` types. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts` `` lines 40-41)
- **`portals_organization_entities_entity_properties_users`**: Imports `OSKOrganizationUsersListService` and `OSKOrganizationUserListData` types. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts` `` lines 49-50)
- **`portals_organization_onboarding-cards`**: Imports `OSKOnboardingDocument` type. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts` `` line 43)
- **`portals`**: Imports `OSKConfirmDialogComponent`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts` `` line 34)
- **`core`**: Imports `OSKCurrentUserToken`, `OSKTranslateService`, `OSKTranslatePipe`, `OSKBuilding` types, and `UserRoleGuard`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts` `` lines 33, 35, 38)
- **`core/firebase`**: Imports `OSKFirebaseHttpsService`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/services/organization-property-service.service.ts` `` line 16)

### Template-composition Coupling

- **`OSKConfirmDialogComponent`**: Dynamically instantiated via `MatDialog` in `OSKOrganizationPropertiesListComponent`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts` `` line 130)

---

#### portals_organization_entities_entity_properties_buildings

### Import-Based Coupling

This capability imports dependencies from other modules and submodules:

- **`core` Module**:
  - `OSKFirebaseHttpsService` from `@oskey/firebase` (File: `add-organization-building-door.service.ts`, line 17).
  - `OSKTranslateService` and `OSKTranslatePipe` from `@oskey/translate` (File: `add-organization-building-door.component.ts`, line 41).
  - `AdminGuard` from `src/app/core/guards/admin.guard` (File: `organization-buildings.routes.ts`, line 15).
  - Core types from `@oskey/core/types` and `src/app/core/types/building/building.type` (File: `add-organization-building-door.component.ts` line 42, `add-organization-building.service.ts` line 23).
- **`portals_organization` Submodule**:
  - Imports `WithOrganizationId` type from `src/app/features/portals/organization/types/with-organization-id.type` (File: `add-organization-building-door.service.ts`, line 20).

### Template-Composition Coupling

The components compose the following external elements in their templates:
- **Angular Material**: `mat-card`, `mat-card-header`, `mat-card-content`, `mat-card-footer`, `mat-card-title`, `mat-form-field`, `mat-label`, `mat-error`, `mat-select`, `mat-option`, `mat-spinner`, `mat-icon`, `mat-table`, `mat-paginator`.
- **Angular Router**: `routerLink` directive.

---

#### portals_organization_entities_entity_properties_general-rules

- **Import-based Coupling**:
  - **Submodule `portals_organization_entities_entity_properties_buildings`**: Imports `OSKOrganizationBuildingsListService` to retrieve the list of buildings for a property `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|../../../buildings/organization-buildings-list/services/organization-buildings-list/organization-buildings-list.service|#1` ``.
  - **Submodule `portals`**: Imports `OSKConfirmDialogComponent` to show a confirmation dialog before saving settings `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component|#1` ``.
  - **Submodule `portals_organization_entities_entity_properties_inhabitants`**: Imports `inhabitants/types/inhabitant-document.type` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/types/organization-general-rules.type.ts|../../inhabitants/types/inhabitant-document.type|#1` ``.
  - **Module `core`**:
    - Imports `@oskey/core/types` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|@oskey/core/types|#1` ``.
    - Imports `OSKCurrentUserToken` from `@oskey/core` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|@oskey/core|#1` ``.
    - Imports `OSKTranslatePipe` and `OSKTranslateService` from `@oskey/translate` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|@oskey/translate|#1` ``.
    - Imports `OSKFirebaseHttpsService` from `@oskey/firebase` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|@oskey/firebase|#1` ``.
- **Template-composition Coupling**:
  - None evidenced.

#### portals_organization_entities_entity_properties_inhabitants

### Import-Based Coupling
- **`portals_organization_onboarding-cards`**
  - Imports `OSKCreateOnboardingCardsComponent` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|../../../../../../../../../onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component|#1` ``.
  - Imports `OSKOnboardingCardsService` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|../../../../../../../../../onboarding-cards/services/onboarding-cards/onboarding-cards.service|#1` ``.
  - Imports types `onboarding-building.type` and `onboarding-card.type` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|../../../../../../../../../onboarding-cards/types/onboarding-building.type|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|../../../../../../../../../onboarding-cards/types/onboarding-card.type|#1` ``.
- **`portals_organization_entities_entity_suppliers`**
  - Imports `OSKCustomDateAdapter` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|../../../../../suppliers/features/suppliers-staff-access/custom-date-adapter|#1` ``.
- **`portals_organization_entities_entity_properties_buildings`**
  - Imports `OSKOrganizationBuildingsListService` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|../../../buildings/organization-buildings-list/services/organization-buildings-list/organization-buildings-list.service|#1` ``.
- **`portals`**
  - Imports `OSKConfirmDialogComponent` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component|#1` ``.
- **`core`**
  - Imports `@oskey/core/types` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|@oskey/core/types|#1` ``.
  - Imports `@oskey/firebase` (specifically `OSKFirebaseHttpsService`) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|@oskey/firebase|#1` ``.
  - Imports `@oskey/translate` (specifically `OSKTranslateService`, `OSKTranslatePipe`, `OSKBooleanPipe`) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|@oskey/translate|#1` ``.

### Template-Composition Coupling
- **`OSKCreateOrganizationInhabitantComponent`** embeds:
  - Angular Material components: `mat-checkbox`, `mat-datepicker-toggle`, `mat-datepicker`, `mat-icon`, `mat-list-option`, `mat-radio-button`, `mat-radio-group`, `mat-selection-list`, `mat-spinner`, `mat-step`, `mat-stepper` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html` ``.
- **`OSKOrganizationInhabitantDetailsComponent`** embeds:
  - Angular Material components: `mat-card`, `mat-card-content`, `mat-card-actions`, `mat-form-field`, `mat-label`, `mat-select`, `mat-option`, `mat-icon`, `mat-spinner`, `mat-tab-group`, `mat-tab` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html` ``.
- **`OSKOrganizationInhabitantsListComponent`** embeds:
  - Angular Material components: `mat-card`, `mat-card-content`, `mat-icon`, `mat-paginator`, `mat-spinner` `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html` ``.

---

#### portals_organization_entities_entity_properties_users

### Import-Based Coupling
This capability imports and depends on the following modules/submodules [Confirmed]:
- **`core`**:
  - `src/app/core/guards/user-role/user-role.guard` [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts|src/app/core/guards/user-role/user-role.guard|#1` ``]
  - `src/app/core/injection-tokens/current-user.token` [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|src/app/core/injection-tokens/current-user.token|#1` ``]
  - `@oskey/core` and `@oskey/core/types` [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|@oskey/core|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|@oskey/core/types|#1` ``]
  - `@oskey/firebase` [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|@oskey/firebase|#1` ``]
  - `@oskey/translate` [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|@oskey/translate|#1` ``]
- **`features`**:
  - `portals_organization_onboarding-cards` (`src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service`) [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service|#1` ``]
  - `portals` (`src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component`) [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component|#1` ``]
  - `portals_organization` (`src/app/features/portals/organization/types/with-organization-id.type`) [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/services/invite-organization-user/invite-organization-user.service.ts|src/app/features/portals/organization/types/with-organization-id.type|#1` ``]

### Template-Composition Coupling
- **`OSKConfirmDialogComponent`**: Composed dynamically via `MatDialog` inside `OSKOrganizationUsersListComponent` to confirm user deletion or invitation cancellation [Confirmed, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|this.dialog.open|removeUser|OSKConfirmDialogComponent,{       data: {         title: this.translate.instant(titleKey),         message: this.translate.instant(messageKey, messageParams),         confirmText: this.translate.instant('shared.delete'),         cancelText: this.translate.instant('shared.cancel'),         onConfirmAction: onConfirm       }     }|#1` ``].

---

#### portals_organization_entities_entity_suppliers

This capability couples with other submodules and core modules through imports and template composition:

### Import-Based Coupling

- **`portals_organization_onboarding-cards` Submodule**:
  - Imports `OSKOnboardingCardsService` to fetch country lists. **Confirmed** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service|#1` ``.

- **`portals_organization_entities_entity_message-center` Submodule**:
  - Imports `OSKMessageCenterServiceService` and `OSKMessageCenterCreateComponent` to fetch buildings and properties. **Confirmed** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts|../../../message-center/services/message-center-service.service|#1` ``.

- **`portals` Submodule**:
  - Imports `OSKConfirmDialogComponent` to show confirmation dialogs before deletions or tab changes. **Confirmed** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component|#1` ``.

- **`core` Module**:
  - Imports `@oskey/core/types` for shared types (e.g., `OSKPhoneNumber`). **Confirmed** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|@oskey/core/types|#1` ``.
  - Imports `@oskey/translate` for translation services and pipes (`OSKTranslatePipe`, `OSKTranslateService`). **Confirmed** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|@oskey/translate|#1` ``.
  - Imports `@oskey/firebase` for `OSKFirebaseHttpsService` to handle callable functions. **Confirmed** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/services/suppliers.service.ts|@oskey/firebase|#1` ``.

### Template-Composition Coupling

- **`OSKSuppliersListComponent`** opens **`OSKSuppliersCreationComponent`** inside a dialog. **Confirmed** `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-list/suppliers-list.component.ts|this.dialog.open|openCreateSupplierDialog|OSKSuppliersCreationComponent,...|#1` ``.
- **`OSKSuppliersDetailsComponent`** opens **`OSKSuppliersStaffAccessComponent`** inside a dialog. **Confirmed** `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|this.dialog.open|openSuppliersStaffAccessDialog|OSKSuppliersStaffAccessComponent,...|#1` ``.
- **`OSKSuppliersDetailsComponent`** and **`OSKSuppliersStaffAccessComponent`** open **`OSKConfirmDialogComponent`** for confirmation prompts. **Confirmed** `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|this.dialog.open|deleteSupplier|OSKConfirmDialogComponent,...|#1` ``.

---

#### portals_organization_onboarding-cards

### Import-Based Coupling

This capability depends on the following modules and submodules via TypeScript imports:

- **`core` Module**:
  - **`core` (Root)**: Imports `OSKErrorService` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|@oskey/core|#1` ``.
  - **`core/types`**: Imports shared types such as `OSKCountry`, `OSKPhoneNumberClass` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|@oskey/core/types|#1` ``.
  - **`core/utils`**: Imports utility classes like `OSKDateUtils` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.ts|@oskey/core/utils|#1` ``.
  - **`core/translate`**: Imports translation utilities such as `OSKTranslateService`, `OSKTranslatePipe`, and `OSKBooleanPipe` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|@oskey/translate|#1` ``.
  - **`core/firebase`**: Imports `OSKFirebaseHttpsService` and `OSKCurrentUserToken` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|@oskey/firebase|#1` ``.

### Template-Composition Coupling

- **`OSKAddOnboardingCardsComponent`** embeds `<osk-onboarding-card-form>` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/add-onboarding-cards/add-onboarding-cards.component.html|OSKAddOnboardingCardsComponent|osk-onboarding-card-form|#1` ``.
- **`OSKEditOnboardingCardComponent`** embeds `<osk-onboarding-card-form>` `` `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/edit-onboarding-card/edit-onboarding-card.component.html|OSKEditOnboardingCardComponent|osk-onboarding-card-form|#1` ``.
- **`OSKOnboardingCardsListComponent`** opens `OSKCreateOnboardingCardsComponent` dynamically via `MatDialog` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/onboarding-cards-list/onboarding-cards-list.component.ts|this.createUserDialogue.open|openCreateUser|OSKCreateOnboardingCardsComponent,{       width: '50%',       height: '75%',       panelClass: 'custom-dialog',       data: {         organizationId: this.organizationId       }     }|#1` ``.

---

#### portals_user

#### Import-based Coupling
- **`core` module**:
  - Couples to core types (e.g., `OSKCurrentUserToken`) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|@oskey/core|#1` `` and `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|@oskey/core/types|#1` ``.
  - Couples to the translation submodule (`@oskey/translate`) for localization via `OSKTranslatePipe` and `OSKTranslateService` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|@oskey/translate|#1` ``.
  - Couples to the firebase submodule (`@oskey/firebase`) for backend communication via `OSKFirebaseHttpsService` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|@oskey/firebase|#1` ``.

#### Template-composition Coupling
- No template-composition coupling to other custom components is evidenced in this capability pack (only Material components like `mat-card`, `mat-form-field`, etc. are composed) [Confirmed].

---

#### portals_user_invitations

#### Import-Based Coupling
This capability depends on the following modules and submodules:
- **`core` module**:
  - **Root / General**: Imports `OSKCurrentUserToken` and `OSKErrorService` [Confirmed, `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|@oskey/core|#1`].
  - **`core/types`**: Imports core types such as user definitions [Confirmed, `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|@oskey/core/types|#1`].
  - **`core/translate`**: Imports `OSKTranslateService` and `OSKTranslatePipe` for localization [Confirmed, `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|@oskey/translate|#1`].
  - **`core/firebase`**: Imports `OSKFirebaseHttpsService` to handle backend communication [Confirmed, `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/services/send-user-invitation/send-user-invitation.service.ts|@oskey/firebase|#1`].

#### Template-Composition Coupling
- No custom components from other submodules or modules are composed in the template. The template relies entirely on native HTML, Angular Material components, and the third-party `ngx-mat-timepicker` [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.html`].

---

#### portals_user_organizations

### Import-Based Coupling
This capability depends on the following modules and submodules:
- **`core` module**:
  - Imports `OSKErrorService` from `@oskey/core` (resolved to `hosting/web-app/src/app/core/error-handler/error.service.ts`). [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|@oskey/core|#1` ``)
  - Imports `OSKFirebaseHttpsService` from `@oskey/firebase` (resolved to `hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts`). [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/services/organization-invitations/organization-invitations.service.ts|@oskey/firebase|#1` ``)
  - Imports `OSKTranslateService` from `@oskey/translate` (resolved to `hosting/web-app/src/app/core/translate/services/translate.service.ts`). [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|@oskey/translate|#1` ``)
  - Imports core types from `@oskey/core/types`. [Confirmed] (via `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|@oskey/core/types|#1` ``)

### Template-Composition Coupling
- **`OSKTranslatePipe`**: Used in the component template for localization. [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|Component|anon|{   standalone: true,   imports: [     MatTableModule,     MatPaginatorModule,     OSKTranslatePipe,     MatProgressSpinnerModule,     MatButtonModule,     MatCardModule,     MatIconModule,     MatTooltipModule   ],   selector: 'osk-organization-invitations',   templateUrl: './organization-invitations.component.html',   styleUrl: './organization-invitations.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)

#### portals_user_organizations_pending-organizations

### Import-Based Coupling
This capability depends on other modules/submodules via the following TypeScript imports [Confirmed]:
- **`core` Module**:
  - Imports `OSKCurrentUserToken` from `@oskey/core` to access the current user's session context `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|@oskey/core|#1` ``.
  - Imports `OSKFirebaseHttpsService` from `@oskey/firebase` to make backend callable function requests `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/services/add-organization/add-organization.service.ts|@oskey/firebase|#1` ``.
  - Imports translation utilities (`OSKTranslateService`, `OSKTranslatePipe`) from `@oskey/translate` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|@oskey/translate|#1` ``.
  - Imports types (such as `OSKPendingOrganization`) from `@oskey/core/types` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|@oskey/core/types|#1` ``.

### Template-Composition Coupling
No template-composition coupling to custom components from other capabilities or modules is evidenced. All template compositions are restricted to standard Angular Material components and native HTML elements [Confirmed].

---

### 9. Internal Structure

The internal structure of the `features` module is defined by 13 submodules with confirmed AST-derived coupling relationships:

- **authentication**:
  - **Outbound Coupling**: `portals_organization_entities_entity_properties_users` (importing invitation types). [Confirmed]
  - **Inbound Coupling**: `portals` (consuming `OSKAuthService`), `portals_organization_entities_entity_message-center` (consuming `OSKAuthService`). [Confirmed]
- **portals**:
  - **Outbound Coupling**: `authentication` (consuming `OSKAuthService`), `portals_organization_entities_entity_properties` (consuming property services). [Confirmed]
  - **Inbound Coupling**: `portals_organization_entities`, `portals_organization_entities_entity_message-center`, `portals_organization_entities_entity_properties`, `portals_organization_entities_entity_properties_general-rules`, `portals_organization_entities_entity_properties_inhabitants`, `portals_organization_entities_entity_properties_users`, `portals_organization_entities_entity_suppliers` (all consuming the shared `OSKConfirmDialogComponent`). [Confirmed]
- **portals_organization**:
  - **Outbound Coupling**: None. [Confirmed]
  - **Inbound Coupling**: `portals_organization_entities_entity_message-center`, `portals_organization_entities_entity_properties_buildings`, `portals_organization_entities_entity_properties_users`, `portals_organization_entities_entity_suppliers` (all importing organization context types). [Confirmed]
- **portals_organization_entities**:
  - **Outbound Coupling**: `portals` (consuming `OSKConfirmDialogComponent`). [Confirmed]
  - **Inbound Coupling**: `portals_organization_entities_entity_properties` (consuming `OSKOrganizationEntitiesService`). [Confirmed]
- **portals_organization_entities_entity**:
  - **Outbound Coupling**: `portals_organization_entities_entity_properties` (consuming property services), `portals_organization_entities_entity_properties_users` (consuming user list services). [Confirmed]
  - **Inbound Coupling**: None. [Confirmed]
- **portals_organization_entities_entity_message-center**:
  - **Outbound Coupling**: `authentication` (consuming `OSKAuthService`), `portals` (consuming `OSKConfirmDialogComponent`), `portals_organization` (importing organization types), `portals_organization_entities_entity_properties` (importing property types), `portals_organization_entities_entity_suppliers` (importing date adapters). [Confirmed]
  - **Inbound Coupling**: `portals_organization_entities_entity_suppliers` (consuming message center components and services). [Confirmed]
- **portals_organization_entities_entity_properties**:
  - **Outbound Coupling**: `portals` (consuming `OSKConfirmDialogComponent`), `portals_organization_entities` (consuming entity services), `portals_organization_entities_entity_properties_buildings` (consuming building services), `portals_organization_entities_entity_properties_inhabitants` (consuming inhabitant services), `portals_organization_entities_entity_properties_users` (consuming user list services), `portals_organization_onboarding-cards` (importing onboarding types). [Confirmed]
  - **Inbound Coupling**: `portals` (consuming property services), `portals_organization_entities_entity` (consuming property services), `portals_organization_entities_entity_message-center` (importing property types). [Confirmed]
- **portals_organization_entities_entity_properties_buildings**:
  - **Outbound Coupling**: `portals_organization` (importing organization types). [Confirmed]
  - **Inbound Coupling**: `portals_organization_entities_entity_properties` (consuming building services), `portals_organization_entities_entity_properties_general-rules` (consuming building services), `portals_organization_entities_entity_properties_inhabitants` (consuming building services). [Confirmed]
- **portals_organization_entities_entity_properties_general-rules**:
  - **Outbound Coupling**: `portals` (consuming `OSKConfirmDialogComponent`), `portals_organization_entities_entity_properties_buildings` (consuming building services), `portals_organization_entities_entity_properties_inhabitants` (importing pincode types). [Confirmed]
  - **Inbound Coupling**: None. [Confirmed]
- **portals_organization_entities_entity_properties_inhabitants**:
  - **Outbound Coupling**: `portals` (consuming `OSKConfirmDialogComponent`), `portals_organization_entities_entity_properties_buildings` (consuming building services), `portals_organization_entities_entity_suppliers` (importing date adapters), `portals_organization_onboarding-cards` (consuming onboarding services and components). [Confirmed]
  - **Inbound Coupling**: `portals_organization_entities_entity_properties` (consuming inhabitant services), `portals_organization_entities_entity_properties_general-rules` (importing pincode types). [Confirmed]
- **portals_organization_entities_entity_properties_users**:
  - **Outbound Coupling**: `portals` (consuming `OSKConfirmDialogComponent`), `portals_organization` (importing organization types), `portals_organization_onboarding-cards` (consuming onboarding services). [Confirmed]
  - **Inbound Coupling**: `authentication` (importing invitation types), `portals_organization_entities_entity` (consuming user list services), `portals_organization_entities_entity_properties` (consuming user list services). [Confirmed]
- **portals_organization_entities_entity_suppliers**:
  - **Outbound Coupling**: `portals` (consuming `OSKConfirmDialogComponent`), `portals_organization` (importing organization types), `portals_organization_entities_entity_message-center` (consuming message center components and services), `portals_organization_onboarding-cards` (consuming onboarding services). [Confirmed]
  - **Inbound Coupling**: `portals_organization_entities_entity_message-center` (importing date adapters), `portals_organization_entities_entity_properties_inhabitants` (importing date adapters). [Confirmed]
- **portals_organization_onboarding-cards**:
  - **Outbound Coupling**: None. [Confirmed]
  - **Inbound Coupling**: `portals_organization_entities_entity_properties` (importing onboarding types), `portals_organization_entities_entity_properties_inhabitants` (consuming onboarding services and components), `portals_organization_entities_entity_properties_users` (consuming onboarding services), `portals_organization_entities_entity_suppliers` (consuming onboarding services). [Confirmed]

### 10. Cross-Module Relationships

The `features` module maintains verified boundaries with the `components` and `core` modules:

#### Outbound Relationships (Imports & Method Calls)
- **components**: Confirmed import dependency. `OSKHomeComponent` imports `OSKHeaderComponent` to render the application header. [Confirmed]
- **core**: Confirmed import dependency (228 touchpoints) and method-level call edges. [Confirmed]
  - **Error Handling**: Calls `OSKErrorService.showError` (16 call sites, primarily within authentication and sign-in components). [Confirmed]
  - **Firebase Authentication**: Calls `OSKFirebaseAuthService` methods (confirmSignIn, getUserByUid, resetPassword, sendPasswordResetEmail, setDoc, signInWithCustomToken, signInWithEmailAndPassword, signOut, signUpWithEmailAndPassword, signUpWithEmailLink, updateProfile, verifyPasswordResetCode) to manage user credentials and sessions. [Confirmed]
  - **Backend Communication**: Calls `OSKFirebaseHttpsService.call` (102 call sites across data services) to execute Firebase HTTPS Callable functions. [Confirmed]
  - **Localization**: Calls `OSKTranslateService.instant` (168 call sites) and `getTranslations` (4 call sites) to resolve localized UI strings. [Confirmed]

#### Inbound Relationships (Imports & Method Calls)
- **components**: Confirmed import dependency. `OSKHeaderComponent` imports `OSKAuthService` to manage session visibility. [Confirmed]
  - **Method Calls**: `OSKHeaderComponent` calls `OSKAuthService.signOut` (1 call site) to terminate user sessions. [Confirmed]
- **core**: Confirmed import dependency. `current-user.token.ts` imports `OSKUserDefaultSidemenu` and `generateUserOrganizationDefaultMenu` to resolve user context, and `user.type.ts` imports `OSKSideMenu`. [Confirmed]

### 11. Permissions & Security

**Cross-cutting risk callouts:**

The application enforces role-based access control (RBAC) primarily to gate navigation menu visibility and restrict route access. [Confirmed]

#### Role-Gating Tally
- **`v1.admin`**: Gates access to the root administrative portal menu. [Confirmed]
- **`v1.admin.org.admin` / `v1.admin.user.admin` / `v1.admin.user.devices.admin` / `v1.admin.user.invitations.admin` / `v1.admin.user.accesses.admin`**: Filters specific administrative sub-menu options. [Confirmed]
- **`v1.org.admin`**: Gates access to the organization portal menu and filters administrative roles during user invitation. [Confirmed]
- **`v1.org.client`**: Checked inline within components (`OSKEntitiesDashboardComponent`, `OSKOrganizationPropertiesListComponent`, and building/unit/door lists) to conditionally enable or display management UI elements. [Confirmed]
- **`v1.org.suppliers.admin`**: Gates the `"suppliers"` route at both the entity and property levels. [Confirmed]
- **`v1.org.user.admin`**: Gates the `"users"` and `"invite"` routes, and is checked within user list components. [Confirmed]
- **`v1.org.communications.admin`**: Gates the `"message-center"` route at both the entity and property levels. [Confirmed]
- **`v1.org.residents.admin`**: Gates the `:propertyId/inhabitants` route and is checked within the property dashboard. [Confirmed]
- **`v1.org.settings.admin`**: Gates the `:propertyId/generalRules` route. [Confirmed]
- **`v1.org.buildings.admin`**: Checked within the property dashboard to verify building administration rights. [Confirmed]

#### Unattributed Access-Control Signals
A significant portion of the module's capabilities manage sensitive data or operations but lack explicit route guards or permission strings in their local configurations:
- **`portals_organization_entities_entity_properties_buildings`**: Uses `AdminGuard` on routes in `organization-buildings.routes.ts` (1 guard), but the local configuration does not attribute this guard to a specific permission string. [Inferred]
- **`portals_organization_entities_entity_properties_inhabitants`**: Contains 0 route guards on `organization-inhabitants.routes.ts` and checks no permission strings, despite managing sensitive resident profiles and access schedules. [Inferred]
- **`portals_organization_onboarding-cards`**: Contains 0 route guards on `onboarding-cards.routes.ts` and checks no permission strings, despite managing access onboarding. [Inferred]
- **`portals_user`**: Contains 0 route guards on `user.routes.ts` and checks no permission strings, despite managing user account profiles. [Inferred]
- **`portals_user_invitations`**: Contains 0 route guards on `invitations.routes.ts` and checks no permission strings, despite managing unit access invitations. [Inferred]
- **`portals_user_organizations`**: Contains 0 route guards on `organizations.routes.ts` and checks no permission strings. [Inferred]
- **`portals_user_organizations_pending-organizations`**: Contains 0 route guards on `pending-organizations.routes.ts` and checks no permission strings. [Inferred]
- **`portals_organization_entities_entity_suppliers`**: Contains 0 route guards on `suppliers.routes.ts` and checks no permission strings, despite managing third-party suppliers and pincodes. [Inferred]
- **`portals_organization_entities_entity_message-center`**: Contains 0 route guards on `message-center.routes.ts` and checks no permission strings. [Inferred]

**Per-capability evidence:**

#### authentication

- **Route Guards**: No `angular_guard` facts are present in this capability's evidence pack. [Confirmed]
- **Permission Strings**: No explicit permission strings or role-membership checks are evidenced in this capability's code. [Confirmed]

---

#### home

No guards, authorization checks, or permission strings are evidenced within this capability [Confirmed].

---

#### portals

While no Angular Guards (`angular_guard`) are directly defined in this capability, role-based access control (RBAC) is heavily integrated into the dynamic menu generation utilities:

- **Admin Portal Permissions**:
  - `generateOskeyAdminDefaultMenu` checks if the user has the `v1.admin` role `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin|#2` ``.
  - It filters administrative menu items based on versioned permissions:
    - `v1.admin.org.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.org.admin|#1` ``
    - `v1.admin.user.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.user.admin|#1` ``
    - `v1.admin.user.devices.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.user.devices.admin|#1` ``
    - `v1.admin.user.invitations.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.user.invitations.admin|#1` ``
    - `v1.admin.user.accesses.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-admin-default-menu.util.ts|v1.admin.user.accesses.admin|#1` ``
- **Organization Portal Permissions**:
  - `generateUserOrganizationDefaultMenu` checks if the user has the `v1.org.admin` role `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.admin|#1` ``.
  - It filters organization menu items based on versioned permissions:
    - `v1.org.suppliers.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.suppliers.admin|#1` ``
    - `v1.org.user.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.user.admin|#1` ``
    - `v1.org.residents.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.residents.admin|#1` ``
    - `v1.org.settings.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.settings.admin|#1` ``
    - `v1.org.communications.admin` `` `permission_candidate|features|hosting/web-app/src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util.ts|v1.org.communications.admin|#1` ``

---

#### portals_organization

- No route guards (`canActivate`), role checks, or permission strings are evidenced in this capability's routing or component files. (Confirmed)

---

#### portals_organization_entities

- **Inline Role Check**: The component performs an inline check on the current user's active account roles to verify if they contain the client permission string `'v1.org.client'` [Confirmed] (`` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|v1.org.client|#1` ``, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|role.includes|ngOnInit|'v1.org.client'|#1` ``).
- **Guards**: No route guards are explicitly configured on the routes defined within this capability [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/entities.routes.ts` ``).

---

#### portals_organization_entities_entity

Route access is restricted using the `user-role.guard` (imported from `src/app/core/guards/user-role/user-role.guard`) with specific permission requirements:
- Access to `"suppliers"` requires the `v1.org.suppliers.admin` permission. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts` (lines 32-35) ``)
- Access to `"users"` requires the `v1.org.user.admin` permission. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts` (lines 40-43) ``)
- Access to `"message-center"` requires the `v1.org.communications.admin` permission. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/entity.routes.ts` (lines 51-54) ``)

No external RBAC roles document is currently available to cross-verify these permission strings.

#### portals_organization_entities_entity_message-center

- No explicit Angular route guards (`canActivate`) are defined directly on the routes in `message-center.routes.ts`. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/message-center.routes.ts`
- **`OSKMessageCenterListComponent`** injects `OSKAuthService` and `OSKCurrentUserToken` to retrieve the current user's token and context, indicating that list loading is context-bound to the authenticated user. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts` (lines 91, 123, 127)

---

#### portals_organization_entities_entity_properties

### Guards

- **`UserRoleGuard`**: Attached to multiple routes in `properties.routes.ts` to enforce role-based access. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts` `` line 17)

### Permission Strings Checked

- **`v1.org.client`**: Checked in `OSKOrganizationPropertiesListComponent` to verify if the current user has client-level access. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-list/organization-properties-list.component.ts` `` line 89)
- **`v1.org.buildings.admin`**: Checked in `OSKPropertyDashboardComponent` to verify building administration rights. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts` `` line 202)
- **`v1.org.residents.admin`**: Checked in `OSKPropertyDashboardComponent` (line 207) and enforced on route `:propertyId/inhabitants` (line 59). [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts` `` and `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts` ``)
- **`v1.org.user.admin`**: Checked in `OSKPropertyDashboardComponent` (line 212) and enforced on route `:propertyId/users` (line 93). [Confirmed]
- **`v1.org.communications.admin`**: Enforced on route `:propertyId/message-center`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts` `` line 85)
- **`v1.org.settings.admin`**: Enforced on route `:propertyId/generalRules`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts` `` line 68)
- **`v1.org.suppliers.admin`**: Enforced on route `:propertyId/suppliers`. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/properties.routes.ts` `` line 77)

---

#### portals_organization_entities_entity_properties_buildings

- **Role-Based Access Control (RBAC)**: The components `OSKOrganizationBuildingsListComponent`, `OSKOrganizationBuildingUnitsListComponent`, and `OSKOrganizationBuildingDoorsListComponent` perform client-side checks for the role **`v1.org.client`** within the user's selected account roles to conditionally enable or display certain UI elements. (Files: `organization-buildings-list.component.ts` line 90, `organization-building-units-list.component.ts` line 88, `organization-building-doors-list.component.ts` line 84).
- **Route Guards**: The **`AdminGuard`** is imported and can be attached to routes within `organization-buildings.routes.ts` to restrict unauthorized access. (File: `organization-buildings.routes.ts`, line 15).

---

#### portals_organization_entities_entity_properties_general-rules

- No `angular_guard` facts are present in this capability's pack.
- The component injects `OSKCurrentUserToken` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|inject|anon|OSKCurrentUserToken|#1` ``.
- The capability enforces permission rules dynamically by checking metadata properties (such as `canBeChanged` on `OSKFieldMetadata`) to disable or enable UI controls for specific settings `` `angular_signal|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|OSKListSettingsComponent|isAllowQuickcodesDisabled` ``.

#### portals_organization_entities_entity_properties_inhabitants

- **Guards**: No route guards are explicitly defined in `organization-inhabitants.routes.ts` within this capability's evidence pack. **Unknown**.
- **Permission Strings**: No explicit permission strings or role-membership checks are evidenced in this capability's code. **Unknown**.

---

#### portals_organization_entities_entity_properties_users

- **Route Protection**: The `"invite"` route is protected by `userRoleGuard` [Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts` (lines 27-28) ``].
- **Permission Strings**:
  - **`v1.org.user.admin`**: Required to access the invite route and check current user capabilities [Confirmed, `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/organization-users.routes.ts|v1.org.user.admin|#1` ``, `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-users-list/organization-users-list.component.ts|v1.org.user.admin|#1` ``].
  - **`v1.org.admin`**: Used to identify organization administrators and filter roles [Confirmed, `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|v1.org.admin|#1` ``].
  - **`v1.org.entity.admin`**, **`v1.org.property.admin`**, **`v1.org.buildings.admin`**: Administrative roles filtered out during standard user role assignment [Confirmed, `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|v1.org.entity.admin|#1` ``, `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|v1.org.property.admin|#1` ``, `` `permission_candidate|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|v1.org.buildings.admin|#1` ``].

---

#### portals_organization_entities_entity_suppliers

- **Route Guards**: No route guards are explicitly defined in the routes file for this capability. **Confirmed** `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/suppliers.routes.ts` ``.
- **Role-Based Access Control (RBAC)**: There are no explicit role checks or permission strings evidenced in the provided code facts. **Unknown** (no security grounding document or role checks are present in this capability pack).

---

#### portals_organization_onboarding-cards

- **Route Protection**: No explicit route guards (e.g., `canActivate`) are defined directly on the routes within `onboarding-cards.routes.ts` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/onboarding-cards.routes.ts||#1` ``. **Inferred** (Route protection is likely handled at a parent route level).
- **Account Restrictions**: `OSKCreateOnboardingCardsComponent` utilizes `OSKAccountRestrictions.isAccountEmailAllowed` to validate email addresses during onboarding card creation `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/features/create-onboarding-cards/create-onboarding-cards.component.ts|OSKAccountRestrictions.isAccountEmailAllowed|createEmailValidator|value|#1` ``. **Confirmed**

---

#### portals_user

- No `angular_guard` facts or explicit permission/role checks are evidenced in this capability pack [Confirmed].

---

#### portals_user_invitations

- **Guards**: No route guards are explicitly defined on the `send` route within this capability's route file [Confirmed, `hosting/web-app/src/app/features/portals/user/invitations/invitations.routes.ts` (line 4)].
- **User Context**: The component injects `OSKCurrentUserToken` to retrieve the current user's ID (`this.currentUser().oskUser!.userId`), which is used to restrict the units fetched and associate the invitation sender [Confirmed, `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|this.currentUser|ngOnInit||#1`, `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|this.currentUser|sendInvitation||#1`].
- **Permissions**: No explicit permission strings or role-membership checks are evidenced in this capability's code.

---

#### portals_user_organizations

No route guards or explicit permission checks are evidenced in this capability's routes or components. [Confirmed] (via `` `hosting/web-app/src/app/features/portals/user/organizations/organizations.routes.ts` ``)

#### portals_user_organizations_pending-organizations

- No explicit Angular guards (`canActivate`) or permission strings are directly evidenced on the routes within this capability's route file `` `hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations.routes.ts` (line 1) ``.
- The capability relies on user authentication context by injecting `OSKCurrentUserToken` `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|inject|anon|OSKCurrentUserToken|#1` `` to retrieve the current user's ID (`currentUser().oskUser!.userId`) when submitting a new pending organization request [Inferred].

---

### 12. External Hooks

#### authentication

- **@angular/fire/auth**: Firebase Authentication SDK. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts|@angular/fire/auth|#1` ``
- **@auth0/auth0-angular**: Auth0 SDK for Angular. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|@auth0/auth0-angular|#1` ``
- **libphonenumber-js**: Library for parsing phone numbers. [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/services/auth.service.ts|libphonenumber-js|#1` ``
- **ngx-cookie-service**: Cookie service for managing cookies (e.g., `emailForSignIn`). [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/sign-in/components/verify-email/verify-email.component.ts|ngx-cookie-service|#1` ``
- **@oskey/translate**: Custom translation pipe (`OSKTranslatePipe`). [Confirmed] `` `imports_dependency|features|hosting/web-app/src/app/features/authentication/features/auth-action/auth-action.component.ts|@oskey/translate|#1` ``

---

#### home

- **Angular Core & Common**: Imports `@angular/core` for component definition and `@angular/common` for the `NgOptimizedImage` directive [Confirmed] (cite `` `imports_dependency|features|hosting/web-app/src/app/features/home/home.component.ts|@angular/core|#1` `` and `` `imports_dependency|features|hosting/web-app/src/app/features/home/home.component.ts|@angular/common|#1` ``).

---

#### portals

- **Angular CDK Layout**: Injects `BreakpointObserver` to monitor screen size changes (specifically matching `(max-width: 600px)`) to automatically collapse the sidemenu on mobile devices `` `imports_dependency|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|@angular/cdk/layout|#1` ``.
- **Angular Material SDK**: Extensively utilizes Angular Material modules (`MatListModule`, `MatIconModule`, `MatCard`, `MatButtonModule`, `MatMenuModule`, `MatExpansionModule`, `MatDialogModule`, `MatProgressSpinnerModule`) for UI layout, dialogs, and interactive elements `` `imports_dependency|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|@angular/material/list|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/shared/components/confirm-dialog/confirm-dialog.component.ts|@angular/material/dialog|#1` ``.
- **Localization Pipe**: Integrates with `@oskey/translate` via `OSKTranslatePipe` to translate dynamic menu labels `` `imports_dependency|features|hosting/web-app/src/app/features/portals/sidemenu/sidemenu.component.ts|@oskey/translate|#1` ``.

---

#### portals_organization

- **`@ngx-translate` / `@oskey/translate`**: The components utilize `OSKTranslatePipe` for localized UI rendering `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|Component|anon|{   selector: 'osk-notifications',   standalone: true,   imports: [MatCardModule, OSKTranslatePipe],   templateUrl: './notifications.component.html',   styleUrl: './notifications.component.scss' }|#1` ``. (Confirmed)
- **Angular Material**: The components integrate with Angular Material's card module (`MatCardModule`) `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/notifications/notifications.component.ts|@angular/material/card|#1` ``. (Confirmed)

---

#### portals_organization_entities

- **Angular Material SDK**: Extensively uses material components for UI layout, form controls, dialogs, and notifications [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@angular/material/card|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@angular/material/dialog|#1` ``, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@angular/material/snack-bar|#1` ``).
- **Angular CDK**: Uses `@angular/cdk/a11y` for accessibility features [Confirmed] (`` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|@angular/cdk/a11y|#1` ``).
- **Translation Hook**: Integrates with the translation system via `OSKTranslatePipe` and `OSKTranslateService` to resolve localized UI text [Confirmed] (`` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|Component|anon|{... imports: [..., OSKTranslatePipe,...],... }|#1` ``, `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entities-dashboard/entities-dashboard.component.ts|inject|anon|OSKTranslateService|#1` ``).

---

#### portals_organization_entities_entity

- **Firebase SDK**: Interacts with Firebase via the injected `OSKFirebaseHttpsService` to invoke HTTPS callable functions. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/services/entity.service.ts` (lines 10, 16) ``)
- **Translation**: Uses `@oskey/translate` (specifically `OSKTranslatePipe`) to handle localization of UI labels. (Confirmed, `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/entity-dashboard/entity-dashboard.component.ts` (line 30) ``)

#### portals_organization_entities_entity_message-center

- **`@ngx-translate` / `@oskey/translate`**: Extensively used via `OSKTranslatePipe` in templates and `OSKTranslateService` in components to translate UI labels, validation messages, and dialog text. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-create/message-center-create.component.ts` (lines 33, 139)
- **Firebase SDK**: Interacts with Firebase Firestore types (e.g., `Timestamp`) to parse and convert dates. **(Confirmed)** `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/features/message-center-list/message-center-list.component.ts` (lines 51, 169)

---

#### portals_organization_entities_entity_properties

- **`@ngx-translate`**: Used extensively via `OSKTranslateService` and `OSKTranslatePipe` for localization of messages, labels, and dialog texts. [Confirmed] (e.g., `` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/organization-properties-create/organization-properties-create.component.ts` `` line 77)
- **`chart.js` & `ng2-charts`**: Used in `OSKPropertyDashboardComponent` to render doughnut charts. [Confirmed] (`` `hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/property-dashboard/property-dashboard.component.ts` `` lines 27, 29, 48)
- **Angular Material**: Uses `@angular/material` modules (`MatCardModule`, `MatTableModule`, `MatPaginatorModule`, `MatProgressSpinnerModule`, `MatButtonModule`, `MatIconModule`, `MatDialogModule`, `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`, `MatChipsModule`, `MatCheckboxModule`) for UI components. [Confirmed]

---

#### portals_organization_entities_entity_properties_buildings

- **Firebase SDK**: Interacts with Firebase backend functions via the injected `OSKFirebaseHttpsService` wrapper. (File: `add-organization-building-door.service.ts`, line 26).
- **`@ngx-translate` / Localization**: Uses `OSKTranslateService` and `OSKTranslatePipe` to fetch localized text keys (e.g., `portals.organization.buildings.addDoor.*`, `portals.organization.buildings.addUnit.*`) for form labels, errors, and notifications. (File: `add-organization-building-door.component.ts`, lines 75, 100).

---

#### portals_organization_entities_entity_properties_general-rules

- **Firebase SDK**: Indirectly used via `OSKFirebaseHttpsService` from `@oskey/firebase` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/services/building-settings.service.ts|@oskey/firebase|#1` ``.
- **Angular Fire**: Imports `@angular/fire/firestore` in the types file `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/types/organization-general-rules.type.ts|@angular/fire/firestore|#1` ``.
- **ngx-translate**: Uses `OSKTranslateService` and `OSKTranslatePipe` for localized text and messages `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/general-rules/features/list-settings/list-settings.component.ts|@oskey/translate|#1` ``.

#### portals_organization_entities_entity_properties_inhabitants

- **`libphonenumber-js`**: Used for parsing and validating phone numbers within the creation wizard `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|libphonenumber-js|#1` ``. **Confirmed**.
- **`@oskey/translate`**: Used for translating UI labels and snackbar messages `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|@oskey/translate|#1` ``. **Confirmed**.

---

#### portals_organization_entities_entity_properties_users

- **`libphonenumber-js`**: Used for parsing and validating phone numbers based on country codes [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|libphonenumber-js|#1` ``].
- **`@oskey/translate` / `OSKTranslateService` / `OSKTranslatePipe`**: Used for internationalization and localized UI strings [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|@oskey/translate|#1` ``].
- **Firebase SDK / `@angular/fire/firestore`**: Used for Firestore data types such as `Timestamp` [Confirmed, `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/invite-organization-user/invite-organization-user.component.ts|@angular/fire/firestore|#1` ``].

---

#### portals_organization_entities_entity_suppliers

This capability integrates with the following external SDKs and libraries:

- **`libphonenumber-js`**: Used to parse and validate phone numbers for suppliers and staff members across different countries. **Confirmed** `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|parsePhoneNumber|createPhoneNumberValidator|phoneNumber,countryCode|#1` ``.
- **`@angular/material`**: Extensively used for UI elements (stepper, tabs, tables, dialogs, datepicker, progress spinners, checkboxes, expansion panels). **Confirmed** `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-creation/suppliers-creation.component.ts|@angular/material/stepper|#1` ``.
- **`@angular/cdk/clipboard`**: Used to copy pincodes to the user's clipboard. **Confirmed** `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|this.clipboard.copy|copyPincode|pincode|#1` ``.

---

#### portals_organization_onboarding-cards

This capability integrates with several external libraries and SDKs:

- **Angular Material & CDK**: Extensively uses Material UI components (`MatCardModule`, `MatButtonModule`, `MatIconModule`, `MatStepperModule`, `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`, `MatTableModule`, `MatPaginatorModule`, `MatTooltipModule`, `MatProgressSpinnerModule`) and CDK Accordion (`CdkAccordionModule`) across all components.
- **`ngx-mat-timepicker`**: Used in `OSKOnboardingCardFormComponent` to handle time selection for recurrent access rights `` `imports_dependency|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/components/onboarding-card-form/onboarding-card-form.component.ts|ngx-mat-timepicker|#1` ``.
- **Firebase HTTPS Service**: Interacts with Firebase backend functions via the injected `OSKFirebaseHttpsService` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/services/onboarding-cards/onboarding-cards.service.ts|inject|anon|OSKFirebaseHttpsService|#1` ``.

---

#### portals_user

- **Angular Material SDK**: Extensively uses Angular Material components (`MatCardModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatSelectModule`, `MatProgressSpinnerModule`, `MatSnackBar`) for UI rendering and notifications `` `call_expression|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|Component|anon|{   standalone: true,   imports: [     MatCardModule,     ReactiveFormsModule,     MatFormFieldModule,     OSKTranslatePipe,     MatInputModule,     MatButtonModule,     MatSelectModule,     FormsModule,     MatProgressSpinnerModule,     MatCardModule   ],   selector: 'osk-profile',   templateUrl: './account.component.html',   styleUrl: './account.component.scss' }|#1` ``.
- **`@ngx-translate` / OSKTranslate**: Uses translation pipes and services for localization `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/account/account.component.ts|@oskey/translate|#1` ``.

---

#### portals_user_invitations

This capability integrates with the following external libraries and SDKs:
- **Angular Material**: Extensively uses Material UI components for layout, inputs, selects, datepickers, and buttons [Confirmed, `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|@angular/material/card|#1`].
- **`ngx-mat-timepicker`**: Used for selecting access validity times [Confirmed, `imports_dependency|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|ngx-mat-timepicker|#1`].
- **Translation Engine**: Uses `OSKTranslatePipe` and `OSKTranslateService` (which wrap the application's translation framework) to localize UI labels [Confirmed, `call_expression|features|hosting/web-app/src/app/features/portals/user/invitations/send-user-invitation/send-user-invitation.component.ts|this.translate.instant|anon|'portals.organization.onboardingCards.add.permanent'|#1`].

---

#### portals_user_organizations

- **`@ngx-translate` / `@oskey/translate`**: Used to fetch localized messages for user feedback snackbars:
  - `portals.user.organizationInvitations.acceptedMsg` [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|this.translate.instant|acceptInvitation|'portals.user.organizationInvitations.acceptedMsg'|#1` ``)
  - `portals.user.organizationInvitations.rejectedMsg` [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|this.translate.instant|rejectInvitation|'portals.user.organizationInvitations.rejectedMsg'|#1` ``)
- **Angular Material SDK**: Uses `MatSnackBar` to display success notifications. [Confirmed] (via `` `call_expression|features|hosting/web-app/src/app/features/portals/user/organizations/organization-invitations/organization-invitations.component.ts|inject|anon|MatSnackBar|#1` ``)

#### portals_user_organizations_pending-organizations

This capability interacts with the following external libraries and SDKs [Confirmed]:
- **Angular Material**: Extensively uses Material UI components including `MatSnackBar` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|@angular/material/snack-bar|#1` ``, `MatTableModule` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts|@angular/material/table|#1` ``, `MatPaginatorModule` `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/pending-organizations-list/pending-organizations.component.ts|@angular/material/paginator|#1` ``, and form controls.
- **Angular Router**: Uses `Router` and `RouterLink` for navigation and route definitions `` `imports_dependency|features|hosting/web-app/src/app/features/portals/user/organizations/pending-organizations/add-organization/add-organization.component.ts|@angular/router|#1` ``.

---

### 13. Architectural Observations

- **Domain-Driven Hierarchical Nesting**: The submodule structure strictly mirrors the physical hierarchy of the real-world domain: Organization -> Entity -> Property -> Building -> Unit/Door. [Inferred] This results in deeply nested directories (e.g., `portals_organization_entities_entity_properties_buildings`), which enforces clean domain boundaries but increases import path complexity. [Inferred]
- **Centralized UI Interaction Hub**: The `portals` submodule acts as a central interaction hub. [Confirmed] Almost all management submodules depend on it solely to import the shared `OSKConfirmDialogComponent`, indicating a highly centralized pattern for destructive action confirmations. [Inferred]
- **Asymmetric Route Guarding**: Security enforcement is highly asymmetric. [Inferred] While core entity and property routes are strictly guarded via `UserRoleGuard` and explicit permission strings, sub-features like suppliers, inhabitants, onboarding cards, and message centers have no local route guards configured, relying entirely on parent-level routing security or inline UI visibility gating. [Inferred]
- **Upward Layering Violation**: The `authentication` service (`OSKAuthService`) directly imports types (`OSKOrganizationPMPUserInvitation`) from the deeply nested `portals_organization_entities_entity_properties_users` submodule to process invitations during registration. [Confirmed] This creates an upward coupling dependency from a core service to a deeply nested feature submodule, violating strict layering principles. [Inferred]

### 14. Risks & Open Questions

**Cross-cutting risks:**

- **Unguarded Sensitive Routes**: Why are highly sensitive routes—such as supplier pincode management (`suppliers.routes.ts`), resident profiles (`organization-inhabitants.routes.ts`), and onboarding cards (`onboarding-cards.routes.ts`)—completely unguarded at the local route level? [Unknown] If parent-level guards fail or are misconfigured, these endpoints may be exposed to unauthorized authenticated users. [Inferred]
- **Unattributed `AdminGuard`**: What specific roles or permissions does the `AdminGuard` in `organization-buildings.routes.ts` validate? [Unknown] The lack of explicit permission mapping in the frontend code introduces ambiguity regarding building management authorization. [Inferred]
- **Duplicate Service Definitions**: Why are there two identical service classes named `OSKOrganizationEntitiesService` defined in different paths (`features/entities/features/entities-dashboard/services/organization-entities.service.ts` and `features/entities/services/organization-entities.service.ts`)? [Unknown] This duplication risks divergence and runtime bugs if one service is updated without the other. [Inferred]
- **Pincode Security Auditing**: Pincodes are revealed in the UI and automatically masked after 7 seconds in `OSKSuppliersDetailsComponent`. [Confirmed] Are there any client-side or backend audit logs generated when a user reveals or copies a pincode, or is this operation unlogged? [Unknown]
- **Inconsistent Invitation Rejection Payload**: In `OSKOrganizationInvitationsComponent.rejectInvitation`, the payload passed to the backend includes `isApproved: true`. [Confirmed] Is this a copy-paste bug in the frontend implementation, or does the backend intentionally handle rejection via a different parameter while keeping `isApproved` true? [Unknown]

**Per-capability open questions:**

#### authentication

- Are there any route guards (like `canActivate`) protecting these authentication routes, or are they entirely public? [Unknown] (No guards are evidenced in `auth.routes.ts`).
- How is the `emailForSignIn` cookie set and cleared during the email link sign-in flow? [Unknown] (Only reading via `CookieService.get` is evidenced in `OSKVerifyEmailComponent`).
- What is the exact structure of the `OSKUser` and `OSKCreateUserDTO` types? [Unknown] (These types are imported from `@oskey/core/types` but their properties are only partially inferred from usage).

#### home

- **Routing Integration**: How is `OSKHomeComponent` loaded? Is it lazy-loaded via a parent routing configuration (such as a root or features routing file) that is not part of this capability's evidence pack? [Inferred]
- **Template Content**: What other visual elements or content sections are defined in `home.component.html` besides the `<osk-header>`? [Inferred]

#### portals

- **Route Configurations**: No routing definitions (`.routes.ts`) are present in this capability pack. It is unknown which specific paths map to `OSKPortalComponent` or how child routes are registered. (Unknown)
- **Confirmation Dialog Triggering**: While `OSKConfirmDialogComponent` is defined, the mechanism or parent component that opens this dialog (e.g., via `MatDialog.open()`) is not evidenced in this pack. (Unknown)

#### portals_organization

- **Entities Capability**: The `entities` route lazy-loads `./features/entities/entities.routes` `` `angular_route|features|hosting/web-app/src/app/features/portals/organization/organization.routes.ts|entities|#1` ``, but the components and routes for the entities capability are not present in this evidence pack. (Inferred)
- **Data Fetching & State**: There are no services, HTTP clients, or state management mechanisms evidenced for `OSKNotificationsComponent` or `OSKSettingsComponent`. It is unknown how these components fetch or persist their respective notification and settings data. (Inferred)

#### portals_organization_entities

- **Duplicate Service Definition**: Why are there two identical service classes named `OSKOrganizationEntitiesService` defined in different paths (`features/entities/features/entities-dashboard/services/organization-entities.service.ts` and `features/entities/services/organization-entities.service.ts`)? [Unknown]
- **Child Route Details**: What specific child routes and components are loaded under the `:entityId` path, as they are defined in `./features/entity/entity.routes` which is outside this capability evidence pack? [Unknown]

#### portals_organization_entities_entity

- What is the exact schema of the response returned by the `organization-getEntityDashboardStatics` callable function? (Unknown)
- Are there any fallback behaviors if the `user-role.guard` denies access to the restricted sub-routes? (Unknown)

#### portals_organization_entities_entity_message-center

- Are there any parent-level route guards (e.g., at the entity or organization level) that secure the message center routes, since none are declared locally? **(Inferred)**
- How are the translation keys (e.g., `'portals.organization.communication.create.saveSuccess'`) managed and synchronized with the translation assets? **(Inferred)**
- What is the exact structure of the `OSKFirestoreTimestampLike` type, and are there any edge cases where Firestore timestamps are returned as plain objects instead of SDK `Timestamp` instances? **(Inferred)**

#### portals_organization_entities_entity_properties

- Are the lazy-loaded routes (e.g., `organization-buildings.routes`, `organization-inhabitants.routes`, `organization-general-rules.routes`, `suppliers.routes`, `message-center.routes`, `organization-users.routes`) fully managed by this capability or do they represent separate capabilities? [Inferred]
- What is the exact structure of the response payload for `organization-getPropertyDashboardStatics` since no explicit schema mapping is resolved in the evidence pack? [Unknown]

#### portals_organization_entities_entity_properties_buildings

- **Unverified Firebase Callables**: There is no direct verification in this frontend capability pack that the backend functions (e.g., `building-organizationUserCreateBuildingDoor`, `building-organizationUserGetAllBuildingUnits`) are correctly registered and matching on the Firebase backend.
- **RBAC Roles Grounding**: The role string `'v1.org.client'` is used locally for checks, but there is no external grounding document to verify if this is the complete list of roles authorized to manage buildings.
- **Typing of Writable Signals**: Several signals (such as `countries`, `doors`, `units`, `buildings`) are initialized with generic arrays or `any[]`, leaving the exact model structures for doors, units, and countries partially unverified at compile-time.

#### portals_organization_entities_entity_properties_general-rules

- The exact structure and purpose of the required `@Input` property on `OSKListSettingsComponent` (line 64) is not fully detailed in the facts.
- It is unknown if there are any route guards associated with `organization-general-rules.routes.ts` since none are explicitly listed in the `angular_route` or `angular_guard` facts for this capability.

#### portals_organization_entities_entity_properties_inhabitants

- **Route Protection**: Are there any route guards or RBAC roles required to access the inhabitant list or details? (No guards are defined in `organization-inhabitants.routes.ts`).
- **Dynamic Dialogs**: Why is `OSKCreateOnboardingCardsComponent` imported in `create-organization-inhabitant.component.ts` but not explicitly instantiated in the template composition facts? (It might be used dynamically as a dialog reference).
- **Backend Schema Verification**: What is the exact structure of the backend response for `organization-getallResidentsByPropertyId`? (The type `OSKDocumentListResponse` is defined but we don't have the full backend schema verification).

#### portals_organization_entities_entity_properties_users

- **Unverified Firebase Callables**: The actual existence and exact request/response schemas of the referenced Firebase callable functions (e.g., `organization-createPMPUserWithInvitation`) cannot be verified within this frontend capability context [Inferred].
- **RBAC Roles Mapping**: There is no authoritative grounding document mapping the permission strings (e.g., `v1.org.user.admin`) to specific backend roles or database rules [Inferred].

#### portals_organization_entities_entity_suppliers

- **Route Protection**: Why are there no `canActivate` guards attached to the supplier routes in `suppliers.routes.ts`? Is route protection handled at a higher level (e.g., parent routes)?
- **Pincode Security**: Pincodes are revealed in the UI and automatically hidden after 7 seconds `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-details/suppliers-details.component.ts|this.revealedPincodes.update|togglePincode|...|#1` ``. Are there any audit logs generated when a user reveals or copies a pincode?
- **Date Adapter Scope**: `OSKCustomDateAdapter` is provided locally in `OSKSuppliersStaffAccessComponent` `` `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/suppliers/features/suppliers-staff-access/suppliers-staff-access.component.ts|Component|anon|{   selector: 'osk-suppliers-staff-access', ... }|#1` ``. Is this custom adapter needed globally across other datepickers in the application, or is it strictly scoped here?

#### portals_organization_onboarding-cards

- **Route Protection**: It is unknown whether the onboarding card routes are protected by role-based access control (RBAC) guards at a higher level in the routing hierarchy, as no guards are declared on the local routes.
- **Backend Schema Verification**: The exact response structures of the Firebase callable functions (e.g., `organization-getAllOnboardingDocuments`) are unverified locally and depend on the backend implementation.
- **Activation Code Verification**: It is unclear what specific criteria are used by the backend to verify activation codes via `organization-verifyActivationCodeByOrganizationAdmin`.

#### portals_user

- **Route Protection**: Are there any route guards (e.g., authentication guards) protecting the `user.routes.ts` paths? The routes evidence does not show any `canActivate` guards, but they might be defined at a higher level (e.g., parent routes) [Unknown].
- **Child Route Contents**: What do the lazy-loaded child routes `organizations` and `invitations` contain? Their route definitions point to external files (`./organizations/organizations.routes` and `./invitations/invitations.routes`) which are not part of this capability's evidence pack [Unknown].
- **Local Signals**: Are there any local signals managed by this capability? No `angular_signal` facts were provided, though reactive state is handled via Angular Forms and external signals [Unknown].

#### portals_user_invitations

- **Route Protection**: Is the `send` route protected by parent-level guards (e.g., in a parent routing file), or is it accessible to any authenticated user? The local route configuration does not specify any guards [Inferred, `hosting/web-app/src/app/features/portals/user/invitations/invitations.routes.ts` (line 4)].
- **Response Schemas**: What are the exact response structures returned by the Firebase HTTPS callable functions `user-getCurrentUserUnits` and `user-createUserInvitation`? No explicit `api_contract` facts are resolved to model properties in this scope [Unknown].
- **Validation Rules**: Are there any client-side form validation rules (such as email format validation or date range checks) implemented beyond the basic HTML/Material attributes? [Unknown].

#### portals_user_organizations

- **Pending Organizations Capability**: The route `pending` lazy-loads `./pending-organizations/pending-organizations.routes` (line 20), but the implementation details of the pending organizations capability are not present in this evidence pack. [Inferred]
- **Payload Parameter `isApproved`**: In `rejectInvitation`, the payload passed to the backend includes `isApproved: true` (line 122). It is unclear if this is a copy-paste bug in the source code or if the backend handles rejection via a different parameter while keeping `isApproved: true`. [Inferred]

#### portals_user_organizations_pending-organizations

- Are these pending organization routes protected by any parent-level authentication or authorization guards (e.g., at the `/portals/user` level)?
- What is the exact data structure of the `OSKPendingOrganization` type, and what are the specific validation rules applied to the reactive form fields in `OSKAddOrganizationComponent`?
- How are errors from the Firebase HTTPS callable functions handled and displayed to the user during organization creation or list retrieval?

### 15. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, and 12) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.