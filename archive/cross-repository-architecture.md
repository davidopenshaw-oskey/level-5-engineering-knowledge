# Cross-Repository Architecture Overview

**Version:** 1.0.0
**Purpose:** This document provides a high-level overview of the communication patterns and data flows between the major repositories in the Oskey ecosystem. It is intended to be used as an architectural grounding document for the automated engineering knowledge corpus.

---

## 1. Repository Landscape

This section provides a brief, one-sentence summary of the primary responsibility of each major repository.

| Repository Name | Language/Framework | Primary Responsibility |
| :--- | :--- | :--- |
| `cloud-oskey-io` | Node.js (GCP) | Manages core business logic, user data, and serves as the primary backend for client applications. |
| `node-iot-api-oskey-io` | Node.js (GCP) | Acts as a data transformation and synchronization layer between the `cloud-oskey.io` backend and physical hardware devices. Data will pass from the Firestore and Cloud repo via pubsub through this layer and be persisted in mongoDB. It provides an API interface for the ACDs to retreive data from the mongoDB. It also provides an API interface for the ACDs to send activity data to the mongoDB for persistence, which in turn via pubsub is then persisted in Firestore where it can be accessed by the cloud repo and the Oskey App users. |
| `angular-web-oskey-io` | Angular | The web-based Property Manager Portal (PGO) for administrative tasks. Used by the Oskey Property Manager customers|
| `ios-oskey-io` | Swift | The native iOS application for residents and guests. This app is used to trigger secureBLE access and manage inhabitants within a building's unit. |
| `android-oskey-io`| Kotlin | The native Android application for residents and guests. This app is used to trigger secureBLE access and manage inhabitants within a building's unit. |
| `installer-oskey-io`| Kotlin | The native Android application for installers. This app is used to technical staff when installing Access Control Devices. It supports locking an ACD into a wall mounting and various diagnostic, testing and provisioning tasks on an ACD  |
| `intercom-app-oskey-io` | Android (Kotlin) | The Intercom application for the Android-based Intercom hardware. This device is the building door Intercom and is used to control access to the building, unlocking the door and providing a calling function to a resident's phone via WebRTC. |
| `iot-oskey-io` | C/C++ (Zephyr) | Manages the code for the Digicom Access Control Device used for door entry. |
| `sesame-oskey-io` | C/C++ | Manages the code for the Sesame+ Keyfob used for door entry by a resident or Property manager. |
| *... (add other repos as needed)* | | |

---
