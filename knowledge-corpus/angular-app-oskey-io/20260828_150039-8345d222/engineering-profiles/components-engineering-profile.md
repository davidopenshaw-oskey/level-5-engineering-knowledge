### 0. Generation Metadata

- **runId**: `20260828_150039-8345d222`
- **generatedAt**: `2026-08-29T06:43:59.952Z`
- **repoName**: `angular-app-oskey-io`
- **targetModule**: `components`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `components` module serves as the shared presentational and layout foundation for the application. It encapsulates global, reusable UI elements and utility interfaces that are independent of core business feature workflows. Specifically, the module provides the main application navigation and session header (`OSKHeaderComponent`), the standard application footer (`OSKFooterComponent`), and a self-contained cookie consent management banner and service (`OSKCookieConsentBannerComponent` and `OSKCookieConsentService`). **Confirmed**.

### 2. Architectural Position

The `components` module occupies a shared presentation layer within the application architecture, positioned alongside the `core` and `features` modules. It provides global layout components and utility interfaces consumed by feature pages.
- **Parent Scope**: Root application layout.
- **Owned Concepts**: Global header navigation, global footer layout, and browser-level cookie consent state.
- **Dependencies**: It depends outbound on the `core` module for user session tokens and types, and on the `features` module for authentication actions (specifically signing out). It is consumed inbound by the `features` module to render the global header on feature pages. **Confirmed**.

### 3. Primary Responsibilities

#### cookie-consent

- **Displaying Cookie Consent Banner**: Displays a bottom-left modal banner (`OSKCookieConsentBannerComponent`) to prompt users for cookie preferences [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._modalService       .open|showBanner|OSKCookieConsentBannerComponent,{         backdrop: 'static',         animation: true,         modalDialogClass: 'modal-dialog-bottom-left',         size: 'lg',         injector: Injector.create({           providers: [             {               provide: OSKCookieConsent,               useValue: cookieConsent             }           ],           parent: this._injector         })       }|#1` ``].
- **Managing Consent State**: Captures user preferences for strictly necessary, performance, and targeting cookies via a reactive form [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|this._formBuilder.group|anon|{       // consentToStricklyNecessaryCookies: new UntypedFormControl(true, [Validators.requiredTrue]),       // consentToPerformanceCookies: new UntypedFormControl(this._coockieConsent.consentToPerformanceCookies),       // consentToTargetingCookies: new UntypedFormControl(this._coockieConsent.consentToTargetingCookies),       consentToStricklyNecessaryCookies: new UntypedFormControl(true, [Validators.requiredTrue]),       consentToPerformanceCookies: new UntypedFormControl(false),       consentToTargetingCookies: new UntypedFormControl(false)     }|#1` ``].
- **Persisting Consent**: Saves the user's consent choices as a JSON-serialized string in a browser cookie named `'cookie_consent'` with a 30-day expiration [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._cookieService.set|_update|'cookie_consent',JSON.stringify(cookieConsent),30|#1` ``].
- **Applying Consent & Reloading**: Applies the loaded or updated consent settings and triggers a page reload to ensure the changes take effect [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|window.location.reload|_apply||#1` ``].

---

#### footer

- **Footer Layout Rendering**: Renders the visual footer structure using a dedicated template and stylesheet (**Confirmed**; `` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|Component|anon|{   selector: 'osk-footer',   templateUrl: './footer.component.html',   styleUrls: ['./footer.component.scss'],   standalone: true,   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``).
- **Dynamic Year Calculation**: Programmatically retrieves the current calendar year, typically utilized for dynamic copyright notices (**Confirmed**; `` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|new Date().getFullYear|anon||#1` ``).

#### header

- **User Session Tracking**: Monitors the currently logged-in user using an injected token and logs user state changes within a reactive effect. [Confirmed] (via `` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|inject|anon|OSKCurrentUserToken|#1` `` and `` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|effect|anon|() => {       const u = this.currentUser();       console.log('USER', u);     }|#1` ``)
- **Account Management**: Holds local state for the user's accounts and the currently selected account. [Confirmed] (via `` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|accounts` `` and `` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|selectedAccount` ``)
- **Navigation & URL Tracking**: Subscribes to Angular Router events to track and store the active URL path. [Confirmed] (via `` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|this.router.events.pipe(takeUntilDestroyed()).subscribe|anon|(event) => {       if (this.initialNavigation && event instanceof NavigationStart) {         this.currentUrl.set(event.url);         this.initialNavigation = false;       }       if (event instanceof NavigationEnd) {         this.currentUrl.set(event.urlAfterRedirects);       }     }|#1` ``)
- **Session Termination**: Provides a sign-out method that calls the authentication service and redirects the user to the root path. [Confirmed] (via `` `class_method|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|signOut|#1` ``)

---

### 4. Public Interfaces (Components & Services)

#### cookie-consent

- **Components**:
  - `OSKCookieConsentBannerComponent` (selector: `osk-cookie-consent-banner`): A standalone component that renders the cookie consent form and handles user submission and closure [Confirmed; `` `angular_component|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|OSKCookieConsentBannerComponent` ``, `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|Component|anon|{   selector: 'osk-cookie-consent-banner',   templateUrl: './cookie_consent_banner.component.html',   styleUrls: ['./cookie_consent_banner.component.scss'],   standalone: true,   imports: [ReactiveFormsModule, NgClass] }|#1` ``].
- **Services / Injectables**:
  - `OSKCookieConsentService` (providedIn: `'root'`): Manages the lifecycle of cookie consent, including loading from cookies, showing the banner modal, updating preferences, and applying changes [Confirmed; `` `angular_injectable|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|OSKCookieConsentService` ``, `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``].
  - `OSKCookieConsent`: An injectable model class used to represent and inject the current cookie consent state into the banner component [Confirmed; `` `angular_injectable|components|hosting/web-app/src/app/components/cookie-consent/models/cookie_consent.model.ts|OSKCookieConsent` ``, `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|Injector.create|showBanner|{           providers: [             {               provide: OSKCookieConsent,               useValue: cookieConsent             }           ],           parent: this._injector         }|#1` ``].

---

#### footer

- **OSKFooterComponent** (**Confirmed**; `` `angular_component|components|hosting/web-app/src/app/components/footer/footer.component.ts|OSKFooterComponent` ``)
  - **Selector**: `osk-footer`
  - **Standalone**: `true`
  - **Change Detection**: `ChangeDetectionStrategy.OnPush`
  - **File**: `hosting/web-app/src/app/components/footer/footer.component.ts` (line 16)
  - **Evidence**: `` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|Component|anon|{   selector: 'osk-footer',   templateUrl: './footer.component.html',   styleUrls: ['./footer.component.scss'],   standalone: true,   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``

No injectable services are declared or exposed by this capability.

#### header

- **`OSKHeaderComponent`** [Confirmed] (via `` `angular_component|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent` ``)
  - **Selector**: `osk-header` [Confirmed] (via `` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|Component|anon|{   selector: 'osk-header',   standalone: true,   imports: [RouterModule, MatIconModule, MatButtonModule, OSKTranslatePipe, MatMenuModule, NgClass],   templateUrl: './header.component.html',   styleUrl: './header.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)
  - **File**: `hosting/web-app/src/app/components/header/header.component.ts`
  - **Type**: Standalone Component with `OnPush` change detection.

---

### 5. UI Composition

#### cookie-consent

The `OSKCookieConsentBannerComponent` uses a template file `cookie_consent_banner.component.html` [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|Component|anon|{   selector: 'osk-cookie-consent-banner',   templateUrl: './cookie_consent_banner.component.html',...}|#1` ``] with the following bindings:
- **Form Group Binding**: Binds a form group to a `<form>` element [Confirmed; `` `angular_template_binding|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.html|OSKCookieConsentBannerComponent|formGroup|#1` ``].
- **Class Binding**: Binds dynamic classes to an `<input>` element [Confirmed; `` `angular_template_binding|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.html|OSKCookieConsentBannerComponent|ngClass|#1` ``].
- **Click Event Handlers**: Binds click event handlers to two buttons, which likely trigger the `close()` method or submit the consent form [Confirmed; `` `angular_template_binding|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.html|OSKCookieConsentBannerComponent|click|#1` ``, `` `angular_template_binding|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.html|OSKCookieConsentBannerComponent|click|#2` ``].

---

#### footer

- **Template & Styling**: The component delegates its UI layout to `./footer.component.html` and its styling to `./footer.component.scss` (**Confirmed**; `` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|Component|anon|{   selector: 'osk-footer',   templateUrl: './footer.component.html',   styleUrls: ['./footer.component.scss'],   standalone: true,   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``).
- **Bindings & Composition**: No specific child components, template bindings, or input/output properties are evidenced in the capability pack (**Unknown**).

#### header

The `OSKHeaderComponent` template composes several Angular Material components and binds to local state and router directives:
- **Material Components**:
  - `mat-icon` is used multiple times to render icons. [Confirmed] (via `` `angular_template_composition|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|mat-icon|#1` ``)
  - `mat-menu` is used to display a dropdown menu. [Confirmed] (via `` `angular_template_composition|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|mat-menu|#1` ``)
- **Template Bindings**:
  - `routerLink` is bound on an anchor element (line 19) and buttons (lines 72, 101) to handle navigation. [Confirmed] (via `` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|routerLink|#1` ``)
  - `matMenuTriggerFor` is bound on a `div` (line 58) to trigger the menu. [Confirmed] (via `` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|matMenuTriggerFor|#1` ``)
  - `color` is bound as an input on a `mat-icon` (line 73). [Confirmed] (via `` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|color|#1` ``)
  - `text-primary` is bound as an input/class on a `span` (line 81). [Confirmed] (via `` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|text-primary|#1` ``)
  - `click` output event on a button (line 90) triggers local actions. [Confirmed] (via `` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|click|#1` ``)

---

### 6. API Contracts & Routes

#### cookie-consent

- **Backend calls**: None. No `firebase_callable_call` facts are present in this capability pack [Confirmed].
- **Routes**: None. No `angular_route` facts are present in this capability pack [Confirmed].

---

#### footer

- **Backend Calls**: None evidenced (**Unknown**).
- **Routes**: None evidenced (**Unknown**).

#### header

- **Backend Calls**: None. No direct Firebase callable functions or backend API calls are made from this capability.
- **Routes**: No routes are defined or owned by this capability.

---

### 7. State Ownership

**Ownership conclusion:**

State ownership within the `components` module is strictly isolated to individual capabilities. There is no shared state, shared signals, or cross-capability state synchronization within this module. Local reactive state is confined to:
- In-memory cookie consent configuration and form state within the `cookie-consent` capability.
- User session, active URL, and account selection signals within the `header` capability. **Confirmed**.

**Per-capability evidence:**

#### cookie-consent

- No `angular_signal` facts are present in this capability pack [Confirmed].
- **In-Memory State**: The capability manages the cookie consent state in-memory via the `OSKCookieConsent` model [Confirmed; `` `angular_injectable|components|hosting/web-app/src/app/components/cookie-consent/models/cookie_consent.model.ts|OSKCookieConsent` ``] and the reactive form `cookieConsentForm` within `OSKCookieConsentBannerComponent` [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|this.cookieConsentForm.disable|anon||#1` ``].

---

#### footer

No local reactive state or Angular signals are evidenced within this capability (**Unknown**).

#### header

The capability manages the following local reactive state via Angular Signals:
- **`selectedAccount`**: A signal holding the currently selected account, initialized to `undefined`. [Confirmed] (via `` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|selectedAccount` ``)
- **`accounts`**: A signal holding an array of accounts, initialized to an empty array `[]`. [Confirmed] (via `` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|accounts` ``)
- **`currentUrl`**: A signal holding the active URL string, initialized to `'/'`. [Confirmed] (via `` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|currentUrl` ``)

---

### 8. Outbound Coupling

#### cookie-consent

- **Import-based coupling**:
  - Couples to `@ng-bootstrap/ng-bootstrap` for modal management (`NgbModal` or similar, referenced as `_modalService`) [Confirmed; `` `imports_dependency|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|@ng-bootstrap/ng-bootstrap|#1` ``, `` `imports_dependency|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|@ng-bootstrap/ng-bootstrap|#1` ``].
  - Couples to `ngx-cookie-service` for reading and writing cookies [Confirmed; `` `imports_dependency|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|ngx-cookie-service|#1` ``].
  - Couples to `@angular/forms` for reactive form controls [Confirmed; `` `imports_dependency|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|@angular/forms|#1` ``].
- **Template-composition coupling**:
  - No template-composition coupling to other custom components is evidenced in this pack. The banner component is standalone and only imports `ReactiveFormsModule` and `NgClass` [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|Component|anon|{   selector: 'osk-cookie-consent-banner',   templateUrl: './cookie_consent_banner.component.html',   styleUrls: ['./cookie_consent_banner.component.scss'],   standalone: true,   imports: [ReactiveFormsModule, NgClass] }|#1` ``].

---

#### footer

- **Import-Based Coupling**:
  - `@angular/core`: Imported to resolve the `Component` decorator and change detection strategies (**Confirmed**; `` `imports_dependency|components|hosting/web-app/src/app/components/footer/footer.component.ts|@angular/core|#1` ``).
- **Template-Composition Coupling**: None evidenced (**Unknown**).

#### header

The `header` capability couples to other modules and submodules as follows:

#### Import-Based Coupling
- **`features` Module (`authentication` Submodule)**: Imports `OSKAuthService` to handle user sign-out. [Confirmed] (via `` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|../../features/authentication/services/auth.service|#1` ``)
- **`core` Module**: Imports from `@oskey/core`. [Confirmed] (via `` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|@oskey/core|#1` ``)
- **`core` Module (`types` Submodule)**: Imports types from `@oskey/core/types`. [Confirmed] (via `` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|@oskey/core/types|#1` ``)
- **`core` Module (`translate` Submodule)**: Imports translation utilities from `@oskey/translate`. [Confirmed] (via `` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|@oskey/translate|#1` ``)

#### Template-Composition Coupling
- No template-composition coupling to other custom application components is evidenced (only standard Angular Material components are composed).

---

### 9. Internal Structure

Based on the deterministic Intra-Module Coupling Graph, the `components` module contains no submodules and exhibits zero internal coupling between its capabilities.
- **Submodule Count**: 0
- **Internal Coupling**: None. The `cookie-consent`, `footer`, and `header` capabilities operate as completely independent, decoupled units with no shared internal code dependencies. **Confirmed**.

### 10. Cross-Module Relationships

Based on the deterministic Cross-Module Dependency Graph and confirmed call edges, the module maintains the following relationships:

#### Outbound Dependencies
- **`core`**: **Confirmed**. 
  - `hosting/web-app/src/app/components/header/header.component.ts` imports `OSKCurrentUser` and `OSKUserAccount` from `@oskey/core/types`.
  - `hosting/web-app/src/app/components/header/header.component.ts` imports `OSKCurrentUserToken` from `@oskey/core`.
  - `hosting/web-app/src/app/components/header/header.component.ts` imports `OSKTranslatePipe` from `@oskey/translate`.
- **`features`**: **Confirmed**.
  - `hosting/web-app/src/app/components/header/header.component.ts` imports `OSKAuthService` from `../../features/authentication/services/auth.service`.

#### Inbound Dependencies
- **`features`**: **Confirmed**.
  - `hosting/web-app/src/app/features/home/home.component.ts` imports `OSKHeaderComponent` from `src/app/components/header/header.component`.

#### Confirmed Call Edges
- **Outbound Calls**: **Confirmed**.
  - `OSKHeaderComponent` (`hosting/web-app/src/app/components/header/header.component.ts`, line 77) calls `OSKAuthService.signOut` (`hosting/web-app/src/app/features/authentication/services/auth.service.ts`, line 226).
- **Inbound Calls**: None. **Confirmed**.

### 11. Permissions & Security

**Cross-cutting risk callouts:**

The `components` module does not define or enforce any route guards, role-gating, or explicit permission checks internally.
- **Role-Gating Tally**: 0 checks.
- **Security Context**: Security interaction is strictly limited to consuming the current user session context. `OSKHeaderComponent` injects `OSKCurrentUserToken` to read session data for display and account switching, but does not execute any authorization checks or restrict visibility based on roles within the evidenced code. **Confirmed**.

**Per-capability evidence:**

#### cookie-consent

- No `angular_guard` facts or permission strings are evidenced in this capability pack [Confirmed].

---

#### footer

No guards or permission checks are evidenced within this capability (**Unknown**).

#### header

- No route guards or explicit permission/role checks are defined within this capability.
- The component injects `OSKCurrentUserToken` to access the current user session context. [Confirmed] (via `` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|inject|anon|OSKCurrentUserToken|#1` ``)

---

### 12. External Hooks

#### cookie-consent

- **ngx-cookie-service**: Used to check, get, and set the `'cookie_consent'` cookie [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._cookieService.check|_load|'cookie_consent'|#1` ``, `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._cookieService.get|_load|'cookie_consent'|#1` ``, `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._cookieService.set|_update|'cookie_consent',JSON.stringify(cookieConsent),30|#1` ``].
- **@ng-bootstrap/ng-bootstrap**: Used to open the banner as a bottom-left modal dialog [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._modalService       .open|showBanner|OSKCookieConsentBannerComponent,{         backdrop: 'static',         animation: true,         modalDialogClass: 'modal-dialog-bottom-left',         size: 'lg',         injector: Injector.create({           providers: [             {               provide: OSKCookieConsent,               useValue: cookieConsent             }           ],           parent: this._injector         })       }|#1` ``].
- **Browser Window API**: Uses `window.location.reload()` to apply cookie consent changes [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|window.location.reload|_apply||#1` ``].

---

#### footer

- **Native JavaScript Date API**: The component invokes `new Date().getFullYear()` to dynamically resolve the current year (**Confirmed**; `` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|new Date().getFullYear|anon||#1` ``).

#### header

- **Angular Material SDK**: Uses `@angular/material/button`, `@angular/material/icon`, and `@angular/material/menu`. [Confirmed] (via `` `hosting/web-app/src/app/components/header/header.component.ts` (lines 24-25, 30) ``)
- **Translation**: Uses `OSKTranslatePipe` from `@oskey/translate` for UI localization. [Confirmed] (via `` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|Component|anon|{   selector: 'osk-header',   standalone: true,   imports: [RouterModule, MatIconModule, MatButtonModule, OSKTranslatePipe, MatMenuModule, NgClass],...}|#1` ``)

---

### 13. Architectural Observations

- **High Internal Isolation**: The module's capabilities are completely decoupled from one another. There are no shared services, models, or utility functions within the module, ensuring that changes to the footer, header, or cookie consent banner cannot cause side effects in sibling components. **Confirmed**.
- **Unidirectional Cross-Module Flow with One Exception**: Outbound coupling is highly isolated. Only the `header` capability couples to external modules (`core` and `features`), while `footer` and `cookie-consent` remain entirely self-contained with no outbound cross-module dependencies. **Confirmed**.
- **Performance-Conscious Change Detection**: The `OSKFooterComponent` explicitly utilizes `ChangeDetectionStrategy.OnPush`, indicating an architectural pattern of optimizing rendering performance for static or purely input-driven layout components. **Confirmed**.

### 14. Risks & Open Questions

**Cross-cutting risks:**

- **Bidirectional Cross-Module Coupling**: There is a bidirectional dependency pattern between the `components` and `features` modules. `components` (via `OSKHeaderComponent`) imports and calls `OSKAuthService` from `features`, while `features` (via `home.component.ts`) imports and renders `OSKHeaderComponent` from `components`. This tight coupling across module boundaries poses a risk of circular dependency issues during build or refactoring. **Inferred**.
- **Undocumented State Population**: The `OSKHeaderComponent` exposes an `accounts` signal, but there is no evidence within the capability of how this signal is populated or where its data originates. This leaves the data-binding flow for account switching partially opaque. **Inferred**.
- **Coarse-Grained Consent Application**: The `OSKCookieConsentService` triggers a full page reload (`window.location.reload`) to apply cookie preferences. It is an open question whether other modules reactively consume the consent state, or if they rely entirely on the page reload to re-evaluate cookies on application initialization. **Inferred**.

**Per-capability open questions:**

#### cookie-consent

- What specific logic does `_apply()` execute besides reloading the page? The evidence shows `window.location.reload` is called inside `_apply`, but any other side effects (such as disabling/enabling specific tracking scripts) are not fully detailed in the provided facts [Inferred; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|window.location.reload|_apply||#1` ``].
- Are there other parts of the application that inject `OSKCookieConsent` or subscribe to consent changes directly, or is the page reload the sole mechanism for applying consent [Inferred]?

#### footer

- **Template Content**: The exact HTML structure and elements defined inside `./footer.component.html` are not visible in the current evidence pack.
- **Style Definitions**: The specific CSS/SCSS rules defined inside `./footer.component.scss` are not visible in the current evidence pack.
- **Year Binding**: It is inferred, but not explicitly confirmed by the code structure facts, how the resolved year from `new Date().getFullYear()` is bound or exposed to the template.

#### header

- What is the exact structure of the user object provided by `OSKCurrentUserToken`?
- How is the `accounts` signal populated? There is no evidence of an API call or service interaction within this capability that writes to the `accounts` signal.
- What is the exact purpose of the `text-primary` input/binding on the `span` element in the template?

### 15. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, and 12) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.