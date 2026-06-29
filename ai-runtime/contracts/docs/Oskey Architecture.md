
# System Context & Architecture Overview: OSkey Access Platform

**version:** 0.0.1
© [Year] OSkey SAS. All rights reserved

---

## 1. Business Context & Core Value Proposition

The OSkey Secure Building Access Platform is a modern, ecosystem-driven solution designed to provide secure, frictionless access control for multi-tenant residential and commercial buildings. Its primary initial market is France, with strategic roadmap expansion targeted for the broader EU and EMEA regions.

By bridging physical hardware with cloud-native software, OSkey eliminates traditional physical key management friction for property managers while offering modern, secure, and flexible entry methods for residents and visitors.

The Core Ecosystem Components
The platform's business logic and technical execution are split across three primary operational pillars:

### The OSkey Mobile Application (iOS & Android)

The primary user interface for inhabitants and guests. Residents use it for frictionless entry via SecureBLE (Bluetooth Low Energy) or custom PIN codes. It serves as a decentralized management tool for their specific unit, allowing them to invite co-inhabiters or issue temporary access to non-inhabitants (guests/delivery personnel) who can use the app via SecureBLE or a unique PIN.

### Access Control Devices (ACDs)

The physical hardware installed at property entry points. These are divided into two primary hardware tracks:

The Intercom: An Android-based device featuring a full touchscreen, integrated camera, high-fidelity audio, and a digital directory. It allows visitors to call registered mobile phones directly via the cloud.

The Digicom: A lightweight, Linux-based device running the Zephyr RTOS, featuring a touchscreen keypad optimized for PIN and SecureBLE requests.

### The Property Manager Portal (PGO)

The central administrative web application (Angular-based). This portal allows property managers and administrative teams to manage the entire OSkey deployment across their portfolio—configuring buildings, provisioning devices, and onboarding or offboarding residents.

---

## 2. Core Domain Entities & Hierarchy

The OSkey Access platform relies on a strict, nested hierarchical data model that maps logical business structures to physical real estate assets. Understanding this hierarchy is critical for enforcing security boundaries, device provisioning, and Role-Based Access Control (RBAC).

The logical and physical workflow flows downward through five specific scopes: Organization, Entity, Property, Building, and Unit.

### Organization Scope

The Organization represents the top-level corporate or enterprise business entity (e.g., "Alpha Management Group"). This layer serves as the global configuration, subscription, and master administrative umbrella. It is provisioned strictly by OSkey internal operations staff after a contract is executed. Once created, customer enterprise admins utilize this layer to spawn internal PGO accounts for their corporate staff and assign high-level RBAC roles.

### Entity Scope

An Entity is a specific legal administrative subdivision, localized co-ownership corporation (Syndic), or distinct housing complex brand managed by the parent Organization (e.g., "Paris Southeast Region Syndic"). This is the primary operational sandbox. All hardware configuration logic, resident access control rules, and local automation parameters are strictly isolated at this layer. An Entity has zero visibility into sibling Entities under the same Organization. Data, audit logs, and hardware configurations from Entity A must never leak into or influence Entity B. Settings, configurations, tasks and rules can be cascaded down from an enitity to its properties and buildings. They can be overwritten at a lower level to override at a local level.

### Property Scope

A Property is a physical parcel of land, estate, block, or campus containing one or more physical structures (e.g., "The Les Vosges Domain"). This acts as a logical grouping layer for shared local infrastructure, regional boundaries, and localized policy parameters, such as global guest parking rules or shared security schedules across a local property.

### Building Scope

A Building is a distinct physical structure located within a defined Property (e.g., "Building B", "Tower A"). This is the primary physical anchor for all active field hardware. In the production environment, all Access Control Devices (ACDs like Intercom+ and Digicom+) and active door-locking mechanisms are installed, mapped, and controlled strictly at the Building level. Shared infrastructure such as main lobby doors, common service entrances, or bike room gates live here.

### Unit Scope

A Unit is an individual apartment, office lot, commercial studio, or residential space within a specific Building (e.g., "Apartment 304"). The Unit acts strictly as a logical administrative container for resident directories, lease durations. It is typically managed by a ResidentAdmin or UnitAdmin. Physical ACDs (Intercoms/Digicoms) are never assigned or mapped directly at the Unit level; they look up to the Building level to fetch directories and execute entry logic.

### User Types & Personas

The OSkey platform distinguishes between users who interact with the physical hardware (ACDs), the client mobile applications, and the backend administrative portal (PGO). These personas dictate access permissions, invitations, and identity verification workflows.

#### Inhabitant Personas

ResidentAdmin: The primary tenant or ownerResident of a specific Unit, created inside the PGO by a Property Manager. A ResidentAdmin profile includes their assigned building, unit, authorized doors, legal name, phone number, and email. They hold administrative privileges over their specific unit, allowing them to invite co-inhabitants and manage guest access.

A Property Manager can also provision a non-app user who will receive a unique PIN code distributed manually by the PM.

Resident: A secondary co-inhabitant of a Unit. Residents are invited directly into the ecosystem by a ResidentAdmin via the "Mon Foyer" (My Home) section of the mobile application. They enjoy permanent access rights matching the unit's boundary rules but lack primary structural administrative capabilities.

A resident can be either an app-user or a non-app user that only has been issued a unique pincode

ownerNonResidentAdmin: The owner of a specific Unit, created inside the PGO by a Property Manager. A residentOwnerAdmin profile includes their assigned building, unit, authorized doors, legal name, phone number, and email. They hold administrative privileges over their specific unit. THey differ slightly to a residentAdmin in that they can configure the unit specifically to their own tenants who are either LLD : Location Longue Durée (Long-Term Rental) and LCD : Location Courte Durée (Short-Term Rental). An LLD tenant will be on a long term contract. An LCD tenant would be a short term renter, suchas an airbnb type user.

ownerNonResidentTenant: Added into a unit by a ownerNonResidentAdmin

ownerNonResidentTenantCoInhabitant: Added into a unit by a ownerNonResidentTenant

ownerNonResidentShortTermRental: An LCD tenant. They do not have permissions to add other resident types. They are managed as a non-app user. The ownerNonResidentAdmin will issue and share a unique pincode with the ownerNonResidentShortTermRental user.

commercialTenant, commercialOwner, commercialStaff and commercialClient are inhabitant types or guests that exist on the roadmap, but no development has yet been started on.

#### External & Visitor Personas

Guest / Invited User: A temporary visitor (e.g., friends, family, dinner guests) invited by an inhabitant (ResidentAdmin or Resident) via the mobile app. They receive a time-bound invitation link to download the app, giving them secure entry capabilities via SecureBLE or a custom PIN for the duration of the scheduled event.

Quickcode Recipient: Single-use or highly restricted entry interactions (e.g., delivery drivers). Inhabitants can generate a "Quickcode"—a unique, temporary PIN—from their mobile app and share it directly with the courier.

#### Supplier: Third-party workers, delivery personnel, or maintenance staff

They are added to the PGO by the Property Manager and receive unique PIN codes to grant building access without requiring the mobile application, functioning similarly to Non-App Users.

#### Administrative Personas

Organization User (PGO User): Internal property management and administrative staff.

PGO SuperAdmin: A top-level enterprise user who can provision new property manager accounts, configure operational parameters within their Organization or Entity boundaries, and assign granular Role-Based Access Control (RBAC) permissions across various PGO software modules.

### The Inhabitant Lifecycle States

Onboarding Inhabitant: A transitional state triggered the moment a Property Manager creates a ResidentAdmin profile in the PGO. The user remains in this placeholder state until they download the mobile application. If their registration email and phone number match the PGO record via the Auth0 identity layer, they are automatically onboarded into their unit. If the automated match fails, they must manually input a secure activation code to complete onboarding, transition to an active status, and unlock SecureBLE or PIN configurations.

---

## 3. Hardware Ecosystem

The OSkey physical footprint consists of edge-deployed Access Control Devices (ACDs) installed at secure entry barriers. These devices operate as localized validation nodes, managing user interactions, cryptographic key matching, and cellular cloud synchronization. Devices such as Intercom and Digicoms are collectively termed ACDs.

### The Intercom (Android Track)

Operating System: Android running in a dedicated, locked-down Kiosk Mode.

Physical Hardware: Touchscreen display, integrated camera, high-fidelity audio system, and an onboard 4G cellular modem.

Core Function: Functions as the primary interactive entry point for visitors and residents. It processes local SecureBLE signals, evaluates PIN entries, and handles SIP/WebRTC directory calling to resident mobile devices.

### The Digicom (Zephyr Track)

Operating System: Linux-based OS running the Zephyr Real-Time Operating System (RTOS).

Physical Hardware: Low-latency, touch-sensitive digital keypad optimized for ultra-low power consumption and mechanical resilience.

Core Function: Functionally streamlined for secure access execution. It validates entered PIN codes and evaluates local SecureBLE authorization packets directly at the door barrier. It does not contain an interactive calling directory or camera system.

### Edge Connectivity & Data Synchronization

Rather than relying on local building Wi-Fi or hardwired Ethernet networks, OSkey hardware establishes a direct cloud connection through specialized onboard cellular architecture.

### Onboard 4G Cellular Architecture

Every ACD contains an internal, dedicated 4G cellular chip. This modem maintains an independent cellular uplink to the OSkey cloud ecosystem, isolating the building's physical security grid from local consumer network dependencies or outages.

### Synchronization and Delta Payload Delivery

Initial Provisioning: When an ACD is first assigned to a building in the PGO, it downloads the complete database payload for that specific building anchor (authorized PIN codes, SecureBLE cryptographic packets, and the full intercom contact directory).

Delta Synchronization: To minimize data consumption and processing overhead, subsequent updates are sent exclusively as "deltas" (incremental changes containing only newly added, edited, or deleted records).

Polling Latency and Triggered Syncing: * Scheduled Polling: Devices check in with the cloud automatically every few minutes to pull down pending deltas.

Opportunistic Polling: The moment a user interacts with the physical interface by pressing the PIN Code button on the screen, the device initiates an immediate, preemptive poll to fetch any real-time delta updates from the cloud. This guarantees that newly issued codes work nearly instantly.

### Intercom User Interface & Kiosk Mode

The Android Intercom UI is designed for constant field availability and does not utilize power-saving idle states, sleep modes, or screensavers. It is locked permanently into a fixed Kiosk Mode interface featuring three core navigation components:

1. The Contacts Button
    This button launches the interactive building directory, allowing visitors to search for and call inhabitants. The display configuration is dynamic and mirrors the parameters established by the Property Manager within the PGO:

    Occupant View: Configured to display the last names of registered inhabitants.

    Unit View: Configured to display entries structurally by unit number and floor level to protect resident privacy.

2. The PIN Code Entry Button
    This button surfaces a touch-sensitive digital keypad for direct access authentication. The keypad interface maps a standard alphanumeric telephone layout alongside specialized security navigation keys, presenting options for:

    Numeric digits 0 through 9

    Alpha modifiers A, B, and C

    Function keys # (Hash/Confirm), * (Asterisk), and a dedicated Backspace button for input correction.

3. The Language Change Button
    An on-screen utility menu that allows users to instantly toggle the localized display text. Selecting this button presents a list of available system languages, immediately translating all user interface text, button labels, and system prompts on the fly.

### Digicom User Interface

The Zephyr based Digicom is designed for constant field availability and does not utilize power-saving idle states, sleep modes, or screensavers. It is locked permanently into a fixed Kiosk Mode interface featuring a touch-sensitive digital keypad for direct access authentication. The keypad interface maps a standard alphanumeric telephone layout alongside specialized security navigation keys, presenting options for:

    Numeric digits 0 through 9

    Alpha modifiers A, B, and C

    Function keys # (Hash/Confirm), * (Asterisk), and a dedicated Backspace button for input correction.

---

## 4. Software Architecture & Technical Layers

The OSkey Access platform utilizes a decoupled, hybrid-database architecture engineered to separate client-facing administrative interfaces from the low-latency, high-availability constraints of edge hardware devices.

### Client Applications

The client tier consists of native mobile platforms, an administrative web portal, and specialized field utility applications.

### OSkey Mobile Applications (iOS & Android)

Built natively using Swift (iOS) and Kotlin (Android). These apps interface with backend services to manage user credentials, generate guest access invitations, and communicate directly with ACDs via SecureBLE.

### Property Manager Portal (PGO)

A web application built on Angular. It serves as the primary management interface for enterprise administrative operations.

### Installer Provisioning App

A specialized field utility built using a cross-platform framework via a Kotlin Multiplatform/Bridge configuration that outputs native iOS and Android binaries. This application allows certified field technicians to establish direct local connections to an ACD to execute hardware provisioning, run diagnostic sequences, and electronically lock physical units into their secure wall mountings.

### Middleware & Backend Logic

The backend architecture leverages Google Cloud Platform (GCP) serverless infrastructure, splitting tasks between user-facing request routing and system-to-system hardware orchestration.

### GCP Cloud Functions

GCP Cloud Functions: The primary API gateway and computing layer for both the native mobile applications and the Angular PGO web portal. Written in Node.js, the backend codebase repository is modularized and code-split into distinct domain modules (e.g., /buildings, /organizations, /users). This codebase modularization directly mirrors the underlying Firestore collection layout and Firebase Security Rules, ensuring that scoped user access and permission checks map directly from the source code architecture straight down to the database level.

### GCP Cloud Run (Node.js Middleware)

Runs a dedicated Node.js middleware application responsible for data ingestion, format parsing, and synchronization isolation between client-facing cloud databases and hardware-facing edge databases.

### Asynchronous Data Pipeline

When an administrative change occurs (e.g., a new PIN code is generated or a resident intercom directory entry is updated), the payload moves from Firestore through GCP Pub/Sub into the Node.js middleware application on Cloud Run, which serializes and persists the data into MongoDB for hardware consumption.

### Database Layer & Data Partitioning

OSkey splits its persistence layer between Google Firestore and MongoDB to isolate user-facing traffic from edge device polling traffic.

### Google Firestore (Client & Management State)

Firestore serves as the primary database for mobile applications and the PGO portal. It operates predominantly via Cloud Function queries and direct real-time document snapshots on the mobile apps. It maintains the definitive records for user accounts, unit structural configurations, lease timelines, and active security rules.

### MongoDB (Edge Device Mirror & Event Ingestion)

MongoDB acts as the decoupled database layer engineered specifically for consumption by physical field hardware.

### Hardware Read Path

ACDs execute REST API queries against the Cloud Run middleware to pull down their designated building data, access rules, PIN records, and directory updates directly from MongoDB.

### Hardware Write Path (Activity Logs)

When a door event occurs (e.g., a PIN code or SecureBLE token is processed at the door), the ACD transmits an activity log upstream via the Cloud Run REST API. This log is written directly to MongoDB, processed, and piped back up to Firestore to update the system log states.

### Audit Log Visibility Restrictions

The architecture enforces strict data privacy rules regarding access log consumption:

Inhabitant View: Standard residents and unit admins can exclusively view their own individual door entry logs within the application; cross-user log leaking is blocked at the database query layer.

Property Manager View: General resident logs remain private, but Supplier door entry logs are synced through the pipeline directly into the PGO, allowing property managers to monitor third-party contractor and maintenance personnel access.

### Real-Time Communication Layer (Intercom Routing)

To support the Android Intercom’s ability to execute video and voice calls directly from the building entrance to a resident's mobile application, the architecture integrates a specialized real-time communication stack.

Signaling and Gateway Framework: (Architectural Placeholder) A dedicated SIP/WebRTC signaling server and STUN/TURN/ICE gateway architecture manages session negotiation, media routing, and real-time transit between edge hardware modems and client mobile operating system push notification environments.

---

## 5. Core Systems & Workflows

This section maps the operational execution paths of the OSkey platform, illustrating how cloud-native data models translate into immediate physical interactions at the building barrier.

### Access & Authentication (The Door Unlocking Flow)

The platform supports both proximity-based cryptographic authentication and keypad-based alphanumeric credentialing.

#### SecureBLE Edge Verification (Mobile App Entry)

Direct Communication Path: When an authorized resident or guest approaches an Access Control Device (ACD), their smartphone establishes a direct peer-to-peer Bluetooth Low Energy connection with the hardware. The mobile application transmits a secure cryptographic token directly to the ACD over this local BLE link.

Local Processing & Execution: The phone does not talk to the cloud to open the door, nor does the hardware make an on-demand cloud request at the moment of entry. The ACD evaluates and validates the incoming token against its locally cached security parameters. Upon successful verification, the ACD triggers its onboard physical relay to actuate the door lock mechanism.

#### Alphanumeric PIN Code & Quickcode Provisioning and Validation

Cloud-First Generation: Static PIN codes (for regular visitors and suppliers) and dynamic Quickcodes (for courier deliveries or temporary guests) are generated on demand within the cloud ecosystem. These codes are always alphanumeric (incorporating digits 0 through 9 and letters A through C). They can be initiated either by a property manager in the PGO or by an inhabitant inside the mobile app.

Edge Synchronization: Once created, the cloud binds the alphanumeric string to a specific user entity and pushes the payload down through the GCP Pub/Sub and MongoDB pipeline to the designated building's ACDs.

Offline Keypad Entry: When a user types an alphanumeric PIN or Quickcode into the physical keypad of an Intercom or Digicom, the device evaluates the string entirely offline against its internal cache. If a match is confirmed and the current timestamp falls within the code's valid window, the door relay fires instantly.

### User Onboarding & Invitations (App Users)

The onboarding process transitions an individual from an administrative placeholder record to a cryptographically verified inhabitant utilizing a smartphone.

The Invitation Flow
Administrative Creation: A Property Manager initiates the process by creating a new ResidentAdmin profile inside the PGO portal, specifying the target building, unit number, authorized doors, legal name, email, and phone number. At this point, the database flags the user in an "Onboarding Inhabitant" state.

The Invite Dispatch: The system automatically triggers an automated email invitation to the user. This message contains direct download links for the native iOS and Android applications alongside a unique, system-generated alphanumeric activation code.

### The App Installation & Verification Identity Match

Upon downloading and opening the mobile application, the user goes through an identity setup wizard:

Account Registration: The user creates an account handled by the Auth0 authentication layer.

Profile Completion: The user inputs their first name and last name.

Dual-Factor OTP Verification: The application forces a strict verification loop, requiring the user to validate both their email address and phone number using localized One-Time Passwords (an email OTP and an SMS OTP).

Resolution and Unit Matching
Once the phone and email variables are verified, the backend attempts to resolve the user's identity against the pre-provisioned PGO data via two distinct logical branches:

The Automated Match Path: If the verified email and phone number captured during the registration wizard exactly match the data fields entered by the Property Manager in the PGO, the system automatically binds the mobile profile to the correct logical Unit container. The onboarding state is instantly flipped to active, and the user's digital keys are deployed.

The Manual Activation Path: If an automated match cannot be performed (e.g., the resident signs up using a different personal email or phone number than the one provided to the property manager), the application prompts the user for their unique activation code. Manually inputting the token from the invitation email overrides the data mismatch, establishes the definitive database link to the Building/Unit hierarchy, and activates the resident profile.

### Non-App Inhabitant Provisioning Workflow

For residents or building occupants who do not own or interact with a smartphone, the platform offers an alternate credentialing lifecycle that completely bypasses app store onboarding and Auth0 authentication.

Provisioning Triggers
A Non-App Inhabitant profile can be established through two entry vectors:

Via the PGO Portal: A Property Manager creates a Non-App User profile under a specific Building and Unit scope.

Via the Mobile Application: An active ResidentAdmin provisions a non-app co-inhabitant directly from the "Mon Foyer" (My Home) dashboard of their mobile app.

Credential Assignment & Distribution
Generation: Upon creating the profile, the system generates a unique, static alphanumeric PIN code bound to that individual.

Sync Pipeline: The new credential payload transits through the cloud pipeline, syncing down to the specific building's ACD cache.

Manual Distribution: Because the recipient lacks a smartphone app to pull the credential, the code is shared manually. The Property Manager or the inviting ResidentAdmin extracts the alphanumeric string from their respective interface and delivers it directly to the non-app inhabitant via offline means (e.g., direct messaging, a printed welcome sheet, or verbal handover).

### Communication & Call Routing (Intercom Directory Calls)

(Architectural Placeholder) This workflow handles the operational sequence when a visitor selects an inhabitant or unit entry from the Android Intercom’s touchscreen directory, establishing a real-time SIP/WebRTC audiovisual connection to the target resident's native mobile operating system push notification framework.

### Device Cryptography & Security

(Architectural Placeholder) This workflow outlines the public/private key generation, rotational exchange, and handshake protocols executed securely between the OSkey cloud infrastructure, the native client mobile apps, and the physical storage modules embedded inside the edge hardware components.

---


