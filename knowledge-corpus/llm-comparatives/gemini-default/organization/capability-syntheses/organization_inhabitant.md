### 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.484Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_inhabitant
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

### 1. Capability Summary
The `organization_inhabitant` capability provides administrative read-only access to query, retrieve, and map detailed information about inhabitants (residents) registered across all buildings managed by a specific organization [Confirmed]. It consolidates data from multiple domains—including user profiles, building structures, unit configurations, and active pincodes—to present a unified view of inhabitants to property managers and organization administrators [Confirmed].

---

### 2. Primary Responsibilities
- **Retrieve All Organization Inhabitants**: Queries and lists all inhabitants across all buildings belonging to a specific organization [Confirmed] (`service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantsForOrganization|#1`).
- **Retrieve Detailed Inhabitant Information**: Fetches a single inhabitant's detailed profile by their user ID and organization ID [Confirmed] (`service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantDetailsByUserId|#1`).
- **Map and Enrich Inhabitant Data**: Aggregates and maps raw inhabitant records with associated user profiles, active pincodes, building names, and unit names [Confirmed] (`service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|mapInhabitantData|#1`).
- **Enforce Organization-Level Access Control**: Validates that the requesting administrative user has the appropriate permissions (`v1.org.view`) to access organization inhabitant data [Confirmed] (`call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|getAllOrganizationInhabitants|organizationUser.roles,rolesToCheck|#1`).

---

### 3. Public Interfaces (Controllers & Entry Points)
- **`OSKOrganizationInhabitantController`**: Extends `OSKDocumentController` to provide collection-group querying capabilities for inhabitant documents [Confirmed] (`source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts|OSKOrganizationInhabitantController`).
- **`OSKOrganizationInhabitantService`**: The primary service class containing the business logic for retrieving, mapping, and authorizing access to inhabitant records [Confirmed] (`source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService`).
- **Callable Cloud Functions**: Exposes entry points for client applications to invoke administrative queries [Confirmed] (`function_declaration|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getOrganizationInhabitantCallableFunctionTriggers|#1`):
  - `getAllOrganizationInhabitants`
  - `getInhabitantDetailsById`

---

### 4. API Contracts & Firestore Triggers

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

### 5. Data Ownership

#### Firestore Paths
This capability performs read-only queries against the following Firestore collection group [Confirmed]:
- **Collection Group**: `inhabitants` (resolves to `/buildings/{id}/units/{id}/inhabitants` in the global schema) [Confirmed] (`call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts|OSKOrganizationInhabitantController.default._queryCollectionGroup|queryInhabitants|collectionName,queryFilters|#1`).

*Note: No write operations (create, update, delete) are evidenced within this capability's pack.*

---

### 6. Outbound Coupling

#### Cross-Module Coupling
- **`core` Module**:
  - Imports `@oskey/core/controllers/document` and `@oskey/core` [Confirmed] (`functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts` (lines 6-7)).
  - Imports `@oskey/core/logger` [Confirmed] (`functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (line 8)).
- **`building` Module**:
  - Imports `@oskey/building/unit` (specifically the `building_unit` submodule) to fetch unit details [Confirmed] (`functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (line 6)).
- **`settings` Module**:
  - Imports `@oskey/settings/role` (specifically the `role` submodule) to perform permission checks [Confirmed] (`functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (line 18)).
- **`user` Module**:
  - Imports `@oskey/user/pincode` (specifically the `user_pincode` submodule) to fetch active inhabitant pincodes [Confirmed] (`functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (line 20)).
  - Imports `@oskey/user` to fetch user profile details [Confirmed] (`functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (line 19)).

#### Intra-Module Coupling (Sibling Submodules)
- **`organization_building` Submodule**:
  - Imports `@oskey/organization/building` to fetch building details associated with the organization [Confirmed] (`functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (line 9)).
- **`organization_user` Submodule**:
  - Imports `@oskey/organization/user` to fetch organization user roles and profiles [Confirmed] (`functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts` (line 17)).

---

### 7. Permissions & Security
- **Required Permission**: `v1.org.view` [Confirmed] (`permission_candidate|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|v1.org.view|#1`).
- **RBAC Cross-Check**: The permission `v1.org.view` is defined in the RBAC roles document as "Allows to view organization information". This matches the implementation, which restricts the retrieval of organization-wide inhabitant lists and details to users holding this administrative role [Confirmed].

---

### 8. External Hooks
No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or Cloud Storage paths) are evidenced within this capability's pack.

---

### 9. Open Questions
- **Response Schema for `getInhabitantDetailsById`**: The exact response schema for `getInhabitantDetailsById` is not defined in the resolved API schemas. It is inferred to return a mapped inhabitant document, but this is not explicitly confirmed by the model properties.
- **Write Operations**: This capability pack contains only read-only operations. It is unclear if inhabitant creation, modification, or deletion is handled by a different submodule (e.g., `unit_management` or `building`) or if those operations are missing from the current implementation scope.