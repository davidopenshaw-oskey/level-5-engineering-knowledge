## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.372Z
- **repoName**: firebase-oskey-dev
- **targetModule**: admin
- **capability**: admin_buildings
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `admin_buildings` capability provides administrative backend services to retrieve buildings and their nested units within a specific organization scope [Confirmed]. It exposes a secure HTTPS callable function that enforces administrative role-based access control (RBAC) and organization-level boundary checks before querying the database [Confirmed].

---

## 2. Primary Responsibilities
- **Expose Administrative Entry Points**: Exposes the `getAllBuildingsWithUnits` HTTPS callable API endpoint to allow administrative clients to retrieve building and unit structures [Confirmed] (`api_contract|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|getAllBuildingsWithUnits|#1`).
- **Enforce Administrative RBAC & Scope**: Resolves the administrative user's organization membership [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|getAdminOrganizationUser|getAllBuildingsWithUnits|context.auth?.uid,requestData.adminOrganizationId|#1`) and checks their consolidated permissions [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|getAllBuildingsWithUnits|adminOrganizationUser.roles,rolesToCheck|#1`) before executing queries.
- **Query Buildings and Units**: Queries the Firestore database to fetch all buildings [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts|OSKAdminBuildingController.default._query|getAll|OSKAdminBuildingController.collection|#1`) and maps their nested units [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|OSKAdminBuildingUnitController.getAll|getAllBuildingsWithUnits|building.buildingId|#1`) into a structured response payload [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|units.map|getAllBuildingsWithUnits|(u) => ({ unitId: u.unitId, unitNumber: u.unitNumber, name: u.name })|#1`).

---

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes the following internal controllers and services:
- **`OSKAdminBuildingController`**: Handles querying and document operations for the `/buildings` collection [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts`, lines 10-20).
- **`OSKAdminBuildingUnitController`**: Handles querying and document operations for the nested `/buildings/{buildingId}/units` collection [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts`, lines 10-19).
- **`OSKAdminBuildingService`**: Orchestrates the business logic, permission checks, and data aggregation for administrative building queries [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts`, lines 18-62).

---

## 4. API Contracts & Firestore Triggers

### Callable Functions
- **`getAllBuildingsWithUnits`** [Confirmed] (`api_contract|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|getAllBuildingsWithUnits|#1`)
  - **Request Type**: `OSKGetAllBuildingsWithUnitsRequestData` (No matching `model_property` facts are present in this pack to detail the request fields, but it is imported as the request payload type) [Inferred] (`functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts`, line 16).
  - **Response Type**: `OSKGetAllBuildingsWithUnitsResponseData` [Confirmed]
    - **`units`**: `OSKBuildingUnit[]` [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/models/functions/get_all_buildings_with_units_request.type.ts`, line 7).

### Firestore Triggers
- None evidenced in this capability pack [Confirmed].

---

## 5. Data Ownership

### Firestore Paths Read
- **`/buildings`** [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts|OSKAdminBuildingController.default._query|getAll|OSKAdminBuildingController.collection|#1`)
  - **Operation Scope**: Read/Query
- **`/buildings/{buildingId}/units`** [Confirmed] (`call_expression|admin|functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts|OSKAdminBuildingUnitController.default._query|getAll|`/buildings/${buildingId}/units`|#1`)
  - **Operation Scope**: Read/Query

---

## 6. Outbound Coupling

### Cross-Module Coupling
- **`building` Module**:
  - Imports `@oskey/building` to reference building models and controllers [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts`, line 6).
  - Imports `@oskey/building/unit` to reference unit models and controllers [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/controllers/admin_building_unit.controller.ts`, line 6).
- **`core` Module**:
  - Imports `@oskey/core/controllers/document` to extend the base document controller [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts`, line 8).
  - Imports `@oskey/core/logger` for error logging [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts`, line 8).
- **`settings` Module**:
  - Imports `@oskey/settings/role` to perform user permission checks [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts`, line 9).

### Intra-Module Coupling (Sibling Submodules)
- **`admin_users` Submodule**:
  - Imports the `getAdminOrganizationUser` utility to resolve the administrative user's organization context [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts`, line 13).
- **`admin` Module Root**:
  - Imports `with_admin_organization_id.model` to enforce organization scoping [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts`, line 12).

---

## 7. Permissions & Security

### Permissions Referenced
- **`v1.admin.user.accesses.create`** [Confirmed] (`permission_candidate|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|v1.admin.user.accesses.create|#1`)
  - **Cross-Check**: This permission is defined in the RBAC roles document as "Allows to create a user access". 

---

## 8. External Hooks
- None evidenced in this capability pack [Confirmed].

---

## 9. Open Questions
- **Permission Mismatch**: Why does `OSKAdminBuildingService.getAllBuildingsWithUnits` check the permission `v1.admin.user.accesses.create` [Confirmed] (`permission_candidate|admin|functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts|v1.admin.user.accesses.create|#1`)? This permission is defined as "Allows to create a user access" in the RBAC roles document, which seems functionally mismatched for a read-only operation retrieving buildings and units.
- **Request Schema Details**: What are the exact fields of `OSKGetAllBuildingsWithUnitsRequestData`? No `model_property` facts were provided in this pack to define its structure [Unknown].