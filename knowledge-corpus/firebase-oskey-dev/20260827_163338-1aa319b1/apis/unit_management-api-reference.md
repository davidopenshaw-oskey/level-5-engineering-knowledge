### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T16:42:09.733Z
- repoName: firebase-oskey-dev
- targetModule: unit_management
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### Callable Cloud Functions
The following callable APIs are exposed by this capability:

- **`createUnitInvitation`**: Creates a new unit invitation.
- **`getAllUnitInhabitantsAndGuests`**: Retrieves all inhabitants, permanent guests, non-app users, and pending invitations for a unit.
- **`getPermanentGuest`**: Retrieves details of a specific permanent guest.
- **`getSingleUnitInhabitant`**: Retrieves details of a specific unit inhabitant.
- **`getUnitInvitationsByUserId`**: Retrieves unit invitations for a user.
- **`getUnitPerson`**: Retrieves details of a specific unit person (inhabitant, permanent guest, non-app user, or pending invitee).
- **`removeInhabitantFromUnit`**: Removes an inhabitant from a unit.
- **`removePendingInvitation`**: Cancels a pending unit invitation.
- **`removePermanentGuest`**: Removes a permanent guest from a unit.
- **`updateInhabitant`**: Updates an inhabitant's role or rights.

### Resolved API Request/Response Schemas

#### `createUnitInvitation`
- **Request Type (`OSKUnitInvitation`)**:
  ```typescript
  {
    accessMethods?: OSKAccessMethod;
    buildingId: string;
    callForwarding?: string;
    confidentiality?: string;
    doors: OSKUserDoor[];
    firstName: string;
    invitees: OSKUnitInvitationInvitees[];
    inviterId: string;
    lastName: string;
    modificationDate?: any;
    unitId: string;
  }
  ```
- **Response Type (`OSKUnitInvitationCreationResponse`)**:
  ```typescript
  {
    accessId?: string | null;
    recordKey?: string;
    status?: string;
  }
  ```

#### `getAllUnitInhabitantsAndGuests`
- **Request Type (`OSKUnitManagementGetUnitInhabitantsRequest`)**:
  ```typescript
  {
    buildingId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type (`OSKInhabitantsAndGuestsListResponse`)**:
  ```typescript
  {
    firstName: string;
    inhabitantsAndPermGuests: OSKInhabitantsAndGuestsList[];
    inhabitantType: OSKBuildingUnitInhabitantType;
    lastName: string;
    nonAppUsers: OSKNonAppUsersList[];
    pendingInvites: OSKPendingInvitesList[];
    userAccessType: OSKUserAccessType.InhabitantUser;
    userId: string;
  }
  ```

#### `getPermanentGuest`
- **Request Type (`OSKUnitManagementGetPermanentGuestRequest`)**:
  ```typescript
  {
    buildingId: string;
    permanentGuestUserId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type (`OSKUnitManagementGetPermanentGuestResponse`)**:
  ```typescript
  {
    email: string;
    firstName: string;
    inviterId: string;
    lastName: string;
    phoneNumber: OSKPhoneNumber;
    pincodes: OSKUserPincodeDocument[];
    userAccessType: OSKUserAccessType.InhabitantPermanentGuestUser;
    userId: string;
  }
  ```

#### `getSingleUnitInhabitant`
- **Request Type (`OSKUnitManagementGetSingleUnitInhabitantRequest`)**:
  ```typescript
  {
    buildingId: string;
    inhabitantUserId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type (`OSKSingleUnitInhabitantResponse`)**:
  ```typescript
  {
    email: string;
    firstName: string;
    inhabitantType: OSKBuildingUnitInhabitantType;
    inviterId: string;
    lastName: string;
    phoneNumber: OSKPhoneNumber;
    pincodes: OSKUserPincodeDocument[];
    userAccessType: OSKUserAccessType.InhabitantUser;
    userId: string;
  }
  ```

#### `getUnitInvitationsByUserId`
- **Request Type (`OSKUnitInvitationsGetByUserIdRequest`)**:
  ```typescript
  {
    buildingId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type (`OSKUnitInvitation`)**:
  *(Same as `createUnitInvitation` request type)*

#### `getUnitPerson`
- **Request Type (`OSKUnitManagementPeopleRequest`)**:
  ```typescript
  {
    buildingId: string;
    callType: OSKUnitRequestType;
    emailOrPhone?: string;
    targetUserId?: string;
    unitId: string;
    userId: string;
    value?: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

#### `removeInhabitantFromUnit`
- **Request Type (`OSKUnitManagementRemoveInhabitantRequest`)**:
  ```typescript
  {
    buildingId: string;
    inhabitantToRemoveId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

#### `removePendingInvitation`
- **Request Type (`OSKUnitManagementRemovePendingInvitationRequest`)**:
  ```typescript
  {
    buildingId: string;
    emailOrPhone: "email" | "phone";
    inviterId: string;
    unitId: string;
    userId: string;
    value: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

#### `removePermanentGuest`
- **Request Type (`OSKUnitManagementRemovePermanentGuestRequest`)**:
  ```typescript
  {
    buildingId: string;
    permanentGuestUserId: string;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

#### `updateInhabitant`
- **Request Type (`OSKUnitManagementChangeInhabitantRequest`)**:
  ```typescript
  {
    buildingId: string;
    inhabitantToChangeUserId: string;
    newInhabitantType?: OSKBuildingUnitInhabitantType;
    residentRights?: OSKResidentRights;
    unitId: string;
    userId: string;
  }
  ```
- **Response Type**: *(No matching `model_property` facts resolved for this specific response type in the evidence pack)*

### Firestore Triggers
No Firestore triggers are owned or defined by this capability. **Confirmed** based on the absence of `firestore_trigger` facts in the evidence pack.

---