# Capability Synthesis — organization_property

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.503Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_property
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `organization_property` capability manages the lifecycle, configuration, and administrative grouping of "Properties" (physical parcels of land or estates containing one or more buildings) within an Organization and Entity scope. It provides administrative interfaces for property CRUD operations, image management, entity assignment, and aggregates high-level dashboard statistics (buildings, residents, admins, and devices) across a property's physical footprint. [Confirmed]

## 2. Primary Responsibilities
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

## 3. Public Interfaces (Controllers & Entry Points)
The capability exposes the following public entry points and controllers:

### Controllers
- **`OSKPropertyController`** (extends `OSKDocumentController`): Manages direct Firestore document interactions for the `/properties` collection, including low-level CRUD, array manipulation (`removeBuildingFromProperty`), and Cloud Storage image delegation. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 9-66) ``

### Services & Entry Points
- **`OSKPropertyService`**: The core orchestrator containing business logic, parameter validation, RBAC checks, and multi-document coordination for all property-related operations. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 35-521) ``
- **`getCallableFunctionTriggers`**: The module entry point that registers and exports the HTTPS callable Cloud Functions to the Firebase runtime. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/index.ts` (lines 46-58) ``

## 4. API Contracts & Firestore Triggers

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

## 5. Data Ownership

### Firestore Collections
This capability owns and is the primary writer for the following Firestore collection:

- **`/properties`** (represented by `OSKPropertyController.collection`):
  - **Fields**: `organizationId` (string), `entityId` (string), `propertyId` (string), `propertyName` (string), `streetAddress` (object), `managementType` (string), `propertyType` (string), `propertyImage` (string/optional), `buildings` (array), `creationDate` (timestamp), `modificationDate` (timestamp). [Confirmed] `` `functions/src/modules/organization/modules/organization_property/models/documents/property_document.ts` (lines 38-47) ``
  - **Operations**: Read, Write, Delete. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 21-63) ``

### Shared Data Modifications
This capability performs writes/updates on collections owned by other capabilities:
- **`/buildings/{id}`**: Updates the `propertyId` field when creating, updating, or deleting a property. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 171, 289) ``
- **`/entities/{id}`**: Updates the `propertiesIds` array (using `FieldValue.arrayUnion` and `FieldValue.arrayRemove`) when creating or re-assigning properties. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 166, 350, 354) ``

## 6. Outbound Coupling

### Intra-Module Coupling (Sibling Submodules)
This capability depends on the following submodules within the `organization` module:
- **`organization_entity`**: Imports `../../organization_entity/models/documents/entity_document_model` and `@oskey/organization/entity` (resolves to `OSKEntityController`) to fetch and update entity documents during property creation and assignment. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 15, 20) ``
- **`organization_user`**: Imports `../../organization_user/controllers/organization_user.controller` (resolves to `OSKOrganizationUserController`) to fetch organization user roles and count organization admins. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 21) ``
- **`organization_residents`**: Imports `@oskey/organization/residents` (resolves to `OSKOrganizationResidentsController`) to query and aggregate resident onboarding statistics. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 16) ``

### Cross-Module Coupling
This capability depends on the following external modules:
- **`building`**: Imports `@oskey/building` (resolves to `OSKBuildingController`) and `@oskey/building/door` (resolves to `OSKBuildingDoorController` and `OSKBuildingDoorAccessControlDeviceController`) to update building property references and count doors/devices for dashboard statistics. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (line 5) ``, `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 6, 12) ``
- **`core`**: Imports `@oskey/core/controllers/document` (resolves to `OSKDocumentController`), `@oskey/core` (resolves to `FieldValue`, `Timestamp`), and `@oskey/core/logger` (resolves to `OSKLoggingService`) for base controller functionality, Firestore helpers, and logging. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 6, 7) ``, `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (lines 13, 14) ``
- **`settings`**: Imports `@oskey/settings/role` (resolves to `OSKConsolidatedRolesController`) to perform RBAC permission checks. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/services/property.service.ts` (line 7) ``

## 7. Permissions & Security

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

## 8. External Hooks

### Cloud Storage Integration
- **Delegated Uploads**: The capability utilizes the delegated-upload pattern by calling `_uploadImage` and `_deleteImage` on `OSKDocumentController`. It interacts with Google Cloud Storage buckets to store and delete property images. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/controllers/property.controller.ts` (lines 42-44, 64-66) ``

### Environment Variables
- **`OSK_FIREBASE_EMULATOR`**: Checked during function initialization to conditionally enforce App Check validation. [Confirmed] `` `functions/src/modules/organization/modules/organization_property/index.ts` (line 47) ``

## 9. Open Questions

- **`v1.org.entity.create` Check**: Why does `assigningPropertyToEntity` check `v1.org.entity.create` in its `rolesToCheck` array? Re-associating an existing property to an existing entity would typically only require edit permissions on both entities/properties, rather than the ability to create a brand new entity. [Inferred]
- **Storage Bucket Resolution**: The exact name of the Cloud Storage bucket used for property images is not statically defined in this submodule's facts; it is passed dynamically to the controller's `uploadImage` method. [Inferred]