### 0. Generation Metadata

- runId: `20260829_133905-8345d222`
- generatedAt: `2026-08-29T13:56:00.700Z`
- repoName: `angular-app-oskey-io`
- targetModule: `core`
- llmConfigKey: `gemini-default`
- llmProvider: `gemini`
- llmModel: `gemini-3.5-flash`

### 1. Executive Summary

The `core` module serves as the foundational infrastructure and utility layer for the entire application [Confirmed]. It encapsulates global services that are critical to the application's lifecycle, including Firebase integration (authentication, HTTPS callable functions, and App Check security), centralized global error handling, reactive localization and translation management, custom page title strategies, and the application's central domain type definitions [Confirmed]. By exposing these capabilities through a unified public API gateway, the `core` module ensures consistent security, error handling, and state propagation across all feature portals and UI components [Confirmed].

### 2. Architectural Position

The `core` module is positioned at the lowest layer of the application's dependency hierarchy [Confirmed]. It is designed to be a shared dependency imported by both the `components` and `features` modules [Confirmed]. 
- **Parent Scope**: Root application level.
- **Owned Concepts**: Global user authentication state, Firebase SDK configurations, global error interception, active locale state, and core domain models (e.g., users, organizations, accounts, and physical assets) [Confirmed].
- **Provided Capabilities**: Exposes low-level services (`OSKFirebaseAuthService`, `OSKFirebaseHttpsService`, `OSKErrorService`, `OSKTranslateService`, `OSKLocaleService`) and route protection mechanisms (`OSKLoggedInGuard`, `adminGuard`, `OSKUserRoleGuard`) to orchestrate secure and localized user sessions [Confirmed].
- **Architectural Inversion**: Although positioned as a low-level module, the evidence reveals an architectural inversion where `core` imports menu constants, utility functions, and types from the higher-level `features` module (specifically `features/portals/sidemenu`) [Confirmed].

### 3. Primary Responsibilities

#### _module_root

- **Public API Export Gateway**: Aggregates and re-exports critical core-level symbols to make them accessible to other modules in the application, as evidenced by the exports in `hosting/web-app/src/app/core/index.ts` (lines 1-4). (Confidence: Confirmed)
- **Error Handling Infrastructure**: Exposes global error handling capabilities by exporting `global-error.handler` and `error.service` `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/global-error.handler|#1` `` `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/error.service|#1` ``. (Confidence: Confirmed)
- **User Context Provisioning**: Exposes the current user injection token `current-user.token` `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./injection-tokens/current-user.token|#1` ``. (Confidence: Confirmed)
- **Common Type Definitions**: Exposes standard HTTP response structures via `https-response.type` `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./types/https-response/https-response.type|#1` ``. (Confidence: Confirmed)

#### error-handler

- **Global Error Interception**: Catches unhandled runtime exceptions globally using `OSKGlobalErrorHandler` [Confirmed] `` `source_class|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|OSKGlobalErrorHandler` ``.
- **User Notification Dispatch**: Displays error messages to the user via an Angular Material snackbar [Confirmed] `` `call_expression|core|hosting/web-app/src/app/core/error-handler/error.service.ts|this.snackBar.open|showError|this.translate.instant(msg),'OK',{       horizontalPosition: 'center',       verticalPosition: 'top'     }|#1` ``.
- **Error Message Translation**: Translates error messages or translation keys using the application's translation service before displaying them [Confirmed] `` `call_expression|core|hosting/web-app/src/app/core/error-handler/error.service.ts|this.translate.instant|showError|msgTranslationKey|#1` ``.
- **Zone-Aware Error Handling**: Injects `NgZone` within the global error handler, likely to ensure error UI updates run inside the Angular zone [Inferred] `` `call_expression|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|inject|anon|NgZone|#1` ``.

#### firebase

### Firebase Initialization and Provider Configuration
Configures and initializes the core Firebase SDK services, including Firebase App, App Check (with ReCaptcha Enterprise), Auth, Firestore, Functions, and Storage. It also manages environment-specific configurations to connect to local Firebase emulators when running in development mode. (Confirmed)
- **Evidence**: `hosting/web-app/src/app/core/firebase/providers/firebase.provider.ts` (lines 34-90)

### Authentication Management
Provides a comprehensive authentication service (`OSKFirebaseAuthService`) that handles user sign-in (via email/password, custom tokens, or email links), sign-up, sign-out, password resets, and profile updates. (Confirmed)
- **Evidence**: `` `angular_injectable|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService` ``

### HTTPS Callable Functions Wrapper
Exposes a generic wrapper service (`OSKFirebaseHttpsService`) to invoke Firebase Cloud Functions with typed request and response payloads, simplifying backend communication. (Confirmed)
- **Evidence**: `` `angular_injectable|core|hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts|OSKFirebaseHttpsService` ``

### Account Creation Restrictions
Enforces domain-based restrictions on account creation depending on the active Firebase project ID, preventing unauthorized sign-ups on restricted environments. (Confirmed)
- **Evidence**: `hosting/web-app/src/app/core/firebase/constants/account-create-restrictions.constant.ts` (lines 47-52)

---

#### guards

### Authentication Verification
The capability ensures that a user is fully authenticated and verified before accessing protected routes. The `OSKLoggedInGuard` checks that the user has a valid Firebase user session, is verified by OSKey, and has a corresponding OSKey user profile. If these conditions are not met, the user is redirected to the root path. [Confirmed, `` `angular_guard|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|OSKLoggedInGuard` ``]

### Global Admin Authorization
The capability restricts access to administrative routes. The `adminGuard` verifies if the currently logged-in user possesses the `'v1.admin'` role on their selected account. Unauthorized users are redirected to their selected account's specific router link. [Confirmed, `` `angular_guard|core|hosting/web-app/src/app/core/guards/admin.guard.ts|adminGuard` ``]

### Role-Based Access Control (RBAC)
The capability enforces granular role checks based on the active route and account context. The `OSKUserRoleGuard` evaluates whether the current user has the required roles to access a specific path. If the route targets an organization path (starting with `'/organization'`), the guard automatically includes the `'v1.org.admin'` role as an authorized role. [Confirmed, `` `angular_guard|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|OSKUserRoleGuard` ``]

---

#### injection-tokens

- **Authentication State Tracking**: Converts the Firebase Auth user stream into an Angular Signal to track the logged-in user's basic credentials `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|toSignal|anon|user(auth).pipe(map((u) => createOSKFirebaseUser(u)))|#1` ``.
- **User Profile & Organization Synchronization**: Listens to real-time changes in the user's Firestore document `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|onSnapshot|anon|docRef,(snapshot) => { ... }|#1` `` and their subcollection of organizations `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|collectionData|anon|userOrganizationsDocRef|#1` ``.
- **Dynamic Account & Menu Generation**: Constructs user accounts and side menus dynamically based on the user's roles within each organization `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|generateUserOrganizationDefaultMenu|anon|organization|#1` ``.
- **Active Account Resolution**: Derives the currently active account by matching the current router navigation path against the user's registered account paths `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|computed|anon|() => { ... }|#1` ``.
- **Developer Testing Features**: Conditionally injects a "Send invitation" menu item into the side menu for specific developer email addresses `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|emailsToShowSendInvitationsTo.includes|anon|user.email|#1` ``.

---

#### locale

- **Active Locale State Management**: Tracks and exposes the active locale using Angular Signals (`_locale` and `locale`). [Confirmed] (`` `angular_signal|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|_locale` ``, `` `angular_signal|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|locale` ``)
- **Locale Initialization**: Provides an initializer factory (`localeInitializerFactory`) that sets up the default locale and triggers translation loading during application startup. [Confirmed] (`` `function_declaration|core|hosting/web-app/src/app/core/locale/providers/locale-initializer/locale-initializer.provider.ts|localeInitializerFactory|#1` ``)
- **Locale Registration**: Registers Angular locale data dynamically (specifically French locale data via `registerLocaleData`). [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|registerLocaleData|registerLocale|localeFr|#1` ``)
- **Locale Provider Integration**: Exposes a custom `OSKLocaleId` class that overrides or integrates with Angular's `LOCALE_ID` token to dynamically reflect the active locale. [Confirmed] (`` `source_class|core|hosting/web-app/src/app/core/locale/providers/localeId/localeId.provider.ts|OSKLocaleId` ``)

---

#### title-strategy

- **Dynamic Document Title Management**: Intercepts route changes to build and apply the page title using Angular's `Title` service and updates the corresponding `<meta name="title">` tag. [Confirmed] (evidenced by `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.title.setTitle|setTitle|newTitle|#1` `` and `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setTitle|{       name: 'title',       content: newTitle     }|#1` ``).
- **Meta Description Management**: Dynamically updates the HTML `<meta name="description">` tag using either the description provided in the active route's data or a fallback default description. [Confirmed] (evidenced by `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setDescription|{         name: 'description',         content: data.description       }|#1` `` and `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setDescription|{         name: 'description',         content: this.defaultDescription       }|#1` ``).
- **Apple iTunes App Tag Management**: Configures the `<meta name="apple-itunes-app">` tag dynamically based on route data parameters. [Confirmed] (evidenced by `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setAppleItunesTag|{       name: 'apple-itunes-app',       content: appItuneAppContent     }|#1` ``).

#### translate

- **Translation Resolution Service**: Exposes synchronous and reactive translation lookups, as well as reactive computed signals that automatically update when the active locale changes [Confirmed].
- **Template Translation Pipes**: Provides custom Angular pipes (`oskTranslate` and `oskBoolean`) to handle inline translation of keys and boolean values directly within HTML templates [Confirmed].
- **Dependency Injection Configuration**: Configures the translation loader factory and registers the `TranslateModule` with HTTP loader dependencies for application-wide initialization [Confirmed].
- **Type Definitions**: Establishes strict TypeScript types and aliases for translation keys, parameters, and key-value pairs [Confirmed].

---

#### types

### User and Account Modeling
Defines the structure of users, current authenticated sessions, user settings, onboarding status, and user accounts. [Confirmed]
- Models the core user profile via `OSKUser` `` `type_alias|core|hosting/web-app/src/app/core/types/user/user.type.ts|OSKUser|#1` `` and public profile updates via `OSKUpdateUserPublicProfile` `` `type_alias|core|hosting/web-app/src/app/core/types/user/user.type.ts|OSKUpdateUserPublicProfile|#1` ``.
- Models the active user session via `OSKCurrentUser` `` `type_alias|core|hosting/web-app/src/app/core/types/user/current-user.type.ts|OSKCurrentUser|#1` ``.
- Models user settings and notification preferences (email, push, SMS) via `OSKUserSettings` `` `type_alias|core|hosting/web-app/src/app/core/types/user/user.type.ts|OSKUserSettings|#1` `` and `OSKNotificationPreference` `` `type_alias|core|hosting/web-app/src/app/core/types/user/user.type.ts|OSKNotificationPreference|#1` ``.
- Models user accounts and their associated roles, paths, and default side menus via `OSKUserAccount` `` `type_alias|core|hosting/web-app/src/app/core/types/user/user.type.ts|OSKUserAccount|#1` ``.

### Access Control and Recurrence Modeling
Models access rights, validity periods, and recurrence rules for doors and units. [Confirmed]
- Models access rights (one-time, permanent, recurrent) via `OSKAccessRight` `` `type_alias|core|hosting/web-app/src/app/core/types/access/access-rights.type.ts|OSKAccessRight|#1` `` and validity states via `OSKAccessRightValidity` `` `type_alias|core|hosting/web-app/src/app/core/types/access/access-rights.type.ts|OSKAccessRightValidity|#1` ``.
- Models recurrence rules (daily, weekly, monthly) and exceptions via `OSKAccessRecurrence` `` `type_alias|core|hosting/web-app/src/app/core/types/access/access-recurrence.type.ts|OSKAccessRecurrence|#1` ``.
- Models user access types via the `OSKUserAccessType` enum `` `enum_declaration|core|hosting/web-app/src/app/core/types/access/user-access-type.type.ts|OSKUserAccessType|#1` ``.

### Building and IoT Device Modeling
Defines structures for buildings, building units, doors, and IoT access control devices. [Confirmed]
- Models buildings and organization-specific buildings via `OSKBuilding` `` `type_alias|core|hosting/web-app/src/app/core/types/building/building.type.ts|OSKBuilding|#1` `` and `OSKOrganizationBuilding` `` `type_alias|core|hosting/web-app/src/app/core/types/building/organization-building.type.ts|OSKOrganizationBuilding|#1` ``.
- Models building units and their inhabitants (owners, residents, tenants) via `OSKBuildingUnit` `` `type_alias|core|hosting/web-app/src/app/core/types/building/building-unit.type.ts|OSKBuildingUnit|#1` `` and `OSKBuildingUnitInhabitant` `` `type_alias|core|hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts|OSKBuildingUnitInhabitant|#1` ``.
- Models IoT access control devices, their statistics, activity logs, and activity types via `OSKAccessControlDevice` `` `type_alias|core|hosting/web-app/src/app/core/types/building/building-door.type.ts|OSKAccessControlDevice|#1` `` and the `OSKAccessControlDeviceActivityType` enum `` `enum_declaration|core|hosting/web-app/src/app/core/types/building/building-door.type.ts|OSKAccessControlDeviceActivityType|#1` ``.

### Address and Contact Modeling
Models physical addresses, geographic coordinates, and phone numbers. [Confirmed]
- Models physical addresses and geographic coordinates via `OSKAddress` and `OSKCoordinates` `` `hosting/web-app/src/app/core/types/address/address.type.ts` (lines 2-13) ``.
- Models phone numbers and country dial codes via `OSKPhoneNumber` and `OSKCountry` `` `hosting/web-app/src/app/core/types/phone-number/phone-number.type.ts` (lines 14-25) ``.

### Document and Response Modeling
Models system documents and standardized HTTPS success/error responses. [Confirmed]
- Models system documents and document lists via `OSKDocument` `` `type_alias|core|hosting/web-app/src/app/core/types/document/document.type.ts|OSKDocument|#1` `` and `OSKDocumentList` `` `type_alias|core|hosting/web-app/src/app/core/types/document/document-list.type.ts|OSKDocumentList|#1` ``.
- Models standardized HTTPS success and error responses via `OSKHttpsSuccessResponse` and `OSKHttpsErrorResponse` `` `hosting/web-app/src/app/core/types/https-response/https-response.type.ts` (lines 1-11) ``.

---

#### utils

- **Timezone Offset Removal**: Adjusts a `Date` object by subtracting its local timezone offset to align it with UTC representation. [Confirmed; `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|date.getTimezoneOffset|removeTimezoneOffset||#1` ``]
- **ISO String Formatting without Timezone**: Converts a `Date` object to an ISO string representation while stripping out the timezone indicator. [Confirmed; `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|new Date(date.valueOf() - tzoffset).toISOString().slice|getISOStringWithoutTimezoneIndicator|0,-1|#1` ``]
- **Timezone Indicator Stripping**: Removes the trailing 'Z' character from an ISO string. [Confirmed; `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|isoString.replace|removeTimezoneIndicatorFromIsoString|'Z',''|#1` ``]
- **Public Exporting**: Exposes these date utilities through a central entry point. [Confirmed; `` `exported_symbol|core|hosting/web-app/src/app/core/utils/index.ts|./date.utils|#1` ``]

### 4. Public Interfaces (Components & Services)

#### _module_root

No components or services are directly defined within this capability pack. However, the root index file `hosting/web-app/src/app/core/index.ts` (lines 1-4) exposes the following symbols from other parts of the `core` module:
- **Injection Token**: `current-user.token` (exported via `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./injection-tokens/current-user.token|#1` ``)
- **Handler**: `global-error.handler` (exported via `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/global-error.handler|#1` ``)
- **Service**: `error.service` (exported via `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/error.service|#1` ``)
- **Type**: `https-response.type` (exported via `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./types/https-response/https-response.type|#1` ``)

#### error-handler

- **OSKErrorService** (Injectable Service)
  - **Scope**: Provided in `'root'` [Confirmed] `` `call_expression|core|hosting/web-app/src/app/core/error-handler/error.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``.
  - **Class**: `OSKErrorService` [Confirmed] `` `angular_injectable|core|hosting/web-app/src/app/core/error-handler/error.service.ts|OSKErrorService` ``.
  - **Methods**:
    - `showError(msgTranslationKey: string)`: Translates and displays a specific error message [Confirmed] `` `service_method|core|hosting/web-app/src/app/core/error-handler/error.service.ts|OSKErrorService|showError|#1` ``.
- **OSKGlobalErrorHandler** (Class)
  - **Class**: `OSKGlobalErrorHandler` [Confirmed] `` `source_class|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|OSKGlobalErrorHandler` ``.
  - **Description**: Injects `OSKErrorService` and `NgZone` to handle uncaught application errors [Confirmed] `` `call_expression|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|inject|anon|OSKErrorService|#1` ``.

#### firebase

### Services

#### `OSKFirebaseAuthService`
- **Class Name**: `OSKFirebaseAuthService`
- **File**: `hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts`
- **Scope**: `providedIn: 'root'` (evidenced by `` `call_expression|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``)
- **Key Methods**:
  - `signOut()`: Signs out the current user using Firebase Auth. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|signOut|#1` ``
  - `signInWithEmailAndPassword(email, password)`: Authenticates a user with email and password. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|signInWithEmailAndPassword|#1` ``
  - `signUpWithEmailAndPassword(email, password)`: Registers a new user with email and password. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|signUpWithEmailAndPassword|#1` ``
  - `verifyPasswordResetCode(oobCode)`: Verifies a password reset code. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|verifyPasswordResetCode|#1` ``
  - `sendPasswordResetEmail(email)`: Sends a password reset email. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|sendPasswordResetEmail|#1` ``
  - `resetPassword(oobCode, password)`: Resets a user's password. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|resetPassword|#1` ``
  - `signInWithCustomToken(token)`: Authenticates a user with a custom token. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|signInWithCustomToken|#1` ``
  - `signUpWithEmailLink(email, actionCodeSettings)`: Sends a sign-in link to the user's email. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|signUpWithEmailLink|#1` ``
  - `confirmSignIn(email)`: Confirms sign-in with an email link. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|confirmSignIn|#1` ``
  - `setDoc(path, docDTO, ...pathSegments)`: Sets a document in Firestore. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|setDoc|#1` ``
  - `updateProfile(profileDTO)`: Updates the current user's profile. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|updateProfile|#1` ``
  - `getUserByUid(uid)`: Retrieves user data from Firestore by UID. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|getUserByUid|#1` ``
  - `generateOrganizationId()`: Generates a new unique Firestore document ID for an organization. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService|generateOrganizationId|#1` ``

#### `OSKFirebaseHttpsService`
- **Class Name**: `OSKFirebaseHttpsService`
- **File**: `hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts`
- **Scope**: `providedIn: 'root'` (evidenced by `` `call_expression|core|hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``)
- **Key Methods**:
  - `call(functionName, data)`: Invokes a Firebase HTTPS callable function. (Confirmed) — `` `service_method|core|hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts|OSKFirebaseHttpsService|call|#1` ``

---

#### guards

This capability does not expose standard Angular components or injectable services. Instead, it exposes three functional or class-based Angular route guards:

- **`adminGuard`**: A route guard that injects `Router` and `OSKCurrentUserToken` to verify global admin privileges. [Confirmed, `` `angular_guard|core|hosting/web-app/src/app/core/guards/admin.guard.ts|adminGuard` ``]
- **`OSKLoggedInGuard`**: A route guard that monitors the authentication status of the user using an Angular reactive effect and RxJS stream. [Confirmed, `` `angular_guard|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|OSKLoggedInGuard` ``]
- **`OSKUserRoleGuard`**: A route guard that evaluates route-specific roles against the user's active account roles. [Confirmed, `` `angular_guard|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|OSKUserRoleGuard` ``]

---

#### injection-tokens

This capability does not declare standard Angular components or `@Injectable` classes. Instead, it exposes reactive state and utility functions:
- **`createOSKFirebaseUser`**: A pure function that maps a raw Firebase user object to the application's internal user representation `` `function_declaration|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|createOSKFirebaseUser|#1` ``.
- **Reactive Signals**: Exposes state through Angular Signals, including `oskUserSignal` `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|signal|anon|undefined|#1` `` and a `computed` state containing the verified status and selected account `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|computed|anon|() => { ... }|#1` ``.

---

#### locale

- **OSKLocaleService** (Injectable, provided in `'root'`): Manages active locale state and registration. [Confirmed] (`` `angular_injectable|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService` ``)
  - *Signals*:
    - `locale`: Computed signal exposing the current locale string. (`` `angular_signal|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|locale` ``)
  - *Methods*:
    - `initialize()`: Initializes the locale state. (`` `service_method|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|initialize|#1` ``)
    - `setLocale(localeId)`: Updates the active locale and triggers translation updates. (`` `service_method|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|setLocale|#1` ``)
    - `registerLocale(localeId)`: Dynamically registers Angular locale data. (`` `service_method|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|registerLocale|#1` ``)
- **OSKLocaleId** (Class): A custom class used to dynamically resolve the active locale ID. [Confirmed] (`` `source_class|core|hosting/web-app/src/app/core/locale/providers/localeId/localeId.provider.ts|OSKLocaleId` ``)
  - *Methods*:
    - `toString()`: Returns the active locale from `OSKLocaleService`. (`` `class_method|core|hosting/web-app/src/app/core/locale/providers/localeId/localeId.provider.ts|OSKLocaleId|toString|#1` ``)
    - `valueOf()`: Returns the string value of the active locale. (`` `class_method|core|hosting/web-app/src/app/core/locale/providers/localeId/localeId.provider.ts|OSKLocaleId|valueOf|#1` ``)
- **localeInitializerFactory** (Function): Factory function used to initialize the locale during application bootstrap. [Confirmed] (`` `function_declaration|core|hosting/web-app/src/app/core/locale/providers/locale-initializer/locale-initializer.provider.ts|localeInitializerFactory|#1` ``)

---

#### title-strategy

- **OSKTitleStrategy** (Injectable Service): A custom title strategy provider that extends a base class (likely Angular's `TitleStrategy`) to handle route-based document title and metadata updates. [Confirmed]
  - **File**: `hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts` (line 22) [Confirmed] (evidenced by `` `angular_injectable|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy` ``).
  - **Scope**: Decorated with `@Injectable` (line 22) [Confirmed] (evidenced by `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|Injectable|anon||#1` ``).
  - **Key Methods**:
    - `updateTitle(snapshot: RouterStateSnapshot)`: Overrides the base strategy to build the title and update associated metadata. [Confirmed] (evidenced by `` `class_method|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy|updateTitle|#1` ``).
    - `setTitle(newTitle: string)`: Updates the document title and meta title tag. [Confirmed] (evidenced by `` `class_method|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy|setTitle|#1` ``).
    - `setDescription(routeData: any)`: Updates the meta description tag. [Confirmed] (evidenced by `` `class_method|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy|setDescription|#1` ``).
    - `setAppleItunesTag(routeData: any)`: Updates the Apple iTunes app meta tag. [Confirmed] (evidenced by `` `class_method|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy|setAppleItunesTag|#1` ``).

#### translate

This capability exposes the following injectable service and custom pipes:

#### Services
- **`OSKTranslateService`** [Confirmed]
  - **Class**: `OSKTranslateService` `` `angular_injectable|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|OSKTranslateService` ``
  - **Scope**: `providedIn: 'root'` `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``
  - **Description**: Wraps the third-party `TranslateService` and provides reactive computed signals linked to the active locale.

#### Pipes
- **`OSKTranslate`** [Confirmed]
  - **Class**: `OSKTranslate` `` `source_class|core|hosting/web-app/src/app/core/translate/pipes/translate.pipe.ts|OSKTranslate` ``
  - **Selector/Name**: `oskTranslate` `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/translate.pipe.ts|Pipe|anon|{   name: 'oskTranslate' }|#1` ``
  - **Description**: Translates a given key and optional parameters reactively using `OSKTranslateService.stream` `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/translate.pipe.ts|this.translate.stream|transform|key,params|#1` ``.
- **`OSKBoolean`** [Confirmed]
  - **Class**: `OSKBoolean` `` `source_class|core|hosting/web-app/src/app/core/translate/pipes/boolean.pipe.ts|OSKBoolean` ``
  - **Selector/Name**: `oskBoolean` `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/boolean.pipe.ts|Pipe|anon|{   name: 'oskBoolean' }|#1` ``
  - **Description**: Maps boolean values to localized "yes" or "no" strings (`boolean.yes` / `boolean.no`) using `OSKTranslateService.instant` `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/boolean.pipe.ts|this.translate.instant|transform|'boolean.yes'|#1` ``.

---

#### types

This capability contains no Angular components or injectable services. It is strictly a type-definition capability containing TypeScript interfaces, classes, enums, and type aliases. [Confirmed] (based on the absence of `angular_component` and `angular_injectable` facts).

It exposes public TypeScript symbols via its barrel file `hosting/web-app/src/app/core/types/index.ts` `` `hosting/web-app/src/app/core/types/index.ts` (lines 1-20) ``.

---

#### utils

No Angular components or injectable services are defined in this capability. It exposes pure TypeScript utility functions from `hosting/web-app/src/app/core/utils/date.utils.ts` [Confirmed; `` `source_file|core|hosting/web-app/src/app/core/utils/date.utils.ts|hosting/web-app/src/app/core/utils/date.utils.ts` ``] via the public barrel file `hosting/web-app/src/app/core/utils/index.ts` [Confirmed; `` `exported_symbol|core|hosting/web-app/src/app/core/utils/index.ts|./date.utils|#1` ``].

### 5. UI Composition

#### _module_root

No UI components, templates, or template bindings are defined in this capability pack.

#### error-handler

This capability does not define any Angular components or templates [Confirmed]. It triggers UI notifications programmatically using the injected `MatSnackBar` service [Confirmed] `` `call_expression|core|hosting/web-app/src/app/core/error-handler/error.service.ts|this.snackBar.open|showError|this.translate.instant(msg),'OK',{       horizontalPosition: 'center',       verticalPosition: 'top'     }|#1` ``.

#### firebase

This capability contains no Angular components, templates, or UI bindings. It is purely a service and infrastructure layer. (Confirmed)

---

#### guards

This capability contains only route guards and does not define any components, templates, or UI bindings. [Confirmed]

---

#### injection-tokens

This capability contains no components or templates. It is a pure logical and state-management layer.

---

#### locale

This capability does not contain any Angular components or templates. It is a pure infrastructure and state-management capability. [Confirmed]

---

#### title-strategy

This capability does not define or compose any UI components. It operates entirely as a background service manipulating the document head metadata. [Confirmed]

#### translate

This capability contains no Angular components, only pipes (`OSKTranslate` and `OSKBoolean`) used within templates elsewhere in the application [Confirmed]. 

- **`OSKTranslatePipe`** declares `OSKTranslate` and imports/exports `AsyncPipe` from `@angular/common` to handle reactive stream resolution in templates `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/translate.pipe.ts|NgModule|anon|{   declarations: [OSKTranslate],   imports: [AsyncPipe],   exports: [OSKTranslate, AsyncPipe] }|#1` ``.
- **`OSKBooleanPipe`** declares and exports `OSKBoolean` `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/boolean.pipe.ts|NgModule|anon|{   declarations: [OSKBoolean],   imports: [],   exports: [OSKBoolean] }|#1` ``.

---

#### types

This capability contains no UI components or templates, and therefore has no template compositions or bindings. [Confirmed] (based on the absence of `angular_template_composition` and `angular_template_binding` facts).

---

#### utils

This capability does not contain any UI components or templates. [Confirmed]

### 6. API Contracts & Routes

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

### 7. State Ownership

**Ownership conclusion:**

The `core` module manages the application's primary global reactive states using Angular Signals, establishing a clean, unidirectional flow of foundational data [Confirmed]:
- **User Session State**: Managed via `OSKCurrentUserToken` (within the `injection-tokens` submodule), which exposes the read-only `firebaseUser` signal, a writable `oskUserSignal` containing profile and account details, and computed signals for verification status (`isOskVerified`) and active account resolution (`selectedAccount`) [Confirmed].
- **Localization State**: Managed by `OSKLocaleService` (within the `locale` submodule) via a private writable signal `_locale` and a public computed signal `locale` [Confirmed].
- **Translation State**: Managed by `OSKTranslateService` (within the `translate` submodule), which exposes computed signals (`getTranslation`, `getTranslations`) that reactively track changes to the active locale signal and synchronously emit updated translation strings [Confirmed].

**Cross-Capability Synthesis**: 
There is no conflicting or ambiguous state ownership within the `core` module [Confirmed]. The division of reactive state is highly cohesive: `injection-tokens` owns the user session, `locale` owns the active language, and `translate` owns the derived translation streams. A direct reactive dependency exists between `translate` and `locale`, where translation signals automatically re-evaluate whenever the active locale signal changes [Confirmed]. Furthermore, the `guards` capability reactively consumes the session state owned by `injection-tokens` to evaluate route accessibility on the fly [Confirmed].

**Per-capability evidence:**

#### _module_root

No Angular signals or local reactive states are defined in this capability pack.

#### error-handler

This capability does not own or expose any reactive state or Angular Signals [Confirmed].

#### firebase

This capability does not declare or manage any local reactive state using Angular Signals. (Confirmed)

---

#### guards

This capability does not own persistent or local component state. However, it manages transient reactive flows to determine route accessibility:

- **`authStatus`**: A local stream (likely a `BehaviorSubject` or `Subject`) in `OSKLoggedInGuard` that is updated inside an Angular `effect` whenever the `currentUser` signal emits. [Confirmed, `` `hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts` (lines 35-37) ``]
- **`currentUser`**: Accessed via the injected `OSKCurrentUserToken` in all three guards to read the current user's profile, selected account, and roles. [Confirmed, `` `call_expression|core|hosting/web-app/src/app/core/guards/admin.guard.ts|inject|anon|OSKCurrentUserToken|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|inject|anon|OSKCurrentUserToken|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|inject|anon|OSKCurrentUserToken|#1` ``]

---

#### injection-tokens

This capability owns and manages the following reactive state:
- **`firebaseUser`**: A read-only signal derived from the Firebase Auth state `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|toSignal|anon|user(auth).pipe(map((u) => createOSKFirebaseUser(u)))|#1` ``.
- **`navigationSignal`**: A read-only signal tracking `NavigationEnd` router events `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|toSignal|anon|router.events.pipe(filter((e) => e instanceof NavigationEnd),map((e) => <NavigationEnd>e))|#1` ``.
- **`oskUserSignal`**: A writeable signal holding the current `OSKUser` profile and accounts `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|signal|anon|undefined|#1` ``.
- **`computed` State**: A derived signal that evaluates:
  - `isOskVerified`: Boolean indicating if the user is verified and has set their first and last name.
  - `selectedAccount`: The active `OSKUserAccount` matching the current route path `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|computed|anon|() => { ... }|#1` ``.

---

#### locale

- **OSKLocaleService._locale**: Private writable signal initialized with `environment.defaultLocale`. [Confirmed] (`` `angular_signal|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|_locale` ``)
- **OSKLocaleService.locale**: Public computed signal deriving from `_locale`. [Confirmed] (`` `angular_signal|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|locale` ``)

---

#### title-strategy

This capability does not manage or expose any local reactive state (such as Angular Signals). [Confirmed]

#### translate

This capability manages reactive UI state via Angular Signals [Confirmed]:

- **`getTranslation(key: string, params?: any)`**: Returns a `computed` signal that tracks the active locale from `OSKLocaleService` and derives the translated string synchronously using `this.instant(key, params)` `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|computed|getTranslation|() => {       this.localeService.locale();       return this.instant(key, params);     }|#1` ``.
- **`getTranslations(translationPairs: OSKTranslationPairs)`**: Returns a `computed` signal that tracks the active locale and derives a dictionary of translated strings (`OSKTranslations`) from a set of translation keys and parameters `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|computed|getTranslations|() => {       this.localeService.locale();       const translations: OSKTranslations = {};       for (const key in translationPairs) {         if (typeof translationPairs[key] === 'string') {           translations[key] = this.instant(translationPairs[key] as string);         } else {           translations[key] = this.instant             (<OSKTranslationKeyWithParams>translationPairs[key]).key,             (<OSKTranslationKeyWithParams>translationPairs[key]).params           );         }       }       return translations;     }|#1` ``.

---

#### types

This capability does not own or expose any reactive state (no `angular_signal` facts are present). [Confirmed]

---

#### utils

This capability does not manage or own any local reactive state or Angular signals. [Confirmed]

### 8. Outbound Coupling

#### _module_root

This capability acts as an aggregator and exhibits outbound coupling to other submodules within the `core` module via relative imports/exports:
- **Import-based coupling**:
  - Couples to `./injection-tokens/current-user.token` `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./injection-tokens/current-user.token|#1` ``
  - Couples to `./error-handler/global-error.handler` `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/global-error.handler|#1` ``
  - Couples to `./error-handler/error.service` `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/error.service|#1` ``
  - Couples to `./types/https-response/https-response.type` `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./types/https-response/https-response.type|#1` ``

#### error-handler

### Import-Based Coupling
- **`core/translate`**: Injects `OSKTranslateService` (imported from `@oskey/translate`) to translate error messages [Confirmed] `` `imports_dependency|core|hosting/web-app/src/app/core/error-handler/error.service.ts|@oskey/translate|#1` ``.
- **`error-handler` (Self-coupling)**: `OSKGlobalErrorHandler` imports and injects `OSKErrorService` [Confirmed] `` `imports_dependency|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|./error.service|#1` ``.

### Template-Composition Coupling
None [Confirmed].

#### firebase

### Import-Based Coupling
The `firebase` capability depends on other submodules within the `core` module:
- **`core/types`**: Used for user-related type definitions. (Confirmed)
  - **Evidence**: `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|../../../types/user/user.type|#1` `` and `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|@oskey/core/types|#1` ``
- **`core/injection-tokens`**: Imports `OSKCurrentUserToken` to inject current user context. (Confirmed)
  - **Evidence**: `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|src/app/core/injection-tokens/current-user.token|#1` ``
- **`core` (root)**: Imports `@oskey/core` for shared core utilities or types. (Confirmed)
  - **Evidence**: `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts|@oskey/core|#1` ``

### Template-Composition Coupling
None (no components exist in this capability). (Confirmed)

---

#### guards

### Import-Based Coupling
The guards couple to other submodules within the `core` module:

- **`core/injection-tokens`**: All three guards import and inject `OSKCurrentUserToken` to retrieve the current user's state. [Confirmed, `` `imports_dependency|core|hosting/web-app/src/app/core/guards/admin.guard.ts|../injection-tokens/current-user.token|#1` ``, `` `imports_dependency|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|../../injection-tokens/current-user.token|#1` ``]
- **`core/types`**: Guards import type definitions for user profiles and accounts. [Confirmed, `` `imports_dependency|core|hosting/web-app/src/app/core/guards/admin.guard.ts|../types|#1` ``, `` `imports_dependency|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|@oskey/core/types|#1` ``, `` `imports_dependency|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|../../types/user/current-user.type|#1` ``]
- **`@oskey/core`**: Imported by `OSKLoggedInGuard`. [Confirmed, `` `imports_dependency|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|@oskey/core|#1` ``]

### Template-Composition Coupling
None. [Confirmed]

---

#### injection-tokens

### Import-Based Coupling
This capability depends on the following internal modules and submodules:
- **`core/types`**: Imports user and organization type definitions:
  - `../types/user/current-user.type` `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|../types/user/current-user.type|#1` ``
  - `../types/user/user-organization.type` `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|../types/user/user-organization.type|#1` ``
  - `../types/user/user.type` `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|../types/user/user.type|#1` ``
- **`features/portals`**: Imports side-menu constants and utility functions:
  - `src/app/features/portals/sidemenu/constants/user-menu.constant` `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|src/app/features/portals/sidemenu/constants/user-menu.constant|#1` ``
  - `src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util` `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util|#1` ``

### Template-Composition Coupling
None.

---

#### locale

- **Import-based Coupling**:
  - **Environment Configuration**: Imports `@env/environment` to access `environment.defaultLocale` in `OSKLocaleService`. [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@env/environment|#1` ``)
  - **External Libraries**:
    - Imports `@ngx-translate/core` to interact with `TranslateService`. [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@ngx-translate/core|#1` ``, `` `imports_dependency|core|hosting/web-app/src/app/core/locale/providers/locale-initializer/locale-initializer.provider.ts|@ngx-translate/core|#1` ``)
    - Imports `@angular/common` and `@angular/common/locales/fr` to register French locale data. [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@angular/common|#1` ``, `` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@angular/common/locales/fr|#1` ``)
- **Template-composition Coupling**: None.

---

#### title-strategy

### Import-Based Coupling
The `OSKTitleStrategy` service depends on the following external and internal modules:
- **@angular/core**: For dependency injection (`inject`, `Injectable`). [Confirmed] (evidenced by `` `imports_dependency|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|@angular/core|#1` ``).
- **@angular/platform-browser**: For DOM metadata manipulation utilities (`Title`, `Meta`). [Confirmed] (evidenced by `` `imports_dependency|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|@angular/platform-browser|#1` ``).
- **@angular/router**: For routing lifecycle integration. [Confirmed] (evidenced by `` `imports_dependency|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|@angular/router|#1` ``).
- **@env/environment**: For environment-specific configurations. [Confirmed] (evidenced by `` `imports_dependency|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|@env/environment|#1` ``).

### Template-Composition Coupling
None. [Confirmed]

#### translate

#### Import-Based Coupling
- **`core/locale`**: `OSKTranslateService` imports `@oskey/locale` `` `imports_dependency|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|@oskey/locale|#1` `` to inject `OSKLocaleService` `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|inject|anon|OSKLocaleService|#1` `` and react to locale changes `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|this.localeService.locale|getTranslation||#1` ``.

#### Template-Composition Coupling
- None. This capability does not contain components and therefore does not compose other components in templates [Confirmed].

---

#### types

### Import-based Coupling

#### External Libraries
- **@angular/fire/firestore**: Imported by `building-door.type.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/types/building/building-door.type.ts|@angular/fire/firestore|#1` ``.
- **@angular/fire/auth**: Imported by `current-user.type.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/types/user/current-user.type.ts|@angular/fire/auth|#1` `` and `user.type.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/types/user/user.type.ts|@angular/fire/auth|#1` ``.

#### Inter-Module Coupling
- **features module (portals submodule)**: `user.type.ts` imports `src/app/features/portals/sidemenu/types/side-menus.type` `` `imports_dependency|core|hosting/web-app/src/app/core/types/user/user.type.ts|src/app/features/portals/sidemenu/types/side-menus.type|#1` ``.

#### Intra-Module Coupling
- **core module (types submodule)**: Self-referential imports of `@oskey/core/types` occur in `building-unit-inhabitant.type.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts|@oskey/core/types|#1` `` and `pending-organization.type.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/types/organization/pending-organization.type.ts|@oskey/core/types|#1` ``.

### Template-composition Coupling
None. [Confirmed] (no template composition facts are present).

---

#### utils

- **Import-based Coupling**: None. [Confirmed]
- **Template-composition Coupling**: None. [Confirmed]

### 9. Internal Structure

The internal structure of the `core` module is organized into eight distinct submodules, with coupling patterns defined as follows [Confirmed]:

- **`_module_root`**: Acts as the public API gateway (`index.ts`).
  - *Inbound Coupling*: Receives imports from `firebase` (for `OSKHttpsSuccessResponse`) and `guards` (for `OSKCurrentUserToken`).
  - *Outbound Coupling*: None.
- **`error-handler`**: Manages global error interception and user notifications.
  - *Inbound Coupling*: None.
  - *Outbound Coupling*: Depends on `translate` (`OSKTranslateService`).
- **`firebase`**: Wraps Firebase SDKs and manages backend communication.
  - *Inbound Coupling*: None.
  - *Outbound Coupling*: Depends on `_module_root` (`OSKHttpsSuccessResponse`), `injection-tokens` (`OSKCurrentUserToken`), and `types` (`OSKUpdateProfileDTO`, `OSKUser`, `OSKCurrentUser`).
- **`guards`**: Enforces route-level security.
  - *Inbound Coupling*: None.
  - *Outbound Coupling*: Depends on `_module_root` (`OSKCurrentUserToken`), `injection-tokens` (`OSKCurrentUserToken`), and `types` (`OSKCurrentUser`).
- **`injection-tokens`**: Synchronizes and exposes the active user session.
  - *Inbound Coupling*: Receives imports from `firebase` and `guards`.
  - *Outbound Coupling*: Depends on `types` (`OSKFirebaseUser`, `OSKCurrentUser`, `OSKUserOrganization`, `OSKUser`, `OSKUserAccount`).
- **`locale`**: Manages the active application locale.
  - *Inbound Coupling*: Receives imports from `translate` (`OSKLocaleService`).
  - *Outbound Coupling*: None.
- **`translate`**: Provides translation utilities and pipes.
  - *Inbound Coupling*: Receives imports from `error-handler`.
  - *Outbound Coupling*: Depends on `locale` (`OSKLocaleService`).
- **`types`**: Defines the shared domain model.
  - *Inbound Coupling*: Receives imports from `firebase`, `guards`, and `injection-tokens`.
  - *Outbound Coupling*: None.

### 10. Cross-Module Relationships

The `core` module exhibits clear boundaries, characterized by a massive inbound dependency footprint from other modules and a specific, highly-coupled outbound dependency that represents an architectural inversion [Confirmed].

#### Outbound Relationships
- **`features`** [Confirmed]: The `core` module unexpectedly depends on the `features` module. Specifically, `core/injection-tokens` and `core/types` import sidemenu constants, utilities, and types from `features/portals/sidemenu`:
  - `current-user.token.ts` imports `OSKUserDefaultSidemenu` and `generateUserOrganizationDefaultMenu` from `src/app/features/portals/sidemenu/constants/user-menu.constant` and `src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util`.
  - `user.type.ts` imports `OSKSideMenu` from `src/app/features/portals/sidemenu/types/side-menus.type`.

#### Inbound Relationships
- **`components`** [Confirmed]: The `components` module depends on `core` to render global UI elements. Specifically, `components/header/header.component.ts` imports user types (`OSKCurrentUser`, `OSKUserAccount`), session tokens (`OSKCurrentUserToken`), and translation pipes (`OSKTranslatePipe`).
- **`features`** [Confirmed]: The `features` module relies heavily on `core` for business logic, translation, and backend communication, accumulating **228 touchpoints** [Confirmed]. Key method-level integrations include:
  - **Error Handling**: Calls `OSKErrorService.showError` across 16 distinct feature call sites [Confirmed].
  - **Authentication**: Calls `OSKFirebaseAuthService` methods (including `signInWithCustomToken`, `signOut`, `signUpWithEmailAndPassword`, and `resetPassword`) to drive authentication flows [Confirmed].
  - **Backend API**: Calls `OSKFirebaseHttpsService.call` across 102 distinct feature call sites to execute Firebase Cloud Functions [Confirmed].
  - **Translation**: Calls `OSKTranslateService.instant` (168 call sites) and `OSKTranslateService.getTranslations` (4 call sites) to localize feature templates and components [Confirmed].

### 11. Permissions & Security

**Cross-cutting risk callouts:**

The `core` module defines and enforces the application's primary security boundaries, gating access based on authentication status and assigned roles [Confirmed]:

- **Authentication Gating**: `OSKLoggedInGuard` protects routes by reactively monitoring the `currentUser` signal from `OSKCurrentUserToken`. It updates a local `authStatus` stream inside an Angular `effect` to redirect unauthenticated users [Confirmed].
- **Global Administrative Access**: The `adminGuard` enforces global admin access by checking the candidate permission string `v1.admin` against the user's selected account roles (`currentUser().selectedAccount?.roles`) [Confirmed].
- **Organization-Level Access**: `OSKUserRoleGuard` dynamically secures organization routes. If the target URL path starts with `'/organization'`, the guard automatically appends the candidate permission string `v1.org.admin` to the list of required roles to authorize access [Confirmed].
- **Data-Driven Role Mapping**: `OSKCurrentUserToken` subscribes to Firestore organization documents to read user roles (`organization.userRoles`) and map them directly to the active `OSKUserAccount` roles [Confirmed].
- **Developer Bypass**: A hardcoded security bypass exists in `OSKCurrentUserToken`, which checks the authenticated user's email against a list of developer emails (`emailsToShowSendInvitationsTo`) to inject a privileged "Send invitation" menu item [Confirmed].
- **Infrastructure Security**: `firebase.provider.ts` configures Firebase App Check using ReCaptcha Enterprise to protect backend endpoints, supporting a debug token bypass via environment variables [Confirmed].

*Note: All permission checks are implemented as role-membership tests (e.g., `.roles.includes(...)`). No external RBAC-roles master document is currently available in this repository to validate these permission strings against a centralized schema [Confirmed].*

**Per-capability evidence:**

#### _module_root

No guards or permission strings are directly evidenced in this capability pack.

#### error-handler

No guards or permission checks are defined or referenced within this capability [Confirmed].

#### firebase

While this capability does not define any Angular Guards, it implements several critical security mechanisms:
- **App Check & ReCaptcha Enterprise**: Configures Firebase App Check with ReCaptcha Enterprise to protect backend resources from abuse. It also supports a debug token (`self.FIREBASE_APPCHECK_DEBUG_TOKEN`) configured via environment variables. (Confirmed)
  - **Evidence**: `` `call_expression|core|hosting/web-app/src/app/core/firebase/providers/firebase.provider.ts|provideAppCheck|anon|() => {       const app = getApp();       app.automaticDataCollectionEnabled = false;       self.FIREBASE_APPCHECK_DEBUG_TOKEN = environment.reCaptcha.token || false;       const appCheck = initializeAppCheck(app, {         provider: new ReCaptchaEnterpriseProvider(environment.reCaptcha.siteCode),         isTokenAutoRefreshEnabled: environment.reCaptcha.token === undefined       });       return appCheck;     }|#1` ``
- **Account Creation Restrictions**: Restricts account creation based on email domains for specific Firebase project IDs. (Confirmed)
  - **Evidence**: `hosting/web-app/src/app/core/firebase/constants/account-create-restrictions.constant.ts` (lines 47-52)

---

#### guards

The guards enforce security boundaries using specific permission strings:

- **`v1.admin`**: Checked by `adminGuard` against the user's selected account roles (`currentUser().selectedAccount?.roles`) to authorize global administrative access. [Confirmed, `` `permission_candidate|core|hosting/web-app/src/app/core/guards/admin.guard.ts|v1.admin|#1` ``]
- **`v1.org.admin`**: Automatically appended to the list of required roles by `OSKUserRoleGuard` if the target URL starts with `'/organization'`. [Confirmed, `` `permission_candidate|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|v1.org.admin|#1` ``]

No external RBAC-roles document is currently available to validate these permission strings against a master schema. [Confirmed]

---

#### injection-tokens

- **Role Mapping**: The capability reads user roles (`organization.userRoles`) from the Firestore organization documents to construct accounts `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|collectionData(userOrganizationsDocRef)                     .pipe(takeUntil(unsubscribeSubject))                     .subscribe|anon|...|#1` ``.
- **Developer Bypass**: Hardcoded email checks are performed against `emailsToShowSendInvitationsTo` to inject the developer-only "Send invitation" menu item `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|emailsToShowSendInvitationsTo.includes|anon|user.email|#1` ``.
- **Verification Check**: Computes `isOskVerified` based on whether the user is not anonymous, has a verified email, and has configured their first and last names `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|computed|anon|() => { ... }|#1` ``.

---

#### locale

No guards or permission checks are evidenced in this capability. [Confirmed]

---

#### title-strategy

No guards, roles, or permission checks are defined or referenced within this capability. [Confirmed]

#### translate

No guards or permission checks are defined or referenced within this capability [Confirmed].

---

#### types

This capability does not implement any guards or direct permission checks. [Confirmed] (no `angular_guard` facts are present).

However, it defines types related to user roles and assignments:
- `OSKAssignedRole`: Models roles assigned to users, containing `roleId`, `assignedOn`, and `assignedBy` `` `type_alias|core|hosting/web-app/src/app/core/types/user/roles/assigned-role.type.ts|OSKAssignedRole|#1` ``.
- `OSKUserOrganization`: Models user roles within an organization via the `userRoles` property `` `model_property|core|hosting/web-app/src/app/core/types/user/user-organization.type.ts|OSKUserOrganization|userRoles|#1` ``.
- `OSKUserAccount`: Models roles associated with a user account via the `roles` property `` `model_property|core|hosting/web-app/src/app/core/types/user/user.type.ts|OSKUserAccount|roles|#1` ``.

---

#### utils

No guards, roles, or permission checks are implemented in this capability. [Confirmed]

### 12. External Hooks

#### _module_root

No external SDKs, Firebase SDK hooks, or translation libraries are directly evidenced in this capability pack.

#### error-handler

- **Angular Material SDK**: Injects and utilizes `MatSnackBar` from `@angular/material/snack-bar` to display notifications [Confirmed] `` `imports_dependency|core|hosting/web-app/src/app/core/error-handler/error.service.ts|@angular/material/snack-bar|#1` ``.
- **Environment Config**: Imports `@env/environment` within the global error handler, likely to toggle logging or error behavior based on production status [Inferred] `` `imports_dependency|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|@env/environment|#1` ``.

#### firebase

This capability integrates heavily with external SDKs and libraries:
- **`@angular/fire`**: Used to initialize and interact with Firebase services (App, App Check, Auth, Firestore, Functions, Storage). (Confirmed)
  - **Evidence**: `hosting/web-app/src/app/core/firebase/providers/firebase.provider.ts` (lines 15-23)
- **`ngx-cookie-service`**: Used in `OSKFirebaseAuthService` to store, retrieve, and delete the `'emailForSignIn'` cookie during the email link sign-in flow. (Confirmed)
  - **Evidence**: `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|ngx-cookie-service|#1` ``
- **`rxjs`**: Used for reactive stream utilities (`firstValueFrom`, `of`). (Confirmed)
  - **Evidence**: `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|rxjs|#1` ``

---

#### guards

The capability integrates with the following external libraries and frameworks:

- **Angular Core (`@angular/core`)**: Uses `inject` for dependency injection and `effect` for reactive signal tracking. [Confirmed, `` `imports_dependency|core|hosting/web-app/src/app/core/guards/admin.guard.ts|@angular/core|#1` ``]
- **Angular Router (`@angular/router`)**: Uses `Router` and `router.parseUrl` to handle redirection and route parsing. [Confirmed, `` `imports_dependency|core|hosting/web-app/src/app/core/guards/admin.guard.ts|@angular/router|#1` ``]
- **RxJS (`rxjs`)**: Uses operators such as `skipWhile`, `take`, `map`, and `finalize` to manage the asynchronous authentication state stream in `OSKLoggedInGuard`. [Confirmed, `` `imports_dependency|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|rxjs|#1` ``]

---

#### injection-tokens

This capability integrates heavily with external libraries:
- **Angular Fire (Firebase SDK)**:
  - `@angular/fire/auth`: Uses `Auth` and `user` to stream authentication state `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|user|anon|auth|#1` ``.
  - `@angular/fire/firestore`: Uses `Firestore`, `doc`, `collection`, `onSnapshot`, and `collectionData` to stream database updates `` `hosting/web-app/src/app/core/injection-tokens/current-user.token.ts` (lines 30-33) ``.
- **RxJS**: Uses `pipe`, `takeUntil`, `filter`, and `map` to manipulate streams `` `hosting/web-app/src/app/core/injection-tokens/current-user.token.ts` (line 24) ``.

---

#### locale

- **@ngx-translate/core**: The capability hooks into `TranslateService` to synchronize the active translation language with the active locale state. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/locale/providers/locale-initializer/locale-initializer.provider.ts|translate.use|localeInitializerFactory|localeService.locale()|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|this.translate.use|setLocale|localeId|#1` ``)
- **Angular Common Locales**: Dynamically registers French locale data (`@angular/common/locales/fr`) via Angular's `registerLocaleData`. [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@angular/common/locales/fr|#1` ``)

---

#### title-strategy

- **Angular Platform Browser SDK**: Injects and utilizes the `Title` and `Meta` services to directly manipulate the document's head elements. [Confirmed] (evidenced by `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|inject|anon|Title|#1` `` and `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|inject|anon|Meta|#1` ``).

#### translate

This capability integrates with the following external libraries and SDKs:

- **`@ngx-translate/core`**:
  - Injects `TranslateService` into `OSKTranslateService` `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|inject|anon|TranslateService|#1` ``.
  - Invokes `this.ngxTranslate.instant` `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|this.ngxTranslate.instant|instant|key,params|#1` `` and `this.ngxTranslate.stream` `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|this.ngxTranslate.stream|stream|key,params|#1` ``.
  - Configures `TranslateModule.forRoot` with a custom loader and default language in `translateAndHttp.provider.ts` `` `call_expression|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|TranslateModule.forRoot|anon|{     loader: {       provide: TranslateLoader,       useFactory: createTranslateLoader,       deps: [HttpClient]     },     defaultLanguage: environment.defaultLocale   }|#1` ``.
- **`@ngx-translate/http-loader`**:
  - Used to instantiate the translation loader factory `createTranslateLoader` `` `function_declaration|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|createTranslateLoader|#1` ``.
- **`@angular/common/http`**:
  - Imports `HttpClientModule` and injects `HttpClient` to fetch translation assets `` `call_expression|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|importProvidersFrom|anon|HttpClientModule,TranslateModule.forRoot({     loader: {       provide: TranslateLoader,       useFactory: createTranslateLoader,       deps: [HttpClient]     },     defaultLanguage: environment.defaultLocale   })|#1` ``.

---

#### types

- **Firebase Auth SDK**: Integrates with `@angular/fire/auth` to type-bind the Firebase User object within `OSKCurrentUser` (via `firebaseUser` property) and `OSKUser` `` `imports_dependency|core|hosting/web-app/src/app/core/types/user/current-user.type.ts|@angular/fire/auth|#1` ``, `` `model_property|core|hosting/web-app/src/app/core/types/user/current-user.type.ts|OSKCurrentUser|firebaseUser|#1` ``.
- **Firebase Firestore SDK**: Integrates with `@angular/fire/firestore` in `building-door.type.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/types/building/building-door.type.ts|@angular/fire/firestore|#1` ``.

---

#### utils

This capability relies solely on standard ECMAScript built-in objects and prototype methods:
- `Date.prototype.getTimezoneOffset` [Confirmed; `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|date.getTimezoneOffset|removeTimezoneOffset||#1` ``]
- `Date.prototype.valueOf` [Confirmed; `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|date.valueOf|removeTimezoneOffset||#1` ``]
- `Date.prototype.toISOString` [Confirmed; `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|new Date(date.valueOf() - tzoffset).toISOString|getISOStringWithoutTimezoneIndicator||#1` ``]
- `String.prototype.slice` [Confirmed; `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|new Date(date.valueOf() - tzoffset).toISOString().slice|getISOStringWithoutTimezoneIndicator|0,-1|#1` ``]
- `String.prototype.replace` [Confirmed; `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|isoString.replace|removeTimezoneIndicatorFromIsoString|'Z',''|#1` ``]

No external SDKs or third-party libraries are used. [Confirmed]

### 13. Architectural Observations

- **Dependency Inversion Violation**: The outbound dependency from `core` to `features` (specifically `sidemenu` types and utilities) represents a significant architectural leak [Confirmed]. Core infrastructure modules should remain entirely independent of feature-specific UI layouts and menus.
- **Elegant Reactive Localization**: The integration between `OSKLocaleService` and `OSKTranslateService` leveraging Angular Signals is highly clean [Confirmed]. By returning computed signals that track the active locale, the translation service eliminates the need for manual RxJS subscription management or template-level async pipes for language switching.
- **Convention-Over-Configuration Guarding**: `OSKUserRoleGuard` exhibits a pragmatic convention-based approach by automatically appending `v1.org.admin` requirements based on URL path matching (`'/organization'`) [Confirmed]. This reduces boilerplate in route configurations but tightly couples security rules to URL structures.
- **Centralized Backend Abstraction**: The encapsulation of Firebase Auth and HTTPS callable functions within `core` provides a highly consistent API for features [Confirmed]. With over 100 call sites utilizing `OSKFirebaseHttpsService.call`, features are completely insulated from direct Firebase SDK dependencies.

### 14. Risks & Open Questions

**Cross-cutting risks:**

- **Circular and Inverted Dependency Risk**: The dependency of `core` on `features/portals/sidemenu` creates a tight coupling loop [Confirmed]. If the `features` module is refactored, split, or lazy-loaded, it could easily break the compilation or initialization of the foundational `core` module.
- **Hardcoded Developer Bypass**: The developer bypass in `OSKCurrentUserToken` relies on a hardcoded array of emails (`emailsToShowSendInvitationsTo`) [Inferred]. The source, governance, and security of this list are unknown, posing a risk of unauthorized privilege escalation if production emails are accidentally included or if the list is compromised.
- **Unvalidated Permission Strings**: Permission strings like `v1.admin` and `v1.org.admin` are hardcoded in guards and evaluated as plain strings [Inferred]. Without a centralized RBAC schema or backend-synchronized contract, there is a risk of silent authorization failures or security bypasses if role names drift between the frontend, Firestore documents, and Cloud Functions.
- **Disabled Admin Portal Logic**: Commented-out code blocks in `OSKCurrentUserToken` regarding `isOskeyAdmin` and `generateOskeyAdminDefaultMenu` suggest that administrative portal access flows are partially implemented or deferred [Inferred]. This represents dead code that could introduce security gaps if partially exposed or improperly initialized.
- **Lifecycle of the Logged-In Guard Watcher**: In `OSKLoggedInGuard`, the instantiation and exact behavior of the `watcher` object (which is destroyed in the `finalize` block) remain unknown from the local evidence [Inferred].

**Per-capability open questions:**

#### _module_root

- **Implementation Details**: The actual implementation, dependencies, and external integrations of the exported symbols (such as `error.service` and `global-error.handler`) are not visible in this capability pack, as they reside in separate submodules of the `core` module.

#### error-handler

- Does `OSKGlobalErrorHandler` implement Angular's native `ErrorHandler` interface? (It is highly inferred given its name and dependencies, but the exact `implements` clause is not explicitly detailed in the compact class facts).
- How is `OSKGlobalErrorHandler` registered in the application's bootstrap configuration (e.g., is it provided via `{ provide: ErrorHandler, useClass: OSKGlobalErrorHandler }` in `app.config.ts` or a core module)?

#### firebase

- How is the `OSKCurrentUserToken` populated, and does it reactively update when `OSKFirebaseAuthService` authentication state changes?
- Are there specific Firebase Cloud Functions that are expected to be called by the application, and where are their request/response schemas defined?

#### guards

- **`watcher` Lifecycle**: In `OSKLoggedInGuard`, what is the `watcher` object (which has `watcher.destroy()` called in the `finalize` block), and how is it instantiated? [Inferred, `` `call_expression|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|watcher.destroy|anon||#1` ``]
- **Role Source**: How are the route-specific roles passed into `OSKUserRoleGuard`? The evidence shows `rolesToCheck` being manipulated, but not how the initial set of roles is extracted from the route configuration. [Inferred, `` `hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts` (line 43) ``]
- **Account Path Matching**: In `OSKUserRoleGuard`, `accounts.find((a) => state.url.startsWith(a.path))` is used. Where does the `accounts` array originate, and how is it populated? [Inferred, `` `call_expression|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|accounts.find|anon|(a) => state.url.startsWith(a.path)|#1` ``]

#### injection-tokens

- **Injection Token Declaration**: The actual `InjectionToken` instantiation is not explicitly captured in the facts, although the file name `current-user.token.ts` and its usage strongly imply its existence. (Inferred)
- **Developer Email List**: The source and contents of the `emailsToShowSendInvitationsTo` array are not defined within the provided evidence. (Unknown)
- **Disabled Admin Portal Logic**: Commented-out code blocks in the Firestore subscription handler suggest that an Admin portal account creation flow (`isOskeyAdmin`, `generateOskeyAdminDefaultMenu`) was either disabled or is planned for future implementation `` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|collectionData(userOrganizationsDocRef)                     .pipe(takeUntil(unsubscribeSubject))                     .subscribe|anon|...|#1` ``. (Inferred)

#### locale

- Are there other locales besides French (`fr`) that need to be registered dynamically, or is French the only non-default locale supported?
- How is `OSKLocaleId` registered in the application's bootstrap providers (e.g., is it bound to `LOCALE_ID`)? The evidence shows the class definition but not the provider array registration.

#### title-strategy

- **Base Class Specification**: The `OSKTitleStrategy` class calls `super()` (line 31) and `this.buildTitle()` (line 40), indicating it extends a base class (presumably `@angular/router`'s `TitleStrategy`), but the exact parent class is not explicitly declared in the `source_class` metadata. [Inferred]
- **Default Description Source**: The service references `this.defaultDescription` (line 78) when a route-specific description is missing, but the initialization and source of this default value are not visible in the provided evidence. [Unknown]
- **Registration Mechanism**: It is unclear from the local evidence how `OSKTitleStrategy` is registered in the application's bootstrap configuration (e.g., whether it overrides the default `TitleStrategy` provider globally). [Unknown]

#### translate

- **Translation Asset Storage**: Where are the translation JSON files stored, and what is the exact path configuration used by `createTranslateLoader`? The exact implementation details of `createTranslateLoader` are not fully detailed in the provided facts `` `function_declaration|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|createTranslateLoader|#1` ``.
- **Default Locale Configuration**: What is the fallback value of `environment.defaultLocale` referenced during provider setup `` `call_expression|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|TranslateModule.forRoot|anon|{     loader: {       provide: TranslateLoader,       useFactory: createTranslateLoader,       deps: [HttpClient]     },     defaultLanguage: environment.defaultLocale   }|#1` ``?

#### types

- Why does `user.type.ts` import from `src/app/features/portals/sidemenu/types/side-menus.type`? This introduces an outbound dependency from the `core` module to the `features` module, which is an architectural inversion (core depending on features). [Inferred]
- What specific Firestore types are imported in `building-door.type.ts`? The exact symbols imported from `@angular/fire/firestore` are not detailed in the evidence. [Unknown]

#### utils

There are no open questions or missing pieces of evidence for this capability. [Confirmed]

### 15. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, and 12) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.