<!-- © Oskey SAS. All rights reserved. -->

# Module API Reference: core

*© Oskey SAS. All rights reserved.*

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Module** | `core` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_152205-1aa319b1` |
| **Exported Callables** | 14 |
| **Type Aliases / Enums** | 107 |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Status** | Completed & Grounded |

---

## 1. Executive API Summary

This document contains the verified API contracts, exported Cloud Function callables, request/response models, and data types for the `core` module.

---

## 2. HTTPS Callable Functions (14 Endpoints)

### `getAllUserAccesses`

- **Request Type**: `OSKUserAccessRequestAccessesGetAll`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/access/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |

### `getAllUserAccessesPerBuilding`

- **Request Type**: `OSKUserAccessRequestAccessesGetByBuilding`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/access/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |

### `onCreatePincodeAnonymousAccess`

- **Request Type**: `OSKCreatePincodeAnonymousAccessRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/access/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `userId` | `string` | No |
| `startDate` | `Date` | No |
| `endDate` | `Date` | No |
| `doorIds` | `string[] | undefined` | No |
| `isValidOnce` | `boolean | undefined` | No |

### `exchangeAuth0Token`

- **Request Type**: `OSKAuth0TokenRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/auth0/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `token` | `string` | No |

### `getUserPhoneNumber`

- **Request Type**: `OSKAuth0GetUserPhoneNumberRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/auth0/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |

### `getMfaPhoneNumber`

- **Request Type**: `OSKAuth0GetMFAPhoneNumberRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/auth0/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |

### `verifyOwnershipOTP`

- **Request Type**: `OSKAuth0VerifyOwnershipOTPRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/auth0/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `email` | `string` | No |
| `code` | `string` | No |

### `sendOTPEmail`

- **Request Type**: `OSKAuth0SendOTPCodeRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/auth0/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `email` | `string` | No |

### `enableMfa`

- **Request Type**: `OSKAuth0EnableMfaRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/auth0/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |

### `disableMfa`

- **Request Type**: `OSKAuth0DisableMfaRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/auth0/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |

### `syncMfaPhoneNumberToProfile`

- **Request Type**: `OSKAuth0SyncMfaPhoneNumberRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/auth0/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |

### `onGetCountries`

- **Request Type**: `Record<string, never>`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/country/index.ts` (Line undefined)

### `onGetCountriesNoAuth`

- **Request Type**: `Record<string, never>`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/country/index.ts` (Line undefined)

### `generateUploadSignedUrlCallable`

- **Request Type**: `GenerateUploadUrlRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/core/modules/storage/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `uploadType` | `UploadType` | No |
| `userId` | `string | undefined` | No |
| `buildingId` | `string | undefined` | No |
| `propertyId` | `string | undefined` | No |
| `organizationId` | `string | undefined` | No |
| `contentType` | `string` | No |

---

## 3. Data Models & Type Definitions (107 Types)

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKQueryFilter` | `{     field: FieldPath \| string;     op: WhereFilterOp;     // eslint-disable-next-line @typescript-eslint/no-explic...` | `functions/src/modules/core/controllers/document.controller.ts` |
| `OSKQueryOrderBy` | `{     field: FieldPath \| string;     direction?: FirebaseFirestore.OrderByDirection; }` | `functions/src/modules/core/controllers/document.controller.ts` |
| `OSKDocumentId` | `{ id: string }` | `functions/src/modules/core/models/documents/document_id.model.ts` |
| `OSKDocumentListElement` | `T & { id: string }` | `functions/src/modules/core/models/documents/document_list.model.ts` |
| `OSKDocumentList` | `OSKDocumentListElement<OSKDocumentData>[]` | `functions/src/modules/core/models/documents/document_list.model.ts` |
| `OSKDocumentFields` | `{     creationDate: Timestamp;     modificationDate?: Timestamp; }` | `functions/src/modules/core/models/documents/document.model.ts` |
| `OSKUploadData` | `{     documentId: string;     filename: string;     thumbnails: {         [size: number]: string;     };     contentT...` | `functions/src/modules/core/models/documents/document.model.ts` |
| `OSKDocument` | `T & OSKDocumentFields` | `functions/src/modules/core/models/documents/document.model.ts` |
| `OSKDocumentUpdate` | `UpdateData<OSKDocument<T>>` | `functions/src/modules/core/models/documents/document.model.ts` |
| `OSKPubSubMessage` | `{     message: {         attributes?: { [key: string]: string };         data: string; // Base64 encoded string      ...` | `functions/src/modules/core/models/documents/pub_sub_receiver.model.ts` |
| `OSKPubSubMessageData` | `\| {           type: 'state';           entity: OSKAccessControlDeviceStateDocument;       }     \| {           type:...` | `functions/src/modules/core/models/documents/pub_sub_receiver.model.ts` |
| `DeepPartial` | `{     [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]; }` | `functions/src/modules/core/models/shared/deep_partial.model.ts` |
| `OSKInsertEntityMessageOptions` | `{     operation: 'insert';     addedEntity: T; }` | `functions/src/modules/core/models/shared/entity_message.model.ts` |
| `OSKUpdateEntityMessageOptions` | `{     operation: 'update';     updatedEntity: T; }` | `functions/src/modules/core/models/shared/entity_message.model.ts` |
| `OSKDeleteEntityMessageOptions` | `{     operation: 'delete';     entityId: string;     authorizedDoors: OSKUserAuthorizedDoor[];     creationDate: Time...` | `functions/src/modules/core/models/shared/entity_message.model.ts` |
| `OSKEntityMessageOptions` | `\| OSKInsertEntityMessageOptions<T>     \| OSKUpdateEntityMessageOptions<T>     \| OSKDeleteEntityMessageOptions` | `functions/src/modules/core/models/shared/entity_message.model.ts` |
| `OSKPhoneNumber` | `{     isoCountryCode: string;     dialCode: string;     localPhoneNumber: string;     internationalPhoneNumber: strin...` | `functions/src/modules/core/models/shared/phone_number.model.ts` |
| `OSKCountry` | `{     name: string;     dialCode: string;     emoji: string;     isoCountryCode: string; }` | `functions/src/modules/core/models/shared/phone_number.model.ts` |
| `OSKSupportedLanguage` | `'en_US' \| 'fr_FR'` | `functions/src/modules/core/models/shared/supported_language.model.ts` |
| `OSKAccessMethod` | `\| {           type: 'mobile' \| 'watch' \| 'nfcTag';           deviceId: string;       }     \| {           type: 'p...` | `functions/src/modules/core/modules/access/models/access_method.model.ts` |
| `pincodeCharDigit` | `'0123456789'` | `functions/src/modules/core/modules/access/models/access_pincode_generation.model.ts` |
| `pincodeCharLetter` | `'ABC'` | `functions/src/modules/core/modules/access/models/access_pincode_generation.model.ts` |
| `pincodeCharSymbol` | `'#*'` | `functions/src/modules/core/modules/access/models/access_pincode_generation.model.ts` |
| `pincodeChar` | `pincodeCharDigit \| pincodeCharLetter \| pincodeCharSymbol` | `functions/src/modules/core/modules/access/models/access_pincode_generation.model.ts` |
| `OSKPincodeBase` | `{     pincode: string;     userId: string;     buildingId: string;     type: OSKPincodeType;     accessId: string; }` | `functions/src/modules/core/modules/access/models/access_pincode.model.ts` |
| `OSKPincodeInhabitantBase` | `OSKPincodeBase & {     type: OSKPincodeType.Inhabitant; }` | `functions/src/modules/core/modules/access/models/access_pincode.model.ts` |
| `OSKPincodeAnonymousBase` | `OSKPincodeBase & {     type: OSKPincodeType.Anonymous; }` | `functions/src/modules/core/modules/access/models/access_pincode.model.ts` |
| `OSKPincodeGuestBase` | `OSKPincodeBase & {     type: OSKPincodeType.Guest; }` | `functions/src/modules/core/modules/access/models/access_pincode.model.ts` |
| `OSKPincodePermanentGuestBase` | `OSKPincodeBase & {     type: OSKPincodeType.PermanentGuest; }` | `functions/src/modules/core/modules/access/models/access_pincode.model.ts` |
| `OSKPincodeSupplierBase` | `OSKPincodeBase & {     type: OSKPincodeType.Supplier; }` | `functions/src/modules/core/modules/access/models/access_pincode.model.ts` |
| `OSKAccessDailyToken` | `{     p: 1;     e?: number[]; }` | `functions/src/modules/core/modules/access/models/access_recurrence_token.model.ts` |
| `OSKAccessWeeklyToken` | `{     p: 2;     wd: {         m: boolean;         tu: boolean;         w: boolean;         th: boolean;         f: bo...` | `functions/src/modules/core/modules/access/models/access_recurrence_token.model.ts` |
| `OSKAccessMonthlyToken` | `{     p: 3;     md: number;     e?: number[]; }` | `functions/src/modules/core/modules/access/models/access_recurrence_token.model.ts` |
| `OSKAccessRecurrenceToken` | `OSKAccessDailyToken \| OSKAccessWeeklyToken \| OSKAccessMonthlyToken` | `functions/src/modules/core/modules/access/models/access_recurrence_token.model.ts` |
| `OSKAccessRecurrenceDaily` | `{     periodicity: 'daily';     exceptions?: { date: Timestamp }[]; }` | `functions/src/modules/core/modules/access/models/access_recurrence.model.ts` |
| `OSKAccessRecurrenceWeekly` | `{     periodicity: 'weekly';     onWeekDays: {         monday: boolean;         tuesday: boolean;         wednesday: ...` | `functions/src/modules/core/modules/access/models/access_recurrence.model.ts` |
| `OSKAccessRecurrenceMonthly` | `{     periodicity: 'monthly';     onMonthDay: number;     exceptions?: { date: Timestamp }[]; }` | `functions/src/modules/core/modules/access/models/access_recurrence.model.ts` |
| `OSKAccessRecurrence` | `OSKAccessRecurrenceDaily \| OSKAccessRecurrenceWeekly \| OSKAccessRecurrenceMonthly` | `functions/src/modules/core/modules/access/models/access_recurrence.model.ts` |
| `OSKOneTimeAccessRight` | `{     v: 1;     fd: number;     td: number; }` | `functions/src/modules/core/modules/access/models/access_right_token.model.ts` |
| `OSKPermanentAccess` | `{     v: 2; }` | `functions/src/modules/core/modules/access/models/access_right_token.model.ts` |
| `OSKRecurrentAccess` | `{     v: 3;     r: OSKAccessRecurrenceToken;     fd: number;     td: number; }` | `functions/src/modules/core/modules/access/models/access_right_token.model.ts` |
| `OSKAccessRightToken` | `OSKOneTimeAccessRight \| OSKPermanentAccess \| OSKRecurrentAccess` | `functions/src/modules/core/modules/access/models/access_right_token.model.ts` |
| `OSKAccessValidity` | `'oneTime' \| 'permanent' \| 'recurrent'` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightBaseWithoutDates` | `{     validity: OSKAccessValidity;     isValidOnce: boolean;     count?: number;     tolerency?: number;     recurren...` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightBaseWithDates` | `OSKAccessRightBaseWithoutDates & {     fromDate: T;     toDate: T; }` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightBaseOptionalDates` | `OSKAccessRightBaseWithoutDates & {     fromDate?: T;     toDate?: T; }` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightForPermanentBase` | `OSKAccessRightBaseOptionalDates<T> & {     validity: 'permanent';     isValidOnce: false; }` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightForOneTimeBase` | `OSKAccessRightBaseWithDates<T> & {     validity: 'oneTime';     isValidOnce: boolean; }` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightForGuestBase` | `OSKAccessRightBaseWithDates<T> & {     validity: 'oneTime' \| 'permanent';     isValidOnce: true; }` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightForPermanentGuestBase` | `OSKAccessRightBaseWithDates<T> & {     validity: 'permanent';     isValidOnce: false; }` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightForRecurrentBase` | `OSKAccessRightBaseWithDates<T> & {     validity: 'recurrent';     isValidOnce: false;     recurrence: OSKAccessRecurr...` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithTimestampForPermanent` | `OSKAccessRightForPermanentBase<Timestamp>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithTimestampForOneTime` | `OSKAccessRightForOneTimeBase<Timestamp>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithTimestampForGuest` | `OSKAccessRightForGuestBase<Timestamp>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithTimestampForPermanentGuest` | `OSKAccessRightForPermanentGuestBase<Timestamp>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithTimestampforRecurrent` | `OSKAccessRightForRecurrentBase<Timestamp>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithDatesForPermanent` | `OSKAccessRightForPermanentBase<Date>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithDatesForOneTime` | `OSKAccessRightForOneTimeBase<Date>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithDatesForPermanentGuest` | `OSKAccessRightForPermanentGuestBase<Date>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithDatesForGuest` | `OSKAccessRightForGuestBase<Date>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithDatesForRecurrent` | `OSKAccessRightForRecurrentBase<Date>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithStringsForPermanent` | `OSKAccessRightForPermanentBase<string>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithStringsForOneTime` | `OSKAccessRightForOneTimeBase<string>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithStringsForPermanentGuest` | `OSKAccessRightForPermanentGuestBase<string>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithStringsForGuest` | `OSKAccessRightForGuestBase<string>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithStringsForRecurrent` | `OSKAccessRightForRecurrentBase<string>` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithTimestamp` | `\| OSKAccessRightWithTimestampForPermanent     \| OSKAccessRightWithTimestampForOneTime     \| OSKAccessRightWithTime...` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithDates` | `\| OSKAccessRightWithDatesForPermanent     \| OSKAccessRightWithDatesForOneTime     \| OSKAccessRightWithDatesForPerm...` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKAccessRightWithStrings` | `\| OSKAccessRightWithStringsForPermanent     \| OSKAccessRightWithStringsForOneTime     \| OSKAccessRightWithStringsF...` | `functions/src/modules/core/modules/access/models/access_right.model.ts` |
| `OSKCompareAccessRight` | `{     validity: OSKAccessValidity;     isValidOnce: boolean;     fromDate?: Timestamp;     toDate?: Timestamp; }` | `functions/src/modules/core/modules/access/models/accesses.model.ts` |
| `OSKAccessRightsByDoors` | `{     doorId: string;     accessRights: OSKAccessRightWithTimestamp[]; }` | `functions/src/modules/core/modules/access/models/accesses.model.ts` |
| `OSKAccessMessageSetup` | `Pick<OSKAccess, 'accessId' \| 'accessRights' \| 'creationDate' \| 'isMainAccess'>` | `functions/src/modules/core/modules/access/models/functions/access_messages.model.ts` |
| `OSKAccessMessageInsert` | `Pick<OSKAccess, 'accessId' \| 'accessRights' \| 'creationDate' \| 'isMainAccess'> & {     operation: OSKAccessMessage...` | `functions/src/modules/core/modules/access/models/functions/access_messages.model.ts` |
| `OSKAccessMessageUpdate` | `Pick<OSKAccess, 'accessId' \| 'accessRights' \| 'creationDate' \| 'isMainAccess'> & {     operation: OSKAccessMessage...` | `functions/src/modules/core/modules/access/models/functions/access_messages.model.ts` |
| `OSKAccessMessageDelete` | `Pick<OSKAccess, 'accessId' \| 'creationDate'> & {     operation: OSKAccessMessageOperation.Delete; }` | `functions/src/modules/core/modules/access/models/functions/access_messages.model.ts` |
| `OSKAccessMessageRecreate` | `Pick<     OSKAccess,     'accessId' \| 'accessRights' \| 'creationDate' \| 'isMainAccess' > & {     userId: string; }` | `functions/src/modules/core/modules/access/models/functions/access_messages.model.ts` |
| `OSKAccessMessage` | `OSKAccessMessageInsert \| OSKAccessMessageUpdate \| OSKAccessMessageDelete` | `functions/src/modules/core/modules/access/models/functions/access_messages.model.ts` |
| `OSKCreatePincodeAnonymousAccessRequest` | `{     buildingId: string;     unitId: string;     userId: string;     startDate: Date;     endDate: Date;     doorIds...` | `functions/src/modules/core/modules/access/models/functions/access_pincode_request.model.ts` |
| `OSKDeletePincodeAnonymousAccessRequest` | `{ userId: string; pincodeId: string }` | `functions/src/modules/core/modules/access/models/functions/access_pincode_request.model.ts` |
| `UserContext` | `\| { category: 'oskUser' }     \| { category: 'supplierStaff'; supplierId: string }     \| { category: 'nonAppUser'; ...` | `functions/src/modules/core/modules/access/services/access_message_publisher.service.ts` |
| `OSKAuth0TokenRequest` | `{     token: string; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0ExchangeTokenResponse` | `{     firebaseToken: string;     newUser: boolean;     userId?: string; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0GetUserPhoneNumberRequest` | `{     userId: string; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0GetUserPhoneNumberResponse` | `{     phoneNumber: string \| null; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0GetMFAPhoneNumberResponse` | `{     phoneNumber: string; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0GetMFAPhoneNumberRequest` | `{     userId: string; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0VerifyOTPCodeResponse` | `{     access_token?: string;     id_token?: string;     scope?: string;     expires_in?: number; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0SendOTPCodeRequest` | `{     email: string; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0VerifyOwnershipOTPRequest` | `{     email: string;     code: string; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0VerifyOwnershipOTPResponse` | `{     verified: boolean; }` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKAuth0GetMFAPhoneNumberApiResponse` | `{     id: string;     type: string;     confirmed: string;     name: string;     last_auth: string;     created_at: s...` | `functions/src/modules/core/modules/auth0/models/functions/exchange_token_request.ts` |
| `OSKPublicKeys` | `{     defaultKeyId: string;     keys: Record<string, OSKPublicKey>; }` | `functions/src/modules/core/modules/public_key/models/documents/public_keys_document.model.ts` |
| `OSKPublicKeysDocument` | `OSKDocument<OSKPublicKeys>` | `functions/src/modules/core/modules/public_key/models/documents/public_keys_document.model.ts` |
| `OSKPublicKeyAddRequest` | `{     keyId: string;     publicKey: string; }` | `functions/src/modules/core/modules/public_key/models/functions/public_key_add_request.model.ts` |
| `OSKPublicKeyDeleteRequest` | `{     keyId: string; }` | `functions/src/modules/core/modules/public_key/models/functions/public_key_delete_request.model.ts` |
| `OSKPublicKey` | `{     publicKey: string;     publicKeyDecompressed: string;     creationDate: Timestamp; }` | `functions/src/modules/core/modules/public_key/models/shared/public_key.model.ts` |
| `OSKExec` | `(bucket: string, path: string, contentType: string) => Promise<void>` | `functions/src/modules/core/modules/storage/controllers/storage.controller.ts` |
| `UploadType` | `'userProfile' \| 'buildingImage' \| 'organizationLogo' \| 'propertyImage'` | `functions/src/modules/core/modules/storage/models/documents/storage_document.model.ts` |
| `GenerateUploadUrlRequest` | `{     uploadType: UploadType;     userId?: string;     buildingId?: string;     propertyId?: string;     organization...` | `functions/src/modules/core/modules/storage/models/functions/storage_request_document.model.ts` |
| `GenerateUploadUrlResponse` | `{     uploadUrl: string;     filePath: string; }` | `functions/src/modules/core/modules/storage/models/functions/storage_request_document.model.ts` |
| `OSKDocumentProtocol` | `WithFieldValue<DocumentData>` | `functions/src/modules/core/protocols/document.protocol.ts` |
| `OSKMessageProtocol` | `WithFieldValue<DocumentData>` | `functions/src/modules/core/protocols/message.protocol.ts` |
| `logSeverity` | `'DEFAULT' \| 'DEBUG' \| 'INFO' \| 'ERROR' \| 'WARNING' \| 'CRITICAL'` | `functions/src/modules/core/services/logging.service.ts` |
| `OSKLogHttpRequest` | `{     requestMethod?: string;     requestUrl?: string;     requestSize?: string;     status?: number;     responseSiz...` | `functions/src/modules/core/services/logging.service.ts` |
| `OSKLogDetails` | `\| string     \| ({           req?: Request;           res?: Response;           labels?: Record<string, string>;    ...` | `functions/src/modules/core/services/logging.service.ts` |
| `OSKLogJsonPayload` | `{     fullLogMessage?: string; } & Record<string, unknown>` | `functions/src/modules/core/services/logging.service.ts` |
| `OSKLogEntry` | `{     severity: logSeverity;     message: string;     stack_trace: string;     httpRequest?: OSKLogHttpRequest;     l...` | `functions/src/modules/core/services/logging.service.ts` |
