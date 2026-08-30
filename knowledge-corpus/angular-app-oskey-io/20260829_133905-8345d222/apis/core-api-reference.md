### 0. Generation Metadata

- runId: 20260829_133905-8345d222
- generatedAt: 2026-08-29T13:56:38.561Z
- repoName: angular-app-oskey-io
- targetModule: core
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

- **Backend calls**: None evidenced in this capability pack.
- **Routes**: None evidenced in this capability pack.

#### error-handler

- **Backend Calls**: None [Confirmed].
- **Routes**: None [Confirmed].

#### firebase

### Backend Calls
This capability does not directly call specific, hardcoded Firebase Cloud Functions. Instead, it provides a generic wrapper service (`OSKFirebaseHttpsService`) that allows other capabilities to invoke functions dynamically. (Confirmed)
- **Evidence**: `` `call_expression|core|hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts|httpsCallable|call|this.functions,functionName|#1` ``

### Routes
This capability does not define or own any Angular routes. (Confirmed)

---

#### guards

### Backend Calls
No direct backend calls (such as `firebase_callable_call`) are initiated by this capability. [Confirmed]

### Routes
This capability does not define or own any `angular_route` definitions. It only provides the guard implementations intended to be attached to routes defined elsewhere in the application. [Confirmed]

---

#### injection-tokens

- **Backend Calls**: This capability does not invoke Firebase Cloud Functions (no `firebase_callable_call` facts are present). It interacts directly with Firestore collections:
  - Reads from the `users` collection: `users/{uid}` `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|doc|anon|firestore,'users',fbUser.uid|#1` ``.
  - Reads from the `organizations` subcollection: `users/{uid}/organizations` `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|collection|anon|firestore,'users/' + fbUser.uid,'organizations'|#1` ``.
- **Routes**: This capability does not define routes, but it listens to router events to track navigation changes `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|toSignal|anon|router.events.pipe(filter((e) => e instanceof NavigationEnd),map((e) => <NavigationEnd>e))|#1` ``.

---

#### locale

- **Backend Calls**: None.
- **Routes**: None.

---

#### title-strategy

- **Backend Calls**: None. [Confirmed]
- **Routes**: This capability does not define any routes itself; rather, it hooks into the global routing lifecycle to process route data. [Confirmed]

#### translate

- **Backend Calls**: None. This capability does not perform direct backend calls [Confirmed].
- **Routes**: None. This capability does not define any routing boundaries [Confirmed].

---

#### types

- **Backend Calls**: No direct `firebase_callable_call` facts are present in this capability. [Confirmed]
- **Routes**: No `angular_route` facts are present in this capability. [Confirmed]
- **Standardized Response Types**: It defines the structure of HTTPS responses used across the application:
  - `OSKHttpsSuccessResponse`: Contains `status`, `code`, `data`, and `message` `` `type_alias|core|hosting/web-app/src/app/core/types/https-response/https-response.type.ts|OSKHttpsSuccessResponse|#1` ``.
  - `OSKHttpsErrorResponse`: Contains `status`, `code`, and `message` `` `type_alias|core|hosting/web-app/src/app/core/types/https-response/https-response.type.ts|OSKHttpsErrorResponse|#1` ``.

---

#### utils

- **Backend Calls**: None. [Confirmed]
- **Routes**: None. [Confirmed]