## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.487Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_intercom_ communication
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `organization_intercom_ communication` capability manages administrative communications sent from an organization to building intercoms (physical displays) and/or residents (via push notifications) [Confirmed]. It handles the creation, scheduling, preemption, translation (via Gemini/Vertex AI), and lifecycle state management of these communications, including archiving older messages [Confirmed].

## 2. Primary Responsibilities

### Create Intercom Communication
- Orchestrates the creation of a communication message targeting specific buildings and doors [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|createIntercomCommunication|#1`].
- Translates the communication title and description into supported languages using Gemini/Vertex AI [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1464-1528)].
- Schedules activation and deactivation tasks via Cloud Tasks [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1160-1240)].
- Updates the physical device configurations immediately if the communication is set to activate instantly [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1346-1359)].

### Delete Intercom Communication
- Removes a communication from the active state document or the archive sub-collection [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|deleteIntercomCommunication|#1`].
- Cancels any scheduled activation or deactivation Cloud Tasks associated with the deleted communication [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1712-1714)].
- Updates the physical device configurations to remove the message from the home screen [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1719-1741)].

### Retrieve Communications
- Retrieves active, scheduled, or archived communications filtered by building, property, or entity [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationService|#1`, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationsByPropertyId|#1`, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationsByEntityId|#1`].

### AI-Powered Reformulation
- Uses Gemini to reformulate communication titles and descriptions to improve clarity or tone [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|reformulateCommunicationWithGemini|#1`].

### State Management (Hot/Cold Storage)
- Manages active and scheduled messages in a "hot" state document (`default` document in the resolved state collection path) [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 150, 339)].
- Evicts older expired messages to a "cold" archive sub-collection once limits are exceeded (e.g., maximum of 5 expired messages in hot storage) [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 257-292)].

### Resident Notification
- Batches and dispatches push notifications to onboarded app-user residents of a building when a communication is activated [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 454-540)].

## 3. Public Interfaces (Controllers & Entry Points)

### Controllers
- **`OSKIntercomBuildingStateController`**: Manages the retrieval, saving, and updating of the "hot" state documents containing active and scheduled communications [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/controllers/organization_intercom_building_state.controller.ts`].
- **`OSKIntercomCommunicationArchiveController`**: Manages the retrieval and storage of archived (evicted) communications [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/controllers/organization_intercom_communication_archive.controller.ts`].

### Entry Points (Callable Cloud Functions)
- **`createIntercomCommunication`**: Creates and schedules a new communication [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|createIntercomCommunication|#1`].
- **`deleteIntercomCommunication`**: Deletes an existing communication [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|deleteIntercomCommunication|#1`].
- **`getAllIntercomCommunicationService`**: Retrieves all active and scheduled communications for a building [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationService|#1`].
- **`getArchivedIntercomCommunications`**: Retrieves archived communications for a building [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getArchivedIntercomCommunications|#1`].
- **`getIntercomCommunicationById`**: Retrieves a specific communication by ID [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getIntercomCommunicationById|#1`].
- **`getAllIntercomCommunicationsByPropertyId`**: Retrieves communications across all buildings in a property [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationsByPropertyId|#1`].
- **`getAllIntercomCommunicationsByEntityId`**: Retrieves communications across all properties and buildings in an entity [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|getAllIntercomCommunicationsByEntityId|#1`].
- **`reformulateCommunicationWithGemini`**: Reformulates communication content using AI [Confirmed, `api_contract|organization|functions/src/modules/organization/modules/organization_intercom_ communication/index.ts|reformulateCommunicationWithGemini|#1`].

## 4. API Contracts & Firestore Triggers

### API Contracts

#### `createIntercomCommunication`
- **Request Type**: `OSKCreateIntercomCommunicationRequestData`
  - `homeInfo`: `{ title: string; description: string; }`
  - `organizationId`: `string`
  - `priority`: `OSKCommunicationPriority` (e.g., `'low' | 'medium' | 'high'`)
  - `schedule`: `{ startDate: Date; endDate?: Date; }`
  - `sendToChannels`: `('intercom' | 'residents')[]`
  - `targets`: `{ buildingId: string; buildingName: string; doorIds: string[]; }[]`
- **Response Type**: `OSKCreateIntercomCommunicationResponseData`
  - `communicationId`: `string`
  - `results`: `OSKCreateIntercomCommunicationResult[]`
    - `buildingId`: `string`
    - `status`: `'fulfilled' | 'rejected'`
    - `reason`: `string | undefined`

#### `deleteIntercomCommunication`
- **Request Type**: `OSKDeleteIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `void` (Implicit)

#### `getAllIntercomCommunicationService`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`
  - `activationTaskId`: `string | undefined`
  - `buildingId`: `string`
  - `buildingName`: `string`
  - `communicationId`: `string`
  - `createdByUserId`: `string | undefined`
  - `creationDate`: `Timestamp`
  - `deactivationTaskId`: `string | undefined`
  - `doorInfos`: `OSKDoorInfo[]`
  - `homeInfos`: `OSKLocalizedInfoBlock[]`
  - `modificationDate`: `Timestamp`
  - `organizationId`: `string`
  - `priority`: `OSKCommunicationPriority`
  - `schedule`: `OSKCommunicationSchedule`
  - `status`: `OSKIntercomCommunicationStatus`
  - `translationEngine`: `'google-translate-v2' | 'gemini-2.5-flash'`
  - `type`: `'intercom' | 'push' | undefined`

#### `getAllIntercomCommunicationsByEntityId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByEntityIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage` (Array)

#### `getAllIntercomCommunicationsByPropertyId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByPropertyIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage` (Array)

#### `getArchivedIntercomCommunications`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage` (Array)

#### `getIntercomCommunicationById`
- **Request Type**: `OSKGetIntercomCommunicationByIdRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

#### `reformulateCommunicationWithGemini`
- **Request Type**: `OSKReformulateCommunicationRequestData`
  - `description`: `string`
  - `organizationId`: `string`
  - `title`: `string`
- **Response Type**: `OSKReformulateCommunicationResponseData`
  - `reformulatedDescription`: `string`
  - `reformulatedTitle`: `string`

### Firestore Triggers
No Firestore triggers are defined within this capability's evidence pack.

## 5. Data Ownership

### Firestore Paths Touched
- **`/accessControlDevices/{id}/configs`**: Updated indirectly via `OSKAccessControlDeviceConfigController` to save the communication message on the device's home screen configuration [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1440-1461)].
- **State Collection Paths**: Resolved dynamically via `OSKIntercomBuildingStateController.getStateCollectionPath(organizationId, buildingId, type)` (where `type` is `'intercom'` or `'push'`). These documents store the active/scheduled messages array [Confirmed, `firestore_path_touched|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|default|#1`].
- **Archive Collection Paths**: Resolved dynamically via `OSKIntercomCommunicationArchiveController.getCollectionPath(organizationId, buildingId, type)`. These documents store evicted expired messages [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1768-1800)].

## 6. Outbound Coupling

### Cross-Module Coupling
- **`core`**:
  - Imports `@oskey/core/controllers/document` in `organization_intercom_building_state.controller.ts` and `organization_intercom_communication_archive.controller.ts`.
  - Imports `@oskey/core/logger` and `@oskey/core` in `organization_intercom_communication.service.ts`.
- **`access_control_device`**:
  - Imports `@oskey/access_control_device` in `organization_intercom_communication.service.ts` to fetch and save device configurations via `OSKAccessControlDeviceConfigController`.
- **`building`**:
  - Imports `@oskey/building` and `@oskey/building/door` in `organization_intercom_communication.service.ts` to fetch building and door details via `OSKBuildingController`, `OSKBuildingDoorController`, and `OSKBuildingDoorAccessControlDeviceController`.
- **`tasks`**:
  - Imports `../../../../tasks/services/task_scheduler.service` and `../../../../tasks/models/tasks.model` in `organization_intercom_communication.service.ts` to schedule and cancel Cloud Tasks via `OSKTaskSchedulerService`.
- **`user`**:
  - Imports `@oskey/user` and `../../../../user/modules/user_notification` in `organization_intercom_communication.service.ts` to fetch resident user details and dispatch push notifications via `OSKUserController` and `OSKUserNotificationService`.
- **`apps`**:
  - Imports `@oskey/apps/notification` in `organization_intercom_communication.service.ts`.
- **`settings`**:
  - Imports `@oskey/settings/role` in `organization_intercom_communication.service.ts` to check user permissions via `OSKConsolidatedRolesController`.

### Intra-Module Coupling (Sibling Submodules)
- **`organization_prompt_templates`**:
  - Imports `../../organization_prompt_templates` in `organization_intercom_communication.service.ts` to fetch prompt templates for translation and reformulation via `OSKOrganizationPromptTemplateController`.
- **`organization_property`**:
  - Imports `@oskey/organization/property` in `organization_intercom_communication.service.ts` to fetch properties via `OSKPropertyController`.
- **`organization_residents`**:
  - Imports `@oskey/organization/residents` in `organization_intercom_communication.service.ts` to fetch building residents via `OSKOrganizationResidentsController`.
- **`organization_user`**:
  - Imports `@oskey/organization/user` in `organization_intercom_communication.service.ts` to fetch organization user details via `OSKOrganizationUserController`.

## 7. Permissions & Security

### Permission Strings Referenced
- **`v1.org.communications.create`**: Required to create a new communication or reformulate content [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 985, 1622)].
- **`v1.org.communications.delete`**: Required to delete an existing communication [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 1686)].
- **`v1.org.communications.list`**: Required to list active, scheduled, or archived communications [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 691, 745, 894, 925)].
- **`v1.org.communications.view`**: Required to view details of a specific communication [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 797)].

### RBAC Alignment
All referenced permission strings match the supplied RBAC roles document exactly.

## 8. External Hooks

### Generative AI Integration (Vertex AI / Gemini)
- Integrates with `@google-cloud/vertexai` to access generative models [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 6)].
- Uses `gemini-2.5-flash` to execute batch translations and content reformulation [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (line 61)].

### Cloud Tasks Integration
- Schedules asynchronous execution of `activateIntercomCommunicationTask` and `deactivateIntercomCommunicationTask` via `OSKTaskSchedulerService` [Confirmed, `functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts` (lines 1160, 1196)].

## 9. Open Questions
- **Exact Firestore Paths**: The exact Firestore collection paths resolved by `OSKIntercomBuildingStateController.getStateCollectionPath` and `OSKIntercomCommunicationArchiveController.getCollectionPath` are not explicitly defined in the evidence pack (they are dynamically generated using `organizationId`, `buildingId`, and `type`).
- **Cloud Task Handlers**: The actual execution logic for `activateIntercomCommunicationTask` and `deactivateIntercomCommunicationTask` is not present in this capability's evidence pack (it is likely owned by the `tasks` module).