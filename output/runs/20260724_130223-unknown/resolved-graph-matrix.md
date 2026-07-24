# Level 5 Engineering Knowledge: Resolved Engineering Graph Matrix

**Run ID**: `20260724_130223-unknown`  
**Phase**: Phase 1.75 (Deterministic Cross-Module Resolution)  
**Generated Date**: 2026-07-24  
**Status**: 100% Deterministic Resolution Complete

---

## 1. Resolved Cross-Module Method Calls (0 Edges)

| Source Module | Source Context / Caller | Target Module | Target Service Class | Target Method Executed |
| :--- | :--- | :--- | :--- | :--- |


---

## 2. Resolved Shared Firestore Paths (0 Paths)

| Firestore Path Pattern | Writing Modules | Reading Modules | Total AST References |
| :--- | :--- | :--- | :--- |


---

## 3. Event Routing Table (6 Event Routes)

| Topic / Trigger | Route Type | Origin Module | Target Module | Service Class | Handler Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `OSK_PUBSUB_TOPIC_ACD_ACCESSES` | `PUBSUB_TOPIC` | `core` | `core` | `OSKAccessMessagePublisherService` | `publishAccessMessage` |
| `OSK_PUBSUB_TOPIC_ACD_ACTIVITY` | `PUBSUB_TOPIC` | `access_control_device` | `core` | `PubSubMessageProcessor` | `processPubSubMessage` |
| `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` | `PUBSUB_TOPIC` | `building` | `building` | `OSKBuildingIntercomPublisherService` | `publishIntercomEntries` |
| `auth.user().onCreate` | `AUTH_TRIGGER` | `firebase_auth` | `user` | `OSKUserService` | `onAccountCreated` |
| `auth.user().onDelete` | `AUTH_TRIGGER` | `firebase_auth` | `user` | `OSKUserService` | `onAccountDeleted` |
| `firestore.users().onUpdate` | `FIRESTORE_TRIGGER` | `user` | `user` | `OSKUserService` | `_cascadePublicProfileChange` |

---

## 4. RBAC Entitlement Matrix (0 Permission Checks)

| Permission String | Requiring Modules | Total Occurrences |
| :--- | :--- | :--- |


---

## 5. Module Personality Breakdown (CRUD vs. High-Risk Repair)

| Module | Standard CRUD Methods | High-Risk Repair Methods | High-Risk Method Names |
| :--- | :--- | :--- | :--- |

