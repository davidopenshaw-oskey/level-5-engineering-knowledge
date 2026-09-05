# Oskeky firestore architecture

**RETIRED 2026-09-05 — superseded by `OSkey Backend Services & Data Architecture v2.md`.** Kept here for history, not for use. Machine-generated from older prompts, never regenerated since, and found on direct review to mix two different things: durable architectural principles (lines ~10-112, carried into v2 essentially unchanged) and a collection-by-collection, method-by-method narrative of what the code does (the rest of this file) that duplicates — less reliably and less currently — what Phase 1's own facts and call-graph already produce directly from the real source. A v3 covering that removed ground properly is intended once the real regeneration pipeline (post-merge, post-rejoin-check scripts, not yet built) exists. Do not cite this file going forward; use v2 for the principles it kept, and the live facts/call-graph for anything about current code behavior.

**version:** 0.0.2
**location:** level-5 phases 1, 2

© [Year] Oskey SAS. All rights reserved

This document is a companion document to the Oskey architecture.md and the firestore-schema.md. Its objective is to provide contextual information explaining the different collections, subcollections, keys and relationships and to assist agents in understanding the complexitiy of the Oskey landscape

## Glossary

- PGO, the Oskey Property Manager Portal, used by Property Managers
- PM, the Property Manager. A user of the PGO
- Oskey users, Oskey App users. These users use the Oskey app to access buildings, share invitations and quickcodes ( if they are residents )
- non app users, non-app users, similar to oskey users, but they have no app downloaded. they can be created by a PM or a residentAdmin

## Data Storage Philosophy, Design and Principles

Within Firestore, OSkey adopts the principles of Least Privilege and Client-Scoped Data Isolation (Security-First Design).

Data duplication within Firestore is intentional. Rather than representing redundant storage, duplicated documents provide security boundaries and isolated views optimised for specific consumers.

For example, OSkey Mobile App users interact only with data contained within their authorised /users hierarchy. They never directly access organisation, property or other tenant-owned collections.

Firestore therefore represents the authoritative business data store for the platform.

### Firestore as the System of Record

Firestore is the authoritative source for business entities including:

organisations
buildings
units
users
suppliers
invitations
access configuration
business workflows

Business services perform validation and orchestration against Firestore before any downstream systems are updated.

### MongoDB as the Hardware Projection Store

MongoDB is not a second system of record.

Instead, it acts as a projection database optimised for hardware communication.

Access Controllers (ACDs), intercoms and other edge devices require a denormalised, hardware-friendly representation of access information.

Relevant Firestore changes are transformed into hardware projections and synchronised into MongoDB.

Hardware therefore consumes projections rather than authoritative business data.

### Pub/Sub as the Synchronisation Backbone

OSkey uses Pub/Sub to decouple business workflows from downstream processing.

Business events generated from Firestore updates may publish messages for asynchronous processing.

Consumers may include:

hardware synchronisation
activity aggregation
notification processing
audit updates
projection generation

This architecture allows business operations to complete independently of hardware or background processing.

### Edge Device Activity Flow

OSkey also supports a reverse data flow from physical Access Control Devices back into the platform.

When an ACD processes an entry event, such as a PIN attempt, SecureBLE unlock, rejected access, door event, call event or supplier/non-app-user activity, the device sends the activity event to the hardware-facing backend.

These events are first handled by the edge/middleware layer and are then processed back into Firestore as business-visible activity records.

This reverse flow allows OSkey to maintain auditability and operational visibility without allowing edge devices to write directly into Firestore.

Activity events may be written into consumer-specific Firestore views, such as:

- user activity records
- supplier staff activity records
- non-app-user activity records
- building activity records
- activity aggregates
- audit or reporting projections

This preserves the same architectural principle used elsewhere in the platform:

Edge devices produce activity signals.

Middleware validates and processes those signals.

Firestore stores the business-visible activity record.

Client applications consume only authorised activity views.

### Architectural Principle

Firestore owns business truth.

Pub/Sub transports business and synchronisation events.

MongoDB serves hardware projections and hardware-facing exchange.

Edge devices do not write directly to Firestore.

Activity flows from edge devices back through the middleware layer before becoming authorised Firestore activity records.

No downstream projection becomes authoritative.

## Access Orchestration Services

Description:

The Access Services (OSKAccessService, OSKAccessUpdateService, OSKAccessMessagePublisherService, etc.) form a cohesive, high-level module that acts as the central orchestration engine for the entire access control system. This module is not responsible for a single Firestore collection but rather for the complex, distributed transactions that grant, modify, and revoke a user's ability to enter a physical space. It is the single point of entry for any business logic that needs to provision credentials, and it guarantees that changes are consistently fanned-out across multiple database collections and, most critically, synchronized with physical hardware devices.

Primary Methods and Triggers

- OSKAccessService.createAccess: The primary entry point for provisioning a new access grant. It is called by higher-level services when a user is onboarded, a guest is invited, or a supplier needs access.

- OSKAccessService.deleteAccessById: The primary entry point for revoking an access grant. It is called when an inhabitant is removed, a guest's access expires, or a supplier's contract ends.

- OSKAccessUpdateService: A set of services responsible for maintaining data consistency. It is triggered by changes in related entities (e.g., a user updates their name, a door's name is changed) and propagates those changes to all denormalized access documents.

Data Read Patterns:

- OSKAccessService: Reads user, building, and door documents to gather the necessary information to construct a valid access grant.

- OSKAccessUpdateService: Reads access documents from both /users/{userId}/accesses and /buildings/{buildingId}/accesses to perform updates.

- OSKAccessMessagePublisherService: Reads a user's pincodes (/users/{userId}/pincodes) and registered mobile devices (/users/{userId}/devices) to construct the complete accessMethods payload for hardware synchronization.

Data Replication Flow (Push/Fan-Out):

The OSKAccessService orchestrates a complex fan-out process that is the heart of the access control system.

- Fan-Out to Pincode System (on createAccess):
  - The service calls OSKPincodeService.addPincodeDocumentsToAccess, which in turn uses OSKPincodeGenerationService.generatePincode to create a unique PIN. This PIN is then written to three distinct locations, implementing a Paired Document and Audit Trail Pattern:
    - /users/{userId}/pincodes/{pincode}: A user-centric copy for the user's app to display their PINs.
    - /buildings/{buildingId}/pincodes/{pincode}: A building-centric copy, indexed by the PIN itself for fast validation by physical devices.

    - /buildings/{buildingId}/pincode_trash/{pincode}: A record is created here upon PIN deletion to prevent immediate reuse and for auditing.

Fan-Out to Denormalized Access Ledgers (on createAccess):

- An access grant object is added to the accesses array in the user-centric document at
  - /users/{userId}/accesses/{buildingId}. This is handled by OSKUserAccessService.createOrUpdateUserAccess.

  - A corresponding access grant object is added to the accesses array in the building-centric document at /buildings/{buildingId}/accesses/{userId}. This is handled by OSKBuildingAccessService.createOrUpdateBuildingAccess. This dual-write ensures data is optimized for both user-focused and building-focused queries.

Fan-Out to Mobile Device Tokens (on createAccess):

- The service calls OSKUserDeviceService.createAccessDeviceToken to generate and store secure tokens in /users/{userId}/devices/{deviceId}/accessControlDeviceTokens. These tokens are used by the mobile app to perform secure BLE (Bluetooth Low Energy) door openings.

- Cascading Deletion (on deleteAccessById):
  - The deleteAccessById function acts as a "kill-switch". It orchestrates the removal of the access grant object from both the user-centric (/users/.../accesses) and building-centric (/buildings/.../accesses) ledgers.

  It then calls OSKPincodeService.deletePincodeDocumentsFromAccess, which removes the PIN from the active collections and moves it to the pincode_trash collection.

Hardware/External Sync (via Pub/Sub):

- This is the most critical side-effect. Any call to createAccess, updateAccess, or deleteAccessById results in a call to OSKAccessMessagePublisherService.publishMessageToAllACDs. This service constructs a detailed payload containing all of a user's valid access methods (PINs, BLE device keys) and publishes it as a message to a specific Pub/Sub topic for each affected physical Access Control Device (ACD).

- An IoT backend service consumes these messages and updates the access list on the physical lock, ensuring the hardware state is synchronized with the database truth.

Business Logic:

Orchestration Service Pattern: The Access Services module is a classic example of an Orchestration Service. It doesn't own a single data entity but instead manages the complex, multi-step business process of provisioning access. It acts as the conductor, telling other, more specialized services (Pincode Service, User Access Service, Building Access Service, Publisher Service) what to do and in what order.

Event-Driven Architecture for IoT: The system is architected to be event-driven and resilient. The core application does not communicate directly with physical hardware. Instead, it publishes the "intended state" (e.g., "user X should have access") as a message to Pub/Sub. This decouples the application from the IoT infrastructure, allowing the system to handle offline devices and ensuring that access changes are reliably delivered.

Paired Document Pattern for Performance: The dual-write of access and pincode documents to both user-centric and building-centric collections is a deliberate denormalization pattern. It optimizes for the two most common read scenarios: a user's app asking "What are all my accesses?" and a building's device asking "Is this PIN valid here?". This avoids costly and slow cross-collection queries at runtime.

Transactional Integrity: The entire access lifecycle is designed to be transactional and secure. The createAccess function is a single entry point for provisioning, and deleteAccessById is a single entry point for de-provisioning. This ensures that no partial or "zombie" access rights are left behind, which is paramount for a security system. The use of a pincode_trash collection further enhances security by preventing the immediate reuse of deleted PINs.

The following document sections are grouped by Collections/SubCollections

## accessControlDevices

Description: This collection serves as the master registry for physical Access Control Devices (ACDs) managed by the platform. Each document represents a unique hardware device, storing its identity, type, assignment to a physical location, and operational statistics.

Written By:

GCP Cloud Functions triggered by PGO, or, currently manually added by Oskey Staff

Read By:

- OSKBuildingDoorAccessControlDeviceController: Reads device information, implied by its role in managing the link between a door and a device.

- OSKCallService

Data Replication Flow (Push/Fan-Out):

Propagates to the denormalized device document located at /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{id} by calling OSKBuildingDoorAccessControlDeviceController.default.update. This keeps the device data consistent where it is referenced under a specific door.

Business Logic: The collection is central to device identity. A key piece of logic is the data model migration demonstrated in OSKDbIntercomService. This function transforms older device documents to a new schema by renaming fields (e.g., makerDeviceUuid to accessControlDeviceId) and deleting obsolete ones using FieldValue.delete(). This indicates an evolving system where device representations are updated centrally and then fanned-out. The buildingDoorAssignment field is critical, acting as a foreign key link that physically and logically assigns a device to a door within a building.

## accessControlDevices/{id}/configs

Description: This sub-collection implements a versioned configuration pattern for a specific Access Control Device. Each document represents a complete, timestamped snapshot of the device's intended configuration, including access rules, door settings, and content for the device's display.

Written By:

- GCP Cloud Functions triggered by PGO, or, currently manually added by Oskey Staff

- OSKIntercomCommunicationService: Creates new configuration documents by calling

- OSKAccessControlDeviceConfigController.default.save. This happens when a communication message is created, updated, or deleted, as seen in the \_updateDeviceConfigWithMessage and deleteIntercomCommunication methods.

Read By:

- OSKIntercomCommunicationService: Reads the most recent configuration for a device using

- OSKAccessControlDeviceConfigController.default.getMostRecent(deviceId) before creating a new one. This ensures that new configurations are based on the latest state, preserving existing settings.

Data Replication Flow (Push/Fan-Out):

- mongoDB / accessControlDeviceConfigs, triggered by pubsub onDocumentUpdated, onDocumentCreated, onDocumentDeleted

- Hardware/External Sync: The creation of a new document in this collection is the primary mechanism for updating physical hardware via the pubsub .

- PGO on creation or update of the Intercom Communication messages triggers the pubsub accessControlDeviceConfig document onDocumentUpdated, onDocumentCreated

Business Logic:

The system uses an immutable configuration model. Instead of updating an existing configuration document, services create a new document with a new timestamp. This provides a full, auditable history of every configuration sent to a device. When a communication message needs to be displayed, the OSKIntercomCommunicationService reads the latest config, embeds the message content into the homeScreen.message field, and saves it as a new document. To remove a message, it creates a new config version with the homeScreen.message field omitted. This pattern ensures transactional and auditable updates for IoT devices.

## accessControlDevices/{id}/publicKeys

**NOTE: THIS COLLECTION MAY BE DECOMMISSIONED. THE KEY IS STILL GENERATED AND STORED IN THE ACD CONFIG DOCUMENT AND ALSO AT THE BUILDING DOOR LEVEL. RECENT DEPLOYMENTS IN PRODUCTION SHOWS THE PROBABLE DECOMMISSION OF THIS COLLECTION**

Description: Based on the schema, this sub-collection stores cryptographic public keys associated with a specific Access Control Device.

Written By: Evidence not found in the provided context.

Read By: Evidence not found in the provided context.

Data Replication Flow (Push/Fan-Out): Evidence not found in the provided context.

Business Logic: Evidence not found in the provided context. Based on the schema (firestore-schema.md), the structure contains a defaultKeyId and a map of keys, each with a publicKey. This strongly suggests a mechanism for managing one or more public keys for a device, likely used for verifying request signatures from the device or encrypting commands sent to it. However, no services in the provided context implement this logic.

## buildings

Description:

This collection is the authoritative source for physical buildings managed by the platform. Each document acts as a root entity, anchoring a building's identity (buildingId), its place in the multi-tenant hierarchy (organizationId, propertyId), and its real-world location (streetAddress). All other building-specific data, such as doors, units, and intercoms, are nested under this primary document.

Written By:

- OSKBuildingService: Handles all lifecycle operations (create, update, delete) via callable functions, which in turn use OSKBuildingController.

- createOrganizationBuilding: Creates a new building document.

- updateBuilding: Updates an existing building document.

- assigningBuildingToProperty: Updates the propertyId field when a building is moved between properties.

- uploadImage / deleteBuildingImage: Updates the imageFilename field.

Read By:

- OSKBuildingService: Reads building documents for validation, retrieval (e.g., getBuildingById), and to gather data for list views (getBuildingsByPropertyId).

- OSKBuildingDoorService: Reads the parent building document to validate its existence before performing any operations on a door.

- OSKIntercomCommunicationService: Reads a building document to validate its existence and retrieve its name before creating or dispatching a communication message to its intercoms.

Data Replication Flow (Push/Fan-Out):

- Fan-Out to /organizations/{organizationId}/buildings: On creation, createOrganizationBuilding creates a denormalized OSKOrganizationBuildingDocument containing the buildingId and buildingName. This optimizes queries for listing all buildings within an organization without reading the full building documents.
  - Evidence: building.service.ts -> OSKOrganizationBuildingController.default.save(...).

- Fan-Out to /properties/{propertyId}: On creation, createOrganizationBuilding adds a lightweight copy of the building object to the buildings array of the parent property document.
  - Evidence: building.service.ts -> OSKPropertyController.default.update({ buildings: FieldValue.arrayUnion(building) }).

- Fan-Out to /buildings/{buildingId}/units: When a building's name or streetAddress is updated, updateBuilding iterates through all associated unit documents and cascades the changes to their buildingName and streetAddress fields.
  - Evidence: building.service.ts -> OSKBuildingUnitController.default.update(...) within a loop.

- Fan-Out to /users/{userId}/accesses: When a building's name or streetAddress is updated, updateBuilding calls a dedicated service to propagate the changes to all user access documents that reference that building. This ensures the user's view of their accesses is always up-to-date.
  - Evidence: building.service.ts -> OSKAccessUpdateService.updateUserAccessesBuildingInfo(...).

Business Logic:

The buildings document is the foundational entity for all location-based operations. Its creation is a complex transaction that not only saves the primary document but also creates denormalized copies in /organizations and /properties, and initializes a default settings document in /buildings/{id}/settings. Updates trigger a wide-reaching fan-out to maintain data consistency across related units and user accesses. Deletion is strictly conditional; a building cannot be deleted if it still contains doors or units, enforcing relational integrity and preventing orphaned sub-collections.

## /buildings/{buildingId}/accesses

Description: This collection serves as a denormalized ledger, mapping users to a specific building and aggregating all their individual access rights (accesses) within that building. Each document, uniquely identified by the userId, contains an array of access grants, allowing for efficient retrieval of a user's complete permissions for a given building in a single read operation.

Written By:

- OSKBuildingAccessService: This service is the sole writer. The createOrUpdateBuildingAccess and createOrUpdateBuildingAccessForStaffOrNonAppUser methods handle the document lifecycle. They either create a new document for a user's first access to a building or append a new access object to the accesses array using FieldValue.arrayUnion if a document already exists.

Read By:

- OSKBuildingAccessService: Before writing, the service reads the collection using OSKBuildingAccessesController.default.get(buildingId, userId) to determine if a document for the user already exists, which dictates whether to perform a create or an update operation.

Data Replication Flow (Push/Fan-Out):

- Fan-Out from /users: When a new building access document is created for a standard user, the createOrUpdateBuildingAccess method denormalizes the user's firstName and lastName from the OSKUserDocument (passed as userData) into the new /buildings/{buildingId}/accesses/{userId} document. This optimizes read operations by avoiding a join to the /users collection when displaying access information.
  - Evidence: building_access.service.ts -> createOrUpdateBuildingAccess method signature and its use of userData.publicProfile.firstName and userData.publicProfile.lastName.

Business Logic: The core logic follows a "create-or-append" pattern. The system checks for the existence of a user-specific document within the building's accesses sub-collection. If none exists, it creates one, populating it with denormalized user data and the initial access grant. If a document does exist, it atomically adds the new access grant to the accesses array. This ensures that all of a user's permissions for a building are consolidated into a single document, which is a classic NoSQL optimization pattern for read-heavy scenarios. A distinct logic path exists for "StaffOrNonAppUser", which omits the denormalization of user names, suggesting it handles a different category of users who may not have a full profile in the /users collection.

## buildings/{buildingId}/callTransferList

Description: This collection stores the ordered call routing rules for a specific unit on a specific intercom. Each document acts as a state machine, defining the sequence of users to be called when a visitor selects a unit on the physical intercom device.

Written By:

- OSKBuildingIntercomCallTransferListService.createCallTransferList: Creates a new call transfer list document. This is triggered by OSKBuildingIntercomService when a unit is added to an intercom for the very first time.

- OSKBuildingIntercomCallTransferListService.onUpdateBuildingIntercomsTransferList: A callable function that allows an end-user to re-order or change their call preferences, which overwrites the callTransferList array in the document.

- OSKBuildingIntercomCallTransferListService.pushToCallTransferList: Appends a new user to the end of an existing call transfer list. This is triggered by OSKBuildingIntercomService when a new inhabitant is added to a unit that already exists on an intercom.

- OSKBuildingIntercomService.deleteIntercomEntry: Deletes the entire document via OSKBuildingIntercomCallTransferListController.default.delete as part of the cleanup when a unit is removed from an intercom.

Read By:

- OSKBuildingIntercomCallTransferListService.pushToCallTransferList: Reads the document to find the highest existing sequenceNumber before appending a new item to the list.

- OSKBuildingIntercomCallTransferListService.onUpdateBuildingIntercomsTransferList: Reads the document before an update to perform validation.

Data Replication Flow (Push/Fan-Out):

- Fan-Out to /users/{userId}/intercoms: When a call transfer list is updated, the updateIntercomCallTransferList function calls OSKUserIntercomService.updateAllUserIntercomEntry, passing the new callTransferList. This denormalizes the routing rules directly into each affected user's personal intercom document, allowing their app to display the current call order without extra lookups.
  - Evidence: building_intercom_calltransferlist.service.ts -> updateIntercomCallTransferList calls OSKUserIntercomService.

- Hardware/External Sync: Evidence not found in the provided context. The service that initiates a WebRTC call (and would therefore read this document to determine the call sequence) is not included in the analysis scope.

Business Logic:

A callTransferList document is uniquely identified by a contactId, which is stored within a unit's intercomEntry in the /buildings/{buildingId}/intercoms collection. This establishes a direct 1-to-1 relationship between a unit's presence on an intercom and its specific call routing rules. The core of the document is the callTransferList array, which uses a sequenceNumber to define a "waterfall" call order. A strict validation rule, checkCallTransferList, ensures that any userId in the list must be a valid inhabitant of the associated unit, preventing calls from being routed to unauthorized individuals. When a new inhabitant joins a unit, based on their persona they are either added directly into document at the end of the call sequence to preserve the existing sequence, or their persona may entitle them to be manually added into document by other personas.

## buildings/{buildingId}/doors

Description:

This sub-collection represents the individual, addressable doors within a specific building. Each document contains the door's name and, critically, the isForAllResidents flag, which serves as a primary driver for default access control policies.

Written By:

- OSKBuildingDoorService: Manages the entire lifecycle of door documents via callable functions that use OSKBuildingDoorController.

- organizationUserCreateBuildingDoor: Creates a new door document.

- organizationUserUpdateBuildingDoor: Updates an existing door document.

- deleteBuildingDoor: Deletes a door document.

Read By:

- OSKBuildingDoorService: Reads door documents for retrieval and validation.

- OSKBuildingService: Reads door documents to get counts (getBuildingById) or to list doors with their associated devices (getBuildingsByPropertyId).

- OSKBuildingDoorAccessControlDeviceService: The onDocumentCreated trigger for a device reads the corresponding door document to get its name and streetAddress for denormalization.

- OSKIntercomCommunicationService: Reads door documents to resolve the hardware device (accessControlDeviceId) associated with a door when targeting a communication message.

Data Replication Flow (Push/Fan-Out):

- Fan-Out to /users/{userId}/accesses: When a door's name or streetAddress is updated, organizationUserUpdateBuildingDoor calls OSKAccessUpdateService.updateUserAccessesDoorInfo to propagate these changes to all user access documents that include this door.
  - Evidence: building_door.service.ts.

- Hardware/External Sync to /accessControlDevices/{id}/configs: When a device is assigned to a door (via creation of a document in /buildings/{bId}/doors/{dId}/accessControlDevices), the onDocumentCreated trigger in building_door_access_control_device.service.ts reads the door's data and saves a new ACD device configuration document containing a denormalized doorInfo object. This ensures the physical device has the contextual information it needs.
  - Evidence: building_door_access_control_device.service.ts -> OSKAccessControlDeviceConfigController.default.save(data).

- Fan-Out to /buildings/{buildingId}/intercoms: When a device is assigned to a door, the same onDocumentCreated trigger calls OSKBuildingIntercomService.createIntercomEntry. This creates a document in the intercoms sub-collection, which includes the door's name and device ID for the building's digital directory.
  - Evidence: building_door_access_control_device.service.ts.

Business Logic:

A door document cannot exist without a parent building. Its primary function is to represent a physical access point and link it to a hardware device. Deletion is conditional: a door cannot be deleted if an Access Control Device is still assigned to it, preventing orphaned hardware assignments. Critically, deleting a door via deleteBuildingDoor triggers a cascading revocation of access rights by calling OSKAccessUpdateService.removeDoorFromUserAccesses, ensuring that no user retains access to a non-existent door. The isForAllResidents flag acts as a high-level business rule, likely interpreted by an access provisioning service to grant or deny access to the building's general resident population.

## buildings/{buildingId}/intercoms

Description:

This collection represents the digital directory for each physical intercom device within a building. Each document, identified by the accessControlDeviceId, contains a list of intercomEntries. Each entry corresponds to a specific unit, holding its display name and a list of its inhabitants, effectively defining who can be called from that physical intercom.

Written By:

- OSKBuildingIntercomService.createIntercomEntry: Creates a new intercom document. This is triggered when a new Access Control Device is assigned to a door, linking the physical hardware to a digital directory entry.

- OSKBuildingIntercomService.addInhabitantInAllIntercoms: Updates the intercomEntries array by adding a new inhabitant to a unit's entry across all relevant intercoms in a building. This is the primary mechanism for populating the directory.

- OSKBuildingIntercomService.updateIntercomDisplayName: Updates the displayName of a specific unit entry within the intercomEntries array.

- OSKBuildingIntercomService.deleteIntercomEntry: Removes a unit's entry from the intercomEntries array, effectively unlisting it from the intercom directory.

Read By:

- OSKBuildingIntercomService: Reads documents extensively to perform updates. For instance, getAllIntercomByBuilding is used to apply a change (like adding an inhabitant) to all intercoms in a building.

- OSKBuildingIntercomCallTransferListService: Reads an intercom document to find the contactId associated with a unit's entry, which is required to update the corresponding call transfer list.

Data Replication Flow (Push/Fan-Out):

- Hardware/External Sync via Pub/Sub: Any significant change to an intercom document triggers a Pub/Sub message to the topic defined by process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES. This is the core mechanism for synchronizing the directory with the physical IoT devices.
  - Evidence: OSKIntercomMessagePublisherService is called by createIntercomEntry, updateIntercomDisplayName, \_createNewUnit, \_addInhabitantInUnit, and deleteIntercomEntry. The publisher service then calls OSKBuildingIntercomController.default.publishMessage.

- Fan-Out to /users/{userId}/intercoms: When an inhabitant is added, removed, or a unit's details are updated, the changes are denormalized to the corresponding user-specific intercom documents. This provides the user's app with a fast, pre-compiled view of their intercom settings.
  - Evidence: OSKUserIntercomService methods (createAndUpdateUsersIntercomEntry, updateAllUserIntercomEntry, deleteUserIntercom) are called from OSKBuildingIntercomService during create, update, and delete operations.

Business Logic:

An intercom document is inextricably linked to a physical device (accessControlDeviceId is the document ID). Its creation is part of the device-to-door assignment workflow. The core business logic resides in managing the intercomEntries array. A critical rule, enforced in addInhabitantInAllIntercoms, is that only inhabitants of type 'tenant' are added to the intercom directory. The displayName for a unit is automatically generated by concatenating the last names of its tenant inhabitants (e.g., "DOE - SMITH"). This can be manually overridden, which sets a manuallyChanged flag to prevent future automatic updates. Deleting a unit entry is a cascading operation that also cleans up the associated /buildings/{buildingId}/callTransferList document and the denormalized data in /users/{userId}/intercoms.

## /buildings/{buildingId}/pincodes

Description:

This collection acts as a fast-lookup index for all valid PIN codes within a specific building. Each document is uniquely identified by the PIN code itself and contains the necessary authorization details, such as which user it belongs to, which doors it opens, and the type of access it represents (e.g., Inhabitant, Guest, Supplier).

Written By:

    - OSKBuildingPincodeService: This service is responsible for creating all PIN code documents. It provides distinct methods for each access type (createPincodeInhabitantDocument, createPincodeGuestDocument, createPincodeSupplierDocument, etc.), each of which constructs a document with a specific type field before saving it via the controller.

        - Evidence: building_pincode.service.ts.

Read By:

- OSKBuildingPincodeController: While the services that consume this data are not in the provided context, the controller exposes methods that clearly indicate the read patterns. get(pincodeId, buildingId) is used for direct validation of a PIN. getByAccessId(buildingId, accessId) is used to find the PIN associated with a specific access grant, likely for display or revocation purposes.
  - Evidence: building_pincode.controller.ts.

Data Replication Flow (Push/Fan-Out):

- Fan-Out to /users/{userId}/pincodes: The existence of /users/{id}/pincodes collection in the schema shows that when a PIN code is created here, a denormalized copy is also created in the user-specific sub-collection. This would allow a user's application to quickly display all of their PIN codes without needing to query multiple building collections.
  - Evidence: firestore-schema.md shows the /users/{id}/pincodes collection. However, the specific service or trigger performing this fan-out is not present in the provided context.

- Hardware/External Sync: The creation of a document in this collection must ultimately result in the PIN code being provisioned on the physical Access Control Device's keypad. This is typically achieved via a Firestore trigger that publishes a message to a Pub/Sub topic, which is then consumed by an IoT service.
  - Evidence: This is a strong architectural inference based on the system's purpose. However, direct evidence of a trigger or Pub/Sub publisher in the provided service files is not found.

Business Logic: The design of this collection is optimized for performance. Using the PIN code itself as the document ID allows for extremely fast validation (O(1) document fetch). The type field is critical for applying different policies; for example, a Guest PIN might have a short expiry time, while an Inhabitant PIN is permanent. The accessId field creates an essential link back to the originating access grant document (e.g., in /users/{id}/accesses). This relationship is crucial for security: when an access grant is revoked, the system can use getByAccessId to find and delete the corresponding PIN code document, ensuring the PIN is immediately invalidated.

## /buildings/{buildingId}/pincodesTrash

Description:

**pincodesTrash module has not been fully written and deployed at this stage, therefore, do not infer operational or completed codebase from documentation**

This collection functions as a "recycle bin" or soft-delete log for PIN codes that have been removed from the active /buildings/{buildingId}/pincodes collection. Using the PIN code itself as the document ID, it allows for a quick lookup to see if a PIN has been recently deleted, for auditing purposes and to prevent immediate reuse.

Written By:

- Evidence not found in the provided context. The OSKBuildingPincodeTrashService is an empty class. However, the OSKBuildingPincodeTrashController exposes a set method, which implies that another service, not included in the analysis scope, is responsible for moving PIN code documents into this trash collection.

Read By:

- Evidence not found in the provided context. The OSKBuildingPincodeTrashController provides get and getAll methods, suggesting that some process reads from this collection. This could be an automated cleanup job that permanently deletes documents after a certain period, or an administrative tool for reviewing deleted PINs. The specific consuming service is not present in the provided files.

Data Replication Flow (Push/Fan-Out):

- Evidence not found in the provided context. The controller only interacts with its own collection path, and the service is empty.

Business Logic: This collection implements a soft-delete pattern. Instead of being permanently erased, a deleted PIN code document is moved here. This architectural choice serves several potential business needs: it creates an audit trail of deleted PINs, and it can be used to enforce a "cooldown" period, preventing a PIN from being immediately re-created or re-assigned. The logic that defines this cooldown period or any automated purging from the trash is not available in the provided context.

## /buildings/{buildingId}/settings

Description:

This collection stores a single, comprehensive document that defines the master operational rules and configurable parameters for a specific building. It acts as a template controlling features such as allowed access methods, PIN code policies, and permissions for resident-initiated invitations. The data structure is self-describing, containing not just the setting value but also metadata about its behavior (e.g., canBeChanged, description), which is likely used to dynamically render administrative UIs.

Written By:

- OSKBuildingSettingsService.createBuildingSettings: Creates the initial settings document for a building, typically with default values.

- OSKBuildingSettingsService.updateBuildingSettings: Updates specific fields within the existing settings document.

- OSKBuildingSettingsService.deleteBuildingSettings: Deletes the entire settings document for a building.

- OSKBuildingSettingsService.resetBuildingSettings: Overwrites the existing settings document with a set of default values by calling updateBuildingSettings.

Read By:

- OSKBuildingSettingsService: Reads the document before performing an update (updateBuildingSettings) or for direct retrieval (getResidentSettings).

- Inferred Services: Other services not present in the context (e.g., an access provisioning service or an invitation service) would read this document to enforce the building's rules when performing their respective operations.

Data Replication Flow (Push/Fan-Out):

- Fan-Out to /users/{userId}/buildingSettings/{buildingId}: This is a critical data replication pattern. When the master building settings are updated via updateBuildingSettings, the service iterates through all users in the system. For each user that has an existing user-specific settings document for that building, it cascades the update to that document. This denormalizes the settings for fast, user-centric reads.
  - Evidence: building_settings.service.ts -> updateBuildingSettings method contains a loop calling OSKUserSettingsBuildingController.default.update(...).

- Cascading Deletion to /users/{userId}/buildingSettings/{buildingId}: When the master building settings document is deleted via deleteBuildingSettings or reset via resetBuildingSettings, the service iterates through all users and deletes their corresponding user-specific settings document for that building. This ensures that no orphaned user-level overrides remain.
  - Evidence: building_settings.service.ts -> deleteBuildingSettings and resetBuildingSettings methods contain a loop calling OSKUserSettingsBuildingController.default.delete(...).

Business Logic:

\*\*Building settings are a work in progress. They are currently implemented at the building level and managed via the PGO. Final implementation will permit a PM to manage settings at the Enity level that can cascade down to both Properties and Buildings, where local settings can be overriden.

This implements a "master template with user overrides" pattern. The /buildings/{buildingId}/settings document holds the authoritative configuration. Changes made here are fanned-out to denormalized user-specific documents at /users/{userId}/buildingSettings/{buildingId}. This architecture is optimized for client-side performance; a user's application can fetch all relevant settings for a building with a single, direct document read, without needing to query and merge data from the master settings document. All write operations are protected by role-based access control, requiring the administrative user to have specific permissions (e.g., v1.org.settings.edit) within the organization. The resetBuildingSettings function provides a transactional way to revert a building to its default state, which also cascades down to all user-specific settings.

## /buildings/{buildingId}/units

Description:

This collection represents the individual, addressable units (e.g., apartments, offices) within a specific building. Each document contains the unit's descriptive details (name, floor, unitNumber) and denormalizes key information from its parent building (buildingName, streetAddress) for efficient retrieval.

Written By:

- OSKBuildingUnitService: Manages the entire lifecycle of unit documents via callable functions (organizationUserCreateBuildingUnit, organizationUserUpdateBuildingUnit, deleteBuildingUnit).

Read By:

- OSKBuildingUnitService: Reads documents for retrieval (organizationUserGetBuildingUnitById), listing (organizationUserGetAllBuildingUnits), and validation before updates or deletion.

- OSKBuildingUnitInhabitantService: Reads all unit documents in a building (OSKBuildingUnitController.default.getAll) to find all inhabitants within that building.

- OSKBuildingUnitNonAppUserService: Reads a unit document to validate its existence before creating a nonAppUser within it.

Data Replication Flow (Push/Fan-Out):

- Fan-Out from /buildings:

- This collection is a target of fan-out. When a parent /buildings document is updated, the OSKBuildingService cascades changes like name and streetAddress down to all unit documents within it.
  - Evidence: building.service.ts contains a loop calling OSKBuildingUnitController.default.update(...).

- Cascading Deletion: The deleteBuildingUnit function initiates a cleanup process. It retrieves all inhabitants of the unit and intends to send them notifications. The code to remove associated access rights is present but commented out (// remove accesses), indicating an incomplete or planned feature.
  - Evidence: building_unit.service.ts -> deleteBuildingUnit.

Business Logic: A unit document cannot exist without a parent building. Its creation and modification are protected by role-based access control, requiring the user to have the v1.org.buildings.edit permission. Deletion is conditional; the logic checks for the existence of inhabitants before proceeding, preventing units from being removed while they are still occupied. This enforces a basic level of relational integrity between units and their inhabitants.

## /buildings/{buildingId}/units/{unitId}/inhabitants/{userId}

Description This entity represents a person with full membership rights to a specific residential unit within a building. It is the definitive record that establishes a user as an official inhabitant, storing their identity, their role within the unit (e.g., owner, tenant, resident), a reference to their inviter, and a list of doors they are authorized to access. This document is the source of truth for an inhabitant's status and is distinct from temporary guests or external users.

Written By

- OSKBuildingUnitInhabitantService.addInhabitant: This core service is the primary writer, called during the processing of an invitation for an existing Oskey user via OSKUnitManagementCreationOskeyUserInvitationService.processInvitee. It creates the inhabitant document and provisions their access rights.

- OSKUnitManagementInhabitantService.updateInhabitant: Updates the document, typically to change the inhabitantType or residentRights, subject to strict permission checks.

- OSKUnitManagementInhabitantService.removeInhabitantFromUnit: Deletes the document, which triggers a full cascade to revoke all associated access.

Read By:

- OSKUnitManagementInhabitantService: Reads this document extensively for permission validation. updateInhabitant and removeInhabitantFromUnit both read the documents of the user performing the action and the user being acted upon to verify their inhabitantType hierarchy.

- OSKUnitManagementInhabitantService.getAllUnitInhabitantsAndGuests: Reads all inhabitant documents in a unit to construct a comprehensive list of people for a management UI.

- OSKUnitManagementInhabitantService.getSingleUnitInhabitant / fetchInhabitantData: Reads a single inhabitant document to provide detailed information, including fetching associated user data and pincodes.

- OSKUnitManagementInvitationService.getUnitInvitationsByUserId: Reads the inhabitant document of the requesting user to check their inhabitantType and residentRights to determine if they are allowed to view pending invitations for the unit.

Data Replication Flow (Push/Fan-Out)

- Fan-Out to Access Control System (on Create):
  - The addInhabitant function calls OSKAccessService.createAccess. This is a major fan-out event that provisions the user's access rights, resulting in the creation of documents in /buildings/{bId}/accesses and /users/{uId}/accesses, and subsequently triggers pincode generation and synchronization with physical hardware.

- Fan-Out on Deletion (removeInhabitantFromUnit):
  - The deletion of this document acts as a "kill-switch" for the inhabitant's access.

Access Revocation: It calls OSKAccessService.deleteAccessById, which orchestrates the deletion of the corresponding access documents.

Pincode Deletion: It looks up the associated pincode via OSKUserPincodeController.default.getByAccessId and then triggers its deletion from both the building-level collection (OSKPincodeService.deleteBuildingPincodeAndMoveToTrash) and the user-level collection (OSKUserPincodeController.default.delete).

Hardware/External Sync: The underlying deleteAccessById and pincode deletion services are responsible for publishing messages to physical Access Control Devices (ACDs) to ensure physical access is immediately revoked.

Business Logic

Hierarchical Permission Model: The system enforces a strict, role-based hierarchy within the unit. An owner has the highest level of authority, followed by tenant, and then resident. This hierarchy dictates who can modify or remove whom. For example, removeInhabitantFromUnit explicitly checks that only an owner or tenant can remove another inhabitant, and they are restricted to only removing users of the resident type.

Self-Action Prevention: The removeInhabitantFromUnit service contains a critical guard clause preventing a user from removing themselves, which protects against accidental self-lockout.

Orchestration of Access: The creation of this document is not an isolated event; it is the trigger for a mandatory access provisioning sequence. Conversely, its deletion orchestrates a complete and safe de-provisioning sequence, ensuring data integrity and security across the distributed system and physical hardware.

## /buildings/{buildingId}/units/{unitId}/doors

**IMPORTANT: this code is not implemented in the system. Access control devices at the Unit Door level are a future-proof concept for future roadmap only. Do not infer from this any current implementation or usage within the system**

Description:

This collection represents doors that are exclusively associated with a single unit, such as an apartment's front door. Note: This collection path is implemented in the code but is absent from the provided firestore-schema.md document.

Written By:

- OSKBuildingUnitDoorService.createBuildingUnitDoor: This is the sole method for creating documents in this collection.

Read By:

- Evidence not found in the provided context.

Data Replication Flow (Push/Fan-Out):

- Fan-Out to Access Control System: Upon creation of a unit door document, the createBuildingUnitDoor service immediately reads all current inhabitants of the parent unit. It then iterates through them, calling OSKAccessService.createAccess for each one to grant them permanent access to this new door.
  - Evidence: building_unit_door.service.ts -> inhabitants.forEach(async (inhabitant) => { await OSKAccessService.createAccess(...) });.

Business Logic:
**Currently not implemented**
This entity models a private access point for a unit. Its creation triggers a crucial workflow: automatically provisioning access to all current residents of that unit. This ensures that inhabitants are never locked out of their own unit when a new door is added to the system. The operation is protected by role-based access control, requiring the v1.org.buildings.create permission.

## /buildings/{buildingId}/units/{unitId}/nonAppUsers

Description:

This collection represents individuals who are granted access to a unit but do not have access to the Oskey mobile app, therefore cannot enter a building using secureBle. They are granted a unique pincode from the residentAdmin persona within the unit. Each document is scoped to a specific unit and identified by a unique nonAppUserId, referencing the residentAdmin who granted the access.

Written By:

- OSKBuildingUnitNonAppUserService: Manages the document lifecycle via createNonAppUser, createNonAppUserWithAccess, and updateNonAppUser.

Read By:

- OSKBuildingUnitNonAppUserService: Reads documents for retrieval (getNonAppUser, getAllNonAppUsers) and validation before updates or deletion.

- OSKNonAppUserActivityService: Reads the document to retrieve the user's fullName when enriching an activity log.

Data Replication Flow (Push-Fan-Out):

- Cascading Deletion: The deleteNonAppUser function is a major orchestration workflow. It reads all associated access documents from the accesses sub-collection, then calls a private helper (\_deleteAccessSideEffects) which triggers deletion of PIN codes from both the local and building-level collections, and publishes Delete messages to physical hardware via Pub/Sub. Only after all associated data is cleaned up is the nonAppUser document itself deleted.
  - Evidence: building_unit_nonAppUser.service.ts -> deleteNonAppUser.

Business Logic: This entity allows for managed access without requiring full user onboarding. The createNonAppUserWithAccess function provides a transactional "one-shot" workflow that creates the user, provisions their access, generates a PIN code, and returns all the necessary information. Deletion is a carefully orchestrated, multi-step process designed to securely revoke all credentials and permissions across the entire system, from the database to the physical hardware. Access to delete is restricted to 'tenant' or 'owner' inhabitants, preventing residents from deleting each other's non-app users.

## /buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/accesses

Description:

This collection serves as a denormalized, per-building ledger of all access grants for a specific nonAppUser. Each document is identified by the buildingId where access is granted and contains an array of accesses, allowing for efficient retrieval of all permissions for that user in that building.

Written By:

- OSKNonAppUserAccessService.createOrUpdateNonAppUserAccess: Uses a "create-or-append" pattern. It either creates a new document for the user's first access in a building or atomically adds a new access grant to the accesses array using FieldValue.arrayUnion.

Read By:

- OSKNonAppUserAccessService: Reads a document before writing to determine if it needs to create a new one or update an existing one.

- OSKBuildingUnitNonAppUserService: Reads documents to perform updates (updateNonAppUserAccessDoors) and deletions (deleteNonAppUserAccess, deleteNonAppUser).

Data Replication Flow (Push/Fan-Out):

- Fan-Out to /buildings/{buildingId}/accesses: The system maintains synchronization with the main building-level access ledger. When a nonAppUser access is updated or deleted, the corresponding entry in /buildings/{buildingId}/accesses is also updated or removed.
  - Evidence: building_unit_nonAppUser.service.ts -> updateNonAppUserAccessDoors and \_deleteAccessSideEffects both call OSKBuildingAccessesController.default methods.

- Hardware/External Sync (Pub/Sub): Any change to access rights triggers an immediate push to the physical hardware. Both updateNonAppUserAccessDoors and \_deleteAccessSideEffects call OSKAccessMessagePublisherService.publishMessageToAllACDs to send Update or Delete operation messages to the devices.
  - Evidence: building_unit_nonAppUser.service.ts.

Business Logic: This collection aggregates access grants for a nonAppUser on a per-building basis, a classic NoSQL pattern to optimize for fast reads. The logic is designed to keep this user-centric view perfectly in sync with the building-centric ledger at /buildings/{builidingId}/accesses. Crucially, any updates or deletions here trigger immediate Pub/Sub messages to the physical Access Control Devices, ensuring the hardware's state is always consistent with the database truth.

## /buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes

Description:

This collection acts as a fast-lookup index for PIN codes assigned to a specific nonAppUser. The document ID is the PIN code itself, allowing for extremely efficient validation.

Written By:

- OSKNonAppUserPincodeService.createPincodeDocument: Creates the PIN code document. This service is called as part of the larger OSKAccessService.createAccess workflow.

Read By:

- OSKBuildingUnitNonAppUserService: Reads a PIN document after creation to return the PIN value (createNonAppUserWithAccess) or reads it via getByAccessId to find the PIN that needs to be deleted when an access grant is revoked (\_deleteAccessSideEffects).

Data Replication Flow (Push/Fan-Out):

- Fan-Out to /buildings/{buildingId}/pincodesTrash: When a nonAppUser's access is revoked, the \_deleteAccessSideEffects helper in building_unit_nonAppUser.service.ts calls OSKPincodeService.deleteBuildingPincodeAndMoveToTrash. This moves the deleted PIN from the building's active PIN collection to a "trash" collection for auditing and to prevent immediate reuse.
  - Evidence: building_unit_nonAppUser.service.ts.

Business Logic: This collection is optimized for high-performance PIN validation by using the PIN as the document ID. The accessId field creates a vital link back to the specific access grant that authorized the PIN. This relationship is the cornerstone of the security model: when an access grant is deleted, the system uses this link to find and soft-delete the corresponding PIN, ensuring credentials are fully revoked.

## /buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activities

Description:

This collection stores a raw, immutable log of individual access events (e.g., "door unlocked", "invalid PIN") generated by a specific nonAppUser. Each document represents a single event.

Written By:

- OSKNonAppUserActivityService.ActivityReceivedForNonAppUser: This static method is the sole writer. It's designed to be an event handler that is called when an activity event from a physical device is processed, after the event data has been enriched.

Read By:

    - Evidence not found in the provided context. This collection is likely read by administrative UIs or for analytics, but the services for those features are not included.

Data Replication Flow (Push/Fan-Out):

- This collection is the destination of a data flow. It is populated when hardware events are processed by the backend.

Business Logic: This collection serves as a detailed, append-only audit trail for a nonAppUser's actions. A key piece of logic within the ActivityReceivedForNonAppUser handler is the need to resolve the unitId by calling OSKBuildingUnitNonAppUserService.getUnitIdFromNonAppUserId. This is necessary because the incoming hardware event likely only contains the nonAppUserId and buildingId, but the data needs to be stored under the correct unit path.

## /buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activityAggregates

Description:

This collection stores a summarized, time-windowed view of a nonAppUser's recent activities. Each document, identified by the buildingId, contains an array of activity events from the last 30 days, optimized for quick display in a client application.

Written By:

- OSKNonAppUserActivityAggregatesService.ActivityReceivedForNonAppUser: This event handler uses a "read-append-prune-write" pattern. It reads the existing aggregate document, appends the new activity, filters out any activities older than 30 days, and writes the updated array back to the document.

Read By:

- OSKNonAppUserActivityAggregatesService: Reads its own documents in order to perform the update operation. Other read patterns are not present in the context.

Data Replication Flow (Push/Fan-Out):

This collection is the destination of a data flow, populated by the same hardware events that populate the raw activities log.

Business Logic: This collection implements a classic NoSQL optimization pattern. Instead of querying and filtering a potentially massive raw log collection (activities), this pre-aggregated document provides a ready-to-display list of recent events. The business rule for data retention (30 days) is explicitly implemented within the ActivityReceivedForNonAppUser service. This dual-write approach (writing to both the raw log and the aggregate) trades a small amount of write-time complexity for significantly improved read performance.

## buildings/{buildingId}/units/{unitId}/invitations/{invitationId}

Description

This entity is the master record for an invitation sent by a user for a specific unit. It contains the complete context of the invitation, including the sender, a list of invitees, the specific access rights being granted, and the user type (e.g., InhabitantUser, InhabitantGuestUser). It serves as the central point of truth from which other denormalized invitation records are created.

Written By

- OSKUserInvitationCreationService.createUserInvitation:
  - This is the primary writer. It constructs the full invitation object and saves it to this path via OSKUserInvitationBuildingController.default.save.

Read By

- OSKUserInvitationAcceptedService.inviteeAcceptsInvitation:
  - Reads the invitation to process it upon acceptance.

- OSKUserInvitationCancelledService.inviterCancelsInvitation:
  - Reads the invitation to process a cancellation.

- OSKUserInvitationRejectedService.inviteeRejectsInvitation:
  - Reads the invitation to process a rejection.

- OSKUserInvitationEditService.editInvitation:
  - Reads the current invitation to compare it with the requested updates.

- OSKUserInvitationDeleteService.deleteInvitation:
  - Reads the invitation before orchestrating its deletion.

Data Replication Flow (Push/Fan-Out)

- Fan-Out on Creation (createUserInvitation):
  - The creation of this master record triggers a significant fan-out:
    - To Sender's Sent Box:
      - A denormalized copy is immediately saved to /users/{senderId}/sentInvitations/{invitationId} via OSKUserSentInvitationController.save.

    - To Existing User's Inbox:
      - For each invitee that is already an Oskey user, processInvitee saves a denormalized copy to /users/{inviteeId}/invitations/{invitationId} via OSKUserInvitationController.save.

    - To External User Staging Area:
      - For each invitee that is not an Oskey user, processInvitee calls OSKUserInvitationExternalUserService.createExternalUserInvitation, which creates or updates a document in /externalUserInvitations to hold the invitation in stasis.

- Fan-Out on Acceptance (inviteeAcceptsInvitation):
  - This triggers the core access provisioning workflow by calling OSKBuildingUnitInhabitantService.addInhabitant or OSKAccessService.createAccess, which in turn creates multiple documents (accesses, pincodes) and syncs with physical hardware.

- Fan-Out on Deletion (deleteInvitation):
  - This triggers a cascading delete of the corresponding records in /users/{senderId}/sentInvitations and /users/{inviteeId}/invitations.

  - If access was already granted, it calls OSKAccessService.deleteAccessById to revoke all permissions and pincodes.

Business Logic

Master Record Pattern: This document acts as the authoritative master record for a specific invitation event. All other invitation-related documents in user-specific collections are denormalized copies derived from this one.

Orchestration Hub: The services that interact with this entity orchestrate the entire invitation lifecycle. createUserInvitation is an orchestration method that fans out data to multiple locations. deleteInvitation is a "kill-switch" that orchestrates the cleanup of all related data and access rights.

Dual Onboarding Path: The system has a sophisticated dual-path logic. If an invitee is an existing user, the invitation is processed and accepted immediately. If they are not, the invitation is staged in /externalUserInvitations, demonstrating a robust architecture for handling both known and unknown users.

## /buildings/{buildingId}/units/{unitId}/pendingInvitations/{inviterId}

Description:

This entity is a transactional state machine that aggregates all pending invitations sent by a single inviter for a specific unit. The document ID is the inviterId. It contains an invitees array, where each object represents a person who has been invited but has not yet been onboarded. This aggregation pattern is a NoSQL-friendly way to manage one-to-many relationships without creating excessive documents, and it simplifies queries related to a specific inviter's actions.

Written By:

- OSKUnitManagementCreationInvitationService.updateOrCreatePendingUnitInvitation: The primary writer, which uses an "upsert" pattern. If a document for the inviter already exists, it adds new invitees to the array; otherwise, it creates a new document.

- OSKUnitManagementPendingInvitationsController.default.consumeInvitee: This function is called after an invitee is successfully onboarded (via consumeUnitInvitationInvitee) or when an invitation is cancelled (via removePendingInvitation). It atomically removes the specific invitee object from the invitees array. If the array becomes empty, the entire document is deleted.

Read By:

- OSKUnitManagementInvitationService.getUnitInvitationsByUserId: Reads this document (or all documents in the subcollection) to list pending invitations for an administrator or resident, respecting their viewing permissions.

- OSKUnitManagementInhabitantService.getAllUnitInhabitantsAndGuests: Reads all documents in this subcollection to include pending invites in a consolidated UI list.

- OSKUnitManagementInhabitantService.removePendingInvitation: Reads the document to find the specific invitee to be removed based on their contact information.

- OSKUnitManagementCreationOskeyUserInvitationService.createPermanentGuest: Reads the document to find and remove the processed invitee from the invitees array after they have been successfully onboarded.

Data Replication Flow (Push/Fan-Out)

- Fan-Out on Creation (createUnitInvitation):
  - For New Users: The service calls OSKUserInvitationExternalUnitService.createExternalUnitInvitation. This creates a separate document in a different collection ( /externalUserInvitations ) that serves as the temporary record for a user who does not yet have an Oskey account.

  - For Existing Users: The service immediately calls OSKUnitManagementCreationOskeyUserInvitationService.processInvitee. This bypasses the pending state and directly triggers the fan-out for creating an inhabitant or permanentGuest and their associated access rights.

  - Fan-Out on Cancellation (removePendingInvitation):

After removing the invitee from this document's array, it calls OSKUserInvitationExternalUserController.default.delete to clean up the corresponding temporary external invitation document, ensuring the entire invitation workflow is cleanly terminated.

Business Logic:

- Aggregation Pattern: The system aggregates all invitees from a single inviter for a single unit into one document, using the inviterId as the document key. This is an efficient pattern for managing one-to-many relationships in NoSQL.
  Transactional State Machine: The document's existence and the contents of its invitees array represent the current state of pending invitations. An invitee is atomically removed from the array upon acceptance (consumption) or cancellation. The document is automatically deleted when it has no more pending invitees, cleaning up the state.

- Dual Onboarding Architecture: The createUnitInvitation service implements a sophisticated dual-path workflow. It first determines if an invitee is an existing Oskey user. If so, it grants them access directly. If not, it creates this pending record and a parallel external invitation record, initiating the onboarding flow for a new user. This provides a seamless experience for existing users while robustly handling new ones.

- Permission-Based Invitation Logic: The updateOrCreatePendingUnitInvitation function enforces business rules at the point of creation by checking the inhabitantType of the inviter. For example, a tenant can only invite residents or permanentGuests, whereas a resident may only be able to invite guests if their residentRights permit it.

## /buildings/{buildingId}/units/{unitId}/permanentGuests/{userId}

Description:

This entity represents a user who has been granted long-term, recurring access to a unit, such as a family member or a trusted individual, but who is not a full inhabitant. It links an existing Oskey user to the unit, storing their basic information, the ID of the person who invited them, and a crucial accessId that points to the specific access rights document governing their permissions.

Written By:

- OSKUnitManagementCreationOskeyUserInvitationService.createPermanentGuest: This is the primary creation path, triggered when an invitation for a permanent guest is accepted by an existing Oskey user. It creates the document via

- OSKBuildingUnitPermanentGuestController.default.create.
  OSKUnitManagementPermanentGuestService.updatePermanentGuest: Updates the validity period (fromDate, toDate) of the guest's access by modifying the underlying access document.

- OSKUnitManagementPermanentGuestService.removePermanentGuest: Deletes the document and triggers a full revocation of the guest's access.

Read By:

- OSKUnitManagementPermanentGuestService: Reads the document for permission checks in updatePermanentGuest and removePermanentGuest, verifying the rights of the user performing the action.

- OSKUnitManagementInhabitantService.getAllUnitInhabitantsAndGuests: Reads all permanent guest documents in a unit to include them in a consolidated list for the UI.

- OSKUnitManagementPermanentGuestService.getPermanentGuest / fetchPermanentGuestData: Reads a single document to provide detailed information, including fetching the user's full profile and associated pincodes.

Data Replication Flow (Push/Fan-Out)

- Fan-Out to Access Control System (on Create):
  - createPermanentGuest calls OSKAccessService.createAccess to provision the specific access rights. This is a major fan-out that creates access documents, generates pincodes, and triggers hardware syncs. The resulting accessId is then stored on this permanent guest document.

- Fan-Out on Update (updatePermanentGuest):
  - This function calls OSKAccessService.updateAccess, which modifies the accessRights (specifically the validity dates) on the corresponding access document in /users/{userId}/accesses/{buildingId}. This change is then propagated to physical devices.

- Fan-Out on Deletion (removePermanentGuest):
  - Access Revocation: It calls OSKAccessService.deleteAccessById using the accessId stored on the document, which orchestrates the deletion of all related access records.

- Pincode Deletion: It finds and deletes the associated pincodes from both the building and user collections via OSKPincodeService.deleteBuildingPincodeAndMoveToTrash and OSKUserPincodeController.default.delete.

Hardware/External Sync: The underlying services ensure messages are published to physical devices to revoke access.

Business Logic

Delegated Permission Model: The system allows for delegated management. An owner or tenant can remove any permanent guest. However, a resident can only remove a permanent guest if they were the original inviterId and have the residentRights.permanentGuests.manageable flag set to true.

Coupling with Access Document: This entity is tightly coupled to the access control system via the accessId field. It essentially acts as a metadata layer on top of a core access document, providing unit-specific context. Its lifecycle (create, update, delete) directly manipulates the underlying access grant.

## calls

Description:

This collection acts as a state machine for a real-time WebRTC communication session. Each document represents a single call, typically initiated by an Access Control Device (ACD). It tracks the call's lifecycle from creation to termination, contains the routing rules (callTransferList), and logs all state transitions in an events array for auditing.

Written By:

- OSKCallService: The POST /calls endpoint handles the creation of new call documents via OSKCallController.default.create(). It also performs an initial update via OSKCallController.default.update() after processing the request (e.g., uploading a picture).

- OSKCallService: The PATCH /calls/:callId endpoint is the primary mechanism for updating the state of an ongoing call, using OSKCallController.default.update().

Read By:

- OSKCallService: Reads a call document via OSKCallController.default.get() within the PATCH /calls/:callId endpoint to validate the incoming update against the current state.

- OSKCallService: Reads a call document within the POST /calls/:callId/notify/:sequenceNumber endpoint to retrieve the list of recipients to notify for the next step in the call sequence.

Data Replication Flow (Push/Fan-Out):

- Fan-Out to /users/{userId}/notifications: Upon creation, the service immediately sends a userCallReceived push notification to the first user in the call transfer list. This is handled by OSKUserNotificationService.createSpecial().
  - Evidence: call.service.ts -> OSKUserNotificationService.createSpecial(...).

- Fan-Out to /users/{userId}/calls (Call History): When a call is terminated (status terminated, failed, cancelled, or missed), the service creates a historical record of the call for each participant. This denormalized document is written to the user-specific /users/{userId}/calls collection, allowing a user's app to efficiently display their call history.
  - Evidence: call.service.ts -> await OSKUserCallController.default.set(callRecipient.callerId, userDocument).

- Fan-Out to /users/{userId}/activityAggregates: Concurrently with creating the call history, the service enriches the event data and writes to a pre-aggregated activity log for each user involved in the call. This is used for displaying recent activity feeds efficiently.
  - Evidence: call.service.ts -> await OSKUserActivityAggregatesService.ActivityReceivedForUser(...).

Cloud Storage Integration:

- If the initial call creation request contains a picture (e.g., a snapshot of the visitor), it is uploaded to Cloud Storage under the path calls/{callId}/public/callPictures/. The generated filename is then stored in the callPictureName field of the call document.
  - Evidence: call.service.ts -> storage().bucket().file(...).

Business Logic: The /calls document is a short-lived state machine. Its lifecycle is as follows:

- Initiation: An ACD initiates a call via a POST request. The service validates the device and fetches the call routing rules from /buildings/{buildingId}/callTransferList.

- State Transition: The document is created with a status of 'created', then immediately updated to 'started'. A push notification is sent to the first user in the sequence.

- Progression: The call progresses through its transfer list. Subsequent notifications are triggered by calls to the separate POST /calls/:callId/notify/:sequenceNumber endpoint, which decouples the notification logic from the main state.

- Termination: When the call ends, a PATCH request updates the status to terminated, failed, or cancelled. A critical business rule is applied here: if no participant ever joined the call (i.e., no didJoin event exists), the final status is programmatically overridden to 'missed'.

- Archival (Fan-Out): Upon termination, the service calculates the call duration and fans out a permanent, denormalized historical record to the personal collections of all participants (/users/{id}/calls and /users/{id}/activityAggregates), ensuring the main /calls collection remains lean with only active or very recent calls.
  

## /organizations/{organizationId}

Description:

The Organization entity represents the highest-level record for a client or tenant in the system. It stores fundamental identification information such as name, address, and tax number.

Each organization is structurally linked to a root entity (`entityP`) within the `/entities` collection, establishing the foundation for a hierarchical resource tree.

It also defines the manifest of composite roles (`userRoles`) available to be assigned to users within that specific organization.

The Angular PGO Portal enters this domain through Organization-scoped HTTPS callable functions and exposed Organization services.

The Angular PGO Portal must not bypass these Organization service entry points or directly access lower-level collections outside the approved Organization domain boundary.

Written By:

- OSKOrganizationService: Manages the creation (createAnOrganization), update (updateAnOrganization), and logo management (uploadimage, deleteOrganizationLogo) of organization documents.

- Read By:

- OSKOrganizationService: Reads organizations for validation before updates (updateAnOrganization), for listing (getAllOrganizations), or for logo deletion (deleteOrganizationLogo).

- OSKEntityService: The assignSubEntityToParent function updates the entityP field of an organization document, which implies a preceding read.

- OSKIntercomCommunicationService: Reads the organization name via OSKOrganizationController.default.get() during communication creation (createIntercomCommunication) and when notifying residents (\_notifyResidents) to include it in messages.

Data Replication Flow (Push/Fan-Out)

- Fan-Out to /entities: Upon the creation of an organization via OSKOrganizationService.createAnOrganization, a corresponding "root entity" (OSKEntityDocument) is simultaneously created in the /entities collection. The ID of this new entity is then stored in the entityP field of the organization document, creating a transactional and structural link.
  Business Logic The Organization entity functions as a root container with strict governance logic.

Controlled Creation: Creation is not open; it is contingent on the calling administrator possessing specific permissions (v1.admin.org.register, v1.admin.org.validate).

Coupling with Entities: An organization cannot exist without a corresponding root entity (entityP). This design ensures that every organization serves as the starting point for a hierarchical tree of resources (entities, properties, buildings), as demonstrated by the simultaneous creation in OSKOrganizationService.createAnOrganization.

Role Management: The userRoles field acts as a permission manifest, defining the composite roles that can be assigned to users specifically within this organization.

Media Handling: The service manages the lifecycle of the organization's logo by uploading it to a storage bucket and storing only the filename (organizationLogo) in the document. This is a common pattern to separate metadata from binary files.

## /entities/{entityId}

Description An Entity is a node within a hierarchical tree belonging to an Organization. It serves as a logical container to group sub-entities (subEntityIds) and real estate properties (propertiesIds). The system distinguishes between a root entity (entityType: 'entity'), which is directly linked to an organization, and sub-entities (entityType: 'subEntity'), which can be nested to model complex organizational structures.

Written By

- OSKEntityService: The primary service for CRUD operations (createEntity, updateEntity, deleteEntity) and structural operations like moving an entity (assignSubEntityToParent).

- OSKOrganizationService: Creates the root entity (entityType: 'entity') during the creation of a new organization (createAnOrganization).

Read By

- OSKEntityService: Reads entity documents to validate permissions, check the type (entityType), and retrieve parent/child IDs before performing write operations. The functions getEntityDashboardStatics and getBuildingsByEntityId read an entity to retrieve its propertiesIds for data aggregation.

- OSKIntercomCommunicationService: The function getAllIntercomCommunicationsByEntityId indirectly reads entities by first fetching the properties associated with the entity to then aggregate communications.

Data Replication Flow (Push/Fan-Out)

- Fan-Out to Parent Entity: When a sub-entity is created via OSKEntityService.createEntity, its ID is added to the subEntityIds array of its parent entity's document using FieldValue.arrayUnion().

- Cascading Fan-Out on Delete: Deleting an entity via OSKEntityService.deleteEntity triggers two replication flows:
  Its ID is removed (FieldValue.arrayRemove) from its parent's subEntityIds array.
  For each propertyId in its propertiesIds array, the corresponding property document is updated to clear its entityId field. (Note: The code cites OSKEntityController.default.update for this, which appears to be a typo and should likely be a property controller).

Fan-Out to Organization (on Move):

- The OSKEntityService.assignSubEntityToParent function updates the entityP field of the Organization document, which can re-anchor the entire organization's hierarchy to a new root entity.

Business Logic: The Entity entity is the cornerstone of the application's multi-level data structure.

Tree Model: The system enforces a strict tree structure. A root entity (entityType: 'entity') is created with each organization and cannot be deleted (deleteEntity throws an error for this type). Only sub-entities (entityType: 'subEntity') can be created, deleted, or moved.

Index for Read Optimization: The entity serves as an index for performant reads. getEntityDashboardStatics uses the propertiesIds from an entity to find all associated buildings and calculate aggregate statistics (resident count, device count) without scanning the entire database. This is a clear example of denormalization for read optimization.
Hierarchical Permissions: Operations on entities are protected by specific roles (v1.org.entity.create, v1.org.entity.delete, etc.), indicating that permissions can be managed at different levels of the organization's hierarchy.

## /organizations/{organizationId}/buildings/{buildingId}

Description:

This document is a denormalized index document that establishes a link between a building from the root /buildings collection and a specific organization. It contains minimal redundant data (buildingId, buildingName) to enable optimized querying of all buildings belonging to an organization.

Written By:

Read By:

- OSKOrganizationBuildingService.getAllOrganizationBuildings: This is the primary reader. It retrieves all documents from this collection for a given organizationId and then uses the buildingIds to query the corresponding full documents from the root /buildings collection.

Data Replication Flow (Push/Fan-Out)

- Evidence not found in the provided context. The collection itself is the result of a fan-out flow from the root /buildings collection, but the mechanism for this replication is not visible in the provided code.

Business Logic:

Collection Index Pattern: The primary logic is to provide an efficient way to list all of an organization's buildings without performing a potentially slow query across the entire root /buildings collection. By scoping the query to an organization's subcollection, Firestore read performance is improved.

Client-Side Join: The getAllOrganizationBuildings function illustrates a "join" pattern performed on the application side. It executes a first query to get the IDs from the index, followed by a second IN query to fetch the complete data, mimicking a relational database join.

## /organizations/{organizationId}/onboardingInhabitants/{onboardingId}

Description:

This Collection is a temporary, transactional state machine document designed to manage the onboarding workflow for a new inhabitant or guest. It acts as a short-lived "invitation card," holding all necessary context for provisioning a user, including their contact details, the target building and unit, specific door access rights, and the type of access being granted. It contains generated secrets (activationCode, smsOtp) with expiration dates to secure the process. The document is created by an administrator and is consumed and deleted upon successful user activation, ensuring it can only be used once.

Written By:

- OSKOrganizationOnboardingInhabitantService.createOnboardingDocuments: This is the primary creator of the document. It is triggered by an organization administrator with the v1.org.buildings.create permission. The service generates an activationCode and smsOtp, calculates expiration timestamps, and creates the document with a status of isOnboarded: false.

- OSKOrganizationOnboardingInhabitantService.updateOnboardingDocument: Allows an administrator with v1.org.buildings.create permission to modify an existing onboarding document.

- OSKOrganizationOnboardingInhabitantService.resetSmsCode: Updates the smsOtp field on an existing document for a user who needs a new verification code.

Read By:

- OSKOrganizationOnboardingInhabitantService.verifyActivationCode: This is the main consumer of the document. It is called by the end-user who has received an activation code. The function queries for the document by its activationCode and validates that the authenticated user's email or phone number matches the contactDetails stored on the document.

- OSKOrganizationOnboardingInhabitantService.verifyActivationCodeByOrganizationAdmin: A variant of the above, initiated by an administrator on behalf of a user.

- OSKOrganizationOnboardingInhabitantService.getOnboardingDocumentById: Retrieves a single document by its ID, used by an administrator with v1.org.buildings.create permission for management purposes.

- OSKOrganizationOnboardingInhabitantService.findOnboardingDocument: Queries for documents, typically for an admin to view pending invitations for a specific unit.

Data Replication Flow (Push/Fan-Out) The consumption of this document via verifyActivationCode triggers a significant fan-out and orchestration sequence:

- Fan-Out to /buildings/{buildingId}/units/{unitId}/inhabitants: If the accessType is inhabitantUser, the onboardInhabitant function is called, which in turn calls OSKBuildingUnitInhabitantService.addInhabitant. This creates a new, permanent inhabitant document, copying data like firstName, lastName, doors, and inhabitantType from the onboarding card.

- Fan-Out to Access Control System (/buildings/{bId}/accesses, etc.): The call to OSKBuildingUnitInhabitantService.addInhabitant also provisions access rights based on the accessRights array from the onboarding card. If the accessType is for a guest, createAccess is called, which uses OSKAccessService.createAccess to provision the specified rights. This results in the creation of access documents and associated pincodes.

- Fan-Out to /organizations/{organizationId}/residents: The onboardInhabitant function executes an update on the corresponding resident document (which shares the same ID as the onboarding card). It calls OSKOrganizationResidentsController.default.update to set isOnboarded: true, link the userId, and denormalize the newly created pinCodes into the resident document.

- Fan-Out to Email System: Upon successful onboarding, \_sendOnboardingNotificationEmail is called. This function identifies all administrative users in the organization with the v1.org.residents.onboardingNotification role and sends them an email notification via OSKEmailService to inform them that a new user has been successfully onboarded.

- State Transition (Deletion): The final and most critical step in the verifyActivationCode flow is the deletion of the onboardingInhabitants document itself via OSKOrganizationOnboardingInhabitantController.default.delete. This embodies the "Consume and Delete" pattern, ensuring the activation code is single-use and the temporary transactional data is purged.

Business Logic: This entity serves as an orchestration hub for a secure, stateful user onboarding process.

Transactional State Machine: The document's existence represents a pending onboarding. Its fields (phoneVerified, emailVerified, isOnboarded) track the user's progress. Its deletion signifies the successful completion of the workflow.

Secure, Time-Bound Activation: The workflow is secured by a unique, time-limited activationCode. The system enforces that the authenticated user consuming the code must match the contact information on the card, preventing unauthorized activation.

Role-Based Initiation: The creation of these onboarding documents is a privileged operation, restricted to administrators with the v1.org.buildings.create role, ensuring that only authorized personnel can initiate invitations.

Orchestration, Not Just Data: The document's primary value is not in the data it holds, but in the complex chain of events its consumption triggers. It acts as a blueprint that orchestrates the creation of multiple, permanent records across different parts of the system, including inhabitants, access rights, and denormalized resident views, while also firing off external notifications.

Special Handling for App Store Review: The verifyActivationCode function contains a special logical path to handle app store reviewers (handleAppStoreTesterOnboarding). If the activation code is recognized as an internal test code, it bypasses the standard flow and provisions access to a pre-configured test building, demonstrating a robust approach to handling platform-specific requirements.

## /organizations/{organizationId}/residents/{residentId}

Description:

This collection is a denormalized, read-optimized document that provides a comprehensive, flattened view of a resident for an organization's administrative staff. It aggregates essential data from various collections (users, buildings, units, pincodes) into a single record. Its primary purpose is to enable efficient querying and display of resident information at the organization level, such as in a property management portal, without requiring complex, real-time joins across the database.

The document's lifecycle is tied to an onboarding process, and it acts as a master record for orchestrating resident deletion.

Written By:

- OSKOrganizationResidentsService.createResidents: This is the primary creation service. It creates this document with isOnboarded: false in parallel with creating a corresponding document in /organizations/{organizationId}/onboardingInhabitants. It handles two distinct flows: createAppUserResident for users who will use the app, and createNonAppUserResident for users (like guests) who only receive a pincode.

- OSKOrganizationResidentsService.updateResident: Updates the resident's information, such as name and inhabitant type. It propagates these changes to other related documents if the user is already onboarded.

- OSKOrganizationOnboardingInhabitantService.onboardInhabitant (from previous context): This service updates the document upon successful user onboarding, setting isOnboarded: true, linking the userId, and denormalizing the user's pinCodes.

- OSKOrganizationResidentsService.deleteResident: Deletes the document after orchestrating a full cleanup of the resident's data across the system.

Read By:

- OSKOrganizationResidentsService.getAllResidents: The primary reader, which lists all residents for an organization's administrative view.

- OSKOrganizationResidentsService.getResidentDetails: Fetches a single, detailed resident document for an administrator.

- OSKOrganizationResidentsService.deleteResident: Reads the document to determine the correct deletion path based on the isOnboarded and isAppUser flags.

- OSKOrganizationResidentsService.updateResident: Reads the document to check the isOnboarded status before propagating updates.

- OSKOrganizationResidentsService.getallResidentsByPropertyIdCallable: Reads all residents associated with buildings under a specific property.

Data Replication Flow (Push/Fan-Out) The deletion of this document is a major orchestration event with significant fan-out:

- Fan-Out on Deletion (deleteResident):
  - If isOnboarded: false: The service finds and deletes the corresponding temporary document in /organizations/{organizationId}/onboardingInhabitants via \_deleteOnboardingInhabitant.

  - If isOnboarded: true and isAppUser: true (deleteAppUserResident):

- Fan-Out to Access Control System: For every access the user has, it calls OSKAccessMessagePublisherService.publishMessageToAllACDs with a Delete operation to revoke access on physical devices.

- Fan-Out to /buildings/{bId}/pincodes & /users/{uId}/pincodes: Deletes the user's pincodes from both the building-level and user-level collections via OSKPincodeService.deleteBuildingPincodeAndMoveToTrash and OSKUserPincodeController.default.delete.

- Fan-Out to /buildings/{bId}/accesses & /users/{uId}/accesses: Deletes the user's access documents from both building and user collections.

- Fan-Out to /buildings/{bId}/units/{uId}/inhabitants: Deletes the core inhabitant record via OSKBuildingUnitInhabitantController.default.delete.

- Fan-Out to Intercom System: Calls \_updateIntercomsAfterResidentDeletion to remove the user from intercom display names and call transfer lists. If the user is the last main resident, this escalates to removing the entire unit from all intercoms (\_removeUnitFromAllIntercoms).
  - If isOnboarded: true and isAppUser: false (\_deleteNonAppUserResident): A similar, but distinct, fan-out occurs, targeting the non-app-user specific collections under /buildings/{bId}/units/{uId}/nonAppUsers/{nonAppUserId}.

Cascading Deletion of Dependent Entities:

- If the deleted resident is the last main resident (owner or tenant), checkInhabitantTypeAndDeleteAllInhabitantresident triggers a cleanup of all entities they invited, including nonAppUsers (\_cleanupInvitedNonAppUsers), permanentGuests (\_cleanupInvitedPermanentGuests), and pendingUnitInvitation (\_cleanupPendingUnitInvitations).

Business Logic:

- Denormalization for Read-Optimization: This collection pre-joins and aggregates data (user info, building/unit names, pincodes) that is frequently needed together by administrators. This avoids slow, complex queries at read time, providing a fast experience for the management portal.

- Deletion Orchestrator: The document acts as a "kill-switch". Its deletion is not a simple removal but the trigger for a complex, cascading revocation of a resident's existence across the entire distributed system, from database records to physical hardware access.

- State-Driven Logic: The isOnboarded and isAppUser booleans are critical state flags. They dictate the business logic for creation (app user vs. non-app user flow) and deletion (deleting a pending invitation vs. revoking a fully provisioned user), ensuring the correct cleanup procedures are followed.

- Admin-Centric View: The entire structure and the data enrichment process (mapInhabitantData in a related service) are tailored to the needs of an administrative user. It flattens the complex relational structure of the underlying data into a single, easy-to-understand record for management.

## /organizations/{organizationId}/intercomBuildingStates/default

Description:

This collection is a transactional state management document that serves as the single source of truth for messages displayed on all intercoms within a specific building. It contains a messages array that holds the configuration, schedule, and status (scheduled, active, expired) of each communication. The service managing this entity implements a robust hot/cold storage pattern, automatically archiving old, expired messages to a subcollection to maintain performance and prevent the document from exceeding Firestore's size limits.

Written By:

- OSKIntercomCommunicationService.upsertMessagesAndArchiveExpired: This is the sole, transactional write function. All modifications to the messages array are funneled through this method to ensure atomicity. It is called by:

- createIntercomCommunication: To add a new message to the array.

- executeScheduledActivation (Task Handler): To atomically transition a message's status from scheduled to active.

- executeScheduledDeactivation (Task Handler): To atomically transition a message's status from active to expired.

- OSKIntercomCommunicationService.deleteIntercomCommunication: Removes a message from the messages array within a transaction.

Read By:

- OSKIntercomCommunicationService.getAllIntercomCommunicationService: Reads the document to list all current and recent messages for a building.

- OSKIntercomCommunicationService.getIntercomCommunicationById: Reads the document to find and return a single message from the array.

- OSKIntercomCommunicationService.getAllIntercomCommunicationsByPropertyId: Reads the state documents for all buildings associated with a property.
  All write operations (upsertMessagesAndArchiveExpired, deleteIntercomCommunication) read the document inside a transaction before making changes.

Data Replication Flow (Push/Fan-Out)

- Fan-Out to Cloud Tasks: createIntercomCommunication schedules future work via OSKTaskSchedulerService.scheduleTask. If a message's start date is in the future, it creates an activateIntercomCommunicationTask. If an end date is set, it creates a deactivateIntercomCommunicationTask.

- Fan-Out to /organizations/{orgId}/intercomBuildingStates/{bId}/archive: The upsertMessagesAndArchiveExpired transaction automatically moves messages that are expired and exceed the MAX_EXPIRED_MESSAGES threshold from the main messages array into this archive subcollection, implementing a hot/cold storage pattern.

- Fan-Out to /users/{id}/notifications: When a message becomes active (either immediately or via the executeScheduledActivation task), \_notifyResidents is called. This function creates a notification document in the /users/{userId}/notifications subcollection for every onboarded app user in the building via OSKUserNotificationService.create.

- Fan-Out to Vertex AI (Gemini): createIntercomCommunication calls \_translateAll, which uses the textTranslate prompt template to make a batch translation call to the Gemini API, enriching the message with multiple languages.

Hardware/External Sync:

- Fan-Out to /accessControlDevices/{id}/configs: When a message becomes active or is deleted/deactivated, the system fans out changes to the physical intercoms. The \_updateDeviceConfigWithMessage function is called, which creates a new version of the device's configuration document in this collection. The new config either includes the active message in the homeScreen object or removes it. This versioned approach to configuration ensures a clear audit trail and triggers downstream processes that sync the config to the hardware.

Business Logic:

- Transactional State Machine: The document is a state machine managed exclusively through Firestore transactions. The status field (scheduled, active, expired) on each message in the array dictates its lifecycle, and all state transitions are atomic, preventing race conditions.

- Orchestration via Cloud Tasks: The system's reliance on scheduled tasks for activation and deactivation creates a robust, time-based, event-driven architecture. It decouples the long-running lifecycle of a message from the initial, synchronous creation request.

- Hot/Cold Storage Pattern: To prevent the state document from growing indefinitely and hitting the 1MB Firestore limit, the system automatically archives old messages. This keeps the "hot" document containing active/scheduled messages small and performant.

- Preemption Logic: The system handles message priority through preemption. When a new message is set to be active immediately, the upsertMessagesAndArchiveExpired transaction atomically expires any currently active message and cancels its pending deactivation task, ensuring only one message is active at a time.

## /organizations/{organizationId}/promptTemplates/{promptName}

Description:

This entity stores a string template for a prompt to be used with a generative AI model (e.g., Google's Gemini). The document ID (promptName) serves as a unique key (e.g., "textTranslate", "textReformulate"). This allows administrators to customize and manage the prompts used for AI-powered features within their organization, such as text translation or reformulation, without requiring code changes or deployments.

Written By:

- OSKOrganizationPromptTemplateService.create: Creates a new prompt template document.

- OSKOrganizationPromptTemplateService.update: Updates the promptTemplate field of an existing document.

- OSKOrganizationPromptTemplateService.delete: Deletes a prompt template document.

Read By:

- OSKOrganizationPromptTemplateService.get: Reads a single template by its name.

- OSKOrganizationPromptTemplateService.getAll: Lists all templates for an organization.

- OSKIntercomCommunicationService.\_translateAll: Reads the 'textTranslate' prompt template to construct the prompt for the Gemini translation batch call.

- OSKIntercomCommunicationService.reformulateCommunicationWithGemini: Reads the 'textReformulate' prompt template to construct the prompt for the Gemini reformulation call.

Business Logic:

- Configuration as Data: This entity is a prime example of the "Configuration as Data" pattern. Instead of hardcoding AI prompts into the application logic, they are stored in the database. This makes the system highly flexible, allowing administrators with the correct permissions to tune AI behavior on the fly.

- Decoupling AI Logic: It effectively decouples the core business logic (e.g., in OSKIntercomCommunicationService) from the specific implementation details of the AI prompts. The communication service is only concerned with fetching a prompt by its functional name (e.g., 'textTranslate') and using whatever template is returned. This allows prompt engineers to iterate on the templates without touching the application code.

- Role-Based Access: All write and read operations are protected by the OSKUserSecurityChecks decorator, implying that access to view or modify these sensitive prompt templates is controlled by a role-based access control (RBAC) system.

## /organizations/{organizationId}/users/{userId}

Description:

This collection represents a user's membership within a specific organization. It acts as a join-table document in a NoSQL context, linking a global user from the root /users collection to an /organizations document. It is the source of truth for the user's roles and permissions within that organization, containing both the assigned role IDs and the fully resolved, consolidated permission strings.

Written By:

- OSKOrganizationUserInvitationService.processPMPInvitation: Creates this document when a user successfully accepts and processes an invitation to join an organization.

- OSKOrganizationUserService.updateOrganizationUserRoles: Updates the assignedRoles and roles fields when an administrator modifies a user's permissions.

- OSKOrganizationUserService.updateOrganizationUser: A broader update function that can modify user details (like name, email) and roles.

- OSKOrganizationUserService.deleteOrganizationUser: Deletes the document when a user is removed from an organization.

Read By:

- OSKOrganizationUserService: Reads documents for various administrative purposes: to check an admin's permissions before they perform an action (updateOrganizationUserRoles, deleteOrganizationUser), to list all users in an organization (getAllOrganizationUsersAndInvitees), and to fetch a specific user's details (getOrganizationUserById).

- OSKOrganizationUserInvitationService: Reads this document to verify that the user initiating an action (like inviting another user via inviteUserWithInvitation or cancelling an invitation via cancelUsersInvitation) has the necessary permissions (v1.org.user.create, v1.org.user.delete).

Data Replication Flow (Push/Fan-Out):

- Fan-Out to /users/{userId}/organizations/{organizationId}:
  - On Create: When processPMPInvitation creates this document, it immediately fans out the creation of a corresponding document in the user-centric path /users/{userId}/organizations/{organizationId} via OSKUserOrganizationController.default.save. This denormalization allows for efficient querying of all organizations a specific user belongs to.

  - On Update: When updateOrganizationUserRoles or updateOrganizationUser modifies the roles, the changes are propagated to the /users/{userId}/organizations/{organizationId} document via OSKUserOrganizationController.default.update to keep the denormalized data synchronized.

  - On Delete: When deleteOrganizationUser removes this document, it triggers a cascading delete of the corresponding document in /users/{userId}/organizations/{organizationId} via OSKUserOrganizationController.default.delete, ensuring data integrity.

Business Logic:

Denormalized Many-to-Many Relationship: This collections materializes the many-to-many relationship between global users and organizations. Storing the user's roles here, specific to the organization, is a key denormalization pattern that avoids complex queries.

Role-Based Access Control (RBAC): All write operations are strictly gated by permission checks. An administrator must have roles like v1.org.user.edit or v1.org.user.delete to modify or remove other users. This is enforced in every service method.

Self-Preservation Constraint: The deleteOrganizationUser service explicitly prevents a user from deleting themselves from an organization, a crucial safety check to avoid orphaned organizations or accidental lockouts.

Role Consolidation: The roles array is not just a list of assigned role IDs. It is a computed, consolidated list of all individual permission strings (e.g., 'v1.org.user.view'). This is generated by OSKConsolidatedRolesController.default.generateOrganizationUserRoles, which processes the assigned roles against the organization's master userRoles template. This pre-computation makes permission checking extremely fast at runtime, as it becomes a simple array lookup rather than a complex role resolution process.

## /organizations/{organizationId}/userInvitations/{invitationId}

Description:

This entity is a transactional state machine document that represents a pending invitation for a user to join an organization with a specific set of roles. It contains all the necessary context for the invitation, including the invitee's contact information, the sender's details, and the proposed roles. It is a temporary document that is consumed and deleted upon acceptance or cancellation, ensuring it can only be used once.

Written By:

- OSKOrganizationUserInvitationService.inviteUserWithInvitation: Creates an invitation, primarily for internal use cases or when a user already exists.

- OSKOrganizationUserInvitationService.createPMPUserWithInvitation: Creates or updates an invitation, with logic to send an email via Auth0 if the user is new to the system.

- OSKOrganizationUserInvitationService.cancelUsersInvitation: Deletes the document as part of the cancellation flow.

- OSKOrganizationUserInvitationService.processPMPInvitation: Deletes the document after it has been successfully consumed.

Read By:

- OSKOrganizationUserInvitationService.processPMPInvitation: Reads the invitation to retrieve the roles and user details required to create the permanent /organizations/{...}/users record.

- OSKOrganizationUserInvitationService.cancelUsersInvitation: Reads the invitation to get its data before moving it to the userInvitationsCancelled collection for auditing.

- OSKOrganizationUserInvitationService.queryPMPInvitations: Allows a logged-in user to query for invitations matching their email or phone number, enabling them to discover and accept pending invites.

- OSKOrganizationUserService.getAllOrganizationUsersAndInvitees: Reads all documents in this collection to provide a consolidated list of both active users and pending invitees to administrators.

Data Replication Flow (Push/Fan-Out)

- Fan-Out on Creation:
  - To /users/{userId}/organizationInvitationsPending: If the invited user already exists, inviteUserWithInvitation and createPMPUserWithInvitation create a corresponding pending invitation document in the user's subcollection via OSKOrganizationUserInvitationPendingController.default.save. This allows the user to see their own pending invitations.

  - To Access Control System: If the properties field is included in the request to inviteUserWithInvitation, the service pre-provisions access by calling OSKAccessService.createAccess, creating documents in /buildings/{bId}/accesses.

  - To Email System: createPMPUserWithInvitation checks if the user exists in Auth0. If not, it triggers an invitation email via OSKEmailService.

- Fan-Out on Consumption (processPMPInvitation):
  - To /organizations/{orgId}/users/{userId}: Creates the permanent organization user record.

  - To /users/{userId}/organizations/{orgId}: Creates the denormalized user-centric record.

  - State Transition (Deletion): The invitation document is deleted from this collection and from /users/{userId}/organizationInvitationsPending, completing the "Consume and Delete" pattern.

- Fan-Out on Cancellation (cancelUsersInvitation):
  - To /organizations/{orgId}/userInvitationsCancelled: The data from the invitation is copied to a new document in this collection for historical/audit purposes.

  - State Transition (Deletion): The invitation document is deleted from this collection and from /users/{userId}/organizationInvitationsPending.

Business Logic:

Transactional State Machine: The document's existence represents a pending workflow. Its lifecycle is strictly managed: create -> (accept -> delete) OR (cancel -> delete). This ensures an invitation is a single-use "ticket".

Idempotency: The createPMPUserWithInvitation service is designed to be idempotent. It checks for existing invitations and compares contact details to avoid sending redundant email notifications if an admin simply re-saves an invitation without changes.

Time-Bound Execution: The processPMPInvitation function checks an expirationDate field on the document, enforcing that invitations are only valid for a limited time.

Pre-provisioning of Access: The system supports defining access rights to properties and buildings directly within the invitation. This access is provisioned at the time of invitation, a significant architectural choice that grants access before the user has even accepted.

Discovery Mechanism: The queryPMPInvitations function provides a crucial discovery mechanism for users. A user can authenticate and "pull" any invitations sent to their verified contact methods (email/phone), rather than relying solely on finding an invitation link in an email.

## /organizations/{organizationId}/userInvitationsCancelled/{invitationId}

Description:

This entity is an audit log document. It stores a copy of an userInvitations document that has been explicitly cancelled by an administrator. Its sole purpose is to maintain a historical record of cancelled invitations for tracking and auditing purposes, ensuring that data is not permanently lost when an invitation is revoked.

Written By:

- OSKOrganizationUserInvitationService.cancelUsersInvitation: This is the only service that writes to this collection. It creates a new document here as part of the cancellation transaction, copying all the data from the original invitation and adding a cancellationDate.

Read By:

Evidence not found in the provided context. This collection is write-only within the provided services, consistent with its purpose as an audit log. It is presumably read by administrative tools or for support purposes not covered in the analyzed code.

Data Replication Flow (Push/Fan-Out)

- This entity is the target of a fan-out flow. It does not trigger any subsequent data replication itself.

- Fan-In from /organizations/{orgId}/userInvitations: When cancelUsersInvitation is called, it reads an existing invitation and uses that data to create a new document in this collection.

Business Logic:

- Audit Trail Pattern: This collection implements a simple and effective audit trail. Instead of just deleting an invitation, the system moves it to an "archive" or "cancelled" state in a separate collection. This preserves the history of who was invited, by whom, and when it was cancelled.

- Data Preservation: This pattern ensures that important business data is not lost. If there are questions about why a user doesn't have access, administrators can check this collection to see if their invitation was revoked.

- Decoupling Active vs. Inactive Data: By moving cancelled invitations to a separate collection, the primary userInvitations collection remains clean and only contains active, pending invitations. This improves query performance on the active collection, as it doesn't get cluttered with historical data.

## /pendingOrganizations/{pendingOrganizationId}

**The /pendingOrganizations/ collection and the its code base is currently not been implemented in Production: It is awaiting review. Do not consider it in context or analysis atthis time**

Description This entity represents a request from a user to create a new organization. It is a temporary, transactional document that functions as a state machine, holding the proposed organization's data (name, address, tax number) and tracking its approval status (pending, approved, rejected). Its lifecycle is managed by an administrative approval workflow, and its primary purpose is to orchestrate the creation of a permanent Organization document upon successful validation.

Written By

OSKOrganizationPendingService.createPendingOrganization: Creates the document with status: 'pending'. This is initiated by an authenticated end-user.
OSKOrganizationPendingService.approvePendingOrganizationRequest: Updates the document's status to 'approved'. This is a privileged action performed by an administrator.
OSKOrganizationPendingService.rejectPendingOrganizationRequest: Updates the document's status to 'rejected'. This is a privileged action performed by an administrator.
Read By

OSKOrganizationPendingService.getCurrentUserPendingOrganizations: Reads all pending organization requests submitted by the currently authenticated user.
OSKOrganizationPendingService.getAllPendingOrganizations: Reads all documents in the collection for an administrator with the v1.admin.org.validate permission.
OSKOrganizationPendingService.getPendingOrganizationById: Reads a single pending request by its ID, also requiring the v1.admin.org.validate permission.
OSKOrganizationPendingService.approvePendingOrganizationRequest: Reads the document to retrieve its data before triggering the creation of the actual organization.
OSKOrganizationPendingService.rejectPendingOrganizationRequest: Reads the document to validate its existence before marking it as rejected.
Data Replication Flow (Push/Fan-Out) The approval of this document is a major orchestration event with significant fan-out:

Fan-Out to /organizations: The approvePendingOrganizationRequest function is the primary orchestrator. Upon approval, it calls OSKOrganizationService.createAnOrganization, which creates a new, permanent document in the /organizations collection using the data from this pending request.
Fan-Out to /organizations/{organizationId}/userInvitations: Immediately after the new organization is created, approvePendingOrganizationRequest calls OSKOrganizationUserInvitationService.inviteUserWithInvitation. This creates a new invitation document in the /organizations/{newlyCreatedOrgId}/userInvitations subcollection, inviting the user who originally submitted the request to become the first administrator of the new organization (with the v1.org.user.create role).
Business Logic

Transactional State Machine: This entity is a classic example of a document acting as a state machine. Its status field (pending, approved, rejected) dictates the state of the workflow. The document is temporary by nature; its purpose is fulfilled once it is either approved (leading to permanent records being created) or rejected.
Admin Approval Workflow: The entity facilitates a critical business process where end-users can request the creation of a new tenant (organization), but this request must be vetted and approved by a privileged administrator. This prevents uncontrolled creation of organizations.
Role-Based Access Control (RBAC): The workflow is strictly gated by permissions. While any authenticated user can create a pending request, only administrators with the v1.admin.org.validate role can view the entire queue and perform the approval or rejection actions.
Orchestration Hub: The approvePendingOrganizationRequest function demonstrates this entity's role as an orchestrator. The update of the status field is not an isolated event; it's the trigger for a chain of dependent operations: creating the core Organization entity, creating its root Entity (a side-effect of createAnOrganization), and then bootstrapping the organization's user base by creating the first user invitation.

## /properties/{propertyId}

Description:

This entity represents a real estate property, which serves as a logical container for one or more buildings. It is a key node in the system's hierarchy, linking a set of buildings to a specific subEntity within an Organization. The document stores descriptive information such as the property's name, address, type, and an array of building IDs that belong to it.

Written By:

- OSKPropertyService.createProperty: Creates the property document.

- OSKPropertyService.updateProperty: Updates fields within the property document.

- OSKPropertyService.deleteProperty: Deletes the property document.

- OSKPropertyService.assigningPropertyToEntity: Updates the entityId field when a property is moved from one entity to another.

- OSKPropertyService.uploadImage / deletePropertyImage: Updates the propertyImage field with a filename from cloud storage or deletes it.

Read By:

- OSKPropertyService.getAllProperties: Lists all properties belonging to a specific entity.

- OSKPropertyService.getPropertyById: Fetches a single property document by its ID for viewing.

- OSKPropertyService.getPropertyDashboardStatics: Reads the property to identify its associated buildings, which is the first step in calculating aggregate statistics for a dashboard.

- OSKPropertyService.updateProperty, OSKPropertyService.deleteProperty, OSKPropertyService.assigningPropertyToEntity: Read the document to validate its existence and permissions before performing a write operation.

- OSKOrganizationUserController: The getOrganizationAdmins method is called by getPropertyDashboardStatics to get a count of admins.

- OSKOrganizationResidentsController: The getResidentsQueryFilters method is called by getPropertyDashboardStatics to get resident counts for the property's buildings.

Data Replication Flow (Push/Fan-Out)

- Fan-Out to /entities/{entityId} (on Create): When createProperty is called, it atomically adds the new propertyId to the propertiesIds array of the parent Entity document by calling OSKEntityController.default.update. This maintains the parent-child link.

- Fan-Out to /buildings/{buildingId} (on Create/Update): When a property is created or updated with an array of buildings, the service iterates through them and calls OSKBuildingController.default.update for each one, setting the propertyId on the corresponding /buildings/{buildingId} document. This establishes the link from the building back to the property.

- Fan-Out to /buildings/{buildingId} (on Delete): When deleteProperty is called, it iterates through the buildings array stored on the property document and calls OSKBuildingController.default.update for each building to clear its propertyId field (propertyId: ''), thus preventing orphaned references.

- Fan-Out to /entities/{entityId} (on Move): The assigningPropertyToEntity function orchestrates moving a property between entities. It performs two fan-out writes: one to add the propertyId to the new parent entity's propertiesIds array (FieldValue.arrayUnion) and another to remove it from the old parent entity's array (FieldValue.arrayRemove).

Business Logic:

- Strict Hierarchical Structure: A property is not a top-level object. The business logic in createProperty enforces that a property can only be attached to an entity of type subEntity. This rule is critical for maintaining the integrity of the system's data hierarchy: Organization -> Entity -> Sub-Entity -> Property -> Building.

- Role-Based Access Control (RBAC): All CRUD operations are protected by permission checks. An administrator must have the appropriate roles within the organization (e.g., v1.org.property.create, v1.org.property.edit) to manage properties. This is checked via OSKConsolidatedRolesController.default.checkUserPermissions.

- Aggregation Point for Read-Optimization: The getPropertyDashboardStatics function highlights the entity's role as an aggregation point. It uses the propertyId as a starting point to efficiently gather statistics (resident counts, admin counts, device counts) from across multiple buildings and collections without needing to scan large portions of the database. This is a key read-optimization pattern for dashboarding.

- Data Integrity Management: The service ensures data integrity during lifecycle events. On creation, it links itself to its parent (Entity) and children (Building). On deletion, it un-links itself from its children to prevent dangling pointers. When moved, it correctly re-parents itself in the entity hierarchy.

## /settings/{settingId}

Description:

This collection is a meta-configuration document that defines the naming convention for role-based access control (RBAC) permissions associated with a specific settings module. The document ID (settingId) corresponds to a module name (e.g., "roles", "workflows"). It stores the specific permission strings for standard CRUD operations (viewRole, createRole, editRole, deleteRole) and the name of the top-level administrative composite role for that module.

Written By:

- OSKSettingService.onCreateSettingsCalled: This is a callable function intended for database seeding. It iterates through a hardcoded array of setting names (['role', 'workflow']) and creates a corresponding settings document for each, populating it with a standardized set of role names.

Read By:

Evidence not found in the provided context. This document is a configuration leaf node. It is architecturally intended to be read by other services to dynamically determine the required permission strings for an action, but no such reads are present in the analyzed code.

Data Replication Flow (Push/Fan-Out)

- Evidence not found in the provided context. This entity does not trigger any data replication or side effects when written.

Business Logic:

- Configuration as Data: This entity embodies the "Configuration as Data" pattern. Instead of hardcoding permission strings (e.g., "v1.admin.settings.role.view") throughout the application, this document centralizes the naming convention. This allows the permission structure to be defined and potentially altered in the database, decoupling it from the application code.

Database Seeding: The onCreateSettingsCalled function serves as a one-time or maintenance script to initialize the required configuration for the settings modules. It ensures that the foundational RBAC structure is present in the database.

Permission Scoping: By creating a document per setting type, the system scopes permissions logically. This pattern makes it clear which set of roles governs which administrative module (e.g., the roles defined in /settings/roles govern the role management feature).

## /settings/{settingId}/compositeRoles/{compositeRoleId}

Description:

This collection is the core component of the system's hierarchical Role-Based Access Control (RBAC) model. It defines a "composite role" as a named group that can contain both granular, individual roles (roles) and other, nested composite roles (compositeRoles). This allows for the construction of complex permission sets from smaller, reusable building blocks. The document also stores multilingual titles and descriptions for display in administrative user interfaces.

Written By:

- OSKCompositeRoleService.onCreateCompositeRolesCalled: This is the primary writer. It's a callable function designed to synchronize the entire composite role hierarchy from a "source of truth" data file (composite_roles_translated.data.ts) into Firestore. It recursively processes the data and uses OSKCompositeRoleController.default.save to create or update documents.

- OSKCompositeRoleService.onDocumentCreated: A Firestore trigger that enriches the document with a creationDate upon its initial creation.

- OSKCompositeRoleService.onDocumentUpdated: A Firestore trigger that is the source of a major fan-out flow.

Read By:

- OSKCompositeRoleService.onCreateCompositeRolesCalled: Reads all existing composite roles from the database to compare against the source data file, enabling it to identify and delete orphaned roles that are no longer defined in the code.

- OSKCompositeRoleService.getAllCompositeRoles / getOrganizationCompositeRoles: Callable functions that list all composite roles, intended for an admin UI to manage permissions.

- OSKCompositeRoleService.onDocumentUpdated / onDocumentDeleted: Firestore triggers that read the document's data to correctly propagate changes or deletions to dependent roles.

Data Replication Flow (Push/Fan-Out)

- Fan-Out to /settings/{settingId}/roles: This is a critical event-driven flow.
  - The onDocumentUpdated trigger calls OSKCompositeRoleController.default.createorUpdateDependantRoles. This implies that when a composite role is modified (e.g., a new individual role is added to it), this change is propagated by creating or updating the corresponding document in the /settings/{settingId}/roles collection.

  - The onDocumentDeleted trigger calls OSKCompositeRoleController.default.deleteOrUpdateDependantRoles, which cascades the deletion to ensure that individual roles that were part of the deleted composite role are correctly updated or removed.

  - The onCreateCompositeRolesCalled seeder function also directly writes to this collection via OSKRoleController.default.save as it processes the hierarchy.

Business Logic:

- Hierarchical RBAC Model: This entity enables a powerful and flexible permission system where high-level roles (e.g., "Organization Administrator") can be composed of multiple lower-level roles (e.g., "User Manager", "Building Manager"), which are in turn composed of granular permissions.

- Source of Truth in Code: The system uses the composite_roles_translated.data.ts file as the definitive source for the entire role structure. The onCreateCompositeRolesCalled function acts as a synchronization script that aligns the database state with this file, providing a reliable and version-controlled way to manage permissions.

- Event-Driven Consistency: The use of onDocumentUpdated and onDocumentDeleted triggers ensures that the relationship between composite roles and the individual roles they contain is kept consistent automatically. Modifying a composite role reliably triggers the necessary updates to its constituent parts without requiring manual intervention.

## /settings/{settingId}/roles/{roleId}

Description:

This collection represents a single, atomic permission string (e.g., v1.org.communications.create) within the RBAC system. It is the most granular unit of permission. The document stores multilingual titles and descriptions for UI display and a parentCompositeRoles array that lists all the composite roles that grant this specific permission.

- Written By:

- OSKCompositeRoleService.processRoleHierarchy: This is a helper function called by the main onCreateCompositeRolesCalled seeder. As it traverses the composite role data from the source file, it extracts these individual role definitions and writes them to the database using OSKRoleController.default.save.
  Read By

- OSKCompositeRoleService.onCreateCompositeRolesCalled: Reads all documents in this collection to perform a diff against the source data file, allowing it to identify and delete orphaned roles that are no longer in use.

Data Replication Flow (Push/Fan-Out)

- Evidence not found in the provided context. This entity is a leaf node in the configuration hierarchy and primarily serves as a target of fan-out from the compositeRoles entity. It does not trigger any further data replication itself.

Business Logic:

- Atomic Permission Unit: This entity represents the fundamental "right" a user can have. All security checks ultimately resolve to checking for the presence of one of these role IDs in a user's consolidated permission list.

- Denormalization for Read-Optimization: The parentCompositeRoles array is a denormalization pattern. It pre-calculates and stores which composite roles grant this permission. While not used in the provided code, this structure would allow an admin UI to quickly answer the question "Who can perform this action?" by tracing back through the parent roles.

- Managed as a Dependency: The lifecycle of this entity is entirely managed as a side-effect of the compositeRoles lifecycle. It is created, updated, or deleted only when the composite roles that contain it are modified, ensuring it never exists in an orphaned state.

## /settings/appstore

Description:

This is a singleton configuration document, identified by the static ID "appstore". It stores global settings related to mobile application stores (Apple App Store, Google Play Store). Its primary function is to hold a list of special activationCode values, which are used to identify and grant access to specific users, such as app store reviewers, during the onboarding process.

Written By:

- Evidence not found in the provided context. As a global configuration document, it is likely created and updated manually through the Firebase console or via a separate, excluded administrative script.

Read By:

- OSKAppStoreSettingsService.validateInternally: This is the main reader. It fetches the document and searches the stores array for an entry matching a provided activationCode.

- OSKAppStoreSettingsService.getAppstoreInformation: Reads the document to extract the store URLs, which are then passed to other services or clients.

Data Replication Flow (Push/Fan-Out)

- Evidence not found in the provided context. This entity is a configuration leaf node and does not trigger any data replication.

Business Logic:

- Singleton Pattern: The service consistently uses OSKAppStoreSettingsController.default.get('appstore'), indicating this is a singleton document with a fixed, well-known ID. This is a common NoSQL pattern for storing global application settings.

- Configuration as Data: Storing app store URLs and special activation codes in the database allows this information to be updated without requiring a new application deployment.

- Special Case Workflow Trigger: The core purpose of this entity is to enable a special branch in the user onboarding workflow. When the main onboarding service encounters an activation code, it calls validateInternally. If a match is found here, the onboarding service can then proceed with a specific logic path designed for app store reviewers, bypassing standard validation and granting access to a predefined test environment.

## /suppliers/{supplierId}

Description:

This colelction represents a third-party supplier company (e.g., a maintenance or cleaning service) that operates within the ecosystem. It serves as the root document for a supplier, linking it to a specific organizationId and an entityId within that organization's hierarchy. It holds the supplier's official details, such as name, address, and tax number (siret).

Written By:

- OSKSupplierService.createSupplier: Creates the document, initiated by an organization administrator with v1.org.suppliers.create permissions.

- OSKSupplierService.updateSupplier: Updates the document, requiring v1.org.suppliers.edit permissions.

- OSKSupplierService.deleteSupplier: Deletes the document, requiring v1.org.suppliers.delete permissions. This action triggers a major cleanup cascade.

Read By:

- OSKSupplierService: Reads documents for CRUD operations, permission validation, and to list all suppliers within an organization (getAllSuppliers).

- OSKSupplierStaffActivityService / OSKSupplierStaffActivityAggregatesService: These services perform a full collection scan (OSKSupplierController.default.getAll()) to find a staff member's parent supplier based on a userId. This is a significant read operation.

Data Replication Flow (Push/Fan-Out)

- Fan-Out on Deletion (deleteSupplier):
  - The deletion of a supplier document acts as a master "kill-switch" for that supplier and all its related data.
  - Cascading Deletion to Staff: The service calls OSKSupplierStaffService.\_deleteStaffMemberAndRelatedData for every staff member belonging to the supplier. This function, in turn, triggers a further cascade:

Fan-Out to Access Control System:

- Deletes all access rights for the staff member from the /buildings/{bId}/accesses collection.

Fan-Out to Pincode System:

- Deletes all associated pincodes from both /suppliers/{...}/pincodes and /buildings/{bId}/pincodes.

Hardware/External Sync:

- Publishes a Delete message for each access right to all relevant physical Access Control Devices (ACDs) via OSKAccessMessagePublisherService.publishMessageToAllACDs.

Fan-Out to Sub-collections:

- Deletes all documents from /suppliers/{sId}/staffMembers/{staffId}/accesses and finally deletes the /suppliers/{sId}/staffMembers/{staffId} document itself.

Business Logic:

- Hierarchical Anchor: This entity anchors a supplier within the broader organizational structure, linking it to a specific entityId. This allows for scoped management of suppliers within different parts of an organization.

- Orchestration of Cascading Deletion: The primary business logic is centered around data integrity, especially upon deletion. The deleteSupplier service is not a simple document removal; it's an orchestrator that guarantees a complete and clean wipe of a supplier's footprint across the entire distributed system, including physical hardware, preventing orphaned data and security loopholes.

- Permission Gated: All interactions with this entity are strictly controlled by a Role-Based Access Control (RBAC) system, ensuring only authorized organization administrators can manage suppliers.

## /suppliers/{supplierId}/staffMembers/{staffId}

Description:

This collection represents an individual employee of a supplier company. It stores the staff member's personal and contact information (firstName, lastName, email, phone) and serves as the root document for all data related to that specific person, including their access rights and activity logs.

Written By:

- OSKSupplierStaffService.createStaffMember: Creates the document, requiring v1.org.suppliers.create permission.

- OSKSupplierStaffService.updateStaffMember: Updates the document, requiring v1.org.suppliers.edit permission.

- OSKSupplierStaffService.deleteStaffMember: Deletes the document, requiring v1.org.suppliers.delete permission, which triggers a full cleanup of the staff member's data.

Read By:

- OSKSupplierStaffService: Reads documents for CRUD operations and for listing all staff members of a supplier (getAllStaffMembers).

- OSKSupplierService.getSupplierStaffFromAllSuppliers: A helper function that iterates through all suppliers and their staff to find a specific staff member by their ID. This is used by the activity services to enrich raw event data.

Data Replication Flow (Push/Fan-Out)

- Fan-Out on Deletion (\_deleteStaffMemberAndRelatedData):
  - Similar to the parent supplier, deleting a staff member triggers a comprehensive data cleanup cascade.

- Fan-Out to /suppliers/{sId}/staffMembers/{staffId}/accesses:
  - Reads all access documents for the staff member.

- Fan-Out to Access Control System:
  - For each access found, it calls \_deleteAccessSideEffects, which deletes the corresponding documents in /buildings/{bId}/accesses.

- Fan-Out to Pincode System:
  - Deletes associated pincodes from /suppliers/{...}/pincodes and /buildings/{bId}/pincodes.

Hardware/External Sync: Publishes a Delete message to physical devices for each access right via OSKAccessMessagePublisherService.publishMessageToAllACDs.

Business Logic:

- Central Record for Staff: This document acts as the central point of reference for a supplier's employee. All other data specific to this person (accesses, pincodes, activities) is stored in sub-collections under this document.

- Data Integrity through Orchestrated Deletion: The deleteStaffMember and its helper \_deleteStaffMemberAndRelatedData ensure that removing a staff member from the system is a clean and complete operation, revoking all their access rights both in the database and on physical hardware.

- Scalability Concern: The lookup pattern used by getSupplierStaffFromAllSuppliers (scanning all suppliers to find one staff member) is a significant scalability risk and suggests a need for a root-level index to map a staffId directly to its supplierId.

## /suppliers/{supplierId}/staffMembers/{staffId}/accesses/{buildingId}

Description:

This is a denormalized document that aggregates all access rights a specific staff member has for a single building. The document ID is the buildingId. It contains an array of accesses, where each element represents a distinct grant of access with its own validity period and authorized doors. This aggregation pattern avoids a proliferation of tiny documents for each individual access grant.

Written By:

- OSKAccessService.createAccess: When creating an access of type SupplierStaff, this core service calls

- OSKSupplierStaffAccessService.createOrUpdateSupplierStaffAccess, which either creates this document or adds a new access object to the accesses array if the document already exists.

- OSKSupplierStaffService.updateSupplierStaffAccessDoors: Updates the authorizedDoors within a specific access object inside the accesses array.

- OSKSupplierStaffService.deleteSupplierStaffAccess: Removes a specific access object from the accesses array. If the array becomes empty, the entire document is deleted.

Read By:

- OSKSupplierStaffService: Reads these documents to list all accesses for a staff member or to perform updates/deletions.

- OSKSupplierStaffAccessService.getAllAccessesForAllBuildings: Reads all access documents for a staff member to provide a consolidated view of their permissions across all buildings.

Data Replication Flow (Push/Fan-Out)

- Fan-In from /buildings:
  - Upon creation, createOrUpdateSupplierStaffAccess reads the root /buildings/{buildingId} document to denormalize the buildingName, buildingStreetAddress, and buildingImageFilename. This is a read-optimization pattern to enrich this document for faster UI rendering.

- Fan-Out on Door Update (updateSupplierStaffAccessDoors):

- Fan-Out to /buildings/{buildingId}/accesses:
  - Propagates the change in authorized doors to the corresponding building-level access document to maintain consistency.

- Hardware/External Sync: Publishes an Update message to physical devices via OSKAccessMessagePublisherService.publishMessageToAllACDs to sync the new door permissions.

- Fan-Out on Deletion (deleteSupplierStaffAccess):
  - Calls \_deleteAccessSideEffects, which triggers deletion of pincodes, building-level access records, and sends a Delete message to physical hardware.

Business Logic:

- Aggregation Pattern: This entity aggregates multiple access grants for a single user/building pair into one document. This is an efficient NoSQL pattern that reduces the number of documents and simplifies queries for a user's access in a specific location.

- Upsert Logic: The createOrUpdateSupplierStaffAccess function uses an "upsert" (update or insert) logic. It checks for the document's existence and either creates it or atomically adds to the accesses array, ensuring data consistency.

- Hardware Synchronization: The entity's lifecycle is tightly coupled with physical hardware. Both updates to doors and deletion of an access right trigger a fan-out to the OSKAccessMessagePublisherService, ensuring that changes made in the software are reflected on the physical access control devices.

## /suppliers/{supplierId}/staffMembers/{staffId}/pincodes/{pincode}

Description:

This entity stores a single, unique pincode assigned to a staff member for a specific access grant. The document ID is the pincode string itself, allowing for fast lookups. It contains references back to the buildingId and the accessId it is associated with, providing the necessary context for its use.

Written By:

- OSKSupplierStaffPincodeService.createPincodeDocument: This is the sole writer, called by the core OSKAccessService.createAccess function during the access provisioning flow.

Read By:

- OSKSupplierStaffService.getAllStaffMembers: Reads all pincodes for a staff member to enrich the response with access details.

- OSKSupplierStaffService.\_deleteAccessSideEffects: Reads the document by accessId to find the pincode string in order to orchestrate its deletion from all relevant collections.

Data Replication Flow (Push/Fan-Out)

- This entity is a target of the fan-out from the OSKAccessService.createAccess workflow.
  - Its creation is paired with the creation of a corresponding document in /buildings/{buildingId}/pincodes.

  - Its deletion, triggered by \_deleteAccessSideEffects, is paired with the deletion of the corresponding document from /buildings/{buildingId}/pincodes via OSKPincodeService.deleteBuildingPincodeAndMoveToTrash.

Business Logic:

- Paired Document Pattern: This document does not exist in isolation. Its lifecycle is directly tied to a corresponding pincode document in the /buildings collection. This duplication serves different query patterns: one for querying by staff member, and one for querying by building.

Contextual Link: The document acts as a link, connecting a pincode to a specific accessId. This is crucial for the system to know which doors and timeframes the pincode is valid for.

## /suppliers/{supplierId}/staffMembers/{staffId}/activities/{activityId}

Description:

This entity is an immutable, individual log entry representing a single event (e.g., "access granted", "access denied") from an access control device that has been attributed to a supplier staff member. This collection serves as the raw, detailed, and permanent audit trail for all staff member activities.

Written By:

- OSKSupplierStaffActivityService.ActivityReceivedForSupplierStaff: This is the only writer. It is a handler function called by a higher-level activity enrichment pipeline after an event from a physical device has been processed and identified as belonging to a supplier staff member.

Read By:

- OSKSupplierStaffActivityService.getActivityById / getAllActivities: These functions allow an administrator with v1.org.suppliers.view permission to retrieve individual activity records or a complete list for a specific staff member.

Data Replication Flow (Push/Fan-Out)

- Fan-In from Activity Pipeline:
  - This entity is a target of a fan-out flow. It is created after a raw device event is received and enriched with user, building, and door information.

  - This entity is a terminal node; its creation does not trigger any subsequent data replication.

Business Logic:

- Immutable Audit Log: This collection functions as a detailed, write-once audit log. Each document represents a historical fact that should not be altered.

- Decoupled Event Handling: The creation of this document is decoupled from the initial event. A separate service is responsible for processing raw events and routing them to the correct handler (in this case, ActivityReceivedForSupplierStaff), which is a robust pattern for event-driven systems.

- Inefficient Data Enrichment: The service uses OSKSupplierService.getSupplierStaffFromAllSuppliers to find the staff member's details. This requires scanning the entire /suppliers collection for every single activity event, which is a severe performance bottleneck and scalability issue.

## /suppliers/{supplierId}/staffMembers/{staffId}/activityAggregates/{buildingId}

Description:

This is a denormalized, read-optimized document that aggregates recent activity (last 30 days) for a specific staff member within a specific building. The document ID is the buildingId. It contains a bounded array of recent activities, designed to provide a fast-loading activity feed in a UI without needing to query the large, granular activities collection.

Written By:

    - OSKSupplierStaffActivityAggregatesService.ActivityReceivedForSupplierStaff: This is the only writer. It's a handler called by the same activity enrichment pipeline. It "upserts" the new activity into the document's activities array and simultaneously removes any entries older than 30 days.

Read By:

- OSKSupplierStaffActivityAggregatesService.getActivityByBuildingId:
  - This is the primary reader, allowing an administrator with v1.org.suppliers.view permission to fetch the recent activity summary for a staff member in a specific building.

Data Replication Flow (Push/Fan-Out)

- Fan-In from Activity Pipeline:
  - Like the individual activity document, this is a target of fan-out from the main activity processing pipeline.

Business Logic:

- Denormalization for Read Optimization: This entity is a classic example of an aggregation pattern used to optimize read performance. It pre-computes and stores a view of the data (recent activities) that is frequently requested by the application's UI.

- Rolling Window Aggregation: The service logic implements a rolling 30-day window. Upon receiving a new activity, it adds it to the array and filters out old entries within the same transaction. This keeps the document size under control and ensures the data remains relevant.

- Upsert Pattern: The service first attempts to read the aggregate document. If it exists, it updates the array; if not, it creates a new document. This is a robust pattern for managing aggregate data.

- Inefficient Data Enrichment: This service also relies on the inefficient getSupplierStaffFromAllSuppliers lookup, posing the same scalability risk as the individual activity service.

## Utility & Support Services

### Auth0 Orchestration Service

Description:

The OSKAuth0Service is a high-level module that acts as the central orchestration engine and facade for all interactions with the Auth0 identity provider. It is not responsible for a single Firestore collection but rather for the complex, distributed transactions that bridge the system's user identity model with Auth0. Its primary responsibilities include exchanging Auth0 tokens for Firebase tokens, managing a sophisticated user migration strategy, handling Multi-Factor Authentication (MFA) lifecycle, and processing passwordless OTP flows. It is the single source of truth for any business logic that needs to interact with the external identity provider.

Primary Methods and Triggers:

- OSKAuth0Service.exchangeAuth0Token: The main entry point for user authentication. It is called by a client application with an Auth0 JWT and returns a Firebase custom token, orchestrating user creation or migration in the process.

- OSKAuth0Service.enableMfa / disableMfa: Callable functions that manage the lifecycle of a user's MFA settings within Auth0.

- OSKAuth0Service.syncMfaPhoneNumberToProfile: A utility to synchronize a phone number from a user's MFA enrollment to their main user profile in Auth0.

- OSKAuth0Service.sendOTPEmail / verifyOwnershipOTP: Services that manage a passwordless email verification flow by sending and verifying one-time codes via Auth0.

- OSKAuth0Service.deleteAuth0User: A critical function called during user deletion workflows to ensure the user is also removed from the Auth0 tenant.

Data Read Patterns

- Google Secret Manager: Reads Auth0 domain and M2M client credentials via OSKSecretService.getSecret.

- Auth0 JWKS Endpoint: Reads Auth0's public signing keys via jwks-rsa to validate incoming JWTs.

- Firebase Authentication: Reads user records by UID (auth.getUser) and by email (auth.getUserByEmail) to determine if a user exists during the token exchange and migration flow.

Auth0 Management API:

- Reads user profiles (/api/v2/users/{id}), MFA enrollments (/api/v2/users/{id}/authenticators), and user lists by email (/api/v2/users-by-email) to get phone numbers or check for user existence.

Firestore (/users):

- The exchangeAuth0Token method reads the /users collection via OSKUserController to update the auth0Sub field during user migration.

Data Replication Flow (Push/Fan-Out)

- The OSKAuth0Service orchestrates several critical fan-out processes that bridge Firebase with the Auth0 identity platform.

Fan-Out to Firebase Authentication (on exchangeAuth0Token):

- User Creation: If a user is completely new, a new user record is created in Firebase Authentication using the Auth0 sub as the Firebase uid.
  - Evidence: auth.createUser({ uid: uid, ... })

- User Update: If a user is found but their email has changed in Auth0, the service updates the email on the corresponding Firebase Authentication user record.
  - Evidence: auth.updateUser(uid, { email: email })

Fan-Out to Firestore (on exchangeAuth0Token):

- User Migration: During the migration of a pre-existing user, the service updates their document in the /users collection to store the Auth0 sub ID. This links the existing Firebase user to their new Auth0 identity.
  - Evidence: OSKUserController.default.updateFields(existingUid, { auth0Sub: uid })

- Data Consistency: When an email mismatch is detected and corrected in Firebase Auth, the change is also propagated to the user's document in the /users collection.
  - Evidence: OSKUserController.default.updateFields(uid, { email: email })

Fan-Out to Auth0 Management API:

- MFA Management: The enableMfa and disableMfa functions make calls to the /api/v2/users/{id}/authenticators endpoint to create or delete a user's MFA factors in Auth0.

- User Profile Updates: The syncMfaPhoneNumberToProfile and updateUserEmail functions make PATCH requests to the /api/v2/users/{id} endpoint to update a user's user_metadata or primary profile details in Auth0.

- User Deletion: The deleteAuth0User function makes a DELETE request to the /api/v2/users/{id} endpoint to permanently remove the user from the Auth0 tenant.

Fan-Out to Auth0 Authentication API:

- The sendOTPEmail function makes a POST request to the /passwordless/start endpoint to trigger Auth0 to send a one-time code to a user's email.

Business Logic

Facade and Orchestration Pattern: The service acts as a classic Facade, providing a clean, high-level API (exchangeAuth0Token, enableMfa) that hides the complex, multi-step interactions with both the Auth0 Management/Authentication APIs and the Firebase
Admin SDK. It orchestrates the entire identity workflow.

Lazy Initialization of Secrets: The ensureInitialized method implements a robust lazy-loading pattern for secrets. It uses a promise (initializationPromise) to ensure that the required Auth0 credentials are fetched from Secret Manager only once and that any subsequent calls wait for the initialization to complete before proceeding. This is efficient and prevents race conditions.
Sophisticated User Migration Strategy: The exchangeAuth0Token method contains a critical, multi-step migration logic designed for
a system transitioning to Auth0:

Primary Path (Auth0 UID): It first tries to find a Firebase user whose uid matches the Auth0 sub. This is the fastest path for new and already-migrated users.

Migration Path (Email): If not found, it searches for a Firebase user by email. If a match is found, it signifies an existing user who is logging in via Auth0 for the first time. The service then "links" them by fanning-out the Auth0 sub to their Firestore document (auth0Sub field).

Creation Path (New User): If the user is not found by uid or email, the service creates a brand new user in Firebase Auth, using the Auth0 sub as the permanent Firebase uid.

Secure Token Validation: The service correctly implements JWT validation by using the jwks-rsa library to fetch Auth0's public signing keys based on the kid in the token header. It then uses jsonwebtoken to verify the token's signature, issuer, and algorithm, ensuring that only valid tokens from the correct Auth0 tenant are accepted.

### Country Service (OSKCountryService)

Description:

This is a simple utility service that provides a static list of countries supported by the application. It offers two endpoints: one that requires user authentication and another that does not, likely to support different use cases such as registration forms (unauthenticated) and user profile settings (authenticated).

Primary Methods and Triggers

- OSKCountryService.onGetCountries: A callable function that returns the list of countries for an authenticated user.

- OSKCountryService.onGetCountriesNoAuth: A callable function that returns the list of countries without requiring user authentication.

Data Read Patterns

- Static Data: The primary data source is a static countries array imported from the @oskey/core package. The service does not read this data from Firestore.

- Firebase (/users, Firebase Auth): The authenticated onGetCountries method reads the user's record from both Firestore (OSKUserController.default.get) and Firebase Authentication (auth().getUser) purely for validation purposes, to ensure the requesting user is valid before returning the static data.

Data Replication Flow (Push/Fan-Out)

- Evidence not found in the provided context. This is a read-only service that returns static data and does not trigger any data replication or side effects.
  Business Logic

Configuration as Code:

The service follows a "Configuration as Code" pattern, where the list of supported countries is maintained as a static array within the codebase. This is suitable for data that changes infrequently and can be updated with new application deployments.

Security Gating: The service provides two distinct endpoints with different security postures.

- onGetCountries is gated by both App Check and user authentication, making it suitable for use within a logged-in user session.
- onGetCountriesNoAuth is only gated by App Check, making it appropriate for public-facing parts of the application where a user may not be logged in yet.

### Public Key Controller (OSKPublicKeysController)

Description:

This is a low-level data access controller responsible for managing cryptographic public key documents within Firestore. It provides utility methods to add and delete keys within a specific document structure that holds a map of keys. It also contains the critical logic for decompressing elliptic curve public keys into a format required by the system. As a controller, it is not called directly by clients but is used by other services that need to manage cryptographic keys.

Primary Methods and Triggers

- OSKPublicKeysController.addPublicKey: An internal method called by other services to add a new public key to a document.

- OSKPublicKeysController.deletePublicKey: An internal method called by other services to remove a public key from a document.

Data Read Patterns

- Firestore: Reads a document from a given collection path before updating it to add or remove a key from the keys map.

Data Replication Flow (Push/Fan-Out)

- Evidence not found in the provided context. This controller is a utility for writing data and does not orchestrate any fan-out itself. It is a target of other services' workflows.

Business Logic

Cryptographic Utility: The core business logic is the key decompression in addPublicKey. It uses the Node.js crypto library to take a standard public key format, export it as a JSON Web Key (JWK), and extract the x and y coordinates. These are then concatenated and Base64 encoded. This transformation is likely required for a downstream system or a specific cryptographic library that expects the key in this decompressed format.

Upsert Pattern: The addPublicKey method implements an "upsert" (update or insert) pattern. It first checks if the target document exists. If it does, it updates the keys map within it. If not, it creates a new OSKPublicKeysDocument with the new key. This makes the controller's API robust and idempotent.

### Storage Service (OSKStorageService)

Description:

This service orchestrates secure file uploads to Google Cloud Storage. It follows a two-step, event-driven workflow. First, a callable function (generateUploadSignedUrlCallable) validates user permissions and generates a short-lived, secure URL for the client to upload a file directly. Second, a Cloud Storage trigger (onFinalize) fires after the upload is complete to perform any necessary post-processing, such as updating a Firestore document with the new file's path.

Primary Methods and Triggers

- OSKStorageService.generateUploadSignedUrlCallable: A callable function that generates a secure URL for a client to upload a file to Google Cloud Storage.

- OSKStorageService.onFinalize: A Cloud Storage trigger that executes after a file upload has successfully completed.

Data Read Patterns

- Firestore (/organizations/{orgId}/users/{userId}): The generateUploadSignedUrlCallable function reads an organization user's document via OSKOrganizationUserController.default.get to check their roles and permissions before allowing an upload for an organization-related entity (e.g., organization logo, property image).

Data Replication Flow (Push/Fan-Out)

- Fan-Out to Firestore (on onFinalize):
  - The onFinalize trigger calls OSKStorageController.default.processFile. While the controller's code is not provided, its purpose is to update the relevant Firestore document with the path of the newly uploaded file. For example, after a user uploads a profile picture to users/{userId}/public/profileImages/{fileName}, this trigger would update the /users/{userId} document to set a field like publicProfile.imageFilename to {fileName}. This is a classic event-driven fan-out pattern.

Business Logic

Secure Offloaded Uploads: The service's primary architectural pattern is to offload the bandwidth-intensive file upload from the Cloud Function servers directly to Google Cloud Storage. It achieves this securely by generating a time-limited (15 minutes), single-use signed URL with a specific content type. This is a highly scalable and cost-effective approach.

Role-Based Access Control (RBAC): The service enforces strict permissions. For a userProfile upload, it verifies the authenticated user's ID matches the target user ID. For organizational uploads (buildingImage, propertyImage, organizationLogo), it verifies the user is part of the organization and has the necessary v1.org.edit permission by checking their consolidated roles.

Decoupled Event-Driven Workflow: The upload process is decoupled into two distinct phases: URL generation and finalization. The client gets a URL and can upload independently. The backend is notified via the onFinalize trigger only when the upload is complete. This makes the system resilient to network failures during upload and separates concerns cleanly.

Emulator-Aware Logic: The service contains a specific conditional block for the Firebase Storage emulator (process.env.OSK_FIREBASE_EMULATOR). In the emulator, it generates a direct, unsigned upload URL, which is a necessary adaptation for local development environments that do not support signed URLs.

### Logging Service (OSKLoggingService)

Description:

This is a core utility service that provides a standardized, structured logging mechanism for the entire application. It is designed to format log messages into a specific JSON structure that is fully compatible with Google Cloud Logging's advanced features, such as severity filtering, stack trace association, and custom labels.

Primary Methods and Triggers

This service is a utility class with static methods (logError, logInfo, logDebug, etc.) that are called by other services throughout the application. It does not have its own triggers.

Data Read Patterns

- Evidence not found in the provided context. This service does not read from any database; it only generates log output.

Data Replication Flow (Push/Fan-Out)

- Fan-Out to Google Cloud Logging: The service's only "fan-out" is writing a structured JSON string to console.log. When running in the Google Cloud environment, this output is automatically ingested, parsed, and displayed by the Google Cloud Logging service.

Business Logic

Structured Logging Pattern: The core logic in \_constructLogEntry is to transform a simple message string and an optional details object into a rich OSKLogEntry object. It automatically captures a stack trace, handles multi-line messages by moving the full text to jsonPayload, extracts HTTP request/response information, and separates custom labels into the correct top-level labels field. This structured approach is fundamental for effective monitoring and debugging in a production environment.

Environment-Aware Formatting: The service intelligently changes its output format based on the environment. In production (GCLOUD_PROJECT is not 'sandbox-oskey-io'), it prints the compact JSON required by Google Cloud Logging. In a development or sandbox environment, it prints a more human-readable, multi-line format to the console, significantly improving the developer experience during testing and debugging.

### Pub/Sub Message Receiver (PubSubMessageProcessor)

Description:

This service acts as the primary ingress point and router for all asynchronous messages received from Google Cloud Pub/Sub, particularly events originating from the IoT backend that manages physical devices. It is implemented as a single HTTP-triggered function that receives push subscription messages, validates them, parses the JSON payload, and routes the data to the appropriate specialized handler service based on the message type.

Primary Methods and Triggers

- OSKPubSubMessageProcessor.processPubSubMessage: An HTTP-triggered function that serves as the endpoint for Pub/Sub push subscriptions.

Data Read Patterns

- Firestore: For activities messages, it calls OSKActivityEnrichmentService, which reads multiple collections (e.g., /users, /buildings, /suppliers) to enrich the raw event with contextual data. For quickCode cleanup, it reads /users/{userId}/accesses/{buildingId} to find the specific access grant to delete.

Data Replication Flow (Push/Fan-Out)

- This service is a major fan-out orchestration hub. A single incoming message triggers multiple database writes.

Fan-Out to Device State Collections:

- Device state messages are written to /accessControlDevices/{id}/state.

- systemLog messages are written to /accessControlDevices/{id}/systemLogs.

- accessCommand messages are written to /accessControlDevices/{id}/accessCommands.

Fan-Out for activities Messages: This is the most complex flow.

- Building-Level Log: The enriched activity is always written to /buildings/{buildingId}/activities.

- User-Specific Logs (Dual-Write): Based on the userType from the enrichment service, the activity is fanned-out to the specific user's collections. For example, for a standard user, it writes to both:
  - /users/{userId}/activities: The raw, immutable audit log.
  - /users/{userId}/activityAggregates: A time-windowed, denormalized aggregate for fast UI reads. This dual-write pattern is repeated for SUPPLIER_STAFF_MEMBER and NON_APP_USER types, writing to their respective collections.

Fan-Out for Quick Code Deletion:

- If an activity corresponds to a single-use "quick code", the service calls OSKAccessService.deleteAccessById. This triggers a massive cascading deletion, removing the access document, deleting the associated pincode documents from multiple collections, and publishing a Delete message to Pub/Sub to revoke access on the physical hardware.

Business Logic

Router Pattern: The service uses a single HTTP endpoint and a switch (data.type) statement to act as a router. This is a clean and scalable pattern for handling various types of events from a single Pub/Sub topic.

Event Enrichment: The service does not blindly save raw data. For activities, it first passes the event to the OSKActivityEnrichmentService. This crucial step transforms a low-context hardware event (e.g., "PIN used at device X") into a high-context business event ("John Doe unlocked the Front Door") by joining it with data from Firestore. This makes the stored data far more valuable for auditing and display.

Asynchronous Cleanup: The deleteQuickCodeSingleUse function is invoked without await. This is a deliberate architectural choice to make the main activity processing path faster and more resilient. The critical task of logging the activity is completed synchronously, while the secondary cleanup task of deleting the used code is handled asynchronously, preventing it from blocking or failing the primary operation.

### Secret Service (OSKSecretService)

Description

This service acts as a facade and abstraction layer for accessing sensitive credentials, such as API keys and private keys. It provides a simple, unified API for other services to retrieve secrets, while intelligently switching between fetching from Google Secret Manager in a cloud environment and reading from a local JSON file during emulator-based development.

Primary Methods and Triggers

- OSKSecretService.getSecret: Retrieves a secret (like an API key) by its OSKApiName.

- OSKSecretService.getPrivateKey: A specialized method to retrieve the private key for a specific Access Control Device.

- OSKSecretService.createSecret / createPrivateKeySecret: Methods for programmatically creating or updating secrets in the appropriate backend (cloud or local file).

Data Read Patterns

- Google Secret Manager API: In a cloud environment, this service interacts directly with the Google Secret Manager API to access the latest version of a secret.

- Local Filesystem: When process.env.OSK_FIREBASE_EMULATOR is true, it reads secrets from a local JSON file (test/assets/keys/secret_acd_private_keys.json).

Data Replication Flow (Push/Fan-Out)

- Evidence not found in the provided context. This service is a utility for reading and writing configuration data to a secure backend (Secret Manager or a local file) and does not trigger data replication within Firestore or other systems.

Business Logic

Facade Pattern: The service provides a clean and simple API that completely hides the complexity of the underlying secret management backend. A consumer service simply calls getSecret(OSKApiName.TwilioAuthToken) and does not need to know whether the secret is coming from a Google API or a local file.

Environment Abstraction: The conditional logic based on process.env.OSK_FIREBASE_EMULATOR is the key business logic. This abstraction allows developers to work entirely locally without needing to set up cloud secrets, while ensuring the same code works seamlessly in production by switching to the real Secret Manager. This is a critical pattern for enabling efficient and secure local development.

Secret Versioning: The createPrivateKeySecret method demonstrates best practices for secret management in the cloud. It first checks if a secret already exists. If it does, it adds a new version to the existing secret rather than overwriting it. This use of versioning provides a full audit trail of secret changes and allows for easy rollbacks in case of an issue.

## Apps

### Notification Orchestration Service (OSKNotificationService)

Description:

This is the master orchestration service for all user-facing notifications. It acts as a high-level router, abstracting the concept of a "notification" from its physical delivery channels. Based on a notification's type, it consults a static metadata configuration to determine whether to dispatch the notification via push (APNS/FCM), email, or SMS. It then delegates the actual sending to specialized, lower-level services, ensuring a consistent entry point for any part of the system that needs to communicate with a user.

Primary Methods and Triggers

- OSKNotificationService.send: The main entry point for standard notifications (e.g., alerts, messages). It is called by other business services when a user needs to be notified of an event.

- OSKNotificationService.sendSpecial: A separate entry point for specialized, high-priority push notifications that have unique delivery requirements, such as VoIP call notifications, which use a different APNS topic and token type.

Data Read Patterns

- Static Data: Reads the notificationMetadata object from /data/notification_metadata.data.ts. This object acts as a routing table, defining which channels and templates to use for each notification type.

- Firestore (/users/{userId}/notificationTokens): Reads all documents in this sub-collection via OSKUserNotificationTokenController.default.getAll to retrieve a user's valid push notification tokens (APNS, FCM, VoIP) before attempting to send a push notification.

Data Replication Flow (Push/Fan-Out) This service's primary function is to orchestrate fan-out by delegating to other specialized services.

- Fan-Out to APNS: If the notification metadata specifies an apns channel, it constructs an APNS payload and calls OSKAPNSService.default.send to deliver the push notification to Apple devices.

- Fan-Out to FCM: If the metadata specifies an fcm channel, it constructs a message for each FCM token and calls OSKFirebaseCloudMessagingService.default.send to deliver the push notification to Android devices.

- Fan-Out to Email: If the metadata specifies a mail channel, it constructs the appropriate email options and calls OSKEmailService.default.send to dispatch an email.

- Fan-Out to SMS: If the metadata specifies an sms channel, it constructs the appropriate SMS options and calls OSKSmsService.default.sendSms to dispatch a text message.

Business Logic

Router and Dispatcher Pattern:
The service uses a metadata-driven design that is a classic Router pattern. The notificationMetadata object completely decouples the decision of what to send from how to send it. This allows new notification types and delivery channels to be added by simply updating the metadata file, without changing the core orchestration logic.

Multi-Channel Orchestration: It gracefully handles the complexity of sending a single logical notification across multiple physical channels. It fetches tokens, filters them by type (APNS vs. FCM), and calls the appropriate downstream service for each.
Template Interpolation: It uses a private \_interpolate helper method to dynamically insert data (e.g., ${recipientName}, ${organizationName}) into the notification title and body, personalizing the message for the user.

Separation of Concerns: The service clearly separates standard "alert" notifications from "special" notifications (like VoIP). The sendSpecial method follows a distinct logic path, using different tokens and payload structures, which is a robust way to handle push types with fundamentally different requirements.

### Apple Push Notification Service (OSKAPNSService)

Description:

This is a specialized, low-level service whose sole responsibility is to communicate with the Apple Push Notification Service (APNS). It handles the complexity of managing secure credentials, differentiating between development and production environments, and processing feedback from Apple's servers to clean up invalid device tokens.

Primary Methods and Triggers

- OSKAPNSService.send: The only public method, called by OSKNotificationService. It takes a list of tokens and a notification payload and manages the entire send process.

Data Read Patterns

- Google Secret Manager: Reads the APNS API keys for both production and development environments via OSKSecretService.getSecret. This ensures that sensitive cryptographic keys are not stored in the codebase.

Data Replication Flow (Push/Fan-Out)

- External API (APNS): The service's primary "fan-out" is making a network request to Apple's APNS servers using the @parse/node-apn library to deliver the push notification.

- Fan-Out to Firestore (on Failure): If the APNS response indicates that a device token is invalid (HTTP status 410), the service triggers a fan-out to Firestore by calling OSKUserNotificationTokenController.default.delete. This removes the stale token from the /users/{userId}/notificationTokens collection.

Business Logic

Self-Healing System: The most critical business logic is in the error handling. By listening for 410 responses from Apple and deleting the corresponding tokens, the service implements a self-healing pattern. This prevents the system from wasting resources trying to send notifications to uninstalled apps and keeps the token database clean.

Environment Segregation: The service correctly implements the APNS requirement of separating development and production tokens. It filters the incoming token list and makes two separate API calls, one to the development endpoint and one to the production endpoint, using the appropriate credentials for each. This is essential for testing and for App Store compliance.

Secure Credential Management: The service follows security best practices by fetching its API keys from Google Secret Manager at runtime. It also correctly decodes the Base64-encoded key before passing it to the APNS provider library.

### Firebase Cloud Messaging Service (OSKFirebaseCloudMessagingService)

Description:

This is a specialized, low-level service responsible for sending push notifications to Android devices via Firebase Cloud Messaging (FCM). It acts as a simple facade over the Firebase Admin SDK's messaging capabilities and includes a crucial self-healing mechanism for handling invalid device tokens.

Primary Methods and Triggers

- OSKFirebaseCloudMessagingService.send: The only public method, called by OSKNotificationService. It takes a user's token ID and a message payload and attempts to deliver it.

Data Read Patterns

- Evidence not found in the provided context. This service is a pure "writer"; it receives all necessary data as arguments and does not read from any database itself.

Data Replication Flow (Push/Fan-Out)

- External API (FCM): The service's primary "fan-out" is calling the Firebase Admin SDK's messaging().send(message) function, which communicates with Google's FCM backend to deliver the notification.

- Fan-Out to Firestore (on Failure):
  - If the messaging().send() call throws an error (which often indicates an invalid or unregistered token), the service triggers a fan-out to Firestore by calling OSKUserNotificationTokenController.default.delete. This removes the stale token from the /users/{userId}/notificationTokens collection.

Business Logic

Facade Pattern: The service provides a very thin wrapper around the Firebase Admin SDK, abstracting the try/catch logic and the subsequent cleanup action into a reusable component.

Self-Healing System: Like the APNS service, the key business logic is in the catch block. When FCM reports an error, the service assumes the token is bad and immediately deletes it from the database. This is a robust, self-healing pattern that prevents the system from repeatedly attempting to contact invalid devices and ensures efficient operation.

### Email Service (OSKEmailService)

Description:

This service acts as a facade for sending transactional emails through an external SMTP provider (configured for Mailtrap). It manages fetching secure credentials, composing final HTML/text content from a two-tiered template system, and logging all sent emails to Firestore for auditing. It also includes a critical domain-whitelisting feature to prevent accidental email sends from non-production environments.

Primary Methods and Triggers

- OSKEmailService.send: The main entry point, called by OSKNotificationService or any other service that needs to send a templated email.

Data Read Patterns

- Google Secret Manager: Reads the SMTP password via OSKSecretService.getSecret(OSKApiName.MailtrapPassApiKey).

- Static Data: Reads from emailTemplates to get the specific message body and from emailCoreTemplate to get the outer branding wrapper (header/footer).

Data Replication Flow (Push/Fan-Out)

- External API (SMTP Server): The service's main side-effect is calling transport.sendMail(message) via the nodemailer library, which sends the email through the configured SMTP provider.

- Fan-Out to Firestore (/EmailLogs): After a successful send, the logMailMessage function is called. This creates a new document in the /EmailLogs collection via OSKEmailLogController.default.save, storing a complete record of the email's content and the delivery response from the SMTP server.

Business Logic

Environment-Safe Domain Whitelisting: The most important business rule is the domain check. It reads the OSK_ALLOWED_EMAIL_DOMAINS environment variable and will silently abort sending any email whose recipient domain is not on the list. This is a crucial safeguard to prevent sending test or development emails to real users, protecting both data privacy and the sender's reputation.

Template Composition: The service uses a two-layer template system. It first selects a specific email body from emailTemplates based on the requested id. It then injects this body into a master emailCoreTemplate. This architectural pattern ensures all outgoing emails have a consistent brand identity (header, footer, styling) while allowing for unique content for each message type.

Robust Placeholder Replacement: The service uses a global regular expression (new RegExp(...)) for replacing placeholders like ${key}. This is more robust than a simple string replace() call, as it ensures all instances of a placeholder within the template are correctly substituted.

Asynchronous Auditing: The call to logMailMessage is not awaited. This is a deliberate choice to make the primary send operation faster. The critical task of sending the email is awaited, but the secondary task of logging the result is performed asynchronously, preventing logging failures from impacting the user-facing operation.

### SMS Service (OSKSmsService)

Description:

This service is a facade for sending transactional SMS messages via the Twilio API. It is responsible for securely fetching API credentials, looking up and interpolating message templates, initiating the send request to Twilio, and asynchronously logging the outcome to Firestore for auditing.

Primary Methods and Triggers

- OSKSmsService.sendSms: The main entry point, called by OSKNotificationService when an SMS notification is required.

Data Read Patterns

- Google Secret Manager: Reads the Twilio Account SID, Auth Token, and Messaging Service SID via OSKSecretService.getSecret.

- Static Data: Reads the smsTemplates array to find the correct message text based on the requested template id and language.

Data Replication Flow (Push/Fan-Out)

- External API (Twilio): The primary side-effect is the call to client.messages.create, which makes an API request to Twilio to send the SMS.

- Fan-Out to Firestore (/SMSLogs): After the Twilio API responds (either with success or failure), the logSms method is called. This creates a new document in the /SMSLogs collection (inferred from OSKSMSLogController) to record the details of the attempt.

Business Logic

Facade Pattern: The service provides a simple sendSms method that hides all the details of initializing the Twilio client, fetching secrets, and handling API responses.

Emulator Safety Net: The service has an explicit check for process.env.OSK_FIREBASE_EMULATOR and will immediately return without sending an SMS if it's running in the local emulator. This is a critical safety and cost-control measure for development.

Asynchronous Logging: Both the success and error handling paths call logSms without await. This is a "fire-and-forget" logging pattern. The primary goal is to send the SMS quickly; logging the result is a secondary concern that should not block or fail the main operation. This makes the service more resilient.

Structured Error Handling: The service correctly checks if an error is an instance of Twilio's RestException. This allows it to log a structured error object containing the specific error code and message from Twilio, which is invaluable for debugging delivery issues.

### QR Code Service (OSKQRcodeService)

Description:

This is a simple, stateless utility service whose only purpose is to generate a QR code from a given string (like an activation code) and return it as a Base64-encoded Data URL string.

Primary Methods and Triggers

- OSKQRcodeService.generateQR: The sole static method that performs the QR code generation.

Data Read Patterns

- Evidence not found in the provided context. This service is a pure function that operates only on its input and does not read from any external data source.

Data Replication Flow (Push/Fan-Out)

- Evidence not found in the provided context. This service does not perform any data replication. It returns a string value to its caller, which is then responsible for any subsequent actions, such as saving the string to a Firestore document.

Business Logic

Utility Service Pattern: This service is a simple wrapper around the qrcode third-party library. It encapsulates the library's toDataURL function in a standardized service class, consistent with the project's architecture.

Error Encapsulation: The service includes a try/catch block. If the underlying qrcode library throws an error, this service catches it, logs a structured error message using OSKLoggingService, and then re-throws a generic Error. This prevents library-specific errors from leaking into higher-level business logic.

## users/{userId}

Description:

This is the root document for a global user in the system. It acts as the central source of truth for a user's identity, containing their public profile (firstName, lastName), contact information (email, phoneNumber), global settings (language, notification preferences), and onboarding status. All other user-specific data, such as their access rights, devices, and activity logs, are stored in sub-collections under this primary document.

Written By:

- OSKUserService.onDocumentCreated / onAccountCreated:
  - Firestore triggers that fire when a user is created in Firebase Authentication. They initialize the document with default settings and profile information.

- OSKUserService (Callable Functions):
  - A suite of callable functions for managing the user's profile:
    - onUpdatePublicProfileCalled:
      - Updates the publicProfile object.

    - initiatePhoneNumberChange / verifyAndCompletePhoneNumberChange:
      - A stateful workflow to securely update the user's phone number.

    - initiateEmailChange / verifyAndCompleteEmailChange:
      - A stateful workflow to securely update the user's email.

    - onUpdateUserOnboardingStatusCalled:
      - Updates the status.newUserOnboarding fields.

    - onUpdateUserSettingsLanguageCalled:
      - Updates the settings.global.language field.

- OSKUserNotificationService:
  - Atomically increments or decrements the unreadNotificationCount field when notifications are created or marked as read.

- OSKUserService.requestMyAccountDeletion:
  - A callable function that initiates the deletion of the user from Firebase Auth, which in turn triggers the onAccountDeleted function to delete this document.

Read By

- OSKUserService:
  - Reads the document extensively for validation before updates, for retrieving profile information, and for permission checks.

- OSKUserNotificationService:
  - Reads the document to get the user's email, phone number, and notification settings before sending a notification.

- OSKUserAccessService:
  - Reads the publicProfile to denormalize the user's name into access documents.

- OSKUserActivitiesService:
  - Reads the publicProfile to denormalize the user's name into activity log entries.

- OSKAuth0Service:
  - Reads the auth0Sub field during the token exchange workflow to link Firebase and Auth0 identities.

Data Replication Flow (Push/Fan-Out)

- Fan-Out on Profile Update (\_cascadePublicProfileChange):
  - This is a major fan-out event triggered by the onDocumentUpdated function when the publicProfile changes. It ensures data consistency across the entire system by updating:
    - Firebase Auth:
      - The user's displayName is updated via OSKUserController.default.syncAuthDisplayName.

    - Cloud Storage:
      - The old profile image is deleted via OSKUserController.default.deleteUserProfileImage.

    - Denormalized Organization Records:
      - Updates the user's name in /organizations/{orgId}/users/{userId}.

    - Denormalized Building Records:
      - Updates the user's name in /buildings/{bId}/users/{userId} and /buildings/{bId}/accesses/{userId}.

    - Denormalized User Records:
      - Updates the user's name in /users/{userId}/accesses/{bId}.

    - Denormalized Inhabitant Records:
      - Updates the user's name in /buildings/{bId}/units/{uId}/inhabitants/{userId}.

    - Access Control System:
      - Calls OSKAccessUpdateService.updateAccessesUserInfo to propagate the name change to all of the user's access grants, which in turn may trigger hardware syncs.

- Fan-Out on Account Deletion (onAccountDeleted):
  - The deletion of the corresponding Firebase Auth user acts as a "kill-switch", triggering a massive cleanup cascade via \_deleteAllUserData:
    - External Systems:
      - Deletes the user from the Auth0 identity provider via OSKAuth0Service.deleteAuth0User.

    - Access Revocation:
      - Deletes all inhabitant records and orchestrates the full revocation of all associated access rights and pincodes via OSKOrganizationResidentsService.deleteAppUserResident.

    - Sub-Collection Deletion:
      - Recursively deletes all documents in all user sub-collections (/users/{userId}/\*).

    - Cross-Reference Deletion:
      - Performs a collection group query to find and delete any other documents that reference the userId.

    - Storage Deletion:
      - Deletes the user's entire folder in Google Cloud Storage.

    - Final Deletion:
      - Deletes the root /users/{userId} document itself.

Business Logic

- Central User Identity: This document is the single source of truth for a user's identity and global preferences within the application. Its lifecycle is directly tied to the user's account in Firebase Authentication.

- Data Consistency through Fan-Out: The architecture relies heavily on event-driven fan-out (onDocumentUpdated) to maintain data consistency. When a user changes their name, this single change is propagated to dozens or hundreds of denormalized records, ensuring that all parts of the UI and system reflect the new name without requiring expensive real-time joins.

- Secure, State-Driven Workflows: The services for changing email and phone number implement a secure, stateful workflow. They use temporary documents (e.g., in /changeEmailRequests) to store a verification code with an expiration date, ensuring that the change can only be completed by the user who initiated it within a short time frame.

- Complete Data Erasure: The onAccountDeleted trigger demonstrates a robust and security-conscious design. It doesn't just delete the user's main document; it orchestrates a complete and irreversible purge of the user's data across all related services, collections, and external systems, which is critical for privacy and compliance.

## /users/{userId}/sentInvitations/{invitationId}

Description

This entity is a denormalized, user-centric copy of an invitation that a user has sent. It is a direct replica of the master invitation record found in the /buildings/.../invitations collection. Its sole purpose is to provide a fast, efficient way for a client application to display a user's "Sent Invitations" list without performing complex cross-collection queries.

Written By

- OSKUserInvitationCreationService.createUserInvitation:
  - This is the only writer. It creates this document via OSKUserSentInvitationController.save as a direct side-effect of creating the master invitation record.

Read By

- OSKUserInvitationCommonService.onGetAllInvitationsByUser:
  - This is the primary reader. When called with category: 'granted', it queries this collection to retrieve the list of sent invitations for the user.

- OSKUserInvitationDeleteService.deleteSentInvitation:
  - Reads the document to validate ownership before deleting it.

Data Replication Flow (Push/Fan-Out)

This entity is a target of fan-out from the master invitation creation process. It does not trigger any subsequent data replication itself. Its lifecycle is managed by the services that operate on the master invitation record.

Business Logic

Denormalization for Read Optimization: This entity is a classic example of a denormalized view. It pre-joins and copies the data needed for a specific UI component (the "Sent" folder). This allows the client to fetch all necessary information with a single, fast query on a user-specific collection path, which is a core NoSQL performance pattern.

## /users/{userId}/invitations/{invitationId}

Description

This entity is a denormalized, user-centric copy of an invitation that a user has received. It is a replica of the master invitation record, tailored for the recipient. Its purpose is to provide a fast and efficient way for a client application to display a user's "Received Invitations" list.

Written By

- OSKUserInvitationCreationService.processInvitee:
  - Creates this document via OSKUserInvitationController.save when an invitation is sent to an existing Oskey user.

- OSKUserInvitationExternalUserService.processUserInvitations:
  - Creates this document when a new user signs up and their pending external invitations are processed.

Read By

- OSKUserInvitationCommonService.onGetAllInvitationsByUser:
  - This is the primary reader. When called with category: 'received', it queries this collection to retrieve the list of received invitations for the user.

- OSKUserInvitationDeleteService.deleteReceivedInvitation:
  - Reads the document to validate ownership before deleting it.

Data Replication Flow (Push/Fan-Out)

This entity is a target of fan-out from the master invitation creation or external user processing workflows. It does not trigger any subsequent data replication itself.

Business Logic

Denormalization for Read Optimization: Similar to the sentInvitations collection, this entity is a denormalized view optimized for a specific read pattern. It allows the client to fetch a user's inbox with a single, efficient query.

State Management: The status field on this document (e.g., pending, accepted, rejected) is updated by the various invitation services (OSKUserInvitationAcceptedService, OSKUserInvitationRejectedService), allowing the client to display the current state of each received invitation.

## /externalUserInvitations/{documentId}

Description

This is a temporary, transactional document that aggregates all pending invitations for a user who does not yet have an Oskey account. The document ID is a unique hash of the user's contact information (email or phone number), allowing for fast lookups. It contains arrays of unitInvitations and userInvitations, effectively acting as a staging area until the user completes the sign-up process.

Written By

- OSKUserInvitationExternalUnitService.createExternalUnitInvitation:
  - Creates or updates this document when a non-Oskey user is invited to a unit.

- OSKUserInvitationExternalUserService.createExternalUserInvitation:
  - Creates or updates this document when a non-Oskey user is invited as a guest.

Both services use an "upsert" pattern, adding new invitations to the arrays if a document for that contact already exists.

Read By

- OSKUserInvitationExternalUserService.processExternalUserInvitations:
  - This is the main consumer. When a new user signs up, this service is called. It queries this collection using the new user's email and phone number to find any matching pending invitation documents.

Data Replication Flow (Push/Fan-Out)

- Fan-Out to Notification Systems (on Create):
  - The creation of this document triggers an email or SMS to be sent to the non-user via OSKNotificationService, informing them of the invitation.

- Fan-Out on Consumption (processExternalUserInvitations):
  - This is a major orchestration event.

The service iterates through all staged invitations (unitInvitations, userInvitations).
For each one, it calls OSKUserInvitationAcceptedService.acceptInvitationForInvitee or a similar processing function.

This triggers the full fan-out cascade for each invitation, including creating access documents, generating pincodes, and syncing with physical hardware.

State Transition (Deletion): After all staged invitations within the document have been successfully processed, the processExternalUserInvitations function deletes the /externalUserInvitations document itself.

Business Logic

Transactional State Machine: The document's existence represents a pending onboarding for an external user. Its consumption and subsequent deletion is a key state transition that signifies the user has successfully signed up and claimed their invitations.

Aggregation and Upsert Pattern: The document aggregates multiple invitations for the same external contact into a single record. The services use an "upsert" logic to atomically add new invitations to the arrays, which is a robust pattern for managing this staged data.

Onboarding Orchestrator: This entity is the cornerstone of the "invite-by-email/phone" feature. It holds invitations in stasis until the user signs up. The processExternalUserInvitations function then acts as the orchestrator that "plays back" these invitations, automatically granting the new user all the access they were promised.

## /users/{userId}/accesses/{buildingId}

Description

This is a denormalized, user-centric document that aggregates all access grants for a single user within a specific building. The document ID is the buildingId. It contains a crucial accesses array, where each object represents a distinct grant of access (e.g., for a specific unit, for a limited time) with its own unique accessId, validity rules, and a list of authorized doors. This aggregation pattern is designed to provide a complete and efficient view of a user's permissions for a given location.

Written By

- OSKUserAccessService.createOrUpdateUserAccess:
  - The primary writer, which is called by the main OSKAccessService.createAccess workflow. It uses an "upsert" pattern, either creating the document for the first access or adding a new grant to the accesses array.

Read By

- OSKAccessUpdateService:
  - Reads the document to get the current state before propagating updates from other entities (like user or building name changes).

- OSKAccessService:
  - Reads the document to find specific access grants that need to be modified or deleted.

Data Replication Flow (Push/Fan-Out)

This entity is a target of the main access provisioning fan-out.

- Fan-In from /users:
  - When created, createOrUpdateUserAccess reads the root /users/{userId} document to denormalize the user's firstName and lastName.

- Fan-In from /buildings:
  - When created, it reads the /buildings/{buildingId} document to denormalize the buildingName and streetAddress.

Business Logic

Aggregation for Read Optimization: This entity is a classic example of an aggregation pattern. By storing all of a user's access grants for a building in a single document, it optimizes for the common client-side use case of "show me all of my access in this building" without requiring multiple database reads.

Upsert Pattern: The createOrUpdateUserAccess function first checks if the document exists. If so, it atomically adds the new access grant to the array; if not, it creates the document. This is a robust pattern for managing aggregated data.

## /users/{userId}/activities/{activityId}

Description

This entity is an immutable, individual log entry representing a single event (e.g., "access granted", "call received") that has been attributed to this specific user. This collection serves as the raw, detailed, and permanent audit trail for all of the user's activities across the platform.

Written By

- OSKUserActivitiesService.ActivityReceivedForUser:
  - This is the sole writer. It is a handler function called by the main Pub/Sub message processor (PubSubMessageProcessor) after a raw event from a physical device has been processed and enriched.

Read By

- OSKUserActivitiesService:
  - Provides callable functions (getActivityById, getAllUserActivities) for a user to retrieve their own activity history.

Data Replication Flow (Push/Fan-Out)

This entity is a target of the event processing pipeline. Its creation does not trigger any subsequent data replication.

- Fan-In from /users, /buildings, /doors:
  - The ActivityReceivedForUser handler receives an EnrichedActivityData object, which contains denormalized data (user name, building name, door name) that has been pre-fetched from other collections.

Business Logic

Immutable Audit Log: This collection functions as a detailed, write-once audit trail. Each document represents a historical fact that should not be altered.

Decoupled Event Handling: The creation of this document is decoupled from the initial hardware event. A separate pipeline is responsible for processing raw events, enriching them with context, and routing them to this handler, which is a robust pattern for event-driven systems.

## /users/{userId}/activityAggregates/{buildingId}

Description

This is a denormalized, read-optimized document that aggregates a user's recent activity (last 30 days) within a specific building. The document ID is the buildingId. It contains a bounded array of recent activities, designed to provide a fast-loading activity feed in a UI without needing to query the large, granular activities collection.

Written By

- OSKUserActivityAggregatesService.ActivityReceivedForUser:
  - This is the only writer. It's a handler called by the same activity enrichment pipeline. It "upserts" the new activity into the document's activities array and simultaneously removes any entries older than 30 days.

Read By

- OSKUserActivityAggregatesService.getActivityByBuildingId:
  - The primary reader, allowing a user to fetch their recent activity summary for a specific building.

Data Replication Flow (Push/Fan-Out)

This collection is a target of the same event processing pipeline that populates the raw activities log.
Business Logic

- Denormalization for Read Optimization:
  - This entity is a classic example of an aggregation pattern used to optimize read performance. It pre-computes and stores a view of the data (recent activities) that is frequently requested by the application's UI.

- Rolling Window Aggregation:
  - The service logic implements a rolling 30-day window. Upon receiving a new activity, it adds it to the array and filters out old entries within the same transaction. This keeps the document size under control and ensures the data remains relevant.

- Dual-Write Pattern:
  - The system performs a "dual write" for every user activity: one to the immutable activities log for a permanent record, and one to this activityAggregates document for fast reads. This is a common and effective NoSQL pattern.

## /users/{userId}/devices/{deviceId}

Description

This entity represents a user's physical device (e.g., a smartphone) registered with the system. It stores the device's cryptographic public keys (publicSigningKeys, publicEncryptionKeys) which are essential for secure BLE (Bluetooth Low Energy) access and other cryptographic operations.

Written By

- OSKUserDeviceService.onDocumentCreated:
  - A Firestore trigger that fires when a client app creates a placeholder document. This trigger validates the data, populates default fields (isLocked, isStolen), and saves the final document.

Read By

- OSKAccessMessagePublisherService:
  - Reads these documents via OSKUserDeviceController.default.getAllActive to retrieve the public keys needed to construct the accessMethods payload for hardware synchronization.

- OSKUserDeviceService.getDevicesUserList:
  - A callable function for a user to list their own registered devices.

Data Replication Flow (Push/Fan-Out)

- Hardware/External Sync (on Create/Update/Delete):
  - The lifecycle of this document is tightly coupled with the access control system.

- The onDocumentCreated, onDocumentUpdated, and onDocumentDeleted triggers all call OSKAccessUpdateService.updateUserAccessDevices.

  This service refreshes the user's access methods and then calls OSKAccessMessagePublisherService.publishMessageToAllACDs to publish an updated configuration to all physical devices where the user has access.

  This ensures that adding a new phone or revoking an old one is immediately reflected on the physical locks.

- Cascading Deletion (on onDocumentDeleted):
  - The trigger also calls OSKUserDeviceAccessControlDeviceTokenController.default.deleteAll to clean up all documents in the accessControlDeviceTokens sub-collection.

Business Logic

Device Identity Management: This entity manages the cryptographic identity of a user's device. The public keys stored here are the foundation for secure BLE communication.

Event-Driven Hardware Sync: Any change to a user's device fleet (adding, removing, or changing a key) immediately triggers a system-wide refresh of the user's access rights on all relevant physical hardware. This ensures a high level of security and responsiveness.

## /users/{userId}/calls/{callId}:

Description

A denormalized, user-centric historical record of a single WebRTC call the user participated in. It is written by OSKCallService upon call termination and is read by the user's app to display their call history.

## /users/{userId}/intercoms/{accessControlDeviceId}:

Description

A denormalized, user-centric view of an intercom's configuration (display name, call list) as it pertains to this user. It is written by OSKUserIntercomService when the master building intercom directory is updated and is read by the user's app.

## /users/{userId}/notifications/{notificationId}:

Description

A persistent record of a single notification sent to the user, used for the in-app notification center. Its lifecycle manages the unreadNotificationCount on the root user document.

## /users/{userId}/notificationTokens/{tokenId}:

Description

Stores a device's push notification token (FCM or APNS). It is written by the client app via OSKUserNotificationTokenService and read by OSKNotificationService to send pushes.

## /users/{userId}/organizations/{organizationId}:

Description

A denormalized index document that provides a fast way for a user's app to list all the organizations they belong to. It is a target of fan-out from /organizations/{orgId}/users/{userId}.

## /users/{userId}/pincodes/{pincode}:

Description
A user-centric copy of a pincode, used for display in the user's app. Its lifecycle is paired with the master pincode document in /buildings/{bId}/pincodes/{pincode}.

## /users/{userId}/buildingSettings/{buildingId}:

Description

A denormalized copy of the master settings from /buildings/{bId}/settings. It provides a fast, user-specific view of the rules for a building.

## /users/{userId}/buildingSettings/{bId}/unitSettings/{uId}:

Description

A further denormalized copy of settings, specific to a user's role within a single unit.
