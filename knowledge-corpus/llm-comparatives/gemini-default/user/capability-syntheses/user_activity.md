### 0. Generation Metadata
- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-03T14:33:56.561Z
- repoName: firebase-oskey-dev
- targetModule: user
- capability: user_activity
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash

### 1. Capability Summary
The `user_activity` capability manages the ingestion, retrieval, aggregation, and deletion of user-specific activity logs (such as door access events and intercom calls) within the platform, enforcing strict user-scoped data isolation. [Confirmed] (evidenced by the controllers, services, and callable API contracts in `functions/src/modules/user/modules/user_activity/index.ts`).

### 2. Primary Responsibilities
*   **Ingesting and Saving User Activities**: Processes incoming activity events for a specific user, enriching them and persisting them as individual activity documents [Confirmed] `` `service_method|user|functions/src/modules/user/modules/user_activity/services/user_activities.service.ts|OSKUserActivitiesService|ActivityReceivedForUser|#1` ``.
*   **Aggregating User Activities**: Maintains a rolling 30-day aggregate of user activities (including calls and door access events) per building, filtering out older entries to optimize mobile client synchronization [Confirmed] `` `service_method|user|functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts|OSKUserActivityAggregatesService|ActivityReceivedForUser|#1` ``.
*   **Retrieving Activity Logs**: Exposes endpoints to fetch a single activity by ID [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getActivityById|#1` `` or retrieve all activities for a user [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getAllUserActivities|#1` ``.
*   **Retrieving Activity Aggregates**: Allows fetching aggregated activities filtered by building ID [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getActivityByBuildingId|#1` ``.
*   **Deleting Activity History**: Provides capabilities to delete a specific activity record [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|delete|#1` `` or clear all activity history for a user [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|deleteAll|#1` ``.
*   **Enforcing User-Scoped Security**: Restricts access to activity data using the `OSKUserSecurityChecks` decorator to ensure users can only query or delete their own logs [Confirmed] `` `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 54-95) ``.

### 3. Public Interfaces (Controllers & Entry Points)
*   `OSKUserActivitiesController`: Inherits from `OSKDocumentAndMessageController` and manages the direct Firestore operations for individual user activity documents `` `source_class|user|functions/src/modules/user/modules/user_activity/controllers/user_activities.controller.ts|OSKUserActivitiesController` ``.
*   `OSKUserActivityAggregatesController`: Inherits from `OSKDocumentController` and manages Firestore operations for aggregated user activities `` `source_class|user|functions/src/modules/user/modules/user_activity/controllers/user_activity_aggregates.controller.ts|OSKUserActivityAggregatesController` ``.
*   `OSKUserActivitiesService`: The core service orchestrating individual user activity retrieval, creation, and deletion `` `source_class|user|functions/src/modules/user/modules/user_activity/services/user_activities.service.ts|OSKUserActivitiesService` ``.
*   `OSKUserActivityAggregatesService`: The service orchestrating the aggregation of user activities and retrieval by building ID `` `source_class|user|functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts|OSKUserActivityAggregatesService` ``.

### 4. API Contracts & Firestore Triggers
The capability exposes the following Firebase Callable functions `` `functions/src/modules/user/modules/user_activity/index.ts` (lines 42-51) ``:
*   `delete`: Deletes a specific user activity.
    *   Request Schema: `OSKDeleteActivityByIdRequest`
        *   `activityId`: `string`
        *   `userId`: `string`
*   `deleteAll`: Deletes all activities for a user.
    *   Request Schema: `OSKDeleteAllUserActivitiesRequest`
        *   `userId`: `string`
*   `getActivityByBuildingId`: Retrieves aggregated activities for a user filtered by building.
    *   Request Schema: `OSKGetUserActivityAggregatesByBuildingIdRequest`
        *   `buildingId`: `string`
        *   `userId`: `string`
*   `getActivityById`: Retrieves a specific user activity.
    *   Request Schema: `OSKGetUserActivityByIdRequest`
        *   `activityId`: `string`
        *   `userId`: `string`
*   `getAllUserActivities`: Retrieves all activities for a user.
    *   Request Schema: `OSKGetAllUserActivitiesRequest`
        *   `userId`: `string`

### 5. Data Ownership
This capability owns and manages the following Firestore collections:
*   `/users/{userId}/activities/{activityId}`: Stores individual enriched user activity documents `` `functions/src/modules/user/modules/user_activity/controllers/user_activities.controller.ts` (lines 12-13) ``.
    *   Operation Scope: Read, Write, Delete.
*   `/users/{userId}/activityAggregates/{buildingId}`: Stores aggregated user activities grouped by building ID `` `functions/src/modules/user/modules/user_activity/controllers/user_activity_aggregates.controller.ts` (lines 16-17) ``.
    *   Operation Scope: Read, Write, Delete.

### 6. Outbound Coupling
*   **Cross-Module Coupling**:
    *   `building` module (`building_activity` submodule): Imports `building_activity_document.model` to map building-level activity structures to user-level activity documents `` `imports_dependency|user|functions/src/modules/user/modules/user_activity/models/documents/user_activity_document.model.ts|../../../../../building/modules/building_activity/models/documents/building_activity_document.model|#1` ``.
    *   `access_control_device` module: Depends on `access_control_device_activity_enrichment.service` to enrich raw device events with business context before saving them as user activities `` `imports_dependency|user|functions/src/modules/user/modules/user_activity/services/user_activities.service.ts|../../../../access_control_device/services/access_control_device_activity_enrichment.service|#1` ``.
    *   `core` module: Inherits from core controllers (`OSKDocumentAndMessageController` and `OSKDocumentController`) and utilizes core logging services `` `imports_dependency|user|functions/src/modules/user/modules/user_activity/controllers/user_activities.controller.ts|@oskey/core/controllers/document_and_message|#1` ``.
*   **Intra-Module Coupling (Sibling Submodules)**:
    *   `user_call` submodule: Imports call models and types to aggregate call events alongside other user activities `` `imports_dependency|user|functions/src/modules/user/modules/user_activity/controllers/user_activity_aggregates.controller.ts|@oskey/user/call|#1` ``.
    *   `user` parent module: Imports `OSKUserController` to retrieve safe user profiles during activity enrichment `` `imports_dependency|user|functions/src/modules/user/modules/user_activity/services/user_activities.service.ts|@oskey/user|#1` ``.

### 7. Permissions & Security
*   This capability does not reference any administrative RBAC permission strings (e.g., `v1.admin.*` or `v1.org.*`).
*   Instead, security is enforced at the user level via the `OSKUserSecurityChecks` decorator `` `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 54, 67, 80, 89) ``. This decorator validates that the authenticated user (`request.auth.uid`) matches the `userId` provided in the request parameters, preventing cross-user data leakage.

### 8. External Hooks
*   No external hooks (such as Pub/Sub publishers, external HTTP endpoints, or cloud storage paths) are directly defined within this capability's pack. It relies entirely on standard Firebase HTTPS Callable triggers for client interactions.

### 9. Open Questions
*   **Trigger Mechanism for Ingestion**: The services expose `ActivityReceivedForUser` methods, but the mechanism that invokes these methods when a door event or call occurs is not evidenced in this pack. It is likely triggered by a Firestore trigger or Pub/Sub subscriber in another module (e.g., `access_control_device` or `building`).
*   **Cutoff Window Customization**: The 30-day cutoff window for activity aggregates is hardcoded in the service `` `functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts` (line 78) ``. It is unknown if there are plans to make this configurable via building settings.