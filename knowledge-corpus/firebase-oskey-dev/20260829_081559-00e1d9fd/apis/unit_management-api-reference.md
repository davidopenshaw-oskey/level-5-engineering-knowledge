### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:37:47.231Z
- repoName: firebase-oskey-dev
- targetModule: unit_management
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

#### Callable Cloud Functions
The capability exposes ten callable Cloud Functions as entry points for unit management operations `` `functions/src/modules/unit_management/index.ts` (lines 50-64) `` (**Confirmed**):

##### `createUnitInvitation`
- **Request Type**: `OSKUnitInvitation`
- **Response Type**: `OSKUnitInvitationCreationResponse`

##### `getAllUnitInhabitantsAndGuests`
- **Request Type**: `OSKUnitManagementGetUnitInhabitantsRequest`
- **Response Type**: `OSKInhabitantsAndGuestsListResponse`

##### `getPermanentGuest`
- **Request Type**: `OSKUnitManagementGetPermanentGuestRequest`
- **Response Type**: `OSKUnitManagementGetPermanentGuestResponse`

##### `getSingleUnitInhabitant`
- **Request Type**: `OSKUnitManagementGetSingleUnitInhabitantRequest`
- **Response Type**: `OSKSingleUnitInhabitantResponse`

##### `getUnitInvitationsByUserId`
- **Request Type**: `OSKUnitInvitationsGetByUserIdRequest`
- **Response Type**: `OSKUnitInvitation`

##### `getUnitPerson`
- **Request Type**: `OSKUnitManagementPeopleRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

##### `removeInhabitantFromUnit`
- **Request Type**: `OSKUnitManagementRemoveInhabitantRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

##### `removePendingInvitation`
- **Request Type**: `OSKUnitManagementRemovePendingInvitationRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

##### `removePermanentGuest`
- **Request Type**: `OSKUnitManagementRemovePermanentGuestRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

##### `updateInhabitant`
- **Request Type**: `OSKUnitManagementChangeInhabitantRequest`
- **Response Type**: *No matching `model_property` facts resolved to a unified response schema for this endpoint in this pack* (**Unknown**).

#### Firestore Triggers
- No Firestore triggers are owned or defined by this capability's pack (**Confirmed**).

---