# Generated Firestore Staging Schema Map

*Generated automatically on: 2026-06-01T08:54:03.258Z*

---

## Collection Path: `/EmailLogs`

### Fields:
* **emailDocId**: *string*
* **sender**: *string*
* **recipients**: *array*
* **text**: *string*
* **html**: *string*
* **creationDate**: *timestamp*
* **messageId**: *string*
* **envelope**: *string*
* **accepted**: *string*
* **rejected**: *string*
* **pending**: *string*
* **response**: *string*

---

## Collection Path: `/accessControlDevices/{id}/configs`

### Fields:
* **accessControlDeviceId**: *string*
* **doorInfo.buildingId**: *string*
* **doorInfo.doorId**: *string*
* **doorInfo.name**: *string*
* **doorInfo.streetAddress.streetName**: *string*
* **doorInfo.streetAddress.houseNumber**: *string*
* **doorInfo.streetAddress.postalCode**: *string*
* **doorInfo.streetAddress.city**: *string*
* **doorInfo.streetAddress.country**: *string*
* **doorInfo.streetAddress.isoCountryCode**: *string*
* **doorInfo.streetAddress.coordinate.latitude**: *number*
* **doorInfo.streetAddress.coordinate.longitude**: *number*
* **accessCode.keyboardFormat**: *string*
* **accessCode.codeLength**: *number*
* **accessCode.waitTimeBeforeRetry**: *number*
* **accessCode.waitTimeAfter10Retries**: *number*
* **doorManagement.durationForDoorOpening**: *number*
* **cloud.publicKey**: *string*
* **creationDate**: *timestamp*
* **modificationDate**: *timestamp*
* **homeScreen.message.communicationId**: *string*
* **homeScreen.message.homeInfos**: *array*
* **homeScreen.message.schedule.startDate**: *timestamp*
* **homeScreen.message.priority**: *string*

---

## Collection Path: `/accessControlDevices/{id}/publicKeys`

### Fields:
* **defaultKeyId**: *string*
* **creationDate**: *timestamp*
* **keys.1.publicKey**: *string*
* **keys.1.publicKeyDecompressed**: *string*
* **keys.1.creationDate**: *timestamp*

---

## Collection Path: `/accessControlDevices`

### Fields:
* **accessControlDeviceId**: *string*
* **accessControlDeviceIdShort**: *string*
* **accessControlDeviceType**: *string*
* **manufacturingDate**: *timestamp*
* **stats.accessGrantedCounts**: *number*
* **stats.accessRejectedCounts**: *number*
* **stats.lastDays**: *array*
* **stats.lastHours**: *array*
* **creationDate**: *timestamp*
* **buildingDoorAssignment.buildingId**: *string*
* **buildingDoorAssignment.doorId**: *string*
* **activationDate**: *timestamp*
* **modificationDate**: *timestamp*

---

## Collection Path: `/buildings/{id}/doors`

### Fields:
* **buildingId**: *string*
* **doorId**: *string*
* **name**: *string*
* **isForAllResidents**: *boolean*
* **streetAddress.streetName**: *string*
* **streetAddress.houseNumber**: *string*
* **streetAddress.postalCode**: *string*
* **streetAddress.city**: *string*
* **streetAddress.country**: *string*
* **streetAddress.isoCountryCode**: *string*
* **streetAddress.coordinate.latitude**: *number*
* **streetAddress.coordinate.longitude**: *number*
* **creationDate**: *timestamp*

---

## Collection Path: `/buildings/{id}/settings`

### Fields:
* **creationDate**: *timestamp*
* **modificationDate**: *timestamp*
* **id**: *string*
* **buildingId.value**: *string*
* **buildingId.metadata.canBeChanged**: *boolean*
* **buildingId.metadata.isRequired**: *boolean*
* **buildingId.metadata.description**: *string*
* **buildingId.metadata.refParentObject**: *string*
* **buildingId.metadata.updateChildObject**: *string*
* **buildingId.metadata.validationRegex**: *string*
* **accessMethods.value.bluetooth**: *boolean*
* **accessMethods.value.pinCode**: *boolean*
* **accessMethods.value.faceRec**: *boolean*
* **accessMethods.value.NFC**: *boolean*
* **accessMethods.value.sesame**: *boolean*
* **accessMethods.metadata.canBeChanged**: *boolean*
* **accessMethods.metadata.isRequired**: *boolean*
* **accessMethods.metadata.description**: *string*
* **accessMethods.metadata.refParentObject**: *string*
* **accessMethods.metadata.updateChildObject**: *string*
* **accessMethods.metadata.validationRegex**: *string*
* **inhabitantPinCodeType.value**: *string*
* **inhabitantPinCodeType.metadata.canBeChanged**: *boolean*
* **inhabitantPinCodeType.metadata.isRequired**: *boolean*
* **inhabitantPinCodeType.metadata.description**: *string*
* **inhabitantPinCodeType.metadata.refParentObject**: *string*
* **inhabitantPinCodeType.metadata.updateChildObject**: *string*
* **inhabitantPinCodeType.metadata.validationRegex**: *string*
* **refreshCodeFrequency.value**: *number*
* **refreshCodeFrequency.metadata.canBeChanged**: *boolean*
* **refreshCodeFrequency.metadata.isRequired**: *boolean*
* **refreshCodeFrequency.metadata.description**: *string*
* **refreshCodeFrequency.metadata.refParentObject**: *string*
* **refreshCodeFrequency.metadata.updateChildObject**: *string*
* **refreshCodeFrequency.metadata.validationRegex**: *string*
* **invitationAccessMethods.value.bluetooth**: *boolean*
* **invitationAccessMethods.value.pinCode**: *boolean*
* **invitationAccessMethods.value.faceRec**: *boolean*
* **invitationAccessMethods.value.NFC**: *boolean*
* **invitationAccessMethods.value.sesame**: *boolean*
* **invitationAccessMethods.metadata.canBeChanged**: *boolean*
* **invitationAccessMethods.metadata.isRequired**: *boolean*
* **invitationAccessMethods.metadata.description**: *string*
* **invitationAccessMethods.metadata.refParentObject**: *string*
* **invitationAccessMethods.metadata.updateChildObject**: *string*
* **invitationAccessMethods.metadata.validationRegex**: *string*
* **allowQuickcodes.value**: *boolean*
* **allowQuickcodes.metadata.canBeChanged**: *boolean*
* **allowQuickcodes.metadata.isRequired**: *boolean*
* **allowQuickcodes.metadata.description**: *string*
* **allowQuickcodes.metadata.refParentObject**: *string*
* **allowQuickcodes.metadata.updateChildObject**: *string*
* **allowQuickcodes.metadata.validationRegex**: *string*
* **numberOfEntries.value**: *string*
* **numberOfEntries.metadata.canBeChanged**: *boolean*
* **numberOfEntries.metadata.isRequired**: *boolean*
* **numberOfEntries.metadata.description**: *string*
* **numberOfEntries.metadata.refParentObject**: *string*
* **numberOfEntries.metadata.updateChildObject**: *string*
* **numberOfEntries.metadata.validationRegex**: *string*
* **periodOfValidity.value**: *string*
* **periodOfValidity.metadata.canBeChanged**: *boolean*
* **periodOfValidity.metadata.isRequired**: *boolean*
* **periodOfValidity.metadata.description**: *string*
* **periodOfValidity.metadata.refParentObject**: *string*
* **periodOfValidity.metadata.updateChildObject**: *string*
* **periodOfValidity.metadata.validationRegex**: *string*
* **externalUserPinCodeType.value**: *string*
* **externalUserPinCodeType.metadata.canBeChanged**: *boolean*
* **externalUserPinCodeType.metadata.isRequired**: *boolean*
* **externalUserPinCodeType.metadata.description**: *string*
* **externalUserPinCodeType.metadata.refParentObject**: *string*
* **externalUserPinCodeType.metadata.updateChildObject**: *string*
* **externalUserPinCodeType.metadata.validationRegex**: *string*
* **validationTime.value**: *number*
* **validationTime.metadata.canBeChanged**: *boolean*
* **validationTime.metadata.isRequired**: *boolean*
* **validationTime.metadata.description**: *string*
* **validationTime.metadata.refParentObject**: *string*
* **validationTime.metadata.updateChildObject**: *string*
* **validationTime.metadata.validationRegex**: *string*
* **allowResidentAddition.value**: *boolean*
* **allowResidentAddition.metadata.canBeChanged**: *boolean*
* **allowResidentAddition.metadata.isRequired**: *boolean*
* **allowResidentAddition.metadata.description**: *string*
* **allowResidentAddition.metadata.refParentObject**: *string*
* **allowResidentAddition.metadata.updateChildObject**: *string*
* **allowResidentAddition.metadata.validationRegex**: *string*
* **allowCoResidentAddition.value**: *boolean*
* **allowCoResidentAddition.metadata.canBeChanged**: *boolean*
* **allowCoResidentAddition.metadata.isRequired**: *boolean*
* **allowCoResidentAddition.metadata.description**: *string*
* **allowCoResidentAddition.metadata.refParentObject**: *string*
* **allowCoResidentAddition.metadata.updateChildObject**: *string*
* **allowCoResidentAddition.metadata.validationRegex**: *string*
* **allowResidentsToSendInvitations.value**: *boolean*
* **allowResidentsToSendInvitations.metadata.canBeChanged**: *boolean*
* **allowResidentsToSendInvitations.metadata.isRequired**: *boolean*
* **allowResidentsToSendInvitations.metadata.description**: *string*
* **allowResidentsToSendInvitations.metadata.refParentObject**: *string*
* **allowResidentsToSendInvitations.metadata.updateChildObject**: *string*
* **allowResidentsToSendInvitations.metadata.validationRegex**: *string*
* **allowPermanentGuestsInvitations.value**: *boolean*
* **allowPermanentGuestsInvitations.metadata.canBeChanged**: *boolean*
* **allowPermanentGuestsInvitations.metadata.isRequired**: *boolean*
* **allowPermanentGuestsInvitations.metadata.description**: *string*
* **allowPermanentGuestsInvitations.metadata.refParentObject**: *string*
* **allowPermanentGuestsInvitations.metadata.updateChildObject**: *string*
* **allowPermanentGuestsInvitations.metadata.validationRegex**: *string*
* **allowCloseOnesInvitations.value**: *boolean*
* **allowCloseOnesInvitations.metadata.canBeChanged**: *boolean*
* **allowCloseOnesInvitations.metadata.isRequired**: *boolean*
* **allowCloseOnesInvitations.metadata.description**: *string*
* **allowCloseOnesInvitations.metadata.refParentObject**: *string*
* **allowCloseOnesInvitations.metadata.updateChildObject**: *string*
* **allowCloseOnesInvitations.metadata.validationRegex**: *string*
* **permittedInvitationDoors.value**: *array*
* **permittedInvitationDoors.metadata.canBeChanged**: *boolean*
* **permittedInvitationDoors.metadata.isRequired**: *boolean*
* **permittedInvitationDoors.metadata.description**: *string*
* **permittedInvitationDoors.metadata.refParentObject**: *string*
* **permittedInvitationDoors.metadata.updateChildObject**: *string*
* **permittedInvitationDoors.metadata.validationRegex**: *string*
* **allowIntercomDisplayName.value**: *boolean*
* **allowIntercomDisplayName.metadata.canBeChanged**: *boolean*
* **allowIntercomDisplayName.metadata.isRequired**: *boolean*
* **allowIntercomDisplayName.metadata.description**: *string*
* **allowIntercomDisplayName.metadata.refParentObject**: *string*
* **allowIntercomDisplayName.metadata.updateChildObject**: *string*
* **allowIntercomDisplayName.metadata.validationRegex**: *string*
* **allowUnitNumber.value**: *boolean*
* **allowUnitNumber.metadata.canBeChanged**: *boolean*
* **allowUnitNumber.metadata.isRequired**: *boolean*
* **allowUnitNumber.metadata.description**: *string*
* **allowUnitNumber.metadata.refParentObject**: *string*
* **allowUnitNumber.metadata.updateChildObject**: *string*
* **allowUnitNumber.metadata.validationRegex**: *string*

---

## Collection Path: `/buildings/{id}/accesses`

### Fields:
* **creationDate**: *timestamp*
* **buildingId**: *string*
* **userId**: *string*
* **userLastName**: *string*
* **userFirstName**: *string*
* **accesses**: *array*

---

## Collection Path: `/buildings/{id}/callTransferList`

### Fields:
* **buildingId**: *string*
* **intercomId**: *string*
* **unitId**: *string*
* **callTransferList**: *array*
* **creationDate**: *timestamp*

---

## Collection Path: `/buildings/{id}/intercoms`

### Fields:
* **accessControlDeviceId**: *string*
* **buildingId**: *string*
* **doorId**: *string*
* **ACDName**: *string*
* **doorName**: *string*
* **creationDate**: *timestamp*
* **modificationDate**: *timestamp*
* **intercomEntries**: *array*

---

## Collection Path: `/buildings/{id}/pincodes`

### Fields:
* **doors**: *array*
* **pincode**: *string*
* **userId**: *string*
* **type**: *string*
* **unitId**: *string*
* **buildingId**: *string*
* **creationDate**: *timestamp*
* **accessId**: *string*

---

## Collection Path: `/buildings/{id}/units/{id}/inhabitants`

### Fields:
* **userId**: *string*
* **inhabitantAccessId**: *string*
* **streetAddress.isoCountryCode**: *string*
* **streetAddress.postalCode**: *string*
* **streetAddress.country**: *string*
* **streetAddress.coordinate.longitude**: *number*
* **streetAddress.coordinate.latitude**: *number*
* **streetAddress.city**: *string*
* **streetAddress.streetName**: *string*
* **streetAddress.houseNumber**: *string*
* **firstName**: *string*
* **unitId**: *string*
* **buildingId**: *string*
* **creationDate**: *timestamp*
* **lastName**: *string*
* **inviterId**: *string*
* **doors**: *array*
* **inhabitantType**: *string*

---

## Collection Path: `/buildings/{id}/units`

### Fields:
* **name**: *string*
* **buildingName**: *string*
* **creationDate**: *timestamp*
* **streetAddress.isoCountryCode**: *string*
* **streetAddress.city**: *string*
* **streetAddress.country**: *string*
* **streetAddress.houseNumber**: *string*
* **streetAddress.postalCode**: *string*
* **streetAddress.coordinate.longitude**: *number*
* **streetAddress.coordinate.latitude**: *number*
* **streetAddress.streetName**: *string*
* **buildingId**: *string*
* **floor**: *string*
* **unitId**: *string*
* **unitNumber**: *string*
* **modificationDate**: *timestamp*

---

## Collection Path: `/buildings`

### Fields:
* **buildingId**: *string*
* **propertyId**: *string*
* **organizationId**: *string*
* **name**: *string*
* **streetAddress.streetName**: *string*
* **streetAddress.houseNumber**: *string*
* **streetAddress.postalCode**: *string*
* **streetAddress.city**: *string*
* **streetAddress.country**: *string*
* **streetAddress.isoCountryCode**: *string*
* **streetAddress.coordinate.latitude**: *number*
* **streetAddress.coordinate.longitude**: *number*
* **creationDate**: *timestamp*
* **imageFilename**: *string*

---

## Collection Path: `/calls`

### Fields:
* **callId**: *string*
* **externalCallId**: *string*
* **callerId**: *string*
* **callerType**: *string*
* **buildingId**: *string*
* **unitId**: *string*
* **contactId**: *string*
* **iceServers.urlStrings**: *array*
* **iceServers.username**: *string*
* **iceServers.credentials**: *string*
* **creationDate**: *timestamp*
* **callPictureName**: *string*
* **callTransferList**: *array*
* **modificationDate**: *timestamp*
* **events**: *array*
* **status**: *string*

---

## Collection Path: `/entities`

### Fields:
* **organizationId**: *string*
* **entityId**: *string*
* **entityName**: *string*
* **entityType**: *string*
* **parentEntityId**: *string*
* **creationDate**: *timestamp*
* **modificationDate**: *timestamp*
* **propertiesIds**: *array*
* **modificatinDate**: *timestamp*
* **subEntityIds**: *array*

---

## Collection Path: `/organizations/{id}/buildings`

### Fields:
* **buildingId**: *string*
* **organizationId**: *string*
* **buildingName**: *string*
* **creationDate**: *timestamp*
* **organizationdId**: *string*

---

## Collection Path: `/organizations/{id}/onboardingInhabitants`

### Fields:
* **onboardingId**: *string*
* **inviterId**: *string*
* **firstName**: *string*
* **lastName**: *string*
* **contactDetails.email**: *string*
* **contactDetails.internationalPhoneNumber.isoCountryCode**: *string*
* **contactDetails.internationalPhoneNumber.dialCode**: *string*
* **contactDetails.internationalPhoneNumber.internationalPhoneNumber**: *string*
* **contactDetails.internationalPhoneNumber.localPhoneNumber**: *string*
* **organizationId**: *string*
* **buildingId**: *string*
* **contactIdentifiers**: *array*
* **doors**: *array*
* **unitId**: *string*
* **creationDate**: *timestamp*
* **expiryDateActivationCode**: *timestamp*
* **expiryDateSms**: *timestamp*
* **phoneVerified**: *boolean*
* **smsOtp**: *number*
* **activationCode**: *string*
* **emailVerified**: *boolean*
* **identityVerified**: *boolean*
* **onboardingQRCode**: *string*
* **isUpdated**: *boolean*
* **updatedFields.firstName**: *string*
* **updatedFields.lastName**: *string*
* **updatedFields.email**: *string*
* **updatedFields.phoneNumber**: *string*
* **linksUrl.androidStore**: *string*
* **linksUrl.appleStore**: *string*
* **accessType**: *string*
* **accessRights**: *array*
* **isOnboarded**: *boolean*
* **inhabitantType**: *string*

---

## Collection Path: `/organizations/{id}/promptTemplates`

### Fields:
* **promptName**: *string*
* **modificationDate**: *timestamp*
* **creationDate**: *timestamp*
* **promptTemplate**: *string*
* **organizationId**: *string*

---

## Collection Path: `/organizations/{id}/residents`

### Fields:
* **residentId**: *string*
* **firstName**: *string*
* **lastName**: *string*
* **email**: *string*
* **streetAddress.houseNumber**: *string*
* **streetAddress.streetName**: *string*
* **streetAddress.postalCode**: *string*
* **streetAddress.city**: *string*
* **streetAddress.country**: *string*
* **streetAddress.isoCountryCode**: *string*
* **streetAddress.coordinate.latitude**: *number*
* **streetAddress.coordinate.longitude**: *number*
* **inhabitantType**: *string*
* **buildingId**: *string*
* **unitId**: *string*
* **buildingName**: *string*
* **unitName**: *string*
* **floor**: *string*
* **unitNumber**: *string*
* **organizationId**: *string*
* **isUserConsent**: *boolean*
* **isAppUser**: *boolean*
* **sesame**: *boolean*
* **userId**: *string*
* **isOnboarded**: *boolean*
* **activationCode**: *string*
* **creationDate**: *timestamp*
* **isUpdated**: *boolean*
* **accessRights**: *array*
* **phoneNumber.isoCountryCode**: *string*
* **phoneNumber.dialCode**: *string*
* **phoneNumber.internationalPhoneNumber**: *string*
* **phoneNumber.localPhoneNumber**: *string*
* **modificationDate**: *timestamp*
* **pinCodes.pincode**: *string*
* **pinCodes.userId**: *string*
* **pinCodes.buildingId**: *string*
* **pinCodes.accessId**: *string*
* **pinCodes.type**: *string*
* **pinCodes.creationDate**: *timestamp*

---

## Collection Path: `/organizations/{id}/users`

### Fields:
* **email**: *string*
* **userId**: *string*
* **organizationId**: *string*
* **firstName**: *string*
* **lastName**: *string*
* **assignedRoles**: *array*
* **creationDate**: *timestamp*
* **roles**: *array*

---

## Collection Path: `/organizations/{id}/userInvitations`

### Fields:
* **email**: *string*
* **organizationId**: *string*
* **organizationName**: *string*
* **firstName**: *string*
* **phoneNumber.isoCountryCode**: *string*
* **phoneNumber.dialCode**: *string*
* **phoneNumber.internationalPhoneNumber**: *string*
* **phoneNumber.localPhoneNumber**: *string*
* **lastName**: *string*
* **roles**: *array*
* **sender.userId**: *string*
* **sender.firstName**: *string*
* **sender.lastName**: *string*
* **creationDate**: *timestamp*
* **expirationDate**: *timestamp*

---

## Collection Path: `/organizations/{id}/userInvitationsCancelled`

### Fields:
* **email**: *string*
* **userId**: *string*
* **organizationId**: *string*
* **firstName**: *string*
* **lastName**: *string*
* **organizationName**: *string*
* **roles**: *array*
* **cancellationDate**: *timestamp*
* **sender.userId**: *string*
* **sender.firstName**: *string*
* **sender.lastName**: *string*
* **creationDate**: *timestamp*

---

## Collection Path: `/organizations`

### Fields:
* **isoCountryCode**: *string*
* **taxNumber**: *string*
* **tenant**: *string*
* **streetAddress.houseNumber**: *string*
* **streetAddress.streetName**: *string*
* **streetAddress.postalCode**: *string*
* **streetAddress.city**: *string*
* **streetAddress.country**: *string*
* **streetAddress.isoCountryCode**: *string*
* **streetAddress.coordinate.latitude**: *number*
* **streetAddress.coordinate.longitude**: *number*
* **creationDate**: *timestamp*
* **name**: *string*
* **userRoles**: *array*
* **entityP**: *string*

---

## Collection Path: `/properties`

### Fields:
* **organizationId**: *string*
* **entityId**: *string*
* **propertyId**: *string*
* **propertyName**: *string*
* **streetAddress.houseNumber**: *string*
* **streetAddress.streetName**: *string*
* **streetAddress.postalCode**: *string*
* **streetAddress.city**: *string*
* **streetAddress.country**: *string*
* **streetAddress.isoCountryCode**: *string*
* **streetAddress.coordinate.latitude**: *number*
* **streetAddress.coordinate.longitude**: *number*
* **managementType**: *string*
* **propertyType**: *string*
* **buildings**: *array*
* **creationDate**: *timestamp*
* **modificationDate**: *timestamp*

---

## Collection Path: `/settings/{id}/compositeRoles`

### Fields:
* **title.en**: *string*
* **title.fr**: *string*
* **description.en**: *string*
* **description.fr**: *string*
* **parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.title.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.title.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.description.en**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.description.fr**: *string*
* **compositeRoles.v1.admin.settings.admin.compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.org.admin.title.en**: *string*
* **compositeRoles.v1.admin.org.admin.title.fr**: *string*
* **compositeRoles.v1.admin.org.admin.description.en**: *string*
* **compositeRoles.v1.admin.org.admin.description.fr**: *string*
* **compositeRoles.v1.admin.org.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.list.title.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.list.title.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.list.description.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.list.description.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.view.title.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.view.title.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.view.description.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.view.description.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.register.title.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.register.title.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.register.description.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.register.description.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.register.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.edit.title.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.edit.title.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.edit.description.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.edit.description.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.edit.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.delete.title.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.delete.title.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.delete.description.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.delete.description.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.delete.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.validate.title.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.validate.title.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.validate.description.en**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.validate.description.fr**: *string*
* **compositeRoles.v1.admin.org.admin.roles.v1.admin.org.validate.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.building.admin.title.en**: *string*
* **compositeRoles.v1.admin.building.admin.title.fr**: *string*
* **compositeRoles.v1.admin.building.admin.description.en**: *string*
* **compositeRoles.v1.admin.building.admin.description.fr**: *string*
* **compositeRoles.v1.admin.building.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.list.title.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.list.title.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.list.description.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.list.description.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.view.title.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.view.title.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.view.description.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.view.description.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.register.title.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.register.title.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.register.description.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.register.description.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.register.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.edit.title.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.edit.title.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.edit.description.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.edit.description.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.edit.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.delete.title.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.delete.title.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.delete.description.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.delete.description.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.delete.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.validate.title.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.validate.title.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.validate.description.en**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.validate.description.fr**: *string*
* **compositeRoles.v1.admin.building.admin.roles.v1.admin.building.validate.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.accessControlDevice.admin.title.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.title.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.description.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.description.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.list.title.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.list.title.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.list.description.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.list.description.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.view.title.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.view.title.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.view.description.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.view.description.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.register.title.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.register.title.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.register.description.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.register.description.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.register.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.edit.title.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.edit.title.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.edit.description.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.edit.description.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.edit.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.delete.title.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.delete.title.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.delete.description.en**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.delete.description.fr**: *string*
* **compositeRoles.v1.admin.accessControlDevice.admin.roles.v1.admin.accessControlDevice.delete.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.list.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.list.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.list.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.list.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.view.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.view.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.view.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.view.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.edit.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.edit.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.edit.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.edit.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.edit.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.delete.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.delete.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.delete.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.delete.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.devices.admin.roles.v1.admin.user.devices.delete.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.list.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.list.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.list.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.list.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.view.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.view.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.view.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.view.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.delete.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.delete.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.delete.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.delete.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.invitations.admin.roles.v1.admin.user.invitations.delete.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.list.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.list.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.list.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.list.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.view.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.view.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.view.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.view.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.create.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.create.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.create.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.create.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.create.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.delete.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.delete.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.delete.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.delete.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.compositeRoles.v1.admin.user.accesses.admin.roles.v1.admin.user.accesses.delete.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.list.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.list.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.list.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.list.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.view.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.view.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.view.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.view.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.edit.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.edit.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.edit.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.edit.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.edit.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.delete.title.en**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.delete.title.fr**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.delete.description.en**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.delete.description.fr**: *string*
* **compositeRoles.v1.admin.user.admin.roles.v1.admin.user.delete.parentCompositeRoles**: *array*
* **creationDate**: *timestamp*
* **roles.v1.admin.accessControlDevice.list.title.en**: *string*
* **roles.v1.admin.accessControlDevice.list.title.fr**: *string*
* **roles.v1.admin.accessControlDevice.list.description.en**: *string*
* **roles.v1.admin.accessControlDevice.list.description.fr**: *string*
* **roles.v1.admin.accessControlDevice.list.parentCompositeRoles**: *array*
* **roles.v1.admin.accessControlDevice.view.title.en**: *string*
* **roles.v1.admin.accessControlDevice.view.title.fr**: *string*
* **roles.v1.admin.accessControlDevice.view.description.en**: *string*
* **roles.v1.admin.accessControlDevice.view.description.fr**: *string*
* **roles.v1.admin.accessControlDevice.view.parentCompositeRoles**: *array*
* **roles.v1.admin.accessControlDevice.register.title.en**: *string*
* **roles.v1.admin.accessControlDevice.register.title.fr**: *string*
* **roles.v1.admin.accessControlDevice.register.description.en**: *string*
* **roles.v1.admin.accessControlDevice.register.description.fr**: *string*
* **roles.v1.admin.accessControlDevice.register.parentCompositeRoles**: *array*
* **roles.v1.admin.accessControlDevice.edit.title.en**: *string*
* **roles.v1.admin.accessControlDevice.edit.title.fr**: *string*
* **roles.v1.admin.accessControlDevice.edit.description.en**: *string*
* **roles.v1.admin.accessControlDevice.edit.description.fr**: *string*
* **roles.v1.admin.accessControlDevice.edit.parentCompositeRoles**: *array*
* **roles.v1.admin.accessControlDevice.delete.title.en**: *string*
* **roles.v1.admin.accessControlDevice.delete.title.fr**: *string*
* **roles.v1.admin.accessControlDevice.delete.description.en**: *string*
* **roles.v1.admin.accessControlDevice.delete.description.fr**: *string*
* **roles.v1.admin.accessControlDevice.delete.parentCompositeRoles**: *array*
* **roles.v1.admin.building.list.title.en**: *string*
* **roles.v1.admin.building.list.title.fr**: *string*
* **roles.v1.admin.building.list.description.en**: *string*
* **roles.v1.admin.building.list.description.fr**: *string*
* **roles.v1.admin.building.list.parentCompositeRoles**: *array*
* **roles.v1.admin.building.view.title.en**: *string*
* **roles.v1.admin.building.view.title.fr**: *string*
* **roles.v1.admin.building.view.description.en**: *string*
* **roles.v1.admin.building.view.description.fr**: *string*
* **roles.v1.admin.building.view.parentCompositeRoles**: *array*
* **roles.v1.admin.building.register.title.en**: *string*
* **roles.v1.admin.building.register.title.fr**: *string*
* **roles.v1.admin.building.register.description.en**: *string*
* **roles.v1.admin.building.register.description.fr**: *string*
* **roles.v1.admin.building.register.parentCompositeRoles**: *array*
* **roles.v1.admin.building.edit.title.en**: *string*
* **roles.v1.admin.building.edit.title.fr**: *string*
* **roles.v1.admin.building.edit.description.en**: *string*
* **roles.v1.admin.building.edit.description.fr**: *string*
* **roles.v1.admin.building.edit.parentCompositeRoles**: *array*
* **roles.v1.admin.building.delete.title.en**: *string*
* **roles.v1.admin.building.delete.title.fr**: *string*
* **roles.v1.admin.building.delete.description.en**: *string*
* **roles.v1.admin.building.delete.description.fr**: *string*
* **roles.v1.admin.building.delete.parentCompositeRoles**: *array*
* **roles.v1.admin.building.validate.title.en**: *string*
* **roles.v1.admin.building.validate.title.fr**: *string*
* **roles.v1.admin.building.validate.description.en**: *string*
* **roles.v1.admin.building.validate.description.fr**: *string*
* **roles.v1.admin.building.validate.parentCompositeRoles**: *array*
* **roles.v1.admin.org.list.title.en**: *string*
* **roles.v1.admin.org.list.title.fr**: *string*
* **roles.v1.admin.org.list.description.en**: *string*
* **roles.v1.admin.org.list.description.fr**: *string*
* **roles.v1.admin.org.list.parentCompositeRoles**: *array*
* **roles.v1.admin.org.view.title.en**: *string*
* **roles.v1.admin.org.view.title.fr**: *string*
* **roles.v1.admin.org.view.description.en**: *string*
* **roles.v1.admin.org.view.description.fr**: *string*
* **roles.v1.admin.org.view.parentCompositeRoles**: *array*
* **roles.v1.admin.org.register.title.en**: *string*
* **roles.v1.admin.org.register.title.fr**: *string*
* **roles.v1.admin.org.register.description.en**: *string*
* **roles.v1.admin.org.register.description.fr**: *string*
* **roles.v1.admin.org.register.parentCompositeRoles**: *array*
* **roles.v1.admin.org.edit.title.en**: *string*
* **roles.v1.admin.org.edit.title.fr**: *string*
* **roles.v1.admin.org.edit.description.en**: *string*
* **roles.v1.admin.org.edit.description.fr**: *string*
* **roles.v1.admin.org.edit.parentCompositeRoles**: *array*
* **roles.v1.admin.org.delete.title.en**: *string*
* **roles.v1.admin.org.delete.title.fr**: *string*
* **roles.v1.admin.org.delete.description.en**: *string*
* **roles.v1.admin.org.delete.description.fr**: *string*
* **roles.v1.admin.org.delete.parentCompositeRoles**: *array*
* **roles.v1.admin.org.validate.title.en**: *string*
* **roles.v1.admin.org.validate.title.fr**: *string*
* **roles.v1.admin.org.validate.description.en**: *string*
* **roles.v1.admin.org.validate.description.fr**: *string*
* **roles.v1.admin.org.validate.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.role.admin.title.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.title.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.description.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.description.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.title.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.title.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.description.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.description.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.title.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.title.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.description.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.description.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.title.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.title.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.description.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.description.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.create.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.title.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.title.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.description.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.description.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.edit.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.title.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.title.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.description.en**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.description.fr**: *string*
* **compositeRoles.v1.admin.settings.role.admin.roles.v1.admin.settings.role.delete.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.workflow.admin.title.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.title.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.description.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.description.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.title.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.title.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.description.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.description.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.list.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.title.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.title.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.description.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.description.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.view.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.title.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.title.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.description.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.description.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.create.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.title.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.title.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.description.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.description.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.edit.parentCompositeRoles**: *array*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.title.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.title.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.description.en**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.description.fr**: *string*
* **compositeRoles.v1.admin.settings.workflow.admin.roles.v1.admin.settings.workflow.delete.parentCompositeRoles**: *array*

---

## Collection Path: `/settings/{id}/roles`

### Fields:
* **creationDate**: *timestamp*
* **parentCompositeRoles**: *array*
* **description.fr**: *string*
* **description.en**: *string*
* **modificationDate**: *timestamp*
* **title.fr**: *string*
* **title.en**: *string*

---

## Collection Path: `/settings/{id}/buildingRequest`

### Fields:
* **isoCountryCode**: *string*
* **approvingOrganizationId**: *string*
* **creationDate**: *timestamp*

---

## Collection Path: `/settings/{id}/organizationRequests`

### Fields:
* **isoCountryCode**: *string*
* **approvingOrganizationId**: *string*
* **creationDate**: *timestamp*

---

## Collection Path: `/settings`

### Fields:
* **activationCodes**: *array*
* **creationDate**: *timestamp*
* **stores**: *array*
* **adminCompositeRole**: *string*
* **viewRole**: *string*
* **editRole**: *string*
* **createRole**: *string*
* **deleteRole**: *string*

---

## Collection Path: `/suppliers/{id}/staffMembers/{id}/accesses`

### Fields:
* **staffId**: *string*
* **staffFirstName**: *string*
* **staffLastName**: *string*
* **buildingId**: *string*
* **buildingName**: *string*
* **buildingStreetAddress.houseNumber**: *string*
* **buildingStreetAddress.streetName**: *string*
* **buildingStreetAddress.postalCode**: *string*
* **buildingStreetAddress.city**: *string*
* **buildingStreetAddress.country**: *string*
* **buildingStreetAddress.isoCountryCode**: *string*
* **buildingStreetAddress.coordinate.latitude**: *number*
* **buildingStreetAddress.coordinate.longitude**: *number*
* **accesses**: *array*
* **creationDate**: *timestamp*
* **buildingImageFilename**: *string*

---

## Collection Path: `/suppliers/{id}/staffMembers/{id}/activities`

### Fields:
* **activityId**: *string*
* **accessControlDeviceId**: *string*
* **acdType**: *string*
* **organizationId**: *string*
* **supplierId**: *string*
* **staffId**: *string*
* **firstName**: *string*
* **lastName**: *string*
* **email**: *string*
* **activityType**: *string*
* **timestamp**: *string*
* **buildingId**: *string*
* **buildingName**: *string*
* **doorId**: *string*
* **doorName**: *string*
* **creationDate**: *timestamp*

---

## Collection Path: `/suppliers/{id}/staffMembers/{id}/activityAggregates`

### Fields:
* **creationDate**: *timestamp*
* **modificationDate**: *timestamp*
* **activities**: *array*

---

## Collection Path: `/suppliers/{id}/staffMembers/{id}/pincodes`

### Fields:
* **pincode**: *string*
* **buildingId**: *string*
* **accessId**: *string*
* **type**: *string*
* **creationDate**: *timestamp*

---

## Collection Path: `/suppliers/{id}/staffMembers`

### Fields:
* **staffId**: *string*
* **firstName**: *string*
* **lastName**: *string*
* **email**: *string*
* **supplierId**: *string*
* **organizationId**: *string*
* **phone.isoCountryCode**: *string*
* **phone.dialCode**: *string*
* **phone.internationalPhoneNumber**: *string*
* **phone.localPhoneNumber**: *string*
* **creationDate**: *timestamp*

---

## Collection Path: `/suppliers`

### Fields:
* **supplierId**: *string*
* **name**: *string*
* **siret**: *string*
* **type**: *string*
* **email**: *string*
* **address.houseNumber**: *string*
* **address.streetName**: *string*
* **address.postalCode**: *string*
* **address.city**: *string*
* **address.country**: *string*
* **notes**: *string*
* **organizationId**: *string*
* **entityId**: *string*
* **propertyId**: *null*
* **phone.isoCountryCode**: *string*
* **phone.dialCode**: *string*
* **phone.internationalPhoneNumber**: *string*
* **phone.localPhoneNumber**: *string*
* **creationDate**: *timestamp*

---

## Collection Path: `/users/{id}/activities`

### Fields:
* **activityId**: *string*
* **accessControlDeviceId**: *string*
* **userId**: *string*
* **userName**: *string*
* **activityType**: *string*
* **timestamp**: *string*
* **buildingId**: *string*
* **buildingName**: *string*
* **doorId**: *string*
* **doorName**: *string*
* **creationDate**: *timestamp*

---

## Collection Path: `/users/{id}/activityAggregates`

### Fields:
* **creationDate**: *timestamp*
* **modificationDate**: *timestamp*
* **activities**: *array*

---

## Collection Path: `/users/{id}/buildingSettings/{id}/unitSettings`

### Fields:
* **id**: *string*
* **buildingId**: *string*
* **unitId**: *string*
* **userId**: *string*
* **inhabitantType**: *string*
* **creationDate**: *timestamp*
* **modificationDate**: *timestamp*

---

## Collection Path: `/users/{id}/buildingSettings`

### Fields:
* **creationDate**: *timestamp*
* **modificationDate**: *timestamp*
* **id**: *string*
* **buildingId**: *string*
* **accessMethods.bluetooth**: *boolean*
* **accessMethods.pinCode**: *boolean*
* **accessMethods.faceRec**: *boolean*
* **accessMethods.NFC**: *boolean*
* **accessMethods.sesame**: *boolean*
* **inhabitantPinCodeType**: *string*
* **refreshCodeFrequency**: *number*
* **invitationAccessMethods.bluetooth**: *boolean*
* **invitationAccessMethods.pinCode**: *boolean*
* **invitationAccessMethods.faceRec**: *boolean*
* **invitationAccessMethods.NFC**: *boolean*
* **invitationAccessMethods.sesame**: *boolean*
* **allowQuickcodes**: *boolean*
* **numberOfEntries**: *string*
* **periodOfValidity**: *string*
* **externalUserPinCodeType**: *string*
* **validationTime**: *number*
* **allowResidentAddition**: *boolean*
* **allowCoResidentAddition**: *boolean*
* **allowResidentsToSendInvitations**: *boolean*
* **allowPermanentGuestsInvitations**: *boolean*
* **allowCloseOnesInvitations**: *boolean*
* **permittedInvitationDoors**: *array*
* **allowIntercomDisplayName**: *boolean*
* **allowUnitNumber**: *boolean*

---

## Collection Path: `/users/{id}/calls`

### Fields:
* **startTime**: *timestamp*
* **endTime**: *timestamp*
* **status**: *string*
* **buildingId**: *string*
* **contactId**: *string*
* **callId**: *string*
* **callerId**: *string*
* **unitId**: *string*
* **callerType**: *string*
* **callDuration**: *number*
* **activityId**: *string*
* **creationDate**: *timestamp*
* **callPictureName**: *string*

---

## Collection Path: `/users/{id}/intercoms`

### Fields:
* **accessControlDeviceId**: *string*
* **ACDName**: *string*
* **doorName**: *string*
* **displayName**: *string*
* **unitId**: *string*
* **buildingId**: *string*
* **callSettingsMode**: *string*
* **callTransferList**: *array*
* **creationDate**: *timestamp*
* **inhabitants**: *array*

---

## Collection Path: `/users/{id}/notifications`

### Fields:
* **userId**: *string*
* **notificationId**: *string*
* **options.type**: *string*
* **options.language**: *string*
* **options.data.title**: *string*
* **options.data.description**: *string*
* **options.data.buildingName**: *string*
* **options.data.buildingId**: *string*
* **options.data.organizationId**: *string*
* **options.data.organizationName**: *string*
* **options.data.communicationId**: *string*
* **hasBeenRead**: *boolean*
* **creationDate**: *timestamp*

---

## Collection Path: `/users/{id}/organizations`

### Fields:
* **tenant**: *string*
* **organizationName**: *string*
* **userId**: *string*
* **organizationId**: *string*
* **creationDate**: *timestamp*
* **userRoles**: *array*
* **modificationDate**: *timestamp*

---

## Collection Path: `/users/{id}/accesses`

### Fields:
* **buildingId**: *string*
* **userFirstName**: *string*
* **accesses**: *array*
* **buildingStreetAddress.isoCountryCode**: *string*
* **buildingStreetAddress.city**: *string*
* **buildingStreetAddress.country**: *string*
* **buildingStreetAddress.streetName**: *string*
* **buildingStreetAddress.coordinate.longitude**: *number*
* **buildingStreetAddress.coordinate.latitude**: *number*
* **buildingStreetAddress.postalCode**: *string*
* **buildingStreetAddress.houseNumber**: *string*
* **buildingName**: *string*
* **creationDate**: *timestamp*
* **userLastName**: *string*
* **userId**: *string*

---

## Collection Path: `/users/{id}/devices/{id}/accessControlDeviceTokens`

### Fields:
* **creationDate**: *timestamp*
* **token**: *string*

---

## Collection Path: `/users/{id}/devices`

### Fields:
* **deviceId**: *string*
* **type**: *string*
* **name**: *string*
* **publicSigningKeys.defaultKeyId**: *string*
* **publicSigningKeys.keys.3501D01C-91B2-4D76-92FD-13F59203F79C.creationDate**: *timestamp*
* **publicSigningKeys.keys.3501D01C-91B2-4D76-92FD-13F59203F79C.publicKey**: *string*
* **publicSigningKeys.keys.3501D01C-91B2-4D76-92FD-13F59203F79C.publicKeyDecompressed**: *string*
* **publicEncryptionKeys.defaultKeyId**: *string*
* **publicEncryptionKeys.keys.07C86FF3-9010-4A11-9D94-3EF4AC592E54.creationDate**: *timestamp*
* **publicEncryptionKeys.keys.07C86FF3-9010-4A11-9D94-3EF4AC592E54.publicKey**: *string*
* **publicEncryptionKeys.keys.07C86FF3-9010-4A11-9D94-3EF4AC592E54.publicKeyDecompressed**: *string*
* **isLocked**: *boolean*
* **isStolen**: *boolean*
* **creationDate**: *timestamp*

---

## Collection Path: `/users/{id}/notificationTokens`

### Fields:
* **userId**: *string*
* **tokenId**: *string*
* **deviceToken.fcmToken**: *string*
* **deviceType**: *string*
* **creationDate**: *timestamp*

---

## Collection Path: `/users/{id}/pincodes`

### Fields:
* **pincode**: *string*
* **buildingId**: *string*
* **creationDate**: *timestamp*
* **type**: *string*
* **userId**: *string*
* **accessId**: *string*

---

## Collection Path: `/users`

### Fields:
* **userId**: *string*
* **email**: *string*
* **publicProfile.firstName**: *string*
* **publicProfile.lastName**: *string*
* **publicProfile.userId**: *string*
* **settings.global.language**: *string*
* **settings.notifications.organizationInvitationReceived.pushNotification**: *boolean*
* **settings.notifications.organizationInvitationReceived.emailNotification**: *boolean*
* **settings.notifications.organizationInvitationReceived.smsNotification**: *boolean*
* **settings.notifications.organizationInvitationReceived.inAppNotification**: *boolean*
* **settings.notifications.externalUnitInvitationReceived.pushNotification**: *boolean*
* **settings.notifications.externalUnitInvitationReceived.emailNotification**: *boolean*
* **settings.notifications.externalUnitInvitationReceived.smsNotification**: *boolean*
* **settings.notifications.externalUnitInvitationReceived.inAppNotification**: *boolean*
* **settings.notifications.externalUserInvitationReceived.pushNotification**: *boolean*
* **settings.notifications.externalUserInvitationReceived.emailNotification**: *boolean*
* **settings.notifications.externalUserInvitationReceived.smsNotification**: *boolean*
* **settings.notifications.externalUserInvitationReceived.inAppNotification**: *boolean*
* **settings.notifications.externalSMSUserInvitationReceived.pushNotification**: *boolean*
* **settings.notifications.externalSMSUserInvitationReceived.emailNotification**: *boolean*
* **settings.notifications.externalSMSUserInvitationReceived.smsNotification**: *boolean*
* **settings.notifications.externalSMSUserInvitationReceived.inAppNotification**: *boolean*
* **settings.notifications.externalSMSUnitInvitationReceived.pushNotification**: *boolean*
* **settings.notifications.externalSMSUnitInvitationReceived.emailNotification**: *boolean*
* **settings.notifications.externalSMSUnitInvitationReceived.smsNotification**: *boolean*
* **settings.notifications.externalSMSUnitInvitationReceived.inAppNotification**: *boolean*
* **status.apiVersion**: *string*
* **status.newUserOnboarding.activateBuildingAccess**: *string*
* **status.newUserOnboarding.enrollMFA**: *string*
* **creationDate**: *timestamp*
* **auth0Sub**: *string*
* **unreadNotificationCount**: *number*
* **modificationDate**: *timestamp*
* **phoneNumber.dialCode**: *string*
* **phoneNumber.internationalPhoneNumber**: *string*
* **phoneNumber.isoCountryCode**: *string*
* **phoneNumber.localPhoneNumber**: *string*
* **settings.notifications.inviteeOnboardedNotification.pushNotification**: *boolean*
* **settings.notifications.inviteeOnboardedNotification.emailNotification**: *boolean*
* **settings.notifications.inviteeOnboardedNotification.smsNotification**: *boolean*
* **settings.notifications.inviteeOnboardedNotification.inAppNotification**: *boolean*
* **settings.notifications.residentsNotificationReceived.pushNotification**: *boolean*
* **settings.notifications.residentsNotificationReceived.emailNotification**: *boolean*
* **settings.notifications.residentsNotificationReceived.smsNotification**: *boolean*
* **settings.notifications.residentsNotificationReceived.inAppNotification**: *boolean*

---

