## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.482Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_entity
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `organization_entity` capability manages the "Entity" scope of the Oskey platform, which represents a localized administrative sandbox or subdivision (such as a regional co-ownership corporation or Syndic) under a parent Organization [Confirmed]. This capability provides complete administrative lifecycle management (CRUD) for entities, handles hierarchical parent-child sub-entity assignments, and aggregates operational dashboard statistics (including counts of properties, buildings, devices, admins, and residents) scoped to a specific entity [Confirmed].

---

## 2. Primary Responsibilities
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

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes its functionality through the following public entry points:

- **Callable Cloud Functions**: Exposed via `getCallableFunctionTriggers` in the submodule index [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 27-39) ``).
- **OSKEntityController**: A document controller extending `OSKDocumentController` that directly interfaces with the Firestore `/entities` collection [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts` (lines 10-39) ``).
- **OSKEntityService**: The core service class containing the business logic for entity operations, decorated with `OSKUserSecurityChecks` [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` (lines 27-382) ``).

---

## 4. API Contracts & Firestore Triggers

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

## 5. Data Ownership

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

## 6. Outbound Coupling

### Cross-Module Coupling
This capability depends on the following external modules:

- **`core`**:
  - Imports `OSKDocumentController` to serve as the base class for `OSKEntityController` [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts` (line 7) ``).
- **`building`**:
  - Imports `OSKBuildingController` to retrieve building query filters for dashboard statistics and building listings [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` (line 5) ``).
- **`settings` (submodule `role`)**:
  - Imports `OSKConsolidatedRolesController` to validate user permissions [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` (line 10) ``).

### Intra-Module Coupling (Sibling Submodules)
This capability depends on the following sibling submodules within the `organization` module:

- **`organization_property`**:
  - Imports `OSKPropertyService` to fetch counts of administrators, devices, and resident statistics for buildings [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` (line 8) ``).
- **`organization_user`**:
  - Imports `OSKOrganizationUserController` to retrieve organization user documents [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` (line 9) ``).
- **`organization` (root controller)**:
  - Imports `OSKOrganizationController` to update organization-level entity pointers [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` (line 6) ``).

---

## 7. Permissions & Security

### Enforced Permissions
The capability checks the following permission strings via `OSKConsolidatedRolesController.checkUserPermissions` [Confirmed]:

- **`v1.org.entity.view`**: Required to view entity details, list entities, or fetch dashboard statistics [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.view|#1` ``).
- **`v1.org.entity.create`**: Required to create a new entity or assign a sub-entity to a parent [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.create|#1` ``, `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.create|#2` ``).
- **`v1.org.entity.edit`**: Required to update an existing entity [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.edit|#1` ``).
- **`v1.org.entity.delete`**: Required to delete an entity [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.delete|#1` ``).

### RBAC Alignment
All candidate permissions (`v1.org.entity.view`, `v1.org.entity.create`, `v1.org.entity.edit`, `v1.org.entity.delete`) align exactly with the definitions provided in the RBAC roles document [Confirmed].

---

## 8. External Hooks
- No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or cloud storage paths) are directly evidenced within this capability's pack [Confirmed].

---

## 9. Open Questions

- **Inbound Coupling**: Which other modules or submodules invoke the callable functions or import `OSKEntityService`? (This is not visible from the outbound-only dependency facts in this pack) [Inferred].
- **`v1.org.entity.list` Permission**: The RBAC roles document defines a `v1.org.entity.list` permission ("Allows to view the list of entities"), but the `getAllEntities` service method checks for `v1.org.entity.view` instead [Confirmed] (`` `permission_candidate|organization|functions/src/modules/organization/modules/organization_entity/services/entity.service.ts|v1.org.entity.view|#1` ``). It is unclear if `v1.org.entity.list` is used elsewhere in the system or if it has been consolidated into `v1.org.entity.view` [Inferred].