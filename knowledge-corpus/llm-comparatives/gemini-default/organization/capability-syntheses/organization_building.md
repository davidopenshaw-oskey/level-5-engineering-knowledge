### 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.479Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_building
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

### 1. Capability Summary
The `organization_building` capability manages the association of physical buildings to organizations within the Property Manager Portal (PGO) context [Confirmed]. It provides administrative interfaces to query, retrieve, and structure building data (including units and doors) scoped to specific organizations and properties, particularly for onboarding workflows [Confirmed].

---

### 2. Primary Responsibilities
- **Managing Organization-to-Building Associations**: Persists and maintains documents under the `/organizations/{organizationId}/buildings` path via standard document controller operations (`save`, `update`, `delete`) `` `functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts` (lines 16-48) ``.
- **Retrieving Organization Buildings**: Queries all buildings associated with a specific organization, resolving and merging master building data with organization-scoped metadata `` `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getAllOrganizationBuildings|#1` ``.
- **Retrieving Building Structures for Onboarding**: Fetches units and doors of buildings under a specific property to populate onboarding cards, sorting units by floor and unit number `` `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getAllOrganizationBuildingsForOnboardingCards|#1` ``.
- **Retrieving Single Organization Building**: Retrieves a single organization-building association by its ID `` `service_method|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|OSKOrganizationBuildingService|getOrganizationBuildingById|#1` ``.

---

### 3. Public Interfaces (Controllers & Entry Points)
- **OSKOrganizationBuildingController**: Extends `OSKDocumentController` to expose standard CRUD endpoints for organization-building documents `` `source_class|organization|functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts|OSKOrganizationBuildingController` ``.
- **Callable Cloud Functions**: Exposes three public entry points for client applications `` `function_declaration|organization|functions/src/modules/organization/modules/organization_building/index.ts|getCallableFunctionTriggers|#1` ``:
  - `getAllOrganizationBuildings`
  - `getAllOrganizationBuildingsForOnboardingCards`
  - `getOrganizationBuildingById`

---

### 4. API Contracts & Firestore Triggers
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

### 5. Data Ownership
- **Firestore Path**: `/organizations/{organizationId}/buildings/{buildingId}`
  - **Operations**: Create/Write (`_set`), Update (`_update`), Read (`_get`, `_query`), Delete (`_delete`) `` `functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts` (lines 16-48) ``.
  - **Confidence**: Confirmed.
  - **Operation Detection Scope**: Controller-level document operations.

---

### 6. Outbound Coupling
#### Cross-Module Coupling
- **`core`**: Depends on `@oskey/core` for base controllers and document models `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts|@oskey/core|#1` ``.
- **`building`**: Depends on `@oskey/building`, `@oskey/building/door`, and `@oskey/building/unit` to fetch master building, door, and unit data `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|@oskey/building|#1` ``.
- **`settings`**: Depends on `@oskey/settings/role` to check user permissions `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|@oskey/settings/role|#1` ``.
- **`user`**: Depends on `@oskey/user` to fetch user profiles `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|@oskey/user|#1` ``.

#### Intra-Module Coupling (Sibling Submodules)
- **`organization_user`**: Depends on `../../organization_user/controllers/organization_user.controller` to fetch organization-scoped user roles `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|../../organization_user/controllers/organization_user.controller|#1` ``.
- **`organization_building`**: The controller imports `@oskey/organization/building` `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts|@oskey/organization/building|#1` ``.

---

### 7. Permissions & Security
- **`v1.org.buildings.view`**: Required to retrieve organization buildings and single organization building details `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.buildings.view|#1` ``.
  - *Cross-check*: Present in RBAC roles document ("Allows to view the details of a building"). Matches implementation.
- **`v1.org.residents.view`**: Required to retrieve organization buildings for onboarding cards `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.residents.view|#1` ``.
  - *Cross-check*: Present in RBAC roles document ("Allows to view the details of a resident"). Matches implementation.
- **Firestore Security Rules**:
  - The rules file defines read and write permissions for `/organizations/{organizationId}/buildings/{buildingId}` as `allow read, write: if isValidUser();` `firestore.rules.txt` (lines 533-534). This matches the controller implementation which relies on authentication.

---

### 8. External Hooks
No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced within this capability's pack.

---

### 9. Open Questions
- **Write Operations Exposure**: The controller `OSKOrganizationBuildingController` inherits from `OSKDocumentController` and exposes `save`, `update`, and `delete` methods `` `functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts` (lines 16-48) ``, but there are no corresponding callable API contracts or services for creating, updating, or deleting organization buildings in this pack. Are these operations performed internally by other modules, or are they exposed via REST endpoints not captured in the `api_contract` facts?
- **Self-Import / Circular Dependency**: The import `@oskey/organization/building` in `organization_building.controller.ts` resolves to the `organization_building` submodule itself `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_building/controllers/organization_building.controller.ts|@oskey/organization/building|#1` ``. It is unclear if this is a self-import or a circular reference.