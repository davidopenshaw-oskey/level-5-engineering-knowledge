### 0. Generation Metadata

- runId: 20260828_150039-8345d222
- generatedAt: 2026-08-29T06:43:59.758Z
- repoName: angular-app-oskey-io
- targetModule: core
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

- **Backend Calls**: No direct backend calls are made by this capability [Confirmed].
- **Routes**: No routes are defined in this capability [Confirmed].

---

#### error-handler

- **Backend Calls**: None [Confirmed].
- **Routes**: None [Confirmed].

---

#### firebase

- **Backend Calls**:
  - The capability exposes a generic HTTPS callable wrapper `OSKFirebaseHttpsService.call` which uses `httpsCallable` from `@angular/fire/functions` to invoke a function by name. **Confirmed** (cited via `` `call_expression|core|hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts|httpsCallable|call|this.functions,functionName|#1` ``).
  - No specific hardcoded `firebase_callable_call` facts are present in this capability pack. **Confirmed**
- **Routes**:
  - No routes are defined in this capability. **Confirmed**

#### guards

- **Backend calls**: None. This capability does not make direct Firebase Callable or HTTP backend calls [Confirmed].
- **Routes**: No `angular_route` definitions are declared directly within this capability's evidence pack [Confirmed]. The guards are designed to be attached to routes defined in other modules.

---

#### injection-tokens

- **Backend Calls**: This capability does not make direct `firebase_callable_call` backend function calls. Instead, it establishes real-time listeners on Firestore database paths:
  - Document path: `users/{uid}` `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|doc|anon|firestore,'users',fbUser.uid|#1` ``
  - Collection path: `users/{uid}/organizations` `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|collection|anon|firestore,'users/' + fbUser.uid,'organizations'|#1` ``
- **Routes**: This capability does not define any routes. However, it injects the `Router` `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|inject|anon|Router|#1` `` and listens to `NavigationEnd` events to match active paths against user accounts, supporting paths such as:
  - `/user` and `/user/account` `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|user.accounts.push|anon|{ ... }|#1` ``
  - `/invitations/send` `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|user.accounts[0].defaultSidemenu.items.unshift|anon|{ ... }|#1` ``
  - `/organization/{organizationId}` and `/organization/{organizationId}/entities` `` `hosting/web-app/src/app/core/injection-tokens/current-user.token.ts` (line 220) ``

---

#### locale

- **Backend Calls**: None.
- **Routes**: None.

---

#### title-strategy

- **Backend Calls**: None.
- **Routes**: This capability does not define routes itself, but it hooks into the Angular Router lifecycle to intercept route changes and read route configuration data [Confirmed] (`` `class_method|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy|updateTitle|#1` ``).

#### translate

- **Backend calls**: None.
- **Routes**: None.

---

#### types

### Backend Calls
This capability does not make any direct Firebase Callable or HTTPS API calls. It only defines the data structures used by other services to make those calls, such as:
- **OSKHttpsSuccessResponse**: Generic success wrapper containing `status`, `code`, `data`, and `message` (`` `type_alias|core|hosting/web-app/src/app/core/types/https-response/https-response.type.ts|OSKHttpsSuccessResponse|#1` ``).
- **OSKHttpsErrorResponse**: Error wrapper containing `status`, `code`, and `message` (`` `type_alias|core|hosting/web-app/src/app/core/types/https-response/https-response.type.ts|OSKHttpsErrorResponse|#1` ``).

### Routes
This capability does not define any Angular routes.

---

#### utils

- **Backend Calls**: No Firebase callable functions or other backend API calls are made within this capability. [Confirmed]
- **Routes**: No Angular routes are defined or managed by this capability. [Confirmed]

---