### 0. Generation Metadata

- runId: 20260828_150039-8345d222
- generatedAt: 2026-08-29T06:43:27.292Z
- repoName: angular-app-oskey-io
- targetModule: core
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash

### 1. Executive Summary

The `core` module serves as the foundational infrastructure layer for the entire application, providing centralized services, utilities, and state management that power all other features [Confirmed]. It encapsulates critical system-wide capabilities, including Firebase initialization and authentication, global error handling, dynamic localization and translation, route-level security guards, and browser document title strategy [Confirmed]. Most notably, it manages the unified, reactive session state of the currently authenticated user, combining authentication streams, Firestore profiles, and active routing into a single computed context [Confirmed].

### 2. Architectural Position

The `core` module sits at the lowest level of the application's dependency hierarchy, acting as the primary engine consumed by both the `components` and `features` modules [Confirmed]. It owns the application's global cross-cutting concerns, such as user session state, localization state, global error interception, and route-level security [Confirmed]. While it is designed to be a downstream dependency, evidence reveals a critical architectural inversion where `core` imports types and constants from the `features` module, creating an upward coupling that violates strict layer isolation [Confirmed].

### 3. Primary Responsibilities

#### _module_root

- **Global Error Handling**: Exposing global error handling services and handlers to intercept and process application errors [Confirmed] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/error.service|#1` ``, `` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/global-error.handler|#1` ``).
- **User Context Injection**: Providing injection tokens for managing and accessing the current user context [Confirmed] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./injection-tokens/current-user.token|#1` ``).
- **Common Type Definitions**: Exposing shared HTTP response types used across the application [Confirmed] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./types/https-response/https-response.type|#1` ``).

---

#### error-handler

- **Global Error Interception**: Intercepts unhandled application errors globally using `OSKGlobalErrorHandler` [Confirmed; `hosting/web-app/src/app/core/error-handler/global-error.handler.ts` (line 18)].
- **User Error Notification**: Displays user-friendly error messages using Angular Material's snackbar component via `OSKErrorService.showError` [Confirmed; `service_method|core|hosting/web-app/src/app/core/error-handler/error.service.ts|OSKErrorService|showError|#1`].
- **Error Message Translation**: Translates error messages dynamically using `OSKTranslateService` before displaying them to the user [Confirmed; `call_expression|core|hosting/web-app/src/app/core/error-handler/error.service.ts|this.translate.instant|showError|msgTranslationKey|#1`].

---

#### firebase

- **Firebase Initialization & Configuration**: Sets up and configures the Firebase App, App Check (with ReCaptcha Enterprise), Auth, Firestore, Functions, and Storage, including support for local emulators. **Confirmed** (evidenced by `hosting/web-app/src/app/core/firebase/providers/firebase.provider.ts` (lines 34-90)).
- **Authentication Management**: Handles user sign-in (email/password, custom token, email link), sign-up, sign-out, password resets, and profile updates. **Confirmed** (evidenced by `` `angular_injectable|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService` ``).
- **HTTPS Callable Functions Wrapper**: Provides a generic service to invoke Firebase Cloud Functions with standardized success response wrappers. **Confirmed** (evidenced by `` `angular_injectable|core|hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts|OSKFirebaseHttpsService` ``).
- **Account Creation Restrictions**: Restricts account creation based on email domains for specific restricted project IDs. **Confirmed** (evidenced by `hosting/web-app/src/app/core/firebase/constants/account-create-restrictions.constant.ts` (lines 47-52)).

#### guards

### Authentication Guarding
- **OSKLoggedInGuard** `` `angular_guard|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|OSKLoggedInGuard` `` ensures that a user is fully authenticated and verified before accessing protected routes [Confirmed].
- It monitors the current user state using an Angular effect `` `call_expression|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|effect|anon|() => {     authStatus.next(currentUser());   }|#1` `` and checks that `firebaseUser`, `isOskVerified`, and `oskUser` are all present and valid `` `call_expression|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|map|anon|(user) => {       return user.firebaseUser && user.isOskVerified && user.oskUser ? true : router.parseUrl('/');     }|#1` ``. If not, it redirects the user to the root path `/` `` `call_expression|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|router.parseUrl|anon|'/'|#1` ``.

### Global Administrator Guarding
- **adminGuard** `` `angular_guard|core|hosting/web-app/src/app/core/guards/admin.guard.ts|adminGuard` `` restricts route access to global system administrators [Confirmed].
- It resolves the current user via `OSKCurrentUserToken` `` `call_expression|core|hosting/web-app/src/app/core/guards/admin.guard.ts|inject|anon|OSKCurrentUserToken|#1` `` and checks if the selected account contains the `v1.admin` role `` `call_expression|core|hosting/web-app/src/app/core/guards/admin.guard.ts|currentUser().selectedAccount?.roles.includes|anon|'v1.admin'|#1` ``. If unauthorized, it redirects the user to their designated account router link `` `call_expression|core|hosting/web-app/src/app/core/guards/admin.guard.ts|router.parseUrl|anon|`${currentUser().selectedAccount?.routerLink}`|#1` ``.

### Fine-Grained User Role Guarding
- **OSKUserRoleGuard** `` `angular_guard|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|OSKUserRoleGuard` `` provides dynamic, route-specific role verification [Confirmed].
- It extracts the required roles for a route and checks them against the user's selected account roles `` `call_expression|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|rolesToCheck.some|anon|(r) => selectedAccount?.roles.includes(r)|#1` ``.
- For routes starting with `/organization` `` `call_expression|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|state.url.startsWith|anon|'/organization'|#1` ``, it automatically prepends the `v1.org.admin` role to the allowed roles list `` `call_expression|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|rolesToCheck.unshift|anon|'v1.org.admin'|#1` ``.

---

#### injection-tokens

- **Firebase Authentication State Tracking**: Converts the Firebase Auth user stream into an Angular Signal to track the logged-in user's basic credentials. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|toSignal|anon|user(auth).pipe(map((u) => createOSKFirebaseUser(u)))|#1` ``)
- **Firestore User Profile Synchronization**: Listens to real-time updates on the user's Firestore document (`users/{uid}`) to fetch and maintain extended profile information. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|onSnapshot|anon|docRef,(snapshot) => { ... }|#1` ``)
- **Organization Account Construction**: Queries the user's organizations subcollection (`users/{uid}/organizations`) to dynamically build portal accounts and menus based on their assigned roles. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|collectionData|anon|userOrganizationsDocRef|#1` ``)
- **Active Account Resolution**: Monitors router navigation events to determine and update the currently active user account context based on the current URL path. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|toSignal|anon|router.events.pipe(filter((e) => e instanceof NavigationEnd),map((e) => <NavigationEnd>e))|#1` ``)
- **Developer Feature Injection**: Conditionally prepends a "Send invitation" menu item to the user's side menu if their email matches a predefined developer list. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|emailsToShowSendInvitationsTo.includes|anon|user.email|#1` ``)

---

#### locale

#### Locale Initialization
- Coordinates application startup localization using a factory provider `localeInitializerFactory` that initializes `OSKLocaleService` and sets the active translation language via `@ngx-translate`. [Confirmed] (Cite: `` `function_declaration|core|hosting/web-app/src/app/core/locale/providers/locale-initializer/locale-initializer.provider.ts|localeInitializerFactory|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/locale/providers/locale-initializer/locale-initializer.provider.ts|localeService.initialize|localeInitializerFactory||#1` ``)

#### Dynamic Locale Management
- Exposes methods to dynamically update the active locale, verify if a locale is already registered, and switch the translation language. [Confirmed] (Cite: `` `service_method|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|setLocale|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|this.registeredLocales.includes|setLocale|localeId|#1` ``)

#### Locale Data Registration
- Dynamically registers Angular locale data (such as French locale data `localeFr`) when switching to a new locale. [Confirmed] (Cite: `` `service_method|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|registerLocale|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|registerLocaleData|registerLocale|localeFr|#1` ``)

#### Dynamic Locale ID Provider
- Implements a custom `OSKLocaleId` class that dynamically resolves to the current locale string managed by `OSKLocaleService`. [Confirmed] (Cite: `` `source_class|core|hosting/web-app/src/app/core/locale/providers/localeId/localeId.provider.ts|OSKLocaleId` ``, `` `call_expression|core|hosting/web-app/src/app/core/locale/providers/localeId/localeId.provider.ts|this.localeService.locale|toString||#1` ``)

---

#### title-strategy

- **Dynamic Document Title Management**: Intercepts routing changes to build and set the document title [Confirmed] (`` `class_method|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy|updateTitle|#1` ``). It constructs the title using the active route snapshot [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.buildTitle|updateTitle|snapshot|#1` ``) and updates both the browser title [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.title.setTitle|setTitle|newTitle|#1` ``) and the meta title tag [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setTitle|{       name: 'title',       content: newTitle     }|#1` ``).
- **Meta Description Management**: Updates the HTML description meta tag dynamically based on route data, falling back to a default description if none is provided in the route [Confirmed] (`` `class_method|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy|setDescription|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setDescription|{         name: 'description',         content: data.description       }|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setDescription|{         name: 'description',         content: this.defaultDescription       }|#1` ``).
- **Smart App Banner Integration**: Configures the `apple-itunes-app` meta tag dynamically based on route data to promote iOS application downloads where applicable [Confirmed] (`` `class_method|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy|setAppleItunesTag|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setAppleItunesTag|{       name: 'apple-itunes-app',       content: appItuneAppContent     }|#1` ``).

#### translate

- **Translation Resolution**: Exposes synchronous (`instant`) and asynchronous (`stream`) translation lookups wrapping `@ngx-translate` `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|this.ngxTranslate.instant|instant|key,params|#1` ``. [Confirmed]
- **Reactive Translation Signals**: Exposes computed signals (`getTranslation`, `getTranslations`) that automatically re-evaluate when the active locale changes `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|computed|getTranslation|() => {       this.localeService.locale();       return this.instant(key, params);     }|#1` ``. [Confirmed]
- **Template Pipes**: Provides `oskTranslate` for template-based translations `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/translate.pipe.ts|Pipe|anon|{   name: 'oskTranslate' }|#1` `` and `oskBoolean` for translating boolean values to localized yes/no strings `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/boolean.pipe.ts|Pipe|anon|{   name: 'oskBoolean' }|#1` ``. [Confirmed]
- **Dependency Injection Configuration**: Configures the translation loader and module initialization via `translateAndHttp.provider.ts` `` `call_expression|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|TranslateModule.forRoot|anon|{     loader: {       provide: TranslateLoader,       useFactory: createTranslateLoader,       deps: [HttpClient]     },     defaultLanguage: environment.defaultLocale   }|#1` ``. [Confirmed]

---

#### types

- **features module (portals submodule)**: The core user type file imports a side-menu type from the portals feature area:
  - `src/app/features/portals/sidemenu/types/side-menus.type` is imported by `hosting/web-app/src/app/core/types/user/user.type.ts` (line 17) (`` `hosting/web-app/src/app/core/types/user/user.type.ts` (line 17) ``).

#### utils

- **Date Timezone Manipulation**: Provides functions to adjust dates by removing timezone offsets and formatting dates to ISO strings without timezone indicators. [Confirmed]
  - `removeTimezoneOffset`: Adjusts a date object to remove its local timezone offset, utilizing `date.getTimezoneOffset` and `date.valueOf` `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|date.getTimezoneOffset|removeTimezoneOffset||#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|date.valueOf|removeTimezoneOffset||#1` ``.
  - `getISOStringWithoutTimezoneIndicator`: Formats a date to an ISO string representation adjusted for timezone offset and sliced to omit the trailing timezone indicator `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|new Date(date.valueOf() - tzoffset).toISOString().slice|getISOStringWithoutTimezoneIndicator|0,-1|#1` ``.
  - `removeTimezoneIndicatorFromIsoString`: Replaces the 'Z' timezone indicator from an ISO string using `isoString.replace` `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|isoString.replace|removeTimezoneIndicatorFromIsoString|'Z',''|#1` ``.
- **Public Export Interface**: Exposes these date utilities through a central entry point file `hosting/web-app/src/app/core/utils/index.ts` `` `exported_symbol|core|hosting/web-app/src/app/core/utils/index.ts|./date.utils|#1` ``.

---

### 4. Public Interfaces (Components & Services)

#### _module_root

No components or services are directly defined in this capability pack. However, the root index file exports the following symbols from internal paths:
- **ErrorService**: Inferred to be an injectable service for error management [Inferred] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/error.service|#1` ``).
- **GlobalErrorHandler**: Inferred to be an Angular `ErrorHandler` implementation [Inferred] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/global-error.handler|#1` ``).
- **CurrentUserToken**: Inferred to be an Angular `InjectionToken` for retrieving current user information [Inferred] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./injection-tokens/current-user.token|#1` ``).

---

#### error-handler

- **OSKErrorService** (Injectable Service)
  - **File**: `hosting/web-app/src/app/core/error-handler/error.service.ts` [Confirmed; `angular_injectable|core|hosting/web-app/src/app/core/error-handler/error.service.ts|OSKErrorService`]
  - **Scope**: Provided in `'root'` [Confirmed; `call_expression|core|hosting/web-app/src/app/core/error-handler/error.service.ts|Injectable|anon|{   providedIn: 'root' }|#1`]
  - **Methods**:
    - `showError(msgTranslationKey?: string, msg?: string)`: Translates and displays the specified error message or falls back to a default error message (`'errors.default'`) [Confirmed; `service_method|core|hosting/web-app/src/app/core/error-handler/error.service.ts|OSKErrorService|showError|#1`, `call_expression|core|hosting/web-app/src/app/core/error-handler/error.service.ts|this.translate.instant|anon|'errors.default'|#1`].
- **OSKGlobalErrorHandler** (Class)
  - **File**: `hosting/web-app/src/app/core/error-handler/global-error.handler.ts` [Confirmed; `source_class|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|OSKGlobalErrorHandler`]
  - **Description**: Implements global error handling logic, injecting `OSKErrorService` and Angular's `NgZone` [Confirmed; `call_expression|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|inject|anon|OSKErrorService|#1`, `call_expression|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|inject|anon|NgZone|#1`].

---

#### firebase

### Services
- **`OSKFirebaseAuthService`** (Class: `OSKFirebaseAuthService`, File: `hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts`, Scope: `'root'`) - Manages Firebase Authentication and basic user/organization document operations. **Confirmed** (cited via `` `angular_injectable|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|OSKFirebaseAuthService` ``).
  - *Methods*:
    - `signOut()`: Signs out the current user.
    - `signInWithEmailAndPassword(email, password)`: Authenticates a user with email and password.
    - `signUpWithEmailAndPassword(email, password)`: Creates a new user with email and password.
    - `verifyPasswordResetCode(oobCode)`: Verifies a password reset code.
    - `sendPasswordResetEmail(email)`: Sends a password reset email.
    - `resetPassword(oobCode, password)`: Confirms a password reset.
    - `signInWithCustomToken(token)`: Authenticates a user with a custom token.
    - `signUpWithEmailLink(email, actionCodeSettings)`: Sends a sign-in link to the specified email.
    - `confirmSignIn(email)`: Confirms sign-in with an email link.
    - `setDoc(path, docDTO, ...pathSegments)`: Sets a document in Firestore.
    - `updateProfile(profileDTO)`: Updates the current user's profile.
    - `getUserByUid(uid)`: Retrieves a user document from Firestore by UID.
    - `generateOrganizationId()`: Generates a new unique organization ID using a Firestore document reference.
- **`OSKFirebaseHttpsService`** (Class: `OSKFirebaseHttpsService`, File: `hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts`, Scope: `'root'`) - Wrapper for calling Firebase HTTPS callable functions. **Confirmed** (cited via `` `angular_injectable|core|hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts|OSKFirebaseHttpsService` ``).
  - *Methods*:
    - `call<RequestDataType, ResponseDataType>(functionName, data)`: Invokes a Firebase HTTPS callable function.

### Components
- No components are defined in this capability. **Confirmed**

#### guards

This capability does not declare standard Angular components or injectable services. Instead, it exposes functional or class-based Angular route guards [Confirmed]:
- **adminGuard** `` `angular_guard|core|hosting/web-app/src/app/core/guards/admin.guard.ts|adminGuard` ``
- **OSKLoggedInGuard** `` `angular_guard|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|OSKLoggedInGuard` ``
- **OSKUserRoleGuard** `` `angular_guard|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|OSKUserRoleGuard` ``

---

#### injection-tokens

While this capability does not expose standard Angular components or `@Injectable` services, it exposes reactive state and helper utilities through its token file:

### Helper Functions
- **`createOSKFirebaseUser(u)`**: A mapping function declared to transform raw Firebase User objects into the application's internal representation. [Confirmed] (`` `function_declaration|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|createOSKFirebaseUser|#1` ``)

---

#### locale

#### Services
- **`OSKLocaleService`**
  - **Class Name**: `OSKLocaleService` (Cite: `` `angular_injectable|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService` ``)
  - **Scope**: Root-scoped (`providedIn: 'root'`) (Cite: `` `call_expression|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``)
  - **Key Methods**:
    - `initialize()`: Sets the initial locale state. (Cite: `` `service_method|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|initialize|#1` ``)
    - `setLocale(localeId: string)`: Updates the active locale and translation language. (Cite: `` `service_method|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|setLocale|#1` ``)
    - `registerLocale(localeId: string)`: Registers Angular locale data. (Cite: `` `service_method|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|registerLocale|#1` ``)

No components are exposed by this capability.

---

#### title-strategy

- **OSKTitleStrategy** (Service) [Confirmed] (`` `angular_injectable|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy` ``)
  - **Class**: `OSKTitleStrategy`
  - **File**: `hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts`
  - **Scope**: Declared as an `@Injectable` provider [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|Injectable|anon||#1` ``). It utilizes Angular's `inject` utility to resolve dependencies [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|inject|anon|Title|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|inject|anon|Meta|#1` ``).

#### translate

- **OSKTranslateService** (Injectable, `providedIn: 'root'`): The primary service for managing translations, exposing methods to retrieve translations synchronously, asynchronously, or reactively `` `angular_injectable|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|OSKTranslateService` ``.
- **OSKTranslate** (Pipe, selector: `oskTranslate`): A custom pipe that streams translations for a given key and parameter set `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/translate.pipe.ts|Pipe|anon|{   name: 'oskTranslate' }|#1` ``.
- **OSKBoolean** (Pipe, selector: `oskBoolean`): A custom pipe that translates boolean values to localized 'yes' or 'no' strings `` `call_expression|core|hosting/web-app/src/app/core/translate/pipes/boolean.pipe.ts|Pipe|anon|{   name: 'oskBoolean' }|#1` ``.

---

#### types

- **@oskey/core/types**: Self-referential path alias imports within inhabitant and organization types (`` `hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts` (line 1) ``, `` `hosting/web-app/src/app/core/types/organization/pending-organization.type.ts` (line 1) ``).

### Template-Composition Coupling
None.

---

#### utils

No Angular components or injectable services are declared in this capability. It consists entirely of pure TypeScript utility functions exported from `hosting/web-app/src/app/core/utils/date.utils.ts` `` `source_file|core|hosting/web-app/src/app/core/utils/date.utils.ts|hosting/web-app/src/app/core/utils/date.utils.ts` `` and re-exported via `hosting/web-app/src/app/core/utils/index.ts` `` `exported_symbol|core|hosting/web-app/src/app/core/utils/index.ts|./date.utils|#1` ``. [Confirmed]

---

### 5. UI Composition

#### _module_root

No UI components, templates, or bindings are defined in this capability pack [Confirmed] (based on the absence of component and template facts).

---

#### error-handler

This capability does not declare any Angular components or render direct templates. It operates entirely through services and programmatic UI triggers (Angular Material SnackBar) [Confirmed].

---

#### firebase

No components exist in this capability, and therefore no template composition or template bindings are present. **Confirmed**

#### guards

This capability contains only routing guards and does not define any UI components, templates, or visual bindings [Confirmed].

---

#### injection-tokens

No UI components or templates are defined within this capability. It is purely a logical and state-management capability.

---

#### locale

No components or templates are defined within this capability.

---

#### title-strategy

This capability does not contain any Angular components or templates [Confirmed] (`` `hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts` ``). It operates entirely as a programmatic service layer modifying the document head.

#### translate

No components are declared in this capability. It only provides pipes (`OSKTranslate`, `OSKBoolean`) and services to be composed in other modules' templates.

---

#### types

This capability does not contain any UI components, templates, or template bindings.

---

#### utils

This capability does not contain any UI components, templates, or HTML bindings. [Confirmed]

---

### 6. API Contracts & Routes

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

### 7. State Ownership

**Ownership conclusion:**

The `core` module exhibits a highly structured, unidirectional state flow across its capabilities, with no conflicting or ambiguous state ownership [Confirmed]. 
- **Session State**: The `injection-tokens` capability is the sole owner of the reactive user session state, managing the `OSKCurrentUserToken` [Confirmed]. This token aggregates read-only signals derived from Firebase Auth (`firebaseUser`), router events (`navigationSignal`), and a writable signal for the Firestore user profile (`oskUserSignal`) into a unified computed context [Confirmed].
- **Localization State**: The `locale` capability owns the active localization state via a private writable `_locale` signal and a public computed `locale` signal [Confirmed]. This state is reactively consumed by the `translate` capability's `OSKTranslateService` to produce dynamic, locale-aware translation signals [Confirmed].
- **Other Capabilities**: Capabilities such as `error-handler`, `guards`, `title-strategy`, and `utils` do not own local reactive state, instead acting as pure consumers of the state exposed by `injection-tokens` and `locale` [Confirmed].

**Per-capability evidence:**

#### _module_root

No local reactive state or Angular signals are defined in this capability pack [Confirmed].

---

#### error-handler

This capability does not declare or manage any local reactive state using Angular Signals [Confirmed].

---

#### firebase

- No `angular_signal` facts are present in this capability pack. Local state is managed via standard properties (e.g., `auth` and `firestore` instances). **Confirmed**

#### guards

This capability does not declare local reactive state or Angular Signals (`angular_signal` facts) [Confirmed]. It consumes reactive state from external tokens, such as `OSKCurrentUserToken` `` `call_expression|core|hosting/web-app/src/app/core/guards/admin.guard.ts|inject|anon|OSKCurrentUserToken|#1` ``.

---

#### injection-tokens

This capability owns and manages several reactive Angular Signals:
- **`firebaseUser`**: A read-only signal derived from the Firebase Auth user stream. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|toSignal|anon|user(auth).pipe(map((u) => createOSKFirebaseUser(u)))|#1` ``)
- **`navigationSignal`**: A read-only signal tracking the latest `NavigationEnd` router event. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|toSignal|anon|router.events.pipe( ... )|#1` ``)
- **`oskUserSignal`**: A writable signal holding the synchronized `OSKUser` profile and its associated accounts. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|signal|anon|undefined|#1` ``)
- **Computed State**: A `computed` signal that aggregates the above signals to expose a unified session context: [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|computed|anon|() => { ... }|#1` ``)
  - `firebaseUser`: The current Firebase Auth user.
  - `oskUser`: The synchronized Firestore user profile.
  - `isOskVerified`: A boolean indicating if the user is verified (has a verified email and has set their first and last names).
  - `selectedAccount`: The active `OSKUserAccount` matching the current route.

---

#### locale

The capability manages reactive in-memory state using Angular Signals:
- **`_locale`**: A private writeable signal holding the current active locale string, initialized with the default locale from the environment configuration. [Confirmed] (Cite: `` `angular_signal|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|_locale` ``, `` `call_expression|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|signal|anon|environment.defaultLocale|#1` ``)
- **`locale`**: A public computed signal exposing the read-only value of the active locale. [Confirmed] (Cite: `` `angular_signal|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|OSKLocaleService|locale` ``, `` `call_expression|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|computed|anon|() => this._locale()|#1` ``)

---

#### title-strategy

This capability does not manage or expose any local reactive state via Angular Signals [Confirmed].

#### translate

While this capability does not declare standard `angular_signal` properties directly, `OSKTranslateService` exposes reactive state via `computed` signals:
- `getTranslation(key, params)`: Returns a `computed` signal that tracks `this.localeService.locale()` and returns the translated string `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|computed|getTranslation|() => {       this.localeService.locale();       return this.instant(key, params);     }|#1` ``. [Confirmed]
- `getTranslations(translationPairs)`: Returns a `computed` signal that tracks `this.localeService.locale()` and returns a dictionary of translated strings `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|computed|getTranslations|() => {       this.localeService.locale();       const translations: OSKTranslations = {};       for (const key in translationPairs) {         if (typeof translationPairs[key] === 'string') {           translations[key] = this.instant(translationPairs[key] as string);         } else {           translations[key] = this.instant(             (<OSKTranslationKeyWithParams>translationPairs[key]).key,             (<OSKTranslationKeyWithParams>translationPairs[key]).params           );         }       }       return translations;     }|#1` ``. [Confirmed]

---

#### types

This capability does not manage or expose any reactive state (such as Angular Signals). It only defines static TypeScript types and data structures.

---

#### utils

This capability does not own or expose any local reactive state (such as Angular Signals). [Confirmed]

---

### 8. Outbound Coupling

#### _module_root

This capability couples internally to other submodules within the `core` module to re-export their symbols:
- **Import-based Coupling**:
  - Couples to `./error-handler/error.service` [Confirmed] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/error.service|#1` ``).
  - Couples to `./error-handler/global-error.handler` [Confirmed] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./error-handler/global-error.handler|#1` ``).
  - Couples to `./injection-tokens/current-user.token` [Confirmed] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./injection-tokens/current-user.token|#1` ``).
  - Couples to `./types/https-response/https-response.type` [Confirmed] (`` `exported_symbol|core|hosting/web-app/src/app/core/index.ts|./types/https-response/https-response.type|#1` ``).

---

#### error-handler

#### Import-Based Coupling
- **`core/translate`**: `OSKErrorService` imports `@oskey/translate` to resolve and inject `OSKTranslateService` [Confirmed; `imports_dependency|core|hosting/web-app/src/app/core/error-handler/error.service.ts|@oskey/translate|#1`].
- **`error-handler` (Self-coupling)**: `OSKGlobalErrorHandler` imports `./error.service` to inject `OSKErrorService` [Confirmed; `imports_dependency|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|./error.service|#1`].

#### Template-Composition Coupling
- None [Confirmed].

---

#### firebase

### Import-Based Coupling
- **`core/types`**: Couples to user types via imports of `../../../types/user/user.type` and `@oskey/core/types` in `OSKFirebaseAuthService`. **Confirmed** (cited via `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|../../../types/user/user.type|#1` `` and `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|@oskey/core/types|#1` ``).
- **`core/injection-tokens`**: Couples to the current user token via import of `src/app/core/injection-tokens/current-user.token` in `OSKFirebaseAuthService`. **Confirmed** (cited via `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|src/app/core/injection-tokens/current-user.token|#1` ``).
- **`core` (Module Root)**: Couples to the core module root via import of `@oskey/core` in `OSKFirebaseHttpsService`. **Confirmed** (cited via `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/https/firebase-https.service.ts|@oskey/core|#1` ``).

### Template-Composition Coupling
- No template-composition coupling exists. **Confirmed**

#### guards

### Import-Based Coupling
The guards depend on other submodules within the `core` module for user context and type definitions [Confirmed]:
- **core/injection-tokens**:
  - Imports `../injection-tokens/current-user.token` in `admin.guard.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/guards/admin.guard.ts|../injection-tokens/current-user.token|#1` `` and `user-role.guard.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|../../injection-tokens/current-user.token|#1` `` to inject `OSKCurrentUserToken`.
- **core/types**:
  - Imports `../types` in `admin.guard.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/guards/admin.guard.ts|../types|#1` ``.
  - Imports `@oskey/core/types` in `logged-in.guard.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|@oskey/core/types|#1` ``.
  - Imports `../../types/user/current-user.type` `` `imports_dependency|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|../../types/user/current-user.type|#1` `` and `../../types/user/user.type` `` `imports_dependency|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|../../types/user/user.type|#1` `` in `user-role.guard.ts`.
- **core (root)**:
  - Imports `@oskey/core` in `logged-in.guard.ts` `` `imports_dependency|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|@oskey/core|#1` ``.

### Template-Composition Coupling
None [Confirmed].

---

#### injection-tokens

### Import-Based Coupling
This capability imports types and utilities from other submodules and modules:
- **`core/types`**:
  - `../types/user/current-user.type` `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|../types/user/current-user.type|#1` ``
  - `../types/user/user-organization.type` `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|../types/user/user-organization.type|#1` ``
  - `../types/user/user.type` `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|../types/user/user.type|#1` ``
- **`features/portals`**:
  - `src/app/features/portals/sidemenu/constants/user-menu.constant` (for `OSKUserDefaultSidemenu`) `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|src/app/features/portals/sidemenu/constants/user-menu.constant|#1` ``
  - `src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util` (for `generateUserOrganizationDefaultMenu`) `` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|src/app/features/portals/sidemenu/utils/generate-user-organization-default-menu.util|#1` ``

### Template-Composition Coupling
None. This capability does not contain any UI templates.

---

#### locale

#### Import-Based Coupling
- **`@env/environment`**: Used to retrieve the default locale configuration. (Cite: `` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@env/environment|#1` ``)
- **`@ngx-translate/core`**: Used to synchronize the active translation language with the locale state. (Cite: `` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@ngx-translate/core|#1` ``)
- **`@angular/common` & `@angular/common/locales/fr`**: Used to register Angular's localized formatting data. (Cite: `` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@angular/common|#1` ``, `` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@angular/common/locales/fr|#1` ``)

#### Template-Composition Coupling
None.

---

#### title-strategy

### Import-Based Coupling
The `OSKTitleStrategy` service depends on the following external packages and internal aliases:
- **@angular/core**: For dependency injection and lifecycle utilities [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|@angular/core|#1` ``).
- **@angular/platform-browser**: For DOM-level `Title` and `Meta` services [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|@angular/platform-browser|#1` ``).
- **@angular/router**: For routing context and base strategy classes [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|@angular/router|#1` ``).
- **@env/environment**: For environment-specific configurations [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|@env/environment|#1` ``).

### Template-Composition Coupling
None.

#### translate

#### Import-based coupling
- **core/locale**: `OSKTranslateService` imports and injects `OSKLocaleService` from `@oskey/locale` to reactively track the active locale `` `imports_dependency|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|@oskey/locale|#1` ``.
- **External Libraries**:
  - `@ngx-translate/core`: Used for core translation capabilities, including `TranslateService` and `TranslateModule` `` `imports_dependency|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|@ngx-translate/core|#1` ``.
  - `@ngx-translate/http-loader`: Used to load translation assets via HTTP `` `imports_dependency|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|@ngx-translate/http-loader|#1` ``.
  - `@angular/common/http`: Used to configure the translation loader with `HttpClient` `` `imports_dependency|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|@angular/common/http|#1` ``.

#### Template-composition coupling
- None.

---

#### types

The types defined in this capability reference other modules and external libraries:

### Import-Based Coupling

#### utils

- **Import-based Coupling**: No outbound imports to other modules or submodules are evidenced in this capability. [Confirmed]
- **Template-composition Coupling**: No template-composition coupling exists as there are no components. [Confirmed]

---

### 9. Internal Structure

The internal structure of the `core` module consists of eight submodules, coupled as follows:
- **`_module_root`**: The public entry point (`index.ts`) of the module [Confirmed]. It receives inbound coupling from `firebase` (importing `OSKHttpsSuccessResponse`) and `guards` (importing `OSKCurrentUserToken`) [Confirmed].
- **`error-handler`**: Provides global error handling [Confirmed]. It has outbound coupling to `translate` (importing `OSKTranslateService`) [Confirmed].
- **`firebase`**: Manages Firebase initialization, authentication, and HTTPS services [Confirmed]. It has outbound coupling to `_module_root` (importing `OSKHttpsSuccessResponse`), `injection-tokens` (importing `OSKCurrentUserToken`), and `types` (importing `OSKUpdateProfileDTO`, `OSKUser`, and `OSKCurrentUser`) [Confirmed].
- **`guards`**: Implements route-level security [Confirmed]. It has outbound coupling to `_module_root` (importing `OSKCurrentUserToken`), `injection-tokens` (importing `OSKCurrentUserToken`), and `types` (importing `OSKCurrentUser`) [Confirmed].
- **`injection-tokens`**: Manages the reactive user session context [Confirmed]. It has outbound coupling to `types` (importing `OSKFirebaseUser`, `OSKCurrentUser`, `OSKUserOrganization`, `OSKUser`, and `OSKUserAccount`) [Confirmed]. It receives inbound coupling from `firebase` and `guards` [Confirmed].
- **`locale`**: Manages localization state [Confirmed]. It receives inbound coupling from `translate` (importing `OSKLocaleService`) [Confirmed].
- **`translate`**: Wraps translation services [Confirmed]. It has outbound coupling to `locale` (importing `OSKLocaleService`) [Confirmed]. It receives inbound coupling from `error-handler` (importing `OSKTranslateService`) [Confirmed].
- **`types`**: Defines static TypeScript types and data structures [Confirmed]. It receives inbound coupling from `firebase`, `guards`, and `injection-tokens` [Confirmed].

### 10. Cross-Module Relationships

The `core` module maintains extensive relationships with other modules in the repository, characterized by heavy inbound consumption and a specific outbound architectural inversion:
- **Outbound Dependencies**:
  - **`features`**: `core` depends on `features` [Confirmed]. This upward dependency occurs in `current-user.token.ts` and `user.type.ts`, which import menu constants, utility functions, and types from `src/app/features/portals/sidemenu/...` (specifically `OSKUserDefaultSidemenu`, `generateUserOrganizationDefaultMenu`, and `OSKSideMenu`) [Confirmed].
- **Inbound Dependencies**:
  - **`components`**: `components` depends on `core` [Confirmed]. Touchpoints in `header.component.ts` import user types (`OSKCurrentUser`, `OSKUserAccount`), the session token (`OSKCurrentUserToken`), and translation pipes (`OSKTranslatePipe`) [Confirmed].
  - **`features`**: `features` depends heavily on `core` [Confirmed], with 228 import touchpoints and extensive method-level call edges [Confirmed].
- **Confirmed Inbound Call Edges**:
  - `features` -> `OSKTranslateService.instant` [Confirmed/Probable] (168 call sites across features, e.g., in message center and property management subfeatures).
  - `features` -> `OSKFirebaseHttpsService.call` [Confirmed] (102 call sites across features, representing the primary data mutation and query pathway).
  - `features` -> `OSKErrorService.showError` [Confirmed] (16 call sites, primarily handling authentication and form submission failures).
  - `features` -> `OSKFirebaseAuthService` [Confirmed] (multiple call sites routing authentication actions like `confirmSignIn`, `getUserByUid`, `resetPassword`, `sendPasswordResetEmail`, `setDoc`, `signInWithCustomToken`, `signInWithEmailAndPassword`, `signOut`, `signUpWithEmailAndPassword`, `signUpWithEmailLink`, `updateProfile`, and `verifyPasswordResetCode`).
  - `features` -> `OSKTranslateService.getTranslations` [Confirmed] (4 call sites, used during building and unit creation forms).

### 11. Permissions & Security

**Cross-cutting risk callouts:**

The `core` module implements the primary route-level security and session role-mapping infrastructure for the application:
- **Role-Gating and Guards**:
  - The `guards` capability enforces route security using candidate permission strings [Confirmed].
  - `adminGuard` checks the permission string `v1.admin` to restrict access to global administrative routes [Confirmed].
  - `OSKUserRoleGuard` automatically enforces the permission string `v1.org.admin` for any route nested under `/organization` [Confirmed].
- **Session Role Mapping**:
  - The `OSKCurrentUserToken` in `injection-tokens` extracts organization-specific roles (`organization.userRoles`) and maps them directly to the active `OSKUserAccount.roles` array [Confirmed].
- **Developer Access Bypass**:
  - `injection-tokens` implements a hardcoded security bypass, checking the authenticated user's email against `emailsToShowSendInvitationsTo` to conditionally display and grant access to the `/invitations/send` route in the side menu [Confirmed].
- **Commented Admin Logic**:
  - Commented-out logic exists in `current-user.token.ts` that previously checked for roles starting with `v1.admin` to dynamically generate an Admin portal account [Inferred].
- **Unattributed Access-Control Signals**:
  - While the guards enforce `v1.admin` and `v1.org.admin`, the exact mechanism mapping these strings to backend-enforced roles is not verified within this module, as no external RBAC roles document is present in the repository [Inferred].

**Per-capability evidence:**

#### _module_root

No guards or permission checks are defined in this capability pack [Confirmed].

---

#### error-handler

No guards or permission checks are defined or referenced within this capability [Confirmed].

---

#### firebase

- No `angular_guard` facts are defined in this capability pack. **Confirmed**
- **App Check**: Configures App Check with ReCaptcha Enterprise and sets up a debug token if configured in the environment. **Confirmed** (evidenced by `hosting/web-app/src/app/core/firebase/providers/firebase.provider.ts` (lines 37-42)).
- **Account Creation Restrictions**: Restricts account creation based on email domains for specific restricted project IDs. **Confirmed** (evidenced by `hosting/web-app/src/app/core/firebase/constants/account-create-restrictions.constant.ts` (lines 47-52)).

#### guards

This capability is the primary implementation of route security in the application. It references and enforces the following versioned permission strings [Confirmed]:
- **v1.admin** `` `permission_candidate|core|hosting/web-app/src/app/core/guards/admin.guard.ts|v1.admin|#1` ``: Checked by `adminGuard` to verify global administrator status.
- **v1.org.admin** `` `permission_candidate|core|hosting/web-app/src/app/core/guards/user-role/user-role.guard.ts|v1.org.admin|#1` ``: Automatically required/checked by `OSKUserRoleGuard` for any route under `/organization`.

---

#### injection-tokens

- **Role Mapping**: The capability extracts organization-specific roles (`organization.userRoles`) and maps them directly to the constructed user accounts. [Confirmed] (`` `hosting/web-app/src/app/core/injection-tokens/current-user.token.ts` (line 220) ``)
- **Admin Role Logic (Commented Out)**: There is commented-out logic indicating a planned or previously used check for admin roles starting with `v1.admin` to generate an Admin portal account. [Inferred] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|collectionData(userOrganizationsDocRef)                     .pipe(takeUntil(unsubscribeSubject))                     .subscribe|anon|{ ... }|#1` ``)
- **Developer Access Bypass**: It checks the user's email against `emailsToShowSendInvitationsTo` to conditionally grant access to the `/invitations/send` route in the side menu. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|emailsToShowSendInvitationsTo.includes|anon|user.email|#1` ``)

---

#### locale

No guards or permission checks are defined or referenced within this capability.

---

#### title-strategy

No guards or permission checks are implemented within this capability [Confirmed].

#### translate

No guards or permission checks are evidenced in this capability. [Confirmed]

---

#### types

While this capability does not implement security guards or active checks, it defines the data structures that represent roles and permissions across the application:
- **OSKAssignedRole**: Models an assigned role, tracking `roleId`, `assignedOn`, and `assignedBy` (`` `type_alias|core|hosting/web-app/src/app/core/types/user/roles/assigned-role.type.ts|OSKAssignedRole|#1` ``, `` `model_property|core|hosting/web-app/src/app/core/types/user/roles/assigned-role.type.ts|OSKAssignedRole|roleId|#1` ``).
- **OSKUserOrganization**: Associates a user with an organization and lists their roles (`userRoles`) (`` `model_property|core|hosting/web-app/src/app/core/types/user/user-organization.type.ts|OSKUserOrganization|userRoles|#1` ``).
- **OSKUserAccount**: Contains an array of roles assigned to the specific account (`` `model_property|core|hosting/web-app/src/app/core/types/user/user.type.ts|OSKUserAccount|roles|#1` ``).
- **OSKAccessRight**: Models physical access permissions, supporting permanent, recurrent, or one-time validity (`` `type_alias|core|hosting/web-app/src/app/core/types/access/access-rights.type.ts|OSKAccessRight|#1` ``).

---

#### utils

No guards, authorization checks, or permission strings are defined or referenced within this capability. [Confirmed]

---

### 12. External Hooks

#### _module_root

No external SDKs, translation hooks, or third-party integrations are directly referenced in this capability pack [Confirmed].

---

#### error-handler

- **Angular Material SnackBar**: `OSKErrorService` injects and calls `MatSnackBar` to display error notifications [Confirmed; `call_expression|core|hosting/web-app/src/app/core/error-handler/error.service.ts|inject|anon|MatSnackBar|#1`, `call_expression|core|hosting/web-app/src/app/core/error-handler/error.service.ts|this.snackBar.open|showError|this.translate.instant(msg),'OK',{       horizontalPosition: 'center',       verticalPosition: 'top'     }|#1`].
- **Angular Core (`NgZone`)**: `OSKGlobalErrorHandler` injects `NgZone` to ensure error handling and UI notifications run inside or outside the Angular zone as appropriate [Confirmed; `call_expression|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|inject|anon|NgZone|#1`].
- **Environment Configuration**: `OSKGlobalErrorHandler` imports `@env/environment` [Confirmed; `imports_dependency|core|hosting/web-app/src/app/core/error-handler/global-error.handler.ts|@env/environment|#1`].

---

#### firebase

- **Firebase SDK**: Extensively hooks into `@angular/fire/app`, `@angular/fire/app-check`, `@angular/fire/auth`, `@angular/fire/firestore`, `@angular/fire/functions`, and `@angular/fire/storage`. **Confirmed** (evidenced by `hosting/web-app/src/app/core/firebase/providers/firebase.provider.ts` (lines 15-26)).
- **Cookie Service**: Hooks into `ngx-cookie-service` to store and delete `'emailForSignIn'` during email link sign-in flows. **Confirmed** (cited via `` `imports_dependency|core|hosting/web-app/src/app/core/firebase/services/auth/firebase-auth.service.ts|ngx-cookie-service|#1` ``).

#### guards

The guards interact with the following external libraries and frameworks [Confirmed]:
- **@angular/router**: Uses `Router` and `parseUrl` to handle redirection when access is denied `` `call_expression|core|hosting/web-app/src/app/core/guards/admin.guard.ts|inject|anon|Router|#1` ``.
- **rxjs**: Uses RxJS operators (`skipWhile`, `take`, `map`, `finalize`) in `OSKLoggedInGuard` to manage the asynchronous stream of authentication status `` `call_expression|core|hosting/web-app/src/app/core/guards/logged-in/logged-in.guard.ts|authStatus.pipe|anon|skipWhile((user: OSKCurrentUser) => user.isOskVerified === undefined),take(1),map((user) => {       return user.firebaseUser && user.isOskVerified && user.oskUser ? true : router.parseUrl('/');     }),finalize(() => watcher.destroy())|#1` ``.

---

#### injection-tokens

This capability integrates heavily with the following external SDKs and libraries:
- **Angular Fire Auth**: Uses `Auth` and the `user` observable to stream authentication state. [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|inject|anon|Auth|#1` ``)
- **Angular Fire Firestore**: Uses `Firestore`, `doc`, `collection`, `collectionData`, and `onSnapshot` to establish real-time database synchronization. [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|@angular/fire/firestore|#1` ``)
- **RxJS**: Uses `takeUntil`, `filter`, and `map` operators to manage stream lifecycles and transformations. [Confirmed] (`` `imports_dependency|core|hosting/web-app/src/app/core/injection-tokens/current-user.token.ts|rxjs|#1` ``)

---

#### locale

- **`@ngx-translate/core` (TranslateService)**: Integrated to handle translation language updates when the locale changes. [Confirmed] (Cite: `` `call_expression|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|this.translate.use|setLocale|localeId|#1` ``)
- **`@angular/common` (registerLocaleData)**: Hooked into to register localized formatting rules dynamically. [Confirmed] (Cite: `` `call_expression|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|registerLocaleData|registerLocale|localeFr|#1` ``)

---

#### title-strategy

- **Angular Platform-Browser Services**: Interacts directly with the browser DOM via Angular's `Title` and `Meta` services to update document metadata [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.title.setTitle|setTitle|newTitle|#1` ``, `` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setTitle|{       name: 'title',       content: newTitle     }|#1` ``).

#### translate

- **@ngx-translate/core**: Integrates with `TranslateService` to perform translations `` `call_expression|core|hosting/web-app/src/app/core/translate/services/translate.service.ts|inject|anon|TranslateService|#1` `` and `TranslateModule` for initialization `` `call_expression|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|TranslateModule.forRoot|anon|{     loader: {       provide: TranslateLoader,       useFactory: createTranslateLoader,       deps: [HttpClient]     },     defaultLanguage: environment.defaultLocale   }|#1` ``.
- **@ngx-translate/http-loader**: Imported in `translateAndHttp.provider.ts` to load translation files `` `imports_dependency|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|@ngx-translate/http-loader|#1` ``.
- **@angular/common/http**: Uses `HttpClient` to fetch translation JSON assets `` `imports_dependency|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|@angular/common/http|#1` ``.

---

#### types

This capability integrates with external SDK types:
- **Firebase Auth SDK**: Integrates with `@angular/fire/auth` to type-bind the local `OSKCurrentUser` with the underlying Firebase auth state (`` `hosting/web-app/src/app/core/types/user/current-user.type.ts` (line 14) ``).
- **Firebase Firestore SDK**: Integrates with `@angular/fire/firestore` to type-bind IoT device and building door documents (`` `hosting/web-app/src/app/core/types/building/building-door.type.ts` (line 1) ``).

---

#### utils

- **JavaScript Standard Library**: Interacts directly with standard JavaScript `Date` prototype methods, including `getTimezoneOffset` `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|date.getTimezoneOffset|removeTimezoneOffset||#1` ``, `valueOf` `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|date.valueOf|removeTimezoneOffset||#1` ``, and `toISOString` `` `call_expression|core|hosting/web-app/src/app/core/utils/date.utils.ts|new Date(date.valueOf() - tzoffset).toISOString|getISOStringWithoutTimezoneIndicator||#1` ``. [Confirmed]
- No external SDKs (such as Firebase SDK or `@ngx-translate`) are used. [Confirmed]

---

### 13. Architectural Observations

- **Architectural Inversion (Upward Coupling)**: The import of sidemenu constants and types from `features` into `core` (`current-user.token.ts` and `user.type.ts`) represents a significant architectural risk [Confirmed]. It violates clean architecture principles by coupling the core user session context directly to a specific presentation-layer feature [Inferred].
- **Centralized Integration Engine**: The `core` module acts as a highly centralized engine [Confirmed]. The massive inbound coupling from `features` (228 touchpoints, 290+ method calls) indicates that any change to `core` services (especially `OSKFirebaseHttpsService` or `OSKTranslateService`) has a wide blast radius across the entire application [Inferred].
- **Reactive Context Aggregation**: The design of `OSKCurrentUserToken` is highly sophisticated, successfully bridging asynchronous Firebase Auth streams, Firestore document subscriptions, and router navigation events into a single, synchronous, read-only computed signal context [Confirmed].
- **App Check Security**: The initialization of Firebase App Check with ReCaptcha Enterprise in `firebase.provider.ts` indicates a robust approach to securing backend callable functions against abuse [Confirmed].

### 14. Risks & Open Questions

**Cross-cutting risks:**

- **Circular Dependency and Layer Violation**: The upward dependency from `core` to `features/portals/sidemenu` introduces a circular dependency risk [Confirmed]. If the sidemenu feature is refactored or removed, it will break the core user session initialization [Inferred].
- **Hardcoded Security Bypass**: Gating the `/invitations/send` route using a hardcoded email array (`emailsToShowSendInvitationsTo`) in `current-user.token.ts` bypasses standard RBAC controls, creating a maintenance overhead and potential security risk if developer emails are modified or leaked [Confirmed].
- **Ambiguous Global Error Handler Registration**: The evidence does not show where `OSKGlobalErrorHandler` is registered in the application's bootstrap providers [Inferred]. If it is not correctly bound to Angular's `ErrorHandler` token, unhandled runtime exceptions may fail to be intercepted globally [Unknown].
- **Dormant Admin Portal Logic**: The commented-out `v1.admin` check and Admin portal account generation in `current-user.token.ts` leaves the status of global admin portal access ambiguous and suggests incomplete feature integration [Inferred].
- **Domain Restriction Validation**: It is unknown whether the email domain restrictions defined in `account-create-restrictions.constant.ts` are mirrored by Firestore security rules or backend validations, posing a risk of bypass if enforced solely on the client side [Inferred].

**Per-capability open questions:**

#### _module_root

- **Implementation Details**: The actual implementation details of the exported services (`ErrorService`, `GlobalErrorHandler`), tokens, and types are not present in this capability pack, as they reside in their respective submodules which are not part of this evidence pack [Confirmed].

#### error-handler

- **Global Registration**: The evidence does not show where `OSKGlobalErrorHandler` is registered in the application's bootstrap providers (e.g., `{ provide: ErrorHandler, useClass: OSKGlobalErrorHandler }`) [Inferred].
- **Error Handling Logic**: The exact implementation details of how `OSKGlobalErrorHandler` intercepts and processes errors (e.g., logging to an external service or console) are not fully detailed in the provided facts [Inferred].

#### firebase

- Are there any specific Firestore security rules or backend validations corresponding to the domain restrictions defined in `account-create-restrictions.constant.ts`? **Inferred**
- How is the `OSKCurrentUserToken` injection token populated and managed relative to the Firebase Auth state? **Inferred**

#### guards

- How are these guards registered and applied across the application's routing configuration (since no routing files are included in this capability pack)? [Inferred]
- What is the exact structure of the `OSKCurrentUser` object returned by `OSKCurrentUserToken`? [Inferred]

#### injection-tokens

- **Injection Token Name**: The exact name of the exported `InjectionToken` is not explicitly declared in the evidence pack, although it is housed in `current-user.token.ts`.
- **Developer Email List**: Where is the `emailsToShowSendInvitationsTo` array defined, and how is it populated?
- **Commented Admin Logic**: Why is the `v1.admin` role check and the corresponding Admin portal account generation commented out in the current implementation?

#### locale

- Are there other locales besides French (`fr`) that are dynamically registered? The evidence explicitly references importing and registering `localeFr` (Cite: `` `imports_dependency|core|hosting/web-app/src/app/core/locale/services/locale.service.ts|@angular/common/locales/fr|#1` ``), but does not show imports for other languages.
- How is the custom `OSKLocaleId` provider wired into the Angular dependency injection system (e.g., is it bound to the standard `LOCALE_ID` token in an application-wide config)?

#### title-strategy

- **Base Class Extension**: The class invokes `super()` [Confirmed] (`` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|super|anon||#1` ``), which strongly implies it extends Angular's standard `TitleStrategy` [Inferred], but the exact base class name is not explicitly captured in the class declaration metadata [Unknown] (`` `source_class|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|OSKTitleStrategy` ``).
- **Default Description Source**: The source and value of `this.defaultDescription` are not fully detailed in the evidence [Unknown] (`` `call_expression|core|hosting/web-app/src/app/core/title-strategy/title-strategy.provider.ts|this.meta.updateTag|setDescription|{         name: 'description',         content: this.defaultDescription       }|#1` ``).

#### translate

- The exact implementation details of `createTranslateLoader` are not fully visible in the evidence pack, although it is declared as a function in `translateAndHttp.provider.ts` `` `function_declaration|core|hosting/web-app/src/app/core/translate/providers/translateAndHttp.provider.ts|createTranslateLoader|#1` ``. [Inferred]

#### types

- **Upward Dependency**: Why does a core type file (`user.type.ts`) import a type from a feature portal submodule (`src/app/features/portals/sidemenu/types/side-menus.type`)? This violates clean architecture principles by introducing an upward dependency from `core` to `features`.
- **Missing Grounding Documents**: There are no schema or RBAC grounding documents available in this run to verify if the defined roles (e.g., `roleId` in `OSKAssignedRole`) match backend-enforced roles.

#### utils

- Are there other utility files (e.g., string manipulation, math, array helpers) planned for this capability, or is it strictly limited to date utilities? [Inferred]

### 15. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, and 12) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.