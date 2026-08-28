### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T16:55:08.880Z
- repoName: firebase-oskey-dev
- targetModule: unit_management
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

The following callable functions are exposed as public entry points by this capability `` `functions/src/modules/unit_management/index.ts` (lines 50-64) ``:

### `createUnitInvitation` [Confirmed]
- **Request Type**: `OSKUnitInvitation`
  ```typescript
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
  ```
- **Response Type**: `OSKUnitInvitationCreationResponse`
  ```typescript
  accessId?: string | null;
  recordKey?: string;
  status?: string;
  ```

### `getAllUnitInhabitantsAndGuests` [Confirmed]
- **Request Type**: `OSKUnitManagementGetUnitInhabitantsRequest`
  ```typescript
  buildingId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: `OSKInhabitantsAndGuestsListResponse`
  ```typescript
  firstName: string;
  inhabitantsAndPermGuests: OSKInhabitantsAndGuestsList[];
  inhabitantType: OSKBuildingUnitInhabitantType;
  lastName: string;
  nonAppUsers: OSKNonAppUsersList[];
  pendingInvites: OSKPendingInvitesList[];
  userAccessType: OSKUserAccessType.InhabitantUser;
  userId: string;
  ```

### `getPermanentGuest` [Confirmed]
- **Request Type**: `OSKUnitManagementGetPermanentGuestRequest`
  ```typescript
  buildingId: string;
  permanentGuestUserId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: `OSKUnitManagementGetPermanentGuestResponse`
  ```typescript
  email: string;
  firstName: string;
  inviterId: string;
  lastName: string;
  phoneNumber: OSKPhoneNumber;
  pincodes: OSKUserPincodeDocument[];
  userAccessType: OSKUserAccessType.InhabitantPermanentGuestUser;
  userId: string;
  ```

### `getSingleUnitInhabitant` [Confirmed]
- **Request Type**: `OSKUnitManagementGetSingleUnitInhabitantRequest`
  ```typescript
  buildingId: string;
  inhabitantUserId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: `OSKSingleUnitInhabitantResponse`
  ```typescript
  email: string;
  firstName: string;
  inhabitantType: OSKBuildingUnitInhabitantType;
  inviterId: string;
  lastName: string;
  phoneNumber: OSKPhoneNumber;
  pincodes: OSKUserPincodeDocument[];
  userAccessType: OSKUserAccessType.InhabitantUser;
  userId: string;
  ```

### `getUnitInvitationsByUserId` [Confirmed]
- **Request Type**: `OSKUnitInvitationsGetByUserIdRequest`
  ```typescript
  buildingId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: `OSKUnitInvitation`
  ```typescript
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
  ```

### `getUnitPerson` [Confirmed]
- **Request Type**: `OSKUnitManagementPeopleRequest`
  ```typescript
  buildingId: string;
  callType: OSKUnitRequestType;
  emailOrPhone?: string;
  targetUserId?: string;
  unitId: string;
  userId: string;
  value?: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

### `removeInhabitantFromUnit` [Confirmed]
- **Request Type**: `OSKUnitManagementRemoveInhabitantRequest`
  ```typescript
  buildingId: string;
  inhabitantToRemoveId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

### `removePendingInvitation` [Confirmed]
- **Request Type**: `OSKUnitManagementRemovePendingInvitationRequest`
  ```typescript
  buildingId: string;
  emailOrPhone: "email" | "phone";
  inviterId: string;
  unitId: string;
  userId: string;
  value: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

### `removePermanentGuest` [Confirmed]
- **Request Type**: `OSKUnitManagementRemovePermanentGuestRequest`
  ```typescript
  buildingId: string;
  permanentGuestUserId: string;
  unitId: string;
  userId: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

### `updateInhabitant` [Confirmed]
- **Request Type**: `OSKUnitManagementChangeInhabitantRequest`
  ```typescript
  buildingId: string;
  inhabitantToChangeUserId: string;
  newInhabitantType?: OSKBuildingUnitInhabitantType;
  residentRights?: OSKResidentRights;
  unitId: string;
  userId: string;
  ```
- **Response Type**: No matching `model_property` facts within this pack.

---