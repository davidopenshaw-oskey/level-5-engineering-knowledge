# Module Engineering Profile: organization

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.405Z

---

## 1. Executive Summary

### Interpretation

The `organization` module is the Oskey backend domain for organization-level registry and administration. It implements the top-level `/organizations` collection and a broad set of organization-scoped subdomains, including organization buildings, entities, properties, residents, inhabitants, prompt templates, pending organization records, organization users, and invitation workflows.

The module appears to be the core owner of organization identity, organization membership, and organization-centric administration APIs in the Cloud Functions backend.

### Evidence Used

- Firestore path: `/organizations` from `functions/src/modules/organization/controllers/organization.controller.ts` in `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Controller: `OSKOrganizationController` from `output/knowledge-pipeline/modules/organization/organization-controllers.json`.
- Service: `OSKOrganizationService` from `output/knowledge-pipeline/modules/organization/organization-services.json`.
- Controller: `OSKOrganizationBuildingController`, `OSKEntityController`, `OSKOrganizationInhabitantController`, `OSKOrganizationPromptTemplateController`, `OSKPropertyController`, `OSKOrganizationUserController`, `OSKOrganizationUserInvitationController` from `output/knowledge-pipeline/modules/organization/organization-controllers.json`.
- Service: `OSKOrganizationBuildingService`, `OSKEntityService`, `OSKOrganizationInhabitantService`, `OSKOrganizationPromptTemplateService`, `OSKPropertyService`, `OSKOrganizationUserService`, `OSKOrganizationUserInvitationService` from `output/knowledge-pipeline/modules/organization/organization-services.json`.
- Permission: `v1.org.buildings.view`, `v1.org.buildings.create`, `v1.org.residents.view`, `v1.org.property.view`, `v1.org.entity.view`, `v1.org.user.create`, `v1.org.communications.list` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.

### Confidence

High.

---

## 2. Architectural Position

- Parent scope: Organization-level domain in the Oskey platform hierarchy.
- Owned concepts: organization registry, organization buildings, entities, properties, residents, inhabitants, onboarding, prompt templates, pending organization records, organization users, and invitation state.
- Provided capabilities: organization lifecycle APIs, entity hierarchy management, property and resident registry, organization building management, onboarding/invitation support, organization user administration, and organization-scoped role-aware access checks.
- Downstream consumers or candidate consumers: PGO organization administration UIs, onboarding workflows that integrate with the user module, organization property/building dashboards, and settings or role management flows.
- Confidence: Medium-High.

### Interpretation

Evidence shows the module is structured around a top-level organization registry plus multiple nested submodules that manage organization-scoped assets and people. The architecture grounding for Oskey places Organization at the highest business scope, with this module matching that position by exposing organization collection paths and organization-centric service APIs.

### Evidence Used

- Architecture: `ai-runtime/contracts/docs/Oskey Architecture.md` describes Organization as the top-level corporate entity and administrative umbrella.
- Firestore schema: `ai-runtime/contracts/docs/firestore-schema.md` defines organization-scoped collections such as `/organizations/{id}/buildings`, `/organizations/{id}/residents`, `/organizations/{id}/users`, `/organizations/{id}/promptTemplates`, and `/organizations/{id}/onboardingInhabitants`.
- Manifest: `output/knowledge-pipeline/modules/organization/organization-manifest.json` reports 15 controllers, 15 services, and 23 Firestore hints for the module.
- Controller list: includes organization and submodule controllers across organization building, entity, inhabitant, intercom communication, onboarding inhabitant, pending, prompt templates, property, residents, and users.

### Confidence

Medium-High.

---

## 3. Primary Responsibilities

### Capability: Organization registry and top-level organization document operations

- Implemented by:
  * Controller: `OSKOrganizationController`
  * Service: `OSKOrganizationService`
  * Representative Service Method: `getOrganizationByName`, `getAll`, `save`, `update`
- Evidence:
  * Controller methods `getOrganizationByName`, `getAll`, `save`, `update` in `output/knowledge-pipeline/modules/organization/organization-controllers.json`.
  * Firestore path: `/organizations` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Confidence: High.

### Capability: Organization building listing and management

- Implemented by:
  * Controller: `OSKOrganizationBuildingController`
  * Service: `OSKOrganizationBuildingService`
  * Representative Service Method: `getAllOrganizationBuildings`, `getOrganizationBuildingById`, `getAllOrganizationBuildingsForOnboardingCards`
- Evidence:
  * Controller: `OSKOrganizationBuildingController` in `output/knowledge-pipeline/modules/organization/organization-controllers.json`.
  * Service methods `getAllOrganizationBuildings`, `getOrganizationBuildingById`, `getAllOrganizationBuildingsForOnboardingCards` in `output/knowledge-pipeline/modules/organization/organization-services.json`.
  * Permission: `v1.org.buildings.view` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Confidence: High.

### Capability: Organization entity lifecycle and hierarchy management

- Implemented by:
  * Controller: `OSKEntityController`
  * Service: `OSKEntityService`
  * Representative Service Method: `getAllEntities`, `getEntityById`, `createEntity`, `assignSubEntityToParent`
- Evidence:
  * Controller: `OSKEntityController` in `output/knowledge-pipeline/modules/organization/organization-controllers.json`.
  * Service: `OSKEntityService` and methods such as `getAllEntities`, `getEntityById`, `createEntity` in `output/knowledge-pipeline/modules/organization/organization-services.json`.
  * Firestore path candidate: `/entities` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Confidence: High.

### Capability: Organization inhabitant and onboarding workflows

- Implemented by:
  * Controller: `OSKOrganizationInhabitantController`, `OSKOrganizationOnboardingInhabitantController`
  * Service: `OSKOrganizationInhabitantService`, `OSKOrganizationOnboardingInhabitantService`, `OSKOrganizationOnboardingMailService`
  * Representative Service Method: `getInhabitantsForOrganization`, `createBuildingInhabitantInvitation`, `cancelBuildingInhabitantInvitation`, `acceptBuildingInhabitantInvitation`
- Evidence:
  * Controllers: `OSKOrganizationInhabitantController`, `OSKOrganizationOnboardingInhabitantController` in `output/knowledge-pipeline/modules/organization/organization-controllers.json`.
  * Services: `OSKOrganizationInhabitantService`, `OSKOrganizationOnboardingInhabitantService`, `OSKOrganizationOnboardingMailService` in `output/knowledge-pipeline/modules/organization/organization-services.json`.
  * External evidence: `/users` path value in `output/knowledge-pipeline/modules/organization/organization-evidence.json` indicates onboarding integration with user-related flows.
- Confidence: Medium-High.

### Capability: Organization prompt templates and communication state

- Implemented by:
  * Controller: `OSKOrganizationPromptTemplateController`, `OSKIntercomBuildingStateController`, `OSKIntercomCommunicationArchiveController`
  * Service: `OSKOrganizationPromptTemplateService`, `OSKIntercomCommunicationService`
  * Representative Service Method: prompt template CRUD and intercom building state operations.
- Evidence:
  * Controllers: `OSKOrganizationPromptTemplateController`, `OSKIntercomBuildingStateController`, `OSKIntercomCommunicationArchiveController` in `output/knowledge-pipeline/modules/organization/organization-controllers.json`.
  * Service: `OSKOrganizationPromptTemplateService`, `OSKIntercomCommunicationService` in `output/knowledge-pipeline/modules/organization/organization-services.json`.
  * Firestore schema: `/organizations/{id}/promptTemplates` from `ai-runtime/contracts/docs/firestore-schema.md`.
- Confidence: Medium.

### Capability: Organization property, resident, and user administration

- Implemented by:
  * Controller: `OSKPropertyController`, `OSKOrganizationResidentsController`, `OSKOrganizationUserController`, `OSKOrganizationUserInvitationController`, `OSKOrganizationPMPUserInvitationController`
  * Service: `OSKPropertyService`, `OSKOrganizationResidentsService`, `OSKOrganizationUserService`, `OSKOrganizationUserInvitationService`
  * Representative Service Method: property queries, resident listing, organization user CRUD, invitation creation.
- Evidence:
  * Controllers and services in `output/knowledge-pipeline/modules/organization/organization-controllers.json` and `output/knowledge-pipeline/modules/organization/organization-services.json`.
  * Firestore schema: `/organizations/{id}/residents`, `/organizations/{id}/users`, `/organizations/{id}/userInvitations` from `ai-runtime/contracts/docs/firestore-schema.md`.
  * Permission evidence: `v1.org.property.view`, `v1.org.residents.view`, `v1.org.user.create`, `v1.org.user.edit`, `v1.org.user.delete`.
- Confidence: Medium-High.

---

## 4. Public Interfaces

### Interpretation

The module exposes a set of top-level and submodule controllers for organization registry operations, building management, entity hierarchies, inhabitants and onboarding, prompt templates, property/resident administration, and organization user/invitation flows.

Public entry points appear to be organized around callable service methods and controller-bound document operations, with static service methods suggesting direct callable API behavior.

### Evidence Used

- Controller: `OSKOrganizationController`, `OSKOrganizationBuildingController`, `OSKEntityController`, `OSKOrganizationInhabitantController`, `OSKOrganizationOnboardingInhabitantController`, `OSKOrganizationPromptTemplateController`, `OSKPropertyController`, `OSKOrganizationResidentsController`, `OSKOrganizationUserController`, `OSKOrganizationUserInvitationController` from `output/knowledge-pipeline/modules/organization/organization-controllers.json`.
- Service: `OSKOrganizationService`, `OSKOrganizationBuildingService`, `OSKEntityService`, `OSKOrganizationInhabitantService`, `OSKOrganizationOnboardingInhabitantService`, `OSKOrganizationPromptTemplateService`, `OSKPropertyService`, `OSKOrganizationResidentsService`, `OSKOrganizationUserService`, `OSKOrganizationUserInvitationService` from `output/knowledge-pipeline/modules/organization/organization-services.json`.
- Service Methods: `getAllOrganizationBuildings`, `getOrganizationBuildingById`, `getAllEntities`, `createEntity`, `getInhabitantsForOrganization`, `createBuildingInhabitantInvitation`, `getAllOrganizationBuildingsForOnboardingCards`.

### Confidence

Medium-High.

---

## 5. Internal Structure

### Interpretation

The organization module is decomposed into a top-level organization domain plus multiple focused submodules that align to business concepts.

Submodules include:
- `organization_building`
- `organization_building_invitation`
- `organization_entity`
- `organization_inhabitant`
- `organization_intercom_communication`
- `organization_onboarding_inhabitant`
- `organization_pending`
- `organization_prompt_templates`
- `organization_property`
- `organization_residents`
- `organization_user`
- `organization_user_invitation`
- `organization_user_access`

The module maintains a service/controller separation where controllers expose operation entry points and services encapsulate business logic.

### Evidence Used

- Manifest: 15 controllers, 15 services in `output/knowledge-pipeline/modules/organization/organization-manifest.json`.
- Controller list across submodules in `output/knowledge-pipeline/modules/organization/organization-controllers.json`.
- Service list across submodules in `output/knowledge-pipeline/modules/organization/organization-services.json`.

### Confidence

High.

---

## 6. Firestore & Data Ownership

### Interpretation

The module owns the root organization persistence surface and organization-scoped collections used for buildings, residents, users, prompt templates, onboarding, and pending organization state. It also manages entity-level and property-level administration within the organization domain.

### Evidence Used

- Firestore path: `/organizations` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Schema: `/organizations/{id}/buildings`, `/organizations/{id}/residents`, `/organizations/{id}/users`, `/organizations/{id}/promptTemplates`, `/organizations/{id}/onboardingInhabitants`, `/organizations/{id}/userInvitations`, `/organizations/{id}/userInvitationsCancelled` from `ai-runtime/contracts/docs/firestore-schema.md`.
- Firestore path candidate: `/entities` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Firestore path candidates: `/properties`, `/organizationsPending`, `/users` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.

### Confidence

Medium-High.

---

## 7. API Endpoints

This section is detailed in the companion `api-reference/organization-api-reference.md` document.

---

## 8. Firestore Triggers

### Interpretation

The supplied organization module Firestore trigger evidence contains no entries. This means no runtime Firestore trigger handlers were captured in `output/knowledge-pipeline/modules/organization/organization-firestore-triggers.json`.

### Evidence Used

- Trigger evidence: `output/knowledge-pipeline/modules/organization/organization-firestore-triggers.json` (empty array).

### Confidence

Low for trigger behavior because the artifact contains no documented triggers.

---

## 9. Permissions & Security

### Interpretation

The module uses organization-scoped RBAC permission strings in service-level checks. Permission evidence spans organization building management, resident viewing, property access, entity operations, organization user administration, and intercom/communications operations.

### Evidence Used

- Permission: `v1.org.buildings.view`, `v1.org.buildings.create`, `v1.org.residents.view`, `v1.org.property.view`, `v1.org.entity.view`, `v1.org.entity.create`, `v1.org.user.create`, `v1.org.user.edit`, `v1.org.user.delete`, `v1.org.communications.list`, `v1.org.communications.view`, `v1.org.communications.create`, `v1.org.communications.delete` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Permission evidence: `permission-denied` guard values in multiple organization service artefacts.

### Confidence

Medium.

---

## 10. Cross-Module Relationships

### Interpretation

Direct evidence points to integration with the user domain and shared settings/role infrastructure.

### Evidence Used

- Firestore path: `/users` in `output/knowledge-pipeline/modules/organization/organization-evidence.json` from `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts`.
- Evidence values: `@oskey/settings/role` and `@oskey/settings/appstore` in multiple organization service artefacts.

### Confidence

Medium.

---

## 11. External Hooks

### Interpretation

The module exposes candidate external boundaries through environment variables, storage path patterns, and a user-facing path candidate.

### Evidence Used

- External hook: `OSK_FIREBASE_EMULATOR` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- External hook: `GCLOUD_PROJECT`, `LOCATION_ID`, `MAX_BATCH_SIZE`, `PMP_PORTAL_URL` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Storage path candidate: `^organizations/[a-zA-Z0-9-]*/public/logos/[a-zA-Z0-9-]*.(png|jpg|jpeg)$` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Storage path candidate: `^properties/[a-zA-Z0-9-]*/public/images/[a-zA-Z0-9-]*.(png|jpg|jpeg)$` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.
- Candidate external path: `/users` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.

### Confidence

Medium.

---

## 12. Architectural Observations

### Interpretation

The module shows a strong service/controller layering pattern with focused submodules for organization building, entity, inhabitant, user, prompt template, property, and invitation management. The organization domain is separated from organization user/invitation and onboarding concerns, suggesting a modular design rather than a monolith.

The evidence also indicates the module is highly RBAC-aware and likely relies on organization-scoped permission checks rather than purely on Firestore path structure.

### Evidence Used

- Manifest counts: 15 controllers, 15 services, 23 Firestore hints in `output/knowledge-pipeline/modules/organization/organization-manifest.json`.
- Submodule controllers and services in `output/knowledge-pipeline/modules/organization/organization-controllers.json` and `output/knowledge-pipeline/modules/organization/organization-services.json`.
- Permission evidence values in `output/knowledge-pipeline/modules/organization/organization-evidence.json`.

### Confidence

Medium.

---

## 13. Risks & Open Questions

### Interpretation

- No Firestore trigger evidence is captured for the organization module, which leaves runtime event behavior uncertain.
- The exact Firestore collection structure for entity and property-related paths is not fully confirmed by the captured path evidence.
- The relationship between organization onboarding and the broader `/users` domain is directly evidenced, but the precise user onboarding flow is not captured in this module's artefacts.

### Evidence Used

- Empty trigger file: `output/knowledge-pipeline/modules/organization/organization-firestore-triggers.json`.
- Firestore path candidates: `/entities`, `/properties`, `/users` from `output/knowledge-pipeline/modules/organization/organization-evidence.json`.

### Confidence

High that these are open questions.

---

## 14. Evidence References

- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `output/knowledge-pipeline/modules/organization/organization-manifest.json`
- `output/knowledge-pipeline/modules/organization/organization-controllers.json`
- `output/knowledge-pipeline/modules/organization/organization-services.json`
- `output/knowledge-pipeline/modules/organization/organization-evidence.json`
- `output/knowledge-pipeline/modules/organization/organization-firestore-triggers.json`
