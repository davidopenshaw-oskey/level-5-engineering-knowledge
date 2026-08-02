# 0. Generation Metadata
- runId: 20260801_173721-1aa319b1
- generatedAt: 2026-08-02T06:25:39.122Z
- repoName: firebase-oskey-dev
- targetModule: building
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-2.5-pro

# 1. API Contracts

This document lists all public API contracts and event triggers for the `building` module.

---
## Callable Functions

### `assigningBuildingToProperty`
- **Type**: `callable`
- **Description**: Moves a building from one property to another.
- **Request Schema (`OSKPropertyAssigningBuildingRequestData`)**:
  ```json
  {
    "organizationId": "string",
    "oldPropertyId": "string",
    "newPropertyId": "string",
    "buildingId": "string",
    "buildingData": "OSKBuildingDocument"
  }
  ```
- **Response Schema (`OSKBuildingDocument`)**:
  ```json
  {
    "buildingId": "string",
    "propertyId": "string",
    "organizationId": "string",
    "name": "string",
    "streetAddress": {
      "streetName": "string",
      "houseNumber": "string",
      "postalCode": "string",
      "city": "string",
      "country": "string",
      "isoCountryCode": "string",
      "coordinate": {
        "latitude": "number",
        "longitude": "number"
      }
    },
    "creationDate": "timestamp",
    "imageFilename": "string"
  }
  ```

### `createBuildingSettings`
- **Type**: `callable`
- **Description**: Creates a new settings document for a building.
- **Request Schema (`OSKBuildingSettingsCreateRequest`)**:
  ```json
  {
    "buildingId": "string",
    "buildingSettingsInputParams": "OSKBuildingSettingsInputParams"
  }
  ```
- **Response Schema (`OSKBuildingSettingsDocument`)**:
  ```json
  {
    "id": "string",
    "buildingId": { "value": "string", "metadata": { /* ... */ } },
    "accessMethods": { "value": { "bluetooth": "boolean", "pinCode": "boolean", /* ... */ }, "metadata": { /* ... */ } },
    "inhabitantPinCodeType": { "value": "string", "metadata": { /* ... */ } },
    "allowResidentAddition": { "value": "boolean", "metadata": { /* ... */ } }
  }
  ```

### `createBuildingUser`
- **Type**: `callable`
- **Description**: Creates a user record within a specific building and provisions their access rights.
- **Request Schema (`OSKBuildingUserCreateRequest`)**:
  ```json
  {
    "organizationId": "string",
    "buildingId": "string",
    "userId": "string",
    "firstName": "string",
    "lastName": "string",
    "accessRights": "OSKAccessRights[]",
    "doors": "OSKBuildingDoorDocument[]",
    "userType": "OSKAccessType"
  }
  ```
- **Response Schema (`OSKBuildingUser`)**:
  ```json
  {
    "userId": "string",
    "buildingId": "string",
    "firstName": "string",
    "lastName": "string",
    "profileImageFilename": "string",
    "organizationId": "string",
    "accessRights": "OSKAccessRights[]",
    "authorizedDoors": "OSKUserAuthorizedDoor[]",
    "userType": "OSKAccessType"
  }
  ```

### `createNonAppUser`
- **Type**: `callable`
- **Description**: Creates a non-app user profile within a unit.
- **Request Schema (`OSKAddNonAppUserRequest`)**:
  ```json
  {
    "buildingId": "string",
    "unitId": "string",
    "fullName": "string",
    "inviterId": "string"
  }
  ```
- **Response Schema**:
  ```json
  {
    "nonAppUserId": "string"
  }
  ```

### `createNonAppUserAccess`
- **Type**: `callable`
- **Description**: Creates a new access grant for an existing non-app user.
- **Request Schema (`OSKCreateNonAppUserAccessRequest`)**:
  ```json
  {
    "buildingId": "string",
    "unitId": "string",
    "nonAppUserId": "string",
    "doorIds": "string[]",
    "startDate": "timestamp (optional)",
    "endDate": "timestamp (optional)"
  }
  ```
- **Response Schema**:
  ```json
  {
    "accessId": "string"
  }
  ```

### `createNonAppUserWithAccess`
- **Type**: `callable`
- **Description**: Transactionally creates a non-app user, their access grant, and a PIN code.
- **Request Schema (`OSKCreateNonAppUserWithAccessRequest`)**:
  ```json
  {
    "buildingId": "string",
    "unitId": "string",
    "fullName": "string",
    "inviterId": "string",
    "doorIds": "string[]"
  }
  ```
- **Response Schema (`OSKCreateNonAppUserwithAccessResponse`)**:
  ```json
  {
    "nonAppUserId": "string",
    "accessId": "string",
    "pincode": "string",
    "fullName": "string"
  }
  ```

### `createOrganizationBuilding`
- **Type**: `callable`
- **Description**: Creates a new building associated with an organization and property.
- **Request Schema (`OSKBuildingCreateRequest`)**:
  ```json
  {
    "organizationId": "string",
    "propertyId": "string",
    "name": "string",
    "imageFilename": "string (optional)",
    "streetAddress": "OSKStreetAddress"
  }
  ```
- **Response Schema (`OSKBuildingDocument`)**:
  ```json
  {
    "buildingId": "string",
    "propertyId": "string",
    "organizationId": "string",
    "name": "string",
    "streetAddress": { /* ... */ },
    "creationDate": "timestamp",
    "imageFilename": "string"
  }
  ```

### `deleteAllBuildingActivities`
- **Type**: `callable`
- **Description**: Deletes all activity logs for a specific door.
- **Request Schema (`OSKDeleteAllBuildingActivitiesRequest`)**:
  ```json
  {
    "buildingId": "string",
    "doorId": "string"
  }
  ```
- **Response Schema**: `HttpsResponse<void>`

### `deleteBuildingActivityById`
- **Type**: `callable`
- **Description**: Deletes a single building activity log.
- **Request Schema (`OSKDeleteBuildingActivityByIdRequest`)**:
  ```json
  {
    "buildingId": "string",
    "doorId": "string",
    "activityId": "string"
  }
  ```
- **Response Schema**: `HttpsResponse<void>`

### `deleteBuildingDoor`
- **Type**: `callable`
- **Description**: Deletes a door from a building.
- **Request Schema (`OSKBuildingDoorDeleteRequest`)**:
  ```json
  {
    "buildingId": "string",
    "doorId": "string",
    "adminsOrganizationId": "string"
  }
  ```
- **Response Schema**:
  ```json
  {
    "success": "boolean"
  }
  ```

### `deleteBuildingImage`
- **Type**: `callable`
- **Description**: Deletes a building's image from storage.
- **Request Schema (`deleteBuildingImageRequest`)**:
  ```json
  {
    "buildingId": "string",
    "filename": "string"
  }
  ```
- **Response Schema**: `void`

### `deleteBuildingSettings`
- **Type**: `callable`
- **Description**: Deletes a building's settings document and cascades deletion to user-specific settings.
- **Request Schema (`OSKBuildingDeleteOrResetSettingsRequest`)**:
  ```json
  {
    "buildingId": "string",
    "settingsId": "string"
  }
  ```
- **Response Schema**: `void`

### `deleteBuildingUnit`
- **Type**: `callable`
- **Description**: Deletes a unit and orchestrates the cleanup of its inhabitants and related data.
- **Request Schema (`OSKBuildingUnitDeleteRequest`)**:
  ```json
  {
    "adminsOrganizationId": "string",
    "buildingId": "string",
    "unitId": "string"
  }
  ```
- **Response Schema**:
  ```json
  {
    "message": "string"
  }
  ```

### `deleteIntercomDisplayName`
- **Type**: `callable`
- **Description**: Resets a manually changed intercom display name for a unit.
- **Request Schema (`OSKBuildingIntercomEntryDeleteRequest`)**:
  ```json
  {
    "organizationId": "string",
    "buildingId": "string",
    "entryId": "string"
  }
  ```
- **Response Schema**: `HttpsResponse`

### `deleteNonAppUser`
- **Type**: `callable`
- **Description**: Deletes a non-app user and all their associated access and PINs.
- **Request Schema (`OSKDeleteNonAppUserRequest`)**:
  ```json
  {
    "buildingId": "string",
    "unitId": "string",
    "nonAppUserId": "string"
  }
  ```
- **Response Schema**:
  ```json
  {
    "message": "string"
  }
  ```

### `getActivityById`
- **Type**: `callable`
- **Description**: Retrieves a single building activity log.
- **Request Schema (`OSKGetBuildingActivityByIdRequest`)**:
  ```json
  {
    "buildingId": "string",
    "doorId": "string",
    "activityId": "string"
  }
  ```
- **Response Schema (`OSKBuildingActivityDocument`)**:
  ```json
  {
    "activityId": "string",
    "accessControlDeviceId": "string",
    "acdType": "OSKAccessControlDeviceType",
    "timestamp": "Timestamp",
    "activityType": "OSKAccessControlDeviceActivityType",
    "userId": "string (optional)",
    "buildingId": "string",
    "buildingName": "string",
    "doorId": "string",
    "doorName": "string",
    "creationDate": "Timestamp",
    "id": "string"
  }
  ```

### `getAllBuildingActivities`
- **Type**: `callable`
- **Description**: Retrieves all activity logs for a specific door.
- **Request Schema (`OSKGetAllBuildingActivitiesRequest`)**:
  ```json
  {
    "buildingId": "string",
    "doorId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingActivityDocument[]`

### `getAllBuildings`
- **Type**: `callable`
- **Description**: Retrieves a list of all buildings for a given organization.
- **Request Schema (`OSKBuildingGetAllRequestData`)**:
  ```json
  {
    "organizationId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingDocument[]`

### `getAllNonAppUsers`
- **Type**: `callable`
- **Description**: Retrieves a list of all non-app users for a given unit.
- **Request Schema (`OSKGetAllNonAppUsersRequest`)**:
  ```json
  {
    "buildingId": "string",
    "unitId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingUnitNonAppUserDocument[]`

### `getBuildingById`
- **Type**: `callable`
- **Description**: Retrieves detailed information for a single building, including unit and door counts.
- **Request Schema (`OSKBuildingGetRequest`)**:
  ```json
  {
    "buildingId": "string",
    "organizationId": "string"
  }
  ```
- **Response Schema (`OSKBuildingDetailsResponseData`)**:
  ```json
  {
    "building": "OSKBuildingDocument",
    "unitsCount": "number",
    "doorsCount": "number"
  }
  ```

### `getBuildingsByPropertyId`
- **Type**: `callable`
- **Description**: Retrieves all buildings for a property, including their doors and ACDs.
- **Request Schema (`OSKBuildingGetAllByPropertyRequest`)**:
  ```json
  {
    "propertyId": "string",
    "organizationId": "string",
    "accessControlDeviceType": "string (optional)"
  }
  ```
- **Response Schema**: `OSKBuildingWithDoorsDocument[]`

### `getNonAppUser`
- **Type**: `callable`
- **Description**: Retrieves the details of a single non-app user.
- **Request Schema (`OSKGetNonAppUserRequest`)**:
  ```json
  {
    "buildingId": "string",
    "unitId": "string",
    "nonAppUserId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingUnitNonAppUserDocument`

### `getResidentSettings`
- **Type**: `callable`
- **Description**: Retrieves the settings for a specific building.
- **Request Schema (`OSKBuildingGetSettingsRequest`)**:
  ```json
  {
    "buildingId": "string",
    "settingsId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingSettingsDocument`

### `onUpdateBuildingIntercomsTransferList`
- **Type**: `callable`
- **Description**: Allows an authenticated user to update the call routing order for their unit.
- **Request Schema (`OSKIntercomCallTransferListRequest`)**:
  ```json
  {
    "userId": "string",
    "unitId": "string",
    "buildingId": "string",
    "callTransferList": "OSKIntercomCallTransferListItemFromApp[]"
  }
  ```
- **Response Schema**: `HttpsResponse`

### `organizationUserCreateBuildingDoor`
- **Type**: `callable`
- **Description**: Creates a new door in a building.
- **Request Schema (`OSKBuildingDoorCreateRequest`)**:
  ```json
  {
    "buildingId": "string",
    "name": "string",
    "streetAddress": "OSKStreetAddress",
    "isForAllResidents": "boolean",
    "organizationId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingDoorDocument`

### `organizationUserCreateBuildingUnit`
- **Type**: `callable`
- **Description**: Creates a new unit within a specified building.
- **Request Schema (`OSKBuildingUnitCreateRequest`)**:
  ```json
  {
    "organizationId": "string",
    "buildingId": "string",
    "name": "string",
    "floor": "string",
    "unitNumber": "string",
    "streetAddress": "OSKStreetAddress",
    "capacity": "number"
  }
  ```
- **Response Schema**: `OSKBuildingUnitDocument`

### `organizationUserGetAllBuildingDoors`
- **Type**: `callable`
- **Description**: Retrieves all doors for a given building.
- **Request Schema (`OSKBuildingDoorGetRequest`)**:
  ```json
  {
    "buildingId": "string",
    "organizationId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingDoorDocument[]`

### `organizationUserGetAllBuildingUnits`
- **Type**: `callable`
- **Description**: Retrieves all units associated with a specific building.
- **Request Schema**:
  ```json
  {
    "organizationId": "string",
    "buildingId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingUnitDocument[]`

### `organizationUserGetBuildingDoorById`
- **Type**: `callable`
- **Description**: Retrieves a single door by its ID.
- **Request Schema (`OSKBuildingDoorGetRequest`)**:
  ```json
  {
    "buildingId": "string",
    "doorId": "string",
    "adminsOrganizationId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingDoorDocument`

### `organizationUserGetBuildingUnitById`
- **Type**: `callable`
- **Description**: Retrieves a single unit by its ID.
- **Request Schema (`OSKBuildingUnitGetRequest`)**:
  ```json
  {
    "adminsOrganizationId": "string",
    "buildingId": "string",
    "unitId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingUnitDocument`

### `organizationUserUpdateBuildingDoor`
- **Type**: `callable`
- **Description**: Updates an existing door.
- **Request Schema (`OSKBuildingDoorUpdateRequest`)**:
  ```json
  {
    "buildingId": "string",
    "doorId": "string",
    "data": "Partial<OSKBuildingDoor>",
    "organizationId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingDoorDocument`

### `organizationUserUpdateBuildingUnit`
- **Type**: `callable`
- **Description**: Updates the details of an existing unit.
- **Request Schema (`OSKBuildingUnitUpdateRequest`)**:
  ```json
  {
    "organizationId": "string",
    "buildingId": "string",
    "unitId": "string",
    "data": {
      "name": "string (optional)",
      "floor": "string (optional)",
      "unitNumber": "string (optional)"
    }
  }
  ```
- **Response Schema**: `OSKBuildingUnitDocument`

### `resetBuildingSettings`
- **Type**: `callable`
- **Description**: Resets a building's settings to their default values.
- **Request Schema (`OSKBuildingDeleteOrResetSettingsRequest`)**:
  ```json
  {
    "buildingId": "string",
    "settingsId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingSettingsDocument`

### `updateBuilding`
- **Type**: `callable`
- **Description**: Updates the properties of an existing building.
- **Request Schema (`OSKBuildingUpdateRequest`)**:
  ```json
  {
    "buildingId": "string",
    "data": {
      "name": "string (optional)",
      "imageFilename": "string (optional)",
      "streetAddress": "OSKStreetAddress (optional)"
    },
    "organizationId": "string"
  }
  ```
- **Response Schema**: `OSKBuildingDocument`

### `updateBuildingSettings`
- **Type**: `callable`
- **Description**: Updates fields within a building's settings document and fans out changes.
- **Request Schema (`OSKBuildingUpdateSettingsRequest`)**:
  ```json
  {
    "buildingId": "string",
    "update": "Partial<OSKBuildingSettingsInputParams>"
  }
  ```
- **Response Schema**: `OSKBuildingSettingsDocument`

### `updateIntercomDisplayName`
- **Type**: `callable`
- **Description**: Allows an authenticated user to set a custom display name for their unit on the intercom.
- **Request Schema (`OSKBuildingIntercomDisplayNameRequest`)**:
  ```json
  {
    "buildingId": "string",
    "unitId": "string",
    "newDisplayName": "string"
  }
  ```
- **Response Schema**: `HttpsResponse`

### `updateNonAppUser`
- **Type**: `callable`
- **Description**: Updates the information for a non-app user.
- **Request Schema (`OSKUpdateNonAppUserRequest`)**:
  ```json
  {
    "buildingId": "string",
    "unitId": "string",
    "nonAppUserId": "string",
    "dataToUpdate": {
      "fullName": "string"
    }
  }
  ```
- **Response Schema**:
  ```json
  {
    "message": "string"
  }
  ```

### `updateNonAppUserAccessDoors`
- **Type**: `callable`
- **Description**: Updates the list of authorized doors for a non-app user's existing access grant.
- **Request Schema (`OSKUpdateNonAppUserAccessDoorsRequest`)**:
  ```json
  {
    "buildingId": "string",
    "unitId": "string",
    "nonAppUserId": "string",
    "accessId": "string",
    "doorIds": "string[]"
  }
  ```
- **Response Schema**:
  ```json
  {
    "message": "string"
  }
  ```

---
## Firestore Triggers

### `onDocumentCreated` on `accessControlDevices`
- **Type**: `firestore_trigger`
- **Binding**: `onCreate` on `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`
- **Description**: Triggers the assignment workflow for a new Access Control Device (ACD) to a door. This includes updating the ACD's main document, generating cryptographic keys, creating a versioned configuration, and creating an intercom directory entry.
- **Request Schema**: `DocumentSnapshot` of the created document.
- **Response Schema**: `Promise<void>`

### `onDocumentDeleted` on `accessControlDevices`
- **Type**: `firestore_trigger`
- **Binding**: `onDelete` on `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`
- **Description**: Triggers the cleanup workflow when an ACD is un-assigned from a door. This includes deleting public keys, un-assigning the door from the ACD's main document, and deleting all associated configuration documents.
- **Request Schema**: `DocumentSnapshot` of the deleted document.
- **Response Schema**: `Promise<void>`

### `onDocumentDeleted` on `building_user`
- **Type**: `firestore_trigger`
- **Binding**: `onDelete` on `/buildings/{buildingId}/users/{userId}`
- **Description**: Triggers the cleanup of related access documents in both building-centric (`/buildings/{buildingId}/accesses`) and user-centric (`/users/{userId}/accesses`) collections when a building-scoped user record is deleted.
- **Request Schema**: `DocumentSnapshot` of the deleted document.
- **Response Schema**: `Promise<void>`